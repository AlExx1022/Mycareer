import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const migration = readFileSync(
  join(process.cwd(), "drizzle/0008_multi_path_learning_foundation.sql"),
  "utf8",
);

const orderedMarkers = [
  'ALTER TABLE "unit" ADD COLUMN "path_id" text;',
  'INSERT INTO "learning_path"',
  'UPDATE "unit"',
  "multi-path migration aborted: unit.path_id backfill incomplete",
  'ALTER TABLE "unit" ALTER COLUMN "path_id" SET NOT NULL;',
  'ADD CONSTRAINT "unit_path_id_learning_path_id_fk"',
  'CREATE INDEX "unit_pathId_idx"',
];

let previousIndex = -1;
for (const marker of orderedMarkers) {
  const markerIndex = migration.indexOf(marker);
  assert.ok(markerIndex > previousIndex, `migration 順序錯誤或缺少：${marker}`);
  previousIndex = markerIndex;
}

assert.match(migration, /lesson_practice_runtime_check/);
assert.match(
  migration,
  /'react-ts'[\s\S]*'vanilla-ts'[\s\S]*'vanilla-js'[\s\S]*'python'/,
);
assert.doesNotMatch(migration, /UPDATE\s+"lesson"/i, "migration 不得重寫 lesson slug 或內容");

const baseline = JSON.parse(
  readFileSync(
    join(process.cwd(), "drizzle/verification/0008_multi_path_pre.json"),
    "utf8",
  ),
) as {
  migrationApplied: boolean;
  baseFingerprints: { entity: string; rowCount: number; digest: string }[];
};
const postMigration = JSON.parse(
  readFileSync(
    join(process.cwd(), "drizzle/verification/0008_multi_path_post.json"),
    "utf8",
  ),
) as {
  migrationApplied: boolean;
  baseFingerprints: { entity: string; rowCount: number; digest: string }[];
  multiPathState: Array<{
    pathId: string;
    unitCount: number;
    lessonCount: number;
    completePracticeCount: number;
  }>;
  nullPathUnitCount: number;
  reactLessonSlugCount: number;
};
assert.equal(baseline.migrationApplied, false);
assert.equal(postMigration.migrationApplied, true);
assert.deepEqual(
  postMigration.baseFingerprints,
  baseline.baseFingerprints,
  "migration 前後既有資料 fingerprint 不一致",
);
assert.equal(
  baseline.baseFingerprints.find(({ entity }) => entity === "unit")?.rowCount,
  2,
);
assert.equal(
  baseline.baseFingerprints.find(({ entity }) => entity === "lesson")?.rowCount,
  24,
);
assert.equal(
  baseline.baseFingerprints.find(({ entity }) => entity === "lesson_dependency")
    ?.rowCount,
  27,
);
assert.ok(
  baseline.baseFingerprints.every(({ digest }) => /^[a-f0-9]{32}$/.test(digest)),
  "migration baseline digest 格式錯誤",
);
assert.deepEqual(postMigration.multiPathState, [
  {
    pathId: "react-junior-mid",
    status: "published",
    unitCount: 2,
    lessonCount: 24,
    completePracticeCount: 4,
  },
]);
assert.equal(postMigration.nullPathUnitCount, 0);
assert.equal(postMigration.reactLessonSlugCount, 24);

console.log("multi-path migration self-check OK");
