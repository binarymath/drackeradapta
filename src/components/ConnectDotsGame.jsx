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

    // Função Fisher-Yates para embaralhamento real
    const shuffleArray = (array) => {
        const newArr = [...array];
        for (let i = newArr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
        }
        return newArr;
    };

    // Inicializa o jogo quando os dados mudam
    useEffect(() => {
        if (data && data.length > 0) {
            setItemsLeft(shuffleArray(data));
            setItemsRight(shuffleArray(data));
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
        setItemsLeft(shuffleArray(data));
        setItemsRight(shuffleArray(data));
        setMatches({});
        setSelectedLeft(null);
        setIsWon(false);
        setLines([]);
    };

    // Helper para tamanho da fonte
    const getResponseClass = (content) => {
        const text = content || "";
        const length = text.length;
        if (length <= 2) return "text-3xl md:text-4xl drop-shadow-sm";
        if (length <= 15) return "text-lg md:text-xl font-extrabold text-slate-800 leading-tight";
        return "text-base md:text-lg font-bold text-slate-700 break-words leading-snug px-1";
    };

    if (!data || data.length === 0) {
        return <div className="p-8 text-center text-gray-500">Nenhum dado para o jogo. Gere uma atividade primeiro.</div>;
    }

    return (
        <div className="w-full max-w-4xl mx-auto">

            {/* --- MODO INTERATIVO (Game Mode) --- */}
            <div className={`${isGameMode ? '' : 'hidden'} no-print bg-gradient-to-br from-indigo-50/50 via-white to-purple-50/50 p-4 md:p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-indigo-100/50`}>
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

                <div className="relative w-full select-none" ref={containerRef}>
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

                    {/* Grid of 2 columns */}
                    <div className="grid grid-cols-2 gap-x-8 md:gap-x-16 gap-y-3 md:gap-y-4 w-full relative z-20">
                        {itemsLeft.map((leftItem, index) => {
                            const rightItem = itemsRight[index];

                            const isLeftMatched = matches[leftItem.id] !== undefined;
                            const isLeftSelected = selectedLeft === leftItem.id;
                            const isRightMatched = Object.values(matches).includes(rightItem.id);
                            const isPulsing = selectedLeft && !isRightMatched;

                            return (
                                <React.Fragment key={`row-${index}`}>
                                    {/* Left Button */}
                                    <button
                                        ref={el => leftRefs.current[leftItem.id] = el}
                                        onClick={() => handleLeftClick(leftItem.id)}
                                        disabled={isLeftMatched}
                                        className={`
                    relative p-3 md:p-4 rounded-xl md:rounded-2xl text-left transition-all duration-300
                    flex items-center min-h-[55px] md:min-h-[65px] w-full h-full group
                    ${isLeftMatched ? `${leftItem.color.replace('border-', 'bg-').replace('100', '50')} border-2 border-transparent opacity-70 shadow-inner` : 'bg-white border-2 border-slate-200 shadow-[0_4px_0_0_rgba(226,232,240,1)] hover:border-purple-400 hover:shadow-[0_4px_0_0_rgba(192,132,252,1)] hover:-translate-y-1'}
                    ${isLeftSelected ? 'ring-4 ring-purple-200 border-purple-500 bg-purple-50 transform scale-[1.03] shadow-lg' : ''}
                  `}
                                    >
                                        <span className={`text-sm md:text-lg font-extrabold leading-snug ${isLeftMatched ? 'text-slate-500 line-through decoration-slate-400 decoration-2' : 'text-slate-800'} pr-4`}>
                                            {leftItem.text}
                                        </span>
                                        {/* Dot for connection visualization */}
                                        <div className={`absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full border-4 flex items-center justify-center transition-all duration-300 ${isLeftSelected || isLeftMatched ? 'bg-purple-500 border-purple-200 scale-110' : 'bg-slate-200 border-white group-hover:bg-purple-300 group-hover:border-purple-100'}`}>
                                            <div className={`w-2 h-2 rounded-full ${isLeftSelected || isLeftMatched ? 'bg-white' : 'bg-slate-400 group-hover:bg-purple-500'}`}></div>
                                        </div>
                                    </button>

                                    {/* Right Button */}
                                    <button
                                        ref={el => rightRefs.current[rightItem.id] = el}
                                        onClick={() => handleRightClick(rightItem.id)}
                                        disabled={isRightMatched}
                                        className={`
                    relative p-3 md:p-4 rounded-xl md:rounded-2xl transition-all duration-300 group
                    flex items-center justify-center min-h-[55px] md:min-h-[65px] w-full h-full
                    ${isRightMatched ? `${rightItem.color.replace('border-', 'bg-').replace('100', '50')} border-2 border-transparent opacity-70 shadow-inner` : 'bg-white border-2 border-dashed border-slate-300 hover:border-solid hover:border-purple-400 hover:bg-purple-50 shadow-[0_4px_0_0_rgba(203,213,225,0.5)] hover:shadow-[0_4px_0_0_rgba(192,132,252,1)] hover:-translate-y-1'}
                    ${isPulsing ? 'animate-pulse ring-4 ring-purple-100 border-purple-300' : ''}
                  `}
                                    >
                                        {/* Dot for connection visualization */}
                                        <div className={`absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full border-4 flex items-center justify-center transition-all duration-300 ${isRightMatched ? 'bg-purple-500 border-purple-200' : 'bg-slate-200 border-white group-hover:bg-purple-300 group-hover:border-purple-100'}`}>
                                            <div className={`w-2 h-2 rounded-full ${isRightMatched ? 'bg-white' : 'bg-slate-400 group-hover:bg-purple-500'}`}></div>
                                        </div>

                                        <span className={`select-none text-center ${getResponseClass(rightItem.emoji)} ${isRightMatched ? 'opacity-60 grayscale' : ''}`}>
                                            {rightItem.emoji}
                                        </span>
                                    </button>
                                </React.Fragment>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* --- MODO IMPRESSÃO (Static PDF) --- */}
            <div className={`${isGameMode ? 'hidden print:block' : ''} w-full bg-white p-4 sm:p-8 print:p-0 max-w-5xl mx-auto font-sans`}>
                <style>{`
                    @media print {
                        @page { size: landscape; margin: 8mm; }
                        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; margin: 0; padding: 0; overflow: hidden; }
                        .print-landscape-container { height: 98vh; max-height: 98vh; display: flex; flex-direction: column; justify-content: space-between; overflow: hidden; }
                    }
                `}</style>

                <div className="print-landscape-container">
                    {/* Header no Print - Inspirado no QuizPrint */}
                    <div className="border-b-[3px] border-slate-800 pb-2 mb-4 flex items-start justify-between flex-shrink-0">
                        <div className="flex items-center gap-5">
                            <img src="/dracker_character.png" alt="Drácker" className="w-20 h-20 object-contain drop-shadow-sm" onError={(e) => { e.target.style.display = 'none'; }} />
                            <div className="text-left">
                                <div className="text-[11px] font-extrabold tracking-[0.2em] uppercase text-orange-800 mb-1">ATIVIDADE LÚDICA</div>
                                <h2 className="text-3xl font-black uppercase text-slate-900 m-0 leading-tight">Ligue os Pontos</h2>
                                <p className="text-sm text-slate-600 font-medium mt-1 italic">Conecte os pares correspondentes usando um lápis.</p>
                            </div>
                        </div>
                        <div className="flex flex-col gap-3 min-w-[320px] pt-2">
                            <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
                                <span>Aluno(a):</span>
                                <div className="flex-1 border-b-[1.5px] border-slate-500 h-4"></div>
                            </div>
                            <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
                                <span>Data:</span>
                                <div className="w-20 border-b-[1.5px] border-slate-500 h-4"></div>
                                <span className="ml-3">Turma:</span>
                                <div className="w-20 border-b-[1.5px] border-slate-500 h-4"></div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-x-24 gap-y-3 relative px-4 flex-1 mt-2">
                        {itemsLeft.map((leftItem, index) => {
                            const rightItem = itemsRight[index];

                            return (
                                <React.Fragment key={`print-${index}`}>
                                    {/* Left Col Print */}
                                    <div className="flex items-center justify-between bg-slate-50 border-2 border-slate-300 rounded-xl p-3 min-h-[55px] break-inside-avoid relative shadow-sm h-full w-full">
                                        <div className="absolute -top-3 -left-3 w-7 h-7 bg-gradient-to-br from-amber-600 to-amber-500 text-white rounded-full flex items-center justify-center font-bold text-sm shadow-md border-2 border-white">
                                            {index + 1}
                                        </div>
                                        <span className="text-base md:text-lg font-bold text-slate-800 pr-6 leading-snug break-words w-full">
                                            {leftItem.text}
                                        </span>
                                        {/* Anchor Dot - Bullseye style */}
                                        <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 flex items-center justify-center z-10">
                                            <div className="w-7 h-7 rounded-full bg-white border-[3px] border-slate-800 shadow-sm flex items-center justify-center">
                                                <div className="w-2 h-2 rounded-full bg-slate-800"></div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right Col Print */}
                                    <div className="flex items-center justify-center border-2 border-dashed border-slate-400 bg-white rounded-xl p-3 min-h-[55px] break-inside-avoid relative shadow-sm h-full w-full">
                                        {/* Anchor Dot - Bullseye style */}
                                        <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 flex items-center justify-center z-10">
                                            <div className="w-7 h-7 rounded-full bg-white border-[3px] border-slate-800 shadow-sm flex items-center justify-center">
                                                <div className="w-2 h-2 rounded-full bg-slate-800"></div>
                                            </div>
                                        </div>
                                        <span className={`select-none text-center ${getResponseClass(rightItem.emoji)} w-full scale-90`}>
                                            {rightItem.emoji}
                                        </span>
                                    </div>
                                </React.Fragment>
                            );
                        })}
                    </div>

                    <div className="mt-4 pt-3 flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-slate-500 border-t-[1.5px] border-dashed border-amber-400 flex-shrink-0">
                        <span>Dracker Adapta · Gerado por IA educacional</span>
                        <span>Boa sorte! 🌟</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
