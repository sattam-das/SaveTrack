export function getMonthlyTarget(targets) {
  if (!targets || typeof targets.monthly !== 'number') return 0;
  return targets.monthly;
}

export function getWeeklyTarget(targets) {
  if (!targets || typeof targets.weekly !== 'number') return 0;
  return targets.weekly;
}

export function updateTargets(targets, monthlyValue, weeklyValue) {
  return {
    monthly: typeof monthlyValue === 'number' && monthlyValue > 0 ? monthlyValue : 0,
    weekly: typeof weeklyValue === 'number' && weeklyValue > 0 ? weeklyValue : 0
  };
}
