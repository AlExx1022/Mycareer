export type RubricItem = {
  criterion: string;
  passCondition: string;
};

export type LessonIntro = {
  hook: string;
  scenarios: string[];
  outcome: string;
};

export const PRACTICE_RUNTIMES = [
  "react-ts",
  "vanilla-ts",
  "vanilla-js",
  "python",
] as const;

export type PracticeRuntime = (typeof PRACTICE_RUNTIMES)[number];

export type PracticeBlueprint = {
  objective: string;
  requirements: string[];
  edgeCases: string[];
  starterSignature?: string;
  timeboxMinutes: number;
  followUps: string[];
};

type BaseCurriculumLesson = {
  slug: string;
  title: string;
  topic: string;
  dependsOn: string[];
  examPoints: string[];
  rubric: RubricItem[];
};

export type CurriculumLesson = BaseCurriculumLesson &
  (
    | {
        type: "concept";
        intro: LessonIntro;
        practiceRuntime?: never;
        practiceBlueprint?: never;
      }
    | {
        type: "practice";
        intro?: LessonIntro;
        practiceRuntime?: PracticeRuntime;
        practiceBlueprint: PracticeBlueprint;
      }
  );

export type CurriculumUnit = {
  slug: string;
  title: string;
  lessons: CurriculumLesson[];
};

export type CurriculumPathStatus = "draft" | "published";

export type CurriculumPath = {
  id: string;
  title: string;
  description: string;
  subject: string;
  codeLanguage: string;
  status: CurriculumPathStatus;
  position: number;
  recommendedPrerequisitePathIds: string[];
  defaultPracticeRuntime?: PracticeRuntime;
  units: CurriculumUnit[];
};

export function resolvePracticeRuntime(
  path: CurriculumPath,
  lesson: Extract<CurriculumLesson, { type: "practice" }>,
): PracticeRuntime | undefined {
  return lesson.practiceRuntime ?? path.defaultPracticeRuntime;
}
