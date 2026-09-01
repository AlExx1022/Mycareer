import assert from "node:assert";
import type { LessonContext } from "@/db/queries/lesson-context";
import { systemPrompt } from "./graph";
import { STATE_VERSION } from "./store";
import { freshUnitsState, questionRules } from "./units";

const reactContext: LessonContext = {
  lessonId: "jsx-compiles-to-what",
  title: "JSX 編譯成什麼",
  lessonType: "concept",
  topic: "JSX 與渲染",
  intro: null,
  subject: "React",
  codeLanguage: "TypeScript",
  pathId: "react-junior-mid",
  pathTitle: "React Junior → Mid",
  examPoints: ["JSX 是語法糖"],
  rubric: [],
  practiceRuntime: null,
  practiceBlueprint: null,
};

const reactPrompt = systemPrompt(reactContext, "提出一題檢核。");
assert.match(reactPrompt, /React/);
assert.match(reactPrompt, /TypeScript/);
assert.match(questionRules(reactContext.codeLanguage), /TypeScript/);
assert.equal(
  freshUnitsState(reactContext).units[0].examPoint,
  reactContext.examPoints[0],
  "既有 React session 仍依原 lessonId 的考點建立單元",
);
assert.equal(STATE_VERSION, 2, "多路徑遷移不應使既有 React session snapshot 失效");

const pythonContext: LessonContext = {
  ...reactContext,
  lessonId: "python-fixture",
  title: "Python fixture",
  subject: "Python",
  codeLanguage: "Python",
  pathId: "python-fixture",
  pathTitle: "Python Fixture",
};
const pythonPrompt = systemPrompt(pythonContext, "提出一題檢核。");
assert.match(pythonPrompt, /Python/);
assert.ok(!pythonPrompt.includes("TypeScript"));
assert.ok(!questionRules("Python").includes("TypeScript"));

console.log("lesson context self-check OK");
