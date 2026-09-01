import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { and, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { userLessonMastery } from "@/db/schema";
import { getLessonContext } from "@/db/queries/lesson-context";
import { isCracked } from "@/lib/mastery-decay";
import { stripQuestion } from "@/lib/lesson-session/units";
import { loadReview } from "@/lib/review-session";
import ReviewSession from "./review-session";

export default async function ReviewLessonPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");
  const userId = session.user.id;

  const { slug } = await params;
  const found = await getLessonContext(slug);
  if (!found || found.lessonType !== "concept") notFound();

  const snapshot = await loadReview(userId, slug);
  if (!snapshot) {
    // 沒有進行中的複習且節點未裂開 → 回佇列
    const [mastery] = await db
      .select()
      .from(userLessonMastery)
      .where(
        and(
          eq(userLessonMastery.userId, userId),
          eq(userLessonMastery.lessonId, slug),
        ),
      );
    if (!mastery || !isCracked(mastery.score, mastery.assessedAt)) {
      redirect("/review");
    }
  }

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-2xl px-6 py-8">
        <Link
          href="/review"
          className="text-sm text-[#17242D]/55 hover:text-[#17242D]"
        >
          ← 回複習佇列
        </Link>
        <h1 className="mt-3 text-xl font-bold tracking-tight">
          複習：{found.title}
        </h1>
        <ReviewSession
          slug={slug}
          initial={
            snapshot
              ? {
                  question: stripQuestion(snapshot.questions[snapshot.current]),
                  progress: {
                    question: snapshot.current + 1,
                    totalQuestions: snapshot.questions.length,
                  },
                }
              : null
          }
        />
      </div>
    </main>
  );
}
