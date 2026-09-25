import React from 'react';
import { CheckCircle, XCircle, Clock, Search, Filter, HelpCircle, Shuffle, RotateCcw, RotateCw, UserMinus, Flame, Target, Trophy, ChevronDown, ChevronUp } from 'lucide-react';

export const ReportTabGroups = (props) => {
    const { metrics, filteredData, actionCategoryFilter, setActionCategoryFilter, actionSearchTerm, setActionSearchTerm, getActionStyle, questionStats, studentStats, groupStats } = props;
    return (
                    <div className="space-y-4 animate-in fade-in duration-200">
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                            {groupStats.map((grp, idx) => (
                                <div key={idx} className="bg-white border-2 rounded-2xl p-4 shadow-2xs flex flex-col justify-between" style={{ borderColor: grp.color }}>
                                    <div>
                                        <div className="flex items-center justify-between gap-2 mb-2">
                                            <span className="font-black text-sm text-slate-900 flex items-center gap-1.5">
                                                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: grp.color }} />
                                                <span>{grp.name}</span>
                                            </span>
                                            <span className="text-2xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                                                {grp.memberCount} alunos
                                            </span>
                                        </div>

                                        <div className="text-2xs text-slate-500 mb-3 line-clamp-2">
                                            <strong>Membros:</strong> {grp.memberNames.join(', ')}
                                        </div>
                                    </div>

                                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-emerald-600">✅ {grp.hits} acertos</span>
                                            <span className="font-bold text-rose-600">❌ {grp.misses} erros</span>
                                        </div>
                                        <span className="text-2xs font-semibold text-slate-400">
                                            {grp.roundsCount} rodadas
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                
    );
};
