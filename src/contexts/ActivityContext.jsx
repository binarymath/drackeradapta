import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { safeLocalStorageGet, safeLocalStorageSet, safeLocalStorageRemove } from '../utils/storage';
import {
    FileText, MessageSquare, Grid, Music, BrainCircuit, Play, Files, Compass, Brain, Gamepad2
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
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            return [];
        }
    });

    const [activeTabId, setActiveTabId] = useState(() => {
        const saved = safeLocalStorageGet('atividade_adaptada_active_tab');
        return saved || null;
    });

    // --- FORM STATE ---
    const [topic, setTopic] = useState('');
    const [lessonDetails, setLessonDetails] = useState('');
    const [activityType, setActivityType] = useState('quiz');
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
        tabs: [],
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
        const newTabs = tabs.filter(t => t.id !== id);
        setTabs(newTabs);
        if (activeTabId === id) {
            if (newTabs.length > 0) setActiveTabId(newTabs[newTabs.length - 1].id);
            else setActiveTabId(null);
        }
    };

    const handleTabsReorder = (reorderedTabs) => setTabs(reorderedTabs);

    // Activity Switch Logic
    const handleActivityTypeChange = (type) => {
        const existingTabs = tabs.filter(t => t.type === type);
        if (existingTabs.length === 1) {
            setActiveTabId(existingTabs[0].id);
            setActivityType(type); // Ensure sidebar highlight updates
        } else if (existingTabs.length > 1) {
            setTabSelectionModal({ isOpen: true, tabs: existingTabs, type: type });
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
        setTabSelectionModal({ isOpen: false, tabs: [], type: '' });
    };

    const handleCreateNewFromModal = () => {
        setActivityType(tabSelectionModal.type);
        setActiveTabId(null);
        setTabSelectionModal({ isOpen: false, tabs: [], type: '' });
    };

    // --- CONSTANTS ---
    const activityOptions = useMemo(() => [
        { id: 'quiz', label: 'Quiz / Questões', icon: <FileText className="w-4 h-4" /> },
        { id: 'wordsearch', label: 'Caça-Palavras', icon: <Grid className="w-4 h-4" /> },
        { id: 'crossword', label: 'Palavras Cruzadas', icon: <Grid className="w-4 h-4" /> },
        { id: 'summary', label: 'Aprenda com o Drácker', icon: <MessageSquare className="w-4 h-4" /> },
        { id: 'simplify', label: 'Música do Drácker', icon: <Music className="w-4 h-4" /> },
        { id: 'memory', label: 'Jogo da Memória', icon: <Brain className="w-4 h-4" /> },
        { id: 'connect_dots', label: 'Liga Pontos', icon: <BrainCircuit className="w-4 h-4" /> },
        { id: 'video_gallery', label: 'Galeria Drácker', icon: <Play className="w-4 h-4" /> },
        { id: 'rpg', label: 'Drácker RPG', icon: <Compass className="w-4 h-4" /> },
        { id: 'hangman', label: 'Jogo da Forca', icon: <Gamepad2 className="w-4 h-4" /> },
        { id: 'merge_pdf', label: 'Unir PDFs', icon: <Files className="w-4 h-4" /> },
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
            if (['quiz', 'wordsearch', 'crossword', 'summary', 'simplify', 'connect_dots', 'video_gallery', 'memory', 'rpg'].includes(activeActivity.type)) {
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
            addActivityTab, closeTab, handleTabsReorder,
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
