import React, { useState, useEffect } from 'react';
import { NumberLineRenderer } from './NumberLineRenderer';
import { Sparkles, RefreshCw, CheckCircle2, HelpCircle, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

export const NumberLineGame = ({ data, onExitGame }) => {
    const [pointsState, setPointsState] = useState([]);
    const [availableCards, setAvailableCards] = useState([]);
    const [selectedCard, setSelectedCard] = useState(null);
    const [feedback, setFeedback] = useState(null);
    const [score, setScore] = useState({ correct: 0, total: 0 });
    const [isFullscreen, setIsFullscreen] = useState(false);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isFullscreen) {
                setIsFullscreen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isFullscreen]);

    useEffect(() => {
        if (data?.points) {
            // Prepare mystery points
            const pts = data.points.map(pt => ({
                ...pt,
                hiddenVal: true,
                userAnswer: null,
                isCorrect: null
            }));
            setPointsState(pts);

            // Create draggable/clickable cards from the points
            const cards = data.points.map((pt, idx) => ({
                id: `card_${idx}`,
                val: pt.val,
                displayLabel: pt.label && pt.label !== `${pt.val}` ? pt.label : formatCardLabel(pt.val, data.domainType, data.denominator),
                placedOnPointId: null
            })).sort(() => Math.random() - 0.5); // Shuffle cards

            setAvailableCards(cards);
            setScore({ correct: 0, total: pts.length });
        }
    }, [data]);

    const formatCardLabel = (v, domainType, denominator) => {
        if (domainType === 'fraction' && denominator > 0) {
            const num = Math.round(v * denominator);
            if (num % denominator === 0) return `${num / denominator}`;
            return `${num}/${denominator}`;
        }
        return `${v}`;
    };

    const handleCardClick = (card) => {
        if (card.placedOnPointId) return;
        setSelectedCard(selectedCard?.id === card.id ? null : card);
    };

    const handlePointClick = (pt) => {
        if (!selectedCard) return;

        // Assign selectedCard to this point
        const updatedPoints = pointsState.map(p => {
            if (p.id === pt.id) {
                const isCorrect = Math.abs(Number(p.val) - Number(selectedCard.val)) < 0.01;
                return {
                    ...p,
                    userAnswer: selectedCard.displayLabel,
                    assignedCardId: selectedCard.id,
                    isCorrect
                };
            }
            // If another point had this card, clear it
            if (p.assignedCardId === selectedCard.id) {
                return { ...p, userAnswer: null, assignedCardId: null, isCorrect: null };
            }
            return p;
        });

        const updatedCards = availableCards.map(c => {
            if (c.id === selectedCard.id) {
                return { ...c, placedOnPointId: pt.id };
            }
            if (c.placedOnPointId === pt.id && c.id !== selectedCard.id) {
                return { ...c, placedOnPointId: null };
            }
            return c;
        });

        setPointsState(updatedPoints);
        setAvailableCards(updatedCards);
        setSelectedCard(null);

        // Check score
        const correctCount = updatedPoints.filter(p => p.isCorrect).length;
        setScore({ correct: correctCount, total: updatedPoints.length });

        if (correctCount === updatedPoints.length && updatedPoints.length > 0) {
            setFeedback({ type: 'success', message: '🎉 Parabéns! Você posicionou todos os pontos corretamente na reta!' });
        }
    };

    const handleReset = () => {
        const pts = pointsState.map(p => ({ ...p, userAnswer: null, assignedCardId: null, isCorrect: null }));
        setPointsState(pts);
        setAvailableCards(availableCards.map(c => ({ ...c, placedOnPointId: null })).sort(() => Math.random() - 0.5));
        setSelectedCard(null);
        setFeedback(null);
        setScore({ correct: 0, total: pts.length });
    };

    return (
        <div className="space-y-6">
            <Card className="bg-amber-50 border-amber-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h3 className="text-lg font-bold text-amber-900 flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-amber-600 animate-pulse" /> Lousa Interativa: Encontre os Pontos na Reta!
                    </h3>
                    <p className="text-xs text-amber-800 mt-1">
                        Clique em um cartão numérico abaixo e depois clique no marcador <span className="font-bold">?</span> correspondente na reta.
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 md:gap-3">
                    <span className="px-3 py-1.5 bg-white rounded-full text-xs font-bold text-amber-800 border border-amber-300 shadow-sm">
                        Acertos: {score.correct} / {score.total}
                    </span>
                    <Button onClick={handleReset} variant="secondary" className="text-xs py-1.5 flex items-center gap-1">
                        <RefreshCw className="w-3.5 h-3.5" /> Reiniciar
                    </Button>
                    <button
                        onClick={() => setIsFullscreen(true)}
                        className="flex items-center justify-center p-1.5 text-amber-950 bg-amber-300 hover:bg-amber-400 rounded-lg transition-all shadow-xs cursor-pointer active:scale-95 border border-amber-500"
                        title="Expandir a Lousa Interativa para 100% da tela (Tela Cheia)"
                    >
                        <Maximize2 className="w-4 h-4 text-amber-900" />
                    </button>
                </div>
            </Card>

            {feedback && (
                <div className="p-4 rounded-xl bg-green-100 border border-green-300 text-green-900 font-bold flex items-center gap-3 animate-in fade-in zoom-in">
                    <CheckCircle2 className="w-6 h-6 text-green-600 shrink-0" />
                    <span>{feedback.message}</span>
                </div>
            )}

            {/* Render Number Line in interactive mode */}
            <div className="bg-brown-50/50 p-6 rounded-2xl border border-brown-200">
                <NumberLineRenderer
                    data={{ ...data, points: pointsState }}
                    showAnswers={false}
                    interactiveMode={true}
                    onPointClick={handlePointClick}
                />
            </div>

            {/* Draggable / Clickable Cards Pool */}
            <div className="bg-white rounded-2xl p-6 border border-brown-200 shadow-sm">
                <h4 className="text-sm font-bold text-brown-800 mb-3 flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-brown-600" /> Cartões Disponíveis (Clique para selecionar):
                </h4>
                <div className="flex flex-wrap gap-3">
                    {availableCards.map(card => {
                        const isSelected = selectedCard?.id === card.id;
                        const isPlaced = Boolean(card.placedOnPointId);

                        return (
                            <button
                                key={card.id}
                                onClick={() => handleCardClick(card)}
                                disabled={isPlaced}
                                className={`px-5 py-3 rounded-xl font-black text-sm md:text-base border-2 transition-all transform ${
                                    isPlaced
                                        ? 'bg-gray-100 border-gray-200 text-gray-400 opacity-50 cursor-not-allowed scale-95'
                                        : isSelected
                                        ? 'bg-amber-400 border-amber-600 text-amber-950 shadow-lg scale-110 ring-4 ring-amber-200'
                                        : 'bg-brown-50 hover:bg-brown-100 border-brown-300 text-brown-900 hover:-translate-y-0.5 shadow'
                                }`}
                            >
                                {card.displayLabel}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* FULLSCREEN OVERLAY PARA O JOGO / LOUSA INTERATIVA (100% TELA) */}
            {isFullscreen && (
                <div className="fixed inset-0 z-[9999] bg-white flex flex-col justify-between p-4 md:p-8 overflow-y-auto animate-in fade-in duration-200 shadow-2xl">
                    {/* Top Bar / Score in Fullscreen */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b-2 border-brown-200 pb-4 shrink-0 bg-amber-50 p-4 rounded-2xl border border-amber-300 shadow-sm">
                        <div>
                            <h3 className="text-lg md:text-xl font-black text-amber-900 flex items-center gap-2">
                                <Sparkles className="w-6 h-6 text-amber-600 animate-pulse" /> Lousa Interativa - Tela Cheia (100%)
                            </h3>
                            <p className="text-xs font-semibold text-amber-800 mt-0.5">
                                Clique em um cartão abaixo e depois clique no marcador <span className="font-extrabold">?</span> na reta • Pressione <kbd className="px-1.5 py-0.5 bg-white border border-amber-300 rounded font-mono text-[10px] shadow-2xs">ESC</kbd> para sair
                            </p>
                        </div>
                        <div className="flex items-center gap-3 self-end sm:self-center">
                            <span className="px-4 py-2 bg-white rounded-xl text-sm font-black text-amber-900 border-2 border-amber-400 shadow-md">
                                Acertos: {score.correct} / {score.total}
                            </span>
                            <Button onClick={handleReset} variant="secondary" className="text-xs py-2 flex items-center gap-1.5 font-bold shadow-xs">
                                <RefreshCw className="w-4 h-4" /> Reiniciar
                            </Button>
                            <button
                                onClick={() => setIsFullscreen(false)}
                                className="flex items-center gap-2 px-4 py-2 text-xs md:text-sm font-black text-white bg-red-600 hover:bg-red-700 rounded-xl transition-all shadow-md hover:shadow-lg cursor-pointer active:scale-95"
                                title="Sair da Tela Cheia (ESC)"
                            >
                                <Minimize2 className="w-4 h-4 md:w-5 md:h-5" />
                                <span>Sair (100%)</span>
                            </button>
                        </div>
                    </div>

                    {/* Main Fullscreen Number Line Area */}
                    <div className="flex-1 flex flex-col items-center justify-center my-4 md:my-6 w-full h-full overflow-hidden">
                        <div className="w-full h-full flex items-center justify-center bg-brown-50/40 rounded-3xl p-4 md:p-12 border-4 border-brown-200/60 shadow-inner">
                            <NumberLineRenderer
                                data={{ ...data, points: pointsState }}
                                showAnswers={false}
                                interactiveMode={true}
                                isFullscreen={true}
                                onPointClick={handlePointClick}
                            />
                        </div>
                    </div>

                    {/* Cards Pool at bottom in Fullscreen */}
                    <div className="shrink-0 bg-white rounded-2xl p-6 border-2 border-brown-200 shadow-lg">
                        <h4 className="text-sm md:text-base font-black text-brown-900 mb-3 flex items-center gap-2">
                            <HelpCircle className="w-5 h-5 text-brown-600" /> Cartões Disponíveis (Clique no cartão e depois no "?" na reta):
                        </h4>
                        <div className="flex flex-wrap justify-center gap-3 md:gap-4 max-h-48 overflow-y-auto p-1 custom-scrollbar">
                            {availableCards.map(card => {
                                const isSelected = selectedCard?.id === card.id;
                                const isPlaced = Boolean(card.placedOnPointId);

                                return (
                                    <button
                                        key={card.id}
                                        onClick={() => handleCardClick(card)}
                                        disabled={isPlaced}
                                        className={`px-6 py-3.5 rounded-xl font-black text-base md:text-lg border-2 transition-all transform ${
                                            isPlaced
                                                ? 'bg-gray-100 border-gray-200 text-gray-400 opacity-50 cursor-not-allowed scale-95'
                                                : isSelected
                                                ? 'bg-amber-400 border-amber-600 text-amber-950 shadow-xl scale-110 ring-4 ring-amber-200'
                                                : 'bg-brown-50 hover:bg-brown-100 border-brown-300 text-brown-900 hover:-translate-y-0.5 shadow-md cursor-pointer'
                                        }`}
                                    >
                                        {card.displayLabel}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
