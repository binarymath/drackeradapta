import React, { useState, useMemo } from 'react';
import { useReportMetrics } from './hooks/useReportMetrics';
import { ReportTabActions } from './report-tabs/ReportTabActions';
import { ReportTabQuestions } from './report-tabs/ReportTabQuestions';
import { ReportTabStudents } from './report-tabs/ReportTabStudents';
import { ReportTabGroups } from './report-tabs/ReportTabGroups';
import { 
    CheckCircle, XCircle, HeartHandshake, Award, Users, User, 
    BarChart3, HelpCircle, Sparkles, AlertTriangle, Printer, Download, 
    Copy, Check, Filter, Calendar, Clock, Trophy, Target, ArrowRight, 
    BookOpen, Star, FileText, Bot, Layers, Info,
    Shuffle, RotateCcw, RotateCw, Search, Flame, Eye, EyeOff, UserMinus, UserCheck, UserX,
    ChevronDown, ChevronUp, List, Tag
} from 'lucide-react';
import { Modal } from '../ui/Modal';

import { MarkdownText } from '../ui/MarkdownText';

export const ClassSessionReportModal = ({
    isOpen,
    onClose,
    currentClass,
    currentGroups = [],
    activeActivity = null,
    tabs = [],
    questions = [],
    currentSessionId = null,
    sessionStartTime = null,
    geminiService = null,
    selectedModel = 'gemini-2.5-flash',
    interactionLogs = [],
    onToggleStudentAbsent = null
}) => {
    // Escopo temporal do relatório: 'all' (todo o histórico) — filtros 'session' e 'today' removidos pois o foco é o entendimento dos alunos nas atividades
    const [periodFilter, setPeriodFilter] = useState('all');
    // Aba ativa: 'overview' | 'actions' | 'questions' | 'students' | 'groups'
    const [activeTab, setActiveTab] = useState('overview');

    // Data de referência para controle de ausências e frequência (formato YYYY-MM-DD)
    const todayIsoDate = useMemo(() => new Date().toISOString().slice(0, 10), []);
    const [selectedDate, setSelectedDate] = useState(() => {
        if (sessionStartTime) {
            try {
                return new Date(sessionStartTime).toISOString().slice(0, 10);
            } catch (e) {}
        }
        return new Date().toISOString().slice(0, 10);
    });

    // Descoberta dinâmica de todas as atividades disponíveis para análise
    const availableActivities = useMemo(() => {
        const map = new Map();

        // 1. Atividade ativa atual ou atividade padrão da sessão
        if (activeActivity) {
            const id = String(activeActivity.id || 'current_activity');
            const actTitle = activeActivity.title || activeActivity.topic || 'Atividade Atual';
            const qCount = (activeActivity.questions || []).length || (questions || []).length;
            map.set(id, {
                id,
                title: actTitle,
                topic: activeActivity.topic || activeActivity.title || '',
                type: activeActivity.type || 'roulette',
                isCurrent: true,
                questionCount: qCount,
                source: 'Atividade Atual'
            });
        } else if (questions && questions.length > 0) {
            const id = 'current_activity';
            map.set(id, {
                id,
                title: 'Atividade da Roleta',
                topic: 'Conteúdo da Roleta',
                type: 'roulette',
                isCurrent: true,
                questionCount: questions.length,
                source: 'Atividade Atual'
            });
        }

        // 2. Abas do ambiente de trabalho (tabs)
        (tabs || []).forEach(tab => {
            if (!tab || tab.id === 'about_system' || tab.id === 'dashboard' || tab.id === 'merge_pdf') return;
            const id = String(tab.id);
            if (!map.has(id)) {
                const qCount = (tab.questions || tab.data?.questions || []).length;
                map.set(id, {
                    id,
                    title: tab.title || tab.topic || `Atividade #${id}`,
                    topic: tab.topic || tab.title || '',
                    type: tab.type || 'roulette',
                    isCurrent: activeActivity && String(activeActivity.id) === id,
                    questionCount: qCount,
                    source: 'Aba Aberta'
                });
            }
        });

        // 3. Tópicos históricos registrados nos alunos da turma
        (currentClass?.students || []).forEach(s => {
            (s.history || []).forEach(h => {
                if (h.topic && h.topic !== 'Sem tema') {
                    const cleanTopic = h.topic.trim();
                    const existing = Array.from(map.values()).find(
                        a => (a.topic && a.topic.toLowerCase() === cleanTopic.toLowerCase()) || 
                             (a.title && a.title.toLowerCase() === cleanTopic.toLowerCase())
                    );
                    if (!existing) {
                        const topicId = `topic_${cleanTopic.toLowerCase().replace(/[^a-z0-9]/gi, '_')}`;
                        if (!map.has(topicId)) {
                            map.set(topicId, {
                                id: topicId,
                                title: cleanTopic,
                                topic: cleanTopic,
                                type: 'history',
                                isFromHistory: true,
                                questionCount: 0,
                                source: 'Histórico'
                            });
                        }
                    }
                }
            });
        });

        // 4. Fallback: Se nenhuma atividade for mapeada, cria a atividade ativa padrão da sessão
        if (map.size === 0) {
            const id = 'current_activity';
            map.set(id, {
                id,
                title: activeActivity?.title || activeActivity?.topic || 'Atividade da Roleta',
                topic: activeActivity?.topic || 'Conteúdo da Roleta',
                type: 'roulette',
                isCurrent: true,
                questionCount: (questions || []).length,
                source: 'Atividade Atual'
            });
        }

        return Array.from(map.values());
    }, [activeActivity, tabs, currentClass, questions]);

    // IDs de atividades selecionadas para análise conjunta ([] vazio = todas selecionadas)
    const [selectedActivityIds, setSelectedActivityIds] = useState([]);

    // Modo de visualização de atividades analisadas: 'list' (estruturada) | 'tags' (pílulas compactas)
    const [activityViewMode, setActivityViewMode] = useState('list');
    // Estado de recolhimento para liberar espaço para KPIs
    const [isActivitySelectorCollapsed, setIsActivitySelectorCollapsed] = useState(false);
    // Busca de atividades quando houver muitas opções
    const [activitySearchTerm, setActivitySearchTerm] = useState('');

    const effectiveSelectedActivityIds = useMemo(() => {
        if (selectedActivityIds.length === 0) {
            return availableActivities.map(a => a.id);
        }
        return selectedActivityIds;
    }, [selectedActivityIds, availableActivities]);

    const toggleActivitySelection = (id) => {
        setSelectedActivityIds(prev => {
            const allIds = availableActivities.map(a => a.id);
            const currentSelection = prev.length === 0 ? allIds : prev;
            if (currentSelection.includes(id)) {
                const next = currentSelection.filter(item => item !== id);
                return next.length === 0 ? [id] : next;
            } else {
                const next = [...currentSelection, id];
                return next.length === allIds.length ? [] : next;
            }
        });
    };

    const selectAllActivities = () => {
        setSelectedActivityIds([]);
    };

    const selectCurrentActivityOnly = () => {
        if (activeActivity) {
            setSelectedActivityIds([String(activeActivity.id || 'current_activity')]);
        }
    };

    // Agregar questões de todas as atividades selecionadas
    const aggregatedQuestions = useMemo(() => {
        const list = [...(questions || [])];
        const seen = new Set(list.map(q => (q.question || q.text || '').trim().toLowerCase()));

        (tabs || []).forEach(tab => {
            const tabId = String(tab.id);
            if (!effectiveSelectedActivityIds.includes(tabId)) return;
            const tabQuestions = tab.questions || tab.data?.questions || [];
            tabQuestions.forEach(q => {
                const txt = (q.question || q.text || '').trim();
                if (txt && !seen.has(txt.toLowerCase())) {
                    seen.add(txt.toLowerCase());
                    list.push(q);
                }
            });
        });

        return list;
    }, [questions, tabs, effectiveSelectedActivityIds]);

    // Filtros da aba de ações e toques
    const [actionCategoryFilter, setActionCategoryFilter] = useState('all');
    const [actionSearchTerm, setActionSearchTerm] = useState('');

    // Estado da Síntese Pedagógica Coletiva com IA
    const [aiCollectiveSummary, setAiCollectiveSummary] = useState('');
    const [isGeneratingCollectiveAi, setIsGeneratingCollectiveAi] = useState(false);
    const [copiedCollectiveAi, setCopiedCollectiveAi] = useState(false);

    // Modo da IA ativo no card da Visão Geral: 'collective' | 'individual'
    const [aiActiveMode, setAiActiveMode] = useState('collective');

    // Filtros e busca no Diretório Visual de Alunos em "Individual (Perfis)"
    const [studentProfileFilter, setStudentProfileFilter] = useState('all'); // 'all' | 'high' | 'helpers' | 'support' | 'not_drawn' | 'absent'
    const [studentSearchQuery, setStudentSearchQuery] = useState('');

    // Sobrescrita local imediata para alternância de presença por data (0ms de latência visual)
    const [localAbsentOverrides, setLocalAbsentOverrides] = useState({});

    // Verifica se um aluno está ausente em uma data específica (YYYY-MM-DD)
    const isStudentAbsentOnDate = (s, dateStr) => {
        const overrideKey = `${s.id}_${dateStr}`;
        if (localAbsentOverrides[overrideKey] !== undefined) {
            return localAbsentOverrides[overrideKey];
        }
        const hasAbsentRecord = (s.history || []).some(h => {
            if (h.result !== 'absent') return false;
            if (h.dateStr && h.dateStr === dateStr) return true;
            if (h.date) {
                try {
                    return new Date(h.date).toISOString().slice(0, 10) === dateStr;
                } catch (e) {
                    return false;
                }
            }
            return false;
        });
        if (hasAbsentRecord) return true;
        if (dateStr === todayIsoDate && s.status === 'absent') return true;
        return false;
    };

    // Alternar ausência de aluno para a DATA SELECIONADA localmente e propagar para a Turma Global
    const handleToggleStudentAbsentStatus = (studentId, makeAbsent) => {
        const key = `${studentId}_${selectedDate}`;
        setLocalAbsentOverrides(prev => ({
            ...prev,
            [key]: makeAbsent
        }));
        if (onToggleStudentAbsent) {
            onToggleStudentAbsent(studentId, makeAbsent, selectedDate);
        }
    };

    // Estado de Pareceres Individuais por Aluno (dicionário { [studentId]: string })
    const [studentAiInsights, setStudentAiInsights] = useState({});
    const [generatingStudentId, setGeneratingStudentId] = useState(null);
    const [selectedStudentForAi, setSelectedStudentForAi] = useState(null);
    const [copiedStudentAi, setCopiedStudentAi] = useState(false);

    // Erros gerais da IA
    const [aiError, setAiError] = useState(null);

    // -------------------------------------------------------------------------
    // 1. FILTRAGEM DOS DADOS PELO PERÍODO ESCOLHIDO E ATIVIDADES SELECIONADAS
    // -------------------------------------------------------------------------

    const { filteredData, categorizedCohorts, filteredStudentsList, algorithmicInsights } = useReportMetrics({
        currentClass, currentGroups, aggregatedQuestions, periodFilter, currentSessionId, sessionStartTime, interactionLogs, localAbsentOverrides, selectedDate, effectiveSelectedActivityIds, availableActivities, todayIsoDate, isStudentAbsentOnDate, studentProfileFilter, studentSearchQuery
    });


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

        // Monta a lista de atividades/temas selecionados para o prompt coletivo
        const selectedActivitiesForPrompt = availableActivities
            .filter(a => effectiveSelectedActivityIds.includes(a.id))
            .map((a, idx) => `  ${idx + 1}. "${a.title || a.topic || 'Atividade'}"${a.topic && a.topic !== a.title ? ` (tema: ${a.topic})` : ''}`)
            .join('\n') || `  1. "${activeActivity?.topic || activeActivity?.title || 'Conteúdo Curricular'}"`;
        const activitiesCountLabel = effectiveSelectedActivityIds.length === availableActivities.length
            ? `todas as ${availableActivities.length}`
            : `${effectiveSelectedActivityIds.length} de ${availableActivities.length}`;

        const prompt = `
Você é um consultor pedagógico e professor especialista em metodologias ativas e gamificação na educação básica.
Escreva a Síntese Pedagógica Coletiva da Aula em formato profissional, usando **Markdown** (## para títulos de seção, **negrito** para destaques, listas com - para tópicos). Máximo 3 seções bem estruturadas.

DADOS GERAIS DA TURMA E DA AULA:
- Turma: "${currentClass?.name || 'Turma'}"
- Atividades/Temas Trabalhados (${activitiesCountLabel} selecionada(s) para análise):
${selectedActivitiesForPrompt}
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

ESTRUTURA DA SÍNTESE COLETIVA (use ## para cada seção):
## Aproveitamento & Clima Geral
Resuma o nível geral de absorção dos conteúdos/temas trabalhados pela turma, se a dinâmica foi mais individual ou em grupo, e o ritmo de engajamento dos estudantes. Mencione os temas/atividades trabalhados.
## Cooperação & Mediação Docente
Avalie a solidariedade entre os alunos (como a rede de ajuda funcionou) e destaque o papel mediador do professor.
## Diretrizes para a Próxima Aula
Forneça recomendações práticas e acionáveis (liste com - ) para o próximo plano de aula, indicando quais conceitos retomar por atividade.
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

    // 3.2 Parecer Individual por Aluno Específico (Tratado diretamente no card de cada aluno)
    const handleGenerateStudentAi = async (student) => {
        if (!geminiService || !geminiService.apiKey) {
            setAiError('Chave da API Gemini não configurada. Por favor, adicione sua chave nas configurações.');
            return;
        }

        setGeneratingStudentId(student.id);
        setAiError(null);

        const studentData = filteredData.studentStats.find(s => s.id === student.id) || student;
        const hist = studentData.history || [];

        // Separa respostas individuais de participações via Desafio da Turma (all_correct)
        const individualAnswers = hist.filter(h =>
            h.result === 'correct' || h.result === 'incorrect' ||
            h.result === 'help_correct' || h.result === 'merit' || h.result === 'rule_violation'
        );
        const classChallengeCredits = hist.filter(h =>
            h.result === 'all_correct' ||
            (h.question && h.question.includes('[Desafio da Turma]'))
        );
        const groupActivityCredits = hist.filter(h =>
            h.result === 'group_activity' || h.result === 'group_incorrect' ||
            h.isGroupActivity
        );
        const hasNoIndividualAnswers = individualAnswers.length === 0;

        // Monta lista de todas as atividades/temas selecionados para o contexto do parecer
        const selectedActivitiesForStudentPrompt = availableActivities
            .filter(a => effectiveSelectedActivityIds.includes(a.id))
            .map((a, idx) => `  ${idx + 1}. "${a.title || a.topic || 'Atividade'}"${a.topic && a.topic !== a.title ? ` (tema: ${a.topic})` : ''}`)
            .join('\n') || `  1. "${activeActivity?.topic || activeActivity?.title || 'Conteúdo Curricular'}"`;
        const activitiesCountLabelStudent = effectiveSelectedActivityIds.length === availableActivities.length
            ? `todas as ${availableActivities.length} atividades`
            : `${effectiveSelectedActivityIds.length} atividade(s) selecionada(s)`;

        const formatResult = (result) => {
            const map = { correct: 'Acerto Individual ✅', incorrect: 'Erro Individual ❌',
                help_correct: 'Acerto com Ajuda 🤝', merit: 'Mérito concedido ⭐',
                rule_violation: 'Infração de regra ⚠️', all_correct: 'Crédito Desafio da Turma 🏆 (acerto coletivo — NÃO individual)',
                group_activity: 'Atividade em Grupo 👥', group_incorrect: 'Erro em Grupo 👥❌' };
            return map[result] || result;
        };

        const prompt = `
Você é um consultor pedagógico e especialista em avaliação formativa para o Ensino Fundamental e Médio.
Escreva um Parecer Pedagógico Individual Descritivo usando **Markdown** (## para títulos de seção, **negrito** para destaques, listas com - para recomendações). 3 seções objetivas.

⚠️ ATENÇÃO IMPORTANTE — DISTINÇÃO ENTRE PARTICIPAÇÃO INDIVIDUAL E DESAFIO DA TURMA:
- "Acerto Individual" = o aluno foi sorteado/chamado e respondeu corretamente por conta própria.
- "Crédito Desafio da Turma (all_correct)" = a turma inteira ganhou ponto porque a MAIORIA acertou um desafio coletivo. Isso NÃO significa que este aluno específico respondeu individualmente — ele apenas foi beneficiado pelo acerto coletivo. NÃO confunda com participação individual.
- Se o aluno NÃO tem nenhuma resposta individual, destaque explicitamente que ele não foi sorteado individualmente e que seus pontos vieram apenas de desafios coletivos.

DADOS DO ESTUDANTE:
- Aluno(a): "${studentData.name}"
- Turma: "${currentClass?.name || 'Turma'}"
- Atividades/Temas Trabalhados (${activitiesCountLabelStudent}):
${selectedActivitiesForStudentPrompt}
- Status na Aula: ${studentData.participated ? `Participou (${studentData.totalAnswers} registros)` : 'Não sorteado no período'}
- ⚠️ RESPONDEU INDIVIDUALMENTE: ${hasNoIndividualAnswers ? 'NÃO — nenhuma resposta individual registrada' : `SIM — ${individualAnswers.length} resposta(s) individual(is)`}
- Acertos Individuais: ${individualAnswers.filter(h => h.result === 'correct' || h.result === 'help_correct').length}
- Erros Individuais: ${individualAnswers.filter(h => h.result === 'incorrect').length}
- Créditos via Desafio da Turma (all_correct — coletivo, NÃO individual): ${classChallengeCredits.length}
- Participações em Atividades de Grupo: ${groupActivityCredits.length}
- Vezes em que Teve Ajuda (individual): ${studentData.helpReceived ? studentData.helpReceived.length : 0}
- Vezes em que Ajudou Colegas: ${studentData.helpedOthers ? studentData.helpedOthers.length : 0}
- Méritos Concedidos: +${studentData.merits || 0}

DETALHAMENTO DAS RESPOSTAS INDIVIDUAIS (sorteios diretos):
${individualAnswers.length > 0
    ? individualAnswers.map((h, i) => `  ${i + 1}. "${h.question}" | ${formatResult(h.result)} | Ajuda: ${h.hadHelp || h.helperName ? `Sim (${h.helperName || 'colega'})` : 'Não'}`).join('\n')
    : '  ⚠️ NENHUMA — este aluno não foi sorteado individualmente neste período.'}

CRÉDITOS VIA DESAFIO DA TURMA (all_correct — ponto coletivo, NÃO individual):
${classChallengeCredits.length > 0
    ? classChallengeCredits.map((h, i) => `  ${i + 1}. "${h.question}" — Turma acertou o desafio coletivo (aluno ganhou ponto junto com a turma)`).join('\n')
    : '  Nenhum crédito de desafio coletivo.'}

ESTRUTURA DO PARECER (use ## para cada seção):
## Domínio Conceitual & Participação
Avalie como o estudante lidou com os temas/atividades trabalhados. **Se ele não respondeu individualmente, destaque isso claramente e explique que seus pontos vieram de desafios coletivos, não de participação individual.** Se respondeu individualmente, avalie segurança e engajamento.
## Dimensão Socioemocional & Cooperação
Analise sua postura frente aos desafios, autonomia, e espírito coletivo. Se o aluno teve créditos apenas via Desafio da Turma, comente sobre a importância de buscar também a participação individual.
## Recomendação Pedagógica Personalizada
Indique direcionamentos práticos (liste com - ). Se o aluno não foi sorteado individualmente, **recomende estratégias específicas para garantir sua participação individual nas próximas aulas** (ex: priorizar nos próximos sorteios, propor atividade voluntária, etc.).
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
                <td style="padding: 6px 8px; text-align: center; color: ${h.result === 'correct' || h.result === 'help_correct' || h.result === 'all_correct' || h.result === 'group_activity' ? '#16a34a' : h.result === 'merit' ? '#d97706' : '#dc2626'}; font-weight: bold;">
                    ${h.result === 'correct' || h.result === 'help_correct' ? 'Acertou ✅' : h.result === 'all_correct' ? '🏆 Desafio da Turma' : h.result === 'group_activity' ? '👥 Grupo' : h.result === 'merit' ? '+1 Mérito ⭐' : 'Errou ❌'}
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
                    ${s.isAbsent ? '<span style="color: #dc2626; font-weight: bold;">🚫 Ausente</span>' : s.participated ? '<span style="color: #16a34a; font-weight: bold;">Participou</span>' : '<span style="color: #64748b;">Não sorteado</span>'}
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
                        <div class="kpi-label">Engajamento (${metrics.participatingStudents}/${metrics.presentStudents || metrics.totalStudents})${metrics.absentStudents > 0 ? ` • ${metrics.absentStudents} aus.` : ''}</div>
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
        csv += `Total de Alunos:,"${metrics.totalStudents} (${metrics.presentStudents || metrics.totalStudents} presentes / ${metrics.absentStudents || 0} ausentes)"\n`;
        csv += `Engajamento:,"${metrics.participationRate}%"\n\n`;

        csv += `--- ALUNOS DA TURMA ---\n`;
        csv += `Aluno,Equipe,Status na Aula,Acertos no Período,Erros no Período,Teve Ajuda (Qtd),Detalhes Ajuda Recebida,Ajudou Colegas (Qtd),Detalhes Ajuda Prestada,Pontos Mérito,Infrações Regra,Parecer IA Individual\n`;

        studentStats.forEach(s => {
            const helpRecStr = s.helpReceived.map(h => h.helperName ? `com ${h.helperName}` : (h.helpDescription || 'Apoio')).join('; ');
            const helpedStr = s.helpedOthers.map(h => `Ajudou ${h.helpedStudent || 'colega'}`).join('; ');
            const studentAi = (studentAiInsights[s.id] || '').replace(/"/g, '""');
            const statusStr = s.isAbsent ? 'Ausente' : s.participated ? 'Participou' : 'Não Sorteado';

            csv += `"${s.name}","${s.groupName || 'Sem Equipe'}","${statusStr}",${s.hits},${s.misses},${s.helpReceived.length},"${helpRecStr.replace(/"/g, '""')}",${s.helpedOthers.length},"${helpedStr.replace(/"/g, '""')}",${s.merits},${s.violations},"${studentAi}"\n`;
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
                {/* 1. TOPO: Metadados da Turma e Botões de Ação */}
                {/* ============================================================ */}
                <div className="bg-gradient-to-r from-indigo-50/90 via-purple-50/50 to-amber-50/50 border border-indigo-100 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                    <div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-black text-slate-900 text-base sm:text-lg">
                                {currentClass?.name || 'Turma Selecionada'}
                            </span>
                            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-white border border-indigo-200 text-indigo-700 shadow-2xs">
                                📊 Análise do Histórico de Atividades
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
                            <span>•</span>
                            <span
                                className="flex items-center gap-1 font-bold cursor-default"
                                title={availableActivities.filter(a => effectiveSelectedActivityIds.includes(a.id)).map(a => a.title || a.topic).join(' • ')}
                            >
                                <BookOpen className={`w-3.5 h-3.5 ${selectedActivityIds.length === 0 ? 'text-indigo-500' : 'text-purple-600'}`} />
                                <span className={selectedActivityIds.length === 0 ? 'text-indigo-600' : 'text-purple-700'}>
                                    {effectiveSelectedActivityIds.length === availableActivities.length
                                        ? `Todas (${availableActivities.length}) atividades selecionadas`
                                        : `${effectiveSelectedActivityIds.length} de ${availableActivities.length} atividades selecionadas`
                                    }
                                </span>
                            </span>
                        </div>
                    </div>

                    {/* Botões de Ação */}
                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
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
                {/* 1.1 SELETOR DE ATIVIDADES — Temas para análise da IA */}
                {/* ============================================================ */}
                {availableActivities.length > 0 && (
                    <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 shadow-2xs space-y-2.5 transition-all">
                        {/* Barra Superior do Seletor */}
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-2 flex-wrap">
                                <div className="w-6 h-6 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shadow-2xs">
                                    <Layers className="w-3.5 h-3.5" />
                                </div>
                                <span className="text-xs font-black text-slate-800">
                                    Atividades Analisadas Juntas:
                                </span>
                                <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200 shadow-2xs">
                                    {effectiveSelectedActivityIds.length} de {availableActivities.length} selecionada(s)
                                </span>
                            </div>

                            {/* Controles de Seleção e Alternador de Visão */}
                            <div className="flex items-center gap-1.5 text-xs flex-wrap">
                                {availableActivities.length > 1 && (
                                    <>
                                        <button
                                            type="button"
                                            onClick={selectAllActivities}
                                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer border shadow-2xs ${
                                                selectedActivityIds.length === 0
                                                    ? 'bg-purple-100 text-purple-800 border-purple-300'
                                                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                                            }`}
                                            title="Analisar todas as atividades juntas"
                                        >
                                            Selecionar Todas
                                        </button>

                                        {selectedActivityIds.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => setSelectedActivityIds([availableActivities[0]?.id])}
                                                className="px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer border bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 shadow-2xs"
                                                title="Manter apenas a primeira atividade selecionada"
                                            >
                                                Limpar
                                            </button>
                                        )}

                                        {activeActivity && (
                                            <button
                                                type="button"
                                                onClick={selectCurrentActivityOnly}
                                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer border shadow-2xs ${
                                                    selectedActivityIds.length === 1 && selectedActivityIds[0] === String(activeActivity.id || 'current_activity')
                                                        ? 'bg-purple-100 text-purple-800 border-purple-300'
                                                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                                                }`}
                                                title="Analisar apenas a atividade atualmente aberta"
                                            >
                                                Apenas Atual
                                            </button>
                                        )}

                                        {/* Alternador de Visão: Lista Estruturada vs Tags */}
                                        <div className="inline-flex items-center p-0.5 rounded-xl bg-slate-100 border border-slate-200 shadow-2xs ml-1">
                                            <button
                                                type="button"
                                                onClick={() => setActivityViewMode('list')}
                                                className={`px-2 py-0.8 rounded-lg text-2xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                                                    activityViewMode === 'list'
                                                        ? 'bg-white text-purple-700 shadow-xs border border-purple-200'
                                                        : 'text-slate-500 hover:text-slate-800'
                                                }`}
                                                title="Visão em Lista Estruturada com títulos completos e numeração"
                                            >
                                                <List className="w-3 h-3" />
                                                <span>Lista</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setActivityViewMode('tags')}
                                                className={`px-2 py-0.8 rounded-lg text-2xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                                                    activityViewMode === 'tags'
                                                        ? 'bg-white text-purple-700 shadow-xs border border-purple-200'
                                                        : 'text-slate-500 hover:text-slate-800'
                                                }`}
                                                title="Visão em Pílulas Compactas"
                                            >
                                                <Tag className="w-3 h-3" />
                                                <span>Tags</span>
                                            </button>
                                        </div>

                                        {/* Botão de Recolher / Expandir Seletor */}
                                        <button
                                            type="button"
                                            onClick={() => setIsActivitySelectorCollapsed(prev => !prev)}
                                            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all cursor-pointer border border-transparent hover:border-slate-200 ml-0.5"
                                            title={isActivitySelectorCollapsed ? "Expandir seletor de atividades" : "Recolher seletor de atividades para poupar espaço"}
                                        >
                                            {isActivitySelectorCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Visão Resumida quando recolhido */}
                        {isActivitySelectorCollapsed && (
                            <div className="text-2xs text-slate-500 flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
                                <div className="flex items-center gap-1.5 overflow-hidden text-ellipsis whitespace-nowrap">
                                    <span className="font-semibold text-slate-700">Atividades incluídas:</span>
                                    <span className="text-purple-700 font-medium truncate">
                                        {effectiveSelectedActivityIds.length === availableActivities.length
                                            ? `Todas as ${availableActivities.length} atividades estão incluídas na análise conjunta.`
                                            : availableActivities
                                                .filter(a => effectiveSelectedActivityIds.includes(a.id))
                                                .map(a => a.title || a.topic)
                                                .join(' • ')}
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsActivitySelectorCollapsed(false)}
                                    className="text-purple-600 hover:text-purple-800 font-bold shrink-0 text-3xs underline cursor-pointer"
                                >
                                    Gerenciar
                                </button>
                            </div>
                        )}

                        {/* Conteúdo Expandido */}
                        {!isActivitySelectorCollapsed && (
                            <>
                                {/* Campo de busca rápida se houver mais de 3 atividades */}
                                {availableActivities.length > 3 && (
                                    <div className="relative">
                                        <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="text"
                                            value={activitySearchTerm}
                                            onChange={e => setActivitySearchTerm(e.target.value)}
                                            placeholder="Buscar atividade por título ou tema..."
                                            className="w-full pl-7 pr-7 py-1 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-purple-400 shadow-2xs"
                                        />
                                        {activitySearchTerm && (
                                            <button
                                                type="button"
                                                onClick={() => setActivitySearchTerm('')}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 text-xs cursor-pointer"
                                            >
                                                ✕
                                            </button>
                                        )}
                                    </div>
                                )}

                                {/* MODO 1: VISÃO LISTA ESTRUTURADA com agrupamento por origem */}
                                {activityViewMode === 'list' && (() => {
                                    const filtered = availableActivities.filter(act => {
                                        if (!activitySearchTerm.trim()) return true;
                                        const query = activitySearchTerm.toLowerCase();
                                        return (act.title || '').toLowerCase().includes(query) || (act.topic || '').toLowerCase().includes(query);
                                    });
                                    const tabActivities = filtered.filter(a => !a.isFromHistory);
                                    const historyActivities = filtered.filter(a => a.isFromHistory);

                                    const renderActivityCard = (act, idx, globalIdx) => {
                                        const isSelected = effectiveSelectedActivityIds.includes(act.id);
                                        return (
                                            <div
                                                key={act.id}
                                                onClick={() => toggleActivitySelection(act.id)}
                                                className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 shadow-2xs select-none ${
                                                    isSelected 
                                                        ? 'bg-purple-50/70 border-purple-300 text-slate-900 shadow-xs ring-1 ring-purple-400/30' 
                                                        : 'bg-slate-50/60 border-slate-200 hover:border-slate-300 text-slate-600 opacity-75 hover:opacity-100'
                                                }`}
                                            >
                                                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                                    {/* Checkbox Indicador */}
                                                    <div className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 transition-all ${
                                                        isSelected 
                                                            ? 'bg-purple-600 text-white shadow-2xs' 
                                                            : 'bg-white border border-slate-300 text-transparent'
                                                    }`}>
                                                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                                                    </div>

                                                    {/* Título & Numeração */}
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex items-center gap-1.5 flex-wrap">
                                                            <span className={`text-[10px] font-mono font-black px-1.5 py-0.2 rounded-md ${
                                                                isSelected ? 'bg-purple-200/80 text-purple-900' : 'bg-slate-200 text-slate-600'
                                                            }`}>
                                                                #{globalIdx + 1}
                                                            </span>
                                                            <span className={`text-xs font-bold leading-snug line-clamp-2 ${
                                                                isSelected ? 'text-slate-900' : 'text-slate-700'
                                                            }`} title={act.title || act.topic}>
                                                                {act.title || act.topic}
                                                            </span>
                                                        </div>
                                                        {act.topic && act.title !== act.topic && (
                                                            <span className="text-[10px] text-slate-400 truncate block mt-0.5">
                                                                {act.topic}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Badges de Questões */}
                                                <div className="flex items-center gap-1.5 shrink-0">
                                                    {act.questionCount > 0 && (
                                                        <span className="text-[10px] bg-white border border-slate-200 text-slate-600 px-1.5 py-0.5 rounded-md font-mono font-semibold shadow-2xs" title={`${act.questionCount} questões nesta atividade`}>
                                                            {act.questionCount}q
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    };

                                    let globalCounter = 0;
                                    return (
                                        <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1 custom-scrollbar">
                                            {/* Grupo: Abas Abertas */}
                                            {tabActivities.length > 0 && (
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1.5">
                                                        <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 flex items-center gap-1">
                                                            <FileText className="w-3 h-3" />
                                                            Abas Abertas
                                                        </span>
                                                        <div className="flex-1 h-px bg-indigo-100" />
                                                        <span className="text-[10px] text-indigo-500 font-semibold">{tabActivities.length}</span>
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                                                        {tabActivities.map((act, idx) => renderActivityCard(act, idx, globalCounter++))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Grupo: Histórico de Atividades */}
                                            {historyActivities.length > 0 && (
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1.5">
                                                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1">
                                                            <BookOpen className="w-3 h-3" />
                                                            Histórico de Atividades
                                                        </span>
                                                        <div className="flex-1 h-px bg-slate-200" />
                                                        <span className="text-[10px] text-slate-400 font-semibold">{historyActivities.length}</span>
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                                                        {historyActivities.map((act, idx) => renderActivityCard(act, idx, globalCounter++))}
                                                    </div>
                                                </div>
                                            )}

                                            {filtered.length === 0 && (
                                                <div className="text-center py-4 text-xs text-slate-400">
                                                    Nenhuma atividade encontrada para "{activitySearchTerm}"
                                                </div>
                                            )}
                                        </div>
                                    );
                                })()}

                                {/* MODO 2: VISÃO PÍLULAS COMPACTAS com grupos por origem */}
                                {activityViewMode === 'tags' && (() => {
                                    const filtered = availableActivities.filter(act => {
                                        if (!activitySearchTerm.trim()) return true;
                                        const query = activitySearchTerm.toLowerCase();
                                        return (act.title || '').toLowerCase().includes(query) || (act.topic || '').toLowerCase().includes(query);
                                    });
                                    const tabActivities = filtered.filter(a => !a.isFromHistory);
                                    const historyActivities = filtered.filter(a => a.isFromHistory);

                                    const renderPill = (act, idx) => {
                                        const isSelected = effectiveSelectedActivityIds.includes(act.id);
                                        return (
                                            <button
                                                key={act.id}
                                                type="button"
                                                onClick={() => toggleActivitySelection(act.id)}
                                                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border shadow-2xs ${
                                                    isSelected 
                                                        ? 'bg-purple-100 text-purple-900 border-purple-300 shadow-xs' 
                                                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                                                }`}
                                                title={act.title || act.topic}
                                            >
                                                <span className={`w-4 h-4 rounded-md flex items-center justify-center text-[10px] font-bold ${
                                                    isSelected ? 'bg-purple-600 text-white' : 'bg-slate-200 text-slate-600'
                                                }`}>
                                                    {isSelected ? '✓' : '+'}
                                                </span>
                                                <span className="text-3xs font-mono font-semibold text-slate-400">#{idx + 1}</span>
                                                <span className="truncate max-w-[200px]">
                                                    {act.title || act.topic}
                                                </span>
                                            </button>
                                        );
                                    };

                                    return (
                                        <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1 custom-scrollbar">
                                            {tabActivities.length > 0 && (
                                                <div>
                                                    <div className="flex items-center gap-1.5 mb-1">
                                                        <span className="text-[10px] font-black uppercase tracking-wider text-indigo-500 flex items-center gap-1">
                                                            <FileText className="w-3 h-3" /> Abas
                                                        </span>
                                                        <div className="flex-1 h-px bg-indigo-100" />
                                                    </div>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {tabActivities.map((act, idx) => renderPill(act, idx))}
                                                    </div>
                                                </div>
                                            )}
                                            {historyActivities.length > 0 && (
                                                <div>
                                                    <div className="flex items-center gap-1.5 mb-1">
                                                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                                                            <BookOpen className="w-3 h-3" /> Histórico
                                                        </span>
                                                        <div className="flex-1 h-px bg-slate-200" />
                                                    </div>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {historyActivities.map((act, idx) => renderPill(act, tabActivities.length + idx))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })()}
                            </>
                        )}
                    </div>
                )}

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
                            Engajamento ({metrics.participatingStudents}/{metrics.presentStudents || metrics.totalStudents})
                        </span>
                        {metrics.absentStudents > 0 && (
                            <span className="text-[10px] text-rose-600 font-bold mt-0.5">
                                {metrics.absentStudents} ausente{metrics.absentStudents > 1 ? 's' : ''}
                            </span>
                        )}
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
                                        <Users className="w-3.5 h-3.5 text-indigo-300" />
                                        <span>🌐 Coletivo (Turma)</span>
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
                                        <span>👥 Individual (Alunos)</span>
                                        {Object.keys(studentAiInsights).length > 0 && (
                                            <span className="text-[10px] bg-emerald-400/20 text-emerald-300 px-1.5 py-0.2 rounded-full font-mono">
                                                {Object.keys(studentAiInsights).length}
                                            </span>
                                        )}
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
                                        <div className="bg-white/5 border border-white/10 p-4 rounded-2xl animate-in fade-in">
                                            <MarkdownText text={aiCollectiveSummary} />
                                        </div>
                                    ) : (
                                        <div className="bg-white/5 border border-dashed border-white/10 p-4 rounded-2xl text-xs text-slate-400 text-center">
                                            Clique em <strong>"✨ Gerar Síntese Coletiva"</strong> para que a IA sintetize a taxa de acertos, a rede de solidariedade entre alunos e as diretrizes didáticas para a próxima aula.
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* VISÃO 2: DIRETÓRIO FORMATIVO COM CARDS CLARAS E FREQUÊNCIA POR DATA (Sem Diagnóstico Consolidado) */}
                            {aiActiveMode === 'individual' && (
                                <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4 animate-in fade-in duration-150">
                                    {/* Cabeçalho da Visão Individual com Seletor de Data e Busca */}
                                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                                        <div>
                                            <h5 className="font-black text-sm text-slate-900 flex items-center gap-2">
                                                <Users className="w-4 h-4 text-purple-600" />
                                                <span>Mapeamento dos Estudantes da Turma</span>
                                                <span className="text-2xs bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded-full border border-purple-200">
                                                    {studentStats.length} alunos
                                                </span>
                                            </h5>
                                            <p className="text-xs text-slate-500 mt-0.5">
                                                Cards individuais para acompanhamento formativo, controle de ausência por data e parecer individual com IA.
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-2 flex-wrap">
                                            {/* Seletor de Data para Ausências */}
                                            <div className="inline-flex items-center gap-1.5 bg-white border border-slate-300/80 px-2.5 py-1.5 rounded-xl shadow-2xs">
                                                <Calendar className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                                                <span className="text-2xs font-bold text-slate-600 uppercase tracking-wider">Data:</span>
                                                <input 
                                                    type="date"
                                                    value={selectedDate}
                                                    onChange={e => setSelectedDate(e.target.value)}
                                                    className="text-xs font-bold text-slate-800 bg-transparent focus:outline-none cursor-pointer"
                                                    title="Escolha a data da aula para gerenciar a frequência e desconsiderar pontos do Desafio da Turma"
                                                />
                                                {selectedDate !== todayIsoDate && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setSelectedDate(todayIsoDate)}
                                                        className="text-3xs font-black px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 hover:bg-purple-200 transition-all cursor-pointer"
                                                        title="Voltar para a data de hoje"
                                                    >
                                                        Hoje
                                                    </button>
                                                )}
                                            </div>

                                            {/* Busca Rápida por Aluno */}
                                            <div className="relative w-full sm:w-56">
                                                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                                <input 
                                                    type="text"
                                                    value={studentSearchQuery}
                                                    onChange={e => setStudentSearchQuery(e.target.value)}
                                                    placeholder="Buscar aluno por nome..."
                                                    className="w-full pl-7 pr-7 py-1.5 rounded-xl bg-white border border-slate-300/80 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-400/40 focus:border-purple-400 transition-all shadow-2xs"
                                                />
                                                {studentSearchQuery && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setStudentSearchQuery('')}
                                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 text-xs cursor-pointer"
                                                    >
                                                        ✕
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Banner Informativo com a Data Selecionada e Regra Pedagógica */}
                                    <div className="bg-purple-50/70 border border-purple-100 rounded-xl px-3 py-2 flex items-center justify-between gap-2 text-2xs text-purple-900 flex-wrap">
                                        <div className="flex items-center gap-1.5">
                                            <Info className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                                            <span>
                                                Frequência em <strong>{selectedDate ? selectedDate.split('-').reverse().join('/') : ''}</strong>: Marcar ausência nesta data desconsidera os pontos coletivos do Desafio da Turma para não distorcer a pontuação individual.
                                            </span>
                                        </div>
                                        <span className="font-bold text-purple-700">
                                            {categorizedCohorts.absent.length} ausente(s) nesta data
                                        </span>
                                    </div>

                                    {/* Filtros em Pílulas Claras com Contadores */}
                                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
                                        <button
                                            type="button"
                                            onClick={() => setStudentProfileFilter('all')}
                                            className={`px-3 py-1 rounded-xl text-2xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 border ${
                                                studentProfileFilter === 'all'
                                                    ? 'bg-purple-600 text-white border-purple-700 shadow-xs'
                                                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                                            }`}
                                        >
                                            <span>Todos</span>
                                            <span className="text-3xs bg-black/10 px-1 py-0.2 rounded-full font-mono">{studentStats.length}</span>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => setStudentProfileFilter('high')}
                                            className={`px-3 py-1 rounded-xl text-2xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 border ${
                                                studentProfileFilter === 'high'
                                                    ? 'bg-amber-500 text-slate-950 font-black border-amber-600 shadow-xs'
                                                    : 'bg-white text-amber-900 border-amber-200 hover:bg-amber-50'
                                            }`}
                                        >
                                            <span>🌟 Destaques</span>
                                            <span className="text-3xs bg-black/10 px-1 py-0.2 rounded-full font-mono">{categorizedCohorts.high.length}</span>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => setStudentProfileFilter('helpers')}
                                            className={`px-3 py-1 rounded-xl text-2xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 border ${
                                                studentProfileFilter === 'helpers'
                                                    ? 'bg-emerald-600 text-white font-bold border-emerald-700 shadow-xs'
                                                    : 'bg-white text-emerald-900 border-emerald-200 hover:bg-emerald-50'
                                            }`}
                                        >
                                            <span>🤝 Monitores</span>
                                            <span className="text-3xs bg-black/10 px-1 py-0.2 rounded-full font-mono">{categorizedCohorts.helpers.length}</span>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => setStudentProfileFilter('support')}
                                            className={`px-3 py-1 rounded-xl text-2xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 border ${
                                                studentProfileFilter === 'support'
                                                    ? 'bg-rose-600 text-white font-bold border-rose-700 shadow-xs'
                                                    : 'bg-white text-rose-900 border-rose-200 hover:bg-rose-50'
                                            }`}
                                        >
                                            <span>🎯 Apoio Prioritário</span>
                                            <span className="text-3xs bg-black/10 px-1 py-0.2 rounded-full font-mono">{categorizedCohorts.support.length}</span>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => setStudentProfileFilter('not_drawn')}
                                            className={`px-3 py-1 rounded-xl text-2xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 border ${
                                                studentProfileFilter === 'not_drawn'
                                                    ? 'bg-indigo-600 text-white font-bold border-indigo-700 shadow-xs'
                                                    : 'bg-white text-indigo-900 border-indigo-200 hover:bg-indigo-50'
                                            }`}
                                        >
                                            <span>🔍 Não Sorteados</span>
                                            <span className="text-3xs bg-black/10 px-1 py-0.2 rounded-full font-mono">{categorizedCohorts.notDrawn.length}</span>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => setStudentProfileFilter('absent')}
                                            className={`px-3 py-1 rounded-xl text-2xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 border ${
                                                studentProfileFilter === 'absent'
                                                    ? 'bg-red-700 text-white font-bold border-red-800 shadow-xs'
                                                    : 'bg-white text-red-900 border-red-200 hover:bg-red-50'
                                            }`}
                                        >
                                            <span>🚫 Ausentes</span>
                                            <span className="text-3xs bg-black/10 px-1 py-0.2 rounded-full font-mono">{categorizedCohorts.absent.length}</span>
                                        </button>
                                    </div>

                                    {/* Grade de Cards Claras dos Alunos */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 max-h-[500px] overflow-y-auto pr-1.5 custom-scrollbar">
                                        {filteredStudentsList.length === 0 ? (
                                            <div className="col-span-full bg-white border border-dashed border-slate-300 p-8 rounded-2xl text-center text-slate-500 text-xs">
                                                Nenhum estudante encontrado com o filtro ou busca selecionada.
                                            </div>
                                        ) : (
                                            filteredStudentsList.map(student => (
                                                <div 
                                                    key={student.id} 
                                                    className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between gap-2.5 shadow-xs hover:shadow-md h-full min-h-[148px] ${
                                                        student.isAbsent 
                                                            ? 'bg-rose-50/80 border-2 border-rose-300 text-slate-800' 
                                                            : 'bg-white border-slate-200/90 hover:border-purple-300 text-slate-800'
                                                    }`}
                                                >
                                                    {/* Cabeçalho do Card */}
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div className="flex items-center gap-2.5 min-w-0">
                                                            <div className={`w-9 h-9 rounded-xl font-black text-xs flex items-center justify-center shrink-0 shadow-2xs ${
                                                                student.isAbsent 
                                                                    ? 'bg-rose-100 text-rose-700 border border-rose-300' 
                                                                    : student.isHighPerformer
                                                                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                                                    : student.isHelper
                                                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                                                    : student.needsSupport
                                                                    ? 'bg-rose-100 text-rose-700 border border-rose-300'
                                                                    : 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                                                            }`}>
                                                                {student.name.charAt(0).toUpperCase()}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <span className="font-bold text-xs text-slate-900 block truncate" title={student.name}>
                                                                    {student.name}
                                                                </span>
                                                                {student.groupName ? (
                                                                    <span className="text-[10px] text-indigo-600 font-semibold truncate flex items-center gap-1">
                                                                        <Users className="w-2.5 h-2.5 shrink-0" />
                                                                        <span className="truncate">{student.groupName}</span>
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                                                                        <User className="w-2.5 h-2.5 shrink-0" />
                                                                        <span>Individual</span>
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Badge Principal com Símbolos Priorizados */}
                                                        <div className="shrink-0">
                                                            {student.isAbsent ? (
                                                                <span className="text-[10px] bg-rose-100 text-rose-800 font-black px-2 py-0.5 rounded-full border border-rose-300 shadow-2xs flex items-center gap-1" title="Ausente nesta data">
                                                                    <UserX className="w-3 h-3 text-rose-600" />
                                                                    <span>Ausente</span>
                                                                </span>
                                                            ) : student.isHighPerformer ? (
                                                                <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-full border border-amber-300 shadow-2xs flex items-center gap-1" title="Aluno Destaque">
                                                                    <Star className="w-3 h-3 text-amber-600 fill-amber-500" />
                                                                    <span>Destaque</span>
                                                                </span>
                                                            ) : student.isHelper ? (
                                                                <span className="text-[10px] bg-emerald-100 text-emerald-900 font-bold px-2 py-0.5 rounded-full border border-emerald-300 shadow-2xs flex items-center gap-1" title="Monitor / Solidariedade">
                                                                    <HeartHandshake className="w-3 h-3 text-emerald-600" />
                                                                    <span>Monitor</span>
                                                                </span>
                                                            ) : student.needsSupport ? (
                                                                <span className="text-[10px] bg-rose-100 text-rose-900 font-bold px-2 py-0.5 rounded-full border border-rose-300 shadow-2xs flex items-center gap-1" title="Apoio Pedagógico Prioritário">
                                                                    <Target className="w-3 h-3 text-rose-600" />
                                                                    <span>Apoio</span>
                                                                </span>
                                                            ) : (
                                                                <span className="text-[10px] bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200 font-semibold shadow-2xs flex items-center gap-1" title="Presente na aula">
                                                                    <Check className="w-3 h-3 text-emerald-600 stroke-[3]" />
                                                                    <span>Presente</span>
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Métricas do Estudante - Priorizando Símbolos a Textos */}
                                                    <div className="flex flex-wrap items-center gap-1.5 py-0.5">
                                                        {student.isAbsent ? (
                                                            <div className="text-2xs text-rose-700 font-semibold italic bg-rose-100/60 border border-rose-200 px-2 py-1 rounded-lg flex items-center gap-1.5 w-full">
                                                                <UserX className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                                                                <span className="truncate">Ausente em {selectedDate ? selectedDate.split('-').reverse().join('/') : ''}</span>
                                                            </div>
                                                        ) : (
                                                            <>
                                                                {/* Acertos (Símbolo em Destaque) */}
                                                                <span 
                                                                    title={`${student.hits} acerto(s)`} 
                                                                    className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-200/90 px-2 py-0.5 rounded-lg text-xs font-black shadow-2xs"
                                                                >
                                                                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                                                    <span>{student.hits}</span>
                                                                </span>

                                                                {/* Erros (Símbolo em Destaque se houver) */}
                                                                {student.misses > 0 && (
                                                                    <span 
                                                                        title={`${student.misses} erro(s)`} 
                                                                        className="inline-flex items-center gap-1 bg-rose-50 text-rose-800 border border-rose-200/90 px-2 py-0.5 rounded-lg text-xs font-black shadow-2xs"
                                                                    >
                                                                        <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                                                                        <span>{student.misses}</span>
                                                                    </span>
                                                                )}

                                                                {/* Ajudou Outros Colegas */}
                                                                {student.helpedOthers.length > 0 && (
                                                                    <span 
                                                                        title={`Ajudou outros alunos ${student.helpedOthers.length}x`} 
                                                                        className="inline-flex items-center gap-1 bg-blue-50 text-blue-800 border border-blue-200/90 px-2 py-0.5 rounded-lg text-xs font-black shadow-2xs"
                                                                    >
                                                                        <HeartHandshake className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                                                        <span>{student.helpedOthers.length}</span>
                                                                    </span>
                                                                )}

                                                                {/* Teve Ajuda */}
                                                                {student.helpReceived.length > 0 && (
                                                                    <span 
                                                                        title={`Recebeu ajuda ${student.helpReceived.length}x`} 
                                                                        className="inline-flex items-center gap-1 bg-purple-50 text-purple-800 border border-purple-200/90 px-2 py-0.5 rounded-lg text-xs font-black shadow-2xs"
                                                                    >
                                                                        <HelpCircle className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                                                                        <span>{student.helpReceived.length}</span>
                                                                    </span>
                                                                )}

                                                                {/* Aguardando Sorteio na Roleta */}
                                                                {!student.participated && student.helpedOthers.length === 0 && (
                                                                    <span 
                                                                        title="Aguardando sorteio na roleta" 
                                                                        className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 border border-slate-200/90 px-2 py-0.5 rounded-lg text-xs font-medium shadow-2xs"
                                                                    >
                                                                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                                                        <span className="text-2xs text-slate-500 font-medium">Aguardando</span>
                                                                    </span>
                                                                )}
                                                            </>
                                                        )}
                                                    </div>

                                                    {/* Ações Rápidas: Alternar Ausente e Parecer IA (Layout Anti-Quebra com Símbolos Priorizados) */}
                                                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleToggleStudentAbsentStatus(student.id, !student.isAbsent)}
                                                            className={`flex-1 py-1.5 px-2 rounded-xl text-2xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs active:scale-95 whitespace-nowrap ${
                                                                student.isAbsent
                                                                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs border border-emerald-700'
                                                                    : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 hover:border-rose-300'
                                                            }`}
                                                            title={student.isAbsent ? `Tornar ${student.name} presente em ${selectedDate}` : `Marcar ${student.name} como ausente em ${selectedDate} (desconsidera pontos do Desafio da Turma)`}
                                                        >
                                                            {student.isAbsent ? (
                                                                <>
                                                                    <UserCheck className="w-3.5 h-3.5 text-white shrink-0" />
                                                                    <span>Presente</span>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <UserX className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                                                                    <span>Ausente</span>
                                                                </>
                                                            )}
                                                        </button>

                                                        <button
                                                            type="button"
                                                            onClick={() => setSelectedStudentForAi(student)}
                                                            className={`flex-1 py-1.5 px-2 rounded-xl text-2xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs active:scale-95 whitespace-nowrap border ${
                                                                studentAiInsights[student.id] 
                                                                    ? 'bg-purple-100 hover:bg-purple-200 text-purple-900 border-purple-300' 
                                                                    : 'bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 hover:border-purple-300'
                                                            }`}
                                                            title="Abrir parecer pedagógico individual com IA para este aluno"
                                                        >
                                                            <Sparkles className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                                                            <span>{studentAiInsights[student.id] ? 'Ver Parecer' : 'Parecer IA'}</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ABA 2: REGISTRO DE TOQUES & AÇÕES NA TELA (TIMELINE) */}
                {activeTab === 'actions' && (
    <ReportTabActions 
        metrics={metrics}
        filteredData={filteredData}
        actionCategoryFilter={actionCategoryFilter}
        setActionCategoryFilter={setActionCategoryFilter}
        actionSearchTerm={actionSearchTerm}
        setActionSearchTerm={setActionSearchTerm}
        getActionStyle={getActionStyle}
        questionStats={questionStats}
        studentStats={studentStats}
        groupStats={groupStats}
    />
)}

                {/* ABA 2: QUESTÕES TRABALHADAS */}
                {activeTab === 'questions' && (
    <ReportTabQuestions 
        metrics={metrics}
        filteredData={filteredData}
        actionCategoryFilter={actionCategoryFilter}
        setActionCategoryFilter={setActionCategoryFilter}
        actionSearchTerm={actionSearchTerm}
        setActionSearchTerm={setActionSearchTerm}
        getActionStyle={getActionStyle}
        questionStats={questionStats}
        studentStats={studentStats}
        groupStats={groupStats}
    />
)}

                {/* ABA 3: PARTICIPAÇÃO DOS ALUNOS */}
                {activeTab === 'students' && (
    <ReportTabStudents 
        metrics={metrics}
        filteredData={filteredData}
        actionCategoryFilter={actionCategoryFilter}
        setActionCategoryFilter={setActionCategoryFilter}
        actionSearchTerm={actionSearchTerm}
        setActionSearchTerm={setActionSearchTerm}
        getActionStyle={getActionStyle}
        questionStats={questionStats}
        studentStats={studentStats}
        groupStats={groupStats}
    />
)}

                {/* ABA 4: EQUIPES / GRUPOS */}
                {activeTab === 'groups' && groupStats.length > 0 && (
    <ReportTabGroups groupStats={groupStats} metrics={metrics} filteredData={filteredData} />
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
                            <div className="bg-white/5 border border-white/10 p-3.5 rounded-xl animate-in fade-in">
                                <MarkdownText text={studentAiInsights[selectedStudentForAi.id]} />
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
                                            h.result === 'all_correct'
                                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                                : h.result === 'correct' || h.result === 'help_correct' || h.result === 'group_activity'
                                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                                    : h.result === 'merit'
                                                        ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                                        : 'bg-rose-100 text-rose-800 border border-rose-200'
                                        }`}>
                                            {h.result === 'all_correct' ? '🏆 Desafio da Turma' : h.result === 'correct' || h.result === 'help_correct' ? '✅ Acertou' : h.result === 'group_activity' ? '👥 Grupo' : h.result === 'merit' ? '⭐ Mérito' : '❌ Errou'}
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
