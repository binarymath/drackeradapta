import React, { useState, useEffect } from 'react';
import { 
    CheckCircle, Dices, ArrowRight, Sparkles, FileText, Check, 
    Loader2, HelpCircle, AlertCircle, Users, CheckSquare, Square
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { gameAudio } from '../../utils/gameAudio';
import { 
    convertQuizQuestionsToRoulette, 
    convertRouletteQuestionsToQuiz, 
    generateDistractorsWithAI 
} from '../../services/questionTransitionService';

export const TransitionQuestionsModal = ({
    isOpen,
    onClose,
    mode = 'roulette_to_quiz', // 'roulette_to_quiz' | 'quiz_to_roulette'
    sourceQuestions = [],
    sourceTopic = '',
    classes = [],
    geminiService = null,
    selectedModel = null,
    addActivityTab,
    onSuccess
}) => {
    // Título da nova atividade gerada
    const [targetTitle, setTargetTitle] = useState('');
    // Índices das questões selecionadas (Set)
    const [selectedIndices, setSelectedIndices] = useState(() => new Set());
    
    // Opções específicas: Roleta -> Quiz
    const [quizMode, setQuizMode] = useState('ai_multiple_choice'); // 'ai_multiple_choice' | 'text_only'
    
    // Opções específicas: Quiz -> Roleta
    const [selectedClassId, setSelectedClassId] = useState('');
    const [includeOptionsInCard, setIncludeOptionsInCard] = useState(true);

    // Estado de processamento / IA
    const [isGenerating, setIsGenerating] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');
    const [error, setError] = useState(null);

    // Inicialização ao abrir o modal
    useEffect(() => {
        if (isOpen) {
            const cleanTopic = sourceTopic ? sourceTopic.replace(/^(Roleta|Quiz):\s*/i, '').trim() : 'Geral';
            
            if (mode === 'roulette_to_quiz') {
                setTargetTitle(`Quiz: ${cleanTopic}`);
                setQuizMode('ai_multiple_choice');
            } else {
                setTargetTitle(`Roleta: ${cleanTopic}`);
                // Seleciona primeira turma com alunos por padrão
                const firstWithStudents = classes.find(c => c.students && c.students.length > 0);
                setSelectedClassId(firstWithStudents ? firstWithStudents.id : (classes[0]?.id || ''));
                setIncludeOptionsInCard(true);
            }

            // Seleciona todas as perguntas por padrão
            setSelectedIndices(new Set(sourceQuestions.map((_, i) => i)));
            setIsGenerating(false);
            setStatusMessage('');
            setError(null);
        }
    }, [isOpen, mode, sourceQuestions, sourceTopic, classes]);

    if (!isOpen) return null;

    const toggleSelectAll = () => {
        if (selectedIndices.size === sourceQuestions.length) {
            setSelectedIndices(new Set());
        } else {
            setSelectedIndices(new Set(sourceQuestions.map((_, i) => i)));
        }
        gameAudio?.playTick?.();
    };

    const toggleIndex = (idx) => {
        const next = new Set(selectedIndices);
        if (next.has(idx)) {
            next.delete(idx);
        } else {
            next.add(idx);
        }
        setSelectedIndices(next);
        gameAudio?.playTick?.();
    };

    const handleExecuteTransition = async () => {
        if (selectedIndices.size === 0) {
            setError('Selecione ao menos 1 questão para transferir.');
            return;
        }

        const chosenQuestions = sourceQuestions.filter((_, idx) => selectedIndices.has(idx));
        setIsGenerating(true);
        setError(null);

        try {
            if (mode === 'roulette_to_quiz') {
                let finalQuestions = [];

                if (quizMode === 'ai_multiple_choice') {
                    setStatusMessage('A Inteligência Artificial está gerando alternativas plausíveis para as questões...');
                    finalQuestions = await generateDistractorsWithAI(chosenQuestions, geminiService, selectedModel);
                } else {
                    setStatusMessage('Convertendo em formato dissertativo...');
                    finalQuestions = convertRouletteQuestionsToQuiz(chosenQuestions, { mode: 'text_only' });
                }

                // Cria conteúdo formatado de texto para compatibilidade
                let formattedText = '';
                let gabaritoText = '\n--- GABARITO ---\n';
                finalQuestions.forEach((q, i) => {
                    formattedText += `${i + 1}. ${q.statement}\n`;
                    if (q.ordered_options && q.ordered_options.length > 0) {
                        q.ordered_options.forEach((opt, oi) => {
                            formattedText += `${String.fromCharCode(65 + oi)}) ${opt}\n`;
                        });
                    }
                    formattedText += '\n';
                    gabaritoText += `${i + 1}. ${q.correct_answer}\n`;
                });

                const fullContent = formattedText + (quizMode === 'ai_multiple_choice' ? gabaritoText : '');

                addActivityTab({
                    title: targetTitle || 'Quiz',
                    type: 'quiz',
                    content: fullContent,
                    quizData: {
                        intro_text: `Atividade sobre ${sourceTopic || 'o tema estudado'}.`,
                        questions: finalQuestions
                    }
                });

                gameAudio?.playSuccess?.();
                if (onSuccess) onSuccess();
                onClose();
            } else {
                // Modo: Quiz -> Roleta
                setStatusMessage('Adaptando questões para a Roleta Pedagógica...');
                
                const rouletteQuestions = convertQuizQuestionsToRoulette(chosenQuestions, {
                    includeOptions: includeOptionsInCard
                });

                addActivityTab({
                    title: targetTitle || 'Roleta',
                    type: 'roulette',
                    content: `Roleta sobre ${sourceTopic || 'o tema estudado'}`,
                    classId: selectedClassId || undefined,
                    questions: rouletteQuestions,
                    topic: sourceTopic || 'Geral'
                });

                gameAudio?.playSuccess?.();
                if (onSuccess) onSuccess();
                onClose();
            }
        } catch (err) {
            console.error('[TransitionQuestionsModal] Erro ao transicionar:', err);
            setError(err.message || 'Ocorreu um erro ao converter as questões.');
            setIsGenerating(false);
        }
    };

    const isRouletteToQuiz = mode === 'roulette_to_quiz';

    const modalFooter = (
        <div className="flex flex-col sm:flex-row items-center justify-between w-full gap-3">
            <div className="text-xs text-brown-600 font-medium text-center sm:text-left">
                {selectedIndices.size} de {sourceQuestions.length} questões selecionadas
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button 
                    onClick={onClose} 
                    variant="secondary" 
                    disabled={isGenerating}
                    className="flex-1 sm:flex-initial"
                >
                    Cancelar
                </Button>
                <Button
                    onClick={handleExecuteTransition}
                    disabled={isGenerating || selectedIndices.size === 0}
                    className="flex-1 sm:flex-initial bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-bold"
                    icon={isGenerating ? Loader2 : isRouletteToQuiz ? CheckCircle : Dices}
                >
                    {isGenerating 
                        ? 'Processando...' 
                        : isRouletteToQuiz 
                            ? 'Criar e Abrir Quiz' 
                            : 'Criar e Abrir Roleta'
                    }
                </Button>
            </div>
        </div>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={isGenerating ? undefined : onClose}
            title={isRouletteToQuiz ? "Transformar Perguntas da Roleta em Quiz" : "Jogar Questões do Quiz na Roleta"}
            icon={isRouletteToQuiz ? CheckCircle : Dices}
            size="lg"
            footer={modalFooter}
        >
            <div className="space-y-5">
                {/* Banner de Apresentação */}
                <div className={`p-4 rounded-2xl border flex items-start gap-3.5 ${
                    isRouletteToQuiz 
                        ? 'bg-amber-50/80 border-amber-200 text-amber-900' 
                        : 'bg-indigo-50/80 border-indigo-200 text-indigo-900'
                }`}>
                    <div className={`p-2 rounded-xl text-white shrink-0 mt-0.5 ${
                        isRouletteToQuiz ? 'bg-amber-600' : 'bg-indigo-600'
                    }`}>
                        <ArrowRight className="w-5 h-5" />
                    </div>
                    <div className="space-y-1 text-sm">
                        <h4 className="font-black text-base">
                            {isRouletteToQuiz 
                                ? 'Reutilizar na Prova / Quiz Interativo' 
                                : 'Levar Questões para Sorteio Dinâmico na Roleta'
                            }
                        </h4>
                        <p className="text-xs leading-relaxed opacity-90">
                            {isRouletteToQuiz
                                ? 'As perguntas e gabaritos da sua Roleta serão convertidos em uma nova aba de Quiz, permitindo gerar folhas de questões impressas ou jogadas interativamente.'
                                : 'As questões com alternativas e respostas do seu Quiz serão transformadas em perguntas prontas para sortear alunos, testar conhecimentos e acionar a bomba de tempo.'
                            }
                        </p>
                    </div>
                </div>

                {/* Mensagens de Erro */}
                {error && (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                {/* Estado de Carregamento da IA */}
                {isGenerating && (
                    <div className="py-8 px-4 text-center bg-amber-50/60 rounded-2xl border border-amber-200 space-y-3 animate-pulse">
                        <Loader2 className="w-8 h-8 text-amber-600 animate-spin mx-auto" />
                        <h4 className="font-black text-sm text-amber-900">
                            {statusMessage || 'Processando transição...'}
                        </h4>
                        <p className="text-xs text-amber-700 max-w-md mx-auto">
                            Isso levará apenas alguns segundos. Estamos preparando o novo jogo para você!
                        </p>
                    </div>
                )}

                {!isGenerating && (
                    <>
                        {/* Seção 1: Configurações Gerais */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-brown-700 uppercase tracking-wider mb-1.5">
                                    Título da Nova Atividade:
                                </label>
                                <input
                                    type="text"
                                    value={targetTitle}
                                    onChange={(e) => setTargetTitle(e.target.value)}
                                    placeholder="Ex: Quiz de Ciências"
                                    className="w-full px-3.5 py-2.5 bg-white border border-brown-200 rounded-xl text-sm font-semibold text-brown-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                />
                            </div>

                            {/* Se for Quiz -> Roleta: Seleção de Turma */}
                            {!isRouletteToQuiz && (
                                <div>
                                    <label className="block text-xs font-bold text-brown-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                                        <Users className="w-3.5 h-3.5 text-indigo-600" />
                                        Turma da Roleta:
                                    </label>
                                    <select
                                        value={selectedClassId}
                                        onChange={(e) => setSelectedClassId(e.target.value)}
                                        className="w-full px-3.5 py-2.5 bg-white border border-brown-200 rounded-xl text-sm font-semibold text-brown-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                                    >
                                        <option value="">Nenhuma turma selecionada (escolher depois)</option>
                                        {classes.map(c => (
                                            <option key={c.id} value={c.id}>
                                                {c.name} ({c.students?.length || 0} alunos)
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Se for Roleta -> Quiz: Modo de Múltipla Escolha vs Dissertativo */}
                            {isRouletteToQuiz && (
                                <div className="sm:col-span-2 space-y-2">
                                    <label className="block text-xs font-bold text-brown-700 uppercase tracking-wider">
                                        Formato das Questões no Quiz:
                                    </label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {/* Opção 1: IA com alternativas */}
                                        <button
                                            type="button"
                                            onClick={() => setQuizMode('ai_multiple_choice')}
                                            className={`p-3.5 rounded-xl border-2 text-left transition-all relative flex flex-col justify-between ${
                                                quizMode === 'ai_multiple_choice'
                                                    ? 'bg-amber-50/80 border-amber-500 text-amber-950 shadow-xs'
                                                    : 'bg-white border-brown-200 text-brown-700 hover:bg-brown-50'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2 mb-1">
                                                <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                                                <span className="font-bold text-xs sm:text-sm">
                                                    Múltipla Escolha (com IA)
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-brown-600 leading-normal">
                                                A IA cria 3 distratores pedagógicos coerentes para cada questão dissertativa. Fica pronto para o jogo interativo e prova!
                                            </p>
                                        </button>

                                        {/* Opção 2: Dissertativo puro */}
                                        <button
                                            type="button"
                                            onClick={() => setQuizMode('text_only')}
                                            className={`p-3.5 rounded-xl border-2 text-left transition-all relative flex flex-col justify-between ${
                                                quizMode === 'text_only'
                                                    ? 'bg-amber-50/80 border-amber-500 text-amber-950 shadow-xs'
                                                    : 'bg-white border-brown-200 text-brown-700 hover:bg-brown-50'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2 mb-1">
                                                <FileText className="w-4 h-4 text-amber-600 shrink-0" />
                                                <span className="font-bold text-xs sm:text-sm">
                                                    Dissertativo / Aberto (Instantâneo)
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-brown-600 leading-normal">
                                                Mantém perguntas abertas. Na folha de impressão, cria linhas de escrita para os alunos e gabarito separado para o professor.
                                            </p>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Se for Quiz -> Roleta: Opção de Exibir Alternativas */}
                        {!isRouletteToQuiz && (
                            <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors">
                                <input
                                    type="checkbox"
                                    checked={includeOptionsInCard}
                                    onChange={(e) => setIncludeOptionsInCard(e.target.checked)}
                                    className="w-4 h-4 text-indigo-600 rounded cursor-pointer accent-indigo-600"
                                />
                                <span className="text-xs font-bold text-slate-700">
                                    Preservar alternativas de múltipla escolha (A, B, C, D) para visualização opcional no card da Roleta
                                </span>
                            </label>
                        )}

                        {/* Seção 2: Seleção de Questões */}
                        <div className="space-y-2 pt-2 border-t border-brown-100">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-brown-700 uppercase tracking-wider flex items-center gap-1.5">
                                    <HelpCircle className="w-3.5 h-3.5 text-brown-500" />
                                    Selecione as Questões para Transferir:
                                </span>
                                <button
                                    type="button"
                                    onClick={toggleSelectAll}
                                    className="text-xs font-bold text-amber-700 hover:text-amber-800 hover:underline flex items-center gap-1"
                                >
                                    {selectedIndices.size === sourceQuestions.length ? (
                                        <>
                                            <CheckSquare className="w-3.5 h-3.5" />
                                            Desmarcar Todas
                                        </>
                                    ) : (
                                        <>
                                            <Square className="w-3.5 h-3.5" />
                                            Selecionar Todas ({sourceQuestions.length})
                                        </>
                                    )}
                                </button>
                            </div>

                            {/* Lista de Questões com Scroll */}
                            <div className="max-h-60 overflow-y-auto space-y-2 p-1 custom-scrollbar border border-brown-200/60 rounded-xl bg-slate-50/50">
                                {sourceQuestions.map((q, idx) => {
                                    const isSelected = selectedIndices.has(idx);
                                    const statement = q.question || q.statement || `Questão ${idx + 1}`;
                                    const answer = q.answer || q.correct_answer || '';
                                    const diff = q.difficulty || 'Média';

                                    return (
                                        <div
                                            key={idx}
                                            onClick={() => toggleIndex(idx)}
                                            className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
                                                isSelected
                                                    ? 'bg-white border-amber-300 shadow-2xs'
                                                    : 'bg-white/60 border-slate-200 opacity-60 hover:opacity-100'
                                            }`}
                                        >
                                            <div className="pt-0.5">
                                                <div className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${
                                                    isSelected ? 'bg-amber-600 border-amber-600 text-white' : 'border-slate-300 bg-white'
                                                }`}>
                                                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                                                </div>
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-[11px] font-black text-brown-600 bg-brown-100 px-1.5 py-0.5 rounded">
                                                        #{idx + 1}
                                                    </span>
                                                    <span className="text-[10px] font-bold text-slate-500">
                                                        {diff}
                                                    </span>
                                                </div>
                                                <p className="text-xs font-semibold text-slate-800 line-clamp-2">
                                                    {statement}
                                                </p>
                                                {answer && (
                                                    <p className="text-[11px] text-emerald-700 font-medium mt-1 truncate">
                                                        <span className="font-bold">Gabarito:</span> {answer}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}

                                {sourceQuestions.length === 0 && (
                                    <div className="py-6 text-center text-xs text-slate-400 italic">
                                        Nenhuma questão encontrada nesta atividade.
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </Modal>
    );
};
