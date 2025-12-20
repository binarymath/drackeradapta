import React, { useState, useEffect } from 'react';
import { Play, Check, X, RefreshCcw, Trophy, ChevronRight, UserPlus, Trash2 } from 'lucide-react';
import { Button } from './ui/Button';
import { Card } from './ui/Card';

export const QuizGame = ({ quizData, onRestart }) => {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [selectedOption, setSelectedOption] = useState(null);
    const [showFeedback, setShowFeedback] = useState(false);
    const [isFinished, setIsFinished] = useState(false);
    const [shuffledQuestions, setShuffledQuestions] = useState([]);
    const [playerName, setPlayerName] = useState('');
    const [hasStarted, setHasStarted] = useState(false);
    const [rankings, setRankings] = useState([]);
    const [startTime, setStartTime] = useState(null);
    const [lastRunTimeMs, setLastRunTimeMs] = useState(null);
    const [showRanking, setShowRanking] = useState(false);

    // Carrega ranking salvo localmente (JSON no navegador)
    useEffect(() => {
        try {
            const saved = localStorage.getItem('quiz_ranking');
            if (saved) setRankings(JSON.parse(saved));
        } catch (err) {
            console.error('Erro ao carregar ranking', err);
        }
    }, []);

    useEffect(() => {
        if (quizData && quizData.questions) {
            // Keep question order; answer options may shuffle separately
            setShuffledQuestions(quizData.questions);
            setCurrentQuestionIndex(0);
            setScore(0);
            setIsFinished(false);
            setSelectedOption(null);
            setShowFeedback(false);
            setHasStarted(false);
            setStartTime(null);
            setLastRunTimeMs(null);
            setShowRanking(false);
        }
    }, [quizData]);

    const currentQuestion = shuffledQuestions[currentQuestionIndex];

    // Persiste ranking local (JSON em localStorage) com critério de desempate por tempo
    const persistRanking = (finalScore, finalTimeMs) => {
        const entry = {
            name: playerName?.trim() || 'Jogador',
            score: finalScore,
            total: shuffledQuestions.length || quizData?.questions?.length || 0,
            percent: shuffledQuestions.length ? Math.round((finalScore / shuffledQuestions.length) * 100) : 0,
            date: new Date().toISOString(),
            timeMs: typeof finalTimeMs === 'number' ? finalTimeMs : Number.MAX_SAFE_INTEGER
        };
        const normalized = rankings.map(r => ({ ...r, timeMs: typeof r.timeMs === 'number' ? r.timeMs : Number.MAX_SAFE_INTEGER }));
        const updated = [...normalized, entry]
            .sort((a, b) => {
                if (b.score !== a.score) return b.score - a.score;
                if (a.timeMs !== b.timeMs) return a.timeMs - b.timeMs; // menor tempo primeiro
                if (b.percent !== a.percent) return b.percent - a.percent;
                return new Date(b.date) - new Date(a.date);
            });
        setRankings(updated);
        localStorage.setItem('quiz_ranking', JSON.stringify(updated));
        return updated;
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
        localStorage.setItem('quiz_ranking', JSON.stringify(updated));
    };

    const startQuiz = () => {
        if (!quizData || !quizData.questions?.length) return;
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

    const options = React.useMemo(() => {
        if (!currentQuestion) return [];
        if (currentQuestion.ordered_options && currentQuestion.ordered_options.length > 0) {
            return currentQuestion.ordered_options;
        }
        return [currentQuestion.correct_answer, ...currentQuestion.distractors]
            .slice(0, 5)
            .sort(() => Math.random() - 0.5);
    }, [currentQuestion, currentQuestionIndex, quizData]); // Re-calc only when index/question changes

    if (!hasStarted && !isFinished) {
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
                        onClick={startQuiz}
                        disabled={!quizData?.questions?.length || !playerName.trim()}
                        className="w-full bg-amber-600 hover:bg-amber-700 text-white shadow-lg disabled:opacity-50"
                        icon={Play}
                    >
                        Começar
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
        );
    }

    const handleOptionClick = (option) => {
        if (showFeedback) return;
        setSelectedOption(option);
    };

    const handleCheckAnswer = () => {
        if (!selectedOption) return;

        const isCorrect = selectedOption === currentQuestion.correct_answer;
        if (isCorrect) {
            setScore(prev => prev + 1);
        }
        setShowFeedback(true);
    };

    const handleNextQuestion = () => {
        const nextIndex = currentQuestionIndex + 1;
        if (nextIndex < shuffledQuestions.length) {
            setCurrentQuestionIndex(nextIndex);
            setSelectedOption(null);
            setShowFeedback(false);
        } else {
            // score already includes the last answer (if correct)
            const finalScore = score;
            const finalTimeMs = startTime ? Date.now() - startTime : Number.MAX_SAFE_INTEGER;
            setLastRunTimeMs(finalTimeMs);
            setIsFinished(true);
            persistRanking(finalScore, finalTimeMs);
        }
    };

    const handleRestart = () => {
        setIsFinished(false);
        setHasStarted(false);
        setCurrentQuestionIndex(0);
        setScore(0);
        setSelectedOption(null);
        setShowFeedback(false);
        setShuffledQuestions(quizData?.questions || []);
        setStartTime(null);
        setLastRunTimeMs(null);
        setShowRanking(false);
        setPlayerName('');
        onRestart && onRestart();
    };

    if (!currentQuestion && !isFinished) return null;

    if (isFinished) {
        return (
            <div className="flex flex-col items-center justify-center p-8 space-y-6 animate-fade-in">
                <div className="w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center mb-4 border-4 border-yellow-300 shadow-lg">
                    <Trophy className="w-12 h-12 text-yellow-600" />
                </div>
                <h2 className="text-3xl font-bold text-brown-900">Quiz Finalizado!</h2>
                <p className="text-xl text-brown-700">
                    Você acertou <strong className="text-green-600">{score}</strong> de <strong className="text-brown-900">{shuffledQuestions.length}</strong> questões.
                </p>
                {Number.isFinite(lastRunTimeMs) && (
                    <p className="text-sm text-brown-600">Tempo: {formatTime(lastRunTimeMs)}</p>
                )}
                <div className="w-full max-w-md bg-brown-100 rounded-full h-4 mb-6 grid overflow-hidden">
                    <div
                        className="bg-green-500 h-full transition-all duration-1000 ease-out"
                        style={{ width: `${(score / shuffledQuestions.length) * 100}%` }}
                    />
                </div>

                <div className="flex gap-3">
                    <Button onClick={() => setShowRanking(!showRanking)} variant="secondary" className="border-amber-200 text-amber-800 hover:bg-amber-100" icon={Trophy}>
                        {showRanking ? 'Esconder Ranking' : 'Ver Ranking'}
                    </Button>
                    <Button onClick={handleRestart} icon={RefreshCcw} className="bg-brown-600 hover:bg-brown-700 text-white px-8 py-3 text-lg rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all">
                        Jogar Novamente
                    </Button>
                </div>

                {showRanking && rankings.length > 0 && (
                    <div className="w-full max-w-md bg-white border border-amber-200 rounded-lg p-4 text-sm text-brown-800">
                        <div className="flex items-center gap-2 mb-2 font-semibold text-amber-800">
                            <Trophy className="w-4 h-4" /> Ranking Local
                        </div>
                        <div className="space-y-1">
                            {rankings.map((r, idx) => (
                                <div key={idx} className={`flex justify-between items-center ${r.name === (playerName?.trim() || 'Jogador') ? 'font-bold text-green-700' : ''}`}>
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
        );
    }


    return (
        <Card className="max-w-3xl mx-auto border-2 border-brown-200 shadow-xl overflow-hidden flex flex-col min-h-[500px]">
            {/* Header / Progress */}
            <div className="bg-brown-50 p-4 border-b border-brown-100 flex justify-between items-center">
                <span className="text-sm font-bold text-brown-500 uppercase tracking-wider">
                    Questão {currentQuestionIndex + 1} de {shuffledQuestions.length}
                </span>
                <span className="text-sm font-bold text-green-600 bg-green-50 px-3 py-1 rounded-full border border-green-100">
                    Pontos: {score}
                </span>
            </div>

            {/* Content */}
            <div className="p-4 sm:p-6 flex-1 flex flex-col overflow-y-auto max-h-[85vh]">
                <h3 className="text-lg sm:text-xl font-bold text-brown-900 mb-6 leading-relaxed text-center">
                    {currentQuestion.statement.replace(/^\d+[\.\)]\s*/, '')}
                </h3>

                <div className="grid grid-cols-1 gap-3 w-full max-w-xl mx-auto">
                    {options.map((option, idx) => {
                        const isSelected = selectedOption === option;
                        const isCorrect = option === currentQuestion.correct_answer;

                        let btnClass = "w-full text-left p-3 rounded-xl border-2 transition-all transform hover:scale-[1.01] active:scale-[0.99] flex items-center justify-between group ";

                        if (showFeedback) {
                            if (isCorrect) {
                                btnClass += "bg-green-100 border-green-500 text-green-800 shadow-sm";
                            } else if (isSelected && !isCorrect) {
                                btnClass += "bg-red-50 border-red-300 text-red-800 opacity-75";
                            } else {
                                btnClass += "bg-gray-50 border-gray-100 text-gray-400 opacity-50";
                            }
                        } else {
                            if (isSelected) {
                                btnClass += "bg-brown-100 border-brown-500 text-brown-900 shadow-md ring-2 ring-brown-200 ring-offset-1";
                            } else {
                                btnClass += "bg-white border-brown-100 text-brown-700 hover:border-brown-300 hover:bg-brown-50 hover:shadow-sm";
                            }
                        }

                        return (
                            <button
                                key={idx}
                                onClick={() => handleOptionClick(option)}
                                disabled={showFeedback}
                                className={btnClass}
                            >
                                <div className="flex items-center gap-3">
                                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border ${showFeedback && isCorrect ? 'bg-green-500 text-white border-green-600' :
                                        showFeedback && isSelected ? 'bg-red-500 text-white border-red-600' :
                                            isSelected ? 'bg-brown-500 text-white border-brown-600' :
                                                'bg-white text-brown-400 border-brown-200 group-hover:border-brown-400'
                                        }`}>
                                        {['A', 'B', 'C', 'D', 'E'][idx]}
                                    </span>
                                    <span className="font-medium text-base">{option}</span>
                                </div>
                                {showFeedback && isCorrect && <Check className="w-5 h-5 text-green-600" />}
                                {showFeedback && isSelected && !isCorrect && <X className="w-5 h-5 text-red-500" />}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Footer / Actions */}
            <div className="p-6 bg-brown-50/50 border-t border-brown-100 flex justify-end gap-3">
                {!showFeedback ? (
                    <Button
                        onClick={handleCheckAnswer}
                        disabled={!selectedOption}
                        className="w-full sm:w-auto px-8 py-3 text-lg bg-brown-600 hover:bg-brown-700 text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Confirmar Resposta
                    </Button>
                ) : (
                    <Button
                        onClick={handleNextQuestion}
                        className="w-full sm:w-auto px-8 py-3 text-lg bg-green-600 hover:bg-green-700 text-white shadow-lg animate-bounce-short icon-right"
                        icon={ChevronRight}
                    >
                        {currentQuestionIndex < shuffledQuestions.length - 1 ? 'Próxima Questão' : 'Ver Resultado'}
                    </Button>
                )}
            </div>
        </Card>
    );
};
