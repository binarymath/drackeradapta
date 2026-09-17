import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Flame, Volume2, VolumeX, AlertTriangle, Sparkles, Clock, Maximize2, Minimize2, Minus } from 'lucide-react';
import confetti from 'canvas-confetti';
import { gameAudio } from '../../utils/gameAudio';

export const RouletteTimerBomb = ({ 
    theme = null,
    onExplode = null,
    className = "",
    viewMode: externalViewMode = null,
    onViewModeChange = null
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
                    if (prev <= 6 && soundEnabled) {
                        gameAudio.playBombTick(true);
                    } else if (soundEnabled) {
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
            handleReset();
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
    const formatTime = (totalSeconds) => {
        const safeTotal = Math.max(0, totalSeconds || 0);
        const mins = Math.floor(safeTotal / 60);
        const secs = safeTotal % 60;
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };

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

    // Porcentagem do tempo restante
    const progressPercent = duration > 0 ? (timeLeft / duration) * 100 : 0;
    const isCritical = timeLeft <= 5 && timeLeft > 0;

    // =========================================================================
    // MODO 1: MINIMIZADO (SEPARADO NO CANTO DA TELA COMO WIDGET FLUTUANTE)
    // =========================================================================
    if (viewMode === 'minimized') {
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

                <div className={`rounded-2xl border-2 p-3.5 backdrop-blur-xl shadow-2xl transition-all duration-300 flex flex-col gap-2.5 w-72 sm:w-80 ${
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
                        <div className={`font-mono font-black text-3xl tracking-widest tabular-nums ${
                            isExploded 
                                ? 'text-red-500 animate-pulse' 
                                : isCritical
                                    ? 'text-red-400 animate-pulse drop-shadow-[0_0_10px_#ef4444]'
                                    : isRunning
                                        ? 'text-amber-300 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]'
                                        : 'text-slate-200'
                        }`}>
                            {formatTime(timeLeft)}
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

                    {/* Progress bar */}
                    <div className="w-full bg-slate-900 h-2 rounded-full border border-slate-700 overflow-hidden relative">
                        <div 
                            className={`h-full rounded-full transition-all duration-1000 ${
                                isExploded ? 'bg-red-600' : isCritical ? 'bg-red-500' : isRunning ? 'bg-amber-400' : 'bg-slate-700'
                            }`}
                            style={{ width: `${progressPercent}%` }}
                        />
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
                        </div>
                    </div>

                    {/* Center Giant HUD */}
                    <div className="my-auto py-5 w-full flex flex-col items-center justify-center">
                        <div className="relative w-36 h-36 sm:w-44 sm:h-44 flex items-center justify-center">
                            <svg className="w-full h-full -rotate-90 transform drop-shadow-lg" viewBox="0 0 120 120">
                                <circle cx="60" cy="60" r="50" stroke="currentColor" strokeWidth="6" className="text-slate-800/80" fill="none" />
                                <circle
                                    cx="60" cy="60" r="50" stroke="currentColor" strokeWidth="6"
                                    strokeDasharray={314.15}
                                    strokeDashoffset={314.15 - (314.15 * progressPercent) / 100}
                                    strokeLinecap="round"
                                    className={`transition-all duration-1000 ${
                                        isExploded ? 'text-red-600' : isCritical ? 'text-red-500 drop-shadow-[0_0_12px_#ef4444]' : isRunning ? 'text-amber-400 drop-shadow-[0_0_10px_#f59e0b]' : 'text-slate-600'
                                    }`}
                                    fill="none"
                                />
                            </svg>

                            <div className={`absolute inset-0 flex items-center justify-center transition-transform duration-300 ${
                                isExploded ? 'scale-125 rotate-12 drop-shadow-[0_0_35px_#ef4444]' : isCritical ? 'scale-110 animate-bounce' : isRunning ? 'scale-105' : 'scale-100'
                            }`}>
                                <span className="text-6xl sm:text-7xl select-none">{isExploded ? '💥' : '💣'}</span>
                            </div>
                        </div>

                        {/* Grand Nixie Clock */}
                        <div className="mt-4 text-center w-full">
                            <div className={`font-mono font-black text-6xl sm:text-7xl lg:text-8xl tracking-widest tabular-nums transition-all ${
                                isExploded 
                                    ? 'text-red-500 animate-pulse drop-shadow-[0_0_30px_#ef4444]' 
                                    : isCritical
                                        ? 'text-red-400 drop-shadow-[0_0_22px_#ef4444] animate-pulse'
                                        : isRunning
                                            ? 'text-amber-300 drop-shadow-[0_0_18px_rgba(245,158,11,0.7)]'
                                            : 'text-slate-100'
                            }`}>
                                {formatTime(timeLeft)}
                            </div>

                            <div className="mt-2 flex justify-center">
                                <span className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider border shadow-sm ${
                                    isExploded 
                                        ? 'bg-red-500/20 text-red-300 border-red-500/40 animate-bounce' 
                                        : isRunning 
                                            ? (isCritical ? 'bg-red-500/20 text-red-300 border-red-500/50 animate-pulse' : 'bg-amber-500/20 text-amber-300 border-amber-500/40') 
                                            : 'bg-slate-800/80 text-slate-400 border-slate-700'
                                }`}>
                                    {isExploded ? '💥 TEMPO ESGOTADO!' : isRunning ? (isCritical ? '⚠️ RÁPIDO! VAI EXPLODIR!' : '🔥 PAVIO ACESO • CONTAGEM REGRESSIVA') : '⏱️ PRONTO PARA INICIAR'}
                                </span>
                            </div>
                        </div>

                        {/* Burning fuse */}
                        <div className="w-full bg-slate-900/90 h-3.5 rounded-full border border-slate-700/80 p-0.5 overflow-hidden mt-4 relative shadow-inner">
                            <div 
                                className={`h-full rounded-full transition-all duration-1000 relative ${
                                    isExploded ? 'bg-red-600 shadow-[0_0_10px_#ef4444]' : isCritical ? 'bg-gradient-to-r from-red-600 to-orange-500 shadow-[0_0_10px_#ef4444]' : isRunning ? 'bg-gradient-to-r from-amber-500 to-yellow-400 shadow-[0_0_8px_#f59e0b]' : 'bg-slate-700'
                                }`}
                                style={{ width: `${progressPercent}%` }}
                            />
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
                                <span className="text-base font-mono font-black text-amber-300">{formatTime(duration)}</span>
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
            <div className={`relative w-full h-full rounded-3xl p-5 sm:p-6 border-4 transition-all duration-300 backdrop-blur-xl shadow-2xl flex flex-col justify-between overflow-hidden ${
                isExploded 
                    ? 'bg-gradient-to-b from-red-950 via-slate-950 to-red-950 border-red-500 shadow-[0_0_70px_rgba(239,68,68,0.7)] animate-violent-shake'
                    : isCritical
                        ? 'bg-gradient-to-b from-red-950/90 via-slate-950 to-slate-950 border-red-500/80 shadow-[0_0_40px_rgba(239,68,68,0.45)]'
                        : 'bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border-amber-400 shadow-2xl'
            }`}>

                {/* Efeito cênico de aviso de perigo nos cantos */}
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-yellow-500 via-red-500 to-yellow-500 rounded-t-2xl opacity-80" />

                {/* Header do Cronômetro */}
                <div className="w-full flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
                    <div className="flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-full ${
                            isExploded 
                                ? 'bg-red-500 animate-ping' 
                                : isCritical 
                                    ? 'bg-red-500 animate-ping' 
                                    : isRunning 
                                        ? 'bg-amber-400 animate-pulse' 
                                        : 'bg-emerald-400'
                        }`} />
                        <span className="text-lg">💣</span>
                        <h4 className="font-black text-xs uppercase tracking-wider text-amber-300">
                            Cronômetro Bomba
                        </h4>
                    </div>

                    <div className="flex items-center gap-1">
                        {/* Botão Minimizar no Canto */}
                        <button
                            type="button"
                            onClick={() => changeViewMode('minimized')}
                            className="p-1.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer shadow-2xs"
                            title="Desacoplar e minimizar no canto da tela"
                        >
                            <Minus className="w-3.5 h-3.5" />
                        </button>

                        {/* Botão Maximizar */}
                        <button
                            type="button"
                            onClick={() => changeViewMode('maximized')}
                            className="p-1.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer shadow-2xs"
                            title="Maximizar cronômetro em tela cheia"
                        >
                            <Maximize2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Botão de Som Mudo / Ativo */}
                        <button
                            type="button"
                            onClick={() => setSoundEnabled(prev => !prev)}
                            className={`p-1.5 rounded-xl border transition-colors cursor-pointer ${
                                soundEnabled 
                                    ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 hover:bg-amber-500/30 shadow-2xs' 
                                    : 'bg-slate-800 border-slate-700 text-slate-500 hover:bg-slate-700'
                            }`}
                            title={soundEnabled ? "Silenciar efeitos sonoros" : "Ativar efeitos sonoros"}
                        >
                            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                        </button>
                    </div>
                </div>

                {/* DISPLAY CENTRAL: HUD CIRCULAR, RELÓGIO NIXIE E PAVIO */}
                <div className="flex-1 min-h-0 py-2 w-full flex flex-col items-center justify-center overflow-y-auto custom-scrollbar">
                    
                    {/* HUD Circular da Bomba */}
                    <div className="relative w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center">
                        <svg className="w-full h-full -rotate-90 transform drop-shadow-md" viewBox="0 0 120 120">
                            <circle cx="60" cy="60" r="50" stroke="currentColor" strokeWidth="6" className="text-slate-800/80" fill="none" />
                            <circle
                                cx="60" cy="60" r="50" stroke="currentColor" strokeWidth="6"
                                strokeDasharray={314.15}
                                strokeDashoffset={314.15 - (314.15 * progressPercent) / 100}
                                strokeLinecap="round"
                                className={`transition-all duration-1000 ${
                                    isExploded 
                                        ? 'text-red-600' 
                                        : isCritical
                                            ? 'text-red-500 drop-shadow-[0_0_10px_#ef4444]'
                                            : isRunning
                                                ? 'text-amber-400 drop-shadow-[0_0_8px_#f59e0b]'
                                                : 'text-slate-600'
                                }`}
                                fill="none"
                            />
                        </svg>

                        {isExploded && (
                            <div className="absolute -top-7 flex items-center gap-2 pointer-events-none z-20">
                                <span className="text-xl animate-smoke-billow" style={{ animationDelay: '0s' }}>💨</span>
                                <span className="text-2xl animate-smoke-billow" style={{ animationDelay: '0.3s' }}>🔥</span>
                                <span className="text-xl animate-smoke-billow" style={{ animationDelay: '0.6s' }}>💨</span>
                            </div>
                        )}

                        <div className={`absolute inset-0 flex items-center justify-center transition-transform duration-300 ${
                            isExploded 
                                ? 'scale-125 rotate-12 drop-shadow-[0_0_30px_#ef4444]' 
                                : isCritical
                                    ? 'scale-110 animate-bounce'
                                    : isRunning
                                        ? 'scale-105'
                                        : 'scale-100'
                        }`}>
                            <span className="text-5xl sm:text-6xl select-none">
                                {isExploded ? '💥' : '💣'}
                            </span>
                        </div>

                        {isCritical && !isExploded && (
                            <span className="absolute -top-1 -right-1 flex h-6 w-6">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-6 w-6 bg-red-600 text-xs font-black text-white items-center justify-center shadow-lg">!</span>
                            </span>
                        )}

                        {isRunning && !isExploded && (
                            <div className="absolute -bottom-2 bg-slate-900/90 border border-slate-700 px-2 py-0.5 rounded-full text-[10px] font-mono font-black text-amber-300 shadow-md">
                                {Math.round(progressPercent)}%
                            </div>
                        )}
                    </div>

                    {/* Relógio Digital LED/Nixie */}
                    <div className="mt-3 text-center w-full">
                        <div className={`font-mono font-black text-4xl sm:text-5xl lg:text-6xl tracking-widest tabular-nums transition-all ${
                            isExploded 
                                ? 'text-red-500 animate-pulse drop-shadow-[0_0_25px_#ef4444]' 
                                : isCritical
                                    ? 'text-red-400 drop-shadow-[0_0_18px_#ef4444] animate-pulse'
                                    : isRunning
                                        ? 'text-amber-300 drop-shadow-[0_0_14px_rgba(245,158,11,0.6)]'
                                        : 'text-slate-100 drop-shadow-sm'
                        }`}>
                            {formatTime(timeLeft)}
                        </div>

                        <div className="mt-1.5 flex justify-center">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-2xs font-black uppercase tracking-wider border shadow-xs transition-all ${
                                isExploded 
                                    ? 'bg-red-500/20 text-red-300 border-red-500/40 animate-bounce' 
                                    : isRunning 
                                        ? (isCritical 
                                            ? 'bg-red-500/20 text-red-300 border-red-500/50 animate-pulse' 
                                            : 'bg-amber-500/20 text-amber-300 border-amber-500/40') 
                                        : 'bg-slate-800/80 text-slate-400 border-slate-700'
                            }`}>
                                {isExploded ? (
                                    <><span>💥</span> TEMPO ESGOTADO! A BOMBA EXPLODIU!</>
                                ) : isRunning ? (
                                    isCritical ? (
                                        <><AlertTriangle className="w-3.5 h-3.5 text-red-400" /> RÁPIDO! VAI EXPLODIR!</>
                                    ) : (
                                        <><Flame className="w-3.5 h-3.5 text-amber-400 animate-bounce" /> PAVIO ACESO • CONTAGEM REGRESSIVA</>
                                    )
                                ) : (
                                    <><Clock className="w-3.5 h-3.5 text-slate-400" /> PRONTO • AGUARDANDO INÍCIO</>
                                )}
                            </span>
                        </div>
                    </div>

                    {/* Barra de Pavio */}
                    <div className="w-full bg-slate-900/90 h-3 rounded-full border border-slate-700/80 p-0.5 overflow-hidden mt-3 relative shadow-inner">
                        <div 
                            className={`h-full rounded-full transition-all duration-1000 relative ${
                                isExploded 
                                    ? 'bg-red-600 shadow-[0_0_10px_#ef4444]' 
                                    : isCritical 
                                        ? 'bg-gradient-to-r from-red-600 to-orange-500 shadow-[0_0_10px_#ef4444]' 
                                        : isRunning 
                                            ? 'bg-gradient-to-r from-amber-500 to-yellow-400 shadow-[0_0_8px_#f59e0b]' 
                                            : 'bg-slate-700'
                            }`}
                            style={{ width: `${progressPercent}%` }}
                        >
                            {isRunning && timeLeft > 0 && (
                                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-yellow-200 shadow-[0_0_8px_#fff] animate-ping" />
                            )}
                        </div>
                    </div>
                </div>

                {/* BOTÕES DE CONTROLE PRINCIPAIS */}
                <div className="w-full space-y-2 shrink-0">
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            type="button"
                            onClick={handleTogglePlay}
                            className={`py-3 px-4 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all transform active:scale-95 shadow-md cursor-pointer ${
                                isExploded
                                    ? 'col-span-2 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white shadow-red-500/30'
                                    : isRunning
                                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 shadow-amber-500/20'
                                        : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-emerald-500/20'
                            }`}
                        >
                            {isExploded ? (
                                <>
                                    <RotateCcw className="w-4 h-4" />
                                    <span>Reiniciar Bomba</span>
                                </>
                            ) : isRunning ? (
                                <>
                                    <Pause className="w-4 h-4 fill-slate-950" />
                                    <span>Pausar</span>
                                </>
                            ) : (
                                <>
                                    <Play className="w-4 h-4 fill-slate-950" />
                                    <span>Iniciar Tempo</span>
                                </>
                            )}
                        </button>

                        {!isExploded && (
                            <button
                                type="button"
                                onClick={handleReset}
                                className="py-3 px-4 rounded-2xl font-bold text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                            >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>Resetar</span>
                            </button>
                        )}
                    </div>

                    {!isExploded && (
                        <button
                            type="button"
                            onClick={handleManualExplode}
                            className="w-full py-2 px-3 rounded-xl font-bold text-2xs sm:text-xs text-red-300 bg-red-950/40 hover:bg-red-900/60 border border-red-500/40 hover:border-red-400 transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 shadow-xs group"
                            title="Se o aluno não souber responder, acione para explodir a bomba imediatamente!"
                        >
                            <span className="group-hover:scale-125 transition-transform">💥</span>
                            <span>Não Soube Responder (Detonar!)</span>
                        </button>
                    )}
                </div>

                {/* PAINEL DE CONFIGURAÇÃO DE TEMPO */}
                <div className="w-full mt-3 pt-3 border-t border-white/10 shrink-0">
                    <div className="flex items-center justify-between gap-1 bg-slate-900/90 border border-slate-800 rounded-2xl p-1 shadow-inner mb-2">
                        <div className="flex items-center gap-1">
                            <button type="button" onClick={() => handleAdjustTime(-60)} disabled={duration <= 60} className="px-2 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-black transition-all active:scale-95 disabled:opacity-30 cursor-pointer" title="Diminuir 1 minuto (-60s)">-1m</button>
                            <button type="button" onClick={() => handleAdjustTime(-10)} disabled={duration <= 10} className="px-2 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-black transition-all active:scale-95 disabled:opacity-30 cursor-pointer" title="Diminuir 10 segundos (-10s)">-10s</button>
                        </div>

                        <div className="flex-1 flex flex-col items-center justify-center px-1 text-center">
                            <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Duração: {formatTimeDetailed(duration)}</span>
                            <span className="text-sm font-mono font-black text-amber-300">{formatTime(duration)}</span>
                        </div>

                        <div className="flex items-center gap-1">
                            <button type="button" onClick={() => handleAdjustTime(10)} disabled={duration >= 600} className="px-2 py-1 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-black transition-all active:scale-95 disabled:opacity-30 cursor-pointer" title="Aumentar 10 segundos (+10s)">+10s</button>
                            <button type="button" onClick={() => handleAdjustTime(60)} disabled={duration >= 600} className="px-2 py-1 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-black transition-all active:scale-95 disabled:opacity-30 cursor-pointer" title="Aumentar 1 minuto (+60s)">+1m</button>
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
                                className={`px-2.5 py-1 rounded-xl text-2xs font-mono font-bold transition-all cursor-pointer active:scale-95 ${
                                    duration === sec && !showCustomInput ? 'bg-amber-400 text-slate-950 font-black shadow-xs ring-1 ring-amber-300 scale-105' : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800'
                                }`}
                            >
                                {label}
                            </button>
                        ))}

                        <button
                            type="button"
                            onClick={() => setShowCustomInput(!showCustomInput)}
                            className={`px-2 py-1 rounded-xl text-2xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                                showCustomInput ? 'bg-amber-400 text-slate-950 font-black shadow-xs' : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-amber-300 border border-slate-800'
                            }`}
                            title="Digitar tempo específico (ex: 90 ou 1:30)"
                        >
                            <span>✏️</span>
                            <span>Outro</span>
                        </button>
                    </div>

                    {showCustomInput && (
                        <form onSubmit={handleCustomSubmit} className="flex items-center gap-1.5 mt-2 p-1.5 bg-slate-900 border border-amber-500/40 rounded-xl animate-in slide-in-from-top-1">
                            <input
                                type="text"
                                value={customInput}
                                onChange={(e) => setCustomInput(e.target.value)}
                                placeholder="Ex: 90 ou 1:30"
                                className="flex-1 bg-transparent px-2 py-1 text-xs text-white font-mono placeholder:text-slate-500 outline-none"
                                autoFocus
                            />
                            <button type="submit" className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-lg transition-all cursor-pointer">OK</button>
                            <button type="button" onClick={() => setShowCustomInput(false)} className="p-1 text-slate-400 hover:text-white text-xs cursor-pointer">✕</button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};
