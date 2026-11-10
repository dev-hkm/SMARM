import { getSessionUserId } from "../lib/auth";
import { json, readJson } from "../lib/http";
import { getExaKeys, getOpenAiKey } from "../lib/secrets";
import { getOpenAiModels } from "../lib/ai";
import type { Env } from "../lib/env";

const EXA_ENDPOINT = "https://api.exa.ai/search";
const OPENAI_ENDPOINT = "https://api.openai.com/v1/chat/completions";
const PAGE_TIMEOUT_MS = 8_000;
const MAX_IMAGES = 10;
const MAX_CANDIDATES = 18;
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36 SMARM/1.0";

const BAD_IMAGE_MARKERS = [
  "logo",
  "icon",
  "favicon",
  "badge",
  "sprite",
  "avatar",
  "thumb",
  "profile",
  "default",
  ".svg",
  "button",
  "qr",
  "header",
  "footer",
  "loading",
  "spinner",
  "pixel",
  "tracking",
  "placeholder",
  "noimage",
  "transparent",
  "blank",
  "spacer",
  "removebg",
  "partner",
  "doi-tac",
  "banner",
  "poster",
  "template",
  "so-do",
  "su-kien",
  "thong-bao",
  "thongbao",
  "quyet-dinh",
  "qd-",
  "kiem-ke",
  "sars",
  "covid",
  "van-ban",
  "cong-van",
  "ke-hoach",
  "giay-moi",
  "hoi-thao",
  "lich-thi",
];

const BAD_PATH_MARKERS = ["/themes/", "/theme/", "/plugins/", "/wp-includes/", "/assets/img/icon"];

const CAMPUS_PAGE_HINTS = [
  "gioi-thieu",
  "gioi-thieu-chung",
  "co-so",
  "co-so-vat-chat",
  "khuon-vien",
  "campus",
  "sinh-vien",
  "hinh-anh",
  "thu-vien-anh",
  "thu-vien",
  "about",
  "facilit",
  "campus-tour",
  "phong-co-so",
  "ky-tuc-xa",
];

type RewriterElement = {
  getAttribute(name: string): string | null;
};

type RewriterInstance = {
  on(selector: string, handlers: { element(element: RewriterElement): void }): RewriterInstance;
  transform(response: Response): Response;
};

type RewriterConstructor = new () => RewriterInstance;

function getHtmlRewriter(): RewriterConstructor | null {
  return (globalThis as unknown as { HTMLRewriter?: RewriterConstructor }).HTMLRewriter || null;
}

function safeSchoolHost(rawUrl: unknown): string {
  if (typeof rawUrl !== "string" || !rawUrl.trim()) return "";
  let parsed: URL;
  try {
    parsed = new URL(rawUrl.trim());
  } catch {
    return "";
  }
  if (parsed.protocol !== "https:") return "";
  const host = parsed.hostname.toLowerCase().replace(/^www\./, "");
  if (!/^[a-z0-9.-]+$/.test(host) || host.includes("..")) return "";
  if (/^\d+(\.\d+){3}$/.test(host)) return "";
  if (host === "localhost" || host.endsWith(".local")) return "";
  // University sites only: keeps this endpoint from becoming an open proxy.
  if (!host.endsWith(".edu.vn") && !host.endsWith(".ac.vn")) return "";
  return host;
}

function safeHostname(url: string): string {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "";
  }
}

function isSameSchoolHost(candidate: string, schoolHost: string): boolean {
  const host = candidate.toLowerCase().replace(/^www\./, "");
  return host === schoolHost || host.endsWith(`.${schoolHost}`);
}

function isJunkImage(url: string, alt = "", width = 0, height = 0): boolean {
  const lowerUrl = url.toLowerCase();
  const lowerAlt = alt.toLowerCase();
  if (lowerUrl.startsWith("data:") || lowerUrl.startsWith("blob:")) return true;
  if (/\.(svg|gif|ico)(\?|$)/.test(lowerUrl)) return true;
  if (BAD_IMAGE_MARKERS.some((marker) => lowerUrl.includes(marker) || lowerAlt.includes(marker))) {
    return true;
  }
  if (BAD_PATH_MARKERS.some((marker) => lowerUrl.includes(marker))) return true;
  if (lowerUrl.includes("1x1") || lowerUrl.includes("2x2")) return true;
  if (width > 0 && width < 300) return true;
  if (height > 0 && height < 160) return true;
  return false;
}

