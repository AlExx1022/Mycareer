import { getLessonContext } from "@/db/queries/lesson-context";
import { getSkillTreeForUser } from "@/db/queries/skill-tree";
import { deriveNodeStates } from "@/lib/skill-tree";

export type NextLessonResult =
  | {
      pathId: string;
      pathComplete: false;
      next: { id: string; title: string };
    }
  | { pathId: string; pathComplete: true; next: null };

/** 假設當前節點已過關，只在同 path 內尋找下一個可學節點。 */
export async function nextAvailableLesson(
  userId: string,
  currentId: string,
  options: { includeDraft?: boolean } = {},
): Promise<NextLessonResult | null> {
  const context = await getLessonContext(currentId, options);
  if (!context) return null;

  const tree = await getSkillTreeForUser(userId, context.pathId, options);
  if (!tree) return null;

  const lessons = tree.units
    .flatMap((value) => value.lessons)
    .map((value) =>
      value.id === currentId
        ? {
            ...value,
            mastery: {
              score: 100,
              assessedAt: new Date(),
              effective: 100,
              cracked: false,
            },
          }
        : value,
    );
  const states = deriveNodeStates(lessons);
  const next = lessons.find(
    (value) =>
      value.id !== currentId && states.get(value.id) === "available",
  );

  return next
    ? {
        pathId: context.pathId,
        pathComplete: false,
        next: { id: next.id, title: next.title },
      }
    : { pathId: context.pathId, pathComplete: true, next: null };
}
