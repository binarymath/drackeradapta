import React, { useState, useEffect, useRef } from 'react';
import {
    Save,
    Plus,
    Trash2,
    GripVertical,
    Music,
    Sparkles,
    Wand2,
    BookOpen,
    Radio,
    Layers,
    Compass,
    CheckCircle2,
    Loader2,
    ExternalLink,
    Volume2,
    Edit3,
    ArrowRight,
    Flame
} from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// UI Components
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Input, TextArea } from './ui/Input';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import { shuffleInPlace } from '../utils/array';
import { toast } from './ui/Toast';
import { useGemini } from '../contexts/GeminiContext';
import { generateDrackerMusicWithAI } from '../core/usecases/generateMusicActivity';

// Animaizinhos da Floresta Encantada
const forestCharacters = [
    {
        emoji: '🐉',
        name: 'Drácker',
        role: 'Líder & Explorador',
        desc: 'Dragãozinho curioso que faz perguntas e lidera a turma cantando.'
    },
    {
        emoji: '🦉',
        name: 'Sábia Coruja',
        role: 'Ciência & Sabedoria',
        desc: 'Explica conceitos do alto dos galhos com calma e clareza.'
    },
    {
        emoji: '🐿️',
        name: 'Ágil Esquilo',
        role: 'Cálculos & Ordem',
        desc: 'Organiza nozes, demonstra divisões e passos lógicos no chão.'
    },
    {
        emoji: '🦊',
        name: 'Esperta Raposa',
        role: 'Mágica & Rimas',
        desc: 'Traz enigmas, charadas espertas e truques para fixar o aprendizado.'
    },
    {
        emoji: '🐰',
        name: 'Fofinho Coelho',
        role: 'Ritmo & Dança',
        desc: 'Pula cheio de energia para a turma dançar e memorizar o refrão.'
    }
];

const generationSteps = [
    '🐉 Drácker reuniu a turma na clareira da Floresta Encantada...',
    '🦉 A sábia Coruja está estruturando os conceitos pedagógicos em versos...',
    '🐿️ O ágil Esquilo está organizando os passos práticos com suas nozes...',
    '🦊 A esperta Raposa está elaborando as charadas e perguntas de interpretação...',
    '🐰 O fofinho Coelho está ajustando o refrão contagiante para a turma cantar...'
];

