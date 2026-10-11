import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle, XCircle, RotateCcw, RotateCw, Eye, EyeOff, Maximize2, Minimize2, Trophy, Type, List, Shuffle, AlignLeft, AlignCenter, AlignRight, AlignJustify, Edit3, HelpCircle } from 'lucide-react';
import { QuestionEditModal } from './card-modals/QuestionEditModal';
import { RouletteTimerBomb } from './RouletteTimerBomb';
import { getDirectImageUrl, handleDriveImageError, renderQuestionText, isYouTubeUrl, getYouTubeEmbedUrl } from "../../utils/urlUtils";
import { gameAudio } from '../../utils/gameAudio';

const FONT_LEVELS = [
    { id: 0, label: 'Pequena',           percent: '85%',  questionClass: 'text-lg sm:text-xl',               nameClass: 'text-xl sm:text-2xl' },
    { id: 1, label: 'Normal',            percent: '100%', questionClass: 'text-xl sm:text-2xl',              nameClass: 'text-2xl sm:text-3xl' },
    { id: 2, label: 'Grande',            percent: '125%', questionClass: 'text-2xl sm:text-3xl',             nameClass: 'text-3xl sm:text-4xl' },
    { id: 3, label: 'Muito Grande',      percent: '150%', questionClass: 'text-3xl sm:text-4xl md:text-5xl', nameClass: 'text-4xl sm:text-5xl' },
    { id: 4, label: 'Gigante (Projetor)','percent': '180%',questionClass: 'text-4xl sm:text-5xl md:text-6xl', nameClass: 'text-5xl sm:text-6xl' },
];

