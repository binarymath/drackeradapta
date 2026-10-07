import React, { useState } from 'react';
import { CheckCircle, XCircle, RotateCcw, RotateCw, Eye, EyeOff, Maximize2, Minimize2, Trophy, Type, List, Shuffle, AlignLeft, AlignCenter, AlignRight, AlignJustify, Edit3 } from 'lucide-react';
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

    const containerClass = `fixed z-50 transition-all duration-300 ease-in-out ${
        isCardMinimized 
            ? 'bottom-4 left-4 right-auto top-auto w-auto h-auto' 
            : 'inset-0 flex items-center justify-center p-2 sm:p-3 md:p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in'
    }`;

    const cardWrapperClass = `mx-auto items-stretch transition-all duration-300 ${
        isCardMinimized 
            ? 'hidden' 
            : `flex flex-col lg:flex-row h-[92vh] max-h-[92vh] ${timerViewMode === 'normal' ? 'w-[96vw] max-w-[1560px] gap-2.5 sm:gap-3' : 'w-[90vw] max-w-[1150px] gap-0'}`
    }`;

    return (
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

                {/* CARD PRINCIPAL */}
                <div className="bg-white border-4 border-amber-400 shadow-2xl flex flex-col overflow-hidden transition-all rounded-3xl flex-1 min-w-0 h-full relative">

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

                    {/* Conteudo da aba */}
                    <div className="flex-1 min-h-0 overflow-y-auto bg-slate-50 relative p-4 sm:p-6 space-y-3 flex flex-col justify-between custom-scrollbar">
                        {/* Nome + membros + status */}
                        <div className="flex items-start justify-between gap-2 shrink-0 relative z-10">
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: slot.group.color || '#a855f7' }} />
                                    <span className={`font-black text-slate-800 transition-all ${currentFont.nameClass}`}>{slot.group.name}</span>
                                </div>
                                <div className="text-xs text-slate-500 mt-0.5 ml-5 flex items-center gap-2 flex-wrap">
                                    <span>{(slot.group.members || []).map(m => m.name).join(' \u2022 ') || 'Sem membros'}</span>
                                    
                                    {/* Porta-Voz */}
                                    <div className="flex items-center gap-1.5 ml-2 border-l pl-3 border-slate-300">
                                        {spokespersons[slot.group.id] ? (
                                            <div className="flex items-center gap-1">
                                                <span className="bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-md text-[10px] uppercase">🗣️ Porta-voz:</span>
                                                <span className="font-black text-indigo-700">{spokespersons[slot.group.id].name}</span>
                                                <button type="button" onClick={() => setSpokespersons(prev => { const n = {...prev}; delete n[slot.group.id]; return n; })} className="ml-1 text-slate-400 hover:text-red-500 cursor-pointer"><XCircle className="w-3.5 h-3.5" /></button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-1">
                                                <button 
                                                    type="button" 
                                                    onClick={() => handleDrawSpokesperson(slot.group.id)}
                                                    className="flex items-center gap-1 bg-slate-200 hover:bg-amber-300 text-slate-700 px-2 py-0.5 rounded-md font-bold text-[10px] uppercase transition-all cursor-pointer"
                                                    title="Sortear aleatoriamente"
                                                >
                                                    <Shuffle className="w-3 h-3" /> Sortear
                                                </button>
                                                <select
                                                    className="bg-white border border-slate-300 text-slate-700 text-[10px] font-bold rounded-md px-1 py-0.5 cursor-pointer outline-none"
                                                    onChange={(e) => {
                                                        const mId = e.target.value;
                                                        if (!mId) return;
                                                        const mObj = slot.group.members.find(m => String(m.id) === String(mId));
                                                        if (mObj) setSpokespersons(prev => ({ ...prev, [slot.group.id]: mObj }));
                                                        e.target.value = "";
                                                    }}
                                                    value=""
                                                >
                                                    <option value="" disabled>Ou Escolher...</option>
                                                    {(slot.group.members || []).map(m => (
                                                        <option key={m.id} value={m.id}>{m.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            {isDone ? (
                                <span className={`text-xs font-black px-3 py-1 rounded-full border ${slot.result === 'correct' ? 'bg-emerald-100 text-emerald-700 border-emerald-300' : 'bg-rose-100 text-rose-700 border-rose-300'}`}>
                                    {slot.result === 'correct' ? '✅ Acertou' : '❌ Errou'}
                                </span>
                            ) : (
                                <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2.5 py-1 rounded-full border border-amber-300 animate-pulse">⏳ Pendente</span>
                            )}
                        </div>

                        {/* TEXTO DA PERGUNTA */}
                        <div className="bg-white border border-slate-200 shadow-sm rounded-3xl flex-1 flex flex-col relative z-10 min-h-[300px] overflow-hidden">
                            <div className="absolute top-4 right-4 flex flex-col gap-1 items-end z-20 print:hidden opacity-20 hover:opacity-100 transition-opacity">
                                <div className="inline-flex items-center gap-1 bg-slate-100/90 border border-slate-200 px-1 py-0.5 rounded-xl shadow-2xs">
                                    <button type="button" onClick={() => handleSetAlign('text-left')} className={`w-6 h-6 rounded flex items-center justify-center cursor-pointer transition-colors ${currentTextAlign === 'text-left' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500 hover:bg-white hover:text-slate-700'}`} title="Alinhar à Esquerda"><AlignLeft className="w-3.5 h-3.5" /></button>
                                    <button type="button" onClick={() => handleSetAlign('text-center')} className={`w-6 h-6 rounded flex items-center justify-center cursor-pointer transition-colors ${currentTextAlign === 'text-center' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500 hover:bg-white hover:text-slate-700'}`} title="Centralizar"><AlignCenter className="w-3.5 h-3.5" /></button>
                                    <button type="button" onClick={() => handleSetAlign('text-right')} className={`w-6 h-6 rounded flex items-center justify-center cursor-pointer transition-colors ${currentTextAlign === 'text-right' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500 hover:bg-white hover:text-slate-700'}`} title="Alinhar à Direita"><AlignRight className="w-3.5 h-3.5" /></button>
                                    <button type="button" onClick={() => handleSetAlign('text-justify')} className={`w-6 h-6 rounded flex items-center justify-center cursor-pointer transition-colors ${currentTextAlign === 'text-justify' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500 hover:bg-white hover:text-slate-700'}`} title="Justificar"><AlignJustify className="w-3.5 h-3.5" /></button>
                                    <div className="w-px h-4 bg-slate-300 mx-0.5" />
                                    <button type="button" onClick={handleStartEditing} className="w-6 h-6 rounded flex items-center justify-center cursor-pointer transition-colors text-indigo-600 hover:bg-indigo-100 hover:text-indigo-800" title="Editar esta pergunta"><Edit3 className="w-3.5 h-3.5" /></button>
                                </div>
                            </div>
                            
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 flex flex-col">
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
                                        <div className={`font-black ${currentTextAlign} text-slate-800 ${currentFont.questionClass} ${isLong ? 'leading-snug' : 'leading-tight'} mx-auto max-w-4xl py-2 drop-shadow-sm w-full`}>
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
                                    </div>
                                );
                            })()}
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

                        {/* Botoes de resultado */}
                        <div className="p-4 sm:p-5 bg-slate-100 border-t border-slate-200 flex flex-col gap-3 shrink-0 relative z-10">
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
                                    <button type="button" onClick={() => setShowQuestionSelector(!showQuestionSelector)}
                                        className="px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all cursor-pointer shadow-md active:scale-95 flex items-center gap-1.5" title="Escolher uma pergunta específica">
                                        <List className="w-4 h-4" /><span className="hidden sm:inline">Escolher</span>
                                    </button>
                                    <button type="button" onClick={() => { setShowAnswer(false); setShowQuestionSelector(false); onChangeQuestion(activeTab); }}
                                        className="px-4 py-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold text-xs transition-all cursor-pointer shadow-md active:scale-95 flex items-center gap-1.5" title="Trocar pergunta aleatoriamente">
                                        <RotateCw className="w-4 h-4" /><span className="hidden sm:inline">Trocar</span>
                                    </button>
                                </div>
                            ) : (
                                <p className="text-center text-xs text-slate-500 py-2 font-bold">Resultado registrado. Navegue pelas abas para ver as outras equipes.</p>
                            )}
                        </div>

                        {/* Rodape: status de todas as equipes */}
                        <div className="flex gap-1.5 flex-wrap pt-1 border-t border-white/10 shrink-0">
                            {slots.map((s, i) => (
                                <button key={s.group.id} type="button" onClick={() => handleTabChange(i)}
                                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition-all cursor-pointer ${i === activeTab ? 'bg-indigo-600 text-white border-indigo-700 shadow-sm' : s.result === 'correct' ? 'bg-emerald-100 text-emerald-700 border-emerald-300' : s.result === 'incorrect' ? 'bg-rose-100 text-rose-700 border-rose-300' : 'bg-amber-100 text-amber-700 border-amber-300'}`}>
                                    {s.group.name}: {s.result === 'correct' ? '✅' : s.result === 'incorrect' ? '❌' : '⏳'}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>


                {/* CRONOMETRO BOMBA — acoplado a direita (igual ao RouletteCard) */}
                <div className={timerViewMode === 'normal'
                    ? 'lg:w-[380px] xl:w-[415px] shrink-0 h-full self-stretch flex flex-col animate-in fade-in slide-in-from-right-3 duration-300'
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
        </div>
    );
};
