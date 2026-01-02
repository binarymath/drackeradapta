import React from 'react';

export const CrosswordGrid = ({
    gridState,
    gridSize,
    isInteractive = false,
    selectedCells = new Set(),
    onCellInput,
    onKeyDown,
    onCellClick,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    gridRef,
    showSolution = false
}) => {
    return (
        <div
            ref={gridRef}
            className={`
                grid gap-0 bg-transparent p-0 rounded 
                ${isInteractive ? 'select-none' : ''}
                print:bg-transparent print:!gap-0 print:!p-0 print:!shadow-none print:!border-none
            `}
            style={{
                gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
                width: 'fit-content',
                maxWidth: '100%',
                userSelect: isInteractive ? 'none' : 'auto'
            }}
            onTouchStart={isInteractive ? onTouchStart : undefined}
            onTouchMove={isInteractive ? onTouchMove : undefined}
            onTouchEnd={isInteractive ? onTouchEnd : undefined}
        >
            {gridState.map((row, y) => (
                row.map((cell, x) => {
                    // Empty Cell
                    if (!cell) {
                        return <div key={`${x}-${y}`} className="w-8 h-8 sm:w-10 sm:h-10 bg-brown-50/30 print:invisible print:border-none" />;
                    }

                    const isFiller = cell.isFiller;
                    const isSelected = isInteractive && selectedCells.has(`${x}-${y}`);

                    // Base classes shared
                    const baseClasses = `
                        relative w-8 h-8 sm:w-10 sm:h-10 
                        flex items-center justify-center 
                        border border-brown-900
                        print:!border print:!border-black print:z-10
                        transition-colors duration-75
                    `;

                    // Dynamic background
                    let bgClass = 'bg-white';
                    if (isFiller) bgClass = 'bg-brown-50 print:bg-white';
                    else if (isSelected) bgClass = 'bg-amber-200';

                    return (
                        <div
                            key={`${x}-${y}`}
                            className={`${baseClasses} ${bgClass}`}
                            style={{
                                printColorAdjust: 'exact',
                                WebkitPrintColorAdjust: 'exact'
                            }}
                        >
                            {/* Number */}
                            {cell.num && (
                                <span className="absolute top-0.5 left-0.5 text-[10px] font-black text-brown-800 leading-none pointer-events-none print:text-black z-20">
                                    {cell.num}
                                </span>
                            )}

                            {/* Content */}
                            {isInteractive && !isFiller ? (
                                <input
                                    id={`cell-${x}-${y}`}
                                    type="text"
                                    maxLength={1}
                                    className={`
                                        w-full h-full text-center font-bold uppercase outline-none 
                                        focus:bg-brown-100 cursor-pointer text-lg bg-transparent
                                        ${cell.status === 'correct' ? 'text-green-700' :
                                            cell.status === 'incorrect' ? 'text-red-600' :
                                                cell.status === 'revealed' ? 'text-blue-700' :
                                                    'text-brown-900'}
                                    `}
                                    value={cell.input}
                                    onChange={(e) => onCellInput(x, y, e.target.value)}
                                    onKeyDown={(e) => onKeyDown(e, x, y)}
                                    onClick={() => onCellClick(x, y)}
                                />
                            ) : (
                                <span className={`
                                    text-lg font-bold uppercase 
                                    ${isFiller ? 'text-brown-300 font-sans select-none print:text-slate-200' : ''}
                                    ${!isFiller && showSolution ? 'text-brown-900' : !isFiller ? 'text-transparent' : ''}
                                `}>
                                    {isFiller ? cell.char : (showSolution ? cell.char : '')}
                                </span>
                            )}
                        </div>
                    );
                })
            ))}
        </div>
    );
};
