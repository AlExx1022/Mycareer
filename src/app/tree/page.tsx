import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import {
  getPublishedLearningPathsForUser,
} from "@/db/queries/skill-tree";
import { withDraftPreview } from "@/lib/draft-preview";
import { SignOutButton } from "../sign-out-button";

export const metadata: Metadata = {
  title: "學習路徑｜Mycareer",
  description: "選擇一條面試導向的工程師學習路徑，從目前進度繼續。",
};

export default async function LearningPathsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const paths = await getPublishedLearningPathsForUser(session.user.id);
  const pathCards = paths.map((path) => ({ path, isDraft: false }));

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <header className="flex flex-wrap items-start justify-between gap-4 pb-8">
          <div>
            <p className="font-mono text-xs font-bold tracking-wider text-[#E8590C]">
              LEARNING PATHS
            </p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight">
              選擇學習路徑
            </h1>
            <p className="mt-2 max-w-xl text-sm font-medium text-[#17242D]/55">
              每條路徑各自保存進度；先進入路徑，再從技能樹選擇下一站。
            </p>
          </div>
          <div className="flex items-center gap-3 text-sm font-medium text-[#17242D]/70">
            <span>{session.user.email}</span>
            <SignOutButton />
          </div>
        </header>

        {pathCards.length === 0 ? (
          <p className="rounded-3xl border-2 border-dashed border-[#17242D]/15 px-6 py-10 text-center text-sm text-[#17242D]/55">
            目前沒有已發布的學習路徑。
          </p>
        ) : (
          <div className="grid gap-5 md:grid-cols-2">
            {pathCards.map(({ path, isDraft }) => {
              const percentage = path.totalLessons
                ? Math.round((path.completedLessons / path.totalLessons) * 100)
                : 0;
              return (
                <article
                  key={path.id}
                  className="flex min-w-0 flex-col rounded-3xl border-2 border-[#17242D]/10 bg-white p-6 [box-shadow:0_5px_0_#E5E5E5]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-mono text-xs font-bold tracking-wide text-[#0B7285]">
                        {path.subject}
                      </p>
                      <h2 className="mt-1 text-xl font-extrabold tracking-tight">
                        {path.title}
                      </h2>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                      {isDraft ? (
                        <span className="rounded-full bg-amber-100 px-3 py-1 text-[11px] font-extrabold text-amber-800">
                          DRAFT 試走
                        </span>
                      ) : null}
                      <span className="rounded-full bg-[#FFF4E6] px-3 py-1 text-xs font-extrabold text-[#E8590C]">
                        {percentage}%
                      </span>
                    </div>
                  </div>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-[#17242D]/60">
                    {path.description}
                  </p>

                  {path.recommendedPrerequisites.length > 0 && (
                    <p className="mt-4 text-xs font-semibold text-[#17242D]/50">
                      建議先修：
                      {path.recommendedPrerequisites
                        .map((value) => value.title)
                        .join("、")}
                      （不影響解鎖）
                    </p>
                  )}

                  <div className="mt-5">
                    <div className="flex justify-between text-xs font-bold text-[#17242D]/50">
                      <span>完成進度</span>
                      <span>
                        {path.completedLessons} / {path.totalLessons}
                      </span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#17242D]/10">
                      <div
                        className="h-full rounded-full bg-[#58CC02]"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>

                  <Link
                    href={withDraftPreview(
                      `/tree/${path.id}`,
                      isDraft ? path.id : null,
                    )}
                    className="mt-6 rounded-2xl bg-[#17242D] px-5 py-3 text-center text-sm font-extrabold text-white transition hover:opacity-90"
                  >
                    {isDraft
                      ? path.completedLessons > 0
                        ? "繼續試走"
                        : "進入試走"
                      : path.completedLessons > 0
                        ? "繼續學習"
                        : "進入路徑"}{" "}
                    →
                  </Link>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
