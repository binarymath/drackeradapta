import React from 'react';
import { Check } from 'lucide-react';
import confetti from 'canvas-confetti';
import { gameAudio } from '../../../utils/gameAudio';

export const RouletteModeTodosRespondem = ({
    activeStudents,
    allStudents = [],
    winner,
    onBatchResult,
    showSelectionGrid,
    setShowSelectionGrid,
    studentStatuses = {},
    setStudentStatuses
}) => {
    const baseStudents = (allStudents && allStudents.length > 0) 
        ? allStudents.filter(s => s.status !== 'absent') 
        : activeStudents;

    const studentsToList = [...baseStudents].sort((a, b) => a.name.localeCompare(b.name));

    return (
        <div className="bg-indigo-50/90 border-2 border-indigo-200 p-5 rounded-2xl space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Ações de Pontuação Coletiva */}
            <div className="space-y-3">
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
                                    studentIds: studentsToList.map(s => s.id),
                                    questionText: winner.question
                                });
                            }
                        }}
                        disabled={showSelectionGrid}
                        className={`p-3.5 rounded-xl font-bold text-sm shadow-md transition-all active:scale-95 flex flex-col items-center justify-center gap-1 ${
                            showSelectionGrid 
                                ? 'bg-slate-100 text-slate-400 border-2 border-slate-200 opacity-50 cursor-not-allowed' 
                                : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white'
                        }`}
                    >
                        <span className="flex items-center gap-1.5 text-base">
                            🏆 Toda a Turma Acertou!
                        </span>
                        <span className={`text-2xs font-normal ${showSelectionGrid ? 'text-slate-400' : 'text-emerald-100'}`}>
                            +1 ponto para todos os {studentsToList.length} alunos
                        </span>
                    </button>

                    <button
                        onClick={() => setShowSelectionGrid(!showSelectionGrid)}
                        className={`p-3.5 rounded-xl font-bold text-sm shadow-xs transition-all active:scale-95 flex flex-col items-center justify-center gap-1 border-2 ${
                            showSelectionGrid
                                ? 'bg-indigo-50 border-indigo-400 text-indigo-900 ring-2 ring-indigo-200'
                                : 'bg-white border-indigo-300 text-indigo-800 hover:bg-indigo-50'
                        }`}
                    >
                        <span className="flex items-center gap-1.5 text-base">
                            🎯 Marcar Quem Acertou
                        </span>
                        <span className={`text-2xs font-normal ${showSelectionGrid ? 'text-indigo-700' : 'text-indigo-600'}`}>
                            {showSelectionGrid ? 'Ocultar lista seletiva' : 'Escolher alunos que acertaram'}
                        </span>
                    </button>
                </div>

                {/* Grade Seletiva de Alunos */}
                {showSelectionGrid && (
                    <div className="bg-white p-4 rounded-xl border border-indigo-200 shadow-sm space-y-3 animate-in fade-in duration-200">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-slate-700">
                                Resumo: {Object.values(studentStatuses).filter(s => s === 'correct').length} Acertaram | {Object.values(studentStatuses).filter(s => s === 'did_not_execute').length} Não Executaram
                            </span>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => {
                                    const next = {};
                                    studentsToList.forEach(s => next[s.id] = 'correct');
                                    setStudentStatuses(next);
                                }}
                                    className="text-2xs font-bold text-indigo-600 hover:underline cursor-pointer"
                                >
                                    Marcar Todos
                                </button>
                                <span className="text-slate-300">|</span>
                                <button 
                                    onClick={() => {
                                    const next = {};
                                    studentsToList.forEach(s => next[s.id] = 'unselected');
                                    setStudentStatuses(next);
                                }}
                                    className="text-2xs font-bold text-slate-500 hover:underline cursor-pointer"
                                >
                                    Limpar
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-1">
                            {studentsToList.map(student => {
                                const status = studentStatuses[student.id] || 'unselected';
                                
                                let btnClass = 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100';
                                let icon = <div className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0 ml-1"></div>;
                                
                                if (status === 'correct') {
                                    btnClass = 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold';
                                    icon = <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 ml-1" />;
                                } else if (status === 'did_not_execute') {
                                    btnClass = 'bg-rose-50 border-rose-300 text-rose-900 font-bold';
                                    icon = <span className="w-3.5 h-3.5 flex items-center justify-center text-rose-600 shrink-0 ml-1 font-bold">X</span>;
                                }
                                
                                return (
                                    <button
                                        key={student.id}
                                        onClick={() => {
                                            setStudentStatuses(prev => {
                                                const next = { ...prev };
                                                if (status === 'correct') next[student.id] = 'did_not_execute';
                                                else if (status === 'did_not_execute') next[student.id] = 'unselected';
                                                else next[student.id] = 'correct';
                                                return next;
                                            });
                                            gameAudio.playTick();
                                        }}
                                        className={`p-2 rounded-lg text-xs flex items-center justify-between border transition-all text-left cursor-pointer ${btnClass}`}
                                    >
                                        <span className="truncate">{student.name}</span>
                                        {icon}
                                    </button>
                                );
                            })}
                        </div>

<div className="mt-2">
                            <button
                                disabled={Object.values(studentStatuses).filter(s => s !== 'unselected').length === 0}
                                onClick={() => {
                                    const correctIds = Object.keys(studentStatuses).filter(id => studentStatuses[id] === 'correct');
                                    const notExecutedIds = Object.keys(studentStatuses).filter(id => studentStatuses[id] === 'did_not_execute');
                                    
                                    if (correctIds.length === 0 && notExecutedIds.length === 0) return;
                                    
                                    gameAudio.playSuccess();
                                    if (correctIds.length > 0) confetti({ particleCount: 40, spread: 70 });
                                    
                                    if (onBatchResult) {
                                        if (correctIds.length > 0) {
                                            onBatchResult({
                                                studentIds: correctIds,
                                                questionText: winner.question,
                                                actionType: 'correct'
                                            });
                                        }
                                        if (notExecutedIds.length > 0) {
                                            // Add small delay so React state batches don't overlap if needed, though sequential synchronous works in React 18+
                                            setTimeout(() => {
                                                onBatchResult({
                                                    studentIds: notExecutedIds,
                                                    questionText: winner.question,
                                                    actionType: 'did_not_execute'
                                                });
                                            }, 50);
                                        }
                                    }
                                }}
                                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:text-slate-500 text-white font-black rounded-xl text-sm transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                            >
                                <Check className="w-4 h-4" />
                                Confirmar Ações
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
