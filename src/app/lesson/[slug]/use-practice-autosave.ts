"use client";

import { useCallback, useEffect, useRef } from "react";
import type { PracticeUserFiles } from "@/lib/practice-session/workspace";

const AUTOSAVE_DELAY_MS = 2_000;

export function usePracticeAutosave(
  practiceApi: string,
  initialFiles: PracticeUserFiles,
  onError: (message: string) => void,
) {
  const lastSavedRef = useRef(JSON.stringify(initialFiles));
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    lastSavedRef.current = JSON.stringify(initialFiles);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      abortRef.current?.abort();
    };
  }, [initialFiles]);

  return useCallback(
    (files: PracticeUserFiles) => {
      const serialized = JSON.stringify(files);
      if (serialized === lastSavedRef.current) return;
      if (timerRef.current) clearTimeout(timerRef.current);

      timerRef.current = setTimeout(async () => {
        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;
        try {
          const response = await fetch(practiceApi, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ files }),
            signal: controller.signal,
          });
          if (!response.ok) throw new Error(await response.text());
          lastSavedRef.current = serialized;
        } catch (error) {
          if (controller.signal.aborted) return;
          onError(
            error instanceof Error ? error.message : "程式碼自動儲存失敗",
          );
        }
      }, AUTOSAVE_DELAY_MS);
    },
    [onError, practiceApi],
  );
}
