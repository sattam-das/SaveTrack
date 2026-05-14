import { toLocalDateKey, parseLocalDate } from '../lib/dates.js';
import { getStreak, getMonthlyCurrentTotal } from '../lib/analytics.js';
import { getMonthlyTarget } from '../lib/targets.js';
import { formatCurrency } from '../main.js';

// In-memory read state (persists per session, resets on refresh)
let readIds = new Set();

/**
 * Generate smart notifications from app data.
 * Returns an array of { id, icon, text, type } objects.
 */
function generateNotifications(data) {
    const notes = [];
    const entries = data.entries || [];
    const today = new Date();
    const todayKey = toLocalDateKey(today);

    // 1. Missed logging today
    const loggedToday = entries.some(e => e.date === todayKey && e.amount > 0);
    if (!loggedToday) {
        notes.push({
            id: 'missed-today',
            icon: 'today',
            text: "You haven't logged any savings today. Keep your streak alive!",
            type: 'warning'
        });
    }

    // 2. Streak milestone notifications
    const streak = getStreak(entries, today);
    if (streak > 0 && streak % 7 === 0) {
        notes.push({
            id: `streak-${streak}`,
            icon: 'local_fire_department',
            text: `🔥 ${streak}-day streak! You're on a roll — keep it up!`,
            type: 'success'
        });
    }

    // 3. Monthly target progress
    const monthlyTarget = getMonthlyTarget(data.targets);
    const monthlyTotal = getMonthlyCurrentTotal(entries, today);
    if (monthlyTarget > 0) {
        const pct = (monthlyTotal / monthlyTarget) * 100;
        if (pct >= 100) {
            notes.push({
                id: `monthly-complete-${todayKey.substring(0, 7)}`,
                icon: 'emoji_events',
                text: `🎉 You've hit your monthly target of ${formatCurrency(monthlyTarget)}!`,
                type: 'success'
            });
        } else if (pct >= 75 && pct < 100) {
            notes.push({
                id: `monthly-75-${todayKey.substring(0, 7)}`,
                icon: 'trending_up',
                text: `You're at ${pct.toFixed(0)}% of your monthly target. Almost there!`,
                type: 'info'
            });
        }
    }

    // 4. Total savings milestones (every $500)
    const totalSaved = entries.reduce((s, e) => s + e.amount, 0);
    const milestoneStep = 500;
    const milestone = Math.floor(totalSaved / milestoneStep) * milestoneStep;
    if (milestone > 0) {
        notes.push({
            id: `total-milestone-${milestone}`,
            icon: 'savings',
            text: `💰 You've saved over ${formatCurrency(milestone)} in total!`,
            type: 'success'
        });
    }

    // 5. Priority goal progress
    const priorityGoal = (data.goals || []).find(g => g.isPriority && !g.completed);
    if (priorityGoal) {
        const pct = (totalSaved / priorityGoal.amount) * 100;
        if (pct >= 50 && pct < 75) {
            notes.push({
                id: `goal-50-${priorityGoal.id}`,
                icon: 'flag',
                text: `Halfway to your "${priorityGoal.name}" goal! Keep going.`,
                type: 'info'
            });
        } else if (pct >= 75 && pct < 100) {
            notes.push({
                id: `goal-75-${priorityGoal.id}`,
                icon: 'flag',
                text: `Almost there! You're at ${pct.toFixed(0)}% of your "${priorityGoal.name}" goal.`,
                type: 'info'
            });
        }
    }

    return notes;
}

function getIconColor(type) {
    switch (type) {
        case 'success': return 'text-emerald-400';
        case 'warning': return 'text-amber-400';
        default:        return 'text-[#BB734B]';
    }
}

function renderNotifications(notifications) {
    const list = document.getElementById('notifications-list');
    const empty = document.getElementById('notifications-empty');
    const badge = document.getElementById('notifications-badge');
    if (!list || !empty || !badge) return;

    const unread = notifications.filter(n => !readIds.has(n.id));

    // Update badge
    if (unread.length > 0) {
        badge.classList.remove('hidden');
    } else {
        badge.classList.add('hidden');
    }

    if (notifications.length === 0) {
        list.innerHTML = '';
        empty.classList.remove('hidden');
        return;
    }

    empty.classList.add('hidden');
    list.innerHTML = notifications.map(n => {
        const isRead = readIds.has(n.id);
        const iconColor = getIconColor(n.type);
        return `
            <li class="flex items-start gap-3 px-4 py-3 ${isRead ? 'opacity-50' : 'bg-surface-container/30'} hover:bg-surface-container-high/30 transition-colors">
                <span class="material-symbols-outlined text-lg mt-0.5 shrink-0 ${iconColor}">${n.icon}</span>
                <p class="font-body-sm text-sm text-on-surface leading-snug">${n.text}</p>
            </li>
        `;
    }).join('');
}

export function initNotifications(data) {
    const btn = document.getElementById('notifications-btn');
    const panel = document.getElementById('notifications-panel');
    const clearBtn = document.getElementById('notifications-clear-btn');
    if (!btn || !panel) return;

    const notifications = generateNotifications(data);

    // Initial render
    renderNotifications(notifications);

    // Toggle panel open/close
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);
    // Re-get the badge since cloneNode duplicated it
    newBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        panel.classList.toggle('hidden');
    });

    // Close when clicking outside
    document.addEventListener('click', (e) => {
        if (!panel.contains(e.target) && e.target !== newBtn) {
            panel.classList.add('hidden');
        }
    });

    // Mark all as read
    if (clearBtn) {
        const newClearBtn = clearBtn.cloneNode(true);
        clearBtn.parentNode.replaceChild(newClearBtn, clearBtn);
        newClearBtn.addEventListener('click', () => {
            notifications.forEach(n => readIds.add(n.id));
            renderNotifications(notifications);
        });
    }
}
