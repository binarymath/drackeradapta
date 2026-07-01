import React, { useState, useEffect } from 'react';
import { NumberLineRenderer } from './NumberLineRenderer';
import { Sparkles, RefreshCw, CheckCircle2, HelpCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

export const NumberLineGame = ({ data, onExitGame }) => {
    const [pointsState, setPointsState] = useState([]);
    const [availableCards, setAvailableCards] = useState([]);
    const [selectedCard, setSelectedCard] = useState(null);
    const [feedback, setFeedback] = useState(null);
    const [score, setScore] = useState({ correct: 0, total: 0 });

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
                <div className="flex items-center gap-3">
                    <span className="px-3 py-1.5 bg-white rounded-full text-xs font-bold text-amber-800 border border-amber-300 shadow-sm">
                        Acertos: {score.correct} / {score.total}
                    </span>
                    <Button onClick={handleReset} variant="secondary" className="text-xs py-1.5 flex items-center gap-1">
                        <RefreshCw className="w-3.5 h-3.5" /> Reiniciar
                    </Button>
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
        </div>
    );
};
