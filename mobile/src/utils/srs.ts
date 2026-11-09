/**
 * SuperMemo SM-2 SRS Algorithm implementation
 * Calculates next interval and ease factor based on review quality (0 - 5)
 */
export interface SRSReviewResult {
  interval: number;
  repetition: number;
  easeFactor: number;
  dueDate: string;
}

export function calculateSRS(
  quality: number, // 0 to 5
  repetition: number,
  previousInterval: number,
  previousEaseFactor: number
): SRSReviewResult {
  if (!Number.isInteger(quality) || quality < 0 || quality > 5) {
    throw new RangeError('Review quality must be an integer between 0 and 5.');
  }

  let nextRepetition = repetition;
  let nextInterval = previousInterval;
  let nextEaseFactor = previousEaseFactor;

  if (quality >= 3) {
    if (nextRepetition === 0) {
      nextInterval = 1;
    } else if (nextRepetition === 1) {
      nextInterval = 6;
    } else {
      nextInterval = Math.round(previousInterval * nextEaseFactor);
    }
    nextRepetition += 1;
  } else {
    nextRepetition = 0;
    nextInterval = 1;
  }

  // SM-2 Ease Factor formula
  nextEaseFactor = Number(
    (
      previousEaseFactor +
      (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
    ).toFixed(2)
  );

  if (nextEaseFactor < 1.3) {
    nextEaseFactor = 1.3;
  }

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + nextInterval);

  return {
    interval: nextInterval,
    repetition: nextRepetition,
    easeFactor: nextEaseFactor,
    dueDate: dueDate.toISOString(),
  };
}
