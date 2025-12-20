import React, { useState, useEffect } from 'react';
import { Play, Check, X, RefreshCcw, Trophy, ChevronRight } from 'lucide-react';
import { Button } from './ui/Button';
import { Card } from './ui/Card';

export const QuizGame = ({ quizData, onRestart }) => {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [selectedOption, setSelectedOption] = useState(null);
    const [showFeedback, setShowFeedback] = useState(false);
    const [isFinished, setIsFinished] = useState(false);
    const [shuffledQuestions, setShuffledQuestions] = useState([]);

    useEffect(() => {
        if (quizData && quizData.questions) {
            // Shuffle questions or keep them as is? 
            // Usually keeping them as is or shuffled. Let's keep strict order to match numbers in printable version
            // unless we want it to be more dynamic.
            // But answers should shuffle if not already shuffled in data (app logic does shuffle).
            setShuffledQuestions(quizData.questions);
            setCurrentQuestionIndex(0);
            setScore(0);
            setIsFinished(false);
            setSelectedOption(null);
            setShowFeedback(false);
        }
    }, [quizData, onRestart]);

    const currentQuestion = shuffledQuestions[currentQuestionIndex];

    const options = React.useMemo(() => {
        if (!currentQuestion) return [];
        if (currentQuestion.ordered_options && currentQuestion.ordered_options.length > 0) {
            return currentQuestion.ordered_options;
        }
        return [currentQuestion.correct_answer, ...currentQuestion.distractors]
            .slice(0, 5)
            .sort(() => Math.random() - 0.5);
    }, [currentQuestion, currentQuestionIndex, quizData]); // Re-calc only when index/question changes

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
            setIsFinished(true);
        }
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
                <div className="w-full max-w-md bg-brown-100 rounded-full h-4 mb-6 grid overflow-hidden">
                    <div
                        className="bg-green-500 h-full transition-all duration-1000 ease-out"
                        style={{ width: `${(score / shuffledQuestions.length) * 100}%` }}
                    />
                </div>
                <Button onClick={() => onRestart && onRestart()} icon={RefreshCcw} className="bg-brown-600 hover:bg-brown-700 text-white px-8 py-3 text-lg rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all">
                    Jogar Novamente
                </Button>
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
