import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useActivity } from '../../contexts/ActivityContext';
import { useGemini } from '../../contexts/GeminiContext';
import { RouletteWheel } from './RouletteWheel';
import { RouletteCard } from './RouletteCard';
import { StudentHistoryModal } from './StudentHistoryModal';
import { RouletteQuestionsEditorModal } from './RouletteQuestionsEditorModal';
import { RouletteStyleSelector } from './RouletteStyleSelector';
import { TransitionQuestionsModal } from '../modals/TransitionQuestionsModal';
import { ClassesManagerModal } from './ClassesManagerModal';
import { GroupsManagerModal } from './GroupsManagerModal';
import { RouletteSidebar } from './RouletteSidebar';
import { ClassSessionReportModal } from './ClassSessionReportModal';
import { CheckCircle, XCircle, RotateCcw, List, Download, UserX, Edit3, RotateCw, RefreshCw, Eye, EyeOff, HeartHandshake, Award, Maximize2, Minimize2, Users, Plus, Minus, Target, UserMinus, Sparkles, AlertTriangle, User, Trophy, ChevronRight, ChevronLeft, BarChart3 } from 'lucide-react';
import { gameAudio } from '../../utils/gameAudio';

// Temas visuais imersivos para o palco de fundo da roleta
const STAGE_THEMES = {
    slot_machine: {
        container: 'bg-gradient-to-b from-slate-950 via-red-950/40 to-slate-950 border-amber-500/40 shadow-[0_25px_60px_rgba(245,158,11,0.18)]',
        spotlight: 'radial-gradient(circle at center, rgba(245,158,11,0.18) 0%, transparent 70%)',
        button: 'bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-500 text-slate-950 font-black shadow-[0_10px_25px_rgba(245,158,11,0.4)] border-2 border-yellow-200 hover:brightness-110',
        label: 'PUXAR ALAVANCA / GIRAR! 🪙',
        spinningLabel: 'Girando os Rolos...'
    },
    marquee: {
        container: 'bg-gradient-to-b from-slate-950 via-slate-900 to-black border-slate-700/80 shadow-[0_25px_60px_rgba(0,0,0,0.6)]',
        spotlight: 'radial-gradient(circle at center, rgba(251,191,36,0.14) 0%, transparent 70%)',
        button: 'bg-gradient-to-r from-amber-600 via-orange-600 to-amber-600 text-white font-black shadow-amber-600/30 border-2 border-amber-400 hover:brightness-110',
        label: 'SORTEAR NO LETREIRO! 🔤',
        spinningLabel: 'Alternando Nomes...'
    },
    classic: {
        container: 'bg-gradient-to-b from-emerald-950 via-slate-950 to-emerald-950 border-emerald-500/40 shadow-[0_25px_60px_rgba(16,185,129,0.15)]',
        spotlight: 'radial-gradient(circle at center, rgba(253,224,71,0.16) 0%, transparent 70%)',
        button: 'bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 text-slate-950 font-black shadow-amber-500/30 border-2 border-amber-300 hover:brightness-110',
        label: 'GIRAR ROLETA VEGAS! 🎰',
        spinningLabel: 'Girando a Roda...'
    },
    cyberpunk: {
        container: 'bg-gradient-to-b from-slate-950 via-purple-950/40 to-slate-950 border-cyan-500/40 shadow-[0_25px_60px_rgba(6,182,212,0.22)]',
        spotlight: 'radial-gradient(circle at center, rgba(6,182,212,0.2) 0%, transparent 70%)',
        button: 'bg-gradient-to-r from-cyan-500 via-fuchsia-600 to-cyan-500 text-white font-black shadow-[0_10px_25px_rgba(6,182,212,0.4)] border-2 border-cyan-300 hover:brightness-110',
        label: 'LOCK TARGET / SCAN! ⚡',
        spinningLabel: 'Escaneando Alunos...'
    },
    arcade: {
        container: 'bg-gradient-to-b from-slate-950 via-indigo-950/50 to-black border-yellow-400/40 shadow-[0_25px_60px_rgba(250,204,21,0.18)]',
        spotlight: 'radial-gradient(circle at center, rgba(250,204,21,0.15) 0%, transparent 70%)',
        button: 'bg-yellow-400 text-black font-black border-4 border-black shadow-[5px_5px_0px_#000] hover:bg-yellow-300',
        label: 'PRESS START / GIRAR! 👾',
        spinningLabel: 'Player 1 Sorteando...'
    },
    cosmic: {
        container: 'bg-gradient-to-b from-slate-950 via-purple-950/60 to-indigo-950 border-purple-500/40 shadow-[0_25px_60px_rgba(168,85,247,0.22)]',
        spotlight: 'radial-gradient(circle at center, rgba(168,85,247,0.2) 0%, transparent 70%)',
        button: 'bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 text-white font-black shadow-purple-600/30 border-2 border-purple-300 hover:brightness-110',
        label: 'INVOCAR ASTROS / GIRAR! 🌌',
        spinningLabel: 'Alinhando os Astros...'
    }
};

