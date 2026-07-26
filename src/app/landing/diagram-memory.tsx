import { CANDY } from "./content";

const NODES = [
  {
    x: 78,
    fill: CANDY.green,
    ring: CANDY.greenDark,
    state: "check" as const,
    title: "學會了",
    sub: "通過檢核，節點亮燈",
  },
  {
    x: 238,
    fill: "#BDE59A",
    ring: "#A8D586",
    state: "fade" as const,
    title: "一陣子沒碰",
    sub: "印象開始變淡",
  },
  {
    x: 398,
    fill: CANDY.purple,
    ring: "#A568CC",
    state: "crack" as const,
    title: "裂開了",
    sub: "回到今天的複習清單",
  },
];

const CY = 66;
const R = 30;

// 記憶的三個狀態＋回頭的路：不畫分數座標，故事本身就是重點
export function DiagramMemory() {
  return (
    <svg
      viewBox="0 0 480 268"
      className="w-full max-w-[480px]"
      role="img"
      aria-label="記憶三階段：學會了、一陣子沒碰、裂開了；裂開的節點進入今日複習清單，複習通過後重新亮燈"
    >
      <defs>
        <marker
          id="memory-arrow"
          markerWidth="7"
          markerHeight="7"
          refX="6"
          refY="3.5"
          orient="auto"
        >
          <path d="M0 0 L7 3.5 L0 7 z" fill="#C9C9C9" />
        </marker>
        <marker
          id="memory-arrow-green"
          markerWidth="7"
          markerHeight="7"
          refX="6"
          refY="3.5"
          orient="auto"
        >
          <path d="M0 0 L7 3.5 L0 7 z" fill={CANDY.green} />
        </marker>
      </defs>

      {[0, 1].map((i) => (
        <line
          key={i}
          x1={NODES[i].x + R + 10}
          y1={CY}
          x2={NODES[i + 1].x - R - 14}
          y2={CY}
          stroke="#E0E0E0"
          strokeWidth="3"
          strokeLinecap="round"
          markerEnd="url(#memory-arrow)"
        />
      ))}

      {NODES.map((n) => (
        <g key={n.title}>
          <circle cx={n.x} cy={CY + 5} r={R} fill={n.ring} opacity="0.5" />
          <circle
            cx={n.x}
            cy={CY}
            r={R}
            fill={n.fill}
            stroke={n.state === "crack" ? "#fff" : "none"}
            strokeWidth="2"
          />
          {n.state === "check" && (
            <path
              d={`M ${n.x - 12} ${CY} l 8 9 l 16 -18`}
              stroke="#fff"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          )}
          {n.state === "fade" && (
            <path
              d={`M ${n.x - 12} ${CY} l 8 9 l 16 -18`}
              stroke="#fff"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              opacity="0.55"
            />
          )}
          {n.state === "crack" && (
            <path
              d={`M ${n.x} ${CY - 20} l -7 15 l 11 5 l -8 11 l 4 12`}
              stroke="#fff"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          )}
          <text
            x={n.x}
            y={CY + R + 26}
            textAnchor="middle"
            className="fill-[#17242D] font-sans text-[14px] font-extrabold"
          >
            {n.title}
          </text>
          <text
            x={n.x}
            y={CY + R + 44}
            textAnchor="middle"
            className="fill-[#17242D]/50 font-sans text-[11px] font-bold"
          >
            {n.sub}
          </text>
        </g>
      ))}

      <path
        d={`M ${NODES[2].x} ${CY + R + 56} L ${NODES[2].x} 196`}
        stroke="#E0E0E0"
        strokeWidth="3"
        strokeLinecap="round"
        markerEnd="url(#memory-arrow)"
      />
      <rect
        x="186"
        y="204"
        width="228"
        height="46"
        rx="16"
        fill="#F7EEFF"
        stroke={CANDY.purple}
        strokeWidth="2"
      />
      <text
        x="300"
        y="233"
        textAnchor="middle"
        className="font-sans text-[13px] font-extrabold"
        fill="#8E44C8"
      >
        今日複習清單
      </text>

      <path
        d={`M 186 227 L 78 227 C 44 227, 30 214, 30 178 L 30 ${CY + 24} C 30 ${CY + 4}, 32 ${CY}, 42 ${CY}`}
        fill="none"
        stroke={CANDY.green}
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="7 7"
        markerEnd="url(#memory-arrow-green)"
      />
      <text
        x="44"
        y="176"
        className="font-sans text-[11px] font-bold"
        fill={CANDY.greenDark}
      >
        複習通過 → 重新亮燈
      </text>
    </svg>
  );
}
