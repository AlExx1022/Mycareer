import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { learningPath, lesson, unit } from "@/db/schema";
import type {
  PracticeBlueprint,
  PracticeRuntime,
} from "@/db/curriculum/types";
import type { LessonIntro, RubricItem } from "@/db/skill-tree-schema";

export type LessonContext = {
  lessonId: string;
  title: string;
  lessonType: "concept" | "practice";
  topic: string | null;
  intro: LessonIntro | null;
  subject: string;
  codeLanguage: string;
  pathId: string;
  pathTitle: string;
  examPoints: string[];
  rubric: RubricItem[];
  practiceRuntime: PracticeRuntime | null;
  practiceBlueprint: PracticeBlueprint | null;
};

/** 所有教學、複習與實作 prompt 的唯一 metadata 來源。 */
export async function getLessonContext(
  lessonId: string,
  options: { includeDraft?: boolean } = {},
): Promise<LessonContext | null> {
  const conditions = [eq(lesson.id, lessonId)];
  if (!options.includeDraft) {
    conditions.push(eq(learningPath.status, "published"));
  }

  const [row] = await db
    .select({
      lessonId: lesson.id,
      title: lesson.title,
      lessonType: lesson.type,
      topic: lesson.topic,
      intro: lesson.intro,
      subject: learningPath.subject,
      codeLanguage: learningPath.codeLanguage,
      pathId: learningPath.id,
      pathTitle: learningPath.title,
      examPoints: lesson.examPoints,
      rubric: lesson.rubric,
      practiceRuntime: lesson.practiceRuntime,
      practiceBlueprint: lesson.practiceBlueprint,
    })
    .from(lesson)
    .innerJoin(unit, eq(lesson.unitId, unit.id))
    .innerJoin(learningPath, eq(unit.pathId, learningPath.id))
    .where(and(...conditions));

  return row ?? null;
}
