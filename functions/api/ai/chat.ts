import { getSessionUserId } from "../../lib/auth";
import { error, json, readJson } from "../../lib/http";
import type { Env } from "../../lib/env";
import {
  DAILY_CHAT_LIMIT,
  reserveChatMessage,
  secondsUntilVietnamMidnight,
} from "../../lib/chatQuota";
import {
  AiProviderError,
  normalizeChatPayload,
  runChat,
  type ChatMessage,
  type ResponseFormat,
} from "../../lib/ai";

const MAX_MESSAGES = 30;
const MAX_MESSAGE_CHARS = 100_000;
const MAX_IMAGES_PER_MESSAGE = 3;
const MAX_IMAGE_CHARS = 2_000_000;
const IMAGE_DATA_URL = /^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/;

function sanitizeContent(content: unknown): ChatMessage["content"] | null {
  if (typeof content === "string") return content.slice(0, MAX_MESSAGE_CHARS);
  if (!Array.isArray(content)) return null;

  const parts: ChatMessage["content"] = [];
  let images = 0;
  let totalChars = 0;
  for (const part of content) {
    if (typeof part?.text === "string" && part.text.trim()) {
      const text = part.text.slice(0, MAX_MESSAGE_CHARS);
      totalChars += text.length;
      parts.push({ type: "text", text });
      continue;
    }
    const url = part?.image_url?.url;
    if (
      part?.type === "image_url" &&
      typeof url === "string" &&
      images < MAX_IMAGES_PER_MESSAGE &&
      url.length <= MAX_IMAGE_CHARS &&
      IMAGE_DATA_URL.test(url)
    ) {
      images += 1;
      totalChars += url.length;
      parts.push({ type: "image_url", image_url: { url } });
    }
  }
  if (totalChars > MAX_MESSAGE_CHARS * 2) return null;
  return parts.length ? parts : null;
}

function sanitizeMessages(value: unknown): ChatMessage[] {
  if (!Array.isArray(value)) return [];
  return value
    .slice(0, MAX_MESSAGES)
    .map((message): ChatMessage | null => {
      const content = sanitizeContent(message?.content);
      if (content === null) return null;
      return {
        role: ["system", "user", "assistant"].includes(message?.role) ? message.role : "user",
        content,
      };
    })
    .filter((message): message is ChatMessage => message !== null);
}

function sanitizeResponseFormat(value: unknown): ResponseFormat | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const type = (value as Record<string, unknown>).type;
  if (type !== "json_object" && type !== "json_schema") return undefined;
  return value as ResponseFormat;
}

export async function onRequestPost({ request, env }: { request: Request; env: Env }) {
  const userId = await getSessionUserId(request, env);
  if (!userId) {
    return error("Vui lòng đăng nhập để dùng trợ lý AI.", 401);
  }

  const body = await readJson(request);
  const messages = sanitizeMessages(body?.messages);
  if (!messages.length) return error("Danh sách tin nhắn không hợp lệ.");

  const rawMaxTokens = body?.max_tokens ?? body?.max_completion_tokens;
  const maxTokens =
    typeof rawMaxTokens === "number" && Number.isFinite(rawMaxTokens)
      ? Math.max(1, Math.min(8192, Math.floor(rawMaxTokens)))
      : 8192;

  const stream = body?.stream === true;
  const responseFormat = sanitizeResponseFormat(body?.response_format);

  // Reserve atomically before contacting a provider so concurrent requests
  // cannot exceed the per-account daily limit or spend provider credits.
  const quota = await reserveChatMessage(env.SMARM_DB, userId);
  if (!quota.allowed) {
    return json(
      {
        status: "error",
        ok: false,
        message: `Bạn đã dùng hết ${DAILY_CHAT_LIMIT} lượt AI hôm nay. Hạn mức sẽ được làm mới lúc 00:00 (giờ Việt Nam).`,
        quota: { limit: quota.limit, used: quota.used, remaining: 0, date: quota.date },
      },
      429,
      { "retry-after": String(secondsUntilVietnamMidnight()) },
    );
  }

  try {
    const outcome = await runChat(env, {
      messages,
      maxTokens,
      stream,
      ...(responseFormat ? { responseFormat } : {}),
    });

    const headers = {
      "cache-control": "no-store",
      "x-smarm-ai-provider": outcome.provider,
      "x-smarm-ai-model": outcome.model,
      "x-smarm-ai-fallbacks": String(outcome.attempts.length),
      "x-smarm-ai-quota-limit": String(quota.limit),
      "x-smarm-ai-quota-remaining": String(quota.limit - quota.used),
    };

    if (outcome.kind === "stream") {
      return new Response(outcome.response.body, {
        status: 200,
        headers: {
          "content-type":
            outcome.response.headers.get("content-type") || "text/event-stream; charset=utf-8",
          "x-accel-buffering": "no",
          ...headers,
        },
      });
    }

    return json(
      normalizeChatPayload(outcome.payload, outcome.model, outcome.provider),
      200,
      headers,
    );
  } catch (err) {
    if (err instanceof AiProviderError) {
      console.error("AI failed", err.attempts);
      return error(err.message, err.status);
    }
    console.error("AI crashed", err);
    return error("Dịch vụ AI gặp lỗi không xác định.", 502);
  }
}