function absoluteUrl(raw: string, base: string): string {
  try {
    return new URL(raw.trim(), base).toString();
  } catch {
    return "";
  }
}

function firstSrcsetUrl(srcset: string): string {
  if (!srcset) return "";
  return srcset.split(",")[0]?.trim().split(/\s+/)[0] || "";
}

function dedupeKey(url: string): string {
  try {
    const parsed = new URL(url);
    // WordPress serves the same photo as "-scaled" and "-1024x683"; treat them as one.
    const path = parsed.pathname
      .replace(/\/+$/, "")
      .toLowerCase()
      .replace(/(?:-\d+x\d+)?(?:-scaled|-rotated)?(\.[a-z0-9]+)$/, "$1");
    return `${parsed.hostname.toLowerCase()}${path}`;
  } catch {
    return url.toLowerCase();
  }
}

const PHOTO_PATH_BONUS = /(khuon-vien|campus|co-so|gioi-thieu|gallery|thu-vien-anh|hinh-anh|toa-nha)/;
const NEWS_PATH_PENALTY = /(\/news\/|\/tin-tuc\/|category\/)/;

function imageScore(url: string, og: boolean, pageWeight: number): number {
  const lower = url.toLowerCase();
  let score = pageWeight + (og ? 2 : 0);
  if (PHOTO_PATH_BONUS.test(lower)) score += 4;
  if (NEWS_PATH_PENALTY.test(lower)) score -= 1;
  return score;
}

function rankImages(entries: Array<{ url: string; score: number }>): string[] {
  const best = new Map<string, { url: string; score: number }>();
  for (const entry of entries) {
    if (!entry.url.startsWith("https://")) continue;
    const key = dedupeKey(entry.url);
    if (!key) continue;
    const previous = best.get(key);
    if (!previous || previous.score < entry.score) best.set(key, entry);
  }
  return [...best.values()].sort((a, b) => b.score - a.score).map((entry) => entry.url);
}

async function fetchHtmlPage(url: string) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PAGE_TIMEOUT_MS);
  const options: RequestInit = {
    headers: {
      "user-agent": USER_AGENT,
      accept: "text/html,application/xhtml+xml",
      "accept-language": "vi,en;q=0.8",
    },
    redirect: "manual",
    signal: controller.signal,
  };
  try {
    let response = await fetch(url, options);
    // Follow at most one redirect: a self-redirecting host must not eat the
    // 50-subrequest budget of the whole invocation.
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      const next = location ? absoluteUrl(location, url) : "";
      if (!next) return null;
      response = await fetch(next, options);
      if (response.status >= 300 && response.status < 400) return null;
    }
    if (!response.ok) return null;
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("text/html")) return null;
    return response;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function collectPage(pageUrl: string) {
  const empty = {
    ok: false,
    pageUrl,
    images: [] as Array<{ url: string; alt: string; og: boolean }>,
    links: [] as string[],
  };
  const Rewriter = getHtmlRewriter();
  const response = await fetchHtmlPage(pageUrl);
  if (!response || !Rewriter) return empty;

  const images: Array<{ url: string; alt: string; og: boolean }> = [];
  const links: string[] = [];

  try {
    const rewriter = new Rewriter();
    rewriter
      .on("meta", {
        element(element) {
          const property = (element.getAttribute("property") || element.getAttribute("name") || "").toLowerCase();
          if (!["og:image", "og:image:secure_url", "twitter:image", "twitter:image:src"].includes(property)) {
            return;
          }
          const resolved = absoluteUrl(element.getAttribute("content") || "", pageUrl);
          if (resolved && !isJunkImage(resolved)) images.push({ url: resolved, alt: "", og: true });
        },
      })
      .on("img", {
        element(element) {
          const alt = element.getAttribute("alt") || "";
          const src =
            element.getAttribute("src") ||
            element.getAttribute("data-src") ||
            element.getAttribute("data-lazy-src") ||
            element.getAttribute("data-original") ||
            firstSrcsetUrl(element.getAttribute("srcset") || element.getAttribute("data-srcset") || "");
          if (!src) return;
          const width = Number(element.getAttribute("width") || 0);
          const height = Number(element.getAttribute("height") || 0);
          if (isJunkImage(src, alt, width, height)) return;
          const resolved = absoluteUrl(src, pageUrl);
          if (!resolved || isJunkImage(resolved, alt)) return;
          images.push({ url: resolved, alt, og: false });
        },
      })
      .on("a", {
        element(element) {
          const href = element.getAttribute("href") || "";
          if (href) links.push(href);
        },
      });

    // Consuming the transformed body is what runs the handlers.
    await rewriter.transform(response).text();
  } catch {
    return empty;
  }

  return { ok: true, pageUrl, images, links };
}

