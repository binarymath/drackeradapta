import React, { useState, useEffect } from 'react';
import { 
    Sparkles, 
    Wand2, 
    BookOpen, 
    FileText, 
    GraduationCap, 
    Sliders, 
    Check, 
    ChevronDown, 
    ChevronUp, 
    Target
} from 'lucide-react';

// Níveis escolares unificados em todo o Drácker Adapta (incluindo Ensino Médio)
export const STANDARDIZED_GRADE_LEVELS = [
    { 
        id: 'infantil', 
        label: 'Educação Infantil (4 a 5 anos)', 
        short: 'Ed. Infantil',
        desc: 'Linguagem lúdica, visual e muito simples' 
    },
    { 
        id: 'fund1_early', 
        label: 'Ensino Fundamental I - 1º ao 3º Ano (6 a 8 anos)', 
        short: 'Fund. I (1º-3º)',
        desc: 'Linguagem simples, acessível e contextualizada' 
    },
    { 
        id: 'fund1_late', 
        label: 'Ensino Fundamental I - 4º e 5º Ano (9 a 10 anos)', 
        short: 'Fund. I (4º-5º)',
        desc: 'Linguagem clara, direta e motivadora' 
    },
    { 
        id: 'fund2', 
        label: 'Ensino Fundamental II - 6º ao 9º Ano (11 a 14 anos)', 
        short: 'Fund. II (6º-9º)',
        desc: 'Conceitos formais, desafios e raciocínio crítico' 
    },
    { 
        id: 'medio', 
        label: 'Ensino Médio - 1ª a 3ª Série (15 a 17 anos)', 
        short: 'Ensino Médio',
        desc: 'Linguagem aprofundada, estilo vestibular e ENEM' 
    },
];

// Presets didáticos de balanceamento de dificuldade
export const DIFFICULTY_PRESETS = [
    {
        id: 'balanced',
        name: 'Equilibrado',
        icon: '🎯',
        desc: '40% Fácil • 40% Médio • 20% Difícil',
        dist: { easy: 40, medium: 40, hard: 20 }
    },
    {
        id: 'intro',
        name: 'Introdução & Fixação',
        icon: '🌱',
        desc: '70% Fácil • 30% Médio • 0% Difícil',
        dist: { easy: 70, medium: 30, hard: 0 }
    },
    {
        id: 'challenge',
        name: 'Desafio & Simulado',
        icon: '⚡',
        desc: '20% Fácil • 50% Médio • 30% Difícil',
        dist: { easy: 20, medium: 50, hard: 30 }
    }
];

// Mensagens rotativas durante o pensamento da IA
const DEFAULT_GENERATION_STEPS = [
    '🐉 Drácker está analisando o tema e o contexto pedagógico...',
    '🦉 A Coruja Sábia está balanceando as dificuldades (Fácil, Médio, Difícil)...',
    '✨ Elaborando alternativas inteligentes e conferindo o conteúdo didático...',
    '🎨 Formatando tudo de forma visual e gamificada para seus alunos...'
];

/**
 * Componente Global Reutilizável de Geração de Conteúdo Pedagógico com IA.
 * Utilizado no Quiz, Caça-Palavras, Cruzadinhas, Músicas, Dominó e Ligar Pontos.
 */
