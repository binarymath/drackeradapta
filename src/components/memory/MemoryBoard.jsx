import React from 'react';
import MemoryCard from './MemoryCard';

const MemoryBoard = ({ cards, flipped, solved, handleCardClick, cardBackImage, useCardImages }) => {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 w-full pb-20 pr-2 pl-2">
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
