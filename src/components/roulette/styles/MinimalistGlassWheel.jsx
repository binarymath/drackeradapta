import React, { useEffect, useState, useRef } from 'react';

const PASTEL_COLORS = [
    '#6366f1', // Índigo suave
    '#0ea5e9', // Céu pastel
    '#10b981', // Menta esmeralda
    '#f59e0b', // Âmbar quente
    '#ec4899', // Rosa suave
    '#8b5cf6', // Lavanda elegante
    '#14b8a6', // Turquesa serena
    '#f43f5e', // Coral refinado
];

export const MinimalistGlassWheel = ({ items = [], spinning = false, winner = null, onSpinComplete }) => {
    const [rotation, setRotation] = useState(0);
    const audioCtxRef = useRef(null);

    // Efeito Sonoro de Clique de Madeira / Marimba Suave
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

                const playSoftTick = () => {
                    if (tick >= maxTicks) return;
                    if (!ctx || ctx.state === 'closed') return;

                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();

                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(540, ctx.currentTime);
                    osc.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 0.04);

                    gain.gain.setValueAtTime(0.08, ctx.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);

                    osc.connect(gain);
                    gain.connect(ctx.destination);

                    osc.start();
                    osc.stop(ctx.currentTime + 0.04);

                    tick++;
                    const progress = tick / maxTicks;
                    const ease = Math.pow(progress, 2.8);
                    const nextDelay = 35 + (ease * 360);

                    timeoutId = setTimeout(playSoftTick, nextDelay);
                };

                playSoftTick();

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
            const randomOffset = (Math.random() - 0.5) * (sliceAngle * 0.5);

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
            <div className="w-80 h-80 flex flex-col items-center justify-center bg-white/80 backdrop-blur-md rounded-full border border-slate-200 text-slate-400 font-sans p-6 text-center shadow-lg">
                <span className="text-3xl mb-2">💎</span>
                <span className="text-sm font-medium">Nenhum aluno ativo</span>
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
        const r = 138;

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
            {/* Ponteiro Minimalista Agulha de Precisão */}
            <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 z-30 pointer-events-none drop-shadow-md">
                <svg width="24" height="46" viewBox="0 0 24 46" fill="none">
                    <path d="M12 46L6 14C6 10.6863 8.68629 8 12 8C15.3137 8 18 10.6863 18 14L12 46Z" fill="#1e293b" />
                    <circle cx="12" cy="14" r="3" fill="#ffffff" />
                </svg>
            </div>

            {/* A Roleta Glassmorphism */}
            <div
                className="w-full h-full rounded-full bg-white/70 backdrop-blur-xl relative shadow-[0_20px_50px_rgba(0,0,0,0.08),0_1px_3px_rgba(0,0,0,0.05)] border-4 border-white"
                style={{
                    transform: `rotate(${rotation}deg)`,
                    transition: spinning ? 'transform 5s cubic-bezier(0.12, 0.8, 0.15, 1)' : 'none'
                }}
            >
                <svg viewBox="0 0 300 300" className="w-full h-full">
                    {/* Borda externa branca pura */}
                    <circle cx="150" cy="150" r="147" fill="#ffffff" />
                    <circle cx="150" cy="150" r="140" fill="#f8fafc" />

                    {/* Fatias */}
                    <g>
                        {items.map((item, i) => {
                            const path = createSlicePath(i, items.length);
                            const labelCoords = getLabelCoordinates(i, items.length);

                            return (
                                <g key={item.id}>
                                    <path
                                        d={path}
                                        fill={PASTEL_COLORS[i % PASTEL_COLORS.length]}
                                        stroke="#ffffff"
                                        strokeWidth="2.5"
                                    />
                                    <text
                                        x={labelCoords.x}
                                        y={labelCoords.y}
                                        fill="#ffffff"
                                        fontSize="12.5"
                                        fontWeight="700"
                                        fontFamily="Inter, system-ui, sans-serif"
                                        textAnchor="middle"
                                        alignmentBaseline="middle"
                                        style={{
                                            filter: 'drop-shadow(0px 1px 2px rgba(0,0,0,0.3))',
                                            transformOrigin: `${labelCoords.x}px ${labelCoords.y}px`,
                                            transform: `rotate(${labelCoords.angle > 180 ? labelCoords.angle + 90 : labelCoords.angle - 90}deg)`
                                        }}
                                    >
                                        {item.name.length > 12 ? item.name.substring(0, 10) + '...' : item.name}
                                    </text>
                                </g>
                            );
                        })}
                    </g>

                    {/* Centro: Vidro Fosco Nórdico com Anel de Aço */}
                    <circle cx="150" cy="150" r="28" fill="#ffffff" stroke="#e2e8f0" strokeWidth="2" filter="drop-shadow(0px 2px 4px rgba(0,0,0,0.1))" />
                    <circle cx="150" cy="150" r="16" fill="#f1f5f9" />
                    <circle cx="150" cy="150" r="6" fill="#64748b" />
                </svg>
            </div>

            {/* Sombra Suave e Flutuante */}
            <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 w-64 h-10 bg-slate-400/20 rounded-[100%] blur-xl -z-10" />
        </div>
    );
};
