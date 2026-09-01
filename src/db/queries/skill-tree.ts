import { and, eq, gte, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  learningPath,
  learningPathRecommendation,
  unit,
  lesson,
  lessonDependency,
  userLessonMastery,
} from "@/db/schema";
import { effectiveScore, isCracked } from "@/lib/mastery-decay";

export type LearningPathMetadata = {
  id: string;
  title: string;
  description: string;
  subject: string;
  codeLanguage: string;
  position: number;
};

export type RecommendedPath = Pick<
  LearningPathMetadata,
  "id" | "title" | "subject"
>;

export type LearningPathSummary = LearningPathMetadata & {
  completedLessons: number;
  totalLessons: number;
  recommendedPrerequisites: RecommendedPath[];
};

export type SkillTreeLesson = {
  id: string;
  title: string;
  type: "concept" | "practice";
  topic: string | null;
  dependsOn: string[];
  mastery: {
    score: number;
    assessedAt: Date;
    effective: number;
    cracked: boolean;
  } | null;
};

export type SkillTreeUnit = {
  id: string;
  title: string;
  lessons: SkillTreeLesson[];
};

export type SkillTreeData = {
  path: LearningPathMetadata;
  recommendedPrerequisites: RecommendedPath[];
  units: SkillTreeUnit[];
};

const publishedPathFields = {
  id: learningPath.id,
  title: learningPath.title,
  description: learningPath.description,
  subject: learningPath.subject,
  codeLanguage: learningPath.codeLanguage,
  position: learningPath.position,
};

async function getRecommendations(
  pathIds: string[],
): Promise<Map<string, RecommendedPath[]>> {
  const byPath = new Map<string, RecommendedPath[]>();
  if (pathIds.length === 0) return byPath;

  const rows = await db
    .select({
      pathId: learningPathRecommendation.pathId,
      id: learningPath.id,
      title: learningPath.title,
      subject: learningPath.subject,
    })
    .from(learningPathRecommendation)
    .innerJoin(
      learningPath,
      eq(
        learningPathRecommendation.recommendedPathId,
        learningPath.id,
      ),
    )
    .where(
      and(
        inArray(learningPathRecommendation.pathId, pathIds),
        eq(learningPath.status, "published"),
      ),
    )
    .orderBy(learningPath.position);

  for (const row of rows) {
    const list = byPath.get(row.pathId) ?? [];
    list.push({ id: row.id, title: row.title, subject: row.subject });
    byPath.set(row.pathId, list);
  }
  return byPath;
}

/** 路徑目錄專用查詢，不載入 lesson 的策展 payload。 */
async function attachLearningPathProgress(
  userId: string,
  paths: LearningPathMetadata[],
): Promise<LearningPathSummary[]> {
  if (paths.length === 0) return [];

  const pathIds = paths.map((path) => path.id);
  const [totals, completions, recommendations] = await Promise.all([
    db
      .select({
        pathId: unit.pathId,
        count: sql<number>`count(${lesson.id})::int`,
      })
      .from(unit)
      .innerJoin(lesson, eq(lesson.unitId, unit.id))
      .where(inArray(unit.pathId, pathIds))
      .groupBy(unit.pathId),
    db
      .select({
        pathId: unit.pathId,
        count: sql<number>`count(${userLessonMastery.lessonId})::int`,
      })
      .from(userLessonMastery)
      .innerJoin(lesson, eq(userLessonMastery.lessonId, lesson.id))
      .innerJoin(unit, eq(lesson.unitId, unit.id))
      .where(
        and(
          eq(userLessonMastery.userId, userId),
          gte(userLessonMastery.score, 70),
          inArray(unit.pathId, pathIds),
        ),
      )
      .groupBy(unit.pathId),
    getRecommendations(pathIds),
  ]);

  const totalByPath = new Map(totals.map((row) => [row.pathId, row.count]));
  const completedByPath = new Map(
    completions.map((row) => [row.pathId, row.count]),
  );

  return paths.map((path) => ({
    ...path,
    completedLessons: completedByPath.get(path.id) ?? 0,
    totalLessons: totalByPath.get(path.id) ?? 0,
    recommendedPrerequisites: recommendations.get(path.id) ?? [],
  }));
}

