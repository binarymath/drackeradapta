import React from 'react';
import { toDirectImageUrl, handleDriveImageError } from '../../utils/urlUtils';
import { LatexRenderer } from './LatexRenderer';

const LETTERS = ['A', 'B', 'C', 'D', 'E'];

/**
 * StandardPrintCard – Componente unificado para exibição de questões e itens em cards
 * para visualização, impressão e exportação em PDF de alta fidelidade.
 */
export const StandardPrintCard = ({
    number,
    badge,
    badgeType = 'default', // 'easy' | 'medium' | 'hard' | 'info' | 'default'
    statement,
    imageUrl,
    imageMaxHeight = 160,
    imageBgColor = 'transparent',
    options = [],
    correctIndex = -1,
    showAnswers = false,
    showLines = false,
    linesCount = 3,
    fontSize = 12.5,
    className = '',
    children
}) => {
    const badgeStyles = {
        easy: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        medium: 'bg-slate-100 text-slate-800 border-slate-300',
        hard: 'bg-rose-50 text-rose-800 border-rose-200',
        info: 'bg-sky-50 text-sky-800 border-sky-200',
        default: 'bg-slate-50 text-slate-800 border-slate-200'
    };

    const imgSrc = imageUrl ? toDirectImageUrl(imageUrl) : null;
    const cleanStatement = typeof statement === 'string'
        ? statement.replace(/^\d+[.)]\s*/, '').trim()
        : statement;

    return (
        <div 
            className={`dracker-print-card bg-white border-2 border-slate-300 rounded-xl p-3 sm:p-3.5 shadow-none break-inside-avoid flex flex-col print:border-black print:shadow-none ${className}`}
            style={{ '--qp-font-size': `${fontSize}px` }}
        >
            {/* Cabeçalho do Card */}
            <div className="dracker-card-head flex items-start gap-2.5 mb-2 break-inside-avoid">
                {number !== undefined && number !== null && (
                    <span className="dracker-card-num shrink-0 w-6.5 h-6.5 rounded-full bg-slate-800 text-white font-black text-xs flex items-center justify-center shadow-none print:bg-black print:text-white">
                        {number}
                    </span>
                )}
                <div className="flex-1 flex flex-col gap-1 min-w-0">
                    {badge && (
                        <span className={`inline-block text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border w-fit ${badgeStyles[badgeType] || badgeStyles.default}`}>
                            {badge}
                        </span>
                    )}
                    {cleanStatement && (
                        <div className="dracker-card-statement font-bold text-stone-900 leading-snug break-words" style={{ fontSize: `${fontSize}px` }}>
                            {typeof cleanStatement === 'string' && (/\$|\\frac|\\sqrt|[+\-x÷=]\s*\d/.test(cleanStatement)) ? (
                                <LatexRenderer content={cleanStatement} textFontSize={fontSize} mathFontSize={fontSize * 1.2} />
                            ) : (
                                cleanStatement
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Imagem opcional */}
            {imgSrc && (
                <div 
                    className="dracker-card-image my-2 rounded-lg p-1.5 flex items-center justify-center w-full break-inside-avoid"
                    style={{ backgroundColor: imageBgColor !== 'transparent' ? imageBgColor : 'transparent' }}
                >
                    <img 
                        src={imgSrc} 
                        alt={`Ilustração questão ${number || ''}`}
                        onError={handleDriveImageError}
                        className="object-contain block mx-auto"
                        style={{
                            maxHeight: imageMaxHeight > 0 ? `${imageMaxHeight}px` : 'none',
                            maxWidth: '100%',
                            width: 'auto',
                            height: 'auto'
                        }}
                    />
                </div>
            )}

            {/* Alternativas de Múltipla Escolha */}
            {options && options.length > 0 && (
                <div className="dracker-card-options flex flex-col gap-1.5 mt-2">
                    {options.map((opt, idx) => {
                        const isCorrect = showAnswers && (idx === correctIndex);
                        const letter = LETTERS[idx] || String(idx + 1);

                        return (
                            <div 
                                key={idx}
                                className={`dracker-card-option flex items-center gap-2 rounded-lg px-2.5 py-1.5 border transition-colors ${
                                    isCorrect 
                                        ? 'bg-emerald-50 border-emerald-400 text-emerald-950 font-bold' 
                                        : 'bg-white border-slate-200 text-slate-800 print:border-slate-300'
                                }`}
                                style={{ fontSize: `${fontSize * 0.92}px` }}
                            >
                                <span className={`dracker-option-letter shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                                    isCorrect 
                                        ? 'bg-emerald-500 text-white' 
                                        : 'bg-slate-100 border border-slate-300 text-slate-800'
                                }`}>
                                    {letter}
                                </span>
                                <span className="flex-1 font-semibold leading-tight break-words">
                                    {opt}
                                </span>
                                {isCorrect && (
                                    <span className="text-emerald-600 font-black text-xs shrink-0">✓</span>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Linhas para resposta dissertativa caso sem opções e showLines ativado */}
            {(!options || options.length === 0) && showLines && (
                <div className="dracker-answer-lines flex flex-col gap-2 mt-3">
                    {Array.from({ length: linesCount }).map((_, lIdx) => (
                        <div key={lIdx} className="dracker-answer-line border-b border-dashed border-stone-300 h-4.5 w-full" />
                    ))}
                </div>
            )}

            {/* Conteúdo customizado / slot infantil */}
            {children}
        </div>
    );
};
