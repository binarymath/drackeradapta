import React, { useEffect, useState, useRef } from 'react';

export const MarqueeTickerWheel = ({ items = [], spinning = false, winner = null, onSpinComplete, isMaximized = false }) => {
    // Índice do aluno sendo exibido no letreiro no momento
    const [currentIndex, setCurrentIndex] = useState(0);
    // Letras ou nomes passando
    const [isFlipping, setIsFlipping] = useState(false);
    // Efeito de iluminação nos holofotes
    const [spotlightPulse, setSpotlightPulse] = useState(false);
    // Indicador se terminou o sorteio atual
    const [lockedWinner, setLockedWinner] = useState(null);

    const animationRef = useRef(null);
    const audioCtxRef = useRef(null);

    // Efeito de áudio mecânico de palheta (Split-Flap / Ticker Click)
    const playMechanicalClack = (pitchModifier = 1) => {
        try {
            if (!audioCtxRef.current) {
                const AudioContextClass = window.AudioContext || window.webkitAudioContext;
                if (AudioContextClass) {
                    audioCtxRef.current = new AudioContextClass();
                }
            }
            const ctx = audioCtxRef.current;
            if (!ctx) return;
            if (ctx.state === 'suspended') {
                ctx.resume().catch(() => {});
            }

            // Som 1: Clique seco metálico
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(140 * pitchModifier, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.035);

            gain.gain.setValueAtTime(0.18, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.035);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start();
            osc.stop(ctx.currentTime + 0.035);

            // Som 2: Ruído branco filtrado simulando o impacto do cartão plástico
            const bufferSize = ctx.sampleRate * 0.025;
            const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const output = noiseBuffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                output[i] = Math.random() * 2 - 1;
            }
            const whiteNoise = ctx.createBufferSource();
            whiteNoise.buffer = noiseBuffer;

            const noiseFilter = ctx.createBiquadFilter();
            noiseFilter.type = 'bandpass';
            noiseFilter.frequency.value = 1200 * pitchModifier;

            const noiseGain = ctx.createGain();
            noiseGain.gain.setValueAtTime(0.08, ctx.currentTime);
            noiseGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.025);

            whiteNoise.connect(noiseFilter);
            noiseFilter.connect(noiseGain);
            noiseGain.connect(ctx.destination);

            whiteNoise.start();
            whiteNoise.stop(ctx.currentTime + 0.025);
        } catch (e) {}
    };

    // Som de sino comemorativo quando trava no vencedor
    const playJackpotDing = () => {
        try {
            const ctx = audioCtxRef.current;
            if (!ctx) return;

            const freqs = [587.33, 880, 1174.66]; // D5, A5, D6
            const startTime = ctx.currentTime;

            freqs.forEach((f, i) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();

                osc.type = 'sine';
                osc.frequency.setValueAtTime(f, startTime + (i * 0.08));

                gain.gain.setValueAtTime(0.15, startTime + (i * 0.08));
                gain.gain.exponentialRampToValueAtTime(0.001, startTime + (i * 0.08) + 0.6);

                osc.connect(gain);
                gain.connect(ctx.destination);

                osc.start(startTime + (i * 0.08));
                osc.stop(startTime + (i * 0.08) + 0.6);
            });
        } catch (e) {}
    };

    // Lógica do Letreiro quando está girando/sorteando
    useEffect(() => {
        if (!spinning || !winner || items.length === 0) {
            if (!spinning && winner) {
                setLockedWinner(winner);
            }
            return;
        }

        setLockedWinner(null);
        let step = 0;
        const totalSteps = 42; // Número de trocas de nomes
        let currentIdx = Math.floor(Math.random() * items.length);

        const winnerIndex = items.findIndex(i => String(i.id) === String(winner.id));
        const targetWinnerIdx = winnerIndex !== -1 ? winnerIndex : 0;

        const cycleNames = () => {
            step++;

            if (step >= totalSteps) {
                // Trava no vencedor definitivo!
                setCurrentIndex(targetWinnerIdx);
                setLockedWinner(winner);
                setIsFlipping(true);
                setSpotlightPulse(true);
                playJackpotDing();

                setTimeout(() => {
                    setIsFlipping(false);
                }, 300);

                setTimeout(() => {
                    if (onSpinComplete) onSpinComplete();
                }, 900);
                return;
            }

            // Próximo nome
            currentIdx = (currentIdx + 1) % items.length;
            setCurrentIndex(currentIdx);
            setIsFlipping(prev => !prev);

            // Som mecânico com modulação sutil de tom
            playMechanicalClack(1 + ((step % 3) * 0.1));

            // Curva Ease-Out de desaceleração:
            // Começa em ~35ms e vai aumentando progressivamente até 420ms
            const progress = step / totalSteps;
            const ease = Math.pow(progress, 2.8);
            const nextDelay = 35 + (ease * 430);

            animationRef.current = setTimeout(cycleNames, nextDelay);
        };

        cycleNames();

        return () => {
            if (animationRef.current) clearTimeout(animationRef.current);
        };
    }, [spinning, winner, items]);

    if (!items || items.length === 0) {
        return (
            <div className="w-80 h-72 sm:w-96 sm:h-80 flex flex-col items-center justify-center bg-slate-900 rounded-3xl border-4 border-slate-700 text-amber-400/70 font-mono font-bold p-6 text-center shadow-2xl">
                <span className="text-4xl mb-3">🔤</span>
                <span className="tracking-widest text-sm uppercase">NENHUM ALUNO CADASTRADO</span>
            </div>
        );
    }

    // Alunos para o visor mecânico de 3 faixas
    const displayIndex = lockedWinner ? items.findIndex(i => String(i.id) === String(lockedWinner.id)) : currentIndex;
    const safeIdx = displayIndex >= 0 ? displayIndex : 0;
    
    const prevItem = items[(safeIdx - 1 + items.length) % items.length];
    const activeItem = items[safeIdx] || items[0];
    const nextItem = items[(safeIdx + 1) % items.length];

    const getFontSize = (name, isMax) => {
        const len = name ? name.length : 0;
        if (len > 22) return isMax ? 'text-2xl sm:text-3xl md:text-4xl' : 'text-xl sm:text-2xl md:text-3xl';
        if (len > 14) return isMax ? 'text-3xl sm:text-4xl md:text-5xl' : 'text-2xl sm:text-3xl md:text-4xl';
        return isMax ? 'text-4xl sm:text-5xl md:text-6xl' : 'text-3xl sm:text-4xl md:text-5xl';
    };

    return (
        <div className={`relative w-full ${
            isMaximized ? 'max-w-5xl sm:max-w-6xl md:max-w-[90rem]' : 'max-w-4xl'
        } mx-auto flex flex-col items-center justify-center select-none py-6 transition-all duration-300`}>
            
            {/* ESTRUTURA PRINCIPAL DO LETREIRO (Broadway Style) */}
            <div className="relative w-full flex flex-col items-center bg-zinc-950 p-6 sm:p-8 md:p-10 rounded-2xl sm:rounded-[2rem] border-8 border-zinc-900 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.9),inset_0_4px_20px_rgba(0,0,0,0.8)]">
                
                {/* LÂMPADAS DE BORDA (Dots iluminados estilo camarim/cinema) */}
                <div className="absolute inset-0 m-2 sm:m-3 border-[3px] border-zinc-800 rounded-xl sm:rounded-3xl pointer-events-none" />
                {/* Array de lâmpadas simulado via position absolute */}
                <div className="absolute top-1 left-4 right-4 flex justify-between z-10">
                    {[...Array(isMaximized ? 20 : 12)].map((_, i) => (
                        <div key={`t-${i}`} className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-all duration-100 ${
                            spinning 
                                ? (i % 2 === 0 ? (spotlightPulse ? 'bg-yellow-200 shadow-[0_0_12px_#fef08a]' : 'bg-yellow-900/40') : (!spotlightPulse ? 'bg-yellow-200 shadow-[0_0_12px_#fef08a]' : 'bg-yellow-900/40'))
                                : lockedWinner 
                                    ? 'bg-yellow-200 shadow-[0_0_15px_#fde047] animate-pulse'
                                    : 'bg-yellow-800/60 shadow-none'
                        }`} />
                    ))}
                </div>
                <div className="absolute bottom-1 left-4 right-4 flex justify-between z-10">
                    {[...Array(isMaximized ? 20 : 12)].map((_, i) => (
                        <div key={`b-${i}`} className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-all duration-100 ${
                            spinning 
                                ? (i % 2 !== 0 ? (spotlightPulse ? 'bg-yellow-200 shadow-[0_0_12px_#fef08a]' : 'bg-yellow-900/40') : (!spotlightPulse ? 'bg-yellow-200 shadow-[0_0_12px_#fef08a]' : 'bg-yellow-900/40'))
                                : lockedWinner 
                                    ? 'bg-yellow-200 shadow-[0_0_15px_#fde047] animate-pulse'
                                    : 'bg-yellow-800/60 shadow-none'
                        }`} />
                    ))}
                </div>
                <div className="absolute left-1 top-4 bottom-4 flex flex-col justify-between z-10">
                    {[...Array(isMaximized ? 8 : 6)].map((_, i) => (
                        <div key={`l-${i}`} className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-all duration-100 ${
                            spinning 
                                ? (i % 2 === 0 ? (spotlightPulse ? 'bg-yellow-200 shadow-[0_0_12px_#fef08a]' : 'bg-yellow-900/40') : (!spotlightPulse ? 'bg-yellow-200 shadow-[0_0_12px_#fef08a]' : 'bg-yellow-900/40'))
                                : lockedWinner 
                                    ? 'bg-yellow-200 shadow-[0_0_15px_#fde047] animate-pulse'
                                    : 'bg-yellow-800/60 shadow-none'
                        }`} />
                    ))}
                </div>
                <div className="absolute right-1 top-4 bottom-4 flex flex-col justify-between z-10">
                    {[...Array(isMaximized ? 8 : 6)].map((_, i) => (
                        <div key={`r-${i}`} className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-all duration-100 ${
                            spinning 
                                ? (i % 2 !== 0 ? (spotlightPulse ? 'bg-yellow-200 shadow-[0_0_12px_#fef08a]' : 'bg-yellow-900/40') : (!spotlightPulse ? 'bg-yellow-200 shadow-[0_0_12px_#fef08a]' : 'bg-yellow-900/40'))
                                : lockedWinner 
                                    ? 'bg-yellow-200 shadow-[0_0_15px_#fde047] animate-pulse'
                                    : 'bg-yellow-800/60 shadow-none'
                        }`} />
                    ))}
                </div>

                {/* VISOR CENTRAL DO LETREIRO */}
                <div className="relative w-full bg-black rounded-lg border-2 border-zinc-800 shadow-[inset_0_10px_30px_rgba(0,0,0,1)] p-4 sm:p-6 overflow-hidden flex flex-col justify-center mt-2">
                    
                    {/* Trilhos horizontais simulados */}
                    <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 19px, #fff 20px)' }}></div>
                    
                    {/* Linha Superior (Nome Anterior - Faded Neon) */}
                    <div className={`${isMaximized ? 'h-10 sm:h-14 text-lg sm:text-2xl' : 'h-10 sm:h-12 text-base sm:text-xl'} flex items-center justify-center opacity-20 text-amber-500 font-black tracking-[0.3em] uppercase blur-[2px] truncate w-full px-4`}>
                        {prevItem?.name || '---'}
                    </div>

                    {/* Faixa Central em Destaque (Neon Brilhante) */}
                    <div className={`relative ${isMaximized ? 'h-24 sm:h-32 md:h-40 my-4' : 'h-20 sm:h-28 my-3'} bg-zinc-900/50 rounded-lg flex items-center justify-center overflow-hidden border border-amber-900/30 ${
                        lockedWinner 
                            ? 'shadow-[0_0_40px_rgba(251,191,36,0.2)]' 
                            : ''
                    }`}>
                        <div className={`z-10 px-4 sm:px-6 text-center transition-transform w-full ${
                            isFlipping ? '-translate-y-full opacity-0 scale-95 blur-[4px]' : 'translate-y-0 opacity-100 scale-100 blur-none'
                        } duration-100`}>
                            <span className={`${getFontSize(activeItem?.name, isMaximized)} font-black tracking-widest block uppercase truncate w-full ${
                                lockedWinner
                                    ? 'text-amber-300 drop-shadow-[0_0_15px_#f59e0b]'
                                    : spinning
                                        ? 'text-amber-500 drop-shadow-[0_0_8px_#b45309]'
                                        : 'text-amber-400 drop-shadow-[0_0_10px_#d97706]'
                            }`} style={{ textShadow: lockedWinner ? '0 0 15px #fde047, 0 0 30px #f59e0b, 0 0 45px #b45309' : '0 0 10px #b45309' }}>
                                {activeItem?.name || 'SELECIONE'}
                            </span>
                        </div>
                    </div>

                    {/* Linha Inferior (Próximo Nome - Faded Neon) */}
                    <div className={`${isMaximized ? 'h-10 sm:h-14 text-lg sm:text-2xl' : 'h-10 sm:h-12 text-base sm:text-xl'} flex items-center justify-center opacity-20 text-amber-500 font-black tracking-[0.3em] uppercase blur-[2px] truncate w-full px-4`}>
                        {nextItem?.name || '---'}
                    </div>

                </div>

                {/* Ticker Inferior (Letreiro de Rodapé em LED Vermelho) */}
                <div className="mt-6 w-[90%] border-2 border-red-900/50 bg-black py-2 px-3 rounded-md overflow-hidden relative shadow-[inset_0_2px_10px_rgba(0,0,0,0.8)]">
                    <div className="flex-1 overflow-hidden relative whitespace-nowrap">
                        <div className="animate-marquee text-xs sm:text-sm text-red-500 font-mono font-bold tracking-widest" style={{ textShadow: '0 0 5px #ef4444' }}>
                            {items.map((item, idx) => (
                                <span key={item.id || idx} className="mx-4 uppercase">
                                    {idx + 1}. {item.name}
                                </span>
                            ))}
                            {items.map((item, idx) => (
                                <span key={`rep-${item.id || idx}`} className="mx-4 uppercase">
                                    {idx + 1}. {item.name}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};
