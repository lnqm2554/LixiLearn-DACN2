import { Flashcard } from '../types';

export type RecommendedAction = 'review_now' | 'normal_schedule' | 'challenge_mode';

export function getNextCardIndex(
  cards: Flashcard[],
  currentIndex: number,
  action: RecommendedAction = 'normal_schedule'
): number | null {
  const candidates = cards
    .map((card, index) => ({ card, index }))
    .filter(({ index }) => index > currentIndex);

  if (candidates.length === 0) return null;
  if (action === 'normal_schedule') return candidates[0].index;

  if (action === 'review_now') {
    candidates.sort(
      (a, b) =>
        a.card.repetition - b.card.repetition ||
        a.card.interval - b.card.interval ||
        new Date(a.card.dueDate).getTime() - new Date(b.card.dueDate).getTime()
    );
    return candidates[0].index;
  }

  const difficultyRank = { easy: 1, medium: 2, hard: 3 };
  candidates.sort(
    (a, b) => difficultyRank[b.card.difficulty] - difficultyRank[a.card.difficulty]
  );
  return candidates[0].index;
}
