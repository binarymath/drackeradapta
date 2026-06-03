import { useState } from 'react';
import { generateMusicActivity } from '../core/usecases/generateMusicActivity';
import { generateQuizActivity } from '../core/usecases/generateQuizActivity';
import { generateDrackerActivity } from '../core/usecases/generateDrackerActivity';

import { useActivity } from '../contexts/ActivityContext';
import { useGemini } from '../contexts/GeminiContext';
import { useAudio } from '../contexts/AudioContext';

export const useActivityActions = () => {
    const {
        topic,
        lessonDetails,
        difficulty,
        activityType,
        setActivityType,
        addActivityTab,
        setTabs,
        activeTabId,
        isEditing,
        setIsEditing,
    } = useActivity();

    const {
        apiKey,
        geminiService,
        selectedModel,
        setShowSettings,
        setSystemStatus,
    } = useGemini();

    const { generateAudio } = useAudio();

    // Loading & Error States
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // Quiz config
    const [questionCount, setQuestionCountRaw] = useState(10);
    const setQuestionCount = (v) => setQuestionCountRaw(Math.min(20, Math.max(5, Number(v) || 10)));
    const [difficultyDist, setDifficultyDist] = useState({ easy: 40, medium: 40, hard: 20 });

    // Editor States
    const [showQuizEditor, setShowQuizEditor] = useState(false);
    const [quizEditorData, setQuizEditorData] = useState(null);

    const [showDrackerEditor, setShowDrackerEditor] = useState(false);
    const [drackerEditorData, setDrackerEditorData] = useState(null);

    const [showMusicEditor, setShowMusicEditor] = useState(false);
    const [musicEditorData, setMusicEditorData] = useState(null);

    const [showConnectDotsEditor, setShowConnectDotsEditor] = useState(false);
    const [connectDotsEditorData, setConnectDotsEditorData] = useState(null);

    const [showCrosswordEditor, setShowCrosswordEditor] = useState(false);
    const [crosswordEditorData, setCrosswordEditorData] = useState(null);

    const [showDominoEditor, setShowDominoEditor] = useState(false);
    const [dominoEditorData, setDominoEditorData] = useState(null);

    // Wordsearch states
    const [wordsearchTrigger, setWordsearchTrigger] = useState(0);
    const [wordsearchEditData, setWordsearchEditData] = useState(null);

    const startWordsearchWizard = (options = {}) => {
        const editingData = options.editingData || null;
        const isEditMode = Boolean(editingData);

        setIsEditing(isEditMode);
        setWordsearchEditData(editingData);
        setActivityType('wordsearch');
        setWordsearchTrigger(prev => prev + 1);
    };

    const handleGenerate = async () => {
        if (!apiKey) {
            setError('Por favor, insira sua chave API nas configurações.');
            setShowSettings(true);
            return;
        }

        if (!topic && activityType !== 'image_ai' && activityType !== 'video_gallery' && activityType !== 'hangman') {
            setError('Por favor, digite um tema para a atividade.');
            return;
        }

        if (activityType === 'wordsearch') {
            startWordsearchWizard();
            return;
        }

        if (activityType === 'crossword') {
            setCrosswordEditorData({ words: [], topic: topic });
            setShowCrosswordEditor(true);
            return;
        }

        if (activityType === 'domino') {
            setDominoEditorData({ pairs: [], topic: topic, lessonDetails: lessonDetails, isCircular: false });
            setShowDominoEditor(true);
            return;
        }

        if (activityType === 'video_gallery') {
            addActivityTab({
                title: "Galeria Drácker",
                type: 'video_gallery',
                content: 'Galeria de Vídeos',
                data: {}
            });
            return;
        }

        if (activityType === 'hangman') {
            addActivityTab({
                title: topic ? `Forca: ${topic}` : "Jogo da Forca",
                type: 'hangman',
                content: 'Jogo da Forca',
                data: {}
            });
            return;
        }

        setIsLoading(true);
        setError('');
        setSystemStatus(null);
        setIsEditing(false);

        try {
            if (activityType === 'quiz') {
                const parsedData = await generateQuizActivity({
                    topic,
                    lessonDetails,
                    difficulty,
                    model: selectedModel,
                    geminiService,
                    questionCount,
                    difficultyDist
                });
                setQuizEditorData(parsedData);
                setShowQuizEditor(true);
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
                setIsLoading(false);
                return;
            }

            if (activityType === 'summary') {
                const parsedData = await generateDrackerActivity({
                    topic,
                    lessonDetails,
                    difficulty,
                    model: selectedModel,
                    geminiService
                });
                setDrackerEditorData(parsedData);
                setShowDrackerEditor(true);
                setIsLoading(false);
                return;
            }

            if (activityType === 'memory') {
                addActivityTab({
                    title: topic || "Jogo da Memória",
                    type: 'memory',
                    content: 'Jogo da Memória',
                    data: { openModal: true, topic, lessonDetails }
                });
                setIsLoading(false);
                return;
            }

            if (activityType === 'connect_dots') {
                const data = await geminiService.generateConnectDots(topic, lessonDetails);
                addActivityTab({
                    title: topic || "Liga Pontos",
                    type: 'connect_dots',
                    content: `Atividade de Ligar Pontos sobre ${topic}`,
                    data: data
                });
                generateAudio(`Atividade de ligar pontos sobre ${topic}. Relacione a coluna da esquerda com a direita.`);
                setIsLoading(false);
                return;
            }

            if (activityType === 'rpg') {
                const data = await geminiService.generateRPGAdventure(topic, lessonDetails);
                addActivityTab({
                    title: data.title || topic,
                    type: 'rpg',
                    content: data.intro || `Aventura RPG sobre ${topic}`,
                    data: data
                });
                generateAudio(data.intro);
                setIsLoading(false);
                return;
            }

            const levelLabel = difficulty === 'hard' ? 'Ensino Médio (linguagem avançada, conceitos aprofundados)' : difficulty === 'easy' ? 'Anos Iniciais do Ensino Fundamental (linguagem lúdica, infantil e super fácil)' : 'Anos Finais do Ensino Fundamental (linguagem padrão, conceitos intermediários)';
            const context = `Contexto/Detalhes: ${lessonDetails || 'Nenhum detalhe adicional.'}`;

            let prompt = `${topic}. ${context}`;

            let text = await geminiService.generateText(prompt, {
                model: selectedModel,
                maxOutputTokens: 4000,
                temperature: 0.7
            });

            if (!text || !text.trim()) {
                throw new Error('A API retornou uma resposta vazia.');
            }

            addActivityTab({
                title: topic || "Atividade",
                type: activityType,
                content: text,
            });
            generateAudio(text);

        } catch (err) {
            console.error(err);
            setError(`Erro ao gerar: ${err.message}`);
        } finally {
            setIsLoading(false);
            setSystemStatus(null);
        }
    };

    // --- Confirm Handlers ---

    const handleQuizConfirm = (editedData) => {
        let text = '';
        const topicTitle = topic;

        try {
            let formattedOutput = `${editedData.intro_text || `Aqui está um quiz sobre ${topicTitle}!`}\n\n`;
            let gabaritoOutput = `\n\n### Gabarito\n`;
            const letters = ['a', 'b', 'c', 'd', 'e'];

            editedData.questions.forEach((q, index) => {
                let optionsToDisplay;
                if (q.ordered_options && q.ordered_options.length > 0) {
                    optionsToDisplay = q.ordered_options.slice(0, 5);
                } else {
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
                setTabs(prev => prev.map(t => {
                    if (t.id === activeTabId) {
                        return { ...t, content: text, quizData: editedData };
                    }
                    return t;
                }));
            } else {
                addActivityTab({
                    title: topic || "Quiz",
                    type: 'quiz',
                    content: text,
                    quizData: editedData
                });
            }
            generateAudio(text);
        } catch (e) {
            console.error("Error formatting quiz", e);
            setError("Erro ao formatar quiz editado.");
        }
        setShowQuizEditor(false);
    };

    const handleDrackerConfirm = (data) => {
        const newDrackerData = {
            story: data.story,
            activities: data.activities
        };

        let formattedOutput = `## Aprenda com o Drácker: ${topic}\n\n`;
        formattedOutput += `${newDrackerData.story}\n\n`;
        formattedOutput += `### 🐉 Atividades Práticas na Floresta\n\n`;

        newDrackerData.activities.forEach((act, index) => {
            formattedOutput += `${index + 1}. ${act.title}\n`;
            if (act.materials) formattedOutput += `   Materiais: ${act.materials}\n`;
            if (act.steps) formattedOutput += `   Como fazer: ${act.steps}\n`;
            formattedOutput += `\n`;
        });

        if (isEditing) {
            setTabs(prev => prev.map(t => {
                if (t.id === activeTabId) {
                    return { ...t, content: formattedOutput, drackerData: newDrackerData };
                }
                return t;
            }));
        } else {
            addActivityTab({
                title: topic || "Aprenda com o Drácker",
                type: 'summary',
                content: formattedOutput,
                drackerData: newDrackerData
            });
        }

        generateAudio(newDrackerData.story);
        setShowDrackerEditor(false);
    };

    const handleMusicConfirm = (editedData) => {
        try {
            const letters = ['a', 'b', 'c', 'd', 'e'];
            const normalizedQuestions = (editedData.questions || []).map((q, idx) => {
                const text = typeof q === 'string' ? q : (q.text || q.question || `Pergunta ${idx + 1}`);
                const correct = typeof q === 'object' ? (q.correctAnswer || q.correct_answer || q.answer || q.correct_option || '') : '';
                const distractors = typeof q === 'object' ? (q.distractors || q.incorrect_options || []) : [];
                const provided = typeof q === 'object' ? (q.options || q.ordered_options || []) : [];

                let options = [];
                if (provided && provided.length > 0) {
                    options = provided;
                } else {
                    const setArgs = [correct, ...distractors].filter(Boolean);
                    options = Array.from(new Set(setArgs));
                    for (let i = options.length - 1; i > 0; i--) {
                        const j = Math.floor(Math.random() * (i + 1));
                        [options[i], options[j]] = [options[j], options[i]];
                    }
                }
                return { text, correctAnswer: correct, distractors, options, ordered_options: options };
            });

            let formattedOutput = `# 🎵 Música do Drácker: ${topic}\n\n`;
            formattedOutput += `## Lyrics\n${editedData.lyrics}\n\n`;
            if (editedData.style) formattedOutput += `## Style\n${editedData.style}\n\n`;
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
    };

    const handleConnectDotsConfirm = (newData) => {
        if (activeTabId) {
            setTabs(prev => prev.map(t => {
                if (t.id === activeTabId) {
                    return { ...t, data: newData };
                }
                return t;
            }));
        }
        setShowConnectDotsEditor(false);
    };

    const handleCrosswordConfirm = async (editedData) => {
        try {
            // Dynamic import to avoid heavy load if not needed? Or just standard import if cheap.
            const { generateCrossword } = await import('../utils/crosswordGenerator');

            const layout = generateCrossword(editedData.words, 15);
            let finalData = null;

            if (layout.words.length === 0) {
                const layout2 = generateCrossword(editedData.words, 20);
                if (layout2.words.length === 0) {
                    alert("Não foi possível encaixar todas as palavras.");
                    return;
                }
                finalData = {
                    words: layout2.words.map((w, i) => ({ ...w, num: i + 1 })),
                    gridSize: 20,
                    fillBlanks: false
                };
            } else {
                finalData = {
                    words: layout.words.map((w, i) => ({ ...w, num: i + 1 })),
                    gridSize: 15,
                    fillBlanks: false
                };
            }

            addActivityTab({
                title: editedData.topic || topic || "Palavras Cruzadas",
                type: 'crossword',
                content: '',
                data: finalData
            });

            setShowCrosswordEditor(false);
            setCrosswordEditorData(null);

        } catch (e) {
            console.error("Erro ao gerar grid final:", e);
            alert("Erro ao criar layout: " + e.message);
        }
    };

    const handleDominoConfirm = (editedData) => {
        if (isEditing) {
            setTabs(prev => prev.map(t => {
                if (t.id === activeTabId) {
                    return { ...t, dominoData: editedData, title: editedData.topic || t.title };
                }
                return t;
            }));
        } else {
            addActivityTab({
                title: editedData.topic || topic || "Dominó",
                type: 'domino',
                content: '',
                dominoData: editedData
            });
        }
        setShowDominoEditor(false);
        setDominoEditorData(null);
    };

    // Setters for actions from outside
    const openEditQuiz = (data) => {
        setQuizEditorData(data);
        setShowQuizEditor(true);
    };

    const openEditDracker = (data) => {
        setDrackerEditorData(data);
        setShowDrackerEditor(true);
    };

    const openEditMusic = (data) => {
        setMusicEditorData(data);
        setShowMusicEditor(true);
    };

    const openEditConnectDots = (data) => {
        setConnectDotsEditorData(data);
        setShowConnectDotsEditor(true);
    };

    const openEditDomino = (data) => {
        setDominoEditorData(data);
        setShowDominoEditor(true);
    };

    const openManualMusicEditor = () => {
        if (!topic) {
            setError('Por favor, digite um tema para a atividade.');
            return;
        }
        setMusicEditorData({
            lyrics: '',
            questions: []
        });
        setShowMusicEditor(true);
    };

    // Move handleWordsearchComplete here or nearby logic? 
    // It's used by AppModals. I can expose it from here if I want.
    // For now I won't, to avoid changing AppModals signature too much, 
    // but I can pass it down from MainLayout.

    return {
        isLoading,
        error,
        setError,
        handleGenerate,

        // Quiz config
        questionCount, setQuestionCount,
        difficultyDist, setDifficultyDist,

        // Editor States & Setters
        showQuizEditor, setShowQuizEditor, quizEditorData, openEditQuiz, handleQuizConfirm,
        showDrackerEditor, setShowDrackerEditor, drackerEditorData, openEditDracker, handleDrackerConfirm,
        showMusicEditor, setShowMusicEditor, musicEditorData, openEditMusic, handleMusicConfirm, openManualMusicEditor,
        showConnectDotsEditor, setShowConnectDotsEditor, connectDotsEditorData, openEditConnectDots, handleConnectDotsConfirm,
        showCrosswordEditor, setShowCrosswordEditor, crosswordEditorData, handleCrosswordConfirm,
        showDominoEditor, setShowDominoEditor, dominoEditorData, openEditDomino, handleDominoConfirm,

        // Wordsearch
        wordsearchTrigger,
        wordsearchEditData,
        startWordsearchWizard,
        setWordsearchEditData
    };
};
