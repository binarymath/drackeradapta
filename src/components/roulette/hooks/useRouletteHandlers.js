import { useCallback } from 'react';
import { gameAudio } from '../../../utils/gameAudio';

export const useRouletteHandlers = (context) => {
    const { logTeacherAction, gameMode, currentSessionId, sessionStartTime, activeActivity, currentClass, updateStudentInClass, saveClassUpdates, setUsedQuestions, setShowCard, setWinner, winner, setStudentDrawCounts, updateActivityData, setQuestionDrawCounts, combinedItems, pickWeightedQuestion, uniqueQuestions, questionDrawCounts, studentDrawCounts, currentGroups, activeGroupItems, usedQuestions, studentToGroupMap, groupRoundSlots, setGroupRoundSlots, setActiveGroupTab, addActivityTab } = context;

    const handleChangeWinnerStudent = (newStudentObj, swapMode = 'random') => {
        if (!newStudentObj) return;
        const prevName = winner?.name || 'Aluno';
        logTeacherAction(
            'swap_student',
            'Troca de Aluno Sorteado',
            `Aluno trocado de "${prevName}" para "${newStudentObj.name}" (${swapMode === 'specific' ? 'selecionado da lista' : 'sorteio aleatório'}). Pergunta mantida.`,
            {
                previousStudentName: prevName,
                previousStudentId: winner?.id,
                studentName: newStudentObj.name,
                studentId: newStudentObj.id,
                question: winner?.question,
                swapMode
            }
        );
        setWinner(prev => ({
            ...newStudentObj,
            question: prev?.question || newStudentObj.question,
            answer: prev?.answer !== undefined ? prev.answer : newStudentObj.answer || '',
            difficulty: prev?.difficulty || newStudentObj.difficulty || 'Média',
            imageUrl: prev?.imageUrl !== undefined ? prev.imageUrl : newStudentObj.imageUrl || null,
            questionId: prev?.questionId || newStudentObj.questionId || null
        }));
        gameAudio.playTick();
    };

    const handleSelectStudentManually = (studentId) => {
        const student = combinedItems.find(s => s.id === studentId);
        if (!student) return;

        // Tentar selecionar uma pergunta por peso
        let questionObj = pickWeightedQuestion(uniqueQuestions, questionDrawCounts);
        const rawQuestion = questionObj ? questionObj.question : 'Nenhuma pergunta gerada para esta sessão.';

        // Incrementa a contagem de sorteios
        const sIdKey = String(student.id);
        const qKey = questionObj ? (questionObj.id || questionObj.question) : null;

        setStudentDrawCounts(prev => {
            const next = { ...prev, [sIdKey]: (prev[sIdKey] || 0) + 1 };
            if (activeActivity?.id && updateActivityData) {
                updateActivityData(activeActivity.id, { studentDrawCounts: next });
            }
            return next;
        });

        if (qKey) {
            setQuestionDrawCounts(prev => {
                const next = { ...prev, [qKey]: (prev[qKey] || 0) + 1 };
                if (activeActivity?.id && updateActivityData) {
                    updateActivityData(activeActivity.id, { questionDrawCounts: next });
                }
                return next;
            });
        }

        logTeacherAction(
            'manual_select_student',
            'Seleção Manual de Aluno',
            `Professor escolheu diretamente "${student.name}" para responder. Pergunta atribuída: "${rawQuestion.slice(0, 50)}..."`,
            {
                studentName: student.name,
                studentId: student.id,
                question: rawQuestion
            }
        );

        setWinner({
            ...student,
            question: rawQuestion,
            answer: questionObj?.answer || '',
            difficulty: questionObj?.difficulty || 'Média',
            imageUrl: questionObj?.imageUrl || null,
            questionId: questionObj?.id || null
        });
        setShowCard(true);
        gameAudio.playTick();
    };

    const handleToggleStudentActivityStatus = (studentId, action) => {
        if (!activeActivity?.id || !updateActivityData) return;
        const sIdStr = String(studentId);
        const currentRemoved = new Set((activeActivity?.removedStudentIds || []).map(String));
        if (action === 'remove') {
            currentRemoved.add(sIdStr);
        } else {
            currentRemoved.delete(sIdStr);
            // Se o aluno estava como 'absent' no cadastro global, reativa para 'active'
            updateStudentInClass(studentId, { status: 'active' });
        }
        updateActivityData(activeActivity.id, {
            removedStudentIds: Array.from(currentRemoved)
        });

        const student = combinedItems.find(s => String(s.id) === String(studentId));
        const sName = student?.name || `Aluno #${studentId}`;
        logTeacherAction(
            action === 'remove' ? 'student_removed' : 'student_reactivated',
            action === 'remove' ? 'Aluno Retirado da Roleta' : 'Aluno Recolocado na Roleta',
            action === 'remove' 
                ? `Aluno "${sName}" foi retirado da roleta desta atividade.` 
                : `Aluno "${sName}" foi recolocado de volta na roleta.`,
            {
                studentName: sName,
                studentId,
                action
            }
        );

        gameAudio.playTick();
    };

    const handleActivateAll = () => {
        if (!activeActivity?.id || !updateActivityData) return;
        updateActivityData(activeActivity.id, {
            removedStudentIds: []
        });
        // Restaura status de alunos ausentes na turma global para ativo
        saveClassUpdates(prev => ({
            ...prev,
            students: (prev.students || []).map(s => s.status === 'absent' ? { ...s, status: 'active' } : s)
        }));

        logTeacherAction(
            'activate_all',
            'Todos os Alunos Recolocados',
            'Professor colocou todos os alunos da turma de volta na roleta.',
            {}
        );

        gameAudio.playSuccess();
    };

    const handleDeactivateAll = () => {
        if (!activeActivity?.id || !updateActivityData || !currentClass) return;
        const allIds = (currentClass.students || []).map(s => String(s.id));
        updateActivityData(activeActivity.id, {
            removedStudentIds: allIds
        });

        logTeacherAction(
            'deactivate_all',
            'Todos os Alunos Retirados da Roleta',
            'Professor retirou todos os alunos da roleta para realizar sorteios manuais ou específicos.',
            {}
        );

        gameAudio.playTick();
    };

    const handleAdjustPoints = (studentId, delta, reason) => {
        const student = combinedItems.find(s => s.id === studentId);
        if (!student) return;

        const isMerit = delta > 0;
        const motiveText = (typeof reason === 'string' && reason !== 'merit' && reason !== 'rule_violation' && reason.trim())
            ? reason
            : (isMerit ? 'Bônus por Mérito (+1 Ponto)' : 'Penalidade: Infringiu regra (-1 Ponto)');

        const historyEntry = {
            date: Date.now(),
            sessionId: currentSessionId,
            gameMode,
            topic: activeActivity?.topic || 'Sem tema',
            question: motiveText,
            result: isMerit ? 'merit' : 'rule_violation',
            pointsDelta: delta
        };

        const currentHits = student.hits || 0;
        const newHits = Math.max(0, currentHits + delta);

        updateStudentInClass(studentId, { hits: newHits }, historyEntry);

        logTeacherAction(
            isMerit ? 'point_merit' : 'point_penalty',
            isMerit ? `+${delta} Ponto (${motiveText})` : `${delta} Ponto (${motiveText})`,
            `${delta > 0 ? '+' : ''}${delta} Ponto para "${student.name}". Motivo: ${motiveText}`,
            {
                studentName: student.name,
                studentId: student.id,
                delta,
                reason: motiveText
            }
        );

        if (isMerit) {
            gameAudio.playSuccess();
        } else {
            gameAudio.playTick();
        }
    };

    const handleChangeWinnerQuestion = (newQuestionObj, swapMode = 'random') => {
        if (!newQuestionObj) return;
        const prevQ = winner?.question || 'Pergunta';
        logTeacherAction(
            'swap_question',
            'Troca de Pergunta',
            `Pergunta de "${winner?.name || 'Sorteado'}" alterada para: "${newQuestionObj.question}" (${swapMode === 'specific' ? 'escolhida da lista' : 'nova pergunta sorteada'}).`,
            {
                studentName: winner?.name,
                studentId: winner?.id,
                previousQuestion: prevQ,
                question: newQuestionObj.question,
                difficulty: newQuestionObj.difficulty,
                swapMode
            }
        );
        setWinner(prev => ({
            ...prev,
            question: newQuestionObj.question,
            answer: newQuestionObj.answer || '',
            difficulty: newQuestionObj.difficulty || prev?.difficulty || 'Média',
            imageUrl: newQuestionObj.imageUrl || null,
            questionId: newQuestionObj.id || null
        }));
    };

    const handleSpinAgain = () => {
        if (winner) {
            const sIdKey = String(winner.id);
            const qKey = winner.questionId || winner.question;

            setStudentDrawCounts(prev => {
                const updated = { ...prev };
                if (updated[sIdKey] && updated[sIdKey] > 0) {
                    updated[sIdKey] -= 1;
                }
                if (activeActivity?.id && updateActivityData) {
                    updateActivityData(activeActivity.id, { studentDrawCounts: updated });
                }
                return updated;
            });

            if (qKey) {
                setQuestionDrawCounts(prev => {
                    const updated = { ...prev };
                    if (updated[qKey] && updated[qKey] > 0) {
                        updated[qKey] -= 1;
                    }
                    if (activeActivity?.id && updateActivityData) {
                        updateActivityData(activeActivity.id, { questionDrawCounts: updated });
                    }
                    return updated;
                });
            }
        }

        logTeacherAction(
            'spin_again',
            'Rode Outra Vez (Girar Novamente)',
            `Professor acionou "Rode Outra Vez" para "${winner?.name || 'aluno sorteado'}". Sorteio desconsiderado sem penalidade; probabilidades restauradas.`,
            {
                studentName: winner?.name,
                studentId: winner?.id,
                question: winner?.question
            }
        );
        setShowCard(false);
        setWinner(null);
    };

    const handleResult = (resultType) => {
        if (!winner) return;
        
        const historyEntry = {
            date: Date.now(),
            sessionId: currentSessionId,
            gameMode,
            topic: activeActivity?.topic || 'Sem tema',
            question: winner.question,
            result: resultType // 'correct', 'incorrect', 'absent'
        };

        if (resultType === 'correct') {
            logTeacherAction(
                'eval_correct',
                'Resposta Correta (+1 Ponto)',
                `"${winner.name}" acertou a pergunta individual (+1 acerto).`,
                {
                    studentName: winner.name,
                    studentId: winner.id,
                    question: winner.question
                }
            );
            updateStudentInClass(winner.id, { hits: (winner.hits || 0) + 1 }, historyEntry);
            setUsedQuestions(prev => new Set([...prev, winner.question]));
        } else if (resultType === 'incorrect') {
            logTeacherAction(
                'eval_incorrect',
                'Resposta Incorreta',
                `"${winner.name}" errou a pergunta individual.`,
                {
                    studentName: winner.name,
                    studentId: winner.id,
                    question: winner.question
                }
            );
            updateStudentInClass(winner.id, { misses: (winner.misses || 0) + 1 }, historyEntry);
            setUsedQuestions(prev => new Set([...prev, winner.question]));
            // Mantém ativo na roleta
        } else if (resultType === 'absent') {
            logTeacherAction(
                'absent',
                'Aluno Marcado como Ausente',
                `"${winner.name}" foi marcado(a) como ausente pelo professor na rodada.`,
                {
                    studentName: winner.name,
                    studentId: winner.id,
                    question: winner.question
                }
            );
            updateStudentInClass(winner.id, { status: 'absent' }, historyEntry);
        }

        setShowCard(false);
        setWinner(null);
    };

    const handleBatchResult = ({ studentIds, questionText, actionType = 'correct' }) => {
        if (!studentIds || studentIds.length === 0) return;

        const idSet = new Set((studentIds || []).map(String));
        const now = Date.now();

        saveClassUpdates(prev => {
            const newStudents = (prev.students || []).map(s => {
                // Alunos ausentes não devem receber pontuação coletiva do desafio da turma
                if (s.status === 'absent') return s;

                if (idSet.has(String(s.id))) {
                    const isNotExecuted = actionType === 'did_not_execute';
                    const historyEntry = {
                        date: now,
                        dateStr: new Date(now).toISOString().slice(0, 10),
                        sessionId: currentSessionId,
                        activityId: activeActivity?.id || null,
                        gameMode,
                        topic: activeActivity?.topic || activeActivity?.title || 'Sem tema',
                        question: `[Desafio da Turma] ${questionText}`,
                        result: isNotExecuted ? 'not_executed' : 'all_correct'
                    };
                    return {
                        ...s,
                        hits: isNotExecuted ? Math.max(0, (s.hits || 0) - 1) : ((s.hits || 0) + 1),
                        history: [...(s.history || []), historyEntry]
                    };
                }
                return s;
            });
            return { ...prev, students: newStudents };
        });

        logTeacherAction(
            'eval_batch',
            'Desafio Coletivo (Todos Respondem)',
            `Avaliação coletiva (${actionType === 'did_not_execute' ? 'Não executaram' : 'Acertaram'}) registrada para ${studentIds.length} aluno(s) simultaneamente. Pergunta: "${questionText.slice(0, 50)}..."`,
            {
                studentCount: studentIds.length,
                question: questionText
            }
        );

        setUsedQuestions(prev => new Set([...prev, questionText]));
        setShowCard(false);
        setWinner(null);
    };

    const handleToggleStudentAbsent = (studentId, isAbsent, targetDate = null) => {
        const targetDateStr = targetDate || new Date().toISOString().slice(0, 10);
        const todayStr = new Date().toISOString().slice(0, 10);
        const targetDateTimestamp = targetDate ? new Date(`${targetDate}T12:00:00`).getTime() : Date.now();

        saveClassUpdates(prev => {
            const newStudents = (prev.students || []).map(s => {
                if (String(s.id) === String(studentId)) {
                    let updatedHistory = [...(s.history || [])];
                    let hitsDelta = 0;

                    const isMatchingDate = (h) => {
                        if (h.dateStr && h.dateStr === targetDateStr) return true;
                        if (h.date) {
                            const dStr = new Date(h.date).toISOString().slice(0, 10);
                            if (dStr === targetDateStr) return true;
                        }
                        if (!targetDate && ((h.sessionId && h.sessionId === currentSessionId) || (sessionStartTime && h.date >= sessionStartTime))) {
                            return true;
                        }
                        return false;
                    };

                    if (isAbsent) {
                        // Quando marcado ausente:
                        // 1. Remover entradas de desafio coletivo ("all_correct") ou pontuações em lote desta data/sessão
                        const collectiveEntries = updatedHistory.filter(h => 
                            isMatchingDate(h) && (h.result === 'all_correct' || (h.question && h.question.includes('[Desafio da Turma]')))
                        );
                        hitsDelta = collectiveEntries.length;

                        updatedHistory = updatedHistory.filter(h => 
                            !(isMatchingDate(h) && (h.result === 'all_correct' || (h.question && h.question.includes('[Desafio da Turma]'))))
                        );

                        // Adiciona registro formal de ausência na sessão/data se ainda não houver
                        const hasAbsentEntry = updatedHistory.some(h => 
                            isMatchingDate(h) && h.result === 'absent'
                        );
                        if (!hasAbsentEntry) {
                            updatedHistory.push({
                                date: targetDateTimestamp,
                                dateStr: targetDateStr,
                                sessionId: currentSessionId,
                                gameMode,
                                topic: activeActivity?.topic || 'Sem tema',
                                question: 'Frequência da Aula',
                                result: 'absent'
                            });
                        }

                        return {
                            ...s,
                            status: targetDateStr === todayStr ? 'absent' : s.status,
                            hits: Math.max(0, (s.hits || 0) - hitsDelta),
                            history: updatedHistory
                        };
                    } else {
                        // Quando desmarcado de ausente (reativado para presente):
                        updatedHistory = updatedHistory.filter(h => 
                            !(isMatchingDate(h) && h.result === 'absent')
                        );
                        return {
                            ...s,
                            status: targetDateStr === todayStr ? 'active' : s.status,
                            history: updatedHistory
                        };
                    }
                }
                return s;
            });
            return { ...prev, students: newStudents };
        });

        // Registrar na timeline de ações e toques do professor
        const studentObj = (currentClass?.students || []).find(s => String(s.id) === String(studentId));
        const studentName = studentObj?.name || 'Estudante';
        const formattedDate = new Date(`${targetDateStr}T12:00:00`).toLocaleDateString('pt-BR');
        logTeacherAction(
            'absent',
            isAbsent ? `Ausência em ${formattedDate}` : `Presença em ${formattedDate}`,
            isAbsent 
                ? `"${studentName}" foi marcado(a) como ausente na data ${formattedDate}. Pontuações coletivas do Desafio da Turma foram desconsideradas.`
                : `"${studentName}" foi marcado(a) novamente como presente na data ${formattedDate}.`,
            {
                studentId,
                studentName,
                isAbsent,
                date: targetDateStr
            }
        );
    };

    const handleHelpResult = ({ helperStudentId, isCorrect, questionText, helpType = 'colleague' }) => {
        if (!winner) return;

        const now = Date.now();
        const helperStudent = helperStudentId ? currentClass?.students?.find(s => String(s.id) === String(helperStudentId)) : null;
        const helperName = helperStudent ? helperStudent.name : null;

        let helpDescription = '';
        if (helperName) {
            helpDescription = `Dupla com ${helperName}`;
        } else if (helpType === 'hint') {
            helpDescription = 'Pista/Dica da Resposta';
        } else if (helpType === 'class_opinion') {
            helpDescription = 'Opinião da Turma';
        } else {
            helpDescription = 'Apoio Pedagógico';
        }

        saveClassUpdates(prev => {
            const newStudents = (prev.students || []).map(s => {
                // Atualiza o aluno sorteado
                if (String(s.id) === String(winner.id)) {
                    const historyEntry = {
                        date: now,
                        dateStr: new Date(now).toISOString().slice(0, 10),
                        sessionId: currentSessionId,
                        activityId: activeActivity?.id || null,
                        gameMode,
                        topic: activeActivity?.topic || activeActivity?.title || 'Sem tema',
                        question: `${questionText} [Ajuda: ${helpDescription}]`,
                        result: isCorrect ? 'help_correct' : 'incorrect',
                        helperName: helperName || undefined,
                        helpType: helpType,
                        helpDescription: helpDescription,
                        hadHelp: true
                    };
                    return {
                        ...s,
                        hits: isCorrect ? (s.hits || 0) + 1 : (s.hits || 0),
                        misses: !isCorrect ? (s.misses || 0) + 1 : (s.misses || 0),
                        helpCount: (s.helpCount || 0) + 1,
                        hadHelp: true,
                        history: [...(s.history || []), historyEntry]
                    };
                }
                // Se houver colega ajudante, registra explicitamente que AJUDOU!
                if (helperStudentId && String(s.id) === String(helperStudentId)) {
                    const helperHistoryEntry = {
                        date: now,
                        dateStr: new Date(now).toISOString().slice(0, 10),
                        sessionId: currentSessionId,
                        activityId: activeActivity?.id || null,
                        gameMode,
                        topic: activeActivity?.topic || activeActivity?.title || 'Sem tema',
                        question: `Ajudou ${winner.name} em: ${questionText}`,
                        result: isCorrect ? 'help_correct' : 'incorrect',
                        helpedStudent: winner.name,
                        isHelperRole: true
                    };
                    return {
                        ...s,
                        hits: isCorrect ? (s.hits || 0) + 1 : (s.hits || 0),
                        helpedCount: (s.helpedCount || 0) + 1,
                        history: [...(s.history || []), helperHistoryEntry]
                    };
                }
                return s;
            });
            return { ...prev, students: newStudents };
        });

        logTeacherAction(
            'eval_help',
            isCorrect ? 'Ajuda com Sucesso (+1 Ponto)' : 'Ajuda Incorreta',
            `"${winner.name}" usou recurso de ajuda (${helpDescription}) e o resultado foi ${isCorrect ? 'Acerto (+1 ponto)' : 'Erro'}.`,
            {
                studentName: winner.name,
                studentId: winner.id,
                helperName: helperName || null,
                helpType,
                isCorrect,
                question: questionText
            }
        );

        if (isCorrect) {
            setUsedQuestions(prev => new Set([...prev, questionText]));
        }
        setShowCard(false);
        setWinner(null);
    };

    const handleSelectGroupManually = (groupId) => {
        const group = activeGroupItems.find(g => g.id === groupId);
        if (!group) return;

        let questionObj = null;
        if (uniqueQuestions.length > 0) {
            const unused = uniqueQuestions.filter(q => !usedQuestions.has(q.question));
            if (unused.length > 0) {
                questionObj = unused[Math.floor(Math.random() * unused.length)];
            } else {
                const gIdx = activeGroupItems.findIndex(g => g.id === groupId);
                questionObj = uniqueQuestions[(gIdx >= 0 ? gIdx : 0) % uniqueQuestions.length];
            }
        }

        const rawQuestion = questionObj ? questionObj.question : 'Nenhuma pergunta gerada para esta sessão.';

        logTeacherAction(
            'manual_select_group',
            'Seleção Manual de Equipe',
            `Professor escolheu diretamente a equipe "${group.name}" para responder.`,
            {
                groupName: group.name,
                groupId: group.id,
                question: rawQuestion
            }
        );

        setWinner({
            ...group,
            question: rawQuestion,
            answer: questionObj?.answer || '',
            difficulty: questionObj?.difficulty || 'Média',
            imageUrl: questionObj?.imageUrl || null,
            questionId: questionObj?.id || null
        });
        setShowCard(true);
        gameAudio.playTick();
    };

    const handleAdjustGroupPoints = (groupId, delta, reason) => {
        const group = currentGroups.find(g => String(g.id) === String(groupId));
        if (!group) return;

        const isMerit = delta > 0;
        const now = Date.now();
        const topic = activeActivity?.topic || 'Sem tema';
        const motiveText = (typeof reason === 'string' && reason !== 'merit' && reason !== 'rule_violation' && reason.trim())
            ? reason
            : (isMerit ? 'Bônus por Mérito' : 'Penalidade: Infringiu regra');

        const label = `[Equipe ${group.name}] ${motiveText} (${delta > 0 ? '+' : ''}${delta} Pts)`;

        const groupHistoryEntry = {
            date: now,
            sessionId: currentSessionId,
            gameMode: 'groups',
            topic,
            question: label,
            result: isMerit ? 'merit' : 'rule_violation',
            pointsDelta: delta,
            isGroupActivity: true
        };

        const studentHistoryEntry = {
            date: now,
            sessionId: currentSessionId,
            gameMode: 'groups',
            topic,
            question: label,
            result: isMerit ? 'group_activity' : 'rule_violation',
            pointsDelta: delta,
            isGroupActivity: true,
            groupId: group.id,
            groupName: group.name
        };

        const memberIdSet = new Set((group.studentIds || []).map(String));

        saveClassUpdates(prev => {
            const updatedGroups = (prev.groups || []).map(g => {
                if (String(g.id) === String(groupId)) {
                    const currentHits = g.hits || 0;
                    return {
                        ...g,
                        hits: Math.max(0, currentHits + delta),
                        history: [...(g.history || []), groupHistoryEntry]
                    };
                }
                return g;
            });

            // ATUALIZAÇÃO CRUCIAL: Reflete a pontuação para cada integrante da equipe
            const updatedStudents = (prev.students || []).map(s => {
                if (memberIdSet.has(String(s.id))) {
                    const currentHits = s.hits || 0;
                    return {
                        ...s,
                        hits: Math.max(0, currentHits + delta),
                        history: [...(s.history || []), studentHistoryEntry]
                    };
                }
                return s;
            });

            return {
                ...prev,
                groups: updatedGroups,
                students: updatedStudents
            };
        });

        logTeacherAction(
            isMerit ? 'group_point_merit' : 'group_point_penalty',
            isMerit ? `Bônus Equipe (+${delta})` : `Penalidade Equipe (-${Math.abs(delta)})`,
            `Equipe "${group.name}" recebeu ${isMerit ? `+${delta} ponto(s) por mérito` : `-${Math.abs(delta)} ponto(s) por infração`}.`,
            {
                groupName: group.name,
                groupId: group.id,
                delta,
                reason
            }
        );

        if (isMerit) {
            gameAudio.playSuccess();
        } else {
            gameAudio.playTick();
        }
    };

    const handleGroupResult = ({ isCorrect, representativeStudent }) => {
        if (!winner) return;
        const targetGroupId = winner.id;
        const groupName = winner.name;
        const memberIdSet = new Set((winner.studentIds || []).map(String));
        const now = Date.now();
        const topic = activeActivity?.topic || 'Sem tema';
        const questionText = winner.question;

        const groupHistoryEntry = {
            date: now,
            dateStr: new Date(now).toISOString().slice(0, 10),
            sessionId: currentSessionId,
            activityId: activeActivity?.id || null,
            gameMode: 'groups',
            topic: topic,
            question: questionText,
            result: isCorrect ? 'correct' : 'incorrect',
            representative: representativeStudent?.name || null,
            isGroupActivity: true,
            pointsDelta: isCorrect ? 1 : 0
        };

        const studentHistoryEntry = {
            date: now,
            dateStr: new Date(now).toISOString().slice(0, 10),
            sessionId: currentSessionId,
            activityId: activeActivity?.id || null,
            gameMode: 'groups',
            topic: topic,
            question: `[Equipe ${groupName}] ${questionText}`,
            result: isCorrect ? 'group_activity' : 'incorrect',
            isGroupActivity: true,
            groupId: targetGroupId,
            groupName: groupName,
            representative: representativeStudent?.name || null,
            pointsDelta: isCorrect ? 1 : 0
        };

        saveClassUpdates(prev => {
            const updatedGroups = (prev.groups || []).map(g => {
                if (String(g.id) === String(targetGroupId)) {
                    return {
                        ...g,
                        hits: isCorrect ? (g.hits || 0) + 1 : (g.hits || 0),
                        misses: !isCorrect ? (g.misses || 0) + 1 : (g.misses || 0),
                        history: [...(g.history || []), groupHistoryEntry]
                    };
                }
                return g;
            });

            // ATUALIZAÇÃO CRUCIAL: Reflete a pontuação para cada integrante da equipe
            const updatedStudents = (prev.students || []).map(s => {
                if (memberIdSet.has(String(s.id))) {
                    return {
                        ...s,
                        hits: isCorrect ? (s.hits || 0) + 1 : (s.hits || 0),
                        misses: !isCorrect ? (s.misses || 0) + 1 : (s.misses || 0),
                        history: [...(s.history || []), studentHistoryEntry]
                    };
                }
                return s;
            });

            return {
                ...prev,
                groups: updatedGroups,
                students: updatedStudents
            };
        });

        logTeacherAction(
            isCorrect ? 'group_correct' : 'group_incorrect',
            isCorrect ? 'Equipe Acertou (+1 Ponto)' : 'Equipe Errou',
            `Equipe "${groupName}" ${isCorrect ? 'acertou (+1 ponto)' : 'errou'} a pergunta${representativeStudent?.name ? ` (porta-voz: ${representativeStudent.name})` : ''}.`,
            {
                groupName,
                groupId: targetGroupId,
                representative: representativeStudent?.name || null,
                isCorrect,
                question: questionText
            }
        );

        setUsedQuestions(prev => new Set([...prev, questionText]));
        if (isCorrect) {
            gameAudio.playSuccess();
        } else {
            gameAudio.playTick();
        }

        setShowCard(false);
        setWinner(null);
    };

    const handleGroupSlotResult = (slotIndex, isCorrect) => {
        const slot = groupRoundSlots?.[slotIndex];
        if (!slot || slot.result !== null) return;

        // Registra no histórico via handleGroupResult
        const fakeWinner = {
            id: slot.group.id,
            name: slot.group.name,
            studentIds: slot.group.studentIds || [],
            question: slot.question
        };
        // Salva direto (sem passar por setWinner) chamando a lógica interna
        const targetGroupId = slot.group.id;
        const groupName = slot.group.name;
        const memberIdSet = new Set((slot.group.studentIds || []).map(String));
        const now = Date.now();
        const topic = activeActivity?.topic || 'Sem tema';

        const groupHistoryEntry = {
            date: now,
            dateStr: new Date(now).toISOString().slice(0, 10),
            sessionId: currentSessionId,
            activityId: activeActivity?.id || null,
            gameMode: 'groups',
            topic,
            question: slot.question,
            result: isCorrect ? 'correct' : 'incorrect',
            isGroupActivity: true,
            pointsDelta: isCorrect ? 1 : 0
        };
        const studentHistoryEntry = {
            date: now,
            dateStr: new Date(now).toISOString().slice(0, 10),
            sessionId: currentSessionId,
            activityId: activeActivity?.id || null,
            gameMode: 'groups',
            topic,
            question: `[Equipe ${groupName}] ${slot.question}`,
            result: isCorrect ? 'group_activity' : 'incorrect',
            isGroupActivity: true,
            groupId: targetGroupId,
            groupName,
            pointsDelta: isCorrect ? 1 : 0
        };

        saveClassUpdates(prev => {
            const updatedGroups = (prev.groups || []).map(g => {
                if (String(g.id) === String(targetGroupId)) {
                    return {
                        ...g,
                        hits: isCorrect ? (g.hits || 0) + 1 : (g.hits || 0),
                        misses: !isCorrect ? (g.misses || 0) + 1 : (g.misses || 0),
                        history: [...(g.history || []), groupHistoryEntry]
                    };
                }
                return g;
            });
            const updatedStudents = (prev.students || []).map(s => {
                if (memberIdSet.has(String(s.id))) {
                    return {
                        ...s,
                        hits: isCorrect ? (s.hits || 0) + 1 : (s.hits || 0),
                        misses: !isCorrect ? (s.misses || 0) + 1 : (s.misses || 0),
                        history: [...(s.history || []), studentHistoryEntry]
                    };
                }
                return s;
            });
            return { ...prev, groups: updatedGroups, students: updatedStudents };
        });

        logTeacherAction(
            isCorrect ? 'group_correct' : 'group_incorrect',
            isCorrect ? `Equipe Acertou (+1)` : 'Equipe Errou',
            `[Rodada Simultânea] Equipe "${groupName}" ${isCorrect ? 'acertou' : 'errou'}: "${slot.question.slice(0, 50)}"`,
            { groupName, groupId: targetGroupId, isCorrect, question: slot.question }
        );

        if (isCorrect) gameAudio.playSuccess(); else gameAudio.playTick();

        // Atualiza o slot com o resultado
        setGroupRoundSlots(prev => prev.map((s, i) => i === slotIndex ? { ...s, result: isCorrect ? 'correct' : 'incorrect' } : s));
    };

    const handleChangeGroupSlotQuestion = (slotIndex, newQ) => {
        if (!newQ || !groupRoundSlots?.[slotIndex]) return;
        setGroupRoundSlots(prev => prev.map((s, i) =>
            i === slotIndex ? { ...s, question: newQ.question, answer: newQ.answer || '', difficulty: newQ.difficulty || 'Média', imageUrl: newQ.imageUrl || null } : s
        ));
    };

    const handleClearGroupRound = () => {
        setGroupRoundSlots(null);
        setActiveGroupTab(0);
    };

    const handleTimerExplode = () => {
        logTeacherAction(
            'bomb_exploded',
            'Tempo Esgotado (Bomba Explodiu!)',
            `O tempo limite do cronômetro bomba esgotou enquanto "${winner?.name || 'aluno'}" respondia à pergunta.`,
            {
                studentName: winner?.name,
                studentId: winner?.id,
                question: winner?.question
            }
        );
    };

    const handleRevealAnswer = () => {
        logTeacherAction(
            'reveal_answer',
            'Resposta Revelada',
            `Professor revelou o gabarito da resposta para a turma: "${winner?.answer || 'Resposta'}" (Pergunta: "${winner?.question?.slice(0, 50)}...")`,
            {
                studentName: winner?.name,
                question: winner?.question,
                answer: winner?.answer
            }
        );
    };

    const handleRevealHint = () => {
        logTeacherAction(
            'reveal_hint',
            'Pista/Dica Revelada',
            `Professor exibiu a dica/pista da resposta para "${winner?.name || 'aluno'}".`,
            {
                studentName: winner?.name,
                question: winner?.question
            }
        );
    };

    const handleReactivate = (id) => {
        handleToggleStudentActivityStatus(id, 'activate');
    };

    const handleResetUsedQuestions = () => {
        setUsedQuestions(new Set());
    };

    const handleDownloadCSV = () => {
        if (!currentClass) return;
        
        let csvContent = "Nome do Aluno,Equipe/Grupo,Acertos/Pontos,Erros,Méritos (+1),Infrações Regra (-1),TEVE AJUDA (Qtd),Detalhes de TEVE AJUDA,AJUDOU (Qtd),Detalhes de AJUDOU,Atividades em Grupo (Qtd),Status na Atividade,Última Pergunta Respondida\n";
        
        currentClass.students.forEach(s => {
            const history = s.history || [];
            const helpReceivedEntries = history.filter(h => 
                h.result === 'help_correct' || h.hadHelp || h.helperName || (h.question && h.question.includes('[Ajuda:')) || (h.question && h.question.includes('(com ajuda'))
            );
            const helpedOthersEntries = history.filter(h => h.helpedStudent || h.isHelperRole);
            const groupEntries = history.filter(h => h.isGroupActivity || h.result === 'group_activity');
            const helpCount = Math.max(helpReceivedEntries.length, s.helpCount || 0);
            const helpedCount = Math.max(helpedOthersEntries.length, s.helpedCount || 0);
            const groupCount = groupEntries.length;
            const studentGroup = studentToGroupMap.get(s.id) || studentToGroupMap.get(String(s.id));
            
            const lastQuestion = history.length > 0 
                ? history[history.length - 1].question.replace(/"/g, '""')
                : 'Nenhuma';

            const helpDetailsStr = helpReceivedEntries.length > 0
                ? helpReceivedEntries.map((h, i) => {
                    const desc = h.helpDescription || (h.helperName ? `Dupla com ${h.helperName}` : 'Apoio pedagógico');
                    return `${i + 1}. ${desc}`;
                }).join('; ')
                : 'Nenhuma ajuda recebida';

            const helpedDetailsStr = helpedOthersEntries.length > 0
                ? helpedOthersEntries.map((h, i) => {
                    return `${i + 1}. Ajudou ${h.helpedStudent || 'colega'}`;
                }).join('; ')
                : 'Não atuou como ajudante';
            
            const meritsCount = history.filter(h => h.result === 'merit').length;
            const violationsCount = history.filter(h => h.result === 'rule_violation' || h.result === 'not_executed').length;
            const statusStr = s.status === 'active' ? 'Ativo na Roleta' : s.status === 'removed' ? 'Fora da Roleta (Disponível p/ Ajuda)' : 'Ausente';
            
            csvContent += `"${s.name}","${studentGroup ? studentGroup.name : 'Sem Equipe'}",${s.hits || 0},${s.misses || 0},${meritsCount},${violationsCount},${helpCount},"${helpDetailsStr.replace(/"/g, '""')}",${helpedCount},"${helpedDetailsStr.replace(/"/g, '""')}",${groupCount},"${statusStr}","${lastQuestion}"\n`;
        });

        // Adicionar Placar de Equipes ao final do relatório caso existam grupos
        if (currentGroups.length > 0) {
            csvContent += "\n\n--- PLACAR DE EQUIPES / GRUPOS ---\n";
            csvContent += "Equipe,Pontos/Acertos,Erros,Total Membros,Alunos Integrantes\n";
            currentGroups.forEach(g => {
                const memberIdSet = new Set((g.studentIds || []).map(String));
                const memberNames = (currentClass.students || [])
                    .filter(s => memberIdSet.has(String(s.id)))
                    .map(s => s.name)
                    .join(', ');
                csvContent += `"${g.name}",${g.hits || 0},${g.misses || 0},${memberIdSet.size},"${memberNames.replace(/"/g, '""')}"\n`;
            });
        }

        // Adiciona BOM (\uFEFF) para garantir abertura com acentos corretos no Excel (padrão brasileiro)
        const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `Relatorio_Detalhado_Turma_${currentClass.name.replace(/\s+/g, '_')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleSheetsImport = useCallback((importedQuestions) => {
        if (!activeActivity?.id) return;
        const existing = activeActivity.questions || [];
        updateActivityData(activeActivity.id, {
            questions: [...existing, ...importedQuestions]
        });
        gameAudio?.playSuccess?.();
    }, [activeActivity, updateActivityData]);

    const handleCreateRouletteFromSheets = useCallback((importedQuestions, sheetLabel) => {
        addActivityTab({
            title: sheetLabel ? `Roleta: ${sheetLabel}` : 'Roleta (Planilha)',
            type: 'roulette',
            content: `Roleta criada a partir do Google Sheets`,
            questions: importedQuestions,
        });
    }, [addActivityTab]);

    return {
        handleChangeWinnerStudent,
        handleSelectStudentManually,
        handleToggleStudentActivityStatus,
        handleActivateAll,
        handleDeactivateAll,
        handleAdjustPoints,
        handleChangeWinnerQuestion,
        handleSpinAgain,
        handleResult,
        handleBatchResult,
        handleToggleStudentAbsent,
        handleHelpResult,
        handleSelectGroupManually,
        handleAdjustGroupPoints,
        handleGroupResult,
        handleGroupSlotResult,
        handleChangeGroupSlotQuestion,
        handleClearGroupRound,
        handleTimerExplode,
        handleRevealAnswer,
        handleRevealHint,
        handleReactivate,
        handleResetUsedQuestions,
        handleDownloadCSV,
        handleSheetsImport,
        handleCreateRouletteFromSheets,
    };
};
