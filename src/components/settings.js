import { appData, saveData, updateUI, showConfirm } from '../main.js';

export function initSettings() {
    const exportBtn = document.getElementById('export-data-btn');
    const wipeBtn = document.getElementById('wipe-data-btn');
    const currencySelect = document.getElementById('currency-select');
    const saveCurrencyBtn = document.getElementById('save-currency-btn');

    if (currencySelect) {
        if (!appData.preferences) appData.preferences = { currency: '$' };
        const newCurrencySelect = currencySelect.cloneNode(true);
        currencySelect.parentNode.replaceChild(newCurrencySelect, currencySelect);
        
        // Apply value AFTER cloning, as cloneNode does not preserve the dynamic .value property of <select>
        newCurrencySelect.value = appData.preferences.currency || '$';



        if (saveCurrencyBtn) {
            const newSaveBtn = saveCurrencyBtn.cloneNode(true);
            saveCurrencyBtn.parentNode.replaceChild(newSaveBtn, saveCurrencyBtn);
            
            newCurrencySelect.addEventListener('change', () => {
                newSaveBtn.classList.remove('hidden');
            });

            newSaveBtn.addEventListener('click', async () => {
                appData.preferences.currency = newCurrencySelect.value;
                newSaveBtn.classList.add('hidden');
                await saveData(); // saveData internally calls updateUI() to instantly refresh all views
            });
        }
    }

    if (exportBtn) {
        const newExportBtn = exportBtn.cloneNode(true);
        exportBtn.parentNode.replaceChild(newExportBtn, exportBtn);
        
        newExportBtn.addEventListener('click', async () => {
            const dataStr = JSON.stringify(appData, null, 2);
            const defaultFilename = `savetrack_backup_${new Date().toISOString().split('T')[0]}.json`;

            if (window.__TAURI__) {
                try {
                    // We must use dynamic imports for Tauri plugins because they are not available in standard web context
                    const { save } = await import('@tauri-apps/plugin-dialog');
                    const { writeTextFile } = await import('@tauri-apps/plugin-fs');
                    
                    const filePath = await save({
                        filters: [{
                            name: 'SaveTrack Backup',
                            extensions: ['json']
                        }],
                        defaultPath: defaultFilename
                    });

                    if (filePath) {
                        await writeTextFile(filePath, dataStr);
                        // Optional: Could show a success toast here
                    }
                } catch (e) {
                    console.error("Tauri Export Error:", e);
                }
            } else {
                // Web Fallback
                const blob = new Blob([dataStr], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                
                const a = document.createElement('a');
                a.href = url;
                a.download = defaultFilename;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }
        });
    }

    const importBtn = document.getElementById('import-data-btn');
    const importInput = document.getElementById('import-file-input');

    if (importBtn && importInput) {
        const newImportBtn = importBtn.cloneNode(true);
        importBtn.parentNode.replaceChild(newImportBtn, importBtn);

        const newImportInput = importInput.cloneNode(true);
        importInput.parentNode.replaceChild(newImportInput, importInput);

        const handleImportedData = async (dataStr) => {
            try {
                const parsed = JSON.parse(dataStr);
                if (parsed && typeof parsed === 'object') {
                    const confirmed = await showConfirm('Restore Backup', 'Are you sure you want to overwrite your current data with this backup? This cannot be undone.');
                    if (confirmed) {
                        Object.assign(appData, parsed);
                        await saveData();
                        updateUI();
                        await showConfirm('Success', 'Data restored successfully!');
                    }
                }
            } catch (err) {
                console.error("Failed to parse import data", err);
                await showConfirm('Error', 'Invalid backup file. Could not restore data.');
            }
        };

        newImportBtn.addEventListener('click', async () => {
            if (window.__TAURI__) {
                try {
                    const { open } = await import('@tauri-apps/plugin-dialog');
                    const { readTextFile } = await import('@tauri-apps/plugin-fs');
                    
                    const filePath = await open({
                        multiple: false,
                        filters: [{
                            name: 'SaveTrack Backup',
                            extensions: ['json']
                        }]
                    });

                    if (filePath) {
                        const contents = await readTextFile(filePath);
                        handleImportedData(contents);
                    }
                } catch (e) {
                    console.error("Tauri Import Error:", e);
                }
            } else {
                // Web fallback
                newImportInput.click();
            }
        });

        newImportInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (event) => {
                handleImportedData(event.target.result);
                newImportInput.value = ''; // Reset input
            };
            reader.readAsText(file);
        });
    }

    if (wipeBtn) {
        const newWipeBtn = wipeBtn.cloneNode(true);
        wipeBtn.parentNode.replaceChild(newWipeBtn, wipeBtn);
        
        newWipeBtn.addEventListener('click', async () => {
            const confirmed = await showConfirm('Wipe Data', 'Are you absolutely sure you want to permanently delete all your savings data? This cannot be undone.');
            if (confirmed) {
                appData.entries = [];
                appData.goals = [];
                appData.targets = { weekly: 0, monthly: 0 };
                // keep preferences intact
                await saveData();
                updateUI();
                await showConfirm('Success', 'All data has been wiped successfully.');
            }
        });
    }
}
