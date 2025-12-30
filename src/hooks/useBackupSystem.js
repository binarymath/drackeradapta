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
                version: '1.0',
                exportDate: new Date().toISOString(),
                exportTime: new Date().getTime(),
                tabs: tabs
            };
            const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `backup_atividades_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}_v1.json`;
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
                if (importedState.tabs && Array.isArray(importedState.tabs)) {
                    // Se não há abas abertas, substitui diretamente
                    if (tabs.length === 0) {
                        setTabs(importedState.tabs);
                        if (importedState.tabs.length > 0) {
                            setActiveTabId(importedState.tabs[0].id);
                        }
                        alert('Sistema restaurado com sucesso!');
                    } else {
                        // Se há abas, mostra modal de opção
                        setImportDialog({
                            isOpen: true,
                            importedTabs: importedState.tabs,
                            importedDate: importedState.exportDate,
                            importedVersion: importedState.version
                        });
                    }
                } else {
                    alert('Arquivo de backup inválido.');
                }
            } catch (err) {
                console.error("Erro ao importar", err);
                alert('Erro ao ler arquivo.');
            }
        };
        reader.readAsText(file);
        // Reset value to allow same file selection again if needed
        e.target.value = '';
    };

    const handleMergeImport = () => {
        // Mescla as abas: adiciona as importadas sem duplicar por ID
        const existingIds = new Set(tabs.map(t => t.id));
        const newTabs = importDialog.importedTabs.filter(t => !existingIds.has(t.id));
        setTabs([...tabs, ...newTabs]);
        setImportDialog({ isOpen: false, importedTabs: [], importedDate: null, importedVersion: null });
        alert(`${newTabs.length} nova(s) atividade(s) adicionada(s)!`);
    };

    const handleReplaceImport = () => {
        // Substitui completamente
        setTabs(importDialog.importedTabs);
        if (importDialog.importedTabs.length > 0) {
            setActiveTabId(importDialog.importedTabs[0].id);
        }
        setImportDialog({ isOpen: false, importedTabs: [], importedDate: null, importedVersion: null });
        alert('Sistema restaurado (substituído)!');
    };

    const closeImportDialog = () => {
        setImportDialog({ isOpen: false, importedTabs: [], importedDate: null, importedVersion: null });
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
