import React from 'react';

export const StudentSelectorModal = ({
    show,
    onClose,
    allStudents,
    activeStudents,
    winnerId,
    onSelect
}) => {
    if (!show) return null;

    const pool = allStudents.length > 0 ? allStudents : activeStudents;

    return (
        <div className="mt-3 p-3 bg-white/95 text-slate-800 rounded-2xl shadow-xl border-2 border-amber-300 max-h-52 overflow-y-auto relative z-30 text-left custom-scrollbar animate-in slide-in-from-top-2">
            <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black text-amber-950 uppercase tracking-wider">
                    Selecione quem responderá a esta pergunta:
                </span>
                <button
                    type="button"
                    onClick={onClose}
                    className="text-xs font-black text-amber-800 hover:text-amber-950 p-1 cursor-pointer"
                >
                    ✕
                </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {pool
                    .filter(s => s.status !== 'absent')
                    .map(s => {
                        const isCurrent = s.id === winnerId;
                        return (
                            <button
                                key={s.id}
                                type="button"
                                onClick={() => onSelect(s)}
                                className={`p-2 rounded-xl text-xs font-bold flex items-center justify-between border transition-all text-left cursor-pointer ${
                                    isCurrent
                                        ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                                        : 'bg-slate-50 hover:bg-amber-50 border-slate-200 text-slate-800 hover:border-amber-300'
                                }`}
                            >
                                <span className="truncate">{s.name}</span>
                                {s.status === 'removed' && (
                                    <span className="text-[10px] font-normal opacity-70 ml-1 shrink-0">(Fora da roleta)</span>
                                )}
                            </button>
                        );
                    })
                }
            </div>
        </div>
    );
};
