import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Flame, Volume2, VolumeX, AlertTriangle, Sparkles, Clock, History, Maximize2, Minimize2, Minus, XCircle, X } from 'lucide-react';
import confetti from 'canvas-confetti';
import { gameAudio } from '../../utils/gameAudio';
import { RouletteBackgroundMusic } from './RouletteBackgroundMusic';
import { formatClock } from '../../utils/time';

export const RouletteTimerBomb = ({ 
    theme = null,
    onExplode = null,
    className = "",
    viewMode: externalViewMode = null,
    onViewModeChange = null,
    isDocked = false,
    onClose = null
}) => {
    // Configurações do Tempo
    const [duration, setDuration] = useState(30); // Duração total configurada (segundos)
    const [timeLeft, setTimeLeft] = useState(30);  // Tempo restante atual
    const [isRunning, setIsRunning] = useState(false); // Inicia parado por padrão (acionado pelo usuário)
    const [isExploded, setIsExploded] = useState(false);
    const [showFlash, setShowFlash] = useState(false);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [customInput, setCustomInput] = useState('');
    const [showCustomInput, setShowCustomInput] = useState(false);
    const [restartCounter, setRestartCounter] = useState(0);
    const [tickEnabled, setTickEnabled] = useState(() => {
        try { return localStorage.getItem('roulette_tick_enabled') !== 'false'; } catch(e) { return true; }
    });

    useEffect(() => {
        try { localStorage.setItem('roulette_tick_enabled', tickEnabled.toString()); } catch(e) {}
    }, [tickEnabled]);

    // Formato do tempo: 'mm_ss' (minutos e segundos) ou 'seconds' (apenas segundos)
    const [timeFormat, setTimeFormat] = useState(() => {
        try { return localStorage.getItem('roulette_timer_format') || 'mm_ss'; } catch(e) { return 'mm_ss'; }
    });

    const toggleTimeFormat = () => {
        setTimeFormat(prev => {
            const next = prev === 'mm_ss' ? 'seconds' : 'mm_ss';
            try { localStorage.setItem('roulette_timer_format', next); } catch(e) {}
            return next;
        });
    };

    const renderTime = (sec) => {
        if (timeFormat === 'seconds') {
            return `${Math.max(0, sec)}s`;
        }
        return formatClock(sec);
    };

    // Modo de Exibição do Tempo: 'remaining' (tempo restante) ou 'elapsed' (tempo já decorrido)
    const [timeDisplayType, setTimeDisplayType] = useState(() => {
        try { return localStorage.getItem('roulette_timer_display_type') || 'remaining'; } catch(e) { return 'remaining'; }
    });

    const toggleTimeDisplayType = () => {
        setTimeDisplayType(prev => {
            const next = prev === 'remaining' ? 'elapsed' : 'remaining';
            try { localStorage.setItem('roulette_timer_display_type', next); } catch(e) {}
            return next;
        });
    };

    const elapsedTime = Math.max(0, duration - timeLeft);
    const activeDisplayTime = timeDisplayType === 'elapsed' ? elapsedTime : timeLeft;

    // Modo de Exibição: 'normal' (como está) | 'minimized' (separado no canto) | 'maximized' (destaque grande)
    const [internalViewMode, setInternalViewMode] = useState(() => {
        try {
            return localStorage.getItem('preferred_roulette_timer_mode') || 'normal';
        } catch (e) {
            return 'normal';
        }
    });

    const viewMode = externalViewMode !== null ? externalViewMode : internalViewMode;

    const changeViewMode = (mode) => {
        setInternalViewMode(mode);
        try {
            localStorage.setItem('preferred_roulette_timer_mode', mode);
        } catch (e) {}
        if (onViewModeChange) {
            onViewModeChange(mode);
        }
    };

    const intervalRef = useRef(null);

    // Efeito do Cronômetro
    useEffect(() => {
        if (isRunning && timeLeft > 0) {
            intervalRef.current = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        // Tempo esgotou -> EXPLOSÃO COLOSSAL DA BOMBA!
                        triggerExplosionEffects();
                        return 0;
                    }
                    // Tic-tac urgente nos últimos 5 segundos
                    if (prev <= 6 && soundEnabled && tickEnabled) {
                        gameAudio.playBombTick(true);
                    } else if (soundEnabled && tickEnabled) {
                        gameAudio.playBombTick(false);
                    }
                    return prev - 1;
                });
            }, 1000);
        } else {
            if (intervalRef.current) clearInterval(intervalRef.current);
        }

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [isRunning, timeLeft, soundEnabled, onExplode]);

    // Iniciar ou Pausar manualmente
    const handleTogglePlay = () => {
        if (isExploded) {
            // Se explodiu, reiniciar e já começar a rodar
            setIsExploded(false);
            setTimeLeft(duration);
            setIsRunning(true);
            setRestartCounter(c => c + 1);
            if (soundEnabled) gameAudio.playTick();
            return;
        }
        if (timeLeft === 0) {
            setTimeLeft(duration);
        }
        setIsRunning(prev => !prev);
        if (soundEnabled) gameAudio.playTick();
    };

    // Reiniciar
    const handleReset = () => {
        setIsRunning(false);
        setIsExploded(false);
        setTimeLeft(duration);
        if (soundEnabled) gameAudio.playTick();
    };

    // Selecionar duração predefinida
    const handleSelectDuration = (seconds) => {
        setIsRunning(false);
        setIsExploded(false);
        setDuration(seconds);
        setTimeLeft(seconds);
        if (soundEnabled) gameAudio.playTick();
    };

    // Formata segundos totais em MM:SS
    // Formata segundos em texto legível (ex: 1m 30s)
    const formatTimeDetailed = (totalSeconds) => {
        const safeTotal = Math.max(0, totalSeconds || 0);
        const mins = Math.floor(safeTotal / 60);
        const secs = safeTotal % 60;
        if (mins > 0 && secs > 0) return `${mins}m ${secs}s`;
        if (mins > 0) return `${mins} min`;
        return `${secs}s`;
    };

    // Ajuste de tempo (em segundos ou minutos)
    const handleAdjustTime = (deltaSeconds) => {
        setIsRunning(false);
        setIsExploded(false);
        const next = Math.max(5, Math.min(600, duration + deltaSeconds));
        setDuration(next);
        setTimeLeft(next);
        if (soundEnabled) gameAudio.playTick();
    };

    // Submissão de tempo personalizado
    const handleCustomSubmit = (e) => {
        e.preventDefault();
        const trimmed = customInput.trim();
        let totalSec = 0;
        if (trimmed.includes(':')) {
            const parts = trimmed.split(':');
            const m = parseInt(parts[0], 10) || 0;
            const s = parseInt(parts[1], 10) || 0;
            totalSec = (m * 60) + s;
        } else {
            const parsed = parseInt(trimmed, 10);
            totalSec = isNaN(parsed) ? 0 : parsed;
        }
        if (totalSec > 0 && totalSec <= 600) {
            handleSelectDuration(totalSec);
            setShowCustomInput(false);
            setCustomInput('');
        }
    };

    // Sincronizar tempo da bomba com a duração da música
    const handleSyncMusicDuration = (syncData) => {
        if (!syncData) return;
        
        if (syncData.action === 'togglePlay') {
            if (isExploded) {
                setIsExploded(false);
                setTimeLeft(duration);
                setIsRunning(true);
                setRestartCounter(c => c + 1);
            } else {
                setIsRunning(prev => !prev);
            }
            return;
        }

        if (syncData.action === 'music_ended') {
            setTimeLeft(0);
            triggerExplosionEffects();
            return;
        }

        if (syncData.action === 'sync_time') {
            if (typeof syncData.remaining === 'number' && !isExploded) {
                setTimeLeft(Math.max(0, syncData.remaining));
                if (syncData.remaining <= 0) {
                    triggerExplosionEffects();
                }
            }
            return;
        }

        if (syncData.action === 'sync_on' || syncData.duration) {
            setIsRunning(syncData.isPlaying);
            setIsExploded(false);
            
            // Somente seta duração e timeLeft de novo se a música mudou ou for inicio
            if (duration !== syncData.duration || timeLeft === 0) {
                setDuration(syncData.duration);
                setTimeLeft(syncData.duration);
            }
        }
    };

    // Gatilho Completo da Explosão Surpreendente (Áudio + Visual + Estilhaços)
    const triggerExplosionEffects = () => {
        setIsRunning(false);
        setIsExploded(true);
        setShowFlash(true);
        setTimeout(() => setShowFlash(false), 950);

        if (soundEnabled) {
            gameAudio.playExplosion();
        }

        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            try {
                navigator.vibrate([120, 60, 450, 100, 700]);
            } catch (e) {}
        }

        try {
            confetti({
                particleCount: 110,
                spread: 110,
                startVelocity: 55,
                ticks: 240,
                origin: { y: 0.5 },
                colors: ['#ef4444', '#f97316', '#fbbf24', '#ffffff', '#7f1d1d', '#000000']
            });

            setTimeout(() => {
                confetti({
                    particleCount: 65,
                    angle: 60,
                    spread: 85,
                    startVelocity: 45,
                    origin: { x: 0.2, y: 0.5 },
                    colors: ['#dc2626', '#ea580c', '#facc15']
                });
                confetti({
                    particleCount: 65,
                    angle: 120,
                    spread: 85,
                    startVelocity: 45,
                    origin: { x: 0.8, y: 0.5 },
                    colors: ['#dc2626', '#ea580c', '#facc15']
                });
            }, 140);
        } catch (e) {}

        if (onExplode) onExplode();
    };

    // Ação Explícita: "Não Soube Responder / Detonar Bomba"
    const handleManualExplode = () => {
        setTimeLeft(0);
        triggerExplosionEffects();
    };

    // Porcentagens: restante e decorrida
    const remainingPercent = duration > 0 ? (timeLeft / duration) * 100 : 0;
    const elapsedPercent = duration > 0 ? (elapsedTime / duration) * 100 : 0;
    const progressPercent = remainingPercent; // Física e animação do pavio (queima até 0)
    const displayedPercent = timeDisplayType === 'elapsed' ? elapsedPercent : remainingPercent;
    const isCritical = timeLeft <= 10 && timeLeft > 0;

    // Arraste interativo da Barra de Pavio (Time Scrubber / Slider)
    const [isDraggingFuse, setIsDraggingFuse] = useState(false);
    const [musicSeekTarget, setMusicSeekTarget] = useState(null);
    const fuseTrackRef = useRef(null);
    const maxFuseTrackRef = useRef(null);
    const minFuseTrackRef = useRef(null);

    const handleScrubTime = (clientX, trackEl) => {
        if (!trackEl || duration <= 0) return;
        const rect = trackEl.getBoundingClientRect();
        if (rect.width <= 0) return;
        const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
        const newSeconds = Math.round(ratio * duration);

        if (newSeconds > 0 && isExploded) {
            setIsExploded(false);
        }
        setTimeLeft(newSeconds);

        // Ao mover o slider, seek no tempo exato da música (tempo decorrido = duração - tempo restante)
        const targetAudioSeconds = Math.max(0, duration - newSeconds);
        setMusicSeekTarget({ time: targetAudioSeconds, id: Date.now() });

        if (newSeconds === 0 && !isExploded) {
            handleManualExplode();
        }
    };

    const handleFusePointerDown = (e, trackEl) => {
        if (e.button !== 0 && e.pointerType === 'mouse') return;
        setIsDraggingFuse(true);
        try {
            e.currentTarget.setPointerCapture(e.pointerId);
        } catch (err) {}
        handleScrubTime(e.clientX, trackEl);
    };

    const handleFusePointerMove = (e, trackEl) => {
        if (!isDraggingFuse) return;
        handleScrubTime(e.clientX, trackEl);
    };

    const handleFusePointerUp = (e) => {
        if (isDraggingFuse) {
            setIsDraggingFuse(false);
            try {
                e.currentTarget.releasePointerCapture(e.pointerId);
            } catch (err) {}
        }
    };

    const handleFuseKeyDown = (e) => {
        if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
            e.preventDefault();
            const step = e.shiftKey ? 5 : 1;
            const next = Math.max(0, timeLeft - step);
            setTimeLeft(next);
            setMusicSeekTarget({ time: Math.max(0, duration - next), id: Date.now() });
            if (next === 0) handleManualExplode();
        } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
            e.preventDefault();
            const step = e.shiftKey ? 5 : 1;
            const next = Math.min(duration, timeLeft + step);
            if (isExploded) setIsExploded(false);
            setTimeLeft(next);
            setMusicSeekTarget({ time: Math.max(0, duration - next), id: Date.now() });
        }
    };

    // =========================================================================
    // MODO 1: MINIMIZADO (BARRA ACOPLADA OU WIDGET FLUTUANTE)
    // =========================================================================
    if (viewMode === 'minimized') {
        if (isDocked) {
            return (
                <div className="w-full relative select-none animate-in fade-in duration-200">
                    {/* Clarão Cegante de Detonação */}
                    {showFlash && (
                        <div className="fixed inset-0 z-50 rounded-3xl bg-gradient-to-r from-orange-400 via-white to-red-500 animate-explosion-flash pointer-events-none mix-blend-screen" />
                    )}

                    {/* Ondas de Choque Concêntricas */}
                    {isExploded && (
                        <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-20 overflow-hidden">
                            <div className="w-32 h-32 rounded-full border-4 border-red-500 shadow-[0_0_35px_#ef4444] animate-shockwave-ring" />
                            <div className="w-32 h-32 rounded-full border-4 border-orange-400 shadow-[0_0_25px_#f97316] animate-shockwave-ring" style={{ animationDelay: '0.15s' }} />
                        </div>
                    )}

                    <div className={`w-full rounded-2xl sm:rounded-3xl border-2 p-3 sm:p-4 backdrop-blur-xl shadow-xl transition-all duration-300 flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 text-white overflow-hidden relative ${
                        isExploded 
                            ? 'bg-red-950/95 border-red-500 shadow-[0_0_35px_rgba(239,68,68,0.7)] animate-violent-shake' 
                            : isCritical
                                ? 'bg-slate-950/95 border-red-500 shadow-[0_0_25px_rgba(239,68,68,0.5)] animate-pulse'
                                : 'bg-slate-900 border-amber-400/90 shadow-2xl'
                    }`}>
                        {/* Linha Fina de Pavio na Borda Inferior */}
                        <div className="absolute bottom-0 inset-x-0 h-1 bg-slate-950/60 overflow-hidden">
                            <div 
                                className={`h-full transition-all duration-300 ${
                                    isExploded ? 'bg-red-600' : isCritical ? 'bg-red-500 shadow-[0_0_8px_#ef4444]' : isRunning ? 'bg-amber-400 shadow-[0_0_6px_#f59e0b]' : 'bg-slate-700'
                                }`}
                                style={{ width: `${progressPercent}%` }}
                            />
                        </div>

                        {/* Bloco 1: Título e Status */}
                        <div className="flex items-center gap-2.5 min-w-0 shrink-0">
                            <span className="text-2xl select-none shrink-0">{isExploded ? '💥' : '💣'}</span>
                            <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-xs sm:text-sm font-black text-amber-400 tracking-wide">
                                        Cronômetro Oficial do Sistema
                                    </span>
                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border shrink-0 ${
                                        isExploded 
                                            ? 'bg-red-500/20 text-red-300 border-red-500/40 animate-pulse' 
                                            : isRunning 
                                                ? (isCritical ? 'bg-red-500/20 text-red-300 border-red-500/50 animate-pulse' : 'bg-amber-500/20 text-amber-300 border-amber-500/40') 
                                                : 'bg-slate-800 text-slate-400 border-slate-700'
                                    }`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${
                                            isExploded ? 'bg-red-500 animate-ping' : isCritical ? 'bg-red-500 animate-ping' : isRunning ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'
                                        }`} />
                                        {isExploded ? 'Explodiu!' : isRunning ? (isCritical ? 'Vai Explodir!' : 'Pavio Aceso 🔥') : 'Standby'}
                                    </span>
                                </div>
                                <span className="text-[11px] text-slate-400 font-medium hidden sm:inline truncate block">
                                    Controle o tempo de resolução dos desafios da turma
                                </span>
                            </div>
                        </div>

                        {/* Bloco 2: Recursos Principais Centrais (Tempo, Play/Pause, Reset, Presets, Detonar, Som) */}
                        <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap justify-start lg:justify-center">
                            {/* Display do Relógio */}
                            <div className="flex items-center gap-1.5 bg-black/50 px-2.5 py-1 rounded-xl border border-white/10">
                                <button
                                    type="button"
                                    onClick={toggleTimeFormat}
                                    title="Clique para alternar entre MM:SS e apenas Segundos"
                                    className={`font-mono font-black text-2xl sm:text-3xl tracking-widest tabular-nums cursor-pointer hover:opacity-90 transition-all select-none ${
                                        isExploded 
                                            ? 'text-red-500 animate-pulse drop-shadow-[0_0_12px_#ef4444]' 
                                            : isCritical
                                                ? 'text-red-500 animate-pulse drop-shadow-[0_0_12px_#ef4444]'
                                                : isRunning
                                                    ? 'text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.7)]'
                                                    : 'text-blue-400'
                                    }`}
                                >
                                    {renderTime(activeDisplayTime)}
                                </button>
                                <button
                                    type="button"
                                    onClick={toggleTimeDisplayType}
                                    className="text-[9px] font-mono font-bold text-slate-400 hover:text-cyan-300 p-0.5 cursor-pointer select-none leading-none bg-slate-800/80 rounded px-1"
                                    title={timeDisplayType === 'elapsed' ? "Tempo decorrido (clique para tempo restante)" : "Tempo restante (clique para tempo decorrido)"}
                                >
                                    {timeDisplayType === 'elapsed' ? 'DEC' : 'REST'}
                                </button>
                            </div>

                            {/* Botão Play / Pause / Iniciar */}
                            <button
                                type="button"
                                onClick={handleTogglePlay}
                                className={`py-1.5 px-3 sm:px-3.5 rounded-xl font-black text-xs sm:text-sm flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-md ${
                                    isExploded
                                        ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/30'
                                        : isRunning
                                            ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/30'
                                            : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/30'
                                }`}
                            >
                                {isExploded ? <RotateCcw className="w-3.5 h-3.5" /> : isRunning ? <Pause className="w-3.5 h-3.5 fill-slate-950" /> : <Play className="w-3.5 h-3.5 fill-slate-950" />}
                                <span>{isExploded ? 'Reset' : isRunning ? 'Pausar' : 'Iniciar'}</span>
                            </button>

                            {/* Botão Resetar Tempo */}
                            {!isExploded && (
                                <button
                                    type="button"
                                    onClick={handleReset}
                                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all cursor-pointer shadow-xs"
                                    title="Reiniciar tempo configurado"
                                >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                </button>
                            )}

                            {/* Presets Rápidos de Duração */}
                            <div className="flex items-center gap-1 bg-black/50 border border-white/10 p-1 rounded-xl">
                                {[15, 30, 60, 120].map((sec) => (
                                    <button
                                        key={sec}
                                        type="button"
                                        onClick={() => handleSelectDuration(sec)}
                                        className={`px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                            duration === sec && !isExploded
                                                ? 'bg-amber-500 text-slate-950 shadow-xs'
                                                : 'text-slate-400 hover:text-white hover:bg-slate-800'
                                        }`}
                                        title={`Definir ${formatTimeDetailed(sec)}`}
                                    >
                                        {sec < 60 ? `${sec}s` : `${sec / 60}m`}
                                    </button>
                                ))}
                            </div>

                            {/* Detonar Manual */}
                            {!isExploded && (
                                <button
                                    type="button"
                                    onClick={handleManualExplode}
                                    className="p-1.5 px-2 rounded-xl bg-red-950/70 hover:bg-red-900 border border-red-500/40 text-red-300 transition-all cursor-pointer shadow-xs text-xs font-bold flex items-center gap-1"
                                    title="Detonar bomba imediatamente (Não soube responder / Tempo esgotado)"
                                >
                                    <span>💥</span>
                                </button>
                            )}

                            {/* Música de Fundo */}
                            <RouletteBackgroundMusic 
                                isExploded={isExploded} 
                                onSyncRequest={handleSyncMusicDuration} 
                                timerIsRunning={isRunning} 
                                restartTrackTrigger={restartCounter} 
                                seekTarget={musicSeekTarget}
                                isDragging={isDraggingFuse}
                            />

                            {/* Som Mudo / Ativo */}
                            <button
                                type="button"
                                onClick={() => setSoundEnabled(prev => !prev)}
                                className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                                    soundEnabled ? 'bg-amber-500/20 border-amber-500/40 text-amber-300' : 'bg-slate-800 border-slate-700 text-slate-500'
                                }`}
                                title={soundEnabled ? "Silenciar efeitos sonoros" : "Ativar efeitos sonoros"}
                            >
                                {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                            </button>
                        </div>

                        {/* Bloco 3: Expandir e Fechar */}
                        <div className="flex items-center gap-1.5 shrink-0 justify-end">
                            <button
                                type="button"
                                onClick={() => changeViewMode('normal')}
                                className="text-xs font-bold text-slate-200 hover:text-white px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-xl cursor-pointer border border-slate-700 flex items-center gap-1.5 shadow-xs transition-colors"
                                title="Expandir painel completo do cronômetro"
                            >
                                <Maximize2 className="w-3.5 h-3.5 text-amber-400" />
                                <span>Expandir</span>
                            </button>
                            {onClose && (
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
                                    title="Ocultar cronômetro"
                                >
                                    <XCircle className="w-5 h-5" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <div className="fixed bottom-5 right-5 z-[70] select-none animate-in slide-in-from-bottom-5 duration-300">
                {/* Clarão Cegante de Detonação */}
                {showFlash && (
                    <div className="fixed inset-0 z-50 rounded-3xl bg-gradient-to-r from-orange-400 via-white to-red-500 animate-explosion-flash pointer-events-none mix-blend-screen" />
                )}

                {/* Ondas de Choque Concêntricas */}
                {isExploded && (
                    <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-20 overflow-hidden">
                        <div className="w-32 h-32 rounded-full border-4 border-red-500 shadow-[0_0_35px_#ef4444] animate-shockwave-ring" />
                        <div className="w-32 h-32 rounded-full border-4 border-orange-400 shadow-[0_0_25px_#f97316] animate-shockwave-ring" style={{ animationDelay: '0.15s' }} />
                    </div>
                )}

                <div className={`rounded-2xl border-2 p-3.5 backdrop-blur-xl shadow-2xl transition-all duration-300 flex flex-col gap-2.5 w-64 sm:w-72 ${
                    isExploded 
                        ? 'bg-red-950/95 border-red-500 shadow-[0_0_50px_rgba(239,68,68,0.8)] animate-violent-shake text-white'
                        : isCritical
                            ? 'bg-slate-950/95 border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.5)] animate-pulse'
                            : 'bg-slate-950/95 border-amber-500/50 shadow-[0_15px_35px_rgba(0,0,0,0.8)]'
                }`}>
                    {/* Header: Status + Controles de Janela */}
                    <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                            <span className="text-base">{isExploded ? '💥' : '💣'}</span>
                            <span className="text-[11px] font-black uppercase tracking-wider text-amber-300 truncate">
                                {isExploded ? 'EXPLODIU!' : isRunning ? (isCritical ? 'VAI EXPLODIR!' : 'PAVIO ACESO') : 'STANDBY'}
                            </span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                            <RouletteBackgroundMusic 
                                isExploded={isExploded} 
                                onSyncRequest={handleSyncMusicDuration} 
                                timerIsRunning={isRunning} 
                                restartTrackTrigger={restartCounter} 
                                seekTarget={musicSeekTarget}
                                isDragging={isDraggingFuse}
                            />
                            <button
                                type="button"
                                onClick={() => changeViewMode('normal')}
                                className="px-2 py-1 rounded-lg border border-amber-500/40 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 text-2xs font-bold transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                                title="Acoplar ao lado direito do card (mesma altura)"
                            >
                                <Minimize2 className="w-3 h-3" />
                                <span>Acoplar</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => changeViewMode('maximized')}
                                className="p-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
                                title="Maximizar em tela cheia"
                            >
                                <Maximize2 className="w-3 h-3" />
                            </button>
                            <button
                                type="button"
                                onClick={() => setSoundEnabled(prev => !prev)}
                                className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                                    soundEnabled ? 'bg-amber-500/20 border-amber-500/40 text-amber-300' : 'bg-slate-800 border-slate-700 text-slate-500'
                                }`}
                                title={soundEnabled ? "Silenciar" : "Ativar som"}
                            >
                                {soundEnabled ? <Volume2 className="w-3 h-3" /> : <VolumeX className="w-3 h-3" />}
                            </button>
                        </div>
                    </div>

                    {/* Clock & Action row */}
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={toggleTimeFormat}
                                title={timeFormat === 'seconds' ? "Clique para alternar para mm:ss" : "Clique para alternar para apenas segundos"}
                                className={`font-mono font-black text-3xl tracking-widest tabular-nums cursor-pointer hover:opacity-90 transition-all ${
                                isExploded 
                                    ? 'text-red-500 animate-pulse drop-shadow-[0_0_12px_#ef4444]' 
                                    : isCritical
                                        ? 'text-red-500 animate-pulse drop-shadow-[0_0_12px_#ef4444]'
                                        : isRunning
                                            ? 'text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]'
                                            : 'text-blue-400'
                            }`}>
                                {renderTime(activeDisplayTime)}
                            </button>
                            <div className="flex flex-col gap-0.5">
                                <button
                                    type="button"
                                    onClick={toggleTimeFormat}
                                    title={timeFormat === 'seconds' ? "Mostrar Minutos:Segundos" : "Mostrar apenas Segundos"}
                                    className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-cyan-300 border border-slate-700 transition-colors cursor-pointer select-none leading-tight"
                                >
                                    {timeFormat === 'seconds' ? 'm:s' : 'seg'}
                                </button>
                                <button
                                    type="button"
                                    onClick={toggleTimeDisplayType}
                                    title={timeDisplayType === 'elapsed' ? "Clique para voltar ao tempo restante" : "Clique para mostrar tempo decorrido"}
                                    className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold border transition-colors cursor-pointer select-none leading-tight ${
                                        timeDisplayType === 'elapsed'
                                            ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                                            : 'bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-cyan-300 border-slate-700'
                                    }`}
                                >
                                    {timeDisplayType === 'elapsed' ? `-${renderTime(timeLeft)}` : `+${renderTime(elapsedTime)}`}
                                </button>
                            </div>
                            {!isExploded && (
                                <button
                                    type="button"
                                    onClick={toggleTimeDisplayType}
                                    title={timeDisplayType === 'elapsed' ? "Porcentagem decorrida (clique para ver restante)" : "Porcentagem restante (clique para ver decorrida)"}
                                    className={`font-mono font-black text-base sm:text-lg cursor-pointer hover:opacity-80 transition-opacity select-none ${
                                        isCritical ? 'text-red-400' : isRunning ? 'text-amber-400' : 'text-slate-400'
                                    }`}
                                >
                                    {Math.round(displayedPercent)}%
                                </button>
                            )}
                        </div>

                        <div className="flex items-center gap-1.5">
                            <button
                                type="button"
                                onClick={handleTogglePlay}
                                className={`py-1.5 px-3 rounded-xl font-black text-xs flex items-center gap-1 transition-all active:scale-95 cursor-pointer shadow-sm ${
                                    isExploded
                                        ? 'bg-red-600 hover:bg-red-500 text-white'
                                        : isRunning
                                            ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                                            : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                                }`}
                            >
                                {isExploded ? <RotateCcw className="w-3.5 h-3.5" /> : isRunning ? <Pause className="w-3.5 h-3.5 fill-slate-950" /> : <Play className="w-3.5 h-3.5 fill-slate-950" />}
                                <span>{isExploded ? 'Reset' : isRunning ? 'Pausar' : 'Iniciar'}</span>
                            </button>

                            {!isExploded && (
                                <button
                                    type="button"
                                    onClick={handleReset}
                                    className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all cursor-pointer"
                                    title="Resetar tempo"
                                >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                </button>
                            )}

                            {!isExploded && (
                                <button
                                    type="button"
                                    onClick={handleManualExplode}
                                    className="p-1.5 rounded-xl bg-red-950/60 hover:bg-red-900 border border-red-500/40 text-red-300 transition-all cursor-pointer"
                                    title="Não soube responder (Detonar!)"
                                >
                                    💥
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Progress bar / Scrubber */}
                    <div 
                        ref={minFuseTrackRef}
                        role="slider"
                        tabIndex={0}
                        aria-label="Ajustar tempo da bomba"
                        aria-valuemin={0}
                        aria-valuemax={duration}
                        aria-valuenow={timeLeft}
                        onKeyDown={handleFuseKeyDown}
                        onPointerDown={(e) => handleFusePointerDown(e, minFuseTrackRef.current)}
                        onPointerMove={(e) => handleFusePointerMove(e, minFuseTrackRef.current)}
                        onPointerUp={handleFusePointerUp}
                        onPointerCancel={handleFusePointerUp}
                        className="w-full py-1.5 -my-1.5 cursor-ew-resize group touch-none relative outline-none"
                        title="Deslize para aumentar ou diminuir o tempo"
                    >
                        <div className="w-full bg-slate-900 h-2.5 rounded-full border border-slate-700 overflow-hidden relative group-hover:border-amber-500/50 transition-colors">
                            <div 
                                className={`h-full rounded-full ${
                                    isDraggingFuse ? 'transition-none' : 'transition-all duration-300'
                                } ${
                                    isExploded ? 'bg-red-600' : isCritical ? 'bg-red-500 shadow-[0_0_8px_#ef4444]' : isRunning ? 'bg-amber-400 shadow-[0_0_6px_#f59e0b]' : 'bg-slate-700'
                                }`}
                                style={{ width: `${progressPercent}%` }}
                            />
                        </div>

                        {!isExploded && (
                            <div 
                                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 pointer-events-none z-20 flex items-center justify-center"
                                style={{ left: `${Math.max(3, Math.min(97, progressPercent))}%` }}
                            >
                                <span className="text-xs select-none drop-shadow-[0_0_6px_rgba(245,158,11,0.8)]">
                                    {isCritical ? '💥' : '🔥'}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // =========================================================================
    // MODO 2: MAXIMIZADO (OVERLAY DE DESTAQUE GIGANTE PARA TODA A SALA)
    // =========================================================================
    if (viewMode === 'maximized') {
        return (
            <div className="fixed inset-0 z-[80] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-in zoom-in-95 duration-200 select-none">
                {/* Clarão Cegante de Detonação */}
                {showFlash && (
                    <div className="absolute inset-0 z-50 rounded-3xl bg-gradient-to-r from-orange-400 via-white to-red-500 animate-explosion-flash pointer-events-none mix-blend-screen" />
                )}

                {/* Ondas de Choque Concêntricas */}
                {isExploded && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20 overflow-hidden">
                        <div className="w-64 h-64 rounded-full border-4 border-red-500 shadow-[0_0_55px_#ef4444] animate-shockwave-ring" />
                        <div className="w-64 h-64 rounded-full border-4 border-orange-400 shadow-[0_0_35px_#f97316] animate-shockwave-ring" style={{ animationDelay: '0.15s' }} />
                    </div>
                )}

                <div className={`relative w-full max-w-xl max-h-[92vh] overflow-y-auto rounded-3xl p-6 sm:p-8 border-2 transition-all duration-300 backdrop-blur-xl shadow-2xl flex flex-col justify-between custom-scrollbar ${
                    isExploded 
                        ? 'bg-gradient-to-b from-red-950 via-slate-950 to-red-950 border-red-500 shadow-[0_0_80px_rgba(239,68,68,0.8)] animate-violent-shake'
                        : isCritical
                            ? 'bg-gradient-to-b from-red-950/95 via-slate-950 to-slate-950 border-red-500/80 shadow-[0_0_50px_rgba(239,68,68,0.5)]'
                            : 'bg-slate-950/95 border-amber-500/50 shadow-[0_25px_60px_rgba(0,0,0,0.9)]'
                }`}>
                    {/* Header */}
                    <div className="w-full flex items-center justify-between pb-4 border-b border-white/10 shrink-0">
                        <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${
                                isExploded ? 'bg-red-500 animate-ping' : isCritical ? 'bg-red-500 animate-ping' : isRunning ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'
                            }`} />
                            <span className="text-2xl">💣</span>
                            <h4 className="font-black text-sm uppercase tracking-wider text-amber-300">
                                Cronômetro Bomba (Modo Destaque)
                            </h4>
                        </div>

                        <div className="flex items-center gap-2">
                            <RouletteBackgroundMusic 
                                isExploded={isExploded} 
                                onSyncRequest={handleSyncMusicDuration} 
                                timerIsRunning={isRunning} 
                                restartTrackTrigger={restartCounter} 
                                seekTarget={musicSeekTarget}
                                isDragging={isDraggingFuse}
                            />
                            <button
                                type="button"
                                onClick={() => changeViewMode('normal')}
                                className="px-3 py-1.5 rounded-xl border border-amber-500/40 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
                                title="Acoplar ao lado direito do card (mesma altura)"
                            >
                                <Minimize2 className="w-3.5 h-3.5" />
                                <span>Acoplar ao Card</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => changeViewMode('minimized')}
                                className="px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                                title="Minimizar para o canto da tela"
                            >
                                <Minus className="w-3.5 h-3.5" />
                                <span>Minimizar</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setSoundEnabled(prev => !prev)}
                                className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                                    soundEnabled ? 'bg-amber-500/20 border-amber-500/40 text-amber-300' : 'bg-slate-800 border-slate-700 text-slate-500'
                                }`}
                                title={soundEnabled ? "Silenciar efeitos sonoros" : "Ativar efeitos sonoros"}
                            >
                                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                            </button>

                            {onClose && (
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="p-2 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
                                    title="Ocultar cronômetro"
                                >
                                    <XCircle className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Center Giant HUD */}
                    <div className="my-auto py-4 w-full flex flex-col items-center justify-center select-none">
                        {/* Bomba Gigante Acima da Porcentagem */}
                        <div className="relative flex items-center justify-center">
                            <div className={`transition-transform duration-300 ${
                                isExploded 
                                    ? 'scale-125 rotate-12 drop-shadow-[0_0_50px_#ef4444]' 
                                    : isCritical 
                                        ? 'scale-115 animate-bounce drop-shadow-[0_0_35px_#ef4444]' 
                                        : isRunning 
                                            ? 'scale-105 drop-shadow-[0_0_25px_rgba(245,158,11,0.7)]' 
                                            : 'scale-100 drop-shadow-[0_0_15px_rgba(0,0,0,0.8)]'
                            }`}>
                                <span className="text-8xl sm:text-9xl lg:text-[10rem] select-none">
                                    {isExploded ? '💥' : '💣'}
                                </span>
                            </div>

                            {isCritical && !isExploded && (
                                <span className="absolute -top-1 -right-3 flex h-8 w-8">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-8 w-8 bg-red-600 text-sm font-black text-white items-center justify-center shadow-lg">!</span>
                                </span>
                            )}
                        </div>

                        {/* Porcentagem Logo Abaixo da Bomba */}
                        {!isExploded && (
                            <button
                                type="button"
                                onClick={toggleTimeDisplayType}
                                title={timeDisplayType === 'elapsed' ? "Porcentagem decorrida (clique para ver restante)" : "Porcentagem restante (clique para ver decorrida)"}
                                className={`mt-3 bg-black/95 border-4 px-8 sm:px-10 py-2 rounded-full font-mono font-black text-4xl sm:text-5xl lg:text-6xl shadow-[0_10px_35px_rgba(0,0,0,0.95)] tracking-wider transition-all z-20 whitespace-nowrap flex items-center justify-center select-none cursor-pointer hover:opacity-90 active:scale-98 ${
                                isCritical 
                                    ? 'border-red-500 text-red-400 drop-shadow-[0_0_25px_#ef4444] animate-pulse scale-105' 
                                    : isRunning 
                                        ? 'border-amber-400 text-amber-300 drop-shadow-[0_0_22px_rgba(245,158,11,0.9)]' 
                                        : 'border-amber-500/80 text-amber-300'
                            }`}>
                                {Math.round(displayedPercent)}%
                            </button>
                        )}

                        {/* Grand Nixie Clock */}
                        <div className="mt-4 sm:mt-5 text-center w-full">
                            <button
                                type="button"
                                onClick={toggleTimeFormat}
                                title={timeFormat === 'seconds' ? "Clique para alternar para Minutos e Segundos (mm:ss)" : "Clique para alternar para apenas Segundos"}
                                className={`font-mono font-black text-6xl sm:text-7xl lg:text-8xl tracking-widest tabular-nums transition-all cursor-pointer hover:opacity-90 active:scale-98 select-none ${
                                isExploded 
                                    ? 'text-red-500 animate-pulse drop-shadow-[0_0_40px_#ef4444]' 
                                    : isCritical
                                        ? 'text-red-500 drop-shadow-[0_0_35px_#ef4444] animate-pulse'
                                        : isRunning
                                            ? 'text-cyan-400 drop-shadow-[0_0_30px_rgba(6,182,212,0.85)]'
                                            : 'text-blue-400 drop-shadow-[0_0_20px_rgba(59,130,246,0.6)]'
                            }`}>
                                {renderTime(activeDisplayTime)}
                            </button>

                            <div className="mt-2.5 flex flex-wrap items-center justify-center gap-2">
                                <span className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider border shadow-sm ${
                                    isExploded 
                                        ? 'bg-red-500/20 text-red-300 border-red-500/40 animate-bounce' 
                                        : isRunning 
                                            ? (isCritical ? 'bg-red-500/20 text-red-300 border-red-500/50 animate-pulse' : 'bg-amber-500/20 text-amber-300 border-amber-500/40') 
                                            : 'bg-slate-800/80 text-slate-400 border-slate-700'
                                }`}>
                                    {isExploded ? '💥 TEMPO ESGOTADO!' : isRunning ? (isCritical ? '⚠️ RÁPIDO! VAI EXPLODIR!' : timeDisplayType === 'elapsed' ? '⏱️ TEMPO DECORRIDO • PAVIO ACESO' : '🔥 PAVIO ACESO • CONTAGEM REGRESSIVA') : (timeDisplayType === 'elapsed' ? '⏱️ TEMPO DECORRIDO' : '⏱️ PRONTO PARA INICIAR')}
                                </span>

                                {/* Botão discreto para alternar formato */}
                                <button
                                    type="button"
                                    onClick={toggleTimeFormat}
                                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-cyan-300 border border-slate-700/80 hover:border-cyan-500/50 transition-all cursor-pointer shadow-sm active:scale-95 select-none"
                                    title={timeFormat === 'seconds' ? "Alternar para Minutos:Segundos" : "Alternar para Apenas Segundos"}
                                >
                                    <span>⏱️</span>
                                    <span>{timeFormat === 'seconds' ? 'Mostrar mm:ss' : 'Apenas segundos'}</span>
                                </button>

                                {/* Botão discreto para tempo decorrido */}
                                <button
                                    type="button"
                                    onClick={toggleTimeDisplayType}
                                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold transition-all cursor-pointer shadow-sm active:scale-95 select-none ${
                                        timeDisplayType === 'elapsed'
                                            ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-400/60 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                                            : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-cyan-300 border border-slate-700/80 hover:border-cyan-500/50'
                                    }`}
                                    title={timeDisplayType === 'elapsed' ? "Clique para voltar ao tempo restante (regressivo)" : "Clique para mostrar tempo decorrido no relógio"}
                                >
                                    <History className="w-3.5 h-3.5 text-cyan-400" />
                                    <span>{timeDisplayType === 'elapsed' ? `Restante: ${renderTime(timeLeft)}` : `Decorrido: ${renderTime(elapsedTime)}`}</span>
                                </button>
                            </div>
                        </div>

                        {/* Burning fuse interativo */}
                        <div className="w-full mt-5 select-none">
                            <div className="w-full flex items-end justify-between px-1 mb-1.5">
                                <span className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1">
                                    <span>↔</span> Deslize para ajustar o tempo
                                </span>
                                {!isExploded && (
                                    <span 
                                        onClick={toggleTimeDisplayType}
                                        title={timeDisplayType === 'elapsed' ? "Porcentagem decorrida (clique para ver restante)" : "Porcentagem restante (clique para ver decorrida)"}
                                        className={`font-mono font-black text-3xl sm:text-4xl leading-none cursor-pointer hover:opacity-80 transition-opacity select-none ${
                                        isCritical ? 'text-red-400 drop-shadow-[0_0_15px_#ef4444] animate-pulse' : isRunning ? 'text-amber-300 drop-shadow-[0_0_12px_rgba(245,158,11,0.8)]' : 'text-amber-400'
                                    }`}>
                                        {Math.round(displayedPercent)}%
                                    </span>
                                )}
                            </div>

                            <div 
                                ref={maxFuseTrackRef}
                                role="slider"
                                tabIndex={0}
                                aria-label="Ajustar tempo da bomba"
                                aria-valuemin={0}
                                aria-valuemax={duration}
                                aria-valuenow={timeLeft}
                                onKeyDown={handleFuseKeyDown}
                                onPointerDown={(e) => handleFusePointerDown(e, maxFuseTrackRef.current)}
                                onPointerMove={(e) => handleFusePointerMove(e, maxFuseTrackRef.current)}
                                onPointerUp={handleFusePointerUp}
                                onPointerCancel={handleFusePointerUp}
                                className="w-full py-2 -my-2 cursor-ew-resize group touch-none relative outline-none"
                                title="Deslize para alterar o tempo!"
                            >
                                <div className="w-full bg-slate-900/95 h-5 rounded-full border-2 border-slate-700/90 p-0.5 overflow-hidden relative shadow-inner group-hover:border-amber-500/70 transition-colors">
                                    <div 
                                        className={`h-full rounded-full relative ${
                                            isDraggingFuse ? 'transition-none' : 'transition-all duration-300'
                                        } ${
                                            isExploded 
                                                ? 'bg-red-600 shadow-[0_0_12px_#ef4444]' 
                                                : isCritical 
                                                    ? 'bg-gradient-to-r from-red-600 to-orange-500 shadow-[0_0_12px_#ef4444]' 
                                                    : isRunning 
                                                        ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-300 shadow-[0_0_10px_#f59e0b]' 
                                                        : 'bg-gradient-to-r from-slate-600 to-amber-500/70'
                                        }`}
                                        style={{ width: `${progressPercent}%` }}
                                    />
                                </div>

                                {!isExploded && (
                                    <div 
                                        className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 pointer-events-none transition-transform z-30 flex items-center justify-center ${
                                            isDraggingFuse ? 'scale-135' : 'group-hover:scale-120'
                                        }`}
                                        style={{ left: `${Math.max(2, Math.min(98, progressPercent))}%` }}
                                    >
                                        <div className="w-8 h-8 rounded-full bg-slate-950 border-2 border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.9)] flex items-center justify-center text-base select-none">
                                            {isCritical ? '💥' : '🔥'}
                                        </div>
                                        {isDraggingFuse && (
                                            <div className="absolute -top-9 px-3 py-1 rounded-lg bg-amber-400 text-slate-950 font-mono font-black text-sm shadow-xl whitespace-nowrap animate-in fade-in zoom-in-95 duration-100">
                                                {renderTime(activeDisplayTime)} ({Math.round(displayedPercent)}%)
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Primary Action Buttons */}
                    <div className="w-full space-y-2.5 shrink-0 mt-3">
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={handleTogglePlay}
                                className={`py-3.5 px-5 rounded-2xl font-black text-sm sm:text-base flex items-center justify-center gap-2 transition-all transform active:scale-95 shadow-md cursor-pointer ${
                                    isExploded
                                        ? 'col-span-2 bg-gradient-to-r from-red-600 to-orange-600 text-white'
                                        : isRunning
                                            ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950'
                                            : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950'
                                }`}
                            >
                                {isExploded ? <RotateCcw className="w-5 h-5" /> : isRunning ? <Pause className="w-5 h-5 fill-slate-950" /> : <Play className="w-5 h-5 fill-slate-950" />}
                                <span>{isExploded ? 'Reiniciar Bomba' : isRunning ? 'Pausar' : 'Iniciar Tempo'}</span>
                            </button>

                            {!isExploded && (
                                <button
                                    type="button"
                                    onClick={handleReset}
                                    className="py-3.5 px-4 rounded-2xl font-bold text-sm bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                                >
                                    <RotateCcw className="w-4 h-4" />
                                    <span>Resetar</span>
                                </button>
                            )}
                        </div>

                        {!isExploded && (
                            <button
                                type="button"
                                onClick={handleManualExplode}
                                className="w-full py-2.5 px-4 rounded-xl font-bold text-xs text-red-300 bg-red-950/40 hover:bg-red-900/60 border border-red-500/40 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                            >
                                <span>💥</span>
                                <span>Não Soube Responder (Detonar Agora!)</span>
                            </button>
                        )}
                    </div>

                    {/* Time Tuner & Presets */}
                    <div className="w-full mt-4 pt-4 border-t border-white/10 shrink-0">
                        {/* Time tuner */}
                        <div className="flex items-center justify-between gap-1 bg-slate-900/90 border border-slate-800 rounded-2xl p-1.5 shadow-inner mb-2.5">
                            <div className="flex items-center gap-1">
                                <button type="button" onClick={() => handleAdjustTime(-60)} disabled={duration <= 60} className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-black disabled:opacity-30 cursor-pointer">-1m</button>
                                <button type="button" onClick={() => handleAdjustTime(-10)} disabled={duration <= 10} className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-black disabled:opacity-30 cursor-pointer">-10s</button>
                            </div>
                            <div className="flex-1 text-center">
                                <span className="text-[11px] uppercase tracking-widest text-slate-400 font-bold block">Duração: {formatTimeDetailed(duration)}</span>
                                <span className="text-base font-mono font-black text-amber-300">{renderTime(duration)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <button type="button" onClick={() => handleAdjustTime(10)} disabled={duration >= 600} className="px-2.5 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-black disabled:opacity-30 cursor-pointer">+10s</button>
                                <button type="button" onClick={() => handleAdjustTime(60)} disabled={duration >= 600} className="px-2.5 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-black disabled:opacity-30 cursor-pointer">+1m</button>
                            </div>
                        </div>

                        {/* Presets chips */}
                        <div className="flex flex-wrap items-center justify-center gap-1.5">
                            {[
                                { sec: 15, label: '15s' }, { sec: 30, label: '30s' }, { sec: 45, label: '45s' },
                                { sec: 60, label: '1 min' }, { sec: 120, label: '2 min' }, { sec: 180, label: '3 min' }
                            ].map(({ sec, label }) => (
                                <button
                                    key={sec}
                                    type="button"
                                    onClick={() => handleSelectDuration(sec)}
                                    className={`px-3 py-1 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                                        duration === sec && !showCustomInput ? 'bg-amber-400 text-slate-950 font-black shadow-xs ring-1 ring-amber-300 scale-105' : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                                    }`}
                                >
                                    {label}
                                </button>
                            ))}
                            <button
                                type="button"
                                onClick={() => setShowCustomInput(!showCustomInput)}
                                className="px-3 py-1 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800 cursor-pointer flex items-center gap-1"
                            >
                                <span>✏️</span> Outro
                            </button>
                        </div>

                        {showCustomInput && (
                            <form onSubmit={handleCustomSubmit} className="flex items-center gap-1.5 mt-2.5 p-1.5 bg-slate-900 border border-amber-500/40 rounded-xl">
                                <input
                                    type="text"
                                    value={customInput}
                                    onChange={(e) => setCustomInput(e.target.value)}
                                    placeholder="Ex: 90 ou 1:30"
                                    className="flex-1 bg-transparent px-2 py-1 text-xs text-white font-mono outline-none"
                                    autoFocus
                                />
                                <button type="submit" className="px-3 py-1 bg-amber-500 text-slate-950 font-black text-xs rounded-lg cursor-pointer">OK</button>
                                <button type="button" onClick={() => setShowCustomInput(false)} className="p-1 text-slate-400 text-xs cursor-pointer">✕</button>
                            </form>
                        )}

                        <div className="flex items-center justify-center mt-3 pt-2 border-t border-slate-800">
                            <label className="flex items-center gap-1.5 cursor-pointer group" onClick={e => e.stopPropagation()}>
                                <div className="relative flex items-center">
                                    <input 
                                        type="checkbox" 
                                        checked={tickEnabled} 
                                        onChange={(e) => setTickEnabled(e.target.checked)}
                                        className="peer sr-only"
                                    />
                                    <div className="w-8 h-4 bg-slate-800 border border-slate-700 rounded-full peer-checked:bg-amber-500/30 peer-checked:border-amber-500 transition-all after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-slate-500 after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:after:translate-x-4 peer-checked:after:bg-amber-400"></div>
                                </div>
                                <span className="text-[10px] text-slate-400 font-bold tracking-wide uppercase group-hover:text-slate-300 transition-colors select-none">
                                    Ouvir Batida do Cronômetro
                                </span>
                            </label>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // =========================================================================
    // MODO 3: NORMAL (ACOPLADO AO LADO DIREITO DO CARD COM MESMA ALTURA)
    // =========================================================================
    return (
        <div className={`relative w-full h-full select-none flex flex-col justify-between ${className}`}>
            {/* Clarão Cegante de Detonação */}
            {showFlash && (
                <div className="absolute inset-0 z-50 rounded-3xl bg-gradient-to-r from-orange-400 via-white to-red-500 animate-explosion-flash pointer-events-none mix-blend-screen" />
            )}

            {/* Ondas de Choque Concêntricas */}
            {isExploded && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20 overflow-hidden rounded-3xl">
                    <div className="w-32 h-32 rounded-full border-4 border-red-500 shadow-[0_0_35px_#ef4444] animate-shockwave-ring" />
                    <div className="w-32 h-32 rounded-full border-4 border-orange-400 shadow-[0_0_25px_#f97316] animate-shockwave-ring" style={{ animationDelay: '0.15s' }} />
                </div>
            )}

            {/* Card Principal da Bomba */}
            <div className={`relative w-full h-full rounded-2xl sm:rounded-3xl pt-5 sm:pt-6 pb-5 sm:pb-6 px-3 sm:px-4 border-4 sm:border-[5px] transition-all duration-300 shadow-2xl flex flex-col justify-between overflow-hidden ${
                isExploded 
                    ? 'bg-gradient-to-b from-red-950 via-black to-red-950 border-red-600 shadow-[0_0_120px_rgba(239,68,68,1)] animate-violent-shake scale-105 z-50'
                    : isCritical
                        ? 'bg-gradient-to-b from-red-950/90 via-black to-red-950/80 border-red-500 shadow-[0_0_60px_rgba(239,68,68,0.8)] animate-pulse scale-[1.01]'
                        : 'bg-gradient-to-b from-zinc-950 via-[#0a0a0a] to-zinc-950 border-zinc-800 shadow-[0_0_40px_rgba(0,0,0,0.9)]'
            }`}>

                {/* Faixas de Perigo (Warning Stripes) */}
                <div className="absolute top-0 inset-x-0 h-3.5 sm:h-4 bg-[repeating-linear-gradient(45deg,#eab308_0,#eab308_14px,#000_14px,#000_28px)] shadow-md border-b-2 border-black/90 z-10 opacity-95" />
                <div className="absolute bottom-0 inset-x-0 h-3.5 sm:h-4 bg-[repeating-linear-gradient(-45deg,#eab308_0,#eab308_14px,#000_14px,#000_28px)] shadow-md border-t-2 border-black/90 z-10 opacity-95" />

                {/* Header do Cronômetro */}
                <div className="w-full flex items-center justify-between pb-1.5 sm:pb-2 border-b border-white/10 shrink-0">
                    <div className="flex items-center gap-1.5">
                        <div className={`w-2 h-2 rounded-full ${
                            isExploded 
                                ? 'bg-red-500 animate-ping' 
                                : isCritical 
                                    ? 'bg-red-500 animate-ping' 
                                    : isRunning 
                                        ? 'bg-amber-400 animate-pulse' 
                                        : 'bg-emerald-400'
                        }`} />
                        <span className="text-base">💣</span>
                        <h4 className="font-black text-xs sm:text-sm uppercase tracking-wider text-red-500 drop-shadow-[0_0_5px_rgba(239,68,68,0.8)]">
                            PERIGO: EXPLOSIVO
                        </h4>
                    </div>

                    <div className="flex items-center gap-1">
                        <RouletteBackgroundMusic 
                            isExploded={isExploded} 
                            onSyncRequest={handleSyncMusicDuration} 
                            timerIsRunning={isRunning} 
                            restartTrackTrigger={restartCounter} 
                            seekTarget={musicSeekTarget}
                            isDragging={isDraggingFuse}
                        />
                        {/* Botão Minimizar no Canto */}
                        <button
                            type="button"
                            onClick={() => changeViewMode('minimized')}
                            className="p-1 sm:p-1.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer shadow-2xs"
                            title="Desacoplar e minimizar no canto da tela"
                        >
                            <Minus className="w-3.5 h-3.5" />
                        </button>

                        {/* Botão Maximizar */}
                        <button
                            type="button"
                            onClick={() => changeViewMode('maximized')}
                            className="p-1 sm:p-1.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer shadow-2xs"
                            title="Maximizar cronômetro em tela cheia"
                        >
                            <Maximize2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Botão de Som Mudo / Ativo */}
                        <button
                            type="button"
                            onClick={() => setSoundEnabled(prev => !prev)}
                            className={`p-1 sm:p-1.5 rounded-xl border transition-colors cursor-pointer ${
                                soundEnabled 
                                    ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 hover:bg-amber-500/30 shadow-2xs' 
                                    : 'bg-slate-800 border-slate-700 text-slate-500 hover:bg-slate-700'
                            }`}
                            title={soundEnabled ? "Silenciar efeitos sonoros" : "Ativar efeitos sonoros"}
                        >
                            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                        </button>

                        {onClose && (
                            <button
                                type="button"
                                onClick={onClose}
                                className="p-1 sm:p-1.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer shadow-2xs"
                                title="Ocultar cronômetro"
                            >
                                <XCircle className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                </div>

                {/* DISPLAY CENTRAL: HUD CIRCULAR, RELÓGIO NIXIE E PAVIO */}
                <div className="flex-1 min-h-0 py-1 sm:py-2 w-full flex flex-col items-center justify-around overflow-y-auto no-scrollbar">
                    
                    {/* Bomba e Porcentagem */}
                    <div className="flex flex-col items-center justify-center z-10 select-none">
                        {/* Bomba */}
                        <div className="relative flex items-center justify-center">
                            {isExploded && (
                                <div className="absolute -top-7 flex items-center gap-1.5 pointer-events-none z-20">
                                    <span className="text-xl animate-smoke-billow" style={{ animationDelay: '0s' }}>💨</span>
                                    <span className="text-2xl animate-smoke-billow" style={{ animationDelay: '0.3s' }}>🔥</span>
                                    <span className="text-xl animate-smoke-billow" style={{ animationDelay: '0.6s' }}>💨</span>
                                </div>
                            )}

                            <div className={`transition-transform duration-300 ${
                                isExploded 
                                    ? 'scale-115 rotate-12 drop-shadow-[0_0_45px_#ef4444]' 
                                    : isCritical
                                        ? 'scale-110 animate-bounce drop-shadow-[0_0_30px_#ef4444]'
                                        : isRunning
                                            ? 'scale-105 drop-shadow-[0_0_25px_rgba(245,158,11,0.6)]'
                                            : 'scale-100 drop-shadow-[0_0_15px_rgba(0,0,0,0.8)]'
                            }`}>
                                <span className="text-4xl sm:text-5xl lg:text-6xl select-none leading-none">
                                    {isExploded ? '💥' : '💣'}
                                </span>
                            </div>

                            {isCritical && !isExploded && (
                                <span className="absolute -top-1 -right-2 flex h-5 w-5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-5 w-5 bg-red-600 text-xs font-black text-white items-center justify-center shadow-lg">!</span>
                                </span>
                            )}
                        </div>

                        {/* Porcentagem Logo Abaixo da Bomba */}
                        {!isExploded && (
                            <button
                                type="button"
                                onClick={toggleTimeDisplayType}
                                title={timeDisplayType === 'elapsed' ? "Porcentagem decorrida (clique para ver restante)" : "Porcentagem restante (clique para ver decorrida)"}
                                className={`mt-1 sm:mt-1.5 bg-black/95 border-2 sm:border-3 px-4 sm:px-6 py-0.5 sm:py-1 rounded-full font-mono font-black text-2xl sm:text-3xl lg:text-4xl shadow-[0_8px_25px_rgba(0,0,0,0.95)] tracking-wider transition-all z-20 whitespace-nowrap flex items-center justify-center select-none cursor-pointer hover:opacity-90 active:scale-98 ${
                                isCritical 
                                    ? 'border-red-500 text-red-400 drop-shadow-[0_0_20px_#ef4444] animate-pulse scale-105' 
                                    : isRunning 
                                        ? 'border-amber-400 text-amber-300 drop-shadow-[0_0_18px_rgba(245,158,11,0.9)]' 
                                        : 'border-amber-500/80 text-amber-300'
                            }`}>
                                {Math.round(displayedPercent)}%
                            </button>
                        )}
                    </div>

                    {/* Relógio Digital LED/Nixie */}
                    <div className="mt-1 sm:mt-2 text-center w-full z-10">
                        <button
                            type="button"
                            onClick={toggleTimeFormat}
                            title={timeFormat === 'seconds' ? "Clique para alternar para Minutos e Segundos (mm:ss)" : "Clique para alternar para apenas Segundos"}
                            className={`font-mono font-black text-4xl sm:text-5xl lg:text-6xl tracking-widest tabular-nums leading-none transition-all cursor-pointer hover:opacity-90 active:scale-98 select-none ${
                            isExploded 
                                ? 'text-red-500 animate-pulse drop-shadow-[0_0_35px_#ef4444]' 
                                : isCritical
                                    ? 'text-red-500 drop-shadow-[0_0_30px_#ef4444] animate-pulse'
                                    : isRunning
                                        ? 'text-cyan-400 drop-shadow-[0_0_25px_rgba(6,182,212,0.85)]'
                                        : 'text-blue-400 drop-shadow-[0_0_15px_rgba(59,130,246,0.6)]'
                        }`}>
                            {renderTime(activeDisplayTime)}
                        </button>

                        <div className="mt-1 flex flex-wrap items-center justify-center gap-1 sm:gap-1.5">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] sm:text-2xs font-black uppercase tracking-wider border shadow-xs transition-all ${
                                isExploded 
                                    ? 'bg-red-500/20 text-red-300 border-red-500/40 animate-bounce' 
                                    : isRunning 
                                        ? (isCritical 
                                            ? 'bg-red-500/20 text-red-300 border-red-500/50 animate-pulse' 
                                            : 'bg-amber-500/20 text-amber-300 border-amber-500/40') 
                                        : 'bg-slate-800/80 text-slate-400 border-slate-700'
                            }`}>
                                {isExploded ? (
                                    <><span>💥</span> TEMPO ESGOTADO!</>
                                ) : isRunning ? (
                                    isCritical ? (
                                        <><AlertTriangle className="w-3 h-3 text-red-400" /> RÁPIDO! VAI EXPLODIR!</>
                                    ) : (
                                        <><Flame className="w-3 h-3 text-amber-400 animate-bounce" /> {timeDisplayType === 'elapsed' ? 'PAVIO ACESO' : 'REGRESSIVA'}</>
                                    )
                                ) : (
                                    <><Clock className="w-3 h-3 text-slate-400" /> {timeDisplayType === 'elapsed' ? 'DECORRIDO' : 'PRONTO • AGUARDANDO'}</>
                                )}
                            </span>

                            {/* Botão discreto para alternar formato */}
                            <button
                                type="button"
                                onClick={toggleTimeFormat}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-800/80 hover:bg-slate-700/90 text-slate-300 hover:text-cyan-300 border border-slate-700/80 transition-all cursor-pointer shadow-xs active:scale-95 select-none"
                                title={timeFormat === 'seconds' ? "Alternar para Minutos:Segundos" : "Alternar para Apenas Segundos"}
                            >
                                <span>⏱️</span>
                                <span>{timeFormat === 'seconds' ? 'mm:ss' : 'Apenas seg'}</span>
                            </button>

                            {/* Botão discreto para tempo decorrido */}
                            <button
                                type="button"
                                onClick={toggleTimeDisplayType}
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold transition-all cursor-pointer shadow-xs active:scale-95 select-none ${
                                    timeDisplayType === 'elapsed'
                                        ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-400/60 shadow-[0_0_8px_rgba(6,182,212,0.3)]'
                                        : 'bg-slate-800/80 hover:bg-slate-700/90 text-slate-300 hover:text-cyan-300 border border-slate-700/80'
                                }`}
                                title={timeDisplayType === 'elapsed' ? "Clique para voltar ao tempo restante (regressivo)" : "Clique para mostrar tempo decorrido no relógio"}
                            >
                                <History className="w-2.5 h-2.5 text-cyan-400" />
                                <span>{timeDisplayType === 'elapsed' ? `Rest: ${renderTime(timeLeft)}` : `Decorr: ${renderTime(elapsedTime)}`}</span>
                            </button>
                        </div>
                    </div>

                    {/* Barra de Pavio Interativa e Ajustável */}
                    <div className="w-full mt-1.5 sm:mt-2 select-none shrink-0">
                        <div className="w-full flex items-center justify-between px-1 mb-1">
                            <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1">
                                <span>↔</span> Ajustar Pavio
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                                <span>{renderTime(activeDisplayTime)} / {renderTime(duration)}</span>
                            </span>
                        </div>

                        {/* Trilho Interativo do Pavio */}
                        <div 
                            ref={fuseTrackRef}
                            role="slider"
                            tabIndex={0}
                            aria-label="Ajustar tempo da bomba"
                            aria-valuemin={0}
                            aria-valuemax={duration}
                            aria-valuenow={timeLeft}
                            onKeyDown={handleFuseKeyDown}
                            onPointerDown={(e) => handleFusePointerDown(e, fuseTrackRef.current)}
                            onPointerMove={(e) => handleFusePointerMove(e, fuseTrackRef.current)}
                            onPointerUp={handleFusePointerUp}
                            onPointerCancel={handleFusePointerUp}
                            className="w-full py-1.5 -my-1.5 cursor-ew-resize group touch-none relative outline-none"
                            title="Clique ou deslize para alterar o tempo!"
                        >
                            <div className="w-full bg-slate-900/95 h-3 sm:h-3.5 rounded-full border border-slate-700/90 p-0.5 overflow-hidden relative shadow-inner group-hover:border-amber-500/70 transition-colors">
                                <div 
                                    className={`h-full rounded-full relative ${
                                        isDraggingFuse ? 'transition-none' : 'transition-all duration-300'
                                    } ${
                                        isExploded 
                                            ? 'bg-red-600 shadow-[0_0_10px_#ef4444]' 
                                            : isCritical 
                                                ? 'bg-gradient-to-r from-red-600 to-orange-500 shadow-[0_0_10px_#ef4444]' 
                                                : isRunning 
                                                    ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-300 shadow-[0_0_8px_#f59e0b]' 
                                                    : 'bg-gradient-to-r from-slate-600 to-amber-500/70'
                                    }`}
                                    style={{ width: `${progressPercent}%` }}
                                />
                            </div>

                            {/* Knob de Arrasto com Chama 🔥 */}
                            {!isExploded && (
                                <div 
                                    className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 pointer-events-none transition-transform z-30 flex items-center justify-center ${
                                        isDraggingFuse ? 'scale-125' : 'group-hover:scale-115'
                                    }`}
                                    style={{ left: `${Math.max(2, Math.min(98, progressPercent))}%` }}
                                >
                                    <div className="w-6 h-6 rounded-full bg-slate-950 border border-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.9)] flex items-center justify-center text-xs select-none">
                                        {isCritical ? '💥' : '🔥'}
                                    </div>

                                    {isDraggingFuse && (
                                        <div className="absolute -top-7 px-2 py-0.5 rounded-lg bg-amber-400 text-slate-950 font-mono font-black text-[10px] shadow-lg whitespace-nowrap animate-in fade-in duration-100">
                                            {renderTime(activeDisplayTime)} ({Math.round(displayedPercent)}%)
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* BOTÕES DE CONTROLE PRINCIPAIS */}
                <div className="w-full space-y-1.5 shrink-0 mt-1">
                    <div className="grid grid-cols-2 gap-1.5">
                        <button
                            type="button"
                            onClick={handleTogglePlay}
                            className={`py-2 sm:py-2.5 px-3 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all transform active:scale-95 shadow-md cursor-pointer ${
                                isExploded
                                    ? 'col-span-2 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white shadow-red-500/30'
                                    : isRunning
                                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 shadow-amber-500/20'
                                        : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-emerald-500/20'
                            }`}
                        >
                            {isExploded ? (
                                <>
                                    <RotateCcw className="w-3.5 h-3.5" />
                                    <span>Reiniciar Bomba</span>
                                </>
                            ) : isRunning ? (
                                <>
                                    <Pause className="w-3.5 h-3.5 fill-slate-950" />
                                    <span>Pausar</span>
                                </>
                            ) : (
                                <>
                                    <Play className="w-3.5 h-3.5 fill-slate-950" />
                                    <span>Iniciar Tempo</span>
                                </>
                            )}
                        </button>

                        {!isExploded && (
                            <button
                                type="button"
                                onClick={handleReset}
                                className="py-2 sm:py-2.5 px-3 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all flex items-center justify-center gap-1 cursor-pointer active:scale-95"
                            >
                                <RotateCcw className="w-3 h-3" />
                                <span>Resetar</span>
                            </button>
                        )}
                    </div>

                    {!isExploded && (
                        <button
                            type="button"
                            onClick={handleManualExplode}
                            className="w-full py-1.5 px-2.5 rounded-lg font-bold text-[11px] sm:text-xs text-red-300 bg-red-950/40 hover:bg-red-900/60 border border-red-500/40 hover:border-red-400 transition-all flex items-center justify-center gap-1 cursor-pointer active:scale-95 shadow-xs group"
                            title="Se o aluno não souber responder, acione para explodir a bomba imediatamente!"
                        >
                            <span className="group-hover:scale-125 transition-transform">💥</span>
                            <span>Não Soube Responder (Detonar!)</span>
                        </button>
                    )}
                </div>

                {/* PAINEL DE CONFIGURAÇÃO DE TEMPO */}
                <div className="w-full mt-1.5 pt-1.5 border-t border-white/10 shrink-0">
                    <div className="flex items-center justify-between gap-1 bg-slate-900/90 border border-slate-800 rounded-xl p-0.5 sm:p-1 shadow-inner mb-1.5">
                        <div className="flex items-center gap-0.5">
                            <button type="button" onClick={() => handleAdjustTime(-60)} disabled={duration <= 60} className="px-1.5 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] sm:text-xs font-black transition-all active:scale-95 disabled:opacity-30 cursor-pointer" title="Diminuir 1 minuto (-60s)">-1m</button>
                            <button type="button" onClick={() => handleAdjustTime(-10)} disabled={duration <= 10} className="px-1.5 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] sm:text-xs font-black transition-all active:scale-95 disabled:opacity-30 cursor-pointer" title="Diminuir 10 segundos (-10s)">-10s</button>
                        </div>

                        <div className="flex-1 flex flex-col items-center justify-center px-1 text-center">
                            <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Duração: {renderTime(duration)}</span>
                        </div>

                        <div className="flex items-center gap-0.5">
                            <button type="button" onClick={() => handleAdjustTime(10)} disabled={duration >= 600} className="px-1.5 py-0.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-[10px] sm:text-xs font-black transition-all active:scale-95 disabled:opacity-30 cursor-pointer" title="Aumentar 10 segundos (+10s)">+10s</button>
                            <button type="button" onClick={() => handleAdjustTime(60)} disabled={duration >= 600} className="px-1.5 py-0.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-[10px] sm:text-xs font-black transition-all active:scale-95 disabled:opacity-30 cursor-pointer" title="Aumentar 1 minuto (+60s)">+1m</button>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-1">
                        {[
                            { sec: 15, label: '15s' }, { sec: 30, label: '30s' }, { sec: 45, label: '45s' },
                            { sec: 60, label: '1 min' }, { sec: 120, label: '2 min' }, { sec: 180, label: '3 min' }
                        ].map(({ sec, label }) => (
                            <button
                                key={sec}
                                type="button"
                                onClick={() => handleSelectDuration(sec)}
                                className={`px-2 py-0.5 rounded-lg text-[10px] sm:text-2xs font-mono font-bold transition-all cursor-pointer active:scale-95 ${
                                    duration === sec && !showCustomInput ? 'bg-amber-400 text-slate-950 font-black shadow-xs ring-1 ring-amber-300 scale-105' : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800'
                                }`}
                            >
                                {label}
                            </button>
                        ))}

                        <button
                            type="button"
                            onClick={() => setShowCustomInput(!showCustomInput)}
                            className={`px-2 py-0.5 rounded-lg text-[10px] sm:text-2xs font-bold transition-all cursor-pointer flex items-center gap-0.5 ${
                                showCustomInput ? 'bg-amber-400 text-slate-950 font-black shadow-xs' : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-amber-300 border border-slate-800'
                            }`}
                            title="Digitar tempo específico (ex: 90 ou 1:30)"
                        >
                            <span>✏️</span>
                            <span>Outro</span>
                        </button>
                    </div>

                    {showCustomInput && (
                        <form onSubmit={handleCustomSubmit} className="flex items-center gap-1 mt-1.5 p-1 bg-slate-900 border border-amber-500/40 rounded-xl animate-in slide-in-from-top-1">
                            <input
                                type="text"
                                value={customInput}
                                onChange={(e) => setCustomInput(e.target.value)}
                                placeholder="Ex: 90 ou 1:30"
                                className="flex-1 bg-transparent px-2 py-0.5 text-xs text-white font-mono placeholder:text-slate-500 outline-none"
                                autoFocus
                            />
                            <button type="submit" className="px-2.5 py-0.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-lg transition-all cursor-pointer">OK</button>
                            <button type="button" onClick={() => setShowCustomInput(false)} className="p-0.5 text-slate-400 hover:text-white text-xs cursor-pointer">✕</button>
                        </form>
                    )}

                    <div className="flex items-center justify-center mt-1.5 pt-1 border-t border-slate-800/80">
                        <label className="flex items-center gap-1.5 cursor-pointer group" onClick={e => e.stopPropagation()}>
                            <div className="relative flex items-center">
                                <input 
                                    type="checkbox" 
                                    checked={tickEnabled} 
                                    onChange={(e) => setTickEnabled(e.target.checked)}
                                    className="peer sr-only"
                                />
                                <div className="w-7 h-3.5 bg-slate-800 border border-slate-700 rounded-full peer-checked:bg-amber-500/30 peer-checked:border-amber-500 transition-all after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-slate-500 after:rounded-full after:h-2.5 after:w-2.5 after:transition-all peer-checked:after:translate-x-3.5 peer-checked:after:bg-amber-400"></div>
                            </div>
                            <span className="text-[9px] sm:text-[10px] text-slate-400 font-bold tracking-wide uppercase group-hover:text-slate-300 transition-colors select-none">
                                Ouvir Batida do Cronômetro
                            </span>
                        </label>
                    </div>
                </div>
            </div>
        </div>
    );
};
