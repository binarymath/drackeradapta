import React from 'react';
import { X, CheckCircle, XCircle } from 'lucide-react';
import { Modal } from '../ui/Modal';

export const StudentHistoryModal = ({ isOpen, onClose, student }) => {
    if (!student) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Histórico: ${student.name}`} maxWidth="max-w-xl">
            <div className="space-y-6">
                
                <div className="flex justify-around bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    <div className="text-center">
                        <div className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Acertos</div>
                        <div className="text-3xl font-black text-emerald-500 flex items-center justify-center gap-2">
                            <CheckCircle className="w-6 h-6" /> {student.hits}
                        </div>
                    </div>
                    <div className="w-px bg-slate-200"></div>
                    <div className="text-center">
                        <div className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Erros</div>
                        <div className="text-3xl font-black text-red-500 flex items-center justify-center gap-2">
                            <XCircle className="w-6 h-6" /> {student.misses}
                        </div>
                    </div>
                </div>

                <div>
                    <h3 className="font-bold text-slate-800 mb-3 text-lg">Perguntas Respondidas</h3>
                    
                    {!student.history || student.history.length === 0 ? (
                        <p className="text-slate-400 italic text-center py-8">Nenhuma pergunta respondida ainda.</p>
                    ) : (
                        <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                            {student.history.slice().reverse().map((item, idx) => (
                                <div 
                                    key={idx} 
                                    className="p-4 rounded-xl border flex flex-col gap-2"
                                    style={{
                                        backgroundColor: item.result === 'correct' ? '#f0fdf4' : item.result === 'incorrect' ? '#fef2f2' : '#f8fafc',
                                        borderColor: item.result === 'correct' ? '#bbf7d0' : item.result === 'incorrect' ? '#fecaca' : '#e2e8f0'
                                    }}
                                >
                                    <div className="flex justify-between items-start">
                                        <span className={`font-bold text-sm ${item.result === 'correct' ? 'text-emerald-700' : item.result === 'incorrect' ? 'text-red-700' : 'text-slate-600'}`}>
                                            {item.result === 'correct' ? '✅ Acertou' : item.result === 'incorrect' ? '❌ Errou' : 'Ausente (Rodou Novamente)'}
                                        </span>
                                        <span className="text-xs text-slate-400 font-medium">
                                            {new Date(item.date).toLocaleString()}
                                        </span>
                                    </div>
                                    {item.topic && (
                                        <span className="text-xs font-bold text-indigo-600 bg-indigo-100 self-start px-2 py-0.5 rounded-md">
                                            {item.topic}
                                        </span>
                                    )}
                                    <p className="text-slate-700 font-medium">{item.question}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </div>
        </Modal>
    );
};
