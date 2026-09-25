import { useMemo } from "react";
import { CheckCircle, Info, BookOpen, AlertTriangle, HelpCircle, HeartHandshake, Star, Users, Layers, Shuffle, RotateCcw, UserMinus } from "lucide-react";

export const useReportMetrics = ({
    currentClass, currentGroups, aggregatedQuestions, periodFilter, currentSessionId, sessionStartTime, interactionLogs, localAbsentOverrides, selectedDate, effectiveSelectedActivityIds, availableActivities, todayIsoDate, isStudentAbsentOnDate, studentProfileFilter, studentSearchQuery
}) => {
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

        // Função de validação por atividades selecionadas
        const matchesActivity = (entry) => {
            if (!entry) return false;
            if (effectiveSelectedActivityIds.length === 0 || effectiveSelectedActivityIds.length === availableActivities.length) {
                return true;
            }
            if (entry.activityId && effectiveSelectedActivityIds.includes(String(entry.activityId))) {
                return true;
            }
            const selectedList = availableActivities.filter(a => effectiveSelectedActivityIds.includes(a.id));
            const entryTopic = (entry.topic || '').trim().toLowerCase();
            if (entryTopic && entryTopic !== 'sem tema') {
                const match = selectedList.some(a => {
                    const at = (a.topic || '').trim().toLowerCase();
                    const title = (a.title || '').trim().toLowerCase();
                    return (at && at === entryTopic) || (title && title === entryTopic);
                });
                if (match) return true;
            }
            if ((!entryTopic || entryTopic === 'sem tema') && !entry.activityId) {
                return selectedList.some(a => a.isCurrent);
            }
            return false;
        };

        // Coletar todos os eventos de histórico de todos os alunos
        const allEvents = [];
        const studentStats = (currentClass.students || []).map(s => {
            // Avalia ausência específica para a DATA SELECIONADA
            const isAbsent = isStudentAbsentOnDate(s, selectedDate);

            // Se o aluno estava ausente em determinada data, desconsidera respostas de desafio coletivo ('all_correct') daquela data
            const hist = (s.history || [])
                .filter(matchesPeriod)
                .filter(matchesActivity)
                .filter(h => {
                    if (h.date) {
                        const entryDateStr = h.dateStr || new Date(h.date).toISOString().slice(0, 10);
                        const wasAbsentOnEntryDate = isStudentAbsentOnDate(s, entryDateStr);
                        if (wasAbsentOnEntryDate && (h.result === 'all_correct' || (h.question && h.question.includes('[Desafio da Turma]')))) {
                            return false;
                        }
                    }
                    return true;
                });
            
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

            // Adiciona ao pool global de eventos apenas eventos válidos
            hist.forEach(h => {
                if (h.result !== 'absent') {
                    allEvents.push({
                        ...h,
                        studentId: s.id,
                        studentName: s.name,
                        studentGroup: s.groupName || null
                    });
                }
            });

            const nonAbsentHist = hist.filter(h => h.result !== 'absent');
            const participated = !isAbsent && nonAbsentHist.length > 0;

            // Perfis individuais formativos da turma
            const isHighPerformer = !isAbsent && participated && hits > 0 && misses === 0;
            const isHelper = !isAbsent && helpedOthers.length > 0;
            const needsSupport = !isAbsent && (misses > 0 || helpReceived.length > 0);
            const isNotDrawn = !isAbsent && !participated && helpedOthers.length === 0;

            return {
                id: s.id,
                name: s.name,
                status: isAbsent ? 'absent' : (s.status === 'absent' ? 'active' : (s.status || 'active')),
                groupName: s.groupName || null,
                totalAnswers: nonAbsentHist.length,
                participated,
                hits,
                misses,
                merits,
                violations,
                helpReceived,
                helpedOthers,
                groupParticipations,
                history: hist,
                isHighPerformer,
                isHelper,
                needsSupport,
                isNotDrawn,
                isAbsent
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
                // Tenta achar metadados no banco de perguntas agregado das atividades selecionadas
                const meta = (aggregatedQuestions || []).find(q => (q.question || q.text) === cleanQuestionText) || {};
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
                color: group.color || 'bg-indigo-600',
                totalMembers: memberStudents.length,
                totalRounds: groupRounds.length,
                hits: groupHits,
                misses: groupMisses,
                hitRate: groupRounds.length > 0 ? Math.round((groupHits / groupRounds.length) * 100) : 0,
                rounds: groupRounds
            };
        }).filter(g => g.totalRounds > 0 || (currentGroups || []).length > 0);

        // Métricas Globais da Aula / Sessão
        const totalRounds = uniqueRounds.length;
        const individualRounds = uniqueRounds.filter(r => !r.isGroup).length;
        const groupRounds = uniqueRounds.filter(r => r.isGroup).length;

        const totalHits = uniqueRounds.filter(r => r.result === 'correct' || r.result === 'help_correct' || r.result === 'all_correct' || r.result === 'group_activity').length;
        const totalMisses = uniqueRounds.filter(r => r.result === 'incorrect' || r.result === 'group_incorrect').length;
        const hitRate = totalRounds > 0 ? Math.round((totalHits / totalRounds) * 100) : 0;

        const totalStudents = studentStats.length;
        const absentStudents = studentStats.filter(s => s.isAbsent).length;
        const presentStudents = totalStudents - absentStudents;
        const participatingStudents = studentStats.filter(s => s.participated).length;
        const participationRate = presentStudents > 0 ? Math.round((participatingStudents / presentStudents) * 100) : 0;

        const helpRounds = uniqueRounds.filter(r => r.hadHelp).length;
        const helpSuccessRounds = uniqueRounds.filter(r => r.hadHelp && (r.result === 'correct' || r.result === 'help_correct' || r.result === 'group_activity')).length;
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
            if (!matchesActivity(log)) return false;
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
                absentStudents,
                presentStudents,
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
    }, [currentClass, currentGroups, aggregatedQuestions, periodFilter, currentSessionId, sessionStartTime, interactionLogs, localAbsentOverrides, selectedDate, effectiveSelectedActivityIds, availableActivities, todayIsoDate]);

    // Coortes pedagógicas categorizadas para o Diagnóstico Individual e IA
    const categorizedCohorts = useMemo(() => {
        const { studentStats = [] } = filteredData;
        const high = studentStats.filter(s => s.isHighPerformer);
        const helpers = studentStats.filter(s => s.isHelper);
        const support = studentStats.filter(s => s.needsSupport);
        const notDrawn = studentStats.filter(s => s.isNotDrawn);
        const absent = studentStats.filter(s => s.isAbsent);

        return {
            high,
            helpers,
            support,
            notDrawn,
            absent
        };
    }, [filteredData]);

    // Lista filtrada para o Diretório Visual da Turma na aba Individual (Perfis)
    const filteredStudentsList = useMemo(() => {
        const { studentStats = [] } = filteredData;
        return studentStats.filter(s => {
            // Filtro por perfil pedagógico
            if (studentProfileFilter === 'high' && !s.isHighPerformer) return false;
            if (studentProfileFilter === 'helpers' && !s.isHelper) return false;
            if (studentProfileFilter === 'support' && !s.needsSupport) return false;
            if (studentProfileFilter === 'not_drawn' && !s.isNotDrawn) return false;
            if (studentProfileFilter === 'absent' && !s.isAbsent) return false;

            // Filtro por busca textual
            if (studentSearchQuery.trim()) {
                const query = studentSearchQuery.toLowerCase().trim();
                const matchName = s.name.toLowerCase().includes(query);
                const matchGroup = s.groupName ? s.groupName.toLowerCase().includes(query) : false;
                if (!matchName && !matchGroup) return false;
            }

            return true;
        });
    }, [filteredData, studentProfileFilter, studentSearchQuery]);

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

    return { filteredData, categorizedCohorts, filteredStudentsList, algorithmicInsights };
};

