import React from 'react';
import { Link, X, Check } from 'lucide-react';

export const StorybookMediaModal = ({
    isOpen,
    onClose,
    editingTarget,
    inputMediaUrl,
    setInputMediaUrl,
    onSave
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-60 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between pb-3 border-b border-stone-200">
                    <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-amber-100 text-amber-900">
                            <Link className="w-4 h-4" />
                        </div>
                        <h3 className="text-sm font-black text-stone-900">
                            {editingTarget === 'cover' 
                                ? 'Mídia da Capa' 
                                : editingTarget === 'backcover' 
                                    ? 'Imagem / Logo da Contracapa' 
                                    : `Mídia da Página ${editingTarget}`}
                        </h3>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-1 text-stone-400 hover:text-stone-700 rounded-lg cursor-pointer"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <form onSubmit={onSave} className="mt-4 flex flex-col gap-3">
                    {editingTarget === 'backcover' && (
                        <div className="bg-amber-50/70 border border-amber-200/80 p-3 rounded-xl">
                            <span className="text-[11px] font-black uppercase text-amber-900 block mb-2">
                                ⚡ Escolha Rápida de Imagem / Logo:
                            </span>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    onClick={() => setInputMediaUrl('/dracker_e_seus_amigos.png')}
                                    className="px-2.5 py-1 text-xs font-bold bg-white hover:bg-amber-100 text-stone-800 rounded-lg border border-amber-300 transition-colors cursor-pointer shadow-2xs"
                                >
                                    🐾 Drácker e Amigos (Floresta)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setInputMediaUrl('/dracker_character.png')}
                                    className="px-2.5 py-1 text-xs font-bold bg-white hover:bg-amber-100 text-stone-800 rounded-lg border border-amber-300 transition-colors cursor-pointer shadow-2xs"
                                >
                                    🐲 Drácker Clássico
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setInputMediaUrl('')}
                                    className="px-2.5 py-1 text-xs font-bold bg-white hover:bg-red-50 text-red-700 rounded-lg border border-red-300 transition-colors cursor-pointer shadow-2xs"
                                >
                                    🚫 Não Mostrar Imagem
                                </button>
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-bold text-stone-700 mb-1">
                            {editingTarget === 'backcover' 
                                ? 'Cole o Link da Imagem no Google Drive ou URL Web:' 
                                : 'URL da Imagem ou Link do YouTube:'}
                        </label>
                        <input
                            type="text"
                            value={inputMediaUrl}
                            onChange={(e) => setInputMediaUrl(e.target.value)}
                            placeholder={editingTarget === 'backcover' ? 'https://drive.google.com/file/d/... ou deixe vazio' : 'https://... ou https://www.youtube.com/watch?v=...'}
                            className="w-full text-xs px-3 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-stone-50 focus:bg-white transition-all font-mono"
                            autoFocus
                        />
                        <p className="text-[11px] text-stone-500 mt-1.5 leading-snug">
                            {editingTarget === 'backcover' 
                                ? '💡 Dica: Se não colocar link ou clicar em "Não Mostrar Imagem", nenhuma imagem aparecerá na contracapa!' 
                                : '💡 Dica: Aceita links do Google Drive (compartilhados ou de visualização), imagens diretas da web ou links do YouTube (com capa oficial e QR Code gerados automaticamente)!'}
                        </p>
                    </div>

                    <div className="flex items-center justify-end gap-2 mt-2 pt-3 border-t border-stone-100">
                        <button
                            type="button"
                            onClick={() => {
                                setInputMediaUrl('');
                                onSave();
                            }}
                            className="px-3 py-1.5 text-xs font-semibold text-stone-500 hover:text-red-600 rounded-lg cursor-pointer transition-colors"
                        >
                            Remover Mídia
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                        >
                            <Check className="w-3.5 h-3.5" />
                            <span>Salvar</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
