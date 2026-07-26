// LP 專用配色：與技能樹同一組糖果色，但刻意重新宣告——
// skill-tree-map.tsx 是 "use client" 且 module scope 就 registerPlugin，import 會把 GSAP 拖進 LP bundle
export const CANDY = {
  blue: "#1CB0F6",
  green: "#58CC02",
  greenDark: "#46A302",
  purple: "#CE82FF",
  orange: "#FF9600",
  gold: "#FFC800",
  goldDark: "#E6A800",
  locked: "#E5E5E5",
  ink: "#17242D",
  accent: "#E8590C",
} as const;

export const GITHUB_URL = "https://github.com/diedie1022/Mycareer";

// LP 的段落＝一條路徑，站碼與技能樹同語法；順序有意義，不是裝飾編號
export const STATIONS = [
  { id: "l01", code: "L01", label: "在做什麼", color: CANDY.blue },
  { id: "l02", code: "L02", label: "為什麼需要", color: CANDY.blue },
  { id: "l03", code: "L03", label: "怎麼學", color: CANDY.green },
  { id: "l04", code: "L04", label: "會記得你", color: CANDY.purple },
  { id: "cta", code: "終", label: "進去看看", color: CANDY.orange },
] as const;

export const COMPARISON = {
  columns: ["自己問 ChatGPT", "看學習路線圖", "這個專案"],
  rows: [
    { label: "有規劃好的學習順序", cells: [false, "static", true] },
    { label: "會教你、能一直追問", cells: [true, false, true] },
    { label: "記得你哪裡還沒懂", cells: [false, false, true] },
    { label: "會驗收你真的學會", cells: [false, false, true] },
  ],
} as const;

export const TECH_TAGS = [
  "Next.js 16",
  "React 19",
  "TypeScript",
  "Tailwind CSS",
  "LangGraph.js",
  "Vercel AI SDK",
  "Postgres / Drizzle",
  "GSAP",
  "Vercel",
];
