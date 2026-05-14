import './styles.css';
import { invoke } from '@tauri-apps/api/core';
import { initDashboard } from './components/dashboard.js';
import { initGoals } from './components/goals.js';
import { initLog } from './components/log.js';
import { initHistory } from './components/history.js';
import { initSettings } from './components/settings.js';
import { initNotifications } from './components/notifications.js';
import { normalizeAppData } from './lib/normalize.js';

export let appData = {
    entries: [],
    targets: { weekly: 0, monthly: 0 },
    goals: [],
    preferences: { currency: '$' }
};

export function getCurrencySymbol() {
    if (!appData.preferences) appData.preferences = { currency: '$' };
    return appData.preferences.currency || '$';
}

export function formatCurrency(amount) {
    return `${getCurrencySymbol()}${amount.toFixed(2)}`;
}

async function loadData() {
    try {
        const dataStr = await invoke('read_data');
        appData = normalizeAppData(JSON.parse(dataStr));
        console.log('Data loaded from Tauri:', appData);
        updateUI();
    } catch (e) {
        console.log('Tauri not detected, falling back to localStorage.');
        const localData = localStorage.getItem('saveTrackData');
        if (localData) {
            appData = normalizeAppData(JSON.parse(localData));
        }
        updateUI();
    }
}

export async function saveData() {
    try {
        await invoke('write_data', { content: JSON.stringify(appData) });
        updateUI();
    } catch (e) {
        localStorage.setItem('saveTrackData', JSON.stringify(appData));
        updateUI();
    }
}

export function updateUI() {
    initDashboard(appData);
    initGoals(appData);
    initLog(appData);
    initHistory(appData);
    initSettings(appData);
    initNotifications(appData);

    const symbol = getCurrencySymbol();
    const logLabel = document.getElementById('log-amount-label');
    if (logLabel) logLabel.innerText = `Amount (${symbol})`;
    const goalLabel = document.getElementById('goal-amount-label');
    if (goalLabel) goalLabel.innerText = `Target Amount (${symbol})`;
    const monthlyTargetLabel = document.getElementById('monthly-target-label');
    if (monthlyTargetLabel) monthlyTargetLabel.innerText = `Target Amount (${symbol})`;
    const weeklyTargetLabel = document.getElementById('weekly-target-label');
    if (weeklyTargetLabel) weeklyTargetLabel.innerText = `Target Amount (${symbol})`;
}

