import React from 'react';

export const FractionsRenderer = ({
    numerator = 2,
    denominator = 3,
    shape = 'circle',
    fillColor = '#3b82f6', // azul padrão
    emptyColor = '#ffffff',
    strokeColor = '#1f2937',
    isResult = false,
    multiColors = null,
    forceEmpty = false,
    sizeClassName = "w-24 h-24 md:w-32 md:h-32 shrink-0",
    style = null,
    maxShapesToRender = 12,
    overlayLines = null // { d1, color1, d2, color2 } para desenhar linhas divisórias destacadas
}) => {
    const n = Math.max(0, Number(numerator) || 0);
    const d = Math.max(1, Number(denominator) || 1);

    const activeFillColor = (isResult && !multiColors) ? '#10b981' : fillColor;
    const numShapes = Math.max(1, Math.ceil(n / d));
    const shapesToDraw = Math.min(numShapes, maxShapesToRender);

    const getSliceColor = (globalIndex, defaultColor) => {
        if (multiColors && Array.isArray(multiColors) && multiColors.length > 0) {
            let accumulated = 0;
            for (const item of multiColors) {
                if (globalIndex < accumulated + item.count) {
                    return item.color;
                }
                accumulated += item.count;
            }
            return emptyColor;
        }
        return globalIndex < n ? defaultColor : emptyColor;
    };

    const shapes = [];

    for (let s = 0; s < shapesToDraw; s++) {
        let partsToFill = n - (s * d);
        if (partsToFill > d) partsToFill = d;
        if (partsToFill < 0) partsToFill = 0;

        const elements = [];

        if (shape === 'circle') {
            if (d === 1) {
                const sliceColor = getSliceColor(s, activeFillColor);
                elements.push(
                    <circle
                        key="circle-whole"
                        cx="100"
                        cy="100"
                        r="90"
                        fill={(!forceEmpty && partsToFill > 0) ? sliceColor : emptyColor}
                        stroke={strokeColor}
                        strokeWidth="2"
                        className="transition-all duration-300"
                    />
                );
            } else {
                for (let i = 0; i < d; i++) {
                    const globalIndex = s * d + i;
                    const sliceColor = getSliceColor(globalIndex, activeFillColor);
                    const angle = (2 * Math.PI) / d;
                    const startAngle = i * angle - Math.PI / 2;
                    const endAngle = (i + 1) * angle - Math.PI / 2;

                    const x1 = 100 + 90 * Math.cos(startAngle);
                    const y1 = 100 + 90 * Math.sin(startAngle);
                    const x2 = 100 + 90 * Math.cos(endAngle);
                    const y2 = 100 + 90 * Math.sin(endAngle);

                    const largeArcFlag = angle > Math.PI ? 1 : 0;
                    const pathData = `M 100 100 L ${x1} ${y1} A 90 90 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

                    elements.push(
                        <path
                            key={`slice-${i}`}
                            d={pathData}
                            fill={forceEmpty ? emptyColor : sliceColor}
                            stroke={strokeColor}
                            strokeWidth="2"
                            strokeLinejoin="round"
                            className="transition-all duration-300 hover:opacity-90"
                        />
                    );
                }
            }
        } else {
            // Retângulo em Grade
            let cols = d;
            let rows = 1;
            for (let i = 1; i <= Math.sqrt(d); i++) {
                if (d % i === 0) {
                    rows = i;
                    cols = d / i;
                }
            }

            const totalWidth = 180;
            const totalHeight = 160;
            const rectWidth = totalWidth / cols;
            const rectHeight = totalHeight / rows;
            const startX = 10;
            const startY = 20;

            let index = 0;
            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    const globalIndex = s * d + index;
                    const sliceColor = getSliceColor(globalIndex, activeFillColor);
                    elements.push(
                        <rect
                            key={`rect-${r}-${c}`}
                            x={startX + c * rectWidth}
                            y={startY + r * rectHeight}
                            width={rectWidth}
                            height={rectHeight}
                            fill={forceEmpty ? emptyColor : sliceColor}
                            stroke={strokeColor}
                            strokeWidth="2"
                            strokeLinejoin="round"
                            className="transition-all duration-300 hover:opacity-90"
                        />
                    );
                    index++;
                }
            }
        }

        // --- LINHAS SOBREPOSTAS DESTACADAS (CHAMANDO A ATENÇÃO PELAS CORES DAS FRAÇÕES DE ORIGEM) ---
        if (overlayLines) {
            const { d1, color1 = '#2563eb', d2, color2 = '#dc2626' } = overlayLines;

            if (shape === 'circle') {
                // Desenha as linhas da 1ª fração (d1) com cor e espessura destacadas
                if (d1 && d1 > 1) {
                    for (let i = 0; i < d1; i++) {
                        const ang = (2 * Math.PI / d1) * i - Math.PI / 2;
                        const lx = 100 + 90 * Math.cos(ang);
                        const ly = 100 + 90 * Math.sin(ang);
                        elements.push(
                            <line
                                key={`overlay-line-d1-${i}`}
                                x1="100"
                                y1="100"
                                x2={lx}
                                y2={ly}
                                stroke={color1}
                                strokeWidth="4.5"
                                strokeLinecap="round"
                            />
                        );
                    }
                }

                // Desenha as linhas da 2ª fração (d2) com cor destacada
                if (d2 && d2 > 1) {
                    for (let j = 0; j < d2; j++) {
                        const ang = (2 * Math.PI / d2) * j - Math.PI / 2;
                        const lx = 100 + 90 * Math.cos(ang);
                        const ly = 100 + 90 * Math.sin(ang);
                        elements.push(
                            <line
                                key={`overlay-line-d2-${j}`}
                                x1="100"
                                y1="100"
                                x2={lx}
                                y2={ly}
                                stroke={color2}
                                strokeWidth="3.5"
                                strokeLinecap="round"
                                strokeDasharray={d1 === d2 ? "6 3" : undefined}
                            />
                        );
                    }
                }

                // Círculo de centro sutil para arrematar o encontro das linhas
                elements.push(
                    <circle
                        key="overlay-center-point"
                        cx="100"
                        cy="100"
                        r="5"
                        fill="#0f172a"
                        stroke="#ffffff"
                        strokeWidth="2"
                    />
                );
            } else {
                // No Retângulo: Linhas verticais para a 1ª fração e horizontais para a 2ª fração
                const totalWidth = 180;
                const totalHeight = 160;
                const startX = 10;
                const startY = 20;

                // Linhas da 1ª Fração (colunas verticais)
                if (d1 && d1 > 1) {
                    const colW = totalWidth / d1;
                    for (let c = 1; c < d1; c++) {
                        const lx = startX + c * colW;
                        elements.push(
                            <line
                                key={`overlay-rect-line-d1-${c}`}
                                x1={lx}
                                y1={startY}
                                x2={lx}
                                y2={startY + totalHeight}
                                stroke={color1}
                                strokeWidth="4"
                                strokeLinecap="round"
                                className="drop-shadow-xs"
                            />
                        );
                    }
                }

                // Linhas da 2ª Fração (linhas horizontais)
                if (d2 && d2 > 1) {
                    const rowH = totalHeight / d2;
                    for (let r = 1; r < d2; r++) {
                        const ly = startY + r * rowH;
                        elements.push(
                            <line
                                key={`overlay-rect-line-d2-${r}`}
                                x1={startX}
                                y1={ly}
                                x2={startX + totalWidth}
                                y2={ly}
                                stroke={color2}
                                strokeWidth="3.5"
                                strokeLinecap="round"
                                className="drop-shadow-xs"
                            />
                        );
                    }
                }
            }
        }

        shapes.push(
            <svg
                key={`shape-${s}`}
                viewBox="0 0 200 200"
                className={`${sizeClassName} drop-shadow-xs`}
                style={style || undefined}
            >
                {elements}
            </svg>
        );
    }

    return (
        <div className="flex flex-wrap items-center justify-center gap-3">
            {shapes}
            {numShapes > maxShapesToRender && (
                <div className="flex items-center justify-center p-3 bg-slate-100 border border-slate-300 rounded-lg text-xs font-bold text-slate-600">
                    + {numShapes - maxShapesToRender} formas ocultas
                </div>
            )}
        </div>
    );
};
