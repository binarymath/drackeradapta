import React from 'react';
import { Copy, Link, Play, X } from 'lucide-react';
import { toDirectImageUrl, handleDriveImageError } from '../../../utils/urlUtils';
import { extractYouTubeId } from '../utils/storybookUtils';

export const StorybookCoverView = ({
    book,
    isPlayingVideo,
    setIsPlayingVideo,
    handleOpenMediaModal,
    handleCopyPageText,
    isEditingText,
    onUpdate,
    currentFontScales,
    currentTextAligns
}) => {
    return (
        <>
            {/* Texto de Capa Fluido e Equilibrado com Edição */}
            <div className="flex-1 min-h-[40vh] md:min-h-0 p-4 sm:p-8 md:p-10 flex flex-col justify-center bg-white text-stone-900 overflow-visible md:overflow-y-auto border-b md:border-b-0 md:border-r border-stone-200">
                <div>
                    {/* Cabeçalho da Capa com badge e copiar */}
                    <div className="flex justify-end items-center pb-2 mb-3 border-b border-stone-200">
                        <button
                            type="button"
                            onClick={handleCopyPageText}
                            className="p-1.5 text-stone-400 hover:text-stone-800 hover:bg-stone-100 rounded-xl transition-all cursor-pointer border border-transparent hover:border-stone-200 active:scale-95 shadow-2xs"
                            title="Copiar todo o texto da Capa"
                            aria-label="Copiar texto da Capa"
                        >
                            <Copy className="w-4 h-4 text-stone-600" />
                        </button>
                    </div>

                    <div className="flex flex-col gap-3">
                        {isEditingText ? (
                            <div className="flex flex-col gap-2">
                                <input
                                    type="text"
                                    value={book.title || ''}
                                    onChange={(e) => {
                                        if (onUpdate) onUpdate({ ...book, title: e.target.value });
                                    }}
                                    className="text-2xl sm:text-3xl font-black text-stone-900 font-serif border border-amber-300 rounded-lg p-2 bg-amber-50/50"
                                    placeholder="Título do Livro..."
                                />
                                <input
                                    type="text"
                                    value={book.subtitle || ''}
                                    onChange={(e) => {
                                        if (onUpdate) onUpdate({ ...book, subtitle: e.target.value });
                                    }}
                                    className="text-base text-stone-700 italic border border-stone-300 rounded-lg p-2 bg-stone-50"
                                    placeholder="Subtítulo..."
                                />
                            </div>
                        ) : (
                            <>
                                <h1 
                                    className="font-black text-stone-950 font-serif leading-tight"
                                    style={{
                                        fontSize: `${(32 * currentFontScales.title) / 100}px`,
                                        textAlign: currentTextAligns.title || 'left'
                                    }}
                                >
                                    {book.title}
                                </h1>
                                <p 
                                    className="text-stone-600 font-medium italic mt-1"
                                    style={{
                                        fontSize: `${(17 * currentFontScales.title) / 100}px`,
                                        textAlign: currentTextAligns.title || 'left'
                                    }}
                                >
                                    {book.subtitle}
                                </p>
                            </>
                        )}
                    </div>

                    <div className="mt-6 pt-5 border-t border-stone-200 flex flex-col gap-2.5">
                        <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">Sinopse da Aventura:</span>
                        {isEditingText ? (
                            <textarea
                                rows={4}
                                value={book.synopsis || ''}
                                onChange={(e) => {
                                    if (onUpdate) onUpdate({ ...book, synopsis: e.target.value });
                                }}
                                className="w-full text-sm font-sans p-2 border border-amber-300 rounded-lg bg-amber-50/40"
                                placeholder="Sinopse da história..."
                            />
                        ) : (
                            <p 
                                className="text-stone-700 leading-relaxed font-sans"
                                style={{
                                    fontSize: `${(15 * currentFontScales.text) / 100}px`,
                                    textAlign: currentTextAligns.text || 'justify'
                                }}
                            >
                                {book.synopsis || 'Uma jornada inesquecível de descobertas com o Drácker e seus grandes amigos da floresta!'}
                            </p>
                        )}
                        <div className="mt-3 pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500 font-semibold">
                            <span>Drácker Adapta • Livro Didático</span>
                            <span className="bg-amber-100/70 text-amber-900 px-2.5 py-0.5 rounded-full font-bold">Edição Ilustrada</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Imagem de Capa ou Player de Vídeo */}
            <div className="flex-1 min-h-[40vh] md:min-h-0 bg-stone-50/50 p-4 sm:p-8 flex items-center justify-center relative overflow-hidden group">
                {book.cover?.videoUrl && isPlayingVideo ? (
                    <div className="relative w-full h-full min-h-[300px] flex items-center justify-center rounded-2xl overflow-hidden bg-black shadow-lg">
                        <iframe
                            src={`https://www.youtube-nocookie.com/embed/${extractYouTubeId(book.cover.videoUrl)}?autoplay=1&rel=0`}
                            title="Vídeo da Capa"
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
                ) : book.cover?.imageUrl ? (
                    <div className="relative w-full h-full flex items-center justify-center">
                        <img 
                            src={toDirectImageUrl(book.cover.imageUrl)} 
                            alt="Capa do Livro" 
                            onError={handleDriveImageError}
                            referrerPolicy="no-referrer"
                            className="w-full h-full max-h-[85vh] object-contain rounded-2xl border border-stone-200 shadow-2xs"
                        />
                        {book.cover.videoUrl && (
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
                        <div className="p-3 rounded-full bg-amber-50 border border-amber-200 mb-3 shadow-2xs">
                            <img src="/dracker_character.png" alt="Drácker" className="w-24 h-24 object-contain" />
                        </div>
                        <span className="text-sm font-black text-stone-800 mb-1">Capa do Livro Infantil</span>
                        <p className="text-xs text-stone-500 max-w-xs mb-3">
                            Pronto para leitura interativa e economia de tinta na impressão escolar.
                        </p>
                    </div>
                )}

                {/* Botão discreto para alterar imagem/YouTube */}
                <button
                    onClick={() => handleOpenMediaModal('cover')}
                    className="absolute top-4 right-4 p-2 bg-white/90 hover:bg-white text-stone-600 hover:text-stone-900 rounded-xl border border-stone-200 shadow-xs opacity-80 hover:opacity-100 transition-all cursor-pointer flex items-center gap-1 text-[11px] font-bold z-20"
                    title="Inserir imagem direta ou link do YouTube"
                >
                    <Link className="w-3.5 h-3.5 text-amber-700" />
                    <span>{book.cover?.videoUrl ? 'YouTube' : book.cover?.imageUrl ? 'Mudar Mídia' : '+ Imagem / YouTube'}</span>
                </button>
            </div>
        </>
    );
};
