import { useState } from 'react';

export const useBackupSystem = (tabs, setTabs, setActiveTabId) => {
    const [importDialog, setImportDialog] = useState({
        isOpen: false,
        importedTabs: [],
        importedDate: null,
        importedVersion: null
    });

    const exportSystemState = () => {
        try {
            const state = {
                version: '2.0',
                exportDate: new Date().toISOString(),
                exportTime: new Date().getTime(),
                tabs: tabs
            };
            const blob = new Blob([JSON.stringify(state)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `backup_dracker_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}_v2.0.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error('Failed to export state:', error);
            alert('Erro ao gerar backup.');
        }
    };

    const importSystemState = (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const importedState = JSON.parse(e.target.result);

                    if (importedState.tabs && Array.isArray(importedState.tabs)) {
                        const isSystemEmpty = tabs.length === 0;

                        if (isSystemEmpty) {
                            setTabs(importedState.tabs);
                            if (importedState.tabs.length > 0) {
                                setActiveTabId(importedState.tabs[importedState.tabs.length - 1].id);
                            }
                            alert('Sistema restaurado com sucesso!');
                        } else {
                            setImportDialog({
                                isOpen: true,
                                importedTabs: importedState.tabs,
                                importedDate: importedState.exportDate,
                                importedVersion: importedState.version
                            });
                        }
                    } else {
                        alert('Arquivo de backup inválido ou incompatível.');
                    }
                } catch (error) {
                    console.error('Failed to parse backup file:', error);
                    alert('Erro ao ler arquivo de backup. Certifique-se de que é um arquivo JSON válido.');
                }
            };
            reader.readAsText(file);
        }
        event.target.value = null; // Reset input so same file can be selected again
    };

    const handleMergeImport = () => {
        const existingTabIds = new Set(tabs.map(t => t.id));
        const newTabs = importDialog.importedTabs.filter(t => !existingTabIds.has(t.id));
        if (newTabs.length > 0) {
            setTabs([...tabs, ...newTabs]);
        }
        closeImportDialog();
        alert('Abas mescladas com sucesso!');
    };

    const handleReplaceImport = () => {
        setTabs(importDialog.importedTabs);
        if (importDialog.importedTabs.length > 0) {
            setActiveTabId(importDialog.importedTabs[importDialog.importedTabs.length - 1].id);
        } else {
            setActiveTabId('dashboard');
        }
        closeImportDialog();
        alert('Sistema substituído com sucesso!');
    };

    const closeImportDialog = () => {
        setImportDialog(prev => ({ ...prev, isOpen: false }));
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
