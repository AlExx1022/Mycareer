import { pgTable, text, jsonb, timestamp, primaryKey } from "drizzle-orm/pg-core";
import { user } from "./auth-schema";
import { lesson } from "./skill-tree-schema";

export type PracticeExercise = {
  description: string;
  starterCode: string;
  testCode: string;
};

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
    exercise: jsonb("exercise").$type<PracticeExercise>().notNull(),
    userCode: text("user_code").notNull(),
    status: text("status").$type<PracticeStatus>().notNull(),
    updatedAt: timestamp("updated_at").notNull(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.lessonId] })],
);
