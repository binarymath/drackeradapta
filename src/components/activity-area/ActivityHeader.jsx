
import React from 'react';
import { FileText, Check, Pencil, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '../ui/Button';

export const ActivityHeader = ({
    hasContent,
    activityType,
    onEdit,
    showAnswers,
    setShowAnswers,
    handleDownloadPdf,
    foundWords,
    isFullWidth,
    toggleFullWidth
}) => {
    return (
        <div className="p-4 border-b border-brown-100 flex items-center justify-between bg-brown-50/50 no-print rounded-t-2xl">
            <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${hasContent ? 'bg-green-500' : 'bg-brown-300'}`}></span>
                <span className="text-xs font-bold text-brown-500 uppercase">
                    {hasContent ? 'Pronto' : 'Aguardando'}
                </span>
            </div>

            <div className="flex gap-2">
                {hasContent && (
                    <>
                        {(activityType === 'quiz' || activityType === 'summary' || activityType === 'simplify') && (
                            <Button
                                onClick={onEdit}
                                variant="secondary"
                                className="h-8 text-sm px-3"
                                icon={Pencil}
                            >
                                {activityType === 'quiz' ? 'Quiz' : 'Editar'}
                            </Button>
                        )}
                        {activityType === 'wordsearch' && foundWords && foundWords.length > 0 && (
                            <Button
                                onClick={() => setShowAnswers(!showAnswers)}
                                variant={showAnswers ? "primary" : "secondary"}
                                className={`h-8 text-sm px-3 ${showAnswers ? 'bg-green-600 hover:bg-green-700 text-white' : ''}`}
                                icon={showAnswers ? Check : undefined}
                            >
                                {showAnswers ? 'Respostas' : 'Respostas'}
                            </Button>
                        )}
                        {activityType !== 'memory' && activityType !== 'rpg' && (
                            <>
                                <Button onClick={handleDownloadPdf} variant="ghost" className="h-8 w-8 p-0" icon={FileText} title="Imprimir PDF" />
                            </>
                        )}
                    </>
                )}

                <div className="h-6 w-px bg-brown-200 mx-1"></div>

                <Button
                    onClick={toggleFullWidth}
                    variant="ghost"
                    className="h-8 w-8 p-0 hover:bg-brown-100 text-brown-500"
                    icon={isFullWidth ? Minimize2 : Maximize2}
                    title={isFullWidth ? "Restaurar Visão" : "Expandir Tela"}
                />
            </div>
        </div>
    );
};
