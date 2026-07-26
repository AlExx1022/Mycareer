import { CANDY, GITHUB_URL, TECH_TAGS } from "./content";
import { DemoCta } from "./demo-cta";
import { GhostLink } from "./section-shell";

export function SectionCta() {
  return (
    <section id="cta" className="scroll-mt-20 py-16">
      <div className="rounded-[2rem] border-2 border-[#17242D]/10 bg-[#F7FBF3] p-7 sm:p-10">
        <span
          className="rounded-lg px-2 py-0.5 font-mono text-[11px] font-bold text-white"
          style={{ background: CANDY.orange }}
        >
          終點站
        </span>
        <h2 className="mt-4 text-2xl font-extrabold tracking-tight sm:text-3xl">
          直接進去逛比看說明快
        </h2>
        <p className="mt-3 max-w-xl text-[15px] leading-relaxed font-medium text-[#17242D]/70">
          demo 帳號已經備好課程與進度，點一下就能看到技能樹、上一節課、把節點考到亮燈。不用填任何欄位。
        </p>
        <div className="mt-7 flex flex-wrap items-center gap-3">
          <DemoCta label="用 demo 帳號直接逛 →" />
          <GhostLink href={GITHUB_URL}>看原始碼</GhostLink>
        </div>

        <ul className="mt-9 flex flex-wrap gap-2 border-t-2 border-[#17242D]/8 pt-6">
          {TECH_TAGS.map((t) => (
            <li
              key={t}
              className="rounded-lg bg-white px-2.5 py-1 font-mono text-[11px] font-bold text-[#17242D]/55"
            >
              {t}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
