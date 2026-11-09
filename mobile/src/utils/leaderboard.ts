export interface XPEvent {
  amount: number;
  createdAt: string;
}

export function getCurrentWeekXP(events: XPEvent[], referenceDate = new Date()): number {
  const weekStart = new Date(referenceDate.getTime());
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));

  return events.reduce((total, event) => {
    const eventDate = new Date(event.createdAt);
    if (Number.isNaN(eventDate.getTime()) || eventDate < weekStart || eventDate > referenceDate) {
      return total;
    }

    return total + event.amount;
  }, 0);
}
