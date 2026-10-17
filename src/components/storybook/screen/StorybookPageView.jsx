import React from 'react';
import { Copy, Link, Play, X, MessageCircle, HelpCircle } from 'lucide-react';
import { toDirectImageUrl, handleDriveImageError } from '../../../utils/urlUtils';
import { extractYouTubeId } from '../utils/storybookUtils';

export const StorybookPageView = ({
    currentPage,
    currentPageIndex,
    pages,
    book,
    isPlayingVideo,
    setIsPlayingVideo,
    handleOpenMediaModal,
    handleCopyPageText,
    isEditingText,
    isFullscreen,
    onUpdate,
    currentFontScales,
    currentTextAligns
}) => {
    if (!currentPage) return null;

    return (
        <>
            {/* Lado Esquerdo: Área de Desenho / Ilustração ou Vídeo */}
            <div className="flex-1 bg-stone-50/50 p-6 sm:p-8 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-stone-200 relative group overflow-hidden">
                {currentPage.videoUrl && isPlayingVideo ? (
                    <div className="relative w-full h-full min-h-[300px] flex items-center justify-center rounded-2xl overflow-hidden bg-black shadow-lg">
                        <iframe
                            src={`https://www.youtube-nocookie.com/embed/${extractYouTubeId(currentPage.videoUrl)}?autoplay=1&rel=0`}
                            title={`Vídeo da Página ${currentPage.pageNumber}`}
                            className="w-full h-full border-0 rounded-2xl aspect-video"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        />
                        <button
                            onClick={() => setIsPlayingVideo(false)}
                            className="absolute top-3 right-3 p-1.5 bg-black/70 hover:bg-black text-white rounded-lg cursor-pointer transition-colors z-20"
                            title="Fechar vídeo"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                ) : currentPage.imageUrl ? (
                    <div className="relative w-full h-full flex items-center justify-center">
                        <img 
                            src={toDirectImageUrl(currentPage.imageUrl)} 
                            alt={`Página ${currentPage.pageNumber}`} 
                            onError={handleDriveImageError}
                            referrerPolicy="no-referrer"
                            className="w-full h-full max-h-[85vh] object-contain rounded-2xl border border-stone-200 shadow-2xs"
                        />
                        {currentPage.videoUrl && (
                            <button
                                onClick={() => setIsPlayingVideo(true)}
                                className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-red-600/90 hover:bg-red-600 text-white shadow-xl flex items-center justify-center transition-all transform hover:scale-110 active:scale-95 cursor-pointer z-10 group-hover:scale-105"
                                title="Assistir ao vídeo do YouTube"
                            >
                                <Play className="w-8 h-8 fill-current ml-1" />
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center text-center p-6 bg-white rounded-2xl border-2 border-dashed border-stone-300 w-full h-full max-h-[85vh]">
                        <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center p-2 mb-3 shadow-2xs">
                            <img src="/dracker_character.png" alt="Drácker" className="w-full h-full object-contain" />
                        </div>
                        <span className="text-xs font-black text-stone-700 uppercase tracking-wider mb-1">
                            Ilustração da Página {currentPage.pageNumber}
                        </span>
                        <p className="text-xs text-stone-500 max-w-xs italic mb-2">
                            Espaço reservado para colorir ou visualizar imagens da aula!
                        </p>
                    </div>
                )}

                {/* Botão discreto para alterar imagem/YouTube */}
                <button
                    onClick={() => handleOpenMediaModal(currentPage.pageNumber)}
                    className="absolute top-4 right-4 p-2 bg-white/90 hover:bg-white text-stone-600 hover:text-stone-900 rounded-xl border border-stone-200 shadow-xs opacity-80 hover:opacity-100 transition-all cursor-pointer flex items-center gap-1 text-[11px] font-bold z-20"
                    title="Inserir imagem direta ou vídeo do YouTube"
                >
                    <Link className="w-3.5 h-3.5 text-amber-700" />
                    <span>{currentPage.videoUrl ? 'YouTube' : currentPage.imageUrl ? 'Mudar Mídia' : '+ Imagem / YouTube'}</span>
                </button>
            </div>

            {/* Lado Direito: Texto da História em Fundo Branco Limpo e Fluido */}
            <div className={`flex-1 p-6 sm:p-8 md:p-10 flex flex-col ${isFullscreen ? 'justify-center' : 'justify-start'} gap-4 bg-white text-stone-900 overflow-y-auto`}>
                <div className="flex flex-col gap-3.5 my-auto">
                    {/* Cabeçalho da Página */}
                    <div className="flex justify-between items-center pb-2 border-b border-stone-200">
                        {isEditingText ? (
                            <input
                                type="text"
                                value={currentPage.title || `Capítulo ${currentPage.pageNumber}`}
                                onChange={(e) => {
                                    const updatedPages = [...pages];
                                    updatedPages[currentPageIndex - 1] = {
                                        ...currentPage,
                                        title: e.target.value
                                    };
                                    if (onUpdate) onUpdate({ ...book, pages: updatedPages });
                                }}
                                className="text-xl sm:text-2xl font-black text-stone-900 font-serif border border-amber-300 rounded-lg px-2 py-1 bg-amber-50/50 w-full mr-3"
                            />
                        ) : (
                            <h3 
                                className="font-black text-stone-900 font-serif flex-1 pr-3"
                                style={{
                                    fontSize: `${(24 * currentFontScales.title) / 100}px`,
                                    textAlign: currentTextAligns.title || 'left'
                                }}
                            >
                                {currentPage.title || `Capítulo ${currentPage.pageNumber}`}
                            </h3>
                        )}
                        <div className="flex items-center gap-2 shrink-0">
                            <button
                                type="button"
                                onClick={handleCopyPageText}
                                className="p-1.5 text-stone-400 hover:text-stone-800 hover:bg-stone-100 rounded-xl transition-all cursor-pointer border border-transparent hover:border-stone-200 active:scale-95 shadow-2xs"
                                title={`Copiar todo o texto da Página ${currentPage.pageNumber}`}
                                aria-label={`Copiar texto da Página ${currentPage.pageNumber}`}
                            >
                                <Copy className="w-4 h-4 text-stone-600" />
                            </button>

                            <div className="flex flex-col items-center justify-center bg-white border border-stone-200/90 px-3 py-1 rounded-2xl shadow-2xs shrink-0 select-none leading-tight min-w-[54px]">
                                <span className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider">
                                    Página
                                </span>
                                <span className="text-xs font-black text-stone-800">
                                    {currentPage.pageNumber}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Texto da narrativa com controle fluido de fonte e alinhamento */}
                    {isEditingText ? (
                        <textarea
                            rows={8}
                            value={currentPage.text}
                            onChange={(e) => {
                                const updatedPages = [...pages];
                                updatedPages[currentPageIndex - 1] = {
                                    ...currentPage,
                                    text: e.target.value
                                };
                                if (onUpdate) onUpdate({ ...book, pages: updatedPages });
                            }}
                            className="w-full text-base sm:text-lg font-serif leading-relaxed p-3 border border-amber-300 rounded-xl bg-amber-50/30 focus:outline-none focus:ring-2 focus:ring-amber-400"
                            placeholder="Digite ou ajuste o texto da história..."
                        />
                    ) : (
                        <div 
                            className="text-stone-800 leading-relaxed font-serif space-y-2.5 whitespace-pre-line"
                            style={{
                                fontSize: `${(17 * currentFontScales.text) / 100}px`,
                                textAlign: currentTextAligns.text || 'justify'
                            }}
                        >
                            {currentPage.text}
                        </div>
                    )}

                    {/* Fala Marcante do Personagem */}
                    {isEditingText ? (
                        <div className="mt-1">
                            <label className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block mb-1">Fala do Personagem:</label>
                            <input
                                type="text"
                                value={currentPage.dialogue || ''}
                                onChange={(e) => {
                                    const updatedPages = [...pages];
                                    updatedPages[currentPageIndex - 1] = {
                                        ...currentPage,
                                        dialogue: e.target.value
                                    };
                                    if (onUpdate) onUpdate({ ...book, pages: updatedPages });
                                }}
                                placeholder="Fala marcante do personagem..."
                                className="w-full text-sm italic p-2 border border-stone-300 rounded-lg bg-stone-50"
                            />
                        </div>
                    ) : currentPage.dialogue ? (
                        <div 
                            className="mt-1.5 p-3 rounded-xl bg-amber-50/70 border-l-4 border-amber-500 italic text-stone-800 flex items-start gap-2.5 shadow-2xs"
                            style={{
                                fontSize: `${(14 * currentFontScales.dialogue) / 100}px`
                            }}
                        >
                            <MessageCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                            <span 
                                className="w-full"
                                style={{
                                    textAlign: currentTextAligns.dialogue || 'left'
                                }}
                            >
                                "{currentPage.dialogue}"
                            </span>
                        </div>
                    ) : null}
                </div>

                {/* Pergunta Interativa para o Aluno (Desafio de Atenção) */}
                {isEditingText ? (
                    <div className="mt-1 pt-2 border-t border-stone-200">
                        <label className="text-[11px] font-black text-amber-900 uppercase tracking-wider block mb-1">Desafio de Atenção:</label>
                        <input
                            type="text"
                            value={currentPage.interactiveQuestion || ''}
                            onChange={(e) => {
                                const updatedPages = [...pages];
                                updatedPages[currentPageIndex - 1] = {
                                    ...currentPage,
                                    interactiveQuestion: e.target.value
                                };
                                if (onUpdate) onUpdate({ ...book, pages: updatedPages });
                            }}
                            placeholder="Pergunta ou desafio de atenção para a criança..."
                            className="w-full text-xs font-bold p-2 border border-amber-300 rounded-lg bg-amber-50/40"
                        />
                    </div>
                ) : currentPage.interactiveQuestion ? (
                    <div 
                        className="mt-1 pt-3 border-t border-stone-200 flex items-start gap-2.5 font-bold text-stone-900 bg-amber-50/80 p-3 rounded-2xl border border-amber-300 shadow-2xs"
                        style={{
                            fontSize: `${(13 * currentFontScales.question) / 100}px`
                        }}
                    >
                        <HelpCircle className="w-4 h-4 text-amber-800 shrink-0 mt-0.5" />
                        <div 
                            className="w-full"
                            style={{
                                textAlign: currentTextAligns.question || 'left'
                            }}
                        >
                            <span className="uppercase text-[10px] text-amber-900 tracking-wider block font-black mb-0.5">Desafio de Atenção:</span>
                            <span className="leading-snug">{currentPage.interactiveQuestion}</span>
                        </div>
                    </div>
                ) : null}
            </div>
        </>
    );
};
