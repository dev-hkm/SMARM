import type { Env } from "./env";
import { getFireworksKey, getOpenAiKey, getOpenRouterKey } from "./secrets";

export type ChatRole = "system" | "user" | "assistant";

export type ChatMessage = { role: ChatRole; content: string };

export type ResponseFormat = Record<string, unknown>;

export type ChatRequest = {
  messages: ChatMessage[];
  maxTokens: number;
  stream: boolean;
  responseFormat?: ResponseFormat;
};

export type AiAttempt = {
  provider: string;
  model: string;
  status?: number;
  reason: string;
};

export type ChatJsonOutcome = {
  kind: "json";
  payload: any;
  model: string;
  provider: string;
  attempts: AiAttempt[];
};

export type ChatStreamOutcome = {
  kind: "stream";
  response: Response;
  model: string;
  provider: string;
  attempts: AiAttempt[];
};

export type ChatOutcome = ChatJsonOutcome | ChatStreamOutcome;

export class AiProviderError extends Error {
  status: number;
  attempts: AiAttempt[];

  constructor(message: string, status: number, attempts: AiAttempt[]) {
    super(message);
    this.name = "AiProviderError";
    this.status = status;
    this.attempts = attempts;
  }
}

const OPENAI_ENDPOINT = "https://api.openai.com/v1/chat/completions";
const OPENROUTER_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";
const FIREWORKS_ENDPOINT = "https://api.fireworks.ai/inference/v1/chat/completions";

const DEFAULT_MODEL = "gpt-6-luna";
const DEFAULT_FALLBACKS = ["gpt-5.6-luna", "gpt-5.4-mini"];
const OPENROUTER_DEFAULT_MODELS = ["xiaomi/mimo-v2.6-flash", "z-ai/glm-5.3-flash"];
const FIREWORKS_DEFAULT_MODELS = [
  "accounts/fireworks/models/glm-5p3-flash",
  "accounts/fireworks/models/glm-5p3",
];

const VALID_EFFORT = ["none", "minimal", "low", "medium", "high"];
const RETRYABLE_STATUS = new Set([408, 409, 425, 429, 500, 502, 503, 504]);

type Target = {
  provider: string;
  model: string;
  endpoint: string;
  apiKey: string;
  style: "completion-tokens" | "max-tokens";
};

function dedupe(values: string[]): string[] {
  return values.filter((value, index) => value.length > 0 && values.indexOf(value) === index);
}

export function getOpenAiModels(env: Env): string[] {
  return dedupe([
    (env.OPENAI_MODEL || "").trim() || DEFAULT_MODEL,
    (env.OPENAI_FALLBACK_MODEL || "").trim(),
    ...DEFAULT_FALLBACKS,
  ]);
}

export function getOpenRouterModels(env: Env): string[] {
  return dedupe([
    (env.OPENROUTER_MODEL || "").trim(),
    (env.OPENROUTER_FALLBACK_MODEL || "").trim(),
    ...OPENROUTER_DEFAULT_MODELS,
  ]);
}

export function getFireworksModels(env: Env): string[] {
  return dedupe([
    (env.FIREWORKS_MODEL || "").trim(),
    (env.FIREWORKS_FALLBACK_MODEL || "").trim(),
    ...FIREWORKS_DEFAULT_MODELS,
  ]);
}

function getTargets(env: Env): Target[] {
  const targets: Target[] = [];

  const openAiKey = getOpenAiKey(env);
  if (openAiKey) {
    for (const model of getOpenAiModels(env)) {
      targets.push({
        provider: "OpenAI",
        model,
        endpoint: OPENAI_ENDPOINT,
        apiKey: openAiKey,
        style: "completion-tokens",
      });
    }
  }

  const openRouterKey = getOpenRouterKey(env);
  if (openRouterKey) {
    for (const model of getOpenRouterModels(env)) {
      targets.push({
        provider: "OpenRouter",
        model,
        endpoint: OPENROUTER_ENDPOINT,
        apiKey: openRouterKey,
        style: "max-tokens",
      });
    }
  }

  const fireworksKey = getFireworksKey(env);
  if (fireworksKey) {
    for (const model of getFireworksModels(env)) {
      targets.push({
        provider: "Fireworks",
        model,
        endpoint: FIREWORKS_ENDPOINT,
        apiKey: fireworksKey,
        style: "max-tokens",
      });
    }
  }

  return targets;
}

function getReasoningEffort(env: Env): string {
  const value = (env.OPENAI_REASONING_EFFORT || "low").trim().toLowerCase();
  return VALID_EFFORT.includes(value) ? value : "low";
}

function buildPayload(options: {
  target: Target;
  request: ChatRequest;
  effort: string;
  minimal: boolean;
}): Record<string, unknown> {
  const { target, request, effort, minimal } = options;
  const payload: Record<string, unknown> = {
    model: target.model,
    messages: request.messages,
    stream: request.stream,
  };

  if (target.style === "completion-tokens") {
    // GPT-6 Luna rejects `temperature` (only the default is allowed) and uses
    // `max_completion_tokens` instead of `max_tokens`.
    payload.max_completion_tokens = request.maxTokens;
    if (!minimal) {
      payload.reasoning_effort = effort;
      if (request.responseFormat) payload.response_format = request.responseFormat;
    }
  } else {
    payload.max_tokens = request.maxTokens;
    if (target.provider === "Fireworks") {
      // GLM-5.3 on Fireworks is thinking-only: "none"/disabled is rejected, and
      // "low" keeps reasoning short enough that answer content actually streams.
      payload.reasoning_effort = "low";
    }
    if (!minimal && request.responseFormat) payload.response_format = request.responseFormat;
  }

  return payload;
}

