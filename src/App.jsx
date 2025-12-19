import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Brain,
  FileText,
  MessageSquare,
  Image as ImageIcon,
  Grid,
  Music
} from 'lucide-react';

import { createGeminiService } from './services/geminiService';
import { ExportService } from './services/ExportService';
import { normalizeForGrid } from './utils/wordsearchGenerator';

// Components
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { ActivityArea } from './components/ActivityArea';
import { QuizEditorModal } from './components/QuizEditorModal';
import { DrackerEditorModal } from './components/DrackerEditorModal';
import { VoiceSettingsModal } from './components/VoiceSettingsModal';
import { SaveLoadModal } from './components/SaveLoadModal';
import { MusicEditorModal } from './components/MusicEditorModal';
import { CrosswordListEditor } from './components/CrosswordListEditor'; // Integrated
import { CSS } from '@dnd-kit/utilities';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, horizontalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import RichTextRenderer from './components/RichTextRenderer';

const SortableTab = ({ tab, activeTabId, setActiveTabId, closeTab, getTabLabel }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: tab.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => setActiveTabId(tab.id)}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer whitespace-nowrap transition-colors border select-none ${activeTabId === tab.id ? 'bg-amber-100 border-amber-300 text-amber-700 font-bold' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}
    >
      <span className="text-sm max-w-[120px] truncate" title={tab.title}>
        {getTabLabel(tab)}
      </span>
      <button
        onClick={(e) => closeTab(tab.id, e)}
        className="text-slate-400 hover:text-red-500 transition-colors"
      >
        ×
      </button>
    </div>
  );
};

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

  // Backup / Restore System
  const exportSystemState = () => {
    const state = {
      date: new Date().toISOString(),
      tabs: tabs
    };
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup_atividades_${new Date().toLocaleDateString().replace(/\//g, '-')}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const importSystemState = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const state = JSON.parse(event.target.result);
        if (state.tabs && Array.isArray(state.tabs)) {
          setTabs(state.tabs);
          if (state.tabs.length > 0) {
            setActiveTabId(state.tabs[0].id);
          }
          alert('Sistema restaurado com sucesso!');
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

  // Sync active activity state to global editors/viewers
  useEffect(() => {
    if (activeActivity) {
      // Sync local states if necessary for editing
      // However, ideally editors should open with activeActivity data
      // For simplicity, we just ensure ActivityArea receives activeActivity props
    }
  }, [activeActivity]);

  // Audio State
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const audioRef = useRef(null);
  const [speechChunks, setSpeechChunks] = useState([]);
  const [chunkIndex, setChunkIndex] = useState(0);
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);
  const [speechSettings, setSpeechSettings] = useState({
    voiceURI: '',
    rate: 1.1,
    pitch: 1.0
  });

  // Wordsearch State
  const [foundWords, setFoundWords] = useState([]);           // Palavras encontradas no texto gerado
  const [foundPlacements, setFoundPlacements] = useState([]); // Coordenadas exatas do grid
  const [showAnswers, setShowAnswers] = useState(false);
  const [wordsearchTrigger, setWordsearchTrigger] = useState(0);
  const [wordsearchTitle, setWordsearchTitle] = useState('');
  const [directions, setDirections] = useState({ horizontal: true, vertical: true, diagonal: true, reverse: false });
  const [wordsearchHideText, setWordsearchHideText] = useState(false); // Esconder texto
  const [wordsearchHideGrid, setWordsearchHideGrid] = useState(false); // Esconder grid

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

  // DND SENSORS
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const handleTabDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      setTabs((items) => {
        const oldIndex = items.findIndex(t => t.id === active.id);
        const newIndex = items.findIndex(t => t.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
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
    { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash (Recomendado)' },
    { id: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
    { id: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash' },
    { id: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' },
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
      setWordsearchTrigger(prev => prev + 1);
      return;
    }

    setIsLoading(true);
    setError('');
    setGeneratedContent('');
    setSystemStatus(null);
    setFoundWords([]);
    setFoundPlacements([]);

    // Clear Audio
    setAudioUrl(null);
    setSpeechChunks([]);
    setChunkIndex(0);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsSpeaking(false);
    setIsPaused(false);
    setIsEditing(false); // Default to new activity generation

    try {
      let prompt = '';
      const context = `Contexto/Detalhes: ${lessonDetails || 'Nenhum detalhe adicional.'}`;
      const level = difficulty === 'hard' ? 'avançado/difícil' : difficulty === 'easy' ? 'fácil/infantil' : 'médio';

      switch (activityType) {
        case 'quiz':
          prompt = `Crie uma atividade de Quiz sobre "${topic}".
          
ESTRUTURA OBRIGATÓRIA:
1. Pequeno texto explicativo introdutório sobre o tema (para ajudar a responder).
2. 10 Questões de múltipla escolha exatamente nesta distribuição:
   - 4 Questsões Fáceis
   - 4 Questões Médias
   - 2 Questões Difíceis
3. Gabarito no final.

REGRAS DE OURO:
- As respostas corretas DEVEM ser distribuídas aleatoriamente (não concentre na letra B ou C).
- Variedade: Garanta que tenhamos gabaritos A, B, C, D e E.

FORMATAÇÃO:
- Use "1. Enunciado" para as perguntas.
- Use "a) Alternativa" para as respostas.
- Não use blocos de código.`;
          break;
        case 'crossword':
          prompt = `Crie uma lista de palavras e dicas para um jogo de Palavras Cruzadas sobre o tema "${topic}".
              
              Nível: ${level}.
              Contexto: ${context}.

              RETORNE APENAS UM JSON VÁLIDO com a seguinte estrutura:
              {
                "words": [
                   { "word": "PALAVRA1", "clue": "Dica da palavra 1..." },
                   { "word": "PALAVRA2", "clue": "Dica da palavra 2..." }
                ]
              }

              REQUISITOS:
              - Gere entre 10 e 15 palavras relacionadas ao tema.
              - As palavras devem estar em formato string simples (sem acentos preferencialmente, mas o sistema normaliza).
              - As dicas devem ser claras e adequadas ao nível solicitado.
              - RETORNE APENAS O JSON.`;
          break;
        case 'summary':
          prompt = `Crie uma história educativa sobre "${topic}" com o personagem Drácker.
          
          CONTEXTO:
          Drácker é um dragãozinho camarada que mora numa floresta encantada. Ele está aprendendo sobre o tema "${topic}" junto com seus amigos da floresta.
          
          Nível: ${level}. ${context}.

          RETORNE APENAS UM JSON VÁLIDO com a seguinte estrutura:
          {
            "story": "Texto da história onde Drácker aprende sobre o tema...",
            "activities": [
              "Atividade prática 1 relacionada ao tema...",
              "Atividade prática 2...",
              "Atividade prática 3...",
              "Atividade prática 4...",
              "Atividade prática 5..."
            ]
          }
          
          REQUISITOS:
          - A história deve ser lúdica e envolvente.
          - Liste EXATAMENTE 5 atividades práticas que as crianças possam fazer para reforçar o aprendizado.
          - Retorne APENAS o JSON.`;
          break;
        case 'simplify':
          prompt = `Crie a letra de uma música infantil sobre "${topic}" com o personagem Drácker (um dragãozinho camarada da floresta encantada).
          
          ESTILO: Balão Mágico / Música Infantil Anos 80 / Pop Feliz.
          NÍVEL: ${level}.
          CONTEXTO: ${context}.

          RETORNE APENAS UM JSON VÁLIDO com a seguinte estrutura:
          {
            "lyrics": "[Instrumental Intro]\\n[Verse 1]\\n(Letra sobre o Drácker aprendendo sobre ${topic})...",
            "questions": [
               "Pergunta de interpretação 1 sobre a música/tema?",
               "Pergunta 2?",
               "Pergunta 3?",
               "Pergunta 4?"
            ]
          }

          REQUISITOS:
          - A letra deve mencionar o Drácker e a floresta encantada.
          - Estrutura clara: [Verse 1], [Chorus], [Verse 2], [Chorus], [Bridge], [Outro].
          - Letra rimada e rítmica.
          - Crie 4 perguntas de interpretação de texto baseadas na letra criada.
          - Retorne APENAS o JSON.`;
          break;
          prompt = `Crie uma atividade educativa sobre "${topic}".`;
      }


      // Se for QUIZ ou DRACKER (Summary), pedimos JSON para processamento local
      if (activityType === 'quiz') {
        prompt = `Crie uma atividade de Quiz sobre "${topic}".
           
           Nível: ${difficulty === 'hard' ? 'Difícil' : difficulty === 'easy' ? 'Fácil/Infantil' : 'Médio'}.
           Detalhes: ${lessonDetails || 'Sem detalhes'}.

           RETORNE APENAS UM JSON VÁLIDO (sem markdown de código) com a seguinte estrutura:
           {
             "intro_text": "Texto explicativo curto e amigável sobre o tema...",
             "questions": [
               {
                 "statement": "Enunciado da questão...",
                 "correct_answer": "Resposta Certa",
                 "distractors": ["Errada 1", "Errada 2", "Errada 3", "Errada 4"]
               }
             ]
           }
           
           REQUISITOS:
           - 5 Questões no total (2 Fáceis, 2 Médias, 1 Difícil - misturadas).
           - O texto introdutório deve ajudar a criança a entender o tema.
           - Retorne APENAS o JSON puro. SEM MARKDOWN. SEM TEXTO ANTES OU DEPOIS.`;
      }

      let text = await geminiService.generateText(prompt, {
        model: selectedModel,
        fallbackModel: selectedModel === 'gemini-1.5-pro' ? 'gemini-2.0-flash' : 'gemini-1.5-flash',
        // Aumentamos o limite de tokens para garantir JSON completo
        maxOutputTokens: 4000
      });

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


      if (activityType === 'quiz' || activityType === 'summary' || activityType === 'simplify') {
        try {
          // Limpeza e Extração de JSON (Busca o primeiro { e o último })
          const firstBrace = text.indexOf('{');
          const lastBrace = text.lastIndexOf('}');

          if (firstBrace === -1 || lastBrace === -1) {
            throw new Error("JSON structure not found in response");
          }

          const cleanJson = text.substring(firstBrace, lastBrace + 1);
          const parsedData = JSON.parse(cleanJson);

          if (activityType === 'quiz') {
            setQuizEditorData(parsedData);
            setShowQuizEditor(true);
            // Store tentative data to add tab later if confirmed? 
            // Actually we open editor first. On confirm we add tab.
            // We need to pass a callback to editor to "create new tab" instead of update current.
            // Let's modify handleQuizConfirm to create tab if activeTab doesn't exist?
            // The flow is: Generate -> Editor -> Confirm -> Tab Created.
            // So here we DO NOT create tab yet.
            setCurrentQuizData(parsedData); // Temporary storage
          } else if (activityType === 'summary') {
            setDrackerEditorData(parsedData);
            setShowDrackerEditor(true);
            setCurrentDrackerData(parsedData);
          } else if (activityType === 'simplify') {
            setMusicEditorData(parsedData);
            setShowMusicEditor(true);
            setCurrentMusicData(parsedData);
          }

          // We return here to wait for user interaction in Modal
          setIsLoading(false);
          return;

        } catch (e) {
          console.error("Erro ao processar JSON:", e);
          // Fallback: se falhar o parse, usa o texto original da IA
          text = `(Nota: O formato gerado diferiu do esperado, exibindo original)\n\n${text}`;
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
      let formattedOutput = `## Aprenda com o Drácker: ${topic}\n\n`;
      formattedOutput += `${editedData.story}\n\n`;
      formattedOutput += `### 🐉 Atividades Práticas na Floresta\n\n`;

      editedData.activities.forEach((act, index) => {
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
      let formattedOutput = `# 🎵 Música do Drácker: ${topic}\n\n`;

      formattedOutput += `${editedData.lyrics}\n\n`;
      formattedOutput += `\n---\n**📝 Perguntas de Interpretação:**\n\n`;

      editedData.questions.forEach((q, index) => {
        formattedOutput += `${index + 1}. ${q}\n`;
      });

      if (isEditing) {
        setTabs(prev => prev.map(t => {
          if (t.id === activeTabId) {
            return { ...t, content: formattedOutput, musicData: editedData };
          }
          return t;
        }));
      } else {
        addActivityTab({
          title: topic || "Música do Drácker",
          type: 'simplify',
          content: formattedOutput,
          musicData: editedData
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

  // --- AUDIO LOGIC ---
  const generateAudio = async (text) => {
    if (!text || !geminiService) return;
    setIsGeneratingAudio(true);

    // Clean text
    // Clean text
    const clean = geminiService.cleanTextForSpeech(text);
    const chunks = geminiService.sliceIntoChunks(clean, 300); // 300 chars limit per chunk
    setSpeechChunks(chunks);
    setChunkIndex(0);

    setIsGeneratingAudio(false);
    // We don't pre-generate all audio to save API calls, we stream first chunk when Play is clicked?
    // Or we can try to pre-buffer. For now, we set chunks.
  };

  const playChunk = (index) => {
    if (index < 0 || index >= speechChunks.length) return;

    // Use Browser Native TTS
    const chunkText = speechChunks[index];

    // Stop any current
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(chunkText);
    utterance.lang = 'pt-BR';

    // Voice Selection from State or Default
    if (speechSettings && speechSettings.voiceURI) {
      const voices = window.speechSynthesis.getVoices();
      const selected = voices.find(v => v.voiceURI === speechSettings.voiceURI);
      if (selected) utterance.voice = selected;
    } else {
      // Fallback default logic
      const voices = window.speechSynthesis.getVoices();
      const brVoices = voices.filter(v => v.lang.includes('pt-BR') || v.lang.includes('pt_BR'));
      const preferredVoice = brVoices.find(v =>
        v.name.includes('Google') ||
        v.name.includes('Francisca') ||
        v.name.includes('Luciana') ||
        v.name.toLowerCase().includes('female')
      ) || brVoices[0];
      if (preferredVoice) utterance.voice = preferredVoice;
    }

    utterance.rate = speechSettings ? speechSettings.rate : 1.0;
    utterance.pitch = speechSettings ? speechSettings.pitch : 1.2;

    utterance.onstart = () => {
      setIsSpeaking(true);
      setIsPaused(false);
      setIsGeneratingAudio(false);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      // Auto-play next logic
      if (index < speechChunks.length - 1) {
        setChunkIndex(index + 1);
        playChunk(index + 1); // Recursive next
      }
    };

    utterance.onerror = (e) => {
      console.error("Browser TTS Error", e);
      setIsGeneratingAudio(false);
      setIsSpeaking(false);
    };

    window.speechSynthesis.speak(utterance);
    // Store utterance reference if needed for detailed control, but cancelling window.speechSynthesis usually enough
  };

  const handleSpeak = () => {
    if (isSpeaking && !isPaused) {
      window.speechSynthesis.pause();
      setIsPaused(true);
    } else if (isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
    } else {
      // Start playing current chunk
      playChunk(chunkIndex);
    }
  };

  const speakNext = () => {
    if (chunkIndex < speechChunks.length - 1) {
      setChunkIndex(prev => prev + 1);
      setIsSpeaking(false); // Stop current
      setTimeout(() => playChunk(chunkIndex + 1), 100);
    }
  };

  const speakPrev = () => {
    if (chunkIndex > 0) {
      setChunkIndex(prev => prev - 1);
      setIsSpeaking(false);
      setTimeout(() => playChunk(chunkIndex - 1), 100);
    }
  };

  // --- WORDSEARCH CALLBACKS ---
  const handleWordsearchComplete = (content, words, placements, title) => {
    addActivityTab({
      title: title || topic || "Caça-Palavras",
      type: 'wordsearch',
      content: content,
      wordsearchData: {
        words: words,
        placements: placements,
        title: title,
        hideText: false,
        hideGrid: false
      }
    });
    // setGeneratedContent(content); // REMOVED
    // setFoundWords(words); // MOVED TO TAB DATA
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

  const handleDownloadDoc = () => {
    ExportService.exportToDOCX(activityAreaRef.current, wordsearchTitle || topic || 'Atividade');
  };

  const handleDownloadPdf = () => {
    ExportService.exportToPDF(activityAreaRef.current, wordsearchTitle || topic || 'Atividade');
  };

  // --- PERSISTENCE LOGIC ---



  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-900">
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
          setActivityType={setActivityType}
          imagePrompt={imagePrompt}
          setImagePrompt={setImagePrompt}
          imageStyle={imageStyle}
          setImageStyle={setImageStyle}
          imageSize={imageSize}
          setImageSize={setImageSize}

          isLoading={isLoading}
          geminiService={geminiService}
          directions={directions}
          setDirections={setDirections}
          handleWordsearchComplete={handleWordsearchComplete}
          setError={handleChildError}
          wordsearchTrigger={wordsearchTrigger}
          handleGenerate={handleGenerate}
          systemStatus={systemStatus}
          error={error}

        // openSaveLoad={() => setShowSaveLoad(true)} // Removed
        />

        <div className="lg:col-span-8 flex flex-col gap-4">
          {/* TABS HEADER */}
          <div className="flex flex-col gap-2 bg-white p-2 rounded-lg shadow-sm border border-slate-200">
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleTabDragEnd}>
              <SortableContext items={tabs.map(t => t.id)} strategy={horizontalListSortingStrategy}>
                <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                  {tabs.map(tab => (
                    <SortableTab
                      key={tab.id}
                      tab={tab}
                      activeTabId={activeTabId}
                      setActiveTabId={setActiveTabId}
                      closeTab={closeTab}
                      getTabLabel={getTabLabel}
                    />
                  ))}
                  {tabs.length === 0 && <span className="text-sm text-slate-400 italic px-4 py-2">Nenhuma atividade gerada ainda...</span>}
                </div>
              </SortableContext>
            </DndContext>
          </div>

          {/* ACTIVE ACTIVITY AREA */}
          <ActivityArea
            generatedContent={activeActivity ? activeActivity.content : ''}
            activityType={activeActivity ? activeActivity.type : activityType}

            // WORDSEARCH PROPS (Read from Tab if available, else state)
            foundWords={activeActivity?.wordsearchData?.words || foundWords}
            foundPlacements={activeActivity?.wordsearchData?.placements || foundPlacements}
            wordsearchTitle={activeActivity?.wordsearchData?.title || wordsearchTitle}

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
              activeActivity?.type === 'quiz' ? handleEditQuiz :
                activeActivity?.type === 'summary' ? handleEditDracker :
                  activeActivity?.type === 'simplify' ? handleEditMusic :
                    undefined
            }
            musicData={activeActivity?.musicData}
            drackerData={activeActivity?.drackerData}
            crosswordData={activeActivity?.data}
            onCrosswordUpdate={(newData) => {
              setTabs(prev => prev.map(t => {
                if (t.id === activeTabId) {
                  return { ...t, data: newData };
                }
                return t;
              }));
            }}
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
