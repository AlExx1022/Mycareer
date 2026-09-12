import { javascriptInterviewCoreCurriculum } from "./javascript-interview-core";
import { javascriptReactInterviewCoreCurriculum } from "./javascript-react-interview-core";
import { pythonInterviewCoreCurriculum } from "./python-interview-core";
import { reactJuniorMidCurriculum } from "./react-junior-mid";
import { typescriptFrontendCoreCurriculum } from "./typescript-frontend-core";

export type {
  CurriculumLesson,
  CurriculumPath,
  CurriculumPathStatus,
  CurriculumUnit,
  LessonIntro,
  PracticeBlueprint,
  PracticeRuntime,
  RubricItem,
} from "./types";
export { PRACTICE_RUNTIMES, resolvePracticeRuntime } from "./types";
export { javascriptInterviewCoreCurriculum } from "./javascript-interview-core";
export { javascriptReactInterviewCoreCurriculum } from "./javascript-react-interview-core";
export { pythonInterviewCoreCurriculum } from "./python-interview-core";
export { reactJuniorMidCurriculum } from "./react-junior-mid";
export { typescriptFrontendCoreCurriculum } from "./typescript-frontend-core";

export const curricula = [
  javascriptInterviewCoreCurriculum,
  typescriptFrontendCoreCurriculum,
  reactJuniorMidCurriculum,
  pythonInterviewCoreCurriculum,
  javascriptReactInterviewCoreCurriculum,
];
