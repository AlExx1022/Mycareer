export const DRAFT_PILOT_ISSUES = [
  { id: "too_long", label: "內容過長" },
  { id: "too_shallow", label: "內容過淺" },
  { id: "question_drift", label: "題目漂移" },
  { id: "other", label: "其他問題" },
] as const;

export type DraftPilotIssue = (typeof DRAFT_PILOT_ISSUES)[number]["id"];

export type DraftPilotEntry = {
  lessonId: string;
  lessonTitle: string;
  issues: DraftPilotIssue[];
  note: string;
  reviewedAt: string;
};

export type DraftPilotRecord = {
  version: 1;
  pathId: string;
  entries: Record<string, DraftPilotEntry>;
};

export type DraftPilotStorage = Pick<Storage, "getItem" | "setItem">;

const ISSUE_IDS = new Set<DraftPilotIssue>(
  DRAFT_PILOT_ISSUES.map(({ id }) => id),
);

export function draftPilotStorageKey(pathId: string) {
  return `mycareer:draft-pilot:v1:${pathId}`;
}

function emptyRecord(pathId: string): DraftPilotRecord {
  return { version: 1, pathId, entries: {} };
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function readDraftPilotRecord(
  storage: DraftPilotStorage,
  pathId: string,
): DraftPilotRecord {
  const raw = storage.getItem(draftPilotStorageKey(pathId));
  if (!raw) return emptyRecord(pathId);

  try {
    const parsed: unknown = JSON.parse(raw);
    if (
      !isObject(parsed) ||
      parsed.version !== 1 ||
      parsed.pathId !== pathId ||
      !isObject(parsed.entries)
    ) {
      return emptyRecord(pathId);
    }

    const entries: Record<string, DraftPilotEntry> = {};
    for (const [lessonId, value] of Object.entries(parsed.entries)) {
      if (
        !isObject(value) ||
        value.lessonId !== lessonId ||
        typeof value.lessonTitle !== "string" ||
        !Array.isArray(value.issues) ||
        typeof value.note !== "string" ||
        typeof value.reviewedAt !== "string"
      ) {
        continue;
      }
      entries[lessonId] = {
        lessonId,
        lessonTitle: value.lessonTitle,
        issues: value.issues.filter(
          (issue): issue is DraftPilotIssue =>
            typeof issue === "string" &&
            ISSUE_IDS.has(issue as DraftPilotIssue),
        ),
        note: value.note,
        reviewedAt: value.reviewedAt,
      };
    }
    return { version: 1, pathId, entries };
  } catch {
    return emptyRecord(pathId);
  }
}

export function saveDraftPilotEntry(
  storage: DraftPilotStorage,
  pathId: string,
  entry: DraftPilotEntry,
): DraftPilotRecord {
  const record = readDraftPilotRecord(storage, pathId);
  const updated = {
    ...record,
    entries: { ...record.entries, [entry.lessonId]: entry },
  } satisfies DraftPilotRecord;
  storage.setItem(draftPilotStorageKey(pathId), JSON.stringify(updated));
  return updated;
}

export function serializeDraftPilotRecord(
  record: DraftPilotRecord,
  exportedAt: string,
) {
  return JSON.stringify(
    {
      version: record.version,
      pathId: record.pathId,
      exportedAt,
      lessons: Object.values(record.entries).sort((a, b) =>
        a.reviewedAt.localeCompare(b.reviewedAt),
      ),
    },
    null,
    2,
  );
}
