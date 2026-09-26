import React from 'react';
import { CheckCircle, XCircle, Clock, Search, Filter, HelpCircle, Shuffle, RotateCcw, RotateCw, UserMinus, Flame, Target, Trophy, ChevronDown, ChevronUp } from 'lucide-react';

export const ReportTabStudents = (props) => {
    const { metrics, filteredData, actionCategoryFilter, setActionCategoryFilter, actionSearchTerm, setActionSearchTerm, getActionStyle, questionStats, studentStats, groupStats } = props;
    return (
                    <div className="space-y-4 animate-in fade-in duration-200">
                        <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-2xs tracking-wider">
                                        <tr>
                                            <th className="p-3">Nome do Aluno</th>
                                            <th className="p-3">Equipe</th>
                                            <th className="p-3 text-center">Status na Aula</th>
                                            <th className="p-3 text-center text-emerald-700">Acertos</th>
                                            <th className="p-3 text-center text-rose-700">Erros</th>
                                            <th className="p-3 text-center text-sky-700">Teve Ajuda?</th>
                                            <th className="p-3 text-center text-emerald-700">Ajudou Colegas?</th>
                                            <th className="p-3 text-center">Méritos / Regras</th>
                                            <th className="p-3 text-center text-purple-700">Parecer IA Individual</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {studentStats.map((s, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                                                <td className="p-3 font-bold text-slate-900">
                                                    <div className="flex items-center gap-1.5">
                                                        <span>{s.name}</span>
                                                    </div>
                                                </td>
                                                <td className="p-3 text-slate-600">
                                                    {s.groupName ? (
                                                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                                            👥 {s.groupName}
                                                        </span>
                                                    ) : (
                                                        <span className="text-slate-400 italic">Sem equipe</span>
                                                    )}
                                                </td>
                                                <td className="p-3 text-center">
                                                    {s.isAbsent ? (
                                                        <div className="flex flex-col items-center gap-1">
                                                            <span className="px-2 py-0.5 rounded-full text-2xs font-black bg-rose-100 text-rose-800 border border-rose-200">
                                                                🚫 Ausente
                                                            </span>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleToggleStudentAbsentStatus(s.id, false)}
                                                                className="text-3xs text-emerald-700 font-bold hover:underline cursor-pointer flex items-center gap-0.5"
                                                                title="Restaurar presença deste aluno"
                                                            >
                                                                <UserCheck className="w-2.5 h-2.5" />
                                                                <span>Tornar Presente</span>
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="flex flex-col items-center gap-1">
                                                            {s.participated ? (
                                                                <span className="px-2 py-0.5 rounded-full text-2xs font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                                                                    Respondeu ({s.totalAnswers}x)
                                                                </span>
                                                            ) : (
                                                                <span className="px-2 py-0.5 rounded-full text-2xs font-semibold bg-slate-100 text-slate-500">
                                                                    Não Sorteado
                                                                </span>
                                                            )}
                                                            <button
                                                                type="button"
                                                                onClick={() => handleToggleStudentAbsentStatus(s.id, true)}
                                                                className="text-3xs text-rose-600 font-bold hover:underline cursor-pointer flex items-center gap-0.5"
                                                                title="Marcar aluno ausente retroativamente (desconsidera pontos do Desafio da Turma)"
                                                            >
                                                                <UserX className="w-2.5 h-2.5" />
                                                                <span>Marcar Ausente</span>
                                                            </button>
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="p-3 text-center font-black text-emerald-600">{s.hits}</td>
                                                <td className="p-3 text-center font-black text-rose-600">{s.misses}</td>
                                                <td className="p-3 text-center">
                                                    {s.helpReceived.length > 0 ? (
                                                        <span className="inline-flex items-center gap-1 font-bold text-sky-800 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200 text-xs" title={s.helpReceived.map(h => h.helperName ? `Com ${h.helperName}` : (h.helpDescription || 'Apoio')).join(', ')}>
                                                            <HeartHandshake className="w-3.5 h-3.5" />
                                                            <span>Sim ({s.helpReceived.length}x)</span>
                                                        </span>
                                                    ) : (
                                                        <span className="text-slate-400">-</span>
                                                    )}
                                                </td>
                                                <td className="p-3 text-center">
                                                    {s.helpedOthers.length > 0 ? (
                                                        <span className="inline-flex items-center gap-1 font-black text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300 text-xs" title={s.helpedOthers.map(h => `Ajudou ${h.helpedStudent || 'colega'}`).join(', ')}>
                                                            <Award className="w-3.5 h-3.5 text-emerald-600" />
                                                            <span>Ajudou ({s.helpedOthers.length}x)</span>
                                                        </span>
                                                    ) : (
                                                        <span className="text-slate-400">-</span>
                                                    )}
                                                </td>
                                                <td className="p-3 text-center">
                                                    <div className="flex items-center justify-center gap-1">
                                                        {s.merits > 0 && (
                                                            <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                                                                +{s.merits}
                                                            </span>
                                                        )}
                                                        {s.violations > 0 && (
                                                            <span className="text-[10px] font-black text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded">
                                                                -{s.violations}
                                                            </span>
                                                        )}
                                                        {s.merits === 0 && s.violations === 0 && <span className="text-slate-400">-</span>}
                                                    </div>
                                                </td>
                                                <td className="p-3 text-center">
                                                    <button
                                                        type="button"
                                                        onClick={() => setSelectedStudentForAi(s)}
                                                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs active:scale-95 ${
                                                            studentAiInsights[s.id]
                                                                ? 'bg-purple-100 hover:bg-purple-200 text-purple-900 border border-purple-300'
                                                                : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200'
                                                        }`}
                                                        title="Visualizar ou gerar parecer individual deste aluno com IA"
                                                    >
                                                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                                                        <span>{studentAiInsights[s.id] ? 'Ver Parecer' : '✨ Parecer IA'}</span>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                
    );
};
