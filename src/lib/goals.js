export function getDaysLeftBadge(deadline, today = new Date()) {
  if (!deadline) return null;
  const deadlineDate = new Date(deadline);
  if (Number.isNaN(deadlineDate.getTime())) return null;
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const end = new Date(deadlineDate.getFullYear(), deadlineDate.getMonth(), deadlineDate.getDate());
  const diffDays = Math.round((end - start) / 86400000);
  if (diffDays < 0 || diffDays > 30) return null;
  return diffDays;
}

export function applyGoalCompletion(goal) {
  const isComplete = goal.saved >= goal.amount;
  if (!isComplete) return goal;
  return { ...goal, completed: true, archived: true };
}
