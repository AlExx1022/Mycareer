export const DRAFT_PREVIEW_QUERY = "preview";
const PREVIEWABLE_DRAFT_PATHS = new Set<string>();

/** Draft preview is deliberately unavailable in production. */
export function resolveDraftPreviewPath(
  requestedPathId: string | string[] | undefined | null,
  resourcePathId?: string,
  nodeEnv = process.env.NODE_ENV,
): string | null {
  if (
    nodeEnv === "production" ||
    typeof requestedPathId !== "string" ||
    !PREVIEWABLE_DRAFT_PATHS.has(requestedPathId) ||
    (resourcePathId !== undefined && requestedPathId !== resourcePathId)
  ) {
    return null;
  }

  return requestedPathId;
}

export function draftPreviewPathFromUrl(url: string): string | null {
  return resolveDraftPreviewPath(
    new URL(url).searchParams.get(DRAFT_PREVIEW_QUERY),
  );
}

export function withDraftPreview(
  href: string,
  previewPathId?: string | null,
): string {
  if (!previewPathId) return href;

  const separator = href.includes("?") ? "&" : "?";
  return `${href}${separator}${DRAFT_PREVIEW_QUERY}=${encodeURIComponent(previewPathId)}`;
}
