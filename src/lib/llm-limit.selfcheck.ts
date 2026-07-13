// 最小 self-check：npx tsx --env-file=.env src/lib/llm-limit.selfcheck.ts
// 會實際打 DB（llm_usage 表），跑完自行清除測試列。
import assert from "node:assert";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { llmUsage, user } from "@/db/schema";
import { consumeLlmQuota, utcDay } from "./llm-limit";

assert.equal(utcDay(new Date("2026-07-13T23:59:00Z")), "2026-07-13");
assert.equal(utcDay(new Date("2026-07-14T00:01:00Z")), "2026-07-14");

async function main() {
  const [anyUser] = await db.select({ id: user.id }).from(user).limit(1);
  assert.ok(anyUser, "DB 需至少一個 user");

  const day = utcDay(new Date());
  const clean = () =>
    db
      .delete(llmUsage)
      .where(and(eq(llmUsage.userId, anyUser.id), eq(llmUsage.day, day)));

  await clean();
  assert.equal(await consumeLlmQuota(anyUser.id, 2), true); // 1/2
  assert.equal(await consumeLlmQuota(anyUser.id, 2), true); // 2/2
  assert.equal(await consumeLlmQuota(anyUser.id, 2), false); // 3/2 超額
  await clean();

  console.log("llm-limit self-check OK");
}

main();
