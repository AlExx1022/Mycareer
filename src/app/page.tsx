import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getSkillTreeForUser } from "@/db/queries/skill-tree";
import { SignOutButton } from "./sign-out-button";
import { SkillTreeMap } from "./skill-tree-map";

export default async function Home() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/login");
  }

  const units = await getSkillTreeForUser(session.user.id);

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <header className="flex flex-wrap items-center justify-between gap-3 pb-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight">React 技能樹</h1>
            <p className="mt-0.5 text-sm text-[#17242D]/55">
              點車站看詳情；已經會的站可以直接標記，從你的位置出發。
            </p>
          </div>
          <div className="flex items-center gap-3 text-sm text-[#17242D]/70">
            <span>{session.user.email}</span>
            <SignOutButton />
          </div>
        </header>
        <SkillTreeMap units={units} />
      </div>
    </main>
  );
}
