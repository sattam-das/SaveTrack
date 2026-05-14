import { Chart } from 'chart.js/auto';
import { formatCurrency, getCurrencySymbol } from '../main.js';
import { getMonthlyBreakdown, getSourceBreakdown, getHistorySeries } from '../lib/analytics.js';
import { getMonthlyTarget } from '../lib/targets.js';

let historyChartInstance = null;

export function initHistory(appData) {
    if (!appData || !appData.entries) return;

    // 1. Calculate Lifetime Stats
    const totalDisplay = document.getElementById('history-total-saved');
    const avgDisplay = document.getElementById('history-avg-day');
    const bestDisplay = document.getElementById('history-best-day');

    let totalSaved = 0;
    let bestDay = 0;

    // Group entries by date
    const dateGroups = {};
    appData.entries.forEach(entry => {
        totalSaved += entry.amount;
        
        // entry.date is already a local YYYY-MM-DD key — use it directly
        // (avoid new Date(...).toISOString() which shifts dates back in UTC+ timezones)
        const dateStr = entry.date;
        if (!dateGroups[dateStr]) dateGroups[dateStr] = 0;
        dateGroups[dateStr] += entry.amount;
    });

    const uniqueDays = Object.keys(dateGroups).length;
    
    // Find best day
    Object.values(dateGroups).forEach(amount => {
        if (amount > bestDay) bestDay = amount;
    });

    const avgPerDay = uniqueDays > 0 ? (totalSaved / uniqueDays) : 0;

    if (totalDisplay) totalDisplay.innerText = formatCurrency(totalSaved);
    if (avgDisplay) avgDisplay.innerText = formatCurrency(avgPerDay);
    if (bestDisplay) bestDisplay.innerText = formatCurrency(bestDay);

    // 2. Initialize Chart
    const timeframeSelect = document.getElementById('chart-timeframe');
    const initialTimeframe = timeframeSelect ? timeframeSelect.value : '30';
    renderHistoryChart(appData.entries, initialTimeframe);

    renderMonthlyBreakdown(appData.entries, appData.targets);
    renderSourceBreakdown(appData.entries);

    // 3. Timeframe Toggle
    if (timeframeSelect) {
        // Remove old listener to avoid duplicates on re-render
        const newSelect = timeframeSelect.cloneNode(true);
        timeframeSelect.parentNode.replaceChild(newSelect, timeframeSelect);
        
        newSelect.addEventListener('change', (e) => {
            renderHistoryChart(appData.entries, e.target.value);
        });
    }
}

function renderMonthlyBreakdown(entries, targets) {
    const body = document.getElementById('monthly-breakdown-body');
    if (!body) return;

    const monthlyTarget = getMonthlyTarget(targets);
    const breakdown = getMonthlyBreakdown(entries, monthlyTarget);

    if (breakdown.length === 0) {
        body.innerHTML = '<tr><td class="py-2 text-on-surface-variant" colspan="4">No data yet.</td></tr>';
        return;
    }

    body.innerHTML = breakdown.map(row => {
        const [year, month] = row.monthKey.split('-');
        const label = new Date(Number(year), Number(month) - 1, 1).toLocaleString('en-US', { month: 'short', year: 'numeric' });
        const vsClass = row.vsTarget >= 0 ? 'text-primary-container' : 'text-[#ef4444]';
        const vsLabel = row.vsTarget >= 0 ? `+${formatCurrency(row.vsTarget)}` : formatCurrency(row.vsTarget);
        return `
            <tr class="border-t border-outline-variant">
                <td class="py-2">${label}</td>
                <td class="py-2">${formatCurrency(row.total)}</td>
                <td class="py-2">${formatCurrency(row.avgPerDay)}</td>
                <td class="py-2 ${vsClass}">${vsLabel}</td>
            </tr>
        `;
    }).join('');
}

function renderSourceBreakdown(entries) {
    const container = document.getElementById('source-breakdown');
    if (!container) return;
    const breakdown = getSourceBreakdown(entries);
    const labels = Object.keys(breakdown);

    if (labels.length === 0) {
        container.innerHTML = '<p class="text-on-surface-variant">No source data yet.</p>';
        return;
    }

    container.innerHTML = labels
        .sort((a, b) => breakdown[b] - breakdown[a])
        .map(label => `
            <div class="flex justify-between items-center border-b border-outline-variant/50 pb-2">
                <span class="text-on-surface">${label}</span>
                <span class="text-primary-container font-semibold">${formatCurrency(breakdown[label])}</span>
            </div>
        `)
        .join('');
}

function renderHistoryChart(entries, timeframe) {
    const ctx = document.getElementById('historyChart');
    if (!ctx) return;

    if (historyChartInstance) {
        historyChartInstance.destroy();
    }

    const series = getHistorySeries(entries, timeframe, new Date());
    const labels = series.labels;
    const dataPoints = series.data;

    historyChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: `Savings (${getCurrencySymbol()})`,
                data: dataPoints,
                borderColor: '#BB734B',
                backgroundColor: 'rgba(187, 115, 75, 0.1)',
                borderWidth: 3,
                tension: 0.4,
                fill: true,
                pointBackgroundColor: '#BB734B',
                pointBorderColor: '#3D2C22',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#1E1E1E',
                    titleColor: '#e3e2e2',
                    bodyColor: '#BB734B',
                    padding: 12,
                    displayColors: false,
                    callbacks: {
                        label: function(context) {
                            return formatCurrency(context.parsed.y);
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: '#2C2C2C' },
                    ticks: { color: '#9ca3af' }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: '#9ca3af', maxTicksLimit: 7 }
                }
            }
        }
    });
}
