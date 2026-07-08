import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { safeLocalStorageGet, safeLocalStorageSet, safeLocalStorageRemove } from '../utils/storage';
import {
    FileText, MessageSquare, Grid, Music, BrainCircuit, Play, Files, Compass, Brain, Gamepad2, ArrowLeftRight, PieChart
} from 'lucide-react';

const ActivityContext = createContext();

export const useActivity = () => {
    const context = useContext(ActivityContext);
    if (!context) {
        throw new Error('useActivity must be used within an ActivityProvider');
    }
    return context;
};

export const ActivityProvider = ({ children }) => {
    // --- TABS STATE ---
    const [tabs, setTabs] = useState(() => {
        const saved = safeLocalStorageGet('atividade_adaptada_tabs');
        try {
            const parsed = saved ? JSON.parse(saved) : [];
            return parsed.length > 0 ? parsed : [{ id: 'dashboard', title: 'Drácker - Início', type: 'dashboard', content: '' }];
        } catch (e) {
            return [{ id: 'dashboard', title: 'Drácker - Início', type: 'dashboard', content: '' }];
        }
    });

    const [activeTabId, setActiveTabId] = useState(() => {
        const saved = safeLocalStorageGet('atividade_adaptada_active_tab');
        return saved || 'dashboard';
    });

    // --- FORM STATE ---
    const [topic, setTopic] = useState('');
    const [lessonDetails, setLessonDetails] = useState('');
    const [activityType, setActivityType] = useState('dashboard');
    const [difficulty, setDifficulty] = useState('medium');

    // --- IMAGE GENERATION STATE ---
    const [imagePrompt, setImagePrompt] = useState('');
    const [imageSize, setImageSize] = useState('1K');
    const [imageStyle, setImageStyle] = useState('infantil-desenho');
    // Note: imagePng is usually result state, but can be here too
    const [imagePng, setImagePng] = useState('');

    // --- HANGMAN STATE ---
    const [hangmanBatch, setHangmanBatch] = useState(null); // { words: [], results: {} }

    // --- UI STATE ---
    const [isEditing, setIsEditing] = useState(false);
    const [tabSelectionModal, setTabSelectionModal] = useState({
        isOpen: false,
        type: ''
    });

    // --- PERSISTENCE EFFECT ---
    useEffect(() => {
        safeLocalStorageSet('atividade_adaptada_tabs', JSON.stringify(tabs));
    }, [tabs]);

    useEffect(() => {
        if (activeTabId) {
            safeLocalStorageSet('atividade_adaptada_active_tab', activeTabId);
        } else {
            safeLocalStorageRemove('atividade_adaptada_active_tab');
        }
    }, [activeTabId]);

    // --- DERIVED STATE ---
    const activeActivity = useMemo(() => tabs.find(t => t.id === activeTabId) || null, [tabs, activeTabId]);

    // --- ACTIONS ---
    const addActivityTab = (activityData) => {
        const timestamp = Date.now();
        const tabId = timestamp.toString();

        setTabs(prev => {
            let finalTitle = activityData.title || 'Atividade';
            
            // Lógica de Desambiguação de Título (#N) se já existirem abas no mesmo estúdio com título igual ou similar
            const baseTitleClean = finalTitle.replace(/\s+#\d+$/, '').trim();
            const sameTypeTabs = prev.filter(t => t.type === activityData.type && !t.hidden);
            const matchingTabs = sameTypeTabs.filter(t => {
                const tBase = (t.title || '').replace(/\s+#\d+$/, '').trim();
                return tBase.toLowerCase() === baseTitleClean.toLowerCase();
            });

            if (matchingTabs.length > 0) {
                let maxNum = 1;
                matchingTabs.forEach(t => {
                    const match = (t.title || '').match(/#(\d+)$/);
                    if (match) {
                        const num = parseInt(match[1], 10);
                        if (num >= maxNum) maxNum = num;
                    } else {
                        maxNum = Math.max(maxNum, 1);
                    }
                });
                // Se a própria primeira aba for exatamente "Quatro operações" sem sufixo e estivermos criando a segunda, damos #2
                finalTitle = `${baseTitleClean} #${maxNum + 1}`;
            }

            const newTab = {
                id: tabId,
                createdAt: timestamp,
                isPinned: false,
                ...activityData,
                title: finalTitle
            };
            return [...prev, newTab];
        });
        setActiveTabId(tabId);
    };

    const renameTab = (id, newTitle) => {
        setTabs(prev => prev.map(t => t.id === id ? { ...t, title: newTitle } : t));
        if (activeTabId === id) {
            setTopic(newTitle);
        }
    };

    const pinTab = (id) => {
        setTabs(prev => prev.map(t => t.id === id ? { ...t, isPinned: !t.isPinned } : t));
    };

    const duplicateTab = (id) => {
        const timestamp = Date.now();
        const tabId = timestamp.toString();
        setTabs(prev => {
            const sourceTab = prev.find(t => t.id === id);
            if (!sourceTab) return prev;
            const newTab = {
                ...sourceTab,
                id: tabId,
                createdAt: timestamp,
                isPinned: false,
                title: `${sourceTab.title || 'Atividade'} (Cópia)`
            };
            return [...prev, newTab];
        });
        setActiveTabId(tabId);
    };

    const closeOtherTabs = (id) => {
        setTabs(prev => {
            const targetTab = prev.find(t => t.id === id);
            if (!targetTab) return prev;
            const newTabs = prev.filter(t => t.id === id || t.isPinned || t.type !== targetTab.type);
            return newTabs;
        });
        setActiveTabId(id);
    };

    const closeAllTabs = (type) => {
        setTabs(prev => {
            const newTabs = prev.filter(t => t.isPinned || (type && t.type !== type));
            const visibleOfCurrent = newTabs.filter(t => !t.hidden && (!type || t.type === type));
            if (visibleOfCurrent.length > 0) {
                setActiveTabId(visibleOfCurrent[visibleOfCurrent.length - 1].id);
            } else {
                setActiveTabId(null);
            }
            return newTabs;
        });
    };

    const closeTab = (id, e) => {
        if (e) e.stopPropagation();
        setTabs(prev => {
            const newTabs = prev.map(t => t.id === id ? { ...t, hidden: true } : t);
            const visibleTabs = newTabs.filter(t => !t.hidden);
            if (activeTabId === id) {
                if (visibleTabs.length > 0) setActiveTabId(visibleTabs[visibleTabs.length - 1].id);
                else setActiveTabId(null);
            }
            return newTabs;
        });
    };

    const deleteTab = (id, e) => {
        if (e) e.stopPropagation();
        setTabs(prev => {
            const newTabs = prev.filter(t => t.id !== id);
            const visibleTabs = newTabs.filter(t => !t.hidden);
            if (activeTabId === id) {
                if (visibleTabs.length > 0) setActiveTabId(visibleTabs[visibleTabs.length - 1].id);
                else setActiveTabId(null);
            }
            return newTabs;
        });
    };

    const handleTabsReorder = (reorderedTabs) => setTabs(reorderedTabs);

    // Activity Switch Logic
    const handleActivityTypeChange = (type) => {
        const existingTabs = tabs.filter(t => t.type === type);
        if (existingTabs.length > 0) {
            setTabSelectionModal({ isOpen: true, type: type });
        } else {
            setActivityType(type);
            setActiveTabId(null);
        }
    };

    const handleTabSelection = (tabId) => {
        const selectedTab = tabs.find(t => t.id === tabId);
        if (selectedTab) {
            setActiveTabId(tabId);
            setActivityType(selectedTab.type);
            setTopic(selectedTab.title || '');
        }
        setTabSelectionModal({ isOpen: false, type: '' });
    };

    const handleCreateNewFromModal = () => {
        setActivityType(tabSelectionModal.type);
        setActiveTabId(null);
        setTabSelectionModal({ isOpen: false, type: '' });
    };

    // --- CONSTANTS ---
    const activityOptions = useMemo(() => [
        { id: 'quiz', label: 'Quiz / Questões', icon: <FileText className="w-4 h-4" /> },
        { id: 'wordsearch', label: 'Caça-Palavras', icon: <Grid className="w-4 h-4" /> },
        { id: 'crossword', label: 'Palavras Cruzadas', icon: <Grid className="w-4 h-4" /> },
        { id: 'trading_cards', label: 'Criador de Cards', icon: <Grid className="w-4 h-4" /> },
        { id: 'summary', label: 'Drácker Metodologia Ativa', icon: <MessageSquare className="w-4 h-4" /> },
        { id: 'rpg', label: 'Drácker Mestre RPG', icon: <Compass className="w-4 h-4" /> },
        { id: 'domino', label: 'Dominó Pedagógico', icon: <Grid className="w-4 h-4" /> },

        { id: 'memory', label: 'Jogo da Memória', icon: <Brain className="w-4 h-4" /> },
        { id: 'connect_dots', label: 'Liga Pontos', icon: <BrainCircuit className="w-4 h-4" /> },


        { id: 'hangman', label: 'Jogo da Forca', icon: <Gamepad2 className="w-4 h-4" /> },
        { id: 'merge_pdf', label: 'Unir PDFs', icon: <Files className="w-4 h-4" /> },
        { id: 'number_line', label: 'Drácker: Reta Numérica', icon: <ArrowLeftRight className="w-4 h-4" /> },
        { id: 'fractions', label: 'Drácker: Frações e Operações', icon: <PieChart className="w-4 h-4" /> },
    ], []);

    const difficultyOptions = useMemo(() => [
        { id: 'easy', label: 'Anos Iniciais', tooltip: 'Linguagem lúdica, infantil e muito simples.' },
        { id: 'medium', label: 'Anos Finais', tooltip: 'Linguagem escolar padrão, clara e direta.' },
        { id: 'hard', label: 'Ensino Médio', tooltip: 'Linguagem formal, mais aprofundada e conceitual.' },
    ], []);

    // Sync Form with Active Activity
    useEffect(() => {
        if (activeActivity) {
            setTopic(activeActivity.title || '');
            
            // Atualiza o título da aba do navegador
            if (activeActivity.title && activeActivity.title !== 'Sem título') {
                document.title = `${activeActivity.title} - Drácker Adapta`;
            } else {
                document.title = 'Drácker Adapta';
            }

            if (['quiz', 'wordsearch', 'crossword', 'trading_cards', 'summary', 'simplify', 'connect_dots', 'video_gallery', 'memory', 'rpg', 'chat_dracker', 'about_system', 'number_line', 'fractions'].includes(activeActivity.type)) {
                setActivityType(activeActivity.type);
            }
        }
    }, [activeActivity]);

    const updateActivityData = (tabId, newData) => {
        setTabs(prev => prev.map(t => {
            if (t.id === tabId) {
                return { ...t, ...newData };
            }
            return t;
        }));
    };

    return (
        <ActivityContext.Provider value={{
            tabs, setTabs,
            activeTabId, setActiveTabId,
            activeActivity,
            addActivityTab, closeTab, deleteTab, handleTabsReorder,
            renameTab, pinTab, duplicateTab, closeOtherTabs, closeAllTabs,
            updateActivityData,

            topic, setTopic,
            lessonDetails, setLessonDetails,
            activityType, setActivityType,
            difficulty, setDifficulty,

            imagePrompt, setImagePrompt,
            imageSize, setImageSize,
            imageStyle, setImageStyle,
            imagePng, setImagePng,

            hangmanBatch, setHangmanBatch,

            isEditing, setIsEditing,

            tabSelectionModal, setTabSelectionModal,
            handleActivityTypeChange,
            handleTabSelection,
            handleCreateNewFromModal,

            activityOptions,
            difficultyOptions
        }}>
            {children}
        </ActivityContext.Provider>
    );
};
