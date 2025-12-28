import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Volume2, VolumeX, Trophy, RefreshCw, CheckCircle2 } from 'lucide-react';
import { Button } from './ui/Button';

// Utilitário para sons simples (mantido do original)
const playSound = (type) => {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;

        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.connect(gain);
        gain.connect(ctx.destination);

        if (type === 'success') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(440, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1);
            gain.gain.setValueAtTime(0.3, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
            osc.start();
            osc.stop(ctx.currentTime + 0.5);
        } else if (type === 'error') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(200, ctx.currentTime);
            osc.frequency.linearRampToValueAtTime(150, ctx.currentTime + 0.2);
            gain.gain.setValueAtTime(0.3, ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.3);
            osc.start();
            osc.stop(ctx.currentTime + 0.3);
        } else if (type === 'win') {
            const now = ctx.currentTime;
            [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
                const o = ctx.createOscillator();
                const g = ctx.createGain();
                o.connect(g);
                g.connect(ctx.destination);
                o.frequency.value = freq;
                g.gain.setValueAtTime(0.2, now + i * 0.15);
                g.gain.exponentialRampToValueAtTime(0.01, now + i * 0.15 + 0.4);
                o.start(now + i * 0.15);
                o.stop(now + i * 0.15 + 0.4);
            });
        }
    } catch (e) {
        console.error("Audio error", e);
    }
};

