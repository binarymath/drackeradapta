import React, { useEffect, useState, useRef } from 'react';

const CYBER_COLORS = [
    '#00f0ff', // Ciano neon elétrico
    '#ff007f', // Rosa neon choque
    '#a855f7', // Roxo synthwave
    '#39ff14', // Verde ácido
    '#ffe600', // Amarelo cyberpunk
    '#00bfff', // Azul laser
    '#ff3b30', // Vermelho laser
    '#7928ca', // Violeta profundo
];

export const CyberpunkWheel = ({ items = [], spinning = false, winner = null, onSpinComplete }) => {
    const [rotation, setRotation] = useState(0);
    const [hudTick, setHudTick] = useState(0);
    const audioCtxRef = useRef(null);

    // Efeito de pulso de dados do HUD
    useEffect(() => {
        const interval = setInterval(() => {
            setHudTick(prev => (prev + 1) % 100);
        }, 100);
        return () => clearInterval(interval);
    }, []);

    // Efeito sonoro Sci-Fi sintetizado
    useEffect(() => {
        if (spinning) {
            try {
                if (!audioCtxRef.current) {
                    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
                    if (AudioContextClass) audioCtxRef.current = new AudioContextClass();
                }
                const ctx = audioCtxRef.current;
                if (ctx && ctx.state === 'suspended') {
                    ctx.resume().catch(() => {});
                }

                let tick = 0;
                const maxTicks = 42;
                let timeoutId;

                const playLaserTick = () => {
                    if (tick >= maxTicks) return;
                    if (!ctx || ctx.state === 'closed') return;

                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();

                    osc.type = 'sawtooth';
                    // Frequência modulada decrescente futurista
                    const startFreq = 1200 - (tick * 15);
                    osc.frequency.setValueAtTime(startFreq, ctx.currentTime);
                    osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.04);

                    gain.gain.setValueAtTime(0.08, ctx.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);

                    osc.connect(gain);
                    gain.connect(ctx.destination);

                    osc.start();
                    osc.stop(ctx.currentTime + 0.04);

                    tick++;
                    const progress = tick / maxTicks;
                    const ease = Math.pow(progress, 3);
                    const nextDelay = 30 + (ease * 380);

                    timeoutId = setTimeout(playLaserTick, nextDelay);
                };

                playLaserTick();

                return () => {
                    clearTimeout(timeoutId);
                };
            } catch (e) {}
        }
    }, [spinning]);

    // Cálculo da rotação
    useEffect(() => {
        if (spinning && winner && items.length > 0) {
            const winnerIdx = items.findIndex(i => i.id === winner.id);
            if (winnerIdx === -1) return;

            const numItems = items.length;
            const sliceAngle = 360 / numItems;

            const winnerCenterAngle = (winnerIdx * sliceAngle) + (sliceAngle / 2);
            const randomOffset = (Math.random() - 0.5) * (sliceAngle * 0.5);

            const extraSpins = 360 * 7; // Mais giros em alta velocidade
            const currentRotationMod = rotation % 360;
            const newRotation = rotation + extraSpins + (360 - winnerCenterAngle - currentRotationMod) + randomOffset;

            setRotation(newRotation);

            const timeout = setTimeout(() => {
                if (onSpinComplete) onSpinComplete();
            }, 5000);

            return () => clearTimeout(timeout);
        }
    }, [spinning, winner]);

    if (!items || items.length === 0) {
        return (
            <div className="w-80 h-80 flex flex-col items-center justify-center bg-slate-950 rounded-full border-2 border-cyan-500/40 text-cyan-400 font-mono p-6 text-center shadow-[0_0_30px_rgba(0,240,255,0.2)]">
                <span className="text-3xl mb-2 animate-pulse">⚡</span>
                <span className="text-xs uppercase tracking-widest">[NO_TARGETS_ACQUIRED]</span>
            </div>
        );
    }

    const createSlicePath = (index, total) => {
        const startAngle = (index * 360) / total;
        const endAngle = ((index + 1) * 360) / total;

        const startRad = (startAngle - 90) * (Math.PI / 180);
        const endRad = (endAngle - 90) * (Math.PI / 180);

        const cx = 150;
        const cy = 150;
        const r = 132;

        const x1 = cx + r * Math.cos(startRad);
        const y1 = cy + r * Math.sin(startRad);
        const x2 = cx + r * Math.cos(endRad);
        const y2 = cy + r * Math.sin(endRad);

        const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;

        return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
    };

    const getLabelCoordinates = (index, total) => {
        const angle = (index * 360) / total + (360 / total) / 2;
        const rad = (angle - 90) * (Math.PI / 180);
        const r = 85;
        return {
            x: 150 + r * Math.cos(rad),
            y: 150 + r * Math.sin(rad),
            angle: angle
        };
    };

    return (
        <div className="relative w-80 h-80 sm:w-96 sm:h-96 md:w-[440px] md:h-[440px] flex items-center justify-center select-none">
            {/* Mira Laser Superior Futurista */}
            <div className="absolute -top-7 left-1/2 transform -translate-x-1/2 z-30 pointer-events-none drop-shadow-[0_0_15px_#00f0ff]">
                <div className="flex flex-col items-center">
                    <div className="px-2 py-0.5 bg-black/90 border border-cyan-400 rounded text-[9px] font-mono font-black text-cyan-300 tracking-wider mb-1 shadow-[0_0_10px_rgba(0,240,255,0.5)]">
                        {spinning ? 'SCANNING...' : 'TARGET_LOCK'}
                    </div>
                    <svg width="34" height="42" viewBox="0 0 34 42" fill="none">
                        <polygon points="17,42 0,10 34,10" fill="#00f0ff" />
                        <polygon points="17,35 6,12 28,12" fill="#050515" />
                        <line x1="17" y1="0" x2="17" y2="40" stroke="#ff007f" strokeWidth="2" />
                    </svg>
                </div>
            </div>

            {/* Anéis de HUD Tecnológico ao Redor */}
            <div className="absolute inset-0 rounded-full border border-cyan-500/30 animate-[spin_40s_linear_infinite] pointer-events-none" />
            <div className="absolute -inset-3 rounded-full border border-dashed border-purple-500/20 animate-[spin_60s_linear_infinite_reverse] pointer-events-none" />

            {/* A Roleta Cyberpunk */}
            <div
                className="w-full h-full rounded-full bg-slate-950 relative shadow-[0_0_60px_rgba(0,240,255,0.25),0_0_100px_rgba(168,85,247,0.15)] border-2 border-cyan-400/80"
                style={{
                    transform: `rotate(${rotation}deg)`,
                    transition: spinning ? 'transform 5s cubic-bezier(0.1, 0.82, 0.16, 1)' : 'none'
                }}
            >
                <svg viewBox="0 0 300 300" className="w-full h-full">
                    <defs>
                        <radialGradient id="cyberCore" cx="50%" cy="50%" r="50%">
                            <stop offset="0%" stopColor="#00f0ff" stopOpacity="0.8" />
                            <stop offset="60%" stopColor="#1e1b4b" stopOpacity="0.9" />
                            <stop offset="100%" stopColor="#020617" />
                        </radialGradient>
                    </defs>

                    {/* Borda Externa Tecnológica com Marcações de Ângulos */}
                    <circle cx="150" cy="150" r="148" fill="#030712" stroke="#00f0ff" strokeWidth="3" />
                    <circle cx="150" cy="150" r="140" fill="none" stroke="#a855f7" strokeWidth="1" strokeDasharray="4 6" />

                    {/* Fatias da Roleta */}
                    <g>
                        {items.map((item, i) => {
                            const path = createSlicePath(i, items.length);
                            const labelCoords = getLabelCoordinates(i, items.length);

                            return (
                                <g key={item.id}>
                                    <path
                                        d={path}
                                        fill={CYBER_COLORS[i % CYBER_COLORS.length]}
                                        stroke="#030712"
                                        strokeWidth="2.5"
                                        fillOpacity="0.9"
                                    />
                                    <text
                                        x={labelCoords.x}
                                        y={labelCoords.y}
                                        fill="#020617"
                                        fontSize="12"
                                        fontWeight="900"
                                        fontFamily="monospace"
                                        textAnchor="middle"
                                        alignmentBaseline="middle"
                                        style={{
                                            filter: 'drop-shadow(0px 1px 1px rgba(255,255,255,0.7))',
                                            transformOrigin: `${labelCoords.x}px ${labelCoords.y}px`,
                                            transform: `rotate(${labelCoords.angle > 180 ? labelCoords.angle + 90 : labelCoords.angle - 90}deg)`
                                        }}
                                    >
                                        {item.name.length > 11 ? item.name.substring(0, 9) + '..' : item.name.toUpperCase()}
                                    </text>
                                </g>
                            );
                        })}
                    </g>

                    {/* Núcleo do Reator Holográfico Central */}
                    <circle cx="150" cy="150" r="32" fill="url(#cyberCore)" stroke="#00f0ff" strokeWidth="3" />
                    <circle cx="150" cy="150" r="22" fill="#050515" stroke="#ff007f" strokeWidth="2" strokeDasharray="3 3" />
                    <circle cx="150" cy="150" r="10" fill="#00f0ff" className="animate-ping" style={{ transformOrigin: 'center' }} />
                    <circle cx="150" cy="150" r="7" fill="#ffffff" />
                </svg>
            </div>

            {/* Efeito de Reflexo no Piso Cyberpunk */}
            <div className="absolute -bottom-7 left-1/2 transform -translate-x-1/2 w-72 h-10 bg-cyan-500/20 rounded-[100%] blur-xl -z-10" />
        </div>
    );
};
