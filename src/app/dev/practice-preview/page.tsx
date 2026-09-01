"use client";

import { useState } from "react";
import {
  SandpackProvider,
  SandpackLayout,
  SandpackCodeEditor,
  SandpackTests,
  useSandpack,
} from "@codesandbox/sandpack-react";
import { renderPromptContent } from "@/app/code-prompt";
import {
  EXERCISE_FILE,
  TEST_FILE,
  allTestsPass,
  type DescribeNode,
} from "@/app/lesson/[slug]/practice-session";

// react-ts 樣板預設不含 testing-library，mock testCode 用了它測 UI 行為，這裡補上依賴
const SANDBOX_DEPENDENCIES = {
  "@testing-library/react": "latest",
  "@testing-library/jest-dom": "latest",
  "@testing-library/dom": "latest",
};
const JEST_DOM_SETUP = "import '@testing-library/jest-dom';\n";

// 假資料頁：不打真的 API/DB/LLM，Sandpack 編輯器與測試是真的在跑，
// 只有「AI review」那一步是假的（LLM 呼叫），用下面的切換模擬 pass/fail 結果。

const MOCK_DESCRIPTION = `### 實作：受控表單 - 使用者註冊介面

在 React 中，受控元件（Controlled Components）是指表單資料由 React state 管理的技術。這題練習多欄位 state 設計與即時驗證。

#### 需求描述
1. **表單欄位**：
   - 使用者名稱 (\`username\`)：文字輸入框
   - 電子郵件 (\`email\`)：文字輸入框
2. **受控邏輯**：所有欄位的值都來自同一個 state 物件，透過共用的 \`handleChange\` 更新。
3. **即時驗證**：\`username\` 少於 3 個字時，即時顯示錯誤訊息。

#### 輸入輸出範例
- 輸入：\`username\` 打 \`"Jo"\`
- 輸出：畫面顯示「使用者名稱至少 3 個字」
`;

const MOCK_STARTER_CODE = `import React, { useState, ChangeEvent } from 'react';

interface FormData {
  username: string;
  email: string;
}

interface Props {
  onSubmitSuccess: (data: FormData) => void;
}

export const RegistrationForm: React.FC<Props> = ({ onSubmitSuccess }) => {
  // TODO: 初始化單一物件 state 管理所有欄位
  const [formData, setFormData] = useState<FormData>({ username: '', email: '' });

  // TODO: 實作通用的 handleChange
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
  };

  return (
    <form>
      <label htmlFor="username">使用者名稱：</label>
      <input id="username" name="username" value={formData.username} onChange={handleChange} />
      {/* TODO: username 少於 3 個字時顯示錯誤訊息 */}

      <label htmlFor="email">電子郵件：</label>
      <input id="email" name="email" value={formData.email} onChange={handleChange} />
    </form>
  );
};
`;

const MOCK_TEST_CODE = `import { RegistrationForm } from './exercise';
import { render, fireEvent, screen } from '@testing-library/react';

describe('RegistrationForm 受控表單測試', () => {
  it('初始狀態應為空值', () => {
    render(<RegistrationForm onSubmitSuccess={() => {}} />);
    expect(screen.getByLabelText(/使用者名稱/i)).toHaveValue('');
  });

  it('輸入時應正確更新 state（受控元件驗證）', () => {
    render(<RegistrationForm onSubmitSuccess={() => {}} />);
    const input = screen.getByLabelText(/使用者名稱/i);
    fireEvent.change(input, { target: { name: 'username', value: 'Alice' } });
    expect(input).toHaveValue('Alice');
  });

  it('欄位長度不足應即時顯示錯誤訊息', () => {
    render(<RegistrationForm onSubmitSuccess={() => {}} />);
    const input = screen.getByLabelText(/使用者名稱/i);
    fireEvent.change(input, { target: { name: 'username', value: 'Jo' } });
    expect(screen.getByText('使用者名稱至少 3 個字')).toBeTruthy();
  });
});
`;

