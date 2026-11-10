type Env = { AUTH_SECRET: string };

const encoder = new TextEncoder();
const decoder = new TextDecoder();
const SESSION_COOKIE = "smarm_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;

const toBase64Url = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");

const fromBase64Url = (value: string) => {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((value.length + 3) % 4);
  return Uint8Array.from(atob(padded), (char) => char.charCodeAt(0));
};

const constantTimeEqual = (left: Uint8Array, right: Uint8Array) => {
  if (left.length !== right.length) return false;
  let diff = 0;
  for (let index = 0; index < left.length; index += 1) diff |= left[index] ^ right[index];
  return diff === 0;
};

async function hmac(value: string, secret: string) {
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(value)));
}

export async function hashPassword(password: string, salt = crypto.getRandomValues(new Uint8Array(16))) {
  const key = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]);
  // Cloudflare Workers caps PBKDF2 at 100,000 iterations.
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations: 100000 }, key, 256);
  return { hash: toBase64Url(new Uint8Array(bits)), salt: toBase64Url(salt) };
}

export async function verifyPassword(password: string, salt: string, expectedHash: string) {
  const result = await hashPassword(password, fromBase64Url(salt));
  return constantTimeEqual(encoder.encode(result.hash), encoder.encode(expectedHash));
}

export async function createSession(userId: string, request: Request, env: Env) {
  const payload = toBase64Url(encoder.encode(JSON.stringify({ sub: userId, exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS })));
  const signature = toBase64Url(await hmac(payload, env.AUTH_SECRET));
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return `${SESSION_COOKIE}=${payload}.${signature}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_TTL_SECONDS}${secure}`;
}

export async function getSessionUserId(request: Request, env: Env) {
  const rawCookie = request.headers.get("cookie") || "";
  const session = rawCookie.split(/;\s*/).find((item) => item.startsWith(`${SESSION_COOKIE}=`))?.slice(SESSION_COOKIE.length + 1);
  if (!session) return null;
  const [payload, signature] = session.split(".");
  if (!payload || !signature) return null;
  try {
    const expected = await hmac(payload, env.AUTH_SECRET);
    if (!constantTimeEqual(expected, fromBase64Url(signature))) return null;
    const data = JSON.parse(decoder.decode(fromBase64Url(payload))) as { sub?: string; exp?: number };
    return data.sub && data.exp && data.exp > Math.floor(Date.now() / 1000) ? data.sub : null;
  } catch {
    return null;
  }
}

export const clearSession = (request: Request) => {
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`;
};
