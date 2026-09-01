"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { renderPromptContent } from "@/app/code-prompt";
import type { PracticeRuntime } from "@/db/curriculum/types";
import type { PracticeStatus } from "@/db/schema";
import { withDraftPreview } from "@/lib/draft-preview";
import {
  allTestsPass,
  type PracticeRunnerResult,
  type SandpackDescribeNode,
  type SandpackTestNode,
} from "@/lib/practice-session/runner";
import {
  LEGACY_REACT_ENTRY_FILE,
  LEGACY_REACT_TEST_FILE,
  validatePracticeWorkspace,
  type PracticeUserFiles,
  type PracticeWorkspace,
} from "@/lib/practice-session/workspace";
import {
  PracticeEditorControls,
  PracticeResultPanel,
} from "./practice-result";
import { usePracticeAutosave } from "./use-practice-autosave";

const SandpackPracticeRunner = dynamic(
  () => import("./practice-sandpack-runner"),
  {
    ssr: false,
    loading: () => <RunnerLoading label="JavaScript 執行環境載入中⋯" />,
  },
);
const PythonPracticeRunner = dynamic(
  () => import("./practice-python-runner"),
  {
    ssr: false,
    loading: () => <RunnerLoading label="Python 編輯器載入中⋯" />,
  },
);

// 保留既有 dev preview 與 regression selfcheck 的公開名稱。
export const EXERCISE_FILE = LEGACY_REACT_ENTRY_FILE;
export const TEST_FILE = LEGACY_REACT_TEST_FILE;
export { allTestsPass };
export type TestNode = SandpackTestNode;
export type DescribeNode = SandpackDescribeNode;

type ReviewResponse = {
  verdict: "pass" | "fail";
  comments: string[];
  next: { id: string; title: string } | null;
  pathComplete: boolean;
  pathId: string;
};

type PracticeResponse = {
  exercise: PracticeWorkspace;
  userFiles: PracticeUserFiles;
  runtime: PracticeRuntime;
  status: PracticeStatus;
};

function RunnerLoading({ label }: { label: string }) {
  return (
    <p className="rounded-lg border border-[#17242D]/15 px-4 py-8 text-sm text-[#17242D]/45">
      {label}
    </p>
  );
}

function isPracticeRuntime(value: unknown): value is PracticeRuntime {
  return (
    value === "react-ts" ||
    value === "vanilla-ts" ||
    value === "vanilla-js" ||
    value === "python"
  );
}

