import React, { useEffect, useState, useRef } from 'react';

export const MarqueeTickerWheel = ({ items = [], spinning = false, winner = null, onSpinComplete }) => {
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

        const winnerIndex = items.findIndex(i => i.id === winner.id);
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
    const displayIndex = lockedWinner ? items.findIndex(i => i.id === lockedWinner.id) : currentIndex;
    const safeIdx = displayIndex >= 0 ? displayIndex : 0;
    
    const prevItem = items[(safeIdx - 1 + items.length) % items.length];
    const activeItem = items[safeIdx] || items[0];
    const nextItem = items[(safeIdx + 1) % items.length];

    return (
        <div className="relative w-full max-w-lg mx-auto flex flex-col items-center select-none">
            {/* Chassis Principal Estilo Painel de Aeroporto / Estação Ferroviária */}
            <div className="w-full bg-gradient-to-b from-slate-950 via-slate-900 to-black rounded-3xl p-5 sm:p-6 shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_30px_rgba(245,158,11,0.15)] border-4 border-slate-800 relative overflow-hidden">
                
                {/* Textura de Linhas de LED sutis */}
                <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none opacity-40" />

                {/* Parafusos nos quatro cantos industriais */}
                <div className="absolute top-2.5 left-2.5 w-2.5 h-2.5 rounded-full bg-slate-600 border border-slate-400 shadow-inner flex items-center justify-center">
                    <div className="w-1.5 h-[1px] bg-slate-800" />
                </div>
                <div className="absolute top-2.5 right-2.5 w-2.5 h-2.5 rounded-full bg-slate-600 border border-slate-400 shadow-inner flex items-center justify-center">
                    <div className="w-1.5 h-[1px] bg-slate-800 rotate-90" />
                </div>
                <div className="absolute bottom-2.5 left-2.5 w-2.5 h-2.5 rounded-full bg-slate-600 border border-slate-400 shadow-inner flex items-center justify-center">
                    <div className="w-1.5 h-[1px] bg-slate-800 rotate-45" />
                </div>
                <div className="absolute bottom-2.5 right-2.5 w-2.5 h-2.5 rounded-full bg-slate-600 border border-slate-400 shadow-inner flex items-center justify-center">
                    <div className="w-1.5 h-[1px] bg-slate-800 -rotate-45" />
                </div>

                {/* Top Header do Letreiro */}
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800/80">
                    <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full transition-all duration-300 ${
                            spinning 
                                ? 'bg-amber-400 shadow-[0_0_12px_#f59e0b] animate-ping' 
                                : lockedWinner
                                    ? 'bg-emerald-400 shadow-[0_0_12px_#10b981]'
                                    : 'bg-emerald-500 shadow-[0_0_8px_#10b981]'
                        }`} />
                        <span className="font-mono text-[11px] sm:text-xs font-black tracking-widest text-amber-400/90 uppercase">
                            {spinning ? 'SORTEANDO PARTICIPANTE...' : lockedWinner ? 'ALUNO SORTEADO 🏆' : 'LETREIRO ELETRÔNICO PRONTO'}
                        </span>
                    </div>

                    <div className="flex items-center gap-1.5 bg-black/60 px-2.5 py-1 rounded-md border border-slate-800">
                        <span className="text-[10px] font-mono font-bold text-slate-400">TOTAL:</span>
                        <span className="text-[11px] font-mono font-black text-amber-300">{items.length}</span>
                    </div>
                </div>

                {/* Janela Central Mecânica: Display Split-Flap de 3 Faixas */}
                <div className="relative bg-black rounded-2xl p-2 sm:p-3 border-2 border-slate-800/90 shadow-inner overflow-hidden">
                    
                    {/* Linha Superior (Nome Anterior - Faded) */}
                    <div className="h-10 sm:h-12 flex items-center justify-center opacity-30 text-slate-300 font-mono text-sm sm:text-base tracking-wider overflow-hidden">
                        {prevItem?.name ? prevItem.name.toUpperCase() : '---'}
                    </div>

                    {/* Faixa Central em Destaque: O Split-Flap Principal */}
                    <div className={`relative h-20 sm:h-24 my-1 rounded-xl bg-gradient-to-b from-slate-900 via-slate-950 to-black border-2 transition-all duration-200 flex items-center justify-center shadow-2xl overflow-hidden ${
                        lockedWinner 
                            ? 'border-amber-400/90 shadow-[0_0_35px_rgba(245,158,11,0.4)] scale-[1.02]' 
                            : spinning 
                                ? 'border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.25)]' 
                                : 'border-slate-700/60'
                    }`}>
                        {/* Linha Horizontal de Corte Mecânico (Split Crease) */}
                        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[2px] bg-black shadow-[0_1px_0_rgba(255,255,255,0.15)] z-20 pointer-events-none" />

                        {/* Dobradiças laterais do Split-Flap */}
                        <div className="absolute left-1 top-1/2 -translate-y-1/2 w-2 h-4 bg-slate-700 rounded-sm border border-slate-500 z-30" />
                        <div className="absolute right-1 top-1/2 -translate-y-1/2 w-2 h-4 bg-slate-700 rounded-sm border border-slate-500 z-30" />

                        {/* Brilho Superior do Cartão de Aba */}
                        <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-white/[0.08] to-transparent pointer-events-none" />

                        {/* Nome do Aluno Ativo */}
                        <div className={`z-10 px-4 sm:px-6 text-center font-mono font-black transition-all ${
                            isFlipping ? 'scale-95 opacity-90' : 'scale-100 opacity-100'
                        }`}>
                            <span className={`text-xl sm:text-2xl md:text-3xl tracking-widest uppercase truncate block ${
                                lockedWinner
                                    ? 'text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 drop-shadow-[0_2px_10px_rgba(253,224,71,0.6)] animate-pulse'
                                    : spinning
                                        ? 'text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]'
                                        : 'text-slate-100'
                            }`}>
                                {activeItem?.name || 'SELECIONE'}
                            </span>
                        </div>

                        {/* Holofotes laterais de iluminação */}
                        {lockedWinner && (
                            <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 via-transparent to-amber-500/10 pointer-events-none animate-pulse" />
                        )}
                    </div>

                    {/* Linha Inferior (Próximo Nome - Faded) */}
                    <div className="h-10 sm:h-12 flex items-center justify-center opacity-30 text-slate-300 font-mono text-sm sm:text-base tracking-wider overflow-hidden">
                        {nextItem?.name ? nextItem.name.toUpperCase() : '---'}
                    </div>

                    {/* Foco Centralizador Indicador Lateral */}
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 text-amber-500 text-lg font-black pl-1 pointer-events-none">
                        ▶
                    </div>
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 text-amber-500 text-lg font-black pr-1 pointer-events-none">
                        ◀
                    </div>
                </div>

                {/* Fita Ticker Tape Rolante Inferior (Marquee Contínuo dos Alunos) */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center gap-2 overflow-hidden bg-black/40 rounded-xl px-3 py-2 border border-slate-800">
                    <span className="text-[10px] font-mono font-black text-amber-400/90 uppercase whitespace-nowrap flex items-center gap-1">
                        <span className="animate-pulse">●</span> TURMA:
                    </span>
                    
                    <div className="flex-1 overflow-hidden relative whitespace-nowrap">
                        <div className="animate-marquee font-mono text-xs text-slate-400 font-medium">
                            {items.map((item, idx) => (
                                <span key={item.id || idx} className="mx-2 hover:text-amber-300 transition-colors">
                                    [#{idx + 1} {item.name.toUpperCase()}]
                                </span>
                            ))}
                            {/* Repetição para loop contínuo */}
                            {items.map((item, idx) => (
                                <span key={`rep-${item.id || idx}`} className="mx-2 hover:text-amber-300 transition-colors">
                                    [#{idx + 1} {item.name.toUpperCase()}]
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Barra Inferior com Indicadores Estilo Console Retrô */}
                <div className="mt-3 flex items-center justify-between text-[10px] font-mono text-slate-500 px-1">
                    <span>SYS_MODE: FLAP_TICKER</span>
                    <span className={spinning ? 'text-amber-400 animate-pulse font-bold' : ''}>
                        {spinning ? 'ROTATING CYLINDERS...' : 'STANDBY'}
                    </span>
                    <span>FPS: 60</span>
                </div>
            </div>

            {/* Sombra de apoio no chão */}
            <div className="w-4/5 h-6 bg-black/50 blur-xl rounded-[100%] mt-2 -z-10" />
        </div>
    );
};
