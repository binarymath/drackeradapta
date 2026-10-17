import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const StorybookPagination = ({
    currentPageIndex,
    totalViews,
    pagesCount,
    isFlipping,
    changePage
}) => {
    return (
        <div className="bg-white/95 backdrop-blur-md px-4 sm:px-6 py-2.5 sm:py-3 border-t border-stone-200 flex items-center justify-between z-40 shrink-0 no-print">
            <button
                onClick={() => changePage(currentPageIndex - 1, 'prev')}
                disabled={currentPageIndex === 0 || isFlipping}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl font-bold text-xs text-brown-700 hover:bg-amber-100 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
            >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Página Anterior</span>
            </button>

            <div className="flex items-center gap-1 sm:gap-1.5">
                {Array.from({ length: totalViews }).map((_, idx) => (
                    <button
                        key={idx}
                        onClick={() => changePage(idx, idx > currentPageIndex ? 'next' : 'prev')}
                        disabled={isFlipping}
                        className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full transition-all cursor-pointer ${
                            currentPageIndex === idx 
                                ? 'bg-amber-600 scale-125 shadow-2xs' 
                                : 'bg-stone-300 hover:bg-amber-300'
                        }`}
                        title={idx === 0 ? 'Capa' : idx === totalViews - 1 ? 'Contracapa' : `Página ${idx}`}
                    />
                ))}
                <span className="text-xs font-extrabold text-brown-800 ml-2 font-mono">
                    {currentPageIndex === 0 ? 'Capa' : currentPageIndex === totalViews - 1 ? 'Contracapa' : `${currentPageIndex} de ${pagesCount}`}
                </span>
            </div>

            <button
                onClick={() => changePage(currentPageIndex + 1, 'next')}
                disabled={currentPageIndex === totalViews - 1 || isFlipping}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl font-bold text-xs text-brown-700 hover:bg-amber-100 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
            >
                <span className="hidden sm:inline">Próxima Página</span>
                <ChevronRight className="w-4 h-4" />
            </button>
        </div>
    );
};
