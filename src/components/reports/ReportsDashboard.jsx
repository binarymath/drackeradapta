import React, { useState, useMemo } from 'react';
import { useActivity } from '../../contexts/ActivityContext';
import { BarChart3, Users, Clock, ArrowRight, User, ArrowLeft, Trophy, FileText, CheckCircle, XCircle, Plus, Minus, Trash2, Edit2 } from 'lucide-react';
import { Card } from '../ui/Card';
import { PointJustificationModal } from '../roulette/card-modals/PointJustificationModal';

export const ReportsDashboard = () => {
    const { classes, updateStudentInClass } = useActivity();
    const [selectedClassId, setSelectedClassId] = useState(null);
    const [selectedStudentId, setSelectedStudentId] = useState(null);
    const [activeTab, setActiveTab] = useState('alunos'); // 'alunos' | 'conteudo'
    const [customNote, setCustomNote] = useState('');

    const [isPointModalOpen, setIsPointModalOpen] = useState(false);
    const [pointDelta, setPointDelta] = useState(1);
    const [actionStudentId, setActionStudentId] = useState(null);
    const [editingLogId, setEditingLogId] = useState(null);
    const [editingLogText, setEditingLogText] = useState('');

    const handleOpenPointModal = (delta, studentId = selectedStudentId) => {
        setActionStudentId(studentId);
        setPointDelta(delta);
        setIsPointModalOpen(true);
    };

    const handleConfirmPoint = (justification) => {
        const targetStudentId = actionStudentId || selectedStudentId;
        if (!targetStudentId || !currentClass) return;
        const targetStudent = currentClass.students?.find(s => s.id === targetStudentId);
        if (!targetStudent) return;

        const isPositive = pointDelta > 0;
        const newHits = (targetStudent.hits || 0) + pointDelta;

        updateStudentInClass(currentClass.id, targetStudentId, {
            hits: newHits
        }, {
            date: Date.now(),
            topic: 'Ação Rápida',
            question: justification,
            result: isPositive ? 'merit' : 'rule_violation',
            pointsDelta: pointDelta
        });

        setIsPointModalOpen(false);
    };

    const handleAddNote = () => {
        if (!customNote.trim() || !selectedStudentId || !currentClass) return;
        updateStudentInClass(currentClass.id, selectedStudentId, {}, {
            date: Date.now(),
            topic: 'Observação Manual',
            question: customNote,
            result: 'manual_note',
            pointsDelta: 0
        });
        setCustomNote('');
    };

    const handleDeleteLog = (log) => {
        if (!window.confirm("Tem certeza que deseja remover este registro? A pontuação do aluno também será recalculada.")) return;
        const targetStudent = currentClass.students?.find(s => s.id === log.studentId);
        if (!targetStudent) return;

        let newHits = targetStudent.hits || 0;
        let newMisses = targetStudent.misses || 0;

        if (log.pointsDelta !== undefined && log.pointsDelta !== null) {
            if (log.pointsDelta > 0) newHits = Math.max(0, newHits - log.pointsDelta);
            if (log.pointsDelta < 0) newMisses = Math.max(0, newMisses - Math.abs(log.pointsDelta));
        } else {
            const isPositive = log.result === 'correct' || log.result === 'group_activity' || log.result === 'merit';
            const isNegative = log.result === 'incorrect' || log.result === 'absent' || log.result === 'rule_violation';
            if (isPositive) newHits = Math.max(0, newHits - 1);
            if (isNegative) newMisses = Math.max(0, newMisses - 1);
        }

        const newHistory = (targetStudent.history || []).filter(h => h.date !== log.date);

        updateStudentInClass(currentClass.id, log.studentId, {
            hits: newHits,
            misses: newMisses,
            history: newHistory
        });
    };

    const handleEditLogSave = (log) => {
        if (!editingLogText.trim()) return;
        const targetStudent = currentClass.students?.find(s => s.id === log.studentId);
        if (!targetStudent) return;

        const newHistory = (targetStudent.history || []).map(h => 
            h.date === log.date ? { ...h, question: editingLogText } : h
        );

        updateStudentInClass(currentClass.id, log.studentId, {
            history: newHistory
        });
        setEditingLogId(null);
    };

    const currentClass = selectedClassId ? classes.find(c => String(c.id) === String(selectedClassId)) : null;

    // Derived data for Content Analysis
    const contentAnalysis = useMemo(() => {
        if (!currentClass || !currentClass.students) return [];

        const topicsMap = {};
        currentClass.students.forEach(student => {
            (student.history || []).forEach(log => {
                const topic = log.topic && log.topic !== 'Sem tema' ? log.topic : 'Atividades Gerais';
                const question = log.question || 'Ação sem pergunta registrada';

                if (!topicsMap[topic]) topicsMap[topic] = {};
                if (!topicsMap[topic][question]) {
                    topicsMap[topic][question] = { total: 0, correct: 0, incorrect: 0, merit: 0, penalty: 0 };
                }

                topicsMap[topic][question].total += 1;

                if (log.result === 'correct' || log.result === 'group_activity') topicsMap[topic][question].correct += 1;
                else if (log.result === 'incorrect' || log.result === 'absent') topicsMap[topic][question].incorrect += 1;
                else if (log.result === 'merit') topicsMap[topic][question].merit += 1;
                else if (log.result === 'rule_violation') topicsMap[topic][question].penalty += 1;
            });
        });

        return Object.entries(topicsMap).map(([topic, questions]) => ({
            topic,
            questions: Object.entries(questions)
                .map(([q, stats]) => ({ question: q, ...stats }))
                .sort((a, b) => b.total - a.total)
        })).sort((a, b) => a.topic.localeCompare(b.topic));
    }, [currentClass]);

    if (currentClass) {
        const selectedStudent = selectedStudentId ? currentClass.students?.find(s => s.id === selectedStudentId) : null;

        // Histórico a ser exibido na coluna da direita
        const displayedHistory = selectedStudent
            ? (selectedStudent.history || []).map(h => ({ ...h, studentName: selectedStudent.name, studentId: selectedStudent.id }))
            : currentClass.students?.flatMap(s => (s.history || []).map(h => ({ ...h, studentName: s.name, studentId: s.id }))) || [];

        const sortedHistory = displayedHistory.sort((a, b) => b.date - a.date);

        return (
            <div className="w-full h-full p-4 md:p-8 animate-in fade-in slide-in-from-right-4 duration-300 flex flex-col gap-6 overflow-y-auto">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-[2rem] border border-slate-200/60 shadow-sm">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => {
                                setSelectedClassId(null);
                                setSelectedStudentId(null);
                                setActiveTab('alunos');
                            }}
                            className="p-3 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-2xl transition-colors border border-slate-200"
                            title="Voltar para Turmas"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h2 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">{currentClass.name || 'Turma sem nome'}</h2>
                            <p className="text-slate-500 font-medium">{currentClass.students?.length || 0} alunos cadastrados</p>
                        </div>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="flex p-1 bg-slate-100 rounded-2xl">
                        <button
                            onClick={() => setActiveTab('alunos')}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all ${activeTab === 'alunos' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <Users className="w-4 h-4" />
                            Alunos
                        </button>
                        <button
                            onClick={() => setActiveTab('conteudo')}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all ${activeTab === 'conteudo' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <FileText className="w-4 h-4" />
                            Conteúdo Trabalhado
                        </button>
                    </div>
                </div>

                {activeTab === 'alunos' ? (
                    <>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Ranking de Pontuação */}
                        <Card className="p-6 border-2 border-slate-200/60 shadow-sm flex flex-col h-[600px] bg-white rounded-[2rem]">
                            <div className="flex items-center gap-2 mb-6 shrink-0">
                                <div className="p-2 bg-indigo-50 rounded-xl">
                                    <Trophy className="w-6 h-6 text-indigo-600" />
                                </div>
                                <h3 className="font-bold text-xl text-slate-800 tracking-tight">Placar Geral</h3>
                            </div>
                            <div className="flex flex-col gap-2 overflow-y-auto pr-2 custom-scrollbar flex-1">
                                {[...(currentClass.students || [])].sort((a, b) => (b.hits || 0) - (a.hits || 0)).map((student, idx) => {
                                    const isSelected = selectedStudentId === student.id;
                                    return (
                                        <div
                                            key={student.id}
                                            onClick={() => setSelectedStudentId(isSelected ? null : student.id)}
                                            className={`flex items-center justify-between p-3 rounded-2xl border-2 transition-all cursor-pointer ${isSelected ? 'bg-indigo-50 border-indigo-200' : 'bg-slate-50 border-slate-100 hover:border-indigo-100 hover:bg-white'}`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className={`font-black w-6 text-center ${idx < 3 ? 'text-amber-500' : 'text-slate-400'}`}>{idx + 1}º</span>
                                                <span className={`font-bold ${isSelected ? 'text-indigo-800' : 'text-slate-700'}`}>{student.name}</span>
                                            </div>
                                            <div className="flex gap-2 text-sm items-center">
                                                <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-0.5 mr-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); handleOpenPointModal(1, student.id); }}
                                                        className="p-1 rounded-md text-emerald-600 hover:bg-emerald-50 transition-colors"
                                                        title="Adicionar ponto"
                                                    >
                                                        <Plus className="w-3.5 h-3.5" />
                                                    </button>
                                                    <div className="w-px h-3 bg-slate-200"></div>
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); handleOpenPointModal(-1, student.id); }}
                                                        className="p-1 rounded-md text-rose-600 hover:bg-rose-50 transition-colors"
                                                        title="Remover ponto"
                                                    >
                                                        <Minus className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                                <span className="text-emerald-600 font-black bg-emerald-100/50 border border-emerald-200/50 px-2 py-0.5 rounded-lg">+{student.hits || 0} pts</span>
                                            </div>
                                        </div>
                                    );
                                })}
                                {currentClass.students?.length === 0 && (
                                    <p className="text-slate-400 text-sm text-center my-8 font-medium">Nenhum aluno cadastrado nesta turma.</p>
                                )}
                            </div>
                        </Card>

                        {/* Histórico Direcionado */}
                        <Card className={`p-6 border-2 shadow-sm flex flex-col h-[600px] rounded-[2rem] transition-colors ${selectedStudent ? 'border-indigo-200 bg-indigo-50/10' : 'border-slate-200/60 bg-white'}`}>
                            <div className="flex items-center justify-between mb-6 shrink-0">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-xl ${selectedStudent ? 'bg-indigo-100 text-indigo-600' : 'bg-amber-50 text-amber-500'}`}>
                                        <Clock className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-xl text-slate-800 tracking-tight">
                                            {selectedStudent ? 'Histórico do Aluno' : 'Linha do Tempo (Geral)'}
                                        </h3>
                                        {selectedStudent && (
                                            <div className="flex items-center gap-3">
                                                <p className="text-sm font-bold text-indigo-600">{selectedStudent.name}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                {selectedStudent && (
                                    <button
                                        onClick={() => setSelectedStudentId(null)}
                                        className="text-xs font-bold text-slate-500 hover:text-slate-800 bg-slate-100 px-3 py-1.5 rounded-lg transition-colors"
                                    >
                                        Ver Todos
                                    </button>
                                )}
                            </div>
                            <div className="flex flex-col gap-3 overflow-y-auto pr-2 custom-scrollbar flex-1">
                                {sortedHistory.slice(0, 100).map((log, idx) => {
                                    const isMerit = log.result === 'merit';
                                    const isPenalty = log.result === 'rule_violation';
                                    const isManualNote = log.result === 'manual_note';
                                    const isSuccess = log.result === 'correct' || log.result === 'group_activity' || isMerit;

                                    return (
                                        <div key={idx} className="group flex items-start gap-3 p-4 rounded-2xl border border-slate-100 bg-white shadow-sm hover:shadow-md transition-shadow relative">
                                            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 flex gap-2 transition-opacity">
                                                <button 
                                                    onClick={() => { setEditingLogId(log.date); setEditingLogText(log.question); }}
                                                    className="p-1.5 bg-slate-50 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 rounded-lg transition-colors"
                                                    title="Editar"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button 
                                                    onClick={() => handleDeleteLog(log)}
                                                    className="p-1.5 bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                                                    title="Excluir"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                            <div className={`mt-0.5 p-2 rounded-xl shrink-0 ${isManualNote ? 'bg-amber-50 text-amber-500 border border-amber-100' : isSuccess ? 'bg-emerald-50 text-emerald-500 border border-emerald-100' : 'bg-rose-50 text-rose-500 border border-rose-100'}`}>
                                                {isManualNote ? <FileText className="w-4 h-4" /> : isSuccess ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                                            </div>
                                            <div className="flex-1 min-w-0 pr-16">
                                                {!selectedStudent && (
                                                    <p className="text-sm font-black text-slate-800 truncate">{log.studentName}</p>
                                                )}
                                                {editingLogId === log.date ? (
                                                    <div className="mt-2 flex gap-2">
                                                        <input 
                                                            type="text" 
                                                            value={editingLogText}
                                                            onChange={(e) => setEditingLogText(e.target.value)}
                                                            className="flex-1 text-sm border border-slate-200 rounded-lg px-2 py-1"
                                                            autoFocus
                                                        />
                                                        <button onClick={() => handleEditLogSave(log)} className="px-2 py-1 bg-indigo-600 text-white text-xs rounded-lg font-bold">Salvar</button>
                                                        <button onClick={() => setEditingLogId(null)} className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-lg font-bold">Cancelar</button>
                                                    </div>
                                                ) : (
                                                    <p className={`text-sm mt-1 leading-snug ${isMerit || isPenalty || isManualNote ? 'font-bold text-slate-700' : 'text-slate-600'}`}>
                                                        {log.question}
                                                    </p>
                                                )}
                                                <div className="flex flex-wrap gap-2 mt-3 items-center">
                                                    <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md uppercase tracking-wider">{log.topic}</span>
                                                    {isMerit && <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md uppercase">Mérito</span>}
                                                    {isPenalty && <span className="text-[10px] font-black text-rose-600 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-md uppercase">Infração</span>}
                                                    {isManualNote && <span className="text-[10px] font-black text-amber-600 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-md uppercase">Observação</span>}
                                                    <span className="text-[10px] font-bold text-slate-400">• {new Date(log.date).toLocaleDateString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                {sortedHistory.length === 0 && (
                                    <div className="flex flex-col items-center justify-center h-full text-slate-400">
                                        <Clock className="w-12 h-12 mb-3 opacity-20" />
                                        <p className="text-sm font-medium">Nenhum registro encontrado.</p>
                                    </div>
                                )}
                            </div>
                            {selectedStudent && (
                                <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col gap-3 shrink-0">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ações Rápidas</span>
                                        <div className="flex items-center gap-2">
                                            <button 
                                                onClick={() => handleOpenPointModal(1)}
                                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-600 text-xs font-bold transition-colors border border-emerald-200/50"
                                            >
                                                <Plus className="w-3.5 h-3.5" />
                                                Adicionar Ponto
                                            </button>
                                            <button 
                                                onClick={() => handleOpenPointModal(-1)}
                                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold transition-colors border border-rose-200/50"
                                            >
                                                <Minus className="w-3.5 h-3.5" />
                                                Remover Ponto
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <input 
                                            type="text" 
                                            placeholder="Adicionar observação manual sobre o aluno..."
                                            value={customNote}
                                            onChange={(e) => setCustomNote(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
                                            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                        />
                                        <button 
                                            onClick={handleAddNote}
                                            disabled={!customNote.trim()}
                                            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors"
                                        >
                                            Salvar
                                        </button>
                                    </div>
                                </div>
                            )}
                        </Card>
                    </div>

                    {/* Modal de Justificativa */}
                    <PointJustificationModal
                        isOpen={isPointModalOpen}
                        onClose={() => setIsPointModalOpen(false)}
                        targetName={currentClass?.students?.find(s => s.id === (actionStudentId || selectedStudentId))?.name || ''}
                        targetType="student"
                        delta={pointDelta}
                        onConfirm={handleConfirmPoint}
                    />
                    </>
                ) : (
                    /* Aba de Análise de Conteúdo */
                    <div className="flex flex-col gap-6 animate-in fade-in">
                        <div className="bg-indigo-600 text-white p-8 rounded-[2rem] shadow-lg relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-10">
                                <FileText className="w-32 h-32" />
                            </div>
                            <h3 className="text-3xl font-black mb-2 relative z-10">Análise de Conteúdo</h3>
                            <p className="text-indigo-100 font-medium max-w-2xl relative z-10">
                                Veja o desempenho coletivo da turma em cada tópico trabalhado nas atividades gamificadas. Analise quais questões tiveram maior taxa de erro para direcionar suas próximas aulas.
                            </p>
                        </div>

                        {contentAnalysis.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-12 bg-white rounded-[2rem] border border-slate-200">
                                <FileText className="w-16 h-16 text-slate-200 mb-4" />
                                <p className="text-slate-500 font-medium">Não há dados suficientes para análise de conteúdo.</p>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-6 pb-12">
                                {contentAnalysis.map((topicData, idx) => (
                                    <Card key={idx} className="p-6 bg-white border-2 border-slate-200/60 rounded-[2rem] shadow-sm">
                                        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                                            <div className="w-3 h-8 bg-indigo-500 rounded-full"></div>
                                            <h4 className="text-xl font-black text-slate-800 uppercase tracking-tight">{topicData.topic}</h4>
                                        </div>

                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                            {topicData.questions.map((q, qIdx) => {
                                                const accuracy = q.total > 0 ? Math.round((q.correct / q.total) * 100) : 0;
                                                return (
                                                    <div key={qIdx} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col justify-between">
                                                        <p className="text-sm font-bold text-slate-700 mb-4 line-clamp-3">{q.question}</p>

                                                        <div className="flex items-end justify-between mt-auto">
                                                            <div className="flex gap-4">
                                                                <div className="flex flex-col">
                                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Acertos</span>
                                                                    <span className="text-lg font-black text-emerald-500">{q.correct}</span>
                                                                </div>
                                                                <div className="flex flex-col">
                                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Erros</span>
                                                                    <span className="text-lg font-black text-rose-500">{q.incorrect}</span>
                                                                </div>
                                                                <div className="flex flex-col">
                                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Total</span>
                                                                    <span className="text-lg font-black text-slate-600">{q.total}</span>
                                                                </div>
                                                            </div>

                                                            <div className="flex flex-col items-end">
                                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Precisão</span>
                                                                <div className={`px-2 py-1 rounded-lg border font-black text-sm ${accuracy >= 70 ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : accuracy >= 40 ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-rose-50 text-rose-600 border-rose-200'}`}>
                                                                    {accuracy}%
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    }

    // Grid View for all Classes
    return (
        <div className="w-full h-full p-4 md:p-8 animate-in fade-in flex flex-col gap-8 overflow-y-auto bg-slate-50/50">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-100 rounded-2xl text-indigo-600 border-2 border-indigo-200 shadow-sm">
                    <BarChart3 className="w-8 h-8" />
                </div>
                <div>
                    <h2 className="text-3xl font-black text-slate-800 tracking-tight">Relatórios de Turmas</h2>
                    <p className="text-slate-500 font-medium">Acompanhe o engajamento e pontuação global dos alunos.</p>
                </div>
            </div>

            {classes.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl border-2 border-dashed border-slate-200 shadow-sm">
                    <Users className="w-16 h-16 text-slate-300 mb-4" />
                    <h3 className="text-xl font-bold text-slate-600">Nenhuma turma encontrada</h3>
                    <p className="text-slate-500 max-w-md text-center mt-2">Crie atividades gamificadas como a Roleta ou RPG para cadastrar alunos e gerar relatórios automáticos.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-12">
                    {classes.map(c => {
                        const totalStudents = c.students?.length || 0;
                        const totalPoints = (c.students || []).reduce((acc, s) => acc + (s.hits || 0), 0);
                        const totalErrors = (c.students || []).reduce((acc, s) => acc + (s.misses || 0), 0);
                        const allDates = (c.students || []).flatMap(s => s.history || []).map(h => h.date).filter(Boolean);
                        const lastActivityDate = allDates.length > 0 ? new Date(Math.max(...allDates)) : null;

                        return (
                            <div
                                key={c.id}
                                onClick={() => setSelectedClassId(c.id)}
                                className="cursor-pointer"
                            >
                                <Card className="relative overflow-hidden h-full border-0 p-0 flex flex-col gap-0 transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 group bg-white shadow-md rounded-[2rem] isolation-auto">
                                    {/* Animated background gradient on hover */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/80 via-white to-purple-50/80 opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10" />

                                    {/* Top decorative bar */}
                                    <div className="h-2 w-full bg-gradient-to-r from-indigo-500 to-purple-500" />

                                    <div className="p-6 flex flex-col flex-1">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="relative">
                                                <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full group-hover:scale-150 transition-transform duration-500" />
                                                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg relative group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                                                    <Users className="w-8 h-8 text-white" />
                                                </div>
                                            </div>
                                            {/* Status indicator */}
                                            {lastActivityDate && (
                                                <div className="bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs font-black px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                    Ativa
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex-1 mt-2">
                                            <h3 className="font-black text-2xl text-slate-800 line-clamp-2 leading-tight tracking-tight group-hover:text-indigo-900 transition-colors">
                                                {c.name || 'Turma sem nome'}
                                            </h3>

                                            <div className="mt-6 flex flex-col gap-3">
                                                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 group-hover:bg-white/60 border border-slate-100 transition-colors">
                                                    <span className="text-sm font-bold text-slate-500 flex items-center gap-2">
                                                        <Users className="w-4 h-4 text-slate-400" />
                                                        Alunos
                                                    </span>
                                                    <span className="text-base font-black text-slate-700">{totalStudents}</span>
                                                </div>

                                                <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50/50 group-hover:bg-emerald-50 border border-emerald-100 transition-colors">
                                                    <span className="text-sm font-bold text-emerald-600 flex items-center gap-2">
                                                        <Trophy className="w-4 h-4" />
                                                        Pontuação
                                                    </span>
                                                    <span className="text-base font-black text-emerald-700">+{totalPoints}</span>
                                                </div>

                                                <div className="flex items-center justify-between p-3 rounded-xl bg-rose-50/50 group-hover:bg-rose-50 border border-rose-100 transition-colors">
                                                    <span className="text-sm font-bold text-rose-600 flex items-center gap-2">
                                                        <User className="w-4 h-4" />
                                                        Erros
                                                    </span>
                                                    <span className="text-base font-black text-rose-700">-{totalErrors}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pt-5 mt-6 border-t border-slate-100 flex items-center justify-between group-hover:border-indigo-100 transition-colors">
                                            <div className="flex items-center gap-2">
                                                <Clock className="w-4 h-4 text-slate-400 group-hover:text-indigo-400 transition-colors" />
                                                <span className="text-xs text-slate-500 font-bold">
                                                    {lastActivityDate ? lastActivityDate.toLocaleDateString('pt-BR') : 'Sem atividades'}
                                                </span>
                                            </div>
                                            <div className="w-8 h-8 rounded-full bg-slate-100 group-hover:bg-indigo-600 flex items-center justify-center transition-all duration-300">
                                                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
