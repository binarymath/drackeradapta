import React from 'react';
import { Check } from 'lucide-react';
import confetti from 'canvas-confetti';
import { gameAudio } from '../../../utils/gameAudio';

export const RouletteModeTodosRespondem = ({
    activeStudents,
    winner,
    onBatchResult,
    showSelectionGrid,
    setShowSelectionGrid,
    selectedStudentIds,
    setSelectedStudentIds
}) => {
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
                                    className="text-2xs font-bold text-indigo-600 hover:underline cursor-pointer"
                                >
                                    Marcar Todos
                                </button>
                                <span className="text-slate-300">|</span>
                                <button 
                                    onClick={() => setSelectedStudentIds(new Set())}
                                    className="text-2xs font-bold text-slate-500 hover:underline cursor-pointer"
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
                                        className={`p-2 rounded-lg text-xs font-semibold flex items-center justify-between border transition-all text-left cursor-pointer ${
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
                            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:text-slate-500 text-white font-black rounded-xl text-sm transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                        >
                            <Check className="w-4 h-4" />
                            Confirmar Pontos para {selectedStudentIds.size} Aluno(s)
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