const MOCK_REVIEW = {
  pass: {
    verdict: "pass" as const,
    comments: [
      "state 設計乾淨，單一物件管理所有欄位。",
      "handleChange 有正確處理 checkbox 與一般 input 的差異。",
      "邊界情況（空值、格式錯誤）都有涵蓋。",
    ],
  },
  fail: {
    verdict: "fail" as const,
    comments: [
      "handleChange 沒有用 name 動態更新對應欄位，寫死了單一欄位。",
      "沒有清空前一次的錯誤訊息，切換輸入時舊錯誤會殘留。",
      "測試意圖沒有真正被滿足，這樣不算過關。",
    ],
  },
};

const MOCK_SOLUTION_CODE = `import React, { useState, ChangeEvent } from 'react';

interface FormData {
  username: string;
  email: string;
}

interface Props {
  onSubmitSuccess: (data: FormData) => void;
}

export const RegistrationForm: React.FC<Props> = ({ onSubmitSuccess }) => {
  const [formData, setFormData] = useState<FormData>({ username: '', email: '' });

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const usernameError =
    formData.username.length > 0 && formData.username.length < 3
      ? '使用者名稱至少 3 個字'
      : '';

  return (
    <form>
      <label htmlFor="username">使用者名稱：</label>
      <input id="username" name="username" value={formData.username} onChange={handleChange} />
      {usernameError && <p>{usernameError}</p>}

      <label htmlFor="email">電子郵件：</label>
      <input id="email" name="email" value={formData.email} onChange={handleChange} />
    </form>
  );
};
`;

// 物件字面值若寫在 JSX inline，每次 render 都是新參照，
// 會讓 SandpackProvider 內部的 reset effect 誤判成「檔案被換了」而清空編輯器內容
const SANDPACK_FILES = {
  [EXERCISE_FILE]: MOCK_STARTER_CODE,
  [TEST_FILE]: { code: JEST_DOM_SETUP + MOCK_TEST_CODE, readOnly: true },
};
const SANDPACK_CUSTOM_SETUP = { dependencies: SANDBOX_DEPENDENCIES };

const FAKE_DELAY_MS = 900;
function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// 假頁專用：一鍵把編輯器內容換成範例解答，不用自己動手寫就能讓測試轉綠、往後看畫面狀態
function FillSolutionButton() {
  const { sandpack } = useSandpack();
  return (
    <button
      onClick={() => sandpack.updateFile(EXERCISE_FILE, MOCK_SOLUTION_CODE)}
      className="mt-2 text-xs text-[#17242D]/45 underline hover:text-[#17242D]"
    >
      填入範例解答（跳過手動寫程式，直接看測試全過的畫面）
    </button>
  );
}

// 對應真正 PracticeSession 裡的 EditorControls：需要 useSandpack 拿最新程式碼
function EditorControls({
  testsPassed,
  reviewing,
  passed,
  onSubmit,
}: {
  testsPassed: boolean;
  reviewing: boolean;
  passed: boolean;
  onSubmit: () => void;
}) {
  const { sandpack } = useSandpack();
  void sandpack.files[EXERCISE_FILE]?.code; // 假頁不需要真的送出程式碼

  if (passed) return null;
  return (
    <button
      onClick={onSubmit}
      disabled={!testsPassed || reviewing}
      className="mt-3 w-full rounded-lg bg-[#17242D] py-3 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
    >
      {reviewing
        ? "AI review 中⋯"
        : testsPassed
          ? "測試全過，送出 AI review"
          : "先讓所有測試通過"}
    </button>
  );
}

