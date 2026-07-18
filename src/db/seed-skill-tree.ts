import { inArray, notInArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { unit, lesson, lessonDependency } from "@/db/schema";
import { curriculum } from "./curriculum/react-junior-mid";

function assertAcyclic() {
  const allLessons = curriculum.flatMap((u) => u.lessons);
  const slugs = new Set(allLessons.map((l) => l.slug));

  for (const l of allLessons) {
    for (const dep of l.dependsOn) {
      if (!slugs.has(dep)) {
        throw new Error(`「${l.slug}」依賴不存在的節點「${dep}」`);
      }
    }
  }

  // ponytail: 12 節點的 DFS 循環檢查，路徑直接進錯誤訊息
  const visiting = new Set<string>();
  const done = new Set<string>();
  const depsOf = new Map(allLessons.map((l) => [l.slug, l.dependsOn]));

  function visit(slug: string, path: string[]) {
    if (done.has(slug)) return;
    if (visiting.has(slug)) {
      throw new Error(`循環依賴：${[...path, slug].join(" → ")}`);
    }
    visiting.add(slug);
    for (const dep of depsOf.get(slug)!) visit(dep, [...path, slug]);
    visiting.delete(slug);
    done.add(slug);
  }

  for (const l of allLessons) visit(l.slug, []);
}

export async function seedSkillTree() {
  assertAcyclic();

  for (const [unitPos, u] of curriculum.entries()) {
    await db
      .insert(unit)
      .values({ id: u.slug, title: u.title, position: unitPos })
      .onConflictDoUpdate({
        target: unit.id,
        set: { title: u.title, position: unitPos },
      });

    for (const [lessonPos, l] of u.lessons.entries()) {
      await db
        .insert(lesson)
        .values({
          id: l.slug,
          unitId: u.slug,
          title: l.title,
          type: l.type,
          position: lessonPos,
          examPoints: l.examPoints,
          rubric: l.rubric,
          topic: l.topic,
          intro: l.intro ?? null,
        })
        .onConflictDoUpdate({
          target: lesson.id,
          set: {
            unitId: u.slug,
            title: l.title,
            type: l.type,
            position: lessonPos,
            examPoints: l.examPoints,
            rubric: l.rubric,
            topic: l.topic,
            intro: l.intro ?? null,
          },
        });
    }
  }

  const allLessons = curriculum.flatMap((u) => u.lessons);

  // 課綱移除的節點整批清掉，FK 全 cascade——mastery/weakness/session 一併清除，不留孤兒資料
  await db.delete(lesson).where(
    notInArray(
      lesson.id,
      allLessons.map((l) => l.slug),
    ),
  );

  // 依賴整批重建，課綱移除的依賴才會消失
  await db.delete(lessonDependency).where(
    inArray(
      lessonDependency.lessonId,
      allLessons.map((l) => l.slug),
    ),
  );
  const deps = allLessons.flatMap((l) =>
    l.dependsOn.map((dep) => ({ lessonId: l.slug, dependsOnLessonId: dep })),
  );
  if (deps.length > 0) {
    await db.insert(lessonDependency).values(deps);
  }

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(lesson);
  console.log(
    `技能樹已 seed：${curriculum.length} units、${count} lessons、${deps.length} dependencies`,
  );
}
