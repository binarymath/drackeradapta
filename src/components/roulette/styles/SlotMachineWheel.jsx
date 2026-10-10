import React, { useEffect, useState, useRef } from 'react';

// Símbolos clássicos de caça-níqueis para os rolos laterais
const SLOT_SYMBOLS = ['7️⃣', '💎', '⭐', '🔔', '🍀', '👑', '🍒'];

export const SlotMachineWheel = ({ items = [], spinning = false, winner = null, onSpinComplete, isMaximized = false }) => {
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

        const winnerIndex = items.findIndex(i => String(i.id) === String(winner.id));
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

    const displayIdx = lockedWinner ? items.findIndex(i => String(i.id) === String(lockedWinner.id)) : currentStudentIdx;
    const safeIdx = displayIdx >= 0 ? displayIdx : 0;
    const currentStudent = items[safeIdx] || items[0];

    const getFontSize = (name, isMax) => {
        const len = name ? name.length : 0;
        if (len > 22) return isMax ? 'text-2xl sm:text-4xl md:text-5xl' : 'text-xl sm:text-2xl md:text-3xl';
        if (len > 14) return isMax ? 'text-3xl sm:text-5xl md:text-6xl' : 'text-2xl sm:text-3xl md:text-4xl';
        return isMax ? 'text-4xl sm:text-6xl md:text-7xl' : 'text-3xl sm:text-5xl';
    };

    return (
        <div className={`relative w-full ${
            isMaximized ? 'max-w-5xl sm:max-w-6xl md:max-w-[90rem]' : 'max-w-4xl'
        } mx-auto flex items-center justify-center select-none py-6 sm:py-12 transition-all duration-300`}>
            
            {/* CHASSI EXTERNO DO CAÇA-MOEDAS (Realista) */}
            <div className="w-full relative flex flex-col items-center justify-center bg-gradient-to-b from-red-800 via-red-700 to-red-950 p-4 sm:p-8 md:p-10 rounded-[2.5rem] sm:rounded-[3rem] border-[6px] border-amber-600 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8),inset_0_4px_15px_rgba(255,255,255,0.3)]">
                
                {/* LÂMPADAS DE TOPO (Topper) */}
                <div className="absolute -top-3 sm:-top-4 w-3/4 flex justify-between px-6 z-20">
                    {[1,2,3,4,5,6].map((i) => (
                        <div key={i} className={`w-4 h-4 sm:w-6 sm:h-6 rounded-full border-2 border-amber-800 bg-yellow-100 transition-all duration-75 ${
                            lightsToggle 
                                ? (i % 2 === 0 ? 'bg-yellow-300 shadow-[0_0_15px_#fde047]' : 'bg-red-400 shadow-[0_0_15px_#ef4444]') 
                                : (i % 2 !== 0 ? 'bg-yellow-300 shadow-[0_0_15px_#fde047]' : 'bg-red-400 shadow-[0_0_15px_#ef4444]')
                        } ${lockedWinner ? 'animate-pulse shadow-[0_0_20px_#fde047]' : ''}`} />
                    ))}
                </div>

                {/* DETALHES DECORATIVOS SUPERIORES */}
                <div className="w-full flex items-center justify-center mb-6">
                    <div className="bg-gradient-to-b from-amber-400 to-amber-600 px-8 py-2 rounded-xl shadow-[0_5px_15px_rgba(0,0,0,0.5),inset_0_2px_5px_rgba(255,255,255,0.5)] border border-amber-700">
                        <span className="font-black text-amber-950 tracking-widest text-sm sm:text-lg drop-shadow-[0_1px_1px_rgba(255,255,255,0.5)] uppercase">
                            {spinning ? 'Boa Sorte!' : 'Drácker Jackpot'}
                        </span>
                    </div>
                </div>

                {/* VISOR DE VIDRO (Inner Shadow Profunda) */}
                <div className="w-full relative flex items-center justify-center gap-2 sm:gap-4 bg-gradient-to-b from-slate-900 to-black p-4 sm:p-6 md:p-8 rounded-2xl shadow-[inset_0_10px_30px_rgba(0,0,0,0.9)] border-4 border-slate-800">
                    
                    {/* LINHA DE PAGAMENTO (Payline) Vermelha Transparente */}
                    <div className="absolute top-1/2 left-0 right-0 h-1 sm:h-1.5 bg-red-500/50 -translate-y-1/2 z-20 pointer-events-none drop-shadow-[0_0_5px_rgba(239,68,68,0.8)]"></div>

                    {/* Rolo Esquerdo (Símbolo Clássico) */}
                    <div className={`bg-gradient-to-b from-gray-400 via-white to-gray-400 shadow-[inset_0_15px_20px_rgba(0,0,0,0.6),inset_0_-15px_20px_rgba(0,0,0,0.6)] rounded-lg ${
                        isMaximized ? 'w-24 h-48 sm:w-32 sm:h-64' : 'w-16 h-36 sm:w-24 sm:h-48'
                    } flex flex-col items-center justify-center border-x-2 border-gray-400 relative overflow-hidden`}>
                        <div className="flex flex-col gap-6 text-2xl sm:text-5xl drop-shadow-md">
                            <span className="opacity-20 blur-[2px]">{SLOT_SYMBOLS[(SLOT_SYMBOLS.indexOf(leftSymbol)+1)%SLOT_SYMBOLS.length]}</span>
                            <span className={`${spinning ? 'blur-[1px]' : ''}`}>{leftSymbol}</span>
                            <span className="opacity-20 blur-[2px]">{SLOT_SYMBOLS[(SLOT_SYMBOLS.indexOf(leftSymbol)+2)%SLOT_SYMBOLS.length]}</span>
                        </div>
                    </div>

                    {/* Rolo Central Principal: NOME DO ALUNO COMPLETO */}
                    <div className={`flex-1 bg-gradient-to-b from-gray-400 via-white to-gray-400 shadow-[inset_0_15px_20px_rgba(0,0,0,0.6),inset_0_-15px_20px_rgba(0,0,0,0.6)] rounded-xl ${
                        isMaximized ? 'h-48 sm:h-64' : 'h-36 sm:h-48'
                    } flex flex-col items-center justify-center border-x-2 border-gray-400 px-4 sm:px-8 text-center overflow-hidden z-10 transition-transform ${
                        lockedWinner ? 'scale-105 ring-4 ring-amber-400/50 shadow-[0_0_40px_rgba(251,191,36,0.5)]' : ''
                    }`}>
                        
                        {/* Nome completo */}
                        <span className={`font-black tracking-tight truncate w-full block uppercase ${getFontSize(currentStudent?.name, isMaximized)} ${
                            lockedWinner
                                ? `text-red-700 drop-shadow-[0_2px_2px_rgba(0,0,0,0.3)]`
                                : spinning
                                    ? `text-slate-800 blur-[2px]`
                                    : `text-slate-800 drop-shadow-sm`
                        }`}>
                            {currentStudent?.name || 'PRONTO'}
                        </span>
                    </div>

                    {/* Rolo Direito (Símbolo Clássico) */}
                    <div className={`bg-gradient-to-b from-gray-400 via-white to-gray-400 shadow-[inset_0_15px_20px_rgba(0,0,0,0.6),inset_0_-15px_20px_rgba(0,0,0,0.6)] rounded-lg ${
                        isMaximized ? 'w-24 h-48 sm:w-32 sm:h-64' : 'w-16 h-36 sm:w-24 sm:h-48'
                    } flex flex-col items-center justify-center border-x-2 border-gray-400 relative overflow-hidden`}>
                        <div className="flex flex-col gap-6 text-2xl sm:text-5xl drop-shadow-md">
                            <span className="opacity-20 blur-[2px]">{SLOT_SYMBOLS[(SLOT_SYMBOLS.indexOf(rightSymbol)+2)%SLOT_SYMBOLS.length]}</span>
                            <span className={`${spinning ? 'blur-[1px]' : ''}`}>{rightSymbol}</span>
                            <span className="opacity-20 blur-[2px]">{SLOT_SYMBOLS[(SLOT_SYMBOLS.indexOf(rightSymbol)+1)%SLOT_SYMBOLS.length]}</span>
                        </div>
                    </div>

                </div>
                
                {/* Bandeja Inferior Metálica */}
                <div className="mt-6 w-full flex items-center justify-between px-4 sm:px-8 bg-gradient-to-b from-zinc-700 to-zinc-900 rounded-xl py-3 border-t-2 border-zinc-500 shadow-inner">
                    <span className="text-zinc-400 font-mono text-xs sm:text-sm tracking-widest">CREDITS: {items.length * 100}</span>
                    <span className="text-zinc-400 font-mono text-xs sm:text-sm tracking-widest">WIN: {lockedWinner ? '7770' : '0'}</span>
                </div>

            </div>
        </div>
    );
};