export default function PracticePreviewPage() {
  const [generation, setGeneration] = useState(0);
  const [testsPassed, setTestsPassed] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [review, setReview] = useState<typeof MOCK_REVIEW.pass | typeof MOCK_REVIEW.fail | null>(
    null,
  );
  const [mockOutcome, setMockOutcome] = useState<"pass" | "fail">("pass");
  const passed = review?.verdict === "pass";

  async function fakeSubmitReview() {
    setReviewing(true);
    await wait(FAKE_DELAY_MS);
    setReview(MOCK_REVIEW[mockOutcome]);
    setReviewing(false);
  }

  function reset() {
    setTestsPassed(false);
    setReviewing(false);
    setReview(null);
    setGeneration((g) => g + 1);
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <p className="font-mono text-xs text-[#17242D]/45">
        /dev/practice-preview ・ 假資料頁，不打真的 API/DB/LLM，只有 AI review
        結果是模擬的
      </p>
      <h1 className="mt-1 text-2xl font-bold">實作題頁面預覽</h1>

      <div className="mt-4 flex flex-wrap items-center gap-3 rounded-lg border border-[#17242D]/15 px-4 py-3 text-sm">
        <span className="font-semibold text-[#17242D]/70">
          模擬送出後 AI review 結果：
        </span>
        <div className="flex gap-2">
          {(["pass", "fail"] as const).map((o) => (
            <button
              key={o}
              onClick={() => setMockOutcome(o)}
              className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                mockOutcome === o
                  ? "border-[#17242D] bg-[#17242D] text-white"
                  : "border-[#17242D]/20 text-[#17242D]/60 hover:border-[#17242D]/40"
              }`}
            >
              {o === "pass" ? "通過" : "不通過"}
            </button>
          ))}
        </div>
        <button
          onClick={reset}
          className="ml-auto text-xs text-[#17242D]/45 underline hover:text-[#17242D]"
        >
          重設畫面
        </button>
      </div>

      <div className="mt-6 flex flex-col gap-6">
        <div className="max-w-3xl">
          {passed && (
            <div className="mb-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
              🎉 過關！這個節點已在技能樹上亮燈。
              <a href="#" className="ml-1 underline">
                下一站：實作：元件拆分與組合
              </a>
            </div>
          )}
          <h2 className="text-sm font-semibold text-[#17242D]/70">題目</h2>
          <div className="mt-2 rounded-lg border border-[#17242D]/15 px-4 py-3 text-[15px]">
            {renderPromptContent(MOCK_DESCRIPTION)}
          </div>
          {review && (
            <>
              <h2 className="mt-6 text-sm font-semibold text-[#17242D]/70">
                AI review{review.verdict === "fail" && "（未過，改完再送一次）"}
              </h2>
              <ul className="mt-2 space-y-2">
                {review.comments.map((c) => (
                  <li
                    key={c}
                    className="rounded-lg border border-[#17242D]/15 px-4 py-3 text-sm whitespace-pre-wrap"
                  >
                    {c}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        <SandpackProvider
          key={generation}
          template="react-ts"
          theme="dark"
          customSetup={SANDPACK_CUSTOM_SETUP}
          files={SANDPACK_FILES}
          options={{
            visibleFiles: [EXERCISE_FILE, TEST_FILE],
            activeFile: EXERCISE_FILE,
          }}
        >
          {/* .practice-sandbox：sp-editor/sp-tests 的高度斷點寫在 globals.css，
              用 !important 蓋掉套件注入的 flex-basis:0（見該處註解） */}
          <div className="practice-sandbox">
            <SandpackLayout style={{ flexDirection: "column" }}>
              <SandpackCodeEditor showLineNumbers />
              <SandpackTests
                watchMode
                onComplete={(specs: Record<string, DescribeNode>) =>
                  setTestsPassed(allTestsPass(specs))
                }
              />
            </SandpackLayout>
          </div>
          <EditorControls
            testsPassed={testsPassed}
            reviewing={reviewing}
            passed={passed}
            onSubmit={fakeSubmitReview}
          />
          {!passed && !testsPassed && <FillSolutionButton />}
        </SandpackProvider>
      </div>
    </main>
  );
}
