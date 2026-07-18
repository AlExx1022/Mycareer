import { eq } from "drizzle-orm";
import { db } from "@/db";
import {
  unit,
  lesson,
  lessonDependency,
  userLessonMastery,
} from "@/db/schema";

export type SkillTreeLesson = {
  id: string;
  title: string;
  type: "concept" | "practice";
  topic: string | null;
  dependsOn: string[];
  mastery: { score: number; assessedAt: Date } | null;
};

export type SkillTreeUnit = {
  id: string;
  title: string;
  lessons: SkillTreeLesson[];
};

export async function getSkillTreeForUser(
  userId: string,
): Promise<SkillTreeUnit[]> {
  const [units, lessons, deps, masteries] = await Promise.all([
    db.select().from(unit).orderBy(unit.position),
    db.select().from(lesson).orderBy(lesson.position),
    db.select().from(lessonDependency),
    db
      .select()
      .from(userLessonMastery)
      .where(eq(userLessonMastery.userId, userId)),
  ]);

  const depsByLesson = new Map<string, string[]>();
  for (const d of deps) {
    const list = depsByLesson.get(d.lessonId) ?? [];
    list.push(d.dependsOnLessonId);
    depsByLesson.set(d.lessonId, list);
  }
  const masteryByLesson = new Map(masteries.map((m) => [m.lessonId, m]));

  return units.map((u) => ({
    id: u.id,
    title: u.title,
    lessons: lessons
      .filter((l) => l.unitId === u.id)
      .map((l) => {
        const mastery = masteryByLesson.get(l.id);
        return {
          id: l.id,
          title: l.title,
          type: l.type,
          topic: l.topic,
          dependsOn: depsByLesson.get(l.id) ?? [],
          mastery: mastery
            ? { score: mastery.score, assessedAt: mastery.assessedAt }
            : null,
        };
      }),
  }));
}
