import React, { useEffect, useState, useRef } from 'react';

const COLORS = [
    '#ff4b4b', // Vermelho vibrante
    '#ff8f00', // Laranja dourado
    '#00e676', // Verde neon
    '#2979ff', // Azul royal
    '#d500f9', // Roxo neon
    '#ff4081', // Rosa choque
    '#00b0ff', // Azul ciano
    '#ffc400', // Amarelo sol
];

export const ClassicVegasWheel = ({ items = [], spinning = false, winner = null, onSpinComplete }) => {
    const [rotation, setRotation] = useState(0);
    const wheelRef = useRef(null);
    const [lightsOn, setLightsOn] = useState(false);

    // Efeito piscar luzes
    useEffect(() => {
        const interval = setInterval(() => {
            setLightsOn(prev => !prev);
        }, 400);
        return () => clearInterval(interval);
    }, []);

    // Efeito Sonoro da Roleta Girando (Web Audio API)
    useEffect(() => {
        if (spinning) {
            let audioCtx;
            try {
                audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            } catch (e) {
                return;
            }

            let tickCount = 0;
            const totalTicks = 45;
            let timeoutId;

            const playTick = () => {
                if (tickCount >= totalTicks) return;

                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();

                osc.type = 'triangle';
                osc.frequency.setValueAtTime(620 - (tickCount * 5), audioCtx.currentTime);

                gain.gain.setValueAtTime(0.14, audioCtx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.045);

                osc.connect(gain);
                gain.connect(audioCtx.destination);

                osc.start();
                osc.stop(audioCtx.currentTime + 0.045);

                tickCount++;

                const progress = tickCount / totalTicks;
                const easeOut = Math.pow(progress, 3);
                const nextDelay = 30 + (easeOut * 350);

                timeoutId = setTimeout(playTick, nextDelay);
            };

            if (audioCtx.state === 'suspended') {
                audioCtx.resume().then(() => playTick()).catch(() => {});
            } else {
                playTick();
            }

            return () => {
                clearTimeout(timeoutId);
                if (audioCtx && audioCtx.state !== 'closed') {
                    audioCtx.close().catch(() => {});
                }
            };
        }
    }, [spinning]);

    // Cálculo da física de giro e parada precisa no vencedor
    useEffect(() => {
        if (spinning && winner && items.length > 0) {
            const winnerIdx = items.findIndex(i => i.id === winner.id);
            if (winnerIdx === -1) return;

            const numItems = items.length;
            const sliceAngle = 360 / numItems;

            const winnerCenterAngle = (winnerIdx * sliceAngle) + (sliceAngle / 2);
            const randomOffset = (Math.random() - 0.5) * (sliceAngle * 0.55);

            const extraSpins = 360 * 6; // 6 voltas completas de suspense
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
            <div className="w-72 h-72 sm:w-80 sm:h-80 flex flex-col items-center justify-center bg-slate-100 rounded-full border-4 border-slate-300 border-dashed text-slate-400 font-bold p-6 text-center">
                <span className="text-3xl mb-2">🎰</span>
                Nenhum aluno ativo na roda
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

    const lightAngles = Array.from({ length: 24 }, (_, i) => i * 15);

    return (
        <div className="relative w-80 h-80 sm:w-96 sm:h-96 md:w-[440px] md:h-[440px] drop-shadow-2xl flex items-center justify-center">
            {/* Ponteiro Dourado Premium */}
            <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 z-30 drop-shadow-xl pointer-events-none">
                <svg width="40" height="60" viewBox="0 0 40 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 60L0 20C0 8.95431 8.95431 0 20 0C31.0457 0 40 8.95431 40 20L20 60Z" fill="url(#vegasPointerGrad)" />
                    <path d="M20 55L4 20C4 11.1634 11.1634 4 20 4C28.8366 4 36 11.1634 36 20L20 55Z" fill="url(#vegasPointerInnerGrad)" />
                    <defs>
                        <linearGradient id="vegasPointerGrad" x1="0" y1="0" x2="40" y2="60" gradientUnits="userSpaceOnUse">
                            <stop stopColor="#FDE047" />
                            <stop offset="1" stopColor="#B45309" />
                        </linearGradient>
                        <linearGradient id="vegasPointerInnerGrad" x1="0" y1="0" x2="40" y2="60" gradientUnits="userSpaceOnUse">
                            <stop stopColor="#FEF08A" />
                            <stop offset="1" stopColor="#D97706" />
                        </linearGradient>
                    </defs>
                </svg>
            </div>

            {/* A Roleta Giratória */}
            <div
                ref={wheelRef}
                className="w-full h-full rounded-full bg-slate-900 relative shadow-[0_0_50px_rgba(245,158,11,0.25)]"
                style={{
                    transform: `rotate(${rotation}deg)`,
                    transition: spinning ? 'transform 5s cubic-bezier(0.12, 0.8, 0.15, 1)' : 'none'
                }}
            >
                <svg viewBox="0 0 300 300" className="w-full h-full drop-shadow-lg">
                    <defs>
                        <radialGradient id="vegasGlare" cx="50%" cy="50%" r="50%" fx="30%" fy="30%">
                            <stop offset="0%" stopColor="rgba(255,255,255,0.4)" />
                            <stop offset="50%" stopColor="rgba(255,255,255,0.05)" />
                            <stop offset="100%" stopColor="rgba(0,0,0,0.6)" />
                        </radialGradient>
                        <linearGradient id="vegasGoldRim" x1="0" y1="0" x2="300" y2="300">
                            <stop offset="0%" stopColor="#f59e0b" />
                            <stop offset="25%" stopColor="#fef08a" />
                            <stop offset="50%" stopColor="#b45309" />
                            <stop offset="75%" stopColor="#fde047" />
                            <stop offset="100%" stopColor="#78350f" />
                        </linearGradient>
                    </defs>

                    {/* Borda Dourada Estilo Cassino */}
                    <circle cx="150" cy="150" r="150" fill="url(#vegasGoldRim)" />
                    <circle cx="150" cy="150" r="141" fill="#1e1b4b" />

                    {/* Lâmpadas da borda */}
                    {lightAngles.map((angle, i) => {
                        const rad = (angle - 90) * (Math.PI / 180);
                        const r = 142;
                        const lx = 150 + r * Math.cos(rad);
                        const ly = 150 + r * Math.sin(rad);
                        const isEven = i % 2 === 0;
                        const isLit = spinning ? (lightsOn ? isEven : !isEven) : true;

                        return (
                            <circle
                                key={i}
                                cx={lx}
                                cy={ly}
                                r="4"
                                fill={isLit ? "#fef08a" : "#713f12"}
                                opacity={isLit ? 1 : 0.4}
                                style={{
                                    filter: isLit ? 'drop-shadow(0px 0px 5px #fef08a)' : 'none',
                                    transition: 'all 0.1s'
                                }}
                            />
                        );
                    })}

                    {/* Fatias */}
                    <g transform="translate(0, 0)">
                        {items.map((item, i) => {
                            const path = createSlicePath(i, items.length);
                            const labelCoords = getLabelCoordinates(i, items.length);

                            return (
                                <g key={item.id}>
                                    <path
                                        d={path}
                                        fill={COLORS[i % COLORS.length]}
                                        stroke="rgba(0,0,0,0.25)"
                                        strokeWidth="2"
                                    />
                                    <text
                                        x={labelCoords.x}
                                        y={labelCoords.y}
                                        fill="white"
                                        fontSize="13"
                                        fontWeight="900"
                                        fontFamily="system-ui, sans-serif"
                                        textAnchor="middle"
                                        alignmentBaseline="middle"
                                        style={{
                                            textShadow: '0px 2px 4px rgba(0,0,0,0.9)',
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

                    {/* Brilho esférico 3D */}
                    <circle cx="150" cy="150" r="135" fill="url(#vegasGlare)" pointerEvents="none" />

                    {/* Botão Central (Gema Ruby / Safira) */}
                    <circle cx="150" cy="150" r="30" fill="#7f1d1d" stroke="#f59e0b" strokeWidth="4" />
                    <circle cx="150" cy="150" r="22" fill="#ef4444" />
                    <path d="M 135 140 A 15 15 0 0 1 165 140 A 15 15 0 0 0 135 140 Z" fill="rgba(255,255,255,0.5)" />
                    <circle cx="150" cy="150" r="8" fill="#fbbf24" />
                    <circle cx="152" cy="148" r="3" fill="#fef3c7" />
                </svg>
            </div>

            {/* Sombra realista na base */}
            <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 w-64 h-12 bg-amber-950/30 rounded-[100%] blur-xl -z-10" />
        </div>
    );
};
