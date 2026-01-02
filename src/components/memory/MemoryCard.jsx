import React from 'react';
import { HelpCircle } from 'lucide-react';

const MemoryCard = ({ card, isFlipped, isSolved, onClick, cardBackImage, useCardImages = true }) => {
    const contentImageUrl = card.customImage;

    return (
        <div
            onClick={() => onClick(card.id)}
            className="aspect-[3/4] w-full min-h-[120px] cursor-pointer group relative select-none [perspective:1000px]"
        >
            <div className={`w-full h-full transition-all duration-500 [transform-style:preserve-3d] shadow-xl rounded-xl ${isFlipped || isSolved ? '[transform:rotateY(180deg)]' : ''}`}>

                {/* VERSO (BACK) */}
                <div className="absolute inset-0 [backface-visibility:hidden] bg-white border-4 border-white shadow-sm ring-1 ring-brown-200 rounded-xl flex items-center justify-center hover:shadow-md transition-all z-20 overflow-hidden bg-pattern-dots">
                    {cardBackImage ? (
                        <>
                            <img src={cardBackImage} alt="Capa" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/5 hover:bg-transparent transition-colors" />
                        </>
                    ) : (
                        <div className="w-full h-full bg-brown-500 flex items-center justify-center">
                            <img src="/dracker_character.png" className="w-12 h-12 opacity-50 grayscale mix-blend-multiply" alt="" onError={(e) => e.target.style.display = 'none'} />
                            <HelpCircle className="w-8 h-8 text-white/50" />
                        </div>
                    )}
                </div>

                {/* FRENTE (FRONT) */}
                <div className={`absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] rounded-xl overflow-hidden flex flex-col items-center justify-center text-center 
            ${isSolved ? 'ring-4 ring-green-500 z-30' : card.type === 'question' ? 'ring-2 ring-indigo-300' : 'ring-2 ring-amber-300'} 
            bg-white border-2 border-slate-100 shadow-md`}
                >
                    {useCardImages && contentImageUrl && (
                        <div className="absolute inset-0 z-0">
                            <img src={contentImageUrl} alt="" className="w-full h-full object-cover transition-opacity" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        </div>
                    )}
                    <div className="relative z-10 p-2 flex flex-col items-center justify-center h-full w-full">
                        <span className={`font-bold leading-tight select-none
                ${contentImageUrl ? 'text-white shadow-black drop-shadow-md' : 'text-brown-800'}
                ${card.content.length > 20 ? 'text-xs sm:text-sm' : 'text-sm sm:text-lg'}`}
                        >
                            {card.content}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MemoryCard;
