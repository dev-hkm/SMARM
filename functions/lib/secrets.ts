import type { Env } from "./env";

export function normalizeSecret(value: unknown): string {
  if (typeof value !== "string") return "";
  let trimmed = value.trim();
  if (!trimmed || trimmed === '""' || trimmed === "''") return "";
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    trimmed = trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

export function getExaKeys(env: Env): string[] {
  return [
    env.EXA_API_KEY,
    env.EXA_API_KEY_2,
    env.EXA_API_KEY_3,
    env.EXA_API_KEY_4,
    env.EXA_API_KEY_5,
    env.EXA_API_KEY_6,
  ]
    .map(normalizeSecret)
    .filter((key, index, all) => key.length > 0 && all.indexOf(key) === index);
}

export function getTinyFishKey(env: Env): string {
  return normalizeSecret(env.TINYFISH_API_KEY);
}

export function getRiverKey(env: Env): string {
  return normalizeSecret(env.RIVER_API_KEY);
}

export function getOpenAiKey(env: Env): string {
  return normalizeSecret(env.OPENAI_API_KEY);
}

export function getOpenRouterKey(env: Env): string {
  return normalizeSecret(env.OPENROUTER_API_KEY);
}

export function getFireworksKey(env: Env): string {
  return normalizeSecret(env.FIREWORKS_API_KEY);
}
