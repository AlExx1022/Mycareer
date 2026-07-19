import type {
  SkillTreeLesson,
  SkillTreeUnit,
} from "@/db/queries/skill-tree";

export const MASTERY_THRESHOLD = 70;

export type NodeState = "lit" | "locked" | "available" | "cracked";

export function deriveNodeStates(
  lessons: SkillTreeLesson[],
): Map<string, NodeState> {
  // 解鎖看 raw score（曾學會就算數）；cracked 只影響視覺與複習佇列，不鎖下游
  const everLit = new Set(
    lessons
      .filter((l) => (l.mastery?.score ?? 0) >= MASTERY_THRESHOLD)
      .map((l) => l.id),
  );
  return new Map(
    lessons.map((l) => [
      l.id,
      everLit.has(l.id)
        ? l.mastery?.cracked
          ? "cracked"
          : "lit"
        : l.dependsOn.some((dep) => !everLit.has(dep))
          ? "locked"
          : "available",
    ]),
  );
}

// layer = 最長依賴鏈深度（僅計算同一批 lessons 內的依賴）
export function topoLayers(lessons: SkillTreeLesson[]): Map<string, number> {
  const byId = new Map(lessons.map((l) => [l.id, l]));
  const layers = new Map<string, number>();

  function layerOf(id: string): number {
    const cached = layers.get(id);
    if (cached !== undefined) return cached;
    const deps = (byId.get(id)?.dependsOn ?? []).filter((d) => byId.has(d));
    const layer =
      deps.length === 0 ? 0 : Math.max(...deps.map(layerOf)) + 1;
    layers.set(id, layer);
    return layer;
  }

  for (const l of lessons) layerOf(l.id);
  return layers;
}

// C6.2 Duolingo 風蜿蜒路線：手機 375px 含頁邊距不溢出
export const MAP_W = 340;
export const CENTER_X = 150;
export const STEP_Y = 120;
export const BAND_GAP = 40;
export const MAP_PAD = 12;
// Unit 滿版彩色橫幅高度（含下方留白）
export const BANNER_H = 76;
// topic strip 頂部留白，strip 標籤不撞站點
export const TOPIC_H = 34;
// 蜿蜒路徑：站點沿中線左右擺動
const SNAKE = [0, -1, 0, 1];
export const SNAKE_AMP = 24;

export type MapNode = {
  lesson: SkillTreeLesson;
  unitIndex: number;
  code: string; // 站碼，如 R03
  x: number;
  y: number;
};

export type MapEdge = { from: string; to: string };

export type TopicStrip = {
  unitIndex: number;
  topic: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type SkillTreeLayout = {
  nodes: MapNode[];
  edges: MapEdge[];
  bands: { unitIndex: number; title: string; code: string; y: number; height: number }[];
  topics: TopicStrip[];
  width: number;
  height: number;
};

// 直立捷運路線圖：單線縱列，站點沿中央路線由上往下（拓撲層為主、position 為輔），每個 Unit 一段縱帶
export function layoutSkillTree(units: SkillTreeUnit[]): SkillTreeLayout {
  const allLessons = units.flatMap((u) => u.lessons);
  const layers = topoLayers(allLessons);

  const nodes: MapNode[] = [];
  const bands: SkillTreeLayout["bands"] = [];
  const topics: TopicStrip[] = [];
  let bandY = MAP_PAD;

  units.forEach((u, unitIndex) => {
    const lineCode = u.title.match(/[A-Za-z]/)?.[0]?.toUpperCase() ?? String.fromCharCode(82 + unitIndex);
    const ordered = u.lessons
      .map((l, i) => ({ l, i }))
      .sort((a, b) => layers.get(a.l.id)! - layers.get(b.l.id)! || a.i - b.i)
      .map(({ l }) => l);

    const unitNodes: MapNode[] = ordered.map((l, idx) => ({
      lesson: l,
      unitIndex,
      code: `${lineCode}${String(idx + 1).padStart(2, "0")}`,
      x: CENTER_X + SNAKE[idx % SNAKE.length] * SNAKE_AMP,
      y: bandY + BANNER_H + TOPIC_H + idx * STEP_Y + STEP_Y / 2,
    }));
    nodes.push(...unitNodes);

    // topic 聚群 strip：縱向包絡（蓋住站圓與右側站名）
    const byTopic = new Map<string, MapNode[]>();
    for (const n of unitNodes) {
      const t = n.lesson.topic;
      if (!t) continue;
      const group = byTopic.get(t) ?? [];
      group.push(n);
      byTopic.set(t, group);
    }
    for (const [topic, ns] of byTopic) {
      const ys = ns.map((n) => n.y);
      topics.push({
        unitIndex,
        topic,
        x: CENTER_X - SNAKE_AMP - 56,
        y: Math.min(...ys) - 54,
        width: MAP_W - (CENTER_X - SNAKE_AMP - 56) - 4,
        height: Math.max(...ys) - Math.min(...ys) + 100,
      });
    }

    const height = BANNER_H + TOPIC_H + ordered.length * STEP_Y;
    bands.push({ unitIndex, title: u.title, code: lineCode, y: bandY, height });
    bandY += height + BAND_GAP;
  });

  const edges: MapEdge[] = allLessons.flatMap((l) =>
    l.dependsOn.map((dep) => ({ from: dep, to: l.id })),
  );

  return {
    nodes,
    edges,
    bands,
    topics,
    width: MAP_W,
    height: bandY - BAND_GAP + MAP_PAD,
  };
}

// 「你在這裡」：路線順序上第一個可學節點
export function findYouAreHere(
  nodes: MapNode[],
  states: Map<string, NodeState>,
): string | null {
  const candidate = nodes.find((n) => states.get(n.lesson.id) === "available");
  return candidate?.lesson.id ?? null;
}
