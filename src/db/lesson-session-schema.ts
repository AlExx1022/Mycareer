import {
  pgTable,
  text,
  integer,
  timestamp,
  jsonb,
  primaryKey,
  index,
} from "drizzle-orm/pg-core";
import { user } from "./auth-schema";
import { lesson } from "./skill-tree-schema";
import type { UnitsState } from "@/lib/lesson-session/units";

export type SessionPhase = "units" | "teach" | "check" | "reteach" | "passed";

export type StoredMessage = {
  role: "user" | "assistant";
  content: string;
};

export type CheckState = {
  // criterion 文字 -> 是否已通過
  criterionPassed: Record<string, boolean>;
  failedAttempts: number;
};

export const lessonSession = pgTable(
  "lesson_session",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    lessonId: text("lesson_id")
      .notNull()
      .references(() => lesson.id, { onDelete: "cascade" }),
    // state schema 版本，不相容時整個 session 重開（design D2）
    version: integer("version").notNull(),
    phase: text("phase").$type<SessionPhase>().notNull(),
    messages: jsonb("messages").$type<StoredMessage[]>().notNull(),
    checkState: jsonb("check_state").$type<CheckState>().notNull(),
    // 小單元題目與進度（C4.5）；v1 舊 session 為 null
    unitsState: jsonb("units_state").$type<UnitsState>(),
    updatedAt: timestamp("updated_at").notNull(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.lessonId] })],
);

export const weaknessRecord = pgTable(
  "weakness_record",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    lessonId: text("lesson_id")
      .notNull()
      .references(() => lesson.id, { onDelete: "cascade" }),
    criterion: text("criterion").notNull(),
    summary: text("summary").notNull(),
    createdAt: timestamp("created_at").notNull(),
  },
  (table) => [index("weakness_record_userId_idx").on(table.userId)],
);

export const llmUsage = pgTable(
  "llm_usage",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    // UTC 日期字串 yyyy-mm-dd
    day: text("day").notNull(),
    count: integer("count").notNull(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.day] })],
);
