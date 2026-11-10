export type Env = {
  SMARM_DB: D1Database;
  AUTH_SECRET: string;
  EXA_API_KEY?: string;
  EXA_API_KEY_2?: string;
  EXA_API_KEY_3?: string;
  TINYFISH_API_KEY?: string;
  OPENAI_API_KEY?: string;
  OPENAI_MODEL?: string;
  OPENAI_FALLBACK_MODEL?: string;
  OPENAI_REASONING_EFFORT?: string;
  OPENROUTER_API_KEY?: string;
  OPENROUTER_MODEL?: string;
  OPENROUTER_FALLBACK_MODEL?: string;
  FIREWORKS_API_KEY?: string;
  FIREWORKS_MODEL?: string;
  FIREWORKS_FALLBACK_MODEL?: string;
};
