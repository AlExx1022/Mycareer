import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { eq } from "drizzle-orm";
import type { UIMessage } from "ai";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { lesson } from "@/db/schema";
import { loadSession } from "@/lib/lesson-session/store";
import LessonChat from "./lesson-chat";

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

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-6 py-10">
      <Link href="/" className="text-sm text-[#17242D]/50 hover:text-[#17242D]">
        ← 回技能樹
      </Link>
      <p className="mt-6 font-mono text-xs text-[#17242D]/45">
        {found.type === "concept" ? "概念節點" : "實作節點"}
      </p>
      <h1 className="mt-1 text-2xl font-bold">{found.title}</h1>
      <h2 className="mt-8 text-sm font-semibold text-[#17242D]/70">
        這一站的考點
      </h2>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-[15px]">
        {found.examPoints.map((p) => (
          <li key={p}>{p}</li>
        ))}
      </ul>
      {chat ? (
        <LessonChat
          slug={slug}
          initialMessages={initialMessages}
          passed={chat.phase === "passed"}
        />
      ) : (
        <p className="mt-10 rounded-lg border border-dashed border-[#17242D]/20 p-4 text-sm text-[#17242D]/55">
          實作型節點即將開通——Sandpack 編輯器正在鋪軌中。
        </p>
      )}
    </main>
  );
}
