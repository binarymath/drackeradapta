import React, { useState, useMemo } from 'react';
import { 
    CheckCircle, XCircle, HeartHandshake, Award, Users, User, 
    BarChart3, HelpCircle, Sparkles, AlertTriangle, Printer, Download, 
    Copy, Check, Filter, Calendar, Clock, Trophy, Target, ArrowRight, 
    BookOpen, Star, FileText, Bot, Layers, Info,
    Shuffle, RotateCcw, RotateCw, Search, Flame, Eye, EyeOff, UserMinus, UserCheck
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
    selectedModel = 'gemini-2.5-flash',
    interactionLogs = []
}) => {
    // Escopo temporal do relatório: 'session' (aula atual) | 'today' (hoje) | 'all' (todo o histórico)
    const [periodFilter, setPeriodFilter] = useState('session');
    // Aba ativa: 'overview' | 'actions' | 'questions' | 'students' | 'groups'
    const [activeTab, setActiveTab] = useState('overview');

    // Filtros da aba de ações e toques
    const [actionCategoryFilter, setActionCategoryFilter] = useState('all');
    const [actionSearchTerm, setActionSearchTerm] = useState('');

    // Estado da Síntese Pedagógica Coletiva com IA
    const [aiCollectiveSummary, setAiCollectiveSummary] = useState('');
    const [isGeneratingCollectiveAi, setIsGeneratingCollectiveAi] = useState(false);
    const [copiedCollectiveAi, setCopiedCollectiveAi] = useState(false);

    // Estado do Diagnóstico Individual Consolidado com IA
    const [aiIndividualSummary, setAiIndividualSummary] = useState('');
    const [isGeneratingIndividualAi, setIsGeneratingIndividualAi] = useState(false);
    const [copiedIndividualAi, setCopiedIndividualAi] = useState(false);

    // Modo da IA ativo no card da Visão Geral: 'collective' | 'individual'
    const [aiActiveMode, setAiActiveMode] = useState('collective');

    // Estado de Pareceres Individuais por Aluno (dicionário { [studentId]: string })
    const [studentAiInsights, setStudentAiInsights] = useState({});
    const [generatingStudentId, setGeneratingStudentId] = useState(null);
    const [selectedStudentForAi, setSelectedStudentForAi] = useState(null);
    const [copiedStudentAi, setCopiedStudentAi] = useState(false);

    // Erros gerais da IA
    const [aiError, setAiError] = useState(null);

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

        // Filtragem dos registros de toques e ações do professor na tela da roleta
        const filteredActionLogs = (interactionLogs || []).filter(log => {
            if (!log || !log.timestamp) return false;
            if (periodFilter === 'session') {
                if (currentSessionId && log.sessionId) {
                    return log.sessionId === currentSessionId;
                }
                return log.timestamp >= startTime;
            }
            if (periodFilter === 'today') {
                return new Date(log.timestamp).toDateString() === todayStr;
            }
            return true; // 'all'
        });

        const studentSwapsCount = filteredActionLogs.filter(l => l.type === 'swap_student').length;
        const questionSwapsCount = filteredActionLogs.filter(l => l.type === 'swap_question').length;
        const spinsCount = filteredActionLogs.filter(l => l.type === 'spin').length;
        const spinAgainCount = filteredActionLogs.filter(l => l.type === 'spin_again').length;
        const absentCount = filteredActionLogs.filter(l => l.type === 'absent').length;
        const rosterChangesCount = filteredActionLogs.filter(l => 
            l.type === 'student_removed' || l.type === 'student_reactivated' || 
            l.type === 'activate_all' || l.type === 'deactivate_all'
        ).length;
        const manualSelectionsCount = filteredActionLogs.filter(l => 
            l.type === 'manual_select_student' || l.type === 'manual_select_group'
        ).length;
        const meritsCount = filteredActionLogs.filter(l => 
            l.type === 'point_merit' || l.type === 'group_point_merit'
        ).length;
        const penaltiesCount = filteredActionLogs.filter(l => 
            l.type === 'point_penalty' || l.type === 'group_point_penalty'
        ).length;
        const bombExplodedCount = filteredActionLogs.filter(l => l.type === 'bomb_exploded').length;
        const revealAnswerCount = filteredActionLogs.filter(l => l.type === 'reveal_answer').length;
        const revealHintCount = filteredActionLogs.filter(l => l.type === 'reveal_hint').length;

        return {
            allEvents,
            uniqueRounds,
            studentStats,
            questionStats,
            groupStats,
            actionLogs: filteredActionLogs,
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
                dynamicsLabel,
                totalActions: filteredActionLogs.length,
                studentSwapsCount,
                questionSwapsCount,
                spinsCount,
                spinAgainCount,
                absentCount,
                rosterChangesCount,
                manualSelectionsCount,
                meritsCount,
                penaltiesCount,
                bombExplodedCount,
                revealAnswerCount,
                revealHintCount
            }
        };
    }, [currentClass, currentGroups, questions, periodFilter, currentSessionId, sessionStartTime, interactionLogs]);

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

        // 7. Intervenções do Professor e Flexibilidade
        if (metrics.questionSwapsCount > 0) {
            insights.push({
                type: 'highlight',
                icon: HelpCircle,
                title: 'Flexibilidade Didática nas Perguntas',
                text: `O professor realizou ${metrics.questionSwapsCount} troca(s) de pergunta durante a aula, calibrando o nível de desafio e diversificando a aprendizagem.`
            });
        }

        if (metrics.studentSwapsCount > 0) {
            insights.push({
                type: 'info',
                icon: Shuffle,
                title: 'Rotação e Troca de Alunos',
                text: `Houve ${metrics.studentSwapsCount} troca(s) de respondente mantendo a pergunta original, dinamizando a participação da turma.`
            });
        }

        if (metrics.spinAgainCount > 0) {
            insights.push({
                type: 'info',
                icon: RotateCcw,
                title: 'Recurso "Rode Outra Vez" Acionado',
                text: `"Rode Outra Vez" foi utilizado em ${metrics.spinAgainCount} momento(s), reiniciando rodadas de forma acolhedora sem penalização ao estudante.`
            });
        }

        if (metrics.absentCount > 0) {
            insights.push({
                type: 'warning',
                icon: UserMinus,
                title: 'Registro de Alunos Ausentes',
                text: `${metrics.absentCount} aluno(s) foram marcados como ausentes pelo professor durante os sorteios, mantendo o histórico consistente.`
            });
        }

        return insights;
    }, [filteredData]);

    // -------------------------------------------------------------------------
    // 3. GERADORES DE INSIGHTS COM IA (GEMINI): COLETIVO E INDIVIDUAL
    // -------------------------------------------------------------------------
    
    // 3.1 Síntese Pedagógica Coletiva da Turma
    const handleGenerateCollectiveAi = async () => {
        if (!geminiService || !geminiService.apiKey) {
            setAiError('Chave da API Gemini não configurada. Por favor, adicione sua chave nas configurações.');
            return;
        }

        setIsGeneratingCollectiveAi(true);
        setAiError(null);

        const { metrics, questionStats, studentStats } = filteredData;

        const prompt = `
Você é um consultor pedagógico e professor especialista em metodologias ativas e gamificação na educação básica.
Escreva a Síntese Pedagógica Coletiva da Aula em formato profissional, reflexivo e conciso (máximo 3 parágrafos bem estruturados), com base no diagnóstico abaixo:

DADOS GERAIS DA TURMA E DA AULA:
- Turma: "${currentClass?.name || 'Turma'}"
- Conteúdo/Tema Curricular: "${activeActivity?.topic || activeActivity?.title || 'Conteúdo Curricular'}"
- Dinâmica Predominante: ${metrics.dynamicsLabel} (${metrics.individualRounds} rodadas individuais e ${metrics.groupRounds} rodadas em equipe)
- Total de Rodadas Concluídas: ${metrics.totalRounds}
- Taxa Geral de Acertos: ${metrics.hitRate}% (${metrics.totalHits} acertos e ${metrics.totalMisses} erros)
- Engajamento da Turma: ${metrics.participationRate}% (${metrics.participatingStudents} de ${metrics.totalStudents} alunos responderam)
- Colaboração & Ajuda Mútua: ${metrics.helpRounds} pedidos de ajuda entre alunos, com taxa de sucesso de ${metrics.helpConversionRate}%
- Questões com mais dúvidas/erros: ${questionStats.filter(q => q.incorrectCount > 0).slice(0, 3).map(q => `"${q.question}"`).join('; ') || 'Nenhuma questão crítica'}
- Alunos destaque no acolhimento/ajuda: ${studentStats.filter(s => s.helpedOthers.length > 0).map(s => `${s.name} (${s.helpedOthers.length}x)`).join(', ') || 'Colaboração distribuída'}
- Mediação do Professor na Tela da Roleta: ${metrics.totalActions || 0} toques/ações registradas:
  * ${metrics.spinsCount || 0} giros da roleta
  * ${metrics.studentSwapsCount || 0} trocas de aluno no card (dinamizando a rotatividade)
  * ${metrics.questionSwapsCount || 0} trocas de pergunta (calibrando o nível didático)
  * ${metrics.spinAgainCount || 0} acionamentos de "Rode Outra Vez" (oferecendo nova chance sem penalizar)
  * ${metrics.absentCount || 0} alunos marcados como ausente nos sorteios
  * ${metrics.meritsCount || 0} méritos concedidos e ${metrics.penaltiesCount || 0} infrações a regras

ESTRUTURA DA SÍNTESE COLETIVA:
1. Primeiro parágrafo (Aproveitamento & Clima Geral): Resuma o nível geral de absorção do conteúdo pela turma, se a dinâmica foi mais individual ou em grupo, e o ritmo de engajamento dos estudantes.
2. Segundo parágrafo (Cooperação & Mediação Docente): Avalie a solidariedade entre os alunos (como a rede de ajuda funcionou) e destaque o papel mediador do professor (equilibrando dificuldade com trocas de pergunta e flexibilizando com 'Rode Outra Vez').
3. Terceiro parágrafo (Diretrizes Pedagógicas para a Próxima Aula): Forneça recomendações práticas e acionáveis para o próximo plano de aula (quais conceitos específicos retomar ou como reorganizar as equipes).
Tom formal, acolhedor e pronto para o professor colar no Diário de Classe ou enviar à Coordenação Pedagógica.
`;

        try {
            const text = await geminiService.generateText(prompt, {
                model: selectedModel || 'gemini-2.5-flash',
                temperature: 0.7
            });
            setAiCollectiveSummary(text.trim());
        } catch (err) {
            console.error('Erro ao gerar síntese coletiva com IA:', err);
            setAiError('Não foi possível gerar a síntese coletiva no momento. Tente novamente.');
        } finally {
            setIsGeneratingCollectiveAi(false);
        }
    };

    // 3.2 Diagnóstico Individual Consolidado dos Alunos
    const handleGenerateIndividualAi = async () => {
        if (!geminiService || !geminiService.apiKey) {
            setAiError('Chave da API Gemini não configurada. Por favor, adicione sua chave nas configurações.');
            return;
        }

        setIsGeneratingIndividualAi(true);
        setAiError(null);

        const { studentStats, metrics } = filteredData;

        // Montar resumo pedagógico de cada aluno
        const studentSummaries = studentStats.map(s => {
            const wrongQuestions = s.history.filter(h => h.result === 'incorrect' || h.result === 'group_incorrect').map(h => `"${h.question}"`);
            return `- ${s.name}${s.groupName ? ` (Equipe: ${s.groupName})` : ''}: Status: ${s.participated ? `Participou (${s.totalAnswers}x)` : 'Não Sorteado'}. Acertos: ${s.hits}, Erros: ${s.misses}, Teve Ajuda: ${s.helpReceived.length}x, Ajudou Colegas: ${s.helpedOthers.length}x, Méritos: +${s.merits}, Infrações: -${s.violations}.${wrongQuestions.length > 0 ? ` Dificuldades em: ${wrongQuestions.slice(0, 2).join('; ')}.` : ''}`;
        }).join('\n');

        const prompt = `
Você é um especialista em avaliação formativa e acompanhamento individual de aprendizagem escolar.
Analise os dados individuais de cada estudante da turma abaixo e gere um Diagnóstico Individual Consolidado da Turma, organizado em 4 seções humanizadas, construtivas e sem rótulos estigmatizantes:

DADOS DA TURMA:
- Turma: "${currentClass?.name || 'Turma'}"
- Conteúdo Trabalhado: "${activeActivity?.topic || activeActivity?.title || 'Conteúdo Curricular'}"
- Total de Alunos: ${metrics.totalStudents} (Participaram: ${metrics.participatingStudents}, Não Sorteados/Ausentes: ${metrics.totalStudents - metrics.participatingStudents})

DESEMPENHO INDIVIDUAL DETALHADO DOS ESTUDANTES:
${studentSummaries}

ESTRUTURA DO DIAGNÓSTICO (organize claramente com títulos e tópicos destacados):
1. 🌟 Alunos com Alto Domínio & Autonomia Cognitiva:
   Cite nominalmente os alunos que acertaram com precisão e demonstraram segurança no conteúdo.
2. 🤝 Monitores Solidários & Cooperação entre Pares:
   Destaque nominalmente os alunos que se dispuseram a ajudar colegas, fortalecendo a rede de cooperação da sala.
3. 🎯 Apoio Pedagógico Prioritário & Dificuldades Pontuais:
   Indique os alunos que erraram ou dependeram frequentemente de ajuda, especificando quais tipos de conceitos ou perguntas demandam reforço ou acolhimento individualizado.
4. 🔍 Inclusão & Próximos Sorteios:
   Mencione os alunos que não foram sorteados nesta sessão e recomende estratégias para priorizá-los e engajá-los no próximo encontro.
Tom acolhedor, profissional e focado no crescimento de cada estudante.
`;

        try {
            const text = await geminiService.generateText(prompt, {
                model: selectedModel || 'gemini-2.5-flash',
                temperature: 0.7
            });
            setAiIndividualSummary(text.trim());
        } catch (err) {
            console.error('Erro ao gerar diagnóstico individual consolidado com IA:', err);
            setAiError('Não foi possível gerar o diagnóstico individual no momento. Tente novamente.');
        } finally {
            setIsGeneratingIndividualAi(false);
        }
    };

    // 3.3 Parecer Individual por Aluno Específico
    const handleGenerateStudentAi = async (student) => {
        if (!geminiService || !geminiService.apiKey) {
            setAiError('Chave da API Gemini não configurada. Por favor, adicione sua chave nas configurações.');
            return;
        }

        setGeneratingStudentId(student.id);
        setAiError(null);

        const studentData = filteredData.studentStats.find(s => s.id === student.id) || student;
        const prompt = `
Você é um consultor pedagógico e especialista em avaliação formativa para o Ensino Fundamental e Médio.
Escreva um Parecer Pedagógico Individual Descritivo (3 parágrafos concisos e objetivos) para o diário de classe / prontuário escolar do estudante abaixo:

DADOS DO ESTUDANTE:
- Aluno(a): "${studentData.name}"
- Turma: "${currentClass?.name || 'Turma'}"
- Conteúdo/Tema Trabalhado: "${activeActivity?.topic || activeActivity?.title || 'Conteúdo Curricular'}"
- Status na Aula: ${studentData.participated ? `Participou (${studentData.totalAnswers} rodadas)` : 'Não sorteado no período'}
- Acertos na Roleta: ${studentData.hits || 0}
- Erros na Roleta: ${studentData.misses || 0}
- Vezes em que Teve Ajuda: ${studentData.helpReceived ? studentData.helpReceived.length : 0}
- Vezes em que Ajudou Colegas: ${studentData.helpedOthers ? studentData.helpedOthers.length : 0}
- Méritos Concedidos: +${studentData.merits || 0}
- Perguntas Respondidas:
${(studentData.history || []).map((h, i) => `  ${i + 1}. Pergunta: "${h.question}" | Resultado: ${h.result} | Teve Ajuda: ${h.hadHelp || h.helperName ? `Sim (${h.helperName || 'colega'})` : 'Não'}`).join('\n') || '  (Sem perguntas registradas neste período)'}

ESTRUTURA DO PARECER:
1. Primeiro Parágrafo (Domínio Conceitual & Participação): Avalie como o estudante lidou com o tema, seu engajamento nas rodadas da roleta e segurança nas respostas.
2. Segundo Parágrafo (Dimensão Socioemocional & Cooperação): Analise sua postura frente aos desafios (se teve autonomia ou precisou de apoio) e destaque se atuou com empatia e espírito coletivo ajudando colegas.
3. Terceiro Parágrafo (Recomendação Pedagógica Personalizada): Indique um direcionamento prático para a continuidade dos estudos.
Tom formal, acolhedor e pronto para o professor colar no Diário de Classe ou prontuário.
`;

        try {
            const text = await geminiService.generateText(prompt, {
                model: selectedModel || 'gemini-2.5-flash',
                temperature: 0.7
            });
            setStudentAiInsights(prev => ({
                ...prev,
                [student.id]: text.trim()
            }));
        } catch (err) {
            console.error(`Erro ao gerar parecer pedagógico do aluno ${student.name} com IA:`, err);
            setAiError(`Não foi possível gerar o parecer de ${student.name} no momento.`);
        } finally {
            setGeneratingStudentId(null);
        }
    };

    const handleCopyCollectiveAi = () => {
        if (!aiCollectiveSummary) return;
        navigator.clipboard.writeText(aiCollectiveSummary);
        setCopiedCollectiveAi(true);
        setTimeout(() => setCopiedCollectiveAi(false), 2000);
    };

    const handleCopyIndividualAi = () => {
        if (!aiIndividualSummary) return;
        navigator.clipboard.writeText(aiIndividualSummary);
        setCopiedIndividualAi(true);
        setTimeout(() => setCopiedIndividualAi(false), 2000);
    };

    const handleCopySelectedStudentAi = () => {
        if (!selectedStudentForAi || !studentAiInsights[selectedStudentForAi.id]) return;
        navigator.clipboard.writeText(studentAiInsights[selectedStudentForAi.id]);
        setCopiedStudentAi(true);
        setTimeout(() => setCopiedStudentAi(false), 2000);
    };

    const handlePrintStudentReport = (student) => {
        if (!student) return;
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const aiText = studentAiInsights[student.id] || '';
        const questionsListHtml = (student.history || []).map((h, i) => `
            <tr style="border-bottom: 1px solid #e2e8f0; font-size: 11px;">
                <td style="padding: 6px 8px;">#${i + 1}</td>
                <td style="padding: 6px 8px; font-weight: bold;">${h.question}</td>
                <td style="padding: 6px 8px; text-align: center; color: ${h.result === 'correct' || h.result === 'help_correct' ? '#16a34a' : '#dc2626'}; font-weight: bold;">
                    ${h.result === 'correct' || h.result === 'help_correct' ? 'Acertou' : h.result === 'merit' ? '+1 Mérito' : 'Errou'}
                </td>
                <td style="padding: 6px 8px; text-align: center;">
                    ${h.hadHelp || h.helperName ? `🤝 Sim (${h.helperName || 'Apoio'})` : '-'}
                </td>
                <td style="padding: 6px 8px; text-align: center; color: #64748b;">
                    ${new Date(h.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </td>
            </tr>
        `).join('');

        printWindow.document.write(`
            <!DOCTYPE html>
            <html lang="pt-BR">
            <head>
                <meta charset="UTF-8">
                <title>Ficha Pedagógica - ${student.name}</title>
                <style>
                    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #0f172a; margin: 25px; line-height: 1.5; }
                    .header { border-bottom: 2px solid #cbd5e1; padding-bottom: 12px; margin-bottom: 16px; }
                    .title { font-size: 18px; font-weight: 900; color: #1e1b4b; margin: 0; }
                    .kpis { display: flex; gap: 10px; margin-bottom: 18px; }
                    .kpi-card { flex: 1; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; text-align: center; background: #fafafa; }
                    .kpi-val { font-size: 18px; font-weight: 900; }
                    .kpi-label { font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: bold; margin-top: 2px; }
                    .ai-box { background: #faf5ff; border: 2px solid #c084fc; border-radius: 12px; padding: 16px; margin-bottom: 20px; }
                    @media print { body { margin: 0; padding: 15px; } }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1 class="title">Ficha Pedagógica Individual do Estudante</h1>
                    <div style="font-size: 12px; color: #64748b; margin-top: 4px;">
                        Estudante: <strong>${student.name}</strong> • Turma: <strong>${currentClass?.name || 'Turma'}</strong> • Tema: <strong>${activeActivity?.topic || activeActivity?.title || 'Conteúdo Curricular'}</strong>
                    </div>
                </div>

                <div class="kpis">
                    <div class="kpi-card">
                        <div class="kpi-val" style="color: #16a34a;">${student.hits || 0}</div>
                        <div class="kpi-label">Acertos</div>
                    </div>
                    <div class="kpi-card">
                        <div class="kpi-val" style="color: #dc2626;">${student.misses || 0}</div>
                        <div class="kpi-label">Erros</div>
                    </div>
                    <div class="kpi-card">
                        <div class="kpi-val" style="color: #0284c7;">${student.helpReceived ? student.helpReceived.length : 0}</div>
                        <div class="kpi-label">Teve Ajuda</div>
                    </div>
                    <div class="kpi-card">
                        <div class="kpi-val" style="color: #16a34a;">${student.helpedOthers ? student.helpedOthers.length : 0}</div>
                        <div class="kpi-label">Ajudou Colegas</div>
                    </div>
                    <div class="kpi-card">
                        <div class="kpi-val" style="color: #7c3aed;">+${student.merits || 0}</div>
                        <div class="kpi-label">Méritos</div>
                    </div>
                </div>

                ${aiText ? `
                    <div class="ai-box">
                        <h3 style="margin: 0 0 8px 0; color: #7e22ce; font-size: 14px;">✨ Parecer Descritivo do Estudante (Inteligência Artificial):</h3>
                        <p style="font-size: 12px; line-height: 1.6; color: #1e293b; white-space: pre-wrap; margin: 0;">${aiText}</p>
                    </div>
                ` : ''}

                <h3 style="font-size: 13px; font-weight: bold; color: #1e293b; border-bottom: 2px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 8px;">
                    Questões Respondidas na Aula (${(student.history || []).length})
                </h3>
                <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 11px;">
                    <thead>
                        <tr style="background-color: #f8fafc; border-bottom: 2px solid #cbd5e1;">
                            <th style="padding: 6px 8px; width: 30px;">#</th>
                            <th style="padding: 6px 8px;">Pergunta</th>
                            <th style="padding: 6px 8px; text-align: center; width: 70px;">Resultado</th>
                            <th style="padding: 6px 8px; text-align: center; width: 100px;">Ajuda</th>
                            <th style="padding: 6px 8px; text-align: center; width: 70px;">Horário</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${questionsListHtml || '<tr><td colspan="5" style="padding: 8px; text-align: center; color: #94a3b8;">Nenhuma pergunta respondida neste período.</td></tr>'}
                    </tbody>
                </table>

                <script>window.onload = function() { window.print(); };</script>
            </body>
            </html>
        `);
        printWindow.document.close();
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
                <td style="padding: 6px 8px; text-align: center;">${studentAiInsights[s.id] ? '<span style="color: #7e22ce; font-weight: bold;">✨ Parecer</span>' : '-'}</td>
            </tr>
        `).join('');

        const actionsTableHtml = (filteredData.actionLogs || []).map(log => `
            <tr style="border-bottom: 1px solid #e2e8f0; font-size: 11px;">
                <td style="padding: 6px 8px; font-family: monospace; font-weight: bold; color: #475569;">${log.timeFormatted || '-'}</td>
                <td style="padding: 6px 8px; font-weight: bold;">${log.title || 'Ação'}</td>
                <td style="padding: 6px 8px; color: #334155;">${log.description || '-'}</td>
                <td style="padding: 6px 8px; color: #475569;">${log.studentName || log.groupName || '-'}</td>
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

        const collectiveAiHtml = aiCollectiveSummary ? `
            <div style="margin-top: 18px; background-color: #f8fafc; border-left: 4px solid #6366f1; padding: 12px 16px; border-radius: 6px;">
                <h4 style="margin: 0 0 6px 0; font-size: 13px; color: #4338ca;">🌐 Síntese Pedagógica Coletiva da Turma (IA):</h4>
                <div style="font-size: 11px; line-height: 1.5; color: #334155; white-space: pre-wrap;">${aiCollectiveSummary}</div>
            </div>
        ` : '';

        const individualAiHtml = aiIndividualSummary ? `
            <div style="margin-top: 14px; background-color: #f8fafc; border-left: 4px solid #a855f7; padding: 12px 16px; border-radius: 6px;">
                <h4 style="margin: 0 0 6px 0; font-size: 13px; color: #7e22ce;">👥 Diagnóstico Individual Consolidado dos Alunos (IA):</h4>
                <div style="font-size: 11px; line-height: 1.5; color: #334155; white-space: pre-wrap;">${aiIndividualSummary}</div>
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

                ${collectiveAiHtml}
                ${individualAiHtml}

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
                                <th style="padding: 6px 8px; text-align: center;">Parecer IA</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${studentsTableHtml}
                        </tbody>
                    </table>
                </div>

                ${groupsSectionHtml}

                <div style="margin-top: 20px; page-break-inside: avoid;">
                    <h3 style="font-size: 13px; font-weight: bold; color: #1e293b; border-bottom: 2px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 8px;">
                        ⏱️ Linha do Tempo e Ações Registradas na Roleta (${(filteredData.actionLogs || []).length})
                    </h3>
                    <table style="width: 100%; border-collapse: collapse; text-align: left;">
                        <thead>
                            <tr style="background-color: #f8fafc; font-size: 11px; border-bottom: 2px solid #cbd5e1;">
                                <th style="padding: 6px 8px; width: 65px;">Horário</th>
                                <th style="padding: 6px 8px; width: 150px;">Ação / Toque</th>
                                <th style="padding: 6px 8px;">Descrição</th>
                                <th style="padding: 6px 8px; width: 130px;">Aluno / Alvo</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${actionsTableHtml || '<tr><td colspan="4" style="padding: 10px; text-align: center; color: #94a3b8;">Nenhum toque adicional registrado.</td></tr>'}
                        </tbody>
                    </table>
                </div>

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
        csv += `Aluno,Equipe,Status na Aula,Acertos no Período,Erros no Período,Teve Ajuda (Qtd),Detalhes Ajuda Recebida,Ajudou Colegas (Qtd),Detalhes Ajuda Prestada,Pontos Mérito,Infrações Regra,Parecer IA Individual\n`;

        studentStats.forEach(s => {
            const helpRecStr = s.helpReceived.map(h => h.helperName ? `com ${h.helperName}` : (h.helpDescription || 'Apoio')).join('; ');
            const helpedStr = s.helpedOthers.map(h => `Ajudou ${h.helpedStudent || 'colega'}`).join('; ');
            const studentAi = (studentAiInsights[s.id] || '').replace(/"/g, '""');

            csv += `"${s.name}","${s.groupName || 'Sem Equipe'}","${s.participated ? 'Participou' : 'Não Sorteado'}",${s.hits},${s.misses},${s.helpReceived.length},"${helpRecStr.replace(/"/g, '""')}",${s.helpedOthers.length},"${helpedStr.replace(/"/g, '""')}",${s.merits},${s.violations},"${studentAi}"\n`;
        });

        csv += `\n--- QUESTOES TRABALHADAS NA AULA ---\n`;
        csv += `Questão,Dificuldade,Vezes Sorteada,Total Acertos,Total Erros,Vezes com Ajuda\n`;
        questionStats.forEach(q => {
            csv += `"${q.question.replace(/"/g, '""')}","${q.difficulty}",${q.timesAsked},${q.correctCount},${q.incorrectCount},${q.helpCount}\n`;
        });

        if (filteredData.actionLogs && filteredData.actionLogs.length > 0) {
            csv += `\n--- REGISTRO DE ACOES E TOQUES NA ROLETA ---\n`;
            csv += `Horario,Tempo Decorrido,Categoria,Acao,Descricao,Aluno/Equipe,Pergunta\n`;
            filteredData.actionLogs.forEach(log => {
                csv += `"${log.timeFormatted || ''}","${log.elapsedFormatted || ''}","${log.category || ''}","${(log.title || '').replace(/"/g, '""')}","${(log.description || '').replace(/"/g, '""')}","${(log.studentName || log.groupName || '').replace(/"/g, '""')}","${(log.question || '').replace(/"/g, '""')}"\n`;
            });
        }

        if (aiCollectiveSummary) {
            csv += `\n--- SINTESE PEDAGOGICA COLETIVA DA TURMA (IA) ---\n`;
            csv += `"${aiCollectiveSummary.replace(/"/g, '""')}"\n`;
        }

        if (aiIndividualSummary) {
            csv += `\n--- DIAGNOSTICO INDIVIDUAL CONSOLIDADO DOS ALUNOS (IA) ---\n`;
            csv += `"${aiIndividualSummary.replace(/"/g, '""')}"\n`;
        }

        const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `Relatorio_Aula_${classNameClean}_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const getActionStyle = (log) => {
        switch (log.type) {
            case 'swap_student':
                return {
                    icon: Shuffle,
                    bgColor: 'bg-purple-50',
                    textColor: 'text-purple-600',
                    borderColor: 'border-purple-200',
                    badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
                    badgeLabel: 'Troca de Aluno'
                };
            case 'swap_question':
                return {
                    icon: HelpCircle,
                    bgColor: 'bg-violet-50',
                    textColor: 'text-violet-600',
                    borderColor: 'border-violet-200',
                    badgeClass: 'bg-violet-50 text-violet-700 border-violet-200',
                    badgeLabel: 'Troca de Pergunta'
                };
            case 'spin_again':
                return {
                    icon: RotateCcw,
                    bgColor: 'bg-amber-50',
                    textColor: 'text-amber-600',
                    borderColor: 'border-amber-200',
                    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
                    badgeLabel: 'Rode Outra Vez'
                };
            case 'absent':
                return {
                    icon: UserMinus,
                    bgColor: 'bg-rose-50',
                    textColor: 'text-rose-600',
                    borderColor: 'border-rose-200',
                    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
                    badgeLabel: 'Ausente'
                };
            case 'spin':
                return {
                    icon: RotateCw,
                    bgColor: 'bg-sky-50',
                    textColor: 'text-sky-600',
                    borderColor: 'border-sky-200',
                    badgeClass: 'bg-sky-50 text-sky-700 border-sky-200',
                    badgeLabel: 'Giro da Roleta'
                };
            case 'eval_correct':
                return {
                    icon: CheckCircle,
                    bgColor: 'bg-emerald-50',
                    textColor: 'text-emerald-600',
                    borderColor: 'border-emerald-200',
                    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                    badgeLabel: 'Acertou (+1)'
                };
            case 'eval_incorrect':
                return {
                    icon: XCircle,
                    bgColor: 'bg-red-50',
                    textColor: 'text-red-600',
                    borderColor: 'border-red-200',
                    badgeClass: 'bg-red-50 text-red-700 border-red-200',
                    badgeLabel: 'Errou'
                };
            case 'eval_help':
                return {
                    icon: HeartHandshake,
                    bgColor: 'bg-sky-50',
                    textColor: 'text-sky-600',
                    borderColor: 'border-sky-200',
                    badgeClass: 'bg-sky-50 text-sky-700 border-sky-200',
                    badgeLabel: 'Ajuda em Dupla'
                };
            case 'eval_batch':
                return {
                    icon: Users,
                    bgColor: 'bg-indigo-50',
                    textColor: 'text-indigo-600',
                    borderColor: 'border-indigo-200',
                    badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
                    badgeLabel: 'Todos Respondem'
                };
            case 'group_correct':
                return {
                    icon: Trophy,
                    bgColor: 'bg-purple-50',
                    textColor: 'text-purple-600',
                    borderColor: 'border-purple-200',
                    badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
                    badgeLabel: 'Equipe Acertou'
                };
            case 'group_incorrect':
                return {
                    icon: XCircle,
                    bgColor: 'bg-rose-50',
                    textColor: 'text-rose-600',
                    borderColor: 'border-rose-200',
                    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
                    badgeLabel: 'Equipe Errou'
                };
            case 'point_merit':
            case 'group_point_merit':
                return {
                    icon: Star,
                    bgColor: 'bg-amber-50',
                    textColor: 'text-amber-600',
                    borderColor: 'border-amber-200',
                    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
                    badgeLabel: 'Mérito (+1)'
                };
            case 'point_penalty':
            case 'group_point_penalty':
                return {
                    icon: AlertTriangle,
                    bgColor: 'bg-orange-50',
                    textColor: 'text-orange-600',
                    borderColor: 'border-orange-200',
                    badgeClass: 'bg-orange-50 text-orange-700 border-orange-200',
                    badgeLabel: 'Infração (-1)'
                };
            case 'student_removed':
                return {
                    icon: UserMinus,
                    bgColor: 'bg-slate-100',
                    textColor: 'text-slate-600',
                    borderColor: 'border-slate-200',
                    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
                    badgeLabel: 'Tirou da Roleta'
                };
            case 'student_reactivated':
            case 'activate_all':
                return {
                    icon: UserCheck,
                    bgColor: 'bg-emerald-50',
                    textColor: 'text-emerald-600',
                    borderColor: 'border-emerald-200',
                    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                    badgeLabel: 'Recolocou na Roleta'
                };
            case 'deactivate_all':
                return {
                    icon: UserMinus,
                    bgColor: 'bg-slate-100',
                    textColor: 'text-slate-600',
                    borderColor: 'border-slate-200',
                    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
                    badgeLabel: 'Tirou Todos'
                };
            case 'manual_select_student':
            case 'manual_select_group':
                return {
                    icon: Target,
                    bgColor: 'bg-blue-50',
                    textColor: 'text-blue-600',
                    borderColor: 'border-blue-200',
                    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
                    badgeLabel: 'Seleção Manual'
                };
            case 'bomb_exploded':
                return {
                    icon: Flame,
                    bgColor: 'bg-red-50',
                    textColor: 'text-red-600',
                    borderColor: 'border-red-200',
                    badgeClass: 'bg-red-50 text-red-700 border-red-200',
                    badgeLabel: 'Bomba Explodiu'
                };
            case 'reveal_answer':
                return {
                    icon: Eye,
                    bgColor: 'bg-teal-50',
                    textColor: 'text-teal-600',
                    borderColor: 'border-teal-200',
                    badgeClass: 'bg-teal-50 text-teal-700 border-teal-200',
                    badgeLabel: 'Resposta Revelada'
                };
            case 'reveal_hint':
                return {
                    icon: Search,
                    bgColor: 'bg-amber-50',
                    textColor: 'text-amber-600',
                    borderColor: 'border-amber-200',
                    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
                    badgeLabel: 'Pista Revelada'
                };
            case 'mode_change':
                return {
                    icon: Layers,
                    bgColor: 'bg-purple-50',
                    textColor: 'text-purple-600',
                    borderColor: 'border-purple-200',
                    badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
                    badgeLabel: 'Modo Alterado'
                };
            default:
                return {
                    icon: Clock,
                    bgColor: 'bg-slate-50',
                    textColor: 'text-slate-600',
                    borderColor: 'border-slate-200',
                    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
                    badgeLabel: 'Ação'
                };
        }
    };

    const displayedActionLogs = useMemo(() => {
        const logs = filteredData.actionLogs || [];
        return logs.filter(log => {
            // Categoria
            if (actionCategoryFilter === 'swaps') {
                if (log.type !== 'swap_student' && log.type !== 'swap_question') return false;
            } else if (actionCategoryFilter === 'spins') {
                if (log.type !== 'spin' && log.type !== 'spin_again') return false;
            } else if (actionCategoryFilter === 'roster') {
                if (log.type !== 'absent' && log.type !== 'student_removed' && log.type !== 'student_reactivated' && log.type !== 'activate_all' && log.type !== 'deactivate_all') return false;
            } else if (actionCategoryFilter === 'eval') {
                if (!log.type.startsWith('eval') && !log.type.startsWith('group') && !log.type.includes('point')) return false;
            }

            // Busca textual
            if (actionSearchTerm.trim()) {
                const term = actionSearchTerm.toLowerCase();
                const matchesText = 
                    (log.title && log.title.toLowerCase().includes(term)) ||
                    (log.description && log.description.toLowerCase().includes(term)) ||
                    (log.studentName && log.studentName.toLowerCase().includes(term)) ||
                    (log.previousStudentName && log.previousStudentName.toLowerCase().includes(term)) ||
                    (log.question && log.question.toLowerCase().includes(term)) ||
                    (log.previousQuestion && log.previousQuestion.toLowerCase().includes(term)) ||
                    (log.groupName && log.groupName.toLowerCase().includes(term));
                if (!matchesText) return false;
            }

            return true;
        });
    }, [filteredData.actionLogs, actionCategoryFilter, actionSearchTerm]);

    if (!isOpen) return null;

    const { metrics, questionStats, studentStats, groupStats } = filteredData;

    return (
        <>
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
                        onClick={() => setActiveTab('actions')}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                            activeTab === 'actions'
                                ? 'bg-indigo-600 text-white shadow-xs'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                    >
                        <Clock className="w-4 h-4 text-amber-300" />
                        <span>Toques & Ações na Tela ({(filteredData.actionLogs || []).length})</span>
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

                        {/* Banner de Ações e Intervenções do Professor */}
                        <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                            <div className="space-y-1">
                                <span className="text-2xs font-black uppercase tracking-widest text-amber-300 flex items-center gap-1.5">
                                    <Clock className="w-3.5 h-3.5" />
                                    <span>Toques & Intervenções do Professor na Roleta</span>
                                </span>
                                <p className="text-xs text-slate-200 leading-relaxed">
                                    Nesta sessão foram registrados <strong>{metrics.totalActions || 0} toques/ações na tela</strong>: <strong>{metrics.studentSwapsCount || 0} trocas de aluno</strong>, <strong>{metrics.questionSwapsCount || 0} trocas de pergunta</strong>, <strong>{metrics.spinAgainCount || 0} acionamento(s) de "Rode Outra Vez"</strong> e <strong>{metrics.absentCount || 0} ausência(s)</strong>.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setActiveTab('actions')}
                                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1 border border-white/10 active:scale-95"
                            >
                                <span>Ver Linha do Tempo</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                            </button>
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

                        {/* Painel de Insights Pedagógicos com IA (Coletivo e Individual) */}
                        <div className="bg-gradient-to-br from-indigo-950 via-slate-950 to-purple-950 border border-indigo-500/30 rounded-3xl p-5 text-white shadow-md relative overflow-hidden">
                            
                            {/* Cabeçalho do Card com Seletor Coletivo / Individual */}
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4 pb-3 border-b border-white/10">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shrink-0">
                                        <Bot className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <h4 className="font-black text-sm text-indigo-200 flex items-center gap-1.5">
                                            <span>Insights Pedagógicos com IA</span>
                                            <span className="text-[10px] bg-indigo-500/30 border border-indigo-400/40 text-indigo-300 px-1.5 py-0.2 rounded-md font-mono">
                                                Gemini
                                            </span>
                                        </h4>
                                        <p className="text-2xs text-slate-400">
                                            {aiActiveMode === 'collective' 
                                                ? 'Visão macro da turma, rede de solidariedade e planejamento da próxima aula'
                                                : 'Mapeamento formativo individualizado dos estudantes da turma'}
                                        </p>
                                    </div>
                                </div>

                                {/* Toggle Coletivo vs Individual */}
                                <div className="inline-flex items-center gap-1 bg-white/10 p-1 rounded-xl border border-white/10 self-start md:self-auto">
                                    <button
                                        type="button"
                                        onClick={() => setAiActiveMode('collective')}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                                            aiActiveMode === 'collective'
                                                ? 'bg-indigo-600 text-white shadow-xs'
                                                : 'text-slate-300 hover:text-white hover:bg-white/10'
                                        }`}
                                    >
                                        <Users className="w-3.5 h-3.5 text-amber-300" />
                                        <span>🌐 Coletivo (Turma)</span>
                                        {aiCollectiveSummary && <Check className="w-3 h-3 text-emerald-400" />}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setAiActiveMode('individual')}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                                            aiActiveMode === 'individual'
                                                ? 'bg-indigo-600 text-white shadow-xs'
                                                : 'text-slate-300 hover:text-white hover:bg-white/10'
                                        }`}
                                    >
                                        <User className="w-3.5 h-3.5 text-purple-300" />
                                        <span>👥 Individual (Perfis)</span>
                                        {aiIndividualSummary && <Check className="w-3 h-3 text-emerald-400" />}
                                    </button>
                                </div>
                            </div>

                            {/* Alerta de erro da IA se houver */}
                            {aiError && (
                                <div className="bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs p-3 rounded-xl mb-3">
                                    {aiError}
                                </div>
                            )}

                            {/* VISÃO 1: SÍNTESE COLETIVA DA TURMA */}
                            {aiActiveMode === 'collective' && (
                                <div className="space-y-3 animate-in fade-in duration-150">
                                    <div className="flex items-center justify-between gap-2 flex-wrap">
                                        <div>
                                            <h5 className="font-bold text-xs text-indigo-200 flex items-center gap-1">
                                                <Users className="w-3.5 h-3.5 text-indigo-400" />
                                                <span>Síntese Pedagógica Coletiva da Turma</span>
                                            </h5>
                                            <p className="text-[11px] text-slate-400">
                                                Parecer reflexivo pronto para colar no Diário de Classe ou enviar à Coordenação
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {aiCollectiveSummary && (
                                                <button
                                                    type="button"
                                                    onClick={handleCopyCollectiveAi}
                                                    className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border border-white/20"
                                                    title="Copiar parecer coletivo"
                                                >
                                                    {copiedCollectiveAi ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                                    <span>{copiedCollectiveAi ? 'Copiado!' : 'Copiar Texto'}</span>
                                                </button>
                                            )}

                                            <button
                                                type="button"
                                                disabled={isGeneratingCollectiveAi}
                                                onClick={handleGenerateCollectiveAi}
                                                className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white text-xs font-black transition-all cursor-pointer flex items-center gap-2 shadow-sm disabled:opacity-50 active:scale-95"
                                            >
                                                <Sparkles className={`w-4 h-4 text-amber-300 ${isGeneratingCollectiveAi ? 'animate-spin' : ''}`} />
                                                <span>{isGeneratingCollectiveAi ? 'Analisando a Turma...' : aiCollectiveSummary ? 'Regerar Síntese Coletiva' : '✨ Gerar Síntese Coletiva'}</span>
                                            </button>
                                        </div>
                                    </div>

                                    {aiCollectiveSummary ? (
                                        <div className="bg-white/5 border border-white/10 p-4 rounded-2xl text-xs text-slate-200 leading-relaxed font-sans whitespace-pre-wrap animate-in fade-in">
                                            {aiCollectiveSummary}
                                        </div>
                                    ) : (
                                        <div className="bg-white/5 border border-dashed border-white/10 p-4 rounded-2xl text-xs text-slate-400 text-center">
                                            Clique em <strong>"✨ Gerar Síntese Coletiva"</strong> para que a IA sintetize a taxa de acertos, a rede de solidariedade entre alunos e as diretrizes didáticas para a próxima aula.
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* VISÃO 2: DIAGNÓSTICO INDIVIDUAL CONSOLIDADO */}
                            {aiActiveMode === 'individual' && (
                                <div className="space-y-3 animate-in fade-in duration-150">
                                    <div className="flex items-center justify-between gap-2 flex-wrap">
                                        <div>
                                            <h5 className="font-bold text-xs text-purple-200 flex items-center gap-1">
                                                <User className="w-3.5 h-3.5 text-purple-400" />
                                                <span>Diagnóstico Individual Consolidado dos Alunos</span>
                                            </h5>
                                            <p className="text-[11px] text-slate-400">
                                                Agrupamento da turma em perfis pedagógicos: destaques, monitores solidários, apoio prioritário e inclusão
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {aiIndividualSummary && (
                                                <button
                                                    type="button"
                                                    onClick={handleCopyIndividualAi}
                                                    className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border border-white/20"
                                                    title="Copiar diagnóstico individual consolidado"
                                                >
                                                    {copiedIndividualAi ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                                    <span>{copiedIndividualAi ? 'Copiado!' : 'Copiar Diagnóstico'}</span>
                                                </button>
                                            )}

                                            <button
                                                type="button"
                                                disabled={isGeneratingIndividualAi}
                                                onClick={handleGenerateIndividualAi}
                                                className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white text-xs font-black transition-all cursor-pointer flex items-center gap-2 shadow-sm disabled:opacity-50 active:scale-95"
                                            >
                                                <Sparkles className={`w-4 h-4 text-amber-300 ${isGeneratingIndividualAi ? 'animate-spin' : ''}`} />
                                                <span>{isGeneratingIndividualAi ? 'Mapeando Alunos...' : aiIndividualSummary ? 'Regerar Diagnóstico' : '✨ Gerar Diagnóstico Individual'}</span>
                                            </button>
                                        </div>
                                    </div>

                                    {aiIndividualSummary ? (
                                        <div className="bg-white/5 border border-white/10 p-4 rounded-2xl text-xs text-slate-200 leading-relaxed font-sans whitespace-pre-wrap animate-in fade-in">
                                            {aiIndividualSummary}
                                        </div>
                                    ) : (
                                        <div className="bg-white/5 border border-dashed border-white/10 p-4 rounded-2xl text-xs text-slate-400 text-center">
                                            Clique em <strong>"✨ Gerar Diagnóstico Individual"</strong> para que a IA analise aluno por aluno e aponte quem teve alto domínio, quem atuou como monitor solidário e quem demanda reforço imediato.
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ABA 2: REGISTRO DE TOQUES & AÇÕES NA TELA (TIMELINE) */}
                {activeTab === 'actions' && (
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

        {/* Modal de Parecer Individual com IA de um Aluno Específico */}
        {selectedStudentForAi && (
            <Modal
                isOpen={!!selectedStudentForAi}
                onClose={() => setSelectedStudentForAi(null)}
                title={`Parecer Individual com IA: ${selectedStudentForAi.name}`}
                icon={Bot}
                size="lg"
            >
                <div className="space-y-4 select-none animate-in fade-in duration-150">
                    {/* 1. Header do Aluno */}
                    <div className="bg-gradient-to-r from-indigo-50/80 via-purple-50/50 to-slate-50 border border-indigo-100 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-black text-slate-900 text-base">
                                    {selectedStudentForAi.name}
                                </span>
                                {selectedStudentForAi.groupName && (
                                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white border border-indigo-200 text-indigo-700 shadow-2xs">
                                        👥 {selectedStudentForAi.groupName}
                                    </span>
                                )}
                                <span className="text-2xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                                    {selectedStudentForAi.participated ? `Participou (${selectedStudentForAi.totalAnswers} rodadas)` : 'Não sorteado no período'}
                                </span>
                            </div>
                            <div className="text-xs text-slate-500 font-medium mt-1">
                                Turma: <strong>{currentClass?.name || 'Turma'}</strong> • Conteúdo: <strong>{activeActivity?.topic || activeActivity?.title || 'Conteúdo Curricular'}</strong>
                            </div>
                        </div>

                        {/* Ações: Gerar/Regerar, Copiar e Imprimir */}
                        <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
                            {studentAiInsights[selectedStudentForAi.id] && (
                                <>
                                    <button
                                        type="button"
                                        onClick={handleCopySelectedStudentAi}
                                        className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold transition-all shadow-2xs cursor-pointer flex items-center gap-1.5"
                                        title="Copiar parecer deste aluno"
                                    >
                                        {copiedStudentAi ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-indigo-600" />}
                                        <span>{copiedStudentAi ? 'Copiado!' : 'Copiar'}</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => handlePrintStudentReport(selectedStudentForAi)}
                                        className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                                        title="Imprimir ficha pedagógica individual deste aluno"
                                    >
                                        <Printer className="w-3.5 h-3.5 text-amber-300" />
                                        <span>Imprimir Ficha</span>
                                    </button>
                                </>
                            )}

                            <button
                                type="button"
                                disabled={generatingStudentId === selectedStudentForAi.id}
                                onClick={() => handleGenerateStudentAi(selectedStudentForAi)}
                                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs disabled:opacity-50 active:scale-95"
                            >
                                <Sparkles className={`w-3.5 h-3.5 text-amber-300 ${generatingStudentId === selectedStudentForAi.id ? 'animate-spin' : ''}`} />
                                <span>
                                    {generatingStudentId === selectedStudentForAi.id 
                                        ? 'Gerando Parecer...' 
                                        : studentAiInsights[selectedStudentForAi.id] 
                                            ? 'Regerar com IA' 
                                            : '✨ Gerar Parecer com IA'}
                                </span>
                            </button>
                        </div>
                    </div>

                    {/* 2. Mini KPIs do Aluno */}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
                        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5">
                            <span className="font-black text-lg text-emerald-700 block">{selectedStudentForAi.hits}</span>
                            <span className="text-2xs font-bold text-emerald-800 uppercase">Acertos</span>
                        </div>
                        <div className="bg-rose-50 border border-rose-200 rounded-xl p-2.5">
                            <span className="font-black text-lg text-rose-700 block">{selectedStudentForAi.misses}</span>
                            <span className="text-2xs font-bold text-rose-800 uppercase">Erros</span>
                        </div>
                        <div className="bg-sky-50 border border-sky-200 rounded-xl p-2.5">
                            <span className="font-black text-lg text-sky-700 block">{selectedStudentForAi.helpReceived ? selectedStudentForAi.helpReceived.length : 0}</span>
                            <span className="text-2xs font-bold text-sky-800 uppercase">Teve Ajuda</span>
                        </div>
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5">
                            <span className="font-black text-lg text-amber-700 block">{selectedStudentForAi.helpedOthers ? selectedStudentForAi.helpedOthers.length : 0}</span>
                            <span className="text-2xs font-bold text-amber-800 uppercase">Ajudou Colegas</span>
                        </div>
                        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-2.5">
                            <span className="font-black text-lg text-indigo-700 block">+{selectedStudentForAi.merits || 0}</span>
                            <span className="text-2xs font-bold text-indigo-800 uppercase">Méritos</span>
                        </div>
                    </div>

                    {/* 3. Bloco do Parecer Pedagógico da IA */}
                    <div className="bg-gradient-to-br from-indigo-950 via-slate-950 to-purple-950 border border-indigo-500/30 rounded-2xl p-4 text-white shadow-xs">
                        <div className="flex items-center justify-between gap-2 mb-2">
                            <span className="text-xs font-bold text-indigo-200 flex items-center gap-1.5">
                                <Bot className="w-4 h-4 text-indigo-300" />
                                <span>Parecer Descritivo do Estudante (Formato Diário de Classe)</span>
                            </span>
                            <span className="text-[10px] bg-indigo-500/30 border border-indigo-400/40 text-indigo-300 px-1.5 py-0.2 rounded-md font-mono">
                                Gemini
                            </span>
                        </div>

                        {studentAiInsights[selectedStudentForAi.id] ? (
                            <div className="bg-white/5 border border-white/10 p-3.5 rounded-xl text-xs text-slate-200 leading-relaxed font-sans whitespace-pre-wrap animate-in fade-in">
                                {studentAiInsights[selectedStudentForAi.id]}
                            </div>
                        ) : (
                            <div className="bg-white/5 border border-dashed border-white/10 p-4 rounded-xl text-xs text-slate-400 text-center">
                                Nenhum parecer gerado para <strong>{selectedStudentForAi.name}</strong> ainda.<br />
                                Clique no botão <strong>"✨ Gerar Parecer com IA"</strong> acima para criar uma avaliação personalizada.
                            </div>
                        )}
                    </div>

                    {/* 4. Perguntas Respondidas pelo Aluno */}
                    {(selectedStudentForAi.history || []).length > 0 && (
                        <div className="border border-slate-200 rounded-2xl p-3 bg-slate-50 space-y-2">
                            <h5 className="text-xs font-bold text-slate-700 flex items-center gap-1">
                                <HelpCircle className="w-3.5 h-3.5 text-indigo-600" />
                                <span>Perguntas Respondidas nesta Sessão ({(selectedStudentForAi.history || []).length})</span>
                            </h5>
                            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1 custom-scrollbar">
                                {(selectedStudentForAi.history || []).map((h, hi) => (
                                    <div key={hi} className="bg-white border border-slate-200 rounded-xl p-2 text-xs flex items-center justify-between gap-2 shadow-2xs">
                                        <div className="min-w-0 flex-1">
                                            <div className="font-semibold text-slate-800 truncate">{h.question}</div>
                                            <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                                                <span>{new Date(h.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                {h.hadHelp && <span className="text-sky-600 font-bold">🤝 Teve Ajuda</span>}
                                                {h.helpedStudent && <span className="text-emerald-600 font-bold">🌟 Ajudou {h.helpedStudent}</span>}
                                            </div>
                                        </div>
                                        <span className={`text-2xs font-bold px-2 py-0.5 rounded-full shrink-0 ${
                                            h.result === 'correct' || h.result === 'help_correct' || h.result === 'group_activity'
                                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                                : h.result === 'merit'
                                                    ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                                    : 'bg-rose-100 text-rose-800 border border-rose-200'
                                        }`}>
                                            {h.result === 'correct' || h.result === 'help_correct' ? '✅ Acertou' : h.result === 'merit' ? '⭐ Mérito' : '❌ Errou'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </Modal>
        )}
    </>
    );
};