function collectCampusLinks(homeUrl: string, links: string[], schoolHost: string): string[] {
  const found: string[] = [];
  const seen = new Set<string>();
  for (const href of links) {
    const resolved = absoluteUrl(href, homeUrl);
    if (!resolved) continue;
    let parsed: URL;
    try {
      parsed = new URL(resolved);
    } catch {
      continue;
    }
    if (parsed.protocol !== "https:") continue;
    if (!isSameSchoolHost(parsed.hostname, schoolHost)) continue;
    const haystack = `${parsed.pathname}${parsed.search}`.toLowerCase();
    if (!CAMPUS_PAGE_HINTS.some((hint) => haystack.includes(hint))) continue;
    parsed.hash = "";
    const clean = parsed.toString();
    if (seen.has(clean)) continue;
    seen.add(clean);
    found.push(clean);
    if (found.length >= 3) break;
  }
  return found;
}

function parseImageSize(bytes: Uint8Array): { width: number; height: number } | null {
  if (bytes.length < 24) return null;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    return { width: view.getUint32(16), height: view.getUint32(20) };
  }

  if (bytes[0] === 0xff && bytes[1] === 0xd8) {
    let offset = 2;
    while (offset + 9 < bytes.length) {
      if (bytes[offset] !== 0xff) {
        offset += 1;
        continue;
      }
      const marker = bytes[offset + 1];
      if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
        offset += 2;
        continue;
      }
      const length = (bytes[offset + 2] << 8) | bytes[offset + 3];
      if (length < 2) return null;
      const isStartOfFrame =
        marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
      if (isStartOfFrame) {
        const height = (bytes[offset + 5] << 8) | bytes[offset + 6];
        const width = (bytes[offset + 7] << 8) | bytes[offset + 8];
        return { width, height };
      }
      offset += 2 + length;
    }
    return null;
  }

  const riff = String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3]);
  const webp = bytes.length >= 16 ? String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11]) : "";
  if (riff === "RIFF" && webp === "WEBP" && bytes.length >= 30) {
    const chunk = String.fromCharCode(bytes[12], bytes[13], bytes[14], bytes[15]);
    if (chunk === "VP8X") {
      return {
        width: 1 + (bytes[24] | (bytes[25] << 8) | (bytes[26] << 16)),
        height: 1 + (bytes[27] | (bytes[28] << 8) | (bytes[29] << 16)),
      };
    }
    if (chunk === "VP8 ") {
      return {
        width: view.getUint16(26, true) & 0x3fff,
        height: view.getUint16(28, true) & 0x3fff,
      };
    }
    if (chunk === "VP8L" && bytes.length >= 25) {
      const bits = view.getUint32(21, true);
      return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
    }
  }
  return null;
}

async function probeImageSize(
  imageUrl: string,
  referer: string,
): Promise<{
  size: { width: number; height: number } | null;
  reachable: boolean;
  contentType: string;
  byteLength: number;
}> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5_000);
  try {
    const response = await fetch(imageUrl, {
      headers: { "user-agent": USER_AGENT, accept: "image/*", referer },
      redirect: "follow",
      signal: controller.signal,
    });
    if (!response.ok) return { size: null, reachable: false, contentType: "", byteLength: 0 };
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.startsWith("image/")) {
      return { size: null, reachable: false, contentType, byteLength: 0 };
    }
    const declaredLength = Number(response.headers.get("content-length") || 0);
    const reader = response.body?.getReader();
    if (!reader) {
      return { size: null, reachable: true, contentType, byteLength: declaredLength };
    }

    let collected = new Uint8Array(0);
    let total = 0;
    while (total < 200_000) {
      const { done, value } = await reader.read();
      if (done) break;
      const merged = new Uint8Array(total + value.length);
      merged.set(collected);
      merged.set(value, total);
      collected = merged;
      total += value.length;
      const size = parseImageSize(collected);
      if (size) {
        await reader.cancel();
        return { size, reachable: true, contentType, byteLength: declaredLength || total };
      }
    }
    await reader.cancel();
    return {
      size: parseImageSize(collected),
      reachable: true,
      contentType,
      byteLength: declaredLength || total,
    };
  } catch {
    return { size: null, reachable: false, contentType: "", byteLength: 0 };
  } finally {
    clearTimeout(timer);
  }
}

