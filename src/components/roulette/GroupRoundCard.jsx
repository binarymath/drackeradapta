import React, { useState } from 'react';
import { CheckCircle, XCircle, RotateCcw, RotateCw, Eye, EyeOff, Maximize2, Minimize2, Trophy, Type } from 'lucide-react';
import { RouletteTimerBomb } from './RouletteTimerBomb';
import { gameAudio } from '../../utils/gameAudio';

const FONT_LEVELS = [
    { id: 0, label: 'Pequena',           percent: '85%',  questionClass: 'text-lg sm:text-xl',               nameClass: 'text-xl sm:text-2xl' },
    { id: 1, label: 'Normal',            percent: '100%', questionClass: 'text-xl sm:text-2xl',              nameClass: 'text-2xl sm:text-3xl' },
    { id: 2, label: 'Grande',            percent: '125%', questionClass: 'text-2xl sm:text-3xl',             nameClass: 'text-3xl sm:text-4xl' },
    { id: 3, label: 'Muito Grande',      percent: '150%', questionClass: 'text-3xl sm:text-4xl md:text-5xl', nameClass: 'text-4xl sm:text-5xl' },
    { id: 4, label: 'Gigante (Projetor)','percent': '180%',questionClass: 'text-4xl sm:text-5xl md:text-6xl', nameClass: 'text-5xl sm:text-6xl' },
];

