import { readJson, writeJson } from "./localData";

// Research instruments: baseline question, post-guidance survey, and
// time-to-first-source timing. All keys are smarm_* so they sync to D1.

export const INSTRUMENT_VERSION = "v1";

export const PRESURVEY_KEY = "smarm_presurvey_v1";
export const SURVEY_KEY = "smarm_survey_v1";
export const GUIDANCE_START_KEY = "smarm_guidance_started_at";
export const FIRST_UNI_MS_KEY = "smarm_time_to_first_uni_ms";

export type PreSurvey = {
  version: string;
  at: string;
  value: number | null;
  skipped: boolean;
};

export type GuidanceSurvey = {
  version: string;
  at: string;
  hollandCode?: string;
  baseline: number | null;
  baselineSource: "pre" | "recall";
  foundNew: boolean | null;
  fit: number | null;
  nextStep: number | null;
  recommend: number | null;
};

export const readPreSurvey = () => readJson<PreSurvey | null>(PRESURVEY_KEY, null);
export const writePreSurvey = (value: PreSurvey) => writeJson(PRESURVEY_KEY, value);
export const readGuidanceSurvey = () => readJson<GuidanceSurvey | null>(SURVEY_KEY, null);
export const writeGuidanceSurvey = (value: GuidanceSurvey) => writeJson(SURVEY_KEY, value);

const readNumber = (key: string): number | null => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return typeof parsed === "number" && Number.isFinite(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

/** Start the clock when guidance results are shown; refresh if older than one hour. */
export function markGuidanceStart() {
  try {
    const startedAt = readNumber(GUIDANCE_START_KEY);
    const fresh = startedAt !== null && Date.now() - startedAt < 60 * 60 * 1000;
    if (!fresh) {
      localStorage.setItem(GUIDANCE_START_KEY, JSON.stringify(Date.now()));
      localStorage.removeItem(FIRST_UNI_MS_KEY);
    }
  } catch {
    /* storage unavailable */
  }
}

export function clearGuidanceStart() {
  try {
    localStorage.removeItem(GUIDANCE_START_KEY);
  } catch {
    /* storage unavailable */
  }
}

/** Record milliseconds from results shown to first opened university source. Once per session. */
export function recordFirstUniversityOpen() {
  try {
    if (localStorage.getItem(FIRST_UNI_MS_KEY)) return;
    const startedAt = readNumber(GUIDANCE_START_KEY);
    if (startedAt === null) return;
    const elapsed = Date.now() - startedAt;
    if (elapsed < 0 || elapsed > 2 * 60 * 60 * 1000) return;
    localStorage.setItem(
      FIRST_UNI_MS_KEY,
      JSON.stringify({ ms: elapsed, at: new Date().toISOString() }),
    );
  } catch {
    /* storage unavailable */
  }
}
