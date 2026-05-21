import React from 'react';
import { Card } from '../ui/Card';
import { CrosswordGrid } from './CrosswordGrid';
import { CrosswordClues } from './CrosswordClues';

export const CrosswordPrint = ({
    gridState,
    gridSize,
    words,
    showSolution
}) => {
    return (
        <div className="flex flex-col gap-8 print:gap-2 print:max-h-[28cm] print:overflow-hidden">
            {/* Grid Area */}
            <Card className="w-full flex flex-col items-center print:shadow-none print:border-none print:p-0 print:m-0">
                <CrosswordGrid
                    gridState={gridState}
                    gridSize={gridSize}
                    isInteractive={false}
                    showSolution={showSolution}
                />
            </Card>

            {/* Clues Area */}
            <CrosswordClues words={words} />
        </div>
    );
};
