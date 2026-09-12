import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Sparkles, Check, Info, X } from 'lucide-react';

export const ROULETTE_STYLES = [
    {
        id: 'slot_machine',
        name: 'Caça-Moedas',
        shortName: 'Caça-Moedas',
        icon: '🪙',
        badge: 'Chassi 777',
        accentColor: 'from-yellow-500 to-amber-600',
        textColor: 'text-amber-400',
        description: 'Chassi retrô de caça-níqueis com alavanca mecânica, rolos 777 e chuva de moedas douradas!',
        highlight: 'Chassi com moedas e alavanca'
    },
    {
        id: 'marquee',
        name: 'Letreiro Digital',
        shortName: 'Letreiro',
        icon: '🔤',
        badge: 'Split-Flap',
        accentColor: 'from-amber-600 to-orange-600',
        textColor: 'text-orange-400',
        description: 'Painel mecânico estilo aeroporto com troca rápida de nomes e fita de alunos contínua!',
        highlight: 'Alterna os nomes em alta velocidade'
    },
    {
        id: 'classic',
        name: 'Cassino Vegas',
        shortName: 'Vegas',
        icon: '🎰',
        badge: 'Clássico',
        accentColor: 'from-amber-500 to-yellow-500',
        textColor: 'text-yellow-400',
        description: 'Roleta de palco luxuosa com lâmpadas incandescentes pulsantes e acabamento dourado.',
        highlight: 'Roda circular clássica de cassino'
    },
    {
        id: 'cyberpunk',
        name: 'Cyberpunk Neon',
        shortName: 'Cyberpunk',
        icon: '⚡',
        badge: 'Sci-Fi',
        accentColor: 'from-cyan-400 to-fuchsia-500',
        textColor: 'text-cyan-400',
        description: 'Holograma futurista com anéis de dados giratórios, grade hexagonal e mira laser HUD.',
        highlight: 'Holograma futurista com mira laser'
    },
    {
        id: 'arcade',
        name: 'Arcade Retrô',
        shortName: 'Arcade',
        icon: '👾',
        badge: '8-Bit',
        accentColor: 'from-yellow-400 to-red-500',
        textColor: 'text-yellow-300',
        description: 'Visual clássico de videogame de fliperama dos anos 80/90 com efeitos sonoros chiptune.',
        highlight: 'Estilo gamer retrô em pixel-art'
    },
    {
        id: 'cosmic',
        name: 'Galáxia Astral',
        shortName: 'Galáxia',
        icon: '🌌',
        badge: 'Cósmico',
        accentColor: 'from-purple-500 to-indigo-600',
        textColor: 'text-purple-300',
        description: 'Viagem pelas estrelas com nebulosa cósmica, ponteiro solar/lunar e sinos astrais.',
        highlight: 'Nebulosa estelar com sinos celestiais'
    }
];