function classifyPhoto(probe: {
  size: { width: number; height: number } | null;
  reachable: boolean;
  contentType: string;
  byteLength: number;
}): "good" | "weak" | "bad" {
  if (!probe.reachable) return "bad";
  if (!probe.size) return "weak";
  const { width, height } = probe.size;
  if (width < 600 || height < 350) return "bad";
  const ratio = width / height;
  if (ratio < 1.2 || ratio > 2.8) return "bad";
  // Lightweight PNGs at photo dimensions are almost always graphics/logos.
  if (probe.contentType.includes("png") && probe.byteLength < 120_000) return "bad";
  return "good";
}

async function verifyPhotos(
  urls: string[],
  referer: string,
): Promise<{ verified: string[]; unverified: string[] }> {
  const verified: string[] = [];
  const unverified: string[] = [];
  const candidates = urls.slice(0, 12).filter((url) => url.startsWith("https://"));
  let cursor = 0;

  await Promise.all(
    Array.from({ length: Math.min(7, candidates.length) }, async () => {
      while (cursor < candidates.length) {
        const index = cursor;
        cursor += 1;
        const url = candidates[index];
        const verdict = classifyPhoto(await probeImageSize(url, referer));
        if (verdict === "good") verified[index] = url;
        else if (verdict === "weak") unverified[index] = url;
      }
    }),
  );

  return {
    verified: verified.filter(Boolean),
    unverified: unverified.filter(Boolean),
  };
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunkSize = 0x8000;
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }
  return btoa(binary);
}

async function toDataUrl(response: Response | null): Promise<string | null> {
  if (!response?.ok) return null;
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.startsWith("image/")) return null;
  try {
    const bytes = new Uint8Array(await response.arrayBuffer());
    if (bytes.length === 0 || bytes.length > 5_000_000) return null;
    return `data:${contentType.split(";")[0]};base64,${bytesToBase64(bytes)}`;
  } catch {
    return null;
  }
}

function withTimeoutFetch(url: string, headers: Record<string, string>, ms: number) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return fetch(url, { headers, redirect: "follow", signal: controller.signal }).finally(() =>
    clearTimeout(timer),
  );
}

async function fetchImageDataUrl(imageUrl: string, referer: string): Promise<string | null> {
  // Photos straight from Vietnamese school sites are often multi-megabyte; a
  // resizing proxy keeps the vision payload small and bypasses hotlink walls.
  const resized = `https://wsrv.nl/?url=${encodeURIComponent(imageUrl)}&w=768&fit=inside&we&output=jpg&q=72`;
  try {
    const viaProxy = await toDataUrl(await withTimeoutFetch(resized, {}, 3_500));
    if (viaProxy) return viaProxy;
  } catch {
    // Fall through to a direct download.
  }

  const headers = { "user-agent": USER_AGENT, accept: "image/*", referer };
  try {
    return await toDataUrl(await withTimeoutFetch(imageUrl, headers, 8_000));
  } catch {
    return null;
  }
}

