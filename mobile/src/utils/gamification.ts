export interface StreakUpdate {
  streak: number;
  lastActiveDate: string;
}

export function updateDailyStreak(
  currentStreak: number,
  lastActiveDate: string,
  now = new Date()
): StreakUpdate {
  const previousActive = new Date(lastActiveDate);
  const todayOrdinal = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const previousOrdinal = Number.isNaN(previousActive.getTime())
    ? Number.NaN
    : Date.UTC(
        previousActive.getFullYear(),
        previousActive.getMonth(),
        previousActive.getDate()
      );
  const daysSinceActive = (todayOrdinal - previousOrdinal) / 86_400_000;

  return {
    streak:
      daysSinceActive === 0
        ? currentStreak
        : daysSinceActive === 1
          ? currentStreak + 1
          : 1,
    lastActiveDate: now.toISOString(),
  };
}
