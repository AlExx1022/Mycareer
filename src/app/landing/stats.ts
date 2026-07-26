import { curriculum } from "@/db/curriculum/react-junior-mid";

// 課綱統計一律從資料算，不寫死——課綱增修後 LP 數字自動跟上
const lessons = curriculum.flatMap((u) => u.lessons);

export const stats = {
  units: curriculum.length,
  lessons: lessons.length,
  concept: lessons.filter((l) => l.type === "concept").length,
  practice: lessons.filter((l) => l.type === "practice").length,
  topics: new Set(lessons.map((l) => l.topic)).size,
};
