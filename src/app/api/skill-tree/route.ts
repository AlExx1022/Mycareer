import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import {
  unit,
  lesson,
  lessonDependency,
  userLessonMastery,
} from "@/db/schema";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [units, lessons, deps, masteries] = await Promise.all([
    db.select().from(unit).orderBy(unit.position),
    db.select().from(lesson).orderBy(lesson.position),
    db.select().from(lessonDependency),
    db
      .select()
      .from(userLessonMastery)
      .where(eq(userLessonMastery.userId, session.user.id)),
  ]);

  const depsByLesson = new Map<string, string[]>();
  for (const d of deps) {
    const list = depsByLesson.get(d.lessonId) ?? [];
    list.push(d.dependsOnLessonId);
    depsByLesson.set(d.lessonId, list);
  }
  const masteryByLesson = new Map(masteries.map((m) => [m.lessonId, m]));

  return Response.json({
    units: units.map((u) => ({
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
            dependsOn: depsByLesson.get(l.id) ?? [],
            mastery: mastery
              ? { score: mastery.score, assessedAt: mastery.assessedAt }
              : null,
          };
        }),
    })),
  });
}
