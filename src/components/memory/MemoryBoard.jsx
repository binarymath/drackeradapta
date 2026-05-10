import React from 'react';
import MemoryCard from './MemoryCard';

const MemoryBoard = ({ cards, flipped, solved, handleCardClick, cardBackImage, useCardImages, isFullWidth }) => {
    const gridCols = isFullWidth 
        ? "grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8"
        : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4"; // Mantém em 4 colunas quando não maximizado

    return (
        <div className={`grid ${gridCols} gap-2 sm:gap-4 w-full pb-20 pr-2 pl-2`}>
            {cards.map(card => (
                <MemoryCard
                    key={card.id}
                    card={card}
                    isFlipped={flipped.includes(card.id)}
                    isSolved={solved.includes(card.pairId)}
                    onClick={handleCardClick}
                    cardBackImage={cardBackImage}
                    useCardImages={useCardImages}
                />
            ))}
        </div>
    );
};

export default MemoryBoard;
