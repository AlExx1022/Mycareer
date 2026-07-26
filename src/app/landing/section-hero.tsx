import { CANDY, GITHUB_URL } from "./content";
import { stats } from "./stats";
import { DemoCta } from "./demo-cta";
import { DiagramTree } from "./diagram-tree";
import { GhostLink } from "./section-shell";

const figures = [
  { n: stats.units, unit: "個單元" },
  { n: stats.lessons, unit: "個節點" },
  { n: stats.topics, unit: "個主題" },
  { n: stats.practice, unit: "個實作題" },
];

export function SectionHero() {
  return (
    <section id="l01" className="scroll-mt-20 pt-14 pb-16">
      <div className="flex items-center gap-2">
        <span
          className="rounded-lg px-2 py-0.5 font-mono text-[11px] font-bold text-white"
          style={{ background: CANDY.blue }}
        >
          L01
        </span>
        <span className="font-mono text-[11px] font-bold tracking-wide text-[#17242D]/45">
          MYCAREER ／ 個人作品集專案
        </span>
      </div>

      <div className="mt-7 grid gap-12 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-center lg:gap-16">
        <div>
          <h1 className="text-[40px] leading-[1.12] font-extrabold tracking-tight sm:text-[56px]">
            教到你真的懂,
            <br />
            才算學會。
          </h1>
          <p className="mt-6 max-w-xl text-[17px] leading-[1.8] font-medium text-[#17242D]/70">
            一張排好順序的學習地圖，走到哪一站，AI 就教你那一站的東西，教完當場考你。答得出來才亮燈解鎖下一站；太久沒複習的站會裂開，提醒你回來。
          </p>

          <dl className="mt-8 flex flex-wrap gap-x-9 gap-y-3">
            {figures.map((f) => (
              <div key={f.unit}>
                <dt className="sr-only">{f.unit}</dt>
                <dd className="flex items-baseline gap-1.5">
                  <span className="font-mono text-[26px] font-bold">{f.n}</span>
                  <span className="text-xs font-bold text-[#17242D]/50">
                    {f.unit}
                  </span>
                </dd>
              </div>
            ))}
          </dl>

          <div className="mt-9 flex flex-wrap items-center gap-3">
            <DemoCta label="用 demo 帳號直接逛 →" />
            <GhostLink href={GITHUB_URL}>看原始碼</GhostLink>
          </div>
          <p className="mt-3 text-xs font-bold text-[#17242D]/40">
            不用註冊，一鍵登入現成的 demo 帳號。
          </p>
        </div>

        <div className="justify-self-center lg:justify-self-end">
          <DiagramTree />
        </div>
      </div>
    </section>
  );
}
