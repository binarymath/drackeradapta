import React, { useState, useMemo } from 'react';
import { 
    CheckCircle, XCircle, HeartHandshake, Award, Users, User, 
    BarChart3, HelpCircle, Sparkles, AlertTriangle, Printer, Download, 
    Copy, Check, Filter, Calendar, Clock, Trophy, Target, ArrowRight, 
    BookOpen, Star, FileText, Bot, Layers, Info
} from 'lucide-react';
import { Modal } from '../ui/Modal';

export const ClassSessionReportModal = ({
    isOpen,
    onClose,
    currentClass,
    currentGroups = [],
    activeActivity = null,
    questions = [],
    currentSessionId = null,
    sessionStartTime = null,
    geminiService = null,
    selectedModel = 'gemini-2.5-flash'
}) => {
    // Escopo temporal do relatório: 'session' (aula atual) | 'today' (hoje) | 'all' (todo o histórico)
    const [periodFilter, setPeriodFilter] = useState('session');
    // Aba ativa: 'overview' | 'questions' | 'students' | 'groups'
    const [activeTab, setActiveTab] = useState('overview');

    // Estado da Síntese Pedagógica com IA
    const [aiSummary, setAiSummary] = useState('');
    const [isGeneratingAi, setIsGeneratingAi] = useState(false);
    const [aiError, setAiError] = useState(null);
    const [copiedAi, setCopiedAi] = useState(false);

    // -------------------------------------------------------------------------
    // 1. FILTRAGEM DOS DADOS PELO PERÍODO ESCOLHIDO
    // -------------------------------------------------------------------------
    const filteredData = useMemo(() => {
        if (!currentClass || !Array.isArray(currentClass.students)) {
            return {
                allEvents: [],
                uniqueRounds: [],
                studentStats: [],
                questionStats: [],
                groupStats: [],
                metrics: {}
            };
        }

        const now = Date.now();
        const todayStr = new Date().toDateString();
        const startTime = sessionStartTime || (now - 2 * 60 * 60 * 1000); // 2h de tolerância para a sessão

        // Função de validação de período
        const matchesPeriod = (entry) => {
            if (!entry || !entry.date) return false;
            if (periodFilter === 'session') {
                if (currentSessionId && entry.sessionId) {
                    return entry.sessionId === currentSessionId;
                }
                return entry.date >= startTime;
            }
            if (periodFilter === 'today') {
                return new Date(entry.date).toDateString() === todayStr;
            }
            return true; // 'all'
        };

        // Coletar todos os eventos de histórico de todos os alunos
        const allEvents = [];
        const studentStats = currentClass.students.map(s => {
            const hist = (s.history || []).filter(matchesPeriod);
            
            const hits = hist.filter(h => h.result === 'correct' || h.result === 'help_correct' || h.result === 'all_correct' || h.result === 'group_activity').length;
            const misses = hist.filter(h => h.result === 'incorrect' || h.result === 'group_incorrect').length;
            const merits = hist.filter(h => h.result === 'merit').length;
            const violations = hist.filter(h => h.result === 'rule_violation').length;

            const helpReceived = hist.filter(h => 
                h.result === 'help_correct' || h.hadHelp || h.helperName || 
                (h.question && (h.question.includes('[Ajuda:') || h.question.includes('(com ajuda')))
            );

            const helpedOthers = hist.filter(h => h.helpedStudent || h.isHelperRole);
            const groupParticipations = hist.filter(h => h.isGroupActivity || h.result === 'group_activity');

            // Adiciona ao pool global de eventos
            hist.forEach(h => {
                allEvents.push({
                    ...h,
                    studentId: s.id,
                    studentName: s.name,
                    studentGroup: s.groupName || null
                });
            });

            return {
                id: s.id,
                name: s.name,
                status: s.status || 'active',
                groupName: s.groupName || null,
                totalAnswers: hist.length,
                participated: hist.length > 0,
                hits,
                misses,
                merits,
                violations,
                helpReceived,
                helpedOthers,
                groupParticipations,
                history: hist
            };
        });

        // Agrupar eventos em rodadas únicas por proximidade de tempo ou chave
        // (importante para não duplicar perguntas quando toda a turma ou equipe responde junto)
        const roundsMap = new Map();
        allEvents.forEach(evt => {
            // Arredonda timestamp em 3 segundos para agrupar respostas coletivas
            const timeKey = Math.floor((evt.date || 0) / 3000) * 3000;
            const key = `${evt.question}_${timeKey}`;
            
            if (!roundsMap.has(key)) {
                roundsMap.set(key, {
                    key,
                    date: evt.date,
                    question: evt.question,
                    isGroup: !!(evt.isGroupActivity || evt.groupName || evt.result === 'group_activity'),
                    groupName: evt.groupName || null,
                    result: evt.result,
                    hadHelp: !!(evt.hadHelp || evt.result === 'help_correct' || evt.helperName),
                    helperName: evt.helperName || null,
                    helpDescription: evt.helpDescription || null,
                    helpedStudent: evt.helpedStudent || null,
                    participants: [evt.studentName]
                });
            } else {
                const round = roundsMap.get(key);
                if (!round.participants.includes(evt.studentName)) {
                    round.participants.push(evt.studentName);
                }
                if (evt.hadHelp) round.hadHelp = true;
                if (evt.helperName && !round.helperName) round.helperName = evt.helperName;
            }
        });

        const uniqueRounds = Array.from(roundsMap.values()).sort((a, b) => (b.date || 0) - (a.date || 0));

        // Estatísticas por Questão Trabalhada
        const questionStatsMap = new Map();
        uniqueRounds.forEach(round => {
            const cleanQuestionText = round.question
                .replace(/^\[Equipe\s+[^\]]+\]\s*/i, '')
                .replace(/^\[Desafio da Turma\]\s*/i, '')
                .replace(/\s*\[Ajuda:\s*[^\]]+\]\s*/i, '')
                .replace(/\s*\(com ajuda[^\)]*\)/i, '')
                .trim();

            if (!questionStatsMap.has(cleanQuestionText)) {
                // Tenta achar metadados no banco de perguntas da atividade
                const meta = (questions || []).find(q => q.question === cleanQuestionText) || {};
                questionStatsMap.set(cleanQuestionText, {
                    question: cleanQuestionText,
                    difficulty: meta.difficulty || 'Média',
                    answer: meta.answer || '',
                    imageUrl: meta.imageUrl || null,
                    timesAsked: 0,
                    correctCount: 0,
                    incorrectCount: 0,
                    helpCount: 0,
                    rounds: []
                });
            }

            const stat = questionStatsMap.get(cleanQuestionText);
            stat.timesAsked += 1;
            stat.rounds.push(round);

            if (round.result === 'correct' || round.result === 'help_correct' || round.result === 'all_correct' || round.result === 'group_activity') {
                stat.correctCount += 1;
            } else if (round.result === 'incorrect' || round.result === 'group_incorrect') {
                stat.incorrectCount += 1;
            }

            if (round.hadHelp) {
                stat.helpCount += 1;
            }
        });

        const questionStats = Array.from(questionStatsMap.values());

        // Estatísticas de Grupos / Equipes
        const groupStats = (currentGroups || []).map(group => {
            const memberIds = new Set((group.studentIds || []).map(String));
            const memberStudents = studentStats.filter(s => memberIds.has(String(s.id)));
            
            // Rodadas em que o grupo ou seus membros responderam nesta sessão
            const groupRounds = uniqueRounds.filter(r => 
                (r.groupName && r.groupName === group.name) || 
                r.participants.some(p => memberStudents.some(ms => ms.name === p))
            );

            const groupHits = groupRounds.filter(r => r.result === 'correct' || r.result === 'group_activity' || r.result === 'all_correct').length;
            const groupMisses = groupRounds.filter(r => r.result === 'incorrect' || r.result === 'group_incorrect').length;

            return {
                id: group.id,
                name: group.name,
                color: group.color || '#6366f1',
                memberCount: memberStudents.length,
                memberNames: memberStudents.map(s => s.name),
                roundsCount: groupRounds.length,
                hits: groupHits,
                misses: groupMisses
            };
        });

        // Métricas Globais da Aula / Sessão
        const totalRounds = uniqueRounds.length;
        const individualRounds = uniqueRounds.filter(r => !r.isGroup).length;
        const groupRounds = uniqueRounds.filter(r => r.isGroup).length;

        const totalHits = uniqueRounds.filter(r => 
            r.result === 'correct' || r.result === 'help_correct' || r.result === 'all_correct' || r.result === 'group_activity'
        ).length;
        const totalMisses = uniqueRounds.filter(r => r.result === 'incorrect' || r.result === 'group_incorrect').length;

        const evaluatedRounds = totalHits + totalMisses;
        const hitRate = evaluatedRounds > 0 ? Math.round((totalHits / evaluatedRounds) * 100) : 0;

        const participatingStudents = studentStats.filter(s => s.participated).length;
        const totalStudents = studentStats.length;
        const participationRate = totalStudents > 0 ? Math.round((participatingStudents / totalStudents) * 100) : 0;

        const helpRounds = uniqueRounds.filter(r => r.hadHelp).length;
        const helpSuccessRounds = uniqueRounds.filter(r => r.hadHelp && (r.result === 'help_correct' || r.result === 'correct')).length;
        const helpConversionRate = helpRounds > 0 ? Math.round((helpSuccessRounds / helpRounds) * 100) : 0;

        // Determinação da Dinâmica
        let dynamicsType = 'sem_dados';
        let dynamicsLabel = 'Sem dados suficientes';
        if (totalRounds > 0) {
            if (groupRounds === 0) {
                dynamicsType = 'individual';
                dynamicsLabel = '100% Individual';
            } else if (individualRounds === 0) {
                dynamicsType = 'group';
                dynamicsLabel = '100% em Equipes / Grupos';
            } else {
                dynamicsType = 'mixed';
                const indPct = Math.round((individualRounds / totalRounds) * 100);
                const grpPct = 100 - indPct;
                dynamicsLabel = `Misto (${indPct}% Individual / ${grpPct}% Grupos)`;
            }
        }

        return {
            allEvents,
            uniqueRounds,
            studentStats,
            questionStats,
            groupStats,
            metrics: {
                totalRounds,
                individualRounds,
                groupRounds,
                totalHits,
                totalMisses,
                hitRate,
                totalStudents,
                participatingStudents,
                participationRate,
                helpRounds,
                helpSuccessRounds,
                helpConversionRate,
                dynamicsType,
                dynamicsLabel
            }
        };
    }, [currentClass, currentGroups, questions, periodFilter, currentSessionId, sessionStartTime]);

    // -------------------------------------------------------------------------
    // 2. INSIGHTS ALGORÍTMICOS AUTOMÁTICOS
    // -------------------------------------------------------------------------
    const algorithmicInsights = useMemo(() => {
        const { studentStats, questionStats, metrics } = filteredData;
        const insights = [];

        if (metrics.totalRounds === 0) {
            return [
                {
                    type: 'info',
                    icon: Info,
                    title: 'Aguardando Atividades',
                    text: 'Nenhuma rodada foi concluída no período selecionado. Gire a roleta para começar a capturar os insights da aula!'
                }
            ];
        }

        // 1. Domínio da Turma
        if (metrics.hitRate >= 80) {
            insights.push({
                type: 'success',
                icon: CheckCircle,
                title: 'Excelente Domínio do Conteúdo',
                text: `A turma teve um aproveitamento muito alto de ${metrics.hitRate}% de acertos nas perguntas da aula.`
            });
        } else if (metrics.hitRate >= 60) {
            insights.push({
                type: 'info',
                icon: BookOpen,
                title: 'Aproveitamento Satisfatório',
                text: `Taxa de acerto de ${metrics.hitRate}%. A maior parte dos conceitos foi compreendida, com espaço para consolidação.`
            });
        } else if (metrics.hitRate > 0) {
            insights.push({
                type: 'warning',
                icon: AlertTriangle,
                title: 'Atenção ao Conteúdo Trabalhado',
                text: `Apenas ${metrics.hitRate}% de acertos. Os alunos apresentaram dúvidas frequentes neste tema, sendo recomendada uma revisão.`
            });
        }

        // 2. Questões Críticas / Dificuldades
        const difficultQuestions = questionStats.filter(q => q.timesAsked > 0 && (q.correctCount / q.timesAsked) < 0.6);
        if (difficultQuestions.length > 0) {
            const qTexts = difficultQuestions.slice(0, 2).map(q => `"${q.question.slice(0, 50)}${q.question.length > 50 ? '...' : ''}"`).join(' e ');
            insights.push({
                type: 'warning',
                icon: HelpCircle,
                title: 'Questões com Maior Dificuldade',
                text: `A(s) pergunta(s) ${qTexts} geraram maior índice de erro ou necessidade de ajuda. Sugere-se retomar a explicação no início do próximo encontro.`
            });
        }

        // 3. Colaboração & Rede de Ajuda (Aluno Ajuda Aluno)
        const topHelpers = [...studentStats].sort((a, b) => b.helpedOthers.length - a.helpedOthers.length).filter(s => s.helpedOthers.length > 0);
        if (topHelpers.length > 0) {
            const helperNames = topHelpers.slice(0, 3).map(h => `${h.name} (${h.helpedOthers.length}x)`).join(', ');
            insights.push({
                type: 'highlight',
                icon: HeartHandshake,
                title: 'Campeões da Solidariedade',
                text: `Destaque para a cooperação entre pares: ${helperNames} auxiliaram colegas que solicitaram ajuda, com ${metrics.helpConversionRate}% de conversão em acerto.`
            });
        }

        // 4. Alunos com 100% de Aproveitamento
        const perfectStudents = studentStats.filter(s => s.totalAnswers >= 2 && s.misses === 0);
        if (perfectStudents.length > 0) {
            const names = perfectStudents.slice(0, 4).map(s => s.name).join(', ');
            insights.push({
                type: 'success',
                icon: Star,
                title: 'Alunos com Desempenho Impecável',
                text: `Os alunos ${names} acertaram todas as rodadas em que participaram nesta aula.`
            });
        }

        // 5. Alunos Não Sorteados / Ausentes
        const notDrawn = studentStats.filter(s => !s.participated && s.status === 'active');
        if (notDrawn.length > 0) {
            insights.push({
                type: 'info',
                icon: Users,
                title: 'Engajamento da Turma',
                text: `${notDrawn.length} aluno(s) ainda não foram sorteados nesta sessão (${notDrawn.slice(0, 3).map(s => s.name).join(', ')}${notDrawn.length > 3 ? '...' : ''}). Ideal para priorizar nas próximas rodadas.`
            });
        }

        // 6. Dinâmica de Grupos vs Individual
        if (metrics.groupRounds > 0 && metrics.individualRounds > 0) {
            insights.push({
                type: 'highlight',
                icon: Layers,
                title: 'Equilíbrio Metodológico',
                text: `A aula mesclou momentos individuais (${metrics.individualRounds} rodadas) com colaboração em equipes (${metrics.groupRounds} rodadas), estimulando autonomia e senso coletivo.`
            });
        }

        return insights;
    }, [filteredData]);

    // -------------------------------------------------------------------------
    // 3. GERADOR DE PARECER PEDAGÓGICO COM IA (GEMINI)
    // -------------------------------------------------------------------------
    const handleGenerateAiSummary = async () => {
        if (!geminiService || !geminiService.apiKey) {
            setAiError('Chave da API Gemini não configurada. Por favor, adicione sua chave nas configurações.');
            return;
        }

        setIsGeneratingAi(true);
        setAiError(null);

        const { metrics, questionStats, studentStats } = filteredData;

        const prompt = `
Você é um consultor pedagógico e professor especialista em gamificação e metodologias ativas.
Escreva um Parecer Pedagógico da Aula em formato profissional, elegante e conciso (máximo 3 parágrafos bem estruturados), com base no diagnóstico abaixo:

DADOS DA AULA:
- Turma: "${currentClass?.name || 'Turma'}"
- Tema/Conteúdo: "${activeActivity?.topic || activeActivity?.title || 'Conteúdo Curricular'}"
- Formato da Aula: ${metrics.dynamicsLabel}
- Total de Rodadas Jogadas: ${metrics.totalRounds}
- Taxa Geral de Acertos: ${metrics.hitRate}% (${metrics.totalHits} acertos e ${metrics.totalMisses} erros)
- Engajamento da Turma: ${metrics.participationRate}% (${metrics.participatingStudents} de ${metrics.totalStudents} alunos responderam)
- Colaboração & Ajuda: ${metrics.helpRounds} pedidos de ajuda entre alunos, com taxa de sucesso de ${metrics.helpConversionRate}%
- Questões com mais dúvidas: ${questionStats.filter(q => q.incorrectCount > 0).slice(0, 3).map(q => `"${q.question}"`).join('; ') || 'Nenhuma questão crítica'}
- Alunos destaque no acolhimento/ajuda: ${studentStats.filter(s => s.helpedOthers.length > 0).map(s => `${s.name}`).join(', ') || 'Colaboração distribuída'}

DIRETRIZES:
1. Primeiro parágrafo: Resuma como a turma se comportou, se a dinâmica foi individual ou em equipe, e o nível geral de absorção do conteúdo.
2. Segundo parágrafo: Analise a cooperação (se alunos ajudaram colegas), destacando a participação e a atitude solidária.
3. Terceiro parágrafo: Forneça uma recomendação pedagógica prática para o próximo encontro (ex: pontos a revisar ou aprofundar).
4. Tom formal, acolhedor e pronto para o professor colar no Diário de Classe ou enviar à Coordenação Pedagógica.
`;

        try {
            const text = await geminiService.generateText(prompt, {
                model: selectedModel || 'gemini-2.5-flash',
                temperature: 0.7
            });
            setAiSummary(text.trim());
        } catch (err) {
            console.error('Erro ao gerar parecer pedagógico com IA:', err);
            setAiError('Não foi possível gerar a síntese com IA no momento. Tente novamente em instantes.');
        } finally {
            setIsGeneratingAi(false);
        }
    };

    const handleCopyAiSummary = () => {
        if (!aiSummary) return;
        navigator.clipboard.writeText(aiSummary);
        setCopiedAi(true);
        setTimeout(() => setCopiedAi(false), 2000);
    };

    // -------------------------------------------------------------------------
    // 4. IMPRESSÃO / SALVAR EM PDF (FOLHA A4 PROFISSIONAL)
    // -------------------------------------------------------------------------
    const handlePrintReport = () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const { metrics, questionStats, studentStats, groupStats } = filteredData;
        const dateFormatted = new Date().toLocaleDateString('pt-BR', {
            day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
        });

        const questionsTableHtml = questionStats.map((q, idx) => `
            <tr style="border-bottom: 1px solid #e2e8f0; font-size: 11px;">
                <td style="padding: 6px 8px; font-weight: bold;">#${idx + 1}</td>
                <td style="padding: 6px 8px;">${q.question}</td>
                <td style="padding: 6px 8px; text-align: center;">${q.difficulty}</td>
                <td style="padding: 6px 8px; text-align: center;">${q.timesAsked}</td>
                <td style="padding: 6px 8px; text-align: center; font-weight: bold; color: #16a34a;">${q.correctCount}</td>
                <td style="padding: 6px 8px; text-align: center; font-weight: bold; color: #dc2626;">${q.incorrectCount}</td>
                <td style="padding: 6px 8px; text-align: center;">${q.helpCount > 0 ? `🤝 ${q.helpCount}x` : '-'}</td>
            </tr>
        `).join('');

        const studentsTableHtml = studentStats.map(s => `
            <tr style="border-bottom: 1px solid #e2e8f0; font-size: 11px;">
                <td style="padding: 6px 8px; font-weight: bold;">${s.name}</td>
                <td style="padding: 6px 8px;">${s.groupName || '-'}</td>
                <td style="padding: 6px 8px; text-align: center;">
                    ${s.participated ? '<span style="color: #16a34a; font-weight: bold;">Participou</span>' : '<span style="color: #64748b;">Não sorteado</span>'}
                </td>
                <td style="padding: 6px 8px; text-align: center; font-weight: bold; color: #16a34a;">${s.hits}</td>
                <td style="padding: 6px 8px; text-align: center; font-weight: bold; color: #dc2626;">${s.misses}</td>
                <td style="padding: 6px 8px; text-align: center;">${s.helpReceived.length > 0 ? `Sim (${s.helpReceived.length}x)` : 'Não'}</td>
                <td style="padding: 6px 8px; text-align: center;">${s.helpedOthers.length > 0 ? `🌟 ${s.helpedOthers.length}x` : '-'}</td>
            </tr>
        `).join('');

        const groupsSectionHtml = groupStats.length > 0 ? `
            <div style="margin-top: 20px;">
                <h3 style="font-size: 14px; font-weight: bold; color: #1e293b; border-bottom: 2px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 10px;">
                    👥 Placar de Equipes na Aula
                </h3>
                <table style="width: 100%; border-collapse: collapse; text-align: left;">
                    <thead>
                        <tr style="background-color: #f8fafc; font-size: 11px; border-bottom: 2px solid #cbd5e1;">
                            <th style="padding: 6px 8px;">Equipe</th>
                            <th style="padding: 6px 8px; text-align: center;">Membros</th>
                            <th style="padding: 6px 8px; text-align: center;">Rodadas</th>
                            <th style="padding: 6px 8px; text-align: center;">Acertos</th>
                            <th style="padding: 6px 8px; text-align: center;">Erros</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${groupStats.map(g => `
                            <tr style="border-bottom: 1px solid #e2e8f0; font-size: 11px;">
                                <td style="padding: 6px 8px; font-weight: bold;">${g.name}</td>
                                <td style="padding: 6px 8px; text-align: center;">${g.memberCount}</td>
                                <td style="padding: 6px 8px; text-align: center;">${g.roundsCount}</td>
                                <td style="padding: 6px 8px; text-align: center; color: #16a34a; font-weight: bold;">${g.hits}</td>
                                <td style="padding: 6px 8px; text-align: center; color: #dc2626; font-weight: bold;">${g.misses}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        ` : '';

        const aiSectionHtml = aiSummary ? `
            <div style="margin-top: 20px; background-color: #f8fafc; border-left: 4px solid #6366f1; padding: 12px 16px; border-radius: 6px;">
                <h4 style="margin: 0 0 6px 0; font-size: 13px; color: #4338ca;">✨ Síntese Pedagógica (Parecer da Aula):</h4>
                <div style="font-size: 11px; line-height: 1.5; color: #334155; white-space: pre-wrap;">${aiSummary}</div>
            </div>
        ` : '';

        printWindow.document.write(`
            <!DOCTYPE html>
            <html lang="pt-BR">
            <head>
                <meta charset="UTF-8">
                <title>Relatório de Aula - ${currentClass?.name || 'Turma'}</title>
                <style>
                    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #0f172a; margin: 25px; line-height: 1.4; }
                    .header { border-bottom: 2px solid #cbd5e1; padding-bottom: 15px; margin-bottom: 18px; display: flex; justify-content: space-between; align-items: flex-start; }
                    .title { font-size: 18px; font-weight: 900; color: #1e1b4b; margin: 0; }
                    .subtitle { font-size: 12px; color: #64748b; margin-top: 4px; }
                    .kpis { display: flex; gap: 10px; margin-bottom: 18px; }
                    .kpi-card { flex: 1; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; text-align: center; background: #fafafa; }
                    .kpi-val { font-size: 18px; font-weight: 900; color: #4338ca; }
                    .kpi-label { font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: bold; margin-top: 2px; }
                    @media print {
                        body { margin: 0; padding: 15px; }
                        button { display: none; }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <div>
                        <h1 class="title">📊 Relatório de Aula & Insights Pedagógicos</h1>
                        <div class="subtitle">
                            <strong>Turma:</strong> ${currentClass?.name || 'Turma'} • 
                            <strong>Tema:</strong> ${activeActivity?.topic || activeActivity?.title || 'Conteúdo Geral'} • 
                            <strong>Formato:</strong> ${metrics.dynamicsLabel}
                        </div>
                    </div>
                    <div style="text-align: right; font-size: 11px; color: #64748b;">
                        <div>Gerado em: ${dateFormatted}</div>
                        <div>Filtro: ${periodFilter === 'session' ? 'Aula Atual (Sessão)' : periodFilter === 'today' ? 'Hoje (24h)' : 'Histórico Acumulado'}</div>
                    </div>
                </div>

                <div class="kpis">
                    <div class="kpi-card">
                        <div class="kpi-val">${metrics.hitRate}%</div>
                        <div class="kpi-label">Taxa de Acertos</div>
                    </div>
                    <div class="kpi-card">
                        <div class="kpi-val">${metrics.participationRate}%</div>
                        <div class="kpi-label">Engajamento Alunos</div>
                    </div>
                    <div class="kpi-card">
                        <div class="kpi-val">${metrics.helpRounds}</div>
                        <div class="kpi-label">Ajudas Mútuas (${metrics.helpConversionRate}% êxito)</div>
                    </div>
                    <div class="kpi-card">
                        <div class="kpi-val">${questionStats.length}</div>
                        <div class="kpi-label">Questões Trabalhadas</div>
                    </div>
                    <div class="kpi-card">
                        <div class="kpi-val">${metrics.totalRounds}</div>
                        <div class="kpi-label">Rodadas Realizadas</div>
                    </div>
                </div>

                ${aiSectionHtml}

                <div style="margin-top: 18px;">
                    <h3 style="font-size: 13px; font-weight: bold; color: #1e293b; border-bottom: 2px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 8px;">
                        ❓ Questões Trabalhadas na Aula (${questionStats.length})
                    </h3>
                    <table style="width: 100%; border-collapse: collapse; text-align: left;">
                        <thead>
                            <tr style="background-color: #f8fafc; font-size: 11px; border-bottom: 2px solid #cbd5e1;">
                                <th style="padding: 6px 8px; width: 40px;">#</th>
                                <th style="padding: 6px 8px;">Pergunta</th>
                                <th style="padding: 6px 8px; text-align: center; width: 70px;">Dificuldade</th>
                                <th style="padding: 6px 8px; text-align: center; width: 60px;">Sortes</th>
                                <th style="padding: 6px 8px; text-align: center; width: 60px;">Acertos</th>
                                <th style="padding: 6px 8px; text-align: center; width: 60px;">Erros</th>
                                <th style="padding: 6px 8px; text-align: center; width: 70px;">Ajuda</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${questionsTableHtml || '<tr><td colspan="7" style="padding: 10px; text-align: center; color: #94a3b8;">Nenhuma questão trabalhada neste período.</td></tr>'}
                        </tbody>
                    </table>
                </div>

                <div style="margin-top: 20px;">
                    <h3 style="font-size: 13px; font-weight: bold; color: #1e293b; border-bottom: 2px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 8px;">
                        🎓 Participação e Desempenho dos Alunos (${studentStats.length})
                    </h3>
                    <table style="width: 100%; border-collapse: collapse; text-align: left;">
                        <thead>
                            <tr style="background-color: #f8fafc; font-size: 11px; border-bottom: 2px solid #cbd5e1;">
                                <th style="padding: 6px 8px;">Aluno</th>
                                <th style="padding: 6px 8px;">Equipe</th>
                                <th style="padding: 6px 8px; text-align: center;">Status Aula</th>
                                <th style="padding: 6px 8px; text-align: center;">Acertos</th>
                                <th style="padding: 6px 8px; text-align: center;">Erros</th>
                                <th style="padding: 6px 8px; text-align: center;">Teve Ajuda?</th>
                                <th style="padding: 6px 8px; text-align: center;">Ajudou?</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${studentsTableHtml}
                        </tbody>
                    </table>
                </div>

                ${groupsSectionHtml}

                <div style="margin-top: 30px; text-align: center; font-size: 10px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 8px;">
                    Documento gerado automaticamente pelo Dracker Adapta • Roleta Pedagógica Interativa
                </div>

                <script>
                    window.onload = function() {
                        window.print();
                    };
                </script>
            </body>
            </html>
        `);
        printWindow.document.close();
    };

    // -------------------------------------------------------------------------
    // 5. DOWNLOAD EM PLANILHA CSV
    // -------------------------------------------------------------------------
    const handleDownloadCsv = () => {
        const { metrics, questionStats, studentStats } = filteredData;
        const classNameClean = (currentClass?.name || 'Turma').replace(/\s+/g, '_');

        let csv = `RELATORIO DE AULA - DRACKER ADAPTA\n`;
        csv += `Turma:,"${currentClass?.name || 'Turma'}"\n`;
        csv += `Tema:,"${activeActivity?.topic || activeActivity?.title || 'Geral'}"\n`;
        csv += `Data:,"${new Date().toLocaleDateString('pt-BR')}"\n`;
        csv += `Formato:,"${metrics.dynamicsLabel}"\n`;
        csv += `Taxa de Acertos:,"${metrics.hitRate}%"\n`;
        csv += `Engajamento:,"${metrics.participationRate}%"\n\n`;

        csv += `--- ALUNOS DA TURMA ---\n`;
        csv += `Aluno,Equipe,Status na Aula,Acertos no Período,Erros no Período,Teve Ajuda (Qtd),Detalhes Ajuda Recebida,Ajudou Colegas (Qtd),Detalhes Ajuda Prestada,Pontos Mérito,Infrações Regra\n`;

        studentStats.forEach(s => {
            const helpRecStr = s.helpReceived.map(h => h.helperName ? `com ${h.helperName}` : (h.helpDescription || 'Apoio')).join('; ');
            const helpedStr = s.helpedOthers.map(h => `Ajudou ${h.helpedStudent || 'colega'}`).join('; ');

            csv += `"${s.name}","${s.groupName || 'Sem Equipe'}","${s.participated ? 'Participou' : 'Não Sorteado'}",${s.hits},${s.misses},${s.helpReceived.length},"${helpRecStr.replace(/"/g, '""')}",${s.helpedOthers.length},"${helpedStr.replace(/"/g, '""')}",${s.merits},${s.violations}\n`;
        });

        csv += `\n--- QUESTOES TRABALHADAS NA AULA ---\n`;
        csv += `Questão,Dificuldade,Vezes Sorteada,Total Acertos,Total Erros,Vezes com Ajuda\n`;
        questionStats.forEach(q => {
            csv += `"${q.question.replace(/"/g, '""')}","${q.difficulty}",${q.timesAsked},${q.correctCount},${q.incorrectCount},${q.helpCount}\n`;
        });

        const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `Relatorio_Aula_${classNameClean}_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (!isOpen) return null;

    const { metrics, questionStats, studentStats, groupStats } = filteredData;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Relatório de Aula & Insights da Turma"
            icon={BarChart3}
            size="xl"
        >
            <div className="space-y-5 select-none animate-in fade-in duration-200">
                
                {/* ============================================================ */}
                {/* 1. TOPO: Metadados da Aula e Filtro de Escopo Temporal */}
                {/* ============================================================ */}
                <div className="bg-gradient-to-r from-indigo-50/90 via-purple-50/50 to-amber-50/50 border border-indigo-100 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                    <div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-black text-slate-900 text-base sm:text-lg">
                                {currentClass?.name || 'Turma Selecionada'}
                            </span>
                            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-white border border-indigo-200 text-indigo-700 shadow-2xs">
                                📚 {activeActivity?.topic || activeActivity?.title || 'Conteúdo da Roleta'}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium mt-1 flex-wrap">
                            <span className="flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                {new Date().toLocaleDateString('pt-BR')}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                                <Layers className="w-3.5 h-3.5 text-indigo-500" />
                                Formato: <strong>{metrics.dynamicsLabel}</strong>
                            </span>
                        </div>
                    </div>

                    {/* Filtro de Período + Botões de Ação */}
                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
                        {/* Seletor do Escopo */}
                        <div className="inline-flex items-center gap-1 bg-white border border-slate-200 p-1 rounded-xl shadow-2xs">
                            <button
                                type="button"
                                onClick={() => setPeriodFilter('session')}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                    periodFilter === 'session'
                                        ? 'bg-indigo-600 text-white shadow-xs'
                                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                                }`}
                                title="Filtrar apenas as rodadas desta aula atual"
                            >
                                Aula Atual
                            </button>
                            <button
                                type="button"
                                onClick={() => setPeriodFilter('today')}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                    periodFilter === 'today'
                                        ? 'bg-indigo-600 text-white shadow-xs'
                                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                                }`}
                                title="Filtrar todas as rodadas realizadas hoje"
                            >
                                Hoje (24h)
                            </button>
                            <button
                                type="button"
                                onClick={() => setPeriodFilter('all')}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                    periodFilter === 'all'
                                        ? 'bg-indigo-600 text-white shadow-xs'
                                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                                }`}
                                title="Visualizar todo o histórico acumulado da turma"
                            >
                                Acumulado
                            </button>
                        </div>

                        {/* Botão de Impressão PDF */}
                        <button
                            type="button"
                            onClick={handlePrintReport}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
                            title="Imprimir relatório profissional ou salvar em PDF"
                        >
                            <Printer className="w-3.5 h-3.5 text-amber-300" />
                            <span>Imprimir / PDF</span>
                        </button>

                        {/* Botão de Download CSV */}
                        <button
                            type="button"
                            onClick={handleDownloadCsv}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-95"
                            title="Exportar dados para o Excel (CSV)"
                        >
                            <Download className="w-3.5 h-3.5 text-indigo-600" />
                            <span className="hidden md:inline">CSV</span>
                        </button>
                    </div>
                </div>

                {/* ============================================================ */}
                {/* 2. CARDS DE KPIS / MÉTRICAS CHAVE DA AULA */}
                {/* ============================================================ */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    {/* Taxa de Acertos */}
                    <div className="bg-white border-2 border-emerald-100 rounded-2xl p-3 shadow-2xs flex flex-col items-center justify-center text-center">
                        <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-1">
                            <CheckCircle className="w-4 h-4" />
                        </div>
                        <span className="text-2xl font-black text-slate-900">{metrics.hitRate}%</span>
                        <span className="text-2xs font-bold text-slate-500 uppercase tracking-wider">
                            Acertos ({metrics.totalHits}/{metrics.totalHits + metrics.totalMisses})
                        </span>
                    </div>

                    {/* Engajamento dos Alunos */}
                    <div className="bg-white border-2 border-indigo-100 rounded-2xl p-3 shadow-2xs flex flex-col items-center justify-center text-center">
                        <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mb-1">
                            <Users className="w-4 h-4" />
                        </div>
                        <span className="text-2xl font-black text-slate-900">{metrics.participationRate}%</span>
                        <span className="text-2xs font-bold text-slate-500 uppercase tracking-wider">
                            Engajamento ({metrics.participatingStudents}/{metrics.totalStudents})
                        </span>
                    </div>

                    {/* Colaboração & Ajuda Mútua */}
                    <div className="bg-white border-2 border-sky-100 rounded-2xl p-3 shadow-2xs flex flex-col items-center justify-center text-center">
                        <div className="w-8 h-8 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center mb-1">
                            <HeartHandshake className="w-4 h-4" />
                        </div>
                        <span className="text-2xl font-black text-slate-900">{metrics.helpRounds}</span>
                        <span className="text-2xs font-bold text-slate-500 uppercase tracking-wider">
                            Ajudas ({metrics.helpConversionRate}% êxito)
                        </span>
                    </div>

                    {/* Questões Trabalhadas */}
                    <div className="bg-white border-2 border-purple-100 rounded-2xl p-3 shadow-2xs flex flex-col items-center justify-center text-center">
                        <div className="w-8 h-8 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center mb-1">
                            <HelpCircle className="w-4 h-4" />
                        </div>
                        <span className="text-2xl font-black text-slate-900">{questionStats.length}</span>
                        <span className="text-2xs font-bold text-slate-500 uppercase tracking-wider">
                            Questões Trabalhadas
                        </span>
                    </div>

                    {/* Total de Rodadas */}
                    <div className="col-span-2 sm:col-span-1 bg-white border-2 border-amber-100 rounded-2xl p-3 shadow-2xs flex flex-col items-center justify-center text-center">
                        <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mb-1">
                            <Clock className="w-4 h-4" />
                        </div>
                        <span className="text-2xl font-black text-slate-900">{metrics.totalRounds}</span>
                        <span className="text-2xs font-bold text-slate-500 uppercase tracking-wider">
                            Rodadas no Período
                        </span>
                    </div>
                </div>

                {/* ============================================================ */}
                {/* 3. NAVEGAÇÃO ENTRE ABAS */}
                {/* ============================================================ */}
                <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto custom-scrollbar">
                    <button
                        type="button"
                        onClick={() => setActiveTab('overview')}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                            activeTab === 'overview'
                                ? 'bg-indigo-600 text-white shadow-xs'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                    >
                        <Sparkles className="w-4 h-4 text-amber-300" />
                        <span>Visão Geral & Insights</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('questions')}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                            activeTab === 'questions'
                                ? 'bg-indigo-600 text-white shadow-xs'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                    >
                        <HelpCircle className="w-4 h-4" />
                        <span>Questões da Aula ({questionStats.length})</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('students')}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                            activeTab === 'students'
                                ? 'bg-indigo-600 text-white shadow-xs'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                    >
                        <User className="w-4 h-4" />
                        <span>Participação dos Alunos ({studentStats.length})</span>
                    </button>

                    {groupStats.length > 0 && (
                        <button
                            type="button"
                            onClick={() => setActiveTab('groups')}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                                activeTab === 'groups'
                                    ? 'bg-indigo-600 text-white shadow-xs'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                        >
                            <Users className="w-4 h-4" />
                            <span>Equipes / Grupos ({groupStats.length})</span>
                        </button>
                    )}
                </div>

                {/* ============================================================ */}
                {/* 4. CONTEÚDO DAS ABAS */}
                {/* ============================================================ */}

                {/* ABA 1: VISÃO GERAL & INSIGHTS PEDAGÓGICOS */}
                {activeTab === 'overview' && (
                    <div className="space-y-5 animate-in fade-in duration-200">
                        
                        {/* Diagnóstico da Dinâmica da Aula */}
                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                            <h4 className="text-xs font-black uppercase tracking-wider text-slate-600 mb-2 flex items-center gap-1.5">
                                <Layers className="w-4 h-4 text-indigo-600" />
                                <span>Dinâmica da Aula: {metrics.dynamicsLabel}</span>
                            </h4>
                            <p className="text-xs text-slate-700 leading-relaxed">
                                {metrics.dynamicsType === 'individual' && (
                                    <>Nesta aula, todas as <strong>{metrics.totalRounds} rodadas</strong> foram realizadas no formato <strong>Individual</strong>. Cada aluno sorteado foi desafiado individualmente a apresentar sua resposta e raciocínio ao grupo.</>
                                )}
                                {metrics.dynamicsType === 'group' && (
                                    <>Nesta aula, todas as <strong>{metrics.totalRounds} rodadas</strong> foram realizadas no formato <strong>Em Equipes</strong>. As equipes debateram internamente e indicaram porta-vozes para representar a resposta.</>
                                )}
                                {metrics.dynamicsType === 'mixed' && (
                                    <>A aula utilizou uma dinâmica <strong>Mista</strong>, alternando entre <strong>{metrics.individualRounds} rodadas individuais</strong> e <strong>{metrics.groupRounds} rodadas em equipe</strong>, permitindo tanto a responsabilização individual quanto a construção coletiva.</>
                                )}
                                {metrics.dynamicsType === 'sem_dados' && (
                                    <>Nenhuma atividade registrada com esse filtro. Comece girando a roleta para capturar os dados!</>
                                )}
                            </p>
                        </div>

                        {/* Cards de Insights Pedagógicos Instantâneos */}
                        <div className="space-y-3">
                            <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                                <Sparkles className="w-4 h-4 text-amber-500" />
                                <span>Insights Pedagógicos Instantâneos</span>
                            </h4>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {algorithmicInsights.map((insight, idx) => {
                                    const IconComp = insight.icon;
                                    const cardStyles = {
                                        success: 'bg-emerald-50/70 border-emerald-200 text-emerald-950',
                                        warning: 'bg-amber-50/70 border-amber-200 text-amber-950',
                                        highlight: 'bg-indigo-50/70 border-indigo-200 text-indigo-950',
                                        info: 'bg-slate-50 border-slate-200 text-slate-900'
                                    }[insight.type] || 'bg-slate-50 border-slate-200 text-slate-900';

                                    const iconColor = {
                                        success: 'text-emerald-600',
                                        warning: 'text-amber-600',
                                        highlight: 'text-indigo-600',
                                        info: 'text-slate-600'
                                    }[insight.type] || 'text-slate-600';

                                    return (
                                        <div key={idx} className={`border rounded-2xl p-3.5 flex items-start gap-3 shadow-2xs ${cardStyles}`}>
                                            <div className={`p-2 rounded-xl bg-white shadow-2xs shrink-0 ${iconColor}`}>
                                                <IconComp className="w-4 h-4" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <h5 className="font-bold text-xs mb-1">{insight.title}</h5>
                                                <p className="text-xs leading-relaxed opacity-90">{insight.text}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Parecer Pedagógico com IA (Gemini) */}
                        <div className="bg-gradient-to-br from-indigo-950 via-slate-950 to-purple-950 border border-indigo-500/30 rounded-3xl p-5 text-white shadow-md relative overflow-hidden">
                            <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
                                        <Bot className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <h4 className="font-black text-sm text-indigo-200 flex items-center gap-1.5">
                                            <span>Síntese Pedagógica com IA</span>
                                            <span className="text-[10px] bg-indigo-500/30 border border-indigo-400/40 text-indigo-300 px-1.5 py-0.2 rounded-md font-mono">
                                                Gemini
                                            </span>
                                        </h4>
                                        <p className="text-2xs text-slate-400">
                                            Gera um parecer formal pronto para diário de classe ou coordenação
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    {aiSummary && (
                                        <button
                                            type="button"
                                            onClick={handleCopyAiSummary}
                                            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border border-white/20"
                                            title="Copiar texto do parecer"
                                        >
                                            {copiedAi ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                            <span>{copiedAi ? 'Copiado!' : 'Copiar Texto'}</span>
                                        </button>
                                    )}

                                    <button
                                        type="button"
                                        disabled={isGeneratingAi}
                                        onClick={handleGenerateAiSummary}
                                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white text-xs font-black transition-all cursor-pointer flex items-center gap-2 shadow-sm disabled:opacity-50 active:scale-95"
                                    >
                                        <Sparkles className={`w-4 h-4 text-amber-300 ${isGeneratingAi ? 'animate-spin' : ''}`} />
                                        <span>{isGeneratingAi ? 'Analisando a Aula...' : aiSummary ? 'Regerar Parecer' : '✨ Gerar Parecer com IA'}</span>
                                    </button>
                                </div>
                            </div>

                            {aiError && (
                                <div className="bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs p-3 rounded-xl mb-3">
                                    {aiError}
                                </div>
                            )}

                            {aiSummary ? (
                                <div className="bg-white/5 border border-white/10 p-4 rounded-2xl text-xs text-slate-200 leading-relaxed font-sans whitespace-pre-wrap animate-in fade-in">
                                    {aiSummary}
                                </div>
                            ) : (
                                <div className="bg-white/5 border border-dashed border-white/10 p-4 rounded-2xl text-xs text-slate-400 text-center">
                                    Clique em <strong>"✨ Gerar Parecer com IA"</strong> para obter uma síntese descritiva e reflexiva sobre o rendimento, engajamento e cooperação da turma nesta aula.
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ABA 2: QUESTÕES TRABALHADAS */}
                {activeTab === 'questions' && (
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
                                                            {q.rounds.map((r, ri) => (
                                                                <span key={ri} className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded border border-slate-200 font-medium">
                                                                    {r.participants.join(', ')} ({r.result === 'correct' || r.result === 'help_correct' ? '✅' : '❌'})
                                                                </span>
                                                            ))}
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
                )}

                {/* ABA 3: PARTICIPAÇÃO DOS ALUNOS */}
                {activeTab === 'students' && (
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
                                                    {s.participated ? (
                                                        <span className="px-2 py-0.5 rounded-full text-2xs font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                                                            Respondeu ({s.totalAnswers}x)
                                                        </span>
                                                    ) : (
                                                        <span className="px-2 py-0.5 rounded-full text-2xs font-semibold bg-slate-100 text-slate-500">
                                                            Não Sorteado
                                                        </span>
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
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* ABA 4: EQUIPES / GRUPOS */}
                {activeTab === 'groups' && groupStats.length > 0 && (
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
                )}

            </div>
        </Modal>
    );
};
