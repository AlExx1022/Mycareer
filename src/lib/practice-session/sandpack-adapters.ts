import type { PracticeRuntime } from "@/db/curriculum/types";
import type { PracticeWorkspace } from "./workspace";

export type SandpackRuntime = Exclude<PracticeRuntime, "python">;
export type SandpackTemplate = "react-ts" | "vanilla-ts" | "vanilla";

export type SandpackAdapter = {
  template: SandpackTemplate;
  files: Record<
    string,
    string | { code: string; readOnly: boolean; hidden?: boolean }
  >;
  visibleFiles: string[];
  activeFile: string;
  customSetup?: {
    dependencies: Record<string, string>;
  };
};

const REACT_TS_DEPENDENCIES = {
  "@testing-library/react": "latest",
  "@testing-library/jest-dom": "latest",
  "@testing-library/dom": "latest",
};
const VANILLA_JS_DEPENDENCIES = {
  "@babel/core": "7.22.5",
  "@babel/preset-env": "7.22.5",
};

const TEMPLATE_BY_RUNTIME: Record<SandpackRuntime, SandpackTemplate> = {
  "react-ts": "react-ts",
  "vanilla-ts": "vanilla-ts",
  "vanilla-js": "vanilla",
};

export function createSandpackAdapter(
  runtime: SandpackRuntime,
  workspace: PracticeWorkspace,
): SandpackAdapter {
  const setupCode = workspace.files
    .filter((file) => file.role === "setup")
    .map((file) => file.code)
    .join("\n");

  const files = Object.fromEntries(
    workspace.files.map((file) => {
      const code = file.role === "test" && setupCode
        ? `${setupCode}\n${file.code}`
        : file.code;
      return [
        file.path,
        {
          code,
          readOnly: file.readOnly,
          ...(file.role === "setup" ? { hidden: true } : {}),
        },
      ];
    }),
  );
  const bootstrapPath = runtime === "vanilla-ts" ? "/index.ts" : "/index.js";
  if (
    (runtime === "vanilla-ts" || runtime === "vanilla-js") &&
    !files[bootstrapPath]
  ) {
    files[bootstrapPath] = {
      code: `import ${JSON.stringify(`.${workspace.entryFile}`)};`,
      readOnly: true,
      hidden: true,
    };
  }
  if (runtime === "vanilla-js") {
    files["/.babelrc"] = {
      code: JSON.stringify({ presets: ["@babel/preset-env"] }),
      readOnly: true,
      hidden: true,
    };
  }

  return {
    template: TEMPLATE_BY_RUNTIME[runtime],
    files,
    visibleFiles: workspace.files
      .filter((file) => file.role !== "setup")
      .map((file) => file.path),
    activeFile: workspace.entryFile,
    ...(runtime === "react-ts"
      ? { customSetup: { dependencies: REACT_TS_DEPENDENCIES } }
      : runtime === "vanilla-js"
        ? { customSetup: { dependencies: VANILLA_JS_DEPENDENCIES } }
        : {}),
  };
}
