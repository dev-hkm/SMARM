import type { Env } from "./env";
import { getExaKeys, getTinyFishKey } from "./secrets";

export type SearchType = "lite" | "auto" | "deep-lite" | "deep";

export type NormalizedSearchResult = {
  title: string;
  url: string;
  text: string;
  highlights: string[];
  summary: string;
  publishedDate?: string;
  image?: string;
  imageLinks?: string[];
};

export type SearchOutput = { content?: unknown; grounding?: unknown } | null;

export type SearchRequest = {
  query: string;
  numResults: number;
  type: SearchType;
  includeDomains?: string[];
  excludeDomains?: string[];
  additionalQueries?: string[];
  systemPrompt?: string;
  outputSchema?: Record<string, unknown>;
  contents?: Record<string, unknown>;
};

export type SearchAttempt = {
  provider: string;
  keyIndex?: number;
  type?: string;
  status?: number;
  reason: string;
};

export type SearchOutcome = {
  provider: string;
  searchType: string;
  requestId: string;
  results: NormalizedSearchResult[];
  output: SearchOutput;
  attempts: SearchAttempt[];
};

export class SearchProviderError extends Error {
  status: number;
  attempts: SearchAttempt[];

  constructor(message: string, status: number, attempts: SearchAttempt[]) {
    super(message);
    this.name = "SearchProviderError";
    this.status = status;
    this.attempts = attempts;
  }
}

const EXA_ENDPOINT = "https://api.exa.ai/search";
const TINY_SEARCH_ENDPOINT = "https://api.search.tinyfish.ai";
const TINY_FETCH_ENDPOINT = "https://api.fetch.tinyfish.ai";

const SEARCH_TYPES: SearchType[] = ["lite", "auto", "deep-lite", "deep"];
const SEARCH_TYPE_ALIASES: Record<string, SearchType> = {
  fast: "auto",
  instant: "auto",
  "deep-reasoning": "deep",
};

export function getSearchProviderNames(env: Env): string[] {
  const names: string[] = [];
  if (getExaKeys(env).length) names.push("exa");
  if (getTinyFishKey(env)) names.push("tinyfish");
  return names;
}

function asString(value: unknown, maxLength = 20000): string {
  return typeof value === "string" ? value.slice(0, maxLength) : "";
}

function asStringArray(value: unknown, maxItems: number, maxLength: number): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim().slice(0, maxLength))
    .filter(Boolean)
    .slice(0, maxItems);
}

function clampNumber(value: unknown, min: number, max: number): number | undefined {
  if (typeof value !== "number" || !Number.isFinite(value)) return undefined;
  return Math.max(min, Math.min(max, Math.floor(value)));
}

function sanitizeContents(value: unknown): Record<string, unknown> | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const input = value as Record<string, unknown>;
  const contents: Record<string, unknown> = {};

  if (input.text === true) {
    contents.text = true;
  } else if (input.text && typeof input.text === "object" && !Array.isArray(input.text)) {
    const text = input.text as Record<string, unknown>;
    contents.text = {
      ...(clampNumber(text.maxCharacters, 500, 20000) !== undefined
        ? { maxCharacters: clampNumber(text.maxCharacters, 500, 20000) }
        : {}),
      ...(typeof text.includeHtmlTags === "boolean" ? { includeHtmlTags: text.includeHtmlTags } : {}),
      ...(["compact", "standard", "full"].includes(String(text.verbosity))
        ? { verbosity: text.verbosity }
        : {}),
      ...(asStringArray(text.includeSections, 8, 20).length
        ? { includeSections: asStringArray(text.includeSections, 8, 20) }
        : {}),
      ...(asStringArray(text.excludeSections, 8, 20).length
        ? { excludeSections: asStringArray(text.excludeSections, 8, 20) }
        : {}),
    };
  }

  if (input.highlights === true) {
    contents.highlights = true;
  } else if (
    input.highlights &&
    typeof input.highlights === "object" &&
    !Array.isArray(input.highlights)
  ) {
    const highlights = input.highlights as Record<string, unknown>;
    contents.highlights = {
      ...(typeof highlights.query === "string" ? { query: highlights.query.slice(0, 400) } : {}),
      ...(clampNumber(highlights.maxCharacters, 200, 6000) !== undefined
        ? { maxCharacters: clampNumber(highlights.maxCharacters, 200, 6000) }
        : {}),
    };
  }

  if (input.summary === true) {
    contents.summary = true;
  } else if (input.summary && typeof input.summary === "object" && !Array.isArray(input.summary)) {
    const summary = input.summary as Record<string, unknown>;
    contents.summary = {
      ...(typeof summary.query === "string" ? { query: summary.query.slice(0, 400) } : {}),
      ...(summary.schema && typeof summary.schema === "object" && !Array.isArray(summary.schema)
        ? { schema: summary.schema }
        : {}),
    };
  }

  if (input.extras && typeof input.extras === "object" && !Array.isArray(input.extras)) {
    const extras = input.extras as Record<string, unknown>;
    const imageLinks = clampNumber(extras.imageLinks, 1, 10);
    if (imageLinks) contents.extras = { imageLinks };
  }

  const maxAgeHours = clampNumber(input.maxAgeHours, -1, 24 * 30);
  if (maxAgeHours !== undefined) contents.maxAgeHours = maxAgeHours;

  const livecrawlTimeout = clampNumber(input.livecrawlTimeout, 1000, 30000);
  if (livecrawlTimeout !== undefined) contents.livecrawlTimeout = livecrawlTimeout;

  const subpages = clampNumber(input.subpages, 0, 6);
  if (subpages !== undefined) contents.subpages = subpages;

  if (typeof input.subpageTarget === "string") {
    contents.subpageTarget = input.subpageTarget.slice(0, 120);
  } else {
    const targets = asStringArray(input.subpageTarget, 6, 120);
    if (targets.length) contents.subpageTarget = targets;
  }

  return Object.keys(contents).length ? contents : undefined;
}

