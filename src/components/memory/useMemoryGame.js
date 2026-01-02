import { useState, useEffect, useCallback } from 'react';
import { memoryService } from './memoryService';

export const useMemoryGame = (geminiService, initialData = {}) => {
    const [gameState, setGameState] = useState(initialData.gameState || 'input'); // input, loading, playing, won
    const [topic, setTopic] = useState(initialData.topic || '');
    const [cards, setCards] = useState(initialData.cards || []);
    const [flipped, setFlipped] = useState([]); // Don't persist temporary flips
    const [solved, setSolved] = useState(initialData.solved || []);
    const [moves, setMoves] = useState(initialData.moves || 0);
    const [error, setError] = useState('');
    const [time, setTime] = useState(initialData.time || 0);
    const [isPaused, setIsPaused] = useState(false);

    // Customização Visual
    const [bgImage, setBgImage] = useState(initialData.bgImage || null);
    const [cardBackImage, setCardBackImage] = useState(initialData.cardBackImage || null);
    const [useCardImages, setUseCardImages] = useState(initialData.useCardImages !== undefined ? initialData.useCardImages : true);

    // FAIL-SAFE: Re-hydrate se receber dados novos enquanto está resetado
    useEffect(() => {
        if (gameState === 'input' && initialData?.gameState && initialData.gameState !== 'input') {
            console.log("MemoryGame: Hydrating from late initialData...", initialData);
            setGameState(initialData.gameState);
            setTopic(initialData.topic || '');
            setCards(initialData.cards || []);
            setSolved(initialData.solved || []);
            setMoves(initialData.moves || 0);
            setTime(initialData.time || 0);
            if (initialData.bgImage) setBgImage(initialData.bgImage);
            if (initialData.cardBackImage) setCardBackImage(initialData.cardBackImage);
            setUseCardImages(initialData.useCardImages);
        }
    }, [initialData, gameState]);

    // Timer Logic
    useEffect(() => {
        let interval;
        if (gameState === 'playing' && !isPaused) {
            interval = setInterval(() => {
                setTime(t => t + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [gameState, isPaused]);

    // --- AÇÕES DO JOGO ---

    const handleCardClick = useCallback((id) => {
        if (gameState !== 'playing' || isPaused) return;

        // Ignora se já resolvido ou se já virado
        const card = cards.find(c => c.id === id);
        if (!card || solved.includes(card.pairId) || flipped.includes(id)) return;

        // Ignora se já tem 2 viradas
        if (flipped.length >= 2) return;

        const newFlipped = [...flipped, id];
        setFlipped(newFlipped);

        if (newFlipped.length === 2) {
            setMoves(m => m + 1);
            const card1 = cards.find(c => c.id === newFlipped[0]);
            const card2 = cards.find(c => c.id === newFlipped[1]);

            if (card1.pairId === card2.pairId) {
                setSolved(prev => [...prev, card1.pairId]);
                setFlipped([]);
            } else {
                setTimeout(() => setFlipped([]), 1500);
            }
        }
    }, [cards, flipped, solved, gameState, isPaused]);

    // Checa vitória
    useEffect(() => {
        if (gameState === 'playing' && cards.length > 0 && solved.length === cards.length / 2) {
            // Pequeno delay para virar a última carta antes de dar vitória
            setTimeout(() => setGameState('won'), 500);
        }
    }, [solved, cards, gameState]);

    // --- GERAÇÃO E SETUP ---

    const generateGame = async (inputTopic) => {
        // Legacy support or fallback if needed, but Modal usually handles this.
        // We keep it for robustness if called externally.
        console.log("generateGame called with:", inputTopic);
        const currentTopic = inputTopic || topic || "Tema Livre";

        if (!geminiService) {
            setError("Erro interno: Serviço de IA desconectado.");
            return;
        }

        setTopic(currentTopic);
        setGameState('loading');
        setError('');

        const apiKey = geminiService?.apiKey;
        memoryService.generateBackground(currentTopic, apiKey).then(img => setBgImage(img));

        try {
            const { cards: generatedCards, error: genError } = await memoryService.generatePairs(currentTopic, geminiService);

            if (genError || !generatedCards || generatedCards.length === 0) {
                setError(genError || "Não foi possível gerar cartas.");
                setGameState('input');
                return;
            }

            const shuffled = [...generatedCards].sort(() => Math.random() - 0.5);
            setCards(shuffled);
            setSolved([]);
            setFlipped([]);
            setMoves(0);
            setTime(0);
            setIsPaused(false);
            setGameState('playing');
        } catch (e) {
            console.error(e);
            setError(`Erro fatal: ${e.message}`);
            setGameState('input');
        }
    };

    const startGameFromBuilder = (gameTopic, gameData) => {
        // Accepts pre-formatted cards (from AI or Manual Modal)
        // Shuffle ensures randomness even if input was ordered
        const shuffled = [...gameData].sort(() => Math.random() - 0.5);

        setTopic(gameTopic);
        setCards(shuffled);
        setGameState('playing');
        setMoves(0);
        setTime(0);
        setSolved([]);
        setFlipped([]);
        setError('');
        setIsPaused(false);

        // Generate BG if not provided?
        // Let's try to generate BG for manual games too if we can, or just leave null.
        if (geminiService?.apiKey && gameTopic) {
            memoryService.generateBackground(gameTopic, geminiService.apiKey).then(img => {
                // Only set if user hasn't set custom background?
                // For now, let's behave nicely.
                if (!bgImage) setBgImage(img);
            });
        }
    };

    const resetGame = () => {
        setGameState('input');
        setCards([]);
        setFlipped([]);
        setSolved([]);
        setMoves(0);
        setTime(0);
        setError('');
        setIsPaused(false);
        // setBgImage(null); // Optional: clear or keep background
    };

    const shuffleCurrentGame = () => {
        if (cards.length === 0) return;
        const shuffled = [...cards].sort(() => Math.random() - 0.5);
        setCards(shuffled);
        setFlipped([]);
        setSolved([]);
        setMoves(0);
        setTime(0);
        setGameState('playing');
        setIsPaused(false);
    };

    const getCardsForPrint = () => {
        if (cards.length > 0) {
            return [...cards].sort((a, b) => {
                if (a.pairId !== b.pairId) return a.pairId - b.pairId;
                return a.type === 'question' ? -1 : 1;
            });
        }
        return [];
    };

    return {
        gameState, setGameState,
        topic, setTopic,
        cards,
        flipped,
        solved,
        moves,
        time,
        isPaused, setIsPaused,
        error, setError,

        bgImage, setBgImage,
        cardBackImage, setCardBackImage,
        useCardImages, setUseCardImages,

        handleCardClick,
        generateGame,
        startGameFromBuilder,
        resetGame,
        getCardsForPrint,
        shuffleCurrentGame
    };
};
