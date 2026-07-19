import { MASTERY_THRESHOLD } from "./skill-tree";

// ponytail: 校準旋鈕——半衰期與裂開門檻是預設手感，真實使用後再調
export const HALF_LIFE_DAYS = 14;
export const CRACK_THRESHOLD = 55;

const DAY_MS = 86_400_000;

// 遺忘曲線：指數半衰期衰減，讀取時計算、不落地
export function effectiveScore(
  score: number,
  assessedAt: Date,
  now = new Date(),
): number {
  const days = Math.max(0, (now.getTime() - assessedAt.getTime()) / DAY_MS);
  return score * 2 ** (-days / HALF_LIFE_DAYS);
}

// 裂開＝曾亮燈（raw 達門檻）且有效掌握度跌破裂開門檻；遲滯區間（55–70）維持亮燈
export function isCracked(
  score: number,
  assessedAt: Date,
  now = new Date(),
): boolean {
  return (
    score >= MASTERY_THRESHOLD &&
    effectiveScore(score, assessedAt, now) < CRACK_THRESHOLD
  );
}