async function selectPhotosWithVision(
  env: Env,
  name: string,
  urls: string[],
  referer: string,
): Promise<string[] | null> {
  const apiKey = getOpenAiKey(env);
  if (!apiKey || urls.length === 0) return null;

  const shortlist = urls.slice(0, 8);
  const prepared = await Promise.all(
    shortlist.map(async (url) => ({ url, data: await fetchImageDataUrl(url, referer) })),
  );
  const usable: Array<{ url: string; data: string }> = [];
  let totalChars = 0;
  for (const item of prepared) {
    if (!item.data) continue;
    if (totalChars > 0 && totalChars + item.data.length > 10_000_000) continue;
    usable.push({ url: item.url, data: item.data });
    totalChars += item.data.length;
  }
  if (usable.length === 0) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 25_000);
  try {
    const response = await fetch(OPENAI_ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: getOpenAiModels(env)[0],
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text:
                  `Choose photos for the profile card of "${name}" (a university in Vietnam). ` +
                  "Images are numbered from 0. Keep genuine photographs of its campus, buildings, classrooms, library, labs, or its students; prefer recent full-color wide or medium shots where the place or people are recognizable (campus views, student life) and order the most representative first. " +
                  "Reject maps, diagrams, illustrations, logos, posters, banners, admission notices, charts, screenshots, " +
                  "scanned documents, ID/headshot portraits, article cards or thumbnails with text overlays, " +
                  "conference, ceremony or group photos posed in front of a backdrop or banner (red stage backdrops, name plates, signing ceremonies), " +
                  "images where signage or a banner fills most of the frame, " +
                  "images with a large logo, slogan or watermark overlaid on the scene, " +
                  "black-and-white or heavily faded archive scans, " +
                  "tight close-ups of equipment or objects, " +
                  "wide shots of foreign streets, foreign architecture, or a campus clearly located abroad, " +
                  "and images from another institution or a partner campus abroad. " +
                  'Keep every image that genuinely qualifies, best first, up to 5. ' +
                  'Answer as JSON {"keep":[image numbers]} and use {"keep":[]} only if none qualify.',
              },
              ...usable.map((item) => ({ type: "image_url", image_url: { url: item.data, detail: "high" } })),
            ],
          },
        ],
        max_completion_tokens: 600,
        reasoning_effort: "none",
        response_format: { type: "json_object" },
      }),
      signal: controller.signal,
    });
    if (!response.ok) return null;

    const data = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const content = data?.choices?.[0]?.message?.content;
    if (typeof content !== "string") return null;

    let parsed: unknown;
    const cleaned = content.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "").trim();
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      const match = cleaned.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
      try {
        parsed = match ? JSON.parse(match[0]) : undefined;
      } catch {
        parsed = undefined;
      }
    }
    if (parsed === undefined) return null;
    const keep = Array.isArray(parsed) ? parsed : (parsed as { keep?: unknown })?.keep;
    if (!Array.isArray(keep)) return null;

    const picked: string[] = [];
    for (const index of keep) {
      if (typeof index !== "number" || !Number.isInteger(index)) continue;
      if (index < 0 || index >= usable.length) continue;
      const url = usable[index].url;
      if (!picked.includes(url)) picked.push(url);
    }
    return picked.slice(0, 5);
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function mergeImages(groups: string[][], limit = MAX_IMAGES): string[] {
  const seen = new Set<string>();
  const output: string[] = [];
  for (const group of groups) {
    for (const url of group) {
      if (!url.startsWith("https://")) continue;
      const key = dedupeKey(url);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      output.push(url);
      if (output.length >= limit) return output;
    }
  }
  return output;
}

