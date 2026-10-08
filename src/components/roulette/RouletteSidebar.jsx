import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
    User, 
    Users, 
    Trophy, 
    Plus, 
    Minus, 
    Target, 
    UserMinus, 
    RotateCcw, 
    CheckCircle, 
    XCircle, 
    HeartHandshake, 
    Award, 
    Edit3, 
    Search, 
    X, 
    ChevronRight,
    Sparkles,
    BarChart3
} from 'lucide-react';
import { PointJustificationModal } from './card-modals/PointJustificationModal';

export const RouletteSidebar = ({
    isOpen,
    onClose,
    placarTab,
    setPlacarTab,
    combinedItems = [],
    currentGroups = [],
    currentClass,
    studentToGroupMap,
    spinning = false,
    studentDrawCounts = {},
    studentProbabilityStats = {},
    studentCycleInfo = { cycle: 1, drawnInCycle: 0, total: 0 },
    onResetDrawCycle,
    onAdjustPoints,
    onAdjustGroupPoints,
    onSelectStudentManually,
    onSelectGroupManually,
    onToggleStudentActivityStatus,
    onReactivate,
    onActivateAll,
    onDeactivateAll,
    onOpenHistory,
    onOpenClassReport,
    onOpenGroupsModal,
    onOpenClassesModal
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'removed' | 'help'

    // Estado do Modal de Justificativa de Pontos
    const [justificationModal, setJustificationModal] = useState({
        isOpen: false,
        targetId: null,
        targetName: '',
        targetType: 'student', // 'student' | 'group'
        delta: 1
    });

    const handleOpenJustification = (id, name, type, delta) => {
        setJustificationModal({
            isOpen: true,
            targetId: id,
            targetName: name,
            targetType: type,
            delta
        });
    };

    const handleConfirmJustification = (justificationText) => {
        const { targetId, targetType, delta } = justificationModal;
        if (targetType === 'group') {
            onAdjustGroupPoints(targetId, delta, justificationText);
        } else {
            onAdjustPoints(targetId, delta, justificationText);
        }
    };

    // Filtra os alunos por busca textual e chip de status
    const filteredStudents = useMemo(() => {
        return combinedItems.filter(student => {
            const matchesSearch = !searchTerm.trim() || 
                student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (student.groupName && student.groupName.toLowerCase().includes(searchTerm.toLowerCase()));

            if (!matchesSearch) return false;

            if (statusFilter === 'active') return student.status === 'active';
            if (statusFilter === 'removed') return student.status === 'removed' || student.status === 'absent';
            if (statusFilter === 'help') {
                const studentHelps = (student.history || []).filter(h => 
                    h.result === 'help_correct' || h.hadHelp || h.helperName || (h.question && (h.question.includes('(com ajuda') || h.question.includes('[Ajuda:')))
                );
                const hadHelp = studentHelps.length > 0 || !!student.hadHelp || (student.helpCount && student.helpCount > 0);
                const studentHelpedOthers = (student.history || []).filter(h => h.helpedStudent || h.isHelperRole);
                const helpedCount = Math.max(studentHelpedOthers.length, student.helpedCount || 0);
                return hadHelp || helpedCount > 0;
            }

            return true;
        });
    }, [combinedItems, searchTerm, statusFilter]);

    // Filtra grupos por busca textual
    const filteredGroups = useMemo(() => {
        if (!searchTerm.trim()) return currentGroups;
        const term = searchTerm.toLowerCase();
        return currentGroups.filter(g => g.name.toLowerCase().includes(term));
    }, [currentGroups, searchTerm]);

    const activeCount = combinedItems.filter(s => s.status === 'active').length;
    const removedCount = combinedItems.filter(s => s.status === 'removed' || s.status === 'absent').length;
    const helpTotalCount = combinedItems.filter(s => {
        const studentHelps = (s.history || []).filter(h => 
            h.result === 'help_correct' || h.hadHelp || h.helperName || (h.question && (h.question.includes('(com ajuda') || h.question.includes('[Ajuda:')))
        );
        return studentHelps.length > 0 || !!s.hadHelp || (s.helpCount && s.helpCount > 0);
    }).length;

    if (typeof document === 'undefined') return null;

    // Portal no body: escapa de containers pai e fica acima da arena maximizada (z-9000) e do card (z-10000)
    return createPortal(
        <>
            {/* Modal de Justificativa para Adicionar ou Remover Ponto */}
            <PointJustificationModal 
                isOpen={justificationModal.isOpen}
                onClose={() => setJustificationModal(prev => ({ ...prev, isOpen: false }))}
                targetName={justificationModal.targetName}
                targetType={justificationModal.targetType}
                delta={justificationModal.delta}
                onConfirm={handleConfirmJustification}
            />

            <aside
                aria-label="Painel Lateral de Alunos e Placar"
                className={`fixed inset-y-0 right-0 z-[11000] w-full md:w-[80vw] max-w-[92vw] bg-white/95 backdrop-blur-xl border-l border-slate-200/80 shadow-[0_0_50px_rgba(0,0,0,0.15)] flex flex-col transform transition-transform duration-300 ease-out select-none ${
                    isOpen ? 'translate-x-0' : 'translate-x-full pointer-events-none'
                }`}
            >
                {/* Botão de recolhimento na borda externa esquerda do Drawer */}
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute -left-4 top-14 bg-white border border-slate-200 shadow-md text-slate-500 hover:text-indigo-600 w-8 h-8 rounded-full hidden sm:flex items-center justify-center cursor-pointer transition-all hover:scale-110 active:scale-95 z-10"
                    title="Recolher painel lateral"
                >
                    <ChevronRight className="w-5 h-5" />
                </button>

                {/* 1. TOPO: Cabeçalho Elegante com Título, Status e Botão Fechar Destaque */}
                <div className="p-4 sm:p-5 border-b border-slate-100 bg-gradient-to-r from-indigo-50/70 via-purple-50/30 to-white shrink-0 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-200 shrink-0">
                                <Users className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                    <h3 className="text-lg font-black text-slate-900 tracking-tight truncate">
                                        Alunos & Placar
                                    </h3>
                                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs shrink-0">
                                        Ao Vivo
                                    </span>
                                </div>
                                <p className="text-xs font-semibold text-slate-500 truncate">
                                    {currentClass?.name || 'Turma Ativa'} • <strong className="text-indigo-600 font-extrabold">{activeCount}</strong> na roda
                                </p>
                            </div>
                        </div>

                        {/* Botão Fechar de Alto Destaque */}
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-slate-200 hover:border-rose-200 text-xs font-bold transition-all cursor-pointer shadow-2xs group shrink-0 active:scale-95"
                            title="Fechar painel lateral"
                        >
                            <X className="w-4 h-4 group-hover:rotate-90 transition-transform text-slate-400 group-hover:text-rose-600" />
                            <span>Fechar</span>
                        </button>
                    </div>

                    {/* Selector de Abas e Botão de Gerenciamento da Turma */}
                    <div className="flex items-center justify-between gap-3 pt-1">
                        <div className="flex items-center gap-1.5 bg-slate-100/90 p-1 rounded-2xl flex-1 sm:flex-none">
                            <button
                                type="button"
                                onClick={() => setPlacarTab('students')}
                                className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                                    placarTab === 'students'
                                        ? 'bg-white text-indigo-700 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-800'
                                }`}
                            >
                                <User className="w-4 h-4" />
                                <span>Alunos ({combinedItems.length})</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setPlacarTab('groups')}
                                className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                                    placarTab === 'groups'
                                        ? 'bg-purple-600 text-white shadow-sm'
                                        : 'text-slate-500 hover:text-slate-800'
                                }`}
                            >
                                <Trophy className="w-4 h-4" />
                                <span>Equipes ({currentGroups.length})</span>
                            </button>
                        </div>

                        {placarTab === 'groups' && (
                            <button
                                type="button"
                                onClick={onOpenGroupsModal}
                                className="text-xs font-bold text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shrink-0 shadow-2xs"
                                title="Gerenciar equipes e seus integrantes"
                            >
                                <Edit3 className="w-3.5 h-3.5" /> <span>Gerenciar Equipes</span>
                            </button>
                        )}
                        {placarTab === 'students' && (
                            <button
                                type="button"
                                onClick={onOpenClassesModal}
                                className="text-xs font-bold text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shrink-0 shadow-2xs"
                                title="Cadastrar novos alunos, editar nomes ou remover alunos da turma"
                            >
                                <Edit3 className="w-3.5 h-3.5" /> <span>Gerenciar Turma</span>
                            </button>
                        )}
                    </div>

                    {/* Botão de Atalho para Relatório & Insights */}
                    {onOpenClassReport && (
                        <button
                            type="button"
                            onClick={onOpenClassReport}
                            className="w-full py-2 px-4 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-indigo-500/10 hover:from-indigo-600/20 hover:to-purple-600/20 border border-indigo-200/80 text-indigo-950 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all shadow-2xs cursor-pointer active:scale-98 group"
                            title="Ver relatório detalhado da aula atual com insights pedagógicos"
                        >
                            <BarChart3 className="w-4 h-4 text-indigo-600 group-hover:scale-110 transition-transform" />
                            <span>Relatório da Aula & Insights Pedagógicos</span>
                        </button>
                    )}

                    {/* Campo de Busca Rápida */}
                    <div className="relative">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder={placarTab === 'students' ? "Buscar aluno por nome ou equipe..." : "Buscar equipe..."}
                            className="w-full pl-9 pr-8 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-slate-800 placeholder-slate-400 shadow-2xs"
                        />
                        {searchTerm && (
                            <button
                                type="button"
                                onClick={() => setSearchTerm('')}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>

                    {/* Chips de Filtro e Ações Rápidas em Lote */}
                    {placarTab === 'students' && (
                        <div className="space-y-2 pt-1 border-t border-slate-100">
                            {/* Filtros em Chips */}
                            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar text-xs font-bold">
                                <button
                                    type="button"
                                    onClick={() => setStatusFilter('all')}
                                    className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer shrink-0 ${
                                        statusFilter === 'all'
                                            ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                    }`}
                                >
                                    Todos ({combinedItems.length})
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setStatusFilter('active')}
                                    className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer shrink-0 ${
                                        statusFilter === 'active'
                                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                                            : 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
                                    }`}
                                >
                                    Na Roleta ({activeCount})
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setStatusFilter('removed')}
                                    className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer shrink-0 ${
                                        statusFilter === 'removed'
                                            ? 'bg-slate-700 text-white border-slate-700 shadow-2xs'
                                            : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                                    }`}
                                >
                                    Fora ({removedCount})
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setStatusFilter('help')}
                                    className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                                        statusFilter === 'help'
                                            ? 'bg-sky-600 text-white border-sky-600 shadow-2xs'
                                            : 'bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100'
                                    }`}
                                >
                                    <HeartHandshake className="w-3.5 h-3.5" />
                                    <span>Com Ajuda ({helpTotalCount})</span>
                                </button>
                            </div>

                            {/* Barra de Ações Rápidas: Contagem e Botões em Lote */}
                            <div className="flex items-center justify-between gap-2 text-xs">
                                <span className="font-semibold text-slate-500">
                                    <strong className="text-indigo-600 font-bold">{activeCount}</strong> na roleta • <strong className="text-slate-600 font-bold">{removedCount}</strong> fora
                                </span>
                                <div className="flex items-center gap-1.5">
                                    <button
                                        type="button"
                                        onClick={onActivateAll}
                                        disabled={removedCount === 0}
                                        className="font-bold text-blue-800 bg-blue-50 hover:bg-blue-100 disabled:opacity-40 disabled:cursor-not-allowed border border-blue-200 px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 shadow-2xs active:scale-95"
                                        title="Colocar todos os alunos na roleta"
                                    >
                                        <RotateCcw className="w-3 h-3 text-blue-600" /> <span>Colocar Todos</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={onDeactivateAll}
                                        disabled={activeCount === 0}
                                        className="font-bold text-amber-900 bg-amber-50 hover:bg-amber-100 disabled:opacity-40 disabled:cursor-not-allowed border border-amber-200 px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 shadow-2xs active:scale-95"
                                        title="Tirar todos os alunos da roleta"
                                    >
                                        <UserMinus className="w-3 h-3 text-amber-800" /> <span>Tirar Todos</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* 2. CORPO: Lista de Alunos ou Equipes com Design Limpo e Espaçoso */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-5 custom-scrollbar space-y-3 bg-slate-50/60">
                    {placarTab === 'groups' ? (
                        /* Aba de Equipes */
                        filteredGroups.length === 0 ? (
                            <div className="text-center py-12 px-4 bg-white rounded-2xl border border-dashed border-purple-200 shadow-2xs">
                                <Users className="w-10 h-10 text-purple-300 mx-auto mb-2" />
                                <p className="text-sm font-bold text-purple-900 mb-1">
                                    {searchTerm ? 'Nenhuma equipe encontrada' : 'Nenhuma equipe configurada'}
                                </p>
                                <p className="text-xs text-purple-600 mb-4">
                                    {searchTerm ? 'Tente outra busca.' : 'Crie grupos e atribua alunos para acompanhar o placar.'}
                                </p>
                                {!searchTerm && (
                                    <button
                                        type="button"
                                        onClick={onOpenGroupsModal}
                                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer inline-flex items-center gap-1.5"
                                    >
                                        <Plus className="w-4 h-4" /> Criar Equipes
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="flex flex-col gap-4">
                                {/* Cabeçalho da Lista de Equipes com Reset de Faltas */}
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1 text-xs font-bold text-slate-500 pb-2 border-b border-slate-100">
                                    <div className="flex items-center gap-2">
                                        <span className="uppercase text-[11px] tracking-wider text-slate-400 font-extrabold">
                                            Equipes ({filteredGroups.length})
                                        </span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={onActivateAll}
                                        disabled={removedCount === 0}
                                        className="text-[11px] font-bold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2.5 py-1.5 rounded-xl transition-all cursor-pointer inline-flex items-center gap-1.5 self-start sm:self-auto disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
                                        title="Zerar faltas: Limpar o status de todos os alunos ausentes, colocando-os de volta em suas equipes para o dia de hoje."
                                    >
                                        <RotateCcw className="w-3.5 h-3.5 text-blue-600" />
                                        <span>Zerar Faltas (Todos Presentes)</span>
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {[...filteredGroups]
                                    .sort((a, b) => (b.hits || 0) - (a.hits || 0))
                                    .map((group, rankIdx) => {
                                        const memberIdSet = new Set((group.studentIds || []).map(String));
                                        const memberStudents = combinedItems.filter(s => memberIdSet.has(String(s.id)));
                                        const medal = rankIdx === 0 ? '🥇' : rankIdx === 1 ? '🥈' : rankIdx === 2 ? '🥉' : `${rankIdx + 1}º`;

                                        return (
                                            <div 
                                                key={group.id} 
                                                className="flex flex-col p-4 rounded-2xl border border-slate-200/90 bg-white transition-all hover:shadow-md"
                                                style={{ borderLeftColor: group.color || '#6366f1', borderLeftWidth: '6px' }}
                                            >
                                                {/* Topo da Equipe: Posição, Nome, Total e Ajuste de Pontos */}
                                                <div className="flex items-center justify-between gap-3">
                                                    <div className="flex items-center gap-2.5 min-w-0">
                                                        <span className="text-lg font-black shrink-0">{medal}</span>
                                                        <div className="min-w-0">
                                                            <h4 className="font-black text-base text-slate-900 truncate" title={group.name}>
                                                                {group.name}
                                                            </h4>
                                                            <span className="text-xs text-slate-400 font-semibold">
                                                                {memberStudents.length} {memberStudents.length === 1 ? 'membro' : 'membros'}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-3 shrink-0">
                                                        {/* Pontuação Rápida (+1 e -1 com legenda acima) */}
                                                        <div className="flex flex-col items-center">
                                                            <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider mb-0.5">Ajustar</span>
                                                            <div className="flex items-center bg-slate-100/90 border border-slate-200/90 rounded-xl p-0.5 shadow-2xs">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleOpenJustification(group.id, group.name, 'group', 1)}
                                                                    className="px-2 py-1 text-blue-700 hover:bg-blue-100/90 rounded-lg flex items-center gap-0.5 text-xs font-black transition-colors cursor-pointer"
                                                                    title="Adicionar 1 ponto para a equipe (+1)"
                                                                >
                                                                    <Plus className="w-3.5 h-3.5 text-blue-600" />
                                                                    <span>1</span>
                                                                </button>
                                                                <div className="w-[1px] h-4 bg-slate-200 mx-0.5" />
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleOpenJustification(group.id, group.name, 'group', -1)}
                                                                    className="px-2 py-1 text-amber-900 hover:bg-amber-100/90 rounded-lg flex items-center gap-0.5 text-xs font-black transition-colors cursor-pointer"
                                                                    title="Diminuir 1 ponto da equipe (-1)"
                                                                >
                                                                    <Minus className="w-3.5 h-3.5 text-amber-800" />
                                                                    <span>1</span>
                                                                </button>
                                                            </div>
                                                        </div>

                                                        {/* Badge de Pontos */}
                                                        <div className="flex flex-col items-center">
                                                            <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider mb-0.5">Pontuação</span>
                                                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 border border-purple-200 text-purple-900 font-black text-xs shadow-2xs">
                                                                <Trophy className="w-4 h-4 text-purple-600" />
                                                                <span>{group.hits || 0} pts</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Integrantes da Equipe */}
                                                <div className="flex flex-wrap gap-1.5 mt-3 pt-2.5 border-t border-slate-100">
                                                    {memberStudents.length === 0 ? (
                                                        <span className="text-xs text-slate-400 italic">Nenhum aluno cadastrado nesta equipe</span>
                                                    ) : (
                                                        memberStudents.map(s => {
                                                            const isAbsent = s.status === 'absent' || s.status === 'removed';
                                                            return (
                                                                <button 
                                                                    key={s.id} 
                                                                    type="button"
                                                                    onClick={() => isAbsent ? onReactivate(s.id) : onToggleStudentActivityStatus(s.id, 'remove')}
                                                                    title={isAbsent ? "Devolver aluno para a roleta e para o grupo" : "Marcar aluno como ausente (não ganhará os pontos de hoje da equipe)"}
                                                                    className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer group shadow-2xs ${
                                                                        isAbsent
                                                                            ? 'bg-slate-50 text-slate-400 border-slate-200/50 hover:bg-slate-100 line-through'
                                                                            : 'bg-white text-slate-700 border-slate-200 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200'
                                                                    }`}
                                                                >
                                                                    <div className={`w-1.5 h-1.5 rounded-full transition-colors ${isAbsent ? 'bg-slate-300' : 'bg-emerald-400 group-hover:bg-amber-400'}`} />
                                                                    <span className={isAbsent ? 'line-through opacity-70 decoration-slate-400' : ''}>{s.name}</span>
                                                                </button>
                                                            );
                                                        })
                                                    )}
                                                </div>

                                                {/* Botão Chamar Equipe */}
                                                <div className="mt-3 pt-2.5 border-t border-slate-100 flex justify-end">
                                                    <button
                                                        type="button"
                                                        onClick={() => onSelectGroupManually(group.id)}
                                                        disabled={spinning}
                                                        className="text-xs font-bold text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer disabled:opacity-50 active:scale-95"
                                                        title="Escolher esta equipe para responder agora"
                                                    >
                                                        <Target className="w-4 h-4 text-purple-600" />
                                                        <span>Chamar Equipe</span>
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                            </div>
                        </div>
                        )
                    ) : (
                        /* Aba de Alunos - Layout Clean e Organizado */
                        <>
                            {/* Cabeçalho da Lista de Alunos com Ciclo de Probabilidade */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1 text-xs font-bold text-slate-500 pb-1">
                                <div className="flex items-center gap-2">
                                    <span className="uppercase text-[11px] tracking-wider text-slate-400 font-extrabold">
                                        Alunos ({filteredStudents.length})
                                    </span>
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                                        Ciclo {studentCycleInfo.cycle} ({studentCycleInfo.drawnInCycle}/{studentCycleInfo.total} sorteados)
                                    </span>
                                </div>
                                {onResetDrawCycle && (
                                    <button
                                        type="button"
                                        onClick={onResetDrawCycle}
                                        disabled={spinning}
                                        className="text-[11px] font-bold text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2.5 py-1 rounded-xl transition-all cursor-pointer inline-flex items-center gap-1 self-start sm:self-auto"
                                        title="Restaurar a probabilidade base igual para todos os alunos e perguntas"
                                    >
                                        <RotateCcw className="w-3 h-3 text-indigo-600" />
                                        <span>Resetar Pesos</span>
                                    </button>
                                )}
                            </div>

                            {filteredStudents.length === 0 ? (
                                <div className="text-center py-12 px-4 bg-white rounded-2xl border border-dashed border-slate-200 shadow-2xs">
                                    <User className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                                    <p className="text-sm font-bold text-slate-700 mb-1">Nenhum aluno encontrado</p>
                                    <p className="text-xs text-slate-400">Tente alterar o filtro ou o termo digitado na busca.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {filteredStudents.map(student => {
                                        const studentGroup = studentToGroupMap?.get(student.id) || studentToGroupMap?.get(String(student.id));
                                        const studentHelps = (student.history || []).filter(h => 
                                            h.result === 'help_correct' || h.hadHelp || h.helperName || (h.question && (h.question.includes('(com ajuda') || h.question.includes('[Ajuda:')))
                                        );
                                        const hadHelp = studentHelps.length > 0 || !!student.hadHelp || (student.helpCount && student.helpCount > 0);
                                        const helpCount = Math.max(studentHelps.length, student.helpCount || 0);

                                        const studentHelpedOthers = (student.history || []).filter(h => h.helpedStudent || h.isHelperRole);
                                        const helpedCount = Math.max(studentHelpedOthers.length, student.helpedCount || 0);

                                        // Ajustes Manuais (Méritos / Penalidades)
                                        const indMerits = (student.history || []).filter(h => h.result === 'merit' || h.result === 'point_merit').length;
                                        const indPenalties = (student.history || []).filter(h => h.result === 'rule_violation' || h.result === 'point_penalty' || h.result === 'not_executed').length;

                                        // Acertos e Erros de Questões (Individuais)
                                        const studentQuestionHitsEntries = (student.history || []).filter(h => !h.isGroupActivity && (h.result === 'correct' || h.result === 'help_correct'));
                                        const studentQuestionMissesEntries = (student.history || []).filter(h => !h.isGroupActivity && (h.result === 'incorrect' || h.result === 'miss'));

                                        const indQuestionHits = studentQuestionHitsEntries.length > 0 
                                            ? studentQuestionHitsEntries.length 
                                            : Math.max(0, (student.hits || 0) - indMerits);

                                        const indQuestionMisses = studentQuestionMissesEntries.length > 0 
                                            ? studentQuestionMissesEntries.length 
                                            : Math.max(0, (student.misses || 0) - indPenalties);

                                        // Acertos e Erros de Questões (Grupo / Equipe)
                                        const groupQuestionHitsEntries = (student.history || []).filter(h => h.isGroupActivity && (h.result === 'correct' || h.result === 'help_correct'));
                                        const groupQuestionMissesEntries = (student.history || []).filter(h => h.isGroupActivity && (h.result === 'incorrect' || h.result === 'miss'));

                                        const groupMerits = ((studentGroup?.history) || []).filter(h => h.result === 'merit' || h.result === 'point_merit').length;
                                        const groupPenalties = ((studentGroup?.history) || []).filter(h => h.result === 'rule_violation' || h.result === 'point_penalty').length;

                                        const groupQuestionHits = studentGroup 
                                            ? Math.max(groupQuestionHitsEntries.length, Math.max(0, (studentGroup.hits || 0) - groupMerits)) 
                                            : groupQuestionHitsEntries.length;

                                        const groupQuestionMisses = studentGroup 
                                            ? Math.max(groupQuestionMissesEntries.length, Math.max(0, (studentGroup.misses || 0) - groupPenalties)) 
                                            : groupQuestionMissesEntries.length;

                                        // Pontuação Geral (Inclui Pontos de Questões + Ajustes Manuais + Equipe)
                                        const totalPoints = (student.hits || 0) + (studentGroup ? (studentGroup.hits || 0) : 0);

                                        // Estatísticas de Probabilidade de Sorteio (Modo 2: Probabilidade Decrescente)
                                        const probStat = studentProbabilityStats[String(student.id)] || { drawCount: studentDrawCounts[String(student.id)] || 0, probabilityPercent: '0.0' };

                                        return (
                                            <div 
                                                key={student.id} 
                                                className={`flex flex-col p-4 rounded-2xl border transition-all duration-200 space-y-3 ${
                                                    student.status === 'active' 
                                                        ? 'bg-white border-slate-200/90 shadow-2xs hover:shadow-md hover:border-indigo-300' 
                                                        : 'bg-slate-100/90 border-slate-200 opacity-80'
                                                }`}
                                            >
                                                {/* LINHA 1: Avatar, Nome, Pontuação Geral, Equipe e Status de Presença/Roleta */}
                                                <div className="flex items-center justify-between gap-3">
                                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                                        {/* Avatar do Aluno */}
                                                        <div 
                                                            className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black shrink-0 border shadow-2xs"
                                                            style={{
                                                                backgroundColor: student.groupColor ? `${student.groupColor}20` : '#e0e7ff',
                                                                color: student.groupColor || '#4338ca',
                                                                borderColor: student.groupColor ? `${student.groupColor}40` : '#c7d2fe'
                                                            }}
                                                        >
                                                            {student.name.charAt(0).toUpperCase()}
                                                        </div>

                                                        {/* Nome do Aluno e Pontuação Geral (no topo) com Tag do Grupo (abaixo) */}
                                                        <div className="min-w-0 flex flex-col gap-1 flex-1">
                                                            {/* Linha 1: Nome + Pontuação Geral */}
                                                            <div className="flex items-center gap-2 flex-wrap min-w-0">
                                                                <span 
                                                                    className={`font-black text-base tracking-tight truncate ${student.status === 'active' ? 'text-slate-900' : 'text-slate-500 line-through'}`} 
                                                                    title={student.name}
                                                                >
                                                                    {student.name}
                                                                </span>

                                                                {/* Pontuação Geral ao Lado do Nome */}
                                                                <span 
                                                                    className="inline-flex items-center gap-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white font-black text-xs px-2.5 py-0.5 rounded-full shadow-2xs shrink-0 cursor-pointer"
                                                                    onClick={() => onOpenHistory(student)}
                                                                    title={`Pontuação Geral: ${totalPoints} pts (${indQuestionHits} ind. + ${groupQuestionHits} grp.)`}
                                                                >
                                                                    <Sparkles className="w-3 h-3 text-amber-300 animate-pulse" />
                                                                    <span>{totalPoints} pts</span>
                                                                </span>
                                                            </div>

                                                            {/* Linha 2: Tag do Grupo & Badge de Probabilidade de Sorteio (Abaixo) */}
                                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                                {student.groupName && (
                                                                    <span
                                                                        style={{
                                                                            backgroundColor: `${student.groupColor || '#6366f1'}15`,
                                                                            color: student.groupColor || '#6366f1',
                                                                            borderColor: `${student.groupColor || '#6366f1'}35`
                                                                        }}
                                                                        className="text-[10px] font-black px-2 py-0.5 rounded-md border self-start truncate max-w-[160px] leading-tight"
                                                                        title={`Equipe: ${student.groupName}`}
                                                                    >
                                                                        {student.groupName}
                                                                    </span>
                                                                )}

                                                                {student.status === 'active' && (
                                                                    probStat.drawCount === 0 ? (
                                                                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200/80 shrink-0" title="Ainda não foi sorteado no ciclo atual (100% peso base)">
                                                                            ✨ 0x sorteado ({probStat.probabilityPercent}% chance)
                                                                        </span>
                                                                    ) : (
                                                                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-200/80 shrink-0" title={`Já foi sorteado ${probStat.drawCount}x no ciclo atual (peso reduzido)`}>
                                                                            🎲 {probStat.drawCount}x ({probStat.probabilityPercent}% chance)
                                                                        </span>
                                                                    )
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Chip de Status Na Roleta / Fora em azul / marrom */}
                                                    {student.status === 'active' ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => onToggleStudentActivityStatus(student.id, 'remove')}
                                                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-extrabold bg-blue-50 text-blue-800 border border-blue-300 hover:bg-amber-50 hover:text-amber-900 hover:border-amber-300 transition-all cursor-pointer group/toggle shrink-0 shadow-2xs"
                                                            title="Aluno ativo na roleta. Clique para tirar da roleta."
                                                        >
                                                            <span className="w-2 h-2 rounded-full bg-blue-500 group-hover/toggle:bg-amber-700 animate-pulse" />
                                                            <span className="group-hover/toggle:hidden">Na Roleta</span>
                                                            <span className="hidden group-hover/toggle:inline">Tirar</span>
                                                        </button>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            onClick={() => onReactivate(student.id)}
                                                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-extrabold bg-slate-200/90 text-slate-700 border border-slate-300 hover:bg-blue-50 hover:text-blue-800 hover:border-blue-300 transition-all cursor-pointer group/toggle shrink-0 shadow-2xs"
                                                            title={`Aluno ${student.status === 'absent' ? 'ausente' : 'fora da roleta'}. Clique para colocar de volta na roleta.`}
                                                        >
                                                            <span className="w-2 h-2 rounded-full bg-slate-400 group-hover/toggle:bg-blue-500" />
                                                            <span className="group-hover/toggle:hidden">{student.status === 'absent' ? 'Ausente' : 'Fora da Roleta'}</span>
                                                            <span className="hidden group-hover/toggle:inline">Colocar</span>
                                                        </button>
                                                    )}
                                                </div>

                                                {/* LINHA 2: Controles de Pontuação com Legenda & Placar Destacado */}
                                                <div className="flex items-end justify-between gap-2 mt-3 pt-2.5 border-t border-slate-100 flex-wrap">
                                                    {/* Lista Empilhada: 1. Ajustar em cima / 2. Pontuações em baixo */}
                                                    <div className="flex flex-col items-start gap-2.5 min-w-0 flex-1">
                                                        {/* Item 1: AJUSTAR */}
                                                        <div className="flex flex-col items-start">
                                                            <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider mb-0.5">Ajustar</span>
                                                            <div className="flex items-center bg-slate-100/90 border border-slate-200/90 rounded-xl p-0.5 shadow-2xs">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleOpenJustification(student.id, student.name, 'student', 1)}
                                                                    className="px-2.5 py-1 text-blue-700 hover:bg-blue-100/90 rounded-lg flex items-center gap-0.5 text-xs font-black transition-colors cursor-pointer"
                                                                    title="Adicionar 1 ponto (+1)"
                                                                >
                                                                    <Plus className="w-3.5 h-3.5 text-blue-600" />
                                                                    <span>1</span>
                                                                </button>
                                                                <div className="w-[1px] h-4 bg-slate-200 mx-0.5" />
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleOpenJustification(student.id, student.name, 'student', -1)}
                                                                    className="px-2.5 py-1 text-amber-900 hover:bg-amber-100/90 rounded-lg flex items-center gap-0.5 text-xs font-black transition-colors cursor-pointer"
                                                                    title="Diminuir 1 ponto (-1)"
                                                                >
                                                                    <Minus className="w-3.5 h-3.5 text-amber-800" />
                                                                    <span>1</span>
                                                                </button>
                                                            </div>
                                                        </div>

                                                        {/* Item 2: ACERTOS E ERROS (Apenas Respostas de Questões) */}
                                                        <div className="flex flex-col items-start min-w-0 max-w-full">
                                                            <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider mb-0.5">Acertos e Erros</span>
                                                            <button 
                                                                type="button"
                                                                onClick={() => onOpenHistory(student)}
                                                                className="flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100/90 border border-slate-200/90 p-1 px-2 rounded-xl transition-all shadow-2xs cursor-pointer group/score flex-wrap"
                                                                title="Clique para ver o histórico detalhado de questões do aluno"
                                                            >
                                                                {/* Acertos Individuais de Questões */}
                                                                <span 
                                                                    className="inline-flex items-center gap-1 text-[11px] font-black text-blue-800 bg-blue-50/90 border border-blue-200/90 px-1.5 py-0.5 rounded-lg shrink-0"
                                                                    title={`Acertos Individuais em Questões: ${indQuestionHits}`}
                                                                >
                                                                    <CheckCircle className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                                                    <span>{indQuestionHits}</span>
                                                                    <span className="text-[9px] text-blue-600 font-extrabold uppercase">ind</span>
                                                                </span>

                                                                {/* Acertos em Grupo de Questões */}
                                                                <span 
                                                                    className="inline-flex items-center gap-1 text-[11px] font-black text-indigo-800 bg-indigo-50/90 border border-indigo-200/90 px-1.5 py-0.5 rounded-lg shrink-0"
                                                                    title={`Acertos em Grupo em Questões: ${groupQuestionHits}`}
                                                                >
                                                                    <Trophy className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                                                                    <span>{groupQuestionHits}</span>
                                                                    <span className="text-[9px] text-indigo-600 font-extrabold uppercase">grp</span>
                                                                </span>

                                                                <div className="w-[1px] h-4 bg-slate-200/90 mx-0.5 shrink-0 hidden sm:block" />

                                                                {/* Erros Individuais de Questões */}
                                                                <span 
                                                                    className="inline-flex items-center gap-1 text-[11px] font-black text-amber-950 bg-amber-50/90 border border-amber-200/90 px-1.5 py-0.5 rounded-lg shrink-0"
                                                                    title={`Erros Individuais em Questões: ${indQuestionMisses}`}
                                                                >
                                                                    <XCircle className="w-3.5 h-3.5 text-amber-800 shrink-0" />
                                                                    <span>{indQuestionMisses}</span>
                                                                    <span className="text-[9px] text-amber-800 font-extrabold uppercase">ind</span>
                                                                </span>

                                                                {/* Erros em Grupo de Questões */}
                                                                <span 
                                                                    className="inline-flex items-center gap-1 text-[11px] font-black text-orange-950 bg-orange-50/90 border border-orange-200/90 px-1.5 py-0.5 rounded-lg shrink-0"
                                                                    title={`Erros em Grupo em Questões: ${groupQuestionMisses}`}
                                                                >
                                                                    <Users className="w-3.5 h-3.5 text-orange-700 shrink-0" />
                                                                    <span>{groupQuestionMisses}</span>
                                                                    <span className="text-[9px] text-orange-700 font-extrabold uppercase">grp</span>
                                                                </span>
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* LINHA 3: Espírito de Equipe (Teve Ajuda / Ajudou) & Ações do Aluno */}
                                                <div className="flex items-end justify-between gap-2 mt-2.5 pt-2.5 border-t border-slate-100 flex-wrap">
                                                    {/* Espírito de Equipe (Teve Ajuda / Ajudou) */}
                                                    <div className="flex flex-col gap-1 min-w-0">
                                                        {(hadHelp || helpedCount > 0) && (
                                                            <>
                                                                <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Espírito de Equipe</span>
                                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                                    {hadHelp && (
                                                                        <span 
                                                                            className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-800 bg-sky-50 border border-sky-200/90 px-2 py-0.5 rounded-md shadow-2xs"
                                                                            title={`Este aluno teve ajuda nesta aula (${helpCount}x)`}
                                                                        >
                                                                            <HeartHandshake className="w-3 h-3 text-sky-600 shrink-0" />
                                                                            <span>Teve Ajuda</span>
                                                                            <span className="bg-sky-200/80 text-sky-950 font-black px-1 rounded text-[10px] leading-tight">
                                                                                {helpCount}
                                                                            </span>
                                                                        </span>
                                                                    )}

                                                                    {helpedCount > 0 && (
                                                                        <span 
                                                                            className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-900 bg-blue-50 border border-blue-200/90 px-2 py-0.5 rounded-md shadow-2xs"
                                                                            title={`Este aluno ajudou colegas (${helpedCount}x)`}
                                                                        >
                                                                            <Award className="w-3 h-3 text-blue-600 shrink-0" />
                                                                            <span>Ajudou</span>
                                                                            <span className="bg-blue-200/80 text-blue-950 font-black px-1 rounded text-[10px] leading-tight">
                                                                                {helpedCount}
                                                                            </span>
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>

                                                    {/* Botões de Ação do Aluno (Chamar Aluno + Simbolo Colocar/Tirar da Roleta) */}
                                                    <div className="flex items-center gap-1.5 ml-auto shrink-0">
                                                        <button
                                                            type="button"
                                                            onClick={() => onSelectStudentManually(student.id)}
                                                            disabled={spinning}
                                                            className="text-xs font-extrabold text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100/80 border border-indigo-200/90 px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer disabled:opacity-50 active:scale-95"
                                                            title="Escolher este aluno para responder agora"
                                                        >
                                                            <Target className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                                                            <span>Chamar Aluno</span>
                                                        </button>

                                                        {student.status === 'active' ? (
                                                            <button
                                                                type="button"
                                                                onClick={() => onToggleStudentActivityStatus(student.id, 'remove')}
                                                                className="text-xs font-bold text-slate-500 hover:text-amber-900 bg-white hover:bg-amber-50 border border-slate-200 hover:border-amber-200 p-1.5 rounded-xl transition-all cursor-pointer shadow-2xs active:scale-95"
                                                                title="Tirar da roleta"
                                                            >
                                                                <UserMinus className="w-4 h-4 text-slate-500 hover:text-amber-800" />
                                                            </button>
                                                        ) : (
                                                            <button 
                                                                type="button"
                                                                onClick={() => onReactivate(student.id)}
                                                                className="text-xs font-bold text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200 p-1.5 rounded-xl transition-all cursor-pointer shadow-2xs active:scale-95"
                                                                title="Colocar na roleta"
                                                            >
                                                                <RotateCcw className="w-4 h-4 text-blue-600" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* 3. RODAPÉ: Informações e Atalho de Fechar */}
                <div className="p-3.5 px-5 border-t border-slate-100 bg-slate-50/90 flex items-center justify-between text-xs text-slate-500 shrink-0">
                    <span className="flex items-center gap-1.5 font-medium">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        Permanece aberto até você clicar em Fechar
                    </span>
                    <button
                        type="button"
                        onClick={onClose}
                        className="font-black text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
                    >
                        Fechar Painel
                    </button>
                </div>
            </aside>
        </>,
        document.body
    );
};
