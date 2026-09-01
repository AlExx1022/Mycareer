import { javascriptInterviewCoreCurriculum } from "./javascript-interview-core";
import { reactJuniorMidCurriculum } from "./react-junior-mid";

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
export { reactJuniorMidCurriculum } from "./react-junior-mid";

export const curricula = [
  javascriptInterviewCoreCurriculum,
  reactJuniorMidCurriculum,
];
