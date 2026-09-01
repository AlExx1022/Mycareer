import { eq, inArray } from "drizzle-orm";
import type { BatchItem } from "drizzle-orm/batch";
import { db } from "@/db";
import {
  learningPath,
  learningPathRecommendation,
  lesson,
  lessonDependency,
  unit,
} from "@/db/schema";
import { curricula } from "./curriculum";
import {
  PRACTICE_RUNTIMES,
  resolvePracticeRuntime,
  type CurriculumPath,
  type PracticeBlueprint,
} from "./curriculum/types";

type PersistedUnit = { id: string; pathId: string };
type PersistedLesson = { id: string; unitId: string };

export type PathPrunePlan = {
  staleUnitIds: string[];
  staleLessonIds: string[];
};

function assertUnique(values: string[], label: string) {
  const seen = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) throw new Error(`${label}重複：${value}`);
    seen.add(value);
  }
}

function assertStrings(values: string[], label: string) {
  if (values.length === 0 || values.some((value) => value.trim() === "")) {
    throw new Error(`${label}必須至少有一個非空字串`);
  }
}

function assertBlueprint(lessonId: string, blueprint: PracticeBlueprint) {
  if (blueprint.objective.trim() === "") {
    throw new Error(`${lessonId} practiceBlueprint 缺 objective`);
  }
  assertStrings(blueprint.requirements, `${lessonId} requirements`);
  assertStrings(blueprint.edgeCases, `${lessonId} edgeCases`);
  assertStrings(blueprint.followUps, `${lessonId} followUps`);
  if (!Number.isInteger(blueprint.timeboxMinutes) || blueprint.timeboxMinutes <= 0) {
    throw new Error(`${lessonId} timeboxMinutes 必須為正整數`);
  }
}

