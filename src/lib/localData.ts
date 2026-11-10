const CLASSES = ["class10", "class11", "class12"] as const;
const SEMESTERS = ["semester1", "semester2"] as const;

export type GradeEntry = {
  regular: number[];
  mid: number | null;
  final: number | null;
};

export type GradeBook = Record<string, Record<string, Record<string, GradeEntry>>>;

export function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    const parsed = JSON.parse(raw);
    return parsed === null || parsed === undefined ? fallback : (parsed as T);
  } catch {
    return fallback;
  }
}

export function readArray<T = unknown>(key: string, fallback: T[] = []): T[] {
  const value = readJson<unknown>(key, fallback);
  return Array.isArray(value) ? (value as T[]) : fallback;
}

/**
 * Reads a text value that may have been written either raw or JSON-encoded
 * (older builds used setItem while writes now go through writeJson).
 */
export function readText(key: string, fallback = ""): string {
  let raw: string | null;
  try {
    raw = localStorage.getItem(key);
  } catch {
    return fallback;
  }
  if (raw === null) return fallback;

  let value: unknown = raw;
  for (let depth = 0; depth < 2; depth += 1) {
    if (typeof value !== "string") break;
    const trimmed = value.trim();
    const looksEncoded =
      (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
      trimmed.startsWith("{") ||
      trimmed.startsWith("[");
    if (!looksEncoded) break;
    try {
      value = JSON.parse(trimmed);
    } catch {
      break;
    }
  }
  return typeof value === "string" ? value : fallback;
}

export function writeJson(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`[storage] Không lưu được ${key}`, error);
    return false;
  }
}

const toScore = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

export function normalizeGrades(raw: unknown): GradeBook {
  const source =
    raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
  const book: GradeBook = {};

  for (const className of CLASSES) {
    const sourceClass =
      source[className] && typeof source[className] === "object" && !Array.isArray(source[className])
        ? (source[className] as Record<string, unknown>)
        : {};
    book[className] = {};

    for (const semester of SEMESTERS) {
      const sourceSemester =
        sourceClass[semester] &&
        typeof sourceClass[semester] === "object" &&
        !Array.isArray(sourceClass[semester])
          ? (sourceClass[semester] as Record<string, unknown>)
          : {};
      const semesterBook: Record<string, GradeEntry> = {};

      for (const [subject, value] of Object.entries(sourceSemester)) {
        const entry =
          value && typeof value === "object" && !Array.isArray(value)
            ? (value as Record<string, unknown>)
            : {};
        semesterBook[subject] = {
          regular: Array.isArray(entry.regular)
            ? entry.regular.map(toScore).filter((score): score is number => score !== null)
            : [],
          mid: toScore(entry.mid),
          final: toScore(entry.final),
        };
      }

      book[className][semester] = semesterBook;
    }
  }

  return book;
}
