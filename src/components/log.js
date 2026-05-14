import { appData, saveData } from '../main.js';
import { bindOnce, escapeHtml } from '../lib/dom.js';
import { toLocalDateKey } from '../lib/dates.js';
import { setCalendarMonth } from './calendar.js';

export function initLog() {
    console.log('Log module initialized');
    
    const openBtn = document.getElementById('open-log-modal');
    const closeBtn = document.getElementById('close-log-modal');
    const modal = document.getElementById('log-modal');
    const form = document.getElementById('log-form');
    const sourceSelect = document.getElementById('log-source');
    const sourceCustomWrap = document.getElementById('log-source-custom-wrap');
    const sourceCustomInput = document.getElementById('log-source-custom');

    if (!modal || !form) return;

    if (sourceSelect && sourceCustomWrap) {
        bindOnce(sourceSelect, 'LogSource', (node) => {
            node.addEventListener('change', () => {
                const isOther = sourceSelect.value === 'Other';
                sourceCustomWrap.classList.toggle('hidden', !isOther);
                if (!isOther && sourceCustomInput) sourceCustomInput.value = '';
            });
        });
    }

    // Open Modal
    if (openBtn) {
        bindOnce(openBtn, 'LogOpen', (node) => {
            node.addEventListener('click', () => {
                modal.classList.remove('hidden');
                modal.classList.add('flex');
                // Slight delay for animation if needed
                setTimeout(() => modal.classList.remove('opacity-0'), 10);
                document.getElementById('log-amount').focus();
            });
        });
    }

    // Close Modal Function
    const closeModal = () => {
        modal.classList.add('opacity-0');
        setTimeout(() => {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
            form.reset();
        }, 300); // match transition duration
    };

    if (closeBtn) {
        bindOnce(closeBtn, 'LogClose', (node) => {
            node.addEventListener('click', closeModal);
        });
    }

    // Close on clicking outside
    bindOnce(modal, 'LogBackdrop', (node) => {
        node.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });
    });

    // Form Submission
    let isSubmitting = false;
    bindOnce(form, 'LogSubmit', (node) => {
        node.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            if (isSubmitting) return;
            isSubmitting = true;
            const submitBtn = form.querySelector('button[type="submit"]');
            if (submitBtn) submitBtn.disabled = true;
            
            const sourceSelect = document.getElementById('log-source');
            const sourceCustomInput = document.getElementById('log-source-custom');
            const dateInput = document.getElementById('log-date');
            
            const amount = parseFloat(document.getElementById('log-amount').value);
            const note = document.getElementById('log-note').value;
            const source = sourceSelect ? sourceSelect.value : '';
            const sourceCustom = sourceCustomInput ? sourceCustomInput.value.trim() : '';
            
            // Read from date picker, fallback to today if empty
            const date = dateInput && dateInput.value ? dateInput.value : toLocalDateKey(new Date());

            if (isNaN(amount) || amount <= 0) return;

            const newEntry = {
                id: crypto.randomUUID(),
                date,
                amount,
                note: escapeHtml(note),
                source: escapeHtml(source),
                sourceCustom: source === 'Other' ? escapeHtml(sourceCustom) : ''
            };

            // Add to global state
            appData.entries.push(newEntry);
            
            // Auto-allocate funds to priority goal if one exists (capped at 100%)
            if (appData.goals) {
                const priorityGoal = appData.goals.find(g => g.isPriority);
                if (priorityGoal && priorityGoal.saved < priorityGoal.amount) {
                    const remainingNeeded = priorityGoal.amount - priorityGoal.saved;
                    const allocateAmount = Math.min(amount, remainingNeeded);
                    priorityGoal.saved += allocateAmount;
                    
                    // Automatically remove priority status if goal is completed
                    if (priorityGoal.saved >= priorityGoal.amount) {
                        priorityGoal.isPriority = false;
                    }
                }
            }

            // Save and re-render UI
            setCalendarMonth(date);
            await saveData();
            
            closeModal();
            isSubmitting = false;
            if (submitBtn) submitBtn.disabled = false;
        });
    });
}