/** 所有驗證均在建立 DB batch 前完成，失敗時不會部分寫入課綱。 */
export function assertCurricula(input: readonly CurriculumPath[]) {
  if (input.length === 0) throw new Error("至少需要一條 CurriculumPath");

  assertUnique(
    input.map((path) => path.id),
    "path id",
  );

  const pathsById = new Map(input.map((path) => [path.id, path]));
  const units = input.flatMap((path) =>
    path.units.map((curriculumUnit) => ({ path, unit: curriculumUnit })),
  );
  const lessons = units.flatMap(({ path, unit: curriculumUnit }) =>
    curriculumUnit.lessons.map((curriculumLesson) => ({
      path,
      unit: curriculumUnit,
      lesson: curriculumLesson,
    })),
  );

  assertUnique(
    units.map(({ unit: curriculumUnit }) => curriculumUnit.slug),
    "unit slug",
  );
  assertUnique(
    lessons.map(({ lesson: curriculumLesson }) => curriculumLesson.slug),
    "lesson slug",
  );

  const lessonOwners = new Map(
    lessons.map(({ path, lesson: curriculumLesson }) => [curriculumLesson.slug, path.id]),
  );

  for (const path of input) {
    if (
      path.id.trim() === "" ||
      path.title.trim() === "" ||
      path.description.trim() === "" ||
      path.subject.trim() === "" ||
      path.codeLanguage.trim() === ""
    ) {
      throw new Error(`${path.id || "<empty>"} path metadata 不完整`);
    }
    if (!Number.isInteger(path.position) || path.position < 0) {
      throw new Error(`${path.id} position 必須為非負整數`);
    }
    if (path.status !== "draft" && path.status !== "published") {
      throw new Error(`${path.id} status 必須為 draft 或 published`);
    }
    if (
      path.defaultPracticeRuntime !== undefined &&
      !PRACTICE_RUNTIMES.includes(path.defaultPracticeRuntime)
    ) {
      throw new Error(`${path.id} defaultPracticeRuntime 不受支援`);
    }
    if (path.units.length === 0) throw new Error(`${path.id} 沒有 unit`);
    assertUnique(path.recommendedPrerequisitePathIds, `${path.id} 建議前置 path`);
    for (const prerequisiteId of path.recommendedPrerequisitePathIds) {
      if (prerequisiteId === path.id) {
        throw new Error(`${path.id} 不得把自己設為建議前置 path`);
      }
      if (!pathsById.has(prerequisiteId)) {
        throw new Error(`${path.id} 建議不存在的前置 path：${prerequisiteId}`);
      }
    }
    for (const curriculumUnit of path.units) {
      if (curriculumUnit.slug.trim() === "" || curriculumUnit.title.trim() === "") {
        throw new Error(`${path.id} unit metadata 不完整`);
      }
      if (curriculumUnit.lessons.length === 0) {
        throw new Error(`${path.id}/${curriculumUnit.slug} 沒有 lesson`);
      }
    }
  }

  for (const { path, lesson: curriculumLesson } of lessons) {
    const lessonSlug = curriculumLesson.slug;
    if (curriculumLesson.topic.trim() === "") {
      throw new Error(`${curriculumLesson.slug} 缺 topic`);
    }
    assertStrings(curriculumLesson.examPoints, `${curriculumLesson.slug} examPoints`);
    if (
      curriculumLesson.rubric.length === 0 ||
      curriculumLesson.rubric.some(
        ({ criterion, passCondition }) =>
          criterion.trim() === "" || passCondition.trim() === "",
      )
    ) {
      throw new Error(`${curriculumLesson.slug} rubric 不完整`);
    }
    assertUnique(curriculumLesson.dependsOn, `${curriculumLesson.slug} dependency`);

    if (curriculumLesson.type === "concept") {
      if (
        curriculumLesson.practiceRuntime !== undefined ||
        curriculumLesson.practiceBlueprint !== undefined
      ) {
        throw new Error(`${lessonSlug} concept 不得含 practice metadata`);
      }
      if (
        curriculumLesson.intro.hook.trim() === "" ||
        curriculumLesson.intro.outcome.trim() === "" ||
        curriculumLesson.intro.scenarios.length === 0 ||
        curriculumLesson.intro.scenarios.some((scenario) => scenario.trim() === "")
      ) {
        throw new Error(`${curriculumLesson.slug} concept intro 不完整`);
      }
    } else {
      const runtime = resolvePracticeRuntime(path, curriculumLesson);
      if (!runtime || !PRACTICE_RUNTIMES.includes(runtime)) {
        throw new Error(`${curriculumLesson.slug} 缺少或使用不支援的 practice runtime`);
      }
      assertBlueprint(curriculumLesson.slug, curriculumLesson.practiceBlueprint);
    }

    for (const dependencyId of curriculumLesson.dependsOn) {
      const dependencyPathId = lessonOwners.get(dependencyId);
      if (!dependencyPathId) {
        throw new Error(
          `${path.id}/${curriculumLesson.slug} 依賴不存在的節點 ${dependencyId}`,
        );
      }
      if (dependencyPathId !== path.id) {
        throw new Error(
          `禁止跨路徑 hard dependency：${path.id}/${curriculumLesson.slug} → ${dependencyPathId}/${dependencyId}`,
        );
      }
    }
  }

  for (const path of input) {
    const pathLessons = path.units.flatMap((curriculumUnit) => curriculumUnit.lessons);
    const dependencies = new Map(
      pathLessons.map((curriculumLesson) => [
        curriculumLesson.slug,
        curriculumLesson.dependsOn,
      ]),
    );
    const visiting = new Set<string>();
    const done = new Set<string>();

    function visit(lessonId: string, route: string[]) {
      if (done.has(lessonId)) return;
      if (visiting.has(lessonId)) {
        throw new Error(
          `${path.id} 循環依賴：${[...route, lessonId].join(" → ")}`,
        );
      }
      visiting.add(lessonId);
      for (const dependencyId of dependencies.get(lessonId) ?? []) {
        visit(dependencyId, [...route, lessonId]);
      }
      visiting.delete(lessonId);
      done.add(lessonId);
    }

    for (const curriculumLesson of pathLessons) visit(curriculumLesson.slug, []);
  }
}

