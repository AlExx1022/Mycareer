import type {
  SkillTreeLesson,
  SkillTreeUnit,
} from "@/db/queries/skill-tree";

export const MASTERY_THRESHOLD = 70;

// cracked 的觸發條件由 C5 衰減機制定義，這裡先保留型別與樣式
export type NodeState = "lit" | "locked" | "available" | "cracked";

export function deriveNodeStates(
  lessons: SkillTreeLesson[],
): Map<string, NodeState> {
  const litSet = new Set(
    lessons
      .filter((l) => (l.mastery?.score ?? 0) >= MASTERY_THRESHOLD)
      .map((l) => l.id),
  );
  return new Map(
    lessons.map((l) => [
      l.id,
      litSet.has(l.id)
        ? "lit"
        : l.dependsOn.some((dep) => !litSet.has(dep))
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

export const COL_W = 168;
export const ROW_H = 104;
export const BAND_GAP = 72;
export const MAP_PAD = 48;
// C4.6 topic 聚群：帶內加高度讓 strip 標籤不撞站碼
export const TOPIC_H = 30;

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

// 捷運路線圖佈局：column = 全圖拓撲層（跨 Unit 依賴共用時間軸），每個 Unit 一條水平帶
export function layoutSkillTree(units: SkillTreeUnit[]): SkillTreeLayout {
  const allLessons = units.flatMap((u) => u.lessons);
  const layers = topoLayers(allLessons);
  const maxLayer = Math.max(...layers.values(), 0);

  const nodes: MapNode[] = [];
  const bands: SkillTreeLayout["bands"] = [];
  const topics: TopicStrip[] = [];
  let bandY = MAP_PAD;

  units.forEach((u, unitIndex) => {
    const lineCode = u.title.match(/[A-Za-z]/)?.[0]?.toUpperCase() ?? String.fromCharCode(82 + unitIndex);
    const rowsInCol = new Map<number, number>();
    const unitNodes: MapNode[] = [];
    let maxRows = 1;
    let stationNo = 0;

    for (const l of u.lessons) {
      const col = layers.get(l.id)!;
      const row = rowsInCol.get(col) ?? 0;
      rowsInCol.set(col, row + 1);
      maxRows = Math.max(maxRows, row + 1);
      stationNo += 1;
      const node = {
        lesson: l,
        unitIndex,
        code: `${lineCode}${String(stationNo).padStart(2, "0")}`,
        x: MAP_PAD + col * COL_W + COL_W / 2,
        y: bandY + TOPIC_H + row * ROW_H + ROW_H / 2,
      };
      nodes.push(node);
      unitNodes.push(node);
    }

    // topic 聚群 strip：包住同 topic 車站（含站碼與站名的留白）
    const byTopic = new Map<string, MapNode[]>();
    for (const n of unitNodes) {
      const t = n.lesson.topic;
      if (!t) continue;
      const group = byTopic.get(t) ?? [];
      group.push(n);
      byTopic.set(t, group);
    }
    for (const [topic, ns] of byTopic) {
      const xs = ns.map((n) => n.x);
      const ys = ns.map((n) => n.y);
      topics.push({
        unitIndex,
        topic,
        x: Math.min(...xs) - 74,
        y: Math.min(...ys) - 64,
        width: Math.max(...xs) - Math.min(...xs) + 148,
        height: Math.max(...ys) - Math.min(...ys) + 110,
      });
    }

    const height = TOPIC_H + maxRows * ROW_H;
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
    width: MAP_PAD * 2 + (maxLayer + 1) * COL_W,
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
