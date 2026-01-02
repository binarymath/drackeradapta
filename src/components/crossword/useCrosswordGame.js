import { useState, useRef, useEffect, useCallback } from 'react';

export const useCrosswordGame = (initialWords, initialGridSize, fillBlanks) => {
    const [gridState, setGridState] = useState([]);
    const [selectedCells, setSelectedCells] = useState(new Set());
    const [isSelectingWord, setIsSelectingWord] = useState(false);
    const [touchStartCell, setTouchStartCell] = useState(null);
    const gridRef = useRef(null);

    // Initialization Logic
    const initializeGrid = useCallback((words, size, shouldFillBlanks) => {
        let newGrid = Array(size).fill(null).map(() => Array(size).fill(null));

        // 1. Map active cells
        words.forEach(w => {
            for (let i = 0; i < w.word.length; i++) {
                let cx = w.dir === 'H' ? w.x + i : w.x;
                let cy = w.dir === 'V' ? w.y + i : w.y;

                if (cx < size && cy < size) {
                    if (!newGrid[cy][cx]) {
                        newGrid[cy][cx] = {
                            char: w.word[i],
                            blocked: false,
                            input: '',
                            numH: null,
                            numV: null,
                            num: null
                        };
                    }

                    if (i === 0) {
                        if (w.dir === 'V') newGrid[cy][cx].numV = w.num;
                        if (w.dir === 'H') newGrid[cy][cx].numH = w.num;
                    }
                }
            }
        });

        // 1.5 Format numbers
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                if (newGrid[y][x]) {
                    const { numV, numH } = newGrid[y][x];
                    if (numV && numH) newGrid[y][x].num = `${numV}/${numH}`;
                    else if (numV) newGrid[y][x].num = numV.toString();
                    else if (numH) newGrid[y][x].num = numH.toString();
                }
            }
        }

        // 2. Fill blanks
        if (shouldFillBlanks) {
            const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
            for (let y = 0; y < size; y++) {
                for (let x = 0; x < size; x++) {
                    if (!newGrid[y][x]) {
                        newGrid[y][x] = {
                            char: alphabet[Math.floor(Math.random() * alphabet.length)],
                            blocked: true,
                            input: '',
                            isFiller: true
                        };
                    }
                }
            }
        }

        setGridState(newGrid);
    }, []);

    // Selection Helpers
    const getWordsAtCell = (x, y, wordsList) => {
        return wordsList.filter(w => {
            if (w.dir === 'H') {
                return w.y === y && x >= w.x && x < w.x + w.word.length;
            } else {
                return w.x === x && y >= w.y && y < w.y + w.word.length;
            }
        });
    };

    const getWordCells = (word) => {
        const cells = [];
        for (let i = 0; i < word.word.length; i++) {
            if (word.dir === 'H') {
                cells.push({ x: word.x + i, y: word.y });
            } else {
                cells.push({ x: word.x, y: word.y + i });
            }
        }
        return cells;
    };

    const selectWord = (word) => {
        if (!word) return;
        const cells = getWordCells(word);
        const cellSet = new Set(cells.map(c => `${c.x}-${c.y}`));
        setSelectedCells(cellSet);
    };

    // Interaction Handlers
    const handleCellInput = (x, y, val, size) => {
        const normalized = val.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
        const newVal = normalized.slice(-1);

        setGridState(prev => {
            const newGrid = prev.map(row => [...row]);
            if (newGrid[y] && newGrid[y][x]) {
                newGrid[y][x] = { ...newGrid[y][x], input: newVal };
            }
            return newGrid;
        });

        setSelectedCells(new Set());

        if (newVal) {
            moveFocus(x, y, 1, 0, size) || moveFocus(x, y, 0, 1, size);
        }
    };

    const moveFocus = (x, y, dx, dy, size) => {
        let nx = x + dx, ny = y + dy;
        if (nx >= 0 && nx < size && ny >= 0 && ny < size) {
            const el = document.getElementById(`cell-${nx}-${ny}`);
            if (el && !el.disabled) {
                el.focus();
                el.select();
                return true;
            }
        }
        return false;
    };

    const handleKeyDown = (e, x, y, size) => {
        if (e.key === 'Backspace') {
            const cell = gridState[y][x];
            if (!cell.input) {
                moveFocus(x, y, -1, 0, size) || moveFocus(x, y, 0, -1, size);
            } else {
                handleCellInput(x, y, '', size);
            }
        } else if (e.key === 'ArrowRight') moveFocus(x, y, 1, 0, size);
        else if (e.key === 'ArrowLeft') moveFocus(x, y, -1, 0, size);
        else if (e.key === 'ArrowUp') moveFocus(x, y, 0, -1, size);
        else if (e.key === 'ArrowDown') moveFocus(x, y, 0, 1, size);
    };

    const handleGridCellClick = (x, y, wordsList) => {
        const wordsAtCell = getWordsAtCell(x, y, wordsList);
        if (wordsAtCell.length === 0) return;

        if (selectedCells.size === 0) {
            selectWord(wordsAtCell[0]);
            return;
        }

        const currentWordCells = wordsAtCell.map(w => getWordCells(w));
        let currentWordIndex = -1;

        for (let i = 0; i < currentWordCells.length; i++) {
            const wordCellSet = new Set(currentWordCells[i].map(c => `${c.x}-${c.y}`));
            if (wordCellSet.size === selectedCells.size && Array.from(wordCellSet).every(c => selectedCells.has(c))) {
                currentWordIndex = i;
                break;
            }
        }

        const nextIndex = (currentWordIndex + 1) % wordsAtCell.length;
        selectWord(wordsAtCell[nextIndex]);
    };

    // Game Actions
    const checkAnswers = () => {
        let allCorrect = true;
        let hasEmpty = false;

        const newGrid = gridState.map(row => row.map(cell => {
            if (!cell || cell.isFiller) return cell;
            if (!cell.input) { hasEmpty = true; return cell; }

            const isCorrect = cell.input === cell.char;
            if (!isCorrect) allCorrect = false;

            return { ...cell, status: isCorrect ? 'correct' : 'incorrect' };
        }));

        setGridState(newGrid);
        return { allCorrect, hasEmpty };
    };

    const revealAnswers = () => {
        const newGrid = gridState.map(row => row.map(cell => {
            if (!cell || cell.isFiller) return cell;
            return { ...cell, input: cell.char, status: 'revealed' };
        }));
        setGridState(newGrid);
    };

    const clearGrid = () => {
        const newGrid = gridState.map(row => row.map(cell => {
            if (!cell || cell.isFiller) return cell;
            return { ...cell, input: '', status: null };
        }));
        setGridState(newGrid);
    };

    // Touch handlers needed for the grid would assume access to these vars
    // We can export them or the logic to handle them

    return {
        gridState,
        setGridState,
        selectedCells,
        setSelectedCells,
        gridRef,
        initializeGrid,
        handleCellInput,
        handleKeyDown,
        handleGridCellClick,
        checkAnswers,
        revealAnswers,
        clearGrid,
        isSelectingWord,
        setIsSelectingWord,
        touchStartCell,
        setTouchStartCell,
        getWordsAtCell,
        selectWord,
        getCellFromPoint: (clientX, clientY) => {
            if (!gridRef.current) return null;
            const element = document.elementFromPoint(clientX, clientY);
            if (!element) return null;
            const cellMatch = element.id?.match(/cell-(\d+)-(\d+)/);
            if (cellMatch) return { x: parseInt(cellMatch[1]), y: parseInt(cellMatch[2]) };
            return null;
        }
    };
};
