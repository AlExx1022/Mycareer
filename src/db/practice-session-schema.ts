import { pgTable, text, jsonb, timestamp, primaryKey } from "drizzle-orm/pg-core";
import { user } from "./auth-schema";
import { lesson } from "./skill-tree-schema";
import type {
  PracticeUserFiles,
  StoredPracticeExercise,
} from "@/lib/practice-session/workspace";

export type {
  LegacyPracticeExercise,
  PracticeUserFiles,
  PracticeWorkspace,
  StoredPracticeExercise as PracticeExercise,
} from "@/lib/practice-session/workspace";

export type PracticeStatus = "in_progress" | "passed";

export const practiceSession = pgTable(
  "practice_session",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    lessonId: text("lesson_id")
      .notNull()
      .references(() => lesson.id, { onDelete: "cascade" }),
    exercise: jsonb("exercise").$type<StoredPracticeExercise>().notNull(),
    userCode: text("user_code").notNull(),
    userFiles: jsonb("user_files").$type<PracticeUserFiles>(),
    status: text("status").$type<PracticeStatus>().notNull(),
    updatedAt: timestamp("updated_at").notNull(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.lessonId] })],
);
