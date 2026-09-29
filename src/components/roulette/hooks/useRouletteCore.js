import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useActivity } from '../../../contexts/ActivityContext';
import { useGemini } from '../../../contexts/GeminiContext';
import { useCurrentClass } from './useCurrentClass';
import { gameAudio } from '../../../utils/gameAudio';
import { useRouletteHandlers } from './useRouletteHandlers';

export const STAGE_THEMES = {
    slot_machine: { container: 'bg-gradient-to-b from-slate-950 via-red-950/40 to-slate-950 border-amber-500/40 shadow-[0_25px_60px_rgba(245,158,11,0.18)]', spotlight: 'radial-gradient(circle at center, rgba(245,158,11,0.18) 0%, transparent 70%)', button: 'bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-500 text-slate-950 font-black shadow-[0_10px_25px_rgba(245,158,11,0.4)] border-2 border-yellow-200 hover:brightness-110', label: 'PUXAR ALAVANCA / GIRAR! 🪙', spinningLabel: 'Girando os Rolos...' },
    marquee: { container: 'bg-gradient-to-b from-slate-950 via-slate-900 to-black border-slate-700/80 shadow-[0_25px_60px_rgba(0,0,0,0.6)]', spotlight: 'radial-gradient(circle at center, rgba(251,191,36,0.14) 0%, transparent 70%)', button: 'bg-gradient-to-r from-amber-600 via-orange-600 to-amber-600 text-white font-black shadow-amber-600/30 border-2 border-amber-400 hover:brightness-110', label: 'SORTEAR NO LETREIRO! 🔤', spinningLabel: 'Alternando Nomes...' },
    classic: { container: 'bg-gradient-to-b from-emerald-950 via-slate-950 to-emerald-950 border-emerald-500/40 shadow-[0_25px_60px_rgba(16,185,129,0.15)]', spotlight: 'radial-gradient(circle at center, rgba(253,224,71,0.16) 0%, transparent 70%)', button: 'bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 text-slate-950 font-black shadow-amber-500/30 border-2 border-amber-300 hover:brightness-110', label: 'GIRAR ROLETA VEGAS! 🎰', spinningLabel: 'Girando a Roda...' },
    cyberpunk: { container: 'bg-gradient-to-b from-slate-950 via-purple-950/40 to-slate-950 border-cyan-500/40 shadow-[0_25px_60px_rgba(6,182,212,0.22)]', spotlight: 'radial-gradient(circle at center, rgba(6,182,212,0.2) 0%, transparent 70%)', button: 'bg-gradient-to-r from-cyan-500 via-fuchsia-600 to-cyan-500 text-white font-black shadow-[0_10px_25px_rgba(6,182,212,0.4)] border-2 border-cyan-300 hover:brightness-110', label: 'LOCK TARGET / SCAN! ⚡', spinningLabel: 'Escaneando Alunos...' },
    arcade: { container: 'bg-gradient-to-b from-slate-950 via-indigo-950/50 to-black border-yellow-400/40 shadow-[0_25px_60px_rgba(250,204,21,0.18)]', spotlight: 'radial-gradient(circle at center, rgba(250,204,21,0.15) 0%, transparent 70%)', button: 'bg-yellow-400 text-black font-black border-4 border-black shadow-[5px_5px_0px_#000] hover:bg-yellow-300', label: 'PRESS START / GIRAR! 👾', spinningLabel: 'Player 1 Sorteando...' },
    cosmic: { container: 'bg-gradient-to-b from-slate-950 via-purple-950/60 to-indigo-950 border-purple-500/40 shadow-[0_25px_60px_rgba(168,85,247,0.22)]', spotlight: 'radial-gradient(circle at center, rgba(168,85,247,0.2) 0%, transparent 70%)', button: 'bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 text-white font-black shadow-purple-600/30 border-2 border-purple-300 hover:brightness-110', label: 'INVOCAR ASTROS / GIRAR! 🌌', spinningLabel: 'Alinhando os Astros...' }
};

