import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { eq } from "drizzle-orm";
import type { UIMessage } from "ai";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { lesson } from "@/db/schema";
import { loadSession } from "@/lib/lesson-session/store";
import { stripQuestion, type QuestionData } from "@/lib/lesson-session/units";
import LessonChat from "./lesson-chat";
import PracticeSession from "./practice-session";

export default async function LessonPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/login");
  }

  const { slug } = await params;
  const [found] = await db.select().from(lesson).where(eq(lesson.id, slug));
  if (!found) {
    notFound();
  }

  const chat =
    found.type === "concept"
      ? await loadSession(session.user.id, slug)
      : null;
  const initialMessages: UIMessage[] =
    chat?.messages.map((m, i) => ({
      id: `restored-${i}`,
      role: m.role,
      parts: [{ type: "text", text: m.content }],
    })) ?? [];

  // 續作時還原當前題目（剝除答案版）
  let initialQuestion: QuestionData | null = null;
  if (chat?.phase === "units" && chat.unitsState) {
    const us = chat.unitsState;
    const unit = us.units[us.currentUnit];
    const q = unit?.questions[unit.current];
    if (q) {
      initialQuestion = {
        question: stripQuestion(q),
        progress: {
          unit: us.currentUnit + 1,
          totalUnits: us.units.length,
          question: unit.current + 1,
          totalQuestions: unit.questions.length,
        },
      };
    }
  }

  return (
    <main
      className={`mx-auto min-h-screen px-6 py-8 ${
        found.type === "practice" ? "max-w-6xl" : "max-w-2xl"
      }`}
    >
      <Link href="/" className="text-sm text-[#17242D]/55 hover:text-[#17242D]">
        ← 回技能樹
      </Link>
      <p className="mt-6 font-mono text-xs text-[#17242D]/45">
        {found.type === "concept" ? "概念節點" : "實作節點"}
        {found.topic ? ` · ${found.topic}` : null}
      </p>
      <h1 className="mt-1 text-2xl font-bold">{found.title}</h1>
      {found.intro ? (
        <section className="mt-6 space-y-4">
          <p className="text-[17px] font-medium leading-relaxed">
            {found.intro.hook}
          </p>
          <div>
            <h2 className="text-sm font-semibold text-[#17242D]/70">
              實際場景
            </h2>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-[15px]">
              {found.intro.scenarios.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </div>
          <p className="text-[15px]">
            <span className="font-semibold text-[#17242D]/70">學完你能：</span>
            {found.intro.outcome}
          </p>
          <details className="text-sm text-[#17242D]/60">
            <summary className="cursor-pointer font-semibold">
              這一站的考點
            </summary>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {found.examPoints.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </details>
        </section>
      ) : (
        <>
          <h2 className="mt-8 text-sm font-semibold text-[#17242D]/70">
            這一站的考點
          </h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-[15px]">
            {found.examPoints.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </>
      )}
      {chat ? (
        <LessonChat
          slug={slug}
          initialMessages={initialMessages}
          passed={chat.phase === "passed"}
          initialQuestion={initialQuestion}
        />
      ) : (
        <PracticeSession slug={slug} />
      )}
    </main>
  );
}
