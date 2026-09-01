import { curricula } from "@/db/curriculum";

// 公開 LP 統計一律從 published curriculum 算；draft 完成發布後數字自動跟上。
const published = curricula.filter((path) => path.status === "published");
const units = published.flatMap((path) => path.units);
const lessons = units.flatMap((unit) => unit.lessons);

export const stats = {
  paths: published.length,
  units: units.length,
  lessons: lessons.length,
  concept: lessons.filter((l) => l.type === "concept").length,
  practice: lessons.filter((l) => l.type === "practice").length,
  topics: new Set(lessons.map((l) => l.topic)).size,
};
