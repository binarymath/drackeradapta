import React, { useState, useEffect, useRef } from 'react';
import { 
    User, HelpCircle, Sparkles, CheckCircle, XCircle, RotateCcw, 
    Eye, EyeOff, Shuffle, ListOrdered, Users, HeartHandshake, Award,
    RotateCw, Lightbulb, ThumbsUp, Check, X, AlertTriangle, Type, ZoomIn, ZoomOut,
    Minimize2, Maximize2, Edit3, AlignLeft, AlignCenter, AlignRight, AlignJustify
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { gameAudio } from '../../utils/gameAudio';
import { getDirectImageUrl, handleDriveImageError, renderQuestionText } from '../../utils/urlUtils';
import { RouletteTimerBomb } from './RouletteTimerBomb';
import { StudentSelectorModal } from './card-modals/StudentSelectorModal';
import { QuestionSelectorModal } from './card-modals/QuestionSelectorModal';
import { RouletteModeTodosRespondem } from './card-modals/RouletteModeTodosRespondem';
import { RouletteModeAjuda } from './card-modals/RouletteModeAjuda';
import { QuestionEditModal } from './card-modals/QuestionEditModal';

// Configuração de Escala de Fonte para Projeção e Acessibilidade Visual
// A escala de fonte agora é 100% por padrão e varia de 5% em 5%

export const RouletteCard = ({ 
    winner, 
    allQuestions = [], 
    usedQuestions = new Set(), 
    activeStudents = [], 
    allStudents = [],
    availableHelpers = [],
    onChangeQuestion, 
    onEditQuestionContent,
    onChangeStudent,
    onCorrect, 
    onIncorrect, 
    onSpinAgain, 
    onAbsent,
    onBatchResult,
    onHelpResult,
    onGroupResult,
    showDifficulty = true,
    onToggleDifficulty,
    onTimerExplode = null,
    onRevealAnswer = null,
    onRevealHint = null,
    onOpenSidebar
}) => {
    // Calculo dinâmico do tamanho do nome para evitar que quebre muito o layout
    const nameLength = winner?.name?.length || 0;
    const nameSizeClass = nameLength > 25 
        ? "text-2xl sm:text-3xl md:text-4xl" 
        : nameLength > 15 
            ? "text-3xl sm:text-4xl md:text-5xl" 
            : "text-4xl sm:text-5xl md:text-6xl";

    // Controle de Tamanho de Fonte para Acessibilidade / Lousa / Projetor
    const [fontScale, setFontScale] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('preferred_roulette_font_scale');
            if (saved !== null) {
                const parsed = parseInt(saved, 10);
                if (!isNaN(parsed) && parsed >= 50 && parsed <= 300) return parsed;
            }
        }
        return 100;
    });

    const handleIncreaseFont = () => {
        setFontScale(prev => {
            const next = Math.min(300, prev + 5);
            try { localStorage.setItem('preferred_roulette_font_scale', String(next)); } catch (e) {}
            gameAudio.playTick();
            return next;
        });
    };

    const handleDecreaseFont = () => {
        setFontScale(prev => {
            const next = Math.max(50, prev - 5);
            try { localStorage.setItem('preferred_roulette_font_scale', String(next)); } catch (e) {}
            gameAudio.playTick();
            return next;
        });
    };

    const handleResetFont = () => {
        setFontScale(100);
        try { localStorage.setItem('preferred_roulette_font_scale', '100'); } catch (e) {}
        gameAudio.playTick();
    };

    const [textAligns, setTextAligns] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('preferred_roulette_question_aligns_v2');
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    if (typeof parsed === 'object' && parsed !== null) return parsed;
                } catch(e) {}
            }
        }
        return {};
    });

    const currentTextAlign = textAligns[winner?.question] || 'text-left';

    const handleSetAlign = (alignClass) => {
        setTextAligns(prev => {
            const next = { ...prev, [winner?.question]: alignClass };
            try { localStorage.setItem('preferred_roulette_question_aligns_v2', JSON.stringify(next)); } catch(e){}
            return next;
        });
        gameAudio.playTick();
    };

    // Modo de Exibição do Cronômetro Bomba: 'normal' (como está) | 'minimized' (separado no canto) | 'maximized' (destaque grande)
    const [timerViewMode, setTimerViewMode] = useState(() => {
        try {
            return localStorage.getItem('preferred_roulette_timer_mode') || 'normal';
        } catch (e) {
            return 'normal';
        }
    });

    // Modos de Exibição do Card: 'normal' | 'todos_respondem' | 'preciso_de_ajuda'
    const [cardMode, setCardMode] = useState('normal');
    
    // Suporte a Representante/Porta-Voz quando for atividade em grupo
    const [selectedSpokesperson, setSelectedSpokesperson] = useState(null);
    const [isDrawingSpokesperson, setIsDrawingSpokesperson] = useState(false);

    const handleDrawSpokesperson = () => {
        const members = winner?.members || [];
        if (members.length === 0) return;
        setIsDrawingSpokesperson(true);
        let counter = 0;
        const total = 12;
        const interval = setInterval(() => {
            const random = members[Math.floor(Math.random() * members.length)];
            setSelectedSpokesperson(random);
            gameAudio.playTick();
            counter++;
            if (counter >= total) {
                clearInterval(interval);
                setIsDrawingSpokesperson(false);
                gameAudio.playSuccess();
            }
        }, 80);
    };
    
    // Visualização da Resposta Esperada
    const [showAnswer, setShowAnswer] = useState(false);
    const [showAlternatives, setShowAlternatives] = useState(false);
    
    // Modal de Edição Completa da Pergunta
    const [showQuestionEditModal, setShowQuestionEditModal] = useState(false);

    const handleStartEditing = () => {
        setShowQuestionEditModal(true);
    };

    const handleSaveEditing = (updatedQuestionData) => {
        if (onEditQuestionContent) {
            onEditQuestionContent(updatedQuestionData);
        }
        setShowQuestionEditModal(false);
    };
    
    // Modal interno para selecionar pergunta da lista
    const [showQuestionSelector, setShowQuestionSelector] = useState(false);

    // Modal interno para selecionar outro aluno da turma
    const [showStudentSelector, setShowStudentSelector] = useState(false);

    // Troca aleatória para outro aluno presente na turma
    const handleNextStudentRandom = () => {
        const pool = (allStudents.length > 0 ? allStudents : activeStudents)
            .filter(s => s.id !== winner.id && s.status !== 'absent');
        if (pool.length === 0) return;
        const nextStudent = pool[Math.floor(Math.random() * pool.length)];
        if (onChangeStudent) {
            onChangeStudent(nextStudent, 'random');
            setShowStudentSelector(false);
            gameAudio.playTick();
        }
    };

    // Troca direta por aluno selecionado na grade
    const handleSelectSpecificStudent = (student) => {
        if (onChangeStudent) {
            onChangeStudent(student, 'specific');
            setShowStudentSelector(false);
            gameAudio.playTick();
        }
    };

    // ==========================================
    // ESTADOS: TODOS RESPONDEM
    // ==========================================
    const [showSelectionGrid, setShowSelectionGrid] = useState(false);
    const [studentStatuses, setStudentStatuses] = useState(() => {
        const initial = {};
        const studentsList = (allStudents && allStudents.length > 0) ? allStudents.filter(s => s.status !== 'absent') : activeStudents;
        studentsList.forEach(s => initial[s.id] = 'correct');
        return initial;
    });

    // Atualiza a seleção padrão quando a lista de alunos mudar
    useEffect(() => {
        setStudentStatuses(prev => {
            const next = { ...prev };
            let changed = false;
            const studentsList = (allStudents && allStudents.length > 0) ? allStudents.filter(s => s.status !== 'absent') : activeStudents;
            studentsList.forEach(s => {
                if (!next[s.id]) {
                    next[s.id] = 'correct';
                    changed = true;
                }
            });
            return changed ? next : prev;
        });
    }, [activeStudents, allStudents]);

    // ==========================================
    // ESTADOS: PRECISO DE AJUDA
    // ==========================================
    const [helpTab, setHelpTab] = useState('colleague'); // 'colleague' | 'hint' | 'class'
    const [helperStudent, setHelperStudent] = useState(null);
    const [isDrawingHelper, setIsDrawingHelper] = useState(false);
    const [drawingNameDisplay, setDrawingNameDisplay] = useState('');
    const [showHintRevealed, setShowHintRevealed] = useState(false);

    // Sorteio animado de Colega Ajudante
    const handleDrawHelper = () => {
        const helpersPool = availableHelpers.length > 0 ? availableHelpers : activeStudents;
        const potentialHelpers = helpersPool.filter(s => s.id !== winner.id && s.status !== 'absent');
        if (potentialHelpers.length === 0) return;

        setIsDrawingHelper(true);
        gameAudio.playHelp();

        let counter = 0;
        const totalCycles = 16;
        const interval = setInterval(() => {
            const randomSample = potentialHelpers[Math.floor(Math.random() * potentialHelpers.length)];
            setDrawingNameDisplay(randomSample.name);
            gameAudio.playTick();
            counter++;

            if (counter >= totalCycles) {
                clearInterval(interval);
                const finalHelper = potentialHelpers[Math.floor(Math.random() * potentialHelpers.length)];
                setHelperStudent(finalHelper);
                setIsDrawingHelper(false);
                gameAudio.playSuccess();
            }
        }, 80);
    };

    // ==========================================
    // CONFETES AO ABRIR
    // ==========================================
    useEffect(() => {
        gameAudio.playSuccess();
        const end = Date.now() + 1.8 * 1000;
        const colors = ['#f59e0b', '#10b981', '#6366f1', '#ec4899', '#3b82f6'];

        (function frame() {
            confetti({
                particleCount: 4,
                angle: 60,
                spread: 60,
                origin: { x: 0 },
                colors: colors
            });
            confetti({
                particleCount: 4,
                angle: 120,
                spread: 60,
                origin: { x: 1 },
                colors: colors
            });

            if (Date.now() < end) {
                requestAnimationFrame(frame);
            }
        }());
    }, []);

    // ==========================================
    // TROCAR PERGUNTA
    // ==========================================
    const currentIndex = allQuestions.findIndex(q => q.question === winner.question);
    const isCurrentQuestionUsed = usedQuestions.has(winner.question);

    const handleNextQuestion = () => {
        if (!allQuestions || allQuestions.length === 0) return;
        gameAudio.playTick();

        // 1. Tentar pegar uma pergunta que ainda NÃO foi usada
        const unused = allQuestions.filter(q => !usedQuestions.has(q.question) && q.question !== winner.question);
        
        let nextQ;
        if (unused.length > 0) {
            // Sorteia uma não usada
            nextQ = unused[Math.floor(Math.random() * unused.length)];
        } else {
            // Se todas já foram usadas, pega a próxima da lista circularmente
            const nextIdx = (currentIndex + 1) % allQuestions.length;
            nextQ = allQuestions[nextIdx];
        }

        if (nextQ && onChangeQuestion) {
            onChangeQuestion(nextQ, 'random');
            setShowAnswer(false);
            setShowHintRevealed(false);
        }
    };

    const handleSelectSpecificQuestion = (q) => {
        if (onChangeQuestion) {
            onChangeQuestion(q, 'specific');
            setShowAnswer(false);
            setShowHintRevealed(false);
            setShowQuestionSelector(false);
            gameAudio.playTick();
        }
    };

    // Pista mascarada da resposta (ex: Primeiras letras visíveis)
    // Pista mascarada da resposta (ex: Primeiras letras visíveis)
    const getMaskedHint = (answerText) => {
        if (!answerText) return 'Sem resposta cadastrada.';
        return answerText.split(' ').map(word => {
            if (word.length <= 2) return word;
            return word[0] + ' _ '.repeat(word.length - 2) + word[word.length - 1];
        }).join('   ');
    };

    // Dificuldade da pergunta com cores intuitivas
    const getDifficultyBadge = (diff) => {
        const d = (diff || 'Média').toLowerCase();
        if (d.includes('fácil') || d.includes('facil') || d.includes('easy')) {
            return {
                label: 'Fácil',
                color: 'bg-emerald-50 text-emerald-800 border-emerald-300',
                dot: 'bg-emerald-500'
            };
        }
        if (d.includes('difícil') || d.includes('dificil') || d.includes('hard')) {
            return {
                label: 'Difícil',
                color: 'bg-rose-50 text-rose-800 border-rose-300',
                dot: 'bg-rose-500'
            };
        }
        return {
            label: 'Média',
            color: 'bg-amber-50 text-amber-800 border-amber-300',
            dot: 'bg-amber-500'
        };
    };

    // Rastreamento se o aluno sorteado já teve algum tipo de ajuda
    const helpEntries = (winner?.history || []).filter(h => 
        h.result === 'help_correct' || h.hadHelp || h.helperName || (h.question && h.question.includes('(com ajuda')) || (h.question && h.question.includes('[Ajuda:'))
    );
    const hadHelp = helpEntries.length > 0 || !!winner?.hadHelp || (winner?.helpCount && winner?.helpCount > 0);
    const helpCount = Math.max(helpEntries.length, winner?.helpCount || 0);
    const lastHelper = helpEntries[helpEntries.length - 1]?.helperName;

    // Rastreamento se o aluno sorteado já ajudou colegas
    const helpedEntries = (winner?.history || []).filter(h => h.helpedStudent || h.isHelperRole);
    const helpedCount = Math.max(helpedEntries.length, winner?.helpedCount || 0);
    const lastHelped = helpedEntries[helpedEntries.length - 1]?.helpedStudent;
    const [isCardMinimized, setIsCardMinimized] = useState(false);
    const renderQuestionControlBar = () => (
        <div className="bg-black/15 border-t border-white/20 mt-4 -mx-4 -mb-3 sm:-mx-6 sm:-mb-4 px-4 py-2.5 sm:px-6 flex items-center justify-between gap-2 shrink-0 relative z-10 w-full text-white">
            <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-white bg-black/20 border border-white/10 px-2.5 py-1 rounded-lg shadow-2xs">
                    {allQuestions.length > 0 ? `Pergunta ${currentIndex >= 0 ? currentIndex + 1 : 1} de ${allQuestions.length}` : 'Pergunta'}
                </span>

                {showDifficulty && (() => {
                    const badge = getDifficultyBadge(winner.difficulty);
                    return (
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border border-white/20 flex items-center gap-1.5 shadow-2xs ${badge.color === 'bg-emerald-100 text-emerald-800 border-emerald-200' ? 'bg-emerald-500/20 text-emerald-100 border-emerald-500/30' : 'bg-black/20 text-white border-white/10'}`}>
                            <span className={`w-2 h-2 rounded-full ${badge.dot}`}></span>
                            <span>{badge.label}</span>
                        </span>
                    );
                })()}

                {onToggleDifficulty && (
                    <button
                        onClick={onToggleDifficulty}
                        className="text-white/60 hover:text-white p-1 rounded-lg hover:bg-white/20 transition-colors"
                        title={showDifficulty ? 'Dificuldade visível (clique para ocultar)' : 'Dificuldade oculta (clique para exibir)'}
                    >
                        {showDifficulty ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    </button>
                )}

                {isCurrentQuestionUsed && (
                    <span className="text-2xs font-black bg-amber-500/20 text-amber-200 border border-amber-500/30 px-2 py-0.5 rounded-md flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-amber-400" /> Já respondida
                    </span>
                )}
            </div>

            <div className="flex items-center gap-2 flex-wrap justify-end">
                {cardMode === 'normal' && !winner?.isGroup && onChangeStudent && (
                    <>
                        <button
                            type="button"
                            onClick={handleNextStudentRandom}
                            className="flex items-center gap-1.5 text-xs font-bold text-white bg-white/10 hover:bg-white/20 border border-white/20 px-3 py-1.5 rounded-xl transition-all active:scale-95 shadow-2xs cursor-pointer"
                            title="Sortear outro aluno para responder a esta pergunta"
                        >
                            <Shuffle className="w-3.5 h-3.5 text-white" />
                            <span className="hidden sm:inline">Outro Aluno</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setShowStudentSelector(!showStudentSelector)}
                            className="flex items-center gap-1.5 text-xs font-bold text-white bg-white/10 hover:bg-white/20 border border-white/20 px-3 py-1.5 rounded-xl transition-all active:scale-95 shadow-2xs cursor-pointer"
                            title="Escolher outro aluno da turma para responder"
                        >
                            <Users className="w-3.5 h-3.5 text-white" />
                            <span>{showStudentSelector ? 'Fechar Lista' : 'Trocar Aluno'}</span>
                        </button>
                    </>
                )}

                <button
                    onClick={handleNextQuestion}
                    className="flex items-center gap-1.5 text-xs font-bold text-white bg-white/20 hover:bg-white/30 border border-white/20 px-3 py-1.5 rounded-xl transition-all active:scale-95 shadow-2xs cursor-pointer"
                    title="Sortear outra pergunta diferente para este aluno"
                >
                    <Shuffle className="w-3.5 h-3.5 text-white" />
                    <span>Outra Pergunta</span>
                </button>

                <button
                    onClick={() => setShowQuestionSelector(!showQuestionSelector)}
                    className="flex items-center gap-1.5 text-xs font-bold text-white bg-white/10 hover:bg-white/20 border border-white/20 px-3 py-1.5 rounded-xl transition-all active:scale-95 shadow-2xs cursor-pointer"
                    title="Ver lista de todas as perguntas disponíveis"
                >
                    <ListOrdered className="w-3.5 h-3.5 text-white" />
                    <span className="hidden sm:inline">Escolher da Lista</span>
                </button>
                
                {onOpenSidebar && (
                    <button
                        onClick={onOpenSidebar}
                        className="flex items-center gap-1.5 text-xs font-bold text-white bg-white/10 hover:bg-white/20 border border-white/20 px-3 py-1.5 rounded-xl transition-all active:scale-95 shadow-2xs cursor-pointer"
                        title="Abrir placar e lista de alunos"
                    >
                        <Users className="w-3.5 h-3.5 text-white" />
                        <span className="hidden sm:inline">Placar</span>
                    </button>
                )}
            </div>
        </div>
    );


    return (
        <>
        <div className={`fixed z-50 transition-all duration-300 ease-in-out ${
            isCardMinimized 
                ? 'bottom-4 left-4 right-auto top-auto w-auto h-auto' 
                : 'inset-0 flex items-center justify-center p-2 sm:p-3 md:p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in'
        }`}>
            {/* WIDGET MINIMIZADO */}
            {isCardMinimized && (
                <div className="bg-white rounded-2xl shadow-2xl border-4 border-amber-400 p-3 w-[280px] sm:w-[320px] flex flex-col gap-2 animate-in slide-in-from-bottom-5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                            <span className="text-xl leading-none">🎯</span>
                            <div className="flex flex-col min-w-0">
                                <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Respondendo:</span>
                                <span className="text-sm font-black text-slate-800 truncate">{winner.name}</span>
                            </div>
                        </div>
                        <button onClick={() => setIsCardMinimized(false)} className="shrink-0 p-1.5 bg-slate-100 hover:bg-indigo-100 text-slate-500 hover:text-indigo-600 rounded-xl transition-colors cursor-pointer" title="Expandir card">
                            <Maximize2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* CONTAINER FLEX: ACOPLA O CARD DO ALUNO E O CRONÔMETRO LADO A LADO COM A MESMA ALTURA */}
            <div className={`mx-auto items-stretch transition-all duration-300 ${
                isCardMinimized 
                    ? 'hidden' 
                    : `flex flex-col lg:flex-row h-[92vh] max-h-[92vh] ${timerViewMode === 'normal' ? 'w-[96vw] max-w-[1560px] gap-2.5 sm:gap-3' : 'w-[90vw] max-w-[1150px] gap-0'}`
            }`}>
                
                {/* ============================================================ */}
                {/* 1. CARD PRINCIPAL DO ALUNO SORTEADO */}
                {/* ============================================================ */}
                <div className="bg-white rounded-3xl shadow-2xl flex-1 min-w-0 h-full overflow-hidden animate-in zoom-in-95 duration-300 relative border-4 border-amber-400 flex flex-col transition-all">
                
                {/* ============================================================ */}
                {/* CABEÇALHO DINÂMICO CONFORME O MODO ATIVO */}
                {/* ============================================================ */}
                {cardMode === 'normal' && (
                    winner.isGroup ? (
                        /* CABEÇALHO DO MODO GRUPOS / EQUIPES */
                        <div 
                            className="px-4 py-3 sm:px-6 sm:py-4 text-center relative overflow-hidden shrink-0 shadow-sm text-white"
                            style={{
                                background: winner.color 
                                    ? `linear-gradient(135deg, ${winner.color} 0%, #1e1b4b 100%)` 
                                    : 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)'
                            }}
                        >
                            <div className="absolute top-0 left-0 w-full h-full opacity-15 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
                            <Sparkles className="w-8 h-8 text-white/40 absolute top-3 left-4 animate-pulse" />
                            <Sparkles className="w-6 h-6 text-white/40 absolute bottom-3 right-4 animate-pulse" />
                            
                            <div className="flex flex-col gap-2 relative z-10 mb-2 w-full">
                                {/* Controles: Minimizar, Cronômetro (ACIMA) */}
                                <div className="flex items-center justify-between gap-1.5 flex-wrap w-full">
                                    <div className="flex items-center gap-1.5">
                                        {/* Botão Minimizar Card Inteiro */}
                                        <button
                                            type="button"
                                            onClick={() => setIsCardMinimized(true)}
                                            className="flex items-center gap-1 bg-black/20 hover:bg-black/40 text-white border border-white/25 rounded-xl px-2.5 py-1 shadow-2xs backdrop-blur-xs text-xs font-bold transition-all cursor-pointer"
                                            title="Minimizar card para ver a roleta"
                                        >
                                            <Minimize2 className="w-3.5 h-3.5 text-amber-200" />
                                            <span className="hidden sm:inline">Minimizar</span>
                                        </button>
                                        
                                        {/* LEGENDA DA EQUIPE */}
                                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/30 text-white text-xs font-black uppercase tracking-widest backdrop-blur-sm border border-white/20">
                                            <Users className="w-3.5 h-3.5 text-amber-300" />
                                            <span className="hidden sm:inline">Equipe / Grupo Sorteado</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-end gap-1.5 flex-wrap">
                                        {/* Chip para reacoplar cronômetro se minimizado */}
                                        {timerViewMode === 'minimized' && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setTimerViewMode('normal');
                                                    try { localStorage.setItem('preferred_roulette_timer_mode', 'normal'); } catch (e) {}
                                                }}
                                                className="flex items-center gap-1 text-xs font-black text-slate-950 bg-amber-400 hover:bg-amber-300 px-2.5 py-1 rounded-xl transition-all active:scale-95 shadow-xs cursor-pointer animate-in fade-in"
                                                title="Acoplar cronômetro de volta ao lado direito do card"
                                            >
                                                <span>💣</span>
                                                <span className="hidden sm:inline">Acoplar Cronômetro</span>
                                            </button>
                                        )}

                                    <button
                                        type="button"
                                        onClick={() => setSelectedSpokesperson(null)}
                                        className={`text-xs font-bold px-2.5 py-1 rounded-xl transition-all shadow-xs cursor-pointer ${
                                            !selectedSpokesperson 
                                                ? 'bg-white text-slate-900 font-black' 
                                                : 'bg-white/20 text-white hover:bg-white/30'
                                        }`}
                                        title="Todos do grupo respondem juntos"
                                    >
                                        👥 Grupo Todo
                                    </button>
                                    <button
                                        type="button"
                                        disabled={isDrawingSpokesperson || !winner.members || winner.members.length === 0}
                                        onClick={handleDrawSpokesperson}
                                        className="flex items-center gap-1 text-xs font-black bg-amber-400 hover:bg-amber-300 text-slate-950 px-2.5 py-1 rounded-xl transition-all shadow-xs active:scale-95 cursor-pointer disabled:opacity-50"
                                        title="Sortear um aluno deste grupo para ser o porta-voz"
                                    >
                                        <Shuffle className="w-3.5 h-3.5 text-slate-950" />
                                        <span>{isDrawingSpokesperson ? 'Sorteando...' : 'Sortear Porta-Voz'}</span>
                                    </button>
                                </div>
                                </div>
                                

                            </div>

                            <h1 className={`${nameSizeClass} font-black text-white drop-shadow-md flex items-center justify-center gap-3 relative z-10 transition-all text-center mt-2`}>
                                <Users className="w-8 h-8 sm:w-9 sm:h-9 text-amber-300 shrink-0" />
                                <span>{winner.name}</span>
                            </h1>

                            {/* Lista de Integrantes da Equipe */}
                            <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5 relative z-10">
                                <span className="text-2xs uppercase tracking-wider text-white/70 font-black mr-1">Integrantes:</span>
                                {(winner.members || []).length === 0 ? (
                                    <span className="text-xs text-white/80 italic">Sem alunos atribuídos a este grupo</span>
                                ) : (
                                    (winner.members || []).map(member => {
                                        const isRep = selectedSpokesperson?.id === member.id;
                                        return (
                                            <button
                                                key={member.id}
                                                type="button"
                                                onClick={() => setSelectedSpokesperson(isRep ? null : member)}
                                                className={`text-xs font-bold px-2.5 py-0.5 rounded-full border transition-all cursor-pointer flex items-center gap-1 ${
                                                    isRep 
                                                        ? 'bg-amber-400 text-slate-950 border-amber-300 font-black shadow-sm ring-2 ring-white/60 scale-105' 
                                                        : 'bg-black/30 hover:bg-black/50 text-white border-white/20'
                                                }`}
                                                title={isRep ? "Porta-voz da rodada" : "Clique para selecionar como porta-voz"}
                                            >
                                                {isRep && <span>⭐</span>}
                                                <span>{member.name}</span>
                                            </button>
                                        );
                                    })
                                )}
                            </div>

                            {selectedSpokesperson && (
                                <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400 text-slate-950 text-xs font-black shadow-xs animate-in zoom-in-95">
                                    <span>⭐ Porta-voz da rodada:</span>
                                    <strong>{selectedSpokesperson.name}</strong>
                                </div>
                            )}
                            
                            {renderQuestionControlBar()}
                        </div>
                    ) : (
                        /* CABEÇALHO DO MODO INDIVIDUAL */
                        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 px-4 py-3 sm:px-6 sm:py-4 text-center relative overflow-hidden shrink-0 shadow-sm">
                            <div className="absolute top-0 left-0 w-full h-full opacity-15 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
                            <Sparkles className="w-8 h-8 text-amber-200/60 absolute top-3 left-4 animate-pulse" />
                            <Sparkles className="w-6 h-6 text-amber-200/60 absolute bottom-3 right-4 animate-pulse" />
                            
                            <div className="flex flex-col gap-2 relative z-10 mb-1.5 w-full">
                                {/* Controles (ACIMA) */}
                                <div className="flex items-center justify-between gap-1.5 flex-wrap w-full">
                                    <div className="flex items-center gap-1.5">
                                        {/* Botão Minimizar Card Inteiro */}
                                        <button
                                            type="button"
                                            onClick={() => setIsCardMinimized(true)}
                                            className="flex items-center gap-1 bg-black/20 hover:bg-black/40 text-white border border-white/25 rounded-xl px-2.5 py-1 shadow-2xs backdrop-blur-xs text-xs font-bold transition-all cursor-pointer"
                                            title="Minimizar card para ver a roleta"
                                        >
                                            <Minimize2 className="w-3.5 h-3.5 text-amber-200" />
                                            <span className="hidden sm:inline">Minimizar</span>
                                        </button>
                                        
                                        {/* LEGENDA DO ALUNO */}
                                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/20 text-amber-100 text-xs font-black uppercase tracking-widest backdrop-blur-sm shadow-sm border border-black/10">
                                            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                                            <span className="hidden sm:inline">Aluno Sorteado</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-end gap-1.5 flex-wrap">
                                        {/* Chip para reacoplar cronômetro se minimizado */}
                                        {timerViewMode === 'minimized' && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setTimerViewMode('normal');
                                                    try { localStorage.setItem('preferred_roulette_timer_mode', 'normal'); } catch (e) {}
                                                }}
                                                className="flex items-center gap-1 text-xs font-black text-slate-950 bg-amber-300 hover:bg-amber-200 px-2.5 py-1 rounded-xl transition-all active:scale-95 shadow-xs cursor-pointer animate-in fade-in"
                                                title="Acoplar cronômetro de volta ao lado direito do card"
                                            >
                                                <span>💣</span>
                                                <span className="hidden sm:inline">Acoplar Cronômetro</span>
                                            </button>
                                        )}



                                </div>
                                </div>

                            </div>

                            <h1 className={`${nameSizeClass} font-black text-white drop-shadow-md flex items-center justify-center gap-3 relative z-10 flex-wrap transition-all text-center mt-2`}>
                                <User className="w-8 h-8 sm:w-9 sm:h-9 text-amber-200 shrink-0" />
                                <span>{winner.name}</span>
                                {winner.groupName && (
                                    <span 
                                        className="text-xs font-bold px-2.5 py-1 rounded-full border shadow-2xs text-white"
                                        style={{ backgroundColor: winner.groupColor || '#6366f1' }}
                                    >
                                        👥 {winner.groupName}
                                    </span>
                                )}
                            </h1>

                            {/* Seletor Retrátil de Alunos */}
                            <StudentSelectorModal 
                                show={showStudentSelector}
                                onClose={() => setShowStudentSelector(false)}
                                allStudents={allStudents}
                                activeStudents={activeStudents}
                                winnerId={winner?.id}
                                onSelect={handleSelectSpecificStudent}
                            />
                            
                            {renderQuestionControlBar()}
                        </div>
                    )
                )}

                {cardMode === 'todos_respondem' && (
                    <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 p-5 text-center relative overflow-hidden shrink-0 shadow-sm text-white">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-black bg-white/20 px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5">
                                ⚡ Desafio Coletivo
                            </span>
                            <button 
                                onClick={() => setCardMode('normal')}
                                className="text-xs font-bold bg-white/10 hover:bg-white/20 px-3 py-1 rounded-lg transition-colors flex items-center gap-1"
                            >
                                <RotateCcw className="w-3.5 h-3.5" /> Voltar ao Individual
                            </button>
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-black mt-2 drop-shadow-md flex items-center justify-center gap-2">
                            <span>⚡ Todos Respondem!</span>
                        </h2>
                        <p className="text-indigo-100 text-xs sm:text-sm font-medium mt-0.5">
                            Desafio aberto para a turma inteira responder no caderno ou lousinha!
                        </p>
                        
                        {renderQuestionControlBar()}
                    </div>
                )}

                {cardMode === 'preciso_de_ajuda' && (
                    <div className="bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 p-5 text-center relative overflow-hidden shrink-0 shadow-sm text-white">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-black bg-white/20 px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5">
                                🤝 Linha de Ajuda
                            </span>
                            <button 
                                onClick={() => setCardMode('normal')}
                                className="text-xs font-bold bg-white/10 hover:bg-white/20 px-3 py-1 rounded-lg transition-colors flex items-center gap-1"
                            >
                                <RotateCcw className="w-3.5 h-3.5" /> Voltar
                            </button>
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-black mt-2 drop-shadow-md flex items-center justify-center gap-2">
                            <HeartHandshake className="w-8 h-8 text-sky-200" />
                            <span>Preciso de Ajuda!</span>
                        </h2>
                        <p className="text-sky-100 text-xs sm:text-sm font-medium mt-0.5">
                            {winner.name} pode chamar um colega, pedir uma dica ou consultar a turma!
                        </p>
                        
                        {renderQuestionControlBar()}
                    </div>
                )}



                {/* ============================================================ */}
                {/* MODAL INTERNO: SELETOR DE PERGUNTAS */}
                {/* ============================================================ */}
                <QuestionSelectorModal
                    show={showQuestionSelector}
                    onClose={() => setShowQuestionSelector(false)}
                    allQuestions={allQuestions}
                    winnerQuestion={winner?.question}
                    usedQuestions={usedQuestions}
                    onSelect={handleSelectSpecificQuestion}
                    getDifficultyBadge={getDifficultyBadge}
                />

                {/* ============================================================ */}
                {/* CORPO CENTRAL DO CARD (SCROLLÁVEL SE NECESSÁRIO) */}
                {/* ============================================================ */}
                <div className="p-5 sm:p-6 overflow-y-auto space-y-5 bg-slate-50/60 flex-1 custom-scrollbar">
                    
                    {/* ======================================================== */}
                    {/* CARD DA PERGUNTA DA RODADA (LARGURA TOTAL DO CARD DO ALUNO) */}
                    {/* ======================================================== */}
                    <div className="w-full bg-white border-2 border-indigo-100 p-5 sm:p-6 rounded-2xl shadow-sm text-center relative flex flex-col justify-between transition-all duration-300" style={{ fontSize: `${fontScale}%` }}>
                        <div>
                            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <div className="inline-flex items-center justify-center gap-1.5 text-indigo-600 font-bold bg-indigo-50 px-3.5 py-1 rounded-full border border-indigo-100 text-xs">
                                        <HelpCircle className="w-4 h-4" />
                                        <span>Pergunta da Rodada</span>
                                    </div>

                                    {/* Chip para restaurar cronômetro se estiver minimizado no canto */}
                                    {timerViewMode === 'minimized' && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setTimerViewMode('normal');
                                                try { localStorage.setItem('preferred_roulette_timer_mode', 'normal'); } catch (e) {}
                                            }}
                                            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer animate-in fade-in"
                                            title="Acoplar o cronômetro de volta ao lado direito do card"
                                        >
                                            <span>💣</span>
                                            <span>Acoplar Cronômetro</span>
                                            <span className="text-2xs opacity-70">⤢</span>
                                        </button>
                                    )}
                                    </div>

                                    {/* Ajuste de Fonte Rápido direto no card de pergunta */}
                                    <div className="inline-flex items-center gap-1 bg-slate-100/90 border border-slate-200 px-2 py-0.5 rounded-xl shadow-2xs">
                                        <span className="text-[11px] font-bold text-slate-500">Fonte:</span>
                                        <button
                                            type="button"
                                            onClick={handleDecreaseFont}
                                            disabled={fontScale <= 50}
                                            className="w-5 h-5 rounded flex items-center justify-center text-xs font-black text-slate-700 hover:bg-white active:scale-90 disabled:opacity-30 cursor-pointer"
                                            title="Diminuir fonte (A-)"
                                        >
                                            A-
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleResetFont}
                                            className="px-1.5 text-[11px] font-bold text-indigo-700 hover:bg-white rounded cursor-pointer"
                                            title="Tamanho padrão (100%)"
                                        >
                                            {fontScale}%
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleIncreaseFont}
                                            disabled={fontScale >= 300}
                                            className="w-5 h-5 rounded flex items-center justify-center text-xs font-black text-slate-700 hover:bg-white active:scale-90 disabled:opacity-30 cursor-pointer"
                                            title="Aumentar fonte para projeção (A+)"
                                        >
                                            A+
                                        </button>
                                    </div>
                                    
                                    {/* Ajuste de Alinhamento Rápido direto no card */}
                                    <div className="inline-flex items-center gap-1 bg-slate-100/90 border border-slate-200 px-1 py-0.5 rounded-xl shadow-2xs">
                                        <button type="button" onClick={() => handleSetAlign('text-left')} className={`w-6 h-6 rounded flex items-center justify-center cursor-pointer transition-colors ${currentTextAlign === 'text-left' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500 hover:bg-white hover:text-slate-700'}`} title="Alinhar à Esquerda"><AlignLeft className="w-3.5 h-3.5" /></button>
                                        <button type="button" onClick={() => handleSetAlign('text-center')} className={`w-6 h-6 rounded flex items-center justify-center cursor-pointer transition-colors ${currentTextAlign === 'text-center' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500 hover:bg-white hover:text-slate-700'}`} title="Centralizar"><AlignCenter className="w-3.5 h-3.5" /></button>
                                        <button type="button" onClick={() => handleSetAlign('text-right')} className={`w-6 h-6 rounded flex items-center justify-center cursor-pointer transition-colors ${currentTextAlign === 'text-right' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500 hover:bg-white hover:text-slate-700'}`} title="Alinhar à Direita"><AlignRight className="w-3.5 h-3.5" /></button>
                                        <button type="button" onClick={() => handleSetAlign('text-justify')} className={`w-6 h-6 rounded flex items-center justify-center cursor-pointer transition-colors ${currentTextAlign === 'text-justify' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500 hover:bg-white hover:text-slate-700'}`} title="Justificar"><AlignJustify className="w-3.5 h-3.5" /></button>
                                        <div className="w-px h-4 bg-slate-300 mx-0.5" />
                                        <button type="button" onClick={handleStartEditing} className="w-6 h-6 rounded flex items-center justify-center cursor-pointer transition-colors text-indigo-600 hover:bg-indigo-100 hover:text-indigo-800" title="Editar esta pergunta"><Edit3 className="w-3.5 h-3.5" /></button>
                                    </div>
                                </div>

                                {winner.imageUrl && !(winner.question || '').match(/\[img/i) && (
                                    <div className="mb-4 flex justify-center">
                                        <img 
                                            src={getDirectImageUrl(winner.imageUrl)} 
                                            alt="" 
                                            className="max-h-48 rounded-xl border-2 border-slate-200 shadow-sm object-contain"
                                            referrerPolicy="no-referrer"
                                            onError={handleDriveImageError}
                                        />
                                    </div>
                                )}

                                <div className="relative">
                                        <div className={`text-[1.25em] sm:text-[1.5em] text-slate-800 font-bold leading-relaxed transition-all whitespace-pre-wrap w-full`}>
                                            {(winner.question || '').split('\n').map((line, idx) => {
                                                let lineAlign = currentTextAlign;
                                                let content = line;

                                                if (content.trim().startsWith('[C]')) {
                                                    lineAlign = 'text-center';
                                                    content = content.replace('[C]', '');
                                                } else if (content.trim().startsWith('[R]')) {
                                                    lineAlign = 'text-right';
                                                    content = content.replace('[R]', '');
                                                } else if (content.trim().startsWith('[L]')) {
                                                    lineAlign = 'text-left';
                                                    content = content.replace('[L]', '');
                                                } else if (content.trim().startsWith('[J]')) {
                                                    lineAlign = 'text-justify';
                                                    content = content.replace('[J]', '');
                                                }

                                                return (
                                                    <div key={idx} className={`${lineAlign} min-h-[1.5em] break-words`}>
                                                        {renderQuestionText(content, winner.imageUrl)}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                {/* ALTERNATIVAS DE MÚLTIPLA ESCOLHA (SE VINDAS DE UM QUIZ) */}
                                {winner.options && Array.isArray(winner.options) && winner.options.length > 0 && (
                                    <div className="mt-3 pt-2">
                                        <button
                                            type="button"
                                            onClick={() => setShowAlternatives(!showAlternatives)}
                                            className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1 rounded-full transition-colors border border-indigo-200 cursor-pointer"
                                        >
                                            {showAlternatives ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                            {showAlternatives ? 'Ocultar Alternativas' : 'Ver Alternativas (A, B, C, D)'}
                                        </button>

                                        {showAlternatives && (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left mt-2.5 animate-in fade-in slide-in-from-top-1">
                                                {winner.options.map((opt, oi) => (
                                                    <div 
                                                        key={oi}
                                                        className={`p-2.5 rounded-xl border border-indigo-100 bg-indigo-50/50 text-[0.875em] sm:text-[1em] font-medium text-slate-800 flex items-start gap-2 transition-all`}
                                                    >
                                                        <span className="w-5 h-5 rounded-md bg-indigo-600 text-white font-black flex items-center justify-center text-[11px] shrink-0">
                                                            {String.fromCharCode(65 + oi)}
                                                        </span>
                                                        <span className="leading-snug pt-0.5">{opt}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* GABARITO / RESPOSTA */}
                            {winner.answer && (
                                <div className="mt-4 pt-3 border-t border-slate-100">
                                    <button
                                        onClick={() => {
                                            if (!showAnswer && onRevealAnswer) onRevealAnswer();
                                            setShowAnswer(!showAnswer);
                                        }}
                                        className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3.5 py-1.5 rounded-full transition-colors border border-emerald-200 cursor-pointer"
                                    >
                                        {showAnswer ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                        {showAnswer ? 'Ocultar Resposta' : 'Ver Resposta Esperada'}
                                    </button>
                                    
                                    {showAnswer && (
                                        <div className="mt-3 p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-xl animate-in slide-in-from-top-2 fade-in duration-200 text-left">
                                            <div className="text-2xs font-black uppercase tracking-wider text-emerald-700 mb-1">
                                                Resposta Esperada:
                                            </div>
                                            <p className={`text-emerald-900 font-semibold text-[1em] sm:text-[1.125em] transition-all whitespace-pre-wrap`}>
                                                {winner.answer}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                            {/* ======================================================== */}
                    {/* CONTEÚDO ESPECÍFICO: MODO "TODOS RESPONDEM" */}
                    {/* ======================================================== */}
                    {cardMode === 'todos_respondem' && (
                        <RouletteModeTodosRespondem
                            activeStudents={activeStudents}
                            allStudents={allStudents}
                            winner={winner}
                            onBatchResult={onBatchResult}
                            showSelectionGrid={showSelectionGrid}
                            setShowSelectionGrid={setShowSelectionGrid}
                            studentStatuses={studentStatuses}
                            setStudentStatuses={setStudentStatuses}
                        />
                    )}                      {/* ======================================================== */}
                    {/* CONTEÚDO ESPECÍFICO: MODO "PRECISO DE AJUDA" */}
                    {/* ======================================================== */}
                    {cardMode === 'preciso_de_ajuda' && (
                        <RouletteModeAjuda
                            winner={winner}
                            activeStudents={activeStudents}
                            helpTab={helpTab}
                            setHelpTab={setHelpTab}
                            isDrawingHelper={isDrawingHelper}
                            helperStudent={helperStudent}
                            setHelperStudent={setHelperStudent}
                            drawingNameDisplay={drawingNameDisplay}
                            handleDrawHelper={handleDrawHelper}
                            availableHelpers={availableHelpers}
                            onHelpResult={onHelpResult}
                            showHintRevealed={showHintRevealed}
                            setShowHintRevealed={setShowHintRevealed}
                            getMaskedHint={getMaskedHint}
                            onRevealHint={onRevealHint}
                        />
                    )}
                </div>

                {/* ============================================================ */}
                {/* RODAPÉ PRINCIPAL: AÇÕES DA ROLETA (MODO NORMAL) */}
                {/* ============================================================ */}
                {cardMode === 'normal' && (
                    <div className="p-4 sm:p-5 bg-slate-100 border-t border-slate-200 flex flex-col gap-3 shrink-0">
                        {winner.isGroup ? (
                            /* RODAPÉ PARA ATIVIDADES EM GRUPO */
                            <div className="flex flex-col gap-2.5">
                                <div className="flex items-center justify-between text-xs text-slate-600 bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
                                    <div className="flex items-center gap-1.5 font-bold text-slate-700">
                                        <Users className="w-4 h-4 text-indigo-600" />
                                        <span>Pontuação Coletiva:</span>
                                        <span className="font-black text-indigo-950">+{1} ponto para a equipe {winner.name}</span>
                                        <span className="text-slate-400 font-normal">e todos os seus {(winner.members || []).length} alunos</span>
                                    </div>
                                    {selectedSpokesperson && (
                                        <span className="text-2xs font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-md border border-amber-300">
                                            Porta-voz: {selectedSpokesperson.name}
                                        </span>
                                    )}
                                </div>

                                <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-1">
                                    <div className="flex w-full sm:w-auto gap-2">
                                        <button 
                                            onClick={() => {
                                                if (onGroupResult) {
                                                    onGroupResult({ isCorrect: true, representativeStudent: selectedSpokesperson });
                                                } else {
                                                    onCorrect();
                                                }
                                            }}
                                            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-3 bg-emerald-500 text-white font-black rounded-xl hover:bg-emerald-600 transition-all shadow-sm text-sm active:scale-95 cursor-pointer"
                                        >
                                            <CheckCircle className="w-4 h-4" />
                                            Grupo Acertou! ✅
                                        </button>
                                        
                                        <button 
                                            onClick={() => {
                                                if (onGroupResult) {
                                                    onGroupResult({ isCorrect: false, representativeStudent: selectedSpokesperson });
                                                } else {
                                                    onIncorrect();
                                                }
                                            }}
                                            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-3 bg-white border-2 border-red-200 text-red-600 font-black rounded-xl hover:bg-red-50 hover:border-red-300 transition-all shadow-xs text-sm active:scale-95 cursor-pointer"
                                        >
                                            <XCircle className="w-4 h-4" />
                                            Grupo Errou ❌
                                        </button>
                                    </div>

                                    <div className="flex w-full sm:w-auto items-center justify-end gap-2">
                                        <button 
                                            onClick={onSpinAgain}
                                            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-3 bg-slate-200/90 border border-slate-300 text-slate-700 font-bold rounded-xl hover:bg-slate-300 transition-all shadow-2xs text-xs sm:text-sm cursor-pointer"
                                            title="Girar novamente para outro grupo sem penalizar"
                                        >
                                            <RotateCw className="w-4 h-4 text-slate-500" />
                                            <span>Rode Novamente</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            /* RODAPÉ PARA ATIVIDADES INDIVIDUAIS */
                            <div className="flex flex-col gap-2 pt-2">
                                {/* Botões das Dinâmicas Gamificadas: TODOS RESPONDEM & PRECISO DE AJUDA */}
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={() => {
                                            setCardMode('todos_respondem');
                                        }}
                                        className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg font-black text-xs sm:text-sm text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-sm transition-all transform active:scale-95 group"
                                    >
                                        <span className="text-base group-hover:scale-125 transition-transform">⚡</span>
                                        <span className="truncate">Todos Respondem!</span>
                                    </button>

                                    <button
                                        onClick={() => {
                                            setCardMode('preciso_de_ajuda');
                                            gameAudio.playHelp();
                                        }}
                                        className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg font-black text-xs sm:text-sm text-sky-900 bg-sky-200 hover:bg-sky-300 border border-sky-300 shadow-xs transition-all transform active:scale-95"
                                    >
                                        <HeartHandshake className="w-4 h-4 text-sky-700 shrink-0" />
                                        <span className="truncate">Preciso de Ajuda</span>
                                        {hadHelp && (
                                            <span className="ml-1 text-2xs bg-sky-300 text-sky-950 px-1 py-0.5 rounded font-bold whitespace-nowrap">
                                                {helpCount > 1 ? `(${helpCount}x)` : 'Já usou'}
                                            </span>
                                        )}
                                    </button>
                                </div>

                                {/* Botões de Avaliação Individual */}
                                <div className="flex flex-wrap sm:flex-nowrap items-stretch justify-between gap-2">
                                    <div className="flex w-full sm:w-auto gap-2 flex-1">
                                        <button 
                                            onClick={onCorrect}
                                            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-500 text-white font-black rounded-lg hover:bg-emerald-600 transition-all shadow-sm text-sm active:scale-95 cursor-pointer"
                                        >
                                            <CheckCircle className="w-4 h-4" />
                                            Acertou
                                        </button>
                                        
                                        <button 
                                            onClick={onIncorrect}
                                            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white border-2 border-red-200 text-red-600 font-black rounded-lg hover:bg-red-50 hover:border-red-300 transition-all shadow-xs text-sm active:scale-95 cursor-pointer"
                                        >
                                            <XCircle className="w-4 h-4" />
                                            Errou
                                        </button>
                                    </div>

                                    <div className="flex w-full sm:w-auto items-center justify-end gap-2">
                                        {/* RODE NOVAMENTE: NÃO REMOVE DA LISTA */}
                                        <button 
                                            onClick={onSpinAgain}
                                            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-200/90 border border-slate-300 text-slate-700 font-bold rounded-lg hover:bg-slate-300 transition-all shadow-2xs text-xs cursor-pointer h-full"
                                            title="Girar novamente sem remover nem penalizar o aluno (permanece ativo na lista)"
                                        >
                                            <RotateCw className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                            <span className="truncate">Rode Novamente</span>
                                        </button>

                                        {/* Opção separada e discreta se o aluno faltou hoje */}
                                        {onAbsent && (
                                            <button 
                                                onClick={onAbsent}
                                                className="text-2xs font-semibold text-slate-400 hover:text-orange-600 px-2 transition-colors cursor-pointer shrink-0"
                                                title="Marcar aluno como Ausente (faltou hoje à aula)"
                                            >
                                                Faltou?
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

            </div>
            {/* FIM DO CARD PRINCIPAL DO ALUNO */}

            {/* ============================================================ */}
            {/* 2. PAINEL DIREITO: CRONÔMETRO BOMBA ACOPLADO (MESMA ALTURA) */}
            {/* ============================================================ */}
            <div className={timerViewMode === 'normal' 
                ? 'w-full lg:w-[380px] xl:w-[415px] 2xl:w-[435px] shrink-0 h-full self-stretch flex flex-col animate-in fade-in slide-in-from-right-3 duration-300' 
                : 'contents'
            }>
                <RouletteTimerBomb 
                    className="h-full w-full"
                    viewMode={timerViewMode}
                    onViewModeChange={setTimerViewMode}
                    onExplode={onTimerExplode}
                />
            </div>

        </div>
    </div>
    
    <QuestionEditModal 
        show={showQuestionEditModal}
        onClose={() => setShowQuestionEditModal(false)}
        question={winner}
        onSave={handleSaveEditing}
    />
    </>
);
};
