import React, { useState, useEffect, useRef } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { RefreshCw, Trophy, PartyPopper, Check, X } from 'lucide-react';
import confetti from 'canvas-confetti';

export const WordSearchGame = ({ content, wordsToFind = [], onRestart }) => {
    const [grid, setGrid] = useState([]);
    const [selection, setSelection] = useState({ start: null, end: null, cells: [] });
    const [foundWords, setFoundWords] = useState([]); // List of words found
    const [isDragging, setIsDragging] = useState(false);
    const [gameWon, setGameWon] = useState(false);

    // Audio Refs
    const successAudio = useRef(new Audio('https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3'));
    const winAudio = useRef(new Audio('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3'));

    useEffect(() => {
        parseGridFromContent();
    }, [content]);

    useEffect(() => {
        if (wordsToFind.length > 0 && foundWords.length === wordsToFind.length) {
            setGameWon(true);
            winAudio.current.play().catch(e => console.log(e));
            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 }
            });
        }
    }, [foundWords, wordsToFind]);

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

    const validateSelection = () => {
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

    return (
        <div className="flex flex-col items-center gap-6 select-none animate-in fade-in duration-500">
            {/* Header / Score */}
            <div className="flex justify-between items-center w-full max-w-2xl">
                <Badge className="text-lg py-2 px-4 shadow-sm bg-white border-brown-200">
                    Encontradas: <span className="text-green-600 font-bold ml-2">{foundWords.length} / {wordsToFind.length}</span>
                </Badge>
                <Button variant="ghost" icon={RefreshCw} onClick={onRestart}>
                    Reiniciar
                </Button>
            </div>

            {gameWon && (
                <Card className="bg-green-100 border-green-300 p-6 text-center animate-bounce-short">
                    <h2 className="text-2xl font-bold text-green-800 flex items-center justify-center gap-2">
                        <Trophy className="w-8 h-8 text-yellow-500" />
                        Parabéns!
                    </h2>
                    <p className="text-green-700">Você encontrou todas as palavras!</p>
                </Card>
            )}

            {/* Grid */}
            <div
                className="bg-brown-50 p-4 rounded-xl shadow-inner border border-brown-200 touch-none"
                onMouseLeave={() => setIsDragging(false)}
            >
                <div
                    className="grid gap-1"
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
                                    className={`
                                        w-8 h-8 sm:w-10 sm:h-10 
                                        flex items-center justify-center 
                                        font-mono font-bold text-lg 
                                        rounded cursor-pointer transition-all duration-150
                                        ${bgClass}
                                        ${!isFound && !isSelected ? 'hover:bg-brown-100 text-brown-800' : ''}
                                    `}
                                    onMouseDown={() => handleMouseDown(r, c)}
                                    onMouseEnter={() => handleMouseEnter(r, c)}
                                    // Touch events support could be added here similar to mouse
                                    onMouseUp={handleMouseUpV2}
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
    );
};
