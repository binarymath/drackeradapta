import React, { useState, useMemo } from 'react';
import {
    Sparkles,
    BrainCircuit,
    Search,
    Music,
    Pencil,
    Grid,
    Link as LinkIcon,
    PieChart,
    Compass,
    Target,
    Ruler,
    Brain,
    LifeBuoy,
    Layers,
    FileText,
    Play,
    MessageSquare,
    Key,
    AlertCircle,
    ArrowRight,
    Wand2,
    BookOpen,
    GraduationCap,
    HelpCircle
} from 'lucide-react';
import { Button } from './ui/Button';
import { TextArea } from './ui/Input';
import { useGemini } from '../contexts/GeminiContext';
import { useActivity } from '../contexts/ActivityContext';
import { ACTIVITY_CATEGORIES, ACTIVITIES_CATALOG } from '../utils/activityCatalog';

export const HeroGenerator = ({
    topic,
    setTopic,
    lessonDetails,
    setLessonDetails,
    difficulty,
    setDifficulty,
    difficultyOptions,
    activityType,
    setActivityType,
    activityOptions,
    handleGenerate,
    isLoading,
    systemStatus,
    error,
    navLinks,
    selectActivityTab,
    onOpenQuizWizard,
    onLaunchActivity
}) => {
    const { apiKeyStatus, setShowSettings } = useGemini();
    const { tabs, selectActivityTab: ctxSelectActivityTab, addActivityTab, handleActivityTypeChange } = useActivity();

    // Filtro por Categoria e Busca
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    // Filtrar Atividades
    const filteredActivities = useMemo(() => {
        return ACTIVITIES_CATALOG.filter(act => {
            const matchesCategory = selectedCategory === 'all' || act.category === selectedCategory;
            const matchesSearch = !searchTerm.trim() || 
                act.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                act.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                act.subtitle.toLowerCase().includes(searchTerm.toLowerCase());
            return matchesCategory && matchesSearch;
        });
    }, [selectedCategory, searchTerm]);

    // Disparador de Atividades
    const handleCardClick = (activity) => {
        if (onLaunchActivity) {
            onLaunchActivity(activity.typeKey);
            return;
        }

        // Fallback caso não seja passado via props
        if (activity.typeKey === 'quiz' && onOpenQuizWizard) {
            onOpenQuizWizard();
            return;
        }

        if (setActivityType) {
            setActivityType(activity.typeKey);
        } else if (handleActivityTypeChange) {
            handleActivityTypeChange(activity.typeKey);
        }
    };

    // Renderiza Ícone do Card
    const renderActivityIcon = (iconName, className = "w-6 h-6") => {
        switch (iconName) {
            case 'BrainCircuit': return <BrainCircuit className={className} />;
            case 'Search': return <Search className={className} />;
            case 'Music': return <Music className={className} />;
            case 'Pencil': return <Pencil className={className} />;
            case 'Grid': return <Grid className={className} />;
            case 'Link': return <LinkIcon className={className} />;
            case 'PieChart': return <PieChart className={className} />;
            case 'Compass': return <Compass className={className} />;
            case 'Target': return <Target className={className} />;
            case 'Ruler': return <Ruler className={className} />;
            case 'Brain': return <Brain className={className} />;
            case 'LifeBuoy': return <LifeBuoy className={className} />;
            case 'Layers': return <Layers className={className} />;
            case 'FileText': return <FileText className={className} />;
            case 'Play': return <Play className={className} />;
            case 'MessageSquare': return <MessageSquare className={className} />;
            default: return <Sparkles className={className} />;
        }
    };

    return (
        <div className="flex flex-col w-full h-full max-w-7xl mx-auto p-4 md:p-8 animate-in fade-in zoom-in-95 duration-500 overflow-y-auto space-y-10">
            {/* Header Hero */}
            <div className="text-center pt-2">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-800 tracking-tight font-['Fredoka'] leading-tight">
                    O que vamos <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-amber-500">aprender hoje?</span>
                </h1>
            </div>

            {/* Banner de Chave API se não configurada */}
            {(!apiKeyStatus || apiKeyStatus === 'empty' || apiKeyStatus === 'invalid') && (
                <div 
                    onClick={() => setShowSettings(true)}
                    className="w-full bg-gradient-to-r from-rose-500 via-rose-600 to-amber-600 text-white rounded-3xl p-4 md:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 cursor-pointer shadow-xl shadow-rose-500/20 hover:brightness-105 transition-all animate-pulse border-2 border-rose-400"
                    title="Clique para configurar sua Chave de API Gemini"
                >
                    <div className="flex items-center gap-3 text-center sm:text-left">
                        <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center font-black shrink-0 mx-auto sm:mx-0">
                            <Key className="w-6 h-6 text-amber-200" />
                        </div>
                        <div>
                            <h4 className="text-sm md:text-base font-black text-white font-['Fredoka']">Chave de API Gemini Não Configurada</h4>
                            <p className="text-xs text-rose-100 font-medium">Insira sua chave do Google AI Studio para desbloquear a geração mágica com IA em todas as atividades.</p>
                        </div>
                    </div>
                    <span className="text-xs font-black bg-white text-rose-700 px-5 py-2.5 rounded-2xl whitespace-nowrap shadow-md hover:bg-rose-50 transition-colors shrink-0 font-['Fredoka']">
                        Configurar Chave API
                    </span>
                </div>
            )}



            {/* ─────────────────────────────────────────────────────────────
                BARRA DE NAVEGAÇÃO POR CATEGORIAS & BUSCA
               ───────────────────────────────────────────────────────────── */}
            <div className="space-y-4">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    {/* Pílulas de Categorias */}
                    <div className="flex items-center gap-2 overflow-x-auto w-full pb-2 md:pb-0 scrollbar-none">
                        {ACTIVITY_CATEGORIES.map(cat => {
                            const isSelected = selectedCategory === cat.id;
                            const count = cat.id === 'all' 
                                ? ACTIVITIES_CATALOG.length 
                                : ACTIVITIES_CATALOG.filter(a => a.category === cat.id).length;
                            return (
                                <button
                                    key={cat.id}
                                    type="button"
                                    onClick={() => setSelectedCategory(cat.id)}
                                    className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer whitespace-nowrap font-['Fredoka'] ${
                                        isSelected
                                            ? 'bg-slate-900 text-white shadow-md shadow-slate-900/20 scale-105'
                                            : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                    }`}
                                >
                                    <span>{cat.icon}</span>
                                    <span>{cat.label}</span>
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                        isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                                    }`}>
                                        {count}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Busca Rápida */}
                    <div className="w-full md:w-64 shrink-0 relative">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Buscar atividade..."
                            className="w-full h-11 pl-10 pr-4 bg-white border border-slate-200 rounded-2xl text-xs font-semibold text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        />
                    </div>
                </div>
            </div>

            {/* ─────────────────────────────────────────────────────────────
                GRADE DE CARDS ESTILIZADOS DAS ATIVIDADES
               ───────────────────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredActivities.map(activity => {
                    return (
                        <div
                            key={activity.id}
                            onClick={() => handleCardClick(activity)}
                            className="group relative bg-white rounded-[2.5rem] border-2 border-slate-100 hover:border-indigo-300 shadow-xl shadow-slate-100/60 hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-1.5 transition-all duration-300 overflow-hidden flex flex-col cursor-pointer"
                        >
                            {/* Capa com Gradiente e Imagem Temática */}
                            <div className={`relative h-44 w-full bg-gradient-to-br ${activity.coverGradient} p-5 flex flex-col justify-between overflow-hidden`}>
                                {/* Elemento de Brilho de Fundo */}
                                <div className="absolute top-0 right-0 w-44 h-44 bg-white/10 rounded-full blur-2xl -mr-12 -mt-12 pointer-events-none"></div>

                                {/* Imagem de Capa do Mascote */}
                                {activity.coverImage && (
                                    <div className="absolute -right-4 -bottom-6 w-36 h-36 opacity-85 group-hover:opacity-100 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 pointer-events-none drop-shadow-xl">
                                        <img
                                            src={activity.coverImage}
                                            alt={activity.title}
                                            className="w-full h-full object-contain"
                                        />
                                    </div>
                                )}

                                {/* Badges Superiores */}
                                <div className="flex items-center justify-between w-full relative z-10">
                                    <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/20 backdrop-blur-md text-white border border-white/30 font-['Fredoka']">
                                        {ACTIVITY_CATEGORIES.find(c => c.id === activity.category)?.label || 'Atividade'}
                                    </span>
                                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-white text-slate-800 shadow-sm flex items-center gap-1 font-['Fredoka']">
                                        <span>✨ IA + ✏️ Manual</span>
                                    </span>
                                </div>

                                {/* Ícone do Tipo de Atividade */}
                                <div className="w-12 h-12 rounded-2xl bg-white shadow-lg text-slate-800 flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300 relative z-10">
                                    {renderActivityIcon(activity.iconName, "w-6 h-6 text-slate-800")}
                                </div>
                            </div>

                            {/* Corpo do Card */}
                            <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                                <div className="space-y-2">
                                    <h3 className="text-xl font-black text-slate-800 font-['Fredoka'] tracking-tight group-hover:text-indigo-600 transition-colors">
                                        {activity.title}
                                    </h3>
                                    <p className="text-xs font-bold text-indigo-500">
                                        {activity.subtitle}
                                    </p>
                                    <p className="text-xs text-slate-500 font-medium leading-relaxed line-clamp-3">
                                        {activity.description}
                                    </p>
                                </div>

                                {/* Tags de Recursos */}
                                <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-1.5">
                                    {activity.tags.map(tag => (
                                        <span
                                            key={tag}
                                            className="px-2.5 py-1 rounded-xl bg-slate-50 border border-slate-100 text-[10px] font-bold text-slate-600"
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                </div>

                                {/* Botão Gamificado Inferior */}
                                <div className="pt-2">
                                    <div className="w-full py-3.5 px-4 rounded-2xl bg-slate-50 group-hover:bg-gradient-to-r group-hover:from-indigo-600 group-hover:to-purple-600 text-slate-700 group-hover:text-white font-['Fredoka'] font-black text-xs flex items-center justify-between shadow-2xs group-hover:shadow-lg group-hover:shadow-indigo-500/25 transition-all">
                                        <span>{activity.buttonText}</span>
                                        <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Caso nenhum card atenda ao filtro */}
            {filteredActivities.length === 0 && (
                <div className="p-16 text-center bg-white rounded-[2.5rem] border-2 border-dashed border-slate-200 space-y-3">
                    <Sparkles className="w-12 h-12 text-slate-300 mx-auto" />
                    <h4 className="font-['Fredoka'] font-black text-lg text-slate-700">
                        Nenhuma atividade encontrada para "{searchTerm}"
                    </h4>
                    <p className="text-xs text-slate-400 max-w-md mx-auto">
                        Tente buscar por outro termo ou selecione a categoria "Todas as Expedições" acima.
                    </p>
                    <div className="pt-2">
                        <Button
                            type="button"
                            onClick={() => { setSelectedCategory('all'); setSearchTerm(''); }}
                            className="rounded-2xl bg-indigo-600 text-white font-bold"
                        >
                            Ver Todas as Atividades
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HeroGenerator;
