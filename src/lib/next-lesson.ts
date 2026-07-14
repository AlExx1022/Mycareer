import { getSkillTreeForUser } from "@/db/queries/skill-tree";
import { deriveNodeStates } from "@/lib/skill-tree";

/** 假設當前節點已過關，回傳路線上下一個可學節點（無則 null）。 */
export async function nextAvailableLesson(userId: string, currentId: string) {
  const units = await getSkillTreeForUser(userId);
  const lessons = units
    .flatMap((u) => u.lessons)
    .map((l) =>
      l.id === currentId
        ? { ...l, mastery: { score: 100, assessedAt: new Date() } }
        : l,
    );
  const states = deriveNodeStates(lessons);
  const next = lessons.find(
    (l) => l.id !== currentId && states.get(l.id) === "available",
  );
  return next ? { id: next.id, title: next.title } : null;
}
