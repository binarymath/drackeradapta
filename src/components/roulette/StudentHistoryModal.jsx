import React, { useState } from 'react';
import { 
    CheckCircle, XCircle, HeartHandshake, Zap, 
    Printer, Filter, User, HelpCircle, Calendar, Sparkles, Award
} from 'lucide-react';
import { Modal } from '../ui/Modal';

export const StudentHistoryModal = ({ isOpen, onClose, student }) => {
    if (!student) return null;

    const [filterMode, setFilterMode] = useState('all'); // 'all' | 'teve_ajuda' | 'ajudou'

    const getResultBadge = (item) => {
        if (item.isHelperRole) {
            return (
                <span className="font-bold text-xs text-emerald-800 bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <Award className="w-3.5 h-3.5 text-emerald-600" /> Ajudou Colega
                </span>
            );
        }
        if (item.result === 'correct') {
            return (
                <span className="font-bold text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" /> Acertou
                </span>
            );
        }
        if (item.result === 'help_correct') {
            return (
                <span className="font-bold text-xs text-sky-800 bg-sky-50 border border-sky-300 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <HeartHandshake className="w-3.5 h-3.5 text-sky-600" /> Acertou com Ajuda
                </span>
            );
        }
        if (item.result === 'all_correct') {
            return (
                <span className="font-bold text-xs text-purple-700 bg-purple-50 border border-purple-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5" /> Desafio da Turma
                </span>
            );
        }
        if (item.result === 'incorrect') {
            return (
                <span className="font-bold text-xs text-red-700 bg-red-50 border border-red-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <XCircle className="w-3.5 h-3.5" /> Errou
                </span>
            );
        }
        return (
            <span className="font-bold text-xs text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full">
                Ausente
            </span>
        );
    };

    const getItemStyles = (result, isHelperRole) => {
        if (isHelperRole) {
            return { backgroundColor: '#f0fdf4', borderColor: '#86efac' };
        }
        if (result === 'correct') {
            return { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' };
        }
        if (result === 'help_correct') {
            return { backgroundColor: '#f0f9ff', borderColor: '#7dd3fc' };
        }
        if (result === 'all_correct') {
            return { backgroundColor: '#faf5ff', borderColor: '#e9d5ff' };
        }
        if (result === 'incorrect') {
            return { backgroundColor: '#fef2f2', borderColor: '#fecaca' };
        }
        return { backgroundColor: '#f8fafc', borderColor: '#e2e8f0' };
    };

    // Extrair histórico de ajudas
    const historyList = student.history || [];
    const helpReceivedEntries = historyList.filter(h => 
        h.result === 'help_correct' || 
        h.hadHelp || 
        h.helperName || 
        (h.question && (h.question.includes('[Ajuda:') || h.question.includes('(com ajuda')))
    );
    const helpedOthersEntries = historyList.filter(h => h.helpedStudent || h.isHelperRole);
    const helpCount = Math.max(helpReceivedEntries.length, student.helpCount || 0);
    const helpedCount = Math.max(helpedOthersEntries.length, student.helpedCount || 0);

    // Lista filtrada
    const displayedHistory = historyList.slice().reverse().filter(h => {
        const hadHelp = h.result === 'help_correct' || h.hadHelp || h.helperName || (h.question && (h.question.includes('[Ajuda:') || h.question.includes('(com ajuda')));
        const helped = h.helpedStudent || h.isHelperRole;

        if (filterMode === 'teve_ajuda') return hadHelp;
        if (filterMode === 'ajudou') return helped;
        return true;
    });

    // Impressão / Exportação do Relatório Individual
    const handlePrintReport = () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const helpReceivedHtml = helpReceivedEntries.map((h, i) => `
            <li style="margin-bottom: 8px;">
                <strong>Questão ${i + 1}:</strong> ${h.question}<br/>
                <span style="color: #0369a1; font-weight: bold;">TEVE AJUDA:</span> ${h.helpDescription || (h.helperName ? `Dupla com ${h.helperName}` : 'Apoio pedagógico')} 
                <em>(${new Date(h.date).toLocaleDateString()} ${new Date(h.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})</em>
            </li>
        `).join('');

        const helpedOthersHtml = helpedOthersEntries.map((h, i) => `
            <li style="margin-bottom: 8px;">
                <span style="color: #15803d; font-weight: bold;">AJUDOU:</span> Auxiliou o colega <strong>${h.helpedStudent || 'da turma'}</strong> na pergunta: "${h.question}"
                <em>(${new Date(h.date).toLocaleDateString()} ${new Date(h.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})</em>
            </li>
        `).join('');

        const allQuestionsHtml = historyList.map((h, i) => {
            const hadHelp = h.result === 'help_correct' || h.hadHelp || h.helperName || (h.question && (h.question.includes('[Ajuda:') || h.question.includes('(com ajuda')));
            const helped = h.helpedStudent || h.isHelperRole;
            let statusAjuda = '-';
            if (hadHelp) {
                statusAjuda = `<span style="color: #0284c7; font-weight: bold;">TEVE AJUDA (${h.helperName ? `com ${h.helperName}` : h.helpDescription || 'Apoio'})</span>`;
            } else if (helped) {
                statusAjuda = `<span style="color: #16a34a; font-weight: bold;">AJUDOU (${h.helpedStudent})</span>`;
            }

            return `
                <tr style="border-bottom: 1px solid #e2e8f0;">
                    <td style="padding: 8px;">${i + 1}</td>
                    <td style="padding: 8px;">${h.question}</td>
                    <td style="padding: 8px; font-weight: bold; color: ${h.result === 'correct' ? '#15803d' : h.result === 'help_correct' ? '#0369a1' : '#b91c1c'};">
                        ${h.result === 'correct' ? 'Acertou' : h.result === 'help_correct' ? 'Acertou com Ajuda' : h.result === 'all_correct' ? 'Desafio da Turma' : 'Errou'}
                    </td>
                    <td style="padding: 8px;">${statusAjuda}</td>
                    <td style="padding: 8px; font-size: 11px; color: #64748b;">
                        ${new Date(h.date).toLocaleDateString()} ${new Date(h.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                </tr>
            `;
        }).join('');

        printWindow.document.write(`
            <html>
                <head>
                    <title>Relatório Pedagógico: ${student.name}</title>
                    <style>
                        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 24px; color: #1e293b; }
                        h1 { color: #1e1b4b; margin-bottom: 4px; }
                        .subtitle { color: #64748b; font-size: 14px; margin-bottom: 24px; }
                        .metrics { display: flex; gap: 12px; margin-bottom: 24px; }
                        .metric-card { flex: 1; border: 1px solid #cbd5e1; border-radius: 12px; padding: 12px; text-align: center; background: #f8fafc; }
                        .metric-val { font-size: 24px; font-weight: 900; margin-top: 4px; }
                        .help-box { background: #f0f9ff; border: 2px solid #7dd3fc; border-radius: 12px; padding: 16px; margin-bottom: 20px; }
                        .helped-box { background: #f0fdf4; border: 2px solid #86efac; border-radius: 12px; padding: 16px; margin-bottom: 20px; }
                        table { width: 100%; border-collapse: collapse; text-align: left; font-size: 13px; margin-top: 12px; }
                        th { background: #f1f5f9; padding: 8px; border-bottom: 2px solid #cbd5e1; }
                    </style>
                </head>
                <body>
                    <h1>Relatório de Desempenho e Interações Pedagógicas</h1>
                    <div class="subtitle">Aluno(a): <strong>${student.name}</strong> • Data de Emissão: ${new Date().toLocaleDateString()}</div>
                    
                    <div class="metrics">
                        <div class="metric-card">
                            <div style="font-weight: bold; color: #64748b;">Acertos</div>
                            <div class="metric-val" style="color: #16a34a;">${student.hits || 0}</div>
                        </div>
                        <div class="metric-card">
                            <div style="font-weight: bold; color: #64748b;">Erros</div>
                            <div class="metric-val" style="color: #dc2626;">${student.misses || 0}</div>
                        </div>
                        <div class="metric-card" style="border-color: #38bdf8; background: #f0f9ff;">
                            <div style="color: #0369a1; font-weight: bold;">TEVE AJUDA</div>
                            <div class="metric-val" style="color: #0284c7;">${helpCount}</div>
                        </div>
                        <div class="metric-card" style="border-color: #86efac; background: #f0fdf4;">
                            <div style="color: #15803d; font-weight: bold;">AJUDOU</div>
                            <div class="metric-val" style="color: #16a34a;">${helpedCount}</div>
                        </div>
                    </div>

                    ${helpReceivedEntries.length > 0 ? `
                        <div class="help-box">
                            <h3 style="margin-top: 0; color: #0369a1;">🤝 Ocorrências em que TEVE AJUDA:</h3>
                            <ul style="padding-left: 20px; margin-bottom: 0;">
                                ${helpReceivedHtml}
                            </ul>
                        </div>
                    ` : ''}

                    ${helpedOthersEntries.length > 0 ? `
                        <div class="helped-box">
                            <h3 style="margin-top: 0; color: #15803d;">🌟 Ocorrências em que AJUDOU colegas:</h3>
                            <ul style="padding-left: 20px; margin-bottom: 0;">
                                ${helpedOthersHtml}
                            </ul>
                        </div>
                    ` : ''}

                    <h3>Histórico Completo de Perguntas</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Pergunta</th>
                                <th>Resultado</th>
                                <th>Teve Ajuda / Ajudou</th>
                                <th>Data/Hora</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${allQuestionsHtml}
                        </tbody>
                    </table>
                </body>
            </html>
        `);

        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
        }, 300);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Relatório do Aluno: ${student.name}`} maxWidth="max-w-2xl">
            <div className="space-y-5">
                
                {/* Métricas Principais com "Teve Ajuda" e "Ajudou" explícitos */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div className="text-center bg-slate-50 p-3 rounded-2xl border border-slate-200">
                        <div className="text-2xs font-black text-slate-500 uppercase tracking-wider mb-0.5">Acertos</div>
                        <div className="text-2xl font-black text-emerald-600 flex items-center justify-center gap-1">
                            <CheckCircle className="w-5 h-5" /> {student.hits || 0}
                        </div>
                    </div>

                    <div className="text-center bg-slate-50 p-3 rounded-2xl border border-slate-200">
                        <div className="text-2xs font-black text-slate-500 uppercase tracking-wider mb-0.5">Erros</div>
                        <div className="text-2xl font-black text-red-500 flex items-center justify-center gap-1">
                            <XCircle className="w-5 h-5" /> {student.misses || 0}
                        </div>
                    </div>

                    <div className="text-center bg-sky-50/80 p-3 rounded-2xl border-2 border-sky-300">
                        <div className="text-2xs font-black text-sky-900 uppercase tracking-wider mb-0.5">Teve Ajuda</div>
                        <div className="text-2xl font-black text-sky-600 flex items-center justify-center gap-1">
                            <HeartHandshake className="w-5 h-5 text-sky-600" /> {helpCount}
                        </div>
                    </div>

                    <div className="text-center bg-emerald-50/80 p-3 rounded-2xl border-2 border-emerald-300">
                        <div className="text-2xs font-black text-emerald-900 uppercase tracking-wider mb-0.5">Ajudou</div>
                        <div className="text-2xl font-black text-emerald-600 flex items-center justify-center gap-1">
                            <Award className="w-5 h-5 text-emerald-600" /> {helpedCount}
                        </div>
                    </div>
                </div>

                {/* Filtros e Ações */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-200">
                    {/* Abas de filtro explícitas */}
                    <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
                        <button
                            onClick={() => setFilterMode('all')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                filterMode === 'all' 
                                ? 'bg-white text-slate-800 shadow-2xs font-black' 
                                : 'text-slate-500 hover:text-slate-800'
                            }`}
                        >
                            Todas ({historyList.length})
                        </button>
                        <button
                            onClick={() => setFilterMode('teve_ajuda')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                                filterMode === 'teve_ajuda' 
                                ? 'bg-sky-600 text-white shadow-2xs font-black' 
                                : 'text-slate-600 hover:bg-white/60'
                            }`}
                        >
                            <HeartHandshake className="w-3.5 h-3.5" />
                            <span>Teve Ajuda ({helpCount})</span>
                        </button>
                        <button
                            onClick={() => setFilterMode('ajudou')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                                filterMode === 'ajudou' 
                                ? 'bg-emerald-600 text-white shadow-2xs font-black' 
                                : 'text-slate-600 hover:bg-white/60'
                            }`}
                        >
                            <Award className="w-3.5 h-3.5" />
                            <span>Ajudou ({helpedCount})</span>
                        </button>
                    </div>

                    {/* Botão de Impressão */}
                    <button
                        onClick={handlePrintReport}
                        className="flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl transition-all shadow-2xs"
                        title="Imprimir ou salvar relatório individual deste aluno"
                    >
                        <Printer className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Imprimir Relatório</span>
                    </button>
                </div>

                {/* Lista de Questões do Histórico */}
                <div className="space-y-2.5 max-h-[46vh] overflow-y-auto pr-1.5 custom-scrollbar">
                    {displayedHistory.length === 0 ? (
                        <p className="text-slate-400 italic text-center py-8 text-sm">
                            {filterMode === 'teve_ajuda' ? 'Nenhuma pergunta onde o aluno teve ajuda.' : filterMode === 'ajudou' ? 'Nenhuma ocorrência onde o aluno ajudou um colega.' : 'Nenhuma pergunta respondida ainda.'}
                        </p>
                    ) : (
                        displayedHistory.map((item, idx) => {
                            const hadItemHelp = item.result === 'help_correct' || 
                                item.hadHelp || 
                                item.helperName || 
                                (item.question && (item.question.includes('[Ajuda:') || item.question.includes('(com ajuda')));
                            const isHelperRole = item.helpedStudent || item.isHelperRole;

                            return (
                                <div 
                                    key={idx} 
                                    className="p-4 rounded-xl border flex flex-col gap-2.5 transition-all shadow-2xs"
                                    style={getItemStyles(item.result, isHelperRole)}
                                >
                                    <div className="flex justify-between items-center">
                                        {getResultBadge(item)}
                                        <span className="text-2xs text-slate-400 font-medium">
                                            {new Date(item.date).toLocaleDateString()} {new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>

                                    {item.topic && (
                                        <span className="text-2xs font-bold text-indigo-700 bg-indigo-100 self-start px-2 py-0.5 rounded-md">
                                            {item.topic}
                                        </span>
                                    )}

                                    <p className="text-slate-800 font-medium text-sm leading-snug">
                                        {item.question}
                                    </p>

                                    {/* BLOCO EXPLÍCITO: TEVE AJUDA */}
                                    {hadItemHelp && (
                                        <div className="bg-sky-100/90 border-2 border-sky-400 p-3 rounded-xl flex items-start gap-2.5 text-xs text-sky-950 font-medium animate-in fade-in">
                                            <span className="bg-sky-600 text-white font-black px-2 py-0.5 rounded uppercase tracking-wider text-2xs shrink-0 mt-0.5 shadow-2xs">
                                                TEVE AJUDA
                                            </span>
                                            <div className="leading-relaxed">
                                                {item.helperName ? (
                                                    <div>
                                                        <span>Recebeu ajuda direta do colega: </span>
                                                        <span className="font-black text-indigo-900 bg-white px-2 py-0.5 rounded border border-sky-300">{item.helperName}</span>
                                                    </div>
                                                ) : item.helpType === 'hint' ? (
                                                    <div>
                                                        <span>Utilizou apoio pedagógico de <strong>pista/revelação das letras da resposta</strong>.</span>
                                                    </div>
                                                ) : item.helpType === 'class_opinion' ? (
                                                    <div>
                                                        <span>Contou com o auxílio coletivo e <strong>opinião da turma</strong>.</span>
                                                    </div>
                                                ) : (
                                                    <div>
                                                        <span>{item.helpDescription || 'Acertou com apoio pedagógico da rodada.'}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* BLOCO EXPLÍCITO: AJUDOU */}
                                    {isHelperRole && (
                                        <div className="bg-emerald-100/90 border-2 border-emerald-400 p-3 rounded-xl flex items-start gap-2.5 text-xs text-emerald-950 font-medium animate-in fade-in">
                                            <span className="bg-emerald-600 text-white font-black px-2 py-0.5 rounded uppercase tracking-wider text-2xs shrink-0 mt-0.5 shadow-2xs">
                                                AJUDOU
                                            </span>
                                            <div className="leading-relaxed">
                                                <span>Foi convocado como ajudante e auxiliou o colega: </span>
                                                <span className="font-black text-emerald-950 bg-white px-2 py-0.5 rounded border border-emerald-300">{item.helpedStudent || 'da turma'}</span>
                                                <span> a responder e acertar a pergunta!</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>

            </div>
        </Modal>
    );
};
