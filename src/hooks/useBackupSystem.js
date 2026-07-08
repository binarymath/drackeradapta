import { useState } from 'react';
import { VersionedBackupService } from '../services/VersionedBackupService';

export const useBackupSystem = (tabs, setTabs, setActiveTabId) => {
    // Estado do modal legado (para compatibilidade, caso necessite)
    const [importDialog, setImportDialog] = useState({
        isOpen: false,
        importedTabs: [],
        importedDate: null,
        importedVersion: null
    });

    // Estado da nova Central de Versões e Backups (.dracker)
    const [backupCenterModal, setBackupCenterModal] = useState({
        isOpen: false,
        initialTab: 'timeline',
        initialFileContent: null
    });

    const openBackupCenter = (initialTab = 'timeline', initialFileContent = null) => {
        setBackupCenterModal({
            isOpen: true,
            initialTab,
            initialFileContent
        });
    };

    const closeBackupCenter = () => {
        setBackupCenterModal({
            isOpen: false,
            initialTab: 'timeline',
            initialFileContent: null
        });
    };

    // Exportação rápida na barra superior no formato otimizado .dracker
    const exportSystemState = () => {
        try {
            if (!tabs || tabs.length === 0) {
                alert('Não há atividades ativas para realizar o backup.');
                return;
            }
            VersionedBackupService.exportDrackerFile(tabs, {
                isRawTabs: true,
                metadata: {
                    versionTag: `Backup Rápido (${new Date().toLocaleDateString('pt-BR')})`,
                    description: `Backup gerado pelo botão da barra de navegação com ${tabs.length} atividade(s).`,
                    stripImages: true,
                    author: 'Professor(a)'
                }
            });
        } catch (error) {
            console.error('Falha ao exportar estado do sistema:', error);
            alert('Erro ao gerar backup versionado (`.dracker`).');
        }
    };

    // Importação via input file que abre a Central de Versões em modo de Inspeção
    const importSystemState = (event) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const contentStr = e.target.result;
                // Abre a Central de Versões na aba de inspeção passando o conteúdo do arquivo
                openBackupCenter('inspect', contentStr);
            };
            reader.readAsText(file);
        }
        event.target.value = null; // Reset input
    };

    // Restauração versionada (Substituição total de abas)
    const restoreTabsVersioned = (newTabs) => {
        if (!newTabs || !Array.isArray(newTabs)) return;
        setTabs(newTabs);
        if (newTabs.length > 0) {
            setActiveTabId(newTabs[newTabs.length - 1].id);
        } else {
            setActiveTabId('about_system');
        }
        alert('Área de trabalho restaurada com sucesso!');
    };

    // Mesclagem versionada de atividades específicas
    const mergeTabsVersioned = (tabsToMerge) => {
        if (!tabsToMerge || !Array.isArray(tabsToMerge) || tabsToMerge.length === 0) return;
        const existingTabIds = new Set(tabs.map(t => t.id));
        
        // Garante IDs únicos na mesclagem para evitar conflito com abas já abertas
        const newTabs = tabsToMerge.map(t => {
            if (existingTabIds.has(t.id)) {
                return { ...t, id: `${t.id}_merged_${Date.now().toString().slice(-4)}` };
            }
            return t;
        });

        setTabs([...tabs, ...newTabs]);
        if (newTabs.length > 0) {
            setActiveTabId(newTabs[newTabs.length - 1].id);
        }
        alert(`${newTabs.length} atividade(s) mesclada(s) à sua área de trabalho!`);
    };

    // Métodos legados de mesclagem e substituição (mantidos por compatibilidade)
    const handleMergeImport = () => {
        mergeTabsVersioned(importDialog.importedTabs);
        closeImportDialog();
    };

    const handleReplaceImport = () => {
        restoreTabsVersioned(importDialog.importedTabs);
        closeImportDialog();
    };

    const closeImportDialog = () => {
        setImportDialog(prev => ({ ...prev, isOpen: false }));
    };

    return {
        importDialog,
        backupCenterModal,
        openBackupCenter,
        closeBackupCenter,
        exportSystemState,
        importSystemState,
        restoreTabsVersioned,
        mergeTabsVersioned,
        handleMergeImport,
        handleReplaceImport,
        closeImportDialog
    };
};
