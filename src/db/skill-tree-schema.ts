import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  integer,
  timestamp,
  jsonb,
  primaryKey,
  index,
  check,
} from "drizzle-orm/pg-core";
import { user } from "./auth-schema";
import type {
  CurriculumPathStatus,
  LessonIntro,
  PracticeBlueprint,
  PracticeRuntime,
  RubricItem,
} from "./curriculum/types";

export type {
  CurriculumPathStatus,
  LessonIntro,
  PracticeBlueprint,
  PracticeRuntime,
  RubricItem,
} from "./curriculum/types";

export const learningPath = pgTable(
  "learning_path",
  {
    id: text("id").primaryKey(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    subject: text("subject").notNull(),
    codeLanguage: text("code_language").notNull(),
    status: text("status", { enum: ["draft", "published"] })
      .$type<CurriculumPathStatus>()
      .notNull(),
    position: integer("position").notNull(),
  },
  (table) => [
    check(
      "learning_path_status_check",
      sql`${table.status} in ('draft', 'published')`,
    ),
  ],
);

export const learningPathRecommendation = pgTable(
  "learning_path_recommendation",
  {
    pathId: text("path_id")
      .notNull()
      .references(() => learningPath.id, { onDelete: "cascade" }),
    recommendedPathId: text("recommended_path_id")
      .notNull()
      .references(() => learningPath.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.pathId, table.recommendedPathId] }),
    check(
      "learning_path_recommendation_not_self_check",
      sql`${table.pathId} <> ${table.recommendedPathId}`,
    ),
  ],
);

// ponytail: slug 直接當 primary key，seed upsert 不用另查 id
export const unit = pgTable(
  "unit",
  {
    id: text("id").primaryKey(),
    pathId: text("path_id")
      .notNull()
      .references(() => learningPath.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    position: integer("position").notNull(),
  },
  (table) => [index("unit_pathId_idx").on(table.pathId)],
);

export const lesson = pgTable(
  "lesson",
  {
    id: text("id").primaryKey(),
    unitId: text("unit_id")
      .notNull()
      .references(() => unit.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    type: text("type", { enum: ["concept", "practice"] }).notNull(),
    position: integer("position").notNull(),
    examPoints: jsonb("exam_points").$type<string[]>().notNull(),
    rubric: jsonb("rubric").$type<RubricItem[]>().notNull(),
    // C4.6：topic 供地圖聚群、intro 為概念節點課前導入；nullable 走 additive migration，必填由 seed selfcheck 把關
    topic: text("topic"),
    intro: jsonb("intro").$type<LessonIntro>(),
    practiceRuntime: text("practice_runtime", {
      enum: ["react-ts", "vanilla-ts", "vanilla-js", "python"],
    }).$type<PracticeRuntime>(),
    practiceBlueprint: jsonb("practice_blueprint").$type<PracticeBlueprint>(),
  },
  (table) => [
    index("lesson_unitId_idx").on(table.unitId),
    check("lesson_type_check", sql`${table.type} in ('concept', 'practice')`),
    check(
      "lesson_practice_runtime_check",
      sql`${table.practiceRuntime} is null or ${table.practiceRuntime} in ('react-ts', 'vanilla-ts', 'vanilla-js', 'python')`,
    ),
  ],
);

export const lessonDependency = pgTable(
  "lesson_dependency",
  {
    lessonId: text("lesson_id")
      .notNull()
      .references(() => lesson.id, { onDelete: "cascade" }),
    dependsOnLessonId: text("depends_on_lesson_id")
      .notNull()
      .references(() => lesson.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.lessonId, table.dependsOnLessonId] }),
  ],
);

export const userLessonMastery = pgTable(
  "user_lesson_mastery",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    lessonId: text("lesson_id")
      .notNull()
      .references(() => lesson.id, { onDelete: "cascade" }),
    score: integer("score").notNull(),
    assessedAt: timestamp("assessed_at").notNull(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.lessonId] })],
);