const SortableQuestionItem = ({ question, index, onRemove, onChange, id }) => {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const difficultyColors = {
        facil: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        medio: 'bg-amber-50 text-amber-700 border-amber-200',
        dificil: 'bg-rose-50 text-rose-700 border-rose-200'
    };

    const difficultyLabels = {
        facil: 'Fácil',
        medio: 'Médio',
        dificil: 'Difícil'
    };

    return (
        <div ref={setNodeRef} style={style} className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs hover:border-slate-300 transition-all flex items-start gap-3 group">
            <button
                {...attributes}
                {...listeners}
                className="mt-2 text-slate-400 cursor-grab active:cursor-grabbing hover:text-slate-600 touch-none p-1 rounded-lg hover:bg-slate-100"
                title="Arraste para reordenar"
            >
                <GripVertical className="w-5 h-5" />
            </button>
            <div className="flex-1 space-y-3">
                <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-black">
                            {index + 1}
                        </span>
                        Questão {index + 1}
                    </span>
                    <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${difficultyColors[question.difficulty] || difficultyColors.facil}`}>
                        {difficultyLabels[question.difficulty] || 'Fácil'}
                    </span>
                </div>
                <TextArea
                    value={question.text}
                    onChange={(e) => onChange(id, 'text', e.target.value)}
                    className="min-h-[70px] text-sm font-medium"
                    placeholder="Enunciado da pergunta de interpretação..."
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    <div className="md:col-span-2">
                        <label className="text-[11px] font-bold text-emerald-700 mb-1 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Alternativa Correta
                        </label>
                        <Input
                            value={question.correctAnswer}
                            onChange={(e) => onChange(id, 'correct', e.target.value)}
                            placeholder="Resposta correta da questão"
                            className="border-emerald-300 focus:border-emerald-500 bg-emerald-50/30 text-emerald-950 font-medium"
                        />
                    </div>
                    {question.distractors.map((opt, optIdx) => (
                        <div key={optIdx}>
                            <label className="text-[10px] font-semibold text-slate-500 mb-0.5 block">
                                Alternativa Incorreta {optIdx + 1}
                            </label>
                            <Input
                                value={opt}
                                onChange={(e) => onChange(id, 'distractor', e.target.value, optIdx)}
                                placeholder={`Opção incorreta ${optIdx + 1}`}
                                className="text-xs"
                            />
                        </div>
                    ))}
                </div>
            </div>
            <Button
                onClick={() => onRemove(id)}
                variant="ghost"
                className="mt-1 p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl"
                title="Excluir pergunta"
            >
                <Trash2 className="w-4 h-4" />
            </Button>
        </div>
    );
};

export const MusicEditorModal = ({
    isOpen,
    onClose,
    onSave,
    initialData,
    defaultTopic = '',
    defaultLessonDetails = '',
    defaultDifficulty = 'facil'
}) => {
    const { geminiService, apiKey, selectedModel } = useGemini();

    // Mode Switcher: 'ai' ou 'manual'
    const [mode, setMode] = useState('ai');

    // Song Data
    const [title, setTitle] = useState('');
    const [lyrics, setLyrics] = useState('');
    const [style, setStyle] = useState('Pop Dançante Infantil Alegre');
    const [synopsis, setSynopsis] = useState('');
    const [questions, setQuestions] = useState([]);

    // AI Form Fields
    const [aiTopic, setAiTopic] = useState('');
    const [aiLessonDetails, setAiLessonDetails] = useState('');
    const [aiGradeLevel, setAiGradeLevel] = useState('Ensino Fundamental I (6 a 10 anos)');
    const [aiMusicalStyle, setAiMusicalStyle] = useState('Pop Dançante Infantil Alegre');
    const [aiQuestionCount, setAiQuestionCount] = useState(6);

    // Generation states
    const [isGenerating, setIsGenerating] = useState(false);
    const [stepIndex, setStepIndex] = useState(0);
    const [generatedSuccess, setGeneratedSuccess] = useState(false);

    const stepIntervalRef = useRef(null);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    // Init data when modal opens
    useEffect(() => {
        if (isOpen) {
            const hasExistingLyrics = !!(initialData?.lyrics && initialData.lyrics.trim().length > 0);
            setMode(hasExistingLyrics ? 'manual' : 'ai');
            setGeneratedSuccess(false);

            const initialTopic = initialData?.topic || initialData?.title || defaultTopic || '';
            const initialDetails = initialData?.lessonDetails || defaultLessonDetails || '';

            setAiTopic(initialTopic);
            setAiLessonDetails(initialDetails);
            setTitle(initialData?.title || (initialTopic ? `Música do Drácker: ${initialTopic}` : ''));
            setLyrics(initialData?.lyrics || '');
            setStyle(initialData?.style || 'Pop Dançante Infantil Alegre');
            setSynopsis(initialData?.synopsis || '');

            const initialQuestions = (initialData?.questions || []).map((q, idx) => {
                const text = typeof q === 'string' ? q : (q.text || q.question || '');
                const correct = typeof q === 'object' ? (q.correctAnswer || q.correct_answer || q.answer || q.correct_option || '') : '';
                const distractors = typeof q === 'object' ? (q.distractors || q.incorrect_options || []) : [];
                const filledDistractors = [...distractors];
                while (filledDistractors.length < 3) filledDistractors.push('');
                return {
                    id: `q-${Date.now()}-${idx}-${Math.floor(Math.random() * 1000)}`,
                    text,
                    correctAnswer: correct,
                    distractors: filledDistractors.slice(0, 3),
                    difficulty: (q.difficulty || (idx < 2 ? 'facil' : idx < 4 ? 'medio' : 'dificil'))
                };
            });

            setQuestions(initialQuestions.length ? initialQuestions : [
                {
                    id: `q-${Date.now()}-0`,
                    text: '',
                    correctAnswer: '',
                    distractors: ['', '', ''],
                    difficulty: 'facil'
                }
            ]);
        }
    }, [isOpen, initialData, defaultTopic, defaultLessonDetails]);

    // Animated loading messages
    useEffect(() => {
        if (isGenerating) {
            setStepIndex(0);
            stepIntervalRef.current = setInterval(() => {
                setStepIndex(prev => (prev + 1) % generationSteps.length);
            }, 2200);
        } else {
            if (stepIntervalRef.current) clearInterval(stepIntervalRef.current);
        }
        return () => {
            if (stepIntervalRef.current) clearInterval(stepIntervalRef.current);
        };
    }, [isGenerating]);

    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (active.id !== over.id) {
            setQuestions((items) => {
                const oldIndex = items.findIndex(i => i.id === active.id);
                const newIndex = items.findIndex(i => i.id === over.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    const handleQuestionChange = (id, field, value, distractorIndex = 0) => {
        setQuestions(prev => prev.map(q => {
            if (q.id !== id) return q;
            if (field === 'text') return { ...q, text: value };
            if (field === 'correct') return { ...q, correctAnswer: value };
            if (field === 'distractor') {
                const next = [...(q.distractors || [])];
                next[distractorIndex] = value;
                return { ...q, distractors: next };
            }
            return q;
        }));
    };

    const addQuestion = () => {
        setQuestions([
            ...questions,
            {
                id: `q-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                text: '',
                correctAnswer: '',
                distractors: ['', '', ''],
                difficulty: questions.length < 2 ? 'facil' : questions.length < 5 ? 'medio' : 'dificil'
            }
        ]);
    };

    const removeQuestion = (id) => {
        if (questions.length <= 1) {
            toast("Você precisa ter pelo menos uma pergunta.");
            return;
        }
        setQuestions(questions.filter(q => q.id !== id));
    };

    // AI Generation Handler
    const handleGenerateAI = async () => {
        const currentTopic = aiTopic.trim();
        if (!currentTopic) {
            toast("Por favor, digite o tema ou assunto da aula.");
            return;
        }

        setIsGenerating(true);
        try {
            const result = await generateDrackerMusicWithAI({
                topic: currentTopic,
                lessonDetails: aiLessonDetails.trim(),
                gradeLevel: aiGradeLevel,
                musicalStyle: aiMusicalStyle,
                questionCount: Number(aiQuestionCount) || 6,
                geminiService,
                model: selectedModel,
                apiKey
            });

            if (result && result.lyrics) {
                setTitle(result.title || `Música do Drácker: ${currentTopic}`);
                setLyrics(result.lyrics);
                setStyle(result.style || aiMusicalStyle);
                setSynopsis(result.synopsis || '');

                if (Array.isArray(result.questions) && result.questions.length > 0) {
                    setQuestions(result.questions);
                }

                setGeneratedSuccess(true);
                toast(result.isLocalFallback
                    ? "Canção criada com o motor pedagógico do Drácker!"
                    : "Canção e questões geradas com sucesso pela IA do Drácker!"
                );
            } else {
                toast("Não foi possível gerar a canção. Tente novamente.");
            }
        } catch (error) {
            console.error("Erro ao gerar canção com IA:", error);
            toast("Ocorreu um erro ao gerar a música. Tente novamente.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSave = () => {
        if (!lyrics || !lyrics.trim()) {
            toast("A música precisa ter uma letra preenchida.");
            return;
        }

        // Build normalized questions with options
        let normalizedQuestions = questions.map((q, idx) => {
            const cleanedDistractors = (q.distractors || []).map(d => d?.trim()).filter(Boolean);
            const options = Array.from(new Set([q.correctAnswer, ...cleanedDistractors].filter(Boolean)));
            return {
                text: q.text || `Pergunta ${idx + 1}`,
                correctAnswer: q.correctAnswer || '',
                distractors: cleanedDistractors,
                options,
                ordered_options: shuffleInPlace([...options]),
                difficulty: q.difficulty || (idx < 2 ? 'facil' : idx < 5 ? 'medio' : 'dificil')
            };
        });

        const finalTitle = title.trim() || aiTopic.trim() || 'Música do Drácker';

        onSave({
            title: finalTitle,
            lyrics: lyrics.trim(),
            style: style.trim() || aiMusicalStyle,
            synopsis: synopsis.trim(),
            questions: normalizedQuestions
        });
        onClose();
    };

    if (!isOpen) return null;

    const footer = (
        <div className="flex items-center justify-between w-full flex-wrap gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="font-bold text-slate-700">Rádio Drácker:</span>
                <span>{questions.length} perguntas de fixação</span>
                {lyrics && <span className="text-emerald-600 font-bold">• Letra pronta</span>}
            </div>
            <div className="flex items-center gap-2">
                <Button onClick={onClose} variant="secondary">
                    Cancelar
                </Button>
                {mode === 'ai' && !lyrics ? (
                    <Button
                        onClick={handleGenerateAI}
                        disabled={isGenerating || !aiTopic.trim()}
                        className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-md shadow-purple-500/20"
                        icon={isGenerating ? Loader2 : Sparkles}
                    >
                        {isGenerating ? 'Criando Música...' : 'Gerar Canção com IA'}
                    </Button>
                ) : (
                    <Button
                        onClick={handleSave}
                        icon={Save}
                        className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md shadow-emerald-500/20"
                    >
                        Salvar Canção & Questões
                    </Button>
                )}
            </div>
        </div>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Rádio Drácker: Estúdio de Composição"
            icon={Radio}
            size="2xl"
            footer={footer}
        >
            <div className="space-y-5">
                {/* Mode Selector Tabs */}
                <div className="bg-slate-100 p-1.5 rounded-2xl flex items-center justify-between gap-2 max-w-lg mx-auto border border-slate-200">
                    <button
                        onClick={() => setMode('ai')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                            mode === 'ai'
                                ? 'bg-white text-purple-700 shadow-sm border border-purple-200 scale-[1.01]'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                        }`}
                    >
                        <Sparkles className={`w-4 h-4 ${mode === 'ai' ? 'text-purple-600 animate-pulse' : 'text-slate-400'}`} />
                        <span>Compor com IA (Drácker & Floresta)</span>
                    </button>
                    <button
                        onClick={() => setMode('manual')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                            mode === 'manual'
                                ? 'bg-white text-slate-800 shadow-sm border border-slate-200 scale-[1.01]'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                        }`}
                    >
                        <Edit3 className={`w-4 h-4 ${mode === 'manual' ? 'text-amber-600' : 'text-slate-400'}`} />
                        <span>Edição Manual & Questões</span>
                    </button>
                </div>

                {/* TAB 1: AI GENERATION */}
                {mode === 'ai' && (
                    <div className="space-y-5 animate-in fade-in duration-200">
                        {/* Lore & Characters Callout */}
                        <div className="bg-gradient-to-br from-purple-50 via-pink-50/50 to-amber-50/40 border-2 border-purple-200/80 rounded-3xl p-5 shadow-xs">
                            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow-md shadow-purple-500/20 shrink-0">
                                        <Wand2 className="w-6 h-6 animate-pulse" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black text-purple-950 font-['Fredoka']">
                                            Drácker e os Amigos da Floresta Encantada
                                        </h3>
                                        <p className="text-xs text-purple-800 font-medium">
                                            A IA compõe estrofes rimadas onde cada personagem ensina o conteúdo da aula e formula questões pedagógicas!
                                        </p>
                                    </div>
                                </div>
                                <Badge variant="primary" className="bg-purple-100 text-purple-800 border-purple-300 font-extrabold text-[11px] shrink-0">
                                    ✨ Música + 4 a 10 Questões
                                </Badge>
                            </div>

                            {/* Forest Friends Chips */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5 pt-1">
                                {forestCharacters.map((char, idx) => (
                                    <div
                                        key={idx}
                                        className="bg-white/80 backdrop-blur-xs border border-purple-100 rounded-2xl p-2.5 text-center shadow-2xs hover:border-purple-300 hover:scale-[1.02] transition-all"
                                    >
                                        <div className="text-2xl mb-1">{char.emoji}</div>
                                        <div className="text-xs font-black text-slate-800">{char.name}</div>
                                        <div className="text-[10px] font-bold text-purple-700">{char.role}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Generation Form */}
                        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs space-y-4">
                            {/* Engine status indicator */}
                            <div className="flex items-center justify-between text-xs pb-1 border-b border-slate-100">
                                <span className="font-bold text-slate-600 flex items-center gap-1.5">
                                    <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                                    Modo de Composição:
                                </span>
                                {apiKey ? (
                                    <span className="font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                        IA Gemini Ativa (Geração em Nuvem)
                                    </span>
                                ) : (
                                    <span className="font-extrabold text-purple-700 bg-purple-50 border border-purple-200 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                                        🌱 Motor Conceitual Drácker (Dinâmico)
                                    </span>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5 md:col-span-2">
                                    <label className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                        <BookOpen className="w-3.5 h-3.5 text-purple-600" />
                                        Conceito ou Regra a Explicar em Detalhes <span className="text-rose-500">*</span>
                                    </label>
                                    <Input
                                        value={aiTopic}
                                        onChange={(e) => setAiTopic(e.target.value)}
                                        placeholder="Ex: Frações Equivalentes, Ciclo da Água, Multiplicação, Tempos Verbais..."
                                        className="text-sm font-semibold"
                                    />
                                    {/* Quick Concept Suggestions */}
                                    <div className="flex items-center gap-1.5 flex-wrap pt-1.5">
                                        <span className="text-[10px] font-bold text-slate-400">Exemplos Conceituais:</span>
                                        {[
                                            { label: '🍕 Frações: Numerador & Denominador', topic: 'Frações Equivalentes', details: 'A Coruja define numerador e denominador, o Esquilo divide nozes e a Raposa ensina frações equivalentes.' },
                                            { label: '💧 Ciclo da Água: 4 Etapas', topic: 'O Ciclo da Água', details: 'Explicar evaporação, condensação, precipitação e transpiração das árvores da floresta.' },
                                            { label: '✖️ Multiplicação: Parcelas Iguais', topic: 'Multiplicação e Tabuada', details: 'O Esquilo ensina que multiplicar é somar parcelas iguais e a Raposa mostra que a ordem dos fatores não altera o produto.' },
                                            { label: '✍️ Verbos: Pretérito e -RAM vs -RÃO', topic: 'Tempos Verbais', details: 'A Coruja ensina verbos como ações, o Esquilo conjuga no pretérito e a Raposa explica a diferença entre -RAM e -RÃO.' }
                                        ].map((pill, pIdx) => (
                                            <button
                                                key={pIdx}
                                                type="button"
                                                onClick={() => {
                                                    setAiTopic(pill.topic);
                                                    setAiLessonDetails(pill.details);
                                                }}
                                                className="text-[10px] font-bold px-2.5 py-1 bg-slate-50 hover:bg-purple-100 hover:text-purple-900 text-slate-600 rounded-lg border border-slate-200 transition-all cursor-pointer"
                                            >
                                                {pill.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-1.5 md:col-span-2">
                                    <label className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                        <Compass className="w-3.5 h-3.5 text-indigo-600" />
                                        Passo a Passo ou Regras que os Bichinhos Devem Ensinar
                                    </label>
                                    <TextArea
                                        value={aiLessonDetails}
                                        onChange={(e) => setAiLessonDetails(e.target.value)}
                                        placeholder="Ex: A Coruja explica a teoria, o Esquilo demonstra o cálculo com nozes no chão e a Raposa dá o macete para não errar..."
                                        className="min-h-[64px] text-xs font-medium"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-black text-slate-700 uppercase tracking-wider block">
                                        Nível/Ano Escolar
                                    </label>
                                    <select
                                        value={aiGradeLevel}
                                        onChange={(e) => setAiGradeLevel(e.target.value)}
                                        className="w-full h-11 px-3.5 rounded-2xl border border-slate-200 bg-white font-semibold text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                                    >
                                        <option value="Educação Infantil (4 a 5 anos)">Educação Infantil (4 a 5 anos)</option>
                                        <option value="Ensino Fundamental I - 1º ao 3º Ano (6 a 8 anos)">Fundamental I - 1º ao 3º Ano (6 a 8 anos)</option>
                                        <option value="Ensino Fundamental I - 4º e 5º Ano (9 a 10 anos)">Fundamental I - 4º e 5º Ano (9 a 10 anos)</option>
                                        <option value="Ensino Fundamental II - 6º ao 9º Ano (11 a 14 anos)">Fundamental II - 6º ao 9º Ano (11 a 14 anos)</option>
                                        <option value="Ensino Médio - 1ª a 3ª Série (15 a 17 anos)">Ensino Médio - 1ª a 3ª Série (15 a 17 anos)</option>
                                    </select>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-black text-slate-700 uppercase tracking-wider block">
                                        Estilo & Ritmo Musical
                                    </label>
                                    <select
                                        value={aiMusicalStyle}
                                        onChange={(e) => setAiMusicalStyle(e.target.value)}
                                        className="w-full h-11 px-3.5 rounded-2xl border border-slate-200 bg-white font-semibold text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                                    >
                                        <option value="Pop Dançante Infantil Alegre">🌟 Pop Dançante Infantil Alegre</option>
                                        <option value="Balada Encantada da Floresta">🌲 Balada Encantada da Floresta</option>
                                        <option value="Rap & Rima dos Animais">🎤 Rap & Rima dos Animais da Floresta</option>
                                        <option value="Marchinha Festiva / Ritmo Folclórico">🥁 Marchinha Festiva / Ritmo Folclórico</option>
                                        <option value="Rock Divertido dos Bichinhos">🎸 Rock Divertido dos Bichinhos</option>
                                    </select>
                                </div>

                                <div className="space-y-1.5 md:col-span-2">
                                    <label className="text-xs font-black text-slate-700 uppercase tracking-wider block">
                                        Quantidade de Questões de Compreensão
                                    </label>
                                    <div className="grid grid-cols-4 gap-2">
                                        {[4, 6, 8, 10].map(count => (
                                            <button
                                                key={count}
                                                type="button"
                                                onClick={() => setAiQuestionCount(count)}
                                                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                                                    aiQuestionCount === count
                                                        ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                                                        : 'bg-white text-slate-700 border-slate-200 hover:border-purple-300'
                                                }`}
                                            >
                                                {count} Questões {count === 6 && '⭐'}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Progress / Generate Button */}
                            {isGenerating ? (
                                <div className="p-5 rounded-2xl bg-purple-50/70 border border-purple-200 text-center space-y-3">
                                    <div className="flex items-center justify-center gap-2 text-purple-700 font-black text-sm">
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <span>Compondo com o Drácker e os amigos...</span>
                                    </div>
                                    <p className="text-xs text-purple-900 font-semibold animate-pulse max-w-lg mx-auto">
                                        {generationSteps[stepIndex]}
                                    </p>
                                </div>
                            ) : (
                                <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                                    <Button
                                        onClick={handleGenerateAI}
                                        disabled={!aiTopic.trim()}
                                        className="w-full sm:flex-1 h-12 rounded-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-black text-sm shadow-md shadow-purple-500/20 border-none cursor-pointer flex items-center justify-center gap-2"
                                    >
                                        <Sparkles className="w-4 h-4" />
                                        <span>✨ Compor Canção & {aiQuestionCount} Questões com IA</span>
                                    </Button>
                                    <Button
                                        onClick={() => setMode('manual')}
                                        variant="secondary"
                                        className="w-full sm:w-auto h-12 rounded-2xl text-xs font-bold"
                                    >
                                        Escrever Manualmente
                                    </Button>
                                </div>
                            )}
                        </div>

                        {/* Success Callout after generation */}
                        {generatedSuccess && lyrics && (
                            <div className="bg-emerald-50 border-2 border-emerald-300 rounded-3xl p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in zoom-in-95 duration-200">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                                        <h4 className="font-black text-emerald-950 text-base">
                                            Canção "{title}" criada com sucesso!
                                        </h4>
                                    </div>
                                    <p className="text-xs text-emerald-800 font-medium">
                                        Letra completa e {questions.length} questões pedagógicas prontas. Você pode personalizá-las no modo manual ou salvar agora.
                                    </p>
                                </div>
                                <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                                    <Button
                                        onClick={() => setMode('manual')}
                                        variant="secondary"
                                        className="bg-white border-emerald-300 text-emerald-900 font-bold text-xs flex-1 sm:flex-initial"
                                    >
                                        Revisar Letra & Questões <ArrowRight className="w-3.5 h-3.5 ml-1" />
                                    </Button>
                                    <Button
                                        onClick={handleSave}
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex-1 sm:flex-initial"
                                    >
                                        Salvar Agora
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* TAB 2: MANUAL EDITOR & QUESTIONS */}
                {mode === 'manual' && (
                    <div className="space-y-4 animate-in fade-in duration-200">
                        {/* Song Metadata Inputs */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white p-4 rounded-2xl border border-slate-200">
                            <div className="sm:col-span-2">
                                <label className="text-xs font-bold text-slate-600 mb-1 block">
                                    Título da Música
                                </label>
                                <Input
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Ex: O Mistério das Frações com Drácker"
                                    className="font-bold text-sm"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-600 mb-1 block">
                                    Estilo / Ritmo
                                </label>
                                <Input
                                    value={style}
                                    onChange={(e) => setStyle(e.target.value)}
                                    placeholder="Ex: Pop Infantil Alegre"
                                    className="text-xs font-semibold"
                                />
                            </div>
                        </div>

                        {/* Editor Columns */}
                        <div className="flex flex-col lg:flex-row gap-5 min-h-[550px]">
                            {/* Left: Lyrics Editor */}
                            <div className="flex-1 flex flex-col gap-2">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                                        <Music className="w-4 h-4 text-purple-600" /> Letra da Canção
                                    </h3>
                                    <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                                        {lyrics ? `${lyrics.split('\n').filter(Boolean).length} linhas` : 'Vazia'}
                                    </span>
                                </div>
                                <TextArea
                                    value={lyrics}
                                    onChange={(e) => setLyrics(e.target.value)}
                                    wrapperClassName="flex-1 flex flex-col"
                                    className="flex-1 font-mono text-xs sm:text-sm leading-relaxed p-4 bg-white border-slate-200 rounded-2xl focus:border-purple-400 min-h-[460px]"
                                    placeholder="[Verso 1]&#10;Lá na Floresta Encantada Drácker bate as asas no ar...&#10;&#10;[Refrão]&#10;Vem cantar com o Drácker, vem aprender também!&#10;..."
                                />
                                <div className="text-[11px] text-slate-400 font-medium">
                                    Dica: Estruture a letra com <code>[Verso 1]</code>, <code>[Refrão]</code>, <code>[Verso 2]</code>, <code>[Ponte]</code> e <code>[Final]</code>.
                                </div>
                            </div>

                            {/* Right: Questions Editor */}
                            <div className="flex-1 flex flex-col gap-2">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                                        📝 Questões de Fixação ({questions.length})
                                    </h3>
                                    <Button
                                        onClick={addQuestion}
                                        variant="secondary"
                                        className="h-8 px-3 text-xs bg-slate-100 hover:bg-slate-200 border-slate-200 font-bold"
                                        icon={Plus}
                                    >
                                        Adicionar Pergunta
                                    </Button>
                                </div>

                                <Card className="flex-1 bg-slate-50/70 border-slate-200 p-3 overflow-y-auto max-h-[500px]">
                                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                                        <SortableContext items={questions.map(q => q.id)} strategy={verticalListSortingStrategy}>
                                            <div className="space-y-3">
                                                {questions.map((q, index) => (
                                                    <SortableQuestionItem
                                                        key={q.id}
                                                        id={q.id}
                                                        question={q}
                                                        index={index}
                                                        onRemove={removeQuestion}
                                                        onChange={handleQuestionChange}
                                                    />
                                                ))}
                                            </div>
                                        </SortableContext>
                                    </DndContext>
                                </Card>
                            </div>
                        </div>
                    </div>
                )}

                {/* Playlist Suno Banner */}
                <div className="bg-gradient-to-r from-purple-50 via-pink-50 to-amber-50 border border-purple-200 rounded-2xl p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3">
                        <img
                            src="/audio/cover_area_magica.jpeg"
                            alt="Capa Suno"
                            className="w-10 h-10 rounded-xl object-cover border border-purple-200 shadow-2xs shrink-0"
                            onError={(e) => { e.target.src = '/dracker_character.png'; }}
                        />
                        <div>
                            <span className="font-black text-purple-950 block">Playlist Oficial Rádio Drácker no Suno</span>
                            <span className="text-purple-700">Ouça 6 canções pedagógicas produzidas para a sala de aula</span>
                        </div>
                    </div>
                    <a
                        href="https://suno.com/@drackermusic"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold transition-colors flex items-center gap-1.5 shrink-0"
                    >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Abrir no Suno</span>
                    </a>
                </div>
            </div>
        </Modal>
    );
};
