import React, { useEffect, useState, useRef } from 'react';

const ARCADE_COLORS = [
    '#facc15', // Amarelo Pac-Man
    '#ef4444', // Vermelho Mario
    '#3b82f6', // Azul Mega Man
    '#22c55e', // Verde Yoshi
    '#ec4899', // Rosa Kirby
    '#a855f7', // Roxo Spyro
    '#fb923c', // Laranja Sonic
    '#06b6d4', // Ciano Tron
];

export const ArcadeRetroWheel = ({ items = [], spinning = false, winner = null, onSpinComplete }) => {
    const [rotation, setRotation] = useState(0);
    const audioCtxRef = useRef(null);

    // Efeito Sonoro Chiptune 8-Bit (Onda Quadrada Retrô)
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
                const maxTicks = 44;
                let timeoutId;

                const playChiptuneTick = () => {
                    if (tick >= maxTicks) return;
                    if (!ctx || ctx.state === 'closed') return;

                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();

                    // Onda quadrada clássica de NES/GameBoy
                    osc.type = 'square';
                    const notes = [440, 554, 659, 880];
                    const note = notes[tick % notes.length];
                    osc.frequency.setValueAtTime(note, ctx.currentTime);

                    gain.gain.setValueAtTime(0.09, ctx.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.035);

                    osc.connect(gain);
                    gain.connect(ctx.destination);

                    osc.start();
                    osc.stop(ctx.currentTime + 0.035);

                    tick++;
                    const progress = tick / maxTicks;
                    const ease = Math.pow(progress, 2.7);
                    const nextDelay = 35 + (ease * 360);

                    timeoutId = setTimeout(playChiptuneTick, nextDelay);
                };

                playChiptuneTick();

                return () => {
                    clearTimeout(timeoutId);
                };
            } catch (e) {}
        }
    }, [spinning]);

    // Rotação da Roleta
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
            <div className="w-80 h-80 flex flex-col items-center justify-center bg-yellow-400 border-4 border-black text-black font-mono font-black p-6 text-center shadow-[6px_6px_0px_#000]">
                <span className="text-4xl mb-2">👾</span>
                <span>[INSERT PLAYERS]</span>
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
            {/* Banner Flutuante de Arcade no Topo */}
            <div className="absolute -top-7 left-1/2 transform -translate-x-1/2 z-30 pointer-events-none flex flex-col items-center">
                <div className="bg-black text-yellow-400 border-2 border-yellow-400 px-3 py-0.5 text-[10px] font-mono font-black tracking-widest shadow-[3px_3px_0px_#000] mb-1">
                    {spinning ? 'SPINNING!!' : '1P READY'}
                </div>
                {/* Ponteiro Pixel Art */}
                <svg width="32" height="36" viewBox="0 0 32 36" fill="none">
                    <path d="M16 36L2 10H30L16 36Z" fill="#ef4444" stroke="#000" strokeWidth="3" />
                    <path d="M16 28L8 14H24L16 28Z" fill="#facc15" />
                </svg>
            </div>

            {/* Gabinete da Roleta Estilo Pixel */}
            <div
                className="w-full h-full rounded-full bg-black relative border-4 border-black shadow-[8px_8px_0px_#000000]"
                style={{
                    transform: `rotate(${rotation}deg)`,
                    transition: spinning ? 'transform 5s cubic-bezier(0.12, 0.8, 0.15, 1)' : 'none'
                }}
            >
                <svg viewBox="0 0 300 300" className="w-full h-full">
                    {/* Borda Externa Xadrez / Bloco Arcade */}
                    <circle cx="150" cy="150" r="148" fill="#18181b" stroke="#facc15" strokeWidth="4" />

                    {/* Fatias */}
                    <g>
                        {items.map((item, i) => {
                            const path = createSlicePath(i, items.length);
                            const labelCoords = getLabelCoordinates(i, items.length);

                            return (
                                <g key={item.id}>
                                    <path
                                        d={path}
                                        fill={ARCADE_COLORS[i % ARCADE_COLORS.length]}
                                        stroke="#000000"
                                        strokeWidth="3"
                                    />
                                    <text
                                        x={labelCoords.x}
                                        y={labelCoords.y}
                                        fill="#000000"
                                        fontSize="13"
                                        fontWeight="900"
                                        fontFamily="'Courier New', monospace"
                                        textAnchor="middle"
                                        alignmentBaseline="middle"
                                        style={{
                                            filter: 'drop-shadow(0px 1px 0px #ffffff)',
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

                    {/* Botão Central - Moeda / Estrela de Arcade */}
                    <circle cx="150" cy="150" r="32" fill="#facc15" stroke="#000000" strokeWidth="4" />
                    <circle cx="150" cy="150" r="24" fill="#eab308" />
                    {/* Estrela pixel no centro */}
                    <polygon
                        points="150,132 155,145 168,145 157,153 161,166 150,158 139,166 143,153 132,145 145,145"
                        fill="#000000"
                    />
                </svg>
            </div>

            {/* Sombra 2D Pixelada */}
            <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 w-64 h-8 bg-black/40 blur-md rounded-full -z-10" />
        </div>
    );
};
