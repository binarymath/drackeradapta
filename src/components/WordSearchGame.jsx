import React, { useState, useEffect, useRef } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { RefreshCw, Trophy, PartyPopper, Check, X, UserPlus, Trash2 } from 'lucide-react';
import confetti from 'canvas-confetti';

export const WordSearchGame = ({ content, wordsToFind = [], onRestart }) => {
    const [grid, setGrid] = useState([]);
    const [selection, setSelection] = useState({ start: null, end: null, cells: [] });
    const [foundWords, setFoundWords] = useState([]); // List of words found
    const [isDragging, setIsDragging] = useState(false);
    const [gameWon, setGameWon] = useState(false);
    const [playerName, setPlayerName] = useState('');
    const [hasStarted, setHasStarted] = useState(false);
    const [rankings, setRankings] = useState([]);
    const [startTime, setStartTime] = useState(null);
    const [lastRunTimeMs, setLastRunTimeMs] = useState(null);
    const [showRanking, setShowRanking] = useState(false);

    // Audio Refs
    const successAudio = useRef(new Audio('https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3'));
    const winAudio = useRef(new Audio('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3'));

    useEffect(() => {
        try {
            const saved = localStorage.getItem('wordsearch_ranking');
            if (saved) setRankings(JSON.parse(saved));
        } catch (err) {
            console.error('Erro ao carregar ranking', err);
        }
    }, []);

    useEffect(() => {
        parseGridFromContent();
    }, [content]);

    useEffect(() => {
        if (hasStarted && wordsToFind.length > 0 && foundWords.length === wordsToFind.length) {
            setGameWon(true);
            winAudio.current.play().catch(e => console.log(e));
            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 }
            });
            const finalTimeMs = startTime ? Date.now() - startTime : Number.MAX_SAFE_INTEGER;
            setLastRunTimeMs(finalTimeMs);
            persistRanking(finalTimeMs);
        }
    }, [foundWords, wordsToFind, hasStarted]);

    const parseGridFromContent = () => {
        if (!content) return;
        const lines = content.split('\n');
        const gridRows = [];

        lines.forEach(line => {
            const trimmed = line.trim();
            if (trimmed.length < 3) return;

            // Logic from RichTextRenderer to detect grid rows
            // 1. Spaced letters: "A B C D"
            const withSpaces = trimmed.split(/\s+/).filter(l => l.length > 0);
            if (withSpaces.length >= 3 && withSpaces.every(l => /^[A-ZÀ-Ú]$/i.test(l))) {
                gridRows.push(withSpaces.map(l => l.toUpperCase()));
            }
            // 2. Compact letters: "ABCD..."
            else if (/^[A-ZÀ-Ú]{3,}$/i.test(trimmed) && trimmed.length > 5) { // Ensure it's not a short word
                gridRows.push(trimmed.split('').map(l => l.toUpperCase()));
            }
        });

        if (gridRows.length > 0) {
            setGrid(gridRows);
        }
    };

    // --- INTERACTION HANDLERS ---

    const handleTouchStart = (e, r, c) => {
        // Prevent default to stop scrolling while playing
        if (e.cancelable) e.preventDefault();
        handleMouseDown(r, c);
    };

    const handleTouchMove = (e) => {
        // Prevent scrolling
        if (e.cancelable) e.preventDefault();

        const touch = e.touches[0];
        const target = document.elementFromPoint(touch.clientX, touch.clientY);

        if (target) {
            // Find the closest cell element (in case we hit a child or slightly off)
            const cell = target.closest('[data-r]');
            if (cell) {
                const r = parseInt(cell.dataset.r, 10);
                const c = parseInt(cell.dataset.c, 10);

                // Only trigger if we are over a valid cell
                if (!isNaN(r) && !isNaN(c)) {
                    handleMouseEnter(r, c);
                }
            }
        }
    };

    const getCoords = (rowIndex, colIndex) => ({ r: rowIndex, c: colIndex });

    const handleMouseDown = (r, c) => {
        setIsDragging(true);
        setSelection({ start: { r, c }, end: { r, c }, cells: [{ r, c }] });
    };

    const handleMouseEnter = (r, c) => {
        if (!isDragging) return;
        const start = selection.start;
        // Calculate line (Bresenham's or simple vector check)
        // Only allow horizontal, vertical, or diagonal lines?
        // Let's implement simple line interpolation
        const cells = getCellsBetween(start, { r, c });
        setSelection({ ...selection, end: { r, c }, cells });
    };

    const handleMouseUp = () => {
        setIsDragging(false);
        validateSelection();
    };

    const getCellsBetween = (start, end) => {
        const cells = [];
        const dr = end.r - start.r;
        const dc = end.c - start.c;

        // Determine steps
        const steps = Math.max(Math.abs(dr), Math.abs(dc));
        if (steps === 0) return [{ r: start.r, c: start.c }];

        // Only allow valid directions (0, 45, 90 degrees etc)
        // If not perfectly aligned, we might snap or just trace? 
        // For word search, usually only 8 directions are allowed.
        // Check if diagonal is clean (|dr| == |dc|) OR horizontal (dr=0) OR vertical (dc=0)

        const isHorizontal = dr === 0;
        const isVertical = dc === 0;
        const isDiagonal = Math.abs(dr) === Math.abs(dc);

        if (!isHorizontal && !isVertical && !isDiagonal) {
            // Invalid selection path (not straight) - just return start to keep UI clean or maybe end?
            // User visual feedback might be "snap to closest" but simpler is just return what we have?
            // Let's just return the straight line attempt (Bresenham-ish)
            return [{ r: start.r, c: start.c }];
        }

        const rStep = dr / steps;
        const cStep = dc / steps;

        for (let i = 0; i <= steps; i++) {
            cells.push({
                r: start.r + Math.round(i * rStep),
                c: start.c + Math.round(i * cStep)
            });
        }
        return cells;
    };

    const persistRanking = (finalTimeMs) => {
        const entry = {
            name: playerName?.trim() || 'Jogador',
            wordsFound: foundWords.length,
            totalWords: wordsToFind.length,
            percent: wordsToFind.length ? Math.round((foundWords.length / wordsToFind.length) * 100) : 0,
            date: new Date().toISOString(),
            timeMs: typeof finalTimeMs === 'number' ? finalTimeMs : Number.MAX_SAFE_INTEGER
        };
        const normalized = rankings.map(r => ({ ...r, timeMs: typeof r.timeMs === 'number' ? r.timeMs : Number.MAX_SAFE_INTEGER }));
        const updated = [...normalized, entry]
            .sort((a, b) => {
                if (b.wordsFound !== a.wordsFound) return b.wordsFound - a.wordsFound;
                if (a.timeMs !== b.timeMs) return a.timeMs - b.timeMs;
                if (b.percent !== a.percent) return b.percent - a.percent;
                return new Date(b.date) - new Date(a.date);
            });
        setRankings(updated);
        localStorage.setItem('wordsearch_ranking', JSON.stringify(updated));
    };

    const formatTime = (ms) => {
        if (!ms || !Number.isFinite(ms) || ms === Number.MAX_SAFE_INTEGER) return '--:--';
        const totalSeconds = Math.max(0, Math.round(ms / 1000));
        const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
        const seconds = (totalSeconds % 60).toString().padStart(2, '0');
        return `${minutes}:${seconds}`;
    };

    const deleteRankingEntry = (idx) => {
        const updated = rankings.filter((_, i) => i !== idx);
        setRankings(updated);
        localStorage.setItem('wordsearch_ranking', JSON.stringify(updated));
    };

    const startGame = () => {
        if (!playerName.trim()) return;
        setHasStarted(true);
        setGameWon(false);
        setFoundWords([]);
        setStartTime(Date.now());
        setLastRunTimeMs(null);
        setShowRanking(false);
    };

    const handleRestart = () => {
        setHasStarted(false);
        setGameWon(false);
        setFoundWords([]);
        setPlayerName('');
        setStartTime(null);
        setLastRunTimeMs(null);
        setShowRanking(false);
        onRestart && onRestart();
    };

    const validateSelection = () => {
        if (!hasStarted) return;
        const selectedWord = selection.cells.map(cell => {
            return grid[cell.r] && grid[cell.r][cell.c];
        }).join('');

        // Check regular and reversed
        const reversedWord = selectedWord.split('').reverse().join('');

        const match = wordsToFind.find(w =>
            w.toUpperCase() === selectedWord || w.toUpperCase() === reversedWord
        );

        if (match && !foundWords.includes(match)) {
            setFoundWords([...foundWords, match]);
            successAudio.current.play().catch(e => { });
            setSelection({ start: null, end: null, cells: [] });
        } else {
            // Reset selection logic
            setSelection({ start: null, end: null, cells: [] });
        }
    };

    // Calculate highlighting classes
    const getCellClass = (r, c) => {
        // 1. Is in current selection?
        const isSelected = selection.cells.some(cell => cell.r === r && cell.c === c);
        if (isSelected) return 'bg-yellow-300 text-brown-900 scale-110 shadow-md z-10';

        // 2. Is part of a found word? (We need to track found CELLS too or re-scan)
        // To persist found highlights, we technically need to store the CELLS of found words.
        // Re-scanning every render is expensive? Not for 15x15.
        // Optimization: Store foundCells in state.

        return 'bg-white text-brown-800 hover:bg-brown-100';
    };

    // --- BETTER STATE FOR FOUND CELLS ---
    const [foundCells, setFoundCells] = useState([]); // [{r,c, color?}]

    useEffect(() => {
        // When a word is found (passed in validate), we should calculate its cells and add to foundCells
        // But validateSelection manages logic. Let's refactor validateSelection slightly.
    }, []);

    // Refactored validate:
    const validateSelectionV2 = () => {
        const cells = selection.cells;
        const word = cells.map(cell => grid[cell.r][cell.c]).join('');
        const revWord = word.split('').reverse().join('');

        const match = wordsToFind.find(w => {
            const cleanW = w.toUpperCase();
            return cleanW === word || cleanW === revWord;
        });

        if (match && !foundWords.includes(match)) {
            setFoundWords(prev => [...prev, match]);
            setFoundCells(prev => [...prev, ...cells]); // Add found cells to permanent highlight
            successAudio.current.play().catch(e => { });
        }

        setSelection({ start: null, end: null, cells: [] });
        setIsDragging(false);
    };

    // Override original handleMouseUp to use V2
    const handleMouseUpV2 = () => {
        validateSelectionV2();
    };

    // Tela inicial
    if (!hasStarted && !gameWon) {
        return (
            <Card className="max-w-2xl mx-auto border-2 border-brown-200 shadow-xl overflow-hidden">
                <div className="p-6 space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                            <UserPlus className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-brown-900">Digite seu nome para jogar</h2>
                            <p className="text-sm text-brown-700">Seu nome ficará salvo no ranking local (JSON no navegador).</p>
                        </div>
                    </div>

                    <input
                        value={playerName}
                        onChange={(e) => setPlayerName(e.target.value)}
                        placeholder="Seu nome"
                        className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />

                    <Button
                        onClick={startGame}
                        disabled={!playerName.trim()}
                        className="w-full bg-amber-600 hover:bg-amber-700 text-white shadow-lg disabled:opacity-50"
                        icon={PartyPopper}
                    >
                        Começar Jogo
                    </Button>

                    <Button
                        onClick={() => setShowRanking(!showRanking)}
                        variant="secondary"
                        className="w-full border-amber-200 text-amber-800 hover:bg-amber-100"
                        icon={Trophy}
                    >
                        {showRanking ? 'Esconder Ranking' : 'Mostrar Ranking'}
                    </Button>

                    {showRanking && rankings.length > 0 && (
                        <div className="mt-4 p-4 rounded-lg bg-amber-50 border border-amber-200">
                            <div className="flex items-center gap-2 mb-2">
                                <Trophy className="w-4 h-4 text-amber-600" />
                                <span className="text-sm font-semibold text-amber-800">Ranking Local</span>
                            </div>
                            <div className="space-y-1 text-sm text-amber-900">
                                {rankings.map((r, idx) => (
                                    <div key={idx} className="flex justify-between items-center">
                                        <span>{idx + 1}. {r.name}</span>
                                        <div className="flex items-center gap-2">
                                            <span>{r.wordsFound}/{r.totalWords} ({r.percent}%) • {formatTime(r.timeMs)}</span>
                                            <button
                                                onClick={() => deleteRankingEntry(idx)}
                                                className="p-1 text-amber-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                                title="Deletar participante"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </Card>
        );
    }

    return (
        <div className="flex flex-col items-center gap-6 select-none animate-in fade-in duration-500">
            {/* Header / Score */}
            <div className="flex justify-between items-center w-full max-w-2xl gap-2">
                <Badge className="text-lg py-2 px-4 shadow-sm bg-white border-brown-200">
                    Encontradas: <span className="text-green-600 font-bold ml-2">{foundWords.length} / {wordsToFind.length}</span>
                </Badge>
                {Number.isFinite(lastRunTimeMs) && (
                    <Badge className="text-sm py-1 px-3 shadow-sm bg-blue-50 border-blue-200 text-blue-700">
                        Tempo: {formatTime(lastRunTimeMs)}
                    </Badge>
                )}
                <div className="flex gap-2">
                    <Button variant="ghost" icon={RefreshCw} onClick={handleRestart} title="Reiniciar com novo nome">
                        Reiniciar
                    </Button>
                    <Button variant="secondary" onClick={() => onRestart && onRestart()} className="bg-brown-100 text-brown-700 hover:bg-brown-200 border-brown-300" title="Voltar para modo de impressão">
                        Voltar
                    </Button>
                </div>
            </div>

            {gameWon && (
                <div className="flex flex-col items-center gap-4 w-full max-w-2xl animate-bounce-short">
                    <Card className="bg-green-100 border-green-300 p-6 text-center w-full">
                        <h2 className="text-2xl font-bold text-green-800 flex items-center justify-center gap-2">
                            <Trophy className="w-8 h-8 text-yellow-500" />
                            Parabéns!
                        </h2>
                        <p className="text-green-700">Você encontrou todas as palavras em {formatTime(lastRunTimeMs)}!</p>
                    </Card>

                    <div className="flex gap-3 w-full">
                        <Button onClick={() => setShowRanking(!showRanking)} variant="secondary" className="flex-1 border-amber-200 text-amber-800 hover:bg-amber-100" icon={Trophy}>
                            {showRanking ? 'Esconder Ranking' : 'Ver Ranking'}
                        </Button>
                        <Button onClick={handleRestart} icon={RefreshCw} className="flex-1 bg-brown-600 hover:bg-brown-700 text-white">
                            Jogar Novamente
                        </Button>
                    </div>

                    {showRanking && rankings.length > 0 && (
                        <Card className="w-full bg-white border border-amber-200 p-4">
                            <div className="flex items-center gap-2 mb-2 font-semibold text-amber-800">
                                <Trophy className="w-4 h-4" /> Ranking Local
                            </div>
                            <div className="space-y-1 text-sm">
                                {rankings.map((r, idx) => (
                                    <div key={idx} className={`flex justify-between items-center ${r.name === (playerName?.trim() || 'Jogador') ? 'font-bold text-green-700' : 'text-brown-800'}`}>
                                        <span>{idx + 1}. {r.name}</span>
                                        <div className="flex items-center gap-2">
                                            <span>{r.wordsFound}/{r.totalWords} ({r.percent}%) • {formatTime(r.timeMs)}</span>
                                            <button
                                                onClick={() => deleteRankingEntry(idx)}
                                                className="p-1 text-amber-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                                title="Deletar participante"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    )}
                </div>
            )}

            {!gameWon && (
                <div className="w-full max-w-2xl space-y-4">
                    <div
                        className="bg-brown-50 p-4 rounded-xl shadow-inner border border-brown-200 touch-none"
                        onMouseLeave={() => setIsDragging(false)}
                    >
                        <div
                            className="grid gap-0.5"
                            style={{ gridTemplateColumns: `repeat(${grid[0]?.length || 0}, minmax(0, 1fr))` }}
                        >
                            {grid.map((row, r) => (
                                row.map((letter, c) => {
                                    const isFound = foundCells.some(fc => fc.r === r && fc.c === c);
                                    const isSelected = selection.cells.some(sc => sc.r === r && sc.c === c);

                                    let bgClass = "bg-white";
                                    if (isFound) bgClass = "bg-green-500 text-white shadow-sm";
                                    if (isSelected) bgClass = "bg-yellow-400 text-brown-900 scale-110 shadow-md z-10 rounded";

                                    return (
                                        <div
                                            key={`${r}-${c}`}
                                            data-r={r}
                                            data-c={c}
                                            className={`
                                                w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9
                                                flex items-center justify-center 
                                                font-mono font-semibold text-base sm:text-lg 
                                                rounded cursor-pointer transition-all duration-150
                                                ${bgClass}
                                                ${!isFound && !isSelected ? 'hover:bg-brown-100 text-brown-800' : ''}
                                            `}
                                            onMouseDown={() => handleMouseDown(r, c)}
                                            onMouseEnter={() => handleMouseEnter(r, c)}
                                            onMouseUp={handleMouseUpV2}
                                            onTouchStart={(e) => handleTouchStart(e, r, c)}
                                            onTouchMove={handleTouchMove}
                                            onTouchEnd={handleMouseUpV2}
                                        >
                                            {letter}
                                        </div>
                                    );
                                })
                            ))}
                        </div>
                    </div>

                    {/* Word List */}
                    <Card className="w-full max-w-2xl bg-white/80">
                        <h3 className="text-center font-bold text-brown-400 uppercase text-xs tracking-widest mb-4">Palavras para Encontrar</h3>
                        <div className="flex flex-wrap justify-center gap-3">
                            {wordsToFind.map((word, idx) => {
                                const isFound = foundWords.includes(word);
                                return (
                                    <div
                                        key={idx}
                                        className={`
                                            px-3 py-1 rounded-full border text-sm font-bold transition-all duration-500
                                            ${isFound
                                                ? 'bg-green-100 border-green-300 text-green-700 line-through opacity-70'
                                                : 'bg-white border-brown-200 text-brown-700 Shadow-sm'}
                                        `}
                                    >
                                        {word}
                                        {isFound && <Check className="inline-block w-3 h-3 ml-1" />}
                                    </div>
                                )
                            })}
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
};
