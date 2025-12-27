import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  FileText,
  MessageSquare,
  Grid,
  Music
} from 'lucide-react';

import { createGeminiService } from './services/geminiService';
import { ExportService } from './services/ExportService';
import { generateMusicActivity } from './core/usecases/generateMusicActivity';
import { generateQuizActivity } from './core/usecases/generateQuizActivity';
import { generateDrackerActivity } from './core/usecases/generateDrackerActivity';
import { useAudioNarration } from './hooks/useAudioNarration';

// Components
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { ActivityArea } from './components/ActivityArea';
import { QuizEditorModal } from './components/QuizEditorModal';
import { DrackerEditorModal } from './components/DrackerEditorModal';
import { VoiceSettingsModal } from './components/VoiceSettingsModal';
import { MusicEditorModal } from './components/MusicEditorModal';
import { CrosswordListEditor } from './components/CrosswordListEditor'; // Integrated
import { TabsBar } from './components/TabsBar';
import { TabSelectionModal } from './components/TabSelectionModal';
import { ImportDialog } from './components/ImportDialog';
import WordsearchWizard from './components/WordsearchWizard';

export default function App() {
  // --- STATE MANAGEMENT ---
  const [apiKey, setApiKey] = useState(() => {
    return localStorage.getItem('gemini_api_key') || '';
  });
  const [apiKeyStatus, setApiKeyStatus] = useState('empty'); // empty, validating, valid, invalid
  const [showSettings, setShowSettings] = useState(() => {
    return !localStorage.getItem('gemini_api_key');
  });

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

  // Content Generation State
  const [generatedContent, setGeneratedContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [systemStatus, setSystemStatus] = useState(null); // { type: 'retry' | 'rate-limit' | 'fallback', message: '', details: {} }

  // TABS & SYSTEM STATE
  const [tabs, setTabs] = useState([]);
  const [activeTabId, setActiveTabId] = useState(null);

  // Tab Selection Modal State
  const [tabSelectionModal, setTabSelectionModal] = useState({
    isOpen: false,
    tabs: [],
    type: ''
  });

  // Import Merge Dialog State
  const [importDialog, setImportDialog] = useState({
    isOpen: false,
    importedTabs: [],
    importedDate: null,
    importedVersion: null
  });

  // Backup / Restore System
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

  // Helper to add new activity tab
  const addActivityTab = (activityData) => {
    const newTab = {
      id: Date.now().toString(),
      ...activityData
    };
    setTabs(prev => [...prev, newTab]);
    setActiveTabId(newTab.id);
  };

  const closeTab = (id, e) => {
    e.stopPropagation();
    const newTabs = tabs.filter(t => t.id !== id);
    setTabs(newTabs);
    if (activeTabId === id && newTabs.length > 0) {
      setActiveTabId(newTabs[newTabs.length - 1].id);
    } else if (newTabs.length === 0) {
      setActiveTabId(null);
    }
  };

  const activeActivity = useMemo(() => {
    return tabs.find(t => t.id === activeTabId) || null;
  }, [tabs, activeTabId]);

  // Sync active activity state to global editors/viewers and sidebar
  useEffect(() => {
    if (activeActivity) {
      setTopic(activeActivity.title || '');
      // Only sync type if it's one of the known types, to update the sidebar highlight
      if (['quiz', 'wordsearch', 'crossword', 'summary', 'simplify'].includes(activeActivity.type)) {
        // Using the raw state setter to avoid navigation side-effects
        // Note: setActivityType here refers to the useState setter, NOT the handler wrapper (which is defined later)
        // Wait, the handler wrapper is defined CONST after this. setActivityType from useState is in scope.
        // Actually, I need to be careful. The handler wrapper is named `handleActivityTypeChange`. 
        // `setActivityType` IS the useState setter. Correct.
        setActivityType(activeActivity.type);
      }
    }
  }, [activeActivity]);

  useEffect(() => {
    if (!activeActivity || activeActivity.type !== 'wordsearch') return;

    const storedData = activeActivity.wordsearchData || activeActivity.data || {};

    setFoundWords(storedData.words || []);
    setFoundPlacements(storedData.placements || []);
    setWordsearchTitle(storedData.title || activeActivity.title || '');
    setWordsearchHideText(storedData.hideText ?? false);
    setWordsearchHideGrid(storedData.hideGrid ?? false);

    if (storedData.directions) {
      setDirections(storedData.directions);
    }
  }, [activeActivity, setDirections]);

  const [showVoiceSettings, setShowVoiceSettings] = useState(false);

  // Wordsearch State
  const [foundWords, setFoundWords] = useState([]);           // Palavras encontradas no texto gerado
  const [foundPlacements, setFoundPlacements] = useState([]); // Coordenadas exatas do grid
  const [showAnswers, setShowAnswers] = useState(false);
  const [wordsearchTrigger, setWordsearchTrigger] = useState(0);
  const [wordsearchTitle, setWordsearchTitle] = useState('');
  const [directions, setDirections] = useState({ horizontal: true, vertical: true, diagonal: true, reverse: false });
  const [wordsearchHideText, setWordsearchHideText] = useState(false); // Esconder texto
  const [wordsearchHideGrid, setWordsearchHideGrid] = useState(false); // Esconder grid
  const [wordsearchEditData, setWordsearchEditData] = useState(null);

  // Quiz Editor State
  const [showQuizEditor, setShowQuizEditor] = useState(false);
  const [quizEditorData, setQuizEditorData] = useState(null);
  const [currentQuizData, setCurrentQuizData] = useState(null); // Store current structured data for re-editing

  // Dracker Editor State
  const [showDrackerEditor, setShowDrackerEditor] = useState(false);
  const [drackerEditorData, setDrackerEditorData] = useState(null);
  const [currentDrackerData, setCurrentDrackerData] = useState(null);

  // Crossword Editor State (Pre-generation)
  const [showCrosswordEditor, setShowCrosswordEditor] = useState(false);
  const [crosswordEditorData, setCrosswordEditorData] = useState(null);

  // Music Editor State

  const [showMusicEditor, setShowMusicEditor] = useState(false);
  const [musicEditorData, setMusicEditorData] = useState(null);
  const [currentMusicData, setCurrentMusicData] = useState(null);



  // Editor Mode State (New vs Edit)
  const [isEditing, setIsEditing] = useState(false);

  const activityAreaRef = useRef(null);

  const handleTabsReorder = (reorderedTabs) => {
    setTabs(reorderedTabs);
  };

  const getTabLabel = (tab) => {
    let typeLabel = '';
    switch (tab.type) {
      case 'quiz': typeLabel = 'Quiz'; break;
      case 'summary': typeLabel = 'Drácker'; break;
      case 'simplify': typeLabel = 'Música'; break;
      case 'wordsearch': typeLabel = 'Caça-P.'; break;
      default: typeLabel = 'Ativ.';
    }

    const title = tab.title || 'Sem título';
    const shortTitle = title.length > 15 ? title.substring(0, 15) + '...' : title;

    return `${typeLabel}: ${shortTitle}`;
  };



  // --- MEMOIZED OPTIONS ---
  const activityOptions = useMemo(() => [
    { id: 'quiz', label: 'Quiz / Questões', icon: <FileText className="w-4 h-4" /> },
    { id: 'wordsearch', label: 'Caça-Palavras', icon: <Grid className="w-4 h-4" /> },
    { id: 'crossword', label: 'Palavras Cruzadas', icon: <Grid className="w-4 h-4" /> },
    { id: 'summary', label: 'Aprenda com o Drácker', icon: <MessageSquare className="w-4 h-4" /> },
    { id: 'simplify', label: 'Música do Drácker', icon: <Music className="w-4 h-4" /> },
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
  const geminiService = useMemo(() => {
    if (!apiKey) return null;
    return createGeminiService(apiKey, (status) => {
      if (status.type === 'success') {
        setSystemStatus(null);
        return;
      }
      setSystemStatus(status);
      if (status.type === 'error') {
        // Clear status after delay if it's just an info message, but keep errors visible
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
          localStorage.setItem('gemini_api_key', apiKey);
          setShowSettings(false);
        }
      }
    };

    // Debounce validation
    const timer = setTimeout(validate, 800);
    return () => clearTimeout(timer);
  }, [apiKey, geminiService]);

  // --- HANDLERS ---

  const handleApiKeyChange = (e) => {
    setApiKey(e.target.value);
  };

  const clearApiKey = () => {
    setApiKey('');
    localStorage.removeItem('gemini_api_key');
    setApiKeyStatus('empty');
    setShowSettings(true);
  };

  const startWordsearchWizard = (options = {}) => {
    const editingData = options.editingData || null;
    const isEditMode = Boolean(editingData);

    setIsEditing(isEditMode);
    setWordsearchEditData(editingData);

    if (!isEditMode && activeActivity?.type === 'wordsearch') {
      setActiveTabId(null); // Desvincula o caça-palavras atual antes de iniciar um novo fluxo
    }

    setShowAnswers(false);
    setFoundWords(editingData?.words || []);
    setFoundPlacements(editingData?.placements || []);
    setWordsearchHideText(editingData?.hideText ?? false);
    setWordsearchHideGrid(editingData?.hideGrid ?? false);
    setWordsearchTitle(editingData?.title || '');
    setActivityType('wordsearch');
    setWordsearchTrigger(prev => prev + 1);
  };

  const handleGenerate = async () => {
    if (!apiKey) {
      setError('Por favor, insira sua chave API nas configurações.');
      setShowSettings(true);
      return;
    }

    if (!topic && activityType !== 'image_ai') {
      setError('Por favor, digite um tema para a atividade.');
      return;
    }

    if (activityType === 'wordsearch') {
      // Trigger WordsearchWizard
      startWordsearchWizard();
      return;
    }

    setIsLoading(true);
    setError('');
    setGeneratedContent('');
    setSystemStatus(null);
    setFoundWords([]);
    setFoundPlacements([]);

    // Clear Audio
    resetAudioState();
    setIsEditing(false); // Default to new activity generation

    try {
      const levelLabel = difficulty === 'hard' ? 'avançado/difícil' : difficulty === 'easy' ? 'fácil/infantil' : 'médio';

      // Activity-specific generation
      if (activityType === 'quiz') {
        const parsedData = await generateQuizActivity({
          topic,
          lessonDetails,
          difficulty,
          model: selectedModel,
          geminiService
        });

        setQuizEditorData(parsedData);
        setShowQuizEditor(true);
        setCurrentQuizData(parsedData);
        setIsLoading(false);
        return;
      }

      if (activityType === 'simplify') {
        const parsedData = await generateMusicActivity({
          topic,
          lessonDetails,
          model: selectedModel,
          geminiService
        });

        setMusicEditorData(parsedData);
        setShowMusicEditor(true);
        setCurrentMusicData(parsedData);
        setIsLoading(false);
        return;
      }

      if (activityType === 'summary') {
        try {
          const parsedData = await generateDrackerActivity({
            topic,
            lessonDetails,
            difficulty,
            model: selectedModel,
            geminiService
          });

          setDrackerEditorData(parsedData);
          setShowDrackerEditor(true);
          setCurrentDrackerData(parsedData);
        } catch (err) {
          console.error('Erro ao gerar Drácker:', err);
          setError(`Erro ao gerar Drácker: ${err.message}`);
        }

        setIsLoading(false);
        return;
      }

      // Wordsearch handled earlier by trigger; Crossword/image fall through below

      let prompt = '';
      const context = `Contexto/Detalhes: ${lessonDetails || 'Nenhum detalhe adicional.'}`;
      const level = levelLabel;

      switch (activityType) {
        case 'crossword':
          prompt = `Gere um JSON com palavras cruzadas para o tema "${topic}".\n${context}\nNível: ${level}.\nRetorne apenas o JSON com {\n  "title": string,\n  "words": [{ "word": string, "clue": string }]\n}`;
          break;
        default:
          prompt = topic;
      }

      let text = await geminiService.generateText(prompt, {
        model: selectedModel,
        fallbackModel: null,
        maxOutputTokens: 4000,
        temperature: 0.7
      });

      if (!text || !text.trim()) {
        throw new Error('A API retornou uma resposta vazia. Tente novamente em instantes.');
      }

      // PROCESSAMENTO DO QUIZ (JSON -> Markdown Formatado)


      if (activityType === 'crossword') {
        try {
          const firstBrace = text.indexOf('{');
          const lastBrace = text.lastIndexOf('}');
          if (firstBrace === -1 || lastBrace === -1) {
            throw new Error("JSON não encontrado na resposta.");
          }
          const cleanJson = text.substring(firstBrace, lastBrace + 1);
          const parsedData = JSON.parse(cleanJson);

          // Normalização de dados: garante que temos 'clue'
          if (parsedData.words) {
            parsedData.words = parsedData.words.map(w => ({
              ...w,
              clue: w.clue || w.hint || "Sem dica"
            }));
          }

          // Open Editor instead of generating immediately
          setCrosswordEditorData(parsedData);
          setShowCrosswordEditor(true);

          setIsLoading(false);
          return;

        } catch (e) {
          console.error("Erro cruzadinhas:", e);
          setError("Erro ao gerar palavras cruzadas: " + e.message);
          setIsLoading(false);
          return;
        }
      }
      addActivityTab({
        title: topic || "Atividade",
        type: activityType,
        content: text,
        quizData: null,
        drackerData: null,
        musicData: null,
        wordsearchData: null
      });

      // Auto-generate audio if content is reasonable size
      generateAudio(text);

    } catch (err) {
      console.error(err);
      setError(`Erro ao gerar: ${err.message}`);
    } finally {
      if (activityType !== 'quiz') {
        setIsLoading(false);
      }
      setSystemStatus(null);
    }
  };

  const handleCrosswordConfirm = async (editedData) => {
    try {
      const { generateCrossword } = await import('./utils/crosswordGenerator');

      // Generate Layout with edited words
      const layout = generateCrossword(editedData.words, 15);

      if (layout.words.length === 0) {
        // Try larger grid if failed
        const layout2 = generateCrossword(editedData.words, 20);
        if (layout2.words.length === 0) {
          alert("Não foi possível encaixar todas as palavras. Tente remover algumas ou simplificar.");
          return; // Stay in editor
        }
        // Used larger grid
        addActivityTab({
          title: editedData.topic || topic || "Palavras Cruzadas",
          type: 'crossword',
          content: '',
          data: {
            words: layout2.words.map((w, i) => ({ ...w, num: i + 1 })),
            gridSize: 20,
            fillBlanks: false
          }
        });
      } else {
        // Success regular grid
        addActivityTab({
          title: editedData.topic || topic || "Palavras Cruzadas",
          type: 'crossword',
          content: '',
          data: {
            words: layout.words.map((w, i) => ({ ...w, num: i + 1 })),
            gridSize: 15,
            fillBlanks: false
          }
        });
      }

      setShowCrosswordEditor(false);
      setCrosswordEditorData(null);

    } catch (e) {
      console.error("Erro ao gerar grid final:", e);
      alert("Erro ao criar layout: " + e.message);
    }
  };

  const handleQuizConfirm = (editedData) => {
    let text = '';
    const topicTitle = topic; // use current scope topic or maybe we should store it in quizData if needed? 
    // simplified: defaults to current topic state which is fine as modal is modal.

    try {
      let formattedOutput = `${editedData.intro_text || `Aqui está um quiz sobre ${topicTitle}!`}\n\n`;
      let gabaritoOutput = `\n\n### Gabarito\n`;
      const letters = ['a', 'b', 'c', 'd', 'e'];

      editedData.questions.forEach((q, index) => {
        let optionsToDisplay;

        if (q.ordered_options && q.ordered_options.length > 0) {
          // Use the order defined in the editor
          optionsToDisplay = q.ordered_options.slice(0, 5);
        } else {
          // Fallback: Combine and Shuffle
          const options = [q.correct_answer, ...(q.distractors || [])].slice(0, 5);
          optionsToDisplay = options.sort(() => Math.random() - 0.5);
        }

        formattedOutput += `${index + 1}. ${q.statement}\n`;

        optionsToDisplay.forEach((opt, idx) => {
          formattedOutput += `${letters[idx]}) ${opt}\n`;
          if (opt === q.correct_answer) {
            gabaritoOutput += `${index + 1}. ${letters[idx]}) ${opt}\n`;
          }
        });
        formattedOutput += `\n`;
      });

      text = formattedOutput + gabaritoOutput;


      if (isEditing) {
        // Update Tab Content
        setTabs(prev => prev.map(t => {
          if (t.id === activeTabId) {
            return { ...t, content: text, quizData: editedData };
          }
          return t;
        }));
      } else {
        // Create New Tab
        addActivityTab({
          title: topic || "Quiz",
          type: 'quiz',
          content: text, // This is the formatted text
          quizData: editedData
        });
      }

      generateAudio(text); // Auto audio
    } catch (e) {
      console.error("Error formatting quiz", e);
      setError("Erro ao formatar quiz editado.");
    }
    setShowQuizEditor(false);
    setIsLoading(false);
  };

  const handleEditQuiz = () => {
    if (activeActivity && activeActivity.quizData) {
      setIsEditing(true);
      setQuizEditorData(activeActivity.quizData);
      setShowQuizEditor(true);
    }
  };

  const handleDrackerConfirm = (editedData) => {
    try {
      const baseActivities = (editedData.activities || []).map((act) => (act || '').trim()).filter(Boolean);
      const normalizedActivities = baseActivities.slice(0, 5);

      while (normalizedActivities.length < 5) {
        normalizedActivities.push(`**Atividade ${normalizedActivities.length + 1}: ${topic || 'Drácker'}** — Materiais: papel, lápis de cor e tesoura sem ponta. Como fazer: proponha uma exploração simples em grupo e um desenho final.`);
      }

      let formattedOutput = `## Aprenda com o Drácker: ${topic}\n\n`;
      formattedOutput += `${editedData.story}\n\n`;
      formattedOutput += `### 🐉 Atividades Práticas na Floresta\n\n`;

      normalizedActivities.forEach((act, index) => {
        formattedOutput += `${index + 1}. ${act}\n`;
      });

      if (isEditing) {
        setTabs(prev => prev.map(t => {
          if (t.id === activeTabId) {
            return { ...t, content: formattedOutput, drackerData: editedData };
          }
          return t;
        }));
      } else {
        addActivityTab({
          title: topic || "Aprenda com o Drácker",
          type: 'summary',
          content: formattedOutput,
          drackerData: editedData
        });
      }

      generateAudio(editedData.story);
    } catch (e) {
      console.error("Error formatting Dracker activity", e);
      setError("Erro ao formatar atividade Drácker.");
    }
    setShowDrackerEditor(false);
    setIsLoading(false);
  };

  const handleEditDracker = () => {
    if (activeActivity && activeActivity.drackerData) {
      setIsEditing(true);
      setDrackerEditorData(activeActivity.drackerData);
      setShowDrackerEditor(true);
    }
  };

  const handleMusicConfirm = (editedData) => {
    try {
      const letters = ['a', 'b', 'c', 'd', 'e'];
      const normalizedQuestions = (editedData.questions || []).map((q, idx) => {
        const text = typeof q === 'string' ? q : (q.text || q.question || `Pergunta ${idx + 1}`);
        const correct = typeof q === 'object' ? (q.correctAnswer || q.correct_answer || q.answer || q.correct_option || '') : '';
        const distractors = typeof q === 'object' ? (q.distractors || q.incorrect_options || []) : [];
        const provided = typeof q === 'object' ? (q.options || q.ordered_options || []) : [];
        // Respect provided order if valid, else fallback to correct + distractors shuffled
        let options = [];
        if (provided && provided.length > 0) {
          options = provided;
        } else {
          const setArgs = [correct, ...distractors].filter(Boolean);
          options = Array.from(new Set(setArgs));
          // Fisher-Yates Shuffle
          for (let i = options.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [options[i], options[j]] = [options[j], options[i]];
          }
        }
        return { text, correctAnswer: correct, distractors, options, ordered_options: options };
      });

      let formattedOutput = `# 🎵 Música do Drácker: ${topic}\n\n`;

      formattedOutput += `## Lyrics\n${editedData.lyrics}\n\n`;
      if (editedData.style) {
        formattedOutput += `## Style\n${editedData.style}\n\n`;
      }
      formattedOutput += `\n---\n**📝 Perguntas de Interpretação:**\n\n`;

      normalizedQuestions.forEach((q, index) => {
        formattedOutput += `${index + 1}. ${q.text}\n`;
        if (q.options?.length) {
          q.options.slice(0, 5).forEach((opt, optIdx) => {
            formattedOutput += `   ${letters[optIdx] || String.fromCharCode(65 + optIdx)}) ${opt}\n`;
          });
        }
        formattedOutput += `\n`;
      });

      if (isEditing) {
        setTabs(prev => prev.map(t => {
          if (t.id === activeTabId) {
            return { ...t, content: formattedOutput, musicData: { ...editedData, questions: normalizedQuestions } };
          }
          return t;
        }));
      } else {
        addActivityTab({
          title: topic || "Música do Drácker",
          type: 'simplify',
          content: formattedOutput,
          musicData: { ...editedData, questions: normalizedQuestions }
        });
      }

      generateAudio(editedData.lyrics);
    } catch (e) {
      console.error("Error formatting music", e);
      setError("Erro ao formatar música.");
    }
    setShowMusicEditor(false);
    setIsLoading(false);
  };

  const handleEditMusic = () => {
    if (activeActivity && activeActivity.musicData) {
      setIsEditing(true);
      setMusicEditorData(activeActivity.musicData);
      setShowMusicEditor(true);
    }
  };

  const handleEditWordsearch = () => {
    if (!activeActivity || activeActivity.type !== 'wordsearch') return;

    const storedData = activeActivity.wordsearchData || activeActivity.data || {};

    const storyFromContent = () => {
      if (!activeActivity.content) return '';
      const parts = activeActivity.content.split('________________');
      if (parts.length > 1) {
        return parts[1].replace(/[_\n]/g, ' ').trim();
      }
      return '';
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
    startWordsearchWizard({ editingData: editPayload });
  };



  const handleDownloadGeneratedPng = () => {
    // Implementation depends on actual image blob
    if (!imagePng) return;
    const link = document.createElement('a');
    link.href = imagePng;
    link.download = `imagem-${topic}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- WORDSEARCH CALLBACKS ---
  const handleWordsearchComplete = (payload) => {
    const { content, words, placements, title, story, rows, cols, directions: wizDirections } = payload || {};
    const newData = {
      words: words || [],
      placements: placements || [],
      title: title,
      hideText: wordsearchHideText,
      hideGrid: wordsearchHideGrid,
      story,
      rows,
      cols,
      directions: wizDirections
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

    setWordsearchEditData(null);
    setIsLoading(false);
    setSystemStatus(null);
  };

  // --- EXPORT HANDLERS ---
  // Helper to clear system status when error is reported from children
  const handleChildError = (msg) => {
    setError(msg);
    if (msg) setSystemStatus(null);
  };

  const handleCopy = () => {
    if (!activeActivity) return;
    const cleanText = activeActivity.content.replace(/\*\*/g, '').replace(/#/g, '').trim();
    navigator.clipboard.writeText(cleanText).then(() => {
      alert("Copiado!");
    });
  };

  // --- EXPORT HANDLERS ---
  // --- EXPORT HANDLERS ---
  const handleDownloadDoc = async () => {
    try {
      if (!activityAreaRef.current) {
        alert('Não foi possível encontrar a área de atividade para exportar.');
        return;
      }
      const titleToUse = activeActivity?.title || topic || 'Atividade';
      await ExportService.exportToDOCX(activityAreaRef.current, titleToUse);
    } catch (e) {
      console.error("Erro export DOC:", e);
      alert("Erro ao gerar DOC: " + e.message);
    }
  };

  const handleDownloadPdf = async () => {
    try {
      if (!activityAreaRef.current) {
        alert('Não foi possível encontrar a área de atividade para exportar.');
        return;
      }
      const titleToUse = activeActivity?.title || topic || 'Atividade';
      await ExportService.exportToPDF(activityAreaRef.current, titleToUse);
    } catch (e) {
      console.error("Erro export PDF:", e);
      alert("Erro ao gerar PDF: " + e.message);
    }
  };

  // --- PERSISTENCE LOGIC ---



  // Handler for Sidebar Activity switch - switches view to creation mode OR existing tab
  const handleActivityTypeChange = (type) => {
    // 1. Filter existing tabs of this type
    const existingTabs = tabs.filter(t => t.type === type);

    if (existingTabs.length === 1) {
      // Single match -> Switch to it
      setActiveTabId(existingTabs[0].id);
    } else if (existingTabs.length > 1) {
      // Multiple matches -> Show selection modal
      setTabSelectionModal({
        isOpen: true,
        tabs: existingTabs,
        type: type
      });
    } else {
      // No match -> Go to creation mode
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


  return (
    <div className="min-h-screen bg-brown-50 font-sans text-brown-900">
      <Header
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
      />

      <main className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-6">
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

          isLoading={isLoading}
          geminiService={geminiService}
          handleGenerate={handleGenerate}
          systemStatus={systemStatus}
          error={error}

        // openSaveLoad={() => setShowSaveLoad(true)} // Removed
        />

        <div className="lg:col-span-8 flex flex-col gap-4">
          <TabsBar
            tabs={tabs}
            activeTabId={activeTabId}
            onSelect={setActiveTabId}
            onClose={closeTab}
            onReorder={handleTabsReorder}
            getTabLabel={getTabLabel}
          />

          {/* ACTIVE ACTIVITY AREA */}
          <ActivityArea
            generatedContent={activeActivity ? activeActivity.content : ''}
            activityType={activeActivity ? activeActivity.type : activityType}

            // WORDSEARCH PROPS (Read from Tab if available, else state)
            foundWords={activeActivity?.wordsearchData?.words || activeActivity?.data?.words || foundWords}
            foundPlacements={activeActivity?.wordsearchData?.placements || activeActivity?.data?.placements || foundPlacements}
            wordsearchTitle={activeActivity?.wordsearchData?.title || activeActivity?.data?.title || wordsearchTitle}

            // UI State (Still somewhat local unless we move all to tab)
            showAnswers={showAnswers}
            setShowAnswers={setShowAnswers}

            // Actions
            handleCopy={handleCopy}
            handleDownloadDoc={handleDownloadDoc}
            handleDownloadPdf={handleDownloadPdf}
            activityAreaRef={activityAreaRef}

            // Setters (Might need to update tab data instead of local state eventually, but for now updates visual)
            setWordsearchTitle={setWordsearchTitle}
            wordsearchHideText={wordsearchHideText}
            setWordsearchHideText={setWordsearchHideText}
            wordsearchHideGrid={wordsearchHideGrid}
            setWordsearchHideGrid={setWordsearchHideGrid}

            isLoading={isLoading}
            isGeneratingAudio={isGeneratingAudio}

            // EDIT HANDLERS (Context aware)
            onEdit={
              activityType === 'wordsearch' ? handleEditWordsearch :
                activeActivity?.type === 'quiz' ? handleEditQuiz :
                  activeActivity?.type === 'summary' ? handleEditDracker :
                    activeActivity?.type === 'simplify' ? handleEditMusic :
                      activeActivity?.type === 'wordsearch' ? handleEditWordsearch :
                        undefined
            }
            musicData={activeActivity?.musicData || currentMusicData}
            drackerData={activeActivity?.drackerData}
            crosswordData={activeActivity?.data || activeActivity?.crosswordData}
            onCrosswordUpdate={(newData) => {
              setTabs(prev => prev.map(t => {
                if (t.id === activeTabId) {
                  return { ...t, data: newData };
                }
                return t;
              }));
            }}
            quizData={activeActivity?.quizData}
          />
        </div>

        <QuizEditorModal
          isOpen={showQuizEditor}
          onClose={() => setShowQuizEditor(false)}
          onSave={handleQuizConfirm}
          initialData={quizEditorData}
        />

        <DrackerEditorModal
          isOpen={showDrackerEditor}
          onClose={() => setShowDrackerEditor(false)}
          onSave={handleDrackerConfirm}
          initialData={drackerEditorData}
        />

        <TabSelectionModal
          isOpen={tabSelectionModal.isOpen}
          tabs={tabSelectionModal.tabs}
          onSelect={handleTabSelection}
          onCreateNew={handleCreateNewFromModal}
          onClose={() => setTabSelectionModal(prev => ({ ...prev, isOpen: false }))}
        />

        <ImportDialog
          isOpen={importDialog.isOpen}
          importedTabs={importDialog.importedTabs}
          importedDate={importDialog.importedDate}
          importedVersion={importDialog.importedVersion}
          currentTabsCount={tabs.length}
          onMerge={handleMergeImport}
          onReplace={handleReplaceImport}
          onClose={() => setImportDialog({ isOpen: false, importedTabs: [], importedDate: null, importedVersion: null })}
        />






        <VoiceSettingsModal
          isOpen={showVoiceSettings}
          onClose={() => setShowVoiceSettings(false)}
          currentSettings={speechSettings}
          onSave={setSpeechSettings}
        />

        <MusicEditorModal
          isOpen={showMusicEditor}
          onClose={() => setShowMusicEditor(false)}
          onSave={handleMusicConfirm}
          initialData={musicEditorData}
        />

        <WordsearchWizard
          apiKey={apiKey}
          topic={topic}
          lessonDetails={lessonDetails}
          difficulty={difficulty}
          directions={directions}
          setDirections={setDirections}
          onComplete={handleWordsearchComplete}
          onError={handleChildError}
          geminiService={geminiService}
          triggerStart={wordsearchTrigger}
          defaultTitle={topic}
          mode={wordsearchEditData ? 'edit' : 'create'}
          initialData={wordsearchEditData}
        />

        {showCrosswordEditor && crosswordEditorData && (
          <CrosswordListEditor
            initialData={crosswordEditorData}
            topic={topic}
            onConfirm={handleCrosswordConfirm}
            onCancel={() => setShowCrosswordEditor(false)}
          />
        )}


      </main >
    </div >
  );
}

