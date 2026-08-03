export function fundedPercent(fundedAmount: number, goalAmount: number) {
  return goalAmount > 0 ? (fundedAmount / goalAmount) * 100 : 0;
}

export function daysLeft(endAt: string) {
  const diff = new Date(endAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}
