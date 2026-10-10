import React, { useMemo, useState } from 'react';
import { X, CheckCircle, XCircle, Trash2, Search, RotateCcw, HelpCircle, Archive, ShieldAlert } from 'lucide-react';

export const QuestionManagerModal = ({ 
    isOpen, 
    onClose, 
    questions, 
    usedQuestions, 
    interactionLogs = [],
    onToggleQuestionActive,
    onResetUsedQuestions
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    
    // Calcula os resultados das questões a partir dos logs
    const questionResults = useMemo(() => {
        const results = {}; // key: question string, value: { correct: count, incorrect: count, history: [] }
        
        // Iterar pelos logs na ordem inversa para pegar cronologia
        const reversedLogs = [...interactionLogs].reverse();
        
        reversedLogs.forEach(log => {
            if (!log.type || !log.details?.question) return;
            
            const q = log.details.question;
            if (!results[q]) {
                results[q] = { correct: 0, incorrect: 0, history: [] };
            }
            
            if (log.type.includes('correct') && !log.type.includes('incorrect')) {
                results[q].correct += 1;
                results[q].history.push({ 
                    type: 'correct', 
                    by: log.details.studentName || log.details.groupName || 'Alguém',
                    className: log.className 
                });
            } else if (log.type.includes('incorrect')) {
                results[q].incorrect += 1;
                results[q].history.push({ 
                    type: 'incorrect', 
                    by: log.details.studentName || log.details.groupName || 'Alguém',
                    className: log.className 
                });
            }
        });
        return results;
    }, [interactionLogs]);

    const filteredQuestions = useMemo(() => {
        // Dedup: se a atividade tiver perguntas duplicadas, pega a mais recente/ativa
        const uniqueMap = new Map();
        
        questions.forEach(q => {
            if (!q.question) return;
            if (q.question.toLowerCase().includes(searchTerm.toLowerCase())) {
                // Se já tem, e a atual é inativa (isActive === false), não sobrescreve a que está na memória a menos que a da memória também seja
                const existing = uniqueMap.get(q.question);
                if (!existing || (existing.isActive === false && q.isActive !== false)) {
                    uniqueMap.set(q.question, q);
                }
            }
        });
        
        return Array.from(uniqueMap.values());
    }, [questions, searchTerm]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>
            
            <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col relative animate-in fade-in zoom-in-95 duration-200">
                {/* Cabecalho */}
                <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between shrink-0 bg-indigo-50/50 rounded-t-2xl">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                            <HelpCircle className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-lg sm:text-xl font-black text-indigo-950">Gerenciar Perguntas</h2>
                            <p className="text-xs font-medium text-slate-500">Veja quais já saíram e acompanhe os acertos</p>
                        </div>
                    </div>
                    
                    <button 
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-400 flex items-center justify-center hover:bg-slate-50 hover:text-slate-600 transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
                
                {/* Controles */}
                <div className="p-4 border-b border-slate-100 bg-white flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
                    <div className="relative w-full sm:w-64">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Buscar pergunta..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                        />
                    </div>
                    
                    <button
                        onClick={onResetUsedQuestions}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 font-bold rounded-xl border border-amber-200 hover:bg-amber-100 transition-colors text-sm"
                    >
                        <RotateCcw className="w-4 h-4" />
                        Devolver todas à roleta
                    </button>
                </div>
                
                {/* Lista */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar bg-slate-50/50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filteredQuestions.map((q, idx) => {
                            const isUsed = usedQuestions.has(q.question);
                            const isActive = q.isActive !== false;
                            const res = questionResults[q.question] || { correct: 0, incorrect: 0, history: [] };
                            
                            return (
                                <div key={q.id || idx} className={`p-4 rounded-xl border transition-all ${!isActive ? 'bg-slate-100 border-slate-200 opacity-60' : (isUsed ? 'bg-white border-indigo-200 shadow-sm' : 'bg-white border-slate-200')}`}>
                                    <div className="flex items-start justify-between gap-3 mb-2">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            {!isActive ? (
                                                <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider bg-slate-200 text-slate-500 px-2 py-0.5 rounded">
                                                    <Archive className="w-3 h-3" /> Removida da Roleta
                                                </span>
                                            ) : isUsed ? (
                                                <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded">
                                                    <CheckCircle className="w-3 h-3" /> Já Saiu
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded">
                                                    Na Roleta
                                                </span>
                                            )}
                                        </div>
                                        
                                        <button
                                            onClick={() => onToggleQuestionActive(q.question, !isActive)}
                                            className={`p-1.5 rounded-lg transition-colors ${isActive ? 'bg-rose-50 text-rose-500 hover:bg-rose-100' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}
                                            title={isActive ? 'Remover esta pergunta da roleta (não será sorteada)' : 'Reativar pergunta'}
                                        >
                                            {isActive ? <Trash2 className="w-4 h-4" /> : <RotateCcw className="w-4 h-4" />}
                                        </button>
                                    </div>
                                    
                                    <p className="text-sm font-bold text-slate-700 mb-3 line-clamp-3" title={q.question}>
                                        {q.question}
                                    </p>
                                    
                                    {isUsed && (res.history.length > 0) && (
                                        <div className="mt-3 pt-3 border-t border-slate-100 flex flex-col gap-2">
                                            <div className="flex flex-wrap gap-2 text-xs mb-1">
                                                {res.correct > 0 && (
                                                    <div className="flex items-center gap-1 text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded-md">
                                                        <CheckCircle className="w-3.5 h-3.5" />
                                                        {res.correct} Acerto{res.correct > 1 ? 's' : ''}
                                                    </div>
                                                )}
                                                {res.incorrect > 0 && (
                                                    <div className="flex items-center gap-1 text-rose-600 font-bold bg-rose-50 px-2 py-1 rounded-md">
                                                        <XCircle className="w-3.5 h-3.5" />
                                                        {res.incorrect} Erro{res.incorrect > 1 ? 's' : ''}
                                                    </div>
                                                )}
                                            </div>
                                            
                                            {(() => {
                                                const uniqueClasses = Array.from(new Set(res.history.map(h => h.className).filter(Boolean)));
                                                if (uniqueClasses.length > 0) {
                                                    return (
                                                        <div className="text-[11px] text-slate-500 font-medium flex items-center gap-2 flex-wrap mt-1">
                                                            <span className="font-bold text-slate-700">Turmas:</span>
                                                            {uniqueClasses.map((cls, i) => (
                                                                <span key={i} className="inline-flex items-center gap-1 font-black uppercase tracking-wider bg-indigo-50 border border-indigo-100 text-indigo-700 px-2 py-0.5 rounded">
                                                                    {cls}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            })()}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                        
                        {filteredQuestions.length === 0 && (
                            <div className="col-span-full py-10 text-center flex flex-col items-center justify-center opacity-50">
                                <Search className="w-10 h-10 mb-3" />
                                <p className="font-bold">Nenhuma pergunta encontrada.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
