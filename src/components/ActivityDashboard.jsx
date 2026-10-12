import React, { useState, useMemo } from 'react';
import {
    PlusCircle, Search, FileText, Pencil, Trash2, BrainCircuit, Music, Play,
    LayoutGrid, ChevronDown, ChevronUp, Layers, PieChart, Ruler, Compass,
    Target, Grid, Brain, LifeBuoy, Link, MessageSquare, BarChart, X,
    Gamepad2, Calculator, Headphones, GraduationCap, Sparkles, Folder, Plus
} from 'lucide-react';
import { Card } from './ui/Card';
import { useActivity } from '../contexts/ActivityContext';
import {
    CATEGORIES_CONFIG,
    SUBDIVISIONS_CONFIG,
    getSubdivisionKey,
    getSubdivisionConfig,
    groupTabsHierarchy,
    groupTabsBySubdivisionDirect,
    groupTabsByClass,
    getSubdivisionChips
} from '../utils/activityCategories';

export const ActivityDashboard = ({ tabs = [], onSelect, onCreateNew, onDeleteTab, onEditTab }) => {
    const { classes, officialSession } = useActivity();

    // --- State ---
    const [groupingMode, setGroupingMode] = useState(() => {
        try {
            return localStorage.getItem('dracker_dashboard_grouping') || 'hierarchy';
        } catch {
            return 'hierarchy';
        }
    });

    const [selectedSubdivision, setSelectedSubdivision] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [collapsedSections, setCollapsedSections] = useState(() => new Set());

    // Salvar preferência de agrupamento
    const handleSetGroupingMode = (mode) => {
        setGroupingMode(mode);
        try {
            localStorage.setItem('dracker_dashboard_grouping', mode);
        } catch {}
    };

    // Toggle colapsar/expandir seção
    const toggleSectionCollapse = (sectionId) => {
        setCollapsedSections(prev => {
            const next = new Set(prev);
            if (next.has(sectionId)) {
                next.delete(sectionId);
            } else {
                next.add(sectionId);
            }
            return next;
        });
    };

    // Ícone para cada tipo de subdivisão
    const getSubdivisionIcon = (type, className = "w-6 h-6") => {
        const key = getSubdivisionKey(type);
        switch (key) {
            case 'wordsearch': return <Search className={className} />;
            case 'crossword': return <Pencil className={className} />;
            case 'quiz': return <BrainCircuit className={className} />;
            case 'simplify': return <Music className={className} />;
            case 'video_gallery': return <Play className={className} />;
            case 'fractions': return <PieChart className={className} />;
            case 'number_line': return <Ruler className={className} />;
            case 'rpg': return <Compass className={className} />;
            case 'roulette': return <Target className={className} />;
            case 'domino': return <Grid className={className} />;
            case 'memory': return <Brain className={className} />;
            case 'hangman': return <LifeBuoy className={className} />;
            case 'connect_dots': return <Link className={className} />;
            case 'chat_dracker': return <MessageSquare className={className} />;
            case 'trading_cards': return <Layers className={className} />;
            case 'reports': return <BarChart className={className} />;
            case 'summary': return <FileText className={className} />;
            default: return <FileText className={className} />;
        }
    };

    // Ícone para macro-categoria
    const getCategoryIcon = (catId, className = "w-5 h-5") => {
        switch (catId) {
            case 'games': return <Gamepad2 className={className} />;
            case 'math': return <Calculator className={className} />;
            case 'music': return <Headphones className={className} />;
            case 'eval': return <GraduationCap className={className} />;
            case 'ai': return <Sparkles className={className} />;
            default: return <Folder className={className} />;
        }
    };

    // Cor de destaque para o card
    const getBgColor = (type) => {
        const key = getSubdivisionKey(type);
        const sub = getSubdivisionConfig(key);
        switch (sub.color) {
            case 'amber': return 'bg-amber-50/60 group-hover:bg-amber-100/50 border-amber-200/80';
            case 'blue': return 'bg-blue-50/60 group-hover:bg-blue-100/50 border-blue-200/80';
            case 'rose': return 'bg-rose-50/60 group-hover:bg-rose-100/50 border-rose-200/80';
            case 'indigo': return 'bg-indigo-50/60 group-hover:bg-indigo-100/50 border-indigo-200/80';
            case 'emerald': return 'bg-emerald-50/60 group-hover:bg-emerald-100/50 border-emerald-200/80';
            default: return 'bg-slate-50/70 group-hover:bg-slate-100/60 border-slate-200/80';
        }
    };

    const getIconColorClass = (type) => {
        const key = getSubdivisionKey(type);
        const sub = getSubdivisionConfig(key);
        switch (sub.color) {
            case 'amber': return 'text-amber-600 bg-amber-100/70';
            case 'blue': return 'text-blue-600 bg-blue-100/70';
            case 'rose': return 'text-rose-600 bg-rose-100/70';
            case 'indigo': return 'text-indigo-600 bg-indigo-100/70';
            case 'emerald': return 'text-emerald-600 bg-emerald-100/70';
            default: return 'text-slate-600 bg-slate-100/70';
        }
    };

    // Filtragem geral (excluindo abas de sistema)
    const validTabs = useMemo(() => {
        return (tabs || []).filter(t => !['dashboard', 'about_system', 'home'].includes(t.type));
    }, [tabs]);

    // Filtragem por busca e por subdivisão selecionada
    const filteredTabs = useMemo(() => {
        let result = validTabs;

        if (selectedSubdivision !== 'all') {
            result = result.filter(t => getSubdivisionKey(t.type) === selectedSubdivision);
        }

        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase().trim();
            result = result.filter(t => {
                const title = (t.title || '').toLowerCase();
                const subConfig = getSubdivisionConfig(t.type);
                const subLabel = (subConfig.label || '').toLowerCase();
                const topic = (t.topic || '').toLowerCase();
                return title.includes(term) || subLabel.includes(term) || topic.includes(term);
            });
        }

        return result;
    }, [validTabs, selectedSubdivision, searchTerm]);

    // Chips com contagens para a barra de filtros
    const subdivisionChips = useMemo(() => {
        return getSubdivisionChips(validTabs);
    }, [validTabs]);

    // Dados estruturados conforme o modo de agrupamento
    const hierarchyGroups = useMemo(() => {
        return groupTabsHierarchy(filteredTabs);
    }, [filteredTabs]);

    const directGroups = useMemo(() => {
        return groupTabsBySubdivisionDirect(filteredTabs);
    }, [filteredTabs]);

    const classGroups = useMemo(() => {
        return groupTabsByClass(filteredTabs, classes, officialSession);
    }, [filteredTabs, classes, officialSession]);

    // Renderizar um card de atividade individual
    const renderActivityCard = (tab) => {
        const subConfig = getSubdivisionConfig(tab.type);

        return (
            <div
                key={tab.id}
                onClick={() => onSelect(tab.id)}
                className="group relative cursor-pointer"
            >
                <Card className={`h-full border-2 p-5 flex flex-col gap-3.5 transition-all duration-300 hover:shadow-xl hover:-translate-y-1.5 hover:border-slate-300 ${getBgColor(tab.type)}`}>
                    {/* Botões de Ação Rápidos */}
                    <div className="absolute top-3.5 right-3.5 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all z-10">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                if (onEditTab) onEditTab(tab);
                            }}
                            className="p-1.5 rounded-full bg-white/90 border border-slate-200 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-all hover:scale-110 active:scale-95 shadow-2xs"
                            title="Editar atividade"
                        >
                            <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onDeleteTab(tab.id);
                            }}
                            className="p-1.5 rounded-full bg-white/90 border border-slate-200 text-slate-500 hover:text-red-600 hover:bg-red-50 transition-all hover:scale-110 active:scale-95 shadow-2xs"
                            title="Excluir atividade"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border border-slate-100 shadow-2xs group-hover:scale-105 transition-transform duration-300 ${getIconColorClass(tab.type)}`}>
                            {getSubdivisionIcon(tab.type, "w-6 h-6")}
                        </div>
                        <div className="flex-1 min-w-0 pr-12">
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block truncate">
                                {subConfig.label}
                            </span>
                            {tab.topic && (
                                <span className="text-xs text-slate-400 font-medium block truncate">
                                    {tab.topic}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="flex-1 pt-1">
                        <h3 className="font-bold text-base text-slate-800 line-clamp-2 leading-snug group-hover:text-indigo-900 transition-colors">
                            {tab.title || "Atividade Sem Nome"}
                        </h3>
                    </div>

                    {/* Rodapé do Card com Data e Tag */}
                    <div className="pt-2 border-t border-slate-200/50 flex items-center justify-between text-[11px] text-slate-400 font-semibold">
                        <span>
                            {tab.createdAt ? new Date(tab.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : 'Sessão Atual'}
                        </span>
                        <span className="group-hover:text-indigo-600 transition-colors font-bold">
                            Abrir →
                        </span>
                    </div>
                </Card>
            </div>
        );
    };

    // Card de Nova Atividade Contextual
    const renderCreateCard = (typeHint = '') => {
        const subConfig = typeHint ? getSubdivisionConfig(typeHint) : null;
        const label = subConfig ? `Novo(a) ${subConfig.label}` : 'Nova Atividade';

        return (
            <div
                onClick={() => onCreateNew(typeHint || '')}
                className="cursor-pointer group h-full min-h-[170px]"
            >
                <div className="h-full rounded-2xl border-2 border-dashed border-brown-200/80 bg-brown-50/20 p-5 flex flex-col items-center justify-center gap-3 transition-all duration-300 hover:bg-brown-50/60 hover:border-brown-400 hover:-translate-y-1 hover:shadow-md">
                    <div className="bg-brown-100 text-brown-600 p-3 rounded-full group-hover:scale-110 group-hover:bg-brown-600 group-hover:text-white transition-all duration-300 shadow-2xs">
                        <Plus className="w-6 h-6" />
                    </div>
                    <span className="font-bold text-brown-700 text-sm group-hover:text-brown-900 transition-colors text-center">
                        {label}
                    </span>
                </div>
            </div>
        );
    };

    return (
        <div className="w-full h-full p-4 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col overflow-y-auto custom-scrollbar">
            
            {/* --- CABEÇALHO PRINCIPAL DO DASHBOARD --- */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-brown-200/60">
                <div className="flex items-center gap-3.5">
                    <div className="p-3 bg-brown-100 rounded-2xl text-brown-700 border-2 border-brown-200 shadow-2xs">
                        <LayoutGrid className="w-7 h-7" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2.5">
                            <h2 className="text-2xl md:text-3xl font-black text-brown-900 tracking-tight font-handwritten">
                                Minhas Atividades
                            </h2>
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-brown-200/80 text-brown-800">
                                {validTabs.length}
                            </span>
                        </div>
                        <p className="text-sm text-brown-600 font-medium mt-0.5">
                            Gerencie suas atividades organizadas por seções pedagógicas e subdivisões.
                        </p>
                    </div>
                </div>

                {/* Campo de Busca Rápida */}
                <div className="flex items-center gap-2 max-w-md w-full md:w-80">
                    <div className="relative w-full">
                        <Search className="w-4 h-4 text-brown-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Buscar atividade..."
                            className="w-full pl-9 pr-8 py-2 bg-white/90 border border-brown-200 rounded-xl text-sm font-medium placeholder:text-brown-300 text-brown-900 focus:outline-none focus:ring-2 focus:ring-brown-400 shadow-2xs"
                        />
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-brown-400 hover:text-brown-700 p-0.5 rounded-full"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>

                    <button
                        onClick={() => onCreateNew('')}
                        className="px-3.5 py-2 bg-brown-600 hover:bg-brown-700 text-white font-bold text-xs rounded-xl shadow-2xs flex items-center gap-1.5 whitespace-nowrap transition-all active:scale-95 cursor-pointer"
                        title="Criar nova atividade livre"
                    >
                        <PlusCircle className="w-4 h-4" />
                        <span>Nova</span>
                    </button>
                </div>
            </div>

            {/* --- SELETOR DE MODO DE AGRUPAMENTO & BARRA DE PÍLULAS --- */}
            <div className="flex flex-col gap-3 mb-6 bg-stone-50/80 p-3.5 rounded-2xl border border-stone-200/70 shadow-2xs">
                {/* Linha 1: Seletor de Modo */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="text-xs font-black uppercase tracking-wider text-stone-500">
                        Modo de Visualização:
                    </span>
                    <div className="flex flex-wrap items-center gap-1.5 bg-stone-200/60 p-1 rounded-xl">
                        <button
                            onClick={() => handleSetGroupingMode('hierarchy')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                                groupingMode === 'hierarchy'
                                    ? 'bg-white text-brown-800 shadow-2xs'
                                    : 'text-stone-600 hover:text-stone-900 hover:bg-white/50'
                            }`}
                        >
                            <span>🗂️</span>
                            <span>Categorias & Subdivisões</span>
                        </button>

                        <button
                            onClick={() => handleSetGroupingMode('direct')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                                groupingMode === 'direct'
                                    ? 'bg-white text-brown-800 shadow-2xs'
                                    : 'text-stone-600 hover:text-stone-900 hover:bg-white/50'
                            }`}
                        >
                            <span>🔍</span>
                            <span>Por Ferramenta</span>
                        </button>

                        <button
                            onClick={() => handleSetGroupingMode('class')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                                groupingMode === 'class'
                                    ? 'bg-white text-brown-800 shadow-2xs'
                                    : 'text-stone-600 hover:text-stone-900 hover:bg-white/50'
                            }`}
                        >
                            <span>🎓</span>
                            <span>Por Turma / Aula</span>
                        </button>

                        <button
                            onClick={() => handleSetGroupingMode('all')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                                groupingMode === 'all'
                                    ? 'bg-white text-brown-800 shadow-2xs'
                                    : 'text-stone-600 hover:text-stone-900 hover:bg-white/50'
                            }`}
                        >
                            <span>📋</span>
                            <span>Todas em Grade</span>
                        </button>
                    </div>
                </div>

                {/* Linha 2: Pílulas Rápidas de Subdivisão (Chips com Contadores) */}
                {subdivisionChips.length > 0 && (
                    <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pt-2 border-t border-stone-200/60 pb-1">
                        <button
                            onClick={() => setSelectedSubdivision('all')}
                            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer border ${
                                selectedSubdivision === 'all'
                                    ? 'bg-brown-600 text-white border-brown-700 shadow-2xs'
                                    : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-100'
                            }`}
                        >
                            <span>Todas</span>
                            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${selectedSubdivision === 'all' ? 'bg-brown-800 text-white' : 'bg-stone-100 text-stone-600'}`}>
                                {validTabs.length}
                            </span>
                        </button>

                        {subdivisionChips.map((chip) => {
                            const isSelected = selectedSubdivision === chip.key;
                            return (
                                <button
                                    key={chip.key}
                                    onClick={() => setSelectedSubdivision(isSelected ? 'all' : chip.key)}
                                    className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer border ${
                                        isSelected
                                            ? 'bg-brown-600 text-white border-brown-700 shadow-2xs'
                                            : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-100'
                                    }`}
                                >
                                    <span className="opacity-80">{getSubdivisionIcon(chip.key, "w-3.5 h-3.5")}</span>
                                    <span>{chip.config.label}</span>
                                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${isSelected ? 'bg-brown-800 text-white' : 'bg-stone-100 text-stone-600'}`}>
                                        {chip.count}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* --- CONTEÚDO PRINCIPAL: SEÇÕES --- */}
            <div className="space-y-8 pb-20">

                {/* Empty State */}
                {filteredTabs.length === 0 && (
                    <div className="flex flex-col items-center justify-center p-12 text-center bg-stone-50/70 border-2 border-dashed border-stone-200 rounded-3xl my-6">
                        <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center text-stone-400 mb-3">
                            <Search className="w-8 h-8" />
                        </div>
                        <h3 className="text-lg font-bold text-stone-700">Nenhuma atividade encontrada</h3>
                        <p className="text-xs text-stone-500 max-w-md mt-1 mb-4">
                            {searchTerm ? `Nenhum resultado com o termo "${searchTerm}". Tente buscar por outro nome.` : 'Você ainda não possui atividades cadastradas nesta seção.'}
                        </p>
                        <button
                            onClick={() => onCreateNew('')}
                            className="px-4 py-2 bg-brown-600 hover:bg-brown-700 text-white font-bold text-xs rounded-xl shadow-2xs flex items-center gap-2"
                        >
                            <PlusCircle className="w-4 h-4" />
                            <span>Criar Nova Atividade</span>
                        </button>
                    </div>
                )}

                {/* MODO 1: HIERARQUIA EM 2 NÍVEIS (MACRO-CATEGORIAS + SUBDIVISÕES) */}
                {groupingMode === 'hierarchy' && hierarchyGroups.map((group) => {
                    const isCollapsed = collapsedSections.has(group.category.id);

                    return (
                        <div
                            key={group.category.id}
                            className="bg-white/80 border-2 border-stone-200/80 rounded-3xl p-5 md:p-6 shadow-sm transition-all"
                        >
                            {/* Cabeçalho da Macro-Categoria */}
                            <div className="flex items-center justify-between gap-4 pb-4 border-b border-stone-200/60 mb-5">
                                <div
                                    onClick={() => toggleSectionCollapse(group.category.id)}
                                    className="flex items-center gap-3 cursor-pointer select-none group"
                                >
                                    <div className="w-10 h-10 rounded-2xl bg-brown-100/70 flex items-center justify-center text-brown-800 border border-brown-200 shadow-2xs group-hover:scale-105 transition-transform">
                                        {getCategoryIcon(group.category.id, "w-5 h-5")}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-lg md:text-xl font-black text-stone-800 group-hover:text-brown-800 transition-colors">
                                                {group.category.label}
                                            </h3>
                                            <span className="px-2 py-0.5 text-xs font-black rounded-full bg-stone-100 text-stone-700 border border-stone-200">
                                                {group.totalTabs}
                                            </span>
                                        </div>
                                        <p className="text-xs text-stone-500 font-medium hidden sm:block">
                                            {group.category.description}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => toggleSectionCollapse(group.category.id)}
                                        className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-xl transition-all cursor-pointer"
                                        title={isCollapsed ? 'Expandir seção' : 'Recolher seção'}
                                    >
                                        {isCollapsed ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            {/* Conteúdo Expansível com as Subdivisões */}
                            {!isCollapsed && (
                                <div className="space-y-6">
                                    {group.subdivisions.map((sub) => (
                                        <div key={sub.key} className="space-y-3">
                                            {/* Cabeçalho da Subdivisão */}
                                            <div className="flex items-center justify-between gap-2 px-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-stone-600">{getSubdivisionIcon(sub.key, "w-4 h-4")}</span>
                                                    <h4 className="text-sm font-bold text-stone-700">
                                                        {sub.config.label}
                                                    </h4>
                                                    <span className="px-1.5 py-0.2 text-[10px] font-black rounded-md bg-stone-100 text-stone-500 border border-stone-200">
                                                        {sub.tabs.length}
                                                    </span>
                                                </div>

                                                <button
                                                    onClick={() => onCreateNew(sub.key)}
                                                    className="text-xs font-bold text-brown-600 hover:text-brown-800 flex items-center gap-1 hover:underline cursor-pointer"
                                                    title={`Criar novo ${sub.config.label}`}
                                                >
                                                    <Plus className="w-3.5 h-3.5" />
                                                    <span>{sub.config.addLabel}</span>
                                                </button>
                                            </div>

                                            {/* Grade de Cards da Subdivisão */}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                                {sub.tabs.map(renderActivityCard)}
                                                {renderCreateCard(sub.key)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}

                {/* MODO 2: DIRETO POR SUBDIVISÃO / FERRAMENTA */}
                {groupingMode === 'direct' && directGroups.map((group) => {
                    const isCollapsed = collapsedSections.has(group.key);

                    return (
                        <div
                            key={group.key}
                            className="bg-white/80 border-2 border-stone-200/80 rounded-3xl p-5 md:p-6 shadow-sm transition-all"
                        >
                            <div className="flex items-center justify-between gap-4 pb-3 border-b border-stone-200/60 mb-4">
                                <div
                                    onClick={() => toggleSectionCollapse(group.key)}
                                    className="flex items-center gap-3 cursor-pointer select-none group"
                                >
                                    <div className="w-9 h-9 rounded-xl bg-brown-100/70 flex items-center justify-center text-brown-800 border border-brown-200 shadow-2xs group-hover:scale-105 transition-transform">
                                        {getSubdivisionIcon(group.key, "w-5 h-5")}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-base md:text-lg font-black text-stone-800 group-hover:text-brown-800 transition-colors">
                                            {group.config.label}
                                        </h3>
                                        <span className="px-2 py-0.5 text-xs font-black rounded-full bg-stone-100 text-stone-700 border border-stone-200">
                                            {group.tabs.length}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => onCreateNew(group.key)}
                                        className="text-xs font-bold text-brown-600 hover:text-brown-800 flex items-center gap-1 hover:underline cursor-pointer"
                                    >
                                        <Plus className="w-3.5 h-3.5" />
                                        <span>{group.config.addLabel}</span>
                                    </button>

                                    <button
                                        onClick={() => toggleSectionCollapse(group.key)}
                                        className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-xl transition-all cursor-pointer"
                                    >
                                        {isCollapsed ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            {!isCollapsed && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                    {group.tabs.map(renderActivityCard)}
                                    {renderCreateCard(group.key)}
                                </div>
                            )}
                        </div>
                    );
                })}

                {/* MODO 3: POR TURMA / SESSÃO DE AULA OFICIAL */}
                {groupingMode === 'class' && classGroups.map((group) => {
                    const isCollapsed = collapsedSections.has(group.id);

                    return (
                        <div
                            key={group.id}
                            className={`bg-white/80 border-2 rounded-3xl p-5 md:p-6 shadow-sm transition-all ${
                                group.isLive ? 'border-amber-400 bg-amber-50/20 shadow-md' : 'border-stone-200/80'
                            }`}
                        >
                            <div className="flex items-center justify-between gap-4 pb-3 border-b border-stone-200/60 mb-4">
                                <div
                                    onClick={() => toggleSectionCollapse(group.id)}
                                    className="flex items-center gap-3 cursor-pointer select-none group"
                                >
                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center border shadow-2xs group-hover:scale-105 transition-transform ${
                                        group.isLive ? 'bg-amber-500 text-white border-amber-600 animate-pulse' : 'bg-brown-100/70 text-brown-800 border-brown-200'
                                    }`}>
                                        <GraduationCap className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-base md:text-lg font-black text-stone-800 group-hover:text-brown-800 transition-colors">
                                                {group.title}
                                            </h3>
                                            <span className="px-2 py-0.5 text-xs font-black rounded-full bg-stone-100 text-stone-700 border border-stone-200">
                                                {group.tabs.length}
                                            </span>
                                        </div>
                                        {group.description && (
                                            <p className="text-xs text-stone-500 font-medium">
                                                {group.description}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => toggleSectionCollapse(group.id)}
                                        className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-xl transition-all cursor-pointer"
                                    >
                                        {isCollapsed ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            {!isCollapsed && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                    {group.tabs.map(renderActivityCard)}
                                    {renderCreateCard('')}
                                </div>
                            )}
                        </div>
                    );
                })}

                {/* MODO 4: TODAS EM GRADE SIMPLES */}
                {groupingMode === 'all' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                        {filteredTabs.map(renderActivityCard)}
                        {renderCreateCard('')}
                    </div>
                )}

            </div>
        </div>
    );
};
