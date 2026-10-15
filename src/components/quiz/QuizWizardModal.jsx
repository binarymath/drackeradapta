import React, { useState, useEffect, useRef } from 'react';
import {
    X,
    Plus,
    Trash2,
    CheckCircle,
    Save,
    AlertCircle,
    GripVertical,
    Image as ImageIcon,
    Link2,
    Dices,
    Check,
    FileSpreadsheet,
    BrainCircuit,
    Sparkles,
    Edit3,
    Clock,
    Target,
    Layers,
    Sliders,
    HelpCircle,
    BookOpen,
    GraduationCap,
    RefreshCw,
    Wand2
} from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input, TextArea } from '../ui/Input';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { useActivity } from '../../contexts/ActivityContext';
import { useGemini } from '../../contexts/GeminiContext';
import { convertRouletteQuestionsToQuiz } from '../../services/questionTransitionService';
import { gameAudio } from '../../utils/gameAudio';
import { toDirectImageUrl, handleDriveImageError, isYouTubeUrl, getYouTubeEmbedUrl } from '../../utils/urlUtils';
import { GoogleSheetsImportModal } from '../roulette/GoogleSheetsImportModal';
import { generateQuizActivity } from '../../core/usecases/generateQuizActivity';
import { LatexRenderer } from '../ui/LatexRenderer';
import { toast } from '../ui/Toast';
import { GlobalAIGeneratorPanel } from '../common/GlobalAIGeneratorPanel';

// Frases lúdicas de carregamento com a turma do Drácker
const QUIZ_GENERATION_STEPS = [
    '🐉 Drácker reuniu a turma na clareira para criar o Quiz...',
    '🦉 A sábia Coruja está formulando enunciados claros e estimulantes...',
    '🐿️ O ágil Esquilo está balanceando as dificuldades e opções distratoras...',
    '🦊 A esperta Raposa está garantindo alternativas inteligentes e gabarito...',
    '🐰 O fofinho Coelho está ajustando os detalhes para um desafio dinâmico!'
];

// Presets de Dificuldade para o Professor
const DIFFICULTY_PRESETS = [
    {
        id: 'balanced',
        name: 'Equilibrado',
        icon: '🎯',
        desc: '40% Fácil • 40% Médio • 20% Difícil',
        tag: 'Padrão Recomendado',
        dist: { easy: 40, medium: 40, hard: 20 }
    },
    {
        id: 'intro',
        name: 'Introdução / Básico',
        icon: '🌱',
        desc: '70% Fácil • 30% Médio • 0% Difícil',
        tag: 'Fixação Inicial',
        dist: { easy: 70, medium: 30, hard: 0 }
    },
    {
        id: 'challenge',
        name: 'Desafio Avançado',
        icon: '⚡',
        desc: '20% Fácil • 50% Médio • 30% Difícil',
        tag: 'Simulado & Aprofundamento',
        dist: { easy: 20, medium: 50, hard: 30 }
    }
];

const QUESTION_COUNT_OPTIONS = [
    { count: 5, time: '~10 min', label: 'Aquecimento' },
    { count: 8, time: '~15 min', label: 'Revisão Rápida' },
    { count: 10, time: '~25 min', label: 'Padrão ⭐' },
    { count: 15, time: '~40 min', label: 'Avaliação' },
    { count: 20, time: '~50 min', label: 'Simulado' }
];

const BG_SWATCHES = [
    { c: '#ffffff', label: 'Branco' },
    { c: '#000000', label: 'Preto' },
    { c: '#fffde7', label: 'Creme' },
    { c: '#e3f2fd', label: 'Azul claro' },
    { c: '#f3e5f5', label: 'Lilás' },
    { c: '#e8f5e9', label: 'Verde claro' },
    { c: '#fff3e0', label: 'Laranja claro' },
    { c: '#fce4ec', label: 'Rosa claro' },
];