export function sanitizeSearchRequest(body: Record<string, unknown> | null): SearchRequest | null {
  const query = typeof body?.query === "string" ? body.query.trim() : "";
  if (!query || query.length > 1000) return null;

  const rawType = typeof body?.type === "string" ? body.type.trim().toLowerCase() : "";
  const options =
    body?.options && typeof body.options === "object" && !Array.isArray(body.options)
      ? (body.options as Record<string, unknown>)
      : {};

  const typeFromOptions = typeof options.type === "string" ? options.type.trim().toLowerCase() : "";
  const requestedType = typeFromOptions || rawType;
  const type =
    SEARCH_TYPE_ALIASES[requestedType] ??
    (SEARCH_TYPES.includes(requestedType as SearchType) ? (requestedType as SearchType) : "auto");

  const numResults = clampNumber(body?.numResults, 1, 25) ?? 5;
  const includeDomains = asStringArray(options.includeDomains, 50, 120);
  const excludeDomains = asStringArray(options.excludeDomains, 50, 120);
  const additionalQueries = asStringArray(options.additionalQueries, 10, 300);
  const systemPrompt = asString(options.systemPrompt, 4000);
  const outputSchema =
    options.outputSchema && typeof options.outputSchema === "object" && !Array.isArray(options.outputSchema)
      ? (options.outputSchema as Record<string, unknown>)
      : undefined;

  return {
    query,
    numResults,
    type,
    ...(includeDomains.length ? { includeDomains } : {}),
    ...(excludeDomains.length ? { excludeDomains } : {}),
    ...(additionalQueries.length ? { additionalQueries } : {}),
    ...(systemPrompt ? { systemPrompt } : {}),
    ...(outputSchema ? { outputSchema } : {}),
    ...(sanitizeContents(options.contents) ? { contents: sanitizeContents(options.contents) } : {}),
  };
}

function remainingMs(deadline: number): number {
  return deadline - Date.now();
}

async function fetchJsonWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number,
): Promise<{ ok: boolean; status: number; data: any; text: string; timedOut: boolean }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), Math.max(1000, timeoutMs));
  try {
    const response = await fetch(url, { ...init, signal: controller.signal });
    const text = await response.text();
    let data: any = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = null;
    }
    return { ok: response.ok, status: response.status, data, text, timedOut: false };
  } catch (error) {
    const timedOut = controller.signal.aborted;
    return {
      ok: false,
      status: timedOut ? 504 : 502,
      data: null,
      text: error instanceof Error ? error.message : "Network error",
      timedOut,
    };
  } finally {
    clearTimeout(timer);
  }
}

function normalizeExaResults(data: any, defaultTextChars = 5000): NormalizedSearchResult[] {
  const rawResults = Array.isArray(data?.results) ? data.results : [];
  return rawResults
    .map((result: any): NormalizedSearchResult => {
      const extras = result?.extras && typeof result.extras === "object" ? result.extras : {};
      return {
        title: asString(result?.title, 300),
        url: asString(result?.url, 1000),
        text: asString(result?.text, defaultTextChars),
        highlights: asStringArray(result?.highlights, 5, 2000),
        summary: asString(result?.summary, 3000),
        ...(typeof result?.publishedDate === "string" ? { publishedDate: result.publishedDate } : {}),
        ...(typeof result?.image === "string" ? { image: result.image } : {}),
        ...(Array.isArray(extras?.imageLinks)
          ? { imageLinks: asStringArray(extras.imageLinks, 8, 1200) }
          : {}),
      };
    })
    .filter((result: NormalizedSearchResult) => result.url.length > 0);
}

