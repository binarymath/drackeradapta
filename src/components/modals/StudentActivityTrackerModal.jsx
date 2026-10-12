import React, { useState, useEffect, useMemo } from 'react';
import { 
    ClipboardCheck, 
    CheckCircle2, 
    XCircle, 
    Minus, 
    Search, 
    Sparkles, 
    GraduationCap, 
    Plus, 
    Check, 
    X, 
    FileText, 
    BookOpen, 
    Home, 
    Users, 
    Mic, 
    Edit3, 
    Star,
    Clock,
    History
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { toast } from '../ui/Toast';
import { useActivity } from '../../contexts/ActivityContext';
import { PointJustificationModal } from '../roulette/card-modals/PointJustificationModal';
import { gameAudio } from '../../utils/gameAudio';

const RECENT_ACTIVITIES_KEY = 'dracker_recent_offline_activities';

const QUICK_CATEGORIES = [
    { id: 'impressa', label: 'Folha Impressa', icon: FileText, color: 'text-amber-600 bg-amber-50 border-amber-200' },
    { id: 'caderno', label: 'Exercício no Caderno', icon: BookOpen, color: 'text-blue-600 bg-blue-50 border-blue-200' },
    { id: 'licao_casa', label: 'Lição de Casa', icon: Home, color: 'text-purple-600 bg-purple-50 border-purple-200' },
    { id: 'grupo', label: 'Trabalho em Grupo', icon: Users, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
    { id: 'oral', label: 'Apresentação / Oral', icon: Mic, color: 'text-rose-600 bg-rose-50 border-rose-200' },
    { id: 'avaliacao', label: 'Avaliação Escrita', icon: Edit3, color: 'text-orange-600 bg-orange-50 border-orange-200' }
];

export const StudentActivityTrackerModal = ({ isOpen, onClose }) => {
    const { 
        classes, 
        saveClassUpdates, 
        officialSession, 
        activeActivity 
    } = useActivity();

    // 1. Turma selecionada
    const [selectedClassId, setSelectedClassId] = useState('');

    useEffect(() => {
        if (!isOpen) return;
        // Prioriza a turma da Aula Oficial ativa, ou primeira turma com alunos, ou primeira turma
        if (officialSession?.isClassActive && officialSession?.classId) {
            setSelectedClassId(String(officialSession.classId));
        } else if (classes && classes.length > 0) {
            const classWithStudents = classes.find(c => c.students && c.students.length > 0);
            setSelectedClassId(classWithStudents ? String(classWithStudents.id) : String(classes[0].id));
        }
    }, [isOpen, officialSession?.isClassActive, officialSession?.classId, classes]);

    // Turma atual
    const currentClass = useMemo(() => {
        if (!classes || classes.length === 0) return null;
        return classes.find(c => String(c.id) === String(selectedClassId)) || classes[0] || null;
    }, [classes, selectedClassId]);

    // 2. Modo da Atividade: 'current' (da aba ativa) ou 'custom' (atividade diferente)
    const [activityMode, setActivityMode] = useState('custom');
    const [customTitle, setCustomTitle] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('Folha Impressa');
    const [awardPoints, setAwardPoints] = useState(true);

    // Histórico de atividades recentes
    const [recentActivities, setRecentActivities] = useState(() => {
        try {
            const saved = localStorage.getItem(RECENT_ACTIVITIES_KEY);
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });

    // Se houver atividade ativa no sistema e o modal abrir, define título padrão
    useEffect(() => {
        if (isOpen) {
            if (activeActivity && activeActivity.title && activeActivity.type !== 'about_system') {
                setActivityMode('current');
            } else {
                setActivityMode('custom');
                if (!customTitle) {
                    setCustomTitle('Atividade Impressa de Fixação');
                }
            }
        }
    }, [isOpen, activeActivity]);

    // Título final da atividade a ser gravada
    const finalActivityTitle = useMemo(() => {
        if (activityMode === 'current' && activeActivity?.title) {
            return activeActivity.title;
        }
        return customTitle.trim() || 'Atividade Presencial / Impressa';
    }, [activityMode, activeActivity, customTitle]);

    // 3. Status dos alunos: { [studentId]: 'completed' | 'not_completed' | 'neutral' }
    const [statuses, setStatuses] = useState({});
    const [notes, setNotes] = useState({});
    const [searchTerm, setSearchTerm] = useState('');

    // Resetar status ao abrir ou trocar de turma
    useEffect(() => {
        if (isOpen && currentClass?.students) {
            const initialStatuses = {};
            currentClass.students.forEach(s => {
                initialStatuses[s.id] = 'neutral';
            });
            setStatuses(initialStatuses);
            setNotes({});
            setSearchTerm('');
        }
    }, [isOpen, currentClass?.id]);

    // Alunos filtrados por busca
    const filteredStudents = useMemo(() => {
        const list = currentClass?.students || [];
        if (!searchTerm.trim()) return list;
        const norm = searchTerm.toLowerCase().trim();
        return list.filter(s => (s.name || '').toLowerCase().includes(norm));
    }, [currentClass?.students, searchTerm]);

    // Estatísticas de contagem
    const stats = useMemo(() => {
        const total = currentClass?.students?.length || 0;
        let completed = 0;
        let notCompleted = 0;
        let neutral = 0;

        Object.values(statuses).forEach(st => {
            if (st === 'completed') completed++;
            else if (st === 'not_completed') notCompleted++;
            else neutral++;
        });

        // Caso alguns alunos ainda não estejam no dicionário
        const evaluated = completed + notCompleted;
        if (evaluated < total) {
            neutral = total - evaluated;
        }

        return { total, completed, notCompleted, neutral };
    }, [statuses, currentClass?.students]);

    // Ações de alteração de status
    const setStudentStatus = (studentId, status) => {
        setStatuses(prev => ({
            ...prev,
            [studentId]: status
        }));
    };

    const handleMarkAllCompleted = () => {
        const updated = {};
        (currentClass?.students || []).forEach(s => {
            updated[s.id] = 'completed';
        });
        setStatuses(updated);
    };

    const handleMarkAllNotCompleted = () => {
        const updated = {};
        (currentClass?.students || []).forEach(s => {
            updated[s.id] = 'not_completed';
        });
        setStatuses(updated);
    };

    const handleResetAllNeutral = () => {
        const updated = {};
        (currentClass?.students || []).forEach(s => {
            updated[s.id] = 'neutral';
        });
        setStatuses(updated);
    };

    const handleSelectQuickCategory = (cat) => {
        setSelectedCategory(cat.label);
        if (!customTitle || customTitle.startsWith('Folha Impressa') || customTitle.startsWith('Exercício') || customTitle.startsWith('Lição')) {
            setCustomTitle(`${cat.label}`);
        }
    };

    const handleSelectRecent = (title) => {
        setActivityMode('custom');
        setCustomTitle(title);
    };

    // Modal de Justificativa de Pontos (+1 Ação Positiva / -1 Infração)
    const [pointModal, setPointModal] = useState({
        isOpen: false,
        studentId: null,
        studentName: '',
        delta: 1
    });

    const handleOpenPointModal = (student, delta) => {
        setPointModal({
            isOpen: true,
            studentId: student.id,
            studentName: student.name,
            delta
        });
    };

    const handleConfirmPointJustification = (justification) => {
        const { studentId, studentName, delta } = pointModal;
        if (!studentId || !currentClass) return;

        const isPositive = delta > 0;
        const now = Date.now();

        if (isPositive) {
            gameAudio?.playSuccess?.();
        } else {
            gameAudio?.playTick?.();
        }

        saveClassUpdates(currentClass.id, (prevClass) => {
            const newStudents = (prevClass.students || []).map(s => {
                if (String(s.id) === String(studentId)) {
                    const curHits = s.hits || 0;
                    const curMisses = s.misses || 0;
                    const newHits = isPositive ? curHits + 1 : Math.max(0, curHits - 1);
                    const newMisses = !isPositive ? curMisses + 1 : curMisses;

                    const historyEntry = {
                        date: now,
                        sessionId: officialSession?.isClassActive ? officialSession.currentSessionId : null,
                        topic: isPositive ? 'Ação Positiva / Mérito' : 'Infração / Regra',
                        question: justification,
                        result: isPositive ? 'merit' : 'rule_violation',
                        pointsDelta: delta,
                        studentName: s.name,
                        mode: 'behavior_tracking'
                    };

                    return {
                        ...s,
                        hits: newHits,
                        misses: newMisses,
                        history: [...(s.history || []), historyEntry]
                    };
                }
                return s;
            });

            return { ...prevClass, students: newStudents };
        });

        toast.success(`${isPositive ? '+1 ponto por ação positiva' : '-1 ponto por infração'} para ${studentName}!`);
        setPointModal(prev => ({ ...prev, isOpen: false }));
    };

    // Salvar registros no histórico dos alunos
    const handleSave = () => {
        if (!currentClass || !currentClass.id) {
            toast.error('Nenhuma turma selecionada.');
            return;
        }

        const evaluatedCount = stats.completed + stats.notCompleted;
        if (evaluatedCount === 0) {
            toast.info('Nenhum aluno marcado como Realizou ou Não Realizou. Registros mantidos neutros.');
            onClose();
            return;
        }

        const now = Date.now();
        const activityName = finalActivityTitle;
        const categoryName = activityMode === 'current' 
            ? (activeActivity?.type || 'Atividade da Plataforma') 
            : selectedCategory;

        // Salvar nas atividades recentes
        if (activityMode === 'custom' && customTitle.trim()) {
            try {
                const updatedRecent = [
                    customTitle.trim(),
                    ...recentActivities.filter(t => t.toLowerCase() !== customTitle.trim().toLowerCase())
                ].slice(0, 8);
                setRecentActivities(updatedRecent);
                localStorage.setItem(RECENT_ACTIVITIES_KEY, JSON.stringify(updatedRecent));
            } catch {}
        }

        // Atualização atômica da turma
        saveClassUpdates(currentClass.id, (prevClass) => {
            const updatedStudents = (prevClass.students || []).map(student => {
                const status = statuses[student.id] || 'neutral';
                if (status === 'neutral') return student; // Alunos neutros não têm alteração

                const isDone = status === 'completed';
                const pointsDelta = isDone && awardPoints ? 1 : 0;
                const studentNote = notes[student.id]?.trim() || '';

                const historyItem = {
                    date: now,
                    sessionId: officialSession?.isClassActive ? officialSession.currentSessionId : null,
                    topic: categoryName,
                    question: `[Atividade] ${activityName}${studentNote ? ` • Obs: ${studentNote}` : ''}`,
                    result: isDone ? 'correct' : 'incorrect',
                    pointsDelta: pointsDelta,
                    activityName: activityName,
                    status: isDone ? 'completed' : 'not_completed',
                    mode: 'offline_or_presential',
                    note: studentNote
                };

                const currentHits = student.hits || 0;
                const currentMisses = student.misses || 0;

                return {
                    ...student,
                    hits: isDone ? currentHits + pointsDelta : currentHits,
                    misses: !isDone ? currentMisses + 1 : currentMisses,
                    history: [...(student.history || []), historyItem]
                };
            });

            return {
                ...prevClass,
                students: updatedStudents
            };
        });

        toast.success(`Atividades registradas: ${stats.completed} realizada(s), ${stats.notCompleted} não realizada(s)!`);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <>
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Cadastrar / Registrar Atividade dos Alunos"
            icon={ClipboardCheck}
            size="xl"
            footer={(
                <div className="flex items-center justify-between w-full flex-wrap gap-3">
                    <div className="text-xs text-slate-500 font-medium">
                        {stats.completed + stats.notCompleted > 0 ? (
                            <span>
                                Pronto para salvar <strong className="text-slate-850 font-bold">{stats.completed + stats.notCompleted}</strong> avaliação(ões) em <strong className="text-indigo-700">{currentClass?.name}</strong>.
                            </span>
                        ) : (
                            <span>Marque quem realizou ou não realizou a atividade.</span>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="secondary" onClick={onClose}>
                            Cancelar
                        </Button>
                        <Button 
                            onClick={handleSave}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md px-5"
                            icon={Check}
                        >
                            Salvar Registros da Turma
                        </Button>
                    </div>
                </div>
            )}
        >
            <div className="space-y-5">
                {/* 1. SELETOR DE ATIVIDADE & OPÇÃO DE ATIVIDADE DIFERENTE */}
                <div className="bg-white p-4 sm:p-5 rounded-2xl border-2 border-slate-100 shadow-2xs space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                                Qual atividade está sendo registrada?
                            </span>
                        </div>

                        {/* Alternador: Atividade Atual vs. Atividade Diferente */}
                        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 self-start sm:self-auto gap-1">
                            {activeActivity?.title && activeActivity?.type !== 'about_system' && (
                                <button
                                    type="button"
                                    onClick={() => setActivityMode('current')}
                                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                        activityMode === 'current'
                                            ? 'bg-white text-indigo-700 shadow-2xs'
                                            : 'text-slate-600 hover:text-slate-900'
                                    }`}
                                >
                                    🎯 Atividade Atual da Tela
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={() => setActivityMode('custom')}
                                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                    activityMode === 'custom'
                                        ? 'bg-white text-indigo-700 shadow-2xs'
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                ✍️ Cadastrar Atividade Diferente
                            </button>
                        </div>
                    </div>

                    {/* MODO A: Atividade Atual Aberta */}
                    {activityMode === 'current' && activeActivity?.title && (
                        <div className="p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-200/80 flex items-center justify-between gap-3 flex-wrap">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-2xs">
                                    🎯
                                </div>
                                <div>
                                    <h4 className="text-sm font-black text-indigo-950">
                                        {activeActivity.title}
                                    </h4>
                                    <p className="text-xs text-indigo-700/80 font-medium">
                                        Atividade aberta na aba atual ({activeActivity.type})
                                    </p>
                                </div>
                            </div>
                            <span className="text-[11px] font-bold bg-white text-indigo-800 px-3 py-1 rounded-full border border-indigo-200">
                                Vinculada à tela atual
                            </span>
                        </div>
                    )}

                    {/* MODO B: Cadastrar Atividade Diferente (Customizada) */}
                    {activityMode === 'custom' && (
                        <div className="space-y-3 pt-1">
                            <div className="flex flex-col sm:flex-row gap-3">
                                <div className="flex-1">
                                    <label className="text-[11px] font-bold text-slate-600 mb-1 block">
                                        Nome da Atividade / Exercício / Conteúdo:
                                    </label>
                                    <input
                                        type="text"
                                        value={customTitle}
                                        onChange={(e) => setCustomTitle(e.target.value)}
                                        placeholder="Ex: Folha Impressa de Frações, Lição de Casa pág. 45, Trabalho em Grupo..."
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                                    />
                                </div>

                                <div className="sm:w-52">
                                    <label className="text-[11px] font-bold text-slate-600 mb-1 block">
                                        Tipo / Formato:
                                    </label>
                                    <select
                                        value={selectedCategory}
                                        onChange={(e) => setSelectedCategory(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                                    >
                                        <option value="Folha Impressa">📄 Folha Impressa / Xerox</option>
                                        <option value="Exercício no Caderno">📓 Exercício no Caderno</option>
                                        <option value="Lição de Casa">🏠 Lição de Casa</option>
                                        <option value="Trabalho em Grupo">👥 Trabalho em Grupo</option>
                                        <option value="Apresentação Oral">🗣️ Apresentação Oral</option>
                                        <option value="Avaliação Escrita">✍️ Avaliação Escrita</option>
                                        <option value="Atividade Presencial">🏫 Outra Atividade Presencial</option>
                                    </select>
                                </div>
                            </div>

                            {/* Tags de Categoria Rápida */}
                            <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                                <span className="text-[11px] font-medium text-slate-400 mr-1">Sugestões rápidas:</span>
                                {QUICK_CATEGORIES.map(cat => (
                                    <button
                                        key={cat.id}
                                        type="button"
                                        onClick={() => handleSelectQuickCategory(cat)}
                                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                                            selectedCategory === cat.label
                                                ? 'bg-indigo-600 text-white border-indigo-700 shadow-2xs'
                                                : `${cat.color} hover:opacity-80`
                                        }`}
                                    >
                                        <cat.icon className="w-3 h-3" />
                                        <span>{cat.label}</span>
                                    </button>
                                ))}
                            </div>

                            {/* Atividades Recentes Salvas */}
                            {recentActivities.length > 0 && (
                                <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-slate-100">
                                    <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                                        <History className="w-3 h-3" /> Recentes:
                                    </span>
                                    {recentActivities.slice(0, 5).map((recent, idx) => (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={() => handleSelectRecent(recent)}
                                            className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-[10px] font-semibold transition-colors cursor-pointer"
                                            title="Clique para reutilizar este nome"
                                        >
                                            {recent}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Opção de Pontuação Gamificada */}
                    <div className="flex items-center justify-between pt-3 border-t border-slate-100 flex-wrap gap-2">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={awardPoints}
                                onChange={(e) => setAwardPoints(e.target.checked)}
                                className="w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500 cursor-pointer"
                            />
                            <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                                Bonificar pontuação no ranking (+1 ponto para quem realizou)
                            </span>
                        </label>

                        <div className="text-[11px] text-slate-400 font-medium">
                            {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                        </div>
                    </div>
                </div>

                {/* 2. BARRA DE TURMA, BUSCA & ESTATÍSTICAS */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                        {/* Seletor de Turma */}
                        <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                                <GraduationCap className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <label className="text-[11px] font-black text-slate-700 uppercase tracking-wider">
                                        Turma Selecionada:
                                    </label>
                                    {officialSession?.isClassActive ? (
                                        <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-300">
                                            🔴 Aula Oficial em Andamento
                                        </span>
                                    ) : (
                                        <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-200" title="Funciona e salva a qualquer momento, independente de ter iniciado a aula oficial">
                                            ⚡ Registro Direto Ativo (Salva a Qualquer Momento)
                                        </span>
                                    )}
                                </div>
                                <select
                                    value={selectedClassId}
                                    onChange={(e) => setSelectedClassId(e.target.value)}
                                    className="bg-white border border-slate-200 rounded-xl px-2.5 py-1 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer mt-0.5 shadow-2xs"
                                >
                                    {classes && classes.length > 0 ? (
                                        classes.map(c => (
                                            <option key={c.id} value={c.id}>
                                                {c.name} ({c.students?.length || 0} alunos)
                                            </option>
                                        ))
                                    ) : (
                                        <option value="">Nenhuma turma cadastrada</option>
                                    )}
                                </select>
                            </div>
                        </div>

                        {/* Busca Rápida de Aluno */}
                        <div className="relative w-full md:w-64">
                            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Buscar aluno por nome..."
                                className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs"
                            />
                            {searchTerm && (
                                <button
                                    type="button"
                                    onClick={() => setSearchTerm('')}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Barra de Contadores e Ações Rápidas */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-200/60">
                        {/* Contadores */}
                        <div className="flex items-center gap-2 flex-wrap text-xs">
                            <span className="font-bold text-slate-600">
                                Total: <strong className="text-slate-900">{stats.total}</strong>
                            </span>
                            <span className="text-slate-300">•</span>
                            <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                                <CheckCircle2 className="w-3.5 h-3.5" /> {stats.completed} Realizou
                            </span>
                            <span className="inline-flex items-center gap-1 font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                                <XCircle className="w-3.5 h-3.5" /> {stats.notCompleted} Não Realizou
                            </span>
                            <span className="inline-flex items-center gap-1 font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                                <Minus className="w-3.5 h-3.5" /> {stats.neutral} Neutro
                            </span>
                        </div>

                        {/* Botões em Lote */}
                        <div className="flex items-center gap-1.5 self-start sm:self-auto flex-wrap">
                            <button
                                type="button"
                                onClick={handleMarkAllCompleted}
                                className="px-2.5 py-1 text-[11px] font-bold text-emerald-700 bg-emerald-100/70 hover:bg-emerald-200/80 rounded-lg border border-emerald-300 transition-colors cursor-pointer"
                                title="Marcar todos os alunos como Realizou"
                            >
                                🟢 Todos Realizaram
                            </button>
                            <button
                                type="button"
                                onClick={handleMarkAllNotCompleted}
                                className="px-2.5 py-1 text-[11px] font-bold text-rose-700 bg-rose-100/70 hover:bg-rose-200/80 rounded-lg border border-rose-300 transition-colors cursor-pointer"
                                title="Marcar todos os alunos como Não Realizou"
                            >
                                🔴 Todos Não Realizaram
                            </button>
                            <button
                                type="button"
                                onClick={handleResetAllNeutral}
                                className="px-2.5 py-1 text-[11px] font-bold text-slate-600 bg-white hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                                title="Redefinir todos os alunos para Neutro"
                            >
                                ⚪ Limpar (Neutro)
                            </button>
                        </div>
                    </div>
                </div>

                {/* 3. LISTA DE ALUNOS COM NOME COMPLETO & CONTROLE TRI-STATE */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-500 font-bold px-1">
                        <span>Alunos da Turma ({filteredStudents.length})</span>
                        <div className="flex items-center gap-12 sm:gap-16 pr-2 text-[11px] font-bold text-slate-400">
                            <span>Status da Atividade</span>
                            <span className="hidden sm:inline">Pontuação Rápida</span>
                        </div>
                    </div>

                    <div className="max-h-[46vh] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                        {filteredStudents.length > 0 ? (
                            filteredStudents.map((student, idx) => {
                                const currentStatus = statuses[student.id] || 'neutral';
                                const initials = (student.name || 'A')
                                    .split(' ')
                                    .slice(0, 2)
                                    .map(p => p[0])
                                    .join('')
                                    .toUpperCase();

                                return (
                                    <div
                                        key={student.id || idx}
                                        className={`p-3 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                                            currentStatus === 'completed'
                                                ? 'bg-emerald-50/60 border-emerald-300 shadow-2xs'
                                                : currentStatus === 'not_completed'
                                                    ? 'bg-rose-50/60 border-rose-300 shadow-2xs'
                                                    : 'bg-white border-slate-200/80 hover:border-slate-300'
                                        }`}
                                    >
                                        {/* Informações do Aluno com NOME COMPLETO */}
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0 shadow-2xs ${
                                                currentStatus === 'completed'
                                                    ? 'bg-emerald-600 text-white'
                                                    : currentStatus === 'not_completed'
                                                        ? 'bg-rose-600 text-white'
                                                        : 'bg-slate-100 text-slate-700'
                                            }`}>
                                                {initials || idx + 1}
                                            </div>
                                            <div className="min-w-0">
                                                <h4 className="text-sm font-bold text-slate-900 leading-snug break-words">
                                                    {student.name}
                                                </h4>
                                                <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium">
                                                    <span>Nº {idx + 1}</span>
                                                    <span className="font-bold text-slate-600">• {student.hits ?? 0} pts</span>
                                                    {currentStatus === 'completed' && (
                                                        <span className="text-emerald-700 font-bold">• Realizou</span>
                                                    )}
                                                    {currentStatus === 'not_completed' && (
                                                        <span className="text-rose-700 font-bold">• Não Realizou</span>
                                                    )}
                                                    {currentStatus === 'neutral' && (
                                                        <span className="text-slate-400">• Neutro</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Ações de Status Tri-State & Pontuação Comportamental (+1 Ponto / -1 Ponto à direita) */}
                                        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0 flex-wrap">
                                            {/* 1. Controles Tri-State (Fez, Não Fez, Neutro) */}
                                            <div className="flex items-center gap-1">
                                                {/* 🟢 Fez / Realizou */}
                                                <button
                                                    type="button"
                                                    onClick={() => setStudentStatus(student.id, 'completed')}
                                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                                                        currentStatus === 'completed'
                                                            ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm font-black'
                                                            : 'bg-white text-slate-700 hover:text-emerald-700 hover:bg-emerald-50 border-slate-200'
                                                    }`}
                                                    title="Marcar como Feito / Realizou"
                                                >
                                                    <CheckCircle2 className={`w-3.5 h-3.5 ${currentStatus === 'completed' ? 'text-white' : 'text-emerald-600'}`} />
                                                    <span>Realizou</span>
                                                </button>

                                                {/* 🔴 Não Fez */}
                                                <button
                                                    type="button"
                                                    onClick={() => setStudentStatus(student.id, 'not_completed')}
                                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                                                        currentStatus === 'not_completed'
                                                            ? 'bg-rose-600 text-white border-rose-700 shadow-sm font-black'
                                                            : 'bg-white text-slate-700 hover:text-rose-700 hover:bg-rose-50 border-slate-200'
                                                    }`}
                                                    title="Marcar como Não Realizou"
                                                >
                                                    <XCircle className={`w-3.5 h-3.5 ${currentStatus === 'not_completed' ? 'text-white' : 'text-rose-600'}`} />
                                                    <span>Não Fez</span>
                                                </button>

                                                {/* ⚪ Neutro */}
                                                <button
                                                    type="button"
                                                    onClick={() => setStudentStatus(student.id, 'neutral')}
                                                    className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center cursor-pointer border ${
                                                        currentStatus === 'neutral'
                                                            ? 'bg-slate-200 text-slate-800 border-slate-300 font-black'
                                                            : 'bg-white text-slate-400 hover:text-slate-700 hover:bg-slate-100 border-slate-200'
                                                    }`}
                                                    title="Manter Neutro (não avaliado agora)"
                                                >
                                                    <Minus className="w-3.5 h-3.5" />
                                                </button>
                                            </div>

                                            {/* 2. Botões de Pontuação (+1 Ponto / -1 Ponto) - À DIREITA DOS DEMAIS */}
                                            <div className="flex items-center gap-1 border-l border-slate-200/80 pl-2">
                                                {/* Adicionar Ponto (+1) */}
                                                <button
                                                    type="button"
                                                    onClick={() => handleOpenPointModal(student, 1)}
                                                    className="px-2.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 hover:text-blue-900 border border-blue-200 flex items-center gap-1 text-xs font-black transition-all shadow-2xs hover:scale-105 active:scale-95 cursor-pointer"
                                                    title="Adicionar +1 ponto (Abre registro rápido com justificativa)"
                                                >
                                                    <Plus className="w-3.5 h-3.5 stroke-[3] text-blue-600" />
                                                    <span className="hidden sm:inline text-[11px] font-extrabold text-blue-700">1 Ponto</span>
                                                    <span className="sm:hidden font-extrabold">1</span>
                                                </button>

                                                {/* Remover Ponto (-1) */}
                                                <button
                                                    type="button"
                                                    onClick={() => handleOpenPointModal(student, -1)}
                                                    className="px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 hover:text-amber-950 border border-amber-200 flex items-center gap-1 text-xs font-black transition-all shadow-2xs hover:scale-105 active:scale-95 cursor-pointer"
                                                    title="Remover 1 ponto (Abre registro rápido com justificativa de infração)"
                                                >
                                                    <Minus className="w-3.5 h-3.5 stroke-[3] text-amber-700" />
                                                    <span className="hidden sm:inline text-[11px] font-extrabold text-amber-800">1 Ponto</span>
                                                    <span className="sm:hidden font-extrabold">1</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="p-8 text-center bg-white rounded-2xl border-2 border-dashed border-slate-200">
                                <p className="text-sm font-bold text-slate-600">
                                    {searchTerm 
                                        ? `Nenhum aluno encontrado para "${searchTerm}".` 
                                        : 'Esta turma ainda não possui alunos cadastrados.'}
                                </p>
                                <p className="text-xs text-slate-400 mt-1">
                                    Cadastre alunos ou importe uma lista pelo painel de turmas para utilizar este registro.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Modal>

        {/* Modal de Justificativa Existente (+1 Ação Positiva / -1 Infração) */}
        <PointJustificationModal
            isOpen={pointModal.isOpen}
            onClose={() => setPointModal(prev => ({ ...prev, isOpen: false }))}
            targetName={pointModal.studentName}
            targetType="student"
            delta={pointModal.delta}
            onConfirm={handleConfirmPointJustification}
        />
        </>
    );
};