export const GlobalAIGeneratorPanel = ({
    itemTypeLabel = 'questões',             // 'questões', 'palavras', 'termos', 'pares', 'estrofes'
    topic = '',
    onTopicChange,
    context = '',
    onContextChange,
    gradeLevel = 'Ensino Fundamental I - 1º ao 3º Ano (6 a 8 anos)',
    onGradeLevelChange,
    itemCount = 10,
    onItemCountChange,
    itemCountOptions = [5, 8, 10, 15, 20],
    difficultyDist = { easy: 40, medium: 40, hard: 20 },
    onDifficultyDistChange,
    onGenerate,
    isGenerating = false,
    title,
    collapsible = true,
    defaultExpanded = true,
    className = ''
}) => {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);
    const [stepIndex, setStepIndex] = useState(0);

    // Rotação de frases de progresso enquanto a IA gera
    useEffect(() => {
        let interval;
        if (isGenerating) {
            interval = setInterval(() => {
                setStepIndex(prev => (prev + 1) % DEFAULT_GENERATION_STEPS.length);
            }, 2600);
        } else {
            setStepIndex(0);
        }
        return () => clearInterval(interval);
    }, [isGenerating]);

    // Cálculo em tempo real da quantidade exata de itens por nível de dificuldade
    const easyCount = Math.round((itemCount * (difficultyDist?.easy || 0)) / 100);
    const mediumCount = Math.round((itemCount * (difficultyDist?.medium || 0)) / 100);
    const hardCount = Math.max(0, itemCount - easyCount - mediumCount);

    // Ajuste proporcional e sincronizado dos sliders para manter sempre 100%
    const handleSliderChange = (changedKey, rawValue) => {
        if (!onDifficultyDistChange) return;

        const val = Math.max(0, Math.min(100, Math.round(Number(rawValue))));
        const otherKeys = ['easy', 'medium', 'hard'].filter(k => k !== changedKey);
        const remaining = 100 - val;
        const currentOtherSum = (difficultyDist[otherKeys[0]] || 0) + (difficultyDist[otherKeys[1]] || 0);

        let newDist = { ...difficultyDist, [changedKey]: val };

        if (currentOtherSum === 0) {
            newDist[otherKeys[0]] = Math.round(remaining / 2);
            newDist[otherKeys[1]] = remaining - newDist[otherKeys[0]];
        } else {
            const ratio0 = (difficultyDist[otherKeys[0]] || 0) / currentOtherSum;
            newDist[otherKeys[0]] = Math.round(remaining * ratio0);
            newDist[otherKeys[1]] = remaining - newDist[otherKeys[0]];
        }

        onDifficultyDistChange(newDist);
    };

    const handleApplyPreset = (presetDist) => {
        if (onDifficultyDistChange) {
            onDifficultyDistChange(presetDist);
        }
    };

    // Sufixo para o label do tema
    const formattedItemType = itemTypeLabel?.toLowerCase() || 'atividade';

    return (
        <div className={`bg-gradient-to-br from-indigo-50/70 via-white to-purple-50/60 rounded-3xl border-2 border-indigo-100 shadow-sm transition-all overflow-hidden ${className}`}>
            {/* ── CABEÇALHO DO PAINEL COM BOTÃO DE RECOLHER / EXPANDIR ── */}
            <div 
                className={`p-4 md:p-5 flex items-center justify-between gap-3 cursor-pointer select-none border-b transition-colors ${
                    isExpanded ? 'border-indigo-100/80 bg-white/60' : 'border-transparent hover:bg-white/80'
                }`}
                onClick={() => collapsible && setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-500 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 flex-shrink-0">
                        <Sparkles className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="font-['Fredoka'] font-black text-slate-800 text-base md:text-lg tracking-wide">
                                {title || `Gerar ${itemTypeLabel} com Inteligência Artificial`}
                            </h3>
                            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 tracking-wider">
                                Modelo Global IA
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 font-medium">
                            {isExpanded 
                                ? 'Defina o tema, delimite o contexto pedagógico e equilibre as dificuldades.'
                                : `Tema: "${topic || 'Não definido'}" • ${itemCount} ${itemTypeLabel} (${easyCount}F / ${mediumCount}M / ${hardCount}D)`
                            }
                        </p>
                    </div>
                </div>

                {collapsible && (
                    <button
                        type="button"
                        aria-label={isExpanded ? 'Recolher painel IA' : 'Expandir painel IA'}
                        className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors flex-shrink-0"
                    >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                )}
            </div>

            {/* ── CORPO EXPANSÍVEL DO PAINEL: 2 COLUNAS HARMONIOSAS ── */}
            {isExpanded && (
                <div className="p-4 md:p-6 space-y-5">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                        {/* ── COLUNA 1 (ESQUERDA): CARD DE CONTEXTO PEDAGÓGICO (IDÊNTICO AO SCREENSHOT) ── */}
                        <div className="lg:col-span-6 bg-white p-5 rounded-3xl border-2 border-slate-200 shadow-sm space-y-4">
                            {/* Tema Central */}
                            <div>
                                <label className="text-xs font-black text-slate-700 uppercase tracking-wider block mb-2">
                                    Tema Central d{formattedItemType.startsWith('a') ? 'a' : 'o'} {formattedItemType}
                                </label>
                                <input
                                    type="text"
                                    value={topic}
                                    onChange={(e) => onTopicChange?.(e.target.value)}
                                    placeholder="Ex: Revolução Francesa, Funções Trigonométricas, Fotossíntese..."
                                    disabled={isGenerating}
                                    className="w-full h-12 px-4 rounded-2xl border-2 border-slate-200 bg-slate-50 focus:bg-white font-bold text-slate-800 text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all placeholder:text-slate-400 placeholder:font-normal"
                                />
                            </div>

                            {/* Contexto & Instruções Pedagógicas (Opcional) */}
                            <div>
                                <label className="text-xs font-black text-slate-700 uppercase tracking-wider block mb-2">
                                    Contexto & Instruções Pedagógicas (Opcional)
                                </label>
                                <textarea
                                    value={context}
                                    onChange={(e) => onContextChange?.(e.target.value)}
                                    disabled={isGenerating}
                                    rows={3}
                                    placeholder="Ex: Focar em exemplos práticos do cotidiano, evitar terminologias excessivamente complexas..."
                                    className="w-full p-3.5 rounded-2xl border-2 border-slate-200 bg-slate-50 focus:bg-white font-medium text-slate-700 text-xs focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all resize-y placeholder:text-slate-400 leading-relaxed min-h-[95px]"
                                />
                            </div>

                            {/* Nível/Ano Escolar */}
                            <div>
                                <label className="text-xs font-black text-slate-700 uppercase tracking-wider block mb-2">
                                    Nível/Ano Escolar
                                </label>
                                <select
                                    value={gradeLevel}
                                    onChange={(e) => onGradeLevelChange?.(e.target.value)}
                                    disabled={isGenerating}
                                    className="w-full h-12 px-4 rounded-2xl border-2 border-slate-200 bg-slate-50 focus:bg-white font-bold text-slate-800 text-xs focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all cursor-pointer"
                                >
                                    {STANDARDIZED_GRADE_LEVELS.map((g) => (
                                        <option key={g.id} value={g.label}>
                                            {g.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* ── COLUNA 2 (DIREITA): QUANTIDADE & SLICES DE DIFICULDADE ── */}
                        <div className="lg:col-span-6 space-y-4">
                            {/* Card Quantidade */}
                            <div className="bg-white p-5 rounded-3xl border-2 border-slate-200 shadow-sm space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                        <Target className="w-4 h-4 text-indigo-500" />
                                        Quantidade de {itemTypeLabel}
                                    </label>
                                    <span className="font-['Fredoka'] font-black text-sm text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-xl border border-indigo-100">
                                        {itemCount} {itemTypeLabel}
                                    </span>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    {itemCountOptions.map((cnt) => {
                                        const isSelected = Number(itemCount) === cnt;
                                        return (
                                            <button
                                                key={cnt}
                                                type="button"
                                                disabled={isGenerating}
                                                onClick={() => onItemCountChange?.(cnt)}
                                                className={`px-3 py-2 rounded-xl text-xs font-black font-['Fredoka'] transition-all flex items-center gap-1 cursor-pointer ${
                                                    isSelected
                                                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20 scale-105'
                                                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                                }`}
                                            >
                                                {cnt}
                                                {cnt === 10 && ' ⭐'}
                                            </button>
                                        );
                                    })}

                                    {/* Campo numérico livre */}
                                    <div className="flex items-center gap-1 ml-auto">
                                        <span className="text-[11px] font-bold text-slate-400">Outro:</span>
                                        <input
                                            type="number"
                                            min="1"
                                            max="30"
                                            value={itemCount}
                                            onChange={(e) => {
                                                const val = Math.max(1, Math.min(30, Number(e.target.value) || 1));
                                                onItemCountChange?.(val);
                                            }}
                                            disabled={isGenerating}
                                            className="w-14 h-8 px-2 rounded-xl border border-slate-200 text-center font-bold text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                                        />
                                    </div>
                                </div>

                                <div className="text-[11px] text-slate-500 font-medium bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex items-center justify-between">
                                    <span>Divisão em tempo real:</span>
                                    <span className="font-bold text-slate-700">
                                        <strong className="text-emerald-600">{easyCount} fáceis</strong> •{' '}
                                        <strong className="text-amber-600">{mediumCount} médias</strong> •{' '}
                                        <strong className="text-rose-600">{hardCount} difíceis</strong>
                                    </span>
                                </div>
                            </div>

                            {/* Card Sliders de Balanceamento ("Slices") */}
                            <div className="bg-white p-5 rounded-3xl border-2 border-slate-200 shadow-sm space-y-3">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <label className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                        <Sliders className="w-4 h-4 text-indigo-500" />
                                        Perfil de Dificuldade (Slices)
                                    </label>
                                    
                                    {/* Presets rápidos */}
                                    <div className="flex items-center gap-1">
                                        {DIFFICULTY_PRESETS.map((preset) => {
                                            const isActive = 
                                                difficultyDist?.easy === preset.dist.easy &&
                                                difficultyDist?.medium === preset.dist.medium &&
                                                difficultyDist?.hard === preset.dist.hard;

                                            return (
                                                <button
                                                    key={preset.id}
                                                    type="button"
                                                    disabled={isGenerating}
                                                    onClick={() => handleApplyPreset(preset.dist)}
                                                    title={preset.desc}
                                                    className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                                                        isActive
                                                            ? 'bg-indigo-100 text-indigo-800 border border-indigo-300 font-black'
                                                            : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200'
                                                    }`}
                                                >
                                                    {preset.icon} {preset.name}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Slider Fácil */}
                                <div className="space-y-1">
                                    <div className="flex justify-between items-center text-xs font-bold text-emerald-700">
                                        <span className="flex items-center gap-1.5">
                                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                                            Fácil: {difficultyDist?.easy || 0}%
                                        </span>
                                        <span className="text-[11px] font-extrabold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                            {easyCount} {itemTypeLabel}
                                        </span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        step="5"
                                        disabled={isGenerating}
                                        value={difficultyDist?.easy || 0}
                                        onChange={(e) => handleSliderChange('easy', e.target.value)}
                                        className="w-full h-2 rounded-lg bg-emerald-100 accent-emerald-500 cursor-pointer disabled:opacity-50"
                                    />
                                </div>

                                {/* Slider Médio */}
                                <div className="space-y-1">
                                    <div className="flex justify-between items-center text-xs font-bold text-amber-700">
                                        <span className="flex items-center gap-1.5">
                                            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                                            Médio: {difficultyDist?.medium || 0}%
                                        </span>
                                        <span className="text-[11px] font-extrabold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                                            {mediumCount} {itemTypeLabel}
                                        </span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        step="5"
                                        disabled={isGenerating}
                                        value={difficultyDist?.medium || 0}
                                        onChange={(e) => handleSliderChange('medium', e.target.value)}
                                        className="w-full h-2 rounded-lg bg-amber-100 accent-amber-500 cursor-pointer disabled:opacity-50"
                                    />
                                </div>

                                {/* Slider Difícil */}
                                <div className="space-y-1">
                                    <div className="flex justify-between items-center text-xs font-bold text-rose-700">
                                        <span className="flex items-center gap-1.5">
                                            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                                            Difícil: {difficultyDist?.hard || 0}%
                                        </span>
                                        <span className="text-[11px] font-extrabold bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                                            {hardCount} {itemTypeLabel}
                                        </span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        step="5"
                                        disabled={isGenerating}
                                        value={difficultyDist?.hard || 0}
                                        onChange={(e) => handleSliderChange('hard', e.target.value)}
                                        className="w-full h-2 rounded-lg bg-rose-100 accent-rose-500 cursor-pointer disabled:opacity-50"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Mensagem Animada durante o Carregamento */}
                    {isGenerating && (
                        <div className="p-4 rounded-2xl bg-indigo-50 border-2 border-indigo-200 animate-pulse text-center space-y-2">
                            <div className="flex items-center justify-center gap-2">
                                <Sparkles className="w-5 h-5 text-indigo-600 animate-spin" />
                                <span className="font-['Fredoka'] font-black text-sm text-indigo-900">
                                    Elaborando Conteúdo com Inteligência Artificial...
                                </span>
                            </div>
                            <p className="text-xs font-bold text-indigo-700">
                                {DEFAULT_GENERATION_STEPS[stepIndex]}
                            </p>
                        </div>
                    )}

                    {/* Botão 3D Gamificado de Ação */}
                    <div className="pt-1">
                        <button
                            type="button"
                            onClick={onGenerate}
                            disabled={isGenerating || !topic?.trim()}
                            className="w-full py-4 px-6 rounded-2xl font-['Fredoka'] font-black text-base text-white tracking-wide bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-lg shadow-indigo-500/25 active:translate-y-0.5 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2 cursor-pointer"
                        >
                            {isGenerating ? (
                                <>
                                    <Sparkles className="w-5 h-5 animate-spin" />
                                    <span>Criando {itemCount} {itemTypeLabel} com IA...</span>
                                </>
                            ) : (
                                <>
                                    <Wand2 className="w-5 h-5" />
                                    <span>
                                        ✨ Gerar {itemCount} {itemTypeLabel} com IA Agora
                                    </span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GlobalAIGeneratorPanel;
