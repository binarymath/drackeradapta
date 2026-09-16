import React, { useState, useEffect, useMemo } from 'react';
import { 
    Users, Plus, Trash2, Edit2, Check, X, Shuffle, RotateCcw, 
    Sparkles, UserCheck, UserX, ChevronRight, Award, Search, UserMinus, UserPlus
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { gameAudio } from '../../utils/gameAudio';

const PRESET_COLORS = [
    { id: 'indigo', name: 'Índigo', hex: '#6366f1', bg: 'bg-indigo-500', text: 'text-indigo-600', light: 'bg-indigo-50', border: 'border-indigo-200' },
    { id: 'emerald', name: 'Esmeralda', hex: '#10b981', bg: 'bg-emerald-500', text: 'text-emerald-600', light: 'bg-emerald-50', border: 'border-emerald-200' },
    { id: 'amber', name: 'Âmbar', hex: '#f59e0b', bg: 'bg-amber-500', text: 'text-amber-600', light: 'bg-amber-50', border: 'border-amber-200' },
    { id: 'rose', name: 'Rosa/Rubi', hex: '#f43f5e', bg: 'bg-rose-500', text: 'text-rose-600', light: 'bg-rose-50', border: 'border-rose-200' },
    { id: 'cyan', name: 'Ciano', hex: '#06b6d4', bg: 'bg-cyan-500', text: 'text-cyan-600', light: 'bg-cyan-50', border: 'border-cyan-200' },
    { id: 'purple', name: 'Roxo', hex: '#9333ea', bg: 'bg-purple-500', text: 'text-purple-600', light: 'bg-purple-50', border: 'border-purple-200' },
    { id: 'orange', name: 'Laranja', hex: '#ea580c', bg: 'bg-orange-500', text: 'text-orange-600', light: 'bg-orange-50', border: 'border-orange-200' },
    { id: 'blue', name: 'Azul Real', hex: '#2563eb', bg: 'bg-blue-500', text: 'text-blue-600', light: 'bg-blue-50', border: 'border-blue-200' }
];

export const GroupsManagerModal = ({ 
    isOpen, 
    onClose, 
    currentClass, 
    students: propStudents,
    groups: propGroups,
    onSaveGroups 
}) => {
    // Lista de alunos da turma: suporte flexível a múltiplas propriedades
    const students = useMemo(() => {
        const raw = (propStudents && Array.isArray(propStudents) && propStudents.length > 0)
            ? propStudents
            : (currentClass?.students && Array.isArray(currentClass.students) && currentClass.students.length > 0)
                ? currentClass.students
                : [];

        return raw.map((s, idx) => ({
            id: (s.id !== undefined && s.id !== null) ? s.id : `std_${idx}_${Date.now()}`,
            name: s.name || `Aluno ${idx + 1}`,
            status: s.status || 'active'
        }));
    }, [propStudents, currentClass?.students]);
    
    // Estado local de grupos
    const [groups, setGroups] = useState(() => {
        const initial = (Array.isArray(propGroups) && propGroups.length > 0)
            ? propGroups
            : (currentClass?.groups && Array.isArray(currentClass.groups) && currentClass.groups.length > 0)
                ? currentClass.groups
                : [];

        if (initial.length === 0) {
            // Cria Grupo 1 por padrão para que o professor veja os alunos e possa selecioná-los imediatamente
            return [{
                id: 'grp_' + Date.now(),
                name: 'Grupo 1',
                color: PRESET_COLORS[0].hex,
                studentIds: [],
                hits: 0,
                misses: 0,
                history: []
            }];
        }
        return JSON.parse(JSON.stringify(initial));
    });

    // Grupo atualmente selecionado para gerenciar alunos
    const [selectedGroupId, setSelectedGroupId] = useState(() => {
        const initial = (Array.isArray(propGroups) && propGroups.length > 0)
            ? propGroups
            : (currentClass?.groups && Array.isArray(currentClass.groups))
                ? currentClass.groups
                : [];
        return initial.length > 0 ? initial[0].id : null;
    });

    const [editingGroupId, setEditingGroupId] = useState(null);
    const [editName, setEditName] = useState('');
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);
    const [showAutoConfirm, setShowAutoConfirm] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterTab, setFilterTab] = useState('all'); // 'all' | 'in_group' | 'unassigned'

    // Sincroniza sempre que abrir o modal
    useEffect(() => {
        if (isOpen) {
            const initial = (Array.isArray(propGroups) && propGroups.length > 0)
                ? propGroups
                : (currentClass?.groups && Array.isArray(currentClass.groups) && currentClass.groups.length > 0)
                    ? currentClass.groups
                    : [];

            if (initial.length > 0) {
                setGroups(JSON.parse(JSON.stringify(initial)));
                setSelectedGroupId(prev => {
                    if (prev && initial.some(g => g.id === prev)) return prev;
                    return initial[0].id;
                });
            } else {
                // Se não há grupos, inicializa automaticamente com Grupo 1 para visualização imediata dos alunos
                const defaultGroup = {
                    id: 'grp_' + Date.now(),
                    name: 'Grupo 1',
                    color: PRESET_COLORS[0].hex,
                    studentIds: [],
                    hits: 0,
                    misses: 0,
                    history: []
                };
                setGroups([defaultGroup]);
                setSelectedGroupId(defaultGroup.id);
            }
            setSearchTerm('');
            setFilterTab('all');
        }
    }, [isOpen, propGroups, currentClass]);

    // Mapeamento de cada aluno para seu respectivo grupo
    const studentGroupMap = useMemo(() => {
        const map = new Map();
        groups.forEach(g => {
            (g.studentIds || []).forEach(sId => {
                map.set(sId, g.id);
                map.set(String(sId), g.id);
            });
        });
        return map;
    }, [groups]);

    const unassignedStudents = useMemo(() => {
        return students.filter(s => !studentGroupMap.has(s.id) && !studentGroupMap.has(String(s.id)));
    }, [students, studentGroupMap]);

    // Grupo ativo selecionado (ou fallback para o primeiro grupo)
    const activeSelectedGroup = useMemo(() => {
        return groups.find(g => g.id === selectedGroupId) || groups[0] || null;
    }, [groups, selectedGroupId]);

    // Criar um novo grupo
    const handleAddGroup = () => {
        const nextIdx = groups.length + 1;
        const colorObj = PRESET_COLORS[(nextIdx - 1) % PRESET_COLORS.length];
        const newGroup = {
            id: 'grp_' + Date.now() + Math.random().toString(36).substr(2, 4),
            name: `Grupo ${nextIdx}`,
            color: colorObj.hex,
            studentIds: [],
            hits: 0,
            misses: 0,
            history: []
        };
        const nextGroups = [...groups, newGroup];
        setGroups(nextGroups);
        setSelectedGroupId(newGroup.id);
        gameAudio.playTick();
    };

    // Salvar renomeação de grupo
    const handleSaveGroupName = (groupId) => {
        if (!editName.trim()) return;
        setGroups(prev => prev.map(g => g.id === groupId ? { ...g, name: editName.trim() } : g));
        setEditingGroupId(null);
        setEditName('');
        gameAudio.playTick();
    };

    // Alterar cor do grupo
    const handleChangeGroupColor = (groupId, hex) => {
        setGroups(prev => prev.map(g => g.id === groupId ? { ...g, color: hex } : g));
        gameAudio.playTick();
    };

    // Excluir grupo
    const handleDeleteGroup = (groupId) => {
        const nextGroups = groups.filter(g => g.id !== groupId);
        setGroups(nextGroups);
        setConfirmDeleteId(null);
        if (selectedGroupId === groupId) {
            setSelectedGroupId(nextGroups[0]?.id || null);
        }
        gameAudio.playTick();
    };

    // Alternar aluno dentro do grupo selecionado (adicionar/remover)
    const handleToggleStudentInGroup = (studentId, targetGroupId) => {
        if (!targetGroupId) return;

        setGroups(prev => prev.map(g => {
            const currentIds = g.studentIds || [];
            const existsInThis = currentIds.some(id => String(id) === String(studentId));
            if (g.id === targetGroupId) {
                if (existsInThis) {
                    // Remove do grupo
                    return { ...g, studentIds: currentIds.filter(id => String(id) !== String(studentId)) };
                } else {
                    // Adiciona ao grupo
                    return { ...g, studentIds: [...currentIds, studentId] };
                }
            } else {
                // Se estava em outro grupo, remove de lá para evitar duplicidade
                if (existsInThis) {
                    return { ...g, studentIds: currentIds.filter(id => String(id) !== String(studentId)) };
                }
            }
            return g;
        }));
        gameAudio.playTick();
    };

    // Ação Rápida: Adicionar todos os alunos sem grupo a este grupo
    const handleAddAllUnassignedToGroup = (targetGroupId) => {
        if (!targetGroupId || unassignedStudents.length === 0) return;
        const unassignedIds = unassignedStudents.map(s => s.id);
        setGroups(prev => prev.map(g => {
            if (g.id === targetGroupId) {
                return { ...g, studentIds: [...(g.studentIds || []), ...unassignedIds] };
            }
            return g;
        }));
        gameAudio.playSuccess();
    };

    // Ação Rápida: Limpar todos os integrantes deste grupo
    const handleClearGroupStudents = (targetGroupId) => {
        if (!targetGroupId) return;
        setGroups(prev => prev.map(g => {
            if (g.id === targetGroupId) {
                return { ...g, studentIds: [] };
            }
            return g;
        }));
        gameAudio.playTick();
    };

    // Distribuição Automática Equilibrada
    const handleAutoDistribute = (numGroups) => {
        const count = Math.max(2, Math.min(numGroups, students.length || 2));
        const presentStudents = students.filter(s => s.status !== 'absent');
        
        // Embaralhar alunos aleatoriamente
        const shuffled = [...presentStudents].sort(() => Math.random() - 0.5);

        // Criar grupos
        const newGroupsList = [];
        for (let i = 0; i < count; i++) {
            const colorObj = PRESET_COLORS[i % PRESET_COLORS.length];
            const existingName = groups[i]?.name || `Grupo ${i + 1}`;
            newGroupsList.push({
                id: groups[i]?.id || 'grp_' + Date.now() + '_' + i,
                name: existingName,
                color: groups[i]?.color || colorObj.hex,
                studentIds: [],
                hits: groups[i]?.hits || 0,
                misses: groups[i]?.misses || 0,
                history: groups[i]?.history || []
            });
        }

        // Distribuir alternadamente
        shuffled.forEach((student, idx) => {
            const groupIndex = idx % count;
            newGroupsList[groupIndex].studentIds.push(student.id);
        });

        setGroups(newGroupsList);
        setSelectedGroupId(newGroupsList[0]?.id || null);
        setShowAutoConfirm(false);
        gameAudio.playSuccess();
    };

    // Zerar pontos de todos os grupos
    const handleResetAllScores = () => {
        setGroups(prev => prev.map(g => ({
            ...g,
            hits: 0,
            misses: 0,
            history: []
        })));
        gameAudio.playTick();
    };

    // Salvar e fechar
    const handleSaveAndClose = () => {
        if (onSaveGroups) {
            onSaveGroups(groups);
        }
        gameAudio.playSuccess();
        onClose();
    };

    // Lista de alunos filtrados por busca e por aba
    const filteredStudents = useMemo(() => {
        return students.filter(student => {
            // Filtro por texto
            if (searchTerm.trim()) {
                const term = searchTerm.toLowerCase();
                if (!student.name.toLowerCase().includes(term)) return false;
            }

            // Filtro por aba
            const currentGroupId = studentGroupMap.get(student.id) || studentGroupMap.get(String(student.id));
            const isInActiveGroup = activeSelectedGroup && currentGroupId === activeSelectedGroup.id;

            if (filterTab === 'in_group') {
                return isInActiveGroup;
            }
            if (filterTab === 'unassigned') {
                return !currentGroupId;
            }

            return true;
        });
    }, [students, searchTerm, filterTab, studentGroupMap, activeSelectedGroup]);

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            title="Grupos e Equipes da Turma" 
            maxWidth="max-w-4xl"
        >
            <div className="space-y-4">
                {/* Banner Explicativo & Ações Rápidas */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-2xl border border-indigo-100 shadow-2xs">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-xs">
                            <Users className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800 text-sm sm:text-base flex items-center gap-2">
                                <span>Divisão de Alunos em Equipes</span>
                                <span className="text-xs font-black bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full border border-indigo-200">
                                    {students.length} alunos na turma
                                </span>
                            </h3>
                            <p className="text-xs text-slate-500">
                                Escolha os alunos de cada equipe. As pontuações obtidas na Roleta serão contabilizadas para o grupo e todos os seus membros.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                        <button
                            type="button"
                            onClick={() => setShowAutoConfirm(true)}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-indigo-700 bg-white hover:bg-indigo-100 border border-indigo-200 transition-all shadow-2xs cursor-pointer"
                            title="Distribuir alunos aleatoriamente entre os grupos"
                        >
                            <Shuffle className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Auto-Distribuir</span>
                        </button>

                        <button
                            type="button"
                            onClick={handleAddGroup}
                            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-xs cursor-pointer"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Novo Grupo</span>
                        </button>
                    </div>
                </div>

                {/* Caixa de Confirmação da Auto-Distribuição */}
                {showAutoConfirm && (
                    <div className="p-4 bg-amber-50 border-2 border-amber-200 rounded-2xl text-amber-950 text-xs space-y-3 animate-in fade-in slide-in-from-top-1">
                        <div className="flex items-center justify-between">
                            <span className="font-black text-sm flex items-center gap-1.5">
                                <Sparkles className="w-4 h-4 text-amber-600" />
                                Em quantos grupos você deseja dividir a turma ({students.length} alunos)?
                            </span>
                            <button 
                                type="button" 
                                onClick={() => setShowAutoConfirm(false)}
                                className="text-amber-800 hover:text-amber-950 font-bold p-1 cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            {[2, 3, 4, 5, 6].map(num => (
                                <button
                                    key={num}
                                    type="button"
                                    onClick={() => handleAutoDistribute(num)}
                                    className="px-3.5 py-2 rounded-xl font-black bg-amber-500 hover:bg-amber-600 text-white shadow-2xs transition-all cursor-pointer"
                                >
                                    {num} Grupos (~{Math.ceil(students.length / num)} alunos cada)
                                </button>
                            ))}
                            <button
                                type="button"
                                onClick={() => setShowAutoConfirm(false)}
                                className="px-3 py-2 rounded-xl font-bold bg-white text-slate-600 border border-slate-200 hover:bg-slate-100 transition-colors cursor-pointer"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                )}

                {/* Estrutura Principal: Coluna da Esquerda (Lista de Grupos) + Coluna da Direita (Alunos da Turma) */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 min-h-[420px]">
                    
                    {/* Lista de Grupos (md:col-span-5) */}
                    <div className="md:col-span-5 flex flex-col gap-2.5 border-r border-slate-100 pr-0 md:pr-3">
                        <div className="flex items-center justify-between px-1">
                            <span className="text-xs font-black text-slate-500 uppercase tracking-wider">
                                Equipes Criadas ({groups.length})
                            </span>
                            {groups.some(g => g.hits > 0 || g.misses > 0) && (
                                <button
                                    type="button"
                                    onClick={handleResetAllScores}
                                    className="text-2xs font-bold text-slate-400 hover:text-rose-600 flex items-center gap-1 transition-colors cursor-pointer"
                                    title="Zerar placar de todos os grupos para começar nova rodada"
                                >
                                    <RotateCcw className="w-3 h-3" />
                                    <span>Zerar Placar</span>
                                </button>
                            )}
                        </div>

                        <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1 custom-scrollbar">
                            {groups.map((group) => {
                                const isSelected = activeSelectedGroup?.id === group.id;
                                const memberCount = (group.studentIds || []).length;
                                const isEditing = editingGroupId === group.id;

                                return (
                                    <div
                                        key={group.id}
                                        onClick={() => !isEditing && setSelectedGroupId(group.id)}
                                        className={`p-3 rounded-2xl border transition-all cursor-pointer relative ${
                                            isSelected 
                                                ? 'bg-white border-2 shadow-md ring-2 ring-indigo-500/10' 
                                                : 'bg-slate-50/80 hover:bg-white border-slate-200'
                                        }`}
                                        style={{
                                            borderColor: isSelected ? group.color : undefined
                                        }}
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            {isEditing ? (
                                                <div className="flex items-center gap-1.5 flex-1" onClick={e => e.stopPropagation()}>
                                                    <input
                                                        type="text"
                                                        value={editName}
                                                        onChange={e => setEditName(e.target.value)}
                                                        className="flex-1 px-2 py-1 text-xs font-bold border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                                        autoFocus
                                                        onKeyDown={e => e.key === 'Enter' && handleSaveGroupName(group.id)}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => handleSaveGroupName(group.id)}
                                                        className="p-1 bg-emerald-500 text-white rounded-md hover:bg-emerald-600 cursor-pointer"
                                                    >
                                                        <Check className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setEditingGroupId(null)}
                                                        className="p-1 bg-slate-200 text-slate-600 rounded-md hover:bg-slate-300 cursor-pointer"
                                                    >
                                                        <X className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                                    <span 
                                                        className="w-4 h-4 rounded-full shrink-0 shadow-2xs border border-white ring-1 ring-slate-200"
                                                        style={{ backgroundColor: group.color }}
                                                    />
                                                    <div className="min-w-0 flex-1">
                                                        <div className="font-bold text-sm text-slate-800 truncate flex items-center gap-1.5">
                                                            <span>{group.name}</span>
                                                            {group.hits > 0 && (
                                                                <span className="text-2xs font-black text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                                                                    {group.hits} pts
                                                                </span>
                                                            )}
                                                        </div>
                                                        <span className="text-2xs text-slate-500 font-semibold flex items-center gap-1">
                                                            <span>{memberCount} {memberCount === 1 ? 'aluno selecionado' : 'alunos selecionados'}</span>
                                                        </span>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Botões de Ação do Grupo */}
                                            {!isEditing && (
                                                <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setEditingGroupId(group.id);
                                                            setEditName(group.name);
                                                        }}
                                                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                                                        title="Renomear Grupo"
                                                    >
                                                        <Edit2 className="w-3.5 h-3.5" />
                                                    </button>

                                                    {confirmDeleteId === group.id ? (
                                                        <div className="flex items-center gap-1 bg-rose-50 p-0.5 rounded-lg border border-rose-200">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleDeleteGroup(group.id)}
                                                                className="p-1 bg-rose-500 text-white rounded hover:bg-rose-600 cursor-pointer"
                                                                title="Confirmar exclusão"
                                                            >
                                                                <Check className="w-3 h-3" />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => setConfirmDeleteId(null)}
                                                                className="p-1 bg-slate-200 text-slate-600 rounded hover:bg-slate-300 cursor-pointer"
                                                            >
                                                                <X className="w-3 h-3" />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            onClick={() => setConfirmDeleteId(group.id)}
                                                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                                            title="Excluir Grupo"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* Seletor de cores da equipe */}
                                        {isSelected && !isEditing && (
                                            <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase mr-1">Cor:</span>
                                                {PRESET_COLORS.map(c => (
                                                    <button
                                                        key={c.id}
                                                        type="button"
                                                        onClick={() => handleChangeGroupColor(group.id, c.hex)}
                                                        className={`w-4 h-4 rounded-full transition-transform cursor-pointer ${
                                                            group.color === c.hex ? 'scale-125 ring-2 ring-slate-800 ring-offset-1' : 'hover:scale-110 opacity-80'
                                                        }`}
                                                        style={{ backgroundColor: c.hex }}
                                                        title={c.name}
                                                    />
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Detalhes do Grupo Selecionado e Atribuição de Alunos (md:col-span-7) */}
                    <div className="md:col-span-7 flex flex-col gap-2.5">
                        {activeSelectedGroup && (
                            <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200 flex-1 flex flex-col">
                                {/* Header do Grupo Ativo */}
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 gap-2">
                                    <div className="flex items-center gap-2">
                                        <span 
                                            className="w-4 h-4 rounded-full shadow-2xs border border-white"
                                            style={{ backgroundColor: activeSelectedGroup.color }}
                                        />
                                        <div>
                                            <h4 className="font-black text-slate-800 text-base flex items-center gap-2">
                                                <span>{activeSelectedGroup.name}</span>
                                                <span 
                                                    className="text-xs font-black px-2 py-0.5 rounded-full border"
                                                    style={{ 
                                                        backgroundColor: `${activeSelectedGroup.color}15`,
                                                        color: activeSelectedGroup.color,
                                                        borderColor: `${activeSelectedGroup.color}30`
                                                    }}
                                                >
                                                    {(activeSelectedGroup.studentIds || []).length} selecionados
                                                </span>
                                            </h4>
                                            <p className="text-2xs text-slate-500 font-medium">
                                                Clique nos alunos abaixo para marcar ou desmarcar desta equipe.
                                            </p>
                                        </div>
                                    </div>

                                    {/* Ações Rápidas de Seleção em Lote */}
                                    <div className="flex items-center gap-1.5 self-end sm:self-auto">
                                        {unassignedStudents.length > 0 && (
                                            <button
                                                type="button"
                                                onClick={() => handleAddAllUnassignedToGroup(activeSelectedGroup.id)}
                                                className="text-2xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2 py-1 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                                                title="Adicionar todos os alunos sem equipe a este grupo"
                                            >
                                                <UserPlus className="w-3 h-3 text-indigo-600" />
                                                <span>+ Todos Sem Grupo</span>
                                            </button>
                                        )}

                                        {(activeSelectedGroup.studentIds || []).length > 0 && (
                                            <button
                                                type="button"
                                                onClick={() => handleClearGroupStudents(activeSelectedGroup.id)}
                                                className="text-2xs font-bold text-slate-500 hover:text-rose-600 hover:bg-rose-50 px-2 py-1 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                                                title="Limpar todos os alunos desta equipe"
                                            >
                                                <UserMinus className="w-3 h-3" />
                                                <span>Limpar</span>
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Barra de Busca e Filtros de Alunos */}
                                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                                    <div className="relative flex-1 min-w-[160px]">
                                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                                        <input
                                            type="text"
                                            placeholder="Buscar aluno por nome..."
                                            value={searchTerm}
                                            onChange={e => setSearchTerm(e.target.value)}
                                            className="w-full pl-8 pr-7 py-1.5 text-xs font-medium bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none placeholder:text-slate-400"
                                        />
                                        {searchTerm && (
                                            <button
                                                type="button"
                                                onClick={() => setSearchTerm('')}
                                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
                                            >
                                                ✕
                                            </button>
                                        )}
                                    </div>

                                    {/* Abas de Filtro */}
                                    <div className="flex items-center gap-1 bg-slate-200/60 p-0.5 rounded-xl text-2xs font-bold">
                                        <button
                                            type="button"
                                            onClick={() => setFilterTab('all')}
                                            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                                                filterTab === 'all'
                                                    ? 'bg-white text-slate-900 shadow-2xs font-black'
                                                    : 'text-slate-600 hover:text-slate-900'
                                            }`}
                                        >
                                            Todos ({students.length})
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setFilterTab('in_group')}
                                            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                                                filterTab === 'in_group'
                                                    ? 'bg-white text-indigo-700 shadow-2xs font-black'
                                                    : 'text-slate-600 hover:text-slate-900'
                                            }`}
                                        >
                                            Deste Grupo ({(activeSelectedGroup.studentIds || []).length})
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setFilterTab('unassigned')}
                                            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                                                filterTab === 'unassigned'
                                                    ? 'bg-white text-amber-700 shadow-2xs font-black'
                                                    : 'text-slate-600 hover:text-slate-900'
                                            }`}
                                        >
                                            Sem Grupo ({unassignedStudents.length})
                                        </button>
                                    </div>
                                </div>

                                {/* Lista de Alunos Interativa */}
                                <div className="mt-3 flex-1 overflow-y-auto max-h-[40vh] pr-1 custom-scrollbar space-y-1.5">
                                    {students.length === 0 ? (
                                        <div className="text-center py-10 px-4 text-slate-500 text-xs">
                                            <p className="font-bold text-slate-700 mb-1">Nenhum aluno cadastrado nesta turma</p>
                                            <p className="text-2xs text-slate-400">
                                                Cadastre alunos no menu "Gerenciar Turmas" ou na barra lateral para organizá-los em equipes.
                                            </p>
                                        </div>
                                    ) : filteredStudents.length === 0 ? (
                                        <div className="text-center py-8 text-slate-400 text-xs">
                                            <p>Nenhum aluno encontrado para "{searchTerm}".</p>
                                            <button
                                                type="button"
                                                onClick={() => { setSearchTerm(''); setFilterTab('all'); }}
                                                className="text-indigo-600 font-bold mt-1.5 hover:underline cursor-pointer"
                                            >
                                                Limpar filtros
                                            </button>
                                        </div>
                                    ) : (
                                        filteredStudents.map(student => {
                                            const currentGroupId = studentGroupMap.get(student.id) || studentGroupMap.get(String(student.id));
                                            const isInThisGroup = currentGroupId === activeSelectedGroup.id;
                                            const otherGroup = currentGroupId && !isInThisGroup 
                                                ? groups.find(g => g.id === currentGroupId) 
                                                : null;

                                            return (
                                                <button
                                                    key={student.id}
                                                    type="button"
                                                    onClick={() => handleToggleStudentInGroup(student.id, activeSelectedGroup.id)}
                                                    className={`w-full p-2.5 rounded-xl border flex items-center justify-between text-left transition-all cursor-pointer ${
                                                        isInThisGroup
                                                            ? 'bg-white border-2 shadow-xs ring-1'
                                                            : otherGroup
                                                                ? 'bg-slate-100/70 border-slate-200 text-slate-500 hover:bg-slate-100'
                                                                : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                                                    }`}
                                                    style={{
                                                        borderColor: isInThisGroup ? activeSelectedGroup.color : undefined,
                                                        backgroundColor: isInThisGroup ? `${activeSelectedGroup.color}08` : undefined
                                                    }}
                                                >
                                                    <div className="flex items-center gap-2.5 min-w-0">
                                                        {/* Checkbox visual */}
                                                        <div 
                                                            className={`w-5 h-5 rounded-lg flex items-center justify-center text-xs font-black transition-colors ${
                                                                isInThisGroup 
                                                                    ? 'text-white' 
                                                                    : otherGroup 
                                                                        ? 'bg-slate-200 text-slate-400' 
                                                                        : 'border-2 border-slate-300 text-transparent'
                                                            }`}
                                                            style={{
                                                                backgroundColor: isInThisGroup ? activeSelectedGroup.color : undefined
                                                            }}
                                                        >
                                                            {isInThisGroup && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                                        </div>

                                                        <span className={`text-xs truncate ${isInThisGroup ? 'font-black text-slate-900' : otherGroup ? 'font-medium text-slate-600' : 'font-bold text-slate-700'}`}>
                                                            {student.name}
                                                        </span>
                                                    </div>

                                                    {/* Badge de Status do Aluno */}
                                                    <div className="shrink-0 flex items-center gap-1.5">
                                                        {isInThisGroup ? (
                                                            <span 
                                                                className="text-[11px] font-black px-2 py-0.5 rounded-md border"
                                                                style={{
                                                                    backgroundColor: `${activeSelectedGroup.color}15`,
                                                                    color: activeSelectedGroup.color,
                                                                    borderColor: `${activeSelectedGroup.color}30`
                                                                }}
                                                            >
                                                                ✓ Integrando
                                                            </span>
                                                        ) : otherGroup ? (
                                                            <span className="text-[10px] font-medium text-slate-500 bg-slate-200/80 px-2 py-0.5 rounded-md flex items-center gap-1.5">
                                                                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: otherGroup.color }} />
                                                                <span>No {otherGroup.name}</span>
                                                            </span>
                                                        ) : (
                                                            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md hover:text-indigo-600">
                                                                + Sem grupo
                                                            </span>
                                                        )}
                                                    </div>
                                                </button>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Rodapé informativo: Alunos sem grupo */}
                        {unassignedStudents.length > 0 && (
                            <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-2xs text-amber-900 font-bold">
                                <span>⚠️ {unassignedStudents.length} aluno(s) sem grupo: {unassignedStudents.slice(0, 5).map(s => s.name).join(', ')}{unassignedStudents.length > 5 ? ` e mais ${unassignedStudents.length - 5}...` : ''}</span>
                                {activeSelectedGroup && (
                                    <button
                                        type="button"
                                        onClick={() => handleAddAllUnassignedToGroup(activeSelectedGroup.id)}
                                        className="underline text-indigo-700 hover:text-indigo-900 shrink-0 ml-2 cursor-pointer"
                                    >
                                        Incluir todos em {activeSelectedGroup.name}
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Botões do Rodapé */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                    <span className="text-xs text-slate-500 font-medium">
                        Total: {groups.length} equipes • {students.length - unassignedStudents.length}/{students.length} alunos agrupados
                    </span>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                        >
                            Cancelar
                        </button>
                        <button
                            type="button"
                            onClick={handleSaveAndClose}
                            className="px-5 py-2.5 text-xs font-black text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                        >
                            <Check className="w-4 h-4" />
                            <span>Salvar Grupos</span>
                        </button>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default GroupsManagerModal;
