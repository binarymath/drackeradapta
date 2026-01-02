
import React from 'react';
import { Copy, FileText, Download, Check, Pencil } from 'lucide-react';
import { Button } from '../ui/Button';

export const ActivityHeader = ({
    hasContent,
    activityType,
    onEdit,
    showAnswers,
    setShowAnswers,
    handleCopy,
    handleDownloadDoc,
    handleDownloadPdf,
    foundWords
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
                        {activityType !== 'memory' && (
                            <>
                                <Button onClick={handleCopy} variant="ghost" className="h-8 w-8 p-0" icon={Copy} title="Copiar" />
                                <Button onClick={handleDownloadDoc} variant="ghost" className="h-8 w-8 p-0" icon={FileText} title="Baixar DOCX" />
                                <Button onClick={handleDownloadPdf} variant="ghost" className="h-8 w-8 p-0" icon={Download} title="Imprimir PDF" />
                            </>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};
