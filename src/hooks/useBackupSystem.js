import { useState } from 'react';

export const useBackupSystem = (tabs, setTabs, setActiveTabId, expeditions = [], setExpeditions = () => { }) => {
    const [importDialog, setImportDialog] = useState({
        isOpen: false,
        importedTabs: [],
        importedExpeditions: [], // New state for expeditions
        importedDate: null,
        importedVersion: null
    });

    const exportSystemState = () => {
        try {
            const state = {
                version: '1.1', // Bump version
                exportDate: new Date().toISOString(),
                exportTime: new Date().getTime(),
                tabs: tabs,
                expeditions: expeditions // Include expeditions
            };
            const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `backup_dracker_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}_v1.1.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Erro ao fazer backup:", error);
            alert("Erro ao criar arquivo de backup (.json): " + error.message);
        }
    };

    const importSystemState = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const importedState = JSON.parse(event.target.result);

                // Validate if it has tabs OR expeditions (valid backup)
                if ((importedState.tabs && Array.isArray(importedState.tabs)) || (importedState.expeditions && Array.isArray(importedState.expeditions))) {

                    const hasExpeditions = importedState.expeditions && importedState.expeditions.length > 0;
                    const hasTabs = importedState.tabs && importedState.tabs.length > 0;

                    // If system is empty (no tabs and default/empty expeditions), restore directly
                    const isSystemEmpty = tabs.length === 0 && (!expeditions || expeditions.length <= 1); // <=1 assuming default 'Turma Principal' is empty

                    if (isSystemEmpty) {
                        if (hasTabs) {
                            setTabs(importedState.tabs);
                            setActiveTabId(importedState.tabs[0].id);
                        }
                        if (hasExpeditions) {
                            setExpeditions(importedState.expeditions);
                        }
                        alert('Sistema restaurado com sucesso!');
                    } else {
                        // Show merge/replace dialog
                        setImportDialog({
                            isOpen: true,
                            importedTabs: importedState.tabs || [],
                            importedExpeditions: importedState.expeditions || [],
                            importedDate: importedState.exportDate,
                            importedVersion: importedState.version
                        });
                    }
                } else {
                    alert('Arquivo de backup inválido ou antigo.');
                }
            } catch (err) {
                console.error("Erro ao importar", err);
                alert('Erro ao ler arquivo.');
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    };

    const handleMergeImport = () => {
        // Merge Tabs
        const existingTabIds = new Set(tabs.map(t => t.id));
        const newTabs = importDialog.importedTabs.filter(t => !existingTabIds.has(t.id));
        if (newTabs.length > 0) setTabs([...tabs, ...newTabs]);

        // Merge Expeditions (avoid duplicate IDs)
        if (importDialog.importedExpeditions.length > 0) {
            const existingExpIds = new Set(expeditions.map(e => e.id));
            const newExps = importDialog.importedExpeditions.filter(e => !existingExpIds.has(e.id));
            // Optionally merge members if ID exists? For now, simple ID check.
            if (newExps.length > 0) setExpeditions([...expeditions, ...newExps]);
        }

        setImportDialog({ isOpen: false, importedTabs: [], importedExpeditions: [], importedDate: null, importedVersion: null });
        alert('Importação concluída (Mesclado)!');
    };

    const handleReplaceImport = () => {
        // Replace All
        setTabs(importDialog.importedTabs);
        if (importDialog.importedTabs.length > 0) setActiveTabId(importDialog.importedTabs[0].id);

        if (importDialog.importedExpeditions.length > 0) {
            setExpeditions(importDialog.importedExpeditions);
        }

        setImportDialog({ isOpen: false, importedTabs: [], importedExpeditions: [], importedDate: null, importedVersion: null });
        alert('Sistema restaurado (Substituído)!');
    };

    const closeImportDialog = () => {
        setImportDialog({ isOpen: false, importedTabs: [], importedExpeditions: [], importedDate: null, importedVersion: null });
    };

    return {
        importDialog,
        exportSystemState,
        importSystemState,
        handleMergeImport,
        handleReplaceImport,
        closeImportDialog
    };
};
