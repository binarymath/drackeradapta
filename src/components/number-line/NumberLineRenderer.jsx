import React from 'react';

export const NumberLineRenderer = ({
    data,
    showAnswers = true,
    isPrint = false,
    interactiveMode = false,
    isFullscreen = false,
    onPointClick,
    selectedDropPoint,
    onDropCard
}) => {
    const {
        domainType = 'integer',
        minVal = -5,
        maxVal = 5,
        step = 1,
        denominator = 4,
        denominatorColors = {},
        points = [],
        arcs = [],
        fontSizePx = 16,
        axisNumberMode = 'all'
    } = data || {};

    const basePx = Math.max(10, Math.min(72, Number(fontSizePx) || 16));
    const majorTick = basePx;
    const normalTick = Math.max(11, Math.round(basePx * 0.88));
    const fracTick = Math.max(11, Math.round(basePx * 0.78));
    const arcTextSize = Math.max(11, Math.round(basePx * 0.85));

    // Offset vertical inteligente para os números nunca encavalarem com a reta ou traços
    const intOffsetY = 16 + Math.round(basePx * 0.85);
    const fracOffsetY = 14 + Math.round(fracTick * 0.85);
    const fracBarY = Math.max(5, Math.round(fracTick * 0.38));
    const fracDenY = fracBarY + Math.round(fracTick * 0.85) + 3;
    const fracLineW = Math.max(8, Math.round(fracTick * 0.75));

    // Dimensões dinâmicas do balão dos pontos
    const badgeTextSize = Math.max(12, Math.round(basePx * 0.85));
    const badgeW = Math.max(56, Math.round(badgeTextSize * 4.2));
    const badgeH = Math.max(30, Math.round(badgeTextSize * 2.2));
    const badgeX = -Math.round(badgeW / 2);
    const badgeY = -Math.round(badgeH / 2);
    const badgeTextY = Math.round(badgeTextSize * 0.35);

    // Hastes dinâmicas para evitar colisão
    const maxBottomLabelY = domainType === 'fraction' ? (fracOffsetY + fracDenY) : intOffsetY;
    const stemBottomY = Math.max(64, maxBottomLabelY + Math.round(badgeH * 0.75));
    const stemTopY = -Math.max(56, Math.round(badgeH * 1.4));

    const sizes = {
        majorTick, normalTick, fracTick, arcTextSize,
        intOffsetY, fracOffsetY, fracBarY, fracDenY, fracLineW,
        badgeW, badgeH, badgeX, badgeY, badgeTextSize, badgeTextY,
        stemBottomY, stemTopY
    };

    const min = Number(minVal) || 0;
    const max = Number(maxVal) <= min ? min + 10 : Number(maxVal);
    const range = max - min;

    // SVG Layout Constants (com cálculo dinâmico de altura e centro para nunca cortar balões superiores ou arcos)
    const hasTopPoints = points.some(p => p.position !== 'bottom' && p.position !== 'tick');
    const hasBottomPoints = points.some(p => p.position === 'bottom');
    const hasArcs = arcs && arcs.length > 0;

    const maxUpNeeded = Math.max(
        110,
        hasTopPoints ? Math.abs(stemTopY) + Math.ceil(badgeH / 2) + 36 : 80,
        hasArcs ? 120 + Math.round(basePx * 1.2) : 80
    );
    const maxDownNeeded = Math.max(
        100,
        hasBottomPoints ? stemBottomY + Math.ceil(badgeH / 2) + 36 : 80,
        maxBottomLabelY + 36
    );

    const svgWidth = 1000;
    const axisY = Math.max(160, maxUpNeeded);
    const svgHeight = Math.max(280, axisY + maxDownNeeded);
    const marginX = 60;
    const axisWidth = svgWidth - 2 * marginX;

    const valToX = (v) => {
        const clamped = Math.max(min - 0.2, Math.min(max + 0.2, Number(v)));
        return marginX + ((clamped - min) / range) * axisWidth;
    };

    const parseDenominators = (denVal) => {
        if (Array.isArray(denVal)) {
            const list = denVal.map(Number).filter(n => !isNaN(n) && n > 0);
            return list.length > 0 ? list : [4];
        }
        if (typeof denVal === 'number') {
            return denVal > 0 ? [Math.round(denVal)] : [4];
        }
        if (typeof denVal === 'string') {
            const list = denVal.split(/[,;\s]+/).map(s => Number(s.trim())).filter(n => !isNaN(n) && n > 0);
            return list.length > 0 ? list : [4];
        }
        return [4];
    };

    const densList = parseDenominators(denominator);
    const primaryDen = densList[0] || 4;

    // Helper to format fraction or integer cleanly
    const formatValue = (v, den = primaryDen) => {
        if (domainType === 'mixed' && den > 0) {
            const num = Math.round(v * den);
            
            let decStr = parseFloat(Number(v).toFixed(3)).toString();
            if (!decStr.includes('.')) {
                decStr += '.0';
            }
            decStr = decStr.replace('.', ',');
            
            return { type: 'mixed', num: num, den: den, dec: decStr };
        }
        if (domainType === 'fraction' && den > 0) {
            const num = Math.round(v * den);
            if (num % den === 0) {
                return { type: 'int', text: `${num / den}` };
            }
            return { type: 'frac', num: num, den: den };
        }
        if (domainType === 'decimal') {
            if (Math.abs(v - Math.round(v)) < 0.0001) return { type: 'int', text: `${Math.round(v)}` };
            let decStr = Number(v).toFixed(3);
            while (decStr.endsWith('0')) decStr = decStr.slice(0, -1);
            if (decStr.endsWith('.')) decStr = decStr.slice(0, -1);
            return { type: 'int', text: decStr.replace('.', ',') };
        }
        return { type: 'int', text: `${Math.round(v)}` };
    };

    // Generate ticks
    const ticks = [];
    const ticksMap = new Map();

    if (domainType === 'fraction' || domainType === 'mixed') {
        const denColors = denominatorColors || {};

        [...densList].sort((a, b) => a - b).forEach(den => {
            const startStep = Math.ceil(min * den);
            const endStep = Math.floor(max * den);
            const denCol = denColors[den] || '#78350f';

            for (let i = startStep; i <= endStep; i++) {
                const v = i / den;
                const key = v.toFixed(5);
                const isInteger = i % den === 0;

                if (!ticksMap.has(key)) {
                    ticksMap.set(key, {
                        val: v,
                        x: valToX(v),
                        isMajor: isInteger,
                        color: (isInteger && domainType !== 'mixed') ? '#78350f' : denCol,
                        label: formatValue(v, den)
                    });
                } else if (!isInteger && ticksMap.get(key).color === '#78350f') {
                    ticksMap.get(key).color = denCol;
                } else if (isInteger) {
                    ticksMap.get(key).isMajor = true;
                    if (domainType === 'mixed') ticksMap.get(key).color = denCol;
                }
            }
        });
    }

    if (domainType === 'integer' || domainType === 'decimal') {
        const s = Number(step) > 0 ? Number(step) : 1;
        const startStep = Math.ceil(min / s);
        const endStep = Math.floor(max / s);
        for (let i = startStep; i <= endStep; i++) {
            const v = i * s;
            ticks.push({
                val: v,
                x: valToX(v),
                isMajor: true,
                label: formatValue(v, primaryDen)
            });
        }
    }

    if (domainType === 'fraction' || domainType === 'mixed') {
        ticks.push(...Array.from(ticksMap.values()).sort((a, b) => a.val - b.val));
    } else {
        ticks.sort((a, b) => a.val - b.val);
    }

    return (
        <div className={`w-full ${isFullscreen ? 'h-full flex items-center justify-center overflow-hidden' : 'overflow-x-auto'} ${isPrint ? '' : 'py-4 select-none'}`}>
            <div className={isFullscreen ? "w-full h-full flex items-center justify-center bg-transparent p-0 border-0 shadow-none max-w-none" : "min-w-[700px] max-w-5xl mx-auto bg-white rounded-2xl p-4 shadow-sm border border-brown-100"}>
                <svg
                    id="number-line-svg"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                    className="w-full h-auto overflow-visible"
                    style={{
                        maxHeight: isFullscreen ? '75vh' : (isPrint ? '200px' : '320px'),
                        width: '100%',
                        height: isFullscreen ? '100%' : 'auto',
                        fontFamily: 'system-ui, -apple-system, sans-serif'
                    }}
                >
                    <defs>
                        <marker
                            id="arrow-left"
                            markerWidth="10"
                            markerHeight="10"
                            refX="6"
                            refY="5"
                            orient="auto"
                        >
                            <path d="M 8 2 L 2 5 L 8 8 Z" fill="#78350f" />
                        </marker>
                        <marker
                            id="arrow-right"
                            markerWidth="10"
                            markerHeight="10"
                            refX="4"
                            refY="5"
                            orient="auto"
                        >
                            <path d="M 2 2 L 8 5 L 2 8 Z" fill="#78350f" />
                        </marker>
                        <marker
                            id="arc-arrow"
                            markerWidth="8"
                            markerHeight="8"
                            refX="6"
                            refY="4"
                            orient="auto"
                        >
                            <path d="M 1 1 L 7 4 L 1 7 Z" fill="#d97706" />
                        </marker>
                    </defs>

                    {/* Arcs (Jump Operations) */}
                    {arcs.map((arc, i) => {
                        const x1 = valToX(arc.fromVal);
                        const x2 = valToX(arc.toVal);
                        const midX = (x1 + x2) / 2;
                        const dist = Math.abs(x2 - x1);
                        const arcHeight = Math.min(80, Math.max(35, dist * 0.25));
                        const y1 = axisY - 15;
                        const midY = axisY - arcHeight;

                        return (
                            <g key={arc.id || i} className="transition-all duration-300">
                                <path
                                    d={`M ${x1} ${y1} Q ${midX} ${midY - 20} ${x2} ${y1}`}
                                    fill="none"
                                    stroke="#d97706"
                                    strokeWidth="2.5"
                                    strokeDasharray="5,4"
                                    markerEnd="url(#arc-arrow)"
                                />
                                <rect
                                    x={midX - 24}
                                    y={midY - 22}
                                    width="48"
                                    height="20"
                                    rx="6"
                                    fill="#fffbeb"
                                    stroke="#f59e0b"
                                    strokeWidth="1.5"
                                />
                                <text
                                    x={midX}
                                    y={midY - 8}
                                    textAnchor="middle"
                                    fontSize={sizes.arcTextSize}
                                    fontWeight="bold"
                                    fill="#92400e"
                                >
                                    {arc.label || (arc.toVal - arc.fromVal >= 0 ? `+${arc.toVal - arc.fromVal}` : `${arc.toVal - arc.fromVal}`)}
                                </text>
                            </g>
                        );
                    })}

                    {/* Main Axis Line */}
                    <line
                        x1={marginX - 15}
                        y1={axisY}
                        x2={svgWidth - marginX + 15}
                        y2={axisY}
                        stroke="#78350f"
                        strokeWidth="3.5"
                        markerStart="url(#arrow-left)"
                        markerEnd="url(#arrow-right)"
                    />

                    {/* Ticks and Tick Labels */}
                    {ticks.map((t, idx) => {
                        const tickTop = t.isMajor ? axisY - 10 : axisY - 6;
                        const tickBottom = t.isMajor ? axisY + 10 : axisY + 6;
                        const tickColor = t.color || "#78350f";

                        return (
                            <g key={idx}>
                                <line
                                    x1={t.x}
                                    y1={tickTop}
                                    x2={t.x}
                                    y2={tickBottom}
                                    stroke={tickColor}
                                    strokeWidth={t.isMajor ? "2.5" : "1.8"}
                                />


                                {/* Tick Label below axis */}
                                {(() => {
                                    const isPointColliding = points.some(p => (p.position === 'bottom' || p.position === 'tick') && Math.abs(p.val - t.val) < 0.0001);
                                    if (!t.label || isPointColliding) return null;
                                    if (axisNumberMode === 'none' || axisNumberMode === 'hidden') return null;
                                    if (axisNumberMode === 'extremes' || axisNumberMode === 'first_last') {
                                        const isFirst = idx === 0 || Math.abs(t.val - min) < 0.0001;
                                        const isLast = idx === ticks.length - 1 || Math.abs(t.val - max) < 0.0001;
                                        if (!isFirst && !isLast) return null;
                                    }
                                    return (
                                        <g transform={`translate(${t.x}, ${axisY + (t.label.type === 'int' ? sizes.intOffsetY : sizes.fracOffsetY)})`}>
                                            {t.label.type === 'int' ? (
                                                <text
                                                    textAnchor="middle"
                                                    fill={t.isMajor ? "#78350f" : tickColor}
                                                    fontSize={t.isMajor ? sizes.majorTick : sizes.normalTick}
                                                    fontWeight={t.isMajor ? "800" : "600"}
                                                >
                                                    {t.label.text}
                                                </text>
                                            ) : t.label.type === 'mixed' ? (
                                                <g transform="translate(0, 0)">
                                                    {/* Decimal Text Above Axis */}
                                                    <rect
                                                        x="-16"
                                                        y={-(sizes.fracOffsetY + 26)}
                                                        width="32"
                                                        height="16"
                                                        fill="rgba(255, 255, 255, 0.7)"
                                                        rx="4"
                                                    />
                                                    <text
                                                        x="0"
                                                        y={-(sizes.fracOffsetY + 15)}
                                                        textAnchor="middle"
                                                        fill={tickColor}
                                                        fontSize={sizes.fracTick}
                                                        fontWeight="900"
                                                    >
                                                        {t.label.dec}
                                                    </text>
                                                    {/* Fraction Text Below Axis */}
                                                    <text
                                                        x="0"
                                                        y="0"
                                                        textAnchor="middle"
                                                        fill={tickColor}
                                                        fontSize={sizes.fracTick}
                                                        fontWeight="bold"
                                                    >
                                                        {t.label.num}
                                                    </text>
                                                    <line
                                                        x1={-sizes.fracLineW}
                                                        y1={sizes.fracBarY}
                                                        x2={sizes.fracLineW}
                                                        y2={sizes.fracBarY}
                                                        stroke={tickColor}
                                                        strokeWidth="1.5"
                                                    />
                                                    <text
                                                        x="0"
                                                        y={sizes.fracDenY}
                                                        textAnchor="middle"
                                                        fill={tickColor}
                                                        fontSize={sizes.fracTick}
                                                        fontWeight="bold"
                                                    >
                                                        {t.label.den}
                                                    </text>
                                                </g>
                                            ) : (
                                                <g transform="translate(0, 0)">
                                                    <text
                                                        x="0"
                                                        y="0"
                                                        textAnchor="middle"
                                                        fill={tickColor}
                                                        fontSize={sizes.fracTick}
                                                        fontWeight="bold"
                                                    >
                                                        {t.label.num}
                                                    </text>
                                                    <line
                                                        x1={-sizes.fracLineW}
                                                        y1={sizes.fracBarY}
                                                        x2={sizes.fracLineW}
                                                        y2={sizes.fracBarY}
                                                        stroke={tickColor}
                                                        strokeWidth="1.5"
                                                    />
                                                    <text
                                                        x="0"
                                                        y={sizes.fracDenY}
                                                        textAnchor="middle"
                                                        fill={tickColor}
                                                        fontSize={sizes.fracTick}
                                                        fontWeight="bold"
                                                    >
                                                        {t.label.den}
                                                    </text>
                                                </g>
                                            )}
                                        </g>
                                    );
                                })()}
                            </g>
                        );
                    })}

                    {/* Highlight Points / Pins */}
                    {points.map((pt, index) => {
                        const px = valToX(pt.val);
                        const isHidden = !showAnswers && pt.hiddenVal;
                        const isDropTarget = interactiveMode && pt.hiddenVal;
                        const isSelected = selectedDropPoint?.id === pt.id;

                        const colorMap = {
                            blue: { fill: '#3b82f6', stroke: '#1d4ed8', bg: '#eff6ff', text: '#1e40af' },
                            emerald: { fill: '#10b981', stroke: '#047857', bg: '#ecfdf5', text: '#065f46' },
                            amber: { fill: '#f59e0b', stroke: '#b45309', bg: '#fffbeb', text: '#92400e' },
                            red: { fill: '#ef4444', stroke: '#b91c1c', bg: '#fef2f2', text: '#991b1b' },
                            purple: { fill: '#a855f7', stroke: '#6b21a8', bg: '#faf5ff', text: '#6b21a8' }
                        };
                        const colVal = pt.color || 'blue';
                        const c = colorMap[colVal] || (colVal.startsWith('#') || colVal.startsWith('rgb') ? {
                            fill: colVal,
                            stroke: colVal,
                            bg: '#ffffff',
                            text: colVal
                        } : colorMap.blue);

                        return (
                            <g
                                key={pt.id || index}
                                transform={`translate(${px}, ${axisY})`}
                                className={interactiveMode || onPointClick ? 'cursor-pointer hover:opacity-90 transition-transform' : ''}
                                onClick={() => onPointClick && onPointClick(pt)}
                                onDragOver={(e) => {
                                    if (isDropTarget) e.preventDefault();
                                }}
                                onDrop={(e) => {
                                    if (isDropTarget && onDropCard) {
                                        e.preventDefault();
                                        onDropCard(pt);
                                    }
                                }}
                            >
                                {pt.position === 'tick' ? (
                                    <g transform="translate(0, 22)">
                                        <circle cx="0" cy="-22" r="4.5" fill={c.fill} stroke="#ffffff" strokeWidth="1.5" />
                                        <text
                                            x="0"
                                            y="4"
                                            textAnchor="middle"
                                            className={`text-sm font-extrabold ${isHidden ? 'fill-gray-500' : ''}`}
                                            fill={isHidden ? '#6b7280' : c.text}
                                        >
                                            {pt.userAnswer ? pt.userAnswer : isHidden ? '?' : (pt.label || `${pt.val}`)}
                                        </text>
                                    </g>
                                ) : (
                                    <>
                                        {/* Stem line pointing to pin head */}
                                        <line
                                            x1="0"
                                            y1={pt.position === 'bottom' ? "5" : "-5"}
                                            x2="0"
                                            y2={pt.position === 'bottom' ? sizes.stemBottomY : sizes.stemTopY}
                                            stroke={c.stroke}
                                            strokeWidth="2.5"
                                            strokeDasharray={isHidden ? "3,3" : "none"}
                                        />

                                        {/* Pin circle at axis */}
                                        <circle
                                            cx="0"
                                            cy="0"
                                            r={isSelected ? "8" : "6"}
                                            fill={c.fill}
                                            stroke="#ffffff"
                                            strokeWidth="2"
                                            className="transition-all shadow-md"
                                        />

                                        {/* Badge Box above or below stem */}
                                        <g transform={`translate(0, ${pt.position === 'bottom' ? sizes.stemBottomY : sizes.stemTopY})`}>
                                            <rect
                                                x={sizes.badgeX}
                                                y={sizes.badgeY}
                                                width={sizes.badgeW}
                                                height={sizes.badgeH}
                                                rx="8"
                                                fill={isSelected ? '#fef08a' : isHidden ? '#f3f4f6' : c.bg}
                                                stroke={isSelected ? '#ca8a04' : isHidden ? '#9ca3af' : c.stroke}
                                                strokeWidth="2"
                                            />
                                            <text
                                                x="0"
                                                y={sizes.badgeTextY}
                                                textAnchor="middle"
                                                fontSize={sizes.badgeTextSize}
                                                fontWeight="800"
                                                fill={isHidden ? '#6b7280' : c.text}
                                            >
                                                {pt.userAnswer ? pt.userAnswer : isHidden ? '?' : (pt.label || `${pt.val}`)}
                                            </text>
                                        </g>
                                    </>
                                )}
                            </g>
                        );
                    })}

                </svg>
            </div>
        </div>
    );
};