export const RouletteActivity = () => {
    const { activeActivity, classes, setClasses, updateActivityData, addActivityTab } = useActivity();
    const { geminiService, selectedModel } = useGemini();
    const [showTransitionModal, setShowTransitionModal] = useState(false);
    const [showClassesModal, setShowClassesModal] = useState(false);
    const [showGroupsModal, setShowGroupsModal] = useState(false);
    const [showClassReportModal, setShowClassReportModal] = useState(false);
    const [currentSessionId] = useState(() => 'sess_' + Date.now());
    const [sessionStartTime] = useState(() => Date.now());
    
    // Modo de jogo da Roleta: 'individual' (alunos) | 'groups' (equipes)
    const [gameMode, setGameMode] = useState(() => {
        return activeActivity?.gameMode || 'individual';
    });

    // Aba de visualização do placar lateral: 'students' | 'groups'
    const [placarTab, setPlacarTab] = useState(() => {
        return activeActivity?.gameMode === 'groups' ? 'groups' : 'students';
    });

    // Estado de visibilidade do Sidebar retrátil de alunos e placar (abre para a direita a partir da esquerda)
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // O ID da turma e os dados vêm da aba ativa
    const classId = activeActivity?.classId;
    
    // Procura a turma vinculada, ou usa os dados próprios da aba (classData), ou primeira turma disponível, ou gera turma automática
    const currentClass = useMemo(() => {
        // 1. Se existir turma vinculada na lista global de turmas do professor
        if (classes && classes.length > 0) {
            const found = classes.find(c => c.id === classId);
            if (found) {
                return { ...found, groups: Array.isArray(found.groups) ? found.groups : [] };
            }

            // 2. Se a aba ativa tiver classData próprio salvo nela, prioriza ela antes de dar fallback para classes[0]
            if (activeActivity?.classData && (activeActivity.classData.id === classId || !classId)) {
                return {
                    ...activeActivity.classData,
                    groups: Array.isArray(activeActivity.classData.groups) ? activeActivity.classData.groups : []
                };
            }
            if (activeActivity?.classData && activeActivity.classData.students?.length > 0) {
                return {
                    ...activeActivity.classData,
                    groups: Array.isArray(activeActivity.classData.groups) ? activeActivity.classData.groups : []
                };
            }

            // 3. Fallback para a primeira turma cadastrada caso classId não seja encontrado
            const first = classes[0];
            return { ...first, groups: Array.isArray(first.groups) ? first.groups : [] };
        }

        // Se não houver turmas no navegador mas a atividade possui classData anexada
        if (activeActivity?.classData && (activeActivity.classData.students?.length > 0 || activeActivity.classData.name)) {
            return {
                ...activeActivity.classData,
                groups: Array.isArray(activeActivity.classData.groups) ? activeActivity.classData.groups : []
            };
        }

        // Se não houver turmas cadastradas no navegador (ex: Vercel ou cache limpo),
        // constrói uma turma automática para que a roleta possa ser visualizada e jogada imediatamente
        const questionsList = activeActivity?.questions || [];
        let studentsList = [];
        if (activeActivity?.items && activeActivity.items.length > 0) {
            studentsList = activeActivity.items.map((item, idx) => ({
                id: item.id || `std_auto_${idx}_${Date.now()}`,
                name: item.name || `Aluno ${idx + 1}`,
                status: item.active !== false ? 'active' : 'removed',
                hits: item.hits || 0,
                misses: item.misses || 0,
                history: []
            }));
        } else if (questionsList.length > 0) {
            studentsList = questionsList.map((q, idx) => ({
                id: `std_auto_${idx}_${Date.now()}`,
                name: q.name || `Aluno ${idx + 1}`,
                status: 'active',
                hits: 0,
                misses: 0,
                history: []
            }));
        } else {
            studentsList = ['Ana', 'Bruno', 'Carlos', 'Daniela', 'Eduardo', 'Fernanda'].map((name, idx) => ({
                id: `std_auto_${idx}_${Date.now()}`,
                name,
                status: 'active',
                hits: 0,
                misses: 0,
                history: []
            }));
        }

        return {
            id: classId || 'class_auto_' + (activeActivity?.id || Date.now()),
            name: activeActivity?.topic ? `Turma: ${activeActivity.topic}` : (activeActivity?.title || 'Turma da Roleta'),
            students: studentsList,
            groups: []
        };
    }, [classes, classId, activeActivity]);

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
    const [winner, setWinner] = useState(null); // O item sorteado
    const [showCard, setShowCard] = useState(false); // Mostra o card de resultado
    
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

    const activeItems = combinedItems.filter(i => i.status === 'active');
    // Alunos disponíveis para ajudar (inclui os que foram retirados da roleta ou já acertaram)
    const availableHelpers = combinedItems.filter(i => i.status !== 'absent');

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

    const handleSpin = () => {
        const pool = gameMode === 'groups' ? activeGroupItems : activeItems;
        if (spinning || pool.length === 0) return;
        setSpinning(true);
        setShowCard(false);
        setWinner(null);
        
        const randomIdx = Math.floor(Math.random() * pool.length);
        const selectedWinner = pool[randomIdx];

        // Tentar selecionar uma pergunta que ainda NÃO foi usada nesta sessão para evitar repetição
        let questionObj = null;
        if (uniqueQuestions.length > 0) {
            const unused = uniqueQuestions.filter(q => !usedQuestions.has(q.question));
            if (unused.length > 0) {
                questionObj = unused[Math.floor(Math.random() * unused.length)];
            } else {
                // Se todas já foram usadas, sorteia da lista completa
                questionObj = uniqueQuestions[randomIdx % uniqueQuestions.length];
            }
        }

        const rawQuestion = questionObj ? questionObj.question : 'Nenhuma pergunta gerada para esta sessão.';

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
    const handleChangeWinnerStudent = (newStudentObj) => {
        if (!newStudentObj) return;
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

    // Permite escolher manualmente qual aluno responderá (com pergunta não usada)
    const handleSelectStudentManually = (studentId) => {
        const student = combinedItems.find(s => s.id === studentId);
        if (!student) return;

        // Tentar selecionar uma pergunta que ainda NÃO foi usada nesta sessão
        let questionObj = null;
        if (uniqueQuestions.length > 0) {
            const unused = uniqueQuestions.filter(q => !usedQuestions.has(q.question));
            if (unused.length > 0) {
                questionObj = unused[Math.floor(Math.random() * unused.length)];
            } else {
                const sIdx = combinedItems.findIndex(s => s.id === studentId);
                questionObj = uniqueQuestions[(sIdx >= 0 ? sIdx : 0) % uniqueQuestions.length];
            }
        }

        const rawQuestion = questionObj ? questionObj.question : 'Nenhuma pergunta gerada para esta sessão.';

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

    // Alterna o status do aluno especificamente para esta atividade (aba)
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
        gameAudio.playTick();
    };

    // Coloca todos os alunos presentes de volta na roleta para esta atividade
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
        gameAudio.playSuccess();
    };

    // Tira todos os alunos da roleta para esta atividade
    const handleDeactivateAll = () => {
        if (!activeActivity?.id || !updateActivityData || !currentClass) return;
        const allIds = (currentClass.students || []).map(s => String(s.id));
        updateActivityData(activeActivity.id, {
            removedStudentIds: allIds
        });
        gameAudio.playTick();
    };

    // Ajuste rápido de pontuação por Mérito (+1) ou Infração de Regra (-1)
    const handleAdjustPoints = (studentId, delta, reason) => {
        const student = combinedItems.find(s => s.id === studentId);
        if (!student) return;

        const isMerit = reason === 'merit' || delta > 0;
        const historyEntry = {
            date: Date.now(),
            sessionId: currentSessionId,
            gameMode,
            topic: activeActivity?.topic || 'Sem tema',
            question: isMerit 
                ? 'Bônus por Mérito (+1 Ponto)' 
                : 'Penalidade: Infringiu regra do jogo (-1 Ponto)',
            result: isMerit ? 'merit' : 'rule_violation',
            pointsDelta: delta
        };

        const currentHits = student.hits || 0;
        const newHits = Math.max(0, currentHits + delta);

        updateStudentInClass(studentId, { hits: newHits }, historyEntry);

        if (isMerit) {
            gameAudio.playSuccess();
        } else {
            gameAudio.playTick();
        }
    };

    // Permite trocar a pergunta do aluno sorteado em tempo real no card
    const handleChangeWinnerQuestion = (newQuestionObj) => {
        if (!newQuestionObj) return;
        setWinner(prev => ({
            ...prev,
            question: newQuestionObj.question,
            answer: newQuestionObj.answer || '',
            difficulty: newQuestionObj.difficulty || prev?.difficulty || 'Média',
            imageUrl: newQuestionObj.imageUrl || null,
            questionId: newQuestionObj.id || null
        }));
    };

    // Ação: RODE NOVAMENTE (Não penaliza e NÃO remove o aluno da lista)
    const handleSpinAgain = () => {
        setShowCard(false);
        setWinner(null);
    };

    // Ação: AVALIAÇÃO INDIVIDUAL (Acertou / Errou / Ausente)
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
            // Remove o aluno APENAS desta atividade atual
            handleToggleStudentActivityStatus(winner.id, 'remove');
            updateStudentInClass(winner.id, { hits: (winner.hits || 0) + 1 }, historyEntry);
            setUsedQuestions(prev => new Set([...prev, winner.question]));
        } else if (resultType === 'incorrect') {
            updateStudentInClass(winner.id, { misses: (winner.misses || 0) + 1 }, historyEntry);
            setUsedQuestions(prev => new Set([...prev, winner.question]));
            // Mantém ativo na roleta
        } else if (resultType === 'absent') {
            updateStudentInClass(winner.id, { status: 'absent' }, historyEntry);
        }

        setShowCard(false);
        setWinner(null);
    };

    // Ação: DINÂMICA "TODOS RESPONDEM" (Pontuação em lote para múltiplos alunos)
    const handleBatchResult = ({ studentIds, questionText }) => {
        if (!studentIds || studentIds.length === 0) return;

        const idSet = new Set((studentIds || []).map(String));
        const now = Date.now();

        saveClassUpdates(prev => {
            const newStudents = (prev.students || []).map(s => {
                if (idSet.has(String(s.id))) {
                    const historyEntry = {
                        date: now,
                        sessionId: currentSessionId,
                        gameMode,
                        topic: activeActivity?.topic || 'Sem tema',
                        question: `[Desafio da Turma] ${questionText}`,
                        result: 'all_correct'
                    };
                    return {
                        ...s,
                        hits: (s.hits || 0) + 1,
                        history: [...(s.history || []), historyEntry]
                    };
                }
                return s;
            });
            return { ...prev, students: newStudents };
        });

        setUsedQuestions(prev => new Set([...prev, questionText]));
        setShowCard(false);
        setWinner(null);
    };

    // Ação: DINÂMICA "PRECISO DE AJUDA" (Pontuação em dupla com colega ajudante)
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
                        sessionId: currentSessionId,
                        gameMode,
                        topic: activeActivity?.topic || 'Sem tema',
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
                        sessionId: currentSessionId,
                        gameMode,
                        topic: activeActivity?.topic || 'Sem tema',
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

        if (isCorrect) {
            // Remove o aluno APENAS desta atividade atual
            handleToggleStudentActivityStatus(winner.id, 'remove');
            setUsedQuestions(prev => new Set([...prev, questionText]));
        }
        setShowCard(false);
        setWinner(null);
    };

    // Escolher manualmente uma equipe específica para responder
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

    // Ajuste rápido de pontuação de equipes (+1 Mérito / -1 Regra)
    // Atualiza a equipe E todos os seus integrantes no total de pontos e no histórico individual!
    const handleAdjustGroupPoints = (groupId, delta, reason) => {
        const group = currentGroups.find(g => String(g.id) === String(groupId));
        if (!group) return;

        const isMerit = reason === 'merit' || delta > 0;
        const now = Date.now();
        const topic = activeActivity?.topic || 'Sem tema';
        const label = isMerit 
            ? `[Equipe ${group.name}] Bônus por Mérito (+${delta} Ponto${Math.abs(delta) > 1 ? 's' : ''})`
            : `[Equipe ${group.name}] Penalidade: Infringiu regra (-${Math.abs(delta)} Ponto${Math.abs(delta) > 1 ? 's' : ''})`;

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

        if (isMerit) {
            gameAudio.playSuccess();
        } else {
            gameAudio.playTick();
        }
    };

    // Ação: RESULTADO DE ATIVIDADE EM GRUPO / EQUIPE
    // Atribui pontos à equipe E a cada aluno integrante no placar individual e histórico!
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
            sessionId: currentSessionId,
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
            sessionId: currentSessionId,
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

        setUsedQuestions(prev => new Set([...prev, questionText]));
        if (isCorrect) {
            gameAudio.playSuccess();
        } else {
            gameAudio.playTick();
        }

        setShowCard(false);
        setWinner(null);
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
            const violationsCount = history.filter(h => h.result === 'rule_violation').length;
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

    const hasRouletteData = (activeActivity?.questions && activeActivity.questions.length > 0) ||
                            (activeActivity?.items && activeActivity.items.length > 0) ||
                            (currentClass && currentClass.students && currentClass.students.length > 0);

    if (!hasRouletteData && (!classes || classes.length === 0)) {
        return (
            <div className="flex flex-col items-center justify-center w-full min-h-[600px] text-center p-8 animate-in fade-in duration-500">
                <div className="bg-indigo-50 border-2 border-indigo-200 rounded-3xl p-12 max-w-2xl shadow-sm">
                    <h2 className="text-3xl font-black text-indigo-900 mb-4">Pronto para girar?</h2>
                    <p className="text-lg text-indigo-700 font-medium">
                        Para criar a sua roleta, siga estes passos na <strong className="font-black text-indigo-800">Barra Lateral à esquerda</strong>:
                    </p>
                    <ul className="text-left mt-6 space-y-3 text-indigo-800 font-medium bg-white/60 p-6 rounded-2xl">
                        <li><strong>1.</strong> Selecione a <strong>Turma</strong> (crie uma se não tiver).</li>
                        <li><strong>2.</strong> Digite o <strong>Tema</strong> da aula.</li>
                        <li><strong>3.</strong> Clique no botão vermelho <strong>Gerar Atividade</strong>.</li>
                    </ul>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center w-full max-w-6xl mx-auto py-8 relative min-h-[600px] gap-8 animate-in fade-in zoom-in-95 duration-500">
            
            {/* Header da Turma */}
            <div className="w-full flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                        <select 
                            value={classId || currentClass?.id}
                            onChange={(e) => {
                                const chosenId = e.target.value;
                                const chosenObj = (classes || []).find(c => c.id === chosenId);
                                updateActivityData(activeActivity.id, { 
                                    classId: chosenId,
                                    classData: chosenObj || null
                                });
                            }}
                            className="max-w-[200px] xs:max-w-xs sm:max-w-sm md:max-w-md truncate text-xl sm:text-2xl font-black text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer hover:bg-slate-100 transition-colors"
                            title={currentClass?.name || "Trocar Turma para esta atividade"}
                        >
                            {(classes && classes.length > 0 ? classes : (currentClass ? [currentClass] : [])).map(c => (
                                <option key={c.id} value={c.id} title={c.name}>{c.name}</option>
                            ))}
                        </select>
                        <button
                            type="button"
                            onClick={() => setShowClassesModal(true)}
                            className="shrink-0 whitespace-nowrap inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs sm:text-sm bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 shadow-2xs transition-colors cursor-pointer"
                            title="Gerenciar Turmas e Alunos"
                        >
                            <Users className="w-4 h-4 text-indigo-600" />
                            <span>Gerenciar Turmas</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowGroupsModal(true)}
                            className="shrink-0 whitespace-nowrap inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs sm:text-sm bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 shadow-2xs transition-colors cursor-pointer"
                            title="Gerenciar Grupos e Equipes da Turma"
                        >
                            <Users className="w-4 h-4 text-purple-600" />
                            <span>Grupos ({currentGroups.length})</span>
                        </button>
                    </div>
                    <p className="text-slate-500 font-medium text-sm truncate">
                        {currentClass?.students?.length || 0} alunos • Tema: {activeActivity?.topic || 'Geral'}
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {/* Indicador de Perguntas Utilizadas */}
                    {uniqueQuestions.length > 0 && (
                        <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-800 px-3 py-2 rounded-xl text-xs font-bold">
                            <span>Perguntas: {usedQuestions.size}/{uniqueQuestions.length}</span>
                            {usedQuestions.size > 0 && (
                                <button
                                    onClick={handleResetUsedQuestions}
                                    className="text-amber-600 hover:text-amber-800 ml-1 p-0.5"
                                    title="Resetar perguntas usadas para permitir repeti-las"
                                >
                                    <RefreshCw className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>
                    )}

                    {/* Botão para escolher se exibe ou oculta a dificuldade */}
                    <button 
                        onClick={handleToggleDifficulty}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all border shadow-2xs ${
                            showDifficulty 
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100' 
                            : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                        }`}
                        title={showDifficulty ? 'Nível de dificuldade visível para os alunos (clique para ocultar)' : 'Nível de dificuldade oculto para os alunos (clique para exibir)'}
                    >
                        {showDifficulty ? <Eye className="w-4 h-4 text-emerald-600" /> : <EyeOff className="w-4 h-4 text-slate-400" />}
                        <span>{showDifficulty ? 'Dificuldade: Visível' : 'Dificuldade: Oculta'}</span>
                    </button>

                    <button 
                        onClick={() => setShowQuestionsEditor(true)}
                        className="flex items-center gap-2 bg-slate-50 text-slate-700 hover:bg-slate-100 px-3.5 py-2 rounded-xl font-bold text-xs sm:text-sm transition-colors border border-slate-200 shadow-2xs"
                        title="Editar perguntas e adicionar imagens"
                    >
                        <Edit3 className="w-4 h-4" /> Editar Perguntas
                    </button>

                    <button 
                        onClick={() => setShowTransitionModal(true)}
                        className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white px-3.5 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-2xs"
                        title="Transformar perguntas da Roleta em um Quiz com questões impressas ou interativas"
                    >
                        <CheckCircle className="w-4 h-4" /> Transformar em Quiz
                    </button>

                    <button 
                        onClick={() => setShowClassReportModal(true)}
                        className="flex items-center gap-2 bg-gradient-to-r from-indigo-50 via-purple-50 to-indigo-50 hover:from-indigo-100 hover:to-purple-100 text-indigo-900 border border-indigo-200/90 px-3.5 py-2 rounded-xl font-black text-xs sm:text-sm transition-all shadow-2xs active:scale-95 cursor-pointer"
                        title="Abrir Relatório de Aula com resumo da turma, questões trabalhadas, participação e parecer pedagógico"
                    >
                        <BarChart3 className="w-4 h-4 text-indigo-600" />
                        <span>Relatório da Aula & Insights</span>
                    </button>

                    {/* Botão de Destaque na Barra Superior para Abrir a Lateral de Alunos & Placar */}
                    <button 
                        onClick={() => setIsSidebarOpen(true)}
                        className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-3.5 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-md active:scale-95 cursor-pointer"
                        title="Abrir Painel Lateral de Alunos e Placar"
                    >
                        <Users className="w-4 h-4" />
                        <span>Placar & Alunos ({combinedItems.length})</span>
                    </button>
                </div>
            </div>

            {/* Palco central com arena temática da roleta */}
            <div className="w-full flex justify-center items-center">
                {/* Arena Imersiva da Roleta */}
                <div 
                    ref={arenaRef}
                    className={`transition-all duration-500 ${
                        isMaximized 
                            ? `fixed inset-0 z-40 w-full h-[100dvh] max-h-[100dvh] m-0 rounded-none border-0 p-3 sm:p-5 md:p-6 flex flex-col justify-between overflow-y-auto overflow-x-hidden ${currentTheme.container}`
                            : `w-full max-w-5xl relative flex flex-col items-center justify-center p-5 sm:p-7 rounded-3xl border overflow-hidden ${currentTheme.container}`
                    }`}
                >
                    {/* Spotlight de Iluminação Cênica de Fundo */}
                    <div 
                        className="absolute inset-0 pointer-events-none rounded-3xl transition-all duration-500" 
                        style={{ background: currentTheme.spotlight }}
                    />
                    {/* Textura sutil de arena */}
                    <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none rounded-3xl opacity-50" />

                    {/* Header da Arena */}
                    <div className="flex flex-wrap items-center justify-between w-full mb-1.5 sm:mb-2 z-10 relative gap-2 shrink-0">
                        <div className="flex items-center gap-2 sm:gap-3">
                            <h2 className={`${isMaximized ? 'text-xl sm:text-2xl' : 'text-2xl sm:text-3xl'} font-black text-white tracking-wide flex items-center gap-2`}>
                                <span>Roleta</span>
                                {isMaximized && (
                                    <span className="text-xs font-bold text-amber-300 bg-amber-400/20 px-2.5 py-0.5 rounded-full border border-amber-400/30 uppercase tracking-widest hidden sm:inline">
                                        100% Tela Cheia
                                    </span>
                                )}
                            </h2>
                            <span className="text-xs font-bold text-slate-400 hidden md:inline">
                                | Arena de Sorteio
                            </span>
                        </div>

                        {/* Seletor de Modo: Individual vs Equipes */}
                        <div className="flex items-center bg-black/40 backdrop-blur-md p-1 rounded-xl border border-white/10 shadow-inner">
                            <button
                                type="button"
                                onClick={() => {
                                    setGameMode('individual');
                                    setPlacarTab('students');
                                    if (activeActivity && updateActivityData) updateActivityData(activeActivity.id, { gameMode: 'individual' });
                                }}
                                disabled={spinning}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                                    gameMode === 'individual'
                                        ? 'bg-indigo-600 text-white shadow-md'
                                        : 'text-slate-400 hover:text-white'
                                }`}
                            >
                                <User className="w-3.5 h-3.5" />
                                <span>Individual</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setGameMode('groups');
                                    setPlacarTab('groups');
                                    if (activeActivity && updateActivityData) updateActivityData(activeActivity.id, { gameMode: 'groups' });
                                }}
                                disabled={spinning}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                                    gameMode === 'groups'
                                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
                                        : 'text-slate-400 hover:text-white'
                                }`}
                            >
                                <Users className="w-3.5 h-3.5" />
                                <span>Equipes ({currentGroups.length})</span>
                            </button>
                        </div>

                        <div className="flex items-center gap-2 sm:gap-3">
                            <span className="text-xs sm:text-sm font-bold text-amber-300 bg-amber-400/10 px-3 py-1.5 rounded-full border border-amber-400/20 flex items-center gap-1.5 shadow-xs">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                {gameMode === 'groups' ? `${activeGroupItems.length} equipes na roda` : `${activeItems.length} alunos na roda`}
                            </span>

                            {/* Botão para abrir o painel lateral de alunos diretamente da arena */}
                            <button
                                onClick={() => setIsSidebarOpen(true)}
                                className="flex items-center gap-1.5 text-xs sm:text-sm font-bold bg-white/10 hover:bg-white/20 text-white border border-white/20 hover:border-white/40 px-3 py-1.5 rounded-xl transition-all cursor-pointer shadow-md active:scale-95"
                                title="Abrir Painel Lateral de Alunos & Placar"
                            >
                                <Users className="w-3.5 h-3.5 text-indigo-300" />
                                <span className="hidden sm:inline">Placar</span>
                                <span className="bg-indigo-500/40 text-indigo-200 text-2xs font-black px-1.5 py-0.2 rounded-full border border-indigo-400/30">
                                    {combinedItems.length}
                                </span>
                            </button>

                            {/* Símbolo / Botão de Maximizar e Minimizar */}
                            <button
                                onClick={toggleMaximize}
                                className={`flex items-center gap-1.5 text-xs sm:text-sm font-black px-3 sm:px-3.5 py-1.5 rounded-xl border transition-all cursor-pointer shadow-md active:scale-95 ${
                                    isMaximized 
                                        ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 border-amber-200 ring-2 ring-amber-400/30' 
                                        : 'bg-white/10 hover:bg-white/20 text-white border-white/20 hover:border-white/40'
                                }`}
                                title={isMaximized ? "Minimizar Roleta (Esc)" : "Maximizar Roleta (Ocupar 100% da tela)"}
                            >
                                {isMaximized ? (
                                    <>
                                        <Minimize2 className="w-4 h-4 text-slate-950" />
                                        <span className="hidden sm:inline">Minimizar</span>
                                    </>
                                ) : (
                                    <>
                                        <Maximize2 className="w-4 h-4 text-amber-400" />
                                        <span className="hidden sm:inline">Maximizar</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Alerta / Convite amigável quando Modo Grupos estiver ativo mas sem grupos */}
                    {gameMode === 'groups' && currentGroups.length === 0 && (
                        <div className="z-20 my-2 max-w-md w-full bg-purple-950/80 border border-purple-500/50 backdrop-blur-md rounded-2xl p-4 text-center shadow-xl animate-in fade-in shrink-0">
                            <Users className="w-8 h-8 text-purple-300 mx-auto mb-1.5" />
                            <h4 className="text-white font-bold text-sm mb-1">Nenhuma equipe cadastrada ainda</h4>
                            <p className="text-purple-200 text-xs mb-2.5">Organize os alunos em grupos para girar a roleta por equipes e pontuar juntos!</p>
                            <button
                                type="button"
                                onClick={() => setShowGroupsModal(true)}
                                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl transition-all shadow-md cursor-pointer inline-flex items-center gap-1.5"
                            >
                                <Plus className="w-4 h-4" /> Criar Equipes Agora
                            </button>
                        </div>
                    )}

                    {/* Seletor dos 6 Estilos de Roleta */}
                    <div className={`w-full z-10 relative shrink-0 ${isMaximized ? 'max-w-4xl mx-auto' : ''}`}>
                        <RouletteStyleSelector 
                            selectedStyle={rouletteStyle}
                            onSelectStyle={handleSelectStyle}
                            disabled={spinning}
                            compact={isMaximized}
                        />
                    </div>
                    
                    {/* Roda / Chassi de Roleta Central */}
                    <div className={`z-10 relative w-full flex items-center justify-center min-h-0 ${isMaximized ? 'flex-1 my-0.5' : 'my-2'}`}>
                        <RouletteWheel 
                            style={rouletteStyle}
                            items={gameMode === 'groups' ? activeGroupItems : activeItems} 
                            spinning={spinning} 
                            winner={winner} 
                            onSpinComplete={handleSpinComplete} 
                            isMaximized={isMaximized}
                        />
                    </div>

                    {/* Botão de Giro Temático e Seletor Manual */}
                    <div className={`z-10 relative flex flex-col items-center shrink-0 ${isMaximized ? 'gap-1.5 sm:gap-2 mb-1 sm:mb-1.5' : 'gap-3 mt-6 sm:mt-8'}`}>
                        {/* Aviso amigável quando todos os alunos foram retirados da roleta */}
                        {gameMode !== 'groups' && activeItems.length === 0 && (
                            <div className="flex flex-col sm:flex-row items-center gap-2.5 bg-amber-500/25 border border-amber-400/60 backdrop-blur-md px-4 py-2.5 rounded-2xl text-amber-100 text-xs font-bold shadow-xl animate-fade-in">
                                <span>⚠️ Todos os alunos estão fora da roleta.</span>
                                <button
                                    type="button"
                                    onClick={handleActivateAll}
                                    className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl transition-all shadow-sm cursor-pointer flex items-center gap-1.5 text-xs"
                                >
                                    <RotateCcw className="w-3.5 h-3.5" /> Colocar Todos na Roleta
                                </button>
                            </div>
                        )}

                        <button 
                            onClick={handleSpin}
                            disabled={spinning || (gameMode === 'groups' ? activeGroupItems.length === 0 : activeItems.length === 0)}
                            className={`rounded-2xl font-black transition-all transform hover:scale-105 active:scale-95 flex items-center gap-2.5 sm:gap-3 cursor-pointer shadow-xl ${
                                isMaximized
                                    ? 'px-6 sm:px-10 py-2.5 sm:py-3 text-base sm:text-lg md:text-xl'
                                    : 'px-8 sm:px-12 py-4 sm:py-5 text-xl sm:text-2xl'
                            } ${
                                spinning || (gameMode === 'groups' ? activeGroupItems.length === 0 : activeItems.length === 0)
                                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700 opacity-60 shadow-none'
                                : currentTheme.button
                            }`}
                        >
                            {spinning 
                                ? currentTheme.spinningLabel 
                                : (gameMode === 'groups' 
                                    ? (activeGroupItems.length === 0 ? 'NENHUMA EQUIPE ATIVA' : 'GIRAR EQUIPES! 🏆') 
                                    : (activeItems.length === 0 ? 'NENHUM ALUNO NA ROLETA ⚠️' : currentTheme.label)
                                  )
                            }
                        </button>

                        {/* Seletor Manual Rápido no Palco */}
                        <div className="flex items-center gap-2">
                            {gameMode === 'groups' ? (
                                <select
                                    value=""
                                    onChange={(e) => {
                                        if (e.target.value) {
                                            handleSelectGroupManually(e.target.value);
                                        }
                                    }}
                                    disabled={spinning || activeGroupItems.length === 0}
                                    className="text-xs sm:text-sm font-bold bg-black/40 hover:bg-black/60 text-white/90 border border-white/20 hover:border-amber-400/50 rounded-xl px-3 py-1.5 outline-none cursor-pointer transition-all shadow-md backdrop-blur-sm"
                                    title="Escolher manualmente uma equipe específica para responder agora"
                                >
                                    <option value="" disabled className="text-slate-900 bg-white">🎯 Escolher Equipe Manualmente...</option>
                                    {activeGroupItems.map(g => (
                                        <option key={g.id} value={g.id} className="text-slate-900 bg-white">
                                            {g.name} ({g.members?.length || 0} alunos)
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <select
                                    value=""
                                    onChange={(e) => {
                                        if (e.target.value) {
                                            handleSelectStudentManually(e.target.value);
                                        }
                                    }}
                                    disabled={spinning || combinedItems.length === 0}
                                    className="text-xs sm:text-sm font-bold bg-black/40 hover:bg-black/60 text-white/90 border border-white/20 hover:border-amber-400/50 rounded-xl px-3 py-1.5 outline-none cursor-pointer transition-all shadow-md backdrop-blur-sm"
                                    title="Escolher manualmente um aluno específico para responder agora"
                                >
                                    <option value="" disabled className="text-slate-900 bg-white">🎯 Escolher Aluno Manualmente...</option>
                                    {combinedItems
                                        .filter(s => s.status !== 'absent')
                                        .map(s => (
                                            <option key={s.id} value={s.id} className="text-slate-900 bg-white">
                                                {s.name} {s.status === 'removed' ? '(Fora da Roleta)' : ''}
                                            </option>
                                        ))
                                    }
                                </select>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Botão Flutuante Criativo na Borda Direita para Abrir a Sidebar */}
            {!isSidebarOpen && (
                <button
                    type="button"
                    onClick={() => setIsSidebarOpen(true)}
                    className="fixed right-0 top-1/2 -translate-y-1/2 z-40 bg-white/95 hover:bg-white text-slate-800 border border-r-0 border-indigo-200/90 shadow-xl hover:shadow-2xl rounded-l-2xl py-3 px-2 sm:px-2.5 flex flex-col items-center gap-2 group transition-all duration-300 hover:-translate-x-1 cursor-pointer backdrop-blur-md"
                    title="Abrir Painel Lateral de Alunos & Placar (Direita)"
                >
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-sm group-hover:scale-110 transition-transform">
                        <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </div>
                    <span className="text-[10px] sm:text-[11px] font-black text-slate-700 tracking-wider [writing-mode:vertical-rl] rotate-180 flex items-center gap-1">
                        <ChevronLeft className="w-3 h-3 text-indigo-500 -rotate-90 group-hover:-translate-y-0.5 transition-transform" />
                        Placar & Alunos
                    </span>
                    <span className="bg-indigo-100 text-indigo-700 text-[10px] font-black px-1.5 py-0.5 rounded-full border border-indigo-200">
                        {combinedItems.length}
                    </span>
                </button>
            )}

            {/* Sidebar Lateral de Alunos & Placar (Retrátil à Direita, abre para a esquerda e fecha somente pelo botão Fechar) */}
            <RouletteSidebar 
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                placarTab={placarTab}
                setPlacarTab={setPlacarTab}
                combinedItems={combinedItems}
                currentGroups={currentGroups}
                currentClass={currentClass}
                studentToGroupMap={studentToGroupMap}
                spinning={spinning}
                onAdjustPoints={handleAdjustPoints}
                onAdjustGroupPoints={handleAdjustGroupPoints}
                onSelectStudentManually={handleSelectStudentManually}
                onSelectGroupManually={handleSelectGroupManually}
                onToggleStudentActivityStatus={handleToggleStudentActivityStatus}
                onReactivate={handleReactivate}
                onActivateAll={handleActivateAll}
                onDeactivateAll={handleDeactivateAll}
                onOpenHistory={(student) => setHistoryStudent(student)}
                onOpenClassReport={() => setShowClassReportModal(true)}
                onOpenGroupsModal={() => setShowGroupsModal(true)}
                onOpenClassesModal={() => setShowClassesModal(true)}
            />

            {/* CARD DO RESULTADO DO SORTEIO */}
            {showCard && winner && (
                <RouletteCard 
                    winner={winner} 
                    allQuestions={uniqueQuestions}
                    usedQuestions={usedQuestions}
                    activeStudents={activeItems}
                    allStudents={combinedItems}
                    availableHelpers={availableHelpers}
                    onChangeQuestion={handleChangeWinnerQuestion}
                    onChangeStudent={handleChangeWinnerStudent}
                    onCorrect={() => handleResult('correct')} 
                    onIncorrect={() => handleResult('incorrect')} 
                    onSpinAgain={handleSpinAgain}
                    onAbsent={() => handleResult('absent')}
                    onBatchResult={handleBatchResult}
                    onHelpResult={handleHelpResult}
                    onGroupResult={handleGroupResult}
                    showDifficulty={showDifficulty}
                    onToggleDifficulty={handleToggleDifficulty}
                />
            )}

            <StudentHistoryModal 
                isOpen={!!historyStudent} 
                onClose={() => setHistoryStudent(null)} 
                student={historyStudent} 
            />

            <ClassSessionReportModal 
                isOpen={showClassReportModal}
                onClose={() => setShowClassReportModal(false)}
                currentClass={currentClass}
                currentGroups={currentGroups}
                activeActivity={activeActivity}
                questions={uniqueQuestions}
                currentSessionId={currentSessionId}
                sessionStartTime={sessionStartTime}
                geminiService={geminiService}
                selectedModel={selectedModel}
            />

            <RouletteQuestionsEditorModal 
                isOpen={showQuestionsEditor}
                onClose={() => setShowQuestionsEditor(false)}
                activeActivity={activeActivity}
                updateActivityData={updateActivityData}
            />

            <TransitionQuestionsModal
                isOpen={showTransitionModal}
                onClose={() => setShowTransitionModal(false)}
                mode="roulette_to_quiz"
                sourceQuestions={uniqueQuestions}
                sourceTopic={activeActivity?.topic || 'Roleta'}
                classes={classes}
                geminiService={geminiService}
                selectedModel={selectedModel}
                addActivityTab={addActivityTab}
            />

            {showClassesModal && (
                <ClassesManagerModal 
                    isOpen={showClassesModal}
                    onClose={() => setShowClassesModal(false)}
                    classes={classes || []}
                    setClasses={setClasses}
                    selectedClassId={classId || currentClass?.id}
                    setSelectedClassId={(newId) => {
                        const chosen = (classes || []).find(c => c.id === newId);
                        if (activeActivity?.id) {
                            updateActivityData(activeActivity.id, {
                                classId: newId,
                                classData: chosen || null
                            });
                        }
                    }}
                />
            )}

            <GroupsManagerModal 
                isOpen={showGroupsModal}
                onClose={() => setShowGroupsModal(false)}
                currentClass={currentClass}
                groups={currentGroups}
                students={combinedItems && combinedItems.length > 0 ? combinedItems : (currentClass?.students || [])}
                onSaveGroups={handleSaveGroups}
            />
        </div>
    );
};

export default RouletteActivity;
