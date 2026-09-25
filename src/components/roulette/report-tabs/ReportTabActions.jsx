import React from 'react';
import { CheckCircle, XCircle, Clock, Search, Filter, HelpCircle, Shuffle, RotateCcw, RotateCw, UserMinus, Flame, Target, Trophy, ChevronDown, ChevronUp } from 'lucide-react';

export const ReportTabActions = (props) => {
    const { metrics, filteredData, actionCategoryFilter, setActionCategoryFilter, actionSearchTerm, setActionSearchTerm, getActionStyle, questionStats, studentStats, groupStats } = props;
    return (
                    <div className="space-y-4 animate-in fade-in duration-200">
                        {/* 1. Indicadores Rápidos de Toques */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-center">
                                <span className="text-lg font-black text-slate-900 block">{metrics.studentSwapsCount || 0}</span>
                                <span className="text-2xs font-bold text-slate-500 uppercase">Trocas Aluno</span>
                            </div>
                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-center">
                                <span className="text-lg font-black text-slate-900 block">{metrics.questionSwapsCount || 0}</span>
                                <span className="text-2xs font-bold text-slate-500 uppercase">Trocas Pergunta</span>
                            </div>
                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-center">
                                <span className="text-lg font-black text-slate-900 block">{metrics.spinAgainCount || 0}</span>
                                <span className="text-2xs font-bold text-slate-500 uppercase">Rode Outra Vez</span>
                            </div>
                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-center">
                                <span className="text-lg font-black text-rose-600 block">{metrics.absentCount || 0}</span>
                                <span className="text-2xs font-bold text-slate-500 uppercase">Ausentes</span>
                            </div>
                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-center">
                                <span className="text-lg font-black text-indigo-600 block">{metrics.spinsCount || 0}</span>
                                <span className="text-2xs font-bold text-slate-500 uppercase">Giros Roleta</span>
                            </div>
                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-center">
                                <span className="text-lg font-black text-amber-600 block">{metrics.totalActions || 0}</span>
                                <span className="text-2xs font-bold text-slate-500 uppercase">Total Toques</span>
                            </div>
                        </div>

                        {/* 2. Barra de Filtro e Busca de Ações */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-slate-50 border border-slate-200 p-2.5 rounded-2xl">
                            {/* Filtro por Categoria */}
                            <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 custom-scrollbar">
                                <button
                                    type="button"
                                    onClick={() => setActionCategoryFilter('all')}
                                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                                        actionCategoryFilter === 'all'
                                            ? 'bg-slate-900 text-white'
                                            : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                                    }`}
                                >
                                    Todos ({(filteredData.actionLogs || []).length})
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActionCategoryFilter('swaps')}
                                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                                        actionCategoryFilter === 'swaps'
                                            ? 'bg-indigo-600 text-white'
                                            : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                                    }`}
                                >
                                    🔄 Trocas ({metrics.studentSwapsCount + metrics.questionSwapsCount})
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActionCategoryFilter('spins')}
                                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                                        actionCategoryFilter === 'spins'
                                            ? 'bg-purple-600 text-white'
                                            : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                                    }`}
                                >
                                    🎲 Giros & Rode Novamente ({metrics.spinsCount + metrics.spinAgainCount})
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActionCategoryFilter('roster')}
                                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                                        actionCategoryFilter === 'roster'
                                            ? 'bg-rose-600 text-white'
                                            : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                                    }`}
                                >
                                    🚫 Ausências & Lista ({metrics.absentCount + metrics.rosterChangesCount})
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActionCategoryFilter('eval')}
                                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                                        actionCategoryFilter === 'eval'
                                            ? 'bg-emerald-600 text-white'
                                            : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                                    }`}
                                >
                                    🎯 Avaliações & Pontos
                                </button>
                            </div>

                            {/* Campo de Busca Textual */}
                            <div className="relative min-w-[200px] sm:w-64">
                                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    value={actionSearchTerm}
                                    onChange={(e) => setActionSearchTerm(e.target.value)}
                                    placeholder="Buscar por aluno, pergunta ou ação..."
                                    className="w-full pl-8 pr-7 py-1 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium"
                                />
                                {actionSearchTerm && (
                                    <button
                                        type="button"
                                        onClick={() => setActionSearchTerm('')}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-black p-0.5"
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* 3. Feed da Linha do Tempo */}
                        {displayedActionLogs.length === 0 ? (
                            <div className="p-8 text-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl">
                                <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                <h4 className="text-sm font-bold text-slate-700 mb-1">Nenhuma ação encontrada</h4>
                                <p className="text-xs text-slate-500 max-w-md mx-auto">
                                    {(filteredData.actionLogs || []).length === 0 
                                        ? 'À medida que a roleta for girada, alunos ou perguntas forem trocados, ausências marcadas ou "Rode Outra Vez" acionado, todos os toques aparecerão aqui em tempo real.'
                                        : 'Nenhum evento corresponde aos filtros ou termo de busca aplicados.'}
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-2.5 relative before:absolute before:left-5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
                                {displayedActionLogs.map((log) => {
                                    const style = getActionStyle(log);
                                    const ActionIcon = style.icon;

                                    return (
                                        <div 
                                            key={log.id} 
                                            className="relative flex items-start gap-3 pl-2 sm:pl-3 group"
                                        >
                                            {/* Ícone na Linha do Tempo */}
                                            <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl ${style.bgColor} ${style.textColor} border ${style.borderColor} flex items-center justify-center shrink-0 relative z-10 shadow-2xs group-hover:scale-105 transition-transform`}>
                                                <ActionIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                            </div>

                                            {/* Card do Evento */}
                                            <div className="flex-1 bg-white border border-slate-200 rounded-2xl p-3 shadow-2xs hover:shadow-xs transition-shadow">
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="text-xs font-black text-slate-900">
                                                            {log.title}
                                                        </span>
                                                        <span className={`text-2xs font-bold px-2 py-0.5 rounded-full border ${style.badgeClass}`}>
                                                            {style.badgeLabel}
                                                        </span>
                                                        {log.gameMode && (
                                                            <span className="text-2xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                                                                {log.gameMode === 'groups' ? '👥 Equipes' : '👤 Individual'}
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div className="flex items-center gap-2 text-2xs text-slate-400 font-mono shrink-0">
                                                        <span className="font-bold text-slate-600">{log.timeFormatted}</span>
                                                        <span>•</span>
                                                        <span>{log.elapsedFormatted}</span>
                                                    </div>
                                                </div>

                                                <p className="text-xs text-slate-700 leading-relaxed font-medium">
                                                    {log.description}
                                                </p>

                                                {/* Detalhes específicos contextuais */}
                                                {(log.question || log.previousQuestion || log.previousStudentName) && (
                                                    <div className="mt-2 pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2 text-2xs text-slate-500">
                                                        {log.previousStudentName && (
                                                            <span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded-md border border-purple-200 font-semibold">
                                                                Substituiu: {log.previousStudentName}
                                                            </span>
                                                        )}
                                                        {log.previousQuestion && (
                                                            <span className="bg-violet-50 text-violet-700 px-2 py-0.5 rounded-md border border-violet-200 font-semibold max-w-xs truncate" title={log.previousQuestion}>
                                                                Anterior: {log.previousQuestion}
                                                            </span>
                                                        )}
                                                        {log.question && (
                                                            <span className="bg-slate-50 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200 font-medium max-w-sm truncate" title={log.question}>
                                                                ❓ {log.question}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                
    );
};
