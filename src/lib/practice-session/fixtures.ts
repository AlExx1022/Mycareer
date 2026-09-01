import type { PracticeRuntime } from "@/db/curriculum/types";
import type { PracticeWorkspace } from "./workspace";

export type PracticeRuntimeFixture = {
  runtime: PracticeRuntime;
  title: string;
  workspace: PracticeWorkspace;
};

export const PRACTICE_RUNTIME_FIXTURES: Record<
  PracticeRuntime,
  PracticeRuntimeFixture
> = {
  "react-ts": {
    runtime: "react-ts",
    title: "React TypeScript：計數器",
    workspace: {
      version: 2,
      description: "實作一個可調整步進值的計數器。",
      entryFile: "/Counter.tsx",
      files: [
        {
          path: "/Counter.tsx",
          role: "starter",
          readOnly: false,
          code: `import { useState } from "react";
import { nextCount } from "./counter";

export function Counter({ step = 1 }: { step?: number }) {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount((value) => nextCount(value, step))}>{count}</button>;
}`,
        },
        {
          path: "/counter.ts",
          role: "starter",
          readOnly: false,
          code: "export const nextCount = (value: number, step: number) => value + step;\n",
        },
        {
          path: "/Counter.test.tsx",
          role: "test",
          readOnly: true,
          code: `import { fireEvent, render, screen } from "@testing-library/react";
import { Counter } from "./Counter";

describe("Counter", () => {
  it("使用指定步進值累加", () => {
    render(<Counter step={2} />);
    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByRole("button")).toHaveTextContent("2");
  });
});`,
        },
        {
          path: "/setup.ts",
          role: "setup",
          readOnly: true,
          code: "import '@testing-library/jest-dom';",
        },
      ],
    },
  },
  "vanilla-ts": {
    runtime: "vanilla-ts",
    title: "Vanilla TypeScript：安全平均值",
    workspace: {
      version: 2,
      description: "計算數字陣列平均值，空陣列回傳 null。",
      entryFile: "/average.ts",
      files: [
        {
          path: "/average.ts",
          role: "starter",
          readOnly: false,
          code: `import { sum } from "./sum";

export function average(values: number[]): number | null {
  return values.length === 0 ? null : sum(values) / values.length;
}`,
        },
        {
          path: "/sum.ts",
          role: "starter",
          readOnly: false,
          code: "export const sum = (values: number[]) => values.reduce((total, value) => total + value, 0);\n",
        },
        {
          path: "/average.test.ts",
          role: "test",
          readOnly: true,
          code: `import { average } from "./average";

describe("average", () => {
  it("計算平均值", () => expect(average([2, 4, 6])).toBe(4));
  it("處理空陣列", () => expect(average([])).toBeNull());
});`,
        },
      ],
    },
  },
  "vanilla-js": {
    runtime: "vanilla-js",
    title: "Vanilla JavaScript：依類別分組",
    workspace: {
      version: 2,
      description: "將資料依 category 分組，且不可改動輸入陣列。",
      entryFile: "/group-by.js",
      files: [
        {
          path: "/group-by.js",
          role: "starter",
          readOnly: false,
          code: `import { appendItem } from "./group-utils";

export function groupByCategory(items) {
  return items.reduce((groups, item) => appendItem(groups, item.category, item), {});
}`,
        },
        {
          path: "/group-utils.js",
          role: "starter",
          readOnly: false,
          code: `export function appendItem(groups, key, item) {
  return { ...groups, [key]: [...(groups[key] ?? []), item] };
}`,
        },
        {
          path: "/group-by.test.js",
          role: "test",
          readOnly: true,
          code: `import { groupByCategory } from "./group-by";

describe("groupByCategory", () => {
  it("依 category 分組", () => {
    expect(groupByCategory([{ category: "a", id: 1 }, { category: "a", id: 2 }]).a).toHaveLength(2);
  });
  it("處理空陣列", () => expect(groupByCategory([])).toEqual({}));
});`,
        },
      ],
    },
  },
  python: {
    runtime: "python",
    title: "Python：單字頻率",
    workspace: {
      version: 2,
      description: "忽略大小寫後統計單字出現次數。",
      entryFile: "/word_frequency.py",
      files: [
        {
          path: "/word_frequency.py",
          role: "starter",
          readOnly: false,
          code: `from helpers import normalize_word

def word_frequency(words):
    result = {}
    for word in words:
        normalized = normalize_word(word)
        result[normalized] = result.get(normalized, 0) + 1
    return result
`,
        },
        {
          path: "/helpers.py",
          role: "starter",
          readOnly: false,
          code: `def normalize_word(word):
    return word.lower()
`,
        },
        {
          path: "/test_word_frequency.py",
          role: "test",
          readOnly: true,
          code: `from word_frequency import word_frequency

def test_counts_words_case_insensitively():
    assert word_frequency(["JS", "js", "Python"]) == {"js": 2, "python": 1}

def test_handles_empty_input():
    assert word_frequency([]) == {}
`,
        },
      ],
    },
  },
};

