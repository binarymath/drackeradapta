import React, { useState } from 'react';
import { 
    CheckCircle, XCircle, HeartHandshake, Zap, 
    Printer, Filter, User, HelpCircle, Calendar, Sparkles, Award, AlertTriangle, Users,
    Copy, Check, Bot, ChevronDown, ChevronUp
} from 'lucide-react';
import { Modal } from '../ui/Modal';

export const StudentHistoryModal = ({ 
    isOpen, 
    onClose, 
    student,
    geminiService = null,
    selectedModel = 'gemini-2.5-flash',
    topic = '',
    currentClass = null
}) => {
    if (!student) return null;

    const [filterMode, setFilterMode] = useState('all'); // 'all' | 'teve_ajuda' | 'ajudou' | 'em_grupo'
    
    // Estado do Parecer Pedagógico com IA
    const [aiReport, setAiReport] = useState('');
    const [isGeneratingAi, setIsGeneratingAi] = useState(false);
    const [aiError, setAiError] = useState(null);
    const [copiedAi, setCopiedAi] = useState(false);
    const [isAiCardExpanded, setIsAiCardExpanded] = useState(true);

    const getResultBadge = (item) => {
        if (item.isGroupActivity || item.groupName || item.result === 'group_correct' || item.result === 'group_activity') {
            return (
                <span className="font-bold text-xs text-indigo-900 bg-indigo-100 border border-indigo-300 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-indigo-600" /> Atividade em Grupo ({item.groupName || 'Equipe'})
                </span>
            );
        }
        if (item.result === 'group_incorrect') {
            return (
                <span className="font-bold text-xs text-rose-900 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-rose-500" /> Erro em Grupo ({item.groupName || 'Equipe'})
                </span>
            );
        }
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
        if (item.result === 'merit') {
            return (
                <span className="font-bold text-xs text-emerald-800 bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> +1 Mérito
                </span>
            );
        }
        if (item.result === 'rule_violation') {
            return (
                <span className="font-bold text-xs text-rose-800 bg-rose-100 border border-rose-300 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" /> -1 Infringiu Regra
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

    const getItemStyles = (result, isHelperRole, isGroup) => {
        if (isGroup) {
            return { backgroundColor: '#f5f3ff', borderColor: '#c4b5fd' };
        }
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
        if (result === 'merit') {
            return { backgroundColor: '#f0fdf4', borderColor: '#86efac' };
        }
        if (result === 'rule_violation') {
            return { backgroundColor: '#fff1f2', borderColor: '#fecdd3' };
        }
        if (result === 'incorrect' || result === 'group_incorrect') {
            return { backgroundColor: '#fef2f2', borderColor: '#fecaca' };
        }
        return { backgroundColor: '#f8fafc', borderColor: '#e2e8f0' };
    };

    // Extrair histórico de ajudas e atividades em grupo
    const historyList = student.history || [];
    const helpReceivedEntries = historyList.filter(h => 
        h.result === 'help_correct' || 
        h.hadHelp || 
        h.helperName || 
        (h.question && (h.question.includes('[Ajuda:') || h.question.includes('(com ajuda')))
    );
    const helpedOthersEntries = historyList.filter(h => h.helpedStudent || h.isHelperRole);
    const groupEntries = historyList.filter(h => 
        h.isGroupActivity || 
        h.groupName || 
        h.result === 'group_correct' || 
        h.result === 'group_activity' ||
        h.result === 'group_incorrect' ||
        (h.question && (h.question.includes('[Grupo:') || h.question.includes('[Atividade em Grupo') || h.question.includes('[Equipe ')))
    );

    const helpCount = Math.max(helpReceivedEntries.length, student.helpCount || 0);
    const helpedCount = Math.max(helpedOthersEntries.length, student.helpedCount || 0);
    const groupCount = groupEntries.length;

    // Total de pontos somados ao aluno por atividades em equipe
    const groupPoints = groupEntries.reduce((acc, h) => {
        if (h.pointsDelta !== undefined) return acc + Math.max(0, h.pointsDelta);
        if (h.result === 'group_activity' || h.result === 'group_correct' || h.result === 'correct') return acc + 1;
        return acc;
    }, 0);

    // Lista filtrada
    const displayedHistory = historyList.slice().reverse().filter(h => {
        const hadHelp = h.result === 'help_correct' || h.hadHelp || h.helperName || (h.question && (h.question.includes('[Ajuda:') || h.question.includes('(com ajuda')));
        const helped = h.helpedStudent || h.isHelperRole;
        const isGroup = h.isGroupActivity || h.groupName || h.result === 'group_correct' || h.result === 'group_activity' || h.result === 'group_incorrect' || (h.question && (h.question.includes('[Grupo:') || h.question.includes('[Atividade em Grupo') || h.question.includes('[Equipe ')));

        if (filterMode === 'teve_ajuda') return hadHelp;
        if (filterMode === 'ajudou') return helped;
        if (filterMode === 'em_grupo') return isGroup;
        return true;
    });

    // Geração do Parecer Pedagógico Individual com IA
    const handleGenerateStudentAi = async () => {
        if (!geminiService || !geminiService.apiKey) {
            setAiError('Chave da API Gemini não configurada.');
            return;
        }

        setIsGeneratingAi(true);
        setAiError(null);

        const prompt = `
Você é um consultor pedagógico e especialista em avaliação formativa para o Ensino Fundamental e Médio.
Escreva um Parecer Pedagógico Individual Descritivo (máximo 3 parágrafos concisos, fluidos e humanizados) sobre o desempenho deste estudante para inclusão no diário de classe ou envio à coordenação/família:

DADOS DO ESTUDANTE:
- Aluno(a): "${student.name}"
- Turma: "${currentClass?.name || 'Turma Selecionada'}"
- Conteúdo/Tema Trabalhado: "${topic || 'Conteúdo Curricular'}"
- Total de Acertos na Roleta: ${student.hits || 0}
- Total de Erros: ${student.misses || 0}
- Rodadas em que Solicitou e Recebeu Ajuda: ${helpCount}
- Ocorrências em que Ajudou Colegas (Solidariedade/Mentoria): ${helpedCount}
- Participações em Rodadas em Equipe/Grupo: ${groupCount}
- Perguntas Respondidas pelo Estudante:
${historyList.map((h, i) => `  ${i + 1}. Questão: "${h.question}" | Resultado: ${h.result === 'correct' || h.result === 'help_correct' ? 'Acertou' : h.result === 'merit' ? '+1 Mérito' : h.result === 'rule_violation' ? '-1 Infração' : 'Errou'} | Teve Ajuda: ${h.hadHelp || h.helperName ? `Sim (${h.helperName || 'colega'})` : 'Não'}`).join('\n') || '  (Sem perguntas registradas ainda)'}

DIRETRIZES DO PARECER:
1. Primeiro Parágrafo (Domínio Conceitual & Participação): Avalie como o estudante lidou com o tema, seu engajamento nas rodadas da roleta e grau de segurança cognitiva ao responder.
2. Segundo Parágrafo (Dimensão Socioemocional & Cooperação): Analise sua postura frente aos desafios (se teve autonomia ou precisou de apoio) e destaque se atuou com empatia e espírito coletivo ajudando colegas.
3. Terceiro Parágrafo (Recomendação Pedagógica Personalizada): Indique um direcionamento prático para a continuidade dos estudos (ex: consolidar pontos com mais erros, avançar para novos desafios ou estimular sua liderança positiva).
Tom formal, acolhedor e focado no crescimento integral do aluno.
`;

        try {
            const text = await geminiService.generateText(prompt, {
                model: selectedModel || 'gemini-2.5-flash',
                temperature: 0.7
            });
            setAiReport(text.trim());
            setIsAiCardExpanded(true);
        } catch (err) {
            console.error('Erro ao gerar parecer pedagógico do aluno com IA:', err);
            setAiError('Não foi possível gerar o parecer no momento. Tente novamente.');
        } finally {
            setIsGeneratingAi(false);
        }
    };

    const handleCopyAiReport = () => {
        if (!aiReport) return;
        navigator.clipboard.writeText(aiReport);
        setCopiedAi(true);
        setTimeout(() => setCopiedAi(false), 2000);
    };

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

        const groupEntriesHtml = groupEntries.map((h, i) => `
            <li style="margin-bottom: 8px;">
                <strong>Questão ${i + 1}:</strong> ${h.question}<br/>
                <span style="color: #4338ca; font-weight: bold;">GRUPO:</span> ${h.groupName || 'Equipe'} 
                ${h.representativeName ? `<em>(Representante: ${h.representativeName})</em>` : ''} — 
                <strong>${h.result === 'group_correct' || h.result === 'correct' ? '✅ Pontuou com a equipe' : '❌ Erro em grupo'}</strong>
                <em>(${new Date(h.date).toLocaleDateString()} ${new Date(h.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})</em>
            </li>
        `).join('');

        const allQuestionsHtml = historyList.map((h, i) => {
            const hadHelp = h.result === 'help_correct' || h.hadHelp || h.helperName || (h.question && (h.question.includes('[Ajuda:') || h.question.includes('(com ajuda')));
            const helped = h.helpedStudent || h.isHelperRole;
            const isGroup = h.isGroupActivity || h.groupName || h.result === 'group_correct' || h.result === 'group_incorrect';
            
            let statusAjuda = '-';
            if (hadHelp) {
                statusAjuda = `<span style="color: #0284c7; font-weight: bold;">TEVE AJUDA (${h.helperName ? `com ${h.helperName}` : h.helpDescription || 'Apoio'})</span>`;
            } else if (helped) {
                statusAjuda = `<span style="color: #16a34a; font-weight: bold;">AJUDOU (${h.helpedStudent})</span>`;
            } else if (isGroup) {
                statusAjuda = `<span style="color: #4338ca; font-weight: bold;">EM GRUPO (${h.groupName || 'Equipe'})</span>`;
            }

            return `
                <tr style="border-bottom: 1px solid #e2e8f0;">
                    <td style="padding: 8px;">${i + 1}</td>
                    <td style="padding: 8px;">${h.question}</td>
                    <td style="padding: 8px; font-weight: bold; color: ${h.result === 'correct' || h.result === 'group_correct' ? '#15803d' : h.result === 'merit' ? '#16a34a' : h.result === 'help_correct' ? '#0369a1' : h.result === 'rule_violation' ? '#e11d48' : '#b91c1c'};">
                        ${h.result === 'correct' || h.result === 'group_correct' ? 'Acertou' : h.result === 'merit' ? '+1 Ponto por Mérito' : h.result === 'rule_violation' ? '-1 Infringiu Regra' : h.result === 'help_correct' ? 'Acertou com Ajuda' : h.result === 'all_correct' ? 'Desafio da Turma' : 'Errou'}
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
                        .group-box { background: #f5f3ff; border: 2px solid #c4b5fd; border-radius: 12px; padding: 16px; margin-bottom: 20px; }
                        .ai-box { background: #fdf4ff; border: 2px solid #c084fc; border-radius: 12px; padding: 16px; margin-bottom: 20px; }
                        table { width: 100%; border-collapse: collapse; text-align: left; font-size: 13px; margin-top: 12px; }
                        th { background: #f1f5f9; padding: 8px; border-bottom: 2px solid #cbd5e1; }
                    </style>
                </head>
                <body>
                    <h1>Relatório de Desempenho e Interações Pedagógicas</h1>
                    <div class="subtitle">Aluno(a): <strong>${student.name}</strong> • Turma: <strong>${currentClass?.name || '-'}</strong> • Data de Emissão: ${new Date().toLocaleDateString()}</div>
                    
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
                        <div class="metric-card" style="border-color: #c4b5fd; background: #f5f3ff;">
                            <div style="color: #4338ca; font-weight: bold;">EM GRUPO</div>
                            <div class="metric-val" style="color: #6366f1;">${groupCount}</div>
                        </div>
                    </div>

                    ${aiReport ? `
                        <div class="ai-box">
                            <h3 style="margin-top: 0; color: #7e22ce;">✨ Parecer Pedagógico Descritivo (Inteligência Artificial):</h3>
                            <p style="font-size: 13px; line-height: 1.6; color: #1e293b; white-space: pre-wrap; margin: 0;">${aiReport}</p>
                        </div>
                    ` : ''}

                    ${groupEntries.length > 0 ? `
                        <div class="group-box">
                            <h3 style="margin-top: 0; color: #4338ca;">👥 Ocorrências de ATIVIDADES EM GRUPO:</h3>
                            <ul style="padding-left: 20px; margin-bottom: 0;">
                                ${groupEntriesHtml}
                            </ul>
                        </div>
                    ` : ''}

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
                                <th>Dinâmica Pedagógica</th>
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
            <div className="space-y-4">
                
                {/* Métricas Principais com "Teve Ajuda", "Ajudou" e "Em Grupo" explícitos */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                    <div className="text-center bg-slate-50 p-3 rounded-2xl border border-slate-200">
                        <div className="text-2xs font-black text-slate-500 uppercase tracking-wider mb-0.5">Pontos Totais</div>
                        <div className="text-2xl font-black text-emerald-600 flex items-center justify-center gap-1">
                            <CheckCircle className="w-5 h-5" /> {student.hits || 0}
                        </div>
                        <div className="text-[10px] text-slate-400 font-semibold mt-0.5">Individuais + Equipe</div>
                    </div>

                    <div className="text-center bg-slate-50 p-3 rounded-2xl border border-slate-200">
                        <div className="text-2xs font-black text-slate-500 uppercase tracking-wider mb-0.5">Erros</div>
                        <div className="text-2xl font-black text-red-500 flex items-center justify-center gap-1">
                            <XCircle className="w-5 h-5" /> {student.misses || 0}
                        </div>
                        <div className="text-[10px] text-slate-400 font-semibold mt-0.5">Registrados</div>
                    </div>

                    <div className="text-center bg-sky-50/80 p-3 rounded-2xl border-2 border-sky-300">
                        <div className="text-2xs font-black text-sky-900 uppercase tracking-wider mb-0.5">Teve Ajuda</div>
                        <div className="text-2xl font-black text-sky-600 flex items-center justify-center gap-1">
                            <HeartHandshake className="w-5 h-5 text-sky-600" /> {helpCount}
                        </div>
                        <div className="text-[10px] text-sky-700 font-bold mt-0.5">Rodadas apoiadas</div>
                    </div>

                    <div className="text-center bg-emerald-50/80 p-3 rounded-2xl border-2 border-emerald-300">
                        <div className="text-2xs font-black text-emerald-900 uppercase tracking-wider mb-0.5">Ajudou</div>
                        <div className="text-2xl font-black text-emerald-600 flex items-center justify-center gap-1">
                            <Award className="w-5 h-5 text-emerald-600" /> {helpedCount}
                        </div>
                        <div className="text-[10px] text-emerald-700 font-bold mt-0.5">Auxiliou colega</div>
                    </div>

                    <div className="text-center bg-indigo-50/80 p-3 rounded-2xl border-2 border-indigo-300">
                        <div className="text-2xs font-black text-indigo-900 uppercase tracking-wider mb-0.5">Em Grupo</div>
                        <div className="text-2xl font-black text-indigo-600 flex items-center justify-center gap-1">
                            <Users className="w-5 h-5 text-indigo-600" /> {groupCount}
                        </div>
                        <div className="text-[10px] text-indigo-700 font-bold mt-0.5">
                            {groupPoints > 0 ? `+${groupPoints} pts no total` : 'participações'}
                        </div>
                    </div>
                </div>

                {/* Card do Parecer Pedagógico Individual com IA */}
                <div className="bg-gradient-to-br from-indigo-950 via-slate-950 to-purple-950 border border-indigo-500/30 rounded-2xl p-3.5 text-white shadow-xs">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
                                <Bot className="w-4 h-4" />
                            </div>
                            <div>
                                <h4 className="font-bold text-xs text-indigo-200 flex items-center gap-1.5">
                                    <span>Parecer Individual com IA</span>
                                    <span className="text-[10px] bg-indigo-500/30 border border-indigo-400/40 text-indigo-300 px-1.5 py-0.2 rounded-md font-mono">
                                        Gemini
                                    </span>
                                </h4>
                                <p className="text-[11px] text-slate-400">
                                    Diagnóstico descritivo para diário de classe e acompanhamento
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                            {aiReport && (
                                <button
                                    type="button"
                                    onClick={handleCopyAiReport}
                                    className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1 border border-white/20"
                                    title="Copiar parecer pedagógico"
                                >
                                    {copiedAi ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                    <span>{copiedAi ? 'Copiado!' : 'Copiar'}</span>
                                </button>
                            )}

                            <button
                                type="button"
                                disabled={isGeneratingAi}
                                onClick={handleGenerateStudentAi}
                                className="px-3 py-1 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs disabled:opacity-50 active:scale-95"
                            >
                                <Sparkles className={`w-3.5 h-3.5 text-amber-300 ${isGeneratingAi ? 'animate-spin' : ''}`} />
                                <span>{isGeneratingAi ? 'Analisando...' : aiReport ? 'Regerar' : '✨ Gerar Parecer IA'}</span>
                            </button>

                            {aiReport && (
                                <button
                                    type="button"
                                    onClick={() => setIsAiCardExpanded(!isAiCardExpanded)}
                                    className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
                                    title={isAiCardExpanded ? 'Recolher' : 'Expandir'}
                                >
                                    {isAiCardExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                </button>
                            )}
                        </div>
                    </div>

                    {aiError && (
                        <div className="bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs p-2.5 rounded-xl mt-2.5">
                            {aiError}
                        </div>
                    )}

                    {isAiCardExpanded && (
                        <div className="mt-2.5">
                            {aiReport ? (
                                <div className="bg-white/5 border border-white/10 p-3 rounded-xl text-xs text-slate-200 leading-relaxed font-sans whitespace-pre-wrap animate-in fade-in">
                                    {aiReport}
                                </div>
                            ) : (
                                <div className="bg-white/5 border border-dashed border-white/10 p-3 rounded-xl text-xs text-slate-400 text-center">
                                    Clique em <strong>"✨ Gerar Parecer IA"</strong> para obter uma avaliação individualizada sobre a compreensão, cooperação e desenvolvimento de <strong>{student.name}</strong>.
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Filtros e Ações */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-200">
                    {/* Abas de filtro explícitas */}
                    <div className="flex bg-slate-100 p-1 rounded-xl gap-1 flex-wrap">
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
                            onClick={() => setFilterMode('em_grupo')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                                filterMode === 'em_grupo' 
                                ? 'bg-indigo-600 text-white shadow-2xs font-black' 
                                : 'text-slate-600 hover:bg-white/60'
                            }`}
                        >
                            <Users className="w-3.5 h-3.5" />
                            <span>Em Grupo ({groupCount})</span>
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
                        className="flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl transition-all shadow-2xs cursor-pointer"
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
                            {filterMode === 'teve_ajuda' 
                                ? 'Nenhuma pergunta onde o aluno teve ajuda.' 
                                : filterMode === 'ajudou' 
                                    ? 'Nenhuma ocorrência onde o aluno ajudou um colega.' 
                                    : filterMode === 'em_grupo'
                                        ? 'Nenhuma atividade em grupo registrada para este aluno.'
                                        : 'Nenhuma pergunta respondida ainda.'}
                        </p>
                    ) : (
                        displayedHistory.map((item, idx) => {
                            const hadItemHelp = item.result === 'help_correct' || 
                                item.hadHelp || 
                                item.helperName || 
                                (item.question && (item.question.includes('[Ajuda:') || item.question.includes('(com ajuda')));
                            const isHelperRole = item.helpedStudent || item.isHelperRole;
                            const isGroupItem = item.isGroupActivity || item.groupName || item.result === 'group_correct' || item.result === 'group_activity' || item.result === 'group_incorrect' || (item.question && (item.question.includes('[Grupo:') || item.question.includes('[Atividade em Grupo') || item.question.includes('[Equipe ')));
                            const repName = item.representative || item.representativeName;
                            const isGroupWin = (item.pointsDelta !== undefined ? item.pointsDelta > 0 : (item.result === 'group_correct' || item.result === 'group_activity' || item.result === 'correct'));

                            return (
                                <div 
                                    key={idx} 
                                    className="p-4 rounded-xl border flex flex-col gap-2.5 transition-all shadow-2xs"
                                    style={getItemStyles(item.result, isHelperRole, isGroupItem)}
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

                                    {/* BLOCO EXPLÍCITO: ATIVIDADE EM GRUPO */}
                                    {isGroupItem && (
                                        <div className="bg-indigo-100/80 border-2 border-indigo-400 p-3 rounded-xl flex items-start gap-2.5 text-xs text-indigo-950 font-medium animate-in fade-in">
                                            <span className="bg-indigo-600 text-white font-black px-2 py-0.5 rounded uppercase tracking-wider text-2xs shrink-0 mt-0.5 shadow-2xs">
                                                EM GRUPO
                                            </span>
                                            <div className="leading-relaxed flex-1">
                                                <div className="flex flex-wrap items-center gap-1.5">
                                                    <span>Atividade realizada em conjunto com a equipe: </span>
                                                    <span className="font-black text-indigo-950 bg-white px-2 py-0.5 rounded border border-indigo-300">{item.groupName || 'Equipe'}</span>
                                                    {repName && (
                                                        <span className="text-indigo-900 font-bold">
                                                            (Representante da rodada: <strong>{repName}</strong>)
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="mt-1 flex items-center gap-2">
                                                    {isGroupWin ? (
                                                        <span className="font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300 inline-flex items-center gap-1">
                                                            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                                                            +{item.pointsDelta !== undefined ? item.pointsDelta : 1} ponto somado à pontuação individual deste aluno!
                                                        </span>
                                                    ) : (
                                                        <span className="font-bold text-rose-800 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 inline-flex items-center gap-1">
                                                            <XCircle className="w-3.5 h-3.5 text-rose-500" />
                                                            Equipe não pontuou nesta rodada.
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}

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
