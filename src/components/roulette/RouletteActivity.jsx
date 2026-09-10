import React, { useState, useMemo, useEffect } from 'react';
import { useActivity } from '../../contexts/ActivityContext';
import { RouletteWheel } from './RouletteWheel';
import { RouletteCard } from './RouletteCard';
import { StudentHistoryModal } from './StudentHistoryModal';
import { RouletteQuestionsEditorModal } from './RouletteQuestionsEditorModal';
import { CheckCircle, XCircle, RotateCcw, List, Download, UserX, Edit3, RotateCw, RefreshCw, Eye, EyeOff, HeartHandshake, Award } from 'lucide-react';

export const RouletteActivity = () => {
    const { activeActivity, classes, setClasses, updateActivityData } = useActivity();
    
    // O ID da turma e os dados vêm da aba ativa
    const classId = activeActivity?.classId;
    const currentClass = classes.find(c => c.id === classId);

    // MIGRATION: Se a aba foi criada antes do sistema de Turmas (legado), ela terá 'items' mas não 'classId'
    useEffect(() => {
        if (!classId && activeActivity?.items && activeActivity.items.length > 0) {
            console.log("Migrando atividade legada para nova estrutura de Turmas...");
            
            const newClassId = 'legacy_' + Date.now();
            const newClass = {
                id: newClassId,
                name: 'Turma Recuperada (Antiga)',
                students: activeActivity.items.map(item => ({
                    id: item.id || Date.now().toString() + Math.random().toString(36).substr(2, 5),
                    name: item.name,
                    status: item.active !== false ? 'active' : 'removed',
                    hits: item.hits || 0,
                    misses: item.misses || 0,
                    history: []
                }))
            };
            
            // Salvar a nova turma globalmente
            setClasses(prev => [...prev, newClass]);
            
            // Atualizar a aba atual para apontar para esta nova turma e salvar as perguntas
            updateActivityData(activeActivity.id, {
                classId: newClassId,
                questions: activeActivity.items.map(item => ({
                    name: item.name,
                    question: item.question
                })),
                items: undefined // Remove a estrutura antiga
            });
        }
    }, [activeActivity, classId, setClasses, updateActivityData]);
    
    // Sorteio
    const [spinning, setSpinning] = useState(false);
    const [winner, setWinner] = useState(null); // O item sorteado
    const [showCard, setShowCard] = useState(false); // Mostra o card de resultado
    
    // Rastreamento de perguntas usadas nesta sessão para evitar repetição
    const [usedQuestions, setUsedQuestions] = useState(() => new Set());

    // Configuração do professor: exibir ou ocultar a dificuldade das perguntas
    const [showDifficulty, setShowDifficulty] = useState(() => {
        if (activeActivity?.showDifficulty !== undefined) {
            return activeActivity.showDifficulty;
        }
        return true;
    });

    const handleToggleDifficulty = () => {
        const next = !showDifficulty;
        setShowDifficulty(next);
        if (activeActivity && updateActivityData) {
            updateActivityData(activeActivity.id, { showDifficulty: next });
        }
    };

    // Modal de Histórico e Edição
    const [historyStudent, setHistoryStudent] = useState(null);
    const [showQuestionsEditor, setShowQuestionsEditor] = useState(false);

    // Lista única de perguntas disponíveis para esta atividade
    const uniqueQuestions = useMemo(() => {
        const questions = activeActivity?.questions || [];
        const uniqueMap = new Map();
        questions.forEach((q, idx) => {
            if (q && q.question && !uniqueMap.has(q.question)) {
                uniqueMap.set(q.question, {
                    id: q.id || `q_${idx}_${Date.now()}`,
                    question: (q.question || '').replace(/(\d+)\.(\d+)/g, '$1,$2'),
                    answer: q.answer ? q.answer.replace(/(\d+)\.(\d+)/g, '$1,$2') : '',
                    difficulty: q.difficulty || (idx % 3 === 0 ? 'Fácil' : idx % 3 === 1 ? 'Média' : 'Difícil'),
                    imageUrl: q.imageUrl || null
                });
            }
        });
        return Array.from(uniqueMap.values());
    }, [activeActivity?.questions]);

    // Combina os dados persistentes da turma com as perguntas geradas para esta aba
    const combinedItems = useMemo(() => {
        if (!currentClass) return [];
        
        return currentClass.students.map((student, idx) => {
            const questionObj = uniqueQuestions.length > 0 ? uniqueQuestions[idx % uniqueQuestions.length] : null;
            const rawQuestion = questionObj ? questionObj.question : 'Nenhuma pergunta gerada para esta sessão.';
                
            return {
                ...student,
                question: rawQuestion,
                answer: questionObj ? questionObj.answer : '',
                difficulty: questionObj ? questionObj.difficulty : 'Média',
                imageUrl: questionObj ? questionObj.imageUrl : null,
                questionId: questionObj ? questionObj.id : null
            };
        });
    }, [currentClass, uniqueQuestions]);

    const activeItems = combinedItems.filter(i => i.status === 'active');

    // Salvar estado na Turma Global
    const updateStudentInClass = (studentId, updates, historyEntry = null) => {
        const newClasses = classes.map(c => {
            if (c.id === classId) {
                const newStudents = c.students.map(s => {
                    if (s.id === studentId) {
                        const updatedStudent = { ...s, ...updates };
                        if (historyEntry) {
                            updatedStudent.history = [...(s.history || []), historyEntry];
                        }
                        return updatedStudent;
                    }
                    return s;
                });
                return { ...c, students: newStudents };
            }
            return c;
        });
        setClasses(newClasses);
    };

    const handleSpin = () => {
        if (spinning || activeItems.length === 0) return;
        setSpinning(true);
        setShowCard(false);
        setWinner(null);
        
        const randomIdx = Math.floor(Math.random() * activeItems.length);
        const selectedWinner = activeItems[randomIdx];

        // Tentar selecionar uma pergunta que ainda NÃO foi usada nesta sessão para evitar repetição
        let questionObj = null;
        if (uniqueQuestions.length > 0) {
            const unused = uniqueQuestions.filter(q => !usedQuestions.has(q.question));
            if (unused.length > 0) {
                questionObj = unused[Math.floor(Math.random() * unused.length)];
            } else {
                // Se todas já foram usadas, sorteia da lista completa
                questionObj = uniqueQuestions[randomIdx % uniqueQuestions.length];
            }
        }

        const rawQuestion = questionObj ? questionObj.question : 'Nenhuma pergunta gerada para esta sessão.';

        setWinner({
            ...selectedWinner,
            question: rawQuestion,
            answer: questionObj?.answer || '',
            difficulty: questionObj?.difficulty || 'Média',
            imageUrl: questionObj?.imageUrl || null,
            questionId: questionObj?.id || null
        });
    };

    const handleSpinComplete = () => {
        setSpinning(false);
        setShowCard(true); // Mostra o card com nome e pergunta
    };

    // Permite trocar a pergunta do aluno sorteado em tempo real no card
    const handleChangeWinnerQuestion = (newQuestionObj) => {
        if (!newQuestionObj) return;
        setWinner(prev => ({
            ...prev,
            question: newQuestionObj.question,
            answer: newQuestionObj.answer || '',
            difficulty: newQuestionObj.difficulty || prev?.difficulty || 'Média',
            imageUrl: newQuestionObj.imageUrl || null,
            questionId: newQuestionObj.id || null
        }));
    };

    // Ação: RODE NOVAMENTE (Não penaliza e NÃO remove o aluno da lista)
    const handleSpinAgain = () => {
        setShowCard(false);
        setWinner(null);
    };

    // Ação: AVALIAÇÃO INDIVIDUAL (Acertou / Errou / Ausente)
    const handleResult = (resultType) => {
        if (!winner) return;
        
        const historyEntry = {
            date: Date.now(),
            topic: activeActivity?.topic || 'Sem tema',
            question: winner.question,
            result: resultType // 'correct', 'incorrect', 'absent'
        };

        if (resultType === 'correct') {
            updateStudentInClass(winner.id, { status: 'removed', hits: (winner.hits || 0) + 1 }, historyEntry);
            setUsedQuestions(prev => new Set([...prev, winner.question]));
        } else if (resultType === 'incorrect') {
            updateStudentInClass(winner.id, { misses: (winner.misses || 0) + 1 }, historyEntry);
            setUsedQuestions(prev => new Set([...prev, winner.question]));
            // Mantém ativo na roleta
        } else if (resultType === 'absent') {
            updateStudentInClass(winner.id, { status: 'absent' }, historyEntry);
        }

        setShowCard(false);
        setWinner(null);
    };

    // Ação: DINÂMICA "TODOS RESPONDEM" (Pontuação em lote para múltiplos alunos)
    const handleBatchResult = ({ studentIds, questionText }) => {
        if (!studentIds || studentIds.length === 0) return;

        const now = Date.now();
        const newClasses = classes.map(c => {
            if (c.id === classId) {
                const newStudents = c.students.map(s => {
                    if (studentIds.includes(s.id)) {
                        const historyEntry = {
                            date: now,
                            topic: activeActivity?.topic || 'Sem tema',
                            question: `[Desafio da Turma] ${questionText}`,
                            result: 'all_correct'
                        };
                        return {
                            ...s,
                            hits: (s.hits || 0) + 1,
                            history: [...(s.history || []), historyEntry]
                        };
                    }
                    return s;
                });
                return { ...c, students: newStudents };
            }
            return c;
        });

        setClasses(newClasses);
        setUsedQuestions(prev => new Set([...prev, questionText]));
        setShowCard(false);
        setWinner(null);
    };

    // Ação: DINÂMICA "PRECISO DE AJUDA" (Pontuação em dupla com colega ajudante)
    const handleHelpResult = ({ helperStudentId, isCorrect, questionText, helpType = 'colleague' }) => {
        if (!winner) return;

        const now = Date.now();
        const helperStudent = helperStudentId ? currentClass?.students.find(s => s.id === helperStudentId) : null;
        const helperName = helperStudent ? helperStudent.name : null;

        let helpDescription = '';
        if (helperName) {
            helpDescription = `Dupla com ${helperName}`;
        } else if (helpType === 'hint') {
            helpDescription = 'Pista/Dica da Resposta';
        } else if (helpType === 'class_opinion') {
            helpDescription = 'Opinião da Turma';
        } else {
            helpDescription = 'Apoio Pedagógico';
        }

        const newClasses = classes.map(c => {
            if (c.id === classId) {
                const newStudents = c.students.map(s => {
                    // Atualiza o aluno sorteado
                    if (s.id === winner.id) {
                        const historyEntry = {
                            date: now,
                            topic: activeActivity?.topic || 'Sem tema',
                            question: `${questionText} [Ajuda: ${helpDescription}]`,
                            result: isCorrect ? 'help_correct' : 'incorrect',
                            helperName: helperName || undefined,
                            helpType: helpType,
                            helpDescription: helpDescription,
                            hadHelp: true
                        };
                        return {
                            ...s,
                            hits: isCorrect ? (s.hits || 0) + 1 : (s.hits || 0),
                            misses: !isCorrect ? (s.misses || 0) + 1 : (s.misses || 0),
                            helpCount: (s.helpCount || 0) + 1,
                            hadHelp: true,
                            // Se acertou com ajuda, remove da rodada. Se errou, mantém ativo para tentar depois!
                            status: isCorrect ? 'removed' : 'active',
                            history: [...(s.history || []), historyEntry]
                        };
                    }
                    // Se houver colega ajudante, registra explicitamente que AJUDOU!
                    if (helperStudentId && s.id === helperStudentId) {
                        const helperHistoryEntry = {
                            date: now,
                            topic: activeActivity?.topic || 'Sem tema',
                            question: `Ajudou ${winner.name} em: ${questionText}`,
                            result: isCorrect ? 'help_correct' : 'incorrect',
                            helpedStudent: winner.name,
                            isHelperRole: true
                        };
                        return {
                            ...s,
                            hits: isCorrect ? (s.hits || 0) + 1 : (s.hits || 0),
                            helpedCount: (s.helpedCount || 0) + 1,
                            history: [...(s.history || []), helperHistoryEntry]
                        };
                    }
                    return s;
                });
                return { ...c, students: newStudents };
            }
            return c;
        });

        setClasses(newClasses);

        if (isCorrect) {
            setUsedQuestions(prev => new Set([...prev, questionText]));
        }
        setShowCard(false);
        setWinner(null);
    };

    const handleReactivate = (id) => {
        updateStudentInClass(id, { status: 'active' });
    };

    const handleResetUsedQuestions = () => {
        setUsedQuestions(new Set());
    };

    const handleDownloadCSV = () => {
        if (!currentClass) return;
        
        let csvContent = "Nome do Aluno,Acertos,Erros,TEVE AJUDA (Qtd),Detalhes de TEVE AJUDA,AJUDOU (Qtd),Detalhes de AJUDOU,Status Atual,Última Pergunta Respondida\n";
        
        currentClass.students.forEach(s => {
            const history = s.history || [];
            const helpReceivedEntries = history.filter(h => 
                h.result === 'help_correct' || h.hadHelp || h.helperName || (h.question && h.question.includes('[Ajuda:')) || (h.question && h.question.includes('(com ajuda'))
            );
            const helpedOthersEntries = history.filter(h => h.helpedStudent || h.isHelperRole);
            const helpCount = Math.max(helpReceivedEntries.length, s.helpCount || 0);
            const helpedCount = Math.max(helpedOthersEntries.length, s.helpedCount || 0);
            
            const lastQuestion = history.length > 0 
                ? history[history.length - 1].question.replace(/"/g, '""')
                : 'Nenhuma';

            const helpDetailsStr = helpReceivedEntries.length > 0
                ? helpReceivedEntries.map((h, i) => {
                    const desc = h.helpDescription || (h.helperName ? `Dupla com ${h.helperName}` : 'Apoio pedagógico');
                    return `${i + 1}. ${desc}`;
                }).join('; ')
                : 'Nenhuma ajuda recebida';

            const helpedDetailsStr = helpedOthersEntries.length > 0
                ? helpedOthersEntries.map((h, i) => {
                    return `${i + 1}. Ajudou ${h.helpedStudent || 'colega'}`;
                }).join('; ')
                : 'Não atuou como ajudante';
            
            const statusStr = s.status === 'active' ? 'Ativo na Roleta' : s.status === 'removed' ? 'Acertou/Removido' : 'Ausente';
            
            csvContent += `"${s.name}",${s.hits || 0},${s.misses || 0},${helpCount},"${helpDetailsStr.replace(/"/g, '""')}",${helpedCount},"${helpedDetailsStr.replace(/"/g, '""')}","${statusStr}","${lastQuestion}"\n`;
        });

        // Adiciona BOM (\uFEFF) para garantir abertura com acentos corretos no Excel (padrão brasileiro)
        const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `Relatorio_Detalhado_Turma_${currentClass.name.replace(/\s+/g, '_')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (!currentClass) {
        return (
            <div className="flex flex-col items-center justify-center w-full min-h-[600px] text-center p-8 animate-in fade-in duration-500">
                <div className="bg-indigo-50 border-2 border-indigo-200 rounded-3xl p-12 max-w-2xl shadow-sm">
                    <h2 className="text-3xl font-black text-indigo-900 mb-4">Pronto para girar?</h2>
                    <p className="text-lg text-indigo-700 font-medium">
                        Para criar a sua roleta, siga estes passos na <strong className="font-black text-indigo-800">Barra Lateral à esquerda</strong>:
                    </p>
                    <ul className="text-left mt-6 space-y-3 text-indigo-800 font-medium bg-white/60 p-6 rounded-2xl">
                        <li><strong>1.</strong> Selecione a <strong>Turma</strong> (crie uma se não tiver).</li>
                        <li><strong>2.</strong> Digite o <strong>Tema</strong> da aula.</li>
                        <li><strong>3.</strong> Clique no botão vermelho <strong>Gerar Atividade</strong>.</li>
                    </ul>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center w-full max-w-6xl mx-auto py-8 relative min-h-[600px] gap-8 animate-in fade-in zoom-in-95 duration-500">
            
            {/* Header da Turma */}
            <div className="w-full flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <select 
                            value={classId}
                            onChange={(e) => updateActivityData(activeActivity.id, { classId: e.target.value })}
                            className="text-xl sm:text-2xl font-black text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer hover:bg-slate-100 transition-colors"
                            title="Trocar Turma para esta atividade"
                        >
                            {classes.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>
                    <p className="text-slate-500 font-medium text-sm">
                        {currentClass.students.length} alunos • Tema: {activeActivity?.topic || 'Geral'}
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {/* Indicador de Perguntas Utilizadas */}
                    {uniqueQuestions.length > 0 && (
                        <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-800 px-3 py-2 rounded-xl text-xs font-bold">
                            <span>Perguntas: {usedQuestions.size}/{uniqueQuestions.length}</span>
                            {usedQuestions.size > 0 && (
                                <button
                                    onClick={handleResetUsedQuestions}
                                    className="text-amber-600 hover:text-amber-800 ml-1 p-0.5"
                                    title="Resetar perguntas usadas para permitir repeti-las"
                                >
                                    <RefreshCw className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>
                    )}

                    {/* Botão para escolher se exibe ou oculta a dificuldade */}
                    <button 
                        onClick={handleToggleDifficulty}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all border shadow-2xs ${
                            showDifficulty 
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100' 
                            : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                        }`}
                        title={showDifficulty ? 'Nível de dificuldade visível para os alunos (clique para ocultar)' : 'Nível de dificuldade oculto para os alunos (clique para exibir)'}
                    >
                        {showDifficulty ? <Eye className="w-4 h-4 text-emerald-600" /> : <EyeOff className="w-4 h-4 text-slate-400" />}
                        <span>{showDifficulty ? 'Dificuldade: Visível' : 'Dificuldade: Oculta'}</span>
                    </button>

                    <button 
                        onClick={() => setShowQuestionsEditor(true)}
                        className="flex items-center gap-2 bg-slate-50 text-slate-700 hover:bg-slate-100 px-3.5 py-2 rounded-xl font-bold text-xs sm:text-sm transition-colors border border-slate-200 shadow-2xs"
                        title="Editar perguntas e adicionar imagens"
                    >
                        <Edit3 className="w-4 h-4" /> Editar Perguntas
                    </button>

                    <button 
                        onClick={handleDownloadCSV}
                        className="flex items-center gap-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-3.5 py-2 rounded-xl font-bold text-xs sm:text-sm transition-colors shadow-2xs"
                    >
                        <Download className="w-4 h-4" /> Baixar Relatório
                    </button>
                </div>
            </div>

            <div className="w-full flex flex-col md:flex-row gap-8 items-start justify-center">
                {/* Lado Esquerdo: Roleta */}
                <div className="flex-1 w-full flex flex-col items-center justify-center bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-200">
                    <div className="flex items-center justify-between w-full mb-6">
                        <h2 className="text-2xl font-black text-slate-800">Roleta</h2>
                        <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
                            {activeItems.length} alunos na roda
                        </span>
                    </div>
                    
                    <RouletteWheel 
                        items={activeItems} 
                        spinning={spinning} 
                        winner={winner} 
                        onSpinComplete={handleSpinComplete} 
                    />

                    <div className="mt-10">
                        <button 
                            onClick={handleSpin}
                            disabled={spinning || activeItems.length === 0}
                            className={`px-8 sm:px-10 py-4 rounded-2xl font-black text-xl sm:text-2xl shadow-lg transition-all transform hover:scale-105 active:scale-95 flex items-center gap-3 ${
                                spinning || activeItems.length === 0
                                ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                                : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-400 hover:to-orange-400'
                            }`}
                        >
                            {spinning ? 'Girando...' : 'GIRAR A ROLETA! 🎲'}
                        </button>
                    </div>
                </div>

                {/* Lado Direito: Placar e Histórico */}
                <div className="w-full md:w-[420px] flex flex-col gap-6">
                    {/* Placar */}
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <List className="w-5 h-5 text-indigo-500" />
                                Placar da Turma
                            </h3>
                            <span className="text-xs font-bold text-slate-400">
                                {combinedItems.filter(s => s.status === 'removed').length} responderam
                            </span>
                        </div>

                        {/* Legenda Explícita de Ajuda */}
                        <div className="flex items-center gap-2 mb-3 text-2xs font-bold">
                            <span className="bg-sky-50 text-sky-800 border border-sky-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                                <HeartHandshake className="w-3 h-3 text-sky-600" /> Teve Ajuda
                            </span>
                            <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                                <Award className="w-3 h-3 text-emerald-600" /> Ajudou
                            </span>
                        </div>
                        
                        <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1.5 custom-scrollbar">
                            {combinedItems.map(student => {
                                const studentHelps = (student.history || []).filter(h => 
                                    h.result === 'help_correct' || h.hadHelp || h.helperName || (h.question && h.question.includes('(com ajuda')) || (h.question && h.question.includes('[Ajuda:'))
                                );
                                const hadHelp = studentHelps.length > 0 || !!student.hadHelp || (student.helpCount && student.helpCount > 0);
                                const helpCount = Math.max(studentHelps.length, student.helpCount || 0);

                                const studentHelpedOthers = (student.history || []).filter(h => h.helpedStudent || h.isHelperRole);
                                const helpedCount = Math.max(studentHelpedOthers.length, student.helpedCount || 0);

                                return (
                                <div key={student.id} className={`flex flex-col p-2.5 rounded-xl border transition-colors ${student.status === 'active' ? 'bg-indigo-50/40 border-indigo-100' : 'bg-slate-50 border-slate-200 opacity-80'}`}>
                                    {/* Linha Principal: Nome do Aluno e Pontuação */}
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="min-w-0 flex items-center gap-1.5">
                                            <span className={`font-bold text-sm truncate ${student.status === 'active' ? 'text-indigo-950' : 'text-slate-500 line-through'}`} title={student.name}>
                                                {student.name}
                                            </span>
                                            {student.status === 'absent' && (
                                                <span className="text-2xs text-orange-600 bg-orange-50 border border-orange-200 px-1.5 py-0.2 rounded font-semibold no-underline shrink-0">
                                                    Ausente
                                                </span>
                                            )}
                                        </div>
                                        
                                        <div className="flex gap-1.5 shrink-0">
                                            <button 
                                                onClick={() => setHistoryStudent(student)}
                                                className="flex items-center gap-2 text-xs font-bold bg-white border border-slate-200 px-2 py-1 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs"
                                                title="Ver Relatório Detalhado"
                                            >
                                                <span className="text-emerald-600 flex items-center gap-0.5" title="Acertos">
                                                    <CheckCircle className="w-3.5 h-3.5" /> {student.hits || 0}
                                                </span>
                                                <span className="text-red-500 flex items-center gap-0.5" title="Erros">
                                                    <XCircle className="w-3.5 h-3.5" /> {student.misses || 0}
                                                </span>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Linha de Tags: Teve Ajuda e Ajudou (Menores e Bem Postadas) */}
                                    {(hadHelp || helpedCount > 0) && (
                                        <div className="flex items-center gap-1.5 mt-1.5 pt-1.5 border-t border-indigo-100/60 flex-wrap">
                                            {hadHelp && (
                                                <span 
                                                    className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-800 bg-sky-50 border border-sky-200 px-1.5 py-0.5 rounded-md shadow-2xs no-underline"
                                                    title={`Este aluno teve ajuda nesta aula (${helpCount}x)`}
                                                >
                                                    <HeartHandshake className="w-3 h-3 text-sky-600 shrink-0" />
                                                    <span>Teve Ajuda</span>
                                                    <span className="bg-sky-200/80 text-sky-950 font-black px-1 rounded text-[10px] leading-tight">
                                                        {helpCount}
                                                    </span>
                                                </span>
                                            )}

                                            {helpedCount > 0 && (
                                                <span 
                                                    className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-md shadow-2xs no-underline"
                                                    title={`Este aluno ajudou colegas (${helpedCount}x)`}
                                                >
                                                    <Award className="w-3 h-3 text-emerald-600 shrink-0" />
                                                    <span>Ajudou</span>
                                                    <span className="bg-emerald-200/80 text-emerald-950 font-black px-1 rounded text-[10px] leading-tight">
                                                        {helpedCount}
                                                    </span>
                                                </span>
                                            )}
                                        </div>
                                    )}
                                    
                                    {student.status !== 'active' && (
                                        <button 
                                            onClick={() => handleReactivate(student.id)}
                                            className="mt-2 text-xs font-bold text-indigo-600 bg-indigo-100 hover:bg-indigo-200 px-3 py-1.5 rounded-lg flex items-center justify-center gap-1 transition-colors self-end"
                                        >
                                            <RotateCcw className="w-3 h-3" /> Colocar na Roleta
                                        </button>
                                    )}
                                </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* CARD DO RESULTADO DO SORTEIO */}
            {showCard && winner && (
                <RouletteCard 
                    winner={winner} 
                    allQuestions={uniqueQuestions}
                    usedQuestions={usedQuestions}
                    activeStudents={activeItems}
                    onChangeQuestion={handleChangeWinnerQuestion}
                    onCorrect={() => handleResult('correct')} 
                    onIncorrect={() => handleResult('incorrect')} 
                    onSpinAgain={handleSpinAgain}
                    onAbsent={() => handleResult('absent')}
                    onBatchResult={handleBatchResult}
                    onHelpResult={handleHelpResult}
                    showDifficulty={showDifficulty}
                    onToggleDifficulty={handleToggleDifficulty}
                />
            )}

            <StudentHistoryModal 
                isOpen={!!historyStudent} 
                onClose={() => setHistoryStudent(null)} 
                student={historyStudent} 
            />

            <RouletteQuestionsEditorModal 
                isOpen={showQuestionsEditor}
                onClose={() => setShowQuestionsEditor(false)}
                activeActivity={activeActivity}
                updateActivityData={updateActivityData}
            />
        </div>
    );
};
