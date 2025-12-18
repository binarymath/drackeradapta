import React from 'react';
import { Copy, FileText, Download, Brain, Pencil } from 'lucide-react';
import RichTextRenderer from './RichTextRenderer';

export const ActivityArea = ({
    generatedContent,
    activityType,
    foundWords,
    showAnswers,
    setShowAnswers,
    handleCopy,
    handleDownloadDoc,
    handleDownloadPdf,
    activityAreaRef,
    wordsearchTitle,
    setWordsearchTitle,
    wordsearchHideText,
    setWordsearchHideText,
    wordsearchHideGrid,
    setWordsearchHideGrid,
    foundPlacements,
    isLoading,
    isGeneratingAudio,
    onEdit,
    musicData
}) => {
    return (
        <div className="lg:col-span-8">
            <div className="bg-white rounded-lg shadow-xl border border-slate-200 min-h-96 flex flex-col">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 no-print">
                    <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${generatedContent ? 'bg-green-500' : 'bg-slate-300'}`}></span>
                        <span className="text-xs font-bold text-slate-500">
                            {generatedContent ? 'PRONTO' : 'AGUARDANDO'}
                        </span>
                    </div>

                    <div className="flex gap-2">
                        {generatedContent && (
                            <>
                                {(activityType === 'quiz' || activityType === 'summary') && (
                                    <button
                                        onClick={onEdit}
                                        className="px-3 py-2 rounded text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 font-bold flex items-center gap-2"
                                        title="Editar Estrutura"
                                    >
                                        <Pencil className="w-4 h-4" /> {activityType === 'quiz' ? 'Quiz' : 'Editar'}
                                    </button>
                                )}
                                {activityType === 'wordsearch' && foundWords.length > 0 && (
                                    <button
                                        onClick={() => setShowAnswers(!showAnswers)}
                                        className={`px-3 py-2 rounded text-sm font-bold ${showAnswers ? 'bg-green-500 text-white' : 'bg-slate-100 hover:bg-slate-200'}`}
                                        title={showAnswers ? 'Ocultar respostas' : 'Mostrar respostas'}
                                    >
                                        {showAnswers ? '✓ Respostas' : 'Respostas'}
                                    </button>
                                )}
                                <button onClick={handleCopy} className="px-3 py-2 rounded text-sm bg-slate-100 hover:bg-slate-200">
                                    <Copy className="w-4 h-4" />
                                </button>
                                <button onClick={handleDownloadDoc} className="px-3 py-2 rounded text-sm bg-slate-100 hover:bg-slate-200" title="Baixar como DOCX">
                                    <FileText className="w-4 h-4" />
                                </button>
                                <button onClick={handleDownloadPdf} className="px-3 py-2 rounded text-sm bg-slate-100 hover:bg-slate-200" title="Imprimir como PDF">
                                    <Download className="w-4 h-4" />
                                </button>
                            </>
                        )}
                    </div>
                </div>

                <div className="flex-1 p-8 overflow-y-auto" ref={activityAreaRef} id="activity-area-print">
                    {generatedContent ? (
                        <>
                            {activityType === 'wordsearch' && (
                                <div className="wordsearch-controls mb-6 space-y-3 bg-blue-50 p-4 rounded-lg border border-blue-200 no-print">
                                    <div>
                                        <label className="text-xs font-bold text-blue-700 uppercase tracking-wide">Nome da Atividade</label>
                                        <input
                                            type="text"
                                            value={wordsearchTitle}
                                            onChange={(e) => setWordsearchTitle(e.target.value)}
                                            className="w-full mt-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="Digite o título da atividade"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={wordsearchHideText}
                                                onChange={(e) => {
                                                    setWordsearchHideText(e.target.checked);
                                                    if (e.target.checked) setWordsearchHideGrid(false); // Alterna
                                                }}
                                                className="w-4 h-4 rounded"
                                            />
                                            <span className="text-xs font-bold text-slate-700">Esconder a História (Só o Jogo)</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={wordsearchHideGrid}
                                                onChange={(e) => {
                                                    setWordsearchHideGrid(e.target.checked);
                                                    if (e.target.checked) setWordsearchHideText(false); // Alterna
                                                }}
                                                className="w-4 h-4 rounded"
                                            />
                                            <span className="text-xs font-bold text-slate-700">Esconder o Jogo (Só a História)</span>
                                        </label>
                                    </div>
                                </div>
                            )}

                            {activityType === 'simplify' && musicData ? (
                                <div className="space-y-6">
                                    {/* Card 1: Music Lyrics */}
                                    <div className="bg-white border rounded-lg shadow-sm p-6 relative group">
                                        <div className="absolute top-0 right-0 p-2 opacity-10">
                                            <span className="text-6xl">🎵</span>
                                        </div>
                                        <div className="flex justify-between items-center border-b pb-2 mb-4">
                                            <h2 className="text-xl font-bold text-blue-900">Música do Drácker</h2>
                                            <button
                                                onClick={() => {
                                                    navigator.clipboard.writeText(musicData.lyrics);
                                                    alert('Letra copiada!');
                                                }}
                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors flex items-center gap-1 text-sm font-semibold z-10"
                                                title="Copiar apenas a letra"
                                            >
                                                <Copy className="w-4 h-4" /> Copiar Letra
                                            </button>
                                        </div>
                                        <div className="whitespace-pre-wrap font-sans text-slate-700 text-lg leading-relaxed">
                                            {musicData.lyrics}
                                        </div>
                                    </div>

                                    {/* Card 2: Questions */}
                                    <div className="bg-white border rounded-lg shadow-sm p-6 relative">
                                        <div className="absolute top-0 right-0 p-2 opacity-10">
                                            <span className="text-6xl">📝</span>
                                        </div>
                                        <h2 className="text-xl font-bold text-blue-700 mb-4 border-b pb-2">Perguntas de Interpretação</h2>
                                        <ol className="list-decimal list-inside space-y-4">
                                            {musicData.questions.map((q, idx) => (
                                                <li key={idx} className="text-slate-800 font-medium">
                                                    {q}
                                                    <div className="mt-2 h-8 border-b border-dotted border-slate-300 w-full"></div>
                                                </li>
                                            ))}
                                        </ol>
                                    </div>
                                </div>
                            ) : (
                                <RichTextRenderer
                                    content={generatedContent}
                                    showAnswers={showAnswers}
                                    foundWords={foundWords}
                                    foundPlacements={foundPlacements}
                                    hideText={activityType === 'wordsearch' && wordsearchHideText}
                                    hideGrid={activityType === 'wordsearch' && wordsearchHideGrid}
                                />
                            )}
                        </>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-300">
                            {isLoading ? (
                                <div className="flex flex-col items-center gap-4">
                                    <Brain className="w-12 h-12 animate-bounce text-blue-400" />
                                    <p className="text-slate-500">Criando...</p>
                                </div>
                            ) : (
                                <>
                                    <FileText className="w-12 h-12 mb-4" />
                                    <p className="text-slate-500">Área de Atividades</p>
                                    {isGeneratingAudio && (
                                        <p className="text-xs mt-2 text-blue-400">Processando áudio em background...</p>
                                    )}
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
