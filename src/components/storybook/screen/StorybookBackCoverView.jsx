import React from 'react';
import { Copy, Link } from 'lucide-react';
import { toDirectImageUrl, handleDriveImageError } from '../../../utils/urlUtils';

export const StorybookBackCoverView = ({
    book,
    handleCopyPageText,
    handleOpenMediaModal,
    isEditingText,
    onUpdate,
    currentFontScales,
    currentTextAligns
}) => {
    return (
        <div className="flex-1 p-6 sm:p-12 flex flex-col justify-between bg-white text-center overflow-y-auto">
            <div className="flex justify-end items-center mb-2">
                <div className="flex items-center gap-2 shrink-0">
                    <button
                        type="button"
                        onClick={handleCopyPageText}
                        className="p-1.5 text-stone-400 hover:text-stone-800 hover:bg-stone-100 rounded-xl transition-all cursor-pointer border border-transparent hover:border-stone-200 active:scale-95 shadow-2xs"
                        title="Copiar texto da Conclusão"
                        aria-label="Copiar texto da Conclusão"
                    >
                        <Copy className="w-4 h-4 text-stone-600" />
                    </button>

                    <div className="flex flex-col items-center justify-center bg-white border border-stone-200/90 px-3 py-1 rounded-2xl shadow-2xs shrink-0 select-none leading-tight min-w-[54px]">
                        <span className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider">
                            Final
                        </span>
                        <span className="text-xs font-black text-stone-800">
                            Contracapa
                        </span>
                    </div>
                </div>
            </div>

            {/* Imagem de Contracapa com redimensionamento, alinhamento individual e opção de ocultar se não houver link */}
            {book.backCover?.imageUrl ? (
                <div 
                    className={`w-full flex mb-4 relative group ${
                        currentTextAligns.image === 'left' ? 'justify-start' :
                        currentTextAligns.image === 'right' ? 'justify-end' : 'justify-center'
                    }`}
                >
                    <div className="relative inline-block">
                        <img 
                            src={toDirectImageUrl(book.backCover.imageUrl)} 
                            alt="Logo ou Imagem da Contracapa" 
                            onError={handleDriveImageError}
                            referrerPolicy="no-referrer"
                            style={{
                                width: `${(240 * (currentFontScales.image || 100)) / 100}px`,
                                maxHeight: '38vh'
                            }}
                            className="object-contain transition-all drop-shadow-md mx-auto" 
                        />
                        <button
                            type="button"
                            onClick={() => handleOpenMediaModal('backcover')}
                            className="absolute -top-2 -right-2 p-1.5 bg-white/95 hover:bg-white text-stone-700 rounded-xl border border-stone-200 shadow-sm opacity-0 group-hover:opacity-100 transition-all cursor-pointer flex items-center gap-1 text-[10px] font-bold z-10"
                            title="Trocar imagem ou link do Google Drive da contracapa"
                        >
                            <Link className="w-3 h-3 text-amber-700" />
                            <span>Trocar Imagem</span>
                        </button>
                    </div>
                </div>
            ) : isEditingText ? (
                <div className="w-full flex justify-center mb-4">
                    <button
                        type="button"
                        onClick={() => handleOpenMediaModal('backcover')}
                        className="px-3.5 py-2 border-2 border-dashed border-amber-300 hover:border-amber-500 bg-amber-50/60 hover:bg-amber-100/70 text-amber-900 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shadow-2xs"
                    >
                        <Link className="w-3.5 h-3.5" />
                        <span>+ Adicionar Imagem ou Link do Drive na Contracapa</span>
                    </button>
                </div>
            ) : null}

            {/* Título da Conclusão */}
            {isEditingText ? (
                <div className="mb-3 text-left">
                    <label className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block mb-1">Título da Conclusão:</label>
                    <input
                        type="text"
                        value={book.backCover?.title ?? 'Fim da Nossa Expedição!'}
                        onChange={(e) => {
                            const updatedBook = {
                                ...book,
                                backCover: {
                                    ...(book.backCover || {}),
                                    title: e.target.value
                                }
                            };
                            if (onUpdate) onUpdate(updatedBook);
                        }}
                        className="w-full text-xl sm:text-2xl font-black font-serif text-stone-900 border border-amber-300 rounded-lg p-2 bg-amber-50/50 focus:outline-none focus:ring-2 focus:ring-amber-400"
                        placeholder="Título da Conclusão..."
                    />
                </div>
            ) : (
                <h2 
                    className="font-black text-stone-900 font-serif mb-2 leading-tight"
                    style={{
                        fontSize: `${(26 * currentFontScales.title) / 100}px`,
                        textAlign: currentTextAligns.title || 'center'
                    }}
                >
                    {book.backCover?.title || 'Fim da Nossa Expedição!'}
                </h2>
            )}

            {/* Mensagem / Lição Moral */}
            {isEditingText ? (
                <div className="mb-4 text-left">
                    <label className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block mb-1">Lição Pedagógica / Mensagem de Amizade:</label>
                    <textarea
                        rows={3}
                        value={book.moralLesson || ''}
                        onChange={(e) => {
                            if (onUpdate) onUpdate({ ...book, moralLesson: e.target.value });
                        }}
                        className="w-full text-sm font-serif italic p-2.5 border border-amber-300 rounded-xl bg-amber-50/40 focus:outline-none focus:ring-2 focus:ring-amber-400"
                        placeholder="Digite a mensagem pedagógica final..."
                    />
                </div>
            ) : (
                <p 
                    className="text-stone-600 italic mb-5 leading-relaxed"
                    style={{
                        fontSize: `${(16 * currentFontScales.text) / 100}px`,
                        textAlign: currentTextAligns.text || 'center'
                    }}
                >
                    "{book.moralLesson || 'Aprender juntos na floresta mágica transforma qualquer dúvida em pura descoberta!'}"
                </p>
            )}

            {/* Desafio de Atividade Final */}
            {isEditingText ? (
                <div className="w-full bg-amber-50/60 p-4 rounded-2xl border-2 border-dashed border-amber-300 text-left">
                    <label className="text-xs font-black uppercase text-amber-900 tracking-wider flex items-center gap-1.5 mb-1.5">
                        ✏️ Desafio Prático do Aluno:
                    </label>
                    <textarea
                        rows={3}
                        value={book.backCover?.activity || ''}
                        onChange={(e) => {
                            const updatedBook = {
                                ...book,
                                backCover: {
                                    ...(book.backCover || {}),
                                    activity: e.target.value
                                }
                            };
                            if (onUpdate) onUpdate(updatedBook);
                        }}
                        className="w-full text-xs sm:text-sm font-semibold text-stone-800 p-2.5 border border-amber-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                        placeholder="Digite o desafio prático para a criança..."
                    />
                </div>
            ) : book.backCover?.activity ? (
                <div 
                    className="w-full bg-amber-50/60 p-5 rounded-2xl border-2 border-dashed border-amber-300"
                    style={{
                        textAlign: currentTextAligns.question || 'left'
                    }}
                >
                    <span className="text-xs font-black uppercase text-amber-900 tracking-wider flex items-center gap-1.5 mb-2">
                        ✏️ Desafio Prático do Aluno:
                    </span>
                    <p 
                        className="font-semibold text-stone-800 leading-relaxed"
                        style={{
                            fontSize: `${(13.5 * currentFontScales.question) / 100}px`
                        }}
                    >
                        {book.backCover.activity}
                    </p>
                </div>
            ) : null}

            <div className="text-xs text-stone-400 font-semibold mt-6 pt-3 border-t border-stone-200">
                Drácker Adapta • Livro Infantil Pedagógico
            </div>
        </div>
    );
};