/** 以 persisted unit.pathId 限定 prune；不屬於目前 path 的 id 絕不會出現在計畫中。 */
export function planPathPrune(
  path: CurriculumPath,
  persistedUnits: readonly PersistedUnit[],
  persistedLessons: readonly PersistedLesson[],
): PathPrunePlan {
  const scopedUnitIds = new Set(
    persistedUnits
      .filter((persistedUnit) => persistedUnit.pathId === path.id)
      .map((persistedUnit) => persistedUnit.id),
  );
  const nextUnitIds = new Set(path.units.map((curriculumUnit) => curriculumUnit.slug));
  const nextLessonIds = new Set(
    path.units.flatMap((curriculumUnit) =>
      curriculumUnit.lessons.map((curriculumLesson) => curriculumLesson.slug),
    ),
  );

  return {
    staleUnitIds: [...scopedUnitIds].filter((id) => !nextUnitIds.has(id)),
    staleLessonIds: persistedLessons
      .filter(
        (persistedLesson) =>
          scopedUnitIds.has(persistedLesson.unitId) &&
          !nextLessonIds.has(persistedLesson.id),
      )
      .map((persistedLesson) => persistedLesson.id),
  };
}

/** 可只同步 subset；knownCurricula 供全域 slug／建議前置完整性驗證。 */
export async function seedSkillTree(
  paths: readonly CurriculumPath[] = curricula,
  knownCurricula: readonly CurriculumPath[] = curricula,
) {
  assertUnique(
    paths.map((path) => path.id),
    "同步 path id",
  );
  const syncedPathsById = new Map(paths.map((path) => [path.id, path]));
  const knownPathIds = new Set(knownCurricula.map((path) => path.id));
  for (const path of paths) {
    if (!knownPathIds.has(path.id)) {
      throw new Error(`同步的 path 未列在 knownCurricula：${path.id}`);
    }
  }
  assertCurricula(
    knownCurricula.map((path) => syncedPathsById.get(path.id) ?? path),
  );

  if (paths.length === 0) return;

  // Neon HTTP 不支援互動式 transaction。先用 read-only preflight 建立 prune
  // 計畫，再把所有 mutation 放進同一個原子 batch，避免 seed 半套寫入。
  const [persistedPaths, persistedUnits, persistedLessons] = await Promise.all([
    db.select({ id: learningPath.id }).from(learningPath),
    db.select({ id: unit.id, pathId: unit.pathId }).from(unit),
    db
      .select({ id: lesson.id, unitId: lesson.unitId, pathId: unit.pathId })
      .from(lesson)
      .innerJoin(unit, eq(lesson.unitId, unit.id)),
  ]);
  const availablePathIds = new Set([
    ...persistedPaths.map(({ id }) => id),
    ...paths.map(({ id }) => id),
  ]);

  for (const path of paths) {
    const missingPrerequisites = path.recommendedPrerequisitePathIds.filter(
      (id) => !availablePathIds.has(id),
    );
    if (missingPrerequisites.length > 0) {
      throw new Error(
        `${path.id} 建議的前置 path 尚未 seed：${missingPrerequisites.join(", ")}`,
      );
    }

    const pathUnitIds = new Set(path.units.map(({ slug }) => slug));
    const collidingUnits = persistedUnits.filter(
      ({ id, pathId }) => pathUnitIds.has(id) && pathId !== path.id,
    );
    if (collidingUnits.length > 0) {
      throw new Error(
        `${path.id} unit slug 已屬於其他 path：${collidingUnits.map(({ id, pathId }) => `${id} (${pathId})`).join(", ")}`,
      );
    }

    const pathLessonIds = new Set(
      path.units.flatMap(({ lessons }) => lessons.map(({ slug }) => slug)),
    );
    const collidingLessons = persistedLessons.filter(
      ({ id, pathId }) => pathLessonIds.has(id) && pathId !== path.id,
    );
    if (collidingLessons.length > 0) {
      throw new Error(
        `${path.id} lesson slug 已屬於其他 path：${collidingLessons.map(({ id, pathId }) => `${id} (${pathId})`).join(", ")}`,
      );
    }
  }

  const mutations: BatchItem<"pg">[] = [];

  // 先建立本次所有 path，避免 aggregate 內建議前置受寫入順序影響。
  for (const path of paths) {
    mutations.push(
      db
        .insert(learningPath)
        .values({
          id: path.id,
          title: path.title,
          description: path.description,
          subject: path.subject,
          codeLanguage: path.codeLanguage,
          status: path.status,
          position: path.position,
        })
        .onConflictDoUpdate({
          target: learningPath.id,
          set: {
            title: path.title,
            description: path.description,
            subject: path.subject,
            codeLanguage: path.codeLanguage,
            status: path.status,
            position: path.position,
          },
        }),
    );
  }

  for (const path of paths) {
    const pathUnits = path.units;
    const pathLessons = pathUnits.flatMap((curriculumUnit) =>
      curriculumUnit.lessons.map((curriculumLesson) => ({
        unit: curriculumUnit,
        lesson: curriculumLesson,
      })),
    );
    const lessonIds = pathLessons.map(
      ({ lesson: curriculumLesson }) => curriculumLesson.slug,
    );

    const prunePlan = planPathPrune(path, persistedUnits, persistedLessons);

    for (const [unitPosition, curriculumUnit] of pathUnits.entries()) {
      mutations.push(
        db
          .insert(unit)
          .values({
            id: curriculumUnit.slug,
            pathId: path.id,
            title: curriculumUnit.title,
            position: unitPosition,
          })
          .onConflictDoUpdate({
            target: unit.id,
            set: {
              pathId: path.id,
              title: curriculumUnit.title,
              position: unitPosition,
            },
          }),
      );

      for (const [lessonPosition, curriculumLesson] of curriculumUnit.lessons.entries()) {
        const practiceRuntime =
          curriculumLesson.type === "practice"
            ? resolvePracticeRuntime(path, curriculumLesson)!
            : null;
        const practiceBlueprint =
          curriculumLesson.type === "practice"
            ? curriculumLesson.practiceBlueprint
            : null;

        mutations.push(
          db
            .insert(lesson)
            .values({
              id: curriculumLesson.slug,
              unitId: curriculumUnit.slug,
              title: curriculumLesson.title,
              type: curriculumLesson.type,
              position: lessonPosition,
              examPoints: curriculumLesson.examPoints,
              rubric: curriculumLesson.rubric,
              topic: curriculumLesson.topic,
              intro: curriculumLesson.intro ?? null,
              practiceRuntime,
              practiceBlueprint,
            })
            .onConflictDoUpdate({
              target: lesson.id,
              set: {
                unitId: curriculumUnit.slug,
                title: curriculumLesson.title,
                type: curriculumLesson.type,
                position: lessonPosition,
                examPoints: curriculumLesson.examPoints,
                rubric: curriculumLesson.rubric,
                topic: curriculumLesson.topic,
                intro: curriculumLesson.intro ?? null,
                practiceRuntime,
                practiceBlueprint,
              },
            }),
        );
      }
    }

    const prerequisiteIds = path.recommendedPrerequisitePathIds;
    mutations.push(
      db
        .delete(learningPathRecommendation)
        .where(eq(learningPathRecommendation.pathId, path.id)),
    );
    if (prerequisiteIds.length > 0) {
      mutations.push(
        db.insert(learningPathRecommendation).values(
          prerequisiteIds.map((recommendedPathId) => ({
            pathId: path.id,
            recommendedPathId,
          })),
        ),
      );
    }

    if (prunePlan.staleLessonIds.length > 0) {
      mutations.push(
        db.delete(lesson).where(inArray(lesson.id, prunePlan.staleLessonIds)),
      );
    }
    if (prunePlan.staleUnitIds.length > 0) {
      mutations.push(
        db.delete(unit).where(inArray(unit.id, prunePlan.staleUnitIds)),
      );
    }

    mutations.push(
      db
        .delete(lessonDependency)
        .where(inArray(lessonDependency.lessonId, lessonIds)),
    );
    const dependencies = pathLessons.flatMap(({ lesson: curriculumLesson }) =>
      curriculumLesson.dependsOn.map((dependsOnLessonId) => ({
        lessonId: curriculumLesson.slug,
        dependsOnLessonId,
      })),
    );
    if (dependencies.length > 0) {
      mutations.push(db.insert(lessonDependency).values(dependencies));
    }

    console.log(
      `課綱已 seed：${path.id}（${pathUnits.length} units、${pathLessons.length} lessons、${dependencies.length} dependencies）`,
    );
  }

  await db.batch(
    mutations as [BatchItem<"pg">, ...BatchItem<"pg">[]],
  );
}
