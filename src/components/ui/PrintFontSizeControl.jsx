import React from 'react';
import { Type } from 'lucide-react';

export const FONT_SIZE_PRESETS = [
    { value: 13, label: 'Compacta (13px)', shortLabel: '13px' },
    { value: 15.5, label: 'Normal (15.5px)', shortLabel: '15.5px' },
    { value: 18, label: 'Média (18px)', shortLabel: '18px' },
    { value: 21, label: 'Grande (21px)', shortLabel: '21px' },
    { value: 25, label: 'Muito Grande (25px)', shortLabel: '25px' },
    { value: 28, label: 'Máxima (28px)', shortLabel: '28px' }
];

/**
 * PrintFontSizeControl – Controle intuitivo e compacto de escala de fonte para impressão e PDF.
 */
export const PrintFontSizeControl = ({
    value = 15.5,
    onChange,
    className = '',
    compact = false,
    label = 'Fonte'
}) => {
    // Normaliza para valor numérico
    const numericValue = Number(value) || 15.5;

    const handleSelectChange = (e) => {
        const nextVal = Number(e.target.value);
        if (onChange) onChange(nextVal);
    };

    const handleStep = (direction) => {
        const currentIndex = FONT_SIZE_PRESETS.findIndex(p => Math.abs(p.value - numericValue) < 0.8);
        let nextIndex;
        if (currentIndex === -1) {
            nextIndex = direction > 0 ? 2 : 0;
        } else {
            nextIndex = Math.max(0, Math.min(FONT_SIZE_PRESETS.length - 1, currentIndex + direction));
        }
        if (onChange) onChange(FONT_SIZE_PRESETS[nextIndex].value);
    };

    return (
        <div className={`inline-flex items-center gap-1.5 bg-white border border-stone-200 hover:border-stone-300 rounded-xl px-2.5 py-1 shadow-2xs transition-all no-print ${className}`}>
            <span className="flex items-center gap-1 text-stone-500 font-bold text-xs select-none" title="Ajustar tamanho da fonte para impressão e PDF">
                <Type className="w-3.5 h-3.5 text-amber-600" />
                {!compact && <span className="text-[11px] uppercase tracking-wider text-stone-400 font-extrabold">{label}:</span>}
            </span>

            {/* Botão Diminuir */}
            <button
                type="button"
                onClick={() => handleStep(-1)}
                disabled={numericValue <= FONT_SIZE_PRESETS[0].value}
                className="w-5 h-5 rounded-md flex items-center justify-center text-xs font-black text-stone-600 hover:text-amber-900 hover:bg-amber-50 disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-colors"
                title="Diminuir fonte (A-)"
            >
                -
            </button>

            {/* Dropdown de Tamanhos */}
            <select
                value={numericValue}
                onChange={handleSelectChange}
                className="text-xs font-bold text-stone-800 bg-transparent border-none outline-none focus:ring-0 p-0 cursor-pointer pr-1"
                title="Selecione o tamanho desejado para o texto impresso"
            >
                {FONT_SIZE_PRESETS.map((preset) => (
                    <option key={preset.value} value={preset.value}>
                        {compact ? preset.shortLabel : preset.label}
                    </option>
                ))}
            </select>

            {/* Botão Aumentar */}
            <button
                type="button"
                onClick={() => handleStep(1)}
                disabled={numericValue >= FONT_SIZE_PRESETS[FONT_SIZE_PRESETS.length - 1].value}
                className="w-5 h-5 rounded-md flex items-center justify-center text-xs font-black text-stone-600 hover:text-amber-900 hover:bg-amber-50 disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-colors"
                title="Aumentar fonte (A+)"
            >
                +
            </button>
        </div>
    );
};
