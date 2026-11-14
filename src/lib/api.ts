const AI_TIMEOUT_MS = 120_000;
const AI_STREAM_TIMEOUT_MS = 180_000;
const SEARCH_TIMEOUT_MS = 140_000;
const AUTH_TIMEOUT_MS = 25_000;
const DATA_TIMEOUT_MS = 30_000;

export type ChatContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string | ChatContentPart[];
};
export type ChatResponse = { choices: Array<{ message: { role: string; content: string } }> };

type ApiErrorBody = { message?: string; error?: string };

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

function timeoutSignal(ms: number) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return {
    signal: controller.signal,
    done: () => clearTimeout(timer),
  };
}

async function readError(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as ApiErrorBody;
    return body?.message || body?.error || `Máy chủ lỗi (${response.status}).`;
  } catch {
    return `Máy chủ lỗi (${response.status}).`;
  }
}

async function requestJson(
  path: string,
  init: RequestInit,
  timeoutMs: number,
  throwOnError = true,
): Promise<any> {
  const { signal, done } = timeoutSignal(timeoutMs);
  try {
    const response = await fetch(path, { credentials: "include", ...init, signal });
    if (!response.ok) {
      const message = await readError(response);
      if (throwOnError) throw new ApiError(message, response.status);
      return { status: "error", ok: false, message, httpStatus: response.status };
    }
    return await response.json().catch(() => ({}));
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ApiError("Máy chủ phản hồi quá lâu. Vui lòng thử lại.", 504);
    }
    throw new ApiError("Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.", 0);
  } finally {
    done();
  }
}

function readChunkContent(chunk: any): string {
  const delta = chunk?.choices?.[0]?.delta;
  const content = delta?.content;
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((part) => (typeof part === "string" ? part : typeof part?.text === "string" ? part.text : ""))
      .join("");
  }
  const message = chunk?.choices?.[0]?.message?.content;
  return typeof message === "string" ? message : "";
}

function splitSseEvents(buffer: string) {
  const events: string[] = [];
  let rest = buffer;
  while (true) {
    const match = rest.match(/\r?\n\r?\n/);
    if (!match || match.index === undefined) break;
    events.push(rest.slice(0, match.index));
    rest = rest.slice(match.index + match[0].length);
  }
  return { events, rest };
}

async function consumeStream(
  response: Response,
  onChunk: (chunk: string) => void,
): Promise<string> {
  if (!response.body) return "";

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let fullText = "";

  const handleEvent = (rawEvent: string) => {
    const payload = rawEvent
      .split(/\r?\n/)
      .filter((line) => line.startsWith("data:"))
      .map((line) => line.slice(5).trim())
      .join("\n")
      .trim();
    if (!payload || payload === "[DONE]") return;
    try {
      const text = readChunkContent(JSON.parse(payload));
      if (text) {
        fullText += text;
        onChunk(text);
      }
    } catch {
      // Provider keep-alives and malformed metadata are safe to skip.
    }
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const parsed = splitSseEvents(buffer);
    buffer = parsed.rest;
    for (const event of parsed.events) handleEvent(event);
  }

  buffer += decoder.decode();
  if (buffer.trim()) handleEvent(buffer);

  return fullText;
}

const IMAGE_DATA_URL = /^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/;

function normalizeContent(content: unknown): string | ChatContentPart[] {
  if (typeof content === "string") return content.slice(0, 100_000);
  if (!Array.isArray(content)) return "";
  const parts: ChatContentPart[] = [];
  for (const part of content) {
    if (part?.type === "text" && typeof part.text === "string" && part.text.trim()) {
      parts.push({ type: "text", text: part.text.slice(0, 100_000) });
    } else if (
      part?.type === "image_url" &&
      typeof part.image_url?.url === "string" &&
      IMAGE_DATA_URL.test(part.image_url.url)
    ) {
      parts.push({ type: "image_url", image_url: { url: part.image_url.url } });
    }
  }
  return parts;
}

function contentIsEmpty(content: string | ChatContentPart[]): boolean {
  if (typeof content === "string") return content.trim().length === 0;
  return !content.some((part) => (part.type === "text" ? part.text.trim() : true));
}

function normalizeMessages(messages: any[]): ChatMessage[] {
  if (!Array.isArray(messages)) return [];
  return messages
    .map((message): ChatMessage => ({
      role: ["system", "user", "assistant"].includes(message?.role) ? message.role : "user",
      content: normalizeContent(message?.content),
    }))
    .filter((message) => !contentIsEmpty(message.content));
}