function SortableQuestionCard({
    question,
    qIndex,
    onQuestionChange,
    onDeleteQuestion,
    onOptionChange,
    onSetCorrect,
    onAddOption,
    onDeleteOption,
    id
}) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
    const [showImageConfig, setShowImageConfig] = useState(Boolean(question.image_url));

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const diffBadge = {
        easy: { label: 'Fácil', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
        medium: { label: 'Média', bg: 'bg-amber-50 text-amber-700 border-amber-200' },
        hard: { label: 'Difícil', bg: 'bg-rose-50 text-rose-700 border-rose-200' }
    }[question.difficulty || 'medium'] || { label: 'Média', bg: 'bg-amber-50 text-amber-700 border-amber-200' };

    const hasLatex = (str) => typeof str === 'string' && (str.includes('$') || str.includes('\\'));

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="p-5 bg-white rounded-3xl border-2 border-slate-200 shadow-sm hover:border-indigo-300 transition-all space-y-4 group"
        >
            {/* Header da Questão */}
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        {...attributes}
                        {...listeners}
                        className="cursor-grab active:cursor-grabbing p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors touch-none"
                        title="Arraste para reordenar esta questão"
                    >
                        <GripVertical className="w-5 h-5" />
                    </button>
                    <span className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 font-black text-sm flex items-center justify-center font-['Fredoka']">
                        #{qIndex + 1}
                    </span>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Questão {qIndex + 1}
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    {/* Seletor de Dificuldade */}
                    <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs">
                        {[
                            { id: 'easy', label: 'Fácil', color: 'hover:text-emerald-700 active:bg-emerald-100' },
                            { id: 'medium', label: 'Média', color: 'hover:text-amber-700 active:bg-amber-100' },
                            { id: 'hard', label: 'Difícil', color: 'hover:text-rose-700 active:bg-rose-100' }
                        ].map((d) => {
                            const isSelected = (question.difficulty || 'medium') === d.id;
                            return (
                                <button
                                    key={d.id}
                                    type="button"
                                    onClick={() => onQuestionChange(qIndex, 'difficulty', d.id)}
                                    className={`px-2.5 py-1 rounded-lg font-bold transition-all text-[11px] ${
                                        isSelected
                                            ? d.id === 'easy'
                                                ? 'bg-emerald-500 text-white shadow-xs'
                                                : d.id === 'hard'
                                                ? 'bg-rose-500 text-white shadow-xs'
                                                : 'bg-amber-500 text-white shadow-xs'
                                            : 'text-slate-500 hover:text-slate-800'
                                    }`}
                                >
                                    {d.label}
                                </button>
                            );
                        })}
                    </div>

                    {/* Botão de Excluir */}
                    <button
                        type="button"
                        onClick={() => onDeleteQuestion(qIndex)}
                        className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                        title="Excluir esta questão"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Enunciado da Pergunta */}
            <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-slate-700 uppercase tracking-wider">
                        Enunciado da Questão
                    </label>
                    {hasLatex(question.statement) && (
                        <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-md font-mono font-bold">
                            LaTeX Detectado
                        </span>
                    )}
                </div>
                <TextArea
                    value={question.statement}
                    onChange={(e) => onQuestionChange(qIndex, 'statement', e.target.value)}
                    placeholder="Escreva a pergunta com clareza..."
                    className="min-h-[70px] text-sm font-medium bg-slate-50 border-slate-200 focus:bg-white rounded-2xl"
                />
                {hasLatex(question.statement) && (
                    <div className="p-2.5 bg-amber-50/50 rounded-xl border border-amber-200/60 text-xs text-slate-800">
                        <span className="text-[10px] uppercase font-bold text-amber-700 block mb-1">Pré-visualização KaTeX:</span>
                        <LatexRenderer content={question.statement} />
                    </div>
                )}
            </div>

            {/* Alternativas de Resposta */}
            <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                        <span>Alternativas de Resposta</span>
                        <span className="text-[10px] font-normal text-slate-400">
                            (Selecione a resposta correta no botão verde)
                        </span>
                    </label>
                    <span className="text-[11px] font-bold text-slate-400">
                        {question.options.length}/5 opções
                    </span>
                </div>

                <div className="space-y-2">
                    {question.options.map((option, oIndex) => {
                        const letters = ['A', 'B', 'C', 'D', 'E'];
                        const isCorrect = option.isCorrect;
                        return (
                            <div
                                key={option.id || oIndex}
                                className={`flex items-center gap-2 p-2 rounded-2xl border transition-all ${
                                    isCorrect
                                        ? 'bg-emerald-50/60 border-emerald-300 ring-2 ring-emerald-500/10'
                                        : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                                }`}
                            >
                                {/* Botão de Marcação da Resposta Correta */}
                                <button
                                    type="button"
                                    onClick={() => onSetCorrect(qIndex, oIndex)}
                                    className={`px-3 py-1.5 rounded-xl font-black text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                                        isCorrect
                                            ? 'bg-emerald-500 text-white shadow-sm hover:bg-emerald-600'
                                            : 'bg-white text-slate-400 border border-slate-200 hover:text-emerald-600 hover:border-emerald-300'
                                    }`}
                                    title={isCorrect ? 'Esta é a resposta correta' : 'Clique para definir como resposta correta'}
                                >
                                    {isCorrect ? (
                                        <>
                                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                                            <span>{letters[oIndex] || oIndex + 1} • Correta</span>
                                        </>
                                    ) : (
                                        <>
                                            <span className="w-3.5 h-3.5 rounded-full border border-slate-300 flex items-center justify-center text-[10px]"></span>
                                            <span>{letters[oIndex] || oIndex + 1}</span>
                                        </>
                                    )}
                                </button>

                                {/* Input do Texto da Alternativa */}
                                <input
                                    type="text"
                                    value={option.text}
                                    onChange={(e) => onOptionChange(qIndex, oIndex, e.target.value)}
                                    placeholder={`Texto da alternativa ${letters[oIndex] || oIndex + 1}...`}
                                    className={`flex-1 bg-white border rounded-xl px-3 py-2 text-sm font-medium transition-all focus:outline-none focus:ring-2 ${
                                        isCorrect
                                            ? 'border-emerald-300 focus:border-emerald-500 focus:ring-emerald-500/20 text-slate-900 font-bold'
                                            : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20 text-slate-700'
                                    }`}
                                />

                                {/* Excluir Alternativa se houver mais de 2 */}
                                {question.options.length > 2 && (
                                    <button
                                        type="button"
                                        onClick={() => onDeleteOption(qIndex, oIndex)}
                                        className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"
                                        title="Remover esta alternativa"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Botão Adicionar Alternativa */}
                {question.options.length < 5 && (
                    <button
                        type="button"
                        onClick={() => onAddOption(qIndex)}
                        className="mt-2 text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 transition-colors cursor-pointer"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Adicionar Alternativa ({question.options.length + 1} de 5)</span>
                    </button>
                )}
            </div>

            {/* Mídia & Imagem (Opcional) */}
            <div className="pt-2 border-t border-slate-100">
                {!showImageConfig ? (
                    <button
                        type="button"
                        onClick={() => setShowImageConfig(true)}
                        className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1.5 p-1 rounded-lg transition-colors cursor-pointer"
                    >
                        <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
                        <span>+ Anexar Imagem ou Link para esta Questão</span>
                    </button>
                ) : (
                    <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                <ImageIcon className="w-3.5 h-3.5 text-indigo-500" />
                                Imagem da Questão (Google Drive ou URL direta)
                            </span>
                            <button
                                type="button"
                                onClick={() => {
                                    onQuestionChange(qIndex, 'image_url', '');
                                    setShowImageConfig(false);
                                }}
                                className="text-xs text-slate-400 hover:text-rose-600"
                            >
                                Fechar anexo
                            </button>
                        </div>

                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={question.image_url || ''}
                                onChange={(e) => onQuestionChange(qIndex, 'image_url', e.target.value)}
                                placeholder="Cole o link do Google Drive ou da imagem na internet..."
                                className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                            />
                        </div>

                        {question.image_url && (
                            <div className="flex items-center gap-4 pt-1">
                                <div
                                    className="w-16 h-16 rounded-xl border border-slate-200 overflow-hidden flex items-center justify-center shrink-0"
                                    style={{ backgroundColor: question.image_bg_color || '#ffffff' }}
                                >
                                    <img
                                        src={toDirectImageUrl(question.image_url)}
                                        alt="Prévia"
                                        onError={handleDriveImageError}
                                        className="w-full h-full object-contain"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase block">Cor de Fundo da Imagem:</span>
                                    <div className="flex gap-1.5">
                                        {BG_SWATCHES.map((sw) => (
                                            <button
                                                key={sw.c}
                                                type="button"
                                                onClick={() => onQuestionChange(qIndex, 'image_bg_color', sw.c)}
                                                className={`w-5 h-5 rounded-full border transition-transform ${
                                                    (question.image_bg_color || '#ffffff') === sw.c
                                                        ? 'scale-125 ring-2 ring-indigo-500'
                                                        : 'hover:scale-110'
                                                }`}
                                                style={{ backgroundColor: sw.c }}
                                                title={sw.label}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export const QuizWizardModal = ({
    isOpen,
    onClose,
    onSave,
    initialData,
    initialTopic = '',
    initialDifficulty = 'Ensino Fundamental II - 6º ao 9º Ano (11 a 14 anos)'
}) => {
    const { tabs, questionCount: globalQuestionCount, difficultyDist: globalDifficultyDist } = useActivity();
    const { geminiService, selectedModel, apiKey } = useGemini();

    // Tab Navigation: 'editor' (com painel de IA integrado no topo) ou 'ai' (foco dedicado)
    const [activeTab, setActiveTab] = useState('editor');

    // Estado da Criação Assistida com IA
    const [aiTopic, setAiTopic] = useState('');
    const [aiLessonDetails, setAiLessonDetails] = useState('');
    const [aiGradeLevel, setAiGradeLevel] = useState(initialDifficulty);
    const [aiQuestionCount, setAiQuestionCount] = useState(10);
    const [selectedDifficultyPreset, setSelectedDifficultyPreset] = useState('balanced');
    const [customDifficultyDist, setCustomDifficultyDist] = useState({ easy: 40, medium: 40, hard: 20 });
    const [showCustomSliders, setShowCustomSliders] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);

    // Estado do Editor Manual
    const [introText, setIntroText] = useState('');
    const [questions, setQuestions] = useState([]);
    const [showRouletteSelector, setShowRouletteSelector] = useState(false);
    const [showSheetsImport, setShowSheetsImport] = useState(false);

    const rouletteTabs = (tabs || []).filter(t => t.type === 'roulette' && t.questions?.length > 0);

    // Sensors do DnD
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    // Animação das etapas da IA durante a geração
    useEffect(() => {
        let interval;
        if (isGenerating) {
            interval = setInterval(() => {
                setCurrentStepIndex(prev => (prev + 1) % QUIZ_GENERATION_STEPS.length);
            }, 2500);
        } else {
            setCurrentStepIndex(0);
        }
        return () => clearInterval(interval);
    }, [isGenerating]);

    // Inicialização ao abrir o Modal
    useEffect(() => {
        if (isOpen) {
            if (initialTopic) {
                setAiTopic(initialTopic);
            }
            if (initialDifficulty) {
                setAiGradeLevel(initialDifficulty);
            }

            if (initialData && initialData.questions && initialData.questions.length > 0) {
                // Modo Edição de Quiz Existente
                setIntroText(initialData.intro_text || '');
                const formatted = initialData.questions.map((q, qIndex) => {
                    let options = [];
                    if (q.ordered_options && q.ordered_options.length > 0) {
                        options = q.ordered_options.map((optText, oIdx) => ({
                            id: `opt_${Date.now()}_${qIndex}_${oIdx}`,
                            text: optText,
                            isCorrect: optText === q.correct_answer
                        }));
                    } else {
                        if (q.correct_answer) {
                            options.push({ text: q.correct_answer, isCorrect: true, id: `q${qIndex}_opt0` });
                        }
                        (q.distractors || []).forEach((d, dIndex) => {
                            options.push({ text: d, isCorrect: false, id: `q${qIndex}_opt${dIndex + 1}` });
                        });
                        for (let i = options.length - 1; i > 0; i--) {
                            const j = Math.floor(Math.random() * (i + 1));
                            [options[i], options[j]] = [options[j], options[i]];
                        }
                    }

                    if (options.length === 0) {
                        options = [
                            { text: '', isCorrect: true, id: `opt_${Date.now()}_0` },
                            { text: '', isCorrect: false, id: `opt_${Date.now()}_1` },
                        ];
                    } else if (!options.some(o => o.isCorrect)) {
                        options[0].isCorrect = true;
                    }

                    return {
                        id: `q-${Date.now()}-${qIndex}`,
                        statement: q.statement || '',
                        difficulty: q.difficulty || 'medium',
                        image_url: q.image_url || '',
                        image_bg_color: q.image_bg_color || 'transparent',
                        options,
                    };
                });
                setQuestions(formatted);
                setActiveTab('editor'); // Se já tem questões, foca no editor
            } else {
                // Modo Novo Quiz
                setActiveTab('editor');
                if (questions.length === 0) {
                    setQuestions([]);
                }
            }
        }
    }, [isOpen, initialData, initialTopic, initialDifficulty]);

    // Resumo de contagem das dificuldades atuais no editor
    const difficultySummary = {
        easy: questions.filter(q => q.difficulty === 'easy').length,
        medium: questions.filter(q => (!q.difficulty || q.difficulty === 'medium')).length,
        hard: questions.filter(q => q.difficulty === 'hard').length,
    };

    // Ações de Perguntas e Alternativas no Editor
    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            setQuestions(prev => {
                const oldIndex = prev.findIndex(q => q.id === active.id);
                const newIndex = prev.findIndex(q => q.id === over.id);
                return arrayMove(prev, oldIndex, newIndex);
            });
        }
    };

    const handleAddQuestion = () => {
        const newQ = {
            id: `q-${Date.now()}-${questions.length}`,
            statement: '',
            difficulty: 'medium',
            image_url: '',
            image_bg_color: 'transparent',
            options: [
                { text: '', isCorrect: true, id: `opt_${Date.now()}_0` },
                { text: '', isCorrect: false, id: `opt_${Date.now()}_1` },
                { text: '', isCorrect: false, id: `opt_${Date.now()}_2` },
                { text: '', isCorrect: false, id: `opt_${Date.now()}_3` },
            ]
        };
        setQuestions(prev => [...prev, newQ]);
        gameAudio?.playPop?.();
    };

    const handleDeleteQuestion = (qIndex) => {
        setQuestions(prev => prev.filter((_, i) => i !== qIndex));
    };

    const handleQuestionChange = (qIndex, field, value) => {
        setQuestions(prev => {
            const next = [...prev];
            next[qIndex] = { ...next[qIndex], [field]: value };
            return next;
        });
    };

    const handleOptionChange = (qIndex, oIndex, value) => {
        setQuestions(prev => {
            const next = [...prev];
            next[qIndex].options[oIndex].text = value;
            return next;
        });
    };

    const handleSetCorrect = (qIndex, oIndex) => {
        setQuestions(prev => {
            const next = [...prev];
            next[qIndex].options.forEach((o, i) => {
                o.isCorrect = i === oIndex;
            });
            return next;
        });
        gameAudio?.playClick?.();
    };

    const handleAddOption = (qIndex) => {
        setQuestions(prev => {
            const next = [...prev];
            if (next[qIndex].options.length >= 5) return next;
            next[qIndex].options.push({
                text: '',
                isCorrect: false,
                id: `opt_${Date.now()}_${next[qIndex].options.length}`
            });
            return next;
        });
    };

    const handleDeleteOption = (qIndex, oIndex) => {
        setQuestions(prev => {
            const next = [...prev];
            if (next[qIndex].options.length <= 2) return next;
            const wasCorrect = next[qIndex].options[oIndex].isCorrect;
            next[qIndex].options.splice(oIndex, 1);
            if (wasCorrect && next[qIndex].options.length > 0) {
                next[qIndex].options[0].isCorrect = true;
            }
            return next;
        });
    };

    // Importações
    const handleImportFromRoulette = (rTab) => {
        if (!rTab?.questions?.length) return;
        const converted = convertRouletteQuestionsToQuiz(rTab.questions, { mode: 'multiple_choice' });
        const newFormatted = converted.map((q, qIndex) => {
            const options = [];
            if (q.correct_answer) {
                options.push({ text: q.correct_answer, isCorrect: true, id: `imp_${Date.now()}_${qIndex}_0` });
            }
            (q.distractors || []).forEach((d, dIndex) => {
                options.push({ text: d, isCorrect: false, id: `imp_${Date.now()}_${qIndex}_${dIndex + 1}` });
            });
            return {
                id: `q-imp-${Date.now()}-${qIndex}`,
                statement: q.statement || '',
                difficulty: q.difficulty || 'medium',
                image_url: q.image_url || '',
                image_bg_color: 'transparent',
                options: options.length > 0 ? options : [
                    { text: q.correct_answer || '', isCorrect: true, id: `imp_opt_0` },
                    { text: '', isCorrect: false, id: `imp_opt_1` }
                ],
            };
        });
        setQuestions(prev => [...prev, ...newFormatted]);
        setShowRouletteSelector(false);
        toast(`+${newFormatted.length} questão(ões) importadas da "${rTab.title || 'Roleta'}"!`);
        gameAudio?.playSuccess?.();
    };

    const handleImportFromSheets = (importedQuestions) => {
        const newFormatted = importedQuestions.map((q, qIndex) => ({
            id: `q-sheets-${Date.now()}-${qIndex}`,
            statement: q.question || '',
            difficulty: q.difficulty === 'Fácil' ? 'easy' : q.difficulty === 'Difícil' ? 'hard' : 'medium',
            image_url: q.imageUrl || '',
            image_bg_color: 'transparent',
            options: [
                { text: q.answer || '', isCorrect: true, id: `imp_sht_${Date.now()}_${qIndex}_0` },
                { text: '', isCorrect: false, id: `imp_sht_${Date.now()}_${qIndex}_1` }
            ],
        }));
        setQuestions(prev => [...prev, ...newFormatted]);
        setShowSheetsImport(false);
        toast(`+${newFormatted.length} questão(ões) importadas da planilha Google!`);
        gameAudio?.playSuccess?.();
    };

    // Geração Inteligente com IA
    const handleGenerateWithAI = async () => {
        const topicToUse = aiTopic.trim();
        if (!topicToUse) {
            toast('Por favor, digite o tema central do Quiz antes de gerar.');
            return;
        }

        const distToUse = showCustomSliders
            ? customDifficultyDist
            : DIFFICULTY_PRESETS.find(p => p.id === selectedDifficultyPreset)?.dist || { easy: 40, medium: 40, hard: 20 };

        setIsGenerating(true);
        try {
            const parsedQuiz = await generateQuizActivity({
                topic: topicToUse,
                lessonDetails: aiLessonDetails.trim(),
                difficulty: aiGradeLevel,
                model: selectedModel,
                geminiService,
                questionCount: Number(aiQuestionCount) || 10,
                difficultyDist: distToUse
            });

            if (parsedQuiz && parsedQuiz.questions && parsedQuiz.questions.length > 0) {
                const newFormatted = parsedQuiz.questions.map((q, qIndex) => {
                    const opts = [
                        { text: q.correct_answer || '', isCorrect: true, id: `gen_${Date.now()}_${qIndex}_0` },
                        ...(q.distractors || []).map((d, dIdx) => ({
                            text: d || '',
                            isCorrect: false,
                            id: `gen_${Date.now()}_${qIndex}_${dIdx + 1}`
                        }))
                    ];
                    // Embaralha alternativas
                    for (let i = opts.length - 1; i > 0; i--) {
                        const j = Math.floor(Math.random() * (i + 1));
                        [opts[i], opts[j]] = [opts[j], opts[i]];
                    }
                    return {
                        id: `q-gen-${Date.now()}-${qIndex}`,
                        statement: q.statement || '',
                        difficulty: q.difficulty || 'medium',
                        image_url: '',
                        image_bg_color: 'transparent',
                        options: opts
                    };
                });

                setQuestions(newFormatted);
                if (parsedQuiz.intro_text) {
                    setIntroText(parsedQuiz.intro_text);
                }
                setActiveTab('editor'); // Muda automaticamente para a aba do editor
                gameAudio?.playSuccess?.();
                toast(`🎉 ${newFormatted.length} questões pedagógicas geradas com sucesso!`);
            } else {
                toast('Não foi possível gerar as questões. Tente novamente.');
            }
        } catch (error) {
            console.error('Erro ao gerar Quiz com IA:', error);
            toast('Ocorreu um erro ao gerar o Quiz com IA. Verifique sua chave API ou reduza a quantidade.');
        } finally {
            setIsGenerating(false);
        }
    };

    // Salvar e Finalizar
    const handleSave = () => {
        if (questions.length === 0) {
            toast('Adicione pelo menos 1 questão antes de finalizar o quiz.');
            return;
        }

        // Validação básica: verificar se há enunciado e resposta correta
        const invalidQuestion = questions.find(q => !q.statement.trim() || !q.options.some(o => o.isCorrect && o.text.trim()));
        if (invalidQuestion) {
            toast('Verifique se todas as questões possuem enunciado e pelo menos uma alternativa correta preenchida.');
            return;
        }

        try {
            const exportData = {
                intro_text: introText,
                questions: questions.map(q => {
                    const correct = q.options.find(o => o.isCorrect);
                    const distractors = q.options.filter(o => !o.isCorrect).map(o => o.text);
                    return {
                        statement: q.statement,
                        correct_answer: correct ? correct.text : (q.options[0]?.text || ''),
                        distractors: distractors || [],
                        ordered_options: q.options ? q.options.map(o => o.text) : [],
                        difficulty: q.difficulty || 'medium',
                        image_url: q.image_url ? toDirectImageUrl(q.image_url.trim()) : undefined,
                        image_bg_color: q.image_bg_color && q.image_bg_color !== 'transparent' ? q.image_bg_color : undefined,
                    };
                }),
            };
            onSave(exportData);
            onClose();
        } catch (e) {
            console.error('Error in handleSave:', e);
            toast('Ocorreu um erro ao salvar o quiz.');
        }
    };

    const footer = (
        <div className="flex flex-col sm:flex-row items-center justify-between w-full gap-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
                <span>{questions.length} questões no total</span>
                {questions.length > 0 && (
                    <span className="text-[11px] text-slate-400 font-medium">
                        ({difficultySummary.easy} fáceis • {difficultySummary.medium} médias • {difficultySummary.hard} difíceis)
                    </span>
                )}
            </div>
            <div className="flex items-center gap-3">
                <Button onClick={onClose} variant="secondary" className="rounded-2xl">
                    Cancelar
                </Button>
                <Button
                    onClick={handleSave}
                    icon={Save}
                    className="rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-['Fredoka'] text-sm px-6 shadow-lg shadow-indigo-500/20 hover:brightness-105"
                >
                    Salvar e Gerar Atividade
                </Button>
            </div>
        </div>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Estúdio de Quiz & Avaliações"
            icon={BrainCircuit}
            size="xl"
            footer={footer}
        >
            <div className="space-y-6">
                {/* Abas Superiores Estilizadas */}
                <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
                    <div className="flex p-1.5 bg-slate-200/60 rounded-2xl gap-1">
                        <button
                            type="button"
                            onClick={() => setActiveTab('ai')}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer font-['Fredoka'] tracking-wide ${
                                activeTab === 'ai'
                                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/20'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                            }`}
                        >
                            <Sparkles className="w-4 h-4" />
                            <span>✨ Gerar com IA</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('editor')}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer font-['Fredoka'] tracking-wide ${
                                activeTab === 'editor'
                                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/20'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                            }`}
                        >
                            <Edit3 className="w-4 h-4" />
                            <span>✏️ Editor & Questões ({questions.length})</span>
                        </button>
                    </div>

                    <div className="hidden md:flex items-center gap-2 text-xs font-semibold text-slate-400">
                        <span>Mascote Drácker & Avaliações Gamificadas</span>
                    </div>
                </div>

                {/* ─────────────────────────────────────────────────────────────
                    ABA 1: GERAÇÃO INTELIGENTE COM IA
                   ───────────────────────────────────────────────────────────── */}
                {activeTab === 'ai' && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        <GlobalAIGeneratorPanel
                            itemTypeLabel="questões"
                            topic={aiTopic}
                            onTopicChange={setAiTopic}
                            context={aiLessonDetails}
                            onContextChange={setAiLessonDetails}
                            gradeLevel={aiGradeLevel}
                            onGradeLevelChange={setAiGradeLevel}
                            itemCount={aiQuestionCount}
                            onItemCountChange={setAiQuestionCount}
                            difficultyDist={customDifficultyDist}
                            onDifficultyDistChange={setCustomDifficultyDist}
                            onGenerate={handleGenerateWithAI}
                            isGenerating={isGenerating}
                            collapsible={false}
                            defaultExpanded={true}
                        />
                    </div>
                )}

                {/* ─────────────────────────────────────────────────────────────
                    ABA 2: EDITOR MANUAL & REVISÃO DE QUESTÕES
                   ───────────────────────────────────────────────────────────── */}
                {activeTab === 'editor' && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        {/* Painel Global de Geração com IA integrado no topo do Estúdio */}
                        <GlobalAIGeneratorPanel
                            itemTypeLabel="questões"
                            topic={aiTopic}
                            onTopicChange={setAiTopic}
                            context={aiLessonDetails}
                            onContextChange={setAiLessonDetails}
                            gradeLevel={aiGradeLevel}
                            onGradeLevelChange={setAiGradeLevel}
                            itemCount={aiQuestionCount}
                            onItemCountChange={setAiQuestionCount}
                            difficultyDist={customDifficultyDist}
                            onDifficultyDistChange={setCustomDifficultyDist}
                            onGenerate={handleGenerateWithAI}
                            isGenerating={isGenerating}
                            collapsible={true}
                            defaultExpanded={questions.length === 0}
                        />

                        {/* Barra de Ações Rápidas do Editor */}
                        <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-3xl border-2 border-slate-200">
                            <div className="flex items-center gap-2">
                                <Button
                                    type="button"
                                    onClick={handleAddQuestion}
                                    icon={Plus}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold font-['Fredoka']"
                                >
                                    Nova Questão
                                </Button>
                                <Button
                                    type="button"
                                    onClick={() => setShowSheetsImport(true)}
                                    icon={FileSpreadsheet}
                                    variant="secondary"
                                    className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200 rounded-2xl text-xs font-bold"
                                >
                                    Importar Planilha
                                </Button>
                                {rouletteTabs.length > 0 && (
                                    <div className="relative">
                                        <Button
                                            type="button"
                                            onClick={() => setShowRouletteSelector(!showRouletteSelector)}
                                            icon={Dices}
                                            variant="secondary"
                                            className="bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200 rounded-2xl text-xs font-bold"
                                        >
                                            Importar da Roleta ({rouletteTabs.length})
                                        </Button>
                                        {showRouletteSelector && (
                                            <div className="absolute left-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 p-2 space-y-1">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase px-2 block">
                                                    Escolha a Roleta:
                                                </span>
                                                {rouletteTabs.map((rTab) => (
                                                    <button
                                                        key={rTab.id}
                                                        type="button"
                                                        onClick={() => handleImportFromRoulette(rTab)}
                                                        className="w-full text-left p-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                                                    >
                                                        {rTab.title || 'Roleta sem título'} ({rTab.questions.length}q)
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-500">
                                    Total: <strong className="text-indigo-600">{questions.length}</strong>
                                </span>
                            </div>
                        </div>

                        {/* Texto Introdutório */}
                        <Card className="p-4 rounded-3xl border-2 border-slate-200 space-y-2">
                            <label className="text-xs font-black text-slate-700 uppercase tracking-wider block">
                                Texto Introdutório do Quiz
                                <span className="ml-2 text-xs font-normal text-slate-400">
                                    (Aparece no cabeçalho antes das perguntas)
                                </span>
                            </label>
                            <TextArea
                                value={introText}
                                onChange={(e) => setIntroText(e.target.value)}
                                placeholder="Escreva uma contextualização ou instrução inicial para a turma..."
                                className="min-h-[70px] text-xs bg-slate-50 border-slate-200 focus:bg-white rounded-2xl"
                            />
                        </Card>

                        {/* Lista Ordenável de Questões */}
                        {questions.length === 0 ? (
                            <div className="p-12 text-center bg-white rounded-3xl border-2 border-dashed border-slate-200 space-y-3">
                                <BrainCircuit className="w-12 h-12 text-slate-300 mx-auto" />
                                <h4 className="font-['Fredoka'] font-black text-lg text-slate-700">
                                    Nenhuma questão cadastrada ainda
                                </h4>
                                <p className="text-xs text-slate-400 max-w-md mx-auto">
                                    Você pode gerar questões automaticamente na aba <strong>"✨ Gerar com IA"</strong> ou clicar no botão abaixo para adicionar manualmente.
                                </p>
                                <div className="pt-2">
                                    <Button
                                        type="button"
                                        onClick={handleAddQuestion}
                                        icon={Plus}
                                        className="rounded-2xl bg-indigo-600 text-white font-bold"
                                    >
                                        Adicionar Primeira Questão
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <DndContext
                                sensors={sensors}
                                collisionDetection={closestCenter}
                                onDragEnd={handleDragEnd}
                            >
                                <SortableContext
                                    items={questions.map(q => q.id)}
                                    strategy={verticalListSortingStrategy}
                                >
                                    <div className="space-y-4">
                                        {questions.map((q, qIndex) => (
                                            <SortableQuestionCard
                                                key={q.id}
                                                id={q.id}
                                                question={q}
                                                qIndex={qIndex}
                                                onQuestionChange={handleQuestionChange}
                                                onDeleteQuestion={handleDeleteQuestion}
                                                onOptionChange={handleOptionChange}
                                                onSetCorrect={handleSetCorrect}
                                                onAddOption={handleAddOption}
                                                onDeleteOption={handleDeleteOption}
                                            />
                                        ))}
                                    </div>
                                </SortableContext>
                            </DndContext>
                        )}
                    </div>
                )}
            </div>

            {/* Modal de Importação do Google Sheets */}
            {showSheetsImport && (
                <GoogleSheetsImportModal
                    isOpen={showSheetsImport}
                    onClose={() => setShowSheetsImport(false)}
                    mode="import"
                    onImport={handleImportFromSheets}
                />
            )}
        </Modal>
    );
};

export default QuizWizardModal;
