/**
 * TypeScript curriculum seed 前後只讀 fingerprint：
 *   npx tsx --env-file=.env src/db/verify-typescript-curriculum-seed.ts
 */
import { sql } from "drizzle-orm";
import { db } from "@/db";

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
  const protectedFingerprints = rowsOf(await db.execute(sql`
    SELECT
      'existing_unit' AS entity,
      count(*)::int AS "rowCount",
      md5(coalesce(string_agg(u.id || ':' || u.path_id || ':' || u.title || ':' || u.position, ',' ORDER BY u.id), '')) AS digest
    FROM unit u
    WHERE u.path_id IN ('javascript-interview-core', 'react-junior-mid')
    UNION ALL
    SELECT
      'existing_lesson',
      count(*)::int,
      md5(coalesce(string_agg(l.id || ':' || l.unit_id || ':' || l.title || ':' || l.type || ':' || l.position || ':' || l.exam_points::text || ':' || l.rubric::text || ':' || coalesce(l.topic, '') || ':' || coalesce(l.intro::text, '') || ':' || coalesce(l.practice_runtime, '') || ':' || coalesce(l.practice_blueprint::text, ''), ',' ORDER BY l.id), ''))
    FROM lesson l
    INNER JOIN unit u ON u.id = l.unit_id
    WHERE u.path_id IN ('javascript-interview-core', 'react-junior-mid')
    UNION ALL
    SELECT
      'existing_dependency',
      count(*)::int,
      md5(coalesce(string_agg(d.lesson_id || ':' || d.depends_on_lesson_id, ',' ORDER BY d.lesson_id, d.depends_on_lesson_id), ''))
    FROM lesson_dependency d
    INNER JOIN lesson l ON l.id = d.lesson_id
    INNER JOIN unit u ON u.id = l.unit_id
    WHERE u.path_id IN ('javascript-interview-core', 'react-junior-mid')
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
      md5(coalesce(string_agg(user_id || ':' || lesson_id || ':' || exercise::text || ':' || user_code || ':' || coalesce(user_files::text, '') || ':' || status || ':' || updated_at, ',' ORDER BY user_id, lesson_id), ''))
    FROM practice_session
    UNION ALL
    SELECT
      'review_session',
      count(*)::int,
      md5(coalesce(string_agg(user_id || ':' || lesson_id || ':' || version || ':' || questions::text || ':' || results::text || ':' || current || ':' || source_weakness_ids::text || ':' || updated_at, ',' ORDER BY user_id, lesson_id), ''))
    FROM review_session
  `));

  const paths = rowsOf(await db.execute(sql`
    SELECT
      p.id AS "pathId",
      p.status,
      p.position,
      count(DISTINCT u.id)::int AS "unitCount",
      count(DISTINCT l.id)::int AS "lessonCount",
      count(DISTINCT l.id) FILTER (WHERE l.type = 'concept')::int AS "conceptCount",
      count(DISTINCT l.id) FILTER (WHERE l.type = 'practice')::int AS "practiceCount"
    FROM learning_path p
    LEFT JOIN unit u ON u.path_id = p.id
    LEFT JOIN lesson l ON l.unit_id = u.id
    GROUP BY p.id, p.status, p.position
    ORDER BY p.position, p.id
  `));

  console.log(JSON.stringify({ protectedFingerprints, paths }, null, 2));
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