export const GroupRoundCard = ({ slots, activeTab, onTabChange, onSlotResult, onChangeQuestion, onClear }) => {
    const [fontLevel, setFontLevel] = useState(() => {
        try { const s = localStorage.getItem('preferred_roulette_card_font_level'); if (s !== null) { const p = parseInt(s, 10); if (!isNaN(p) && p >= 0 && p < FONT_LEVELS.length) return p; } } catch (e) {}
        return 1;
    });
    const [isExpanded, setIsExpanded] = useState(false);
    const [showAnswer, setShowAnswer] = useState(false);
    const [showDifficulty, setShowDifficulty] = useState(false);
    const [timerViewMode, setTimerViewMode] = useState(() => { try { return localStorage.getItem('preferred_roulette_timer_mode') || 'normal'; } catch (e) { return 'normal'; } });

    const currentFont = FONT_LEVELS[fontLevel] || FONT_LEVELS[1];

    const handleIncreaseFont = () => setFontLevel(prev => { const next = Math.min(FONT_LEVELS.length - 1, prev + 1); try { localStorage.setItem('preferred_roulette_card_font_level', String(next)); } catch (e) {} gameAudio.playTick(); return next; });
    const handleDecreaseFont = () => setFontLevel(prev => { const next = Math.max(0, prev - 1); try { localStorage.setItem('preferred_roulette_card_font_level', String(next)); } catch (e) {} gameAudio.playTick(); return next; });
    const handleResetFont = () => { setFontLevel(1); try { localStorage.setItem('preferred_roulette_card_font_level', '1'); } catch (e) {} gameAudio.playTick(); };

    const handleTabChange = (idx) => { setShowAnswer(false); onTabChange(idx); };

    const slot = slots[activeTab];
    if (!slot) return null;
    const isDone = slot.result !== null;
    const respondidas = slots.filter(s => s.result !== null).length;
    const todasRespondidas = respondidas === slots.length;

    const getDifficultyBadge = (diff) => {
        const d = (diff || 'Media').toLowerCase();
        if (d.includes('facil') || d.includes('easy')) return { label: 'Facil', color: 'bg-emerald-100 text-emerald-800 border-emerald-300', dot: 'bg-emerald-500' };
        if (d.includes('dificil') || d.includes('hard')) return { label: 'Dificil', color: 'bg-rose-100 text-rose-800 border-rose-300', dot: 'bg-rose-500' };
        return { label: 'Media', color: 'bg-amber-100 text-amber-800 border-amber-300', dot: 'bg-amber-500' };
    };

    const containerClass = isExpanded
        ? 'fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-[2.5vh] animate-in fade-in duration-200'
        : 'z-10 relative w-full max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-300';

    const cardWrapperClass = isExpanded
        ? 'w-[95vw] h-[95vh] mx-auto flex flex-col lg:flex-row items-stretch gap-2.5'
        : 'w-full flex flex-col';

    return (
        <div className={containerClass}>
            <div className={cardWrapperClass}>

                {/* CARD PRINCIPAL */}
                <div className={`bg-slate-900 border border-purple-500/50 shadow-2xl flex flex-col overflow-hidden transition-all ${isExpanded ? 'rounded-3xl flex-1 min-w-0 h-full' : 'rounded-2xl'}`}>

                    {/* Cabecalho com abas */}
                    <div className="shrink-0 px-4 pt-3 pb-0" style={{ background: 'linear-gradient(135deg, #4a1272 0%, #7c1d6f 100%)' }}>
                        <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                            <span className="text-xs font-black text-purple-200 uppercase tracking-widest flex items-center gap-1.5">
                                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                                Rodada Simultanea &mdash; {respondidas}/{slots.length} respondidas
                            </span>
                            <div className="flex items-center gap-1.5 flex-wrap justify-end">
                                {timerViewMode === 'minimized' && (
                                    <button type="button" onClick={() => { setTimerViewMode('normal'); try { localStorage.setItem('preferred_roulette_timer_mode', 'normal'); } catch (e) {} }}
                                        className="flex items-center gap-1 text-xs font-black text-slate-950 bg-amber-400 hover:bg-amber-300 px-2.5 py-1 rounded-xl transition-all active:scale-95 shadow-xs cursor-pointer" title="Acoplar cronometro">
                                        <span>💣</span><span className="hidden sm:inline">Acoplar Cronometro</span>
                                    </button>
                                )}
                                <div className="flex items-center gap-1 bg-black/25 border border-white/20 rounded-xl px-2 py-1 text-white text-xs" title={`Fonte: ${currentFont.label} (${currentFont.percent})`}>
                                    <Type className="w-3.5 h-3.5 text-white/80" />
                                    <button type="button" onClick={handleDecreaseFont} disabled={fontLevel <= 0} className="w-5 h-5 flex items-center justify-center font-black rounded-lg hover:bg-white/20 active:scale-95 disabled:opacity-30 cursor-pointer">A-</button>
                                    <button type="button" onClick={handleResetFont} className="px-1 py-0.5 rounded text-[11px] font-black bg-white/20 hover:bg-white/30 cursor-pointer">{currentFont.percent}</button>
                                    <button type="button" onClick={handleIncreaseFont} disabled={fontLevel >= FONT_LEVELS.length - 1} className="w-5 h-5 flex items-center justify-center font-black rounded-lg hover:bg-white/20 active:scale-95 disabled:opacity-30 cursor-pointer">A+</button>
                                </div>
                                <button type="button" onClick={() => setShowDifficulty(v => !v)} className="flex items-center gap-1 text-xs font-bold bg-black/25 border border-white/20 hover:bg-black/40 text-white px-2.5 py-1 rounded-xl transition-all cursor-pointer" title={showDifficulty ? 'Ocultar dificuldade' : 'Mostrar dificuldade'}>
                                    {showDifficulty ? <Eye className="w-3.5 h-3.5 text-emerald-300" /> : <EyeOff className="w-3.5 h-3.5 text-slate-400" />}
                                    <span className="hidden sm:inline">Dif.</span>
                                </button>
                                {todasRespondidas && (
                                    <button type="button" onClick={onClear} className="text-xs font-black px-3 py-1 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white transition-all cursor-pointer flex items-center gap-1.5 shadow-md active:scale-95">
                                        <RotateCcw className="w-3.5 h-3.5" /> Encerrar
                                    </button>
                                )}
                                <button type="button" onClick={() => setIsExpanded(v => !v)} className="flex items-center gap-1 text-xs font-black bg-black/25 border border-white/20 hover:bg-black/40 text-white px-2.5 py-1 rounded-xl transition-all cursor-pointer active:scale-95" title={isExpanded ? 'Minimizar card' : 'Expandir para 95% da tela'}>
                                    {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                                    <span className="hidden sm:inline">{isExpanded ? 'Minimizar' : 'Expandir'}</span>
                                </button>
                            </div>
                        </div>
                        {/* Abas */}
                        <div className="flex gap-1 overflow-x-auto pb-0">
                            {slots.map((s, idx) => (
                                <button key={s.group.id} type="button" onClick={() => handleTabChange(idx)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-t-xl text-xs font-black whitespace-nowrap transition-all cursor-pointer border-b-2 ${activeTab === idx ? 'bg-white/15 text-white border-white' : 'bg-transparent text-purple-300 border-transparent hover:bg-white/10 hover:text-white'}`}>
                                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: s.group.color || '#a855f7' }} />
                                    {s.group.name}
                                    {s.result === 'correct' && <span className="text-emerald-400">✅</span>}
                                    {s.result === 'incorrect' && <span className="text-rose-400">❌</span>}
                                    {s.result === null && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Conteudo da aba */}
                    <div className={`flex-1 min-h-0 overflow-y-auto p-4 space-y-3 ${isExpanded ? 'flex flex-col justify-between' : ''}`}>
                        {/* Nome + membros + status */}
                        <div className="flex items-start justify-between gap-2 shrink-0">
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: slot.group.color || '#a855f7' }} />
                                    <span className={`font-black text-white transition-all ${currentFont.nameClass}`}>{slot.group.name}</span>
                                </div>
                                <div className="text-xs text-purple-300 mt-0.5 ml-5">
                                    {(slot.group.members || []).map(m => m.name).join(' \u2022 ') || 'Sem membros'}
                                </div>
                            </div>
                            {isDone ? (
                                <span className={`text-xs font-black px-3 py-1 rounded-full border ${slot.result === 'correct' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-rose-500/20 text-rose-300 border-rose-500/40'}`}>
                                    {slot.result === 'correct' ? '✅ Acertou' : '❌ Errou'}
                                </span>
                            ) : (
                                <span className="text-xs font-bold text-amber-300 bg-amber-500/20 px-2.5 py-1 rounded-full border border-amber-500/30 animate-pulse">⏳ Pendente</span>
                            )}
                        </div>

                        {/* Pergunta */}
                        <div className={`bg-white/5 border border-white/10 rounded-2xl p-4 ${isExpanded ? 'flex-1 flex flex-col justify-center' : ''}`}>
                            <div className="text-[10px] font-bold text-purple-400 uppercase tracking-widest mb-2 flex items-center justify-between">
                                <span>Pergunta</span>
                                <div className="flex items-center gap-2">
                                    {showDifficulty && slot.difficulty && (() => {
                                        const badge = getDifficultyBadge(slot.difficulty);
                                        return (
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border flex items-center gap-1 ${badge.color}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />{badge.label}
                                            </span>
                                        );
                                    })()}
                                </div>
                            </div>
                            <p className={`text-white font-bold leading-snug transition-all ${currentFont.questionClass}`}>{slot.question}</p>
                            <div className="mt-3 pt-3 border-t border-white/10">
                                <div className="flex items-start justify-between gap-2">
                                    {showAnswer && slot.answer ? (
                                        <p className={`text-emerald-300 font-bold leading-snug animate-in fade-in transition-all ${currentFont.questionClass}`}>
                                            &#8627; {slot.answer}
                                        </p>
                                    ) : (
                                        <button type="button" onClick={() => setShowAnswer(true)} disabled={!slot.answer}
                                            className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-emerald-300 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed">
                                            <Eye className="w-3.5 h-3.5" />
                                            {slot.answer ? 'Revelar Resposta' : 'Sem resposta cadastrada'}
                                        </button>
                                    )}
                                    {showAnswer && slot.answer && (
                                        <button type="button" onClick={() => setShowAnswer(false)}
                                            className="shrink-0 flex items-center gap-1 text-[10px] font-bold text-slate-500 hover:text-slate-300 transition-colors cursor-pointer" title="Ocultar resposta">
                                            <EyeOff className="w-3.5 h-3.5" /> Ocultar
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Botoes de resultado */}
                        <div className="shrink-0">
                            {!isDone ? (
                                <div className="flex gap-2">
                                    <button type="button" onClick={() => onSlotResult(activeTab, true)}
                                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-black text-sm transition-all cursor-pointer shadow-md active:scale-95">
                                        <CheckCircle className="w-5 h-5" /> Acertou
                                    </button>
                                    <button type="button" onClick={() => onSlotResult(activeTab, false)}
                                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-black text-sm transition-all cursor-pointer shadow-md active:scale-95">
                                        <XCircle className="w-5 h-5" /> Errou
                                    </button>
                                    <button type="button" onClick={() => { setShowAnswer(false); onChangeQuestion(activeTab); }}
                                        className="px-4 py-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold text-xs transition-all cursor-pointer shadow-md active:scale-95 flex items-center gap-1.5" title="Trocar pergunta desta equipe">
                                        <RotateCw className="w-4 h-4" /><span className="hidden sm:inline">Trocar</span>
                                    </button>
                                </div>
                            ) : (
                                <p className="text-center text-xs text-slate-400 py-2">Resultado registrado. Navegue pelas abas para ver as outras equipes.</p>
                            )}
                        </div>

                        {/* Rodape: status de todas as equipes */}
                        <div className="flex gap-1.5 flex-wrap pt-1 border-t border-white/10 shrink-0">
                            {slots.map((s, i) => (
                                <button key={s.group.id} type="button" onClick={() => handleTabChange(i)}
                                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition-all cursor-pointer ${i === activeTab ? 'bg-white/20 text-white border-white/40' : s.result === 'correct' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : s.result === 'incorrect' ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' : 'bg-amber-500/20 text-amber-300 border-amber-500/30'}`}>
                                    {s.group.name}: {s.result === 'correct' ? '✅' : s.result === 'incorrect' ? '❌' : '⏳'}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>


                {/* CRONOMETRO BOMBA — acoplado a direita (igual ao RouletteCard) */}
                <div className={timerViewMode === 'normal'
                    ? `${isExpanded ? 'lg:w-[380px] xl:w-[415px] shrink-0 h-full self-stretch' : 'w-full'} flex flex-col animate-in fade-in slide-in-from-right-3 duration-300`
                    : 'contents'
                }>
                    <RouletteTimerBomb
                        className="h-full w-full"
                        viewMode={timerViewMode}
                        onViewModeChange={(mode) => {
                            setTimerViewMode(mode);
                            try { localStorage.setItem('preferred_roulette_timer_mode', mode); } catch (e) {}
                        }}
                        onExplode={() => {}}
                    />
                </div>
            </div>
        </div>
    );
};
