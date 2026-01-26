import React, { useState, useEffect, useCallback } from 'react';
import { useGemini } from '../contexts/GeminiContext';
import { useActivity } from '../contexts/ActivityContext';
import {
    ArrowLeft, Play, Users, RefreshCw, Trophy, Frown, Sparkles, Brain, Lock, HelpCircle, X, Shuffle, RotateCw, RotateCcw
} from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Card } from './ui/Card';

// --- WORDS DATA REMOVED (BATCH MODE ONLY) ---

export default function HangmanGame() {
    const { geminiService } = useGemini();
    const { topic, lessonDetails, hangmanBatch, setHangmanBatch } = useActivity();
    const [gameState, setGameState] = useState('menu'); // menu, setup, setupAI, playing
    const [category, setCategory] = useState('');
    const [secretWord, setSecretWord] = useState('');
    const [guessedLetters, setGuessedLetters] = useState(new Set());
    const [wrongGuesses, setWrongGuesses] = useState(0);
    const [maxWrongGuesses] = useState(6);
    const [gameResult, setGameResult] = useState(null); // 'win' or 'lose'

    // Local state for current word index inside the batch
    const [currentWordIndex, setCurrentWordIndex] = useState(0);

    // AI States
    const [isLoading, setIsLoading] = useState(false);
    const [hint, setHint] = useState('');
    const [isHintLoading, setIsHintLoading] = useState(false);
    const [aiError, setAiError] = useState('');

    // Normalize string (remove accents)
    const normalizeChar = (char) => {
        return char ? char.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase() : "";
    };

    // Modos antigos removidos ou adaptados


    const startCustomGame = (customCategory, customWord) => {
        if (!customWord.trim()) return;
        setCategory(customCategory || 'Desconhecido');
        setSecretWord(customWord.toUpperCase().trim());
        resetGame();
        setGameState('playing');
    };

    const startAIGame = async (theme) => {
        if (!theme.trim()) return;
        setIsLoading(true);
        setAiError('');

        try {
            if (!geminiService) throw new Error("Serviço de IA indisponível (verifique sua chave API).");

            // Se for chamado via botão do menu com contexto global, 'details' pode vir vazio aqui se não passarmos
            // Mas vamos garantir que pegamos o global se disponível
            const detailsToUse = (topic === theme && lessonDetails) ? lessonDetails : '';

            // Start Batch Game
            const words = await geminiService.generateHangmanWordsBatch(theme, detailsToUse);
            if (!words || words.length === 0) throw new Error("Falha ao gerar palavras.");

            // Initiate new batch in context
            const initialWords = words.slice(0, 10);
            const newBatch = {
                allWords: words, // Persist ALL words
                words: initialWords,
                results: Array(initialWords.length).fill(null),
                theme: theme
            };
            setHangmanBatch(newBatch);
            setCurrentWordIndex(0);
            setCategory(`${theme} (1/10)`);
            setSecretWord(initialWords[0]);
        } catch (err) {
            setAiError(err.message || "Não foi possível conectar à IA.");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleShuffleWords = () => {
        if (!hangmanBatch || !hangmanBatch.allWords) return;

        // Pick 10 random words from allWords
        const shuffled = [...hangmanBatch.allWords].sort(() => Math.random() - 0.5).slice(0, 10);

        setHangmanBatch({
            ...hangmanBatch,
            words: shuffled,
            results: Array(shuffled.length).fill(null) // Reset results for new set
        });
        setCurrentWordIndex(0);
        setSecretWord(shuffled[0]);
        resetGame(); // Reset current game state
    };

    const handleResetBatch = () => {
        if (!hangmanBatch) return;
        setHangmanBatch({
            ...hangmanBatch,
            results: Array(hangmanBatch.words.length).fill(null) // Reset results to null
        });
        setCurrentWordIndex(0);
        setSecretWord(hangmanBatch.words[0]);
        resetGame();
    };

    const getAIHint = async () => {
        if (isHintLoading || hint || gameResult) return;
        setIsHintLoading(true);

        try {
            if (!geminiService) throw new Error("IA indisponível.");
            const aiHint = await geminiService.generateHangmanHint(secretWord, category);
            setHint(aiHint || "A IA ficou sem palavras...");
        } catch (err) {
            setHint("Não consegui buscar uma dica agora.");
        } finally {
            setIsHintLoading(false);
        }
    };

    const resetGame = () => {
        setGuessedLetters(new Set());
        setWrongGuesses(0);
        setGameResult(null);
        setHint('');
        setIsHintLoading(false);
    };



    const handleGuess = useCallback((letter) => {
        if (gameState !== 'playing' || gameResult || isLoading) return;

        const normalizedLetter = normalizeChar(letter);
        const alreadyGuessed = [...guessedLetters].some(l => normalizeChar(l) === normalizedLetter);
        if (alreadyGuessed) return;

        const newGuessed = new Set(guessedLetters);
        newGuessed.add(letter);
        setGuessedLetters(newGuessed);

        const normalizedSecret = normalizeChar(secretWord);
        if (!normalizedSecret.includes(normalizedLetter)) {
            setWrongGuesses(prev => prev + 1);
        }
    }, [gameState, gameResult, guessedLetters, secretWord, isLoading]);

    // Check Win/Loss
    useEffect(() => {
        if (gameState !== 'playing' || !secretWord) return;

        if (wrongGuesses >= maxWrongGuesses) {
            setGameResult('lose');
            updateBatchResult('lose');
            return;
        }

        const normalizedGuesses = [...guessedLetters].map(l => normalizeChar(l));
        const isWin = secretWord.split('').every(char => {
            if (/[^a-zA-ZÇ]/.test(char)) return true;
            return normalizedGuesses.includes(normalizeChar(char));
        });

        if (isWin && secretWord.length > 0) {
            setGameResult('win');
            updateBatchResult('win');
        }
    }, [wrongGuesses, guessedLetters, secretWord, gameState, maxWrongGuesses]);

    const updateBatchResult = (result) => {
        if (hangmanBatch) {
            const newResults = [...hangmanBatch.results];
            newResults[currentWordIndex] = result;
            setHangmanBatch({ ...hangmanBatch, results: newResults });
        }
    };

    const handleSelectWord = (index) => {
        if (!hangmanBatch) return;
        const word = hangmanBatch.words[index];
        setCurrentWordIndex(index);
        setSecretWord(word);
        setCategory(`${hangmanBatch.theme} (${index + 1}/${hangmanBatch.words.length})`);

        // Reset only if not already played? For now always reset to replay or play new
        // Ideally we should check if result exists
        if (hangmanBatch.results[index]) {
            // Maybe show result screen immediately? 
            // For simplicity, let's allow replaying but maybe show a note
            resetGame();
            // Pre-fill if we wanted to show completed state, but "Play" implies playing
        } else {
            resetGame();
        }
        setGameState('playing');
    };


    // Keyboard Listener
    useEffect(() => {
        const handleKeyDown = (e) => {
            const char = e.key.toUpperCase();
            if (gameState === 'playing' && /^[A-Z]$/.test(char)) {
                handleGuess(char);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [gameState, handleGuess]);

    return (
        <div className="w-full flex justify-center py-4 px-2 sm:px-0">
            <style>{`
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                .animate-fade-in { animation: fadeIn 0.5s ease-out forwards; }
`}</style>
            {/* Key on Card forces remount if secretWord changes ONLY when playing, preventing 'reveal' flash */}
            <Card key={gameState === 'playing' ? secretWord : 'menu'} className="w-full max-w-4xl bg-white border-brown-200 shadow-xl overflow-hidden flex flex-col min-h-[500px]">

                {/* Header */}
                <div className="bg-brown-600 p-4 text-center shadow-md relative flex items-center justify-center">
                    {gameState !== 'menu' && !isLoading && (
                        <button
                            onClick={() => setGameState('menu')}
                            className="absolute left-4 p-2 hover:bg-white/10 rounded-full transition-colors text-white"
                            title="Voltar ao Menu"
                        >
                            <ArrowLeft className="w-6 h-6" />
                        </button>
                    )}
                    <h1 className="text-xl sm:text-2xl font-bold tracking-wider uppercase text-white drop-shadow-md flex items-center gap-2">
                        Jogo da Forca <span className="text-xs bg-amber-400 text-brown-900 px-2 py-0.5 rounded-full font-mono border border-brown-800">Drácker</span>
                    </h1>
                </div>

                <div className="p-4 sm:p-8 flex-1 overflow-y-auto">

                    {/* LOADING */}
                    {isLoading && (
                        <div className="flex flex-col items-center justify-center h-full gap-4 animate-fade-in py-12 text-brown-600">
                            <div className="animate-spin text-amber-500">
                                <Sparkles size={48} />
                            </div>
                            <h3 className="text-xl font-bold text-brown-800">Invocando Palavra...</h3>
                            <p className="text-brown-500 text-center max-w-xs">O Drácker está consultando o pergaminho antigo de palavras.</p>
                        </div>
                    )}

                    {/* MENU */}
                    {gameState === 'menu' && !isLoading && (
                        <div className="flex flex-col gap-4 animate-fade-in py-4 items-center justify-center h-full">
                            {aiError && (
                                <div className="w-full max-w-md bg-red-50 border border-red-200 p-4 rounded-xl text-red-700 flex items-center gap-3 mb-2 animate-fade-in">
                                    <Frown className="w-6 h-6 shrink-0" />
                                    <p className="text-sm font-medium">{aiError}</p>
                                </div>
                            )}
                            <p className="text-brown-500 text-lg mb-4 font-handwriting">Desafio de hoje:</p>

                            {/* BATCH GRID OR START BUTTON */}
                            {hangmanBatch ? (
                                <div className="w-full max-w-lg animate-fade-in flex flex-col gap-4">
                                    <div className="bg-brown-50 p-4 rounded-xl border border-brown-200">
                                        <div className="flex justify-between items-center mb-3">
                                            <h3 className="font-bold text-brown-800 flex items-center gap-2">
                                                <Brain className="w-5 h-5 text-purple-600" />
                                                {hangmanBatch.theme}
                                            </h3>
                                            <div className="flex items-center gap-2">
                                                {/* Shuffle / Randomize 10 */}
                                                <button
                                                    onClick={handleShuffleWords}
                                                    className="p-1.5 rounded-full bg-white border border-brown-200 text-brown-500 hover:text-purple-600 hover:bg-purple-50 transition-colors"
                                                    title="Embaralhar / Novas Palavras"
                                                >
                                                    <Shuffle className="w-4 h-4" />
                                                </button>
                                                {/* Reload / Reset Batch */}
                                                <button
                                                    onClick={handleShuffleWords} // Using same logic for now to "Reload" set from pool
                                                    className="p-1.5 rounded-full bg-white border border-brown-200 text-brown-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                                    title="Recarregar Conjunto"
                                                >
                                                    <RotateCw className="w-4 h-4" />
                                                </button>
                                                {/* Reset Progress */}
                                                <button
                                                    onClick={handleResetBatch}
                                                    className="p-1.5 rounded-full bg-white border border-brown-200 text-brown-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                                                    title="Reiniciar Progresso"
                                                >
                                                    <RotateCcw className="w-4 h-4" />
                                                </button>
                                                <span className="text-xs font-mono text-brown-500 bg-white px-2 py-1 rounded border ml-1">
                                                    {hangmanBatch.results.filter(r => r === 'win').length}/10
                                                </span>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                                            {hangmanBatch.words.map((word, idx) => {
                                                const result = hangmanBatch.results[idx];

                                                // Default Pending State (Yellow with Question Mark)
                                                let statusColor = "bg-amber-100 border-amber-300 text-amber-700 hover:bg-amber-200 shadow-sm";
                                                let content = <HelpCircle className="w-5 h-5 opacity-60" />;
                                                let iconDisplay = <span className="text-xs font-bold text-amber-800 absolute top-0.5 left-1.5 opacity-40">{idx + 1}</span>;

                                                if (result === 'win') {
                                                    // Fundo azul claro e Troféu no lugar da palavra
                                                    statusColor = "bg-blue-100 border-blue-300 text-blue-600 shadow-sm";
                                                    iconDisplay = null; // Remove number to clean up
                                                    content = <Trophy className="w-6 h-6 animate-bounce" />;
                                                } else if (result === 'lose') {
                                                    statusColor = "bg-red-50 border-red-200 text-red-800 opacity-70";
                                                    content = <X className="w-6 h-6" />;
                                                    iconDisplay = <Frown className="w-3 h-3 absolute top-1 left-1" />;
                                                }

                                                return (
                                                    <button
                                                        key={idx}
                                                        onClick={() => handleSelectWord(idx)}
                                                        className={`h-12 rounded-lg border flex items-center justify-center relative transition-all active:scale-95 ${statusColor}`}
                                                        title={result === 'win' ? word : `Palavra ${idx + 1}`}
                                                    >
                                                        {iconDisplay}
                                                        {content}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>


                                </div>
                            ) : (
                                <button
                                    onClick={() => {
                                        if (topic && topic.trim()) {
                                            startAIGame(topic);
                                        } else {
                                            setGameState('setupAI');
                                        }
                                    }}
                                    className="group w-full max-w-md bg-gradient-to-r from-purple-100 to-indigo-100 hover:from-purple-200 hover:to-indigo-200 border-2 border-purple-300 p-6 rounded-xl transition-all shadow-md hover:shadow-lg flex items-center gap-4 text-left"
                                >
                                    <div className="bg-white p-3 rounded-full shadow-sm text-purple-600">
                                        <Brain className="w-8 h-8" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-xl text-purple-900 flex items-center gap-2">
                                            Modo Mágico (IA)
                                        </h3>
                                        <p className="text-purple-700 text-sm">
                                            {topic && topic.trim()
                                                ? `Gerar 10 palavras sobre: "${topic}"`
                                                : "Escolha qualquer tema e a IA cria 10 palavras."}
                                        </p>
                                    </div>
                                </button>
                            )}

                            {/* Legacy Modes Removed/Hidden - Focus on AI Batch & PVP */}

                            {/* Option PVP */}
                            <button
                                onClick={() => setGameState('setup')}
                                className="group w-full max-w-md bg-gradient-to-r from-amber-100 to-orange-100 hover:from-amber-200 hover:to-orange-200 border-2 border-amber-300 p-6 rounded-xl transition-all shadow-md hover:shadow-lg flex items-center gap-4 text-left"
                            >
                                <div className="bg-white p-3 rounded-full shadow-sm text-amber-600">
                                    <Users className="w-8 h-8" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-xl text-amber-900">Desafiar Amigo</h3>
                                    <p className="text-amber-700 text-sm">Escreva a palavra para alguém adivinhar.</p>
                                </div>
                            </button>

                            {/* Discard Link (Bottom) */}
                            {hangmanBatch && (
                                <button
                                    onClick={() => setHangmanBatch(null)}
                                    className="w-full text-center text-brown-500 hover:text-red-600 text-sm flex items-center justify-center gap-2 mt-2 py-2 transition-colors active:scale-95"
                                >
                                    <RefreshCw className="w-3 h-3" /> Descartar Jogo Atual e Criar Novo
                                </button>
                            )}
                        </div>
                    )}

                    {/* SETUP AI */}
                    {gameState === 'setupAI' && !isLoading && (
                        <div className="animate-fade-in py-4 max-w-md mx-auto">
                            <div className="bg-indigo-50 border border-indigo-200 p-6 rounded-2xl mb-6 text-center">
                                <Brain className="w-12 h-12 text-indigo-500 mx-auto mb-3" />
                                <h2 className="text-xl font-bold text-indigo-900 mb-2">Desafie a IA</h2>
                                <p className="text-sm text-indigo-700">Digite um tema e o Mago Drácker invocará uma palavra secreta.</p>
                            </div>
                            <SetupAIScreen onStart={startAIGame} error={aiError} />
                        </div>
                    )}

                    {/* SETUP CUSTOM */}
                    {gameState === 'setup' && !isLoading && (
                        <SetupScreen onStart={startCustomGame} />
                    )}

                    {/* PLAYING */}
                    {gameState === 'playing' && !isLoading && (
                        <div className="flex flex-col items-center animate-fade-in w-full">
                            {/* Game Info Bar */}
                            <div className="w-full flex justify-between items-start mb-6 bg-brown-50 px-4 py-3 rounded-xl border border-brown-200 shadow-inner">
                                <div className="flex flex-col">
                                    <span className="text-[10px] sm:text-xs text-brown-500 uppercase tracking-widest font-bold">Tema</span>
                                    <span className="font-bold text-brown-800 text-sm sm:text-base leading-tight max-w-[150px] sm:max-w-xs break-words">
                                        {category}
                                    </span>
                                </div>

                                <div className="flex items-center gap-4">
                                    {/* Hint Button */}
                                    {!gameResult && (
                                        <button
                                            onClick={getAIHint}
                                            disabled={isHintLoading || !!hint}
                                            className={`
                                                flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm
                                                ${hint ? 'bg-gray-200 text-gray-500 cursor-default' : 'bg-purple-600 hover:bg-purple-700 text-white'}
                                                ${isHintLoading ? 'opacity-70 cursor-wait' : ''}
                                            `}
                                        >
                                            {isHintLoading ? <Sparkles className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                                            {isHintLoading ? '...' : hint ? 'Dica Usada' : 'Pedir Dica'}
                                        </button>
                                    )}

                                    <div className="flex flex-col items-end">
                                        <span className="text-[10px] sm:text-xs text-brown-500 uppercase tracking-widest font-bold">Vidas</span>
                                        <div className="flex gap-1 mt-1">
                                            {[...Array(6)].map((_, i) => (
                                                <div key={i} className={`w-2.5 h-2.5 rounded-full border border-brown-300 ${i < (6 - wrongGuesses) ? 'bg-green-500 shadow-sm' : 'bg-gray-200'}`} />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Hint Display */}
                            {hint && (
                                <div className="w-full bg-purple-50 border border-purple-200 rounded-lg p-3 mb-4 animate-fade-in flex gap-3 items-start shadow-sm">
                                    <div className="mt-0.5 text-purple-600 shrink-0"><Sparkles size={16} /></div>
                                    <p className="text-sm text-purple-900 italic font-medium">"{hint}"</p>
                                </div>
                            )}

                            {/* Drawing */}
                            <div className="mb-8 relative p-4 bg-white rounded-xl border-2 border-dashed border-brown-100">
                                <HangmanDrawing wrongGuesses={wrongGuesses} />
                            </div>

                            {/* Word Display */}
                            <div className="mb-10 flex flex-wrap justify-center gap-2 px-2">
                                {secretWord.split('').map((char, index) => {
                                    const isSpecial = /[^a-zA-ZÇ]/.test(char);
                                    const normalized = normalizeChar(char);
                                    const isGuessed = [...guessedLetters].some(l => normalizeChar(l) === normalized);
                                    const showChar = isGuessed || isSpecial || gameResult === 'lose';

                                    return (
                                        <div key={index} className="flex flex-col items-center">
                                            <span className={`
                                                w-8 h-10 sm:w-12 sm:h-14 flex items-center justify-center text-xl sm:text-3xl font-bold rounded-lg
                                                transition-all duration-300 uppercase shadow-sm border-b-4
                                                ${showChar
                                                    ? (gameResult === 'lose' && !isGuessed && !isSpecial ? 'bg-red-50 text-red-500 border-red-200' : 'bg-white text-brown-800 border-brown-300')
                                                    : 'bg-brown-100/50 text-transparent border-brown-200'}
                                                ${isSpecial ? 'w-4 border-none bg-transparent shadow-none' : ''}
                                            `}>
                                                {char}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Game Over / Win Message */}
                            {gameResult && (
                                <div className={`
                                    w-full max-w-lg p-6 mb-8 rounded-xl text-center shadow-lg animate-fade-in border-2
                                    ${gameResult === 'win' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'}
                                `}>
                                    <div className="flex flex-col items-center gap-3">
                                        {gameResult === 'win' ? <Trophy className="w-10 h-10 text-emerald-500" /> : <Frown className="w-10 h-10 text-red-500" />}
                                        <h2 className="text-2xl font-bold">
                                            {gameResult === 'win' ? 'Vitória! 🎉' : 'Que pena! 😢'}
                                        </h2>
                                        {gameResult === 'lose' && (
                                            <p className="text-brown-600 mb-2">A palavra era: <strong className="text-brown-900 text-lg tracking-wide uppercase">{secretWord}</strong></p>
                                        )}
                                        <div className="flex gap-2 justify-center mt-4">
                                            <Button
                                                onClick={() => setGameState('menu')}
                                                variant="outline"
                                                className="gap-2 shadow-sm border-brown-300 text-brown-700 hover:bg-brown-50"
                                            >
                                                <ArrowLeft className="w-4 h-4" /> Voltar para Lista
                                            </Button>

                                            {hangmanBatch.words.length > 0 && currentWordIndex < hangmanBatch.words.length - 1 && (
                                                <Button
                                                    onClick={() => handleSelectWord(currentWordIndex + 1)}
                                                    className="gap-2 shadow-md bg-brown-600 hover:bg-brown-700 text-white"
                                                >
                                                    <Play className="w-4 h-4" /> Próxima Palavra
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Keyboard */}
                            {!gameResult && (
                                <div className="w-full max-w-3xl grid grid-cols-7 sm:grid-cols-10 gap-1.5 sm:gap-2 select-none">
                                    {Array.from("ABCDEFGHIJKLMNOPQRSTUVWXYZ-").map((letter) => {
                                        if (letter === '-') return null;
                                        const normalized = normalizeChar(letter);
                                        const isGuessed = [...guessedLetters].some(l => normalizeChar(l) === normalized);
                                        const isInWord = normalizeChar(secretWord).includes(normalized);

                                        let btnClass = "bg-white text-brown-700 border-brown-200 hover:bg-brown-50 hover:border-brown-300 hover:-translate-y-0.5";
                                        if (isGuessed) {
                                            if (isInWord) {
                                                btnClass = "bg-emerald-100 text-emerald-700 border-emerald-200 opacity-60 cursor-not-allowed transform-none shadow-none";
                                            } else {
                                                btnClass = "bg-gray-100 text-gray-400 border-gray-200 opacity-40 cursor-not-allowed transform-none shadow-none";
                                            }
                                        }

                                        return (
                                            <button
                                                key={letter}
                                                disabled={isGuessed}
                                                onClick={() => handleGuess(letter)}
                                                className={`
                                                    h-10 sm:h-12 rounded-lg font-bold text-lg border-b-4 active:border-b-0 active:translate-y-1 transition-all touch-manipulation shadow-sm
                                                    ${btnClass}
                                                `}
                                            >
                                                {letter}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
}

// --- SUBCOMPONENTS ---

function SetupScreen({ onStart }) {
    const [cat, setCat] = useState('');
    const [wrd, setWrd] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        onStart(cat, wrd);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 max-w-md mx-auto animate-fade-in py-4">
            <div>
                <label className="block text-sm font-bold text-brown-600 mb-1.5">Tema (Dica para o jogador)</label>
                <Input
                    value={cat}
                    onChange={(e) => setCat(e.target.value)}
                    placeholder="Ex: Super-Heróis"
                    required
                />
            </div>
            <div>
                <label className="block text-sm font-bold text-brown-600 mb-1.5">Palavra Secreta</label>
                <div className="relative">
                    <Input
                        type="password"
                        value={wrd}
                        onChange={(e) => setWrd(e.target.value)}
                        placeholder="Digite a palavra..."
                        required
                        className="pr-10 tracking-widest"
                    />
                    <Lock className="absolute right-3 top-2.5 w-4 h-4 text-brown-400" />
                </div>
            </div>
            <Button type="submit" className="w-full py-6 mt-4 text-lg">
                Iniciar Desafio
            </Button>
        </form>
    );
}

function SetupAIScreen({ onStart, error }) {
    const [theme, setTheme] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        onStart(theme);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-bold text-indigo-800 mb-1.5">Escolha o Tema</label>
                <Input
                    value={theme}
                    onChange={(e) => setTheme(e.target.value)}
                    placeholder="Ex: Capitais da Europa, Raças de Cachorro..."
                    className="border-indigo-200 focus:border-indigo-400 focus:ring-indigo-100"
                    autoFocus
                    required
                />
            </div>

            {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-center gap-2">
                    <Frown size={16} /> {error}
                </div>
            )}

            <Button
                type="submit"
                disabled={!theme}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200"
            >
                <Sparkles className="w-4 h-4 mr-2" /> Gerar Jogo
            </Button>
        </form>
    );
}

function HangmanDrawing({ wrongGuesses }) {
    const strokeColor = "#78350f"; // amber-900 / brown-900
    const woodColor = "#a16207"; // yellow-700

    return (
        <div className="relative h-48 w-48 mx-auto select-none bg-yellow-50/50 rounded-full border-4 border-brown-200/30">
            <svg viewBox="0 0 200 200" className="w-full h-full fill-none stroke-[4px] stroke-linecap-round stroke-linejoin-round">
                {/* Gallows */}
                <line x1="20" y1="190" x2="100" y2="190" stroke={woodColor} strokeWidth="6" />
                <line x1="60" y1="190" x2="60" y2="20" stroke={woodColor} strokeWidth="6" />
                <line x1="60" y1="20" x2="140" y2="20" stroke={woodColor} strokeWidth="6" />
                <line x1="140" y1="20" x2="140" y2="50" stroke={woodColor} strokeWidth="4" />

                {/* Body */}
                {wrongGuesses >= 1 && <circle cx="140" cy="70" r="20" stroke={strokeColor} />}
                {wrongGuesses >= 2 && <line x1="140" y1="90" x2="140" y2="150" stroke={strokeColor} />}
                {wrongGuesses >= 3 && <line x1="140" y1="110" x2="110" y2="130" stroke={strokeColor} />}
                {wrongGuesses >= 4 && <line x1="140" y1="110" x2="170" y2="130" stroke={strokeColor} />}
                {wrongGuesses >= 5 && <line x1="140" y1="150" x2="120" y2="180" stroke={strokeColor} />}
                {wrongGuesses >= 6 && (
                    <g>
                        <line x1="140" y1="150" x2="160" y2="180" stroke={strokeColor} />
                        {/* Eyes X_X */}
                        <path d="M133 63l14 14m0-14l-14 14" stroke={strokeColor} strokeWidth="2" />
                    </g>
                )}
            </svg>
        </div>
    );
}
