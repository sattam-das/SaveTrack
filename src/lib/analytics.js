import { toLocalDateKey, parseLocalDate, formatDateLabel } from './dates.js';

export function sortEntriesByDateDesc(entries) {
  return [...entries].sort((a, b) => {
    const diff = new Date(b.date) - new Date(a.date);
    if (diff !== 0) return diff;
    return String(b.id).localeCompare(String(a.id));
  });
}

export function getRecentEntries(entries, count = 5) {
  return sortEntriesByDateDesc(entries).slice(0, count);
}

function toMonthKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export function getMonthlyTotals(entries) {
  const totals = new Map();
  entries.forEach(entry => {
    const key = entry.date.substring(0, 7);
    totals.set(key, (totals.get(key) || 0) + entry.amount);
  });
  return totals;
}

export function getSavingsRateInsight(entries, today = new Date()) {
  const totals = getMonthlyTotals(entries);
  const thisMonthKey = toMonthKey(today);
  const lastMonthDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const lastMonthKey = toMonthKey(lastMonthDate);

  const thisMonth = totals.get(thisMonthKey) || 0;
  const lastMonth = totals.get(lastMonthKey) || 0;

  if (lastMonth === 0 && thisMonth === 0) {
    return 'Start logging entries to see your savings insight.';
  }
  if (lastMonth === 0) {
    return `First month of data — ${thisMonth > 0 ? 'great start!' : 'log your first entry!'}`;
  }
  const pct = ((thisMonth - lastMonth) / lastMonth) * 100;
  const absPct = Math.abs(pct).toFixed(1);
  if (pct > 0) return `Your savings rate increased by ${absPct}% vs last month. Keep it up!`;
  if (pct < 0) return `Your savings rate decreased by ${absPct}% vs last month. You can do it!`;
  return 'Your savings rate is unchanged from last month.';
}

export function getMonthlySeries(entries, monthsCount = 7, endDate = new Date()) {
  const totals = getMonthlyTotals(entries);
  const keys = [];
  const labels = [];
  for (let i = monthsCount - 1; i >= 0; i -= 1) {
    const d = new Date(endDate.getFullYear(), endDate.getMonth() - i, 1);
    const key = toMonthKey(d);
    keys.push(key);
    labels.push(d.toLocaleString('en-US', { month: 'short' }));
  }
  const values = keys.map(key => totals.get(key) || 0);
  return { keys, labels, values };
}

export function getMonthlyBreakdown(entries, monthlyTarget = 0) {
  const buckets = new Map();
  entries.forEach(entry => {
    const key = entry.date.substring(0, 7);
    if (!buckets.has(key)) buckets.set(key, { total: 0, days: new Set() });
    const bucket = buckets.get(key);
    bucket.total += entry.amount;
    bucket.days.add(entry.date);
  });

  return [...buckets.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([monthKey, data]) => {
      const daysLogged = data.days.size || 1;
      const avgPerDay = data.total / daysLogged;
      return {
        monthKey,
        total: data.total,
        avgPerDay,
        vsTarget: data.total - monthlyTarget
      };
    });
}

export function hasEntryForDate(entries, date) {
  const key = toLocalDateKey(date);
  return entries.some(e => e.amount > 0 && e.date === key);
}

export function getStreak(entries, today = new Date()) {
  const entryDays = new Set(entries.filter(e => e.amount > 0).map(e => e.date));
  let streak = 0;
  const cursor = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  
  // 1-day grace period: if today is not logged, check yesterday
  if (!entryDays.has(toLocalDateKey(cursor))) {
      cursor.setDate(cursor.getDate() - 1);
  }
  
  while (entryDays.has(toLocalDateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function getWeekStart(date) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  d.setDate(d.getDate() + diff);
  return d;
}

export function getWeeklyTotal(entries, today = new Date()) {
  const start = getWeekStart(today);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  return entries.reduce((sum, entry) => {
    const d = parseLocalDate(entry.date);
    if (d >= start && d < end) return sum + entry.amount;
    return sum;
  }, 0);
}

export function getMonthlyCurrentTotal(entries, today = new Date()) {
  const start = new Date(today.getFullYear(), today.getMonth(), 1);
  const end = new Date(today.getFullYear(), today.getMonth() + 1, 1);
  return entries.reduce((sum, entry) => {
    const d = parseLocalDate(entry.date);
    if (d >= start && d < end) return sum + entry.amount;
    return sum;
  }, 0);
}

export function getSourceBreakdown(entries) {
  return entries.reduce((acc, entry) => {
    const label = entry.source === 'Other' && entry.sourceCustom
      ? `Other: ${entry.sourceCustom}`
      : (entry.source || 'Uncategorized');
    acc[label] = (acc[label] || 0) + entry.amount;
    return acc;
  }, {});
}

export function getHistorySeries(entries, timeframe, now = new Date()) {
  const dateGroups = new Map();
  entries.forEach(entry => {
    const key = entry.date;
    dateGroups.set(key, (dateGroups.get(key) || 0) + entry.amount);
  });

  if (timeframe === 'all') {
    const keys = [...dateGroups.keys()].sort((a, b) => parseLocalDate(a) - parseLocalDate(b));
    return {
      labels: keys.map(key => formatDateLabel(key, true)),
      data: keys.map(key => dateGroups.get(key) || 0)
    };
  }

  const days = parseInt(timeframe, 10);
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const labels = [];
  const data = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(start);
    d.setDate(start.getDate() - i);
    const key = toLocalDateKey(d);
    labels.push(formatDateLabel(key, false));
    data.push(dateGroups.get(key) || 0);
  }

  return { labels, data };
}
