import type { PracticeRuntime } from "@/db/curriculum/types";
import type {
  PracticeUserFiles,
  PracticeWorkspace,
} from "./workspace";

export type TypeScriptLabFixture = {
  lessonId: string;
  title: string;
  runtime: Extract<PracticeRuntime, "vanilla-ts" | "react-ts">;
  workspace: PracticeWorkspace;
  validUserFiles: PracticeUserFiles;
  runtimePassTypeFailureFiles: PracticeUserFiles;
};

function withCompileFailure(code: string) {
  return `${code}\nconst compileGateMustFail: number = "runtime tests still pass";\nvoid compileGateMustFail;\n`;
}

const profileCode = `export type Profile = { id: number; name: string };
export type ParseResult =
  | { ok: true; value: Profile }
  | { ok: false; error: string };

export function parseProfile(input: unknown): ParseResult {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    return { ok: false, error: "profile must be an object" };
  }
  if (
    !("id" in input) ||
    !("name" in input) ||
    typeof input.id !== "number" ||
    typeof input.name !== "string"
  ) {
    return { ok: false, error: "invalid profile fields" };
  }
  return { ok: true, value: { id: input.id, name: input.name } };
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
`;

const asyncStateCode = `export type AsyncState<T> =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: T }
  | { status: "error"; error: string };

export type AsyncEvent<T> =
  | { type: "start" }
  | { type: "resolve"; data: T }
  | { type: "reject"; error: string }
  | { type: "reset" };

export function transition<T>(
  _state: AsyncState<T>,
  event: AsyncEvent<T>,
): AsyncState<T> {
  switch (event.type) {
    case "start":
      return { status: "loading" };
    case "resolve":
      return { status: "success", data: event.data };
    case "reject":
      return { status: "error", error: event.error };
    case "reset":
      return { status: "idle" };
    default: {
      const exhaustive: never = event;
      return exhaustive;
    }
  }
}

export function renderState<T>(state: AsyncState<T>): string {
  switch (state.status) {
    case "idle":
      return "idle";
    case "loading":
      return "loading";
    case "success":
      return "success:" + JSON.stringify(state.data);
    case "error":
      return "error:" + state.error;
    default: {
      const exhaustive: never = state;
      return exhaustive;
    }
  }
}
`;

const dataPageCode = `import { useEffect, useState } from "react";

export type Item = { id: number; name: string };
export type ParseResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: string };
type PageState =
  | { status: "loading" }
  | { status: "success"; items: Item[] }
  | { status: "empty" }
  | { status: "error"; error: string };

function isItem(item: unknown): item is Item {
  return (
    typeof item === "object" &&
    item !== null &&
    "id" in item &&
    typeof item.id === "number" &&
    "name" in item &&
    typeof item.name === "string"
  );
}

export function parseItems(input: unknown): ParseResult<Item[]> {
  if (typeof input !== "object" || input === null || !("items" in input)) {
    return { ok: false, error: "invalid response" };
  }
  const { items } = input;
  if (!Array.isArray(items)) return { ok: false, error: "items must be an array" };
  if (!items.every(isItem)) return { ok: false, error: "invalid item" };
  return { ok: true, value: items };
}

export default function TypedDataPage({
  fetchItems,
}: {
  fetchItems: () => Promise<unknown>;
}) {
  const [state, setState] = useState<PageState>({ status: "loading" });
  useEffect(() => {
    let active = true;
    fetchItems()
      .then(parseItems)
      .then((result) => {
        if (!active) return;
        if (!result.ok) return setState({ status: "error", error: result.error });
        setState(
          result.value.length === 0
            ? { status: "empty" }
            : { status: "success", items: result.value },
        );
      })
      .catch((error: unknown) => {
        if (active) {
          setState({
            status: "error",
            error: error instanceof Error ? error.message : String(error),
          });
        }
      });
    return () => {
      active = false;
    };
  }, [fetchItems]);

  switch (state.status) {
    case "loading":
      return <p>Loading</p>;
    case "empty":
      return <p>No items</p>;
    case "error":
      return <p role="alert">{state.error}</p>;
    case "success":
      return <ul>{state.items.map((item) => <li key={item.id}>{item.name}</li>)}</ul>;
    default: {
      const exhaustive: never = state;
      return exhaustive;
    }
  }
}
`;

