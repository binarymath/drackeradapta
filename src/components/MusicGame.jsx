import React, { useState, useEffect, useMemo } from 'react';
import { Play, Check, X, RefreshCcw, Trophy, UserPlus, Trash2, Music, Printer } from 'lucide-react';
import { Button } from './ui/Button';
import { Card } from './ui/Card';

const shuffleArray = (arr) => [...arr].sort(() => Math.random() - 0.5);

export const MusicGame = ({ musicData, onRestart, onExitToPrint }) => {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [selectedOption, setSelectedOption] = useState(null);
    const [showFeedback, setShowFeedback] = useState(false);
    const [isFinished, setIsFinished] = useState(false);
    const [playerName, setPlayerName] = useState('');
    const [hasStarted, setHasStarted] = useState(false);
    const [rankings, setRankings] = useState([]);
    const [startTime, setStartTime] = useState(null);
    const [lastRunTimeMs, setLastRunTimeMs] = useState(null);
    const [showRanking, setShowRanking] = useState(false);
    const [questionOptions, setQuestionOptions] = useState([]);

    const normalizedQuestions = useMemo(() => {
        if (!musicData?.questions?.length) return [];

        return musicData.questions.map((q, idx) => {
            const prompt = typeof q === 'string' ? q : (q.text || q.question || `Pergunta ${idx + 1}`);

            const correct = typeof q === 'string'
                ? (q.correctAnswer || q.answer || q.correct_option)
                : (q.correctAnswer || q.correct_answer || q.answer || q.correct_option || null);

            const providedOptions = Array.from(new Set(
                (typeof q === 'object' ? (q.options || q.ordered_options || []) : [])
                    .concat(q?.correctAnswer || q?.correct_answer || q?.answer || q?.correct_option || [])
                    .concat(typeof q === 'object' ? (q.distractors || q.incorrect_options || []) : [])
            )).filter(Boolean);

            const options = providedOptions.length
                ? providedOptions
                : correct
                    ? [correct]
                    : [];

            return {
                prompt,
                correct: correct || options[0] || null,
                options: options.length ? shuffleArray(options) : []
            };
        });
    }, [musicData]);

    // Carrega ranking salvo localmente
    useEffect(() => {
        try {
            const saved = localStorage.getItem('music_game_ranking');
            if (saved) setRankings(JSON.parse(saved));
        } catch (err) {
            console.error('Erro ao carregar ranking', err);
        }
    }, []);

    // Prepara opções para cada pergunta (usa alternativas definidas no editor)
    useEffect(() => {
        if (normalizedQuestions.length) {
            setQuestionOptions(normalizedQuestions);
            setCurrentQuestionIndex(0);
            setScore(0);
            setIsFinished(false);
            setSelectedOption(null);
            setShowFeedback(false);
            setHasStarted(false);
            setStartTime(null);
            setLastRunTimeMs(null);
            setShowRanking(false);
        } else {
            setQuestionOptions([]);
        }
    }, [normalizedQuestions]);

    const totalQuestions = questionOptions.length;
    const currentQuestion = questionOptions[currentQuestionIndex]?.prompt;
    const currentOptions = questionOptions[currentQuestionIndex];

    const persistRanking = (finalScore, finalTimeMs) => {
        const entry = {
            name: playerName?.trim() || 'Jogador',
            score: finalScore,
            total: totalQuestions,
            percent: totalQuestions ? Math.round((finalScore / totalQuestions) * 100) : 0,
            date: new Date().toISOString(),
            timeMs: typeof finalTimeMs === 'number' ? finalTimeMs : Number.MAX_SAFE_INTEGER
        };
        const normalized = rankings.map(r => ({ ...r, timeMs: typeof r.timeMs === 'number' ? r.timeMs : Number.MAX_SAFE_INTEGER }));
        const updated = [...normalized, entry]
            .sort((a, b) => {
                if (b.score !== a.score) return b.score - a.score;
                if (a.timeMs !== b.timeMs) return a.timeMs - b.timeMs;
                if (b.percent !== a.percent) return b.percent - a.percent;
                return new Date(b.date) - new Date(a.date);
            });
        setRankings(updated);
        localStorage.setItem('music_game_ranking', JSON.stringify(updated));
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
        localStorage.setItem('music_game_ranking', JSON.stringify(updated));
    };

    const startGame = () => {
        if (!totalQuestions || !playerName.trim()) return;
        setHasStarted(true);
        setIsFinished(false);
        setCurrentQuestionIndex(0);
        setScore(0);
        setSelectedOption(null);
        setShowFeedback(false);
        setStartTime(Date.now());
        setLastRunTimeMs(null);
        setShowRanking(false);
    };

    const handleOptionClick = (option) => {
        if (showFeedback) return;
        setSelectedOption(option);
    };

    const handleCheckAnswer = () => {
        if (!selectedOption || !currentOptions) return;
        const isCorrect = selectedOption === currentOptions.correct;
        if (isCorrect) {
            setScore(prev => prev + 1);
        }
        setShowFeedback(true);
    };

    const handleNextQuestion = () => {
        const nextIndex = currentQuestionIndex + 1;
        if (nextIndex < totalQuestions) {
            setCurrentQuestionIndex(nextIndex);
            setSelectedOption(null);
            setShowFeedback(false);
        } else {
            const finalScore = score + (selectedOption === currentOptions.correct ? 1 : 0);
            const finalTimeMs = startTime ? Date.now() - startTime : Number.MAX_SAFE_INTEGER;
            setLastRunTimeMs(finalTimeMs);
            setIsFinished(true);
            persistRanking(finalScore, finalTimeMs);
        }
    };

    const ExitButton = () => (
        <Button
            onClick={onExitToPrint}
            variant="secondary"
            className="text-xs px-3 h-8"
            icon={Printer}
            disabled={!onExitToPrint}
        >
            Modo impressão
        </Button>
    );

    // Tela inicial (antes de começar)
    if (!hasStarted && !isFinished) {
        return (
            <div className="space-y-4">
                {/* Destaque da Playlist */}
                <Card className="max-w-2xl mx-auto border-2 border-purple-300 bg-gradient-to-r from-purple-50 to-pink-50 shadow-lg overflow-hidden">
                    <div className="p-4 space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-purple-200 flex items-center justify-center text-purple-600 font-bold">
                                🎵
                            </div>
                            <div>
                                <h3 className="font-bold text-purple-900">Playlist Oficial: Músicas do Drácker</h3>
                                <p className="text-xs text-purple-700">Acesse todas as músicas criadas com Drácker no Producer.ai</p>
                            </div>
                        </div>
                        <a
                            href="https://www.producer.ai/professornerd"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block w-full p-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg text-center transition-colors"
                        >
                            🎧 Ouvir Playlist Completa
                        </a>
                    </div>
                </Card>

                <Card className="max-w-2xl mx-auto border-2 border-amber-200 shadow-xl overflow-hidden">
                    <div className="p-3 flex justify-end no-print">
                        <ExitButton />
                    </div>
                    <div className="p-6 pt-2 space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                                <UserPlus className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-brown-900">Jogo da Música do Drácker</h2>
                                <p className="text-sm text-brown-700">Digite seu nome para jogar e responder as perguntas.</p>
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
                        disabled={!totalQuestions || !playerName.trim()}
                        className="w-full bg-amber-600 hover:bg-amber-700 text-white shadow-lg disabled:opacity-50"
                        icon={Play}
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
                                            <span>{r.score}/{r.total} ({r.percent}%) • {formatTime(r.timeMs)}</span>
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
            </div>
        );
    }

    // Tela final (resultado)
    if (isFinished) {
        return (
            <Card className="max-w-2xl mx-auto border-2 border-green-200 shadow-xl overflow-hidden">
                <div className="p-3 flex justify-end no-print">
                    <ExitButton />
                </div>
                <div className="p-6 pt-2 space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                            <Trophy className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-green-900">Parabéns, {playerName}!</h2>
                            <p className="text-sm text-green-700">Você finalizou o jogo.</p>
                        </div>
                    </div>

                    <div className="bg-green-50 p-4 rounded-lg text-center space-y-2">
                        <div className="text-4xl font-bold text-green-600">{score}/{totalQuestions}</div>
                        <div className="text-sm text-green-700">Pontuação: {Math.round((score / totalQuestions) * 100)}%</div>
                        <div className="text-sm text-green-700">Tempo: {formatTime(lastRunTimeMs)}</div>
                    </div>

                    <Button
                        onClick={() => {
                            setHasStarted(false);
                            setIsFinished(false);
                            setPlayerName('');
                            setStartTime(null);
                            setLastRunTimeMs(null);
                            setShowRanking(false);
                            onRestart?.();
                        }}
                        className="w-full bg-green-600 hover:bg-green-700 text-white"
                        icon={RefreshCcw}
                    >
                        Jogar Novamente
                    </Button>

                    <Button
                        onClick={onExitToPrint}
                        variant="secondary"
                        className="w-full"
                    >
                        Voltar
                    </Button>
                </div>
            </Card>
        );
    }

    // Tela de jogo
    return (
        <Card className="max-w-2xl mx-auto border-2 border-amber-200 shadow-xl overflow-hidden">
            <div className="p-3 flex justify-between items-center no-print">
                <div className="flex items-center gap-2 text-amber-700 font-semibold text-sm">
                    <Music className="w-4 h-4" />
                    <span>Jogo da Música (online)</span>
                </div>
                <ExitButton />
            </div>
            <div className="p-6 pt-2">
                {/* Cabeçalho do progresso */}
                <div className="flex justify-between items-center mb-6 pb-4 border-b border-amber-100">
                    <div>
                        <span className="text-sm font-bold text-amber-600">Pergunta {currentQuestionIndex + 1}/{totalQuestions}</span>
                        <div className="w-48 bg-gray-200 rounded-full h-2 mt-2">
                            <div
                                className="bg-amber-600 h-2 rounded-full transition-all"
                                style={{ width: `${totalQuestions ? ((currentQuestionIndex + 1) / totalQuestions) * 100 : 0}%` }}
                            ></div>
                        </div>
                    </div>
                    <div className="text-right">
                        <span className="text-sm font-bold text-amber-600">Acertos: {score}</span>
                        <div className="text-xs text-amber-500 mt-1">{formatTime(Date.now() - startTime)}</div>
                    </div>
                </div>

                {/* Pergunta */}
                <div className="mb-6">
                    <h3 className="text-lg font-bold text-brown-900 mb-4">{currentQuestion}</h3>
                </div>

                {/* Alternativas */}
                {currentOptions && (
                    <div className="space-y-3 mb-6">
                        {currentOptions.options.map((option, idx) => {
                            const isCorrect = option === currentOptions.correct;
                            const isSelected = option === selectedOption;
                            let btnClass = 'border-amber-200 text-brown-900 hover:bg-amber-50';

                            if (showFeedback) {
                                if (isCorrect) {
                                    btnClass = 'border-green-500 bg-green-50 text-green-900 font-bold';
                                } else if (isSelected && !isCorrect) {
                                    btnClass = 'border-red-500 bg-red-50 text-red-900 font-bold';
                                }
                            } else if (isSelected) {
                                btnClass = 'border-amber-600 bg-amber-100 text-brown-900 font-bold';
                            }

                            return (
                                <button
                                    key={idx}
                                    onClick={() => handleOptionClick(option)}
                                    disabled={showFeedback}
                                    className={`w-full p-4 text-left border-2 rounded-lg transition-all ${btnClass} ${
                                        showFeedback ? 'cursor-default' : 'cursor-pointer'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div
                                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                                                isSelected ? 'border-amber-600 bg-amber-600' : 'border-amber-300'
                                            }`}
                                        >
                                            {isSelected && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                        </div>
                                        <span>{option}</span>
                                        {showFeedback && isCorrect && <Check className="w-5 h-5 text-green-600 ml-auto" />}
                                        {showFeedback && isSelected && !isCorrect && <X className="w-5 h-5 text-red-600 ml-auto" />}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}

                {/* Botões de ação */}
                <div className="flex gap-3">
                    {!showFeedback ? (
                        <Button
                            onClick={handleCheckAnswer}
                            disabled={!selectedOption}
                            className="flex-1 bg-amber-600 hover:bg-amber-700 text-white disabled:opacity-50"
                            icon={Check}
                        >
                            Verificar
                        </Button>
                    ) : (
                        <Button
                            onClick={handleNextQuestion}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                            icon={currentQuestionIndex < totalQuestions - 1 ? undefined : Trophy}
                        >
                            {currentQuestionIndex < totalQuestions - 1 ? 'Próxima' : 'Finalizar'}
                        </Button>
                    )}
                </div>
            </div>
        </Card>
    );
};
