import { useState } from 'react';
import { VersionedBackupService } from '../services/VersionedBackupService';

export const useBackupSystem = (tabs, setTabs, setActiveTabId, setActivityType, setTopic, classes, setClasses) => {
    // Estado do modal legado (para compatibilidade, caso necessite)
    const [importDialog, setImportDialog] = useState({
        isOpen: false,
        importedTabs: [],
        importedDate: null,
        importedVersion: null
    });

    // Estado da nova Central de Versões e Backups (.json)
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

    // Exportação rápida na barra superior no formato otimizado .json
    const exportSystemState = () => {
        try {
            if (!tabs || tabs.length === 0) {
                alert('Não há atividades ativas para realizar o backup.');
                return;
            }
            VersionedBackupService.exportJsonFile(tabs, {
                isRawTabs: true,
                classes: classes || [],
                metadata: {
                    versionTag: `Backup Rápido (${new Date().toLocaleDateString('pt-BR')})`,
                    description: `Backup gerado pelo botão da barra de navegação com ${tabs.length} atividade(s).`,
                    stripImages: true,
                    author: 'Professor(a)',
                    classes: classes || []
                }
            });
        } catch (error) {
            console.error('Falha ao exportar estado do sistema:', error);
            alert('Erro ao gerar backup (.json).');
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

    // Ativa uma aba específica no sistema garantindo sincronização completa de estúdio e tema
    const activateTabInSystem = (tab) => {
        if (!tab) return;
        setActiveTabId(tab.id);
        if (setActivityType && tab.type && tab.type !== 'about_system') {
            setActivityType(tab.type);
        }
        if (setTopic && tab.title) {
            setTopic(tab.title);
        }
    };

    // Helper interno para restaurar e persistir turmas de forma segura e completa
    const consolidateAndApplyClasses = (classesList, sourceTabs = []) => {
        if (!setClasses) return;
        
        const tabsClassData = (sourceTabs || []).map(t => t?.classData).filter(Boolean);
        const incoming = VersionedBackupService.consolidateClasses(classesList, tabsClassData);

        if (incoming.length > 0) {
            setClasses(prev => {
                const merged = VersionedBackupService.consolidateClasses(prev, incoming);
                try {
                    localStorage.setItem('atividade_adaptada_classes', JSON.stringify(merged));
                } catch (e) {
                    console.warn('Erro ao salvar classes consolidadas:', e);
                }
                return merged;
            });
        }
    };

    // Abrir imediatamente uma atividade individual selecionada
    const openSingleTabVersioned = (tabToOpen, classesToRestore = null) => {
        if (!tabToOpen) return;
        const cleanTab = { ...tabToOpen, hidden: false };

        consolidateAndApplyClasses(classesToRestore, [cleanTab]);

        const existingIndex = tabs.findIndex(t => t.id === cleanTab.id);
        if (existingIndex >= 0) {
            setTabs(prev => prev.map(t => t.id === cleanTab.id ? { ...t, ...cleanTab, hidden: false } : t));
        } else {
            setTabs(prev => [...prev, cleanTab]);
        }

        activateTabInSystem(cleanTab);
        closeBackupCenter();
    };

    // Restauração versionada (Substituição total de abas e ativação imediata)
    const restoreTabsVersioned = (newTabs, classesToRestore = null) => {
        if (!newTabs || !Array.isArray(newTabs) || newTabs.length === 0) return;
        const unhiddenTabs = newTabs.map(t => ({ ...t, hidden: false }));
        setTabs(unhiddenTabs);

        consolidateAndApplyClasses(classesToRestore, unhiddenTabs);

        // Prioriza a primeira atividade real restaurada (evitando selecionar 'about_system' / página inicial)
        const targetTab = unhiddenTabs.find(t => t.type && t.type !== 'about_system') 
                       || unhiddenTabs[unhiddenTabs.length - 1] 
                       || unhiddenTabs[0];

        if (targetTab) {
            activateTabInSystem(targetTab);
        } else {
            setActiveTabId('about_system');
            if (setActivityType) setActivityType('about_system');
        }
        closeBackupCenter();
    };

    // Mesclagem versionada de atividades específicas e ativação imediata
    const mergeTabsVersioned = (tabsToMerge, classesToRestore = null) => {
        if (!tabsToMerge || !Array.isArray(tabsToMerge) || tabsToMerge.length === 0) return;
        const existingTabIds = new Set(tabs.map(t => t.id));
        
        // Garante IDs únicos na mesclagem para evitar conflito com abas já abertas
        const newTabs = tabsToMerge.map(t => {
            const cleanTab = { ...t, hidden: false };
            if (existingTabIds.has(t.id)) {
                return { ...cleanTab, id: `${t.id}_merged_${Date.now().toString().slice(-4)}` };
            }
            return cleanTab;
        });

        consolidateAndApplyClasses(classesToRestore, newTabs);

        setTabs(prev => [...prev, ...newTabs]);
        const targetTab = newTabs.find(t => t.type && t.type !== 'about_system') 
                       || newTabs[0];

        if (targetTab) {
            activateTabInSystem(targetTab);
        }
        closeBackupCenter();
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
        openSingleTabVersioned,
        handleMergeImport,
        handleReplaceImport,
        closeImportDialog
    };
};
