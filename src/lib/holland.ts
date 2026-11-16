export const HOLLAND_GROUPS = ['R', 'I', 'A', 'S', 'E', 'C'] as const;
export type HollandGroup = (typeof HOLLAND_GROUPS)[number];

export const SCALE_MIN = 1;
export const SCALE_MAX = 5;
export const QUESTIONS_PER_GROUP = 10;
export const GROUP_MIN_SCORE = QUESTIONS_PER_GROUP * SCALE_MIN;
export const GROUP_MAX_SCORE = QUESTIONS_PER_GROUP * SCALE_MAX;

const ANSWERS_KEY = 'smarm_answers';
const ANSWERS_SCALE_KEY = 'smarm_answers_scale';
const ANSWERS_SCALE = '1-5';

export const writeAnswers = (answers: Record<string, number>) => {
  try {
    localStorage.setItem(ANSWERS_KEY, JSON.stringify(answers));
    localStorage.setItem(ANSWERS_SCALE_KEY, ANSWERS_SCALE);
  } catch {
    /* storage may be full or blocked */
  }
};

export const readAnswers = (): Record<string, number> => {
  try {
    const raw = localStorage.getItem(ANSWERS_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};

    const answers: Record<string, number> = {};
    for (const [id, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof value === 'number' && Number.isFinite(value)) answers[id] = value;
    }
    if (localStorage.getItem(ANSWERS_SCALE_KEY) === ANSWERS_SCALE) return answers;
    if (Object.keys(answers).length === 0) return answers;

    // Legacy answers used a 0–4 scale; shift them once so 0–4 becomes 1–5.
    const migrated: Record<string, number> = {};
    for (const [id, value] of Object.entries(answers)) {
      migrated[id] = Math.min(SCALE_MAX, Math.max(SCALE_MIN, value + 1));
    }
    writeAnswers(migrated);
    return migrated;
  } catch {
    return {};
  }
};

export const clearAnswers = () => {
  try {
    localStorage.removeItem(ANSWERS_KEY);
    localStorage.removeItem(ANSWERS_SCALE_KEY);
  } catch {
    /* ignore */
  }
};

export const normalizeGroupScore = (rawScore: number) =>
  Math.round(((rawScore - GROUP_MIN_SCORE) / (GROUP_MAX_SCORE - GROUP_MIN_SCORE)) * 100);
