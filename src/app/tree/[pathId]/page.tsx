import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getSkillTreeForUser } from "@/db/queries/skill-tree";
import { resolveDraftPreviewPath } from "@/lib/draft-preview";
import { SkillTreeMap } from "../../skill-tree-map";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ pathId: string }>;
}): Promise<Metadata> {
  const { pathId } = await params;
  return { title: `${pathId} 學習路徑｜Mycareer` };
}

export default async function LearningPathPage({
  params,
  searchParams,
}: {
  params: Promise<{ pathId: string }>;
  searchParams: Promise<{ preview?: string | string[] }>;
}) {
  const [requestHeaders, { pathId }, query] = await Promise.all([
    headers(),
    params,
    searchParams,
  ]);
  const previewPathId = resolveDraftPreviewPath(query.preview, pathId);
  const session = await auth.api.getSession({ headers: requestHeaders });
  if (!session) redirect("/login");

  const tree = await getSkillTreeForUser(session.user.id, pathId, {
    includeDraft: previewPathId !== null,
  });
  if (!tree) notFound();

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-2xl px-3 py-8 sm:px-6">
        <Link
          href="/tree"
          className="text-sm font-bold text-[#17242D]/55 hover:text-[#17242D]"
        >
          ← 所有學習路徑
        </Link>
        <header className="pb-6 pt-5">
          {previewPathId && (
            <p className="mb-3 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800">
              Draft 試走模式 · 進度會保留，但此路徑尚未公開
            </p>
          )}
          <p className="font-mono text-xs font-bold tracking-wide text-[#0B7285]">
            {tree.path.subject} · {tree.path.codeLanguage}
          </p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight">
            {tree.path.title}
          </h1>
          <p className="mt-2 text-sm font-medium leading-relaxed text-[#17242D]/55">
            {tree.path.description}
          </p>
          {tree.recommendedPrerequisites.length > 0 && (
            <div className="mt-4 rounded-2xl bg-[#FFF7E0] px-4 py-3 text-sm text-[#17242D]/65">
              建議先修：
              {tree.recommendedPrerequisites.map((item, index) => (
                <span key={item.id}>
                  {index > 0 ? "、" : ""}
                  <Link
                    href={`/tree/${item.id}`}
                    className="font-bold underline underline-offset-2"
                  >
                    {item.title}
                  </Link>
                </span>
              ))}
              。這只是建議，不影響目前節點解鎖。
            </div>
          )}
        </header>
        <SkillTreeMap units={tree.units} previewPathId={previewPathId} />
      </div>
    </main>
  );
}