async function chat(
  messages: any[],
  onChunk?: (chunk: string) => void,
  responseFormat?: unknown,
  maxTokens = 8192,
): Promise<ChatResponse> {
  const cleanMessages = normalizeMessages(messages);
  if (!cleanMessages.length) throw new ApiError("Nội dung câu hỏi đang trống.", 400);

  const streaming = typeof onChunk === "function";
  const { signal, done } = timeoutSignal(streaming ? AI_STREAM_TIMEOUT_MS : AI_TIMEOUT_MS);

  try {
    const response = await fetch("/api/ai/chat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        messages: cleanMessages,
        max_tokens: maxTokens,
        stream: streaming,
        ...(responseFormat ? { response_format: responseFormat } : {}),
      }),
      signal,
    });

    if (!response.ok) throw new ApiError(await readError(response), response.status);

    if (!streaming) {
      const payload = await response.json().catch(() => null);
      const content = payload?.choices?.[0]?.message?.content;
      if (typeof content !== "string") {
        throw new ApiError("AI không trả về nội dung. Vui lòng thử lại.", 502);
      }
      return { choices: [{ message: { role: "assistant", content } }] };
    }

    const fullText = await consumeStream(response, onChunk!);
    return { choices: [{ message: { role: "assistant", content: fullText } }] };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ApiError("AI phản hồi quá lâu. Vui lòng thử lại.", 504);
    }
    throw new ApiError("Không kết nối được dịch vụ AI. Kiểm tra mạng rồi thử lại.", 0);
  } finally {
    done();
  }
}

export const api = {
  chat,

  async deepseekChat(
    messages: any[],
    _model?: string,
    onChunk?: (chunk: string) => void,
    responseFormat?: any,
  ): Promise<ChatResponse> {
    return chat(messages, onChunk, responseFormat);
  },

  async deepseekProcess(
    prompt: string,
    systemInstruction = "Bạn là chuyên gia tư vấn hướng nghiệp tại Việt Nam.",
    isJson = false,
    onChunk?: (chunk: string) => void,
  ) {
    const result = await chat(
      [
        { role: "system", content: systemInstruction },
        { role: "user", content: prompt },
      ],
      onChunk,
      isJson ? { type: "json_object" } : undefined,
    );
    return result.choices[0]?.message.content || "";
  },

  async register(name: string, username: string, password: string) {
    return requestJson(
      "/api/auth/register",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, username, password }),
      },
      AUTH_TIMEOUT_MS,
      false,
    );
  },

  async login(username: string, password: string) {
    return requestJson(
      "/api/auth/login",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username, password }),
      },
      AUTH_TIMEOUT_MS,
      false,
    );
  },

  async logout() {
    return requestJson("/api/auth/logout", { method: "POST" }, AUTH_TIMEOUT_MS);
  },

  async session() {
    return requestJson("/api/auth/session", {}, AUTH_TIMEOUT_MS, false);
  },

  async loadData(_userId?: string) {
    return requestJson("/api/user/data", {}, DATA_TIMEOUT_MS);
  },

  async syncData(userId: string, userData: Record<string, unknown>) {
    return requestJson(
      "/api/user/data",
      {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ userId, userData }),
      },
      DATA_TIMEOUT_MS,
    );
  },

  async syncUserData() {
    try {
      if (localStorage.getItem("smarm_logged_out") === "1") return;
    } catch {
      return;
    }
    const userStr = localStorage.getItem("smarm_user");
    if (!userStr) return;
    let user: any = {};
    try {
      user = JSON.parse(userStr);
    } catch {
      return;
    }
    if (!user?.userId) return;
    const skip = new Set(["smarm_user", "smarm_local_users", "smarm_logged_out", "smarm_test_music_muted"]);
    const userData: Record<string, unknown> = {};
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      if (!key || !key.startsWith("smarm_") || skip.has(key)) continue;
      const value = localStorage.getItem(key);
      try {
        userData[key] = JSON.parse(value || "null");
      } catch {
        userData[key] = value;
      }
    }
    return this.syncData(user.userId, userData);
  },

  async exaSearch(query: string, numResults = 5) {
    const payload = await requestJson(
      "/api/search",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ query, numResults, type: "auto" }),
      },
      SEARCH_TIMEOUT_MS,
    );
    return payload?.data?.results || payload?.results || [];
  },

  async exaSearchAdvanced(
    query: string,
    numResults = 5,
    options?: Record<string, unknown>,
  ) {
    const payload = await requestJson(
      "/api/search",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ query, numResults, ...(options ? { options } : {}) }),
      },
      SEARCH_TIMEOUT_MS,
    );
    return payload?.data || payload;
  },
};