/** 公開路徑目錄專用查詢，不載入 lesson 的策展 payload。 */
export async function getPublishedLearningPathsForUser(
  userId: string,
): Promise<LearningPathSummary[]> {
  const paths = await db
    .select(publishedPathFields)
    .from(learningPath)
    .where(eq(learningPath.status, "published"))
    .orderBy(learningPath.position);

  return attachLearningPathProgress(userId, paths);
}

/** 非 production preview 入口專用；環境與 allowlist 由呼叫端 server guard。 */
export async function getDraftLearningPathForUser(
  userId: string,
  pathId: string,
): Promise<LearningPathSummary | null> {
  const [path] = await db
    .select(publishedPathFields)
    .from(learningPath)
    .where(
      and(eq(learningPath.id, pathId), eq(learningPath.status, "draft")),
    );
  if (!path) return null;

  const [summary] = await attachLearningPathProgress(userId, [path]);
  return summary ?? null;
}

/** 預設只回傳 published path；draft 僅供已通過 server guard 的 preview 使用。 */
export async function getSkillTreeForUser(
  userId: string,
  pathId: string,
  options: { includeDraft?: boolean } = {},
): Promise<SkillTreeData | null> {
  const conditions = [eq(learningPath.id, pathId)];
  if (!options.includeDraft) {
    conditions.push(eq(learningPath.status, "published"));
  }

  const [path] = await db
    .select(publishedPathFields)
    .from(learningPath)
    .where(and(...conditions));
  if (!path) return null;

  const units = await db
    .select()
    .from(unit)
    .where(eq(unit.pathId, pathId))
    .orderBy(unit.position);
  const unitIds = units.map((value) => value.id);
  const lessons =
    unitIds.length === 0
      ? []
      : await db
          .select()
          .from(lesson)
          .where(inArray(lesson.unitId, unitIds))
          .orderBy(lesson.position);
  const lessonIds = lessons.map((value) => value.id);

  const [deps, masteries, recommendations] = await Promise.all([
    lessonIds.length === 0
      ? []
      : db
          .select()
          .from(lessonDependency)
          .where(inArray(lessonDependency.lessonId, lessonIds)),
    lessonIds.length === 0
      ? []
      : db
          .select()
          .from(userLessonMastery)
          .where(
            and(
              eq(userLessonMastery.userId, userId),
              inArray(userLessonMastery.lessonId, lessonIds),
            ),
          ),
    getRecommendations([pathId]),
  ]);

  const samePathLessonIds = new Set(lessonIds);
  const depsByLesson = new Map<string, string[]>();
  for (const dependency of deps) {
    if (!samePathLessonIds.has(dependency.dependsOnLessonId)) continue;
    const list = depsByLesson.get(dependency.lessonId) ?? [];
    list.push(dependency.dependsOnLessonId);
    depsByLesson.set(dependency.lessonId, list);
  }
  const masteryByLesson = new Map(
    masteries.map((mastery) => [mastery.lessonId, mastery]),
  );

  return {
    path,
    recommendedPrerequisites: recommendations.get(pathId) ?? [],
    units: units.map((value) => ({
      id: value.id,
      title: value.title,
      lessons: lessons
        .filter((item) => item.unitId === value.id)
        .map((item) => {
          const mastery = masteryByLesson.get(item.id);
          return {
            id: item.id,
            title: item.title,
            type: item.type,
            topic: item.topic,
            dependsOn: depsByLesson.get(item.id) ?? [],
            mastery: mastery
              ? {
                  score: mastery.score,
                  assessedAt: mastery.assessedAt,
                  effective: Math.round(
                    effectiveScore(mastery.score, mastery.assessedAt),
                  ),
                  cracked: isCracked(mastery.score, mastery.assessedAt),
                }
              : null,
          };
        }),
    })),
  };
}
