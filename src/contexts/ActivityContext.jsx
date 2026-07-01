import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { safeLocalStorageGet, safeLocalStorageSet, safeLocalStorageRemove } from '../utils/storage';
import {
    FileText, MessageSquare, Grid, Music, BrainCircuit, Play, Files, Compass, Brain, Gamepad2, ArrowLeftRight
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
        const newTab = { id: Date.now().toString(), ...activityData };
        setTabs(prev => [...prev, newTab]);
        setActiveTabId(newTab.id);
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

            if (['quiz', 'wordsearch', 'crossword', 'trading_cards', 'summary', 'simplify', 'connect_dots', 'video_gallery', 'memory', 'rpg', 'chat_dracker', 'about_system', 'number_line'].includes(activeActivity.type)) {
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
