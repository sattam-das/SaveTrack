import Chart from 'chart.js/auto';
import { formatCurrency } from '../main.js';
import { getRecentEntries, getMonthlySeries, getStreak, hasEntryForDate, getWeeklyTotal, getMonthlyCurrentTotal, getSavingsRateInsight } from '../lib/analytics.js';
import { getMonthlyTarget, getWeeklyTarget } from '../lib/targets.js';
import { formatDateLabel } from '../lib/dates.js';
import { initCalendar } from './calendar.js';

let growthChartInstance = null;

export function initDashboard(data) {
    const totalSaved = data.entries.reduce((sum, entry) => sum + entry.amount, 0);
    
    let target = getMonthlyTarget(data.targets);
    let progressPercent = target > 0 ? Math.min((totalSaved / target) * 100, 100).toFixed(1) : "0.0";
    let progressLabelText = "Savings Goal Progress";
    let targetLabelText = "Target";

    const priorityGoal = data.goals ? data.goals.find(g => g.isPriority) : null;
    if (priorityGoal) {
        target = priorityGoal.amount;
        // Calculate progress using totalSaved instead of the individual goal.saved amount
        progressPercent = target > 0 ? Math.min((totalSaved / target) * 100, 100).toFixed(1) : "0.0";
        progressLabelText = "Priority Goal Progress";
        targetLabelText = `Target: ${priorityGoal.name}`;
    }

    const totalDisplay = document.getElementById('total-saved-display');
    const targetDisplay = document.getElementById('target-display');
    const progressDisplay = document.getElementById('goal-progress-display');
    const progressBar = document.getElementById('goal-progress-bar');
    const progressLabel = document.getElementById('dashboard-progress-label');
    const targetLabel = document.getElementById('dashboard-target-label');

    if(totalDisplay) totalDisplay.innerText = formatCurrency(totalSaved);
    if(targetDisplay) targetDisplay.innerText = formatCurrency(target);
    if(progressDisplay) progressDisplay.innerText = `${progressPercent}% Achieved`;
    if(progressBar) progressBar.style.width = `${progressPercent}%`;
    if(progressLabel) progressLabel.innerText = progressLabelText;
    if(targetLabel) targetLabel.innerText = targetLabelText;

    renderRecentLogs(data.entries);
    renderChart(data.entries);
    initCalendar(data.entries);

    const viewAllBtn = document.getElementById('view-all-history-btn');
    if (viewAllBtn) {
        // Clone and replace to avoid multiple event listeners on re-render
        const newViewAllBtn = viewAllBtn.cloneNode(true);
        viewAllBtn.parentNode.replaceChild(newViewAllBtn, viewAllBtn);
        newViewAllBtn.addEventListener('click', () => {
            const historyTab = document.getElementById('nav-history');
            if (historyTab) historyTab.click();
        });
    }

    const streakDisplay = document.getElementById('daily-streak-value');
    if (streakDisplay) streakDisplay.innerText = `${getStreak(data.entries)} days`;

    const insightEl = document.getElementById('savings-rate-insight');
    if (insightEl) insightEl.innerText = getSavingsRateInsight(data.entries);

    const banner = document.getElementById('log-reminder-banner');
    if (banner && import.meta.env.DEV) {
        const hasToday = hasEntryForDate(data.entries, new Date());
        banner.classList.toggle('hidden', hasToday);
    }

    // --- Monthly Target Card ---
    const monthlyTotal = getMonthlyCurrentTotal(data.entries, new Date());
    const monthlyTarget = getMonthlyTarget(data.targets);
    const monthlyProgressValue = document.getElementById('monthly-progress-value');
    const monthlyTargetValue = document.getElementById('monthly-target-value');
    const monthlyProgressBar = document.getElementById('monthly-progress-bar');

    if (monthlyProgressValue) monthlyProgressValue.innerText = formatCurrency(monthlyTotal);
    if (monthlyTargetValue) monthlyTargetValue.innerText = formatCurrency(monthlyTarget);
    if (monthlyProgressBar) {
        const percent = monthlyTarget > 0 ? Math.min((monthlyTotal / monthlyTarget) * 100, 100) : 0;
        monthlyProgressBar.style.width = `${percent}%`;
    }

    // --- Weekly Target Card ---
    const weeklyTotal = getWeeklyTotal(data.entries, new Date());
    const weeklyTarget = getWeeklyTarget(data.targets);
    const weeklyProgressValue = document.getElementById('weekly-progress-value');
    const weeklyTargetValue = document.getElementById('weekly-target-value');
    const weeklyProgressBar = document.getElementById('weekly-progress-bar');

    if (weeklyProgressValue) weeklyProgressValue.innerText = formatCurrency(weeklyTotal);
    if (weeklyTargetValue) weeklyTargetValue.innerText = formatCurrency(weeklyTarget);
    if (weeklyProgressBar) {
        const percent = weeklyTarget > 0 ? Math.min((weeklyTotal / weeklyTarget) * 100, 100) : 0;
        weeklyProgressBar.style.width = `${percent}%`;
    }
}

function renderRecentLogs(entries) {
    const list = document.getElementById('recent-logs-list');
    if (!list) return;

    const recent = getRecentEntries(entries, 5);
    if (recent.length === 0) {
        list.innerHTML = '<p class="text-on-surface-variant font-body-md">No logs yet. Add your first entry.</p>';
        return;
    }

    list.innerHTML = recent.map(entry => {
        const dateLabel = formatDateLabel(entry.date, true);
        const noteLabel = entry.note && entry.note.trim().length > 0 ? entry.note : 'Savings Entry';
        const sourceLabel = entry.source ? ` • ${entry.source === 'Other' && entry.sourceCustom ? `Other: ${entry.sourceCustom}` : entry.source}` : '';
        return `
            <div class="flex items-center justify-between p-4 rounded-lg bg-surface-container-high border border-transparent hover:border-outline-variant transition-colors group">
                <div class="flex items-center gap-4">
                    <div class="w-10 h-10 rounded-full bg-primary-container/10 flex items-center justify-center">
                        <span class="material-symbols-outlined text-primary-container">savings</span>
                    </div>
                    <div>
                        <p class="font-label-md text-label-md text-on-surface">${noteLabel}${sourceLabel}</p>
                        <p class="font-label-sm text-label-sm text-on-surface-variant">${dateLabel}</p>
                    </div>
                </div>
                <p class="font-numeric-data text-numeric-data text-primary-container">+${formatCurrency(entry.amount)}</p>
            </div>
        `;
    }).join('');
}

function renderChart(entries) {
    const ctx = document.getElementById('growthChart');
    if (!ctx) return;

    if (growthChartInstance) {
        growthChartInstance.destroy();
    }

    const { labels, values } = getMonthlySeries(entries, 7, new Date());
    
    growthChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                data: values,
                backgroundColor: values.map((_, i) => (i === values.length - 1 ? '#BB734B' : '#523c30')),
                borderRadius: 4,
                borderSkipped: false,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (context) => formatCurrency(context.raw)
                    }
                }
            },
            scales: {
                x: { display: false },
                y: { display: false }
            }
        }
    });

    const labelsContainer = document.getElementById('growth-chart-labels');
    if (labelsContainer) {
        labelsContainer.innerHTML = labels.map((label, i) => {
            const isLast = i === labels.length - 1;
            return `<span class="${isLast ? 'text-primary-container' : ''}">${label}</span>`;
        }).join('');
    }
}
