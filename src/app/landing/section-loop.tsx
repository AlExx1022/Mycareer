import { CANDY } from "./content";
import { stats } from "./stats";
import { Card, Lead, Section } from "./section-shell";

const FLOW = [
  { step: "挑一個節點", note: "從你目前的位置往下走" },
  { step: "AI 教一輪", note: "對話式，不是影片" },
  { step: "出題檢核", note: "答不出來就換角度再教" },
  { step: "確認懂了才亮燈", note: "亮燈才解鎖下一個節點" },
];

export function SectionLoop() {
  return (
    <Section
      id="l03"
      code="L03"
      eyebrow="怎麼學"
      color={CANDY.green}
      title="不是看完打勾，是答得出來才算過"
    >
      <Lead>
        每個節點都先教再考。答錯不會直接給你答案，它會換個角度重講一次再問——問到確認你真的懂，這個節點才會亮燈。
      </Lead>

      <ol className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {FLOW.map((f, i) => (
          <li
            key={f.step}
            className="rounded-3xl border-2 border-[#E5E5E5] bg-white p-4"
          >
            <span className="font-mono text-[11px] font-bold text-[#17242D]/35">
              {String(i + 1).padStart(2, "0")}
            </span>
            <p className="mt-1.5 text-sm font-extrabold">{f.step}</p>
            <p className="mt-1 text-xs leading-relaxed font-bold text-[#17242D]/50">
              {f.note}
            </p>
          </li>
        ))}
      </ol>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Card title={`觀念題 ${stats.concept} 個節點`} color={CANDY.blue}>
          用一問一答把觀念問到底，像面試官追問一樣，確認你不是背下來而已。
        </Card>
        <Card title={`實作題 ${stats.practice} 個節點`} color={CANDY.orange}>
          直接在瀏覽器裡寫程式，跑測試看有沒有過，再由 AI 給一次程式碼建議。
        </Card>
      </div>

      <p className="mt-6 max-w-3xl text-sm leading-relaxed font-medium text-[#17242D]/65">
        一個節點會再拆成幾個小單元，由淺入深、每單元 3–5
        題。已經會的節點可以直接勾起來跳過，從你真正的位置開始。
      </p>
    </Section>
  );
}
