import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getSkillTreeForUser } from "@/db/queries/skill-tree";
import { weaknessesByLesson, type WeaknessSummary } from "@/db/queries/weakness";
import { deriveNodeStates } from "@/lib/skill-tree";

export default async function ReviewPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const units = await getSkillTreeForUser(session.user.id);
  const lessons = units.flatMap((u) => u.lessons);
  const states = deriveNodeStates(lessons);
  const cracked = lessons
    .filter((l) => states.get(l.id) === "cracked")
    .sort((a, b) => (a.mastery?.effective ?? 0) - (b.mastery?.effective ?? 0));
  const weaknesses: Map<string, WeaknessSummary[]> = cracked.length
    ? await weaknessesByLesson(session.user.id)
    : new Map();

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-2xl px-6 py-8">
        <Link href="/" className="text-sm text-[#17242D]/55 hover:text-[#17242D]">
          ← 回技能樹
        </Link>
        <h1 className="mt-3 text-xl font-bold tracking-tight">今日複習</h1>
        <p className="mt-0.5 text-sm text-[#17242D]/55">
          這些車站的記憶裂開了，越上面的越不牢。
        </p>

        {cracked.length === 0 ? (
          <div className="mt-8 rounded-xl border border-[#17242D]/10 bg-white p-8 text-center">
            <p className="text-3xl">🌤️</p>
            <p className="mt-2 font-semibold">記憶都很牢固</p>
            <p className="mt-1 text-sm text-[#17242D]/55">
              目前沒有需要複習的節點，去學點新的吧。
            </p>
          </div>
        ) : (
          <ul className="mt-6 space-y-3">
            {cracked.map((l) => {
              const ws = (weaknesses.get(l.id) ?? []).slice(0, 3);
              const practice = l.type === "practice";
              return (
                <li key={l.id}>
                  <Link
                    href={practice ? `/lesson/${l.id}` : `/review/${l.id}`}
                    className="block rounded-xl border border-[#17242D]/10 bg-white p-4 hover:border-[#E8590C]/50"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <h2 className="font-semibold">{l.title}</h2>
                      <span className="shrink-0 rounded-full bg-[#FFF4E6] px-2.5 py-0.5 font-mono text-xs font-semibold text-[#E8590C]">
                        記憶 {l.mastery?.effective ?? 0}%
                      </span>
                    </div>
                    {ws.length > 0 && (
                      <ul className="mt-2 space-y-1 text-sm text-[#17242D]/60">
                        {ws.map((w) => (
                          <li key={w.id}>・{w.summary}</li>
                        ))}
                      </ul>
                    )}
                    <p className="mt-2 text-xs font-medium text-[#E8590C]">
                      {practice ? "重做實作題 →" : "開始複習 →"}
                    </p>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}