function initApp() {
    console.log('SaveTrack App Initialized');
    loadData();

    // Tab Navigation Logic
    const tabs = [
        { id: 'dashboard', nav: document.getElementById('nav-dashboard'), view: document.getElementById('dashboard-view') },
        { id: 'analytics', nav: document.getElementById('nav-history'), view: document.getElementById('history-view') },
        { id: 'goals', nav: document.getElementById('nav-goals'), view: document.getElementById('goals-view') },
        { id: 'settings', nav: document.getElementById('nav-settings'), view: document.getElementById('settings-view') }
    ];

    const switchTab = (tabId) => {
        tabs.forEach(tab => {
            if (!tab.nav || !tab.view) return;
            if (tab.id === tabId) {
                tab.view.classList.remove('hidden');
                tab.nav.classList.add('text-[#BB734B]', 'dark:text-[#BB734B]', 'relative', "after:content-['']", 'after:absolute', 'after:-bottom-1', 'after:w-1', 'after:h-1', 'after:bg-[#BB734B]', 'after:rounded-full');
                tab.nav.classList.remove('text-neutral-500', 'dark:text-neutral-600', 'hover:text-neutral-200');
                
                const icon = tab.nav.querySelector('.material-symbols-outlined');
                if (icon) icon.style.fontVariationSettings = "'FILL' 1";

                setTimeout(() => { tab.view.classList.remove('opacity-0'); }, 10);
            } else {
                tab.view.classList.add('hidden', 'opacity-0');
                tab.nav.classList.remove('text-[#BB734B]', 'dark:text-[#BB734B]', 'relative', "after:content-['']", 'after:absolute', 'after:-bottom-1', 'after:w-1', 'after:h-1', 'after:bg-[#BB734B]', 'after:rounded-full');
                tab.nav.classList.add('text-neutral-500', 'dark:text-neutral-600', 'hover:text-neutral-200');
                
                const icon = tab.nav.querySelector('.material-symbols-outlined');
                if (icon) icon.style.fontVariationSettings = "'FILL' 0";
            }
        });
    };

    tabs.forEach(tab => {
        if (tab.nav) tab.nav.addEventListener('click', () => switchTab(tab.id));
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

// Custom Modal Utilities
export function showConfirm(title, message) {
    return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.className = "fixed inset-0 z-[200] bg-neutral-900/80 backdrop-blur-sm flex items-center justify-center p-4 opacity-0 transition-opacity duration-300";
        
        overlay.innerHTML = `
            <div class="bg-surface border border-outline-variant rounded-2xl w-full max-w-sm p-6 shadow-2xl transform scale-95 transition-transform duration-300">
                <h3 class="font-headline-sm text-on-surface mb-2">${title}</h3>
                <p class="font-body-md text-on-surface-variant mb-6">${message}</p>
                <div class="flex justify-end gap-3">
                    <button id="modal-cancel-btn" class="px-4 py-2 bg-surface-container hover:bg-surface-container-high text-on-surface rounded-lg font-label-md transition-colors">Cancel</button>
                    <button id="modal-confirm-btn" class="px-4 py-2 bg-primary-container text-on-primary rounded-lg font-label-md hover:brightness-110 transition-colors">Confirm</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(overlay);
        
        setTimeout(() => {
            overlay.classList.remove('opacity-0');
            overlay.querySelector('div').classList.remove('scale-95');
        }, 10);

        const close = (result) => {
            overlay.classList.add('opacity-0');
            overlay.querySelector('div').classList.add('scale-95');
            setTimeout(() => {
                if(document.body.contains(overlay)) document.body.removeChild(overlay);
                resolve(result);
            }, 300);
        };

        overlay.querySelector('#modal-cancel-btn').addEventListener('click', () => close(false));
        overlay.querySelector('#modal-confirm-btn').addEventListener('click', () => close(true));
        
        overlay.addEventListener('click', (e) => {
            if(e.target === overlay) close(false);
        });
    });
}

export function showPrompt(title, message) {
    return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.className = "fixed inset-0 z-[200] bg-neutral-900/80 backdrop-blur-sm flex items-center justify-center p-4 opacity-0 transition-opacity duration-300";
        
        overlay.innerHTML = `
            <div class="bg-surface border border-outline-variant rounded-2xl w-full max-w-sm p-6 shadow-2xl transform scale-95 transition-transform duration-300">
                <h3 class="font-headline-sm text-on-surface mb-2">${title}</h3>
                <p class="font-body-md text-on-surface-variant mb-4">${message}</p>
                <input type="number" step="0.01" id="modal-prompt-input" class="w-full bg-surface-container-high border border-outline-variant rounded-lg px-4 py-3 mb-6 text-on-surface focus:outline-none focus:border-primary-container transition-all" />
                <div class="flex justify-end gap-3">
                    <button id="modal-cancel-btn" class="px-4 py-2 bg-surface-container hover:bg-surface-container-high text-on-surface rounded-lg font-label-md transition-colors">Cancel</button>
                    <button id="modal-confirm-btn" class="px-4 py-2 bg-primary-container text-on-primary rounded-lg font-label-md hover:brightness-110 transition-colors">Confirm</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(overlay);
        const input = overlay.querySelector('#modal-prompt-input');
        
        setTimeout(() => {
            overlay.classList.remove('opacity-0');
            overlay.querySelector('div').classList.remove('scale-95');
            input.focus();
        }, 10);

        const close = (result) => {
            overlay.classList.add('opacity-0');
            overlay.querySelector('div').classList.add('scale-95');
            setTimeout(() => {
                if(document.body.contains(overlay)) document.body.removeChild(overlay);
                resolve(result);
            }, 300);
        };

        overlay.querySelector('#modal-cancel-btn').addEventListener('click', () => close(null));
        overlay.querySelector('#modal-confirm-btn').addEventListener('click', () => close(input.value));
        
        input.addEventListener('keydown', (e) => {
            if(e.key === 'Enter') close(input.value);
            if(e.key === 'Escape') close(null);
        });

        overlay.addEventListener('click', (e) => {
            if(e.target === overlay) close(null);
        });
    });
}

export function showDatePrompt(title, message, defaultValue = '') {
    return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.className = "fixed inset-0 z-[200] bg-neutral-900/80 backdrop-blur-sm flex items-center justify-center p-4 opacity-0 transition-opacity duration-300";

        overlay.innerHTML = `
            <div class="bg-surface border border-outline-variant rounded-2xl w-full max-w-sm p-6 shadow-2xl transform scale-95 transition-transform duration-300">
                <h3 class="font-headline-sm text-on-surface mb-2">${title}</h3>
                <p class="font-body-md text-on-surface-variant mb-4">${message}</p>
                <input type="date" id="modal-date-input" class="w-full bg-surface-container-high border border-outline-variant rounded-lg px-4 py-3 mb-6 text-on-surface focus:outline-none focus:border-primary-container transition-all" value="${defaultValue}" />
                <div class="flex justify-end gap-3">
                    <button id="modal-cancel-btn" class="px-4 py-2 bg-surface-container hover:bg-surface-container-high text-on-surface rounded-lg font-label-md transition-colors">Cancel</button>
                    <button id="modal-confirm-btn" class="px-4 py-2 bg-primary-container text-on-primary rounded-lg font-label-md hover:brightness-110 transition-colors">Save</button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        setTimeout(() => {
            overlay.classList.remove('opacity-0');
            overlay.querySelector('div').classList.remove('scale-95');
        }, 10);

        const close = (result) => {
            overlay.classList.add('opacity-0');
            overlay.querySelector('div').classList.add('scale-95');
            setTimeout(() => {
                if(document.body.contains(overlay)) document.body.removeChild(overlay);
                resolve(result);
            }, 300);
        };

        overlay.querySelector('#modal-cancel-btn').addEventListener('click', () => close(null));
        overlay.querySelector('#modal-confirm-btn').addEventListener('click', () => close(overlay.querySelector('#modal-date-input').value));

        overlay.addEventListener('click', (e) => {
            if(e.target === overlay) close(null);
        });
    });
}
