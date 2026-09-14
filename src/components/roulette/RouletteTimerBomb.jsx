import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Flame, Volume2, VolumeX, Plus, Minus, AlertTriangle, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { gameAudio } from '../../utils/gameAudio';

export const RouletteTimerBomb = ({ 
    theme = null,
    onExplode = null,
    className = ""
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
            // Se já explodiu, reiniciar primeiro
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

    // Selecionar duração predefinida (NÃO inicia automaticamente, o usuário que inicia)
    const handleSelectDuration = (seconds) => {
        setIsRunning(false);
        setIsExploded(false);
        setDuration(seconds);
        setTimeLeft(seconds);
        if (soundEnabled) gameAudio.playTick();
    };

    // Ajuste Fino (+ / - 5 segundos)
    const handleAdjustTime = (delta) => {
        setIsRunning(false);
        setIsExploded(false);
        const next = Math.max(5, Math.min(300, duration + delta));
        setDuration(next);
        setTimeLeft(next);
        if (soundEnabled) gameAudio.playTick();
    };

    // Submissão de tempo personalizado
    const handleCustomSubmit = (e) => {
        e.preventDefault();
        const parsed = parseInt(customInput, 10);
        if (!isNaN(parsed) && parsed > 0 && parsed <= 999) {
            handleSelectDuration(parsed);
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

        // 1. Áudio de estrondo colossal
        if (soundEnabled) {
            gameAudio.playExplosion();
        }

        // 2. Vibração tátil no aparelho (se disponível)
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            try {
                navigator.vibrate([120, 60, 450, 100, 700]);
            } catch (e) {}
        }

        // 3. Efeito pirotécnico de estilhaços e fogo
        try {
            // Rajada central de fogo e estilhaços
            confetti({
                particleCount: 110,
                spread: 110,
                startVelocity: 55,
                ticks: 240,
                origin: { y: 0.5 },
                colors: ['#ef4444', '#f97316', '#fbbf24', '#ffffff', '#7f1d1d', '#000000']
            });

            // Ondas de choque laterais secundárias
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

    return (
        <div className={`relative w-full max-w-[340px] sm:max-w-[380px] select-none flex flex-col ${className}`}>
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
            <div className={`relative w-full h-full rounded-3xl p-5 border-2 transition-all duration-300 backdrop-blur-xl shadow-2xl flex flex-col items-center justify-between ${
                isExploded 
                    ? 'bg-gradient-to-b from-red-950 via-slate-950 to-red-950 border-red-500 shadow-[0_0_70px_rgba(239,68,68,0.7)] animate-violent-shake'
                    : isCritical
                        ? 'bg-gradient-to-b from-red-950/90 via-slate-950 to-slate-950 border-red-500/80 shadow-[0_0_35px_rgba(239,68,68,0.4)] animate-pulse'
                        : 'bg-slate-950/80 border-amber-500/40 shadow-[0_20px_50px_rgba(0,0,0,0.8)]'
            }`}>

                {/* Efeito cênico de aviso de perigo nos cantos */}
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-yellow-500 via-red-500 to-yellow-500 rounded-t-2xl opacity-80" />

                {/* Header do Cronômetro */}
                <div className="w-full flex items-center justify-between mb-3 pb-2 border-b border-white/10">
                    <div className="flex items-center gap-1.5">
                        <span className="text-xl">💣</span>
                        <h4 className="font-black text-xs uppercase tracking-wider text-amber-300">
                            Cronômetro Bomba
                        </h4>
                    </div>

                    <div className="flex items-center gap-1">
                        {/* Botão de Som Mudo / Ativo */}
                        <button
                            onClick={() => setSoundEnabled(prev => !prev)}
                            className={`p-1.5 rounded-lg border transition-colors ${
                                soundEnabled 
                                    ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 hover:bg-amber-500/30' 
                                    : 'bg-slate-800 border-slate-700 text-slate-500 hover:bg-slate-700'
                            }`}
                            title={soundEnabled ? "Silenciar efeitos da bomba" : "Ativar efeitos da bomba"}
                        >
                            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                        </button>
                    </div>
                </div>

                {/* ======================================================== */}
                {/* DISPLAY CENTRAL: BOMBA E CONTAGEM REGRESSIVA */}
                {/* ======================================================== */}
                <div className="relative my-2 w-full flex flex-col items-center justify-center">
                    
                    {/* Efeito de Fagulha / Pavio no topo da Bomba */}
                    {isRunning && (
                        <div className="flex items-center gap-1 mb-1 text-xs font-mono font-bold text-amber-400 animate-fuse-spark">
                            <Flame className="w-4 h-4 text-orange-500 animate-bounce" />
                            <span>PAVIO ACESO!</span>
                            <Flame className="w-4 h-4 text-red-500 animate-bounce" />
                        </div>
                    )}

                    {/* Ilustração da Bomba com Relógio Digital */}
                    <div className="relative flex items-center justify-center my-1">
                        {isExploded && (
                            /* Fumaça e fuligem subindo da cratera da bomba */
                            <div className="absolute -top-7 flex items-center gap-3 pointer-events-none">
                                <span className="text-xl animate-smoke-billow" style={{ animationDelay: '0s' }}>💨</span>
                                <span className="text-2xl animate-smoke-billow" style={{ animationDelay: '0.35s' }}>🔥</span>
                                <span className="text-xl animate-smoke-billow" style={{ animationDelay: '0.7s' }}>💨</span>
                            </div>
                        )}

                        {/* Ícone Gigante da Bomba */}
                        <div className={`text-6xl sm:text-7xl transition-transform duration-300 ${
                            isExploded 
                                ? 'scale-125 rotate-12 drop-shadow-[0_0_30px_#ef4444]' 
                                : isCritical
                                    ? 'scale-110 animate-bounce'
                                    : isRunning
                                        ? 'scale-105'
                                        : 'scale-100'
                        }`}>
                            {isExploded ? '💥' : '💣'}
                        </div>

                        {/* Indicador de Perigo Pulsante */}
                        {isCritical && (
                            <span className="absolute -top-2 -right-2 flex h-5 w-5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-5 w-5 bg-red-500 text-[10px] font-black text-white items-center justify-center">!</span>
                            </span>
                        )}
                    </div>

                    {/* Grande Relógio Digital em Formato Nixie/LED */}
                    <div className="mt-2 text-center">
                        <div className={`font-mono font-black text-4xl sm:text-5xl tracking-wider drop-shadow-md transition-colors ${
                            isExploded 
                                ? 'text-red-500 animate-pulse drop-shadow-[0_0_20px_#ef4444]' 
                                : isCritical
                                    ? 'text-red-400 drop-shadow-[0_0_12px_#ef4444]'
                                    : isRunning
                                        ? 'text-amber-300 drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]'
                                        : 'text-slate-200'
                        }`}>
                            00:{timeLeft < 10 ? `0${timeLeft}` : timeLeft}
                        </div>
                        
                        <p className={`text-[11px] sm:text-xs font-black mt-1 uppercase tracking-widest transition-all ${
                            isExploded 
                                ? 'text-red-400 drop-shadow-[0_0_12px_#ef4444] animate-bounce' 
                                : isRunning 
                                    ? (isCritical ? '⚠️ RÁPIDO! VAI EXPLODIR!' : 'Contagem Regressiva...') 
                                    : 'Aguardando Início do Professor'
                        }`}>
                            {isExploded 
                                ? '💥 KABUUUUUM! A BOMBA EXPLODIU! 💥' 
                                : isRunning 
                                    ? (isCritical ? '⚠️ RÁPIDO! VAI EXPLODIR!' : 'Contagem Regressiva...') 
                                    : 'Aguardando Início do Professor'}
                        </p>
                    </div>

                    {/* Barra de Pavio / Progresso Queimando */}
                    <div className="w-full bg-slate-900/90 h-3 rounded-full border border-slate-700/80 p-0.5 overflow-hidden my-3 relative shadow-inner">
                        <div 
                            className={`h-full rounded-full transition-all duration-1000 relative ${
                                isExploded 
                                    ? 'bg-red-600' 
                                    : isCritical
                                        ? 'bg-gradient-to-r from-red-600 to-orange-500 shadow-[0_0_10px_#ef4444]'
                                        : 'bg-gradient-to-r from-amber-500 to-yellow-400 shadow-[0_0_8px_#f59e0b]'
                            }`}
                            style={{ width: `${progressPercent}%` }}
                        >
                            {/* Fagulha ardente na ponta do pavio */}
                            {isRunning && timeLeft > 0 && (
                                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-yellow-200 shadow-[0_0_8px_#fff] animate-ping" />
                            )}
                        </div>
                    </div>
                </div>

                {/* ======================================================== */}
                {/* BOTÕES DE AÇÃO: INICIAR / PAUSAR E REINICIAR */}
                {/* ======================================================== */}
                <div className="w-full grid grid-cols-2 gap-2 mt-1">
                    <button
                        onClick={handleTogglePlay}
                        className={`py-2.5 px-3 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all transform active:scale-95 shadow-md cursor-pointer ${
                            isExploded
                                ? 'col-span-2 bg-gradient-to-r from-red-600 to-orange-600 text-white hover:brightness-110'
                                : isRunning
                                    ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 hover:brightness-110 shadow-amber-500/20'
                                    : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 hover:brightness-110 shadow-emerald-500/20'
                        }`}
                    >
                        {isExploded ? (
                            <>
                                <RotateCcw className="w-4 h-4" />
                                <span>Reiniciar Bomba</span>
                            </>
                        ) : isRunning ? (
                            <>
                                <Pause className="w-4 h-4" />
                                <span>Pausar</span>
                            </>
                        ) : (
                            <>
                                <Play className="w-4 h-4" />
                                <span>Iniciar Tempo</span>
                            </>
                        )}
                    </button>

                    {!isExploded && (
                        <button
                            onClick={handleReset}
                            className="py-2.5 px-3 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                        >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Resetar</span>
                        </button>
                    )}
                </div>

                {/* Botão Crítico: "Não Soube Responder / Explodir Agora!" */}
                {!isExploded && (
                    <button
                        onClick={handleManualExplode}
                        className="w-full mt-2 py-2 px-3 rounded-xl font-black text-[11px] sm:text-xs text-red-200 bg-red-950/60 hover:bg-red-900/80 border border-red-500/50 hover:border-red-400 transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 shadow-xs group"
                        title="Se o aluno não souber responder, acione para explodir a bomba imediatamente!"
                    >
                        <span className="group-hover:scale-125 transition-transform">💥</span>
                        <span>Não Soube Responder (Explodir!)</span>
                    </button>
                )}

                {/* ======================================================== */}
                {/* PRESETS DE TEMPO & AJUSTE FINO (+/-) */}
                {/* ======================================================== */}
                <div className="w-full mt-3 pt-3 border-t border-white/10">
                    <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                            Definir Tempo:
                        </span>
                        
                        {/* Ajuste Fino +/- 5s */}
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => handleAdjustTime(-5)}
                                className="p-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs"
                                title="-5 segundos"
                            >
                                <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-[11px] font-mono font-bold text-amber-300 px-1">
                                {duration}s
                            </span>
                            <button
                                onClick={() => handleAdjustTime(5)}
                                className="p-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs"
                                title="+5 segundos"
                            >
                                <Plus className="w-3 h-3" />
                            </button>
                        </div>
                    </div>

                    {/* Botões rápidos de tempo */}
                    <div className="grid grid-cols-4 gap-1.5">
                        {[10, 15, 30, 60].map((sec) => (
                            <button
                                key={sec}
                                onClick={() => handleSelectDuration(sec)}
                                className={`py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                                    duration === sec && !showCustomInput
                                        ? 'bg-amber-400 text-slate-950 shadow-xs ring-1 ring-amber-300 font-black'
                                        : 'bg-slate-900/90 text-slate-300 hover:bg-slate-800 border border-slate-700/80'
                                }`}
                            >
                                {sec}s
                            </button>
                        ))}
                    </div>

                    {/* Alternar para tempo personalizado */}
                    <div className="mt-2 text-center">
                        {!showCustomInput ? (
                            <button
                                onClick={() => setShowCustomInput(true)}
                                className="text-[10px] font-bold text-amber-400/80 hover:text-amber-300 underline"
                            >
                                Inserir outro tempo (segundos)...
                            </button>
                        ) : (
                            <form onSubmit={handleCustomSubmit} className="flex items-center gap-1.5 mt-1">
                                <input
                                    type="number"
                                    min="1"
                                    max="999"
                                    value={customInput}
                                    onChange={(e) => setCustomInput(e.target.value)}
                                    placeholder="Ex: 45"
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white font-mono focus:border-amber-400 outline-none"
                                    autoFocus
                                />
                                <button
                                    type="submit"
                                    className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-lg whitespace-nowrap"
                                >
                                    OK
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowCustomInput(false)}
                                    className="p-1 text-slate-400 hover:text-white text-xs"
                                >
                                    ✕
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