type ExaAttemptResult = {
  outcome?: SearchOutcome;
  attempt?: SearchAttempt;
};

async function attemptExa(options: {
  apiKey: string;
  keyIndex: number;
  request: SearchRequest;
  type: SearchType;
  deadline: number;
  includeSchema: boolean;
}): Promise<ExaAttemptResult> {
  const { apiKey, keyIndex, request, deadline, includeSchema } = options;
  const remaining = remainingMs(deadline);
  if (remaining < 3000) {
    return {
      attempt: {
        provider: "Exa",
        keyIndex,
        type: options.type,
        reason: "Hết thời gian chờ tổng trước khi gọi Exa.",
      },
    };
  }

  const preferredBudget = options.type === "deep" ? 70000 : options.type === "deep-lite" ? 30000 : 25000;
  const budget = Math.min(preferredBudget, remaining - 500);

  const payload: Record<string, unknown> = {
    query: request.query,
    numResults: request.numResults,
    type: options.type,
    contents: request.contents || { text: { maxCharacters: 3000 } },
    ...(request.includeDomains?.length ? { includeDomains: request.includeDomains } : {}),
    ...(request.excludeDomains?.length ? { excludeDomains: request.excludeDomains } : {}),
    ...(options.type === "deep" && request.additionalQueries?.length
      ? { additionalQueries: request.additionalQueries }
      : {}),
    ...(options.type === "deep" && request.systemPrompt ? { systemPrompt: request.systemPrompt } : {}),
    ...(includeSchema && options.type === "deep" && request.outputSchema
      ? { outputSchema: request.outputSchema }
      : {}),
  };

  const response = await fetchJsonWithTimeout(
    EXA_ENDPOINT,
    {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": apiKey },
      body: JSON.stringify(payload),
    },
    budget,
  );

  if (!response.ok) {
    return {
      attempt: {
        provider: "Exa",
        keyIndex,
        type: options.type,
        status: response.status,
        reason: (response.text || `HTTP ${response.status}`).slice(0, 300),
      },
    };
  }

  const results = normalizeExaResults(response.data);
  return {
    outcome: {
      provider: "Exa",
      searchType: asString(response.data?.resolvedSearchType, 40) || options.type,
      requestId: asString(response.data?.requestId, 120),
      results,
      output:
        response.data?.output && typeof response.data.output === "object"
          ? (response.data.output as SearchOutput)
          : null,
      attempts: [],
    },
  };
}

async function runExaChain(
  env: Env,
  request: SearchRequest,
  deadline: number,
  attempts: SearchAttempt[],
): Promise<SearchOutcome | null> {
  const keys = getExaKeys(env);
  if (!keys.length) return null;

  const preferred = request.type;

  for (let index = 0; index < keys.length; index += 1) {
    const result = await attemptExa({
      apiKey: keys[index],
      keyIndex: index + 1,
      request,
      type: preferred,
      deadline,
      includeSchema: true,
    });
    if (result.outcome) {
      result.outcome.attempts = attempts;
      return result.outcome;
    }
    if (result.attempt) attempts.push(result.attempt);
    if (remainingMs(deadline) < 5000) break;
  }

  if (preferred === "deep" && remainingMs(deadline) > 15000) {
    for (let index = 0; index < keys.length; index += 1) {
      const result = await attemptExa({
        apiKey: keys[index],
        keyIndex: index + 1,
        request,
        type: "deep-lite",
        deadline,
        includeSchema: true,
      });
      if (result.outcome) {
        result.outcome.attempts = attempts;
        return result.outcome;
      }
      if (result.attempt) attempts.push(result.attempt);
      if (remainingMs(deadline) < 5000) break;
    }
  }

  if (remainingMs(deadline) > 10000) {
    const safeRequest: SearchRequest = {
      query: request.query,
      numResults: Math.min(request.numResults, 10),
      type: "auto",
      ...(request.includeDomains?.length ? { includeDomains: request.includeDomains } : {}),
      ...(request.excludeDomains?.length ? { excludeDomains: request.excludeDomains } : {}),
      contents: { text: { maxCharacters: 3000 }, highlights: { maxCharacters: 1200 } },
    };
    const safeResult = await attemptExa({
      apiKey: keys[0],
      keyIndex: 1,
      request: safeRequest,
      type: "auto",
      deadline,
      includeSchema: false,
    });
    if (safeResult.outcome) {
      safeResult.outcome.attempts = attempts;
      return safeResult.outcome;
    }
    if (safeResult.attempt) attempts.push(safeResult.attempt);
  }

  return null;
}

