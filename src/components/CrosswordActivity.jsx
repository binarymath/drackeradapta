import React, { useState, useEffect, useRef } from 'react';
import { generateCrossword } from '../utils/crosswordGenerator';
import { Edit2, Sparkles, Trash2, Save, X, Plus, RefreshCw, Eye, Eraser, Check, Trophy, UserPlus } from 'lucide-react';

// UI Components
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { Card } from './ui/Card';
import { Input, Select, TextArea } from './ui/Input';
import { Modal } from './ui/Modal';

export const CrosswordActivity = ({ data, topic, apiKey, onUpdate, isGameMode, onRestart }) => {
    // --- STATE ---
    const [words, setWords] = useState(data?.words || []); // {word, clue, x, y, dir, num}
    const [gridSize, setGridSize] = useState(data?.gridSize || 15);
    const [gridState, setGridState] = useState([]); // Matriz de user input + estado
    const [fillBlanks, setFillBlanks] = useState(data?.fillBlanks || false);
    const [playerName, setPlayerName] = useState('');
    const [hasStarted, setHasStarted] = useState(false);
    const [rankings, setRankings] = useState([]);
    const [startTime, setStartTime] = useState(null);
    const [lastRunTimeMs, setLastRunTimeMs] = useState(null);
    const [showRanking, setShowRanking] = useState(false);
    const [showSolution, setShowSolution] = useState(false);
    const [isCompleted, setIsCompleted] = useState(false);

    // Editor State
    const [showEditor, setShowEditor] = useState(false);
    const [editingWord, setEditingWord] = useState(null); // { index, ...data }

    // Touch/Drag Selection State
    const [isSelectingWord, setIsSelectingWord] = useState(false);
    const [selectedCells, setSelectedCells] = useState(new Set()); // Cells being selected
    const [touchStartCell, setTouchStartCell] = useState(null);
    const gridRef = useRef(null);

    // Init
    useEffect(() => {
        try {
            const saved = localStorage.getItem('crossword_ranking');
            if (saved) setRankings(JSON.parse(saved));
        } catch (err) {
            console.error('Erro ao carregar ranking', err);
        }
    }, []);

    useEffect(() => {
        if (!data || !data.words) return;
        initializeGame(data.words);
        setIsCompleted(false);
        setHasStarted(false);
    }, [data, fillBlanks, gridSize]);

    const initializeGame = (wordList) => {
        // Recria o estado visual da grade com base na lista de palavras posicionadas
        let newGrid = Array(gridSize).fill(null).map(() => Array(gridSize).fill(null));

        // 1. Mapear células ativas
        wordList.forEach(w => {
            for (let i = 0; i < w.word.length; i++) {
                let cx = w.dir === 'H' ? w.x + i : w.x;
                let cy = w.dir === 'V' ? w.y + i : w.y;

                if (cx < gridSize && cy < gridSize) {
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

        // 1.5 Formatar números (Vertical / Horizontal)
        for (let y = 0; y < gridSize; y++) {
            for (let x = 0; x < gridSize; x++) {
                if (newGrid[y][x]) {
                    const { numV, numH } = newGrid[y][x];
                    if (numV && numH) newGrid[y][x].num = `${numV}/${numH}`;
                    else if (numV) newGrid[y][x].num = numV.toString();
                    else if (numH) newGrid[y][x].num = numH.toString();
                }
            }
        }

        // 2. Preencher vazios (se fillBlanks)
        if (fillBlanks) {
            const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
            for (let y = 0; y < gridSize; y++) {
                for (let x = 0; x < gridSize; x++) {
                    if (!newGrid[y][x]) {
                        newGrid[y][x] = {
                            char: alphabet[Math.floor(Math.random() * alphabet.length)],
                            blocked: true, // É decorativo
                            input: '', // Não digita
                            isFiller: true
                        };
                    }
                }
            }
        }

        setGridState(newGrid);
        setWords(wordList);
    };

    // --- GAMEPLAY HANDLERS ---
    const handleCellInput = (x, y, val) => {
        const newVal = val.toUpperCase().slice(-1);
        const newGrid = [...gridState];
        // Ensure row exists (safety)
        if (newGrid[y] && newGrid[y][x]) {
            newGrid[y][x] = { ...newGrid[y][x], input: newVal };
            setGridState(newGrid);

            // Clear selection when typing
            setSelectedCells(new Set());

            if (newVal) {
                // Tenta avançar foco
                // Precisamos saber a direção da palavra atual que estamos editando.
                // Heurística simples: tenta direita, se não tenta baixo.
                moveFocus(x, y, 1, 0) || moveFocus(x, y, 0, 1);
            }
        }
    };

    const handleKeyDown = (e, x, y) => {
        if (e.key === 'Backspace') {
            const cell = gridState[y][x];
            if (!cell.input) {
                moveFocus(x, y, -1, 0) || moveFocus(x, y, 0, -1);
            } else {
                handleCellInput(x, y, '');
            }
        } else if (e.key === 'ArrowRight') moveFocus(x, y, 1, 0);
        else if (e.key === 'ArrowLeft') moveFocus(x, y, -1, 0);
        else if (e.key === 'ArrowUp') moveFocus(x, y, 0, -1);
        else if (e.key === 'ArrowDown') moveFocus(x, y, 0, 1);
    };

    const moveFocus = (x, y, dx, dy) => {
        let nx = x + dx, ny = y + dy;
        if (nx >= 0 && nx < gridSize && ny >= 0 && ny < gridSize) {
            // Busca input no DOM
            const el = document.getElementById(`cell-${nx}-${ny}`);
            if (el && !el.disabled) {
                el.focus();
                el.select();
                return true;
            }
        }
        return false;
    };

    // --- TOUCH/DRAG SELECTION HANDLERS ---
    const getCellFromPoint = (clientX, clientY) => {
        if (!gridRef.current) return null;
        const element = document.elementFromPoint(clientX, clientY);
        if (!element) return null;
        
        const cellMatch = element.id?.match(/cell-(\d+)-(\d+)/);
        if (cellMatch) {
            return { x: parseInt(cellMatch[1]), y: parseInt(cellMatch[2]) };
        }
        return null;
    };

    const getWordsAtCell = (x, y) => {
        // Returns all words that pass through this cell
        return words.filter(w => {
            if (w.dir === 'H') {
                return w.y === y && x >= w.x && x < w.x + w.word.length;
            } else {
                return w.x === x && y >= w.y && y < w.y + w.word.length;
            }
        });
    };

    const getWordCells = (word) => {
        // Returns array of {x, y} for all cells in a word
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
        const cells = getWordCells(word);
        const cellSet = new Set(cells.map(c => `${c.x}-${c.y}`));
        console.log('Selecionando palavra:', word.word, 'Células:', Array.from(cellSet));
        setSelectedCells(cellSet);
    };

    const handleTouchStart = (e) => {
        const touch = e.touches[0];
        const cell = getCellFromPoint(touch.clientX, touch.clientY);
        console.log('Touch start em célula:', cell);
        if (cell) {
            setTouchStartCell(cell);
            setIsSelectingWord(true);
            
            // Auto-select first word at this cell
            const wordsAtCell = getWordsAtCell(cell.x, cell.y);
            console.log('Palavras encontradas:', wordsAtCell);
            if (wordsAtCell.length > 0) {
                selectWord(wordsAtCell[0]);
            }
        }
    };

    const handleTouchMove = (e) => {
        if (!isSelectingWord || !touchStartCell) return;
        
        e.preventDefault(); // Previne scroll durante seleção
        
        const touch = e.touches[0];
        const currentCell = getCellFromPoint(touch.clientX, touch.clientY);
        if (!currentCell) return;

        // Determine direction of drag
        const dx = currentCell.x - touchStartCell.x;
        const dy = currentCell.y - touchStartCell.y;
        
        // Determine if drag is primarily horizontal or vertical
        const isHorizontal = Math.abs(dx) > Math.abs(dy);

        // Find word in that direction that contains both start and current cell
        const wordsAtStart = getWordsAtCell(touchStartCell.x, touchStartCell.y);
        let selectedWord = null;

        if (isHorizontal) {
            // Look for horizontal word
            selectedWord = wordsAtStart.find(w => w.dir === 'H');
        } else {
            // Look for vertical word
            selectedWord = wordsAtStart.find(w => w.dir === 'V');
        }

        // If found word, select it
        if (selectedWord) {
            selectWord(selectedWord);
        }
    };

    const handleTouchEnd = (e) => {
        setIsSelectingWord(false);
        
        // Auto-fill selected word with focus
        if (selectedCells.size > 0) {
            const cellArray = Array.from(selectedCells).map(c => c.split('-').map(Number));
            if (cellArray.length > 0) {
                const firstCell = cellArray[0];
                const el = document.getElementById(`cell-${firstCell[0]}-${firstCell[1]}`);
                if (el) {
                    el.focus();
                }
            }
        }
    };

    const handleGridCellClick = (x, y) => {
        // Obtém todas as palavras nesta célula
        const wordsAtCell = getWordsAtCell(x, y);
        if (wordsAtCell.length === 0) return;

        // Se nada está selecionado, seleciona primeira palavra
        if (selectedCells.size === 0) {
            selectWord(wordsAtCell[0]);
            return;
        }

        // Verifica qual palavra atual está selecionada
        const currentWordCells = wordsAtCell.map(w => getWordCells(w));
        let currentWordIndex = -1;

        for (let i = 0; i < currentWordCells.length; i++) {
            const wordCellSet = new Set(currentWordCells[i].map(c => `${c.x}-${c.y}`));
            
            // Compara o tamanho e cada célula
            if (
                wordCellSet.size === selectedCells.size &&
                Array.from(wordCellSet).every(c => selectedCells.has(c))
            ) {
                currentWordIndex = i;
                break;
            }
        }

        // Move para próxima palavra (com ciclo)
        const nextIndex = (currentWordIndex + 1) % wordsAtCell.length;
        selectWord(wordsAtCell[nextIndex]);
    };

    const isCellSelected = (x, y) => {
        const result = selectedCells.has(`${x}-${y}`);
        if (result) {
            console.log(`Célula ${x},${y} está selecionada`);
        }
        return result;
    };

    const handleGridCellClick = (x, y) => {
        // Get all words at this cell
        const wordsAtCell = getWordsAtCell(x, y);
        if (wordsAtCell.length === 0) return;

        // If no word selected, select the first one
        if (selectedCells.size === 0) {
            selectWord(wordsAtCell[0]);
            return;
        }

        // Check if current selection matches any word at this cell
        const currentWordCells = wordsAtCell.map(w => getWordCells(w));
        let currentWordIndex = -1;

        for (let i = 0; i < currentWordCells.length; i++) {
            const wordCellSet = new Set(currentWordCells[i].map(c => `${c.x}-${c.y}`));
            if (
                wordCellSet.size === selectedCells.size &&
                Array.from(wordCellSet).every(c => selectedCells.has(c))
            ) {
                currentWordIndex = i;
                break;
            }
        }

        // Cycle to next word or first if at end
        const nextIndex = (currentWordIndex + 1) % wordsAtCell.length;
        selectWord(wordsAtCell[nextIndex]);
    };

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
        if (hasEmpty) alert("Preencha todos os campos antes de verificar!");
        else if (allCorrect) alert("Parabéns! Você completou o desafio!");
        else alert("Existem erros. Verifique as células vermelhas.");
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

    const persistRanking = (finalTimeMs) => {
        const entry = {
            name: playerName?.trim() || 'Jogador',
            status: 'completo',
            words: words.length,
            date: new Date().toISOString(),
            timeMs: typeof finalTimeMs === 'number' ? finalTimeMs : Number.MAX_SAFE_INTEGER
        };
        const normalized = rankings.map(r => ({ ...r, timeMs: typeof r.timeMs === 'number' ? r.timeMs : Number.MAX_SAFE_INTEGER }));
        const updated = [...normalized, entry]
            .sort((a, b) => {
                if (a.timeMs !== b.timeMs) return a.timeMs - b.timeMs;
                return new Date(b.date) - new Date(a.date);
            });
        setRankings(updated);
        localStorage.setItem('crossword_ranking', JSON.stringify(updated));
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
        localStorage.setItem('crossword_ranking', JSON.stringify(updated));
    };

    const startGame = () => {
        if (!playerName.trim()) return;
        setHasStarted(true);
        setIsCompleted(false);
        setStartTime(Date.now());
        setLastRunTimeMs(null);
        setShowRanking(false);
        clearGrid();
    };

    const handleRestart = () => {
        setHasStarted(false);
        setIsCompleted(false);
        setPlayerName('');
        setStartTime(null);
        setLastRunTimeMs(null);
        setShowRanking(false);
        setShowSolution(false);
        clearGrid();
    };

    const checkAnswerWithTracking = () => {
        const newGrid = gridState.map(row => row.map(cell => {
            if (!cell || cell.isFiller) return cell;
            return { ...cell, status: cell.input?.toUpperCase() === cell.char ? 'correct' : cell.input ? 'incorrect' : null };
        }));

        const hasEmpty = newGrid.some(row => row.some(cell => cell && !cell.isFiller && !cell.input));
        const allCorrect = newGrid.every(row => row.every(cell => !cell || cell.isFiller || cell.status === 'correct'));

        setGridState(newGrid);
        if (hasEmpty) alert("Preencha todos os campos antes de verificar!");
        else if (allCorrect) {
            const finalTimeMs = startTime ? Date.now() - startTime : Number.MAX_SAFE_INTEGER;
            setLastRunTimeMs(finalTimeMs);
            setIsCompleted(true);
            persistRanking(finalTimeMs);
            alert("Parabéns! Você completou o desafio!");
        }
        else alert("Existem erros. Verifique as células vermelhas.");
    };

    // --- EDITOR HANDLERS ---

    // Função para re-gerar posição das palavras
    const regenerateLayout = () => {
        // Usa apenas words com clues, ignora posições atuais
        const cleanList = words.map(w => ({ word: w.word, clue: w.clue }));
        const result = generateCrossword(cleanList, gridSize);

        // Renumera
        const placedWithNum = result.words.map((w, i) => ({ ...w, num: i + 1 }));

        setWords(placedWithNum);
        initializeGame(placedWithNum); // Atualiza grid visual

        // Notifica pai para salvar no backup do app
        if (onUpdate) {
            onUpdate({ words: placedWithNum, gridSize, fillBlanks });
        }
    };

    const addWord = (newWord) => {
        // Adiciona à lista e tenta regenerar layout
        const updatedList = [...words, { ...newWord, x: 0, y: 0, dir: 'H', num: 0 }];
        // Limpa posições para forçar regeração inteligente se quiser, 
        // ou tenta só posicionar ? Melhor regenerar tudo para otimizar espaço.
        const cleanList = updatedList.map(w => ({ word: w.word, clue: w.clue }));

        const result = generateCrossword(cleanList, gridSize);
        if (result.words.length < cleanList.length) {
            alert(`Não foi possível encaixar todas as palavras na grade ${gridSize}x${gridSize}. Algumas palavras ficaram de fora.`);
        }

        const placedWithNum = result.words.map((w, i) => ({ ...w, num: i + 1 }));
        setWords(placedWithNum);
        initializeGame(placedWithNum);
        if (onUpdate) onUpdate({ words: placedWithNum, gridSize, fillBlanks });
    };

    const removeWord = (index) => {
        const newList = [...words];
        newList.splice(index, 1);

        // Regenera para fechar buracos
        const cleanList = newList.map(w => ({ word: w.word, clue: w.clue }));
        const result = generateCrossword(cleanList, gridSize);
        const placedWithNum = result.words.map((w, i) => ({ ...w, num: i + 1 }));

        setWords(placedWithNum);
        initializeGame(placedWithNum);
        if (onUpdate) onUpdate({ words: placedWithNum, gridSize, fillBlanks });
    };


    // --- PRINT VIEW ---
    function renderPrintView() {
        return (
            <div className="flex flex-col gap-6 p-4 max-w-6xl mx-auto print:gap-3 print:p-2">
                <Card className="flex flex-wrap justify-between items-center p-4 print:hidden">
                    <div className="flex items-center gap-4">
                        <h2 className="text-xl font-bold text-brown-900 flex items-center gap-2">
                            <Sparkles className="text-brown-500" />
                            {topic || "Palavras Cruzadas"}
                        </h2>
                        <Badge variant="outline">{words.length} Palavras</Badge>
                    </div>
                    <div className="flex gap-2 no-print flex-wrap sm:flex-nowrap">
                        <Button onClick={() => setShowEditor(true)} icon={Edit2} className="whitespace-nowrap">
                            Editar / Adicionar
                        </Button>
                        <Button
                            onClick={() => setShowSolution(!showSolution)}
                            variant={showSolution ? "primary" : "secondary"}
                            className={`whitespace-nowrap min-w-[170px] text-center ${showSolution ? 'bg-green-600 text-white' : ''}`}
                        >
                            {showSolution ? 'Ocultar Solução' : 'Mostrar Solução'}
                        </Button>
                    </div>
                </Card>

                <Card className="w-full flex flex-col items-center print:shadow-none print:border-none">
                    <div
                        className="grid gap-0 bg-transparent p-0 rounded print:bg-transparent print:!gap-0 print:!p-0 print:!shadow-none print:!border-none"
                        style={{
                            gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
                            width: 'fit-content',
                            maxWidth: '100%'
                        }}
                    >
                        {gridState.map((row, y) => (
                            row.map((cell, x) => {
                                if (!cell) return <div key={`${x}-${y}`} className="w-8 h-8 sm:w-10 sm:h-10 bg-brown-50/30 print:invisible print:border-none" />;
                                const isFiller = cell.isFiller;
                                return (
                                    <div
                                        key={`${x}-${y}`}
                                        className={`relative w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center ${isFiller ? 'bg-brown-50 print:bg-white' : 'bg-white'} border border-brown-900 print:!border print:!border-black print:z-10`}
                                        style={{ printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' }}
                                    >
                                        {cell.num && (
                                            <span className="absolute top-0.5 left-0.5 text-[10px] font-black text-brown-800 leading-none pointer-events-none print:text-black z-20">
                                                {cell.num}
                                            </span>
                                        )}
                                        {!isFiller && (
                                            <span className={`text-lg font-bold uppercase ${showSolution ? 'text-brown-900' : 'text-transparent'}`}>
                                                {showSolution ? cell.char : ''}
                                            </span>
                                        )}
                                    </div>
                                );
                            })
                        ))}
                    </div>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                    <Card className="print:shadow-none print:border">
                        <h3 className="font-bold text-brown-900 mb-4 flex items-center gap-2 text-lg border-b border-brown-100 pb-2">
                            <Badge variant="secondary">HORIZONTAIS</Badge>
                        </h3>
                        <ul className="space-y-3 text-sm">
                            {words.filter(w => w.dir === 'H').sort((a, b) => a.num - b.num).map(w => (
                                <li key={w.num} className="flex items-start gap-3">
                                    <span className="font-black text-brown-600 min-w-[1.5rem] text-right">{w.num}.</span>
                                    <span className="text-brown-700 font-medium flex-1 whitespace-normal break-normal hyphens-none">{w.clue}</span>
                                </li>
                            ))}
                        </ul>
                    </Card>

                    <Card className="print:shadow-none print:border">
                        <h3 className="font-bold text-brown-900 mb-4 flex items-center gap-2 text-lg border-b border-brown-100 pb-2">
                            <Badge className="bg-brown-800 text-white border-none">VERTICAIS</Badge>
                        </h3>
                        <ul className="space-y-3 text-sm">
                            {words.filter(w => w.dir === 'V').sort((a, b) => a.num - b.num).map(w => (
                                <li key={w.num} className="flex items-start gap-3">
                                    <span className="font-black text-brown-800 min-w-[1.5rem] text-right">{w.num}.</span>
                                    <span className="text-brown-700 font-medium flex-1 whitespace-normal break-normal hyphens-none">{w.clue}</span>
                                </li>
                            ))}
                        </ul>
                    </Card>
                </div>
            </div>
        );
    }

    // --- RENDER ---
    if (!isGameMode) {
        return (
            <>
                {renderPrintView()}
                {showEditor && (
                    <Modal
                        isOpen={showEditor}
                        onClose={() => setShowEditor(false)}
                        title="Editor de Palavras"
                        icon={Edit2}
                        size="lg"
                        footer={
                            <div className="flex justify-end w-full">
                                <Button onClick={() => setShowEditor(false)} icon={Check}>
                                    Concluir Edição
                                </Button>
                            </div>
                        }
                    >
                        <div className="flex-1">
                            <form
                                className="bg-white p-4 rounded-xl shadow-sm mb-6 border border-brown-200"
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    const w = e.target.word.value.trim().toUpperCase();
                                    const c = e.target.clue.value.trim();
                                    if (w && c) {
                                        addWord({ word: w, clue: c });
                                        e.target.reset();
                                    }
                                }}
                            >
                                <h4 className="font-bold text-sm text-brown-500 uppercase mb-3">Adicionar Nova Palavra</h4>
                                <div className="flex gap-3">
                                    <Input name="word" placeholder="PALAVRA" className="flex-1 font-bold uppercase" required />
                                    <TextArea name="clue" placeholder="Dica..." className="flex-[2] h-auto" rows={2} required />
                                    <Button type="submit" className="h-auto py-2">
                                        <Plus className="w-5 h-5" />
                                    </Button>
                                </div>
                            </form>

                            <div className="space-y-2">
                                {words.map((w, idx) => (
                                    <Card key={idx} className="flex items-center justify-between p-3 group hover:border-brown-300 shadow-sm">
                                        <div>
                                            <div className="font-bold text-brown-800">{w.word}</div>
                                            <div className="text-xs text-brown-500">{w.clue}</div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Button
                                                onClick={() => removeWord(idx)}
                                                variant="ghost"
                                                className="text-brown-300 hover:text-red-500 opacity-0 group-hover:opacity-100"
                                                icon={Trash2}
                                            />
                                        </div>
                                    </Card>
                                ))}
                                {words.length === 0 && (
                                    <p className="text-center text-brown-400 italic py-4">Nenhuma palavra adicionada ainda.</p>
                                )}
                            </div>

                            <div className="mt-6 flex justify-end">
                                <Button onClick={regenerateLayout} icon={Sparkles}>
                                    Regerar Grade
                                </Button>
                            </div>
                        </div>
                    </Modal>
                )}
            </>
        );
    }

    if (!hasStarted) {
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
                        icon={UserPlus}
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
                                            <span>{r.words} palavras • {formatTime(r.timeMs)}</span>
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

    if (isCompleted) {
        return (
            <div className="flex flex-col items-center justify-center p-8 space-y-6 animate-fade-in max-w-2xl mx-auto">
                <div className="w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center mb-4 border-4 border-yellow-300 shadow-lg">
                    <Trophy className="w-12 h-12 text-yellow-600" />
                </div>
                <h2 className="text-3xl font-bold text-brown-900">Palavras Cruzadas Completas!</h2>
                {Number.isFinite(lastRunTimeMs) && (
                    <p className="text-sm text-brown-600">Tempo: {formatTime(lastRunTimeMs)}</p>
                )}
                
                <div className="flex gap-3">
                    <Button onClick={() => setShowRanking(!showRanking)} variant="secondary" className="border-amber-200 text-amber-800 hover:bg-amber-100" icon={Trophy}>
                        {showRanking ? 'Esconder Ranking' : 'Ver Ranking'}
                    </Button>
                    <Button onClick={handleRestart} icon={RefreshCw} className="bg-brown-600 hover:bg-brown-700 text-white px-8 py-3 text-lg rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all">
                        Jogar Novamente
                    </Button>
                </div>

                {showRanking && rankings.length > 0 && (
                    <Card className="w-full bg-white border border-amber-200 p-4 text-sm text-brown-800">
                        <div className="flex items-center gap-2 mb-2 font-semibold text-amber-800">
                            <Trophy className="w-4 h-4" /> Ranking Local
                        </div>
                        <div className="space-y-1">
                            {rankings.map((r, idx) => (
                                <div key={idx} className={`flex justify-between items-center ${r.name === (playerName?.trim() || 'Jogador') ? 'font-bold text-green-700' : ''}`}>
                                    <span>{idx + 1}. {r.name}</span>
                                    <div className="flex items-center gap-2">
                                        <span>{r.words} palavras • {formatTime(r.timeMs)}</span>
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
        );
    }

    return (
        <div className="flex flex-col gap-6 p-4 max-w-6xl mx-auto print:gap-3 print:p-2">

            {/* Toolbar */}
            <Card className="flex flex-wrap justify-between items-center p-4 print:hidden">
                <div className="flex items-center gap-4">
                    <h2 className="text-xl font-bold text-brown-900 flex items-center gap-2">
                        <Sparkles className="text-brown-500" />
                        {topic || "Palavras Cruzadas"}
                    </h2>
                    <Badge variant="outline">
                        {words.length} Palavras
                    </Badge>
                    {selectedCells.size > 0 && (
                        <Badge className="bg-amber-500 text-white">
                            {selectedCells.size} células: {Array.from(selectedCells).join(', ')}
                        </Badge>
                    )}
                </div>

                {!isGameMode && (
                    <div className="flex gap-2">
                        <Button onClick={() => setShowEditor(true)} icon={Edit2}>
                            Editar / Adicionar
                        </Button>
                    </div>
                )}
            </Card>

            {/* Main Layout - Column for better print/PDF flow */}
            <div className="flex flex-col gap-8 print:gap-4">

                {/* Grid Area - Centered */}
                <Card className="w-full flex flex-col items-center print:shadow-none print:border-none">

                    {/* Touch/Drag Info - Mobile Hint */}
                    <div className="w-full md:hidden text-center mb-3 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
                        💡 Dica: Toque e deslize o dedo para selecionar palavras, ou digite normalmente!
                    </div>

                    {/* The Grid */}
                    <div
                        ref={gridRef}
                        className="grid gap-0 bg-transparent p-0 rounded print:bg-transparent print:!gap-0 print:!p-0 print:!shadow-none print:!border-none select-none"
                        style={{
                            gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
                            width: 'fit-content',
                            maxWidth: '100%',
                            userSelect: 'none'
                        }}
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                    >
                        {gridState.map((row, y) => (
                            row.map((cell, x) => {
                                if (!cell) {
                                    // Use 'invisible' to keep size but hide content. 
                                    // ensure it doesn't take up ink. 
                                    return <div key={`${x}-${y}`} className="w-8 h-8 sm:w-10 sm:h-10 bg-brown-50/30 print:invisible print:border-none" />;
                                } // Vazio

                                const isFiller = cell.isFiller;
                                const isSelected = isCellSelected(x, y);
                                return (
                                    <div
                                        key={`${x}-${y}`}
                                        className={`
                                            relative w-8 h-8 sm:w-10 sm:h-10 
                                            flex items-center justify-center 
                                            ${isFiller ? 'bg-brown-50 print:bg-white' : isSelected ? 'bg-amber-200' : 'bg-white'} 
                                            border border-brown-900
                                            print:!border print:!border-black print:z-10
                                            transition-colors duration-75
                                        `}
                                        style={{
                                            printColorAdjust: 'exact',
                                            WebkitPrintColorAdjust: 'exact'
                                        }}
                                    >
                                        {cell.num && (
                                            <span className="absolute top-0.5 left-0.5 text-[10px] font-black text-brown-800 leading-none pointer-events-none print:text-black z-20">
                                                {cell.num}
                                            </span>
                                        )}
                                        {isFiller ? (
                                            <span className="text-brown-300 font-sans select-none print:text-slate-200">{cell.char}</span>
                                        ) : (
                                            <input
                                                id={`cell-${x}-${y}`}
                                                type="text"
                                                maxLength={1}
                                                className={`w-full h-full text-center font-bold uppercase outline-none focus:bg-brown-100 cursor-pointer text-lg bg-transparent
                                                    ${cell.status === 'correct' ? 'text-green-700' : cell.status === 'incorrect' ? 'text-red-600' : cell.status === 'revealed' ? 'text-blue-700' : 'text-brown-900'}
                                                    print:text-black print:font-extrabold
                                                `}
                                                value={cell.input}
                                                onChange={(e) => handleCellInput(x, y, e.target.value)}
                                                onKeyDown={(e) => handleKeyDown(e, x, y)}
                                                onClick={() => handleGridCellClick(x, y)}
                                            />
                                        )}
                                    </div>
                                );
                            })
                        ))}
                    </div>

                    {/* Game Controls - Hide on Print */}
                    <div className="mt-8 flex gap-3 no-print print:hidden">
                        <Button onClick={checkAnswerWithTracking} variant="primary" className="bg-green-600 hover:bg-green-700 text-white" icon={Check}>
                            Verificar
                        </Button>
                        {!isGameMode && (
                            <Button onClick={revealAnswers} variant="secondary" className="bg-yellow-500 hover:bg-yellow-400 text-brown-900 border-none" icon={Eye}>
                                Soluções
                            </Button>
                        )}
                        <Button onClick={clearGrid} variant="ghost" className="bg-brown-100 text-brown-800 hover:bg-brown-200" icon={Eraser}>
                            Limpar
                        </Button>
                        <Button onClick={() => {
                            handleRestart();
                            onRestart?.();
                        }} variant="ghost" className="ml-auto bg-brown-100 text-brown-700 hover:bg-brown-200" title="Voltar para modo de impressão">
                            Voltar
                        </Button>
                    </div>

                </Card>

                {/* Clues Area - Bottom, 2 Columns */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                    {/* Horizontal */}
                    <Card className="print:shadow-none print:border">
                        <h3 className="font-bold text-brown-900 mb-4 flex items-center gap-2 text-lg border-b border-brown-100 pb-2">
                            <Badge variant="secondary">HORIZONTAIS</Badge>
                        </h3>
                        <ul className="space-y-3 text-sm">
                            {words.filter(w => w.dir === 'H').sort((a, b) => a.num - b.num).map(w => (
                                <li key={w.num} className="flex items-start gap-3">
                                    <span className="font-black text-brown-600 min-w-[1.5rem] text-right">{w.num}.</span>
                                    <span className="text-brown-700 font-medium flex-1 whitespace-normal break-normal hyphens-none">{w.clue}</span>
                                </li>
                            ))}
                        </ul>
                    </Card>

                    {/* Vertical */}
                    <Card className="print:shadow-none print:border">
                        <h3 className="font-bold text-brown-900 mb-4 flex items-center gap-2 text-lg border-b border-brown-100 pb-2">
                            <Badge className="bg-brown-800 text-white border-none">VERTICAIS</Badge>
                        </h3>
                        <ul className="space-y-3 text-sm">
                            {words.filter(w => w.dir === 'V').sort((a, b) => a.num - b.num).map(w => (
                                <li key={w.num} className="flex items-start gap-3">
                                    <span className="font-black text-brown-800 min-w-[1.5rem] text-right">{w.num}.</span>
                                    <span className="text-brown-700 font-medium flex-1 whitespace-normal break-normal hyphens-none">{w.clue}</span>
                                </li>
                            ))}
                        </ul>
                    </Card>
                </div>

            </div>

            {/* EDITOR MODAL */}
            {showEditor && (
                <Modal
                    isOpen={showEditor}
                    onClose={() => setShowEditor(false)}
                    title="Editor de Palavras"
                    icon={Edit2}
                    size="lg"
                    footer={
                        <div className="flex justify-end w-full">
                            <Button onClick={() => setShowEditor(false)} icon={Check}>
                                Concluir Edição
                            </Button>
                        </div>
                    }
                >
                    <div className="flex-1">
                        {/* Add New */}
                        <form
                            className="bg-white p-4 rounded-xl shadow-sm mb-6 border border-brown-200"
                            onSubmit={(e) => {
                                e.preventDefault();
                                const w = e.target.word.value.trim().toUpperCase();
                                const c = e.target.clue.value.trim();
                                if (w && c) {
                                    addWord({ word: w, clue: c });
                                    e.target.reset();
                                }
                            }}
                        >
                            <h4 className="font-bold text-sm text-brown-500 uppercase mb-3">Adicionar Nova Palavra</h4>
                            <div className="flex gap-3">
                                <Input name="word" placeholder="PALAVRA" className="flex-1 font-bold uppercase" required />
                                <TextArea name="clue" placeholder="Dica..." className="flex-[2] h-auto" rows={2} required />
                                <Button type="submit" className="h-auto py-2">
                                    <Plus className="w-5 h-5" />
                                </Button>
                            </div>
                        </form>

                        {/* List */}
                        <div className="space-y-2">
                            {words.map((w, idx) => (
                                <Card key={idx} className="flex items-center justify-between p-3 group hover:border-brown-300 shadow-sm">
                                    <div>
                                        <div className="font-bold text-brown-800">{w.word}</div>
                                        <div className="text-xs text-brown-500">{w.clue}</div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Button
                                            onClick={() => removeWord(idx)}
                                            variant="ghost"
                                            className="text-brown-300 hover:text-red-500 opacity-0 group-hover:opacity-100"
                                            icon={Trash2}
                                        />
                                    </div>
                                </Card>
                            ))}
                            {words.length === 0 && (
                                <p className="text-center text-brown-400 italic py-4">Nenhuma palavra adicionada ainda.</p>
                            )}
                        </div>

                        {/* Configs */}
                        <div className="mt-6 pt-6 border-t border-brown-200 grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-brown-500 uppercase mb-1">Tamanho da Grade</label>
                                <Select
                                    value={gridSize}
                                    onChange={(e) => { setGridSize(parseInt(e.target.value)); regenerateLayout(); }}
                                >
                                    <option value="10">10x10</option>
                                    <option value="15">15x15 (Padrão)</option>
                                    <option value="20">20x20</option>
                                    <option value="25">25x25 (Grande)</option>
                                </Select>
                            </div>
                            <div className="flex items-center gap-2 pt-5">
                                <label className="flex items-center gap-2 cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        checked={fillBlanks}
                                        onChange={(e) => { setFillBlanks(e.target.checked); regenerateLayout(); }}
                                        className="w-4 h-4 text-brown-600 rounded focus:ring-brown-500 accent-brown-600"
                                    />
                                    <span className="text-sm font-bold text-brown-700">Estilo Caça-Palavras</span>
                                </label>
                            </div>
                        </div>

                        <div className="mt-4 p-3 bg-brown-100 text-brown-800 text-xs rounded-lg border border-brown-200">
                            <b>Nota:</b> Ao adicionar ou remover palavras, o layout da grade será recalculado automaticamente para encontrar a melhor posição de encaixe.
                        </div>

                    </div>
                </Modal>
            )}

        </div>
    );
};