function buildHeaders(target: Target): Record<string, string> {
  const headers: Record<string, string> = {
    "content-type": "application/json",
    authorization: `Bearer ${target.apiKey}`,
  };
  if (target.provider === "OpenRouter") {
    headers["http-referer"] = "https://smarm.pages.dev";
    headers["x-title"] = "SMARM";
  }
  return headers;
}

async function callTarget(options: {
  target: Target;
  request: ChatRequest;
  effort: string;
  minimal: boolean;
}): Promise<{ response?: Response; attempt?: AiAttempt }> {
  const { target, request } = options;
  const controller = new AbortController();
  // A streaming call only needs to survive until the upstream starts responding;
  // the body is piped straight to the client afterwards.
  const timeoutMs = request.stream ? 45000 : 120000;
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(target.endpoint, {
      method: "POST",
      headers: buildHeaders(target),
      body: JSON.stringify(
        buildPayload({ target, request, effort: options.effort, minimal: options.minimal }),
      ),
      signal: controller.signal,
    });

    if (!response.ok) {
      const reason = (await response.text().catch(() => "")).slice(0, 400);
      return {
        attempt: {
          provider: target.provider,
          model: target.model,
          status: response.status,
          reason: reason || `HTTP ${response.status}`,
        },
      };
    }

    return { response };
  } catch (error) {
    return {
      attempt: {
        provider: target.provider,
        model: target.model,
        reason:
          controller.signal.aborted
            ? `Hết thời gian chờ sau ${Math.round(timeoutMs / 1000)}s.`
            : error instanceof Error
              ? error.message
              : "Lỗi mạng không xác định.",
      },
    };
  } finally {
    clearTimeout(timer);
  }
}

async function readJson(response: Response): Promise<any | null> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export function hasAssistantContent(payload: any): boolean {
  const content = payload?.choices?.[0]?.message?.content;
  if (typeof content === "string" && content.trim().length > 0) return true;
  // OpenRouter may surface the message under `reasoning` when a provider splits
  // reasoning and answer content.
  const reasoning = payload?.choices?.[0]?.message?.reasoning;
  return typeof reasoning === "string" && reasoning.trim().length > 0;
}

function getMessageContent(payload: any): string {
  const message = payload?.choices?.[0]?.message;
  if (typeof message?.content === "string" && message.content.trim()) return message.content;
  if (typeof message?.reasoning === "string" && message.reasoning.trim()) return message.reasoning;
  return "";
}

export function normalizeChatPayload(payload: any, model: string, provider: string) {
  const created =
    typeof payload?.created === "number" ? payload.created : Math.floor(Date.now() / 1000);
  const usage = payload?.usage && typeof payload.usage === "object" ? payload.usage : undefined;
  const finishReason = payload?.choices?.[0]?.finish_reason ?? "stop";

  return {
    id: typeof payload?.id === "string" ? payload.id : `smarm-${Date.now()}`,
    object: "chat.completion",
    created,
    model,
    provider,
    choices: [
      {
        index: 0,
        finish_reason: finishReason,
        message: {
          role: "assistant",
          content: getMessageContent(payload),
        },
      },
    ],
    ...(usage ? { usage } : {}),
  };
}

async function completeAttempt(
  response: Response,
  target: Target,
  request: ChatRequest,
  attempts: AiAttempt[],
): Promise<ChatOutcome | null> {
  if (request.stream) {
    if (!response.body) {
      attempts.push({
        provider: target.provider,
        model: target.model,
        reason: "Phản hồi không có nội dung để stream.",
      });
      return null;
    }
    return {
      kind: "stream",
      response,
      model: target.model,
      provider: target.provider,
      attempts,
    };
  }

  const payload = await readJson(response);
  if (!payload || !hasAssistantContent(payload)) {
    attempts.push({
      provider: target.provider,
      model: target.model,
      reason: "Phản hồi rỗng hoặc không đúng định dạng.",
    });
    return null;
  }

  return {
    kind: "json",
    payload,
    model: target.model,
    provider: target.provider,
    attempts,
  };
}

export async function runChat(env: Env, request: ChatRequest): Promise<ChatOutcome> {
  const targets = getTargets(env);
  if (!targets.length) throw new AiProviderError("Dịch vụ AI chưa được cấu hình.", 503, []);

  const attempts: AiAttempt[] = [];
  const effort = getReasoningEffort(env);

  let currentProvider = "";
  let authFailed = false;

  for (const target of targets) {
    if (target.provider !== currentProvider) {
      currentProvider = target.provider;
      authFailed = false;
    }
    if (authFailed) continue;

    for (let attemptIndex = 0; attemptIndex < 2; attemptIndex += 1) {
      const result = await callTarget({ target, request, effort, minimal: false });

      if (result.response) {
        const outcome = await completeAttempt(result.response, target, request, attempts);
        if (outcome) return outcome;
        break;
      }

      const attempt = result.attempt!;
      attempts.push(attempt);

      // A bad key fails for every model of that provider; move to the next provider.
      if (attempt.status === 401 || attempt.status === 403) {
        authFailed = true;
        break;
      }

      if (attempt.status === 400) {
        const minimalResult = await callTarget({ target, request, effort, minimal: true });
        if (minimalResult.response) {
          const outcome = await completeAttempt(
            minimalResult.response,
            target,
            request,
            attempts,
          );
          if (outcome) return outcome;
        } else {
          attempts.push(minimalResult.attempt!);
        }
        break;
      }

      if (attempt.status && !RETRYABLE_STATUS.has(attempt.status)) break;
      if (attemptIndex === 0) await new Promise((resolve) => setTimeout(resolve, 400));
    }
  }

  throw new AiProviderError("Dịch vụ AI tạm thời không phản hồi.", 502, attempts);
}
