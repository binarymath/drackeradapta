import React, { useState, useMemo, useEffect } from 'react';
import { useActivity } from '../../contexts/ActivityContext';
import { RouletteWheel } from './RouletteWheel';
import { RouletteCard } from './RouletteCard';
import { StudentHistoryModal } from './StudentHistoryModal';
import { RouletteQuestionsEditorModal } from './RouletteQuestionsEditorModal';
import { CheckCircle, XCircle, RotateCcw, List, Download, UserX, Edit3 } from 'lucide-react';

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
    
    // Modal de Histórico e Edição
    const [historyStudent, setHistoryStudent] = useState(null);
    const [showQuestionsEditor, setShowQuestionsEditor] = useState(false);

    // Combina os dados persistentes da turma com as perguntas geradas para esta aba
    const combinedItems = useMemo(() => {
        if (!currentClass) return [];
        const questions = activeActivity?.questions || [];
        
        // Pega apenas as perguntas únicas geradas para esta aba mantendo os objetos (com imageUrl)
        const uniqueMap = new Map();
        questions.forEach(q => {
            if (q && q.question && !uniqueMap.has(q.question)) {
                uniqueMap.set(q.question, q);
            }
        });
        const uniqueQuestions = Array.from(uniqueMap.values());
        
        return currentClass.students.map((student, idx) => {
            // Distribui as perguntas sequencialmente para os alunos da turma selecionada
            const questionObj = uniqueQuestions.length > 0 ? uniqueQuestions[idx % uniqueQuestions.length] : null;
            const rawQuestion = questionObj ? questionObj.question : 'Nenhuma pergunta gerada para esta sessão.';
                
            return {
                ...student,
                // Applica a formatação BR retroativamente
                question: rawQuestion.replace(/(\d+)\.(\d+)/g, '$1,$2'),
                imageUrl: questionObj ? questionObj.imageUrl : null
            };
        });
    }, [currentClass, activeActivity?.questions]);

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
        
        setWinner(selectedWinner);
    };

    const handleSpinComplete = () => {
        setSpinning(false);
        setShowCard(true); // Mostra o card com nome e pergunta
    };

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
        } else if (resultType === 'incorrect') {
            updateStudentInClass(winner.id, { misses: (winner.misses || 0) + 1 }, historyEntry);
            // Mantém ativo na roleta
        } else if (resultType === 'absent') {
            updateStudentInClass(winner.id, { status: 'absent' }, historyEntry);
        }

        setShowCard(false);
        setWinner(null);
    };

    const handleReactivate = (id) => {
        updateStudentInClass(id, { status: 'active' });
    };

    const handleDownloadCSV = () => {
        if (!currentClass) return;
        
        let csvContent = "Nome do Aluno,Acertos,Erros,Status Atual,Última Pergunta Respondida\n";
        
        currentClass.students.forEach(s => {
            const lastQuestion = s.history && s.history.length > 0 
                ? s.history[s.history.length - 1].question.replace(/,/g, '') // Evita quebrar o CSV
                : 'Nenhuma';
            
            const statusStr = s.status === 'active' ? 'Ativo' : s.status === 'removed' ? 'Acertou/Removido' : 'Ausente';
            csvContent += `${s.name},${s.hits || 0},${s.misses || 0},${statusStr},${lastQuestion}\n`;
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `Relatorio_Turma_${currentClass.name.replace(/\s+/g, '_')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (!currentClass) {
        return (
            <div className="flex flex-col items-center justify-center w-full min-h-[600px] text-center p-8 animate-in fade-in duration-500">
                <div className="bg-indigo-50 border-2 border-indigo-200 rounded-3xl p-12 max-w-2xl shadow-sm">
                    <div className="text-6xl mb-6">👈 🎲</div>
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
            <div className="w-full flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <select 
                            value={classId}
                            onChange={(e) => updateActivityData(activeActivity.id, { classId: e.target.value })}
                            className="text-2xl font-black text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer hover:bg-slate-100 transition-colors"
                            title="Trocar Turma para esta atividade"
                        >
                            {classes.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>
                    <p className="text-slate-500 font-medium">{currentClass.students.length} alunos • Tema: {activeActivity?.topic}</p>
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={() => setShowQuestionsEditor(true)}
                        className="flex items-center gap-2 bg-slate-50 text-slate-700 hover:bg-slate-100 px-4 py-2 rounded-xl font-bold transition-colors border border-slate-200 shadow-sm"
                        title="Editar perguntas e adicionar imagens"
                    >
                        <Edit3 className="w-4 h-4" /> Editar Perguntas
                    </button>
                    <button 
                        onClick={handleDownloadCSV}
                        className="flex items-center gap-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-4 py-2 rounded-xl font-bold transition-colors shadow-sm"
                    >
                        <Download className="w-4 h-4" /> Baixar Relatório
                    </button>
                </div>
            </div>

            <div className="w-full flex flex-col md:flex-row gap-8 items-start justify-center">
                {/* Lado Esquerdo: Roleta */}
                <div className="flex-1 w-full flex flex-col items-center justify-center bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
                    <h2 className="text-2xl font-black text-slate-800 mb-8">Roleta Pedagógica</h2>
                    
                    <RouletteWheel 
                        items={activeItems} 
                        spinning={spinning} 
                        winner={winner} 
                        onSpinComplete={handleSpinComplete} 
                    />

                    <div className="mt-12">
                        <button 
                            onClick={handleSpin}
                            disabled={spinning || activeItems.length === 0}
                            className={`px-10 py-4 rounded-2xl font-black text-2xl shadow-lg transition-all transform hover:scale-105 active:scale-95 flex items-center gap-3 ${
                                spinning || activeItems.length === 0
                                ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                                : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-400 hover:to-orange-400'
                            }`}
                        >
                            {spinning ? 'Girando...' : 'GIRAR A ROLETA! 🎲'}
                        </button>
                    </div>
                </div>

                {/* Lado Direito: Placar e Histórico */}
                <div className="w-full md:w-[450px] flex flex-col gap-6">
                    {/* Placar */}
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <List className="w-5 h-5 text-indigo-500" />
                                Placar da Turma
                            </h3>
                        </div>
                        
                        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                            {combinedItems.map(student => (
                                <div key={student.id} className={`flex flex-col p-3 rounded-xl border ${student.status === 'active' ? 'bg-indigo-50/50 border-indigo-100' : 'bg-slate-50 border-slate-200 opacity-80'}`}>
                                    <div className="flex items-center justify-between">
                                        <span className={`font-bold ${student.status === 'active' ? 'text-indigo-900' : 'text-slate-500 line-through'}`}>
                                            {student.name}
                                            {student.status === 'absent' && <span className="ml-2 text-xs text-orange-500 font-normal no-underline">(Ausente)</span>}
                                        </span>
                                        
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => setHistoryStudent(student)}
                                                className="flex gap-3 text-sm font-semibold bg-white border border-slate-200 px-3 py-1 rounded-lg hover:bg-slate-50 transition-colors"
                                                title="Ver Histórico"
                                            >
                                                <span className="text-emerald-600 flex items-center gap-1">
                                                    <CheckCircle className="w-3.5 h-3.5" /> {student.hits || 0}
                                                </span>
                                                <span className="text-red-500 flex items-center gap-1">
                                                    <XCircle className="w-3.5 h-3.5" /> {student.misses || 0}
                                                </span>
                                            </button>
                                        </div>
                                    </div>
                                    
                                    {student.status !== 'active' && (
                                        <button 
                                            onClick={() => handleReactivate(student.id)}
                                            className="mt-2 text-xs font-bold text-indigo-600 bg-indigo-100 hover:bg-indigo-200 px-3 py-1.5 rounded-lg flex items-center justify-center gap-1 transition-colors self-end"
                                        >
                                            <RotateCcw className="w-3 h-3" /> Colocar na Roleta
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {showCard && winner && (
                <RouletteCard 
                    winner={winner} 
                    onCorrect={() => handleResult('correct')} 
                    onIncorrect={() => handleResult('incorrect')} 
                    onAbsent={() => handleResult('absent')}
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
