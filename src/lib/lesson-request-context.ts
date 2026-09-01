import "server-only";

import {
  getLessonContext,
  type LessonContext,
} from "@/db/queries/lesson-context";
import {
  draftPreviewPathFromUrl,
  resolveDraftPreviewPath,
} from "@/lib/draft-preview";

export type LessonRequestContext = {
  lesson: LessonContext;
  previewPathId: string | null;
};

export async function getLessonContextForPreview(
  lessonId: string,
  requestedPreviewPathId?: string | string[] | null,
): Promise<LessonRequestContext | null> {
  const previewPathId = resolveDraftPreviewPath(requestedPreviewPathId);
  const lesson = await getLessonContext(lessonId, {
    includeDraft: previewPathId !== null,
  });

  if (!lesson || (previewPathId && lesson.pathId !== previewPathId)) {
    return null;
  }

  return { lesson, previewPathId };
}

export function getLessonContextForRequest(
  lessonId: string,
  requestUrl: string,
): Promise<LessonRequestContext | null> {
  return getLessonContextForPreview(
    lessonId,
    draftPreviewPathFromUrl(requestUrl),
  );
}
