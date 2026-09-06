import React, { useEffect, useState, useRef } from 'react';

// Cores premium para as fatias
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

export const RouletteWheel = ({ items, spinning, winner, onSpinComplete }) => {
    const [rotation, setRotation] = useState(0);
    const wheelRef = useRef(null);
    const [lightsOn, setLightsOn] = useState(false);

    // Efeito piscar luzes
    useEffect(() => {
        const interval = setInterval(() => {
            setLightsOn(prev => !prev);
        }, 500);
        return () => clearInterval(interval);
    }, []);

    // Efeito Sonoro da Roleta Girando
    useEffect(() => {
        if (spinning) {
            let audioCtx;
            try {
                audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            } catch (e) {
                console.warn("AudioContext não suportado");
                return;
            }

            let tickCount = 0;
            const totalTicks = 45; // Quantidade de "cliques"
            let timeoutId;

            const playTick = () => {
                if (tickCount >= totalTicks) return;

                // Cria o som de "clique" (madeira/plástico batendo)
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                
                // Tipo de onda rápida para parecer um estalo
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(600 - (tickCount * 5), audioCtx.currentTime); // Vai ficando mais grave
                
                // Envelope de volume (muito rápido)
                gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.05);
                
                osc.connect(gain);
                gain.connect(audioCtx.destination);
                
                osc.start();
                osc.stop(audioCtx.currentTime + 0.05);

                tickCount++;

                // Calcula o atraso para o próximo clique usando uma curva Ease-Out
                // No início é rápido (menor atraso), no final é lento (maior atraso)
                const progress = tickCount / totalTicks;
                const easeOut = Math.pow(progress, 3); // curva exponencial
                const nextDelay = 30 + (easeOut * 350); // de 30ms a 380ms de intervalo

                timeoutId = setTimeout(playTick, nextDelay);
            };

            // Inicia o som
            if (audioCtx.state === 'suspended') {
                audioCtx.resume().then(() => playTick());
            } else {
                playTick();
            }

            return () => {
                clearTimeout(timeoutId);
                if (audioCtx && audioCtx.state !== 'closed') {
                    audioCtx.close().catch(e => console.log(e));
                }
            };
        }
    }, [spinning]);

    useEffect(() => {
        if (spinning && winner && items.length > 0) {
            const winnerIdx = items.findIndex(i => i.id === winner.id);
            if (winnerIdx === -1) return;

            const numItems = items.length;
            const sliceAngle = 360 / numItems;
            
            const winnerCenterAngle = (winnerIdx * sliceAngle) + (sliceAngle / 2);
            const randomOffset = (Math.random() - 0.5) * (sliceAngle * 0.6);
            
            const extraSpins = 360 * 6; // Mais giros para emoção
            const currentRotationMod = rotation % 360;
            const newRotation = rotation + extraSpins + (360 - winnerCenterAngle - currentRotationMod) + randomOffset;

            setRotation(newRotation);

            const timeout = setTimeout(() => {
                if (onSpinComplete) onSpinComplete();
            }, 5000); // 5s de suspense

            return () => clearTimeout(timeout);
        }
    }, [spinning, winner]);

    if (items.length === 0) {
        return (
            <div className="w-80 h-80 flex items-center justify-center bg-slate-100 rounded-full border-4 border-slate-300 border-dashed text-slate-400 font-bold">
                Sem alunos
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
        const r = 135; // Raio menor para caber a borda com luzes

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

    // Posições das luzes na borda
    const lightAngles = Array.from({length: 24}, (_, i) => i * 15);

    return (
        <div className="relative w-80 h-80 sm:w-96 sm:h-96 md:w-[450px] md:h-[450px] drop-shadow-2xl">
            
            {/* Ponteiro Dourado Premium */}
            <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 z-20 drop-shadow-xl pointer-events-none">
                <svg width="40" height="60" viewBox="0 0 40 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 60L0 20C0 8.95431 8.95431 0 20 0C31.0457 0 40 8.95431 40 20L20 60Z" fill="url(#pointerGrad)" />
                    <path d="M20 55L4 20C4 11.1634 11.1634 4 20 4C28.8366 4 36 11.1634 36 20L20 55Z" fill="url(#pointerInnerGrad)" />
                    <defs>
                        <linearGradient id="pointerGrad" x1="0" y1="0" x2="40" y2="60" gradientUnits="userSpaceOnUse">
                            <stop stopColor="#FDE047" />
                            <stop offset="1" stopColor="#B45309" />
                        </linearGradient>
                        <linearGradient id="pointerInnerGrad" x1="0" y1="0" x2="40" y2="60" gradientUnits="userSpaceOnUse">
                            <stop stopColor="#FEF08A" />
                            <stop offset="1" stopColor="#D97706" />
                        </linearGradient>
                    </defs>
                </svg>
            </div>

            {/* A Roleta */}
            <div 
                ref={wheelRef}
                className="w-full h-full rounded-full bg-slate-900 relative shadow-[0_0_40px_rgba(0,0,0,0.5)]"
                style={{
                    transform: `rotate(${rotation}deg)`,
                    transition: spinning ? 'transform 5s cubic-bezier(0.12, 0.8, 0.15, 1)' : 'none' // Curva de física realista
                }}
            >
                <svg viewBox="0 0 300 300" className="w-full h-full drop-shadow-lg">
                    <defs>
                        {/* Brilho esférico por cima de tudo */}
                        <radialGradient id="glassGlare" cx="50%" cy="50%" r="50%" fx="30%" fy="30%">
                            <stop offset="0%" stopColor="rgba(255,255,255,0.4)" />
                            <stop offset="50%" stopColor="rgba(255,255,255,0.05)" />
                            <stop offset="100%" stopColor="rgba(0,0,0,0.6)" />
                        </radialGradient>
                        
                        {/* Borda metálica interna */}
                        <linearGradient id="metalRing" x1="0" y1="0" x2="300" y2="300">
                            <stop offset="0%" stopColor="#475569" />
                            <stop offset="50%" stopColor="#94a3b8" />
                            <stop offset="100%" stopColor="#1e293b" />
                        </linearGradient>
                    </defs>

                    {/* Fundo Metálico (Borda Externa) */}
                    <circle cx="150" cy="150" r="150" fill="url(#metalRing)" />
                    
                    {/* Luzinhas da borda */}
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
                                fill={isLit ? "#fef08a" : "#451a03"} 
                                opacity={isLit ? 1 : 0.4}
                                style={{
                                    filter: isLit ? 'drop-shadow(0px 0px 4px #fef08a)' : 'none',
                                    transition: 'all 0.1s'
                                }}
                            />
                        )
                    })}

                    {/* Círculo interno (Fatias) */}
                    <g transform="translate(0, 0)">
                        {items.map((item, i) => {
                            const path = createSlicePath(i, items.length);
                            const labelCoords = getLabelCoordinates(i, items.length);
                            
                            return (
                                <g key={item.id}>
                                    <path 
                                        d={path} 
                                        fill={COLORS[i % COLORS.length]} 
                                        stroke="rgba(0,0,0,0.2)" 
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
                                            textShadow: '0px 2px 4px rgba(0,0,0,0.8)',
                                            transformOrigin: `${labelCoords.x}px ${labelCoords.y}px`,
                                            transform: `rotate(${labelCoords.angle > 180 ? labelCoords.angle + 90 : labelCoords.angle - 90}deg)`
                                        }}
                                    >
                                        {item.name.length > 12 ? item.name.substring(0,10)+'...' : item.name.toUpperCase()}
                                    </text>
                                </g>
                            );
                        })}
                    </g>
                    
                    {/* Overlay de Vidro / 3D */}
                    <circle cx="150" cy="150" r="135" fill="url(#glassGlare)" pointerEvents="none" />
                    
                    {/* Botão Central (Jewel) */}
                    <circle cx="150" cy="150" r="30" fill="#1e1b4b" stroke="#3730a3" strokeWidth="4" />
                    <circle cx="150" cy="150" r="22" fill="#4f46e5" />
                    {/* Brilho do botão central */}
                    <path d="M 135 140 A 15 15 0 0 1 165 140 A 15 15 0 0 0 135 140 Z" fill="rgba(255,255,255,0.4)" />
                    <circle cx="150" cy="150" r="8" fill="#fbbf24" />
                    <circle cx="152" cy="148" r="3" fill="#fef3c7" />
                </svg>
            </div>
            
            {/* Base Sombra */}
            <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 w-64 h-12 bg-black/40 rounded-[100%] blur-xl -z-10"></div>
        </div>
    );
};
