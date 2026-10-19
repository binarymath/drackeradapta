
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useActivity } from './contexts/ActivityContext';
import { useGemini } from './contexts/GeminiContext';
import { useAudio } from './contexts/AudioContext';

import { useActivityActions } from './hooks/useActivityActions';
// import { useDrackerState } from './hooks/useDrackerState'; // Deprecated in favor of Context

import { useBackupSystem } from './hooks/useBackupSystem';
import { ExportService } from './services/ExportService';
import { exportActivityToPdf } from './utils/pdfExportHelper';

import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { ActivityArea } from './components/ActivityArea';
import { ActivityDashboard } from './components/ActivityDashboard';
import { AppModals } from './components/AppModals';
import { Footer } from './components/Footer';
import { CookieBanner } from './components/CookieBanner';
import { BackupVersionCenterModal } from './components/BackupVersionCenterModal';
import { GoogleSheetsImportModal } from './components/roulette/GoogleSheetsImportModal';
import { HeroGenerator } from './components/HeroGenerator';
import { InspectorPanel } from './components/InspectorPanel';
import { Music, Play, MessageSquare, Compass, ArrowLeftRight, PieChart, Dices, FileText, Grid } from 'lucide-react';

export const MainLayout = () => {
    // --- CONTEXTS ---
    const {
        tabs, setTabs,
        activeTabId, setActiveTabId,
        activeActivity,
        addActivityTab, closeTab, deleteTab, handleTabsReorder,
        updateActivityData,
        topic, setTopic,
        lessonDetails, setLessonDetails,
        classes, setClasses,
        selectedClassId, setSelectedClassId,
        activityType, setActivityType,
        difficulty, setDifficulty,
        imagePrompt, setImagePrompt,
        imageSize, setImageSize,
        imageStyle, setImageStyle,
        imagePng, setImagePng,
        isEditing, setIsEditing,
        tabSelectionModal, setTabSelectionModal,
        selectActivityTab,
        handleActivityTypeChange,
        handleTabSelection,
        handleCreateNewFromModal,
        activityOptions,
        difficultyOptions, // Fixed: Added difficultyOptions to context earlier
        pinTab,
        duplicateTab,
        closeOtherTabs,
        closeAllTabs,
        reopenTab
    } = useActivity();

    const {
        apiKey,
        handleApiKeyChange,
        clearApiKey,
        modelOptions,
        selectedModel,
        setSelectedModel,
        showSettings,
        setShowSettings,
        apiKeyStatus,
        geminiService,
        systemStatus: geminiSystemStatus
    } = useGemini();

    const {
        isGeneratingAudio,
        isSpeaking,
        isPaused,
        speechChunks,
        chunkIndex,
        speechSettings,
        setSpeechSettings,
        generateAudio,
        handleSpeak,
        speakNext,
        speakPrev,
        resetAudioState,
        showVoiceSettings,
        setShowVoiceSettings,
        showAudioRecorder,
        setShowAudioRecorder
    } = useAudio();

    const actions = useActivityActions();
    const isChatActivity = (activeActivity?.type || activityType) === 'chat_dracker';

    const activityAreaRef = useRef(null);

    // --- LOCAL VIEW STATE (Wordsearch/Display) ---
    // These are specific to the "view" of the current activity and didn't fit neatly into global context
    const [foundWords, setFoundWords] = useState([]);
    const [foundPlacements, setFoundPlacements] = useState([]);
    const [showAnswers, setShowAnswers] = useState(false);
    const [wordsearchTitle, setWordsearchTitle] = useState('');
    const [directions, setDirections] = useState({ horizontal: true, vertical: true, diagonal: true, reverse: false });
    const [wordsearchHideText, setWordsearchHideText] = useState(false);
    const [wordsearchHideGrid, setWordsearchHideGrid] = useState(false);

    // --- FULL WIDTH STATE ---
    const [isFullWidth, setIsFullWidth] = useState(false);

    // --- GOOGLE SHEETS: criar nova roleta sem IA ---
    const [showSheetsCreateModal, setShowSheetsCreateModal] = useState(false);
    const handleCreateRouletteFromSheets = (importedQuestions, sheetLabel) => {
        addActivityTab({
            title: sheetLabel ? `Roleta: ${sheetLabel}` : 'Roleta (Planilha)',
            type: 'roulette',
            content: `Roleta criada a partir do Google Sheets`,
            questions: importedQuestions,
        });
    };

    const handleImportToCurrentActivity = (importedQuestions) => {
        if (!activeActivity || activeActivity.type !== 'roulette') return;
        const currentQuestions = activeActivity.questions || [];
        updateActivityData(activeTabId, {
            questions: [...currentQuestions, ...importedQuestions]
        });
    };

    // --- ACTIVITY SYNC EFFECTS ---
    useEffect(() => {
        if (activeActivity) {
            // Sync Wordsearch View State
            if (activeActivity.type === 'wordsearch') {
                const storedData = activeActivity.wordsearchData || activeActivity.data || {};
                setFoundWords(storedData.words || []);
                setFoundPlacements(storedData.placements || []);
                setWordsearchTitle(storedData.title || activeActivity.title || '');
                setWordsearchHideText(storedData.hideText ?? false);
                setWordsearchHideGrid(storedData.hideGrid ?? false);
                if (storedData.directions) setDirections(storedData.directions);
            }
        } else {
            resetAudioState();
        }
    }, [activeActivity, resetAudioState]);

    // Audio Sync for new content
    useEffect(() => {
        if (!activeActivity) return;
        let textToRead = activeActivity.content || '';
        if (activeActivity.type === 'wordsearch' && activeActivity.wordsearchData?.story) {
            textToRead = activeActivity.wordsearchData.story;
        } else if (activeActivity.type === 'crossword' && activeActivity.data?.words) {
            const words = activeActivity.data.words;
            textToRead = `Palavras Cruzadas sobre ${activeActivity.title || 'o tema'}. Dicas: ` +
                words.map((w, i) => `Número ${w.num || i + 1}: ${w.clue || w.hint}`).join('. ');
        } else if (activeActivity.type === 'connect_dots') {
            textToRead = `Atividade de ligar pontos sobre ${activeActivity.title}.`;
        }

        if (textToRead) generateAudio(textToRead);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeActivity?.id]);

    // --- HANDLERS ---

    const handleWordsearchComplete = (payload) => {
        const { content, words, placements, title, story, rows, cols, directions: wizDirections, gameModeType, mathSubtopic, mathAnswerFormat } = payload || {};
        const newData = {
            words: words || [],
            placements: placements || [],
            title: title,
            hideText: wordsearchHideText,
            hideGrid: wordsearchHideGrid,
            story,
            rows, cols, directions: wizDirections,
            gameModeType, mathSubtopic, mathAnswerFormat
        };

        if (isEditing && activeActivity?.type === 'wordsearch') {
            setTabs(prev => prev.map(t => {
                if (t.id === activeTabId) {
                    return { ...t, content, wordsearchData: newData, title: title || t.title };
                }
                return t;
            }));
        } else {
            addActivityTab({
                title: title || topic || "Caça-Palavras",
                type: 'wordsearch',
                content: content,
                wordsearchData: newData
            });
        }
    };

    const handleEditQuiz = () => {
        setIsEditing(true);
        actions.openEditQuiz(activeActivity?.quizData || { questions: [] });
    };
    const handleEditMusic = () => {
        if (activeActivity?.musicData) {
            setIsEditing(true);
            actions.openEditMusic(activeActivity.musicData);
        }
    };
    const handleEditConnectDots = () => {
        if (activeActivity?.data) {
            setIsEditing(true);
            actions.openEditConnectDots(activeActivity.data);
        }
    };
    const handleEditDomino = () => {
        if (activeActivity?.dominoData) {
            setIsEditing(true);
            actions.openEditDomino(activeActivity.dominoData);
        }
    };
    const handleEditWordsearch = () => {
        if (!activeActivity || activeActivity.type !== 'wordsearch') return;
        const storedData = activeActivity.wordsearchData || activeActivity.data || {};
        const storyFromContent = () => {
            if (!activeActivity.content) return '';
            const parts = activeActivity.content.split('________________');
            return parts.length > 1 ? parts[1].replace(/[_\n]/g, ' ').trim() : '';
        };
        const editPayload = {
            ...storedData,
            title: storedData?.title || activeActivity.title,
            content: activeActivity.content,
            story: storedData?.story || storyFromContent(),
        };
        setTopic(activeActivity.title || topic);
        setWordsearchHideText(storedData?.hideText ?? false);
        setWordsearchHideGrid(storedData?.hideGrid ?? false);
        setActivityType('wordsearch');
        actions.startWordsearchWizard({ editingData: editPayload });
    };

    const handleLaunchActivityFromHero = (typeKey) => {
        if (typeKey === 'quiz') {
            setIsEditing(false);
            actions.openEditQuiz({ questions: [] });
            return;
        }
        if (typeKey === 'wordsearch') {
            setIsEditing(false);
            setActivityType('wordsearch');
            actions.startWordsearchWizard();
            return;
        }
        if (typeKey === 'crossword') {
            setIsEditing(false);
            setActivityType('crossword');
            actions.setCrosswordEditorData({ words: [] });
            actions.setShowCrosswordEditor(true);
            return;
        }
        if (typeKey === 'simplify') {
            setIsEditing(false);
            setActivityType('simplify');
            actions.setMusicEditorData({ verses: [], topic: topic || '' });
            actions.setShowMusicEditor(true);
            return;
        }
        if (typeKey === 'domino') {
            setIsEditing(false);
            setActivityType('domino');
            actions.setDominoEditorData({ pairs: [], topic: topic || '', lessonDetails: lessonDetails || '', isCircular: false });
            actions.setShowDominoEditor(true);
            return;
        }
        if (typeKey === 'connect_dots') {
            setIsEditing(false);
            setActivityType('connect_dots');
            actions.setConnectDotsEditorData({ pairs: [], topic: topic || '' });
            actions.setShowConnectDotsEditor(true);
            return;
        }
        if (typeKey === 'fractions') {
            handleActivityTypeChange('fractions');
            addActivityTab({
                title: topic ? `Frações: ${topic}` : "Estúdio de Frações",
                type: 'fractions',
                content: 'Estúdio de Frações'
            });
            return;
        }
        if (typeKey === 'number_line') {
            handleActivityTypeChange('number_line');
            addActivityTab({
                title: topic ? `Reta: ${topic}` : "Reta Numérica",
                type: 'number_line',
                content: 'Estúdio da Reta Numérica'
            });
            return;
        }
        if (typeKey === 'trading_card' || typeKey === 'trading_cards') {
            handleActivityTypeChange('trading_cards');
            addActivityTab({
                title: topic ? `Card: ${topic}` : "Card Colecionável",
                type: 'trading_cards',
                content: 'Criador de Cards Colecionáveis Didáticos'
            });
            return;
        }
        if (typeKey === 'rpg') {
            handleActivityTypeChange('rpg');
            addActivityTab({
                title: topic ? `RPG: ${topic}` : "Drácker RPG",
                type: 'rpg',
                content: "Aventura do Drácker"
            });
            return;
        }
        if (typeKey === 'roulette') {
            handleActivityTypeChange('roulette');
            addActivityTab({
                title: topic ? `Roleta: ${topic}` : "Roleta Pedagógica",
                type: 'roulette',
                content: "Roleta do Drácker"
            });
            return;
        }
        if (typeKey === 'memory') {
            handleActivityTypeChange('memory');
            addActivityTab({
                title: topic ? `Memória: ${topic}` : "Jogo da Memória",
                type: 'memory',
                content: "Jogo da Memória"
            });
            return;
        }
        if (typeKey === 'hangman') {
            handleActivityTypeChange('hangman');
            addActivityTab({
                title: topic ? `Forca: ${topic}` : "Jogo da Forca",
                type: 'hangman',
                content: "Jogo da Forca",
                data: {}
            });
            return;
        }
        if (typeKey === 'video_gallery') {
            handleActivityTypeChange('video_gallery');
            addActivityTab({
                title: "Galeria Drácker",
                type: 'video_gallery',
                content: "Galeria de Vídeos",
                data: {}
            });
            return;
        }
        if (typeKey === 'chat_dracker') {
            handleActivityTypeChange('chat_dracker');
            const chatTab = tabs.find(t => t.type === 'chat_dracker');
            if (chatTab) {
                selectActivityTab(chatTab.id);
            } else {
                addActivityTab({
                    type: 'chat_dracker',
                    title: 'Conversa com Drácker',
                    chatData: { messages: [{
                        role: 'model',
                        parts: [{ text: "Olá! Que bom te encontrar por aqui!\n\nEu sou o Drácker, o dragãozinho curioso da floresta encantada e mascote do \"Drácker Adapta\"! Em que posso te ajudar hoje?" }]
                    }] }
                });
            }
            return;
        }
        if (typeKey === 'summary') {
            handleActivityTypeChange('summary');
            actions.handleGenerate();
            return;
        }
    };

    // Ouvinte global para criação de nova atividade de modal (+ Novo)
    useEffect(() => {
        const handleNewModalActivityEvent = (e) => {
            const typeKey = e.detail?.type;
            if (typeKey) {
                handleLaunchActivityFromHero(typeKey);
            }
        };
        window.addEventListener('dracker_open_new_modal_activity', handleNewModalActivityEvent);
        return () => window.removeEventListener('dracker_open_new_modal_activity', handleNewModalActivityEvent);
    }, [handleLaunchActivityFromHero]);

    // Exports
    const handleDownloadPdf = () => {
        exportActivityToPdf('activity-area-print', topic || 'Folha de Atividade - Drácker');
    };
    const handleDownloadGeneratedPng = () => {
        if (!imagePng) return;
        const link = document.createElement('a');
        link.href = imagePng;
        link.download = `imagem-${topic}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Backup (.json Versionado e Legado)
    const {
        exportSystemState,
        importSystemState,
        importDialog,
        backupCenterModal,
        openBackupCenter,
        closeBackupCenter,
        restoreTabsVersioned,
        mergeTabsVersioned,
        openSingleTabVersioned,
        handleMergeImport,
        handleReplaceImport,
        closeImportDialog
    } = useBackupSystem(tabs, setTabs, setActiveTabId, setActivityType, setTopic, classes, setClasses);

    const getTabLabel = (tab) => {
        const title = tab.title || 'Sem título';
        return title.length > 25 ? title.substring(0, 25) + '...' : title;
    };

    // Combined System Status
    const displayedSystemStatus = geminiSystemStatus || actions.systemStatus;

    // Rolagem automática para o topo da área de atividade ao alternar no sidebar
    useEffect(() => {
        setTimeout(() => {
            if (window.innerWidth < 1024) {
                const container = document.getElementById('activity-area-container');
                if (container) {
                    container.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            } else {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        }, 30);
    }, [activityType]);

    const navLinks = useMemo(() => {
        const priorityItems = [
            { id: 'about_system', label: 'Início', icon: <span className="text-xl">ℹ️</span> },
            { id: 'simplify', label: 'Rádio Drácker', icon: <Music className="w-5 h-5" /> },
            { id: 'video_gallery', label: 'Vídeos Interativos', icon: <Play className="w-5 h-5" /> },
            { id: 'roulette', label: 'Roleta', icon: <Dices className="w-5 h-5" /> },
            { id: 'rpg', label: 'RPG', icon: <Compass className="w-5 h-5" /> },
            { id: 'quiz', label: 'Quiz', icon: <FileText className="w-5 h-5" /> },
            { id: 'wordsearch', label: 'Caça Palavras', icon: <Grid className="w-5 h-5" /> },
            { id: 'crossword', label: 'Palavras Cruzadas', icon: <Grid className="w-5 h-5" /> },
        ];

        const remainingPredefined = [
            { id: 'summary', label: 'Metodologia Ativa', icon: <MessageSquare className="w-5 h-5" /> },
            { id: 'number_line', label: 'Reta Num', icon: <ArrowLeftRight className="w-5 h-5" /> },
            { id: 'fractions', label: 'Frações', icon: <PieChart className="w-5 h-5" /> },
        ];

        const handledIds = new Set([
            ...priorityItems.map(item => item.id),
            ...remainingPredefined.map(item => item.id),
            'chat_dracker',
            'reports'
        ]);

        const otherActivityOptions = (activityOptions || []).filter(opt => !handledIds.has(opt.id));

        return [
            ...priorityItems,
            ...remainingPredefined,
            ...otherActivityOptions
        ];
    }, [activityOptions]);

    const showDashboard = activityType === 'dashboard' && !activeActivity;
    const showHero = (!activeActivity && !['merge_pdf', 'video_gallery', 'chat_dracker', 'simplify', 'dashboard', 'reports', 'trading_cards', 'trading_card'].includes(activityType)) || activeActivity?.type === 'about_system' || activityType === 'about_system';

    return (
        <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">
            {/* Menu Lateral Fino */}
            {!isFullWidth && (
                <div className="flex-shrink-0 no-print z-50">
                    <Sidebar
                        showSettings={showSettings}
                        apiKey={apiKey}
                        handleApiKeyChange={handleApiKeyChange}
                        clearApiKey={clearApiKey}
                        modelOptions={modelOptions}
                        selectedModel={selectedModel}
                        setSelectedModel={setSelectedModel}
                        imagePng={imagePng}
                        handleDownloadGeneratedPng={handleDownloadGeneratedPng}
                        topic={topic}
                        setTopic={setTopic}
                        lessonDetails={lessonDetails}
                        setLessonDetails={setLessonDetails}
                        classes={classes}
                        setClasses={setClasses}
                        selectedClassId={selectedClassId}
                        setSelectedClassId={setSelectedClassId}
                        difficultyOptions={difficultyOptions}
                        difficulty={difficulty}
                        setDifficulty={setDifficulty}
                        activityOptions={activityOptions}
                        activityType={activityType}
                        setActivityType={handleActivityTypeChange}
                        imagePrompt={imagePrompt}
                        setImagePrompt={setImagePrompt}
                        imageStyle={imageStyle}
                        setImageStyle={setImageStyle}
                        imageSize={imageSize}
                        setImageSize={setImageSize}
                        isLoading={actions.isLoading}
                        geminiService={geminiService}
                        handleGenerate={actions.handleGenerate}
                        openManualMusicEditor={actions.openManualMusicEditor}
                        systemStatus={displayedSystemStatus}
                        error={actions.error}
                        questionCount={actions.questionCount}
                        setQuestionCount={actions.setQuestionCount}
                        difficultyDist={actions.difficultyDist}
                        setDifficultyDist={actions.setDifficultyDist}
                        onOpenSheetsModal={() => setShowSheetsCreateModal(true)}
                    />
                </div>
            )}

            {/* Main Area */}
            <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
                {!isFullWidth && (
                    <Header
                        className="no-print"
                        apiKeyStatus={apiKeyStatus}
                        handleSpeak={handleSpeak}
                        isGeneratingAudio={isGeneratingAudio}
                        isSpeaking={isSpeaking}
                        isPaused={isPaused}
                        openVoiceSettings={() => setShowVoiceSettings(true)}
                        speakPrev={speakPrev}
                        speakNext={speakNext}
                        speechChunks={speechChunks}
                        chunkIndex={chunkIndex}
                        showSettings={showSettings}
                        setShowSettings={setShowSettings}
                        onBackup={exportSystemState}
                        onRestore={importSystemState}
                        onOpenBackupCenter={openBackupCenter}
                        openAudioRecorder={() => setShowAudioRecorder(true)}
                        onOpenDashboard={() => {
                            selectActivityTab(null);
                            handleActivityTypeChange('dashboard');
                        }}
                        hideAtividadesButton={showDashboard || tabs.length === 0}
                    />
                )}

                <main className={`flex-1 flex flex-col w-full min-h-0 ${isChatActivity ? 'overflow-hidden p-2 sm:p-3' : 'overflow-y-auto p-4 md:p-6 lg:p-8'}`}>
                    <div id="activity-area-container" className={`max-w-[1600px] mx-auto w-full flex-1 min-h-0 flex flex-col ${isChatActivity ? 'gap-0' : 'gap-6'}`}>

                        <div className={`flex-1 min-h-0 flex flex-col bg-white shadow-sm border border-slate-200 overflow-hidden relative ${isChatActivity ? 'rounded-2xl' : 'rounded-[2.5rem]'}`}>
                            {showHero ? (
                                <HeroGenerator
                                    topic={topic}
                                    setTopic={setTopic}
                                    lessonDetails={lessonDetails}
                                    setLessonDetails={setLessonDetails}
                                    difficulty={difficulty}
                                    setDifficulty={setDifficulty}
                                    difficultyOptions={difficultyOptions}
                                    activityType={activityType}
                                    setActivityType={handleActivityTypeChange}
                                    activityOptions={activityOptions}
                                    handleGenerate={actions.handleGenerate}
                                    isLoading={actions.isLoading}
                                    systemStatus={displayedSystemStatus}
                                    error={actions.error}
                                    navLinks={navLinks}
                                    selectActivityTab={selectActivityTab}
                                    onOpenQuizWizard={() => actions.openEditQuiz({ questions: [] })}
                                    onLaunchActivity={handleLaunchActivityFromHero}
                                />
                            ) : showDashboard ? (
                                <ActivityDashboard
                                    tabs={tabs}
                                    onSelect={(id) => {
                                        selectActivityTab(id);
                                    }}
                                    onCreateNew={(typeHint) => {
                                        if (typeHint === 'quiz') {
                                            actions.openEditQuiz({ questions: [] });
                                        } else {
                                            selectActivityTab(null);
                                            handleActivityTypeChange(typeHint || '');
                                        }
                                    }}
                                    onDeleteTab={(id) => {
                                        deleteTab(id);
                                    }}
                                    onEditTab={(tab) => {
                                        selectActivityTab(tab.id);
                                        const type = tab.type;
                                        if (type === 'wordsearch') {
                                            const storedData = tab.wordsearchData || tab.data || {};
                                            const storyFromContent = () => {
                                                if (!tab.content) return '';
                                                const parts = tab.content.split('________________');
                                                return parts.length > 1 ? parts[1].replace(/[_\n]/g, ' ').trim() : '';
                                            };
                                            const editPayload = {
                                                ...storedData,
                                                title: storedData?.title || tab.title,
                                                content: tab.content,
                                                story: storedData?.story || storyFromContent(),
                                            };
                                            setIsEditing(true);
                                            actions.openEditWordsearch(editPayload);
                                        } else if (type === 'quiz') {
                                            setIsEditing(true);
                                            actions.openEditQuiz(tab.quizData || { questions: [] });
                                        } else if (type === 'simplify') {
                                            setIsEditing(true);
                                            actions.openEditMusic(tab.musicData);
                                        } else if (type === 'connect_dots') {
                                            setIsEditing(true);
                                            actions.openEditConnectDots(tab.data);
                                        } else if (type === 'domino') {
                                            setIsEditing(true);
                                            actions.openEditDomino(tab.dominoData);
                                        }
                                    }}
                                />
                            ) : (
                                <ActivityArea
                                    generatedContent={activeActivity ? activeActivity.content : ''}
                                    activityType={activeActivity ? activeActivity.type : activityType}
                                    foundWords={activeActivity?.wordsearchData?.words || activeActivity?.data?.words || foundWords}
                                    foundPlacements={activeActivity?.wordsearchData?.placements || activeActivity?.data?.placements || foundPlacements}
                                    wordsearchTitle={activeActivity?.wordsearchData?.title || activeActivity?.data?.title || wordsearchTitle}
                                    showAnswers={showAnswers}
                                    setShowAnswers={setShowAnswers}
                                    handleDownloadPdf={handleDownloadPdf}
                                    activityAreaRef={activityAreaRef}
                                    setWordsearchTitle={setWordsearchTitle}
                                    wordsearchHideText={wordsearchHideText}
                                    setWordsearchHideText={setWordsearchHideText}
                                    wordsearchHideGrid={wordsearchHideGrid}
                                    setWordsearchHideGrid={setWordsearchHideGrid}
                                    isLoading={actions.isLoading}
                                    isGeneratingAudio={isGeneratingAudio}
                                    onEdit={
                                        activityType === 'wordsearch' ? handleEditWordsearch :
                                            (activeActivity?.type === 'quiz' || activityType === 'quiz') ? handleEditQuiz :
                                                    (activeActivity?.type === 'simplify' || activityType === 'simplify') ? handleEditMusic :
                                                        (activeActivity?.type === 'connect_dots' || activityType === 'connect_dots') ? handleEditConnectDots :
                                                            (activeActivity?.type === 'domino' || activityType === 'domino') ? handleEditDomino :
                                                                undefined
                                    }
                                    musicData={activeActivity?.musicData}
                                    crosswordData={activeActivity?.data}
                                    connectDotsData={activeActivity?.data}
                                    drackerData={activeActivity?.data}
                                    dominoData={activeActivity?.dominoData}
                                    quizData={activeActivity?.quizData}
                                    activityTitle={activeActivity?.title || ''}
                                    setActivityTitle={(newTitle) => {
                                        setTabs(prev => prev.map(t => {
                                            if (t.id === activeTabId) {
                                                const updatedTab = { ...t, title: newTitle };
                                                if (t.type === 'wordsearch' && t.wordsearchData) {
                                                    updatedTab.wordsearchData = { ...t.wordsearchData, title: newTitle };
                                                }
                                                if (t.type === 'wordsearch' && t.data) {
                                                    updatedTab.data = { ...t.data, title: newTitle };
                                                }
                                                return updatedTab;
                                            }
                                            return t;
                                        }));
                                        setWordsearchTitle(newTitle);
                                    }}
                                    onCrosswordUpdate={(newData) => {
                                        setTabs(prev => prev.map(t => {
                                            if (t.id === activeTabId) return { ...t, data: newData };
                                            return t;
                                        }));
                                    }}
                                    onDrackerUpdate={(newData) => {
                                        setTabs(prev => prev.map(t => {
                                            if (t.id === activeTabId) return { ...t, content: newData };
                                            return t;
                                        }));
                                    }}
                                    isFullWidth={isFullWidth}
                                    toggleFullWidth={() => setIsFullWidth(!isFullWidth)}
                                    openManualMusicEditor={actions.openManualMusicEditor}
                                    onNewActivity={handleLaunchActivityFromHero}
                                />
                            )}
                        </div>
                    </div>
                </main>

                <BackupVersionCenterModal
                    isOpen={backupCenterModal.isOpen}
                    onClose={closeBackupCenter}
                    currentTabs={tabs}
                    classes={classes}
                    onRestoreTabs={restoreTabsVersioned}
                    onMergeTabs={mergeTabsVersioned}
                    onOpenSingleActivity={openSingleTabVersioned}
                    initialTab={backupCenterModal.initialTab}
                    initialFileContent={backupCenterModal.initialFileContent}
                />

                <AppModals
                    {...actions}
                    showVoiceSettings={showVoiceSettings}
                    setShowVoiceSettings={setShowVoiceSettings}
                    showAudioRecorder={showAudioRecorder}
                    setShowAudioRecorder={setShowAudioRecorder}
                    speechSettings={speechSettings}
                    setSpeechSettings={setSpeechSettings}
                    tabSelectionModal={tabSelectionModal}
                    setTabSelectionModal={setTabSelectionModal}
                    tabs={tabs}
                    handleTabSelection={handleTabSelection}
                    handleCreateNewFromModal={handleCreateNewFromModal}
                    deleteTab={deleteTab}
                    updateActivityData={updateActivityData}
                    importDialog={importDialog}
                    handleMergeImport={handleMergeImport}
                    handleReplaceImport={handleReplaceImport}
                    closeImportDialog={closeImportDialog}
                    currentTabsCount={tabs.length}
                    apiKey={apiKey}
                    topic={topic}
                    lessonDetails={lessonDetails}
                    difficulty={difficulty}
                    directions={directions}
                    setDirections={setDirections}
                    handleWordsearchComplete={handleWordsearchComplete}
                    handleChildError={(msg) => actions.setError(msg)}
                    geminiService={geminiService}
                />

                <GoogleSheetsImportModal
                    isOpen={showSheetsCreateModal}
                    onClose={() => setShowSheetsCreateModal(false)}
                    mode="create"
                    onCreateNew={handleCreateRouletteFromSheets}
                    onImport={activeActivity?.type === 'roulette' ? handleImportToCurrentActivity : undefined}
                />

                {!isFullWidth && !isChatActivity && <Footer />}
            </div>
            <CookieBanner />
            <InspectorPanel
                isOpen={showSettings}
                onClose={() => setShowSettings(false)}
                topic={topic}
                setTopic={setTopic}
                lessonDetails={lessonDetails}
                setLessonDetails={setLessonDetails}
                difficulty={difficulty}
                setDifficulty={setDifficulty}
                difficultyOptions={difficultyOptions}
                activityType={activityType}
                apiKey={apiKey}
                handleApiKeyChange={handleApiKeyChange}
                clearApiKey={clearApiKey}
                selectedModel={selectedModel}
                setSelectedModel={setSelectedModel}
                modelOptions={modelOptions}
                handleGenerate={actions.handleGenerate}
                isLoading={actions.isLoading}
                systemStatus={displayedSystemStatus}
                questionCount={useActivity().questionCount}
                setQuestionCount={useActivity().setQuestionCount}
                difficultyDist={useActivity().difficultyDist}
                setDifficultyDist={useActivity().setDifficultyDist}
            />

            {/* Floating Chat Button (Atendente) */}
            {!isChatActivity && <button
                onClick={() => {
                    const chatTab = tabs.find(t => t.type === 'chat_dracker');
                    if (chatTab) {
                        selectActivityTab(chatTab.id);
                    } else {
                        addActivityTab({
                            type: 'chat_dracker',
                            title: 'Conversa com Drácker',
                            chatData: { messages: [{
                                role: 'model',
                                parts: [{ text: "Olá! Que bom te encontrar por aqui!\n\nEu sou o Drácker, o dragãozinho marrom mais curioso da floresta encantada e mascote do \"Drácker Adapta\"! Minha missão, e a da minha turma de amigos (a sábia Coruja, o ágil Esquilo, a esperta Raposa e o fofinho Coelho), é ajudar você a transformar suas aulas em verdadeiras expedições de aprendizado, cheias de descobertas e engajamento!\n\nPara começarmos nossa aventura juntos, me diga: qual é o seu nome e o assunto de nossa conversa? Assim, posso te ajudar de uma forma ainda mais especial e adaptada aos seus desafios!\n\nMal posso esperar para desvendarmos os mistérios da educação ativa com você! Vamos nessa?" }]
                            }] }
                        });
                    }
                }}
                className={`fixed bottom-4 sm:bottom-6 ${isFullWidth ? 'left-4 sm:left-6' : 'left-20 sm:left-24'} z-50 flex h-14 w-14 items-center gap-3 overflow-hidden rounded-full border border-slate-200 bg-white p-2 shadow-2xl transition-[width,border-color,transform] duration-200 hover:w-56 hover:scale-[1.02] hover:border-indigo-300 focus-visible:w-56 focus-visible:border-indigo-300 cursor-pointer group`}
                aria-label="Fale com o Drácker"
                title="Fale com o Drácker"
            >
                <div className="w-10 h-10 shrink-0 bg-indigo-100 rounded-full flex items-center justify-center group-hover:bg-indigo-500 transition-colors">
                    <MessageSquare className="w-5 h-5 text-indigo-600 group-hover:text-white transition-colors" />
                </div>
                <span className="whitespace-nowrap font-bold text-sm text-slate-700 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 group-focus-visible:opacity-100 group-focus-visible:translate-x-0 transition-all">Fale com o Drácker</span>
            </button>}

        </div>
    );
};
