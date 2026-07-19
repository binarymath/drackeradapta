
import React from 'react';
import { FileText, Check, Pencil, Maximize2, Minimize2, PenSquare, Printer } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

export const ActivityHeader = ({
    hasContent,
    activityType,
    onEdit,
    showAnswers,
    setShowAnswers,
    handleDownloadPdf,
    foundWords,
    isFullWidth,
    toggleFullWidth,
    openManualMusicEditor,
    activityTitle,
    setActivityTitle
}) => {
    return (
        <div className="p-4 border-b border-brown-100 flex items-center justify-between bg-gradient-to-r from-brown-50 to-white no-print rounded-t-2xl shadow-sm">
            <div className="flex items-center gap-4 flex-1">
                {/* Logo do Drácker no Cabeçalho */}
                <div className="relative group shrink-0">
                    <div className="absolute inset-0 bg-amber-200 rounded-full blur-md opacity-50 group-hover:opacity-100 transition-opacity"></div>
                    <img 
                        src="/dracker_character.png" 
                        alt="Drácker" 
                        className="w-10 h-10 object-contain relative z-10 drop-shadow-sm transform group-hover:scale-110 transition-transform"
                    />
                </div>

                <div className="flex flex-col">
                    <div className="flex items-center gap-2 mb-0.5">
                        <span className={`w-2 h-2 rounded-full ${hasContent ? 'bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-brown-300'}`}></span>
                        <span className="text-[10px] font-extrabold text-brown-500 uppercase tracking-widest">
                            {activityType === 'about_system' || activityType === 'dashboard'
                                ? 'Página Inicial'
                                : activityType === 'merge_pdf'
                                ? 'Unir PDF'
                                : hasContent
                                ? 'Atividade Pronta'
                                : 'Aguardando Geração'}
                        </span>
                    </div>
                    {hasContent && activityType !== 'about_system' && activityType !== 'dashboard' && activityType !== 'merge_pdf' && (
                        <Input
                            value={activityTitle || ''}
                            onChange={(e) => setActivityTitle && setActivityTitle(e.target.value)}
                            placeholder="Título da Atividade"
                            className="h-7 px-2 text-sm font-bold bg-transparent border-transparent hover:border-brown-200 focus:bg-white focus:border-brown-400 max-w-sm transition-all text-brown-900 rounded-md -ml-2"
                        />
                    )}
                </div>
            </div>

            <div className="flex gap-2">
                {/* Manual Input Trigger for Music Activity */}
                {activityType === 'simplify' && (
                    <Button
                        onClick={openManualMusicEditor}
                        variant="secondary"
                        className="h-8 text-sm px-3 border-dashed border-brown-300 hover:border-brown-400"
                        icon={PenSquare}
                        title="Criar Manualmente"
                    >
                        Criar Novo
                    </Button>
                )}

                {hasContent && (
                    <>
                        {(activityType === 'quiz' || activityType === 'simplify' || activityType === 'domino') && (
                            <Button
                                onClick={onEdit}
                                variant="secondary"
                                className="h-8 text-sm px-3"
                                icon={Pencil}
                            >
                                Editar
                            </Button>
                        )}
                        {activityType === 'quiz' && (
                            <Button
                                onClick={() => setShowAnswers(!showAnswers)}
                                variant={showAnswers ? "primary" : "secondary"}
                                className={`h-8 text-sm px-3 ${showAnswers ? 'bg-green-600 hover:bg-green-700 text-white' : ''}`}
                                icon={showAnswers ? Check : undefined}
                            >
                                {showAnswers ? 'Gabarito ✓' : 'Gabarito'}
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
                                <Button onClick={handleDownloadPdf} variant="ghost" className="h-8 w-8 p-0" icon={Printer} title="Imprimir" />
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
