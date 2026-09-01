/**
 * Read-only migration fingerprint:
 *   npx tsx --env-file=.env src/db/verify-multi-path-migration.ts
 *
 * 在 migration 前後各執行一次，baseFingerprints 必須完全相同。
 */
import { sql } from "drizzle-orm";
import { db } from "@/db";

type FingerprintRow = {
  entity: string;
  rowCount: number;
  digest: string;
};

function rowsOf<T>(result: unknown): T[] {
  if (Array.isArray(result)) return result as T[];
  if (
    result &&
    typeof result === "object" &&
    "rows" in result &&
    Array.isArray(result.rows)
  ) {
    return result.rows as T[];
  }
  throw new TypeError("無法識別 DB query result");
}

async function main() {
const baseFingerprints = rowsOf<FingerprintRow>(await db.execute(sql`
  SELECT
    'unit' AS entity,
    count(*)::int AS "rowCount",
    md5(coalesce(string_agg(id || ':' || title || ':' || position, ',' ORDER BY id), '')) AS digest
  FROM unit
  UNION ALL
  SELECT
    'lesson',
    count(*)::int,
    md5(coalesce(string_agg(id || ':' || unit_id || ':' || title || ':' || type || ':' || position || ':' || exam_points::text || ':' || rubric::text || ':' || coalesce(topic, '') || ':' || coalesce(intro::text, ''), ',' ORDER BY id), ''))
  FROM lesson
  UNION ALL
  SELECT
    'lesson_dependency',
    count(*)::int,
    md5(coalesce(string_agg(lesson_id || ':' || depends_on_lesson_id, ',' ORDER BY lesson_id, depends_on_lesson_id), ''))
  FROM lesson_dependency
  UNION ALL
  SELECT
    'mastery',
    count(*)::int,
    md5(coalesce(string_agg(user_id || ':' || lesson_id || ':' || score || ':' || assessed_at, ',' ORDER BY user_id, lesson_id), ''))
  FROM user_lesson_mastery
  UNION ALL
  SELECT
    'weakness',
    count(*)::int,
    md5(coalesce(string_agg(id || ':' || user_id || ':' || lesson_id || ':' || criterion || ':' || summary || ':' || created_at, ',' ORDER BY id), ''))
  FROM weakness_record
  UNION ALL
  SELECT
    'lesson_session',
    count(*)::int,
    md5(coalesce(string_agg(user_id || ':' || lesson_id || ':' || version || ':' || phase || ':' || messages::text || ':' || check_state::text || ':' || coalesce(units_state::text, '') || ':' || updated_at, ',' ORDER BY user_id, lesson_id), ''))
  FROM lesson_session
  UNION ALL
  SELECT
    'practice_session',
    count(*)::int,
    md5(coalesce(string_agg(user_id || ':' || lesson_id || ':' || exercise::text || ':' || user_code || ':' || status || ':' || updated_at, ',' ORDER BY user_id, lesson_id), ''))
  FROM practice_session
  UNION ALL
  SELECT
    'review_session',
    count(*)::int,
    md5(coalesce(string_agg(user_id || ':' || lesson_id || ':' || version || ':' || questions::text || ':' || results::text || ':' || current || ':' || source_weakness_ids::text || ':' || updated_at, ',' ORDER BY user_id, lesson_id), ''))
  FROM review_session
`));

const [{ migrated }] = rowsOf<{ migrated: boolean }>(await db.execute(sql`
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'unit'
      AND column_name = 'path_id'
  ) AS migrated
`));

const result: Record<string, unknown> = { baseFingerprints };

if (migrated) {
  result.multiPathState = rowsOf(await db.execute(sql`
    SELECT
      p.id AS "pathId",
      p.status,
      count(DISTINCT u.id)::int AS "unitCount",
      count(DISTINCT l.id)::int AS "lessonCount",
      count(DISTINCT l.id) FILTER (
        WHERE l.type = 'practice'
          AND l.practice_runtime IS NOT NULL
          AND l.practice_blueprint IS NOT NULL
      )::int AS "completePracticeCount"
    FROM learning_path p
    LEFT JOIN unit u ON u.path_id = p.id
    LEFT JOIN lesson l ON l.unit_id = u.id
    GROUP BY p.id, p.status
    ORDER BY p.id
  `));
  result.nullPathUnits = rowsOf(await db.execute(sql`
    SELECT count(*)::int AS count FROM unit WHERE path_id IS NULL
  `));
  result.reactLessonSlugs = rowsOf(await db.execute(sql`
    SELECT l.id
    FROM lesson l
    INNER JOIN unit u ON u.id = l.unit_id
    WHERE u.path_id = 'react-junior-mid'
    ORDER BY l.id
  `));
}

  console.log(JSON.stringify(result, null, 2));
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