async function collectWordpressMedia(schoolHost: string): Promise<string[]> {
  // Plenty of Vietnamese university sites run WordPress; the media library
  // holds exactly the campus photos that the themed front page hides.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6_000);
  try {
    const response = await fetch(
      `https://${schoolHost}/wp-json/wp/v2/media?per_page=30&media_type=image&_fields=source_url`,
      {
        headers: { "user-agent": USER_AGENT, accept: "application/json" },
        redirect: "follow",
        signal: controller.signal,
      },
    );
    if (!response.ok) return [];
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("json")) return [];
    const data = (await response.json()) as unknown;
    if (!Array.isArray(data)) return [];
    const urls: string[] = [];
    for (const item of data) {
      const raw = (item as { source_url?: unknown })?.source_url;
      if (typeof raw !== "string" || !raw.startsWith("https://")) continue;
      const host = safeHostname(raw);
      if (!host || !isSameSchoolHost(host, schoolHost)) continue;
      if (isJunkImage(raw)) continue;
      urls.push(raw);
    }
    return urls.slice(0, 12);
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

async function scrapeOfficialSite(schoolHost: string): Promise<{ candidates: string[]; reachable: boolean }> {
  const origins = schoolHost.startsWith("www.") ? [schoolHost] : [schoolHost, `www.${schoolHost}`];

  let homeUrl = `https://${origins[0]}/`;
  let home = await collectPage(homeUrl);
  let reachable = home.ok;

  // Several school sites only answer on www (or bounce the apex into a redirect loop).
  if (!reachable && origins.length > 1) {
    const fallbackUrl = `https://${origins[1]}/`;
    const fallbackHome = await collectPage(fallbackUrl);
    if (fallbackHome.ok) {
      home = fallbackHome;
      homeUrl = fallbackUrl;
      reachable = true;
    }
  }

  const campusLinks = collectCampusLinks(homeUrl, home.links, schoolHost);
  const [subPages, wpImages] = await Promise.all([
    Promise.all(campusLinks.map((link) => collectPage(link))),
    reachable ? collectWordpressMedia(schoolHost) : Promise.resolve<string[]>([]),
  ]);

  const entries = [
    ...home.images.map((image) => ({ url: image.url, score: imageScore(image.url, image.og, 1) })),
    ...subPages.flatMap((page) =>
      page.images.map((image) => ({ url: image.url, score: imageScore(image.url, image.og, 3) })),
    ),
    ...wpImages.map((url) => ({ url, score: 2 })),
  ];

  return { candidates: rankImages(entries).slice(0, MAX_CANDIDATES), reachable };
}

const BLOCKED_PAGE_EXTENSIONS = /\.(pdf|docx?|xlsx?|pptx?|zip|rar|exe|apk)(\?|$)/i;

async function exaDiscovery(
  apiKey: string,
  name: string,
  schoolHost: string,
): Promise<{ pages: string[]; images: string[] }> {
  const empty = { pages: [] as string[], images: [] as string[] };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15_000);
  try {
    const response = await fetch(EXA_ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": apiKey },
      body: JSON.stringify({
        query: `${name} khuôn viên trường cơ sở vật chất thư viện ảnh giới thiệu`,
        numResults: 10,
        type: "auto",
        includeDomains: [schoolHost, `www.${schoolHost}`],
        contents: { extras: { imageLinks: 10 } },
      }),
      signal: controller.signal,
    });
    if (!response.ok) return empty;

    const data = (await response.json()) as { results?: Array<Record<string, any>> };
    const results = Array.isArray(data?.results) ? data.results : [];

    const pageScores = new Map<string, number>();
    const images: string[] = [];

    for (const result of results) {
      const resultUrl = typeof result?.url === "string" ? result.url : "";
      let sameHost = false;
      let path = "";
      try {
        const parsed = new URL(resultUrl);
        path = parsed.pathname;
        sameHost = parsed.protocol === "https:" && isSameSchoolHost(parsed.hostname, schoolHost);
      } catch {
        sameHost = false;
      }

      if (sameHost && path && path !== "/" && !BLOCKED_PAGE_EXTENSIONS.test(path)) {
        const haystack = path.toLowerCase();
        let score = 0;
        for (const hint of CAMPUS_PAGE_HINTS) if (haystack.includes(hint)) score += 2;
        if (haystack.includes("phong-co-so")) score += 3;
        if (score > 0) {
          const clean = new URL(resultUrl);
          clean.hash = "";
          pageScores.set(clean.toString(), Math.max(score, pageScores.get(clean.toString()) || 0));
        }
      }

      const links: string[] = [];
      if (typeof result?.image === "string") links.push(result.image);
      if (Array.isArray(result?.extras?.imageLinks)) links.push(...result.extras.imageLinks);
      for (const raw of links) {
        if (typeof raw !== "string") continue;
        const imageUrl = absoluteUrl(raw, sameHost ? resultUrl : `https://${schoolHost}/`);
        if (!imageUrl || isJunkImage(imageUrl)) continue;
        const imageHost = safeHostname(imageUrl);
        if (!sameHost && !(imageHost && isSameSchoolHost(imageHost, schoolHost))) continue;
        images.push(imageUrl);
      }
    }

    const pages = [...pageScores.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([pageUrl]) => pageUrl);

    // Real campus photos are almost always JPEG; maps, notices and logos are
    // often PNG, so nudge photos to the front of the vision shortlist.
    const scored = images.map((url) => {
      let score = 2;
      if (/\.jpe?g(\?|$)/i.test(url)) score += 1;
      if (/\.png(\?|$)/i.test(url)) score -= 1;
      return { url, score };
    });

    return { pages, images: rankImages(scored).slice(0, 10) };
  } catch {
    return empty;
  } finally {
    clearTimeout(timer);
  }
}