export const useRouletteCore = () => {
    const { activeActivity, classes, setClasses, updateActivityData, addActivityTab, tabs } = useActivity();
    const { geminiService, selectedModel } = useGemini();
    const [showTransitionModal, setShowTransitionModal] = useState(false);
    const [showClassesModal, setShowClassesModal] = useState(false);
    const [showGroupsModal, setShowGroupsModal] = useState(false);
    const [showClassReportModal, setShowClassReportModal] = useState(false);
    const [showSheetsModal, setShowSheetsModal] = useState(false);
    const [currentSessionId] = useState(() => 'sess_' + Date.now());
    const [sessionStartTime] = useState(() => Date.now());

    // Histórico detalhado de ações e toques nos botões da roleta nesta aula/atividade
    const [interactionLogs, setInteractionLogs] = useState(() => {
        return Array.isArray(activeActivity?.interactionLogs) ? activeActivity.interactionLogs : [];
    });

    useEffect(() => {
        if (activeActivity?.interactionLogs && Array.isArray(activeActivity.interactionLogs)) {
            setInteractionLogs(activeActivity.interactionLogs);
        }
    }, [activeActivity?.id]);
    
    // Modo de jogo da Roleta: 'individual' (alunos) | 'groups' (equipes)
    const [gameMode, setGameMode] = useState(() => {
        return activeActivity?.gameMode || 'individual';
    });

    // Aba de visualização do placar lateral: 'students' | 'groups'
    const [placarTab, setPlacarTab] = useState(() => {
        return activeActivity?.gameMode === 'groups' ? 'groups' : 'students';
    });

    // Registra todos os toques nos botões da roleta, trocas de aluno, trocas de pergunta, ausências e decisões
    const logTeacherAction = useCallback((type, title, description, details = {}) => {
        const now = Date.now();
        const dateObj = new Date(now);
        const timeFormatted = dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        
        // Calcula tempo decorrido desde o início da sessão da aula (+05:23)
        const elapsedMs = Math.max(0, now - (sessionStartTime || now));
        const elapsedMinutes = Math.floor(elapsedMs / 60000);
        const elapsedSeconds = Math.floor((elapsedMs % 60000) / 1000);
        const elapsedFormatted = `+${elapsedMinutes.toString().padStart(2, '0')}:${elapsedSeconds.toString().padStart(2, '0')}`;

        // Categoria para filtros na interface
        let category = 'system';
        if (type.startsWith('swap')) category = 'swap';
        else if (type.includes('spin')) category = 'spin';
        else if (type.includes('student') || type.includes('absent') || type.includes('roster') || type.includes('activate')) category = 'roster';
        else if (type.includes('correct') || type.includes('incorrect') || type.includes('help') || type.includes('batch') || type.includes('group')) category = 'eval';
        else if (type.includes('point') || type.includes('merit') || type.includes('penalty')) category = 'point';

        const newLogEntry = {
            id: `act_${now}_${Math.random().toString(36).slice(2, 7)}`,
            timestamp: now,
            timeFormatted,
            elapsedFormatted,
            sessionId: currentSessionId,
            activityId: activeActivity?.id || null,
            topic: activeActivity?.topic || activeActivity?.title || 'Sem tema',
            gameMode,
            type,
            category,
            title,
            description,
            ...details
        };

        setInteractionLogs(prev => {
            const updated = [newLogEntry, ...(Array.isArray(prev) ? prev : [])].slice(0, 500);
            if (activeActivity?.id && updateActivityData) {
                updateActivityData(activeActivity.id, { interactionLogs: updated });
            }
            return updated;
        });
    }, [currentSessionId, sessionStartTime, gameMode, activeActivity?.id, updateActivityData]);

    // Estado de visibilidade do Sidebar retrátil de alunos e placar (abre para a direita a partir da esquerda)
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // O ID da turma e os dados vêm da aba ativa
    const classId = activeActivity?.classId;
    
    // Procura a turma vinculada, ou usa os dados próprios da aba (classData), ou primeira turma disponível, ou gera turma automática
    const currentClass = useCurrentClass(classes, classId, activeActivity);

    // Sincroniza e registra a turma no estado global de turmas do professor
    useEffect(() => {
        if (currentClass) {
            const exists = (classes || []).some(c => c.id === currentClass.id);
            if (!exists) {
                setClasses(prev => {
                    if (prev.some(c => c.id === currentClass.id)) return prev;
                    return [...prev, currentClass];
                });
            }
            // Só define o classId da atividade se ela NÃO tiver nenhum classId definido ainda.
            // NUNCA sobrescreve um classId existente de outra turma.
            if (activeActivity?.id && !activeActivity.classId && currentClass.id) {
                updateActivityData(activeActivity.id, { 
                    classId: currentClass.id,
                    classData: currentClass
                });
            }
        }
    }, [currentClass, classes, activeActivity?.id, activeActivity?.classId, setClasses, updateActivityData]);

    // MIGRATION: Se a aba foi criada antes do sistema de Turmas (legado), ela terá 'items' mas não 'classId'
    useEffect(() => {
        if (!classId && activeActivity?.items && activeActivity.items.length > 0) {
            console.log("Migrando atividade legada para nova estrutura de Turmas...");
            
            const newClassId = 'legacy_' + Date.now();
            const newClass = {
                id: newClassId,
                name: 'Turma Recuperada (Antiga)',
                students: activeActivity.items.map(item => ({
                    id: item.id || Date.now().toString() + Math.random().toString(36).substr(2, 5),
                    name: item.name,
                    status: item.active !== false ? 'active' : 'removed',
                    hits: item.hits || 0,
                    misses: item.misses || 0,
                    history: []
                }))
            };
            
            // Salvar a nova turma globalmente
            setClasses(prev => [...prev, newClass]);
            
            // Atualizar a aba atual para apontar para esta nova turma e salvar as perguntas
            updateActivityData(activeActivity.id, {
                classId: newClassId,
                questions: activeActivity.items.map(item => ({
                    name: item.name,
                    question: item.question
                })),
                items: undefined // Remove a estrutura antiga
            });
        }
    }, [activeActivity, classId, setClasses, updateActivityData]);
    
    // Sorteio
    const [spinning, setSpinning] = useState(false);
    const [winner, setWinner] = useState(null); // O item sorteado (modo individual)
    const [showCard, setShowCard] = useState(false); // Mostra o card de resultado

    // Sincroniza o estado "winner" caso a pergunta correspondente seja editada no painel principal
    useEffect(() => {
        if (winner && winner.question && activeActivity?.questions) {
            const updatedQ = activeActivity.questions.find(q => q.question === winner.question);
            if (updatedQ) {
                if (updatedQ.imageUrl !== winner.imageUrl || updatedQ.answer !== winner.answer || updatedQ.difficulty !== winner.difficulty) {
                    setWinner(prev => ({
                        ...prev,
                        imageUrl: updatedQ.imageUrl || null,
                        answer: updatedQ.answer || '',
                        difficulty: updatedQ.difficulty || 'Média'
                    }));
                }
            }
        }
    }, [activeActivity?.questions, winner?.question]);

    // Modo Rodada Simultânea de Equipes
    // null = sem rodada ativa | Array<{ group, question, answer, difficulty, imageUrl, result: null|'correct'|'incorrect' }>
    const [groupRoundSlots, setGroupRoundSlots] = useState(null);

    // Sincroniza o estado das rodadas de equipe caso alguma pergunta seja editada
    useEffect(() => {
        if (groupRoundSlots && groupRoundSlots.length > 0 && activeActivity?.questions) {
            let hasChanges = false;
            const newSlots = groupRoundSlots.map(slot => {
                const updatedQ = activeActivity.questions.find(q => q.question === slot.question);
                if (updatedQ) {
                    if (updatedQ.imageUrl !== slot.imageUrl || updatedQ.answer !== slot.answer || updatedQ.difficulty !== slot.difficulty) {
                        hasChanges = true;
                        return {
                            ...slot,
                            imageUrl: updatedQ.imageUrl || null,
                            answer: updatedQ.answer || '',
                            difficulty: updatedQ.difficulty || 'Média'
                        };
                    }
                }
                return slot;
            });
            if (hasChanges) {
                setGroupRoundSlots(newSlots);
            }
        }
    }, [activeActivity?.questions]);

    const [activeGroupTab, setActiveGroupTab] = useState(0);
    // true = mostra o diálogo de confirmação ao tentar girar com rodada pendente
    const [showGroupRoundConfirm, setShowGroupRoundConfirm] = useState(false);
    
    // Preferência de Estilo de Roleta (persiste em localStorage e na atividade)
    const [rouletteStyle, setRouletteStyle] = useState(() => {
        if (activeActivity?.rouletteStyle) {
            return activeActivity.rouletteStyle;
        }
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('preferred_roulette_style');
            if (saved) return saved;
        }
        return 'slot_machine';
    });

    const handleSelectStyle = (styleId) => {
        setRouletteStyle(styleId);
        if (typeof window !== 'undefined') {
            localStorage.setItem('preferred_roulette_style', styleId);
        }
        if (activeActivity && updateActivityData) {
            updateActivityData(activeActivity.id, { rouletteStyle: styleId });
        }
    };

    const currentTheme = STAGE_THEMES[rouletteStyle] || STAGE_THEMES.slot_machine;
    
    // Rastreamento de perguntas usadas nesta sessão para evitar repetição
    const [usedQuestions, setUsedQuestions] = useState(() => new Set());

    // Rastreamento de quantidade de sorteios de cada aluno e de cada pergunta (Modo 2: Probabilidade Decrescente / Decaimento Suave)
    const [studentDrawCounts, setStudentDrawCounts] = useState(() => {
        return activeActivity?.studentDrawCounts || {};
    });

    const [questionDrawCounts, setQuestionDrawCounts] = useState(() => {
        return activeActivity?.questionDrawCounts || {};
    });

    // Função para calcular o peso de um item com base na quantidade de sorteios no ciclo (Modo 2: W = 100 / (1 + 4 * d))
    const getItemWeight = useCallback((drawCount = 0) => {
        const k = 4; // Fator de decaimento suave
        return 100 / (1 + k * drawCount);
    }, []);

    // Sorteia um aluno ponderado do pool de alunos ativos
    const pickWeightedStudent = useCallback((candidates, drawCountsMap) => {
        if (!candidates || candidates.length === 0) return null;
        if (candidates.length === 1) return candidates[0];

        const weights = candidates.map(c => getItemWeight(drawCountsMap[String(c.id)] || 0));
        const totalWeight = weights.reduce((acc, w) => acc + w, 0);

        if (totalWeight <= 0) {
            return candidates[Math.floor(Math.random() * candidates.length)];
        }

        let randomVal = Math.random() * totalWeight;
        for (let i = 0; i < candidates.length; i++) {
            randomVal -= weights[i];
            if (randomVal <= 0) {
                return candidates[i];
            }
        }
        return candidates[candidates.length - 1];
    }, [getItemWeight]);

    // Sorteia uma pergunta ponderada do banco de perguntas
    const pickWeightedQuestion = useCallback((questionsList, drawCountsMap) => {
        if (!questionsList || questionsList.length === 0) return null;
        if (questionsList.length === 1) return questionsList[0];

        const weights = questionsList.map(q => {
            const key = q.id || q.question;
            return getItemWeight(drawCountsMap[key] || 0);
        });
        const totalWeight = weights.reduce((acc, w) => acc + w, 0);

        if (totalWeight <= 0) {
            return questionsList[Math.floor(Math.random() * questionsList.length)];
        }

        let randomVal = Math.random() * totalWeight;
        for (let i = 0; i < questionsList.length; i++) {
            randomVal -= weights[i];
            if (randomVal <= 0) {
                return questionsList[i];
            }
        }
        return questionsList[questionsList.length - 1];
    }, [getItemWeight]);

    // Configuração do professor: exibir ou ocultar a dificuldade das perguntas
    const [showDifficulty, setShowDifficulty] = useState(() => {
        if (activeActivity?.showDifficulty !== undefined) {
            return activeActivity.showDifficulty;
        }
        return true;
    });

    const handleToggleDifficulty = () => {
        const next = !showDifficulty;
        setShowDifficulty(next);
        logTeacherAction(
            'toggle_difficulty',
            next ? 'Dificuldade Exibida' : 'Dificuldade Ocultada',
            `Professor ${next ? 'ativou a exibição' : 'ocultou a exibição'} do nível de dificuldade das perguntas no card.`,
            {}
        );
        if (activeActivity && updateActivityData) {
            updateActivityData(activeActivity.id, { showDifficulty: next });
        }
    };

    // Modal de Histórico e Edição
    const [historyStudent, setHistoryStudent] = useState(null);
    const [showQuestionsEditor, setShowQuestionsEditor] = useState(false);

    // Lista única de perguntas disponíveis para esta atividade
    const uniqueQuestions = useMemo(() => {
        const questions = activeActivity?.questions || [];
        const uniqueMap = new Map();
        questions.forEach((q, idx) => {
            if (q && q.question && !uniqueMap.has(q.question)) {
                uniqueMap.set(q.question, {
                    id: q.id || `q_${idx}_${Date.now()}`,
                    question: (q.question || '').replace(/(\d+)\.(\d+)/g, '$1,$2'),
                    answer: q.answer ? q.answer.replace(/(\d+)\.(\d+)/g, '$1,$2') : '',
                    difficulty: q.difficulty || (idx % 3 === 0 ? 'Fácil' : idx % 3 === 1 ? 'Média' : 'Difícil'),
                    imageUrl: q.imageUrl || null
                });
            }
        });
        return Array.from(uniqueMap.values());
    }, [activeActivity?.questions]);

    // Conjunto de IDs de alunos removidos da roleta especificamente para esta atividade (aba)
    const activityRemovedIds = useMemo(() => {
        return new Set((activeActivity?.removedStudentIds || []).map(String));
    }, [activeActivity?.removedStudentIds]);

    // Grupos cadastrados na turma atual
    const currentGroups = useMemo(() => {
        return (currentClass?.groups && Array.isArray(currentClass.groups)) ? currentClass.groups : [];
    }, [currentClass?.groups]);

    // Mapeamento de cada aluno para seu respectivo grupo (compatível com ID numérico e string)
    const studentToGroupMap = useMemo(() => {
        const map = new Map();
        currentGroups.forEach(g => {
            (g.studentIds || []).forEach(sId => {
                map.set(sId, g);
                map.set(String(sId), g);
            });
        });
        return map;
    }, [currentGroups]);

    // Combina os dados persistentes da turma com as perguntas geradas para esta aba
    const combinedItems = useMemo(() => {
        if (!currentClass) return [];
        
        return (currentClass.students || []).map((student, idx) => {
            const questionObj = uniqueQuestions.length > 0 ? uniqueQuestions[idx % uniqueQuestions.length] : null;
            const rawQuestion = questionObj ? questionObj.question : 'Nenhuma pergunta gerada para esta sessão.';
            
            // O status é específico desta atividade:
            // 1. Se estiver 'absent' no cadastro global, permanece 'absent'
            // 2. Se estiver na lista de removidos desta atividade específica, fica 'removed'
            // 3. Caso contrário, fica 'active'
            let effectiveStatus = student.status === 'absent' ? 'absent' : 'active';
            if (activityRemovedIds.has(String(student.id))) {
                effectiveStatus = 'removed';
            }

            const studentGroup = studentToGroupMap.get(student.id) || studentToGroupMap.get(String(student.id));
                
            return {
                ...student,
                status: effectiveStatus,
                groupName: studentGroup?.name || null,
                groupColor: studentGroup?.color || null,
                groupId: studentGroup?.id || null,
                question: rawQuestion,
                answer: questionObj ? questionObj.answer : '',
                difficulty: questionObj ? questionObj.difficulty : 'Média',
                imageUrl: questionObj ? questionObj.imageUrl : null,
                questionId: questionObj ? questionObj.id : null
            };
        });
    }, [currentClass, uniqueQuestions, activityRemovedIds, studentToGroupMap]);

    const activeItems = useMemo(() => combinedItems.filter(i => i.status === 'active'), [combinedItems]);
    // Alunos disponíveis para ajudar (inclui os que foram retirados da roleta ou já acertaram)
    const availableHelpers = useMemo(() => combinedItems.filter(i => i.status !== 'absent'), [combinedItems]);

    // Equipes/Grupos ativos preparados para a roleta e placar
    const activeGroupItems = useMemo(() => {
        if (!currentClass || currentGroups.length === 0) return [];
        return currentGroups.map((g, idx) => {
            const memberIdSet = new Set((g.studentIds || []).map(String));
            const members = (currentClass.students || []).filter(s => memberIdSet.has(String(s.id)));
            const questionObj = uniqueQuestions.length > 0 ? uniqueQuestions[idx % uniqueQuestions.length] : null;
            const rawQuestion = questionObj ? questionObj.question : 'Nenhuma pergunta gerada para esta sessão.';

            return {
                id: g.id,
                name: g.name,
                color: g.color || '#6366f1',
                isGroup: true,
                studentIds: g.studentIds || [],
                members: members,
                hits: g.hits || 0,
                misses: g.misses || 0,
                history: g.history || [],
                question: rawQuestion,
                answer: questionObj ? questionObj.answer : '',
                difficulty: questionObj ? questionObj.difficulty : 'Média',
                imageUrl: questionObj ? questionObj.imageUrl : null,
                questionId: questionObj ? questionObj.id : null
            };
        });
    }, [currentClass, currentGroups, uniqueQuestions]);

    // Função mestra unificada para salvar alterações na turma (atualiza classes globalmente e activeActivity.classData)
    const saveClassUpdates = (updater) => {
        const targetClassId = currentClass?.id || classId;
        if (!targetClassId || !currentClass) return;

        const updatedClass = updater(currentClass);

        setClasses(prevClasses => {
            const safePrev = Array.isArray(prevClasses) ? prevClasses : [];
            const exists = safePrev.some(c => String(c.id) === String(targetClassId));
            if (exists) {
                return safePrev.map(c => String(c.id) === String(targetClassId) ? updatedClass : c);
            } else {
                return [...safePrev, updatedClass];
            }
        });

        if (activeActivity?.id && updateActivityData) {
            updateActivityData(activeActivity.id, {
                classId: targetClassId,
                classData: updatedClass
            });
        }
    };

    // Reconciliação inteligente: Garante que pontos e histórico de equipes anteriores reflitam na pontuação individual
    useEffect(() => {
        if (!currentClass || !currentClass.groups || currentClass.groups.length === 0) return;
        
        let needsSync = false;
        const reconciledStudents = (currentClass.students || []).map(student => {
            const studentIdStr = String(student.id);
            const studentGroup = (currentClass.groups || []).find(g => 
                (g.studentIds || []).some(id => String(id) === studentIdStr)
            );
            if (!studentGroup || !studentGroup.history || studentGroup.history.length === 0) {
                return student;
            }

            const currentHistory = student.history || [];
            const missingEntries = studentGroup.history.filter(gh => {
                return !currentHistory.some(sh => 
                    sh.date === gh.date || 
                    (sh.isGroupActivity && (sh.groupId === studentGroup.id || sh.question?.includes(studentGroup.name)))
                );
            });

            if (missingEntries.length > 0) {
                needsSync = true;
                let addedHits = 0;
                let addedMisses = 0;
                const newHistoryEntries = missingEntries.map(gh => {
                    const isWin = gh.result === 'correct' || gh.result === 'group_correct' || gh.result === 'group_activity' || (gh.pointsDelta && gh.pointsDelta > 0);
                    if (isWin) {
                        addedHits += (gh.pointsDelta !== undefined ? gh.pointsDelta : 1);
                    } else if (gh.result === 'incorrect' || gh.result === 'group_incorrect') {
                        addedMisses += 1;
                    }
                    return {
                        date: gh.date || Date.now(),
                        topic: gh.topic || 'Sem tema',
                        question: gh.question?.startsWith('[Equipe') ? gh.question : `[Equipe ${studentGroup.name}] ${gh.question}`,
                        result: isWin ? 'group_activity' : 'incorrect',
                        isGroupActivity: true,
                        groupId: studentGroup.id,
                        groupName: studentGroup.name,
                        representative: gh.representative || null,
                        pointsDelta: isWin ? (gh.pointsDelta !== undefined ? gh.pointsDelta : 1) : 0
                    };
                });

                return {
                    ...student,
                    hits: Math.max(0, (student.hits || 0) + addedHits),
                    misses: Math.max(0, (student.misses || 0) + addedMisses),
                    history: [...currentHistory, ...newHistoryEntries]
                };
            }

            return student;
        });

        if (needsSync) {
            saveClassUpdates(prev => ({
                ...prev,
                students: reconciledStudents
            }));
        }
    }, [currentClass?.groups, currentClass?.id]);

    // Salvar grupos na turma e no estado da atividade
    const handleSaveGroups = (updatedGroups) => {
        saveClassUpdates(prev => ({
            ...prev,
            groups: updatedGroups
        }));
    };

    // Salvar estado do aluno na Turma Global
    const updateStudentInClass = (studentId, updates, historyEntry = null) => {
        saveClassUpdates(prev => {
            const newStudents = (prev.students || []).map(s => {
                if (String(s.id) === String(studentId)) {
                    const updatedStudent = { ...s, ...updates };
                    if (historyEntry) {
                        updatedStudent.history = [...(s.history || []), historyEntry];
                    }
                    return updatedStudent;
                }
                return s;
            });
            return { ...prev, students: newStudents };
        });
    };

    // Atualiza um objeto completo de estudante (incluindo edições e exclusões no histórico)
    const handleUpdateStudentFull = (updatedStudent) => {
        saveClassUpdates(prev => {
            const newStudents = (prev.students || []).map(s => 
                String(s.id) === String(updatedStudent.id) ? updatedStudent : s
            );
            return { ...prev, students: newStudents };
        });
        setHistoryStudent(updatedStudent);
    };

    // Estatísticas calculadas das probabilidades dos alunos ativos (Modo 2: Probabilidade Decrescente)
    const studentProbabilityStats = useMemo(() => {
        if (!activeItems || activeItems.length === 0) return {};
        const items = activeItems.map(s => {
            const idStr = String(s.id);
            const count = studentDrawCounts[idStr] || 0;
            const weight = getItemWeight(count);
            return { id: idStr, count, weight };
        });
        const totalW = items.reduce((acc, i) => acc + i.weight, 0);

        const stats = {};
        items.forEach(i => {
            const prob = totalW > 0 ? (i.weight / totalW) * 100 : (100 / activeItems.length);
            stats[i.id] = {
                drawCount: i.count,
                weight: i.weight,
                probabilityPercent: prob.toFixed(1)
            };
        });
        return stats;
    }, [activeItems, studentDrawCounts, getItemWeight]);

    // Informações de ciclo dos alunos ("antes de todos saírem")
    const studentCycleInfo = useMemo(() => {
        if (!activeItems || activeItems.length === 0) return { cycle: 1, drawnInCycle: 0, total: 0 };
        const counts = activeItems.map(s => studentDrawCounts[String(s.id)] || 0);
        const minCount = Math.min(...counts);
        const drawnInCycle = counts.filter(c => c > minCount).length;
        return {
            cycle: minCount + 1,
            drawnInCycle,
            total: activeItems.length
        };
    }, [activeItems, studentDrawCounts]);

    // Reinicia o ciclo de probabilidades (reseta a contagem de sorteios)
    const handleResetDrawCycle = useCallback(() => {
        setStudentDrawCounts({});
        setQuestionDrawCounts({});
        setUsedQuestions(new Set());
        if (activeActivity?.id && updateActivityData) {
            updateActivityData(activeActivity.id, {
                studentDrawCounts: {},
                questionDrawCounts: {}
            });
        }
        logTeacherAction(
            'reset_draw_cycle',
            'Ciclo de Sorteios Reiniciado',
            'O professor reiniciou a contagem de sorteios e restaurou as probabilidades iguais para todos os alunos e questões.',
            {}
        );
        gameAudio.playSuccess();
    }, [activeActivity?.id, updateActivityData, logTeacherAction]);

    // Inicia nova rodada no modo equipes: sorteia perguntas por peso para cada grupo
    const startGroupRound = () => {
        if (activeGroupItems.length === 0) return;
        const assignedQs = new Set();
        const updatedQCounts = { ...questionDrawCounts };

        const slots = activeGroupItems.map(group => {
            const availableQs = uniqueQuestions.filter(q => !assignedQs.has(q.question));
            const q = pickWeightedQuestion(availableQs.length > 0 ? availableQs : uniqueQuestions, updatedQCounts);

            if (q) {
                assignedQs.add(q.question);
                const qKey = q.id || q.question;
                updatedQCounts[qKey] = (updatedQCounts[qKey] || 0) + 1;
            }
            return {
                group,
                question: q?.question || 'Nenhuma pergunta disponível.',
                answer: q?.answer || '',
                difficulty: q?.difficulty || 'Média',
                imageUrl: q?.imageUrl || null,
                result: null // null = pendente
            };
        });

        setQuestionDrawCounts(updatedQCounts);
        if (activeActivity?.id && updateActivityData) {
            updateActivityData(activeActivity.id, { questionDrawCounts: updatedQCounts });
        }

        // Marca todas as perguntas desta rodada como usadas
        setUsedQuestions(prev => {
            const next = new Set(prev);
            slots.forEach(s => { if (s.question) next.add(s.question); });
            return next;
        });
        setGroupRoundSlots(slots);
        setActiveGroupTab(0);
        logTeacherAction(
            'spin',
            'Giro da Roleta (Rodada Simultânea)',
            `Rodada simultânea iniciada para ${slots.length} equipe(s). Cada equipe recebeu uma pergunta sorteada por peso.`,
            { groupCount: slots.length }
        );
    };

    const handleSpin = () => {
        if (gameMode === 'groups') {
            if (activeGroupItems.length === 0) return;
            // Se há rodada ativa com pendentes, pede confirmação
            const hasPending = groupRoundSlots && groupRoundSlots.some(s => s.result === null);
            if (hasPending) {
                setShowGroupRoundConfirm(true);
                return;
            }
            setSpinning(true);
            setShowCard(false);
            setWinner(null);
            setGroupRoundSlots(null);
            setTimeout(() => {
                setSpinning(false);
                startGroupRound();
            }, 1200);
            gameAudio.playTick();
            return;
        }
        // Modo individual — Sorteio Ponderado por Decaimento Suave (Modo 2)
        const pool = activeItems;
        if (spinning || pool.length === 0) return;
        setSpinning(true);
        setShowCard(false);
        setWinner(null);
        
        const selectedWinner = pickWeightedStudent(pool, studentDrawCounts);
        if (!selectedWinner) {
            setSpinning(false);
            return;
        }

        let questionObj = pickWeightedQuestion(uniqueQuestions, questionDrawCounts);
        const rawQuestion = questionObj ? questionObj.question : 'Nenhuma pergunta gerada para esta sessão.';

        // Incrementa a contagem de sorteios no estado da atividade
        const sIdKey = String(selectedWinner.id);
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
            'spin',
            'Giro da Roleta (Probabilidade Ponderada)',
            `Roleta girada no modo Individual. Sorteado(a): "${selectedWinner.name}" (Probabilidade do próximo sorteio reduzida).`,
            {
                studentName: selectedWinner.name,
                studentId: selectedWinner.id,
                targetName: selectedWinner.name,
                question: rawQuestion
            }
        );

        setWinner({
            ...selectedWinner,
            question: rawQuestion,
            answer: questionObj?.answer || '',
            difficulty: questionObj?.difficulty || 'Média',
            imageUrl: questionObj?.imageUrl || null,
            questionId: questionObj?.id || null
        });
    };

    const handleSpinComplete = () => {
        setSpinning(false);
        setShowCard(true); // Mostra o card com nome e pergunta
    };

    // Modo Tela Cheia / 100% da tela para projeções e lousas interativas
    const [isMaximized, setIsMaximized] = useState(false);
    const arenaRef = useRef(null);

    const toggleMaximize = async () => {
        if (!isMaximized) {
            setIsMaximized(true);
            try {
                if (document.documentElement.requestFullscreen && !document.fullscreenElement) {
                    await document.documentElement.requestFullscreen();
                }
            } catch (err) {
                // Modo maximizado via CSS fixed funcionará mesmo se o navegador restringir a API nativa
            }
        } else {
            setIsMaximized(false);
            try {
                if (document.fullscreenElement && document.exitFullscreen) {
                    await document.exitFullscreen();
                }
            } catch (err) {
                // Fallback silencioso
            }
        }
    };

    // Sincroniza saída pelo ESC do navegador, tecla F11 ou atalho de teclado
    useEffect(() => {
        const handleFullscreenChange = () => {
            if (!document.fullscreenElement && isMaximized) {
                setIsMaximized(false);
            }
        };

        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isMaximized) {
                setIsMaximized(false);
                if (document.fullscreenElement && document.exitFullscreen) {
                    document.exitFullscreen().catch(() => {});
                }
            }
            // Tecla de Espaço para girar a roleta em modo tela cheia
            if (e.code === 'Space' && isMaximized && !spinning && !showCard && activeItems.length > 0) {
                const targetTag = e.target?.tagName?.toUpperCase();
                if (targetTag !== 'INPUT' && targetTag !== 'TEXTAREA' && targetTag !== 'SELECT') {
                    e.preventDefault();
                    handleSpin();
                }
            }
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        window.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isMaximized, spinning, showCard, activeItems.length]);



    // Permite trocar o aluno sorteado em tempo real diretamente no card (mantendo a pergunta)

    // Permite escolher manualmente qual aluno responderá (com pergunta não usada)

    // Alterna o status do aluno especificamente para esta atividade (aba)

    // Coloca todos os alunos presentes de volta na roleta para esta atividade

    // Tira todos os alunos da roleta para esta atividade

    // Ajuste rápido de pontuação por Mérito (+1) ou Infração de Regra (-1)

    // Permite trocar a pergunta do aluno sorteado em tempo real no card

    // Ação: RODE NOVAMENTE (Não penaliza e NÃO remove o aluno da lista)

    // Ação: AVALIAÇÃO INDIVIDUAL (Acertou / Errou / Ausente)

    // Ação: DINÂMICA "TODOS RESPONDEM" (Pontuação em lote para múltiplos alunos)

    // Alternar presença/ausência de aluno retroativamente por data da aula
    // Desconsiderando pontos de desafios coletivos para não distorcer a pontuação da turma

    // Ação: DINÂMICA "PRECISO DE AJUDA" (Pontuação em dupla com colega ajudante)

    // Escolher manualmente uma equipe específica para responder

    // Ajuste rápido de pontuação de equipes (+1 Mérito / -1 Regra)
    // Atualiza a equipe E todos os seus integrantes no total de pontos e no histórico individual!

    // Ação: RESULTADO DE ATIVIDADE EM GRUPO / EQUIPE
    // Atribui pontos à equipe E a cada aluno integrante no placar individual e histórico!

    // Registra o resultado de um slot da rodada simultânea de equipes

    // Troca a pergunta de um slot específico da rodada simultânea

    // Encerra a rodada simultânea e limpa os slots

    // Ações adicionais na tela: Cronômetro Bomba e Revelar Resposta/Dica






    const hasRouletteData = (activeActivity?.questions && activeActivity.questions.length > 0) ||
                            (activeActivity?.items && activeActivity.items.length > 0) ||
                            (currentClass && currentClass.students && currentClass.students.length > 0);

    // Handler para importar questões da planilha para a atividade atual



    const handlers = useRouletteHandlers({ logTeacherAction, gameMode, currentSessionId, sessionStartTime, activeActivity, currentClass, updateStudentInClass, saveClassUpdates, setUsedQuestions, setShowCard, setWinner, winner, setStudentDrawCounts, updateActivityData, setQuestionDrawCounts, combinedItems, pickWeightedQuestion, uniqueQuestions, questionDrawCounts, studentDrawCounts, currentGroups, activeGroupItems, usedQuestions, studentToGroupMap, groupRoundSlots, setGroupRoundSlots, setActiveGroupTab, addActivityTab });
    return {
        ...handlers,
        activeActivity,
        activeGroupItems,
        activeGroupTab,
        activeItems,
        activityRemovedIds,
        addActivityTab,
        arenaRef,
        availableHelpers,
        classId,
        classes,
        combinedItems,
        currentClass,
        currentGroups,
        currentSessionId,
        currentTheme,
        gameMode,
        geminiService,
        getItemWeight,
        groupRoundSlots,
        handleResetDrawCycle,
        handleSaveGroups,
        handleSelectStyle,
        handleSpin,
        handleSpinComplete,
        handleToggleDifficulty,
        handleUpdateStudentFull,
        hasRouletteData,
        historyStudent,
        interactionLogs,
        isMaximized,
        isSidebarOpen,
        logTeacherAction,
        pickWeightedQuestion,
        pickWeightedStudent,
        placarTab,
        questionDrawCounts,
        rouletteStyle,
        saveClassUpdates,
        selectedModel,
        sessionStartTime,
        setActiveGroupTab,
        setClasses,
        setGameMode,
        setGroupRoundSlots,
        setHistoryStudent,
        setInteractionLogs,
        setIsMaximized,
        setIsSidebarOpen,
        setPlacarTab,
        setQuestionDrawCounts,
        setRouletteStyle,
        setShowCard,
        setShowClassReportModal,
        setShowClassesModal,
        setShowDifficulty,
        setShowGroupRoundConfirm,
        setShowGroupsModal,
        setShowQuestionsEditor,
        setShowSheetsModal,
        setShowTransitionModal,
        setSpinning,
        setStudentDrawCounts,
        setUsedQuestions,
        setWinner,
        showCard,
        showClassReportModal,
        showClassesModal,
        showDifficulty,
        showGroupRoundConfirm,
        showGroupsModal,
        showQuestionsEditor,
        showSheetsModal,
        showTransitionModal,
        spinning,
        startGroupRound,
        studentCycleInfo,
        studentDrawCounts,
        studentProbabilityStats,
        studentToGroupMap,
        tabs,
        toggleMaximize,
        uniqueQuestions,
        updateActivityData,
        updateStudentInClass,
        usedQuestions,
        winner,
    };
};
