import React, { useState, useEffect, useRef } from 'react';
import { generateCrossword } from '../utils/crosswordGenerator';
import { Edit2, Sparkles, Trash2, Save, X, Plus, RefreshCw, Eye, Eraser, Check } from 'lucide-react';

export const CrosswordActivity = ({ data, topic, apiKey, onUpdate }) => {
    // --- STATE ---
    const [words, setWords] = useState(data?.words || []); // {word, clue, x, y, dir, num}
    const [gridSize, setGridSize] = useState(data?.gridSize || 15);
    const [gridState, setGridState] = useState([]); // Matriz de user input + estado
    const [fillBlanks, setFillBlanks] = useState(data?.fillBlanks || false);

    // Editor State
    const [showEditor, setShowEditor] = useState(false);
    const [editingWord, setEditingWord] = useState(null); // { index, ...data }

    // Init
    useEffect(() => {
        if (!data || !data.words) return;
        initializeGame(data.words);
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
                            num: i === 0 ? w.num : null // Pode ser sobrescrito se cruzamento startar outra
                        };
                    } else {
                        // Cruzamento
                        if (i === 0) newGrid[cy][cx].num = w.num;
                    }
                }
            }
        });

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


    // --- RENDER ---
    return (
        <div className="flex flex-col gap-6 p-4 max-w-6xl mx-auto">

            {/* Toolbar */}
            <div className="flex flex-wrap justify-between items-center bg-white p-4 rounded-xl shadow-sm border">
                <div className="flex items-center gap-4">
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <Sparkles className="text-amber-500" />
                        {topic || "Palavras Cruzadas"}
                    </h2>
                    <span className="text-xs font-mono bg-slate-100 px-2 py-1 rounded text-slate-500">
                        {words.length} Palavras
                    </span>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={() => setShowEditor(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors text-sm font-bold"
                    >
                        <Edit2 className="w-4 h-4" /> Editar / Adicionar
                    </button>
                </div>
            </div>

            {/* Main Layout - Column for better print/PDF flow */}
            <div className="flex flex-col gap-8">

                {/* Grid Area - Centered */}
                <div className="w-full bg-white p-6 rounded-2xl shadow-lg border border-slate-200 flex flex-col items-center print:shadow-none print:border-none">

                    {/* The Grid */}
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
                                if (!cell) {
                                    // Use 'invisible' to keep size but hide content. 
                                    // ensure it doesn't take up ink. 
                                    return <div key={`${x}-${y}`} className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-100 print:invisible print:border-none" />;
                                } // Vazio

                                const isFiller = cell.isFiller;
                                return (
                                    <div
                                        key={`${x}-${y}`}
                                        className={`
                                            relative w-8 h-8 sm:w-10 sm:h-10 
                                            flex items-center justify-center 
                                            ${isFiller ? 'bg-slate-100 print:bg-white' : 'bg-white'} 
                                            border border-black
                                            print:!border print:!border-black print:z-10
                                        `}
                                        style={{
                                            printColorAdjust: 'exact',
                                            WebkitPrintColorAdjust: 'exact'
                                        }}
                                    >
                                        {cell.num && (
                                            <span className="absolute top-0.5 left-0.5 text-[10px] font-black text-slate-500 leading-none pointer-events-none print:text-black z-20">
                                                {cell.num}
                                            </span>
                                        )}
                                        {isFiller ? (
                                            <span className="text-slate-300 font-sans select-none print:text-slate-200">{cell.char}</span>
                                        ) : (
                                            <input
                                                id={`cell-${x}-${y}`}
                                                type="text"
                                                maxLength={1}
                                                className={`w-full h-full text-center font-bold uppercase outline-none focus:bg-blue-50 cursor-pointer text-lg bg-transparent
                                                    ${cell.status === 'correct' ? 'text-emerald-600' : cell.status === 'incorrect' ? 'text-red-500' : cell.status === 'revealed' ? 'text-indigo-600' : 'text-slate-800'}
                                                    print:text-black print:font-extrabold
                                                `}
                                                value={cell.input}
                                                onChange={(e) => handleCellInput(x, y, e.target.value)}
                                                onKeyDown={(e) => handleKeyDown(e, x, y)}
                                            />
                                        )}
                                    </div>
                                );
                            })
                        ))}
                    </div>

                    {/* Game Controls - Hide on Print */}
                    <div className="mt-8 flex gap-3 no-print print:hidden">
                        <button onClick={checkAnswers} className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-2 rounded-full font-bold shadow hover:bg-emerald-700 hover:scale-105 transition-all">
                            <Check className="w-4 h-4" /> Verificar
                        </button>
                        <button onClick={revealAnswers} className="flex items-center gap-2 bg-amber-500 text-white px-5 py-2 rounded-full font-bold shadow hover:bg-amber-600 hover:scale-105 transition-all">
                            <Eye className="w-4 h-4" /> Soluções
                        </button>
                        <button onClick={clearGrid} className="flex items-center gap-2 bg-slate-200 text-slate-700 px-5 py-2 rounded-full font-bold hover:bg-slate-300 hover:scale-105 transition-all">
                            <Eraser className="w-4 h-4" /> Limpar
                        </button>
                    </div>

                </div>

                {/* Clues Area - Bottom, 2 Columns */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                    {/* Horizontal */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 print:shadow-none print:border">
                        <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2 text-lg border-b pb-2">
                            <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">HORIZONTAIS</span>
                        </h3>
                        <ul className="space-y-3 text-sm">
                            {words.filter(w => w.dir === 'H').sort((a, b) => a.num - b.num).map(w => (
                                <li key={w.num} className="flex items-start gap-3">
                                    <span className="font-black text-blue-600 min-w-[1.5rem] text-right">{w.num}.</span>
                                    <span className="text-slate-700 font-medium flex-1 whitespace-normal break-normal hyphens-none">{w.clue}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Vertical */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 print:shadow-none print:border">
                        <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2 text-lg border-b pb-2">
                            <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded text-xs">VERTICAIS</span>
                        </h3>
                        <ul className="space-y-3 text-sm">
                            {words.filter(w => w.dir === 'V').sort((a, b) => a.num - b.num).map(w => (
                                <li key={w.num} className="flex items-start gap-3">
                                    <span className="font-black text-emerald-600 min-w-[1.5rem] text-right">{w.num}.</span>
                                    <span className="text-slate-700 font-medium flex-1 whitespace-normal break-normal hyphens-none">{w.clue}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

            </div>

            {/* EDITOR MODAL */}
            {showEditor && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="bg-slate-800 px-6 py-4 flex justify-between items-center text-white">
                            <h3 className="text-lg font-bold flex items-center gap-2">
                                <Edit2 className="w-4 h-4" /> Editor de Palavras
                            </h3>
                            <button onClick={() => setShowEditor(false)} className="hover:text-red-400">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto bg-slate-50 flex-1">

                            {/* Add New */}
                            <form
                                className="bg-white p-4 rounded-xl shadow-sm mb-6 border border-slate-200"
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
                                <h4 className="font-bold text-sm text-slate-500 uppercase mb-3">Adicionar Nova Palavra</h4>
                                <div className="flex gap-3">
                                    <input name="word" placeholder="PALAVRA" className="flex-1 p-2 border rounded font-bold uppercase text-sm" required />
                                    <input name="clue" placeholder="Dica..." className="flex-[2] p-2 border rounded text-sm" required />
                                    <button type="submit" className="bg-emerald-600 text-white px-4 rounded hover:bg-emerald-700">
                                        <Plus className="w-5 h-5" />
                                    </button>
                                </div>
                            </form>

                            {/* List */}
                            <div className="space-y-2">
                                {words.map((w, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3 bg-white border rounded-lg group hover:border-blue-300 transition-colors">
                                        <div>
                                            <div className="font-bold text-slate-800">{w.word}</div>
                                            <div className="text-xs text-slate-500">{w.clue}</div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {/* (Edit logic omitted for brevity, can just remove and add) */}
                                            <button onClick={() => removeWord(idx)} className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {words.length === 0 && (
                                    <p className="text-center text-slate-400 italic py-4">Nenhuma palavra adicionada ainda.</p>
                                )}
                            </div>

                            {/* Configs */}
                            <div className="mt-6 pt-6 border-t grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tamanho da Grade</label>
                                    <select
                                        value={gridSize}
                                        onChange={(e) => { setGridSize(parseInt(e.target.value)); regenerateLayout(); }}
                                        className="w-full p-2 border rounded"
                                    >
                                        <option value="10">10x10</option>
                                        <option value="15">15x15 (Padrão)</option>
                                        <option value="20">20x20</option>
                                        <option value="25">25x25 (Grande)</option>
                                    </select>
                                </div>
                                <div className="flex items-center gap-2 pt-5">
                                    <label className="flex items-center gap-2 cursor-pointer select-none">
                                        <input
                                            type="checkbox"
                                            checked={fillBlanks}
                                            onChange={(e) => { setFillBlanks(e.target.checked); regenerateLayout(); }}
                                            className="w-4 h-4 text-blue-600 rounded"
                                        />
                                        <span className="text-sm font-bold text-slate-700">Estilo Caça-Palavras</span>
                                    </label>
                                </div>
                            </div>

                            <div className="mt-4 p-3 bg-blue-50 text-blue-800 text-xs rounded">
                                <b>Nota:</b> Ao adicionar ou remover palavras, o layout da grade será recalculado automaticamente para encontrar a melhor posição de encaixe.
                            </div>

                        </div>

                        <div className="bg-slate-100 p-4 flex justify-end">
                            <button onClick={() => setShowEditor(false)} className="px-6 py-2 bg-slate-800 text-white font-bold rounded-lg shadow hover:bg-slate-900">
                                Concluir Edição
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};