export const GroupRoundCard = ({ slots, activeTab, onTabChange, onSlotResult, onChangeQuestion, onEditQuestionContent, onClear, allQuestions = [], usedQuestions = new Set() }) => {
    const [fontLevel, setFontLevel] = useState(() => {
        try { const s = localStorage.getItem('preferred_roulette_card_font_level'); if (s !== null) { const p = parseInt(s, 10); if (!isNaN(p) && p >= 0 && p < FONT_LEVELS.length) return p; } } catch (e) {}
        return 1;
    });
    const [spokespersons, setSpokespersons] = useState({});
    const [isCardMinimized, setIsCardMinimized] = useState(false);
    const [showAnswer, setShowAnswer] = useState(false);
    const [showDifficulty, setShowDifficulty] = useState(false);
    const [showQuestionSelector, setShowQuestionSelector] = useState(false);
    const [timerViewMode, setTimerViewMode] = useState(() => { try { return localStorage.getItem('preferred_roulette_timer_mode') || 'normal'; } catch (e) { return 'normal'; } });

    const [textAligns, setTextAligns] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('preferred_roulette_question_aligns_v2');
            if (saved) {
                try { return JSON.parse(saved); } catch(e){}
            }
        }
        return {};
    });
    
    const [showQuestionEditModal, setShowQuestionEditModal] = useState(false);

    const currentFont = FONT_LEVELS[fontLevel] || FONT_LEVELS[1];

    
    const handleDrawSpokesperson = (groupId) => {
        const groupSlot = slots.find(s => s.group.id === groupId);
        const members = groupSlot?.group?.members || [];
        if (members.length === 0) return;
        const random = members[Math.floor(Math.random() * members.length)];
        setSpokespersons(prev => ({ ...prev, [groupId]: random }));
        gameAudio.playTick();
    };

    const handleIncreaseFont = () => setFontLevel(prev => { const next = Math.min(FONT_LEVELS.length - 1, prev + 1); try { localStorage.setItem('preferred_roulette_card_font_level', String(next)); } catch (e) {} gameAudio.playTick(); return next; });
    const handleDecreaseFont = () => setFontLevel(prev => { const next = Math.max(0, prev - 1); try { localStorage.setItem('preferred_roulette_card_font_level', String(next)); } catch (e) {} gameAudio.playTick(); return next; });
    const handleResetFont = () => { setFontLevel(1); try { localStorage.setItem('preferred_roulette_card_font_level', '1'); } catch (e) {} gameAudio.playTick(); };

    const slot = slots[activeTab];

    const currentTextAlign = textAligns[slot?.question] || 'text-left';

    const handleSetAlign = (alignClass) => {
        setTextAligns(prev => {
            const next = { ...prev, [slot?.question]: alignClass };
            try { localStorage.setItem('preferred_roulette_question_aligns_v2', JSON.stringify(next)); } catch(e){}
            return next;
        });
        gameAudio.playTick();
    };

    const handleStartEditing = () => {
        setShowQuestionEditModal(true);
    };

    const handleSaveEditing = (updatedQuestionData) => {
        if (onEditQuestionContent) {
            onEditQuestionContent(activeTab, updatedQuestionData);
        }
        setShowQuestionEditModal(false);
    };

    const handleTabChange = (idx) => { setShowAnswer(false); setShowQuestionSelector(false); onTabChange(idx); };
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

    const containerClass = `fixed z-[10000] transition-all duration-300 ease-in-out ${
        isCardMinimized 
            ? 'bottom-4 left-4 right-auto top-auto w-auto h-auto' 
            : 'inset-0 flex items-center justify-center bg-slate-950/75 backdrop-blur-md animate-in fade-in'
    }`;

    const cardWrapperClass = `w-full h-full mx-auto items-stretch transition-all duration-500 ease-out ${
        isCardMinimized 
            ? 'hidden' 
            : `flex flex-col lg:flex-row bg-slate-50 overflow-hidden`
    }`;

    if (typeof document === 'undefined') return null;

    // Portal no body (igual ao RouletteCard): fica acima da arena maximizada e abaixo do painel lateral/modais
    return createPortal(
        <>
        <div className={containerClass}>
            {/* WIDGET MINIMIZADO */}
            {isCardMinimized && (
                <div className="bg-white rounded-2xl shadow-2xl border-4 border-purple-500 p-3 w-[280px] sm:w-[320px] flex flex-col gap-2 animate-in slide-in-from-bottom-5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                            <span className="text-xl leading-none">🎯</span>
                            <div className="flex flex-col min-w-0">
                                <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Rodada Simultânea</span>
                                <span className="text-sm font-black text-slate-800 truncate">{respondidas}/{slots.length} respondidas</span>
                            </div>
                        </div>
                        <button onClick={() => setIsCardMinimized(false)} className="shrink-0 p-1.5 bg-slate-100 hover:bg-purple-100 text-slate-500 hover:text-purple-600 rounded-xl transition-colors cursor-pointer" title="Expandir card">
                            <Maximize2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            <div className={cardWrapperClass}>
                
                {/* 1. CARD PRINCIPAL DA RODADA */}
                <div className="flex-1 min-w-0 h-full overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out relative flex flex-col transition-all bg-white">

                    {/* Cabecalho com abas */}
                    <div className="shrink-0 px-4 pt-3 pb-0 transition-all text-white relative" style={{ background: slot.group.color ? `linear-gradient(135deg, ${slot.group.color} 0%, #1e1b4b 100%)` : 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' }}>
                        <div className="absolute top-0 left-0 w-full h-full opacity-15 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none"></div>
                        <div className="flex items-center justify-between mb-2 flex-wrap gap-2 relative z-10">
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
                                {onClear && (
                                    <button type="button" onClick={onClear} className="flex items-center gap-1 text-xs font-black bg-black/25 border border-white/20 hover:bg-red-500/60 hover:border-red-400/50 text-white px-2.5 py-1 rounded-xl transition-all cursor-pointer active:scale-95 shadow-xs backdrop-blur-xs" title="Fechar card">
                                        <XCircle className="w-3.5 h-3.5" />
                                        <span className="hidden sm:inline">Fechar</span>
                                    </button>
                                )}
                                <button type="button" onClick={() => setIsCardMinimized(true)} className="flex items-center gap-1 text-xs font-black bg-black/25 border border-white/20 hover:bg-black/40 text-white px-2.5 py-1 rounded-xl transition-all cursor-pointer active:scale-95 shadow-xs backdrop-blur-xs" title="Minimizar card">
                                    <Minimize2 className="w-3.5 h-3.5 text-amber-200" />
                                    <span className="hidden sm:inline">Minimizar</span>
                                </button>
                            </div>
                        </div>
                        {/* Abas */}
                        <div className="flex gap-1 overflow-x-auto pb-0">
                            {slots.map((s, idx) => (
                                <button key={s.group.id} type="button" onClick={() => handleTabChange(idx)}
                                    className={`relative z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-t-xl text-xs font-black whitespace-nowrap transition-all cursor-pointer border-b-2 ${activeTab === idx ? 'bg-white text-slate-900 border-white shadow-sm' : 'bg-transparent text-white/70 border-transparent hover:bg-white/10 hover:text-white'}`}>
                                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: s.group.color || '#a855f7' }} />
                                    {s.group.name}
                                    {s.result === 'correct' && <span className="text-emerald-400">✅</span>}
                                    {s.result === 'incorrect' && <span className="text-rose-400">❌</span>}
                                    {s.result === null && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Conteudo da aba (SCROLLÁVEL) */}
                    <div className="p-6 sm:p-8 overflow-y-auto bg-transparent flex-1 custom-scrollbar w-full pb-36">
                        <div className={`mx-auto w-full transition-all duration-500 flex flex-col space-y-6`}>
                        <div className="flex flex-col gap-3 w-full shrink-0 relative z-10">
                            <div className="flex items-start justify-between gap-2 flex-wrap">
                                <div className="flex items-center gap-2">
                                    <span className="w-4 h-4 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: slot.group.color || '#a855f7' }} />
                                    <span className={`font-black text-slate-800 transition-all ${currentFont.nameClass}`}>{slot.group.name}</span>
                                </div>
                                {isDone ? (
                                    <span className={`text-xs font-black px-4 py-1.5 rounded-full border shadow-sm ${slot.result === 'correct' ? 'bg-emerald-100 text-emerald-700 border-emerald-300' : 'bg-rose-100 text-rose-700 border-rose-300'}`}>
                                        {slot.result === 'correct' ? '✅ Acertou' : '❌ Errou'}
                                    </span>
                                ) : (
                                    <span className="text-xs font-bold text-amber-700 bg-amber-100 px-4 py-1.5 rounded-full border border-amber-300 animate-pulse shadow-sm">⏳ Pendente</span>
                                )}
                            </div>
                            
                            <div className="flex flex-wrap items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100 w-full shadow-inner">
                                <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mr-1 shrink-0">Integrantes:</span>
                                {(slot.group.members || []).length === 0 ? (
                                    <span className="text-xs text-slate-400 italic">Sem membros atribuídos a esta equipe</span>
                                ) : (
                                    [...slot.group.members].sort((a, b) => a.name.localeCompare(b.name)).map(member => {
                                        const isRep = spokespersons[slot.group.id]?.id === member.id;
                                        return (
                                            <button 
                                                key={member.id} 
                                                type="button" 
                                                onClick={() => {
                                                    if (isRep) {
                                                        setSpokespersons(prev => { const n = {...prev}; delete n[slot.group.id]; return n; });
                                                    } else {
                                                        setSpokespersons(prev => ({ ...prev, [slot.group.id]: member }));
                                                    }
                                                }} 
                                                className={`text-xs font-bold px-3 py-1.5 rounded-full border transition-all cursor-pointer flex items-center gap-1 ${isRep ? 'bg-amber-100 text-amber-900 border-amber-300 font-black shadow-xs scale-105' : 'bg-white hover:bg-slate-100 text-slate-600 border-slate-200 shadow-sm'}`}
                                            >
                                                {isRep && <span>⭐</span>}<span>{member.name}</span>
                                            </button>
                                        );
                                    })
                                )}
                                <div className="ml-auto flex items-center gap-2 border-l border-slate-200 pl-3 shrink-0">
                                    <button type="button" onClick={() => setSpokespersons(prev => { const n = {...prev}; delete n[slot.group.id]; return n; })} className={`text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${!spokespersons[slot.group.id] ? 'bg-slate-800 text-white shadow-xs' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}>👥 Grupo Todo</button>
                                    <button type="button" disabled={!slot.group.members || slot.group.members.length === 0} onClick={() => handleDrawSpokesperson(slot.group.id)} className="flex items-center gap-1 text-[10px] font-bold bg-amber-400 hover:bg-amber-300 text-slate-900 px-2.5 py-1.5 rounded-lg transition-all shadow-xs cursor-pointer disabled:opacity-50"><Shuffle className="w-3 h-3" /><span>Sortear</span></button>
                                </div>
                            </div>
                        </div>

                        <div className="w-full h-px bg-slate-200 shrink-0 mb-2"></div>

                        {/* PERGUNTA */}
                        <div className="flex-1 flex flex-col text-center relative w-full px-1">
                            {/* Barra de Controles da Pergunta */}
                            <div className="flex items-center justify-between mb-3 flex-wrap gap-2 print:hidden w-full max-w-[95%] mx-auto">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <div className="inline-flex items-center justify-center gap-1.5 text-indigo-600 font-bold bg-indigo-50 px-3.5 py-1 rounded-full border border-indigo-100 text-xs">
                                        <HelpCircle className="w-4 h-4" />
                                        <span>Pergunta da Equipe</span>
                                    </div>

                                    {/* Ajuste de Fonte Rápido direto no card de pergunta */}
                                    <div className="inline-flex items-center gap-1 bg-slate-100/90 border border-slate-200 px-2 py-0.5 rounded-xl shadow-2xs">
                                        <span className="text-[11px] font-bold text-slate-500">Fonte:</span>
                                        <button
                                            type="button"
                                            onClick={handleDecreaseFont}
                                            disabled={fontLevel <= 0}
                                            className="w-5 h-5 rounded flex items-center justify-center text-xs font-black text-slate-700 hover:bg-white active:scale-90 disabled:opacity-30 cursor-pointer"
                                            title="Diminuir fonte (A-)"
                                        >
                                            A-
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleResetFont}
                                            className="px-1.5 text-[11px] font-bold text-indigo-700 hover:bg-white rounded cursor-pointer"
                                            title="Tamanho padrão"
                                        >
                                            {currentFont.percent}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleIncreaseFont}
                                            disabled={fontLevel >= FONT_LEVELS.length - 1}
                                            className="w-5 h-5 rounded flex items-center justify-center text-xs font-black text-slate-700 hover:bg-white active:scale-90 disabled:opacity-30 cursor-pointer"
                                            title="Aumentar fonte (A+)"
                                        >
                                            A+
                                        </button>
                                    </div>
                                    
                                    {/* Ajuste de Alinhamento e Edição */}
                                    <div className="inline-flex items-center gap-1 bg-slate-100/90 border border-slate-200 px-1 py-0.5 rounded-xl shadow-2xs">
                                        <button type="button" onClick={() => handleSetAlign('text-left')} className={`w-6 h-6 rounded flex items-center justify-center cursor-pointer transition-colors ${currentTextAlign === 'text-left' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500 hover:bg-white hover:text-slate-700'}`} title="Alinhar à Esquerda"><AlignLeft className="w-3.5 h-3.5" /></button>
                                        <button type="button" onClick={() => handleSetAlign('text-center')} className={`w-6 h-6 rounded flex items-center justify-center cursor-pointer transition-colors ${currentTextAlign === 'text-center' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500 hover:bg-white hover:text-slate-700'}`} title="Centralizar"><AlignCenter className="w-3.5 h-3.5" /></button>
                                        <button type="button" onClick={() => handleSetAlign('text-right')} className={`w-6 h-6 rounded flex items-center justify-center cursor-pointer transition-colors ${currentTextAlign === 'text-right' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500 hover:bg-white hover:text-slate-700'}`} title="Alinhar à Direita"><AlignRight className="w-3.5 h-3.5" /></button>
                                        <button type="button" onClick={() => handleSetAlign('text-justify')} className={`w-6 h-6 rounded flex items-center justify-center cursor-pointer transition-colors ${currentTextAlign === 'text-justify' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500 hover:bg-white hover:text-slate-700'}`} title="Justificar"><AlignJustify className="w-3.5 h-3.5" /></button>
                                        <div className="w-px h-4 bg-slate-300 mx-0.5" />
                                        <button type="button" onClick={handleStartEditing} className="w-6 h-6 rounded flex items-center justify-center cursor-pointer transition-colors text-indigo-600 hover:bg-indigo-100 hover:text-indigo-800" title="Editar esta pergunta"><Edit3 className="w-3.5 h-3.5" /></button>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex flex-col w-full h-full">
                                {(() => {
                                    const isLong = (slot.question || '').length > 150;
                                    return (
                                        <div className="relative my-auto w-full pt-8 sm:pt-4">
                                        {slot.imageUrl && !(slot.question || '').match(/\[img/i) && (
                                            <div className="mb-4 flex justify-center w-full">
                                                {isYouTubeUrl(slot.imageUrl) ? (
                                                    <iframe
                                                        src={getYouTubeEmbedUrl(slot.imageUrl)}
                                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                        allowFullScreen
                                                        className="aspect-video w-full max-w-2xl rounded-xl border-2 border-slate-200 shadow-sm"
                                                    />
                                                ) : (
                                                    <img 
                                                        src={getDirectImageUrl(slot.imageUrl)} 
                                                        alt="" 
                                                        className="max-h-48 rounded-xl border-2 border-slate-200 shadow-sm object-contain"
                                                        referrerPolicy="no-referrer"
                                                        onError={handleDriveImageError}
                                                    />
                                                )}
                                            </div>
                                        )}
                                        <div className={`font-black ${currentTextAlign} text-slate-800 ${currentFont.questionClass} ${isLong ? 'leading-snug' : 'leading-tight'} mx-auto w-full max-w-[95%] py-2 drop-shadow-sm`}>
                                            {(slot.question || '').split('\n').map((line, idx) => {
                                                let lineAlign = currentTextAlign;
                                                let content = line;

                                                if (content.trim().startsWith('[C]')) {
                                                    lineAlign = 'text-center';
                                                    content = content.replace('[C]', '');
                                                } else if (content.trim().startsWith('[R]')) {
                                                    lineAlign = 'text-right';
                                                    content = content.replace('[R]', '');
                                                } else if (content.trim().startsWith('[L]')) {
                                                    lineAlign = 'text-left';
                                                    content = content.replace('[L]', '');
                                                } else if (content.trim().startsWith('[J]')) {
                                                    lineAlign = 'text-justify';
                                                    content = content.replace('[J]', '');
                                                }

                                                return (
                                                    <div key={idx} className={`${lineAlign} min-h-[1.5em] break-words`}>
                                                        {renderQuestionText(content, slot.imageUrl)}
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* ALTERNATIVAS DE MÚLTIPLA ESCOLHA */}
                                        {slot.options && Array.isArray(slot.options) && slot.options.length > 0 && (
                                            <div className="mt-4 pt-3 mx-auto w-full max-w-[95%] text-left">
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-1">
                                                    {slot.options.map((opt, oi) => (
                                                        <div 
                                                            key={oi}
                                                            className={`p-3 rounded-xl border border-indigo-100 bg-indigo-50 text-[1em] sm:text-[1.125em] font-medium text-slate-800 flex items-start gap-3 transition-all shadow-sm`}
                                                        >
                                                            <span className="w-7 h-7 rounded-md bg-indigo-600 text-white font-black flex items-center justify-center text-sm shrink-0 shadow-sm mt-0.5">
                                                                {String.fromCharCode(65 + oi)}
                                                            </span>
                                                            <span className="leading-snug pt-1">{opt}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* GABARITO / RESPOSTA */}
                                        {slot.answer && (
                                            <div className="mt-6 pt-4 border-t border-slate-100 mx-auto w-full max-w-[95%] text-left">
                                                <button
                                                    onClick={() => {
                                                        setShowAnswer(!showAnswer);
                                                        gameAudio.playTick();
                                                    }}
                                                    className="inline-flex items-center justify-center gap-2 text-sm font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-4 py-2 rounded-full transition-colors border border-emerald-200 cursor-pointer shadow-sm active:scale-95"
                                                >
                                                    {showAnswer ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                    {showAnswer ? 'Ocultar Resposta' : 'Ver Resposta Esperada'}
                                                </button>
                                                
                                                {showAnswer && (
                                                    <div className="mt-4 p-4 sm:p-5 bg-emerald-50 border-2 border-emerald-200 rounded-2xl animate-in slide-in-from-top-2 fade-in duration-200 text-left shadow-sm">
                                                        <div className="text-xs font-black uppercase tracking-wider text-emerald-700 mb-2 flex items-center gap-1.5">
                                                            <CheckCircle className="w-4 h-4" /> Resposta Correta:
                                                        </div>
                                                        <p className={`text-emerald-900 font-bold text-[1.125em] sm:text-[1.25em] transition-all whitespace-pre-wrap`}>
                                                            {slot.answer}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })()}
                                </div>
                            </div>
                        </div>

                        {/* PAINEL INFERIOR COM BOTÕES E RODAPÉ (FIXO NA ÁREA SCROLLÁVEL) */}
                        <div className="w-full transition-all duration-500 mt-6 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col gap-3 shrink-0">
                            <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
                                <div className="text-xs font-bold text-slate-500 flex items-center gap-1.5 uppercase tracking-wider">
                                    <span>Pontuar a Equipe</span>
                                    <span className="text-indigo-600 font-black">{slot.group.name}</span>
                                </div>
                                
                                <div className="flex items-center gap-2 w-full sm:w-auto">
                                    <button type="button" onClick={() => onSlotResult(activeTab, true)}
                                        className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-6 py-2.5 font-black text-sm rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer ${
                                            slot.result === 'correct'
                                                ? 'bg-emerald-500 text-white shadow-emerald-500/30 ring-2 ring-emerald-500 ring-offset-2'
                                                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-500 hover:text-white border border-emerald-200'
                                        }`}>
                                        <CheckCircle className="w-4 h-4" /> Acertou
                                    </button>

                                    <button type="button" onClick={() => onSlotResult(activeTab, false)}
                                        className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-6 py-2.5 font-black text-sm rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer ${
                                            slot.result === 'incorrect'
                                                ? 'bg-rose-500 text-white shadow-rose-500/30 ring-2 ring-rose-500 ring-offset-2'
                                                : 'bg-rose-50 text-rose-700 hover:bg-rose-500 hover:text-white border border-rose-200'
                                        }`}>
                                        <XCircle className="w-4 h-4" /> Errou
                                    </button>

                                    <div className="w-px h-8 bg-slate-200 hidden sm:block mx-1"></div>

                                    <button type="button" onClick={() => setShowQuestionSelector(!showQuestionSelector)}
                                        className="px-4 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white border border-indigo-200 font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 active:scale-95" title="Escolher uma pergunta específica">
                                        <List className="w-4 h-4" /><span className="hidden sm:inline">Escolher</span>
                                    </button>
                                    <button type="button" onClick={() => { 
                                        setShowAnswer(false); 
                                        setShowQuestionSelector(false); 
                                        
                                        const available = allQuestions.filter(q => !usedQuestions.has(q.question) && q.question !== slot.question);
                                        const pool = available.length > 0 ? available : allQuestions.filter(q => q.question !== slot.question);
                                        if (pool.length > 0) {
                                            const randomQ = pool[Math.floor(Math.random() * pool.length)];
                                            onChangeQuestion(activeTab, randomQ);
                                            gameAudio.playTick();
                                        }
                                    }}
                                        className="px-4 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-700 text-slate-700 hover:text-white border border-slate-200 font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 active:scale-95" title="Trocar pergunta aleatoriamente">
                                        <RotateCw className="w-4 h-4" /><span className="hidden sm:inline">Trocar</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Dropdown Seletor de Pergunta */}
                        {showQuestionSelector && (
                            <div className="bg-indigo-50/95 border-2 border-indigo-500 p-4 max-h-56 overflow-y-auto space-y-2 animate-in slide-in-from-bottom-3 duration-200 rounded-xl shadow-2xl shrink-0 mt-2">
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className="text-xs font-black text-indigo-900 uppercase tracking-wider">
                                        Escolha uma pergunta para {slot.group.name}:
                                    </h4>
                                    <button 
                                        onClick={() => setShowQuestionSelector(false)}
                                        className="text-xs font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                                    >
                                        Fechar ✕
                                    </button>
                                </div>
                                <div className="grid grid-cols-1 gap-1.5">
                                    {allQuestions.map((q, idx) => {
                                        const isCurrent = q.question === slot.question;
                                        const isUsed = usedQuestions.has(q.question);
                                        return (
                                            <button
                                                key={idx}
                                                onClick={() => {
                                                    onChangeQuestion(activeTab, q);
                                                    setShowAnswer(false);
                                                    setShowQuestionSelector(false);
                                                    gameAudio.playTick();
                                                }}
                                                className={`text-left p-2.5 rounded-xl text-xs font-medium transition-all flex items-start justify-between gap-3 border cursor-pointer ${
                                                    isCurrent 
                                                    ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs' 
                                                    : isUsed 
                                                    ? 'bg-white/70 text-slate-500 border-slate-200 hover:bg-white' 
                                                    : 'bg-white text-slate-800 border-indigo-100 hover:border-indigo-300 shadow-2xs hover:bg-indigo-50/50'
                                                }`}
                                            >
                                                <div className="flex items-start gap-2">
                                                    <span className={`font-black shrink-0 ${isCurrent ? 'text-indigo-200' : 'text-indigo-600'}`}>
                                                        #{idx + 1}
                                                    </span>
                                                    <span className="line-clamp-2">{q.question}</span>
                                                </div>
                                                <div className="shrink-0 flex items-center gap-1.5">
                                                    {(() => {
                                                        const badge = getDifficultyBadge(q.difficulty);
                                                        return (
                                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${badge.color}`}>
                                                                {badge.label}
                                                            </span>
                                                        );
                                                    })()}
                                                    {isUsed && !isCurrent && (
                                                        <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-bold">
                                                            Usada
                                                        </span>
                                                    )}
                                                    {isCurrent && (
                                                        <span className="text-[10px] bg-indigo-500 text-white px-1.5 py-0.5 rounded font-black">
                                                            Atual
                                                        </span>
                                                    )}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Rodape extra: status de todas as equipes */}
                        <div className="flex justify-center mt-2">
                            <div className="flex gap-1.5 flex-wrap p-2 rounded-xl border border-slate-200 bg-white shadow-xs">
                                {slots.map((s, i) => (
                                    <button key={s.group.id} type="button" onClick={() => handleTabChange(i)}
                                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition-all cursor-pointer ${i === activeTab ? 'bg-indigo-600 text-white border-indigo-700 shadow-sm' : s.result === 'correct' ? 'bg-emerald-100 text-emerald-700 border-emerald-300' : s.result === 'incorrect' ? 'bg-rose-100 text-rose-700 border-rose-300' : 'bg-amber-100 text-amber-700 border-amber-300'}`}>
                                        {s.group.name}: {s.result === 'correct' ? '✅' : s.result === 'incorrect' ? '❌' : '⏳'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        </div>
                    </div>
                </div>

                {/* CRONOMETRO BOMBA — acoplado a direita (igual ao RouletteCard) */}
                <div className={timerViewMode === 'normal'
                    ? 'w-full lg:w-[340px] xl:w-[380px] 2xl:w-[410px] shrink-0 h-full self-stretch flex flex-col animate-in fade-in slide-in-from-right-3 duration-300 bg-slate-900 border-l border-slate-200/20 relative z-40'
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

            <QuestionEditModal 
                show={showQuestionEditModal}
                onClose={() => setShowQuestionEditModal(false)}
                questionData={slot}
                onSave={handleSaveEditing}
            />
        </>,
        document.body
    );
};
