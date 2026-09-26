import React, { useState, useMemo } from 'react';
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
    ChevronLeft, 
    ChevronRight,
    Filter,
    Sparkles,
    BarChart3
} from 'lucide-react';

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

    return (
        <>
            {/* Sidebar Drawer ancorada à direita (abre da direita para a esquerda) */}
            <aside
                aria-label="Painel Lateral de Alunos e Placar"
                className={`fixed inset-y-0 right-0 z-50 w-full sm:w-[430px] md:w-[460px] max-w-[95vw] bg-white/95 backdrop-blur-xl border-l border-slate-200 shadow-2xl flex flex-col transform transition-transform duration-300 ease-out select-none ${
                    isOpen ? 'translate-x-0' : 'translate-x-full pointer-events-none'
                }`}
            >
                {/* Botão de recolhimento na borda externa esquerda do Drawer */}
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute -left-3.5 top-14 bg-white border border-slate-200/90 shadow-md text-slate-500 hover:text-indigo-600 w-7 h-7 rounded-full hidden sm:flex items-center justify-center cursor-pointer transition-all hover:scale-110 active:scale-95 z-10"
                    title="Recolher painel lateral"
                >
                    <ChevronRight className="w-4 h-4" />
                </button>

                {/* 1. TOPO: Cabeçalho com Título, Indicadores e Botão Fechar Estilizado */}
                <div className="p-4 sm:p-5 border-b border-slate-100 bg-gradient-to-r from-indigo-50/80 via-white to-purple-50/40 shrink-0">
                    <div className="flex items-center justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-sm shrink-0">
                                <Users className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                                <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-1.5 truncate">
                                    <span>Alunos & Placar</span>
                                    <span className="text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200">
                                        Ao Vivo
                                    </span>
                                </h3>
                                <p className="text-2xs font-semibold text-slate-500 truncate">
                                    {currentClass?.name || 'Turma Ativa'} • {activeCount} na roda
                                </p>
                            </div>
                        </div>

                        {/* Botão Fechar de Alto Destaque (Única forma de fechar o sidebar) */}
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-slate-200 hover:border-rose-200 text-xs font-bold transition-all cursor-pointer shadow-2xs group shrink-0"
                            title="Fechar este painel lateral"
                        >
                            <X className="w-4 h-4 group-hover:rotate-90 transition-transform text-slate-500 group-hover:text-rose-600" />
                            <span>Fechar</span>
                        </button>
                    </div>

                    {/* Tabs do Placar: Alunos vs Equipes */}
                    <div className="flex items-center justify-between gap-2 mt-3 pt-2.5 border-t border-slate-100">
                        <div className="flex items-center gap-1 bg-slate-100/90 p-1 rounded-xl w-full sm:w-auto">
                            <button
                                type="button"
                                onClick={() => setPlacarTab('students')}
                                className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                    placarTab === 'students'
                                        ? 'bg-white text-indigo-700 shadow-2xs'
                                        : 'text-slate-500 hover:text-slate-800'
                                }`}
                            >
                                <User className="w-3.5 h-3.5" />
                                <span>Alunos ({combinedItems.length})</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setPlacarTab('groups')}
                                className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                    placarTab === 'groups'
                                        ? 'bg-purple-600 text-white shadow-2xs'
                                        : 'text-slate-500 hover:text-slate-800'
                                }`}
                            >
                                <Trophy className="w-3.5 h-3.5" />
                                <span>Equipes ({currentGroups.length})</span>
                            </button>
                        </div>

                        {placarTab === 'groups' && (
                            <button
                                type="button"
                                onClick={onOpenGroupsModal}
                                className="text-xs font-bold text-purple-600 hover:text-purple-800 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                                title="Gerenciar equipes e seus integrantes"
                            >
                                <Edit3 className="w-3 h-3" /> Gerenciar
                            </button>
                        )}
                        {placarTab === 'students' && (
                            <button
                                type="button"
                                onClick={onOpenClassesModal}
                                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                                title="Cadastrar novos alunos, editar nomes ou remover alunos da turma"
                            >
                                <Edit3 className="w-3 h-3" /> Gerenciar Turma
                            </button>
                        )}
                    </div>

                    {/* Botão de Atalho para o Relatório da Aula & Insights */}
                    {onOpenClassReport && (
                        <button
                            type="button"
                            onClick={onOpenClassReport}
                            className="w-full mt-2.5 py-1.5 px-3 bg-gradient-to-r from-indigo-50 via-purple-50 to-indigo-50 hover:from-indigo-100 hover:to-purple-100 border border-indigo-200 text-indigo-900 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all shadow-2xs cursor-pointer active:scale-95"
                            title="Ver relatório detalhado da aula atual com insights pedagógicos"
                        >
                            <BarChart3 className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Relatório da Aula & Insights</span>
                        </button>
                    )}

                    {/* Campo de Busca Rápida */}
                    <div className="relative mt-3">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder={placarTab === 'students' ? "Buscar aluno ou equipe..." : "Buscar equipe..."}
                            className="w-full pl-8 pr-7 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-slate-800 placeholder-slate-400"
                        />
                        {searchTerm && (
                            <button
                                type="button"
                                onClick={() => setSearchTerm('')}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        )}
                    </div>

                    {/* Chips de Filtro e Ações Rápidas para a Aba de Alunos */}
                    {placarTab === 'students' && (
                        <>
                            <div className="flex items-center gap-1.5 mt-2.5 overflow-x-auto pb-0.5 custom-scrollbar text-2xs font-bold">
                                <button
                                    type="button"
                                    onClick={() => setStatusFilter('all')}
                                    className={`px-2 py-1 rounded-lg border transition-all cursor-pointer shrink-0 ${
                                        statusFilter === 'all'
                                            ? 'bg-slate-800 text-white border-slate-800'
                                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                    }`}
                                >
                                    Todos ({combinedItems.length})
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setStatusFilter('active')}
                                    className={`px-2 py-1 rounded-lg border transition-all cursor-pointer shrink-0 ${
                                        statusFilter === 'active'
                                            ? 'bg-indigo-600 text-white border-indigo-600'
                                            : 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
                                    }`}
                                >
                                    Na Roleta ({activeCount})
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setStatusFilter('removed')}
                                    className={`px-2 py-1 rounded-lg border transition-all cursor-pointer shrink-0 ${
                                        statusFilter === 'removed'
                                            ? 'bg-slate-700 text-white border-slate-700'
                                            : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                                    }`}
                                >
                                    Fora ({removedCount})
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setStatusFilter('help')}
                                    className={`px-2 py-1 rounded-lg border transition-all cursor-pointer shrink-0 flex items-center gap-1 ${
                                        statusFilter === 'help'
                                            ? 'bg-sky-600 text-white border-sky-600'
                                            : 'bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100'
                                    }`}
                                >
                                    <HeartHandshake className="w-3 h-3 text-sky-600" />
                                    <span>Ajuda ({helpTotalCount})</span>
                                </button>
                            </div>

                            {/* Barra de Ações Rápidas: Colocar Todos / Tirar Todos da Roleta */}
                            <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-slate-100 text-2xs">
                                <span className="font-semibold text-slate-500">
                                    <strong className="text-indigo-600 font-bold">{activeCount}</strong> na roleta • <strong className="text-slate-600 font-bold">{removedCount}</strong> fora
                                </span>
                                <div className="flex items-center gap-1.5">
                                    <button
                                        type="button"
                                        onClick={onActivateAll}
                                        disabled={removedCount === 0}
                                        className="font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 disabled:opacity-40 disabled:cursor-not-allowed border border-emerald-200 px-2 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 shadow-2xs active:scale-95"
                                        title="Colocar todos os alunos na roleta (recolocar na roda)"
                                    >
                                        <RotateCcw className="w-3 h-3 text-emerald-600" /> Colocar Todos
                                    </button>
                                    <button
                                        type="button"
                                        onClick={onDeactivateAll}
                                        disabled={activeCount === 0}
                                        className="font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 disabled:opacity-40 disabled:cursor-not-allowed border border-rose-200 px-2 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 shadow-2xs active:scale-95"
                                        title="Tirar todos os alunos da roleta"
                                    >
                                        <UserMinus className="w-3 h-3 text-rose-500" /> Tirar Todos
                                    </button>
                                </div>
                            </div>

                            {/* Aviso de Filtro Ativo para não confundir o usuário */}
                            {statusFilter !== 'all' && (
                                <div className="flex items-center justify-between bg-indigo-50/80 border border-indigo-100 px-2.5 py-1.5 rounded-xl text-2xs text-indigo-900 mt-2 font-medium">
                                    <span>
                                        Exibindo: <strong>{statusFilter === 'active' ? 'Apenas na roleta' : statusFilter === 'removed' ? 'Apenas fora da roleta' : 'Apenas com ajuda'}</strong>
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => setStatusFilter('all')}
                                        className="font-black text-indigo-600 hover:text-indigo-900 underline cursor-pointer"
                                    >
                                        Ver Todos ({combinedItems.length})
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* 2. CORPO: Lista de Alunos ou Equipes */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-5 custom-scrollbar space-y-3 bg-slate-50/50">
                    {placarTab === 'groups' ? (
                        /* Aba de Equipes */
                        filteredGroups.length === 0 ? (
                            <div className="text-center py-12 px-4 bg-white rounded-2xl border border-dashed border-purple-200">
                                <Users className="w-10 h-10 text-purple-300 mx-auto mb-2" />
                                <p className="text-sm font-bold text-purple-900 mb-1">
                                    {searchTerm ? 'Nenhuma equipe encontrada' : 'Nenhuma equipe configurada'}
                                </p>
                                <p className="text-xs text-purple-600 mb-4">
                                    {searchTerm ? 'Tente outra busca.' : 'Crie grupos e selecione alunos para cada equipe.'}
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
                            [...filteredGroups]
                                .sort((a, b) => (b.hits || 0) - (a.hits || 0))
                                .map((group, rankIdx) => {
                                    const memberIdSet = new Set((group.studentIds || []).map(String));
                                    const memberStudents = (currentClass?.students || []).filter(s => memberIdSet.has(String(s.id)));
                                    const medal = rankIdx === 0 ? '🥇' : rankIdx === 1 ? '🥈' : rankIdx === 2 ? '🥉' : `${rankIdx + 1}º`;

                                    return (
                                        <div 
                                            key={group.id} 
                                            className="flex flex-col p-3.5 rounded-2xl border border-slate-200 bg-white transition-all hover:shadow-sm"
                                            style={{ borderLeftColor: group.color || '#6366f1', borderLeftWidth: '5px' }}
                                        >
                                            {/* Topo: Posição, Nome da Equipe e Pontuação */}
                                            <div className="flex items-center justify-between gap-2">
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <span className="text-base font-black shrink-0">{medal}</span>
                                                    <div className="min-w-0">
                                                        <h4 className="font-black text-sm text-slate-900 truncate" title={group.name}>
                                                            {group.name}
                                                        </h4>
                                                        <span className="text-2xs text-slate-400 font-semibold">
                                                            {memberStudents.length} {memberStudents.length === 1 ? 'aluno' : 'alunos'}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-1.5 shrink-0">
                                                    {/* Botões de Pontuação Rápida (+1 e -1) */}
                                                    <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg p-0.5 shadow-2xs">
                                                        <button
                                                            type="button"
                                                            onClick={() => onAdjustGroupPoints(group.id, 1, 'merit')}
                                                            className="px-1.5 py-0.5 text-emerald-700 hover:bg-emerald-100 rounded flex items-center gap-0.5 text-xs font-black transition-colors cursor-pointer"
                                                            title="Aumentar 1 ponto para a equipe e membros (+1)"
                                                        >
                                                            <Plus className="w-3 h-3 text-emerald-600" />
                                                            <span>1</span>
                                                        </button>
                                                        <div className="w-[1px] h-3.5 bg-slate-200 mx-0.5" />
                                                        <button
                                                            type="button"
                                                            onClick={() => onAdjustGroupPoints(group.id, -1, 'rule_violation')}
                                                            className="px-1.5 py-0.5 text-rose-700 hover:bg-rose-100 rounded flex items-center gap-0.5 text-xs font-black transition-colors cursor-pointer"
                                                            title="Diminuir 1 ponto da equipe (-1)"
                                                        >
                                                            <Minus className="w-3 h-3 text-rose-600" />
                                                            <span>1</span>
                                                        </button>
                                                    </div>

                                                    {/* Total de Pontos / Acertos */}
                                                    <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-50 border border-purple-200 text-purple-900 font-black text-xs shadow-2xs">
                                                        <Trophy className="w-3.5 h-3.5 text-purple-600" />
                                                        <span>{group.hits || 0} pts</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Membros da Equipe em formato de chips */}
                                            <div className="flex flex-wrap gap-1 mt-2.5 pt-2 border-t border-slate-100">
                                                {memberStudents.length === 0 ? (
                                                    <span className="text-2xs text-slate-400 italic">Nenhum aluno vinculado</span>
                                                ) : (
                                                    memberStudents.map(s => (
                                                        <span 
                                                            key={s.id} 
                                                            className="text-2xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200"
                                                        >
                                                            {s.name}
                                                        </span>
                                                    ))
                                                )}
                                            </div>

                                            {/* Ação: Chamar Equipe */}
                                            <div className="mt-2.5 pt-2 border-t border-slate-100 flex justify-end">
                                                <button
                                                    type="button"
                                                    onClick={() => onSelectGroupManually(group.id)}
                                                    disabled={spinning}
                                                    className="text-xs font-bold text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
                                                    title="Escolher esta equipe para responder agora"
                                                >
                                                    <Target className="w-3.5 h-3.5 text-purple-600" />
                                                    <span>Chamar Equipe</span>
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })
                        )
                    ) : (
                        /* Aba de Alunos */
                        <>
                            {/* Legenda de Ajuda */}
                            <div className="flex items-center justify-between gap-2 px-1 text-2xs font-bold text-slate-500">
                                <div className="flex items-center gap-2">
                                    <span className="bg-sky-50 text-sky-800 border border-sky-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                                        <HeartHandshake className="w-3 h-3 text-sky-600" /> Teve Ajuda
                                    </span>
                                    <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                                        <Award className="w-3 h-3 text-emerald-600" /> Ajudou
                                    </span>
                                </div>
                                <span className="text-slate-400">
                                    {filteredStudents.length} {filteredStudents.length === 1 ? 'aluno' : 'alunos'}
                                </span>
                            </div>

                            {filteredStudents.length === 0 ? (
                                <div className="text-center py-12 px-4 bg-white rounded-2xl border border-dashed border-slate-200">
                                    <User className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                                    <p className="text-sm font-bold text-slate-700 mb-1">Nenhum aluno encontrado</p>
                                    <p className="text-xs text-slate-400">Tente alterar os filtros ou o termo de busca.</p>
                                </div>
                            ) : (
                                filteredStudents.map(student => {
                                    const studentGroup = studentToGroupMap?.get(student.id) || studentToGroupMap?.get(String(student.id));
                                    const studentHelps = (student.history || []).filter(h => 
                                        h.result === 'help_correct' || h.hadHelp || h.helperName || (h.question && (h.question.includes('(com ajuda') || h.question.includes('[Ajuda:')))
                                    );
                                    const hadHelp = studentHelps.length > 0 || !!student.hadHelp || (student.helpCount && student.helpCount > 0);
                                    const helpCount = Math.max(studentHelps.length, student.helpCount || 0);

                                    const studentHelpedOthers = (student.history || []).filter(h => h.helpedStudent || h.isHelperRole);
                                    const helpedCount = Math.max(studentHelpedOthers.length, student.helpedCount || 0);

                                    return (
                                        <div 
                                            key={student.id} 
                                            className={`flex flex-col p-3 rounded-2xl border transition-all ${
                                                student.status === 'active' 
                                                    ? 'bg-white border-slate-200/90 shadow-2xs hover:border-indigo-300' 
                                                    : 'bg-slate-100/80 border-slate-200 opacity-75'
                                            }`}
                                        >
                                            {/* Linha Principal: Nome do Aluno e Controles de Pontuação */}
                                            <div className="flex items-center justify-between gap-1.5">
                                                <div className="min-w-0 flex items-center gap-1.5 flex-1">
                                                    {/* Avatar com inicial */}
                                                    <div 
                                                        className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black shrink-0 border"
                                                        style={{
                                                            backgroundColor: student.groupColor ? `${student.groupColor}20` : '#e0e7ff',
                                                            color: student.groupColor || '#4338ca',
                                                            borderColor: student.groupColor ? `${student.groupColor}40` : '#c7d2fe'
                                                        }}
                                                    >
                                                        {student.name.charAt(0).toUpperCase()}
                                                    </div>

                                                    {/* Nome + badge de grupo em coluna para não comprimir o nome */}
                                                    <div className="min-w-0 flex flex-col gap-0.5 flex-1 py-0.5">
                                                        <span 
                                                            className={`font-bold text-sm break-words leading-tight ${student.status === 'active' ? 'text-slate-900' : 'text-slate-500 line-through'}`} 
                                                            title={student.name}
                                                        >
                                                            {student.name}
                                                        </span>

                                                        {student.groupName && (
                                                            <span
                                                                style={{
                                                                    backgroundColor: `${student.groupColor || '#6366f1'}18`,
                                                                    color: student.groupColor || '#6366f1',
                                                                    borderColor: `${student.groupColor || '#6366f1'}40`
                                                                }}
                                                                className="text-[10px] font-extrabold px-1.5 py-0.5 rounded border self-start max-w-full truncate leading-tight"
                                                                title={`Equipe: ${student.groupName}`}
                                                            >
                                                                {student.groupName}
                                                            </span>
                                                        )}
                                                    </div>

                                                    {student.status === 'active' ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => onToggleStudentActivityStatus(student.id, 'remove')}
                                                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-rose-100 hover:text-rose-700 hover:border-rose-300 transition-all cursor-pointer group/toggle shrink-0 shadow-2xs"
                                                            title="Aluno ativo na roleta. Clique para tirar da roleta."
                                                        >
                                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 group-hover/toggle:bg-rose-500 animate-pulse" />
                                                            <span className="group-hover/toggle:hidden">Na Roleta</span>
                                                            <span className="hidden group-hover/toggle:inline">Tirar</span>
                                                        </button>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            onClick={() => onReactivate(student.id)}
                                                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-extrabold bg-slate-200 text-slate-700 border border-slate-300 hover:bg-emerald-100 hover:text-emerald-800 hover:border-emerald-300 transition-all cursor-pointer group/toggle shrink-0 shadow-2xs"
                                                            title={`Aluno ${student.status === 'absent' ? 'marcado como ausente' : 'fora da roleta'}. Clique para colocar de volta na roleta.`}
                                                        >
                                                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 group-hover/toggle:bg-emerald-500" />
                                                            <span className="group-hover/toggle:hidden">{student.status === 'absent' ? 'Ausente' : 'Fora da Roleta'}</span>
                                                            <span className="hidden group-hover/toggle:inline">Colocar</span>
                                                        </button>
                                                    )}
                                                </div>
                                                
                                                <div className="flex items-center gap-1 shrink-0">
                                                    {/* Botões de Pontuação Rápida: +1 Mérito e -1 Regra */}
                                                    <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg p-0.5 shadow-2xs">
                                                        <button
                                                            type="button"
                                                            onClick={() => onAdjustPoints(student.id, 1, 'merit')}
                                                            className="px-1.5 py-0.5 text-emerald-700 hover:bg-emerald-100 rounded flex items-center gap-0.5 text-xs font-black transition-colors cursor-pointer"
                                                            title="Aumentar 1 ponto por mérito (+1)"
                                                        >
                                                            <Plus className="w-3 h-3 text-emerald-600" />
                                                            <span>1</span>
                                                        </button>
                                                        <div className="w-[1px] h-3.5 bg-slate-200 mx-0.5" />
                                                        <button
                                                            type="button"
                                                            onClick={() => onAdjustPoints(student.id, -1, 'rule_violation')}
                                                            className="px-1.5 py-0.5 text-rose-700 hover:bg-rose-100 rounded flex items-center gap-0.5 text-xs font-black transition-colors cursor-pointer"
                                                            title="Diminuir 1 ponto por regra (-1)"
                                                        >
                                                            <Minus className="w-3 h-3 text-rose-600" />
                                                            <span>1</span>
                                                        </button>
                                                    </div>

                                                    {/* Contador de Pontos Totais e Erros (abre modal de histórico) */}
                                                    <button 
                                                        onClick={() => onOpenHistory(student)}
                                                        className="flex items-center gap-1.5 text-xs font-bold bg-white border border-slate-200 px-2 py-1 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
                                                        title="Ver Relatório Detalhado de Respostas do Aluno"
                                                    >
                                                        <span className="text-emerald-600 flex items-center gap-0.5 font-black" title="Total de Pontos (Individuais + Equipe)">
                                                            <CheckCircle className="w-3.5 h-3.5" /> {student.hits || 0}
                                                        </span>
                                                        {studentGroup && (studentGroup.hits > 0 || (student.history || []).some(h => h.isGroupActivity)) && (
                                                            <span 
                                                                className="text-[10px] font-black px-1.5 py-0.2 rounded-full border flex items-center gap-0.5"
                                                                style={{
                                                                    backgroundColor: `${student.groupColor || '#6366f1'}15`,
                                                                    color: student.groupColor || '#6366f1',
                                                                    borderColor: `${student.groupColor || '#6366f1'}35`
                                                                }}
                                                                title={`Pontuação inclui ${studentGroup.hits || 0} pts da equipe ${studentGroup.name}`}
                                                            >
                                                                <Trophy className="w-2.5 h-2.5" />
                                                                <span>+{studentGroup.hits || 0} eq.</span>
                                                            </span>
                                                        )}
                                                        <span className="text-red-500 flex items-center gap-0.5 font-semibold" title="Erros">
                                                            <XCircle className="w-3.5 h-3.5" /> {student.misses || 0}
                                                        </span>
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Linha de Tags: Teve Ajuda e Ajudou */}
                                            {(hadHelp || helpedCount > 0) && (
                                                <div className="flex items-center gap-1.5 mt-2 pt-1.5 border-t border-slate-100 flex-wrap">
                                                    {hadHelp && (
                                                        <span 
                                                            className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-800 bg-sky-50 border border-sky-200 px-1.5 py-0.5 rounded-md shadow-2xs"
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
                                                            className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-md shadow-2xs"
                                                            title={`Este aluno ajudou colegas (${helpedCount}x)`}
                                                        >
                                                            <Award className="w-3 h-3 text-emerald-600 shrink-0" />
                                                            <span>Ajudou</span>
                                                            <span className="bg-emerald-200/80 text-emerald-950 font-black px-1 rounded text-[10px] leading-tight">
                                                                {helpedCount}
                                                            </span>
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                            
                                            {/* Linha de Ações: Chamar p/ Responder e Tirar/Colocar na Roleta */}
                                            <div className="flex items-center justify-between gap-1.5 mt-2.5 pt-2 border-t border-slate-100">
                                                <button
                                                    type="button"
                                                    onClick={() => onSelectStudentManually(student.id)}
                                                    disabled={spinning}
                                                    className="text-xs font-bold text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer disabled:opacity-50 active:scale-95"
                                                    title="Escolher este aluno manualmente para responder agora"
                                                >
                                                    <Target className="w-3.5 h-3.5 text-indigo-600" />
                                                    <span>Chamar Aluno</span>
                                                </button>

                                                {student.status === 'active' ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => onToggleStudentActivityStatus(student.id, 'remove')}
                                                        className="text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer hover:shadow-xs active:scale-95"
                                                        title="Remover este aluno da roleta para esta atividade (não será sorteado)"
                                                    >
                                                        <UserMinus className="w-3.5 h-3.5 text-rose-600" />
                                                        <span>Tirar da Roleta</span>
                                                    </button>
                                                ) : (
                                                    <button 
                                                        type="button"
                                                        onClick={() => onReactivate(student.id)}
                                                        className="text-xs font-black text-emerald-800 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer hover:shadow-xs active:scale-95"
                                                        title="Colocar este aluno de volta na roleta para esta atividade"
                                                    >
                                                        <RotateCcw className="w-3.5 h-3.5 text-emerald-700" />
                                                        <span>Colocar na Roleta</span>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </>
                    )}
                </div>

                {/* 3. RODAPÉ: Informações e Atalho de Fechar */}
                <div className="p-3 px-4 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between text-2xs text-slate-500 shrink-0">
                    <span className="flex items-center gap-1 font-medium">
                        <Sparkles className="w-3 h-3 text-amber-500" />
                        Permanece aberto até você clicar em Fechar
                    </span>
                    <button
                        type="button"
                        onClick={onClose}
                        className="font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                    >
                        Fechar Painel
                    </button>
                </div>
            </aside>
        </>
    );
};
