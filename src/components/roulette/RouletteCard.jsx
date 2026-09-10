import React, { useState, useEffect, useRef } from 'react';
import { 
    User, HelpCircle, Sparkles, CheckCircle, XCircle, RotateCcw, 
    Eye, EyeOff, Shuffle, ListOrdered, Users, HeartHandshake, Award,
    Play, Pause, RotateCw, Lightbulb, ThumbsUp, Check, X, AlertTriangle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { gameAudio } from '../../utils/gameAudio';

export const RouletteCard = ({ 
    winner, 
    allQuestions = [], 
    usedQuestions = new Set(), 
    activeStudents = [], 
    onChangeQuestion, 
    onCorrect, 
    onIncorrect, 
    onSpinAgain, 
    onAbsent,
    onBatchResult,
    onHelpResult,
    showDifficulty = true,
    onToggleDifficulty
}) => {
    // Modos de Exibição do Card: 'normal' | 'todos_respondem' | 'preciso_de_ajuda'
    const [cardMode, setCardMode] = useState('normal');
    
    // Visualização da Resposta Esperada
    const [showAnswer, setShowAnswer] = useState(false);
    
    // Modal interno para selecionar pergunta da lista
    const [showQuestionSelector, setShowQuestionSelector] = useState(false);

    // ==========================================
    // ESTADOS: TODOS RESPONDEM
    // ==========================================
    const [timerSeconds, setTimerSeconds] = useState(30);
    const [timerTotal, setTimerTotal] = useState(30);
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const [timerFinished, setTimerFinished] = useState(false);
    const [showSelectionGrid, setShowSelectionGrid] = useState(false);
    const [selectedStudentIds, setSelectedStudentIds] = useState(() => new Set(activeStudents.map(s => s.id)));

    // Timer effect
    useEffect(() => {
        let interval = null;
        if (isTimerRunning && timerSeconds > 0) {
            interval = setInterval(() => {
                setTimerSeconds(prev => {
                    if (prev <= 1) {
                        setIsTimerRunning(false);
                        setTimerFinished(true);
                        gameAudio.playTimerEnd();
                        return 0;
                    }
                    if (prev <= 4) {
                        gameAudio.playTick();
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isTimerRunning, timerSeconds]);

    // Atualiza a seleção padrão quando a lista de alunos mudar
    useEffect(() => {
        setSelectedStudentIds(new Set(activeStudents.map(s => s.id)));
    }, [activeStudents]);

    const handleStartTimer = (seconds) => {
        setTimerSeconds(seconds);
        setTimerTotal(seconds);
        setIsTimerRunning(true);
        setTimerFinished(false);
        gameAudio.playTick();
    };

    const handleToggleTimer = () => {
        setIsTimerRunning(prev => !prev);
        gameAudio.playTick();
    };

    const handleResetTimer = () => {
        setIsTimerRunning(false);
        setTimerSeconds(timerTotal);
        setTimerFinished(false);
        gameAudio.playTick();
    };

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
        const potentialHelpers = activeStudents.filter(s => s.id !== winner.id);
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
            onChangeQuestion(nextQ);
            setShowAnswer(false);
            setShowHintRevealed(false);
        }
    };

    const handleSelectSpecificQuestion = (q) => {
        if (onChangeQuestion) {
            onChangeQuestion(q);
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

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-300 relative border-4 border-amber-400 flex flex-col max-h-[92vh]">
                
                {/* ============================================================ */}
                {/* CABEÇALHO DINÂMICO CONFORME O MODO ATIVO */}
                {/* ============================================================ */}
                {cardMode === 'normal' && (
                    <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 p-6 text-center relative overflow-hidden shrink-0 shadow-sm">
                        <div className="absolute top-0 left-0 w-full h-full opacity-15 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
                        <Sparkles className="w-8 h-8 text-amber-200/60 absolute top-3 left-4 animate-pulse" />
                        <Sparkles className="w-6 h-6 text-amber-200/60 absolute bottom-3 right-4 animate-pulse" />
                        
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/15 text-amber-100 text-xs font-black uppercase tracking-widest mb-1.5 backdrop-blur-sm">
                            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                            Aluno Sorteado
                        </div>
                        <h1 className="text-3xl sm:text-4xl font-black text-white drop-shadow-md flex items-center justify-center gap-3">
                            <User className="w-8 h-8 sm:w-9 sm:h-9 text-amber-200" />
                            {winner.name}
                        </h1>

                        {/* AVISOS EXPLÍCITOS: TEVE AJUDA E AJUDOU */}
                        {(hadHelp || helpedCount > 0) && (
                            <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                                {hadHelp && (
                                    <div className="inline-flex items-center gap-1.5 px-3.5 py-1 bg-sky-100 text-sky-950 border-2 border-sky-400 font-black rounded-full text-xs shadow-xs animate-in slide-in-from-top-1">
                                        <HeartHandshake className="w-4 h-4 text-sky-700 shrink-0" />
                                        <span>
                                            TEVE AJUDA: {helpCount}x
                                            {lastHelper ? ` (com ${lastHelper})` : ''}
                                        </span>
                                    </div>
                                )}
                                {helpedCount > 0 && (
                                    <div className="inline-flex items-center gap-1.5 px-3.5 py-1 bg-emerald-100 text-emerald-950 border-2 border-emerald-400 font-black rounded-full text-xs shadow-xs animate-in slide-in-from-top-1">
                                        <Award className="w-4 h-4 text-emerald-700 shrink-0" />
                                        <span>
                                            AJUDOU: {helpedCount}x
                                            {lastHelped ? ` (auxiliou ${lastHelped})` : ''}
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
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
                    </div>
                )}

                {/* ============================================================ */}
                {/* BARRA DE CONTROLE DA PERGUNTA (TROCAR / ESCOLHER / STATUS) */}
                {/* ============================================================ */}
                <div className="bg-slate-100/90 border-b border-slate-200 px-4 py-2.5 flex items-center justify-between gap-2 shrink-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-slate-500 bg-white border border-slate-200 px-2.5 py-1 rounded-lg shadow-2xs">
                            {allQuestions.length > 0 ? `Pergunta ${currentIndex >= 0 ? currentIndex + 1 : 1} de ${allQuestions.length}` : 'Pergunta'}
                        </span>

                        {showDifficulty && (() => {
                            const badge = getDifficultyBadge(winner.difficulty);
                            return (
                                <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border flex items-center gap-1.5 shadow-2xs ${badge.color}`}>
                                    <span className={`w-2 h-2 rounded-full ${badge.dot}`}></span>
                                    <span>{badge.label}</span>
                                </span>
                            );
                        })()}

                        {onToggleDifficulty && (
                            <button
                                onClick={onToggleDifficulty}
                                className="text-slate-400 hover:text-indigo-600 p-1 rounded-lg hover:bg-slate-200 transition-colors"
                                title={showDifficulty ? 'Dificuldade visível (clique para ocultar)' : 'Dificuldade oculta (clique para exibir)'}
                            >
                                {showDifficulty ? <Eye className="w-3.5 h-3.5 text-emerald-600" /> : <EyeOff className="w-3.5 h-3.5 text-slate-400" />}
                            </button>
                        )}

                        {isCurrentQuestionUsed && (
                            <span className="text-2xs font-black bg-amber-100 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3 text-amber-600" /> Já respondida
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleNextQuestion}
                            className="flex items-center gap-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-3 py-1.5 rounded-xl transition-all active:scale-95 shadow-2xs"
                            title="Sortear outra pergunta diferente para este aluno"
                        >
                            <Shuffle className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Outra Pergunta</span>
                        </button>

                        <button
                            onClick={() => setShowQuestionSelector(!showQuestionSelector)}
                            className="flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl transition-all active:scale-95 shadow-2xs"
                            title="Ver lista de todas as perguntas disponíveis"
                        >
                            <ListOrdered className="w-3.5 h-3.5 text-slate-500" />
                            <span className="hidden sm:inline">Escolher da Lista</span>
                        </button>
                    </div>
                </div>

                {/* ============================================================ */}
                {/* MODAL INTERNO: SELETOR DE PERGUNTAS */}
                {/* ============================================================ */}
                {showQuestionSelector && (
                    <div className="bg-indigo-50/95 border-b-2 border-indigo-200 p-4 max-h-56 overflow-y-auto space-y-2 animate-in slide-in-from-top-3 duration-200 shrink-0">
                        <div className="flex items-center justify-between mb-2">
                            <h4 className="text-xs font-black text-indigo-900 uppercase tracking-wider">
                                Escolha uma pergunta para {winner.name}:
                            </h4>
                            <button 
                                onClick={() => setShowQuestionSelector(false)}
                                className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
                            >
                                Fechar ✕
                            </button>
                        </div>
                        <div className="grid grid-cols-1 gap-1.5">
                            {allQuestions.map((q, idx) => {
                                const isCurrent = q.question === winner.question;
                                const isUsed = usedQuestions.has(q.question);
                                return (
                                    <button
                                        key={idx}
                                        onClick={() => handleSelectSpecificQuestion(q)}
                                        className={`text-left p-2.5 rounded-xl text-xs font-medium transition-all flex items-start justify-between gap-3 border ${
                                            isCurrent 
                                            ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs' 
                                            : isUsed 
                                            ? 'bg-white/70 text-slate-500 border-slate-200 hover:bg-white' 
                                            : 'bg-white text-slate-800 border-indigo-100 hover:border-indigo-300 shadow-2xs hover:bg-indigo-50/50'
                                        }`}
                                    >
                                        <div className="flex items-start gap-2">
                                            <span className={`font-black shrink-0 ${isCurrent ? 'text-indigo-200' : 'text-indigo-600'}`}>
                                                #{idx + 1}
                                            </span>
                                            <span className="line-clamp-2">{q.question}</span>
                                        </div>
                                        <div className="shrink-0 flex items-center gap-1.5">
                                            {(() => {
                                                const badge = getDifficultyBadge(q.difficulty);
                                                return (
                                                    <span className={`text-2xs font-bold px-1.5 py-0.5 rounded border ${badge.color}`}>
                                                        {badge.label}
                                                    </span>
                                                );
                                            })()}
                                            {isUsed && !isCurrent && (
                                                <span className="text-2xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-bold">
                                                    Usada
                                                </span>
                                            )}
                                            {isCurrent && (
                                                <span className="text-2xs bg-indigo-500 text-white px-1.5 py-0.5 rounded font-black">
                                                    Atual
                                                </span>
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* ============================================================ */}
                {/* CORPO CENTRAL DO CARD (SCROLLÁVEL SE NECESSÁRIO) */}
                {/* ============================================================ */}
                <div className="p-5 sm:p-6 overflow-y-auto space-y-5 bg-slate-50/60 flex-1 custom-scrollbar">
                    
                    {/* CARD DA PERGUNTA */}
                    <div className="bg-white border-2 border-indigo-100 p-5 sm:p-6 rounded-2xl shadow-sm text-center relative">
                        <div className="inline-flex items-center justify-center gap-1.5 text-indigo-600 font-bold mb-3 bg-indigo-50 px-3.5 py-1 rounded-full border border-indigo-100 text-xs">
                            <HelpCircle className="w-4 h-4" />
                            <span>Pergunta da Rodada</span>
                        </div>

                        {winner.imageUrl && (
                            <div className="mb-4 flex justify-center">
                                <img 
                                    src={winner.imageUrl} 
                                    alt="Imagem da pergunta" 
                                    className="max-h-48 rounded-xl border-2 border-slate-200 shadow-sm object-contain"
                                    onError={(e) => e.target.style.display='none'}
                                />
                            </div>
                        )}

                        <p className="text-xl sm:text-2xl text-slate-800 font-bold leading-relaxed">
                            {winner.question}
                        </p>

                        {/* GABARITO / RESPOSTA */}
                        {winner.answer && (
                            <div className="mt-4 pt-3 border-t border-slate-100">
                                <button
                                    onClick={() => setShowAnswer(!showAnswer)}
                                    className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3.5 py-1.5 rounded-full transition-colors border border-emerald-200"
                                >
                                    {showAnswer ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                    {showAnswer ? 'Ocultar Resposta' : 'Ver Resposta Esperada'}
                                </button>
                                
                                {showAnswer && (
                                    <div className="mt-3 p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-xl animate-in slide-in-from-top-2 fade-in duration-200 text-left">
                                        <div className="text-2xs font-black uppercase tracking-wider text-emerald-700 mb-1">
                                            Resposta Esperada:
                                        </div>
                                        <p className="text-emerald-900 font-semibold text-base">
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
                        <div className="bg-indigo-50/90 border-2 border-indigo-200 p-5 rounded-2xl space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            
                            {/* Cronômetro */}
                            <div className="bg-white p-4 rounded-xl border border-indigo-100 shadow-2xs flex flex-col items-center">
                                <div className="text-xs font-bold text-indigo-900 mb-1 flex items-center gap-1">
                                    ⏱️ Tempo para a Turma Responder:
                                </div>
                                <div className="text-4xl font-black tracking-widest font-mono text-indigo-700 my-1">
                                    00:{timerSeconds < 10 ? `0${timerSeconds}` : timerSeconds}
                                </div>
                                
                                {/* Barra de Progresso */}
                                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden my-2">
                                    <div 
                                        className={`h-full transition-all duration-1000 ${
                                            timerSeconds <= 5 ? 'bg-red-500' : timerSeconds <= 15 ? 'bg-amber-500' : 'bg-indigo-600'
                                        }`}
                                        style={{ width: `${(timerSeconds / (timerTotal || 30)) * 100}%` }}
                                    ></div>
                                </div>

                                {/* Controles do Cronômetro */}
                                <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
                                    <button 
                                        onClick={handleToggleTimer}
                                        className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
                                            isTimerRunning 
                                            ? 'bg-amber-500 hover:bg-amber-600 text-white' 
                                            : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                                        }`}
                                    >
                                        {isTimerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                                        {isTimerRunning ? 'Pausar' : 'Iniciar'}
                                    </button>

                                    <button 
                                        onClick={handleResetTimer}
                                        className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors flex items-center gap-1"
                                    >
                                        <RotateCcw className="w-3.5 h-3.5" /> Reiniciar
                                    </button>

                                    <div className="h-4 w-px bg-slate-200 mx-1"></div>

                                    <button onClick={() => handleStartTimer(15)} className="px-2.5 py-1 text-2xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-md">15s</button>
                                    <button onClick={() => handleStartTimer(30)} className="px-2.5 py-1 text-2xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-md">30s</button>
                                    <button onClick={() => handleStartTimer(60)} className="px-2.5 py-1 text-2xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-md">60s</button>
                                </div>
                            </div>

                            {/* Ações de Pontuação Coletiva */}
                            <div className="space-y-3 pt-2">
                                <div className="text-xs font-black text-indigo-900 uppercase tracking-wider text-center">
                                    Como deseja pontuar a turma?
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <button
                                        onClick={() => {
                                            gameAudio.playSuccess();
                                            confetti({ particleCount: 50, spread: 80, origin: { y: 0.6 } });
                                            if (onBatchResult) {
                                                onBatchResult({
                                                    studentIds: activeStudents.map(s => s.id),
                                                    questionText: winner.question
                                                });
                                            }
                                        }}
                                        className="p-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-bold text-sm shadow-md transition-all active:scale-95 flex flex-col items-center justify-center gap-1"
                                    >
                                        <span className="flex items-center gap-1.5 text-base">
                                            🏆 Toda a Turma Acertou!
                                        </span>
                                        <span className="text-2xs text-emerald-100 font-normal">
                                            +1 ponto para todos os {activeStudents.length} alunos ativos
                                        </span>
                                    </button>

                                    <button
                                        onClick={() => setShowSelectionGrid(!showSelectionGrid)}
                                        className="p-3.5 bg-white border-2 border-indigo-300 text-indigo-800 hover:bg-indigo-50 rounded-xl font-bold text-sm shadow-xs transition-all active:scale-95 flex flex-col items-center justify-center gap-1"
                                    >
                                        <span className="flex items-center gap-1.5 text-base">
                                            🎯 Marcar Quem Acertou
                                        </span>
                                        <span className="text-2xs text-indigo-600 font-normal">
                                            {showSelectionGrid ? 'Ocultar lista seletiva' : 'Escolher alunos que acertaram'}
                                        </span>
                                    </button>
                                </div>

                                {/* Grade Seletiva de Alunos */}
                                {showSelectionGrid && (
                                    <div className="bg-white p-4 rounded-xl border border-indigo-200 shadow-sm space-y-3 animate-in fade-in duration-200">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-black text-slate-700">
                                                Selecione os alunos que acertaram: ({selectedStudentIds.size}/{activeStudents.length})
                                            </span>
                                            <div className="flex gap-2">
                                                <button 
                                                    onClick={() => setSelectedStudentIds(new Set(activeStudents.map(s => s.id)))}
                                                    className="text-2xs font-bold text-indigo-600 hover:underline"
                                                >
                                                    Marcar Todos
                                                </button>
                                                <span className="text-slate-300">|</span>
                                                <button 
                                                    onClick={() => setSelectedStudentIds(new Set())}
                                                    className="text-2xs font-bold text-slate-500 hover:underline"
                                                >
                                                    Limpar
                                                </button>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-40 overflow-y-auto p-1 custom-scrollbar">
                                            {activeStudents.map(student => {
                                                const isSelected = selectedStudentIds.has(student.id);
                                                return (
                                                    <button
                                                        key={student.id}
                                                        onClick={() => {
                                                            const next = new Set(selectedStudentIds);
                                                            if (next.has(student.id)) next.delete(student.id);
                                                            else next.add(student.id);
                                                            setSelectedStudentIds(next);
                                                            gameAudio.playTick();
                                                        }}
                                                        className={`p-2 rounded-lg text-xs font-semibold flex items-center justify-between border transition-all text-left ${
                                                            isSelected 
                                                            ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold' 
                                                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                                                        }`}
                                                    >
                                                        <span className="truncate">{student.name}</span>
                                                        {isSelected ? (
                                                            <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 ml-1" />
                                                        ) : (
                                                            <div className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0 ml-1"></div>
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        <button
                                            disabled={selectedStudentIds.size === 0}
                                            onClick={() => {
                                                if (selectedStudentIds.size === 0) return;
                                                gameAudio.playSuccess();
                                                confetti({ particleCount: 40, spread: 70 });
                                                if (onBatchResult) {
                                                    onBatchResult({
                                                        studentIds: Array.from(selectedStudentIds),
                                                        questionText: winner.question
                                                    });
                                                }
                                            }}
                                            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:text-slate-500 text-white font-black rounded-xl text-sm transition-all shadow-sm flex items-center justify-center gap-2"
                                        >
                                            <Check className="w-4 h-4" />
                                            Confirmar Pontos para {selectedStudentIds.size} Aluno(s)
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ======================================================== */}
                    {/* CONTEÚDO ESPECÍFICO: MODO "PRECISO DE AJUDA" */}
                    {/* ======================================================== */}
                    {cardMode === 'preciso_de_ajuda' && (
                        <div className="bg-sky-50/90 border-2 border-sky-200 p-5 rounded-2xl space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            
                            {/* Abas de Ajuda */}
                            <div className="flex bg-white p-1 rounded-xl border border-sky-200 shadow-2xs gap-1">
                                <button
                                    onClick={() => { setHelpTab('colleague'); gameAudio.playTick(); }}
                                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                                        helpTab === 'colleague' 
                                        ? 'bg-sky-600 text-white shadow-xs' 
                                        : 'text-slate-600 hover:bg-sky-50'
                                    }`}
                                >
                                    <Users className="w-3.5 h-3.5" />
                                    <span>Colega Ajudante</span>
                                </button>
                                <button
                                    onClick={() => { setHelpTab('hint'); gameAudio.playTick(); }}
                                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                                        helpTab === 'hint' 
                                        ? 'bg-sky-600 text-white shadow-xs' 
                                        : 'text-slate-600 hover:bg-sky-50'
                                    }`}
                                >
                                    <Lightbulb className="w-3.5 h-3.5" />
                                    <span>Ver Pista</span>
                                </button>
                                <button
                                    onClick={() => { setHelpTab('class'); gameAudio.playTick(); }}
                                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                                        helpTab === 'class' 
                                        ? 'bg-sky-600 text-white shadow-xs' 
                                        : 'text-slate-600 hover:bg-sky-50'
                                    }`}
                                >
                                    <ThumbsUp className="w-3.5 h-3.5" />
                                    <span>Opinião da Sala</span>
                                </button>
                            </div>

                            {/* ABA 1: COLEGA AJUDANTE */}
                            {helpTab === 'colleague' && (
                                <div className="space-y-3">
                                    <div className="bg-white p-4 rounded-xl border border-sky-100 text-center shadow-2xs">
                                        {isDrawingHelper ? (
                                            <div className="py-4 space-y-2">
                                                <div className="text-xs font-bold text-sky-600 uppercase tracking-widest">Sorteando Ajudante...</div>
                                                <div className="text-3xl font-black text-indigo-700 animate-pulse font-mono">
                                                    {drawingNameDisplay || '...'}
                                                </div>
                                            </div>
                                        ) : helperStudent ? (
                                            <div className="py-2 space-y-1">
                                                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 uppercase tracking-wider">
                                                    ✨ Colega Escolhido(a)
                                                </span>
                                                <h3 className="text-2xl font-black text-slate-800 flex items-center justify-center gap-2">
                                                    <User className="w-6 h-6 text-sky-500" />
                                                    {helperStudent.name}
                                                </h3>
                                                <p className="text-xs text-slate-500">
                                                    {helperStudent.name} agora está em dupla com {winner.name}!
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="py-3 text-slate-600 text-xs">
                                                Nenhum colega selecionado ainda. Clique abaixo para sortear ou escolha na lista.
                                            </div>
                                        )}

                                        <div className="flex flex-wrap items-center justify-center gap-2 mt-3 pt-3 border-t border-slate-100">
                                            <button
                                                disabled={isDrawingHelper}
                                                onClick={handleDrawHelper}
                                                className="px-4 py-2 bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-xl text-xs font-black shadow-xs hover:from-sky-600 hover:to-blue-700 active:scale-95 transition-all flex items-center gap-1.5"
                                            >
                                                <Shuffle className="w-3.5 h-3.5" />
                                                {helperStudent ? 'Sortear Outro Colega 🎲' : 'Sortear Colega Ajudante 🎲'}
                                            </button>

                                            {/* Seletor Manual */}
                                            <select
                                                value={helperStudent?.id || ''}
                                                onChange={(e) => {
                                                    const selected = activeStudents.find(s => s.id === e.target.value);
                                                    setHelperStudent(selected || null);
                                                    if (selected) gameAudio.playTick();
                                                }}
                                                className="text-xs font-bold text-slate-700 bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-2 outline-none"
                                            >
                                                <option value="">Escolher manualmente...</option>
                                                {activeStudents
                                                    .filter(s => s.id !== winner.id)
                                                    .map(s => (
                                                        <option key={s.id} value={s.id}>{s.name}</option>
                                                    ))
                                                }
                                            </select>
                                        </div>
                                    </div>

                                    {/* Ações de Desfecho da Dupla */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                                        <button
                                            onClick={() => {
                                                gameAudio.playSuccess();
                                                confetti({ particleCount: 45, spread: 75 });
                                                if (onHelpResult) {
                                                    onHelpResult({
                                                        helperStudentId: helperStudent?.id || null,
                                                        isCorrect: true,
                                                        questionText: winner.question,
                                                        helpType: 'colleague'
                                                    });
                                                }
                                            }}
                                            className="p-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-black text-xs sm:text-sm shadow-xs transition-all flex items-center justify-center gap-1.5"
                                        >
                                            <CheckCircle className="w-4 h-4" />
                                            {helperStudent ? `Acertaram em Dupla! (+1 para ambos)` : 'Acertou com Ajuda! (+1 ponto)'}
                                        </button>

                                        <button
                                            onClick={() => {
                                                if (onHelpResult) {
                                                    onHelpResult({
                                                        helperStudentId: helperStudent?.id || null,
                                                        isCorrect: false,
                                                        questionText: winner.question,
                                                        helpType: 'colleague'
                                                    });
                                                }
                                            }}
                                            className="p-3 bg-white border border-red-200 text-red-600 hover:bg-red-50 rounded-xl font-bold text-xs sm:text-sm shadow-xs transition-all flex items-center justify-center gap-1.5"
                                        >
                                            <XCircle className="w-4 h-4" />
                                            Errou (Tentativa com Ajuda)
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* ABA 2: PISTA / DICA */}
                            {helpTab === 'hint' && (
                                <div className="bg-white p-4 rounded-xl border border-sky-100 space-y-3">
                                    <div className="text-xs font-black text-sky-900 uppercase tracking-wider flex items-center gap-1.5">
                                        <Lightbulb className="w-4 h-4 text-amber-500" />
                                        Pista Pedagógica:
                                    </div>
                                    
                                    {!showHintRevealed ? (
                                        <div className="text-center py-4 space-y-2">
                                            <p className="text-xs text-slate-500">
                                                A pista revela as letras da resposta ou o professor pode dar uma dica oral!
                                            </p>
                                            <button
                                                onClick={() => { setShowHintRevealed(true); gameAudio.playTick(); }}
                                                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-black text-xs shadow-xs transition-all"
                                            >
                                                Revelar Letras da Resposta 🔍
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
                                            <div className="text-2xs font-bold text-amber-800 uppercase">Letras da resposta:</div>
                                            <div className="font-mono text-base font-black text-slate-800 tracking-wider">
                                                {getMaskedHint(winner.answer)}
                                            </div>
                                        </div>
                                    )}

                                    <div className="pt-2 flex justify-center gap-2">
                                        <button
                                            onClick={() => {
                                                gameAudio.playSuccess();
                                                if (onHelpResult) {
                                                    onHelpResult({ 
                                                        helperStudentId: null, 
                                                        isCorrect: true, 
                                                        questionText: winner.question, 
                                                        helpType: 'hint' 
                                                    });
                                                }
                                            }}
                                            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-black transition-all"
                                        >
                                            Acertou com a Dica! ✅
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* ABA 3: OPINIÃO DA SALA */}
                            {helpTab === 'class' && (
                                <div className="bg-white p-4 rounded-xl border border-sky-100 text-center space-y-3">
                                    <ThumbsUp className="w-8 h-8 text-sky-500 mx-auto" />
                                    <h4 className="text-sm font-black text-slate-800">
                                        Consulta à Sala de Aula
                                    </h4>
                                    <p className="text-xs text-slate-600 max-w-md mx-auto">
                                        Peça para a turma levantar a mão para quem acha que sabe a resposta, ou permita que um colega fale uma palavra-chave para auxiliar!
                                    </p>

                                    <div className="pt-2 flex justify-center gap-2">
                                        <button
                                            onClick={() => {
                                                gameAudio.playSuccess();
                                                if (onHelpResult) {
                                                    onHelpResult({ 
                                                        helperStudentId: null, 
                                                        isCorrect: true, 
                                                        questionText: winner.question, 
                                                        helpType: 'class_opinion' 
                                                    });
                                                }
                                            }}
                                            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-black transition-all"
                                        >
                                            Acertou com a Turma! ✅
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* ============================================================ */}
                {/* RODAPÉ PRINCIPAL: AÇÕES DA ROLETA (MODO NORMAL) */}
                {/* ============================================================ */}
                {cardMode === 'normal' && (
                    <div className="p-4 sm:p-5 bg-slate-100 border-t border-slate-200 flex flex-col gap-3 shrink-0">
                        
                        {/* Botões das Dinâmicas Gamificadas: TODOS RESPONDEM & PRECISO DE AJUDA */}
                        <div className="grid grid-cols-2 gap-2.5">
                            <button
                                onClick={() => {
                                    setCardMode('todos_respondem');
                                    handleStartTimer(30);
                                }}
                                className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-black text-xs sm:text-sm text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-sm transition-all transform active:scale-95 group"
                            >
                                <span className="text-base group-hover:scale-125 transition-transform">⚡</span>
                                <span>Todos Respondem!</span>
                            </button>

                            <button
                                onClick={() => {
                                    setCardMode('preciso_de_ajuda');
                                    gameAudio.playHelp();
                                }}
                                className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-black text-xs sm:text-sm text-sky-900 bg-sky-200 hover:bg-sky-300 border border-sky-300 shadow-xs transition-all transform active:scale-95"
                            >
                                <HeartHandshake className="w-4 h-4 text-sky-700 shrink-0" />
                                <span>Preciso de Ajuda</span>
                                {hadHelp && (
                                    <span className="ml-1 text-2xs bg-sky-300 text-sky-950 px-1.5 py-0.5 rounded-md font-bold">
                                        Já usou {helpCount > 1 ? `(${helpCount}x)` : ''}
                                    </span>
                                )}
                            </button>
                        </div>

                        {/* Botões de Avaliação Individual */}
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-1">
                            <div className="flex w-full sm:w-auto gap-2">
                                <button 
                                    onClick={onCorrect}
                                    className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-3 bg-emerald-500 text-white font-black rounded-xl hover:bg-emerald-600 transition-all shadow-sm text-sm active:scale-95"
                                >
                                    <CheckCircle className="w-4 h-4" />
                                    Acertou
                                </button>
                                
                                <button 
                                    onClick={onIncorrect}
                                    className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-3 bg-white border-2 border-red-200 text-red-600 font-black rounded-xl hover:bg-red-50 hover:border-red-300 transition-all shadow-xs text-sm active:scale-95"
                                >
                                    <XCircle className="w-4 h-4" />
                                    Errou
                                </button>
                            </div>

                            <div className="flex w-full sm:w-auto items-center justify-end gap-2">
                                {/* RODE NOVAMENTE: NÃO REMOVE DA LISTA */}
                                <button 
                                    onClick={onSpinAgain}
                                    className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-3 bg-slate-200/90 border border-slate-300 text-slate-700 font-bold rounded-xl hover:bg-slate-300 transition-all shadow-2xs text-xs sm:text-sm"
                                    title="Girar novamente sem remover nem penalizar o aluno (permanece ativo na lista)"
                                >
                                    <RotateCw className="w-4 h-4 text-slate-500" />
                                    <span>Rode Novamente</span>
                                </button>

                                {/* Opção separada e discreta se o aluno faltou hoje */}
                                {onAbsent && (
                                    <button 
                                        onClick={onAbsent}
                                        className="text-2xs font-semibold text-slate-400 hover:text-orange-600 px-2 py-3 transition-colors"
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
        </div>
    );
};
