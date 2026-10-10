import React from 'react';
import { AlignLeft, AlignCenter, AlignRight, AlignJustify, Edit3 } from 'lucide-react';

/**
 * Barra de Ferramentas de Tipografia e Edição Rápida para Textos das Missões de RPG
 * Padrão idêntico ao utilizado nos cards de atividades (Roleta, etc.)
 */
export const RPGTypographyToolbar = ({
    fontScale = 100,
    onIncreaseFont,
    onDecreaseFont,
    onResetFont,
    textAlign = 'text-left',
    onSetAlign,
    onEdit,
    editTooltip = 'Editar texto desta missão',
    className = ''
}) => {
    return (
        <div className={`flex items-center gap-2 flex-wrap ${className}`}>
            {/* Ajuste de Fonte Rápido */}
            <div className="inline-flex items-center gap-1 bg-slate-100/90 border border-slate-200 px-2 py-0.5 rounded-xl shadow-2xs">
                <span className="text-[11px] font-bold text-slate-500">Fonte:</span>
                <button
                    type="button"
                    onClick={onDecreaseFont}
                    disabled={fontScale <= 70}
                    className="w-5 h-5 rounded flex items-center justify-center text-xs font-black text-slate-700 hover:bg-white active:scale-90 disabled:opacity-30 cursor-pointer transition-colors"
                    title="Diminuir fonte (A-)"
                >
                    A-
                </button>
                <button
                    type="button"
                    onClick={onResetFont}
                    className="px-1.5 text-[11px] font-bold text-indigo-700 hover:bg-white rounded cursor-pointer transition-colors"
                    title="Tamanho padrão (100%)"
                >
                    {fontScale}%
                </button>
                <button
                    type="button"
                    onClick={onIncreaseFont}
                    disabled={fontScale >= 250}
                    className="w-5 h-5 rounded flex items-center justify-center text-xs font-black text-slate-700 hover:bg-white active:scale-90 disabled:opacity-30 cursor-pointer transition-colors"
                    title="Aumentar fonte para projeção (A+)"
                >
                    A+
                </button>
            </div>

            {/* Ajuste de Alinhamento e Edição */}
            <div className="inline-flex items-center gap-1 bg-slate-100/90 border border-slate-200 px-1 py-0.5 rounded-xl shadow-2xs">
                <button
                    type="button"
                    onClick={() => onSetAlign && onSetAlign('text-left')}
                    className={`w-6 h-6 rounded flex items-center justify-center cursor-pointer transition-colors ${textAlign === 'text-left' ? 'bg-indigo-100 text-indigo-700 font-bold' : 'text-slate-500 hover:bg-white hover:text-slate-700'}`}
                    title="Alinhar à Esquerda"
                >
                    <AlignLeft className="w-3.5 h-3.5" />
                </button>
                <button
                    type="button"
                    onClick={() => onSetAlign && onSetAlign('text-center')}
                    className={`w-6 h-6 rounded flex items-center justify-center cursor-pointer transition-colors ${textAlign === 'text-center' ? 'bg-indigo-100 text-indigo-700 font-bold' : 'text-slate-500 hover:bg-white hover:text-slate-700'}`}
                    title="Centralizar"
                >
                    <AlignCenter className="w-3.5 h-3.5" />
                </button>
                <button
                    type="button"
                    onClick={() => onSetAlign && onSetAlign('text-right')}
                    className={`w-6 h-6 rounded flex items-center justify-center cursor-pointer transition-colors ${textAlign === 'text-right' ? 'bg-indigo-100 text-indigo-700 font-bold' : 'text-slate-500 hover:bg-white hover:text-slate-700'}`}
                    title="Alinhar à Direita"
                >
                    <AlignRight className="w-3.5 h-3.5" />
                </button>
                <button
                    type="button"
                    onClick={() => onSetAlign && onSetAlign('text-justify')}
                    className={`w-6 h-6 rounded flex items-center justify-center cursor-pointer transition-colors ${textAlign === 'text-justify' ? 'bg-indigo-100 text-indigo-700 font-bold' : 'text-slate-500 hover:bg-white hover:text-slate-700'}`}
                    title="Justificar"
                >
                    <AlignJustify className="w-3.5 h-3.5" />
                </button>
                {onEdit && (
                    <>
                        <div className="w-px h-4 bg-slate-300 mx-0.5" />
                        <button
                            type="button"
                            onClick={onEdit}
                            className="w-6 h-6 rounded flex items-center justify-center cursor-pointer transition-colors text-indigo-600 hover:bg-indigo-100 hover:text-indigo-800"
                            title={editTooltip}
                        >
                            <Edit3 className="w-3.5 h-3.5" />
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};