export default function PracticeSession({
  slug,
  previewPathId,
}: {
  slug: string;
  previewPathId?: string | null;
}) {
  const [workspace, setWorkspace] = useState<PracticeWorkspace | null>(null);
  const [runtime, setRuntime] = useState<PracticeRuntime | null>(null);
  const [initialUserFiles, setInitialUserFiles] =
    useState<PracticeUserFiles>({});
  const [status, setStatus] = useState<PracticeStatus>("in_progress");
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [generation, setGeneration] = useState(0);
  const [runnerResult, setRunnerResult] =
    useState<PracticeRunnerResult | null>(null);
  const [reviewing, setReviewing] = useState(false);
  const [review, setReview] = useState<ReviewResponse | null>(null);
  const latestFilesRef = useRef<PracticeUserFiles>({});
  const practiceApi = withDraftPreview(
    `/api/lesson/${slug}/practice`,
    previewPathId,
  );
  const reviewApi = withDraftPreview(
    `/api/lesson/${slug}/review`,
    previewPathId,
  );

  const handleSaveError = useCallback((message: string) => {
    setSaveError(message);
  }, []);
  const scheduleAutosave = usePracticeAutosave(
    practiceApi,
    initialUserFiles,
    handleSaveError,
  );
  const handleFilesChange = useCallback(
    (files: PracticeUserFiles) => {
      latestFilesRef.current = files;
      setSaveError(null);
      scheduleAutosave(files);
    },
    [scheduleAutosave],
  );

  useEffect(() => {
    let cancelled = false;
    fetch(practiceApi, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ regenerate: generation > 0 }),
    })
      .then(async (response) => {
        if (!response.ok) throw new Error(await response.text());
        return response.json() as Promise<PracticeResponse>;
      })
      .then((data) => {
        if (cancelled) return;
        if (!isPracticeRuntime(data.runtime)) {
          throw new Error(`不支援的 practice runtime：${String(data.runtime)}`);
        }
        const validationErrors = validatePracticeWorkspace(
          data.exercise,
          data.runtime,
        );
        if (validationErrors.length > 0) {
          throw new Error(`題目 workspace 格式錯誤：${validationErrors.join("；")}`);
        }
        setWorkspace(data.exercise);
        setRuntime(data.runtime);
        setInitialUserFiles(data.userFiles);
        latestFilesRef.current = data.userFiles;
        setStatus(data.status);
        setError(null);
        setRunnerResult(null);
        setReview(null);
        setSaveError(null);
      })
      .catch((caught) => {
        if (!cancelled) {
          setError(caught instanceof Error ? caught.message : String(caught));
        }
      });
    return () => {
      cancelled = true;
    };
  }, [generation, practiceApi]);

  async function submitReview() {
    setReviewing(true);
    try {
      const response = await fetch(reviewApi, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ files: latestFilesRef.current }),
      });
      if (!response.ok) throw new Error(await response.text());
      const data: ReviewResponse = await response.json();
      setReview(data);
      if (data.verdict === "pass") setStatus("passed");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
    } finally {
      setReviewing(false);
    }
  }

  if (error) {
    return (
      <div className="mt-10 rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-700">
        {error}
      </div>
    );
  }
  if (!workspace || !runtime) {
    return (
      <p className="mt-10 text-sm text-[#17242D]/45">
        AI 出題中，第一次會花上幾秒⋯
      </p>
    );
  }

  const passed = status === "passed";
  const RuntimeRunner = runtime === "python"
    ? PythonPracticeRunner
    : SandpackPracticeRunner;

  return (
    <div className="mt-8 flex flex-col gap-6">
      <div className="max-w-3xl">
        {passed && (
          <div className="mb-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
            🎉 過關！這個節點已在技能樹上亮燈。
            {review?.next ? (
              <a
                href={withDraftPreview(
                  `/lesson/${review.next.id}`,
                  previewPathId,
                )}
                className="ml-1 underline"
              >
                下一站：{review.next.title}
              </a>
            ) : review?.pathComplete ? (
              <a
                href={withDraftPreview(
                  `/tree/${review.pathId}`,
                  previewPathId,
                )}
                className="ml-1 underline"
              >
                這條路徑已完成，返回技能樹
              </a>
            ) : null}
          </div>
        )}
        <h2 className="text-sm font-semibold text-[#17242D]/70">題目</h2>
        <div className="mt-2 rounded-lg border border-[#17242D]/15 px-4 py-3 text-[15px]">
          {renderPromptContent(workspace.description)}
        </div>
        {review && (
          <>
            <h2 className="mt-6 text-sm font-semibold text-[#17242D]/70">
              AI review{review.verdict === "fail" && "（未過，改完再送一次）"}
            </h2>
            <ul className="mt-2 space-y-2">
              {review.comments.map((comment) => (
                <li
                  key={comment}
                  className="rounded-lg border border-[#17242D]/15 px-4 py-3 text-sm whitespace-pre-wrap"
                >
                  {comment}
                </li>
              ))}
            </ul>
          </>
        )}
        {!passed && (
          <button
            type="button"
            onClick={() => {
              if (confirm("重新出題會捨棄目前的題目與程式碼，確定？")) {
                setWorkspace(null);
                setRuntime(null);
                setError(null);
                setGeneration((value) => value + 1);
              }
            }}
            className="mt-6 text-xs text-[#17242D]/45 underline hover:text-[#17242D]"
          >
            題目怪怪的？重新出題
          </button>
        )}
      </div>

      <RuntimeRunner
        key={`${runtime}:${generation}`}
        runtime={runtime}
        workspace={workspace}
        initialUserFiles={initialUserFiles}
        onFilesChange={handleFilesChange}
        onResult={setRunnerResult}
      />
      <PracticeResultPanel result={runnerResult} />
      {saveError && <p className="text-xs text-red-700">自動儲存失敗：{saveError}</p>}
      <PracticeEditorControls
        result={runnerResult}
        reviewing={reviewing}
        passed={passed}
        onSubmit={submitReview}
      />
    </div>
  );
}
