import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  FileText,
  MessageSquare,
  Grid,
  Music,
  BrainCircuit,
  Play,
  Files
} from 'lucide-react';

import { createGeminiService } from './services/geminiService';
import { ExportService } from './services/ExportService';

import { useAudioNarration } from './hooks/useAudioNarration';
import { safeLocalStorageGet, safeLocalStorageSet, safeLocalStorageRemove } from './utils/storage';
import { useBackupSystem } from './hooks/useBackupSystem';
import { useActivityActions } from './hooks/useActivityActions';

// Components
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { ActivityArea } from './components/ActivityArea';
import { TabsBar } from './components/TabsBar';
import { AppModals } from './components/AppModals';
import { Footer } from './components/Footer';

export default function App() {
  // --- STATE MANAGEMENT ---
  const [apiKey, setApiKey] = useState(() => safeLocalStorageGet('gemini_api_key') || '');
  const [apiKeyStatus, setApiKeyStatus] = useState('empty');
  const [showSettings, setShowSettings] = useState(() => !safeLocalStorageGet('gemini_api_key'));
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);
  const [showAudioRecorder, setShowAudioRecorder] = useState(false);

  // Activity Form State
  const [topic, setTopic] = useState('');
  const [lessonDetails, setLessonDetails] = useState('');
  const [activityType, setActivityType] = useState('quiz');
  const [difficulty, setDifficulty] = useState('medium');

  // Image Generation State
  const [imagePrompt, setImagePrompt] = useState('');
  const [imagePng, setImagePng] = useState('');
  const [imageSize, setImageSize] = useState('1K');
  const [imageStyle, setImageStyle] = useState('infantil-desenho');

  // TABS & SYSTEM STATE
  const [tabs, setTabs] = useState([]);
  const [activeTabId, setActiveTabId] = useState(null);

  // Tab Selection Modal State (Kept here as it bridges Sidebar and Tabs)
  const [tabSelectionModal, setTabSelectionModal] = useState({
    isOpen: false,
    tabs: [],
    type: ''
  });

  // Editor Mode State
  const [isEditing, setIsEditing] = useState(false);

  // Wordsearch View State (For the active activity display)
  const [foundWords, setFoundWords] = useState([]);
  const [foundPlacements, setFoundPlacements] = useState([]);
  const [showAnswers, setShowAnswers] = useState(false);
  const [wordsearchTitle, setWordsearchTitle] = useState('');
  const [directions, setDirections] = useState({ horizontal: true, vertical: true, diagonal: true, reverse: false });
  const [wordsearchHideText, setWordsearchHideText] = useState(false);
  const [wordsearchHideGrid, setWordsearchHideGrid] = useState(false);

  const activityAreaRef = useRef(null);

  // --- MEMOIZED OPTIONS ---
  const activityOptions = useMemo(() => [
    { id: 'quiz', label: 'Quiz / Questões', icon: <FileText className="w-4 h-4" /> },
    { id: 'wordsearch', label: 'Caça-Palavras', icon: <Grid className="w-4 h-4" /> },
    { id: 'crossword', label: 'Palavras Cruzadas', icon: <Grid className="w-4 h-4" /> },
    { id: 'summary', label: 'Aprenda com o Drácker', icon: <MessageSquare className="w-4 h-4" /> },
    { id: 'simplify', label: 'Música do Drácker', icon: <Music className="w-4 h-4" /> },
    { id: 'connect_dots', label: 'Liga Pontos', icon: <BrainCircuit className="w-4 h-4" /> },
    { id: 'video_gallery', label: 'Galeria Drácker', icon: <Play className="w-4 h-4" /> },
    { id: 'merge_pdf', label: 'Unir PDFs', icon: <Files className="w-4 h-4" /> },
  ], []);

  const difficultyOptions = useMemo(() => [
    { id: 'easy', label: 'Leve e Simples' },
    { id: 'medium', label: 'Padrão e Claro' },
    { id: 'hard', label: 'Avançado e Rico' },
  ], []);

  const modelOptions = useMemo(() => [
    { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
  ], []);
  const [selectedModel, setSelectedModel] = useState('gemini-2.5-flash');

  // --- SERVICE INSTANCE ---
  const [systemStatus, setSystemStatus] = useState(null);

  const geminiService = useMemo(() => {
    if (!apiKey) return null;
    return createGeminiService(apiKey, (status) => {
      if (status.type === 'success') {
        setSystemStatus(null);
        return;
      }
      setSystemStatus(status);
      if (status.type === 'error') {
        setTimeout(() => setSystemStatus(null), 5000);
      }
    });
  }, [apiKey]);

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
    resetAudioState
  } = useAudioNarration(geminiService);

  // --- API VALIDATION ---
  useEffect(() => {
    if (!apiKey) {
      setApiKeyStatus('empty');
      return;
    }
    if (apiKey.length < 10) {
      setApiKeyStatus('invalid');
      return;
    }
    const validate = async () => {
      setApiKeyStatus('validating');
      if (geminiService) {
        const isValid = await geminiService.validateApiKey();
        setApiKeyStatus(isValid ? 'valid' : 'invalid');
        if (isValid) {
          safeLocalStorageSet('gemini_api_key', apiKey);
          setShowSettings(false);
        }
      }
    };
    const timer = setTimeout(validate, 800);
    return () => clearTimeout(timer);
  }, [apiKey, geminiService]);

  // --- HANDLERS & HOOKS ---
  const handleApiKeyChange = (e) => setApiKey(e.target.value);
  const clearApiKey = () => {
    setApiKey('');
    safeLocalStorageRemove('gemini_api_key');
    setApiKeyStatus('empty');
    setShowSettings(true);
  };

  const addActivityTab = (activityData) => {
    const newTab = { id: Date.now().toString(), ...activityData };
    setTabs(prev => [...prev, newTab]);
    setActiveTabId(newTab.id);
  };

  const actions = useActivityActions({
    apiKey,
    topic,
    lessonDetails,
    difficulty,
    activityType,
    setActivityType,
    selectedModel,
    geminiService,
    addActivityTab,
    setTabs,
    setIsEditing,
    isEditing,
    activeTabId,
    generateAudio,
    setShowSettings,
  });

  const {
    importDialog,
    exportSystemState,
    importSystemState,
    handleMergeImport,
    handleReplaceImport,
    closeImportDialog
  } = useBackupSystem(tabs, setTabs, setActiveTabId);


  const closeTab = (id, e) => {
    e.stopPropagation();
    const newTabs = tabs.filter(t => t.id !== id);
    setTabs(newTabs);
    if (activeTabId === id && newTabs.length > 0) setActiveTabId(newTabs[newTabs.length - 1].id);
    else if (newTabs.length === 0) setActiveTabId(null);
  };

  const handleTabsReorder = (reorderedTabs) => setTabs(reorderedTabs);

  const activeActivity = useMemo(() => tabs.find(t => t.id === activeTabId) || null, [tabs, activeTabId]);

  // Sync active activity state
  useEffect(() => {
    if (activeActivity) {
      setTopic(activeActivity.title || '');
      if (['quiz', 'wordsearch', 'crossword', 'summary', 'simplify', 'connect_dots', 'video_gallery'].includes(activeActivity.type)) {
        setActivityType(activeActivity.type);
      }

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
  }, [activeActivity]);

  // Audio Sync
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
    } else if (activeActivity.type === 'simplify' && activeActivity.musicData?.lyrics) {
      // Optional: Read lyrics ? Usually content contains formatted lyrics.
    }

    if (textToRead) generateAudio(textToRead);
  }, [activeActivity?.id]);

  // Handlers for Activity Switching
  const handleActivityTypeChange = (type) => {
    const existingTabs = tabs.filter(t => t.type === type);
    if (existingTabs.length === 1) setActiveTabId(existingTabs[0].id);
    else if (existingTabs.length > 1) {
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

  // Edit Handlers (Triggers the modals via the hook actions)
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

  // Wordsearch Complete Handler
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

  // Export
  const handleDownloadDoc = async () => {
    if (!activityAreaRef.current) return alert('Área de atividade não encontrada.');
    try {
      await ExportService.exportToDOCX(activityAreaRef.current, activeActivity?.title || topic || 'Atividade');
    } catch (e) { alert("Erro ao gerar DOC: " + e.message); }
  };
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
  const handleCopy = () => {
    if (!activeActivity) return;
    const cleanText = activeActivity.content.replace(/\*\*/g, '').replace(/#/g, '').trim();
    navigator.clipboard.writeText(cleanText).then(() => alert("Copiado!"));
  };

  const getTabLabel = (tab) => {
    const labels = { quiz: 'Quiz', summary: 'Drácker', simplify: 'Música', wordsearch: 'Caça-P.', connect_dots: 'Pontos', video_gallery: 'Vídeos', crossword: 'Cruzadas' };
    const title = tab.title || 'Sem título';
    return `${labels[tab.type] || 'Ativ.'}: ${title.substring(0, 15) + (title.length > 15 ? '...' : '')}`;
  };

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
            systemStatus={systemStatus || actions.systemStatus}
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
            handleCopy={handleCopy}
            handleDownloadDoc={handleDownloadDoc}
            handleDownloadPdf={handleDownloadPdf}
            activityAreaRef={activityAreaRef}
            // View Seters
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
    </div >
  );
}
