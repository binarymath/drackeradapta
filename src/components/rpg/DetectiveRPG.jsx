import React, { useState, useEffect, useMemo } from 'react';
import { 
    Users, Plus, Play, Square, Lock, Timer, ChevronRight, ChevronLeft, ChevronDown, CheckCircle, HelpCircle, XCircle, 
    RefreshCw, Award, BookOpen, Map, Sparkles, AlertTriangle, 
    Search, Wand2, Tent, ShieldCheck, Target, Flag, Rocket, Crown, Waves, Compass, 
    TreePine, GraduationCap, Shuffle, Layers, Lightbulb, Gift, Trophy, Check, Eye, EyeOff,
    RotateCcw, Video, Image as ImageIcon, Trash2, UserX
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

import { useGemini } from '../../contexts/GeminiContext';
import { useActivity } from '../../contexts/ActivityContext';
import { toDirectImageUrl, handleDriveImageError } from '../../utils/urlUtils';
import { toast } from '../ui/Toast';
import { RPGDocGuideModal } from './RPGDocGuideModal';
import { RPGTypographyToolbar } from './RPGTypographyToolbar';
import { RPGTextEditModal } from './RPGTextEditModal';
import { gameAudio } from '../../utils/gameAudio';
import { RouletteTimerBomb } from '../roulette/RouletteTimerBomb';
import { 
    RPG_LIBRARY_STORAGE_KEY, 
    getSavedRPGLibrary, 
    saveToRPGLibrary, 
    removeFromRPGLibrary 
} from '../../utils/rpgStorage';

// Definição dos Universos Disponíveis
const RPG_UNIVERSES = [
    {
        id: 'forest',
        title: 'Floresta Encantada',
        subtitle: 'Drácker & Animais Sábios',
        description: 'Um mistério místico na floresta com Drácker, Coruja, Raposa, Esquilo e Coelho.',
        icon: TreePine,
        badgeColor: 'bg-emerald-500/20 text-emerald-800 border-emerald-300',
        cardBg: 'from-emerald-50 via-teal-50 to-amber-50',
        borderColor: 'border-emerald-400',
        activeRing: 'ring-emerald-500 border-emerald-600',
        bannerIcon: '🌲'
    },
    {
        id: 'space',
        title: 'Odisséia Espacial',
        subtitle: 'Capitão Drácker & Galáxias',
        description: 'Explore nebulosas, estações orbitais e planetas misteriosos com a tripulação cósmica.',
        icon: Rocket,
        badgeColor: 'bg-indigo-500/20 text-indigo-800 border-indigo-300',
        cardBg: 'from-slate-900 via-indigo-950 to-slate-900',
        borderColor: 'border-indigo-400',
        activeRing: 'ring-indigo-500 border-indigo-600',
        bannerIcon: '🚀',
        isDark: true
    },
    {
        id: 'medieval',
        title: 'Reino dos Feiticeiros',
        subtitle: 'Castelos & Masmorras Mágicas',
        description: 'Drácker o Mago Dragão em busca de pergaminhos antigos, torres secretas e poções.',
        icon: Crown,
        badgeColor: 'bg-purple-500/20 text-purple-800 border-purple-300',
        cardBg: 'from-purple-50 via-amber-50 to-yellow-50',
        borderColor: 'border-purple-400',
        activeRing: 'ring-purple-500 border-purple-600',
        bannerIcon: '🏰'
    },
    {
        id: 'ocean',
        title: 'Expedição Submarina',
        subtitle: 'Cidades dos Corais & Mares',
        description: 'Mergulhe nas profundezas azuis com golfinhos guias, recifes bioluminescentes e baús submersos.',
        icon: Waves,
        badgeColor: 'bg-cyan-500/20 text-cyan-800 border-cyan-300',
        cardBg: 'from-cyan-50 via-blue-50 to-teal-50',
        borderColor: 'border-cyan-400',
        activeRing: 'ring-cyan-500 border-cyan-600',
        bannerIcon: '🌊'
    },
    {
        id: 'custom',
        title: 'Tema Personalizado',
        subtitle: 'Lore Livre do Professor',
        description: 'Crie seu próprio enredo pedagógico ou adapte o RPG ao tema exato da sua aula.',
        icon: Compass,
        badgeColor: 'bg-amber-500/20 text-amber-800 border-amber-300',
        cardBg: 'from-amber-50 via-orange-50 to-stone-50',
        borderColor: 'border-amber-400',
        activeRing: 'ring-amber-500 border-amber-600',
        bannerIcon: '🧭'
    }
];

export const DetectiveRPG = ({ topic, context, isFullWidth }) => {
    const { geminiService } = useGemini();
    const { 
        activeActivity, 
        updateActivityData, 
        activeTabId, 
        tabs, 
        setActiveTabId,
        classes,
        saveClassUpdates,
        updateStudentInClass
    } = useActivity();
    
    const savedData = activeActivity?.rpgData || {};
    const [selectedClassId, setSelectedClassId] = useState(activeActivity?.classId || '');

    // 1. Identificação da Turma e Grupos Oficiais (Single Source of Truth)
    const currentClass = useMemo(() => {
        if (classes && classes.length > 0) {
            if (selectedClassId) {
                const found = classes.find(c => String(c.id) === String(selectedClassId));
                if (found) return found;
            }
            if (activeActivity?.classId) {
                const found = classes.find(c => String(c.id) === String(activeActivity.classId));
                if (found) return found;
            }
            if (activeActivity?.classData) {
                return activeActivity.classData;
            }
            return classes[0];
        }
        return activeActivity?.classData || null;
    }, [classes, selectedClassId, activeActivity?.classId, activeActivity?.classData]);

    const classGroups = useMemo(() => {
        return (currentClass?.groups && Array.isArray(currentClass.groups)) ? currentClass.groups : [];
    }, [currentClass?.groups]);

    const classStudents = useMemo(() => {
        return (currentClass?.students && Array.isArray(currentClass.students)) 
            ? currentClass.students.filter(s => s.status !== 'removed') 
            : [];
    }, [currentClass?.students]);

    // Mapa de Progresso Multi-Turma: { [classId]: { round, gameStatus, history, evaluations, selectedOptions, studentNotebookExecutions, isClassActive, currentSessionId, sessionStartTime } }
    const [classProgressMap, setClassProgressMap] = useState(() => savedData.classProgressMap || {});

    // Chave da Turma Conectada Atual
    const activeClassKey = selectedClassId || currentClass?.id || 'default_class';
    const activeClassProgress = classProgressMap[activeClassKey];

    // Estados do Jogo
    const [gameStatus, setGameStatus] = useState(() => activeClassProgress?.gameStatus || savedData.gameStatus || 'setup'); // setup, loading, playing, finished
    const [universe, setUniverse] = useState(savedData.universe || 'forest');
    const [customLore, setCustomLore] = useState(savedData.customLore || '');
    const [stageCount, setStageCount] = useState(savedData.stageCount || 4); // 3, 4 ou 5 etapas
    
    // Modo de Participação: 'class_groups' (equipes oficiais da roleta) | 'class_students' (alunos individuais) | 'custom_teams' (manual)
    const [participationMode, setParticipationMode] = useState(() => {
        if (savedData.participationMode) return savedData.participationMode;
        if (classGroups.length > 0) return 'class_groups';
        if (classStudents.length > 0) return 'class_students';
        return 'class_groups';
    });

    // Estados de Aula Oficial e Duração Planejada
    const [isClassActive, setIsClassActive] = useState(() => {
        if (activeClassProgress?.isClassActive !== undefined) return activeClassProgress.isClassActive;
        return !!activeActivity?.isClassActive || !!savedData.isClassActive;
    });
    // Duração planejada da aula em minutos: 50 (1 aula) ou 100 (2 aulas)
    const [plannedDurationMinutes, setPlannedDurationMinutes] = useState(() => {
        return activeClassProgress?.plannedDurationMinutes || savedData.plannedDurationMinutes || 50;
    });
    // Flag de Modo Teste / Demonstração (sem gravar pontos nem frequência oficial)
    const [isTestMode, setIsTestMode] = useState(false);

    // Modais de Seleção de Duração e Modo de Início
    const [showClassDurationModal, setShowClassDurationModal] = useState(false);
    const [showLaunchTypeModal, setShowLaunchTypeModal] = useState(false);
    const [pendingLaunchConfig, setPendingLaunchConfig] = useState(null);

    const [currentSessionId, setCurrentSessionId] = useState(() => {
        return activeClassProgress?.currentSessionId || activeActivity?.currentSessionId || savedData.currentSessionId || null;
    });
    const [sessionStartTime, setSessionStartTime] = useState(() => {
        return activeClassProgress?.sessionStartTime || activeActivity?.sessionStartTime || savedData.sessionStartTime || null;
    });
    const [elapsedTimeStr, setElapsedTimeStr] = useState('+00:00');

    // Cronômetro Oficial do Sistema (RouletteTimerBomb)
    const [showTimerBomb, setShowTimerBomb] = useState(false);
    const [timerBombViewMode, setTimerBombViewMode] = useState(() => {
        try { return localStorage.getItem('preferred_rpg_timer_mode') || 'normal'; } catch(e) { return 'normal'; }
    });

    // Override para visualização de capítulos bloqueados no modo professor
    const [reviewOverrideLocked, setReviewOverrideLocked] = useState({});

    // Equipes ativas e equipes customizadas
    const [teams, setTeams] = useState(savedData.teams || []);
    const [customTeams, setCustomTeams] = useState(savedData.customTeams || [
        { id: 1, name: 'Equipe Lupa de Ouro' }, 
        { id: 2, name: 'Equipe Pegada Oculta' }
    ]);
    const [newTeamName, setNewTeamName] = useState('');
    const [questionType, setQuestionType] = useState(savedData.questionType || 'multiple_choice');
    
    const [round, setRound] = useState(() => activeClassProgress?.round || savedData.round || 1);
    const [history, setHistory] = useState(() => activeClassProgress?.history || savedData.history || []);
    const [currentData, setCurrentData] = useState(savedData.currentData || null);
    const [evaluations, setEvaluations] = useState(() => activeClassProgress?.evaluations || savedData.evaluations || {}); 
    const [selectedOptions, setSelectedOptions] = useState(() => activeClassProgress?.selectedOptions || savedData.selectedOptions || {});
    const [mediaUrls, setMediaUrls] = useState(savedData.mediaUrls || {}); // { round: url }
    
    // Estados para Jornada no Caderno Escolar & Mídias
    const [studentNotebookExecutions, setStudentNotebookExecutions] = useState(() => activeClassProgress?.studentNotebookExecutions || savedData.studentNotebookExecutions || {});
    // Controle de Alunos Ausentes (Falta na Aula) para não receber pontuações destinadas a todos
    const [absentStudentIds, setAbsentStudentIds] = useState(() => activeClassProgress?.absentStudentIds || savedData.absentStudentIds || []);
    const [showMediaInlineInput, setShowMediaInlineInput] = useState(false);
    const [showRestartModal, setShowRestartModal] = useState(false);
    const [showMediaManagerModal, setShowMediaManagerModal] = useState(false);
    const [showSetupMediaCustomizer, setShowSetupMediaCustomizer] = useState(false);

    // Título/Tema e Contexto Pedagógico (para quando o professor acessa direto pelo RPG)
    const [activityTopic, setActivityTopic] = useState(() => {
        return savedData.activityTopic || topic || activeActivity?.topic || activeActivity?.title || '';
    });
    const [activityContext, setActivityContext] = useState(() => {
        return savedData.activityContext || context || activeActivity?.details || '';
    });

    const [showSavedMissionsModal, setShowSavedMissionsModal] = useState(false);
    const [showDocGuideModal, setShowDocGuideModal] = useState(false);
    const [savedLibraryVersion, setSavedLibraryVersion] = useState(0);
    const [expandedMissionId, setExpandedMissionId] = useState(null); // id da missão com preview do roteiro aberto

    // Estados para o Modal de Revisão do Capítulo com Questões e Gabarito
    const [selectedReviewChapter, setSelectedReviewChapter] = useState(null);
    const [reviewRevealedAnswers, setReviewRevealedAnswers] = useState({});

    // Lista de equipes ativas resiliente a qualquer modo de participação ou recarregamento
    const effectiveTeams = useMemo(() => {
        return (teams && teams.length > 0)
            ? teams 
            : (participationMode === 'class_groups' && classGroups && classGroups.length > 0 
                ? classGroups.map(g => ({ id: g.id, name: g.name, color: g.color || 'bg-indigo-600', studentIds: g.studentIds || [] }))
                : (participationMode === 'class_students' && classStudents && classStudents.length > 0
                    ? classStudents.map(s => ({ id: s.id, name: s.name, isIndividual: true }))
                    : (customTeams && customTeams.length > 0 ? customTeams : [{ id: 1, name: 'Equipe 1' }, { id: 2, name: 'Equipe 2' }])));
    }, [teams, participationMode, classGroups, classStudents, customTeams]);

    // Helper para recuperar ou sintetizar um enigma perfeito para cada equipe sem deixar ninguém sem pergunta
    const getTeamEnigma = (team, index, currentEnigmas = [], stageRound = round) => {
        const teamName = team?.name || `Equipe ${index + 1}`;
        const matched = (currentEnigmas || []).find(e => 
            e && (
                (e.team && (String(e.team).toLowerCase().includes(teamName.toLowerCase()) || teamName.toLowerCase().includes(String(e.team).toLowerCase()))) ||
                (e.question && String(e.question).toLowerCase().includes(teamName.toLowerCase()))
            )
        ) || currentEnigmas[index] || currentEnigmas[0];

        if (matched && (matched.question || matched.pergunta || matched.desafio)) {
            let questionText = matched.question || matched.pergunta || matched.desafio || '';
            if (!questionText.toLowerCase().includes(teamName.toLowerCase())) {
                questionText = `Atenção, ${teamName}! ${questionText}`;
            }
            let options = Array.isArray(matched.options) ? matched.options : (Array.isArray(matched.alternativas) ? matched.alternativas : []);
            if (questionType === 'multiple_choice' && (!options || options.length < 2)) {
                options = ['A) Alternativa 1', 'B) Alternativa 2', 'C) Alternativa 3', 'D) Alternativa 4'];
            }
            return {
                ...matched,
                team: teamName,
                question: questionText,
                options: options,
                correct_answer: matched.correct_answer || matched.resposta_correta || matched.gabarito || `Gabarito e resolução esperada para a equipe ${teamName}.`,
                dica_dracker: matched.dica_dracker || matched.dica || 'Trabalhem em equipe e revisem os cálculos para desvendar o enigma!'
            };
        }

        return {
            team: teamName,
            question: `Atenção, ${teamName}! Investiguem a cena e resolvam o desafio do capítulo ${stageRound} sobre ${activityTopic || topic || 'o conteúdo pedagógico'}.`,
            options: questionType === 'multiple_choice' ? ['A) Alternativa 1', 'B) Alternativa 2', 'C) Alternativa 3', 'D) Alternativa 4'] : [],
            correct_answer: `Gabarito e resolução esperada para a equipe ${teamName}.`,
            dica_dracker: 'Trabalhem em equipe para encontrar a solução!'
        };
    };

    // Contador de Tempo da Aula com Teto Automático (50 min ou 100 min)
    useEffect(() => {
        if (!isClassActive || !sessionStartTime) {
            setElapsedTimeStr('+00:00');
            return;
        }
        const maxDurationMs = (plannedDurationMinutes || 50) * 60 * 1000;

        const updateTimer = () => {
            const now = Date.now();
            const rawElapsedMs = Math.max(0, now - sessionStartTime);
            const isOverLimit = rawElapsedMs >= maxDurationMs;
            const cappedMs = Math.min(rawElapsedMs, maxDurationMs);
            const mins = Math.floor(cappedMs / 60000);
            const secs = Math.floor((cappedMs % 60000) / 1000);
            const totalMins = plannedDurationMinutes || 50;
            const timeFormatted = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
            
            if (isOverLimit) {
                setElapsedTimeStr(`${timeFormatted} / ${totalMins}:00 (Limite)`);
            } else {
                setElapsedTimeStr(`${timeFormatted} / ${totalMins}:00`);
            }
        };
        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [isClassActive, sessionStartTime, plannedDurationMinutes]);

    // Iniciar Aula Oficial com duração especificada (50 min ou 100 min)
    const startOfficialClass = (durationMinutes = 50) => {
        const now = Date.now();
        const newSessionId = 'sess_rpg_' + now;
        setIsClassActive(true);
        setIsTestMode(false);
        setPlannedDurationMinutes(durationMinutes);
        setCurrentSessionId(newSessionId);
        setSessionStartTime(now);
        setShowClassDurationModal(false);
        setShowSavedMissionsModal(false);

        saveState({
            isClassActive: true,
            currentSessionId: newSessionId,
            sessionStartTime: now,
            plannedDurationMinutes: durationMinutes
        });

        toast(`Aula Oficial iniciada (${durationMinutes} min) com a turma "${currentClass?.name || 'conectada'}"!`);
        logRPGAction(
            'rpg_session_start', 
            `Aula Oficial Iniciada (${durationMinutes === 100 ? '2 Aulas - 100 min' : '1 Aula - 50 min'})`, 
            `A sessão oficial de RPG foi iniciada para a turma com previsão máxima de ${durationMinutes} minutos.`,
            { plannedDurationMinutes: durationMinutes }
        );

        // Se havia uma solicitação pendente de iniciar ou carregar missão, executa agora
        if (pendingLaunchConfig) {
            const config = pendingLaunchConfig;
            setPendingLaunchConfig(null);
            if (config.type === 'start_new') {
                startGame();
            } else if (config.type === 'load_saved' && config.mission) {
                executeLoadMissionToPlay(config.mission);
            }
        }
    };

    // Encerrar Aula Oficial considerando no máximo a duração planejada
    const endOfficialClass = () => {
        const maxDurationMs = (plannedDurationMinutes || 50) * 60 * 1000;
        const totalElapsedMs = sessionStartTime ? Math.min(Date.now() - sessionStartTime, maxDurationMs) : 0;
        const totalElapsedMins = Math.round(totalElapsedMs / 60000);

        setIsClassActive(false);
        saveState({
            isClassActive: false
        });
        toast(`Aula Oficial encerrada (${totalElapsedMins} min considerados).`);
        logRPGAction(
            'rpg_session_end', 
            'Aula Oficial Encerrada', 
            `A sessão oficial de RPG foi concluída considerando ${totalElapsedMins} minutos (máximo de ${plannedDurationMinutes} min).`,
            { totalElapsedMinutes: totalElapsedMins, plannedDurationMinutes }
        );
    };

    // Alternador de Iniciar/Encerrar Aula Oficial (abre modal para escolha de tempo se inativa)
    const toggleClassStatus = () => {
        if (!isClassActive) {
            setShowClassDurationModal(true);
        } else {
            endOfficialClass();
        }
    };

    // Confirma início em Modo Teste / Demonstração
    const confirmLaunchAsTest = () => {
        setIsTestMode(true);
        setShowLaunchTypeModal(false);
        setShowSavedMissionsModal(false);
        toast('Iniciado em Modo Teste! Pontuações e presenças não serão gravadas no sistema.');
        if (pendingLaunchConfig) {
            const config = pendingLaunchConfig;
            setPendingLaunchConfig(null);
            if (config.type === 'start_new') {
                startGame();
            } else if (config.type === 'load_saved' && config.mission) {
                executeLoadMissionToPlay(config.mission);
            }
        }
    };

    // Confirma início como Aula Oficial (transita para escolha de duração)
    const confirmLaunchAsOfficial = () => {
        setShowLaunchTypeModal(false);
        setShowClassDurationModal(true);
    };

    // Cancelar inicialização da missão (reabre modal de missões salvas se originário dele)
    const handleCancelLaunch = () => {
        setShowLaunchTypeModal(false);
        setShowClassDurationModal(false);
        if (pendingLaunchConfig?.fromSavedModal) {
            setShowSavedMissionsModal(true);
        }
        setPendingLaunchConfig(null);
    };

    // Sincronização em tempo real do estado da sessão oficial com o Cabeçalho (ActivityHeader)
    useEffect(() => {
        window.dispatchEvent(new CustomEvent('dracker_rpg_session_state', {
            detail: {
                isClassActive,
                elapsedTimeStr,
                selectedClassId: selectedClassId || currentClass?.id,
                plannedDurationMinutes
            }
        }));
    }, [isClassActive, elapsedTimeStr, selectedClassId, currentClass, plannedDurationMinutes]);

    // Ouvintes para comandos acionados a partir do Cabeçalho Superior (Iniciar/Encerrar aula e Troca de Turma)
    useEffect(() => {
        const handleToggleClassFromHeader = () => toggleClassStatus();
        const handleClassChangeFromHeader = (e) => {
            if (e.detail?.classId) {
                handleClassChange(e.detail.classId);
            }
        };
        window.addEventListener('toggle_rpg_official_class', handleToggleClassFromHeader);
        window.addEventListener('change_rpg_class', handleClassChangeFromHeader);
        return () => {
            window.removeEventListener('toggle_rpg_official_class', handleToggleClassFromHeader);
            window.removeEventListener('change_rpg_class', handleClassChangeFromHeader);
        };
    }, [isClassActive, sessionStartTime, plannedDurationMinutes, selectedClassId, currentClass]);

    // Rolagem automática para o topo sempre que avançar de rodada/capítulo ou mudar de tela
    useEffect(() => {
        try {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            document.documentElement.scrollTo({ top: 0, behavior: 'smooth' });
            document.body.scrollTo({ top: 0, behavior: 'smooth' });
            const area = document.getElementById('activity-area-print') || document.querySelector('.overflow-y-auto');
            if (area) {
                area.scrollTo({ top: 0, behavior: 'smooth' });
            }
        } catch (_) {}
    }, [round, gameStatus]);

    // Interceptadores para início de missão: verifica se Aula Oficial está ativa
    const handleStartGameClick = () => {
        if (!isClassActive && !isTestMode) {
            setPendingLaunchConfig({ type: 'start_new' });
            setShowLaunchTypeModal(true);
        } else {
            startGame();
        }
    };

    const handleLoadMissionClick = (mission) => {
        if (!isClassActive && !isTestMode) {
            setPendingLaunchConfig({ type: 'load_saved', mission, fromSavedModal: true });
            setShowSavedMissionsModal(false);
            setShowLaunchTypeModal(true);
        } else {
            setShowSavedMissionsModal(false);
            executeLoadMissionToPlay(mission);
        }
    };

    // Manipulador para troca de turma com isolamento de progresso (Multi-Turma)
    const handleClassChange = (targetId) => {
        const oldClassKey = selectedClassId || currentClass?.id || 'default_class';
        
        // 1. Salva progresso da turma anterior no mapa
        const updatedProgressMap = {
            ...classProgressMap,
            [oldClassKey]: {
                round,
                gameStatus,
                history,
                evaluations,
                selectedOptions,
                studentNotebookExecutions,
                absentStudentIds,
                isClassActive,
                plannedDurationMinutes,
                currentSessionId,
                sessionStartTime,
                className: currentClass?.name || 'Turma',
                updatedAt: Date.now()
            }
        };

        setSelectedClassId(targetId);
        const found = classes?.find(c => String(c.id) === String(targetId));
        const nextClassKey = targetId || 'default_class';
        const targetProgress = updatedProgressMap[nextClassKey];

        // 2. Carrega progresso da nova turma selecionada
        const newRound = targetProgress?.round || 1;
        const newGameStatus = targetProgress?.gameStatus || (currentData?.etapas?.length ? 'playing' : 'setup');
        const newHistory = targetProgress?.history || [];
        const newEvaluations = targetProgress?.evaluations || {};
        const newSelectedOptions = targetProgress?.selectedOptions || {};
        const newNotebook = targetProgress?.studentNotebookExecutions || {};
        const newAbsentStudentIds = targetProgress?.absentStudentIds || [];
        const newIsClassActive = !!targetProgress?.isClassActive;
        const newPlannedDurationMinutes = targetProgress?.plannedDurationMinutes || 50;
        const newSessionId = targetProgress?.currentSessionId || null;
        const newSessionStartTime = targetProgress?.sessionStartTime || null;

        setRound(newRound);
        setGameStatus(newGameStatus);
        setHistory(newHistory);
        setEvaluations(newEvaluations);
        setSelectedOptions(newSelectedOptions);
        setStudentNotebookExecutions(newNotebook);
        setAbsentStudentIds(newAbsentStudentIds);
        setIsClassActive(newIsClassActive);
        setPlannedDurationMinutes(newPlannedDurationMinutes);
        setCurrentSessionId(newSessionId);
        setSessionStartTime(newSessionStartTime);

        setClassProgressMap(updatedProgressMap);

        if (found) {
            if (activeTabId && updateActivityData) {
                updateActivityData(activeTabId, {
                    classId: found.id,
                    classData: found,
                    isClassActive: newIsClassActive,
                    plannedDurationMinutes: newPlannedDurationMinutes,
                    currentSessionId: newSessionId,
                    sessionStartTime: newSessionStartTime,
                    rpgData: {
                        ...savedData,
                        round: newRound,
                        gameStatus: newGameStatus,
                        history: newHistory,
                        evaluations: newEvaluations,
                        selectedOptions: newSelectedOptions,
                        studentNotebookExecutions: newNotebook,
                        plannedDurationMinutes: newPlannedDurationMinutes,
                        classProgressMap: updatedProgressMap
                    }
                });
            }
            const groupsCount = (found.groups && Array.isArray(found.groups)) ? found.groups.length : 0;
            const studentsCount = (found.students && Array.isArray(found.students)) 
                ? found.students.filter(s => s.status !== 'removed').length 
                : 0;

            if (groupsCount > 0) {
                setParticipationMode('class_groups');
            } else if (studentsCount > 0) {
                setParticipationMode('class_students');
            }
            toast(`Turma alterada para "${found.name}"!`);
        }
    };

    // Listener para abrir o modal de missões construídas a partir do botão no cabeçalho superior
    useEffect(() => {
        const handleOpenMissions = () => setShowSavedMissionsModal(true);
        window.addEventListener('open_rpg_saved_missions', handleOpenMissions);
        return () => window.removeEventListener('open_rpg_saved_missions', handleOpenMissions);
    }, []);

    // Listener para o Modal de Revisão do Capítulo com Questões e Gabarito
    useEffect(() => {
        const handleOpenReview = (e) => {
            if (e.detail?.etapa) {
                setSelectedReviewChapter(e.detail.etapa);
                setReviewRevealedAnswers({});
            }
        };
        window.addEventListener('open_rpg_review_chapter', handleOpenReview);
        return () => window.removeEventListener('open_rpg_review_chapter', handleOpenReview);
    }, []);

    // Sincroniza a missão da aba ativa na biblioteca permanente local usando o ID exclusivo da missão
    useEffect(() => {
        if (currentData && currentData.etapas && currentData.etapas.length > 0) {
            const missionId = currentData.id || `rpg_mission_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
            if (!currentData.id) {
                currentData.id = missionId;
            }
            saveToRPGLibrary({
                id: missionId,
                tabId: activeTabId,
                title: currentData.titulo_aventura || activityTopic || 'Aventura do Conhecimento',
                topic: activityTopic || '',
                context: activityContext || '',
                universe: universe || 'forest',
                customLore: customLore || '',
                stageCount: currentData.etapas.length,
                participationMode,
                questionType,
                data: currentData,
                teams,
                round,
                className: currentClass?.name || 'Turma Conectada',
                classId: selectedClassId || currentClass?.id || '',
                createdAt: currentData.createdAt || new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
            });
        }
    }, [currentData, activeTabId]);

    // Todas as missões construídas disponíveis (Aba Atual, Outras Abas e Biblioteca Permanente do Navegador)
    const allBuiltMissions = useMemo(() => {
        const list = [];
        const seenIds = new Set();

        // 1. Missão da aba atual (se houver)
        const effectiveCurrentData = currentData || savedData?.currentData || activeActivity?.rpgData?.currentData;
        if (effectiveCurrentData && effectiveCurrentData.etapas && effectiveCurrentData.etapas.length > 0) {
            const curTitle = effectiveCurrentData.titulo_aventura || activityTopic || 'Aventura Pronta (Aba Atual)';
            const curId = effectiveCurrentData.id || `current_${activeTabId || 'active'}`;
            list.push({
                id: curId,
                tabId: activeTabId,
                isCurrentTab: true,
                title: curTitle,
                topic: activityTopic || activeActivity?.topic || '',
                context: activityContext || activeActivity?.details || '',
                universe: universe || savedData?.universe || 'forest',
                className: currentClass?.name || 'Turma Ativa',
                data: effectiveCurrentData,
                round: round || savedData?.round || 1,
                stageCount: effectiveCurrentData.etapas.length,
                originBadge: '📍 Nesta Aba (Pronta)',
                createdAt: effectiveCurrentData.createdAt || 'Sessão Atual'
            });
            seenIds.add(curId);
            if (effectiveCurrentData.id) seenIds.add(effectiveCurrentData.id);
        }

        // 2. Missões em outras abas abertas no Drácker
        if (tabs && Array.isArray(tabs)) {
            tabs.forEach(t => {
                if (t.id === activeTabId) return;
                let mData = t.rpgData?.currentData;
                if (!mData && t.data?.etapas) mData = t.data;
                if (!mData && t.data?.currentData?.etapas) mData = t.data.currentData;
                if (!mData && typeof t.content === 'string' && t.content.includes('"etapas"')) {
                    try {
                        const parsed = JSON.parse(t.content);
                        if (parsed?.etapas) mData = parsed;
                        else if (parsed?.currentData?.etapas) mData = parsed.currentData;
                    } catch (e) {}
                }

                if (mData && mData.etapas && mData.etapas.length > 0) {
                    const mId = mData.id || `tab_${t.id}`;
                    if (!seenIds.has(mId)) {
                        const mTitle = mData.titulo_aventura || t.title || 'Expedição do Conhecimento';
                        const uId = t.rpgData?.universe || 'forest';
                        const cName = t.rpgData?.classData?.name || classes?.find(c => c.id === t.rpgData?.classId)?.name || 'Turma Conectada';
                        list.push({
                            id: mId,
                            tabId: t.id,
                            isOtherTab: true,
                            title: mTitle,
                            topic: t.topic || t.title || '',
                            context: t.details || '',
                            universe: uId,
                            className: cName,
                            data: mData,
                            round: t.rpgData?.round || 1,
                            stageCount: mData.etapas.length,
                            originBadge: `📑 Na Aba: ${t.title || 'RPG'}`,
                            createdAt: mData.createdAt || 'Aba Aberta'
                        });
                        seenIds.add(mId);
                        if (mData.id) seenIds.add(mData.id);
                    }
                }
            });
        }

        // 3. Missões salvas na biblioteca persistente do navegador
        const libMissions = getSavedRPGLibrary();
        libMissions.forEach(m => {
            if (!m || !m.data || !m.data.etapas || m.data.etapas.length === 0) return;
            const mId = m.id || m.data.id;
            if (!mId || !seenIds.has(mId)) {
                const uniqueId = mId || `lib_${Math.random()}`;
                const mTitle = m.data.titulo_aventura || m.title || 'Expedição Salva';
                list.push({
                    id: uniqueId,
                    isLibrary: true,
                    title: mTitle,
                    topic: m.topic || '',
                    context: m.context || '',
                    universe: m.universe || 'forest',
                    className: m.className || 'Turma Salva',
                    data: m.data,
                    round: m.round || 1,
                    stageCount: m.data.etapas.length,
                    createdAt: m.createdAt || m.data.createdAt || 'Histórico',
                    originBadge: '💾 Salva na Biblioteca'
                });
                seenIds.add(uniqueId);
                if (m.data?.id) seenIds.add(m.data.id);
            }
        });

        return list;
    }, [currentData, savedData, activeActivity, activeTabId, tabs, universe, activityTopic, activityContext, currentClass, round, classes, savedLibraryVersion]);

    const currentTabHasMission = Boolean(
        (currentData && currentData.etapas && currentData.etapas.length > 0) ||
        (savedData?.currentData && savedData.currentData.etapas && savedData.currentData.etapas.length > 0)
    );

    // Execução real do carregamento de missão selecionada para jogar
    const executeLoadMissionToPlay = (mission) => {
        if (!mission || !mission.data) return;

        if (mission.isOtherTab && mission.tabId) {
            setActiveTabId(mission.tabId);
            setShowSavedMissionsModal(false);
            toast(`Alternando para a aba "${mission.title}"!`);
            return;
        }

        // Se a missão atualmente ativa nesta aba for diferente da que está sendo carregada,
        // garante que a missão atual está preservada na biblioteca permanente com seu próprio ID
        if (currentData && currentData.etapas && currentData.id !== (mission.data?.id || mission.id)) {
            const currentMissionId = currentData.id || `rpg_mission_${Date.now()}`;
            if (!currentData.id) currentData.id = currentMissionId;
            saveToRPGLibrary({
                id: currentMissionId,
                tabId: activeTabId,
                title: currentData.titulo_aventura || activityTopic || 'Aventura Anterior',
                topic: activityTopic || '',
                context: activityContext || '',
                universe: universe || 'forest',
                customLore: customLore || '',
                stageCount: currentData.etapas.length,
                participationMode,
                questionType,
                data: currentData,
                teams,
                round,
                className: currentClass?.name || 'Turma Conectada',
                classId: selectedClassId || currentClass?.id || '',
                createdAt: currentData.createdAt || new Date().toLocaleDateString('pt-BR')
            });
        }

        // Carrega dados na aba atual
        setCurrentData(mission.data);
        if (mission.universe) setUniverse(mission.universe);
        if (mission.topic) setActivityTopic(activityTopic || mission.topic);
        if (mission.context) setActivityContext(activityContext || mission.context);
        if (mission.teams && mission.teams.length > 0) setTeams(mission.teams);
        
        const targetRound = mission.round || 1;
        setRound(targetRound);
        setGameStatus('playing');
        setHistory([]);
        setEvaluations({});
        setSelectedOptions({});
        setRevealedHints({});
        setRevealedAnswers({});
        setCarouselIndex(0);

        saveState({
            currentData: mission.data,
            gameStatus: 'playing',
            universe: mission.universe || universe,
            activityTopic: mission.topic || activityTopic,
            activityContext: mission.context || activityContext,
            round: targetRound,
            history: [],
            evaluations: {},
            selectedOptions: {}
        });

        setShowSavedMissionsModal(false);
        toast(`Missão "${mission.title}" carregada com sucesso! Boa expedição!`);
    };

    // Carregar missão para jogar (intercepta se deve ser modo teste ou aula oficial)
    const loadMissionToPlay = (mission) => {
        handleLoadMissionClick(mission);
    };

    // Helpers para alternância de presença e cadernos dos alunos
    const toggleStudentAbsent = (studentId) => {
        setAbsentStudentIds(prev => {
            const isAlreadyAbsent = prev.includes(studentId);
            const next = isAlreadyAbsent
                ? prev.filter(id => id !== studentId)
                : [...prev, studentId];
            saveState({ absentStudentIds: next });
            const studentObj = classStudents.find(s => s.id === studentId);
            const studentName = studentObj?.name || 'Aluno';
            if (isAlreadyAbsent) {
                toast(`"${studentName}" marcado como PRESENTE.`);
            } else {
                toast(`"${studentName}" marcado como AUSENTE (não pontuará na aula).`);
            }
            return next;
        });
    };

    const markAllStudentsPresent = () => {
        setAbsentStudentIds([]);
        saveState({ absentStudentIds: [] });
        toast('Todos os alunos foram marcados como presentes.');
    };

    // Manipuladores da Conferência dos Cadernos dos Alunos (Tri-estado: 'done' (+1 pt), 'not_done' (-1 pt) e Sem Seleção (0 pt))
    const toggleStudentNotebook = (studentId) => {
        setStudentNotebookExecutions(prev => {
            const roundMap = { ...(prev[round] || {}) };
            const currentVal = roundMap[studentId];
            let nextVal;
            // Ciclo: Sem Seleção (undefined) -> 'done' (+1) -> 'not_done' (-1) -> Sem Seleção (undefined)
            if (currentVal === 'done' || currentVal === true) {
                nextVal = 'not_done';
            } else if (currentVal === 'not_done' || currentVal === false) {
                nextVal = undefined;
            } else {
                nextVal = 'done';
            }

            if (nextVal === undefined) {
                delete roundMap[studentId];
            } else {
                roundMap[studentId] = nextVal;
            }
            const updated = { ...prev, [round]: roundMap };
            saveState({ studentNotebookExecutions: updated });
            return updated;
        });
    };

    const setStudentNotebookStatus = (studentId, status) => {
        setStudentNotebookExecutions(prev => {
            const roundMap = { ...(prev[round] || {}) };
            if (!status || status === 'unselected') {
                delete roundMap[studentId];
            } else {
                roundMap[studentId] = status;
            }
            const updated = { ...prev, [round]: roundMap };
            saveState({ studentNotebookExecutions: updated });
            return updated;
        });
    };

    const markAllNotebook = (status) => {
        setStudentNotebookExecutions(prev => {
            const roundMap = { ...(prev[round] || {}) };
            classStudents.forEach(s => {
                if (!absentStudentIds.includes(s.id)) {
                    if (!status || status === 'unselected') {
                        delete roundMap[s.id];
                    } else {
                        roundMap[s.id] = status;
                    }
                }
            });
            const updated = { ...prev, [round]: roundMap };
            saveState({ studentNotebookExecutions: updated });
            return updated;
        });
    };

    const clearAllNotebook = () => {
        setStudentNotebookExecutions(prev => {
            const updated = { ...prev, [round]: {} };
            saveState({ studentNotebookExecutions: updated });
            toast('Seleções dos cadernos limpas para todos os alunos (0 pt).');
            return updated;
        });
    };

    // UI States for Carousel & Visualização
    const [carouselIndex, setCarouselIndex] = useState(0);
    const [revealedHints, setRevealedHints] = useState({});
    const [revealedAnswers, setRevealedAnswers] = useState({});
    const [viewMode, setViewMode] = useState(savedData.viewMode || 'carousel'); // 'carousel' | 'list'

    const toggleHint = (teamId) => {
        setRevealedHints(prev => ({
            ...prev,
            [teamId]: !prev[teamId]
        }));
    };

    const toggleRevealAnswer = (teamId) => {
        setRevealedAnswers(prev => ({
            ...prev,
            [teamId]: !prev[teamId]
        }));
    };

    // Controles de Tipografia (Fonte & Alinhamento) das Missões do RPG
    const [fontScale, setFontScale] = useState(() => {
        try {
            const saved = localStorage.getItem('preferred_rpg_font_scale');
            if (saved) {
                const val = parseInt(saved, 10);
                if (!isNaN(val) && val >= 70 && val <= 250) return val;
            }
        } catch (e) {}
        return 100;
    });

    const handleIncreaseFont = () => {
        setFontScale(prev => {
            const next = Math.min(250, prev + 15);
            try { localStorage.setItem('preferred_rpg_font_scale', String(next)); } catch (e) {}
            gameAudio?.playTick?.();
            return next;
        });
    };

    const handleDecreaseFont = () => {
        setFontScale(prev => {
            const next = Math.max(70, prev - 15);
            try { localStorage.setItem('preferred_rpg_font_scale', String(next)); } catch (e) {}
            gameAudio?.playTick?.();
            return next;
        });
    };

    const handleResetFont = () => {
        setFontScale(100);
        try { localStorage.setItem('preferred_rpg_font_scale', '100'); } catch (e) {}
        gameAudio?.playTick?.();
    };

    const [textAlign, setTextAlign] = useState(() => {
        try {
            return localStorage.getItem('preferred_rpg_text_align') || 'text-left';
        } catch (e) {
            return 'text-left';
        }
    });

    const handleSetAlign = (alignClass) => {
        setTextAlign(alignClass);
        try { localStorage.setItem('preferred_rpg_text_align', alignClass); } catch (e) {}
        gameAudio?.playTick?.();
    };

    // Modal de Edição de Texto de Missão (História ou Enigmas)
    const [editModalConfig, setEditModalConfig] = useState({
        isOpen: false,
        type: 'story', // 'story' | 'enigma'
        title: '',
        data: {},
        enigmaIndex: 0
    });

    const handleOpenEditStory = (currentStage, storyContent) => {
        setEditModalConfig({
            isOpen: true,
            type: 'story',
            title: `Editar História - Capítulo ${round}`,
            data: {
                titulo_capitulo: currentStage?.titulo_capitulo || '',
                local_cena: currentStage?.local_cena || '',
                storyText: storyContent || ''
            },
            enigmaIndex: 0
        });
        gameAudio?.playTick?.();
    };

    const handleOpenEditEnigma = (enigmaItem, idx, teamLabel) => {
        setEditModalConfig({
            isOpen: true,
            type: 'enigma',
            title: `Editar Desafio - ${teamLabel || `Equipe ${idx + 1}`}`,
            data: {
                question: enigmaItem?.question || '',
                dica_dracker: enigmaItem?.dica_dracker || '',
                options: enigmaItem?.options || [],
                correct_answer: enigmaItem?.correct_answer || ''
            },
            enigmaIndex: idx
        });
        gameAudio?.playTick?.();
    };

    const handleSaveEditedMissionText = (updatedFormData) => {
        if (!currentData) return;
        const nextData = { ...currentData };
        if (!nextData.etapas) nextData.etapas = [];

        if (editModalConfig.type === 'story') {
            if (round === 1) {
                nextData.historia_abertura = updatedFormData.storyText;
            }
            if (nextData.etapas[round - 1]) {
                nextData.etapas[round - 1] = {
                    ...nextData.etapas[round - 1],
                    titulo_capitulo: updatedFormData.titulo_capitulo,
                    local_cena: updatedFormData.local_cena,
                    narrativa_avanco: round === 1 ? nextData.etapas[round - 1].narrativa_avanco : updatedFormData.storyText
                };
            }
            toast('História do capítulo atualizada com sucesso!');
        } else if (editModalConfig.type === 'enigma') {
            const eIdx = editModalConfig.enigmaIndex;
            if (nextData.etapas[round - 1]?.enigmas?.[eIdx]) {
                nextData.etapas[round - 1].enigmas[eIdx] = {
                    ...nextData.etapas[round - 1].enigmas[eIdx],
                    question: updatedFormData.question,
                    dica_dracker: updatedFormData.dica_dracker,
                    options: updatedFormData.options,
                    correct_answer: updatedFormData.correct_answer
                };
            }
            toast('Desafio da missão atualizado com sucesso!');
        }

        setCurrentData(nextData);
        saveState({ currentData: nextData });

        try {
            saveToRPGLibrary({
                id: nextData.id || `rpg_${Date.now()}`,
                title: nextData.titulo_aventura || 'Expedição Investigativa do Drácker',
                universe: universe,
                createdAt: new Date().toISOString(),
                data: nextData
            });
        } catch (e) {}

        gameAudio?.playSuccess?.();
    };

    // Estado de carregamento do detalhamento pedagógico pela IA Drácker
    // Sanitiza e remove saudações/conversas de IA do texto do gabarito
    const cleanDetailedResolution = (raw) => {
        if (!raw) return '';
        let text = raw.trim();
        text = text.replace(/^(aqui está|segue a|com certeza|olá|mestre drácker)[^\n]*\n+/i, '');
        text = text.replace(/^(para que o professor[^\n]*\n+)/i, '');
        text = text.replace(/^---+\s*\n*/, '');
        return text.trim();
    };

    // Renderizador especializado da resolução pedagógica detalhada
    // Garante espaçamento proporcional unitário (lineHeight: 1.65), formatação de passos, negritos e listas sem artefatos
    const DetailedResolutionView = ({ text, fontScale = 100, textAlign = 'text-left' }) => {
        if (!text) return <span className="italic text-amber-700">Conferência visual no caderno.</span>;

        const clean = cleanDetailedResolution(text);
        const lines = clean.split('\n').map(l => l.trim()).filter(Boolean);

        const renderFormattedLine = (str) => {
            const parts = [];
            const regex = /(\*\*(.+?)\*\*|\*(.+?)\*)/g;
            let last = 0;
            let m;
            while ((m = regex.exec(str)) !== null) {
                if (m.index > last) {
                    parts.push(str.slice(last, m.index));
                }
                if (m[2]) {
                    parts.push(<strong key={m.index} className="font-black text-amber-950">{m[2]}</strong>);
                } else if (m[3]) {
                    parts.push(<em key={m.index} className="italic text-amber-900">{m[3]}</em>);
                }
                last = m.index + m[0].length;
            }
            if (last < str.length) {
                parts.push(str.slice(last));
            }
            return parts.length > 0 ? parts : str;
        };

        return (
            <div 
                className={`space-y-3 font-medium text-slate-900 ${textAlign}`}
                style={{ fontSize: `${fontScale}%`, lineHeight: 1.65 }}
            >
                {lines.map((line, idx) => {
                    const isStepHeader = /^(\*\*|\b)(Passo\s*\d+|Etapa\s*\d+|RESOLUÇÃO|Resposta Final)/i.test(line);
                    const isBullet = line.startsWith('*') || line.startsWith('-');
                    const cleanLine = isBullet ? line.replace(/^[\*\-]\s*/, '') : line;

                    if (isStepHeader) {
                        return (
                            <div 
                                key={idx} 
                                className="bg-amber-200/70 border border-amber-300 p-3 sm:p-3.5 rounded-xl my-2 shadow-2xs"
                                style={{ lineHeight: 1.55 }}
                            >
                                <span className="font-black text-amber-950 text-base md:text-lg block">
                                    {renderFormattedLine(cleanLine)}
                                </span>
                            </div>
                        );
                    }

                    if (isBullet) {
                        return (
                            <div key={idx} className="flex items-start gap-2.5 pl-2 my-1.5" style={{ lineHeight: 1.65 }}>
                                <span className="text-amber-600 font-bold shrink-0 mt-0.5">•</span>
                                <div className="flex-1 font-semibold text-slate-800">
                                    {renderFormattedLine(cleanLine)}
                                </div>
                            </div>
                        );
                    }

                    return (
                        <p key={idx} className="leading-relaxed my-1 font-semibold text-slate-800" style={{ lineHeight: 1.65 }}>
                            {renderFormattedLine(cleanLine)}
                        </p>
                    );
                })}
            </div>
        );
    };

    // Estado de carregamento do detalhamento pedagógico pela IA Drácker
    const [loadingDetailAnswer, setLoadingDetailAnswer] = useState({});

    // Solicita à IA Drácker a resolução pedagógica passo a passo detalhada do enigma e salva permanentemente
    const handleRequestDetailedAnswer = async (enigmaItem, enigmaIndex, teamKey) => {
        if (!geminiService || !enigmaItem) return;
        const key = `${round}_${enigmaIndex}_${teamKey}`;
        setLoadingDetailAnswer(prev => ({ ...prev, [key]: true }));
        try {
            const prompt = `Você é o Mestre Drácker, mentor pedagógico investigativo.
Para o seguinte enigma/desafio da aula:
Enunciado: "${enigmaItem.question}"
${enigmaItem.options && enigmaItem.options.length > 0 ? `Alternativas: ${enigmaItem.options.join(' | ')}` : ''}
Gabarito registrado atual: "${enigmaItem.correct_answer || ''}"

Escreva uma RESOLUÇÃO PEDAGÓGICA DETALHADA PASSO A PASSO para o professor explicar e conferir na lousa.
- Apresente a resposta final com destaque logo no início.
- Explique o passo a passo dos cálculos e do raciocínio lógico de forma clara e didática.
- Divida em passos objetivos (ex: Passo 1, Passo 2, Resposta Final).
- NUNCA inclua saudações, introduções ("Aqui está...", "Olá...") ou conclusões. Comece DIRETAMENTE pela resposta e resolução.`;

            const detailedResult = await geminiService.generateText(prompt, { temperature: 0.2 });
            if (detailedResult && detailedResult.trim()) {
                const cleanResult = cleanDetailedResolution(detailedResult.trim());
                const nextData = JSON.parse(JSON.stringify(currentData));
                if (nextData?.etapas?.[round - 1]?.enigmas?.[enigmaIndex]) {
                    nextData.etapas[round - 1].enigmas[enigmaIndex].correct_answer = cleanResult;
                    setCurrentData(nextData);
                    
                    // 1. Salva no estado da aba ativa e no ActivityContext
                    saveState({ currentData: nextData });
                    if (activeTabId && updateActivityData) {
                        updateActivityData(activeTabId, {
                            data: nextData,
                            rpgData: {
                                ...(activeActivity?.rpgData || {}),
                                currentData: nextData
                            }
                        });
                    }

                    // 2. Salva na biblioteca persistente do navegador (localStorage)
                    try {
                        const missionId = nextData.id || currentData?.id || `rpg_mission_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
                        if (!nextData.id) nextData.id = missionId;
                        saveToRPGLibrary({
                            id: missionId,
                            tabId: activeTabId,
                            title: nextData.titulo_aventura || activityTopic || 'Aventura do Conhecimento',
                            topic: activityTopic || '',
                            context: activityContext || '',
                            universe: universe || 'forest',
                            stageCount: nextData.etapas.length,
                            participationMode,
                            questionType,
                            data: nextData,
                            teams,
                            round,
                            className: currentClass?.name || 'Turma Conectada',
                            classId: selectedClassId || currentClass?.id || '',
                            createdAt: nextData.createdAt || new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                        });
                    } catch (e) {
                        console.error('Erro ao salvar no RPG Library:', e);
                    }

                    window.dispatchEvent(new CustomEvent('dracker_rpg_missions_updated'));
                    toast.success('Resolução detalhada salva com sucesso no programa!');
                    gameAudio?.playSuccess?.();
                }
            }
        } catch (err) {
            console.error('Erro ao gerar resolução detalhada:', err);
            toast.error('Não foi possível detalhar a resolução no momento.');
        } finally {
            setLoadingDetailAnswer(prev => ({ ...prev, [key]: false }));
        }
    };

    // Garante que a pergunta sempre se dirija nominalmente à equipe na narrativa
    const formatDirectedQuestion = (questionText, teamName) => {
        if (!questionText) return '';
        const cleanTeam = (teamName || '').trim();
        if (!cleanTeam) return questionText;
        if (questionText.toLowerCase().includes(cleanTeam.toLowerCase())) {
            return questionText;
        }
        return `Atenção, ${cleanTeam}! O Drácker convoca seu esquadrão: ${questionText}`;
    };

    // Separa a instrução inicial de convocação do enunciado principal do desafio
    const parseQuestionParts = (fullQuestion) => {
        if (!fullQuestion) return { intro: '', challenge: '' };
        const raw = (fullQuestion || '').trim();
        
        const colonIdx = raw.indexOf(':');
        if (colonIdx !== -1 && colonIdx < 240) {
            const potentialIntro = raw.slice(0, colonIdx + 1).trim();
            const potentialChallenge = raw.slice(colonIdx + 1).trim();
            
            if (
                potentialIntro.toLowerCase().includes('atenção') ||
                potentialIntro.toLowerCase().includes('drácker') ||
                potentialIntro.toLowerCase().includes('caderno') ||
                potentialIntro.toLowerCase().includes('desafio') ||
                potentialIntro.toLowerCase().includes('exploradores') ||
                potentialIntro.toLowerCase().includes('esquadrão')
            ) {
                return {
                    intro: potentialIntro,
                    challenge: potentialChallenge || raw
                };
            }
        }
        
        return {
            intro: '',
            challenge: raw
        };
    };

    // Salvar estado na atividade da aba particionado por turma (Multi-Turma)
    const saveState = (updates = {}) => {
        if (!activeTabId) return;
        const currentClassKey = selectedClassId || currentClass?.id || 'default_class';

        const mergedRound = updates.round !== undefined ? updates.round : round;
        const mergedGameStatus = updates.gameStatus !== undefined ? updates.gameStatus : gameStatus;
        const mergedHistory = updates.history !== undefined ? updates.history : history;
        const mergedEvaluations = updates.evaluations !== undefined ? updates.evaluations : evaluations;
        const mergedSelectedOptions = updates.selectedOptions !== undefined ? updates.selectedOptions : selectedOptions;
        const mergedNotebook = updates.studentNotebookExecutions !== undefined ? updates.studentNotebookExecutions : studentNotebookExecutions;
        const mergedAbsentStudentIds = updates.absentStudentIds !== undefined ? updates.absentStudentIds : absentStudentIds;
        const mergedIsClassActive = updates.isClassActive !== undefined ? updates.isClassActive : isClassActive;
        const mergedPlannedDurationMinutes = updates.plannedDurationMinutes !== undefined ? updates.plannedDurationMinutes : plannedDurationMinutes;
        const mergedSessionId = updates.currentSessionId !== undefined ? updates.currentSessionId : currentSessionId;
        const mergedSessionStartTime = updates.sessionStartTime !== undefined ? updates.sessionStartTime : sessionStartTime;

        const updatedProgressMap = {
            ...classProgressMap,
            [currentClassKey]: {
                round: mergedRound,
                gameStatus: mergedGameStatus,
                history: mergedHistory,
                evaluations: mergedEvaluations,
                selectedOptions: mergedSelectedOptions,
                studentNotebookExecutions: mergedNotebook,
                absentStudentIds: mergedAbsentStudentIds,
                isClassActive: mergedIsClassActive,
                plannedDurationMinutes: mergedPlannedDurationMinutes,
                currentSessionId: mergedSessionId,
                sessionStartTime: mergedSessionStartTime,
                className: currentClass?.name || 'Turma',
                updatedAt: Date.now()
            }
        };

        setClassProgressMap(updatedProgressMap);

        updateActivityData(activeTabId, {
            classId: selectedClassId || currentClass?.id,
            isClassActive: mergedIsClassActive,
            plannedDurationMinutes: mergedPlannedDurationMinutes,
            currentSessionId: mergedSessionId,
            sessionStartTime: mergedSessionStartTime,
            rpgData: {
                gameStatus: mergedGameStatus, 
                teams, 
                customTeams,
                universe,
                customLore,
                stageCount,
                participationMode,
                questionType, 
                round: mergedRound, 
                history: mergedHistory, 
                currentData, 
                evaluations: mergedEvaluations, 
                selectedOptions: mergedSelectedOptions, 
                mediaUrls,
                viewMode,
                studentNotebookExecutions: mergedNotebook,
                absentStudentIds: mergedAbsentStudentIds,
                plannedDurationMinutes: mergedPlannedDurationMinutes,
                classProgressMap: updatedProgressMap,
                ...updates
            }
        });
    };

    // Logger de Ações para Relatórios da Sessão de Aula (Reflete em ClassSessionReportModal)
    const logRPGAction = (type, title, description, details = {}) => {
        if (isTestMode) return; // Modo teste não grava no relatório oficial da aula

        const now = Date.now();
        const dateObj = new Date(now);
        const timeFormatted = dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

        const newLogEntry = {
            id: `rpg_${now}_${Math.random().toString(36).slice(2, 7)}`,
            timestamp: now,
            timeFormatted,
            elapsedFormatted: isClassActive ? elapsedTimeStr : `Cap. ${round}`,
            sessionId: currentSessionId,
            activityId: activeActivity?.id || null,
            className: currentClass?.name || 'Turma',
            topic: topic || activeActivity?.topic || activeActivity?.title || 'RPG Pedagógico',
            gameMode: participationMode === 'class_students' ? 'individual' : 'groups',
            type,
            category: 'eval',
            title,
            description,
            ...details
        };

        if (activeActivity?.id && updateActivityData) {
            const existingLogs = Array.isArray(activeActivity.interactionLogs) ? activeActivity.interactionLogs : [];
            const updatedLogs = [newLogEntry, ...existingLogs].slice(0, 500);
            updateActivityData(activeActivity.id, { interactionLogs: updatedLogs });
        }
    };

    const renderMarkdown = (text) => {
        if (!text) return null;
        const html = text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/- (.*)/g, '<li class="ml-4 list-disc">$1</li>')
            .replace(/\n/g, '<br/>');
        return <div dangerouslySetInnerHTML={{ __html: html }} className="space-y-1" />;
    };

    // Gerador de Equipes Balanceadas na Turma Oficial (Sincroniza com Roleta)
    const handleAutoGenerateClassGroups = (numGroups = 3) => {
        if (!currentClass?.id || classStudents.length === 0) {
            return toast('A turma precisa de alunos cadastrados para gerar equipes!');
        }

        const colors = [
            'bg-emerald-600', 'bg-indigo-600', 'bg-amber-600', 
            'bg-rose-600', 'bg-cyan-600', 'bg-purple-600'
        ];
        const names = [
            'Equipe Drácker', 'Equipe Coruja Sábia', 'Equipe Raposa Ágil', 
            'Equipe Urso Valente', 'Equipe Fênix', 'Equipe Titãs'
        ];

        // Embaralha alunos
        const shuffled = [...classStudents].sort(() => Math.random() - 0.5);
        const newGroups = Array.from({ length: numGroups }, (_, i) => ({
            id: `grp_rpg_${Date.now()}_${i + 1}`,
            name: names[i] || `Equipe ${i + 1}`,
            color: colors[i % colors.length],
            studentIds: []
        }));

        shuffled.forEach((s, idx) => {
            const targetGroupIdx = idx % numGroups;
            newGroups[targetGroupIdx].studentIds.push(s.id);
        });

        // Salva na turma oficial (Single Source of Truth)
        saveClassUpdates(currentClass.id, prev => ({
            ...prev,
            groups: newGroups
        }));

        setParticipationMode('class_groups');
        toast(`✨ ${numGroups} equipes criadas e sincronizadas com a Roleta!`);
    };

    const handleAddCustomTeam = () => {
        if (newTeamName.trim() && customTeams.length < 8) {
            const updated = [...customTeams, { id: Date.now(), name: newTeamName.trim() }];
            setCustomTeams(updated);
            setNewTeamName('');
            saveState({ customTeams: updated });
        }
    };

    const handleRemoveCustomTeam = (id) => {
        const updated = customTeams.filter(t => t.id !== id);
        setCustomTeams(updated);
        saveState({ customTeams: updated });
    };

    // Iniciar Aventura
    const startGame = async () => {
        if (!geminiService) {
            setGameStatus('setup');
            return toast('Aguardando inicialização do serviço da IA Gemini... Verifique a chave de API.');
        }

        let activeTeams = [];

        if (participationMode === 'class_groups') {
            if (classGroups.length === 0) {
                return toast('Crie ou gere as equipes da turma primeiro!');
            }
            activeTeams = classGroups.map(g => ({
                id: g.id,
                name: g.name,
                color: g.color || 'bg-indigo-600',
                studentIds: g.studentIds || []
            }));
        } else if (participationMode === 'class_students') {
            if (classStudents.length === 0) {
                return toast('A turma não possui alunos cadastrados!');
            }
            activeTeams = classStudents.map(s => ({
                id: s.id,
                name: s.name,
                isIndividual: true
            }));
        } else {
            if (customTeams.length === 0) {
                return toast('Adicione pelo menos uma equipe!');
            }
            activeTeams = customTeams;
        }

        const finalTopic = activityTopic.trim() || topic || activeActivity?.topic || activeActivity?.title || '';
        if (!finalTopic) {
            return toast('Por favor, informe o título ou conteúdo pedagógico da atividade!');
        }

        setTeams(activeTeams);
        setGameStatus('loading');

        try {
            const safeTopic = finalTopic;
            const safeContext = activityContext.trim() || context || activeActivity?.details || '';

            const data = await geminiService.generateFullRPG(
                safeTopic, 
                safeContext, 
                activeTeams, 
                questionType,
                {
                    universe,
                    customLore,
                    stageCount,
                    isIndividual: participationMode === 'class_students',
                    participationMode
                }
            );

            // Sincroniza o título oficial da aba no Drácker
            if (activeTabId && updateActivityData) {
                updateActivityData(activeTabId, {
                    topic: safeTopic,
                    title: `RPG: ${safeTopic}`,
                    details: safeContext
                });
            }

            // Se já existia uma missão nesta aba, garante que ela continue arquivada e disponível na biblioteca
            if (currentData && currentData.etapas && currentData.etapas.length > 0) {
                const prevMissionId = currentData.id || `rpg_archived_${Date.now() - 1000}`;
                if (!currentData.id) currentData.id = prevMissionId;
                saveToRPGLibrary({
                    id: prevMissionId,
                    tabId: activeTabId,
                    title: currentData.titulo_aventura || activityTopic || 'Aventura Anterior',
                    topic: activityTopic || '',
                    context: activityContext || '',
                    universe: universe || 'forest',
                    customLore: customLore || '',
                    stageCount: currentData.etapas.length,
                    participationMode,
                    questionType,
                    data: currentData,
                    teams,
                    round,
                    className: currentClass?.name || 'Turma Conectada',
                    classId: selectedClassId || currentClass?.id || '',
                    createdAt: currentData.createdAt || new Date().toLocaleDateString('pt-BR')
                });
            }

            // Atribui ID e timestamp exclusivos e permanentes para a nova missão gerada
            const newMissionId = `rpg_mission_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
            data.id = newMissionId;
            data.createdAt = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

            setCurrentData(data);
            setGameStatus('playing');
            setRound(1);
            setHistory([]);
            setEvaluations({});
            setSelectedOptions({});
            setRevealedHints({});
            setRevealedAnswers({});
            setCarouselIndex(0);

            saveState({ 
                currentData: data, 
                gameStatus: 'playing',
                teams: activeTeams,
                universe,
                customLore,
                stageCount,
                participationMode,
                round: 1,
                history: [],
                evaluations: {},
                selectedOptions: {}
            });

            // Salva a nova missão na biblioteca persistente do Drácker com ID único
            saveToRPGLibrary({
                id: newMissionId,
                tabId: activeTabId,
                title: data.titulo_aventura || safeTopic,
                topic: safeTopic,
                context: safeContext,
                universe,
                customLore,
                stageCount,
                participationMode,
                questionType,
                data,
                teams: activeTeams,
                round: 1,
                className: currentClass?.name || 'Turma Conectada',
                classId: selectedClassId || currentClass?.id || '',
                createdAt: data.createdAt
            });
            setSavedLibraryVersion(v => v + 1);

            // Registrar início de sessão no interactionLogs para relatórios
            logRPGAction(
                'rpg_started',
                `Aventura Iniciada: ${safeTopic}`,
                `Missão iniciada no universo "${RPG_UNIVERSES.find(u => u.id === universe)?.title || universe}" com ${activeTeams.length} participante(s).`,
                {
                    universe,
                    participantCount: activeTeams.length,
                    stageCount,
                    questionType
                }
            );

        } catch (error) {
            console.error('Start Game Error:', error);
            toast('Erro ao iniciar aventura: ' + (error.message || 'Falha na comunicação com a IA'));
            setGameStatus('setup');
        }
    };

    const handleEvaluate = (teamId, status) => {
        const newEvals = { ...evaluations, [teamId]: status };
        setEvaluations(newEvals);
        saveState({ evaluations: newEvals });
    };

    const handleSelectOption = (teamId, optIndex) => {
        const newOpts = { ...selectedOptions, [teamId]: optIndex };
        setSelectedOptions(newOpts);
        saveState({ selectedOptions: newOpts });
    };

    // Avançar Rodada / Capítulo
    // Avançar Rodada / Capítulo
    const nextRound = async () => {
        let finalEvaluations = { ...evaluations };
        const currentEtapa = currentData?.etapas?.[round - 1];
        if (!currentEtapa) return toast('Erro: etapa atual não encontrada.');

        const now = Date.now();

        // 1. Validação e Avaliação
        if (participationMode === 'class_students') {
            // Modo Individual no Caderno Escolar
            const currentRoundNotebook = studentNotebookExecutions[round] || {};
            const enigmaPrincipal = currentEtapa.enigmas?.[0] || { question: `Missão no Caderno - Cap. ${round}` };
            let countExecuted = 0;
            const executedList = [];
            const notExecutedList = [];
            const unselectedList = [];

            classStudents.forEach(student => {
                const isAbsent = absentStudentIds.includes(student.id);
                if (isAbsent) {
                    finalEvaluations[student.id] = 'absent';
                    if (currentClass?.id && !isTestMode) {
                        const studentHistoryEntry = {
                            date: now,
                            sessionId: currentSessionId || null,
                            question: enigmaPrincipal.question || `Missão no Caderno - Cap. ${round}`,
                            result: 'absent',
                            note: 'Ausente na aula (sem alteração de pontuação)',
                            pointsDelta: 0,
                            activityType: 'rpg',
                            topic: topic || activeActivity?.topic || 'RPG Pedagógico',
                            chapterTitle: currentEtapa.titulo_etapa || `Capítulo ${round}`,
                            round
                        };
                        updateStudentInClass(
                            currentClass.id, 
                            student.id, 
                            {}, 
                            studentHistoryEntry
                        );
                    }
                    return;
                }

                const studentStatus = currentRoundNotebook[student.id];
                const isDone = studentStatus === 'done' || studentStatus === true;
                const isNotDone = studentStatus === 'not_done' || studentStatus === false;

                if (isDone) {
                    countExecuted++;
                    executedList.push(student);
                    finalEvaluations[student.id] = 'success';

                    if (currentClass?.id && !isTestMode) {
                        const studentHistoryEntry = {
                            date: now,
                            sessionId: currentSessionId || null,
                            question: enigmaPrincipal.question || `Missão no Caderno - Cap. ${round}`,
                            result: 'correct',
                            note: 'Missão no Caderno: Realizada (+1 pt)',
                            pointsDelta: 1,
                            activityType: 'rpg',
                            topic: topic || activeActivity?.topic || 'RPG Pedagógico',
                            chapterTitle: currentEtapa.titulo_etapa || `Capítulo ${round}`,
                            round
                        };

                        const currentHits = student.hits || 0;
                        const newHits = currentHits + 1;

                        updateStudentInClass(
                            currentClass.id, 
                            student.id, 
                            { hits: newHits }, 
                            studentHistoryEntry
                        );
                    }
                } else if (isNotDone) {
                    notExecutedList.push(student);
                    finalEvaluations[student.id] = 'fail';

                    if (currentClass?.id && !isTestMode) {
                        const studentHistoryEntry = {
                            date: now,
                            sessionId: currentSessionId || null,
                            question: enigmaPrincipal.question || `Missão no Caderno - Cap. ${round}`,
                            result: 'incorrect',
                            note: 'Missão no Caderno: Não Realizada (-1 pt deduzido)',
                            pointsDelta: -1,
                            activityType: 'rpg',
                            topic: topic || activeActivity?.topic || 'RPG Pedagógico',
                            chapterTitle: currentEtapa.titulo_etapa || `Capítulo ${round}`,
                            round
                        };

                        const currentHits = student.hits || 0;
                        const newHits = Math.max(0, currentHits - 1);
                        const newMisses = (student.misses || 0) + 1;

                        updateStudentInClass(
                            currentClass.id, 
                            student.id, 
                            {
                                hits: newHits,
                                misses: newMisses
                            }, 
                            studentHistoryEntry
                        );
                    }
                } else {
                    // Sem seleção / Neutro: Permanece com 0 pt (não ganha e nem perde pontos)
                    unselectedList.push(student);
                    finalEvaluations[student.id] = 'unselected';

                    if (currentClass?.id && !isTestMode) {
                        const studentHistoryEntry = {
                            date: now,
                            sessionId: currentSessionId || null,
                            question: enigmaPrincipal.question || `Missão no Caderno - Cap. ${round}`,
                            result: 'unselected',
                            note: 'Missão no Caderno: Sem seleção (0 pt)',
                            pointsDelta: 0,
                            activityType: 'rpg',
                            topic: topic || activeActivity?.topic || 'RPG Pedagógico',
                            chapterTitle: currentEtapa.titulo_etapa || `Capítulo ${round}`,
                            round
                        };

                        updateStudentInClass(
                            currentClass.id, 
                            student.id, 
                            {}, 
                            studentHistoryEntry
                        );
                    }
                }
            });

            // Registro detalhado no Registro de Aula (interactionLogs)
            const notExecutedNames = notExecutedList.map(s => s.name);
            const absentList = classStudents.filter(s => absentStudentIds.includes(s.id));
            const absentNames = absentList.map(s => s.name);
            const presentCount = classStudents.length - absentList.length;

            let logDesc = `${countExecuted} aluno(s) realizaram a missão no caderno (+1 pt).`;
            if (notExecutedList.length > 0) {
                logDesc += ` ${notExecutedList.length} não realizaram (-1 pt deduzido): ${notExecutedNames.join(', ')}.`;
            }
            if (unselectedList.length > 0) {
                logDesc += ` ${unselectedList.length} sem seleção (0 pt).`;
            }
            if (absentList.length > 0) {
                logDesc += ` ${absentList.length} aluno(s) ausente(s) (0 pt): ${absentNames.join(', ')}.`;
            }

            logRPGAction(
                'rpg_notebook_checkpoint',
                `Cap. ${round}: Conferência de Cadernos (${countExecuted} fez / ${notExecutedList.length} não fez / ${unselectedList.length} sem seleção / ${absentList.length} ausente)`,
                logDesc,
                {
                    round,
                    chapterTitle: currentEtapa.titulo_etapa || `Capítulo ${round}`,
                    countExecuted,
                    notExecutedCount: notExecutedList.length,
                    unselectedCount: unselectedList.length,
                    absentCount: absentList.length,
                    totalStudents: classStudents.length,
                    presentStudents: presentCount,
                    unexecutedStudentIds: notExecutedList.map(s => s.id),
                    unexecutedStudentNames: notExecutedNames,
                    absentStudentIds: absentList.map(s => s.id),
                    absentStudentNames: absentNames,
                    executedStudentIds: executedList.map(s => s.id),
                    rate: Math.round((countExecuted / (presentCount || 1)) * 100)
                }
            );
        } else {
            // Modo de Equipes (Roleta ou Personalizado)
            if (questionType === 'multiple_choice') {
                const missingOptionTeam = effectiveTeams.find(t => selectedOptions[t.id] === undefined);
                if (missingOptionTeam) {
                    return toast(`Por favor, selecione a resposta da equipe "${missingOptionTeam.name}" antes de continuar.`);
                }
                
                effectiveTeams.forEach((team, index) => {
                    const enigma = getTeamEnigma(team, index, currentEtapa?.enigmas, round);
                    const chosenOptText = enigma.options?.[selectedOptions[team.id]];
                    const isCorrect = chosenOptText && enigma.correct_answer && (chosenOptText.charAt(0) === enigma.correct_answer.charAt(0) || enigma.correct_answer.includes(chosenOptText));
                    finalEvaluations[team.id] = isCorrect ? 'success' : 'fail';
                });
            } else {
                // Validação para dissertativa
                const missingEvalTeam = effectiveTeams.find(t => evaluations[t.id] === undefined);
                if (missingEvalTeam) {
                    return toast(`Por favor, avalie a resposta da equipe "${missingEvalTeam.name}" antes de continuar.`);
                }
            }

            // CRUCIAL: Refletir ações nos relatórios e turmas sem duplicações!
            if (currentClass?.id && !isTestMode) {
                effectiveTeams.forEach((team, index) => {
                    const enigma = getTeamEnigma(team, index, currentEtapa?.enigmas, round);
                    if (!team) return;

                    const isCorrect = finalEvaluations[team.id] === 'success';

                    if (participationMode === 'class_groups') {
                        const group = classGroups.find(g => String(g.id) === String(team.id)) || team;
                        const memberIdSet = new Set((group.studentIds || []).map(String));

                        const studentHistoryEntry = {
                            date: now,
                            question: enigma.question,
                            result: isCorrect ? 'correct' : 'incorrect',
                            isGroupActivity: true,
                            groupId: group.id,
                            groupName: group.name,
                            activityType: 'rpg',
                            topic: topic || activeActivity?.topic || 'RPG Pedagógico',
                            round
                        };

                        const groupHistoryEntry = {
                            date: now,
                            question: enigma.question,
                            result: isCorrect ? 'correct' : 'incorrect',
                            round
                        };

                        saveClassUpdates(currentClass.id, prev => {
                            const updatedGroups = (prev.groups || []).map(g => {
                                if (String(g.id) === String(group.id)) {
                                    return {
                                        ...g,
                                        hits: (g.hits || 0) + (isCorrect ? 1 : 0),
                                        misses: (g.misses || 0) + (isCorrect ? 0 : 1),
                                        history: [...(g.history || []), groupHistoryEntry]
                                    };
                                }
                                return g;
                            });

                            const updatedStudents = (prev.students || []).map(s => {
                                if (memberIdSet.has(String(s.id))) {
                                    if (absentStudentIds.includes(s.id)) {
                                        // Aluno ausente na aula: não ganha a pontuação coletiva da equipe!
                                        return s;
                                    }
                                    return {
                                        ...s,
                                        hits: (s.hits || 0) + (isCorrect ? 1 : 0),
                                        misses: (s.misses || 0) + (isCorrect ? 0 : 1),
                                        history: [...(s.history || []), studentHistoryEntry]
                                    };
                                }
                                return s;
                            });

                            return { ...prev, groups: updatedGroups, students: updatedStudents };
                        });

                        logRPGAction(
                            isCorrect ? 'rpg_enigma_success' : 'rpg_enigma_fail',
                            isCorrect ? `Cap. ${round}: Enigma Superado!` : `Cap. ${round}: Enigma Não Superado`,
                            `Equipe "${group.name}": ${isCorrect ? 'Acertou o enigma' : 'Errou o enigma'}. Enigma: "${enigma.question.slice(0, 60)}..."`,
                            {
                                groupName: group.name,
                                studentCount: memberIdSet.size,
                                round,
                                questionText: enigma.question,
                                isCorrect
                            }
                        );
                    }
                });
            }
        }

        const currentHistoryLog = {
            round,
            enigmas: effectiveTeams.map((team, idx) => getTeamEnigma(team, idx, currentEtapa?.enigmas, round)),
            evaluations: finalEvaluations,
            selectedOptions: { ...selectedOptions }
        };

        const newHistory = [...history, currentHistoryLog];
        setHistory(newHistory);
        
        // Verifica falhas para reforço pedagógico do Drácker
        const fails = Object.values(finalEvaluations).filter(v => v === 'fail').length;
        const total = Object.values(finalEvaluations).length;
        const needsHelp = fails > (total / 2);
        
        const totalStages = currentData?.etapas?.length || stageCount || 4;

        if (round < totalStages) {
            const nextRoundNum = round + 1;
            
            // Garante que o próximo capítulo existe no objeto de etapas mesmo se o gerador inicial não tiver retornado
            let updatedData = { ...currentData };
            if (!updatedData.etapas) updatedData.etapas = [];
            if (!updatedData.etapas[nextRoundNum - 1]) {
                updatedData.etapas[nextRoundNum - 1] = {
                    round: nextRoundNum,
                    titulo_capitulo: nextRoundNum === totalStages ? `Capítulo ${nextRoundNum}: A Revelação Final` : `Capítulo ${nextRoundNum}: A Investigação Continua`,
                    local_cena: 'Cenário da Missão',
                    item_recompensa: `Relíquia do Conhecimento ${nextRoundNum}`,
                    narrativa_avanco: `A equipe avança com coragem para o Capítulo ${nextRoundNum} para desvendar todos os segredos de ${activityTopic || topic || 'a aula'}!`,
                    enigmas: effectiveTeams.map((team, tIdx) => ({
                        team: team.name,
                        question: `Atenção, ${team.name}! Investiguem a cena e resolvam o desafio do capítulo ${nextRoundNum} sobre ${activityTopic || topic || 'a aula'}.`,
                        options: questionType === 'multiple_choice' ? ['A) Alternativa 1', 'B) Alternativa 2', 'C) Alternativa 3', 'D) Alternativa 4'] : [],
                        correct_answer: `Gabarito e resolução esperada para a equipe ${team.name}.`,
                        dica_dracker: 'Trabalhem em equipe para superar este capítulo!'
                    }))
                };
            }

            setRound(nextRoundNum);
            setEvaluations({});
            setSelectedOptions({});
            setRevealedHints({});
            setRevealedAnswers({});
            setCarouselIndex(0);
            
            updatedData = { ...updatedData, showHelpOnNextRound: needsHelp };
            setCurrentData(updatedData);
            
            saveState({ 
                round: nextRoundNum, 
                history: newHistory, 
                evaluations: {}, 
                selectedOptions: {},
                currentData: updatedData 
            });
            
            const scrollToTop = () => {
                try {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    document.documentElement.scrollTo({ top: 0, behavior: 'smooth' });
                    document.body.scrollTo({ top: 0, behavior: 'smooth' });
                    const area = document.getElementById('activity-area-print') || document.querySelector('.overflow-y-auto');
                    if (area) {
                        area.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                } catch (_) {}
            };

            scrollToTop();
            setTimeout(scrollToTop, 100);
        } else {
            // Finale (Conclusão Épica)
            const scores = {};
            newHistory.forEach(log => {
                Object.keys(log.evaluations || {}).forEach(teamId => {
                    const status = log.evaluations[teamId];
                    const pts = status === 'success' ? 3 : status === 'partial' ? 1 : 0;
                    scores[teamId] = (scores[teamId] || 0) + pts;
                });
            });

            let maxScore = -1;
            let winnerNames = [];
            let totalPointsAll = 0;
            
            Object.keys(scores).forEach(teamId => {
                totalPointsAll += scores[teamId];
                if (scores[teamId] > maxScore) {
                    maxScore = scores[teamId];
                    const t = effectiveTeams.find(x => x.id.toString() === teamId.toString());
                    winnerNames = [t ? t.name : "Equipe"];
                } else if (scores[teamId] === maxScore) {
                    const t = effectiveTeams.find(x => x.id.toString() === teamId.toString());
                    winnerNames.push(t ? t.name : "Equipe");
                }
            });
            
            let winner = winnerNames[0] || 'Todos Nós!';
            if (winnerNames.length > 1) {
                winner = winnerNames.length === effectiveTeams.length ? "Empate Geral!" : "Empate: " + winnerNames.join(" e ");
            }
            
            const maxPossiblePoints = effectiveTeams.length * totalStages * 3;
            const averageScore = maxPossiblePoints > 0 ? (totalPointsAll / maxPossiblePoints) : 1;
            const finalStoryText = averageScore > 0.5 ? currentData?.finais?.vitoria_epica : currentData?.finais?.vitoria_com_ajuda;
            
            const finalHistoryObj = { rounds: newHistory, winner, finalStoryText };
            setCurrentData(prev => ({ ...prev, finalHistory: finalHistoryObj }));
            setRound(totalStages + 1);
            setGameStatus('finished');

            saveState({ 
                round: totalStages + 1, 
                gameStatus: 'finished', 
                history: newHistory, 
                evaluations: {}, 
                selectedOptions: {},
                currentData: { ...currentData, finalHistory: finalHistoryObj }
            });

            logRPGAction(
                'rpg_finished',
                `Aventura Concluída: Campeão ${winner}!`,
                `A expedição foi finalizada com sucesso. Campeão: "${winner}".`,
                {
                    winner,
                    scores,
                    totalStages
                }
            );

            gameAudio?.playSuccess?.();

            const scrollToTop = () => {
                try {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    document.documentElement.scrollTo({ top: 0, behavior: 'smooth' });
                    document.body.scrollTo({ top: 0, behavior: 'smooth' });
                    const area = document.getElementById('activity-area-print') || document.querySelector('.overflow-y-auto');
                    if (area) {
                        area.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                } catch (_) {}
            };

            scrollToTop();
            setTimeout(scrollToTop, 100);
        }
    };

    const restartMatch = () => {
        setRound(1);
        setHistory([]);
        setEvaluations({});
        setSelectedOptions({});
        setRevealedHints({});
        setRevealedAnswers({});
        setStudentNotebookExecutions({});
        setCarouselIndex(0);
        const updatedData = { ...currentData };
        delete updatedData.finalHistory;
        updatedData.showHelpOnNextRound = false;
        setCurrentData(updatedData);
        setGameStatus('playing');
        saveState({ 
            gameStatus: 'playing', 
            round: 1, 
            history: [], 
            currentData: updatedData, 
            evaluations: {}, 
            selectedOptions: {},
            studentNotebookExecutions: {}
        });
    };

    const clearGame = () => {
        // Se houver uma missão construída nesta aba, garante seu arquivamento na biblioteca para nunca ser perdida
        if (currentData && currentData.etapas && currentData.etapas.length > 0) {
            const missionId = currentData.id || `rpg_archived_${Date.now()}`;
            saveToRPGLibrary({
                id: missionId,
                tabId: activeTabId,
                title: currentData.titulo_aventura || activityTopic || 'Aventura do Conhecimento',
                topic: activityTopic || '',
                context: activityContext || '',
                universe: universe || 'forest',
                customLore: customLore || '',
                stageCount: currentData.etapas.length,
                participationMode,
                questionType,
                data: currentData,
                teams,
                round,
                className: currentClass?.name || 'Turma Conectada',
                classId: selectedClassId || currentClass?.id || '',
                createdAt: currentData.createdAt || new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
            });
            setSavedLibraryVersion(v => v + 1);
        }

        setGameStatus('setup');
        setRound(1);
        setHistory([]);
        setCurrentData(null);
        setEvaluations({});
        setSelectedOptions({});
        setRevealedHints({});
        setRevealedAnswers({});
        setMediaUrls({});
        setStudentNotebookExecutions({});
        saveState({ 
            gameStatus: 'setup', 
            round: 1, 
            history: [], 
            currentData: null, 
            evaluations: {}, 
            selectedOptions: {}, 
            mediaUrls: {},
            studentNotebookExecutions: {}
        });
    };

    // =========================================================================
    // MODAL DE REVISÃO DO CAPÍTULO (DESAFIOS + GABARITO DETALHADO)
    // =========================================================================
    const renderReviewChapterModal = () => {
        if (!selectedReviewChapter) return null;

        const etapas = currentData?.etapas || [];
        const currentIdx = etapas.findIndex(e => String(e.round) === String(selectedReviewChapter.round));
        // Sincroniza dinamicamente com currentData para refletir edições/detalhamentos
        const liveEtapa = etapas.find(e => String(e.round) === String(selectedReviewChapter.round)) || selectedReviewChapter;
        const enigmas = liveEtapa.enigmas || [];
        const stageNum = liveEtapa.round || currentIdx + 1;
        const isLockedForClass = gameStatus !== 'finished' && stageNum > round;

        const hasPrev = currentIdx > 0;
        const hasNext = currentIdx !== -1 && currentIdx < etapas.length - 1;

        return (
            <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto animate-fade-in no-print">
                <div className="bg-white rounded-3xl w-[96vw] max-w-6xl p-6 sm:p-8 md:p-10 shadow-2xl border-4 border-amber-300 flex flex-col max-h-[94vh] space-y-5">
                    {/* Cabeçalho do Modal */}
                    <div className="flex items-start justify-between gap-4 pb-4 border-b-2 border-slate-100 shrink-0">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white flex items-center justify-center text-3xl sm:text-4xl shadow-lg shrink-0">
                                {isLockedForClass ? '🔒' : '✨'}
                            </div>
                            <div>
                                <div className="flex items-center gap-2.5 flex-wrap">
                                    <span className={`text-xs sm:text-sm font-black uppercase tracking-wider px-3.5 py-1 rounded-full border shadow-2xs ${
                                        isLockedForClass 
                                            ? 'text-slate-600 bg-slate-100 border-slate-300' 
                                            : 'text-amber-800 bg-amber-100 border-amber-300'
                                    }`}>
                                        Capítulo {stageNum} {isLockedForClass && '• Bloqueado'}
                                    </span>
                                    {liveEtapa.local_cena && (
                                        <span className="text-sm sm:text-base md:text-lg font-bold text-slate-600 flex items-center gap-1">
                                            📍 {liveEtapa.local_cena}
                                        </span>
                                    )}
                                </div>
                                <h3 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 font-display mt-1 leading-tight">
                                    {liveEtapa.titulo_capitulo || 'Revisão do Capítulo'}
                                </h3>
                                {liveEtapa.item_recompensa && (
                                    <span className={`text-sm sm:text-base md:text-lg font-black flex items-center gap-1.5 mt-1 ${
                                        isLockedForClass ? 'text-slate-500' : 'text-indigo-700'
                                    }`}>
                                        {isLockedForClass ? '🔒 Relíquia Selada:' : '🏆 Relíquia Conquistada:'} {liveEtapa.item_recompensa}
                                    </span>
                                )}
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => {
                                setSelectedReviewChapter(null);
                                setReviewRevealedAnswers({});
                            }}
                            className="text-slate-400 hover:text-slate-700 p-2 sm:p-2.5 rounded-2xl hover:bg-slate-100 transition-colors cursor-pointer"
                            title="Fechar revisão"
                        >
                            <XCircle className="w-7 h-7 sm:w-8 sm:h-8" />
                        </button>
                    </div>

                    {/* Conteúdo com Scroll */}
                    <div className="overflow-y-auto space-y-6 flex-1 pr-2 custom-scrollbar">
                        {isLockedForClass && !reviewOverrideLocked[stageNum] ? (
                            <div className="bg-slate-50 border-2 border-slate-300 rounded-3xl p-8 sm:p-12 text-center space-y-4 my-auto">
                                <div className="w-20 h-20 rounded-3xl bg-slate-200 text-slate-500 flex items-center justify-center mx-auto text-4xl shadow-inner">
                                    🔒
                                </div>
                                <div className="space-y-2 max-w-lg mx-auto">
                                    <span className="text-xs font-black uppercase tracking-wider text-slate-500 bg-slate-200/80 px-3 py-1 rounded-full">
                                        Cena Selada
                                    </span>
                                    <h4 className="text-2xl sm:text-3xl font-black text-slate-900">
                                        Capítulo Bloqueado para esta Turma
                                    </h4>
                                    <p className="text-sm sm:text-base text-slate-600 font-medium leading-relaxed">
                                        A turma <b>{currentClass?.name || 'conectada'}</b> ainda está investigando o <b>Capítulo {round}</b>. Conclua os enigmas anteriores para que os alunos possam descobrir este mistério e desbloquear a relíquia!
                                    </p>
                                </div>
                                <div className="pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setReviewOverrideLocked(prev => ({ ...prev, [stageNum]: true }))}
                                        className="text-xs sm:text-sm font-black text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-5 py-2.5 rounded-xl transition-all cursor-pointer shadow-2xs"
                                    >
                                        🔓 Revelar Desafios e Gabarito (Modo Professor)
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                {/* Contexto Narrativo */}
                                {(liveEtapa.narrativa_avanco || liveEtapa.historia_abertura) && (
                                    <div className="bg-amber-50/80 border-2 border-amber-200/90 p-4 sm:p-6 rounded-2xl text-base sm:text-lg md:text-xl text-amber-950 font-medium leading-relaxed italic space-y-1.5 shadow-2xs">
                                        <span className="text-xs sm:text-sm font-black uppercase text-amber-800 tracking-wider not-italic block">
                                            📜 Contexto Narrativo da Cena:
                                        </span>
                                        <p>"{liveEtapa.narrativa_avanco || liveEtapa.historia_abertura}"</p>
                                    </div>
                                )}

                                 {/* Desafios e Enigmas do Capítulo */}
                                <div className="space-y-6">
                                    {(() => {
                                        const reviewEnigmasList = participationMode === 'class_students'
                                            ? (liveEtapa.enigmas || [])
                                            : effectiveTeams.map((team, idx) => getTeamEnigma(team, idx, liveEtapa.enigmas, stageNum));

                                        return (
                                            <>
                                                <h4 className="text-sm sm:text-base font-black uppercase text-slate-600 tracking-wider flex items-center gap-2">
                                                    <BookOpen className="w-5 h-5 text-indigo-600" />
                                                    <span>Desafios e Enigmas deste Capítulo ({reviewEnigmasList.length})</span>
                                                </h4>

                                                {reviewEnigmasList.length === 0 ? (
                                                    <p className="text-sm sm:text-base text-slate-500 italic">Nenhum enigma registrado para este capítulo.</p>
                                                ) : (
                                                    reviewEnigmasList.map((enigma, eIdx) => {
                                                        const isRevealed = !!reviewRevealedAnswers[eIdx];
                                                        const { intro, challenge } = parseQuestionParts(enigma.question);
                                                        const teamLabel = enigma.team || (participationMode === 'class_students' ? 'Missão Coletiva no Caderno' : `Equipe ${eIdx + 1}`);

                                                        return (
                                                            <div 
                                                                key={eIdx}
                                                                className="bg-slate-50 border-2 border-slate-300 rounded-3xl p-5 sm:p-7 md:p-8 space-y-5 shadow-xs hover:border-indigo-300 transition-colors"
                                                            >
                                            {/* Cabeçalho do Enigma */}
                                            <div className="flex items-center justify-between gap-3 flex-wrap">
                                                <span className="text-sm sm:text-base md:text-lg font-black uppercase tracking-wider text-indigo-900 bg-indigo-100 border border-indigo-200 px-4 py-1.5 rounded-xl">
                                                    🎯 {teamLabel}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => setReviewRevealedAnswers(prev => ({ ...prev, [eIdx]: !prev[eIdx] }))}
                                                    className={`text-sm sm:text-base font-black px-4 py-2.5 rounded-xl border-2 transition-all flex items-center gap-2 cursor-pointer shadow-sm active:scale-95 ${
                                                        isRevealed
                                                            ? 'bg-amber-300 text-amber-950 border-amber-500'
                                                            : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-100'
                                                    }`}
                                                >
                                                    {isRevealed ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5 text-amber-900" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5 text-amber-900" />}
                                                    <span>{isRevealed ? 'Ocultar Resposta' : '👁️ Abrir Resposta'}</span>
                                                </button>
                                            </div>

                                            {/* Enunciado da Pergunta */}
                                            <div className="space-y-2.5">
                                                {intro && (
                                                    <div className="bg-indigo-100/90 border-2 border-indigo-200 p-3.5 sm:p-4 rounded-2xl text-sm sm:text-base md:text-lg font-bold text-indigo-950">
                                                        {intro}
                                                    </div>
                                                )}
                                                <p className="font-black text-slate-900 text-xl sm:text-2xl md:text-3xl leading-snug sm:leading-relaxed">
                                                    {challenge}
                                                </p>
                                            </div>

                                            {/* Alternativas */}
                                            {enigma.options && enigma.options.length > 0 && (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                                                    {enigma.options.map((opt, i) => (
                                                        <div key={i} className="bg-white border-2 border-slate-200 p-4 sm:p-5 rounded-2xl text-sm sm:text-base md:text-lg font-bold text-slate-800 shadow-2xs">
                                                            {opt}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Dica Drácker */}
                                            {enigma.dica_dracker && (
                                                <div className="bg-amber-50 border-2 border-amber-200 p-3.5 sm:p-4 rounded-2xl text-sm sm:text-base md:text-lg text-amber-950 font-medium flex items-center gap-3">
                                                    <span className="text-2xl shrink-0">🐉</span>
                                                    <span><strong>Dica do Drácker:</strong> {enigma.dica_dracker}</span>
                                                </div>
                                            )}

                                            {/* Gabarito Aberto */}
                                            {isRevealed && (
                                                <div className="bg-amber-100/80 p-5 sm:p-7 md:p-8 rounded-2xl border-2 border-amber-400 shadow-sm space-y-4 animate-fade-in">
                                                    <div className="flex items-center justify-between gap-3 flex-wrap">
                                                        <span className="text-sm sm:text-base font-black text-amber-900 uppercase tracking-wider">
                                                            Critério / Resposta e Resolução Esperada:
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRequestDetailedAnswer(enigma, eIdx, `review_${eIdx}`)}
                                                            disabled={loadingDetailAnswer[`${liveEtapa.round}_${eIdx}_review_${eIdx}`]}
                                                            className="text-xs sm:text-sm md:text-base font-black text-amber-950 bg-amber-200 hover:bg-amber-300 border-2 border-amber-400 px-4 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-xs active:scale-95 disabled:opacity-50"
                                                            title="Solicitar ao Drácker resolução detalhada passo a passo deste desafio"
                                                        >
                                                            <Sparkles className="w-4 h-4 text-amber-800 animate-spin" style={{ animationDuration: loadingDetailAnswer[`${liveEtapa.round}_${eIdx}_review_${eIdx}`] ? '1s' : '0s' }} />
                                                            <span>
                                                                {loadingDetailAnswer[`${liveEtapa.round}_${eIdx}_review_${eIdx}`] 
                                                                    ? 'Drácker detalhando...' 
                                                                    : '🪄 Detalhar com Drácker'}
                                                            </span>
                                                        </button>
                                                    </div>
                                                    <DetailedResolutionView 
                                                        text={enigma.correct_answer} 
                                                        fontScale={130} 
                                                        textAlign="text-left" 
                                                    />
                                                </div>
                                            )}
                                            </div>
                                        );
                                    })
                                )}
                            </>
                        );
                    })()}
                </div>
            </>
        )}
    </div>

                    {/* Rodapé com Navegação */}
                    <div className="pt-4 border-t-2 border-slate-100 flex items-center justify-between gap-3 shrink-0 flex-wrap">
                        <div className="flex items-center gap-3">
                            <Button
                                type="button"
                                onClick={() => {
                                    if (hasPrev) {
                                        setSelectedReviewChapter(etapas[currentIdx - 1]);
                                        setReviewRevealedAnswers({});
                                    }
                                }}
                                disabled={!hasPrev}
                                variant="outline"
                                icon={ChevronLeft}
                                className="text-sm sm:text-base font-bold px-4 py-2 sm:px-5 sm:py-2.5 bg-white cursor-pointer"
                            >
                                Capítulo Anterior
                            </Button>
                            <Button
                                type="button"
                                onClick={() => {
                                    if (hasNext) {
                                        setSelectedReviewChapter(etapas[currentIdx + 1]);
                                        setReviewRevealedAnswers({});
                                    }
                                }}
                                disabled={!hasNext}
                                variant="outline"
                                className="text-sm sm:text-base font-bold px-4 py-2 sm:px-5 sm:py-2.5 bg-white cursor-pointer"
                            >
                                Próximo Capítulo <ChevronRight className="w-4 h-4 ml-1" />
                            </Button>
                        </div>
                        <Button
                            type="button"
                            onClick={() => {
                                setSelectedReviewChapter(null);
                                setReviewRevealedAnswers({});
                            }}
                            variant="primary"
                            className="bg-slate-900 hover:bg-slate-800 text-white text-sm sm:text-base font-bold px-6 py-2.5 cursor-pointer rounded-xl"
                        >
                            Fechar Revisão
                        </Button>
                    </div>
                </div>
            </div>
        );
    };

    // =========================================================================
    // MODAIS DE AULA OFICIAL: DURAÇÃO (50/100 MIN) E MODO TESTE / OFICIAL
    // =========================================================================
    const renderOfficialClassDurationModal = () => {
        if (!showClassDurationModal) return null;

        return (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[80] flex items-center justify-center p-4 animate-fade-in no-print">
                <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-indigo-200 flex flex-col space-y-6">
                    <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center text-xl shrink-0">
                                ⏱️
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-slate-900">
                                    Duração da Aula Oficial
                                </h3>
                                <p className="text-xs text-slate-500 font-medium">
                                    Turma: <span className="font-bold text-indigo-600">{currentClass?.name || 'Selecionada'}</span> • Escolha o tempo previsto:
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={handleCancelLaunch}
                            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                            title="Cancelar"
                        >
                            <XCircle className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="space-y-3">
                        {/* Opção 1: 1 Aula Oficial (50 min) */}
                        <button
                            type="button"
                            onClick={() => startOfficialClass(50)}
                            className="w-full text-left p-4 rounded-2xl border-2 border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/50 transition-all flex items-center justify-between group cursor-pointer"
                        >
                            <div className="flex items-center gap-3.5">
                                <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-sm group-hover:scale-105 transition-transform">
                                    1
                                </div>
                                <div>
                                    <div className="text-sm font-black text-slate-800 group-hover:text-indigo-900 flex items-center gap-2">
                                        <span>1 Aula Oficial</span>
                                        <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-bold">50 minutos</span>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        Período regular padrão (limite automático de até 50 min).
                                    </p>
                                </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                        </button>

                        {/* Opção 2: 2 Aulas Oficiais (100 min) */}
                        <button
                            type="button"
                            onClick={() => startOfficialClass(100)}
                            className="w-full text-left p-4 rounded-2xl border-2 border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/50 transition-all flex items-center justify-between group cursor-pointer"
                        >
                            <div className="flex items-center gap-3.5">
                                <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-black text-sm group-hover:scale-105 transition-transform">
                                    2
                                </div>
                                <div>
                                    <div className="text-sm font-black text-slate-800 group-hover:text-purple-900 flex items-center gap-2">
                                        <span>2 Aulas Oficiais</span>
                                        <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-bold">100 minutos</span>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        Período de aula dupla contínua (limite automático de até 100 min).
                                    </p>
                                </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all" />
                        </button>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-[11px] text-slate-600 flex items-start gap-2">
                        <span className="text-indigo-600 text-xs shrink-0">ℹ️</span>
                        <span>
                            Caso você não encerre manualmente a aula ao término das atividades, o tempo oficial consolidado no registro será automaticamente limitado ao tempo escolhido.
                        </span>
                    </div>
                </div>
            </div>
        );
    };

    const renderMissionLaunchTypeModal = () => {
        if (!showLaunchTypeModal) return null;

        return (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[80] flex items-center justify-center p-4 animate-fade-in no-print">
                <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-amber-200 flex flex-col space-y-6">
                    <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center text-xl shrink-0">
                                🚀
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-slate-900">
                                    Início da Missão de RPG
                                </h3>
                                <p className="text-xs text-slate-500 font-medium">
                                    Nenhuma Aula Oficial está em andamento no momento.
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={handleCancelLaunch}
                            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                            title="Cancelar"
                        >
                            <XCircle className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="space-y-3">
                        {/* Opção 1: Modo Teste / Demonstração */}
                        <button
                            type="button"
                            onClick={confirmLaunchAsTest}
                            className="w-full text-left p-4 rounded-2xl border-2 border-slate-200 hover:border-amber-500 hover:bg-amber-50/50 transition-all flex items-center justify-between group cursor-pointer"
                        >
                            <div className="flex items-center gap-3.5">
                                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center text-lg group-hover:scale-105 transition-transform">
                                    🧪
                                </div>
                                <div>
                                    <div className="text-sm font-black text-slate-800 group-hover:text-amber-900 flex items-center gap-2">
                                        <span>Modo Teste / Demonstração</span>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        Explore e teste a aventura livremente sem registrar pontos ou faltas nos alunos.
                                    </p>
                                </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-amber-600 group-hover:translate-x-1 transition-all" />
                        </button>

                        {/* Opção 2: Iniciar Aula Oficial */}
                        <button
                            type="button"
                            onClick={confirmLaunchAsOfficial}
                            className="w-full text-left p-4 rounded-2xl border-2 border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/50 transition-all flex items-center justify-between group cursor-pointer"
                        >
                            <div className="flex items-center gap-3.5">
                                <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center text-lg group-hover:scale-105 transition-transform">
                                    🎓
                                </div>
                                <div>
                                    <div className="text-sm font-black text-slate-800 group-hover:text-indigo-900 flex items-center gap-2">
                                        <span>Iniciar como Aula Oficial</span>
                                        <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-bold">50 ou 100 min</span>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        Ativa o cronômetro oficial da turma ({currentClass?.name || 'conectada'}), pontuação e presenças.
                                    </p>
                                </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                        </button>
                    </div>

                    <div className="pt-2 flex justify-end">
                        <button
                            type="button"
                            onClick={handleCancelLaunch}
                            className="text-xs font-bold text-slate-500 hover:text-slate-800 px-4 py-2 rounded-xl transition-colors cursor-pointer"
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    // =========================================================================
    // MODAL DE MISSÕES JÁ CONSTRUÍDAS (BIBLIOTECA & VISUALIZADOR DE DESAFIOS)
    // =========================================================================
    const renderSavedMissionsModal = () => {
        if (!showSavedMissionsModal) return null;

        return (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4 overflow-y-auto animate-fade-in no-print">
                        <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-7 shadow-2xl border border-amber-200 flex flex-col max-h-[88vh]">
                            <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white flex items-center justify-center text-xl shadow-xs shrink-0">
                                        🗺️
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black text-slate-900">
                                            Missões Já Construídas
                                        </h3>
                                        <p className="text-xs text-slate-500 font-medium">
                                            {allBuiltMissions.length > 0
                                                ? `${allBuiltMissions.length} expedição(ões) encontrada(s). Visualize os desafios ou carregue para jogar:`
                                                : 'Nenhuma expedição construída encontrada no momento:'}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowSavedMissionsModal(false);
                                        setExpandedMissionId(null);
                                    }}
                                    className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                                    title="Fechar"
                                >
                                    <XCircle className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="overflow-y-auto py-4 space-y-3.5 flex-1 pr-1">
                                {allBuiltMissions.length === 0 ? (
                                    <div className="text-center py-10 px-4 text-slate-500 space-y-3 bg-amber-50/50 rounded-2xl border border-amber-200">
                                        <BookOpen className="w-12 h-12 mx-auto text-amber-500 opacity-60" />
                                        <h4 className="text-base font-black text-slate-800">
                                            Nenhuma expedição foi construída ainda
                                        </h4>
                                        <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                                            Para construir sua primeira missão, feche este card, preencha o <b>Tema e Contexto Pedagógico</b> abaixo na tela de montagem e clique no botão verde <b>"Iniciar Missão do Conhecimento"</b>.
                                        </p>
                                    </div>
                                ) : (
                                    allBuiltMissions.map((m) => {
                                        const mData = m.data;
                                        const uObj = RPG_UNIVERSES.find(u => u.id === m.universe) || RPG_UNIVERSES[0];
                                        const isExpanded = expandedMissionId === m.id;
                                        const stageTotal = mData?.etapas?.length || m.stageCount || 4;
                                        const curRound = m.round || 1;

                                        return (
                                            <div 
                                                key={m.id}
                                                className={`p-4 sm:p-5 rounded-2xl border transition-all space-y-3 shadow-2xs ${
                                                    m.isCurrentTab 
                                                        ? 'bg-amber-50/60 border-amber-300 ring-1 ring-amber-300' 
                                                        : 'bg-slate-50 hover:bg-amber-50/30 border-slate-200 hover:border-amber-300'
                                                }`}
                                            >
                                                {/* Cabeçalho do Card da Missão */}
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                                    <div className="flex items-start gap-3">
                                                        <span className="text-3xl select-none shrink-0 mt-0.5">{uObj.bannerIcon || '🗺️'}</span>
                                                        <div className="space-y-1">
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <h4 className="text-base font-black text-slate-900">
                                                                    {m.title}
                                                                </h4>
                                                                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                                                                    m.isCurrentTab
                                                                        ? 'bg-amber-200 text-amber-900'
                                                                        : m.isOtherTab
                                                                        ? 'bg-indigo-100 text-indigo-800'
                                                                        : 'bg-emerald-100 text-emerald-800'
                                                                }`}>
                                                                    {m.originBadge}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 flex-wrap">
                                                                <span>📍 {uObj.title}</span>
                                                                <span>•</span>
                                                                <span>🎓 {m.className}</span>
                                                                <span>•</span>
                                                                <span className="text-amber-700 font-bold">Capítulo {curRound} de {stageTotal}</span>
                                                                {m.createdAt && (
                                                                    <>
                                                                        <span>•</span>
                                                                        <span className="text-slate-400">{m.createdAt}</span>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Botões de Ação do Card */}
                                                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                                                        <button
                                                            type="button"
                                                            onClick={() => setExpandedMissionId(isExpanded ? null : m.id)}
                                                            className={`text-xs font-bold px-3.5 py-2 rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer ${
                                                                isExpanded 
                                                                    ? 'bg-slate-800 text-white border-slate-800' 
                                                                    : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                                                            }`}
                                                            title="Visualizar enredo e desafios de cada capítulo"
                                                        >
                                                            {isExpanded ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5 text-indigo-600" />}
                                                            <span>{isExpanded ? 'Ocultar Roteiro' : 'Ver Desafios'}</span>
                                                        </button>

                                                        <Button
                                                            type="button"
                                                            onClick={() => loadMissionToPlay(m)}
                                                            className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-black px-4 py-2 rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
                                                        >
                                                            <Play className="w-3.5 h-3.5 fill-current" />
                                                            <span>Iniciar Missão</span>
                                                        </Button>

                                                        {m.isLibrary && (
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    if (window.confirm(`Deseja remover "${m.title}" da biblioteca permanente?`)) {
                                                                        removeFromRPGLibrary(m.id);
                                                                        setSavedLibraryVersion(v => v + 1);
                                                                        toast('Missão removida da biblioteca');
                                                                    }
                                                                }}
                                                                className="text-slate-400 hover:text-red-600 p-2 rounded-xl hover:bg-red-50 transition-colors cursor-pointer"
                                                                title="Remover da biblioteca permanente"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Detalhes Pedagógicos Resumidos */}
                                                {(m.topic || m.context) && (
                                                    <div className="text-xs text-slate-600 bg-white/80 p-2.5 rounded-xl border border-slate-200/80 leading-relaxed">
                                                        {m.topic && <span className="font-bold text-slate-800">Tema: {m.topic}</span>}
                                                        {m.context && <span className="text-slate-500 ml-2">— Contexto: {m.context.slice(0, 100)}{m.context.length > 100 ? '...' : ''}</span>}
                                                    </div>
                                                )}

                                                {/* Visualizador Completo do Roteiro e Desafios (Expansão) */}
                                                {isExpanded && (
                                                    <div className="pt-3 border-t border-slate-200/80 space-y-3 animate-fade-in">
                                                        {mData?.historia_abertura && (
                                                            <div className="bg-amber-100/50 p-3 rounded-xl border border-amber-200 text-xs text-slate-800">
                                                                <span className="font-bold text-amber-900 block mb-1">📜 Abertura da Expedição:</span>
                                                                <p className="italic leading-relaxed">{mData.historia_abertura}</p>
                                                            </div>
                                                        )}

                                                        <div className="space-y-2">
                                                            <span className="text-xs font-black uppercase text-slate-600 tracking-wider block">
                                                                Capítulos & Desafios Gerados ({stageTotal}):
                                                            </span>
                                                            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                                                                {(mData?.etapas || []).map((et, eIdx) => {
                                                                    const epNum = et.round || eIdx + 1;
                                                                    const firstEnigma = et.enigmas?.[0];

                                                                    return (
                                                                        <div key={epNum} className="p-3 rounded-xl bg-white border border-slate-200 text-xs space-y-1.5 shadow-2xs">
                                                                            <div className="flex items-center justify-between gap-2">
                                                                                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                                                                    <span className="w-5 h-5 rounded-md bg-amber-500 text-white flex items-center justify-center text-[10px] font-black">
                                                                                        {epNum}
                                                                                    </span>
                                                                                    <span>{et.titulo_capitulo || `Capítulo ${epNum}`}</span>
                                                                                </div>
                                                                                <div className="text-[11px] text-slate-500 font-medium">
                                                                                    {et.local_cena && <span>📍 {et.local_cena}</span>}
                                                                                    {et.item_recompensa && <span className="ml-2 font-semibold text-amber-700">🏆 {et.item_recompensa}</span>}
                                                                                </div>
                                                                            </div>

                                                                            {et.narrativa_avanco && (
                                                                                <p className="text-slate-600 italic text-[11px]">
                                                                                    {et.narrativa_avanco}
                                                                                </p>
                                                                            )}

                                                                            {firstEnigma && (
                                                                                <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 space-y-1">
                                                                                    <span className="font-bold text-indigo-700 block">
                                                                                        🧩 Desafio ({firstEnigma.team || 'Geral'}):
                                                                                    </span>
                                                                                    <p className="text-slate-800 font-medium">
                                                                                        {firstEnigma.question}
                                                                                    </p>
                                                                                    {firstEnigma.correct_answer && (
                                                                                        <p className="text-emerald-700 font-semibold text-[11px]">
                                                                                            ✓ Resposta correta: {firstEnigma.correct_answer}
                                                                                        </p>
                                                                                    )}
                                                                                    {firstEnigma.dica_dracker && (
                                                                                        <p className="text-amber-800 text-[11px]">
                                                                                            💡 Dica do Drácker: {firstEnigma.dica_dracker}
                                                                                        </p>
                                                                                    )}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })
                                )}
                            </div>

                            <div className="pt-3 border-t border-slate-100 flex justify-end">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowSavedMissionsModal(false);
                                        setExpandedMissionId(null);
                                    }}
                                    className="text-xs font-bold text-slate-500 hover:text-slate-800 px-4 py-2 rounded-xl transition-colors cursor-pointer"
                                >
                                    Fechar
                                </button>
                            </div>
                        </div>
                    </div>
        );
    };

    // =========================================================================
    // TELA 1: MONTAGEM / SETUP REFORMULADA (OPÇÃO A)
    // =========================================================================
    if (gameStatus === 'setup') {
        const selectedUniverseObj = RPG_UNIVERSES.find(u => u.id === universe) || RPG_UNIVERSES[0];

        return (
            <div className="w-full max-w-[1540px] mx-auto px-3 sm:px-6 space-y-8 animate-fade-in pb-16">
                {renderReviewChapterModal()}
                {renderSavedMissionsModal()}

                {/* Modal do Guia Pedagógico de RPG */}
                <RPGDocGuideModal isOpen={showDocGuideModal} onClose={() => setShowDocGuideModal(false)} />

                {/* Modais de Aula Oficial e Escolha de Modo (Sempre no topo absoluto da pilha) */}
                {renderOfficialClassDurationModal()}
                {renderMissionLaunchTypeModal()}

                {/* Cabeçalho Principal do RPG */}
                <div className="text-center space-y-3">
                    <div className="w-20 h-20 bg-gradient-to-br from-amber-400 via-orange-500 to-amber-600 rounded-3xl flex items-center justify-center mx-auto shadow-lg shadow-orange-500/20 border-4 border-amber-200 relative">
                        <span className="text-4xl select-none">🐉</span>
                        <Sparkles className="w-5 h-5 text-yellow-200 absolute -top-1 -right-1 animate-bounce" />
                    </div>
                    <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight font-display">
                        Mestre Drácker: RPG Educacional
                    </h2>
                    <p className="text-slate-600 max-w-xl mx-auto text-base font-medium">
                        Transforme sua aula em uma grande expedição investigativa com o Drácker e seus companheiros de aventura!
                    </p>
                    <div className="flex items-center justify-center gap-2 pt-1">
                        <button
                            type="button"
                            onClick={() => setShowSavedMissionsModal(true)}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl font-bold text-xs sm:text-sm bg-amber-50 hover:bg-amber-100 text-amber-900 border-2 border-amber-300 shadow-xs transition-all cursor-pointer hover:scale-105 active:scale-95"
                            title="Ver e carregar expedições já construídas ou salvas"
                        >
                            <Compass className="w-4 h-4 text-amber-600" />
                            <span>🗺️ Missões Já Construídas ({allBuiltMissions.length})</span>
                        </button>
                    </div>
                </div>

                {/* 0. CARD DE CONTEÚDO & CONTEXTO PEDAGÓGICO (TEMA E ORIENTAÇÕES) */}
                <Card className="border-indigo-100 shadow-md bg-white p-6 sm:p-8 rounded-3xl space-y-4">
                    <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                        <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                            <Wand2 className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-base sm:text-lg font-black text-slate-900">
                                Tema & Contexto Pedagógico da Missão
                            </h3>
                            <p className="text-xs text-slate-500 font-medium">
                                Defina o assunto pedagógico que o Drácker transformará nos desafios investigativos da aula.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-4 pt-1">
                        <div className="space-y-1.5">
                            <label className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center justify-between">
                                <span>Título / Conteúdo a ser trabalhado <b className="text-red-500">*</b></span>
                                <span className="text-[10px] text-slate-400 font-medium lowercase">ex: Sólidos Geométricos, Frações, Fotossíntese...</span>
                            </label>
                            <Input
                                placeholder="Digite o tema pedagógico da aventura..."
                                value={activityTopic}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setActivityTopic(val);
                                    saveState({ activityTopic: val });
                                    if (activeTabId && updateActivityData) {
                                        updateActivityData(activeTabId, {
                                            topic: val,
                                            title: val ? `RPG: ${val}` : 'RPG Educacional'
                                        });
                                    }
                                }}
                                className="w-full text-sm font-bold py-2.5 rounded-xl border-slate-200 bg-slate-50 focus:bg-white"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center justify-between">
                                <span>Contexto Pedagógico & Instruções da Aula (Opcional)</span>
                                <span className="text-[10px] text-slate-400 font-medium lowercase">habilidades bncc, foco ou detalhes</span>
                            </label>
                            <textarea
                                rows={3}
                                placeholder="Instruções pedagógicas adicionais para o Drácker equilibrar os enigmas (ex: foco no cálculo de arestas e vértices, habilidades específicas da BNCC, texto de apoio da aula)..."
                                value={activityContext}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setActivityContext(val);
                                    saveState({ activityContext: val });
                                    if (activeTabId && updateActivityData) {
                                        updateActivityData(activeTabId, {
                                            details: val
                                        });
                                    }
                                }}
                                className="w-full text-xs sm:text-sm font-medium p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-400 outline-hidden transition-all resize-y"
                            />
                        </div>
                    </div>
                </Card>

                {/* 1. SEÇÃO DE TURMA & EQUIPES CONECTADAS (SEM DUPLICAÇÃO) */}
                <Card className="border-slate-200 shadow-xl bg-white p-6 sm:p-8 rounded-3xl relative overflow-hidden">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                        <div className="space-y-1">
                            <span className="text-xs font-black uppercase tracking-wider text-indigo-600 flex items-center gap-1.5">
                                <GraduationCap className="w-4 h-4" /> Turma Oficial Conectada
                            </span>
                            
                            <div className="flex items-center gap-2 flex-wrap">
                                <div className="relative inline-flex items-center">
                                    <select
                                        value={currentClass?.id || ''}
                                        onChange={(e) => handleClassChange(e.target.value)}
                                        className="text-xl sm:text-2xl font-black text-slate-900 bg-slate-50 hover:bg-slate-100 focus:bg-white border-2 border-slate-200 hover:border-indigo-400 focus:border-indigo-600 rounded-2xl pl-3 pr-10 py-1 cursor-pointer transition-all outline-hidden appearance-none shadow-xs"
                                        title="Clique para alternar para outra turma"
                                    >
                                        {classes && classes.length > 0 ? (
                                            classes.map(c => (
                                                <option key={c.id} value={c.id} className="text-base font-bold text-slate-800">
                                                    {c.name}
                                                </option>
                                            ))
                                        ) : (
                                            <option value="" className="text-base font-bold text-slate-800">
                                                {currentClass?.name || 'Nenhuma Turma Cadastrada'}
                                            </option>
                                        )}
                                    </select>
                                    <ChevronDown className="w-5 h-5 text-indigo-600 absolute right-3 pointer-events-none" />
                                </div>

                                <button
                                    type="button"
                                    onClick={toggleClassStatus}
                                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl font-bold text-xs transition-all border shadow-xs cursor-pointer ${
                                        isClassActive 
                                            ? 'bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100 ring-2 ring-rose-400/30' 
                                            : 'bg-white text-indigo-700 border-indigo-200 hover:bg-indigo-50'
                                    }`}
                                    title={isClassActive ? 'Encerrar aula oficial' : 'Iniciar aula oficial com esta turma'}
                                >
                                    {isClassActive ? <Square className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                                    <span>{isClassActive ? `ENCERRAR AULA (${elapsedTimeStr})` : 'INICIAR AULA OFICIAL'}</span>
                                </button>
                            </div>

                            <p className="text-xs text-slate-500 font-medium pt-0.5">
                                {classStudents.length} aluno(s) matriculado(s) • {classGroups.length} equipe(s) configurada(s)
                                {absentStudentIds.length > 0 && (
                                    <span className="text-slate-400 font-normal ml-1.5">
                                        • {absentStudentIds.length} ausente(s)
                                    </span>
                                )}
                            </p>
                        </div>

                        {/* Seletor de Modo de Participação */}
                        <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 self-start sm:self-auto">
                            <button
                                type="button"
                                onClick={() => setParticipationMode('class_groups')}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                                    participationMode === 'class_groups' 
                                        ? 'bg-white text-indigo-700 shadow-xs border border-indigo-200 font-black' 
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                <ShieldCheck className="w-3.5 h-3.5" />
                                <span>Equipes da Turma</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setParticipationMode('class_students')}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                                    participationMode === 'class_students' 
                                        ? 'bg-white text-indigo-700 shadow-xs border border-indigo-200 font-black' 
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                <Users className="w-3.5 h-3.5" />
                                <span>Individual</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setParticipationMode('custom_teams')}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                                    participationMode === 'custom_teams' 
                                        ? 'bg-white text-indigo-700 shadow-xs border border-indigo-200 font-black' 
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Personalizado</span>
                            </button>
                        </div>
                    </div>

                    {/* Conteúdo do Modo: EQUIPES DA TURMA (ROLETA) */}
                    {participationMode === 'class_groups' && (
                        <div className="mt-6 space-y-4">
                            {classGroups.length > 0 ? (
                                <>
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                            Equipes sincronizadas com a Roleta ({classGroups.length})
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => handleAutoGenerateClassGroups(classGroups.length)}
                                            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors cursor-pointer"
                                            title="Redistribuir alunos mantendo o número de equipes"
                                        >
                                            <Shuffle className="w-3 h-3" /> Reembaralhar Integrantes
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                        {classGroups.map((group, idx) => {
                                            const memberCount = (group.studentIds || []).length;
                                            return (
                                                <div 
                                                    key={group.id || idx} 
                                                    className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-between shadow-2xs hover:border-indigo-300 transition-all"
                                                >
                                                    <div className="flex items-center gap-3 overflow-hidden">
                                                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-white font-black text-xs shadow-xs ${group.color || 'bg-indigo-600'}`}>
                                                            {idx + 1}
                                                        </div>
                                                        <div className="truncate">
                                                            <h5 className="font-bold text-slate-800 text-sm truncate">{group.name}</h5>
                                                            <p className="text-[11px] text-slate-500 font-medium">
                                                                {memberCount} aluno(s)
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </>
                            ) : (
                                <div className="text-center py-8 px-4 bg-indigo-50/50 rounded-2xl border-2 border-dashed border-indigo-200 space-y-3">
                                    <ShieldCheck className="w-10 h-10 text-indigo-400 mx-auto opacity-70" />
                                    <div>
                                        <h4 className="font-bold text-indigo-950 text-base">Nenhuma equipe criada na turma ainda</h4>
                                        <p className="text-xs text-indigo-700 max-w-md mx-auto mt-1">
                                            Você pode gerar as equipes com 1 clique agora. Elas serão salvas na turma e ficarão disponíveis também na Roleta!
                                        </p>
                                    </div>
                                    <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                                        <Button
                                            type="button"
                                            onClick={() => handleAutoGenerateClassGroups(3)}
                                            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-4 py-2 rounded-xl"
                                        >
                                            ⚡ Criar 3 Equipes Balanceadas
                                        </Button>
                                        <Button
                                            type="button"
                                            onClick={() => handleAutoGenerateClassGroups(4)}
                                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-4 py-2 rounded-xl"
                                        >
                                            ⚡ Criar 4 Equipes Balanceadas
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Conteúdo do Modo: ALUNOS INDIVIDUAIS COM NOMES COMPLETOS E RISCO DISCRETO PARA AUSENTES */}
                    {participationMode === 'class_students' && (
                        <div className="mt-6 space-y-3">
                            <div className="flex items-center justify-between pb-1">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                        Exploradores Individuais da Turma ({classStudents.length})
                                    </span>
                                    {absentStudentIds.length > 0 && (
                                        <span className="text-xs text-slate-400 font-medium">
                                            • {absentStudentIds.length} ausente{absentStudentIds.length > 1 ? 's' : ''}
                                        </span>
                                    )}
                                </div>
                                {absentStudentIds.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={markAllStudentsPresent}
                                        className="text-xs text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer"
                                        title="Remover todas as faltas"
                                    >
                                        Limpar faltas
                                    </button>
                                )}
                            </div>

                            {/* Grade de Alunos com Nomes Completos e Risco no Nome para Ausentes */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 max-h-96 overflow-y-auto p-1 pr-2">
                                {classStudents.map((student, idx) => {
                                    const isAbsent = absentStudentIds.includes(student.id);
                                    return (
                                        <button
                                            key={student.id || idx}
                                            type="button"
                                            onClick={() => toggleStudentAbsent(student.id)}
                                            className={`rounded-xl px-3.5 py-2.5 flex items-center gap-3 border transition-all cursor-pointer text-left min-h-[46px] shadow-2xs ${
                                                isAbsent
                                                    ? 'bg-slate-100/60 border-slate-200 hover:bg-slate-100'
                                                    : 'bg-slate-50 hover:bg-white border-slate-200 hover:border-slate-300'
                                            }`}
                                            title={
                                                isAbsent 
                                                    ? `${student.name} (Ausente). Clique para desmarcar falta.` 
                                                    : `${student.name}. Clique para marcar falta.`
                                            }
                                        >
                                            <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] shrink-0 font-bold ${
                                                isAbsent 
                                                    ? 'bg-slate-200 text-slate-400' 
                                                    : 'bg-indigo-50 text-indigo-700'
                                            }`}>
                                                {idx + 1}
                                            </span>
                                            <span className={`text-xs sm:text-sm font-bold leading-snug break-words flex-1 ${
                                                isAbsent 
                                                    ? 'line-through decoration-slate-400 decoration-2 text-slate-400' 
                                                    : 'text-slate-700'
                                            }`}>
                                                {student.name}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Conteúdo do Modo: EQUIPES PERSONALIZADAS */}
                    {participationMode === 'custom_teams' && (
                        <div className="mt-6 space-y-4">
                            <div className="flex flex-col sm:flex-row gap-2">
                                <Input 
                                    placeholder="Nome do esquadrão ou guilda..." 
                                    value={newTeamName}
                                    onChange={(e) => setNewTeamName(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddCustomTeam()}
                                    className="bg-slate-50 border-slate-200 text-sm py-2 rounded-xl"
                                />
                                <Button onClick={handleAddCustomTeam} icon={Plus} className="bg-slate-800 hover:bg-slate-900 text-white text-xs rounded-xl whitespace-nowrap">
                                    Adicionar Equipe
                                </Button>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                {customTeams.map((team, idx) => (
                                    <div key={team.id} className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex justify-between items-center group">
                                        <div className="flex items-center gap-2 truncate">
                                            <span className="w-6 h-6 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-black text-xs shrink-0">{idx + 1}</span>
                                            <span className="font-bold text-slate-800 text-xs truncate">{team.name}</span>
                                        </div>
                                        <button onClick={() => handleRemoveCustomTeam(team.id)} className="text-slate-300 hover:text-red-500 p-1 transition-colors">
                                            <XCircle className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </Card>

                {/* 2. ESCOLHA DO UNIVERSO DA AVENTURA */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                                <Map className="w-5 h-5 text-amber-500" /> Escolha o Universo da Aventura
                            </h3>
                            <p className="text-xs text-slate-500 font-medium">
                                O Drácker adaptará a história, os personagens companheiros e os enigmas ao universo selecionado.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {RPG_UNIVERSES.map((u) => {
                            const isSelected = universe === u.id;
                            const IconComponent = u.icon;

                            return (
                                <button
                                    key={u.id}
                                    type="button"
                                    onClick={() => setUniverse(u.id)}
                                    className={`relative text-left p-4 rounded-3xl border-2 transition-all cursor-pointer flex flex-col justify-between overflow-hidden shadow-xs ${
                                        isSelected 
                                            ? `${u.borderColor} ring-2 ${u.activeRing} shadow-md scale-[1.01]` 
                                            : 'border-slate-200 hover:border-slate-300 bg-white'
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-2 mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-2xl">{u.bannerIcon}</span>
                                            <div>
                                                <h4 className="font-black text-slate-900 text-sm leading-tight">{u.title}</h4>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{u.subtitle}</span>
                                            </div>
                                        </div>
                                        {isSelected && (
                                            <span className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0">
                                                <CheckCircle className="w-3.5 h-3.5" />
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-slate-600 line-clamp-2 mt-1">
                                        {u.description}
                                    </p>
                                </button>
                            );
                        })}
                    </div>

                    {/* Campo de Lore personalizada quando 'custom' for escolhido */}
                    {universe === 'custom' && (
                        <div className="p-4 bg-amber-50/70 border-2 border-amber-200 rounded-2xl space-y-2 animate-in fade-in duration-200">
                            <label className="text-xs font-black text-amber-900 uppercase tracking-wider block">
                                Descreva a premissa da aventura personalizada:
                            </label>
                            <Input 
                                placeholder="Ex: Viagem no tempo ao Egito Antigo, Robótica em uma fábrica mágica..." 
                                value={customLore}
                                onChange={(e) => setCustomLore(e.target.value)}
                                className="bg-white border-amber-300 text-sm py-2 rounded-xl"
                            />
                        </div>
                    )}
                </div>

                {/* 3. PARÂMETROS PEDAGÓGICOS DA MISSÃO */}
                <Card className="border-slate-200 shadow-xl bg-white p-6 sm:p-8 rounded-3xl space-y-6">
                    <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                        <Wand2 className="w-5 h-5 text-indigo-600" /> Parâmetros da Missão
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Tipo de Pergunta */}
                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-600 uppercase tracking-wider block flex items-center gap-1.5">
                                <Target className="w-4 h-4 text-indigo-500" /> Formato dos Enigmas
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setQuestionType('multiple_choice')}
                                    className={`p-3 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                                        questionType === 'multiple_choice' 
                                            ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-200' 
                                            : 'border-slate-200 hover:border-slate-300 bg-white'
                                    }`}
                                >
                                    <span className="font-black text-slate-800 text-xs block">Múltipla Escolha</span>
                                    <span className="text-[11px] text-slate-500 font-medium">Opções A, B, C, D</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setQuestionType('essay')}
                                    className={`p-3 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                                        questionType === 'essay' 
                                            ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-200' 
                                            : 'border-slate-200 hover:border-slate-300 bg-white'
                                    }`}
                                >
                                    <span className="font-black text-slate-800 text-xs block">Dissertativa / Oral</span>
                                    <span className="text-[11px] text-slate-500 font-medium">Avaliação do Mestre</span>
                                </button>
                            </div>
                        </div>

                        {/* Duração / Número de Capítulos */}
                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-600 uppercase tracking-wider block flex items-center gap-1.5">
                                <Layers className="w-4 h-4 text-indigo-500" /> Extensão da Aventura
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                                {[
                                    { stages: 3, label: '3 Capítulos', sub: '~15 min' },
                                    { stages: 4, label: '4 Capítulos', sub: '~25 min (Padrão)' },
                                    { stages: 5, label: '5 Capítulos', sub: '~40 min (Épico)' }
                                ].map(item => (
                                    <button
                                        key={item.stages}
                                        type="button"
                                        onClick={() => setStageCount(item.stages)}
                                        className={`p-2.5 rounded-2xl border-2 text-center transition-all cursor-pointer ${
                                            stageCount === item.stages
                                                ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-200' 
                                                : 'border-slate-200 hover:border-slate-300 bg-white'
                                        }`}
                                    >
                                        <span className="font-black text-slate-800 text-xs block">{item.label}</span>
                                        <span className="text-[10px] text-slate-500 font-medium">{item.sub}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </Card>

                {/* 4. SEÇÃO INTELIGENTE DE MÍDIAS DOS CAPÍTULOS */}
                <Card className="border-indigo-100 shadow-md bg-gradient-to-r from-indigo-50/60 via-white to-purple-50/60 p-6 sm:p-7 rounded-3xl space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                                <Video className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                                    Mídias dos Capítulos (Vídeos do YouTube ou Imagens)
                                </h3>
                                <p className="text-xs text-slate-500 font-medium">
                                    As cenas e cenários serão gerados pela IA. Você poderá vincular as mídias conhecendo os títulos e locais de cada cena logo após abrir a aventura, ou diretamente durante a apresentação!
                                </p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => setShowSetupMediaCustomizer(!showSetupMediaCustomizer)}
                            className="text-xs font-bold text-indigo-700 hover:text-indigo-900 bg-white hover:bg-indigo-50 border border-indigo-200 px-3.5 py-2 rounded-xl transition-all shrink-0 cursor-pointer shadow-2xs self-start sm:self-auto"
                        >
                            {showSetupMediaCustomizer ? 'Ocultar Pré-configuração' : 'Pré-configurar Links Agora (Opcional)'}
                        </button>
                    </div>

                    {showSetupMediaCustomizer && (
                        <div className="pt-3 border-t border-indigo-100 space-y-2.5 animate-fade-in">
                            <span className="text-[11px] font-bold text-slate-600 block">
                                Opcional: Cole os links caso já possua mídias planejadas para cada momento da aula:
                            </span>
                            {Array.from({ length: stageCount }, (_, i) => i + 1).map((chapterNum) => (
                                <div key={chapterNum} className="flex flex-col sm:flex-row sm:items-center gap-2.5 p-2.5 rounded-xl bg-white border border-slate-200">
                                    <span className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0">
                                        {chapterNum}
                                    </span>
                                    <span className="text-xs font-bold text-slate-700 min-w-[80px]">
                                        Capítulo {chapterNum}
                                    </span>
                                    <div className="flex-1 relative">
                                        <Input
                                            placeholder="Cole link do YouTube ou imagem (JPG, PNG)..."
                                            value={mediaUrls[chapterNum] || ''}
                                            onChange={(e) => {
                                                const updated = { ...mediaUrls, [chapterNum]: e.target.value };
                                                setMediaUrls(updated);
                                                saveState({ mediaUrls: updated });
                                            }}
                                            className="bg-slate-50 text-xs py-1.5 rounded-lg pr-7"
                                        />
                                        {mediaUrls[chapterNum] && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const updated = { ...mediaUrls };
                                                    delete updated[chapterNum];
                                                    setMediaUrls(updated);
                                                    saveState({ mediaUrls: updated });
                                                }}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-500 p-0.5 cursor-pointer"
                                            >
                                                <XCircle className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>

                {/* BOTÃO PRINCIPAL DE INÍCIO */}
                <Button 
                    onClick={handleStartGameClick} 
                    className="w-full py-5 text-xl font-black bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 shadow-xl shadow-orange-500/20 text-white rounded-2xl transform transition-transform active:scale-98 flex items-center justify-center gap-3 cursor-pointer"
                >
                    <Sparkles className="w-6 h-6 animate-pulse" />
                    <span>Abrir o Portal da Aventura Mágica!</span>
                </Button>
            </div>
        );
    }

    // =========================================================================
    // TELA 2: CARREGAMENTO / GERAÇÃO DA HISTÓRIA
    // =========================================================================
    if (gameStatus === 'loading') {
        const selectedUniverseObj = RPG_UNIVERSES.find(u => u.id === universe) || RPG_UNIVERSES[0];

        return (
            <div className="flex flex-col items-center justify-center min-h-[500px] space-y-6 animate-fade-in">
                <div className="relative">
                    <div className="w-24 h-24 bg-gradient-to-br from-amber-400 to-orange-500 rounded-3xl flex items-center justify-center animate-bounce shadow-xl border-4 border-amber-200">
                        <span className="text-5xl">{selectedUniverseObj.bannerIcon}</span>
                    </div>
                    <Sparkles className="w-8 h-8 text-amber-400 absolute -top-2 -right-2 animate-spin" />
                </div>
                <div className="text-center space-y-2 max-w-md">
                    <h3 className="text-2xl font-black text-slate-800 font-display">
                        O Mestre Drácker está criando a história...
                    </h3>
                    <p className="text-slate-500 font-medium text-sm">
                        Conectando os enigmas pedagógicos, equilibrando os desafios das equipes e preparando o livro-jogo de <b>{selectedUniverseObj.title}</b>!
                    </p>
                </div>
            </div>
        );
    }

    // =========================================================================
    // TELA 3: APRESENTAÇÃO DO JOGO / JOGANDO (FASE B: NARRATIVA & IMERSÃO)
    // =========================================================================
    if (gameStatus === 'playing') {
        const selectedUniverseObj = RPG_UNIVERSES.find(u => u.id === universe) || RPG_UNIVERSES[0];
        const etapaAtual = currentData?.etapas?.[round - 1];
        const storyText = round === 1 ? currentData?.historia_abertura : etapaAtual?.narrativa_avanco;
        const enigmas = etapaAtual?.enigmas || [];
        const isStorybookMode = false; // Modo padrão em que o texto utiliza toda a largura da área branca
        const currentMedia = mediaUrls[round] || '';
        const totalStages = currentData?.etapas?.length || stageCount || 4;

        const handleRemoveMedia = () => {
            const newMediaUrls = {...mediaUrls};
            delete newMediaUrls[round];
            setMediaUrls(newMediaUrls);
            saveState({ mediaUrls: newMediaUrls });
        };

        const renderMedia = () => {
            if (!currentMedia) return null;
            const isYoutube = currentMedia.includes('youtube.com') || currentMedia.includes('youtu.be');
            
            let videoId = '';
            if (isYoutube) {
                if (currentMedia.includes('v=')) {
                    videoId = currentMedia.split('v=')[1]?.split('&')[0];
                } else if (currentMedia.includes('youtu.be/')) {
                    videoId = currentMedia.split('youtu.be/')[1]?.split('?')[0];
                }
            }

            return (
                <div className="relative group w-full mb-6">
                    {isYoutube && videoId ? (
                        <div className="aspect-video w-full rounded-2xl overflow-hidden shadow-lg border border-slate-200 bg-black">
                            <iframe 
                                src={`https://www.youtube.com/embed/${videoId}?autoplay=0`} 
                                className="w-full h-full"
                                allowFullScreen
                                title="Story Video"
                            ></iframe>
                        </div>
                    ) : (
                        <div className="aspect-video w-full rounded-2xl overflow-hidden shadow-lg border border-slate-200 bg-slate-50 flex items-center justify-center">
                            <img src={toDirectImageUrl(currentMedia)} alt="Ilustração da História" className="w-full h-full object-cover" referrerPolicy="no-referrer" onError={handleDriveImageError} />
                        </div>
                    )}
                    
                    <button 
                        onClick={handleRemoveMedia}
                        className="absolute top-4 right-4 bg-white/90 text-red-500 hover:text-red-700 hover:bg-white p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all no-print transform hover:scale-110 cursor-pointer"
                        title="Remover Mídia"
                    >
                        <XCircle className="w-6 h-6" />
                    </button>
                </div>
            );
        };

        const renderStoryColumn = () => (
            <div className="prose prose-lg max-w-none text-slate-800 leading-relaxed space-y-6">
                {/* Barra de Tipografia e Edição da História */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-wrap gap-2 not-prose">
                    <span className="text-xs font-black uppercase text-amber-800 tracking-wider flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-amber-600" /> Narrativa da Missão
                    </span>
                    <RPGTypographyToolbar
                        fontScale={fontScale}
                        onIncreaseFont={handleIncreaseFont}
                        onDecreaseFont={handleDecreaseFont}
                        onResetFont={handleResetFont}
                        textAlign={textAlign}
                        onSetAlign={handleSetAlign}
                        onEdit={() => handleOpenEditStory(etapaAtual, storyText)}
                        editTooltip="Editar história deste capítulo"
                    />
                </div>

                {renderMedia()}

                {/* Botão Clean e Opcional para Inserir ou Editar Mídia nesta Cena durante a Missão */}
                <div className="no-print">
                    {!currentMedia && !showMediaInlineInput && (
                        <div className="flex justify-end mb-2">
                            <button
                                type="button"
                                onClick={() => setShowMediaInlineInput(true)}
                                className="text-xs font-bold text-slate-500 hover:text-indigo-600 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                                title={`Inserir imagem ou vídeo do YouTube nesta cena (${etapaAtual?.titulo_capitulo || `Capítulo ${round}`})`}
                            >
                                <Video className="w-3.5 h-3.5 text-indigo-500" />
                                <span>+ Inserir Link de Mídia em &ldquo;{etapaAtual?.titulo_capitulo || `Capítulo ${round}`}&rdquo;</span>
                            </button>
                        </div>
                    )}

                    {showMediaInlineInput && (
                        <div className="mb-4 p-3.5 bg-indigo-50/60 rounded-2xl border border-indigo-200 flex flex-col gap-2.5 shadow-xs">
                            <div className="flex items-center justify-between text-xs font-bold text-indigo-900">
                                <span className="flex items-center gap-1.5 truncate">
                                    <Video className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                                    <span>Mídia para: <b>{etapaAtual?.titulo_capitulo || `Capítulo ${round}`}</b></span>
                                    {etapaAtual?.local_cena && (
                                        <span className="text-slate-500 font-medium hidden sm:inline">• 📍 {etapaAtual.local_cena}</span>
                                    )}
                                </span>
                                <button 
                                    type="button"
                                    onClick={() => setShowMediaInlineInput(false)}
                                    className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer shrink-0"
                                    title="Fechar"
                                >
                                    <XCircle className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="flex flex-col sm:flex-row items-center gap-2">
                                <Input 
                                    placeholder="Cole a URL da Imagem (JPG, PNG, Drive) ou vídeo do YouTube..." 
                                    value={mediaUrls[round] || ''}
                                    onChange={(e) => {
                                        const newMediaUrls = {...mediaUrls, [round]: e.target.value};
                                        setMediaUrls(newMediaUrls);
                                        saveState({ mediaUrls: newMediaUrls });
                                    }}
                                    className="w-full bg-white text-xs sm:text-sm py-2 rounded-xl"
                                    autoFocus
                                />
                                <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                                    <Button 
                                        size="sm" 
                                        onClick={() => setShowMediaInlineInput(false)}
                                        className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-4 py-2 rounded-xl cursor-pointer"
                                    >
                                        Concluir
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div 
                    className={`${textAlign} leading-relaxed transition-all`}
                    style={{ fontSize: `${fontScale}%` }}
                >
                    {renderMarkdown(storyText)}
                </div>
            </div>
        );

        // Renderizador da Missão no Caderno com Checklist dos Alunos
        const renderNotebookMission = () => {
            const enigmaPrincipal = enigmas[0] || {
                question: 'Resolvam o desafio deste capítulo em seus cadernos escolares.',
                options: [],
                dica_dracker: 'Prestem atenção aos detalhes e organizem suas anotações com clareza.',
                correct_answer: 'Conferência visual no caderno.'
            };
            const currentRoundMap = studentNotebookExecutions[round] || {};
            const sortedClassStudents = [...classStudents].sort((a, b) => 
                (a.name || '').localeCompare(b.name || '', 'pt-BR', { sensitivity: 'base' })
            );
            const presentStudents = sortedClassStudents.filter(s => !absentStudentIds.includes(s.id));
            const absentStudents = sortedClassStudents.filter(s => absentStudentIds.includes(s.id));
            const executedCount = presentStudents.filter(s => currentRoundMap[s.id] === 'done' || currentRoundMap[s.id] === true).length;
            const notExecutedCount = presentStudents.filter(s => currentRoundMap[s.id] === 'not_done' || currentRoundMap[s.id] === false).length;
            const unselectedCount = presentStudents.filter(s => currentRoundMap[s.id] === undefined || currentRoundMap[s.id] === null || currentRoundMap[s.id] === 'none').length;
            const executedPct = presentStudents.length > 0 ? Math.round((executedCount / presentStudents.length) * 100) : 0;
            const notExecutedPct = presentStudents.length > 0 ? Math.round((notExecutedCount / presentStudents.length) * 100) : 0;
            const unselectedPct = presentStudents.length > 0 ? Math.round((unselectedCount / presentStudents.length) * 100) : 0;

            return (
                <div className="p-4 sm:p-6 md:p-8 xl:p-10 flex flex-col w-full max-w-7xl mx-auto space-y-6">
                    {/* Barra Superior do Slide: Controles de Tipografia, Edição e Dica do Drácker */}
                    <div className="flex justify-between items-center pb-1 flex-wrap gap-2">
                        <span className="text-xs font-black uppercase text-indigo-700 tracking-wider flex items-center gap-1.5">
                            <span>📓</span> Desafio Coletivo no Caderno
                        </span>
                        <div className="flex items-center gap-2 flex-wrap">
                            <RPGTypographyToolbar
                                fontScale={fontScale}
                                onIncreaseFont={handleIncreaseFont}
                                onDecreaseFont={handleDecreaseFont}
                                onResetFont={handleResetFont}
                                textAlign={textAlign}
                                onSetAlign={handleSetAlign}
                                onEdit={() => handleOpenEditEnigma(enigmaPrincipal, 0, 'Missão no Caderno')}
                                editTooltip="Editar enunciado no caderno"
                            />
                            <button
                                type="button"
                                onClick={() => toggleHint('notebook_mission')}
                                className="text-xs font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                            >
                                <Lightbulb className="w-4 h-4 text-amber-600" />
                                <span>{revealedHints['notebook_mission'] ? 'Ocultar Dica' : '💡 Dica do Drácker'}</span>
                            </button>
                        </div>
                    </div>

                    {/* Dica Revelada */}
                    {revealedHints['notebook_mission'] && (
                        <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border-2 border-amber-300 p-4 rounded-2xl animate-fade-in flex items-start gap-3 shadow-xs">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white flex items-center justify-center text-xl shrink-0 shadow-xs">
                                🐉
                            </div>
                            <div className="space-y-1">
                                <span className="text-xs font-black uppercase text-amber-800 tracking-wider block">
                                    Sussurro do Drácker para os Cadernos:
                                </span>
                                <p className="text-sm font-semibold text-amber-950 leading-relaxed italic">
                                    "{enigmaPrincipal.dica_dracker || 'Leiam o enunciado com calma e registrem os passos no caderno antes da resposta final!'}"
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Enunciado da Missão no Caderno com instrução separada */}
                    {(() => {
                        const { intro, challenge } = parseQuestionParts(enigmaPrincipal.question);
                        return (
                            <div 
                                className="bg-slate-50 p-6 md:p-8 rounded-3xl border-2 border-slate-200 space-y-5 shadow-xs"
                                style={{ fontSize: `${fontScale}%` }}
                            >
                                {/* Frase de Convocação separada do texto */}
                                {intro && (
                                    <div className="bg-gradient-to-r from-indigo-100/90 via-purple-50 to-indigo-50 border-2 border-indigo-300 p-4 sm:p-5 rounded-2xl flex items-start gap-3.5 shadow-sm">
                                        <span className="text-2xl sm:text-3xl select-none shrink-0 mt-0.5">✍️</span>
                                        <div className="space-y-1 w-full">
                                            <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-indigo-800 block">
                                                Instrução para a Turma
                                            </span>
                                            <p className={`text-base sm:text-lg md:text-xl font-black text-indigo-950 leading-relaxed ${textAlign}`}>
                                                {intro}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Desafio do Enigma em Destaque Especial */}
                                <div className="space-y-2 pt-1">
                                    <span className="text-xs font-black uppercase tracking-wider text-slate-500 block">
                                        Desafio da Investigação:
                                    </span>
                                    <p className={`font-black text-slate-900 leading-relaxed font-display ${textAlign}`}>
                                        {challenge}
                                    </p>
                                </div>

                                {enigmaPrincipal.options && enigmaPrincipal.options.length > 0 && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                                        {enigmaPrincipal.options.map((opt, i) => (
                                            <div 
                                                key={i} 
                                                className={`bg-white border-2 border-slate-200 p-3.5 rounded-xl font-bold text-slate-800 text-sm md:text-base flex items-center gap-2.5 shadow-2xs ${textAlign}`}
                                            >
                                                <span className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 font-black text-xs flex items-center justify-center shrink-0">
                                                    {String.fromCharCode(65 + i)}
                                                </span>
                                                <span>{opt}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })()}

                    {/* Gabarito Oculto para o Professor conferir */}
                    <div className="bg-amber-50/70 p-4 sm:p-5 rounded-2xl border-2 border-dashed border-amber-300 transition-all space-y-3">
                        <div className="flex items-center justify-between gap-3 flex-wrap">
                            <span className="text-xs font-black text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                                <Search className="w-4 h-4 text-amber-700"/> Gabarito do Mestre
                            </span>
                            <div className="flex items-center gap-2 flex-wrap">
                                {revealedAnswers['notebook_mission'] && (
                                    <button
                                        type="button"
                                        onClick={() => handleRequestDetailedAnswer(enigmaPrincipal, 0, 'notebook_mission')}
                                        disabled={loadingDetailAnswer[`${round}_0_notebook_mission`]}
                                        className="text-xs font-bold text-amber-900 bg-amber-200 hover:bg-amber-300 border border-amber-400 px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 disabled:opacity-50"
                                        title="Solicitar ao Drácker a resolução detalhada passo a passo deste desafio"
                                    >
                                        <Sparkles className="w-3.5 h-3.5 text-amber-700 animate-spin" style={{ animationDuration: loadingDetailAnswer[`${round}_0_notebook_mission`] ? '1s' : '0s' }} />
                                        <span>
                                            {loadingDetailAnswer[`${round}_0_notebook_mission`] 
                                                ? 'Drácker detalhando resolução...' 
                                                : (enigmaPrincipal.correct_answer && enigmaPrincipal.correct_answer.length > 50 
                                                    ? 'Atualizar Resolução Detalhada' 
                                                    : '🪄 Detalhar Resolução Passo a Passo')}
                                        </span>
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={() => toggleRevealAnswer('notebook_mission')}
                                    className="text-xs font-bold text-amber-900 bg-amber-200/80 hover:bg-amber-300 border border-amber-400 px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                                >
                                    {revealedAnswers['notebook_mission'] ? (
                                        <>
                                            <EyeOff className="w-3.5 h-3.5 text-amber-800" />
                                            <span>Ocultar Gabarito</span>
                                        </>
                                    ) : (
                                        <>
                                            <Eye className="w-3.5 h-3.5 text-amber-800" />
                                            <span>👁️ Revelar Resposta</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        {revealedAnswers['notebook_mission'] ? (
                            <div className="pt-2 border-t border-amber-200/80 animate-fade-in space-y-2">
                                <span className="text-xs text-amber-800 font-bold block uppercase tracking-wider">
                                    Critério / Resposta e Resolução Esperada:
                                </span>
                                <div className="bg-amber-100/70 p-4 sm:p-5 rounded-2xl border border-amber-300/80 shadow-2xs">
                                    <DetailedResolutionView 
                                        text={enigmaPrincipal.correct_answer} 
                                        fontScale={fontScale} 
                                        textAlign={textAlign} 
                                    />
                                </div>
                            </div>
                        ) : (
                            <p className="text-xs text-amber-700 italic select-none">
                                Gabarito protegido para projeção na lousa da turma.
                            </p>
                        )}
                    </div>

                    {/* CHECKLIST INTERATIVO DOS ALUNOS */}
                    <div className="bg-white p-5 md:p-6 rounded-3xl border-2 border-indigo-200 shadow-md space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                            <div>
                                <h5 className="text-base font-black text-slate-900 flex items-center gap-2">
                                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                                    <span>Conferência dos Cadernos dos Alunos</span>
                                </h5>
                                <p className="text-xs text-slate-500 font-medium">
                                    Marque os alunos que executaram a missão desta etapa em seus cadernos:
                                </p>
                            </div>

                            <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
                                {executedCount > 0 && (
                                    <span 
                                        className="text-xs font-black px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1.5 shadow-2xs whitespace-nowrap"
                                        title={`${executedCount} de ${presentStudents.length} alunos presentes executaram (${executedPct}%)`}
                                    >
                                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                        <span>{executedCount} Fez (+1 pt)</span>
                                    </span>
                                )}
                                {notExecutedCount > 0 && (
                                    <span 
                                        className="text-xs font-black px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1.5 shadow-2xs whitespace-nowrap"
                                        title={`${notExecutedCount} aluno(s) não executaram (${notExecutedPct}%)`}
                                    >
                                        <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                                        <span>{notExecutedCount} Não Fez (-1 pt)</span>
                                    </span>
                                )}
                                {unselectedCount > 0 && (
                                    <span 
                                        className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-300 flex items-center gap-1.5 shadow-2xs whitespace-nowrap"
                                        title={`${unselectedCount} aluno(s) sem seleção (${unselectedPct}%)`}
                                    >
                                        <HelpCircle className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                        <span>{unselectedCount} Sem Seleção</span>
                                    </span>
                                )}
                                {absentStudents.length > 0 && (
                                    <span 
                                        className="text-xs font-black px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-300 flex items-center gap-1.5 shadow-2xs whitespace-nowrap"
                                        title={`${absentStudents.length} aluno(s) ausente(s) nesta aula`}
                                    >
                                        <UserX className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                        <span>{absentStudents.length} Ausente</span>
                                    </span>
                                )}
                                <button
                                    type="button"
                                    onClick={clearAllNotebook}
                                    className="text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-300 px-3 py-1.5 rounded-xl transition-all cursor-pointer shadow-2xs flex items-center gap-1.5"
                                    title="Limpar seleção para todos os alunos (permanecem sem seleção com 0 ponto)"
                                >
                                    <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                                    <span>Limpar Todos</span>
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 max-h-[460px] overflow-y-auto pr-1">
                            {sortedClassStudents.map((student) => {
                                const isAbsent = absentStudentIds.includes(student.id);
                                const studentStatus = currentRoundMap[student.id];
                                const isDone = studentStatus === 'done' || studentStatus === true;
                                const isNotDone = studentStatus === 'not_done' || studentStatus === false;

                                if (isAbsent) {
                                    return (
                                        <button
                                            key={student.id}
                                            type="button"
                                            onClick={() => toggleStudentAbsent(student.id)}
                                            className="p-3 rounded-2xl border-2 text-left flex items-center justify-between gap-2.5 transition-all cursor-pointer min-h-[58px] shadow-2xs bg-slate-100/90 border-slate-300 text-slate-600 hover:bg-slate-200/90"
                                            title={`${student.name} está ausente na aula (não recebe nem perde pontos). Clique para marcar como Presente.`}
                                        >
                                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                                <div className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 shadow-2xs bg-slate-400 text-white">
                                                    <UserX className="w-4 h-4" />
                                                </div>
                                                <span className="text-xs sm:text-sm font-bold leading-snug break-words flex-1 line-through text-slate-500">
                                                    {student.name}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1.5 shrink-0">
                                                <span className="text-[10px] font-black uppercase text-slate-600 bg-slate-200 border border-slate-300 px-1.5 py-0.5 rounded-md">
                                                    Ausente (0 pt)
                                                </span>
                                            </div>
                                        </button>
                                    );
                                }

                                return (
                                    <div
                                        key={student.id}
                                        onClick={() => toggleStudentNotebook(student.id)}
                                        className={`p-3 rounded-2xl border-2 text-left flex items-center justify-between gap-2.5 transition-all cursor-pointer min-h-[58px] shadow-2xs select-none ${
                                            isDone
                                                ? 'bg-emerald-50/90 border-emerald-500 text-emerald-950 ring-2 ring-emerald-200/80 hover:bg-emerald-100/90'
                                                : isNotDone
                                                ? 'bg-rose-50/95 border-rose-400 text-rose-950 ring-2 ring-rose-200/80 hover:bg-rose-100/90'
                                                : 'bg-white hover:bg-slate-50/90 border-slate-200 hover:border-slate-300 text-slate-800'
                                        }`}
                                        title={
                                            isDone
                                                ? `${student.name}: Realizou no caderno (+1 pt). Clique para alternar para Não Realizou.`
                                                : isNotDone
                                                ? `${student.name}: Não realizou no caderno (-1 pt). Clique para alternar para Sem Seleção.`
                                                : `${student.name}: Sem seleção (0 pt). Clique para marcar como Realizou.`
                                        }
                                    >
                                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 shadow-2xs ${
                                                isDone ? 'bg-emerald-600 text-white' : isNotDone ? 'bg-rose-600 text-white' : 'bg-slate-200 text-slate-700'
                                            }`}>
                                                {student.name.charAt(0).toUpperCase()}
                                            </div>
                                            <span className={`text-xs sm:text-sm leading-snug break-words flex-1 ${
                                                isDone || isNotDone ? 'font-black' : 'font-bold text-slate-800'
                                            }`}>
                                                {student.name}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-1.5 shrink-0">
                                            {isDone && (
                                                <CheckCircle className="w-5 h-5 text-emerald-600 fill-emerald-100 shrink-0" />
                                            )}
                                            {isNotDone && (
                                                <XCircle className="w-5 h-5 text-rose-600 fill-rose-100 shrink-0" />
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            );
        };

        return (
            <div className="w-full max-w-[1680px] mx-auto px-2 sm:px-4 lg:px-6 space-y-6 animate-fade-in pb-16">
                {renderReviewChapterModal()}
                {renderSavedMissionsModal()}
                {renderOfficialClassDurationModal()}
                {renderMissionLaunchTypeModal()}
                {/* Modal de Confirmação de Reinício da Missão */}
                {showRestartModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in no-print">
                        <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border-2 border-slate-200 space-y-6 text-center">
                            <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto text-3xl shadow-xs">
                                <RotateCcw className="w-8 h-8" />
                            </div>
                            
                            <div className="space-y-2">
                                <h3 className="text-2xl font-black text-slate-900">
                                    Reiniciar Missão?
                                </h3>
                                <p className="text-sm text-slate-600 font-medium leading-relaxed">
                                    Escolha como deseja reiniciar esta expedição com os alunos:
                                </p>
                            </div>

                            <div className="flex flex-col gap-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowRestartModal(false);
                                        restartMatch();
                                        toast('Aventura reiniciada no Capítulo 1!');
                                    }}
                                    className="w-full py-3 px-4 rounded-xl font-black text-sm bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
                                >
                                    <RotateCcw className="w-4 h-4" />
                                    <span>Reiniciar do Capítulo 1 (Mesma História)</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowRestartModal(false);
                                        setGameStatus('setup');
                                        saveState({ gameStatus: 'setup' });
                                        toast('Voltando para a tela de montagem...');
                                    }}
                                    className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center gap-2 transition-all cursor-pointer"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    <span>Voltar para a Montagem (Configurações)</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setShowRestartModal(false)}
                                    className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Modal Inteligente de Mídias dos Capítulos & Cenas */}
                {showMediaManagerModal && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-fade-in no-print">
                        <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl border border-indigo-100 flex flex-col max-h-[90vh]">
                            <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-xs shrink-0">
                                        <Video className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black text-slate-900">
                                            Mídias das Cenas & Capítulos
                                        </h3>
                                        <p className="text-xs text-slate-500 font-medium">
                                            Com a história gerada, vincule ilustrações ou vídeos do YouTube conhecendo o enredo de cada momento!
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowMediaManagerModal(false)}
                                    className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                                    title="Fechar"
                                >
                                    <XCircle className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="overflow-y-auto py-4 space-y-3.5 flex-1 pr-1">
                                {(currentData?.etapas || Array.from({ length: totalStages }, (_, i) => ({ round: i + 1, titulo_capitulo: `Capítulo ${i + 1}` }))).map((etapa, idx) => {
                                    const epRound = etapa.round || idx + 1;
                                    const currentLink = mediaUrls[epRound] || '';
                                    const isYoutube = currentLink.includes('youtube.com') || currentLink.includes('youtu.be');
                                    const isCurrentPlayingRound = epRound === round;

                                    return (
                                        <div 
                                            key={epRound} 
                                            className={`p-4 rounded-2xl border transition-all space-y-2.5 ${
                                                isCurrentPlayingRound 
                                                    ? 'bg-indigo-50/50 border-indigo-300 ring-1 ring-indigo-200' 
                                                    : 'bg-slate-50/70 border-slate-200 hover:border-slate-300'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between flex-wrap gap-2">
                                                <div className="flex items-center gap-2.5">
                                                    <span className={`w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center shadow-xs ${
                                                        isCurrentPlayingRound 
                                                            ? 'bg-indigo-600 text-white' 
                                                            : 'bg-slate-200 text-slate-700'
                                                    }`}>
                                                        {epRound}
                                                    </span>
                                                    <div>
                                                        <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                                            <span>{etapa.titulo_capitulo || `Capítulo ${epRound}`}</span>
                                                            {isCurrentPlayingRound && (
                                                                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                                                                    Cena Atual
                                                                </span>
                                                            )}
                                                        </h4>
                                                        {etapa.local_cena && (
                                                            <span className="text-[11px] font-medium text-indigo-600 flex items-center gap-1">
                                                                📍 {etapa.local_cena}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                {currentLink && (
                                                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 flex items-center gap-1">
                                                        <Check className="w-3 h-3" />
                                                        {isYoutube ? 'Vídeo Conectado' : 'Imagem Conectada'}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <div className="relative flex-1">
                                                    <Input
                                                        placeholder="Cole link do YouTube ou imagem (JPG, PNG, Google Drive)..."
                                                        value={currentLink}
                                                        onChange={(e) => {
                                                            const newUrls = { ...mediaUrls, [epRound]: e.target.value };
                                                            setMediaUrls(newUrls);
                                                            saveState({ mediaUrls: newUrls });
                                                        }}
                                                        className="text-xs bg-white py-1.5 rounded-xl border-slate-200 pr-7"
                                                    />
                                                    {currentLink && (
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                const newUrls = { ...mediaUrls };
                                                                delete newUrls[epRound];
                                                                setMediaUrls(newUrls);
                                                                saveState({ mediaUrls: newUrls });
                                                            }}
                                                            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500 p-0.5 cursor-pointer"
                                                            title="Remover mídia deste capítulo"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                                <span className="text-xs font-semibold text-slate-500">
                                    {Object.values(mediaUrls).filter(Boolean).length} de {totalStages} capítulos com mídia vinculada
                                </span>
                                <Button
                                    type="button"
                                    onClick={() => setShowMediaManagerModal(false)}
                                    className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
                                >
                                    Concluir e Voltar
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Barra Superior da Expedição */}
                <div className="flex justify-between items-center bg-gradient-to-r from-amber-100 to-orange-100 text-amber-950 px-4 py-3 rounded-2xl font-bold shadow-sm border border-amber-200 relative overflow-hidden">
                    <div className="flex items-center gap-2 sm:gap-3 relative z-10">
                        <span className="text-xl select-none">{selectedUniverseObj.bannerIcon || '🗺️'}</span>
                        <div className="leading-tight">
                            <span className="hidden sm:inline text-xs font-black uppercase text-amber-700 block tracking-wider">
                                {selectedUniverseObj.title}
                            </span>
                            <span className="text-sm sm:text-base font-black text-slate-900 truncate max-w-sm sm:max-w-xl block">
                                {currentData?.titulo_aventura || 'Aventura do Conhecimento'}
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 relative z-10 flex-wrap">
                        {/* Indicador de Modo Teste */}
                        {isTestMode && !isClassActive && (
                            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl font-bold text-xs bg-amber-50 text-amber-800 border border-amber-300 shadow-2xs">
                                <span>🧪</span>
                                <span>Modo Teste</span>
                            </div>
                        )}

                        {/* Botão Cronômetro Bomba do Sistema */}
                        <button
                            type="button"
                            onClick={() => setShowTimerBomb(prev => !prev)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-all border shadow-xs cursor-pointer ${
                                showTimerBomb 
                                ? 'bg-amber-400 text-slate-950 border-amber-500 shadow-sm font-black' 
                                : 'bg-white text-slate-700 border-amber-200 hover:bg-amber-50'
                            }`}
                            title="Acoplar Cronômetro Bomba Oficial do Sistema"
                        >
                            <span className="text-sm">💣</span>
                            <span>{showTimerBomb ? 'Ocultar Cronômetro' : 'Cronômetro'}</span>
                        </button>

                        {/* Gerenciador de Mídias das Cenas */}
                        <button
                            type="button"
                            onClick={() => setShowMediaManagerModal(true)}
                            className="text-xs font-bold text-amber-900 bg-white hover:bg-indigo-50 hover:text-indigo-700 px-3 py-1.5 rounded-xl border border-amber-200 hover:border-indigo-300 transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                            title="Configurar mídias de cada cena com base nos capítulos gerados"
                        >
                            <Video className="w-3.5 h-3.5 text-indigo-600" />
                            <span className="hidden md:inline">Mídias das Cenas</span>
                            {Object.values(mediaUrls).filter(Boolean).length > 0 && (
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            )}
                        </button>

                        {/* Botão de Reiniciar Missão */}
                        <button 
                            type="button"
                            onClick={() => setShowRestartModal(true)} 
                            className="text-xs text-amber-900 hover:text-red-600 font-bold flex items-center gap-1.5 transition-colors bg-white hover:bg-red-50 px-3 py-1.5 rounded-xl shadow-xs border border-amber-200 cursor-pointer"
                            title="Reiniciar a missão"
                        >
                            <RotateCcw className="w-3.5 h-3.5 text-amber-700" /> 
                            <span className="hidden sm:inline">Reiniciar Missão</span>
                        </button>
                    </div>
                </div>

                {/* Cronômetro Oficial do Sistema Acoplado */}
                {showTimerBomb && (
                    <div className="w-full animate-fade-in">
                        <RouletteTimerBomb
                            className="w-full"
                            isDocked={true}
                            viewMode={timerBombViewMode}
                            onViewModeChange={(mode) => {
                                setTimerBombViewMode(mode);
                                try { localStorage.setItem('preferred_rpg_timer_mode', mode); } catch(e) {}
                            }}
                            onClose={() => setShowTimerBomb(false)}
                            onExplode={() => {}}
                        />
                    </div>
                )}

                {/* BANNER IMERSIVO DA CENA / CAPÍTULO (FASE B) */}
                <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden border-2 border-amber-300">
                    <div className="absolute -right-4 -bottom-8 opacity-20 text-8xl sm:text-9xl select-none pointer-events-none">
                        {selectedUniverseObj.bannerIcon || '🐉'}
                    </div>
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="bg-white/20 backdrop-blur-xs px-3 py-0.5 rounded-full text-xs font-black uppercase tracking-wider text-amber-100 border border-white/25">
                                    Capítulo {round} de {totalStages}
                                </span>
                                {etapaAtual?.local_cena && (
                                    <span className="bg-black/20 backdrop-blur-xs px-3 py-0.5 rounded-full text-xs font-black tracking-wide text-white border border-white/15 flex items-center gap-1">
                                        📍 {etapaAtual.local_cena}
                                    </span>
                                )}
                            </div>
                            <h2 className="text-2xl sm:text-3xl font-black font-display tracking-tight text-white drop-shadow-xs">
                                {etapaAtual?.titulo_capitulo || (round === 1 ? 'O Chamado da Aventura' : `Capítulo ${round}: O Mistério Aprofunda`)}
                            </h2>
                            <p className="text-amber-100 text-xs sm:text-sm font-medium">
                                {currentData?.titulo_aventura || 'Expedição Investigativa do Drácker'}
                            </p>
                        </div>

                        {/* Artefato / Recompensa em jogo neste capítulo */}
                        {etapaAtual?.item_recompensa && (
                            <div className="bg-white/15 backdrop-blur-md border border-white/30 rounded-2xl p-3 sm:px-4 sm:py-3 flex items-center gap-3 shrink-0 self-start md:self-auto shadow-md">
                                <div className="w-10 h-10 rounded-xl bg-amber-300 text-amber-950 flex items-center justify-center text-xl shadow-xs shrink-0 animate-pulse">
                                    ✨
                                </div>
                                <div>
                                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-200 block">
                                        Artefato em Jogo
                                    </span>
                                    <span className="text-xs sm:text-sm font-black text-white">
                                        {etapaAtual.item_recompensa}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Balão de Reforço Pedagógico do Drácker (apenas a partir do round 2 se a turma precisar de ajuda) */}
                {currentData.showHelpOnNextRound && round > 1 && (
                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-l-8 border-amber-500 p-6 rounded-r-2xl shadow-md flex flex-col md:flex-row gap-4 animate-fade-in">
                        <div className="bg-amber-500 p-3 rounded-2xl h-fit shadow-inner shrink-0 text-white text-2xl flex items-center justify-center">
                            🐉
                        </div>
                        <div>
                            <h3 className="font-black text-amber-950 text-lg mb-1 flex items-center gap-2">
                                Dica do Mestre Drácker:
                            </h3>
                            <p className="text-amber-900 font-medium text-base italic bg-white/70 p-3 rounded-xl border border-amber-200">
                                {currentData.reforco_pedagogico}
                            </p>
                        </div>
                    </div>
                )}

                {/* MODO CARROSSEL / TELÃO */}
                {isStorybookMode ? (
                    <div className="flex justify-center w-full">
                        <div className="w-full max-w-[1600px] flex flex-col gap-6">
                            <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden relative flex flex-col min-h-[600px]">
                                
                                {/* Cabeçalho do Carrossel (Navegação de Equipes) */}
                                <div className="bg-slate-50 border-b border-slate-200 p-4 flex justify-between items-center relative z-10 flex-wrap gap-2">
                                    <div className="flex gap-2 items-center flex-wrap">
                                        <button 
                                            onClick={() => setCarouselIndex(0)}
                                            className={`flex items-center gap-2 px-3 py-1.5 rounded-full font-bold text-xs transition-all cursor-pointer ${carouselIndex === 0 ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}
                                        >
                                            <BookOpen className="w-3.5 h-3.5" /> História
                                        </button>
                                        <span className="text-slate-300">|</span>
                                        {participationMode === 'class_students' ? (
                                            <button 
                                                type="button"
                                                onClick={() => setCarouselIndex(1)}
                                                className={`px-3 py-1.5 rounded-full transition-all text-xs font-bold cursor-pointer flex items-center gap-1.5 ${
                                                    carouselIndex === 1 
                                                        ? 'bg-indigo-600 text-white shadow-xs scale-105' 
                                                        : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                                                }`}
                                            >
                                                <span>📓 Missão no Caderno</span>
                                                {(() => {
                                                    const execCount = Object.values(studentNotebookExecutions[round] || {}).filter(v => v === 'done' || v === true).length;
                                                    return (
                                                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${
                                                            carouselIndex === 1 ? 'bg-white text-indigo-700' : 'bg-indigo-100 text-indigo-800'
                                                        }`}>
                                                            {execCount}/{classStudents.length}
                                                        </span>
                                                    );
                                                })()}
                                            </button>
                                        ) : (
                                            effectiveTeams.map((team, idx) => {
                                                return (
                                                    <button 
                                                        key={team.id || idx} 
                                                        onClick={() => setCarouselIndex(idx + 1)}
                                                        className={`px-2.5 py-1 rounded-full transition-all text-xs font-bold cursor-pointer flex items-center gap-1.5 ${
                                                            carouselIndex === idx + 1 
                                                                ? 'bg-indigo-600 text-white shadow-xs scale-105' 
                                                                : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                                                        }`}
                                                    >
                                                        <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                                                        <span>{team.name}</span>
                                                    </button>
                                                );
                                            })
                                        )}
                                    </div>
                                </div>

                                {/* Conteúdo do Slide */}
                                <div className="flex-grow flex flex-col relative animate-fade-in">
                                    {carouselIndex === 0 ? (
                                        <div className="p-6 md:p-10 xl:p-14 flex flex-col items-center w-full max-w-6xl mx-auto">
                                            <div className="text-center mb-6 w-full border-b border-slate-100 pb-4">
                                                <span className="text-xs font-black uppercase tracking-wider text-amber-700 block mb-1">
                                                    {etapaAtual?.local_cena ? `📍 ${etapaAtual.local_cena}` : 'Cenário da Investigação'}
                                                </span>
                                                <h3 className="text-3xl md:text-4xl font-black text-slate-900 font-display">
                                                    {etapaAtual?.titulo_capitulo || (round === 1 ? 'O Mistério Começa...' : `Capítulo ${round}: A Investigação`)}
                                                </h3>
                                            </div>
                                            <div className="w-full text-xl md:text-2xl leading-relaxed">
                                                {renderStoryColumn()}
                                            </div>
                                        </div>
                                    ) : (
                                        participationMode === 'class_students' ? (
                                            renderNotebookMission()
                                        ) : (
                                            (() => {
                                                const teamIdx = carouselIndex - 1;
                                                const team = effectiveTeams[teamIdx];
                                                if (!team) return null;
                                                const enigma = getTeamEnigma(team, teamIdx, etapaAtual?.enigmas, round);

                                            return (
                                                <div className="p-6 md:p-10 xl:p-14 flex flex-col w-full max-w-6xl mx-auto space-y-6">
                                                    <div className="flex items-center justify-between gap-4 flex-wrap">
                                                        <div className="flex items-center gap-4">
                                                            <div className={`w-14 h-14 ${team.color || 'bg-indigo-600'} text-white rounded-2xl flex items-center justify-center font-black text-2xl shadow-sm`}>
                                                                {teamIdx + 1}
                                                            </div>
                                                            <div>
                                                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Desafio do Esquadrão</span>
                                                                <h4 className="text-2xl md:text-3xl font-black text-slate-800">{team.name}</h4>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <RPGTypographyToolbar
                                                                fontScale={fontScale}
                                                                onIncreaseFont={handleIncreaseFont}
                                                                onDecreaseFont={handleDecreaseFont}
                                                                onResetFont={handleResetFont}
                                                                textAlign={textAlign}
                                                                onSetAlign={handleSetAlign}
                                                                onEdit={() => handleOpenEditEnigma(enigma, teamIdx, team.name)}
                                                                editTooltip={`Editar desafio de ${team.name}`}
                                                            />
                                                            {/* Botão de Dica do Drácker */}
                                                            <button
                                                                type="button"
                                                                onClick={() => toggleHint(team.id)}
                                                                className="text-xs font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                                                            >
                                                                <Lightbulb className="w-4 h-4 text-amber-600" />
                                                                <span>{revealedHints[team.id] ? 'Ocultar Dica' : '💡 Dica do Drácker'}</span>
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Balão Revelado da Dica do Drácker */}
                                                    {revealedHints[team.id] && (
                                                        <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border-2 border-amber-300 p-4 rounded-2xl animate-fade-in flex items-start gap-3 shadow-xs">
                                                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white flex items-center justify-center text-xl shrink-0 shadow-xs">
                                                                🐉
                                                            </div>
                                                            <div className="space-y-1">
                                                                <span className="text-xs font-black uppercase text-amber-800 tracking-wider block">
                                                                    Sussurro Secreto do Drácker:
                                                                </span>
                                                                <p className="text-sm font-semibold text-amber-950 leading-relaxed italic" style={{ fontSize: `${fontScale}%` }}>
                                                                    "{enigma.dica_dracker || 'Prestem atenção nos detalhes do desafio e dialoguem com seus colegas de equipe!'}"
                                                                </p>
                                                            </div>
                                                        </div>
                                                    )}
                                                    
                                                    {/* Desafio Direcionado à Equipe com instrução separada */}
                                                    {(() => {
                                                        const fullText = formatDirectedQuestion(enigma.question, team.name);
                                                        const { intro, challenge } = parseQuestionParts(fullText);
                                                        return (
                                                            <div 
                                                                className="bg-slate-50 p-6 md:p-8 rounded-3xl border-2 border-slate-200 space-y-4 shadow-xs"
                                                                style={{ fontSize: `${fontScale}%` }}
                                                            >
                                                                {intro && (
                                                                    <div className="bg-gradient-to-r from-indigo-100/90 via-purple-50 to-indigo-50 border-2 border-indigo-300 p-4 sm:p-5 rounded-2xl flex items-start gap-3.5 shadow-sm">
                                                                        <span className="text-2xl sm:text-3xl select-none shrink-0 mt-0.5">🎯</span>
                                                                        <div className="space-y-1 w-full">
                                                                            <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-indigo-800 block">
                                                                                Convocação do Esquadrão {team.name}
                                                                            </span>
                                                                            <p className={`text-base sm:text-lg md:text-xl font-black text-indigo-950 leading-relaxed ${textAlign}`}>
                                                                                {intro}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                                <div className="space-y-2 pt-1">
                                                                    <span className="text-xs font-black uppercase tracking-wider text-slate-500 block">
                                                                        Desafio a ser Resolvido:
                                                                    </span>
                                                                    <p className={`font-black text-slate-900 leading-relaxed font-display ${textAlign}`}>
                                                                        {challenge}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        );
                                                    })()}
                                                    
                                                    {enigma.options && enigma.options.length > 0 && (
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4" style={{ fontSize: `${fontScale}%` }}>
                                                            {enigma.options.map((opt, i) => (
                                                                <button 
                                                                    key={i} 
                                                                    onClick={() => handleSelectOption(team.id, i)}
                                                                    className={`w-full ${textAlign} border-2 p-5 rounded-2xl font-bold transition-all text-lg md:text-xl cursor-pointer ${
                                                                        selectedOptions[team.id] === i 
                                                                            ? 'bg-indigo-50 border-indigo-500 text-indigo-900 shadow-md scale-[1.02]' 
                                                                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                                                                    }`}
                                                                >
                                                                    {opt}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                    
                                                    {questionType === 'essay' && (
                                                        <div className="space-y-6 mt-4">
                                                            {/* Gabarito Oculto por padrão para proteger no projetor */}
                                                            <div className="bg-amber-50/70 p-4 sm:p-5 rounded-2xl border-2 border-dashed border-amber-300 transition-all space-y-3">
                                                                <div className="flex items-center justify-between gap-3 flex-wrap">
                                                                    <span className="text-xs font-black text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                                                                        <Search className="w-4 h-4 text-amber-700"/> Gabarito do Mestre
                                                                    </span>
                                                                    <div className="flex items-center gap-2 flex-wrap">
                                                                        {revealedAnswers[team.id] && (
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => handleRequestDetailedAnswer(enigma, teamIdx, team.id)}
                                                                                disabled={loadingDetailAnswer[`${round}_${teamIdx}_${team.id}`]}
                                                                                className="text-xs font-bold text-amber-900 bg-amber-200 hover:bg-amber-300 border border-amber-400 px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 disabled:opacity-50"
                                                                                title="Solicitar ao Drácker a resolução detalhada passo a passo deste desafio"
                                                                            >
                                                                                <Sparkles className="w-3.5 h-3.5 text-amber-700 animate-spin" style={{ animationDuration: loadingDetailAnswer[`${round}_${teamIdx}_${team.id}`] ? '1s' : '0s' }} />
                                                                                <span>
                                                                                    {loadingDetailAnswer[`${round}_${teamIdx}_${team.id}`] 
                                                                                        ? 'Drácker detalhando resolução...' 
                                                                                        : (enigma.correct_answer && enigma.correct_answer.length > 50 
                                                                                            ? 'Atualizar Resolução Detalhada' 
                                                                                            : '🪄 Detalhar Resolução Passo a Passo')}
                                                                                </span>
                                                                            </button>
                                                                        )}
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => toggleRevealAnswer(team.id)}
                                                                            className="text-xs font-bold text-amber-900 bg-amber-200/80 hover:bg-amber-300 border border-amber-400 px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                                                                        >
                                                                            {revealedAnswers[team.id] ? (
                                                                                <>
                                                                                    <EyeOff className="w-3.5 h-3.5 text-amber-800" />
                                                                                    <span>Ocultar Gabarito</span>
                                                                                </>
                                                                            ) : (
                                                                                <>
                                                                                    <Eye className="w-3.5 h-3.5 text-amber-800" />
                                                                                    <span>👁️ Revelar Resposta (Professor)</span>
                                                                                </>
                                                                            )}
                                                                        </button>
                                                                    </div>
                                                                </div>

                                                                {revealedAnswers[team.id] ? (
                                                                    <div className="pt-2 border-t border-amber-200 animate-fade-in space-y-2">
                                                                        <span className="text-xs text-amber-800 font-bold block uppercase tracking-wider">
                                                                            Critério / Resposta e Resolução Esperada:
                                                                        </span>
                                                                        <div className="bg-amber-100/70 p-4 sm:p-5 rounded-2xl border border-amber-300/80 shadow-2xs">
                                                                            <DetailedResolutionView 
                                                                                text={enigma.correct_answer} 
                                                                                fontScale={fontScale} 
                                                                                textAlign={textAlign} 
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <p className="text-xs text-amber-700 italic select-none">
                                                                        🔒 O gabarito está oculto para a turma. O professor pode clicar no botão ao lado para conferir a resposta esperada.
                                                                    </p>
                                                                )}
                                                            </div>
                                                            
                                                            <div className="flex flex-col p-5 bg-slate-50 rounded-2xl border border-slate-200 gap-3">
                                                                <span className="font-black text-slate-700 uppercase text-xs tracking-wider">Avaliar Resposta:</span>
                                                                <div className="grid grid-cols-3 gap-3">
                                                                    <button onClick={() => handleEvaluate(team.id, 'success')} className={`flex flex-col items-center justify-center gap-2 p-3 rounded-2xl font-black transition-all cursor-pointer ${evaluations[team.id] === 'success' ? 'bg-green-500 text-white shadow-md scale-105' : 'bg-white border-2 border-slate-200 text-slate-600 hover:border-green-400'}`}>
                                                                        <CheckCircle className="w-6 h-6" /> <span className="text-sm">Na Mosca!</span>
                                                                    </button>
                                                                    <button onClick={() => handleEvaluate(team.id, 'partial')} className={`flex flex-col items-center justify-center gap-2 p-3 rounded-2xl font-black transition-all cursor-pointer ${evaluations[team.id] === 'partial' ? 'bg-amber-500 text-white shadow-md scale-105' : 'bg-white border-2 border-slate-200 text-slate-600 hover:border-amber-400'}`}>
                                                                        <HelpCircle className="w-6 h-6" /> <span className="text-sm">Quase Lá</span>
                                                                    </button>
                                                                    <button onClick={() => handleEvaluate(team.id, 'fail')} className={`flex flex-col items-center justify-center gap-2 p-3 rounded-2xl font-black transition-all cursor-pointer ${evaluations[team.id] === 'fail' ? 'bg-rose-500 text-white shadow-md scale-105' : 'bg-white border-2 border-slate-200 text-slate-600 hover:border-rose-400'}`}>
                                                                        <XCircle className="w-6 h-6" /> <span className="text-sm">Escorregou</span>
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })()
                                    ))}
                                </div>

                                {/* Controles de Navegação */}
                                <div className="bg-slate-50 border-t border-slate-200 p-4 md:p-6 flex justify-between items-center mt-auto">
                                    <div className="flex items-center gap-2">
                                        <Button 
                                            onClick={() => setCarouselIndex(prev => Math.max(0, prev - 1))}
                                            disabled={carouselIndex === 0}
                                            variant="outline"
                                            icon={ChevronLeft}
                                            className="bg-white text-base px-5 py-2.5 cursor-pointer"
                                        >
                                            Anterior
                                        </Button>
                                        <button
                                            type="button"
                                            onClick={() => setShowRestartModal(true)}
                                            className="text-xs sm:text-sm font-bold text-slate-500 hover:text-rose-600 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-300 px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                                            title="Reiniciar a missão"
                                        >
                                            <RotateCcw className="w-4 h-4" />
                                            <span className="hidden sm:inline">Reiniciar Missão</span>
                                        </button>
                                    </div>

                                    {carouselIndex === (participationMode === 'class_students' ? 1 : effectiveTeams.length) ? (
                                        <Button 
                                            onClick={nextRound}
                                            disabled={
                                                participationMode === 'class_students'
                                                    ? false
                                                    : (questionType === 'multiple_choice' 
                                                        ? !effectiveTeams.every(t => selectedOptions[t.id] !== undefined)
                                                        : !effectiveTeams.every(t => evaluations[t.id] !== undefined))
                                            }
                                            variant="primary"
                                            icon={ChevronRight}
                                            className="bg-emerald-600 hover:bg-emerald-700 text-base px-6 py-2.5 shadow-md text-white border-transparent cursor-pointer"
                                        >
                                            {round === totalStages ? 'Avançar para o Final' : 'Avançar História'}
                                        </Button>
                                    ) : (
                                        <Button 
                                            onClick={() => setCarouselIndex(prev => Math.min((participationMode === 'class_students' ? 1 : effectiveTeams.length), prev + 1))}
                                            variant="primary"
                                            className="bg-slate-800 hover:bg-slate-900 text-base px-6 py-2.5 cursor-pointer"
                                        >
                                            Próximo <ChevronRight className="w-4 h-4 ml-1.5" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* MODO PADRÃO EM PERGAMINHO / COLUNA */
                    <Card className="border-slate-200 shadow-xl bg-white overflow-hidden rounded-3xl">
                        <div className="bg-gradient-to-r from-amber-100 to-orange-100 p-6 border-b border-amber-200 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className="bg-white p-2.5 rounded-2xl shadow-xs"><BookOpen className="w-6 h-6 text-amber-700" /></div>
                                <div>
                                    <span className="text-xs font-black uppercase text-amber-700 tracking-wider block">
                                        {etapaAtual?.local_cena ? `📍 ${etapaAtual.local_cena}` : 'Crônica da Etapa'}
                                    </span>
                                    <h2 className="text-2xl font-black text-slate-900 font-display">
                                        {etapaAtual?.titulo_capitulo || (round === 1 ? 'O Início do Mistério' : `Capítulo ${round}: A Investigação`)}
                                    </h2>
                                </div>
                            </div>

                            {etapaAtual?.item_recompensa && (
                                <span className="bg-amber-200/70 border border-amber-300 text-amber-900 px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5">
                                    ✨ {etapaAtual.item_recompensa}
                                </span>
                            )}
                        </div>
                        <div className="p-6 md:p-8 space-y-6">
                            {renderStoryColumn()}
                            
                            {participationMode === 'class_students' ? (
                                renderNotebookMission()
                            ) : (
                                effectiveTeams.map((team, index) => {
                                    const enigma = getTeamEnigma(team, index, etapaAtual?.enigmas, round);
                                    if (!team) return null;

                                return (
                                    <div key={team.id || index} className="bg-slate-50 border-2 border-slate-200 rounded-3xl p-6 md:p-8 shadow-xs hover:border-indigo-300 transition-all relative mt-8 space-y-4">
                                        <div className="flex items-center justify-between gap-3 flex-wrap">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 ${team.color || 'bg-indigo-600'} text-white rounded-xl flex items-center justify-center font-black shadow-xs`}>
                                                    {index + 1}
                                                </div>
                                                <div>
                                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Desafio do Esquadrão</span>
                                                    <h3 className="text-xl font-black text-slate-800">{team.name}</h3>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 flex-wrap">
                                                <RPGTypographyToolbar
                                                    fontScale={fontScale}
                                                    onIncreaseFont={handleIncreaseFont}
                                                    onDecreaseFont={handleDecreaseFont}
                                                    onResetFont={handleResetFont}
                                                    textAlign={textAlign}
                                                    onSetAlign={handleSetAlign}
                                                    onEdit={() => handleOpenEditEnigma(enigma, index, team.name)}
                                                    editTooltip={`Editar desafio de ${team.name}`}
                                                />
                                                {/* Botão de Dica do Drácker */}
                                                <button
                                                    type="button"
                                                    onClick={() => toggleHint(team.id)}
                                                    className="text-xs font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                                                >
                                                    <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
                                                    <span>{revealedHints[team.id] ? 'Ocultar Dica' : '💡 Dica'}</span>
                                                </button>
                                            </div>
                                        </div>

                                        {/* Balão da Dica */}
                                        {revealedHints[team.id] && (
                                            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300 p-3.5 rounded-2xl flex items-start gap-3 text-xs text-amber-950 font-medium">
                                                <span className="text-lg">🐉</span>
                                                <div>
                                                    <strong className="block text-amber-800 uppercase tracking-wider text-[10px]">Dica do Drácker:</strong>
                                                    <span style={{ fontSize: `${fontScale}%` }}>{enigma.dica_dracker || 'Prestem bastante atenção no enunciado e pensem em equipe!'}</span>
                                                </div>
                                            </div>
                                        )}
                                        
                                        {/* Desafio Direcionado à Equipe com instrução separada */}
                                        {(() => {
                                            const fullText = formatDirectedQuestion(enigma.question, team.name);
                                            const { intro, challenge } = parseQuestionParts(fullText);
                                            return (
                                                <div 
                                                    className="bg-white p-5 rounded-2xl border-2 border-slate-200 space-y-2.5 shadow-xs"
                                                    style={{ fontSize: `${fontScale}%` }}
                                                >
                                                    {intro && (
                                                        <div className="bg-gradient-to-r from-indigo-100/90 via-purple-50 to-indigo-50 border-2 border-indigo-300 p-3.5 sm:p-4 rounded-2xl flex items-center gap-3 shadow-xs">
                                                            <span className="text-xl sm:text-2xl shrink-0">🎯</span>
                                                            <span className={`text-sm sm:text-base md:text-lg font-black text-indigo-950 ${textAlign}`}>{intro}</span>
                                                        </div>
                                                    )}
                                                    <p className={`font-bold text-slate-900 leading-relaxed pt-0.5 ${textAlign}`}>
                                                        {challenge}
                                                    </p>
                                                </div>
                                            );
                                        })()}
                                        
                                        {enigma.options && enigma.options.length > 0 && (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-2" style={{ fontSize: `${fontScale}%` }}>
                                                {enigma.options.map((opt, i) => (
                                                    <button 
                                                        key={i} 
                                                        onClick={() => handleSelectOption(team.id, i)}
                                                        className={`w-full ${textAlign} border-2 p-4 rounded-xl font-bold transition-all text-sm md:text-base cursor-pointer ${
                                                            selectedOptions[team.id] === i 
                                                                ? 'bg-indigo-50 border-indigo-500 text-indigo-900 shadow-xs scale-[1.01]' 
                                                                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                                                        }`}
                                                    >
                                                        {opt}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                        
                                        {questionType === 'essay' && (
                                            <div className="space-y-4">
                                                {/* Gabarito Oculto por padrão para proteger no projetor */}
                                                <div className="bg-amber-50/70 p-4 sm:p-5 rounded-2xl border-2 border-dashed border-amber-300 transition-all space-y-3">
                                                    <div className="flex items-center justify-between gap-3 flex-wrap">
                                                        <span className="text-xs font-black text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                                                            <Search className="w-4 h-4 text-amber-700"/> Gabarito do Mestre
                                                        </span>
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            {revealedAnswers[team.id] && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleRequestDetailedAnswer(enigma, index, team.id)}
                                                                    disabled={loadingDetailAnswer[`${round}_${index}_${team.id}`]}
                                                                    className="text-xs font-bold text-amber-900 bg-amber-200 hover:bg-amber-300 border border-amber-400 px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 disabled:opacity-50"
                                                                    title="Solicitar ao Drácker a resolução detalhada passo a passo deste desafio"
                                                                >
                                                                    <Sparkles className="w-3.5 h-3.5 text-amber-700 animate-spin" style={{ animationDuration: loadingDetailAnswer[`${round}_${index}_${team.id}`] ? '1s' : '0s' }} />
                                                                    <span>
                                                                        {loadingDetailAnswer[`${round}_${index}_${team.id}`] 
                                                                            ? 'Drácker detalhando resolução...' 
                                                                            : (enigma.correct_answer && enigma.correct_answer.length > 50 
                                                                                ? 'Atualizar Resolução Detalhada' 
                                                                                : '🪄 Detalhar Resolução Passo a Passo')}
                                                                    </span>
                                                                </button>
                                                            )}
                                                            <button
                                                                type="button"
                                                                onClick={() => toggleRevealAnswer(team.id)}
                                                                className="text-xs font-bold text-amber-900 bg-amber-200/80 hover:bg-amber-300 border border-amber-400 px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                                                            >
                                                                {revealedAnswers[team.id] ? (
                                                                    <>
                                                                        <EyeOff className="w-3.5 h-3.5 text-amber-800" />
                                                                        <span>Ocultar Gabarito</span>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <Eye className="w-3.5 h-3.5 text-amber-800" />
                                                                        <span>👁️ Revelar Resposta</span>
                                                                    </>
                                                                )}
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {revealedAnswers[team.id] ? (
                                                        <div className="pt-2 border-t border-amber-200 animate-fade-in space-y-2">
                                                            <span className="text-xs text-amber-800 font-bold block uppercase tracking-wider">
                                                                Critério / Resposta e Resolução Esperada:
                                                            </span>
                                                            <div className="bg-amber-100/70 p-4 sm:p-5 rounded-2xl border border-amber-300/80 shadow-2xs">
                                                                <DetailedResolutionView 
                                                                    text={enigma.correct_answer} 
                                                                    fontScale={fontScale} 
                                                                    textAlign={textAlign} 
                                                                />
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <p className="text-xs text-amber-700 italic select-none">
                                                            🔒 O gabarito está oculto para a turma. Clique no botão ao lado para conferir a resposta esperada.
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <button onClick={() => handleEvaluate(team.id, 'success')} className={`flex-1 p-3 rounded-xl font-bold text-xs border transition-all cursor-pointer ${evaluations[team.id] === 'success' ? 'bg-green-500 text-white' : 'bg-white border-slate-200 text-slate-700'}`}>Na Mosca!</button>
                                                    <button onClick={() => handleEvaluate(team.id, 'partial')} className={`flex-1 p-3 rounded-xl font-bold text-xs border transition-all cursor-pointer ${evaluations[team.id] === 'partial' ? 'bg-amber-500 text-white' : 'bg-white border-slate-200 text-slate-700'}`}>Quase Lá</button>
                                                    <button onClick={() => handleEvaluate(team.id, 'fail')} className={`flex-1 p-3 rounded-xl font-bold text-xs border transition-all cursor-pointer ${evaluations[team.id] === 'fail' ? 'bg-rose-500 text-white' : 'bg-white border-slate-200 text-slate-700'}`}>Escorregou</button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            }))}

                            <div className="pt-6 border-t border-slate-100 flex items-center justify-between gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowRestartModal(true)}
                                    className="text-xs sm:text-sm font-bold text-slate-500 hover:text-rose-600 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-300 px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                                    title="Reiniciar a missão"
                                >
                                    <RotateCcw className="w-4 h-4" />
                                    <span>Reiniciar Missão</span>
                                </button>
                                <Button 
                                    onClick={nextRound}
                                    disabled={
                                        participationMode === 'class_students'
                                            ? false
                                            : (questionType === 'multiple_choice' 
                                                ? !effectiveTeams.every(t => selectedOptions[t.id] !== undefined)
                                                : !effectiveTeams.every(t => evaluations[t.id] !== undefined))
                                    }
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-base px-8 py-3 rounded-2xl shadow-md cursor-pointer"
                                >
                                    {round === totalStages ? 'Avançar para o Final' : 'Avançar História'}
                                </Button>
                            </div>
                        </div>
                    </Card>
                )}

                {/* Modal de Edição de Textos da Missão (História e Enigmas) */}
                <RPGTextEditModal
                    isOpen={editModalConfig.isOpen}
                    onClose={() => setEditModalConfig(prev => ({ ...prev, isOpen: false }))}
                    type={editModalConfig.type}
                    title={editModalConfig.title}
                    initialData={editModalConfig.data}
                    onSave={handleSaveEditedMissionText}
                />
            </div>
        );
    }

    // =========================================================================
    // TELA 4: FINAL / VITÓRIA / CONCLUSÃO & INVENTÁRIO (FASE B)
    // =========================================================================
    if (gameStatus === 'finished') {
        const selectedUniverseObj = RPG_UNIVERSES.find(u => u.id === universe) || RPG_UNIVERSES[0];
        const etapas = currentData?.etapas || [];

        return (
            <div className={`mx-auto space-y-6 animate-fade-in pb-16 ${isFullWidth ? 'max-w-[1400px]' : 'max-w-4xl'}`}>
                {/* Modal de Revisão do Capítulo */}
                {renderReviewChapterModal()}
                {renderSavedMissionsModal()}
                {renderOfficialClassDurationModal()}
                {renderMissionLaunchTypeModal()}

                {/* Cabeçalho de Missão Concluída */}
                <div className="flex justify-between items-center bg-gradient-to-r from-amber-200 to-yellow-300 text-amber-950 px-6 py-3 rounded-2xl font-bold shadow-sm border border-amber-300">
                    <div className="flex items-center gap-3">
                        <Award className="w-6 h-6 text-amber-700" /> 
                        <span className="text-base sm:text-lg font-black">Missão Concluída com Sucesso! 🎉</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => {
                                restartMatch();
                                toast('Voltando ao início da aventura (Capítulo 1)...');
                            }} 
                            className="text-xs md:text-sm text-amber-900 hover:text-indigo-900 font-bold flex items-center gap-1.5 transition-colors bg-white/90 hover:bg-white px-3.5 py-1.5 rounded-xl shadow-xs border border-amber-300 cursor-pointer"
                            title="Voltar ao início da aventura (Capítulo 1)"
                        >
                            <RotateCcw className="w-4 h-4 text-amber-700" /> Voltar ao Início da Aventura
                        </button>
                        <button 
                            onClick={clearGame} 
                            className="text-xs md:text-sm text-slate-600 hover:text-red-600 font-semibold flex items-center gap-1 transition-colors bg-white/60 hover:bg-white px-3 py-1.5 rounded-xl shadow-xs border border-amber-300 cursor-pointer"
                            title="Voltar para a tela de montagem e criar nova história do zero"
                        >
                            <RefreshCw className="w-3.5 h-3.5" /> Nova Montagem
                        </button>
                    </div>
                </div>

                <Card className="border-amber-300 shadow-2xl bg-gradient-to-b from-white to-amber-50/50 overflow-hidden relative rounded-3xl p-6 sm:p-12 text-center space-y-8">
                    <div>
                        <div className="w-24 h-24 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-3xl flex items-center justify-center mx-auto shadow-xl border-4 border-amber-200 text-5xl mb-6 select-none animate-bounce">
                            🏆
                        </div>
                        <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight font-display mb-3">
                            A Grande Revelação do Mistério!
                        </h2>
                        <p className="text-base sm:text-lg text-slate-600 font-medium max-w-xl mx-auto">
                            Os bravos exploradores venceram os desafios e restauraram a ordem no universo de <b>{selectedUniverseObj.title}</b>!
                        </p>
                    </div>

                    {/* Vencedor / Pódio */}
                    <div className="inline-block bg-white border-4 border-amber-400 rounded-3xl px-8 py-5 shadow-xl">
                        <span className="text-xs uppercase font-black text-amber-600 block mb-1 tracking-widest">
                            🎖️ Grande Campeão da Expedição
                        </span>
                        <span className="text-3xl sm:text-4xl font-black text-slate-900">
                            {currentData?.finalHistory?.winner || 'Todos Nós!'}
                        </span>
                    </div>

                    {/* 🎒 INVENTÁRIO DE RELÍQUIAS DA EXPEDIÇÃO (FASE B) */}
                    {etapas.length > 0 && (
                        <div className="bg-gradient-to-br from-amber-50 to-orange-50/80 p-6 sm:p-8 rounded-3xl border-2 border-amber-300 text-left space-y-4">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center text-xl shadow-sm">
                                        🎒
                                    </div>
                                    <div>
                                        <h3 className="text-lg sm:text-xl font-black text-slate-900">
                                            Inventário de Relíquias Conquistadas
                                        </h3>
                                        <p className="text-xs text-slate-600 font-medium">
                                            Artefatos mágicos e itens de conhecimento recuperados em cada capítulo (clique para revisar os enigmas e respostas):
                                        </p>
                                    </div>
                                </div>
                                <div
                                    className="text-xs font-semibold text-slate-600 bg-white/90 border border-slate-200 px-3 py-1.5 rounded-xl shadow-2xs flex items-center gap-1.5"
                                >
                                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                                    <span>{etapas.length} de {etapas.length} Relíquias Desbloqueadas</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
                                {etapas.map((etapa, idx) => (
                                    <button
                                        key={idx}
                                        type="button"
                                        onClick={() => {
                                            setSelectedReviewChapter(etapa);
                                            setReviewRevealedAnswers({});
                                        }}
                                        className="bg-white p-4 rounded-2xl border border-amber-200 shadow-xs flex items-start gap-3 hover:border-amber-400 hover:shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all text-left cursor-pointer group w-full"
                                        title={`Clique para revisar os desafios e respostas do Capítulo ${etapa.round || idx + 1}`}
                                    >
                                        <span className="text-2xl select-none shrink-0 mt-0.5 group-hover:scale-110 transition-transform">✨</span>
                                        <div className="space-y-1 flex-1 min-w-0">
                                            <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 block truncate">
                                                Capítulo {etapa.round || idx + 1} • {etapa.local_cena || 'Local Místico'}
                                            </span>
                                            <h4 className="text-sm font-black text-slate-900 leading-tight group-hover:text-amber-800 transition-colors">
                                                {etapa.item_recompensa || `Relíquia do Capítulo ${idx + 1}`}
                                            </h4>
                                            <p className="text-[11px] text-slate-500 font-medium line-clamp-1">
                                                {etapa.titulo_capitulo}
                                            </p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* QUADRO DE PONTUAÇÃO DAS EQUIPES */}
                    {effectiveTeams.length > 0 && (
                        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm text-left space-y-4">
                            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                                <Trophy className="w-5 h-5 text-amber-500" /> Placar dos Bravos Exploradores
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                {effectiveTeams.map((team) => {
                                    let totalPts = 0;
                                    let hits = 0;
                                    let misses = 0;
                                    history.forEach(h => {
                                        const status = h.evaluations[team.id];
                                        if (status === 'success') { totalPts += 3; hits++; }
                                        else if (status === 'partial') { totalPts += 1; }
                                        else if (status === 'fail') { misses++; }
                                    });

                                    return (
                                        <div key={team.id} className="p-4 rounded-2xl border-2 border-slate-100 bg-slate-50/70 space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="font-black text-slate-800 text-sm truncate max-w-[150px]">{team.name}</span>
                                                <span className="text-xs font-black px-2.5 py-1 rounded-xl bg-indigo-100 text-indigo-800">
                                                    {totalPts} pts
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                                                <span className="text-emerald-600">✓ {hits} acerto(s)</span>
                                                <span>•</span>
                                                <span className="text-rose-500">✗ {misses} erro(s)</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2 text-xs font-bold text-emerald-800">
                                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                                <span>Todas as ações, acertos e pontuações foram sincronizadas automaticamente com a Turma e já refletem no Relatório de Aula!</span>
                            </div>
                        </div>
                    )}

                    {/* Crônica Oficial da Vitória */}
                    <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm text-left max-w-2xl mx-auto space-y-3">
                        <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                            <BookOpen className="w-5 h-5 text-emerald-600" /> Crônica Oficial da Vitória
                        </h3>
                        <p className="text-base text-slate-700 leading-relaxed italic">
                            {currentData?.finalHistory?.finalStoryText}
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
                        <Button 
                            onClick={() => {
                                restartMatch();
                                toast('Voltando ao início da aventura (Capítulo 1)!');
                            }} 
                            className="w-full sm:w-auto bg-slate-900 hover:bg-black text-white text-base px-8 py-3.5 rounded-2xl shadow-lg cursor-pointer flex items-center justify-center gap-2.5 transform active:scale-98 transition-all"
                        >
                            <RotateCcw className="w-5 h-5 text-amber-400" />
                            Voltar ao Início da Aventura
                        </Button>

                        <button 
                            type="button"
                            onClick={clearGame} 
                            className="text-xs font-bold text-slate-500 hover:text-slate-800 px-4 py-2 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                            title="Voltar para a tela de montagem e criar nova história do zero"
                        >
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span>Nova História (Setup do Zero)</span>
                        </button>
                    </div>
                </Card>
            </div>
        );
    }

    return null;
};

export default DetectiveRPG;
