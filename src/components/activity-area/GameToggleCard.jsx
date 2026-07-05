
import React from 'react';
import { Gamepad2, Printer, Sparkles } from 'lucide-react';
import { Button } from '../ui/Button';

export const GameToggleCard = ({
    title,
    description,
    isGameMode,
    onToggle,
    color = "brown", // brown, amber, blue, green, purple
    toggleLabel = 'Jogar Online',
    children
}) => {
    return (
        <div className="mb-4 no-print w-full bg-slate-900/5 hover:bg-slate-900/10 border border-slate-200/80 rounded-xl p-2.5 sm:p-3 transition-all shadow-2xs flex flex-wrap sm:flex-nowrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0 flex-shrink-0">
                <div className="w-8 h-8 rounded-lg bg-slate-800 text-white flex items-center justify-center flex-shrink-0 shadow-2xs">
                    {isGameMode ? <Printer className="w-4 h-4" /> : <Gamepad2 className="w-4 h-4" />}
                </div>
                <div className="min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-bold text-slate-800 truncate">
                            {isGameMode ? 'Modo Jogo Interativo' : (title || 'Modo Impressão / Folha')}
                        </span>
                        {!isGameMode && (
                            <span className="text-[10px] font-semibold bg-slate-200/80 text-slate-700 px-2 py-0.5 rounded-full hidden md:inline-block">
                                Pronto para Impressão
                            </span>
                        )}
                    </div>
                    {description && (
                        <p className="text-[11px] text-slate-500 truncate hidden sm:block">{description}</p>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-3 ml-auto flex-wrap sm:flex-nowrap justify-end w-full sm:w-auto">
                {children && (
                    <div className="flex items-center gap-2">
                        {children}
                    </div>
                )}
                <Button
                    onClick={onToggle}
                    variant={isGameMode ? "secondary" : "primary"}
                    className={`h-8 sm:h-9 px-3.5 text-xs sm:text-sm font-semibold rounded-lg shadow-2xs whitespace-nowrap flex items-center gap-1.5 transition-all w-full sm:w-auto justify-center ${
                        isGameMode 
                            ? 'bg-white hover:bg-slate-100 text-slate-800 border border-slate-300' 
                            : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-none'
                    }`}
                >
                    {isGameMode ? (
                        <>
                            <Printer className="w-3.5 h-3.5" />
                            Voltar para Folha / Impressão
                        </>
                    ) : (
                        <>
                            <Gamepad2 className="w-3.5 h-3.5" />
                            {toggleLabel}
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
};
