import type { Metadata } from "next";
import Link from "next/link";
import { GITHUB_URL } from "./landing/content";
import { SectionCta } from "./landing/section-cta";
import { SectionDifference } from "./landing/section-difference";
import { SectionHero } from "./landing/section-hero";
import { SectionLoop } from "./landing/section-loop";
import { SectionMemory } from "./landing/section-memory";
import { Spine } from "./landing/spine";

export const metadata: Metadata = {
  title: "Mycareer｜會記得你的學習系統",
  description:
    "排好順序的技能樹加上 AI 教學與檢核：答得出來才算過，太久沒複習的節點會裂開回到複習清單。個人作品集專案。",
  openGraph: {
    title: "Mycareer｜會記得你的學習系統",
    description:
      "排好順序的技能樹加上 AI 教學與檢核：答得出來才算過，太久沒複習的節點會裂開回到複習清單。",
    type: "website",
  },
};

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white">
      <Spine />
      <div className="mx-auto max-w-[1180px] px-5 pb-10 sm:px-8 lg:pl-24">
        <SectionHero />
        <SectionDifference />
        <SectionLoop />
        <SectionMemory />
        <SectionCta />
        <footer className="flex flex-wrap items-center justify-between gap-3 border-t-2 border-[#17242D]/8 py-8 text-xs font-bold text-[#17242D]/45">
          <span className="font-mono">Mycareer</span>
          <span className="flex gap-4">
            <Link href={GITHUB_URL} className="hover:text-[#17242D]">
              GitHub
            </Link>
            <Link href="/login" className="hover:text-[#17242D]">
              登入
            </Link>
          </span>
        </footer>
      </div>
    </main>
  );
}