export default function ConnectDotsGame({ data = [], onComplete, isGameMode = false }) {
    const [itemsLeft, setItemsLeft] = useState([]);
    const [itemsRight, setItemsRight] = useState([]);
    const [selectedLeft, setSelectedLeft] = useState(null);
    const [matches, setMatches] = useState({});
    const [lines, setLines] = useState([]);
    const [isWon, setIsWon] = useState(false);
    const [soundEnabled, setSoundEnabled] = useState(true);

    const leftRefs = useRef({});
    const rightRefs = useRef({});
    const containerRef = useRef(null);

    // Inicializa o jogo quando os dados mudam
    useEffect(() => {
        if (data && data.length > 0) {
            setItemsLeft(data);
            // Embaralha o lado direito para o jogo
            setItemsRight([...data].sort(() => Math.random() - 0.5));
            setMatches({});
            setSelectedLeft(null);
            setIsWon(false);
            setLines([]);
        }
    }, [data]);

    const calculateLines = useCallback(() => {
        if (!containerRef.current) return;

        // Check if element is visible/connected to avoid errors
        if (!containerRef.current.isConnected) return;

        const containerRect = containerRef.current.getBoundingClientRect();
        const newLines = [];

        Object.keys(matches).forEach(leftId => {
            const leftEl = leftRefs.current[leftId];
            const rightId = matches[leftId];
            const rightEl = rightRefs.current[rightId];

            if (leftEl && rightEl) {
                const leftRect = leftEl.getBoundingClientRect();
                const rightRect = rightEl.getBoundingClientRect();

                // Safe check for valid rects
                if (leftRect.width > 0 && rightRect.width > 0) {
                    newLines.push({
                        x1: leftRect.right - containerRect.left,
                        y1: leftRect.top + leftRect.height / 2 - containerRect.top,
                        x2: rightRect.left - containerRect.left,
                        y2: rightRect.top + rightRect.height / 2 - containerRect.top,
                        color: data.find(d => d.id === parseInt(leftId))?.color.split(' ')[1].replace('border-', '') || 'gray'
                    });
                }
            }
        });
        setLines(newLines);
    }, [matches, data]);

    useEffect(() => {
        // Debounce resize
        let timeoutId;
        const handleResize = () => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(calculateLines, 100);
        };

        calculateLines();
        window.addEventListener('resize', handleResize);
        // Observer for visibility changes/DOM updates
        const observer = new ResizeObserver(handleResize);
        if (containerRef.current) observer.observe(containerRef.current);

        return () => {
            window.removeEventListener('resize', handleResize);
            observer.disconnect();
            clearTimeout(timeoutId);
        };
    }, [calculateLines]);

    useEffect(() => {
        if (data.length > 0 && Object.keys(matches).length === data.length) {
            setIsWon(true);
            if (soundEnabled) playSound('win');
            if (onComplete) onComplete();
        }
    }, [matches, soundEnabled, data, onComplete]);

    const handleLeftClick = (id) => {
        if (matches[id]) return; // Já combinado
        setSelectedLeft(id);
        if (soundEnabled) playSound('click'); // Optional click sound
    };

    const handleRightClick = (id) => {
        if (Object.values(matches).includes(id)) return; // Já combinado

        if (selectedLeft) {
            // Verifica se o par está correto (neste jogo, id deve bater com id)
            if (selectedLeft === id) {
                setMatches(prev => ({ ...prev, [selectedLeft]: id }));
                setSelectedLeft(null);
                if (soundEnabled) playSound('success');
            } else {
                if (soundEnabled) playSound('error');
                setSelectedLeft(null);
            }
        }
    };

    const handleReset = () => {
        setItemsRight([...data].sort(() => Math.random() - 0.5));
        setMatches({});
        setSelectedLeft(null);
        setIsWon(false);
        setLines([]);
    };

    // Helper para tamanho da fonte
    const getResponseClass = (content) => {
        const text = content || "";
        const length = text.length;
        if (length <= 2) return "text-3xl md:text-4xl";
        if (length <= 10) return "text-lg md:text-2xl font-bold text-slate-800";
        return "text-base md:text-lg font-bold text-slate-800 break-words leading-tight px-1";
    };

    if (!data || data.length === 0) {
        return <div className="p-8 text-center text-gray-500">Nenhum dado para o jogo. Gere uma atividade primeiro.</div>;
    }

    return (
        <div className="w-full max-w-4xl mx-auto">

            {/* --- MODO INTERATIVO (Game Mode) --- */}
            <div className={`${isGameMode ? '' : 'hidden'} no-print bg-slate-50 p-4 md:p-8 rounded-xl shadow-inner border border-slate-200`}>
                <header className="flex justify-between items-center mb-6">
                    <div className="flex gap-2">
                        <Button
                            variant="ghost"
                            onClick={() => setSoundEnabled(!soundEnabled)}
                            title={soundEnabled ? "Silenciar" : "Ativar Som"}
                            className="p-2 h-auto"
                        >
                            {soundEnabled ? <Volume2 className="w-5 h-5 text-purple-600" /> : <VolumeX className="w-5 h-5 text-gray-400" />}
                        </Button>
                        <Button onClick={handleReset} variant="secondary" size="sm" icon={RefreshCw}>
                            Reiniciar
                        </Button>
                    </div>
                    {isWon && (
                        <div className="flex items-center gap-2 text-green-600 font-bold bg-green-100 px-3 py-1 rounded-full animate-in fade-in zoom-in">
                            <Trophy className="w-5 h-5" />
                            <span>Concluído!</span>
                        </div>
                    )}
                </header>

                <div className="relative w-full flex justify-between gap-8 md:gap-16 select-none min-h-[400px]" ref={containerRef}>
                    {/* SVG Layer for Lines */}
                    <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-10 overflow-visible">
                        {lines.map((line, i) => (
                            <line
                                key={i}
                                x1={line.x1}
                                y1={line.y1}
                                x2={line.x2}
                                y2={line.y2}
                                strokeWidth="6"
                                strokeLinecap="round"
                                stroke={
                                    line.color === 'yellow-400' ? '#FACC15' :
                                        line.color === 'blue-400' ? '#60A5FA' :
                                            line.color === 'orange-400' ? '#FB923C' :
                                                line.color === 'cyan-400' ? '#22D3EE' :
                                                    line.color === 'red-400' ? '#F87171' :
                                                        line.color === 'green-400' ? '#4ADE80' : '#CBD5E1'
                                }
                                className="opacity-60 transition-all duration-500"
                            />
                        ))}
                    </svg>

                    {/* Left Column */}
                    <div className="flex flex-col justify-around gap-4 w-1/2 z-20">
                        {itemsLeft.map((item) => {
                            const isMatched = matches[item.id] !== undefined;
                            const isSelected = selectedLeft === item.id;

                            return (
                                <button
                                    key={item.id}
                                    ref={el => leftRefs.current[item.id] = el}
                                    onClick={() => handleLeftClick(item.id)}
                                    disabled={isMatched}
                                    className={`
                    relative p-4 rounded-xl text-left shadow-sm border-2 transition-all duration-200
                    flex items-center min-h-[80px] w-full
                    ${isMatched ? `${item.color.replace('border-', 'bg-').replace('100', '50')} border-transparent opacity-80` : 'bg-white border-slate-200 hover:border-purple-300 hover:bg-purple-50'}
                    ${isSelected ? 'ring-2 ring-purple-400 border-purple-400 bg-purple-50 transform scale-[1.02]' : ''}
                  `}
                                >
                                    <span className={`text-sm md:text-lg font-bold leading-tight ${isMatched ? 'text-slate-600' : 'text-slate-800'}`}>
                                        {item.text}
                                    </span>
                                    {/* Dot for connection visualization */}
                                    <div className={`absolute right-[-6px] top-1/2 -translate-y-1/2 w-3 h-3 rounded-full ${isSelected || isMatched ? 'bg-purple-500' : 'bg-slate-300'}`} />
                                </button>
                            );
                        })}
                    </div>

                    {/* Right Column */}
                    <div className="flex flex-col justify-around gap-4 w-1/2 z-20">
                        {itemsRight.map((item) => {
                            const isMatched = Object.values(matches).includes(item.id);

                            return (
                                <button
                                    key={item.id}
                                    ref={el => rightRefs.current[item.id] = el}
                                    onClick={() => handleRightClick(item.id)}
                                    disabled={isMatched}
                                    className={`
                    relative p-4 rounded-xl border-2 transition-all duration-200 shadow-sm
                    flex items-center justify-center min-h-[80px] w-full
                    ${isMatched ? `${item.color.replace('border-', 'bg-').replace('100', '50')} border-transparent opacity-80` : 'bg-white border-slate-200 hover:border-purple-300 hover:bg-purple-50'}
                    ${selectedLeft && !isMatched ? 'animate-pulse ring-1 ring-purple-200' : ''}
                  `}
                                >
                                    {/* Dot for connection visualization */}
                                    <div className={`absolute left-[-6px] top-1/2 -translate-y-1/2 w-3 h-3 rounded-full ${isMatched ? 'bg-purple-500' : 'bg-slate-300'}`} />

                                    <span className={`select-none text-center ${getResponseClass(item.emoji)}`}>
                                        {item.emoji}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* --- MODO IMPRESSÃO (Static PDF) --- */}
            <div className={`${isGameMode ? 'hidden print:block' : ''} w-full bg-white p-4`}>
                {/* Header no Print */}
                <div className="border-b-2 border-gray-300 pb-4 mb-8 text-center bg-gray-50 p-4 rounded-lg">
                    <h2 className="text-3xl font-bold uppercase tracking-widest text-gray-800 mb-2">Ligue os Pontos</h2>
                    <p className="text-gray-500 italic">Relacione cada item da esquerda com o correto à direita.</p>
                </div>

                <div className="flex justify-between items-stretch gap-12">
                    {/* Left Col Print */}
                    <div className="flex flex-col justify-between w-[45%] gap-8">
                        {itemsLeft.map((item) => (
                            <div key={item.id} className="flex items-center justify-between border-2 border-gray-200 hover:border-gray-800 rounded-xl p-4 min-h-[100px] shadow-sm">
                                <span className="text-xl font-bold text-gray-800">{item.text}</span>
                                {/* Anchor Dot */}
                                <div className="w-4 h-4 rounded-full bg-black border-2 border-white shadow-sm -mr-6 z-10 relative"></div>
                            </div>
                        ))}
                    </div>

                    {/* Right Col Print (ItemsRight randomized) */}
                    <div className="flex flex-col justify-between w-[45%] gap-8">
                        {itemsRight.map((item) => (
                            <div key={item.id} className="flex items-center justify-between border-2 border-gray-200 hover:border-gray-800 rounded-xl p-4 min-h-[100px] shadow-sm flex-row-reverse">
                                <span className="text-2xl font-bold text-gray-800 text-center w-full">{item.emoji}</span>
                                {/* Anchor Dot */}
                                <div className="w-4 h-4 rounded-full bg-black border-2 border-white shadow-sm -ml-6 z-10 relative"></div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="mt-12 pt-8 border-t border-gray-200 text-center text-gray-400 text-sm">
                    Dracker AdaptAI - Atividades Adaptadas
                </div>
            </div>
        </div>
    );
}