export async function onRequestPost({ request, env }: { request: Request; env: Env }) {
  if (!(await getSessionUserId(request, env))) {
    return json({ error: "Unauthorized" }, 401);
  }

  const body = await readJson(request);
  const query = typeof body?.query === "string" ? body.query.trim().slice(0, 200) : "";
  const schoolHost = safeSchoolHost(body?.url);
  if (!query || !schoolHost) {
    return json({ images: [], warning: "Thiếu thông tin trường để lấy ảnh chính xác." }, 200);
  }

  const edgeCache = (globalThis as unknown as { caches?: { default?: Cache } }).caches?.default;
  let cacheKey: Request | null = null;
  try {
    cacheKey = new Request(`https://smarm-cache.internal/v19/university-photos/${schoolHost}`, { method: "GET" });
  } catch {
    cacheKey = null;
  }

  if (edgeCache && cacheKey) {
    try {
      const hit = await edgeCache.match(cacheKey);
      if (hit) return hit;
    } catch {
      // Cache misses must never block the request.
    }
  }

  const homeUrl = `https://${schoolHost}/`;
  let candidates: string[] = [];
  let reachable = false;
  try {
    const scraped = await scrapeOfficialSite(schoolHost);
    candidates = scraped.candidates;
    reachable = scraped.reachable;
  } catch {
    candidates = [];
  }

  // Some hosts cannot be fetched from the edge runtime (broken TLS chain, bot wall).
  // Their pages cannot be validated, so use Exa-found images and let the vision
  // check decide; without that check we show placeholders rather than guesses.
  const hostUnreachable = !reachable;

  let result = hostUnreachable
    ? { verified: [] as string[], unverified: [] as string[] }
    : await verifyPhotos(candidates, homeUrl);

  if (hostUnreachable) {
    let exaImages: string[] = [];
    for (const key of getExaKeys(env)) {
      const discovery = await exaDiscovery(key, query, schoolHost);
      if (discovery.images.length > 0) {
        exaImages = discovery.images;
        break;
      }
    }
    if (exaImages.length > 0) {
      const probed = await verifyPhotos(exaImages, homeUrl);
      // If the image host is just as unreachable, keep the raw list: browsers
      // often load hosts that the edge runtime cannot reach.
      result =
        probed.verified.length + probed.unverified.length > 0
          ? probed
          : { verified: exaImages, unverified: [] };
    }
  } else if (result.verified.length < 3) {
    for (const key of getExaKeys(env)) {
      const discovery = await exaDiscovery(key, query, schoolHost);
      if (discovery.pages.length === 0 && discovery.images.length === 0) continue;

      const pageImages = await Promise.all(discovery.pages.map((pageUrl) => collectPage(pageUrl)));
      const fromPages = rankImages(
        pageImages.flatMap((page) =>
          page.images.map((image) => ({ url: image.url, score: imageScore(image.url, image.og, 4) })),
        ),
      );

      const extraCandidates = rankImages([
        ...fromPages.map((url) => ({ url, score: 4 })),
        ...discovery.images.map((url) => ({ url, score: 2 })),
      ]).slice(0, MAX_CANDIDATES);

      if (extraCandidates.length === 0) continue;

      const extra = await verifyPhotos(extraCandidates, homeUrl);
      result = {
        verified: mergeImages([result.verified, extra.verified], MAX_IMAGES),
        unverified: mergeImages([result.unverified, extra.unverified], MAX_IMAGES),
      };
      break;
    }
  }

  const ordered = mergeImages([result.verified, result.unverified], MAX_IMAGES);
  const picked = ordered.length > 0 ? await selectPhotosWithVision(env, query, ordered, homeUrl) : null;
  // A blank gallery is worse than a slightly less curated one: if the vision
  // pass rejects everything (or is unavailable) keep the best real candidates.
  const images = picked && picked.length > 0 ? picked : ordered.slice(0, 4);

  // Thin results usually mean the site lists few usable photos. One extra Exa
  // pass adds candidates that the vision check can vet.
  if (images.length < 3) {
    let extras: string[] = [];
    for (const key of getExaKeys(env)) {
      const discovery = await exaDiscovery(key, query, schoolHost);
      if (discovery.images.length > 0) {
        extras = discovery.images.filter((url) => !images.includes(url)).slice(0, 6);
        break;
      }
    }
    if (extras.length > 0) {
      const more = await selectPhotosWithVision(env, query, extras, homeUrl);
      const add = more && more.length > 0 ? more : extras.slice(0, 3);
      images.push(...add.filter((url) => !images.includes(url)));
    }
  }
  const response = json(
    {
      images,
      host: schoolHost,
      count: images.length,
    },
    200,
    { "cache-control": images.length > 0 ? "public, max-age=86400" : "public, max-age=600" },
  );

  if (edgeCache && cacheKey && images.length > 0) {
    try {
      await edgeCache.put(cacheKey, response.clone());
    } catch {
      // Ignore cache write failures.
    }
  }
  return response;
}
