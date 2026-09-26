import React from 'react';
import { CheckCircle, XCircle, Clock, Search, Filter, HelpCircle, Shuffle, RotateCcw, RotateCw, UserMinus, Flame, Target, Trophy, ChevronDown, ChevronUp } from 'lucide-react';

export const ReportTabQuestions = (props) => {
    const { metrics, filteredData, actionCategoryFilter, setActionCategoryFilter, actionSearchTerm, setActionSearchTerm, getActionStyle, questionStats, studentStats, groupStats } = props;
    return (
                    <div className="space-y-4 animate-in fade-in duration-200">
                        <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-2xs tracking-wider">
                                        <tr>
                                            <th className="p-3">#</th>
                                            <th className="p-3 min-w-[250px]">Pergunta da Rodada</th>
                                            <th className="p-3 text-center">Dificuldade</th>
                                            <th className="p-3 text-center">Vezes Sorteadas</th>
                                            <th className="p-3 text-center text-emerald-700">Acertos</th>
                                            <th className="p-3 text-center text-rose-700">Erros</th>
                                            <th className="p-3 text-center text-sky-700">Teve Ajuda?</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {questionStats.length === 0 ? (
                                            <tr>
                                                <td colSpan={7} className="p-6 text-center text-slate-400 font-medium">
                                                    Nenhuma pergunta foi sorteada neste período.
                                                </td>
                                            </tr>
                                        ) : (
                                            questionStats.map((q, idx) => (
                                                <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                                                    <td className="p-3 font-mono font-bold text-slate-400">#{idx + 1}</td>
                                                    <td className="p-3">
                                                        <div className="font-bold text-slate-800">{q.question}</div>
                                                        {q.answer && (
                                                            <div className="text-2xs text-slate-500 mt-0.5">
                                                                Resp: <em>{q.answer}</em>
                                                            </div>
                                                        )}
                                                        {/* Quem respondeu */}
                                                        <div className="flex flex-wrap gap-1 mt-1">
                                                            {q.rounds.map((r, ri) => {
                                                                const isClassChallenge = r.result === 'all_correct' || (r.question && r.question.includes('[Desafio da Turma]'));
                                                                const isGroupActivity = r.result === 'group_activity';
                                                                const isCorrect = r.result === 'correct' || r.result === 'help_correct' || r.result === 'all_correct' || r.result === 'group_activity';
                                                                const isIncorrect = r.result === 'incorrect' || r.result === 'group_incorrect';
                                                                const icon = isClassChallenge ? '🏆' : isGroupActivity ? '👥✅' : isCorrect ? '✅' : isIncorrect ? '❌' : '—';
                                                                const label = isClassChallenge ? 'Desafio da Turma' : isGroupActivity ? 'Grupo' : null;
                                                                return (
                                                                    <span key={ri} className={`text-[10px] px-1.5 py-0.2 rounded border font-medium flex items-center gap-0.5 ${
                                                                        isClassChallenge ? 'bg-amber-50 text-amber-800 border-amber-200' :
                                                                        isCorrect ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                                                                        isIncorrect ? 'bg-rose-50 text-rose-700 border-rose-200' :
                                                                        'bg-slate-100 text-slate-700 border-slate-200'
                                                                    }`}>
                                                                        {r.participants.join(', ')} {icon}{label ? ` (${label})` : ''}
                                                                    </span>
                                                                );
                                                            })}
                                                        </div>
                                                    </td>
                                                    <td className="p-3 text-center">
                                                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">
                                                            {q.difficulty}
                                                        </span>
                                                    </td>
                                                    <td className="p-3 text-center font-bold text-slate-700">{q.timesAsked}x</td>
                                                    <td className="p-3 text-center font-black text-emerald-600">{q.correctCount}</td>
                                                    <td className="p-3 text-center font-black text-rose-600">{q.incorrectCount}</td>
                                                    <td className="p-3 text-center">
                                                        {q.helpCount > 0 ? (
                                                            <span className="inline-flex items-center gap-1 font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200 text-xs">
                                                                <HeartHandshake className="w-3.5 h-3.5" />
                                                                <span>{q.helpCount}x</span>
                                                            </span>
                                                        ) : (
                                                            <span className="text-slate-400">-</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                
    );
};
