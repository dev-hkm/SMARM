import type { Env } from "./env";

export const DAILY_CHAT_LIMIT = 12;

export type ChatQuotaResult = {
  allowed: boolean;
  used: number;
  limit: number;
  date: string;
};

export function getVietnamDateKey(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export async function reserveChatMessage(
  db: Env["SMARM_DB"],
  userId: string,
  date = getVietnamDateKey(),
): Promise<ChatQuotaResult> {
  const row = await db
    .prepare(
      `INSERT INTO ai_chat_usage (user_id, usage_date, count)
       VALUES (?, ?, 1)
       ON CONFLICT(user_id, usage_date) DO UPDATE
       SET count = ai_chat_usage.count + 1, updated_at = CURRENT_TIMESTAMP
       WHERE ai_chat_usage.count < ?
       RETURNING count`,
    )
    .bind(userId, date, DAILY_CHAT_LIMIT)
    .first<{ count: number }>();

  if (!row) {
    return { allowed: false, used: DAILY_CHAT_LIMIT, limit: DAILY_CHAT_LIMIT, date };
  }

  return {
    allowed: true,
    used: row.count,
    limit: DAILY_CHAT_LIMIT,
    date,
  };
}

export function secondsUntilVietnamMidnight(now = new Date()): number {
  const date = getVietnamDateKey(now);
  const [year, month, day] = date.split("-").map(Number);
  const nextMidnightUtc = Date.UTC(year, month - 1, day + 1) - 7 * 60 * 60 * 1000;
  return Math.max(1, Math.ceil((nextMidnightUtc - now.getTime()) / 1000));
}
