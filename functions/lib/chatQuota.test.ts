import assert from "node:assert/strict";
import test from "node:test";
import {
  DAILY_CHAT_LIMIT,
  getVietnamDateKey,
  reserveChatMessage,
  secondsUntilVietnamMidnight,
} from "./chatQuota";

class MemoryD1 {
  private readonly usage = new Map<string, number>();

  prepare(query: string) {
    assert.match(query, /ON CONFLICT\s*\(user_id, usage_date\)/i);
    assert.match(query, /WHERE [\w.]*count < \?/i);
    assert.match(query, /RETURNING count/i);
    let values: unknown[] = [];
    const statement = {
      bind: (...bound: unknown[]) => {
        values = bound;
        return statement;
      },
      first: async <T,>() => {
        const [userId, date, limit] = values as [string, string, number];
        const key = `${userId}:${date}`;
        const count = this.usage.get(key) ?? 0;
        if (count >= limit) return null;
        this.usage.set(key, count + 1);
        return { count: count + 1 } as T;
      },
    };
    return statement;
  }
}

test("allows 12 AI requests and rejects the 13th for the same user and day", async () => {
  const db = new MemoryD1() as any;
  const results = await Promise.all(
    Array.from({ length: DAILY_CHAT_LIMIT + 1 }, () =>
      reserveChatMessage(db, "user-a", "2026-11-09"),
    ),
  );

  assert.equal(results.filter((result) => result.allowed).length, DAILY_CHAT_LIMIT);
  assert.equal(results.filter((result) => !result.allowed).length, 1);
});

test("keeps users and Vietnam calendar days in separate quota buckets", async () => {
  const db = new MemoryD1() as any;
  for (let index = 0; index < DAILY_CHAT_LIMIT; index += 1) {
    await reserveChatMessage(db, "user-a", "2026-11-09");
  }

  assert.equal((await reserveChatMessage(db, "user-a", "2026-11-09")).allowed, false);
  assert.equal((await reserveChatMessage(db, "user-b", "2026-11-09")).allowed, true);
  assert.equal((await reserveChatMessage(db, "user-a", "2026-11-10")).allowed, true);
});

test("uses Vietnam midnight for quota reset boundaries", () => {
  assert.equal(getVietnamDateKey(new Date("2026-11-08T16:59:59.000Z")), "2026-11-08");
  assert.equal(getVietnamDateKey(new Date("2026-11-08T17:00:00.000Z")), "2026-11-09");
  assert.equal(secondsUntilVietnamMidnight(new Date("2026-11-08T17:00:00.000Z")), 86400);
});
