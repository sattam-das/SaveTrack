import { toLocalDateKey, parseLocalDate, formatDateLabel } from '../lib/dates.js';
import { formatCurrency } from '../main.js';

let currentDate = new Date();
let appEntries = [];

export function setCalendarMonth(dateString) {
    const d = parseLocalDate(dateString);
    currentDate = new Date(d.getFullYear(), d.getMonth(), 1);
    renderCalendar();
}

export function initCalendar(entries) {
    appEntries = entries;
    const prevBtn = document.getElementById('cal-prev');
    const nextBtn = document.getElementById('cal-next');

    // Only attach listeners once. Clone and replace to prevent memory leaks if re-initialized.
    if (prevBtn) {
        const newPrev = prevBtn.cloneNode(true);
        prevBtn.parentNode.replaceChild(newPrev, prevBtn);
        newPrev.addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() - 1);
            renderCalendar();
        });
    }

    if (nextBtn) {
        const newNext = nextBtn.cloneNode(true);
        nextBtn.parentNode.replaceChild(newNext, nextBtn);
        newNext.addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() + 1);
            renderCalendar();
        });
    }

    renderCalendar();
}

function renderCalendar() {
    const monthLabel = document.getElementById('cal-month-label');
    const grid = document.getElementById('cal-grid');
    const tooltip = document.getElementById('cal-tooltip');
    
    if (!monthLabel || !grid || !tooltip) return;

    // Set month/year label
    const options = { month: 'long', year: 'numeric' };
    monthLabel.innerText = currentDate.toLocaleDateString('en-US', options);

    // Group entries by date for quick lookup
    const dailyTotals = new Map();
    appEntries.forEach(entry => {
        if (entry.amount > 0) {
            dailyTotals.set(entry.date, (dailyTotals.get(entry.date) || 0) + entry.amount);
        }
    });

    // Calendar math
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    
    // JS getDay(): 0 = Sun, 1 = Mon ... 6 = Sat
    // We want Mon=0 ... Sun=6
    let startDayOfWeek = firstDayOfMonth.getDay() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6;
    
    const daysInMonth = lastDayOfMonth.getDate();
    
    const today = new Date();
    const isCurrentMonth = year === today.getFullYear() && month === today.getMonth();
    const todayDate = today.getDate();

    grid.innerHTML = '';

    // Empty slots before the 1st
    for (let i = 0; i < startDayOfWeek; i++) {
        const emptySlot = document.createElement('div');
        grid.appendChild(emptySlot);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
        const d = new Date(year, month, day);
        const dateKey = toLocalDateKey(d);
        const totalSaved = dailyTotals.get(dateKey) || 0;
        
        const cell = document.createElement('div');
        cell.className = 'aspect-square flex items-center justify-center rounded-lg relative cursor-pointer select-none transition-all duration-200 hover:bg-surface-container-high';
        
        const numSpan = document.createElement('span');
        numSpan.className = 'font-numeric-data text-sm z-10';
        numSpan.innerText = day;
        cell.appendChild(numSpan);

        if (isCurrentMonth && day === todayDate) {
            cell.classList.add('bg-primary-container', 'text-on-primary');
            cell.classList.remove('hover:bg-surface-container-high');
            cell.classList.add('hover:brightness-110');
            // If it's today, we don't need a text color override because text-on-primary is applied.
        } else {
            cell.classList.add('text-on-surface');
        }

        // Add a dot if there is a log
        if (totalSaved > 0) {
            const dot = document.createElement('div');
            dot.className = `absolute bottom-1 w-1.5 h-1.5 rounded-full ${isCurrentMonth && day === todayDate ? 'bg-on-primary' : 'bg-primary-container'}`;
            cell.appendChild(dot);
            
            // Tooltip events
            cell.addEventListener('mouseenter', (e) => {
                tooltip.innerText = `${formatDateLabel(dateKey, false)}: ${formatCurrency(totalSaved)}`;
                tooltip.classList.remove('hidden');
                
                // Position tooltip
                const rect = cell.getBoundingClientRect();
                tooltip.style.left = `${rect.left + window.scrollX + (rect.width / 2)}px`;
                tooltip.style.top = `${rect.top + window.scrollY - 32}px`;
                tooltip.style.transform = 'translateX(-50%)';
            });
            
            cell.addEventListener('mouseleave', () => {
                tooltip.classList.add('hidden');
            });
        }

        grid.appendChild(cell);
    }
}
