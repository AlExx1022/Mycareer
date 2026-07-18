import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { lessonSession } from "@/db/schema";
import type { CheckState, SessionPhase, StoredMessage } from "@/db/schema";
import type { UnitsState } from "./units";

// state schema 版本；不相容時整個 session 重開（design D2）
export const STATE_VERSION = 2;

export type SessionSnapshot = {
  phase: SessionPhase;
  messages: StoredMessage[];
  checkState: CheckState;
  unitsState: UnitsState | null;
};

export function freshSession(): SessionSnapshot {
  return {
    phase: "units",
    messages: [],
    checkState: { criterionPassed: {}, failedAttempts: 0 },
    unitsState: null,
  };
}

export async function loadSession(
  userId: string,
  lessonId: string,
): Promise<SessionSnapshot> {
  const [row] = await db
    .select()
    .from(lessonSession)
    .where(
      and(
        eq(lessonSession.userId, userId),
        eq(lessonSession.lessonId, lessonId),
      ),
    );
  if (!row || row.version !== STATE_VERSION) return freshSession();
  return {
    phase: row.phase,
    messages: row.messages,
    checkState: row.checkState,
    unitsState: row.unitsState,
  };
}

export async function saveSession(
  userId: string,
  lessonId: string,
  snapshot: SessionSnapshot,
) {
  const row = {
    version: STATE_VERSION,
    phase: snapshot.phase,
    messages: snapshot.messages,
    checkState: snapshot.checkState,
    unitsState: snapshot.unitsState,
    updatedAt: new Date(),
  };
  await db
    .insert(lessonSession)
    .values({ userId, lessonId, ...row })
    .onConflictDoUpdate({
      target: [lessonSession.userId, lessonSession.lessonId],
      set: row,
    });
}
