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
        <div className="flex flex-col gap-8 print:gap-4">
            {/* Grid Area */}
            <Card className="w-full flex flex-col items-center print:shadow-none print:border-none">
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
