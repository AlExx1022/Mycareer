import {
  pgTable,
  text,
  integer,
  timestamp,
  jsonb,
  primaryKey,
} from "drizzle-orm/pg-core";
import { user } from "./auth-schema";
import { lesson } from "./skill-tree-schema";
import type {
  UnitQuestion,
  QuestionResult,
} from "@/lib/lesson-session/units";

// C5：複習 session——純題目循環，完成即刪、下次裂開重新出題（design D4）
export const reviewSession = pgTable(
  "review_session",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    lessonId: text("lesson_id")
      .notNull()
      .references(() => lesson.id, { onDelete: "cascade" }),
    version: integer("version").notNull(),
    questions: jsonb("questions").$type<UnitQuestion[]>().notNull(),
    results: jsonb("results").$type<QuestionResult[]>().notNull(),
    current: integer("current").notNull(),
    // 出題所依據的 weakness_record id（可追溯）；無弱點退回考點出題時為空
    sourceWeaknessIds: jsonb("source_weakness_ids").$type<number[]>().notNull(),
    updatedAt: timestamp("updated_at").notNull(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.lessonId] })],
);
