// 艾宾浩斯遗忘曲线的时间间隔（毫秒）
export const STAGE_INTERVALS = [
  10 * 60 * 1000,                  // 0: 10分钟
  30 * 60 * 1000,                  // 1: 30分钟
  12 * 60 * 60 * 1000,             // 2: 12小时
  24 * 60 * 60 * 1000,             // 3: 1天
  2 * 24 * 60 * 60 * 1000,         // 4: 2天
  4 * 24 * 60 * 60 * 1000,         // 5: 4天
  7 * 24 * 60 * 60 * 1000,         // 6: 7天
  15 * 24 * 60 * 60 * 1000,        // 7: 15天
  30 * 24 * 60 * 60 * 1000,        // 8: 30天
];

export const MAX_STAGE = STAGE_INTERVALS.length - 1;

export function getNextReviewDate(currentStage: number): number {
  const interval = STAGE_INTERVALS[Math.min(currentStage, MAX_STAGE)];
  return Date.now() + interval;
}

export function calculateRemember(currentStage: number) {
  const nextStage = Math.min(currentStage + 1, MAX_STAGE);
  return {
    stage: nextStage,
    nextReviewDate: getNextReviewDate(nextStage)
  };
}

export function calculateForget() {
  return {
    stage: 0,
    nextReviewDate: getNextReviewDate(0)
  };
}
