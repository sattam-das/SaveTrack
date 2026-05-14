import { appData, saveData, formatCurrency, getCurrencySymbol, showConfirm, showPrompt, showDatePrompt } from '../main.js';
import { bindOnce, escapeHtml } from '../lib/dom.js';
import { getMonthlyTarget, getWeeklyTarget, updateTargets } from '../lib/targets.js';
import { getDaysLeftBadge, applyGoalCompletion } from '../lib/goals.js';
import { initDashboard } from './dashboard.js';

export function initGoals() {
    console.log('Goals module initialized');

    if (!appData.goals) appData.goals = [];

    // 1. Target Edit Logic
    const monthlyDisplay = document.getElementById('goals-monthly-target');
    const weeklyDisplay = document.getElementById('goals-weekly-target');

    if (monthlyDisplay) monthlyDisplay.innerText = formatCurrency(getMonthlyTarget(appData.targets));
    if (weeklyDisplay) weeklyDisplay.innerText = formatCurrency(getWeeklyTarget(appData.targets));

    // --- Monthly Target Modal ---
    const editMonthlyBtnOrig = document.getElementById('edit-monthly-target-btn');
    const monthlyModal = document.getElementById('edit-monthly-target-modal');
    const monthlyForm = document.getElementById('edit-monthly-target-form');
    const monthlyInput = document.getElementById('new-monthly-target-amount');

    const openMonthlyModal = () => {
        if (monthlyInput) monthlyInput.value = getMonthlyTarget(appData.targets) || 0;
        monthlyModal.classList.remove('hidden');
        monthlyModal.classList.add('flex');
    };

    const closeMonthlyModal = () => {
        monthlyModal.classList.add('hidden');
        monthlyModal.classList.remove('flex');
    };

    if (editMonthlyBtnOrig) {
        const editMonthlyBtn = editMonthlyBtnOrig.cloneNode(true);
        editMonthlyBtnOrig.parentNode.replaceChild(editMonthlyBtn, editMonthlyBtnOrig);
        editMonthlyBtn.addEventListener('click', openMonthlyModal);
    }

    if (monthlyForm) {
        const newMonthlyForm = monthlyForm.cloneNode(true);
        monthlyForm.parentNode.replaceChild(newMonthlyForm, monthlyForm);

        const cancelMonthlyBtn = newMonthlyForm.querySelector('#close-monthly-target-modal');
        if (cancelMonthlyBtn) cancelMonthlyBtn.addEventListener('click', closeMonthlyModal);

        newMonthlyForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const freshInput = document.getElementById('new-monthly-target-amount');
            const val = parseFloat(freshInput ? freshInput.value : 0);
            if (val > 0) {
                appData.targets = updateTargets(appData.targets, val, getWeeklyTarget(appData.targets));
                await saveData();
                closeMonthlyModal();
                initGoals();
                initDashboard(appData);
            }
        });
    }

    // --- Weekly Target Modal ---
    const editWeeklyBtnOrig = document.getElementById('edit-weekly-target-btn');
    const weeklyModal = document.getElementById('edit-weekly-target-modal');
    const weeklyForm = document.getElementById('edit-weekly-target-form');
    const weeklyInput = document.getElementById('new-weekly-target-amount');

    const openWeeklyModal = () => {
        if (weeklyInput) weeklyInput.value = getWeeklyTarget(appData.targets) || 0;
        weeklyModal.classList.remove('hidden');
        weeklyModal.classList.add('flex');
    };

    const closeWeeklyModal = () => {
        weeklyModal.classList.add('hidden');
        weeklyModal.classList.remove('flex');
    };

    if (editWeeklyBtnOrig) {
        const editWeeklyBtn = editWeeklyBtnOrig.cloneNode(true);
        editWeeklyBtnOrig.parentNode.replaceChild(editWeeklyBtn, editWeeklyBtnOrig);
        editWeeklyBtn.addEventListener('click', openWeeklyModal);
    }

    if (weeklyForm) {
        const newWeeklyForm = weeklyForm.cloneNode(true);
        weeklyForm.parentNode.replaceChild(newWeeklyForm, weeklyForm);

        const cancelWeeklyBtn = newWeeklyForm.querySelector('#close-weekly-target-modal');
        if (cancelWeeklyBtn) cancelWeeklyBtn.addEventListener('click', closeWeeklyModal);

        newWeeklyForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const freshInput = document.getElementById('new-weekly-target-amount');
            const val = parseFloat(freshInput ? freshInput.value : 0);
            if (val > 0) {
                appData.targets = updateTargets(appData.targets, getMonthlyTarget(appData.targets), val);
                await saveData();
                closeWeeklyModal();
                initGoals();
                initDashboard(appData);
            }
        });
    }

    // 2. Goals List Logic
    const createBtn = document.getElementById('create-goal-btn');
    const goalModal = document.getElementById('create-goal-modal');
    const closeGoalBtn = document.getElementById('close-goal-modal');
    const goalForm = document.getElementById('create-goal-form');

    const openGoalModal = () => {
        goalModal.classList.remove('hidden');
        goalModal.classList.add('flex');
    };

    const closeGoalModalFunc = () => {
        goalModal.classList.add('hidden');
        goalModal.classList.remove('flex');
        goalForm.reset();
    };

    if(createBtn) createBtn.addEventListener('click', openGoalModal);
    if(closeGoalBtn) closeGoalBtn.addEventListener('click', closeGoalModalFunc);

    if(goalForm) {
        // Need to remove previous listeners if re-initializing
        const newGoalForm = goalForm.cloneNode(true);
        goalForm.parentNode.replaceChild(newGoalForm, goalForm);
        
        const cancelGoalBtn = newGoalForm.querySelector('#close-goal-modal');
        if (cancelGoalBtn) cancelGoalBtn.addEventListener('click', closeGoalModalFunc);
        
        newGoalForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('new-goal-name').value;
            const amount = parseFloat(document.getElementById('new-goal-amount').value);
            const deadline = document.getElementById('new-goal-deadline').value;
            
if(name && amount > 0) {
                appData.goals.push({
                    id: crypto.randomUUID(),
                    name: escapeHtml(name),
                    amount,
                    deadline: deadline || '',
                    completed: false
                });
                await saveData();
                closeGoalModalFunc();
                renderGoalsList();
            }
        });
    }

    renderGoalsList();
}

