import React from 'react';

export const QuestionSelectorModal = ({
    show,
    onClose,
    allQuestions,
    winnerQuestion,
    usedQuestions,
    onSelect,
    getDifficultyBadge
}) => {
    if (!show) return null;

    return (
        <div className="bg-indigo-50/95 border-b-2 border-indigo-200 p-4 max-h-56 overflow-y-auto space-y-2 animate-in slide-in-from-top-3 duration-200 shrink-0">
            <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-black text-indigo-900 uppercase tracking-wider">
                    Escolha uma pergunta alternativa:
                </h4>
                <button 
                    onClick={onClose}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                >
                    Fechar ✕
                </button>
            </div>
            <div className="grid grid-cols-1 gap-1.5">
                {allQuestions.map((q, idx) => {
                    const isCurrent = q.question === winnerQuestion;
                    const isUsed = usedQuestions.has(q.question);
                    return (
                        <button
                            key={idx}
                            onClick={() => onSelect(q)}
                            className={`text-left p-2.5 rounded-xl text-xs font-medium transition-all flex items-start justify-between gap-3 border cursor-pointer ${
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
    );
};