export const TYPESCRIPT_LAB_FIXTURES: TypeScriptLabFixture[] = [
  {
    lessonId: "ts-unsafe-any-clinic",
    title: "Unsafe Any Clinic",
    runtime: "vanilla-ts",
    workspace: {
      version: 2,
      description: "從 unknown 驗證 profile，並安全處理 catch value。",
      entryFile: "/profile.ts",
      files: [
        {
          path: "/profile.ts",
          role: "starter",
          readOnly: false,
          code: profileCode,
        },
        {
          path: "/profile.test.ts",
          role: "test",
          readOnly: true,
          code: `import { errorMessage, parseProfile } from "./profile";

describe("profile boundary", () => {
  it("accepts a valid profile", () =>
    expect(parseProfile({ id: 1, name: "Ada" })).toEqual({
      ok: true,
      value: { id: 1, name: "Ada" },
    }));
  it("rejects invalid fields", () =>
    expect(parseProfile({ id: "1", name: "Ada" }).ok).toBe(false));
  it("handles non-Error throws", () =>
    expect(errorMessage("offline")).toBe("offline"));
});`,
        },
      ],
    },
    validUserFiles: { "/profile.ts": profileCode },
    runtimePassTypeFailureFiles: {
      "/profile.ts": withCompileFailure(profileCode),
    },
  },
  {
    lessonId: "ts-async-state-machine-lab",
    title: "Async State Machine",
    runtime: "vanilla-ts",
    workspace: {
      version: 2,
      description: "以 discriminated union 建立 async transition 與 exhaustive renderer。",
      entryFile: "/async-state.ts",
      files: [
        {
          path: "/async-state.ts",
          role: "starter",
          readOnly: false,
          code: asyncStateCode,
        },
        {
          path: "/async-state.test.ts",
          role: "test",
          readOnly: true,
          code: `import { renderState, transition } from "./async-state";

describe("async state", () => {
  it("moves from loading to success", () => {
    const loading = transition({ status: "idle" }, { type: "start" });
    const success = transition(loading, { type: "resolve", data: [] });
    expect(renderState(success)).toBe("success:[]");
  });
  it("clears an error on retry", () =>
    expect(transition({ status: "error", error: "offline" }, { type: "start" }))
      .toEqual({ status: "loading" }));
});`,
        },
      ],
    },
    validUserFiles: { "/async-state.ts": asyncStateCode },
    runtimePassTypeFailureFiles: {
      "/async-state.ts": withCompileFailure(asyncStateCode),
    },
  },
  {
    lessonId: "ts-typed-data-page-capstone",
    title: "Typed Data Page",
    runtime: "react-ts",
    workspace: {
      version: 2,
      description: "驗證 unknown response 並以互斥 state 呈現 React data page。",
      entryFile: "/TypedDataPage.tsx",
      files: [
        {
          path: "/TypedDataPage.tsx",
          role: "starter",
          readOnly: false,
          code: dataPageCode,
        },
        {
          path: "/TypedDataPage.test.tsx",
          role: "test",
          readOnly: true,
          code: `import { render, screen } from "@testing-library/react";
import TypedDataPage from "./TypedDataPage";

describe("TypedDataPage", () => {
  it("renders validated items", async () => {
    render(<TypedDataPage fetchItems={async () => ({ items: [{ id: 1, name: "Ada" }] })} />);
    expect(await screen.findByText("Ada")).toBeInTheDocument();
  });
  it("renders a validation error", async () => {
    render(<TypedDataPage fetchItems={async () => ({ items: "bad" })} />);
    expect(await screen.findByRole("alert")).toHaveTextContent("items must be an array");
  });
});`,
        },
        {
          path: "/setup.ts",
          role: "setup",
          readOnly: true,
          code: `import "@testing-library/jest-dom";`,
        },
      ],
    },
    validUserFiles: { "/TypedDataPage.tsx": dataPageCode },
    runtimePassTypeFailureFiles: {
      "/TypedDataPage.tsx": withCompileFailure(dataPageCode),
    },
  },
];
