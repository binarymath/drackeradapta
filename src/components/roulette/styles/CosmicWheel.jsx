import React, { useEffect, useState, useRef } from 'react';

const COSMIC_COLORS = [
    '#4c1d95', // Roxo nebulosa profundo
    '#1e3a8a', // Azul meia-noite
    '#701a75', // Magenta cósmico
    '#0f766e', // Esmeralda astral
    '#b45309', // Dourado estelar
    '#312e81', // Índigo profundo
    '#be185d', // Rosa supernova
    '#0e7490', // Ciano galáctico
];

export const CosmicWheel = ({ items = [], spinning = false, winner = null, onSpinComplete }) => {
    const [rotation, setRotation] = useState(0);
    const audioCtxRef = useRef(null);

    // Efeito Sonoro de Sinos Astrais (Onda Senoidal Cristalina)
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

                const playChimeTick = () => {
                    if (tick >= maxTicks) return;
                    if (!ctx || ctx.state === 'closed') return;

                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();

                    // Frequências místicas pentatônicas celestiais
                    const scale = [523.25, 587.33, 659.25, 783.99, 880.00, 1046.50];
                    const freq = scale[tick % scale.length];

                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(freq, ctx.currentTime);

                    gain.gain.setValueAtTime(0.12, ctx.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

                    osc.connect(gain);
                    gain.connect(ctx.destination);

                    osc.start();
                    osc.stop(ctx.currentTime + 0.12);

                    tick++;
                    const progress = tick / maxTicks;
                    const ease = Math.pow(progress, 2.9);
                    const nextDelay = 35 + (ease * 370);

                    timeoutId = setTimeout(playChimeTick, nextDelay);
                };

                playChimeTick();

                return () => {
                    clearTimeout(timeoutId);
                };
            } catch (e) {}
        }
    }, [spinning]);

    // Rotação física
    useEffect(() => {
        if (spinning && winner && items.length > 0) {
            const winnerIdx = items.findIndex(i => i.id === winner.id);
            if (winnerIdx === -1) return;

            const numItems = items.length;
            const sliceAngle = 360 / numItems;

            const winnerCenterAngle = (winnerIdx * sliceAngle) + (sliceAngle / 2);
            const randomOffset = (Math.random() - 0.5) * (sliceAngle * 0.55);

            const extraSpins = 360 * 6;
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
            <div className="w-80 h-80 flex flex-col items-center justify-center bg-indigo-950 rounded-full border-2 border-indigo-500/40 text-indigo-300 font-serif p-6 text-center shadow-[0_0_40px_rgba(79,70,229,0.3)]">
                <span className="text-3xl mb-2">🌌</span>
                <span>Cosmos aguardando alunos...</span>
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
        const r = 135;

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
            {/* Ponteiro Celestial: Sol e Lua Dourada */}
            <div className="absolute -top-7 left-1/2 transform -translate-x-1/2 z-30 pointer-events-none drop-shadow-[0_0_15px_rgba(253,224,71,0.7)]">
                <svg width="36" height="50" viewBox="0 0 36 50" fill="none">
                    <circle cx="18" cy="18" r="14" fill="#fbbf24" />
                    <path d="M18 48L6 20H30L18 48Z" fill="#f59e0b" />
                    <circle cx="15" cy="15" r="11" fill="#78350f" />
                    <circle cx="18" cy="18" r="6" fill="#fef08a" />
                </svg>
            </div>

            {/* Brilho da Aura Galáctica no Fundo */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-600/20 via-indigo-600/20 to-pink-600/20 blur-2xl animate-pulse -z-10" />

            {/* A Roleta Cósmica */}
            <div
                className="w-full h-full rounded-full bg-slate-950 relative shadow-[0_0_50px_rgba(147,51,234,0.35)] border-2 border-purple-400/50"
                style={{
                    transform: `rotate(${rotation}deg)`,
                    transition: spinning ? 'transform 5s cubic-bezier(0.12, 0.8, 0.15, 1)' : 'none'
                }}
            >
                <svg viewBox="0 0 300 300" className="w-full h-full">
                    <defs>
                        <radialGradient id="cosmicCore" cx="50%" cy="50%" r="50%">
                            <stop offset="0%" stopColor="#fef08a" />
                            <stop offset="40%" stopColor="#a855f7" />
                            <stop offset="100%" stopColor="#0f172a" />
                        </radialGradient>
                    </defs>

                    {/* Borda Estelar com Estrelas Místicas */}
                    <circle cx="150" cy="150" r="148" fill="#090d16" stroke="#9333ea" strokeWidth="2" />
                    <circle cx="150" cy="150" r="142" fill="none" stroke="#fbbf24" strokeWidth="1" strokeDasharray="2 6" />

                    {/* Fatias */}
                    <g>
                        {items.map((item, i) => {
                            const path = createSlicePath(i, items.length);
                            const labelCoords = getLabelCoordinates(i, items.length);

                            return (
                                <g key={item.id}>
                                    <path
                                        d={path}
                                        fill={COSMIC_COLORS[i % COSMIC_COLORS.length]}
                                        stroke="#090d16"
                                        strokeWidth="2"
                                    />
                                    <text
                                        x={labelCoords.x}
                                        y={labelCoords.y}
                                        fill="#fef08a"
                                        fontSize="13"
                                        fontWeight="bold"
                                        fontFamily="serif"
                                        textAnchor="middle"
                                        alignmentBaseline="middle"
                                        style={{
                                            filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.9))',
                                            transformOrigin: `${labelCoords.x}px ${labelCoords.y}px`,
                                            transform: `rotate(${labelCoords.angle > 180 ? labelCoords.angle + 90 : labelCoords.angle - 90}deg)`
                                        }}
                                    >
                                        {item.name.length > 12 ? item.name.substring(0, 10) + '...' : item.name.toUpperCase()}
                                    </text>
                                </g>
                            );
                        })}
                    </g>

                    {/* Centro: Orbe Cósmico de Energia */}
                    <circle cx="150" cy="150" r="30" fill="url(#cosmicCore)" stroke="#fbbf24" strokeWidth="3" />
                    <circle cx="150" cy="150" r="16" fill="#581c87" />
                    <circle cx="150" cy="150" r="8" fill="#fef08a" className="animate-pulse" />
                </svg>
            </div>

            {/* Sombra de Nebulosa na Base */}
            <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 w-64 h-12 bg-purple-900/30 rounded-[100%] blur-xl -z-10" />
        </div>
    );
};
