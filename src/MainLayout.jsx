
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useActivity } from './contexts/ActivityContext';
import { useGemini } from './contexts/GeminiContext';
import { useAudio } from './contexts/AudioContext';

import { useActivityActions } from './hooks/useActivityActions';
import { useDrackerState } from './hooks/useDrackerState';
import { useBackupSystem } from './hooks/useBackupSystem';
import { ExportService } from './services/ExportService';

import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { ActivityArea } from './components/ActivityArea';
import { TabsBar } from './components/TabsBar';
import { AppModals } from './components/AppModals';
import { Footer } from './components/Footer';
import { CookieBanner } from './components/CookieBanner';

export const MainLayout = () => {
    // --- CONTEXTS ---
    const {
        tabs, setTabs,
        activeTabId, setActiveTabId,
        activeActivity,
        addActivityTab, closeTab, handleTabsReorder,
        topic, setTopic,
        lessonDetails, setLessonDetails,
        activityType, setActivityType,
        difficulty, setDifficulty,
        imagePrompt, setImagePrompt,
        imageSize, setImageSize,
        imageStyle, setImageStyle,
        imagePng, setImagePng,
        isEditing, setIsEditing,
        tabSelectionModal, setTabSelectionModal,
        handleActivityTypeChange,
        handleTabSelection,
        handleCreateNewFromModal,
        activityOptions,
        difficultyOptions // Fixed: Added difficultyOptions to context earlier
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
    const drackerState = useDrackerState();
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
        const { content, words, placements, title, story, rows, cols, directions: wizDirections } = payload || {};
        const newData = {
            words: words || [],
            placements: placements || [],
            title: title,
            hideText: wordsearchHideText,
            hideGrid: wordsearchHideGrid,
            story,
            rows, cols, directions: wizDirections
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
        if (activeActivity?.quizData) {
            setIsEditing(true);
            actions.openEditQuiz(activeActivity.quizData);
        }
    };
    const handleEditDracker = () => {
        if (activeActivity?.drackerData) {
            setIsEditing(true);
            actions.openEditDracker(activeActivity.drackerData);
        }
    };
    const handleEditMusic = () => {
        if (activeActivity?.musicData) {
            setIsEditing(true);
            actions.openEditMusic(activeActivity.musicData);
        }
    };
    const handleEditConnectDots = () => {
        if (activeActivity?.data) {
            actions.openEditConnectDots(activeActivity.data);
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

    // Exports
    const handleDownloadPdf = async () => {
        if (!activityAreaRef.current) return alert('Área de atividade não encontrada.');
        try {
            await ExportService.exportToPDF(activityAreaRef.current, activeActivity?.title || topic || 'Atividade');
        } catch (e) { alert("Erro ao gerar PDF: " + e.message); }
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

    // Backup
    const {
        exportSystemState,
        importSystemState,
        importDialog,
        handleMergeImport,
        handleReplaceImport,
        closeImportDialog
    } = useBackupSystem(tabs, setTabs, setActiveTabId, drackerState.expeditions, drackerState.actions.setExpeditions, drackerState.allMembers, drackerState.setAllMembers);

    const getTabLabel = (tab) => {
        const labels = { quiz: 'Quiz', summary: 'Drácker', simplify: 'Música', wordsearch: 'Caça-P.', connect_dots: 'Pontos', video_gallery: 'Vídeos', crossword: 'Cruzadas' };
        const title = tab.title || 'Sem título';
        return `${labels[tab.type] || 'Ativ.'}: ${title.substring(0, 15) + (title.length > 15 ? '...' : '')}`;
    };

    // Combined System Status
    const displayedSystemStatus = geminiSystemStatus || actions.systemStatus;

    return (
        <div className="min-h-screen bg-brown-50 font-sans text-brown-900">
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
                openAudioRecorder={() => setShowAudioRecorder(true)}
            />

            <main className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-4 no-print">
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
                        systemStatus={displayedSystemStatus}
                        error={actions.error}
                    />
                </div>

                <div className="lg:col-span-8 flex flex-col gap-4">
                    <div className="no-print">
                        <TabsBar
                            tabs={tabs}
                            activeTabId={activeTabId}
                            onSelect={setActiveTabId}
                            onClose={closeTab}
                            onReorder={handleTabsReorder}
                            getTabLabel={getTabLabel}
                        />
                    </div>

                    <ActivityArea
                        generatedContent={activeActivity ? activeActivity.content : ''}
                        activityType={activeActivity ? activeActivity.type : activityType}
                        // Wordsearch Props
                        foundWords={activeActivity?.wordsearchData?.words || activeActivity?.data?.words || foundWords}
                        foundPlacements={activeActivity?.wordsearchData?.placements || activeActivity?.data?.placements || foundPlacements}
                        wordsearchTitle={activeActivity?.wordsearchData?.title || activeActivity?.data?.title || wordsearchTitle}
                        showAnswers={showAnswers}
                        setShowAnswers={setShowAnswers}
                        // Actions
                        handleDownloadPdf={handleDownloadPdf}
                        activityAreaRef={activityAreaRef}
                        // View Setters
                        setWordsearchTitle={setWordsearchTitle}
                        wordsearchHideText={wordsearchHideText}
                        setWordsearchHideText={setWordsearchHideText}
                        wordsearchHideGrid={wordsearchHideGrid}
                        setWordsearchHideGrid={setWordsearchHideGrid}
                        isLoading={actions.isLoading}
                        isGeneratingAudio={isGeneratingAudio}
                        // Edit Handlers
                        onEdit={
                            activityType === 'wordsearch' ? handleEditWordsearch :
                                activeActivity?.type === 'quiz' ? handleEditQuiz :
                                    activeActivity?.type === 'summary' ? handleEditDracker :
                                        activeActivity?.type === 'simplify' ? handleEditMusic :
                                            activeActivity?.type === 'wordsearch' ? handleEditWordsearch :
                                                activeActivity?.type === 'connect_dots' ? handleEditConnectDots :
                                                    undefined
                        }
                        musicData={activeActivity?.musicData}
                        drackerData={activeActivity?.drackerData}
                        crosswordData={activeActivity?.data}
                        connectDotsData={activeActivity?.data}
                        quizData={activeActivity?.quizData}
                        onCrosswordUpdate={(newData) => {
                            setTabs(prev => prev.map(t => {
                                if (t.id === activeTabId) return { ...t, data: newData };
                                return t;
                            }));
                        }}
                        drackerState={drackerState}
                    />
                </div>

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
                    handleTabSelection={handleTabSelection}
                    handleCreateNewFromModal={handleCreateNewFromModal}
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
            </main>

            <Footer />
            <CookieBanner />
        </div>
    );
};
