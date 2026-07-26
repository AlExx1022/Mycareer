import { CANDY, COMPARISON } from "./content";
import { Lead, Section } from "./section-shell";

function Cell({ value }: { value: boolean | "static" }) {
  if (value === "static") {
    return (
      <span className="font-mono text-[11px] font-bold text-[#17242D]/45">
        靜態
      </span>
    );
  }
  return value ? (
    <span className="font-bold" style={{ color: CANDY.green }} aria-label="有">
      ✓
    </span>
  ) : (
    <span className="font-bold text-[#C9C9C9]" aria-label="沒有">
      ✕
    </span>
  );
}

export function SectionDifference() {
  return (
    <Section
      id="l02"
      code="L02"
      eyebrow="為什麼需要"
      color={CANDY.blue}
      title="跟 AI 學習很方便，但很難學得完整"
    >
      <Lead>
        現在大家都會問 AI，但那通常是零散的——今天問一個、明天問一個，沒有順序也沒有進度，AI
        不記得你學過什麼，你也不知道接下來該學什麼。這個專案要補的就是這段：把路排好，而且記得你走到哪。
      </Lead>

      <div className="mt-7 overflow-x-auto">
        <table className="w-full min-w-[440px] border-collapse text-sm">
          <thead>
            <tr>
              <th className="w-2/5" />
              {COMPARISON.columns.map((c, i) => (
                <th
                  key={c}
                  className={`px-3 pb-3 text-center text-xs font-extrabold ${
                    i === COMPARISON.columns.length - 1
                      ? "text-[#17242D]"
                      : "text-[#17242D]/45"
                  }`}
                >
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {COMPARISON.rows.map((r) => (
              <tr key={r.label} className="border-t-2 border-[#17242D]/8">
                <td className="py-3 text-sm font-bold text-[#17242D]/75">
                  {r.label}
                </td>
                {r.cells.map((cell, i) => (
                  <td key={i} className="px-3 py-3 text-center">
                    <Cell value={cell} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-6 max-w-3xl text-sm leading-relaxed font-medium text-[#17242D]/65">
        借 Duolingo 的是學習結構，不是那層外皮：路線、關卡、檢核、錯題會回來找你，這些留下；連續打卡天數、寶石、吉祥物那些不要。
      </p>
    </Section>
  );
}
