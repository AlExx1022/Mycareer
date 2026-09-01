"use client";

import { useState, useSyncExternalStore } from "react";
import {
  DRAFT_PILOT_ISSUES,
  draftPilotStorageKey,
  readDraftPilotRecord,
  saveDraftPilotEntry,
  serializeDraftPilotRecord,
  type DraftPilotIssue,
} from "@/lib/draft-pilot-feedback";

type DraftPilotFeedbackProps = {
  pathId: string;
  lessonId: string;
  lessonTitle: string;
};

function subscribeToStorageSnapshot() {
  return () => {};
}

function DraftPilotFeedbackForm({
  pathId,
  lessonId,
  lessonTitle,
  initialIssues,
  initialNote,
  initialReviewedCount,
}: DraftPilotFeedbackProps & {
  initialIssues: DraftPilotIssue[];
  initialNote: string;
  initialReviewedCount: number;
}) {
  const [issues, setIssues] = useState<DraftPilotIssue[]>(initialIssues);
  const [note, setNote] = useState(initialNote);
  const [reviewedCount, setReviewedCount] = useState(initialReviewedCount);
  const [status, setStatus] = useState<"idle" | "saved" | "exported">("idle");

  function toggleIssue(issue: DraftPilotIssue) {
    setIssues((current) =>
      current.includes(issue)
        ? current.filter((value) => value !== issue)
        : [...current, issue],
    );
    setStatus("idle");
  }

  function persist() {
    const record = saveDraftPilotEntry(localStorage, pathId, {
      lessonId,
      lessonTitle,
      issues,
      note: note.trim(),
      reviewedAt: new Date().toISOString(),
    });
    setReviewedCount(Object.keys(record.entries).length);
    setStatus("saved");
    return record;
  }

  function exportRecord() {
    const record = persist();
    const content = serializeDraftPilotRecord(
      record,
      new Date().toISOString(),
    );
    const url = URL.createObjectURL(
      new Blob([content], { type: "application/json" }),
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${pathId}-pilot-feedback.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    setStatus("exported");
  }

  return (
    <details className="mt-4 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-[#17242D]">
      <summary className="cursor-pointer font-bold">
        試走回饋 · 已記錄 {reviewedCount} 課
      </summary>
      <div className="mt-4 space-y-4">
        <p className="text-xs leading-relaxed text-[#17242D]/60">
          沒有勾選問題就代表本課正常。資料只存在這個瀏覽器，可隨時匯出 JSON。
        </p>
        <div className="flex flex-wrap gap-2">
          {DRAFT_PILOT_ISSUES.map((issue) => {
            const selected = issues.includes(issue.id);
            return (
              <button
                key={issue.id}
                type="button"
                aria-pressed={selected}
                onClick={() => toggleIssue(issue.id)}
                className={`rounded-full border px-3 py-1.5 text-xs font-bold transition ${
                  selected
                    ? "border-amber-600 bg-amber-600 text-white"
                    : "border-amber-300 bg-white text-amber-900 hover:bg-amber-100"
                }`}
              >
                {issue.label}
              </button>
            );
          })}
        </div>
        <textarea
          value={note}
          onChange={(event) => {
            setNote(event.target.value);
            setStatus("idle");
          }}
          rows={3}
          maxLength={2000}
          placeholder="具體是哪段太長、少了什麼，或題目偏離哪個考點？"
          className="w-full resize-y rounded-xl border border-amber-300 bg-white px-3 py-2 text-sm outline-none focus:border-amber-600"
        />
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={persist}
            className="rounded-xl bg-[#17242D] px-4 py-2 text-xs font-bold text-white"
          >
            {issues.length === 0 && !note.trim()
              ? "記錄本課正常"
              : "儲存本課回饋"}
          </button>
          <button
            type="button"
            onClick={exportRecord}
            className="rounded-xl border border-[#17242D]/20 bg-white px-4 py-2 text-xs font-bold"
          >
            匯出全部 JSON
          </button>
          {status !== "idle" ? (
            <span className="text-xs font-semibold text-emerald-700">
              {status === "saved" ? "已儲存" : "已匯出"}
            </span>
          ) : null}
        </div>
      </div>
    </details>
  );
}

export default function DraftPilotFeedback(props: DraftPilotFeedbackProps) {
  const storageKey = draftPilotStorageKey(props.pathId);
  const snapshot = useSyncExternalStore(
    subscribeToStorageSnapshot,
    () => localStorage.getItem(storageKey) ?? "",
    () => null,
  );
  if (snapshot === null) return null;

  const record = readDraftPilotRecord(localStorage, props.pathId);
  const existing = record.entries[props.lessonId];
  return (
    <DraftPilotFeedbackForm
      {...props}
      initialIssues={existing?.issues ?? []}
      initialNote={existing?.note ?? ""}
      initialReviewedCount={Object.keys(record.entries).length}
    />
  );
}
