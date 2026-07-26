import { CANDY } from "./content";

type Station = {
  y: number;
  dx: number;
  state: "lit" | "cracked" | "current" | "locked";
  title: string;
  tag: string;
  color: string;
  // 站色太亮時（金色）標籤另給可讀的深色
  labelColor?: string;
};

const CX = 96;
const STATIONS: Station[] = [
  { y: 40, dx: 0, state: "lit", title: "JSX 編譯成什麼", tag: "已學會", color: CANDY.green },
  { y: 112, dx: -18, state: "lit", title: "render 與 commit", tag: "已學會", color: CANDY.green },
  { y: 184, dx: 0, state: "cracked", title: "closure 陷阱", tag: "太久沒複習，裂開了", color: CANDY.purple },
  { y: 256, dx: 18, state: "current", title: "useEffect 依賴陣列", tag: "你在這裡", color: CANDY.gold, labelColor: CANDY.goldDark },
  { y: 328, dx: 0, state: "locked", title: "寫一個 useDebounce", tag: "還沒解鎖", color: CANDY.locked },
];

function path() {
  return STATIONS.map((s, i) => {
    const x = CX + s.dx;
    if (i === 0) return `M ${x} ${s.y}`;
    const prev = STATIONS[i - 1];
    const my = (prev.y + s.y) / 2;
    return `C ${CX + prev.dx} ${my}, ${x} ${my}, ${x} ${s.y}`;
  }).join(" ");
}

// 技能樹片段：一眼看完三種節點狀態，重點是「裂開」——這是與靜態路線圖的差別
export function DiagramTree() {
  return (
    <svg
      viewBox="0 0 340 380"
      className="w-full max-w-[340px]"
      role="img"
      aria-label="技能樹片段：兩個已學會的節點、一個太久沒複習而裂開的節點、目前所在的節點，以及一個還沒解鎖的實作節點"
    >
      <path
        d={path()}
        fill="none"
        stroke={CANDY.locked}
        strokeWidth="10"
        strokeLinecap="round"
      />
      {STATIONS.map((s) => {
        const x = CX + s.dx;
        const locked = s.state === "locked";
        const shade = locked ? "#C9C9C9" : s.color;
        return (
          <g key={s.title}>
            <circle cx={x} cy={s.y + 5} r="22" fill={shade} opacity="0.55" />
            <circle
              cx={x}
              cy={s.y}
              r="22"
              fill={locked ? CANDY.locked : s.color}
            />
            {s.state === "lit" && (
              <path
                d={`M ${x - 9} ${s.y} l 6 7 l 12 -14`}
                stroke="#fff"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            )}
            {s.state === "cracked" && (
              <path
                d={`M ${x} ${s.y - 14} l -5 11 l 8 4 l -6 8 l 3 9`}
                stroke="#fff"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            )}
            {s.state === "current" && (
              <>
                <circle
                  cx={x}
                  cy={s.y}
                  r="29"
                  fill="none"
                  stroke={CANDY.gold}
                  strokeWidth="3"
                  opacity="0.45"
                />
                <circle cx={x} cy={s.y} r="7" fill="#fff" />
              </>
            )}
            {s.state === "locked" && (
              <>
                <rect
                  x={x - 8}
                  y={s.y - 2}
                  width="16"
                  height="11"
                  rx="3"
                  fill="#AFAFAF"
                />
                <path
                  d={`M ${x - 5} ${s.y - 2} v -4 a 5 5 0 0 1 10 0 v 4`}
                  stroke="#AFAFAF"
                  strokeWidth="3"
                  fill="none"
                />
              </>
            )}
            <text
              x={x + 36}
              y={s.y - 2}
              className="fill-[#17242D] font-sans text-[13px] font-extrabold"
            >
              {s.title}
            </text>
            <text
              x={x + 36}
              y={s.y + 14}
              className="font-mono text-[10px] font-bold"
              fill={locked ? "#AFAFAF" : (s.labelColor ?? s.color)}
            >
              {s.tag}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