export function renderGoalsList() {
    const goalsList = document.getElementById('goals-list');
    const archivedList = document.getElementById('archived-goals-list');
    if(!goalsList) return;

    goalsList.innerHTML = '';
    if (archivedList) archivedList.innerHTML = '';
    
    if(appData.goals.length === 0) {
        goalsList.innerHTML = `<p class="text-on-surface-variant font-body-md col-span-2">No active goals. Create one to start tracking!</p>`;
        if (archivedList) {
            archivedList.innerHTML = `<p class="text-on-surface-variant font-body-md col-span-2">No archived goals yet.</p>`;
        }
        return;
    }

    const activeGoals = appData.goals.filter(goal => !goal.archived);
    const archivedGoals = appData.goals.filter(goal => goal.archived);

    if (activeGoals.length === 0) {
        goalsList.innerHTML = `<p class="text-on-surface-variant font-body-md col-span-2">No active goals. Create one to start tracking!</p>`;
    }

    if (archivedList && archivedGoals.length === 0) {
        archivedList.innerHTML = `<p class="text-on-surface-variant font-body-md col-span-2">No archived goals yet.</p>`;
    }

    activeGoals.forEach(goal => {
        // Guard against divide-by-zero when goal.amount is 0
        const progress = goal.amount > 0 ? Math.min((goal.saved / goal.amount) * 100, 100).toFixed(1) : '0.0';
        const isComplete = goal.saved >= goal.amount && goal.amount > 0;
        const isPriority = goal.isPriority;
        const daysLeft = getDaysLeftBadge(goal.deadline);
        const deadlineLabel = goal.deadline ? new Date(goal.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'No deadline';

        const card = document.createElement('div');
        card.className = "bg-surface-container-low border border-outline-variant rounded-xl p-5 flex flex-col gap-4 shadow-md";
        card.innerHTML = `
            <div class="flex justify-between items-start">
                <div>
                    <h4 class="font-headline-sm text-on-surface flex items-center gap-2">
                        ${goal.name}
                        ${!isComplete ? `<span data-priority-id="${goal.id}" title="Toggle Priority" class="priority-btn cursor-pointer material-symbols-outlined text-[20px] transition-colors ${isPriority ? 'text-primary-container' : 'text-outline-variant hover:text-primary-container/50'}" style="font-variation-settings: 'FILL' ${isPriority ? '1' : '0'};">star</span>` : ''}
                    </h4>
                    <p class="font-label-sm text-on-surface-variant">${formatCurrency(goal.saved)} / ${formatCurrency(goal.amount)}</p>
                    <div class="flex items-center gap-2 mt-1">
                        <span class="font-label-sm text-on-surface-variant">${deadlineLabel}</span>
                        ${daysLeft !== null ? `<span class="px-2 py-[2px] rounded-full bg-primary-container/20 text-primary-container text-[11px] font-semibold">${daysLeft} days left</span>` : ''}
                    </div>
                </div>
                <div class="flex items-center gap-2">
                    ${isComplete ? '<span class="text-primary-container material-symbols-outlined">check_circle</span>' : ''}
                    ${!isComplete ? `<button data-deadline-id="${goal.id}" class="edit-deadline-btn text-xs text-on-surface-variant hover:text-primary-container">Edit</button>` : ''}
                    <span data-delete-id="${goal.id}" title="Delete Goal" class="delete-btn cursor-pointer material-symbols-outlined text-outline-variant hover:text-[#ef4444] transition-colors">delete</span>
                </div>
            </div>
            <div class="h-2 w-full bg-surface-container-highest rounded-full overflow-hidden">
                <div class="h-full bg-primary-container transition-all" style="width: ${progress}%"></div>
            </div>
            ${!isComplete ? `<button data-id="${goal.id}" class="add-funds-btn w-full mt-2 py-2 border border-primary-container text-primary-container rounded-lg font-label-md hover:bg-primary-container hover:text-on-primary transition-colors">Add Funds</button>` : `<div class="w-full mt-2 py-2 bg-primary-container/20 text-primary-container rounded-lg font-label-md text-center">Completed</div>`}
        `;
        goalsList.appendChild(card);
    });

    if (archivedList) {
        archivedGoals.forEach(goal => {
            // Guard against divide-by-zero for archived goal progress bars
            const progress = goal.amount > 0 ? Math.min((goal.saved / goal.amount) * 100, 100).toFixed(1) : '0.0';
            const deadlineLabel = goal.deadline ? new Date(goal.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'No deadline';

            const card = document.createElement('div');
            card.className = "bg-surface-container-low border border-outline-variant rounded-xl p-5 flex flex-col gap-4 shadow-md opacity-80";
            card.innerHTML = `
                <div class="flex justify-between items-start">
                    <div>
                        <h4 class="font-headline-sm text-on-surface flex items-center gap-2">
                            ${goal.name}
                            <span class="text-primary-container material-symbols-outlined">check_circle</span>
                        </h4>
                        <p class="font-label-sm text-on-surface-variant">${formatCurrency(goal.saved)} / ${formatCurrency(goal.amount)}</p>
                        <span class="font-label-sm text-on-surface-variant">${deadlineLabel}</span>
                    </div>
                    <span data-delete-id="${goal.id}" title="Delete Goal" class="delete-btn cursor-pointer material-symbols-outlined text-outline-variant hover:text-[#ef4444] transition-colors">delete</span>
                </div>
                <div class="h-2 w-full bg-surface-container-highest rounded-full overflow-hidden">
                    <div class="h-full bg-primary-container transition-all" style="width: ${progress}%"></div>
                </div>
                <div class="w-full mt-2 py-2 bg-primary-container/20 text-primary-container rounded-lg font-label-md text-center">Archived</div>
            `;
            archivedList.appendChild(card);
        });
    }

    document.querySelectorAll('.add-funds-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const goalId = e.target.getAttribute('data-id');
            const val = await showPrompt('Add Funds', `How much to add to this goal? (${getCurrencySymbol()})`);
            if (val !== null) {
                const parsed = parseFloat(val);
                if(parsed > 0) {
                    const g = appData.goals.find(x => x.id === goalId);
                    if(g) {
                        const updated = applyGoalCompletion({ ...g, saved: g.saved + parsed });
                        Object.assign(g, updated);
                        saveData().then(() => renderGoalsList());
                    }
                }
            }
        });
    });

    document.querySelectorAll('.priority-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const goalId = e.target.getAttribute('data-priority-id');
            const clickedGoal = appData.goals.find(x => x.id === goalId);
            if (clickedGoal) {
                const wasPriority = clickedGoal.isPriority;
                appData.goals.forEach(g => g.isPriority = false);
                if (!wasPriority) {
                    clickedGoal.isPriority = true;
                }
                await saveData();
                renderGoalsList();
            }
        });
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const confirmed = await showConfirm('Delete Goal', 'Are you sure you want to delete this goal? This action cannot be undone.');
            if (confirmed) {
                const goalId = e.target.getAttribute('data-delete-id');
                appData.goals = appData.goals.filter(x => x.id !== goalId);
                await saveData();
                renderGoalsList();
            }
        });
    });

    document.querySelectorAll('.edit-deadline-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const goalId = e.target.getAttribute('data-deadline-id');
            const goal = appData.goals.find(x => x.id === goalId);
            if (!goal) return;
            const nextDate = await showDatePrompt('Edit Deadline', 'Choose a new deadline for this goal.', goal.deadline || '');
            if (nextDate !== null) {
                goal.deadline = nextDate;
                await saveData();
                renderGoalsList();
            }
        });
    });
}