function normalizeTinyFishResults(data: any, limit: number): NormalizedSearchResult[] {
  const rawResults = Array.isArray(data?.results) ? data.results : [];
  return rawResults
    .slice(0, limit)
    .map((result: any): NormalizedSearchResult => {
      const snippet = asString(result?.snippet, 2000);
      return {
        title: asString(result?.title, 300),
        url: asString(result?.url, 1000),
        text: snippet,
        highlights: snippet ? [snippet] : [],
        summary: snippet,
      };
    })
    .filter((result: NormalizedSearchResult) => result.url.length > 0);
}

async function enrichWithTinyFetch(
  apiKey: string,
  results: NormalizedSearchResult[],
  deadline: number,
): Promise<void> {
  const remaining = remainingMs(deadline);
  if (remaining < 8000) return;

  const targetResults = results.slice(0, 5).filter((result) => /^https?:\/\//i.test(result.url));
  if (!targetResults.length) return;

  const response = await fetchJsonWithTimeout(
    TINY_FETCH_ENDPOINT,
    {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": apiKey },
      body: JSON.stringify({
        urls: targetResults.map((result) => result.url),
        format: "markdown",
      }),
    },
    Math.min(40000, remaining - 2000),
  );

  if (!response.ok || !Array.isArray(response.data?.results)) return;

  const byUrl = new Map<string, any>();
  for (const item of response.data.results) {
    if (typeof item?.url === "string") byUrl.set(item.url, item);
    if (typeof item?.final_url === "string") byUrl.set(item.final_url, item);
  }

  for (const result of targetResults) {
    const fetched = byUrl.get(result.url);
    const text = asString(fetched?.text, 6000);
    if (text) {
      result.text = text;
      if (!result.summary) result.summary = asString(fetched?.description, 1000);
    }
  }
}

async function runTinyFish(
  env: Env,
  request: SearchRequest,
  deadline: number,
  attempts: SearchAttempt[],
): Promise<SearchOutcome | null> {
  const apiKey = getTinyFishKey(env);
  if (!apiKey) return null;

  const remaining = remainingMs(deadline);
  if (remaining < 3000) {
    attempts.push({
      provider: "TinyFish",
      reason: "Hết thời gian chờ tổng trước khi gọi TinyFish.",
    });
    return null;
  }

  const url = new URL(TINY_SEARCH_ENDPOINT);
  url.searchParams.set("query", request.query);
  url.searchParams.set("language", "vi");
  url.searchParams.set("page", "0");

  const response = await fetchJsonWithTimeout(
    url.toString(),
    { method: "GET", headers: { "x-api-key": apiKey } },
    Math.min(45000, remaining - 1000),
  );

  if (!response.ok) {
    attempts.push({
      provider: "TinyFish",
      status: response.status,
      reason: (response.text || `HTTP ${response.status}`).slice(0, 300),
    });
    return null;
  }

  const results = normalizeTinyFishResults(response.data, request.numResults);
  if (!results.length) {
    attempts.push({ provider: "TinyFish", reason: "TinySearch trả về danh sách rỗng." });
    return null;
  }

  await enrichWithTinyFetch(apiKey, results, deadline).catch(() => undefined);

  return {
    provider: "TinyFish",
    searchType: "tinysearch",
    requestId: "",
    results,
    output: null,
    attempts,
  };
}

export async function runSearch(env: Env, request: SearchRequest): Promise<SearchOutcome> {
  const attempts: SearchAttempt[] = [];
  const deadline = Date.now() + 105000;

  if (!getSearchProviderNames(env).length) {
    throw new SearchProviderError("Dịch vụ tìm kiếm chưa được cấu hình.", 503, attempts);
  }

  const exaOutcome = await runExaChain(env, request, deadline, attempts);
  if (exaOutcome) return exaOutcome;

  const tinyFishOutcome = await runTinyFish(env, request, deadline, attempts);
  if (tinyFishOutcome) return tinyFishOutcome;

  throw new SearchProviderError("Dịch vụ tìm kiếm tạm thời không phản hồi.", 502, attempts);
}