export const RouletteStyleSelector = ({ selectedStyle = 'slot_machine', onSelectStyle, disabled = false }) => {
    const [showModal, setShowModal] = useState(false);
    const activeStyleObj = ROULETTE_STYLES.find(s => s.id === selectedStyle) || ROULETTE_STYLES[0];

    return (
        <div className="w-full mb-6">
            {/* Barra Superior de Controle do Seletor */}
            <div className="flex items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                    <span className="text-xl">{activeStyleObj.icon}</span>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-black tracking-wider uppercase text-white/90">
                                {activeStyleObj.name}
                            </span>
                            <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-white/10 text-amber-300 border border-white/15">
                                {activeStyleObj.badge}
                            </span>
                        </div>
                        <p className="text-[11px] text-slate-400 hidden sm:block">
                            {activeStyleObj.highlight}
                        </p>
                    </div>
                </div>

                {/* Botão para Abrir Menu / Modal com todos os 6 modelos detalhados */}
                <button
                    type="button"
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-all border border-white/20 shadow-xs cursor-pointer active:scale-95"
                    title="Ver detalhes dos 6 estilos de roleta"
                >
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Ver 6 Estilos</span>
                </button>
            </div>

            {/* Seletor Segmentado Compacto (Pill Tabs) */}
            <div className="bg-black/50 p-1.5 rounded-2xl border border-white/10 shadow-inner flex items-center gap-1.5 overflow-x-auto custom-scrollbar">
                {ROULETTE_STYLES.map((style) => {
                    const isSelected = selectedStyle === style.id;

                    return (
                        <button
                            key={style.id}
                            type="button"
                            onClick={() => !disabled && onSelectStyle(style.id)}
                            disabled={disabled}
                            className={`flex-1 min-w-[105px] py-2 px-2.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-center gap-2 select-none ${
                                isSelected
                                    ? 'bg-gradient-to-r from-white/20 to-white/10 text-white border border-white/30 shadow-md ring-2 ring-white/20 scale-[1.02]'
                                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
                            } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-95'}`}
                        >
                            <span className="text-base">{style.icon}</span>
                            <span className="truncate">{style.shortName}</span>
                        </button>
                    );
                })}
            </div>

            {/* ======================================================== */}
            {/* MODAL DETALHADO DE SELEÇÃO DOS 6 MODELOS DE ROLETA */}
            {/* ======================================================== */}
            {showModal && typeof document !== 'undefined' && createPortal(
                <div 
                    className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) setShowModal(false);
                    }}
                >
                    <div className="relative w-full max-w-2xl bg-slate-900 border-2 border-slate-700 rounded-3xl p-6 shadow-2xl text-white z-[100000]">
                        
                        {/* Header do Modal */}
                        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                                    <Sparkles className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black tracking-wide">
                                        Escolha o Estilo da sua Roleta
                                    </h3>
                                    <p className="text-xs text-slate-400">
                                        Selecione entre os 6 modelos temáticos com animações e efeitos sonoros exclusivos
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={() => setShowModal(false)}
                                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Grade dos 6 Modelos com Visual Rico */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto pr-1 custom-scrollbar">
                            {ROULETTE_STYLES.map((style) => {
                                const isSelected = selectedStyle === style.id;

                                return (
                                    <div
                                        key={style.id}
                                        onClick={() => {
                                            if (!disabled) {
                                                onSelectStyle(style.id);
                                                setShowModal(false);
                                            }
                                        }}
                                        className={`group relative p-4 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between gap-3 ${
                                            isSelected
                                                ? 'bg-gradient-to-b from-indigo-950/60 to-slate-900 border-indigo-500/80 shadow-lg shadow-indigo-950/50 ring-2 ring-indigo-500/30'
                                                : 'bg-slate-950/60 hover:bg-slate-800/60 border-slate-800 hover:border-slate-700'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-3">
                                                <span className="text-3xl p-2 rounded-2xl bg-white/5 border border-white/10 group-hover:scale-110 transition-transform">
                                                    {style.icon}
                                                </span>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="font-black text-sm text-white">
                                                            {style.name}
                                                        </h4>
                                                    </div>
                                                    <span className={`text-[10px] font-bold ${style.textColor}`}>
                                                        {style.badge}
                                                    </span>
                                                </div>
                                            </div>

                                            {isSelected && (
                                                <div className="w-6 h-6 rounded-full bg-emerald-500 text-black flex items-center justify-center font-black shadow-md">
                                                    <Check className="w-3.5 h-3.5" />
                                                </div>
                                            )}
                                        </div>

                                        <p className="text-xs text-slate-400 leading-relaxed">
                                            {style.description}
                                        </p>

                                        <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[11px]">
                                            <span className="text-slate-500 font-medium">
                                                {style.highlight}
                                            </span>
                                            <span className={`font-bold transition-colors ${
                                                isSelected ? 'text-emerald-400' : 'text-slate-400 group-hover:text-white'
                                            }`}>
                                                {isSelected ? '✓ Selecionado' : 'Escolher →'}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Rodapé do Modal */}
                        <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between">
                            <span className="text-xs text-slate-400">
                                Sua preferência é salva automaticamente para as próximas sessões.
                            </span>
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-colors cursor-pointer"
                            >
                                Fechar
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};
