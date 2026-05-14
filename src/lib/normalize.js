export function normalizeAppData(raw) {
  // Shallow copy to avoid mutating the caller's reference
  const data = raw && typeof raw === 'object' ? { ...raw } : {};

  data.entries = Array.isArray(data.entries) ? data.entries : [];
  data.targets = data.targets && typeof data.targets === 'object' ? { ...data.targets } : {};
  data.goals = Array.isArray(data.goals) ? data.goals : [];
  data.preferences = data.preferences && typeof data.preferences === 'object' ? { ...data.preferences } : {};

  data.targets.weekly = typeof data.targets.weekly === 'number' ? data.targets.weekly : 0;
  data.targets.monthly = typeof data.targets.monthly === 'number' ? data.targets.monthly : 0;
  data.preferences.currency = data.preferences.currency || '$';

  data.entries = data.entries.map(entry => ({
    source: '',
    sourceCustom: '',
    ...entry
  }));

  data.goals = data.goals.map(goal => {
    const completed = goal.saved >= goal.amount && goal.amount > 0;
    return {
      completed: false,
      archived: false,
      ...goal,
      completed,
      archived: completed
    };
  });

  return data;
}

