import React, { useEffect, useState, useRef } from 'react';

// Símbolos clássicos de caça-níqueis para os rolos laterais
const SLOT_SYMBOLS = ['7️⃣', '💎', '⭐', '🔔', '🍀', '👑', '🍒'];

export const SlotMachineWheel = ({ items = [], spinning = false, winner = null, onSpinComplete }) => {
    // Índices atuais dos rolos
    const [leftSymbol, setLeftSymbol] = useState('7️⃣');
    const [rightSymbol, setRightSymbol] = useState('7️⃣');
    const [currentStudentIdx, setCurrentStudentIdx] = useState(0);

    // Animação da alavanca puxando
    const [leverPulled, setLeverPulled] = useState(false);
    // Moedas caindo na bandeja
    const [coinsDropping, setCoinsDropping] = useState(false);
    // Lâmpadas piscando no topo
    const [lightsToggle, setLightsToggle] = useState(false);
    // Aluno vencedor travado
    const [lockedWinner, setLockedWinner] = useState(null);

    const animTimerRef = useRef(null);
    const audioCtxRef = useRef(null);

    // Piscar lâmpadas da testeira
    useEffect(() => {
        const interval = setInterval(() => {
            setLightsToggle(prev => !prev);
        }, 350);
        return () => clearInterval(interval);
    }, []);

    // Inicialização do contexto de áudio
    const getAudioContext = () => {
        if (!audioCtxRef.current && typeof window !== 'undefined') {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (AudioContextClass) audioCtxRef.current = new AudioContextClass();
        }
        if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
            audioCtxRef.current.resume().catch(() => {});
        }
        return audioCtxRef.current;
    };

    // Som da alavanca sendo puxada
    const playLeverSound = () => {
        try {
            const ctx = getAudioContext();
            if (!ctx) return;

            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(120, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.15);

            gain.gain.setValueAtTime(0.2, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start();
            osc.stop(ctx.currentTime + 0.15);
        } catch (e) {}
    };

    // Som de clique dos rolos girando
    const playReelTick = (pitchMod = 1) => {
        try {
            const ctx = getAudioContext();
            if (!ctx) return;

            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(240 * pitchMod, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.04);

            gain.gain.setValueAtTime(0.12, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start();
            osc.stop(ctx.currentTime + 0.04);
        } catch (e) {}
    };

    // Som clássico de moedas metálicas caindo na bandeja (Jackpot / Coin Drop)
    const playCoinDropSound = () => {
        try {
            const ctx = getAudioContext();
            if (!ctx) return;

            // Vários cliques de moedas caindo em cascata
            const coinCount = 12;
            for (let i = 0; i < coinCount; i++) {
                const startTime = ctx.currentTime + (i * 0.07) + (Math.random() * 0.03);
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();

                // Frequência de metal batendo (moeda dourada)
                const coinFreq = 2800 + (Math.random() * 1400);
                osc.type = 'sine';
                osc.frequency.setValueAtTime(coinFreq, startTime);
                osc.frequency.exponentialRampToValueAtTime(coinFreq * 0.7, startTime + 0.06);

                gain.gain.setValueAtTime(0.15, startTime);
                gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.06);

                osc.connect(gain);
                gain.connect(ctx.destination);

                osc.start(startTime);
                osc.stop(startTime + 0.06);
            }
        } catch (e) {}
    };

    // Efeito quando o sorteio inicia
    useEffect(() => {
        if (!spinning || !winner || items.length === 0) {
            if (!spinning && winner) {
                setLockedWinner(winner);
            }
            return;
        }

        setLockedWinner(null);
        setCoinsDropping(false);

        // Dispara animação física da alavanca puxando
        setLeverPulled(true);
        playLeverSound();
        setTimeout(() => setLeverPulled(false), 500);

        let step = 0;
        const totalSteps = 45;
        let activeIdx = Math.floor(Math.random() * items.length);

        const winnerIndex = items.findIndex(i => i.id === winner.id);
        const targetWinnerIdx = winnerIndex !== -1 ? winnerIndex : 0;

        const cycleReels = () => {
            step++;

            if (step >= totalSteps) {
                // Trava no vencedor com Jackpot 777!
                setCurrentStudentIdx(targetWinnerIdx);
                setLeftSymbol('7️⃣');
                setRightSymbol('7️⃣');
                setLockedWinner(winner);
                setCoinsDropping(true);

                playCoinDropSound();

                setTimeout(() => {
                    if (onSpinComplete) onSpinComplete();
                }, 1000);
                return;
            }

            // Símbolos aleatórios rápidos nos rolos laterais
            setLeftSymbol(SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)]);
            setRightSymbol(SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)]);

            // Troca o aluno atual
            activeIdx = (activeIdx + 1) % items.length;
            setCurrentStudentIdx(activeIdx);

            playReelTick(1 + ((step % 4) * 0.15));

            // Curva de desaceleração Ease-Out
            const progress = step / totalSteps;
            const ease = Math.pow(progress, 2.7);
            const nextDelay = 35 + (ease * 380);

            animTimerRef.current = setTimeout(cycleReels, nextDelay);
        };

        cycleReels();

        return () => {
            if (animTimerRef.current) clearTimeout(animTimerRef.current);
        };
    }, [spinning, winner, items]);

    if (!items || items.length === 0) {
        return (
            <div className="w-80 h-72 sm:w-96 sm:h-80 flex flex-col items-center justify-center bg-gradient-to-b from-amber-950 to-slate-950 rounded-3xl border-4 border-amber-500/50 text-amber-300 font-black p-6 text-center shadow-2xl">
                <span className="text-4xl mb-3">🎰</span>
                <span className="tracking-wider uppercase text-sm">Insira Alunos para Jogar</span>
            </div>
        );
    }

    const displayIdx = lockedWinner ? items.findIndex(i => i.id === lockedWinner.id) : currentStudentIdx;
    const safeIdx = displayIdx >= 0 ? displayIdx : 0;
    const currentStudent = items[safeIdx] || items[0];

    return (
        <div className="relative w-full max-w-lg mx-auto flex items-center justify-center select-none py-2">
            
            {/* ======================================================== */}
            {/* CORPO DO CHASSI DO CAÇA-MOEDAS (SLOT MACHINE CABINET) */}
            {/* ======================================================== */}
            <div className="w-full relative bg-gradient-to-b from-red-900 via-red-950 to-slate-950 rounded-3xl p-4 sm:p-6 shadow-[0_25px_60px_rgba(0,0,0,0.85),0_0_40px_rgba(239,68,68,0.25)] border-4 border-yellow-500/80">
                
                {/* Textura de Acabamento Cromado Superior */}
                <div className="absolute top-0 inset-x-0 h-4 bg-gradient-to-r from-yellow-600 via-amber-300 to-yellow-600 rounded-t-2xl opacity-90" />

                {/* ==================== 1. TESTEIRA COM LÂMPADAS (TOP MARQUEE) ==================== */}
                <div className="relative bg-gradient-to-r from-yellow-700 via-amber-400 to-yellow-700 rounded-2xl p-3 mb-4 shadow-lg border-2 border-yellow-300 text-center overflow-hidden">
                    {/* Linha de Lâmpadas piscantes */}
                    <div className="flex items-center justify-between px-2 mb-1">
                        {Array.from({ length: 9 }).map((_, i) => {
                            const isLit = (i % 2 === 0) ? lightsToggle : !lightsToggle;
                            return (
                                <div
                                    key={i}
                                    className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full border border-black/30 transition-all ${
                                        isLit
                                            ? 'bg-yellow-100 shadow-[0_0_8px_#ffffff]'
                                            : 'bg-amber-900 opacity-60'
                                    }`}
                                />
                            );
                        })}
                    </div>

                    {/* Título Estilo Cassino */}
                    <div className="bg-slate-950/90 py-1.5 px-3 rounded-xl border border-yellow-400/60 flex items-center justify-center gap-2">
                        <span className="text-sm sm:text-base">⭐</span>
                        <h3 className="font-black text-xs sm:text-sm md:text-base tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-200 to-yellow-400 uppercase drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                            CAÇA-MOEDAS DOS ALUNOS
                        </h3>
                        <span className="text-sm sm:text-base">⭐</span>
                    </div>
                </div>

                {/* ==================== 2. JANELA CENTRAL DOS ROLOS (REELS DISPLAY) ==================== */}
                <div className="relative bg-gradient-to-b from-slate-950 via-slate-900 to-black rounded-2xl p-3 sm:p-4 border-4 border-yellow-500 shadow-inner">
                    
                    {/* Linha de Pagamento Central (Payline Dourada) */}
                    <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-16 sm:h-20 border-y-2 border-yellow-400/40 bg-yellow-400/5 pointer-events-none z-10" />

                    {/* Grade de 3 Rolos (Esquerdo / Aluno Central / Direito) */}
                    <div className="grid grid-cols-12 gap-2 relative z-20 items-center">
                        
                        {/* Rolo Esquerdo (Símbolo Clássico 777) */}
                        <div className="col-span-3 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-950 rounded-xl h-20 sm:h-24 flex items-center justify-center border-2 border-slate-700 shadow-lg text-3xl sm:text-4xl">
                            <span className={spinning ? 'animate-bounce' : ''}>
                                {leftSymbol}
                            </span>
                        </div>

                        {/* Rolo Central Principal: NOME DO ALUNO SORTEADO */}
                        <div className={`col-span-6 rounded-xl h-20 sm:h-24 flex flex-col items-center justify-center border-2 transition-all duration-300 px-2 text-center overflow-hidden shadow-2xl ${
                            lockedWinner
                                ? 'bg-gradient-to-b from-amber-500/20 via-yellow-500/30 to-amber-600/20 border-yellow-400 shadow-[0_0_25px_rgba(250,204,21,0.5)] scale-105'
                                : spinning
                                    ? 'bg-slate-900/90 border-amber-400/60'
                                    : 'bg-slate-900 border-slate-700'
                        }`}>
                            <span className="text-[9px] sm:text-[10px] font-black text-amber-400 uppercase tracking-widest mb-0.5">
                                {lockedWinner ? '🏆 JACKPOT ALUNO 🏆' : spinning ? 'SORTEANDO...' : 'ALUNO NA VEZ'}
                            </span>
                            <span className={`font-black uppercase tracking-wider truncate w-full block transition-all ${
                                lockedWinner
                                    ? 'text-lg sm:text-xl md:text-2xl text-yellow-300 drop-shadow-[0_2px_8px_rgba(253,224,71,0.8)] animate-pulse'
                                    : spinning
                                        ? 'text-base sm:text-lg text-amber-400'
                                        : 'text-base sm:text-lg text-white'
                            }`}>
                                {currentStudent?.name || 'PRONTO'}
                            </span>
                        </div>

                        {/* Rolo Direito (Símbolo Clássico 777) */}
                        <div className="col-span-3 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-950 rounded-xl h-20 sm:h-24 flex items-center justify-center border-2 border-slate-700 shadow-lg text-3xl sm:text-4xl">
                            <span className={spinning ? 'animate-bounce' : ''}>
                                {rightSymbol}
                            </span>
                        </div>
                    </div>

                    {/* Vidro de Reflexo Frontal */}
                    <div className="absolute top-0 inset-x-0 h-1/3 bg-gradient-to-b from-white/10 to-transparent pointer-events-none rounded-t-xl" />
                </div>

                {/* ==================== 3. SLOT DE MOEDAS (INSERT COIN BEZEL) ==================== */}
                <div className="mt-4 flex items-center justify-between bg-black/60 rounded-xl p-2.5 border border-yellow-500/40">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-600 border border-yellow-200 flex items-center justify-center shadow-md animate-[spin_8s_linear_infinite]">
                            <span className="text-xs font-black text-amber-950">🪙</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black tracking-widest text-amber-400 uppercase">
                                ENTRADA DE MOEDAS:
                            </span>
                            <span className="text-[11px] font-mono text-slate-300 font-bold">
                                CRÉDITOS: <span className="text-emerald-400 font-black">ILIMITADOS ∞</span>
                            </span>
                        </div>
                    </div>

                    {/* Fenda da Moeda (Coin Slot Bezel) */}
                    <div className="flex items-center gap-1 bg-slate-900 px-3 py-1.5 rounded-lg border border-yellow-400/50 shadow-inner">
                        <div className="w-1 h-5 bg-black rounded-full border border-yellow-500/70 mr-1" />
                        <span className="text-[10px] font-mono font-black text-amber-300">25¢ INSERT</span>
                    </div>
                </div>

                {/* ==================== 4. BANDEJA DE MOEDAS INFERIOR (COIN TRAY) ==================== */}
                <div className="mt-3 relative bg-gradient-to-b from-slate-900 via-slate-800 to-slate-950 rounded-2xl p-3 border-2 border-slate-700 shadow-2xl flex items-center justify-center overflow-hidden">
                    <div className="flex items-center gap-1.5 flex-wrap justify-center py-0.5">
                        {/* Moedas empilhadas na bandeja */}
                        {Array.from({ length: 7 }).map((_, idx) => (
                            <span
                                key={idx}
                                className={`text-xl transition-all duration-300 ${
                                    coinsDropping
                                        ? 'animate-bounce text-yellow-300 drop-shadow-[0_0_8px_#fde047]'
                                        : 'opacity-80'
                                }`}
                                style={{ animationDelay: `${idx * 80}ms` }}
                            >
                                🪙
                            </span>
                        ))}
                    </div>

                    {coinsDropping && (
                        <div className="absolute inset-0 bg-yellow-400/10 pointer-events-none animate-pulse" />
                    )}
                </div>

                {/* ======================================================== */}
                {/* ALAVANCA LATERAL MECÂNICA (PULL LEVER) */}
                {/* ======================================================== */}
                <div className="absolute -right-7 sm:-right-9 top-1/3 flex flex-col items-center pointer-events-none">
                    {/* Bola vermelha do puxador */}
                    <div
                        className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-red-500 via-red-600 to-red-900 border-2 border-red-300 shadow-xl transition-transform duration-300 ${
                            leverPulled ? 'translate-y-12 scale-95' : 'translate-y-0'
                        }`}
                    />
                    {/* Haste metálica cromada da alavanca */}
                    <div
                        className={`w-2 sm:w-2.5 bg-gradient-to-r from-slate-400 via-slate-200 to-slate-500 border border-slate-600 rounded-b transition-all duration-300 origin-top ${
                            leverPulled ? 'h-8' : 'h-16'
                        }`}
                    />
                    {/* Base da alavanca presa ao gabinete */}
                    <div className="w-5 h-6 bg-slate-800 rounded-sm border border-slate-600 shadow-inner -mt-1" />
                </div>
            </div>

            {/* Sombra de Apoio no Chão */}
            <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 w-4/5 h-8 bg-black/60 rounded-[100%] blur-xl -z-10" />
        </div>
    );
};
