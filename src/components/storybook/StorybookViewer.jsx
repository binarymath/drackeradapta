import React, { useState, useEffect } from 'react';
import { 
    BookOpen, 
    ChevronLeft, 
    ChevronRight, 
    Printer, 
    Maximize2, 
    Minimize2, 
    Link, 
    Youtube, 
    HelpCircle, 
    MessageCircle,
    X,
    Check,
    Play,
    Pause,
    Edit3,
    AlignLeft,
    AlignCenter,
    AlignRight,
    AlignJustify,
    Type
} from 'lucide-react';
import { toast } from '../ui/Toast';

// Utilitário para extrair ID do vídeo do YouTube
const extractYouTubeId = (url) => {
    if (!url) return null;
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    return match ? match[1] : null;
};

export const StorybookViewer = ({ data, onUpdate }) => {
    const book = data || {};
    const pages = book.pages || [];

    // Estado da visualização
    // 0 = Capa
    // 1 .. pages.length = Páginas de conteúdo
    // pages.length + 1 = Contracapa
    const [currentPageIndex, setCurrentPageIndex] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [flipDirection, setFlipDirection] = useState('next'); // 'next' | 'prev'
    const [isFlipping, setIsFlipping] = useState(false);

    // Modal discreto para adicionar/editar URL de Imagem ou Vídeo do YouTube
    const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
    const [editingTarget, setEditingTarget] = useState(null); // 'cover' ou número da página
    const [inputMediaUrl, setInputMediaUrl] = useState('');
    const [isPlayingVideo, setIsPlayingVideo] = useState(false);

    // Barra de ferramentas de texto (Tamanho da fonte, Alinhamento e Edição de Texto)
    const [fontScale, setFontScale] = useState(140); // porcentagem (ex: 140%)
    const [textAlign, setTextAlign] = useState('justify'); // 'left' | 'center' | 'right' | 'justify'
    const [isEditingText, setIsEditingText] = useState(false);

    const totalViews = pages.length + 2; // Capa + Páginas + Contracapa
    const isCover = currentPageIndex === 0;
    const isBackCover = currentPageIndex === totalViews - 1;
    const currentPage = !isCover && !isBackCover ? pages[currentPageIndex - 1] : null;

    // Atalho Escape para sair do modo tela cheia
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isFullscreen) {
                setIsFullscreen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isFullscreen]);

    // Navegação com efeito refinado de folheada
    const changePage = (newIndex, direction) => {
        if (newIndex < 0 || newIndex >= totalViews || isFlipping || newIndex === currentPageIndex) return;
        setIsPlayingVideo(false);
        setFlipDirection(direction);
        setIsFlipping(true);
        setTimeout(() => {
            setCurrentPageIndex(newIndex);
            setTimeout(() => {
                setIsFlipping(false);
            }, 300);
        }, 150);
    };

    // Abre o modal discreto para configurar imagem ou vídeo do YouTube
    const handleOpenMediaModal = (target) => {
        setEditingTarget(target);
        if (target === 'cover') {
            setInputMediaUrl(book.cover?.videoUrl || book.cover?.imageUrl || '');
        } else {
            const pageItem = pages[target - 1];
            setInputMediaUrl(pageItem?.videoUrl || pageItem?.imageUrl || '');
        }
        setIsMediaModalOpen(true);
    };

    // Salva a URL de mídia (com detecção automática de YouTube)
    const handleSaveMedia = (e) => {
        e?.preventDefault();
        const trimmedUrl = inputMediaUrl.trim();
        const ytId = extractYouTubeId(trimmedUrl);

        let finalImageUrl = trimmedUrl;
        let finalVideoUrl = null;

        if (ytId) {
            finalVideoUrl = `https://www.youtube.com/watch?v=${ytId}`;
            // Pega a thumbnail oficial do YouTube em alta resolução
            finalImageUrl = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
        }

        if (editingTarget === 'cover') {
            const updatedBook = {
                ...book,
                cover: {
                    ...book.cover,
                    imageUrl: finalImageUrl || undefined,
                    videoUrl: finalVideoUrl || undefined
                }
            };
            if (onUpdate) onUpdate(updatedBook);
        } else {
            const updatedPages = [...pages];
            const pageIdx = editingTarget - 1;
            updatedPages[pageIdx] = {
                ...updatedPages[pageIdx],
                imageUrl: finalImageUrl || undefined,
                videoUrl: finalVideoUrl || undefined
            };
            const updatedBook = { ...book, pages: updatedPages };
            if (onUpdate) onUpdate(updatedBook);
        }

        toast(ytId ? 'Vídeo do YouTube e QR Code vinculados com sucesso!' : 'Imagem atualizada com sucesso!');
        setIsMediaModalOpen(false);
    };

    // Imprimir o livro no navegador (modo folheto paisagem)
    const handlePrint = () => {
        window.print();
    };

    return (
        <div className={`transition-all duration-300 w-full ${
            isFullscreen 
                ? 'fixed inset-0 z-50 bg-amber-50/70 backdrop-blur-md flex flex-col justify-between p-3 sm:p-5 h-screen w-screen overflow-hidden' 
                : 'flex flex-col gap-4 max-w-5xl mx-auto py-2'
        }`}>
            
            {/* Barra de Ferramentas Superior (Clean e Discreta) */}
            <div className={`flex items-center justify-between gap-3 bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-amber-200/80 shadow-xs no-print w-full shrink-0`}>
                <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center text-white shadow-2xs shrink-0">
                        <BookOpen className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                        <h2 className="text-xs sm:text-sm md:text-base font-black text-brown-950 truncate">
                            {book.title || 'Livro Infantil do Drácker'}
                        </h2>
                        <div className="flex items-center gap-2 text-[11px] text-brown-600 font-semibold">
                            <span className="bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded-md font-bold uppercase text-[9px]">
                                {book.theme || 'História'}
                            </span>
                            <span>•</span>
                            <span>{pages.length} páginas</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    {/* Barra de Formatação e Edição Rápida (Idêntica ao layout desejado) */}
                    <div className="flex items-center gap-2 bg-stone-50 border border-stone-200/90 rounded-xl p-1 shadow-2xs">
                        {/* Controle de Fonte */}
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-bold text-stone-700">
                            <span className="text-stone-400 font-semibold text-[11px] hidden sm:inline">Fonte:</span>
                            <button
                                type="button"
                                onClick={() => setFontScale(prev => Math.max(90, prev - 10))}
                                className="px-1.5 py-0.5 rounded hover:bg-white text-stone-800 font-black cursor-pointer transition-colors"
                                title="Diminuir fonte"
                            >
                                A-
                            </button>
                            <span className="text-indigo-600 font-mono font-extrabold text-xs min-w-[36px] text-center">
                                {fontScale}%
                            </span>
                            <button
                                type="button"
                                onClick={() => setFontScale(prev => Math.min(200, prev + 10))}
                                className="px-1.5 py-0.5 rounded hover:bg-white text-stone-800 font-black cursor-pointer transition-colors"
                                title="Aumentar fonte"
                            >
                                A+
                            </button>
                        </div>

                        {/* Alinhamentos */}
                        <div className="flex items-center gap-0.5 border-l border-stone-200 pl-1">
                            <button
                                type="button"
                                onClick={() => setTextAlign('left')}
                                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${textAlign === 'left' ? 'bg-indigo-100 text-indigo-700 shadow-2xs' : 'text-stone-500 hover:text-stone-800'}`}
                                title="Alinhar à esquerda"
                            >
                                <AlignLeft className="w-3.5 h-3.5" />
                            </button>
                            <button
                                type="button"
                                onClick={() => setTextAlign('center')}
                                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${textAlign === 'center' ? 'bg-indigo-100 text-indigo-700 shadow-2xs' : 'text-stone-500 hover:text-stone-800'}`}
                                title="Centralizar texto"
                            >
                                <AlignCenter className="w-3.5 h-3.5" />
                            </button>
                            <button
                                type="button"
                                onClick={() => setTextAlign('right')}
                                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${textAlign === 'right' ? 'bg-indigo-100 text-indigo-700 shadow-2xs' : 'text-stone-500 hover:text-stone-800'}`}
                                title="Alinhar à direita"
                            >
                                <AlignRight className="w-3.5 h-3.5" />
                            </button>
                            <button
                                type="button"
                                onClick={() => setTextAlign('justify')}
                                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${textAlign === 'justify' ? 'bg-indigo-100 text-indigo-700 shadow-2xs' : 'text-stone-500 hover:text-stone-800'}`}
                                title="Justificar texto"
                            >
                                <AlignJustify className="w-3.5 h-3.5" />
                            </button>
                        </div>

                        {/* Botão de Edição Lápis */}
                        <div className="border-l border-stone-200 pl-1">
                            <button
                                type="button"
                                onClick={() => setIsEditingText(prev => !prev)}
                                className={`p-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${isEditingText ? 'bg-amber-500 text-white shadow-2xs' : 'text-indigo-600 hover:bg-indigo-50'}`}
                                title={isEditingText ? 'Concluir edição' : 'Editar texto da história'}
                            >
                                {isEditingText ? <Check className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
                            </button>
                        </div>
                    </div>

                    {/* Botão de Tela Cheia 100% */}
                    <button
                        onClick={() => setIsFullscreen(prev => !prev)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl border border-stone-200 transition-all cursor-pointer active:scale-95"
                        title={isFullscreen ? 'Restaurar visualização normal (Esc)' : 'Ocupar 100% da tela'}
                    >
                        {isFullscreen ? (
                            <>
                                <Minimize2 className="w-3.5 h-3.5 text-stone-600" />
                                <span className="hidden sm:inline">Restaurar</span>
                            </>
                        ) : (
                            <>
                                <Maximize2 className="w-3.5 h-3.5 text-stone-600" />
                                <span className="hidden sm:inline">100% Tela</span>
                            </>
                        )}
                    </button>

                    {/* Botão de Impressão */}
                    <button
                        onClick={handlePrint}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-black text-brown-950 bg-amber-200/80 hover:bg-amber-300 rounded-xl border border-amber-300 shadow-2xs transition-all cursor-pointer active:scale-95"
                        title="Imprimir todas as páginas em A4 Paisagem"
                    >
                        <Printer className="w-3.5 h-3.5 text-amber-900" />
                        <span className="hidden sm:inline">Imprimir (A4 Paisagem)</span>
                        <span className="sm:hidden">Imprimir</span>
                    </button>
                </div>
            </div>

            {/* Estilos de Impressão A4 Paisagem 100% (Sem Folhas em Branco, Divisão 50/50 Perfeita) */}
            <style>{`
                @media print {
                    @page {
                        size: A4 landscape;
                        margin: 0 !important;
                    }
                    html, body {
                        margin: 0 !important;
                        padding: 0 !important;
                        background: white !important;
                        color: black !important;
                        width: 297mm !important;
                        height: 210mm !important;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                    .no-print {
                        display: none !important;
                    }
                    .storybook-screen-view {
                        display: none !important;
                    }
                    .storybook-print-container {
                        display: block !important;
                        margin: 0 !important;
                        padding: 0 !important;
                    }
                    .storybook-print-page {
                        page-break-inside: avoid !important;
                        break-inside: avoid !important;
                        page-break-after: page !important;
                        break-after: page !important;
                        width: 297mm !important;
                        height: 210mm !important;
                        max-width: 297mm !important;
                        max-height: 210mm !important;
                        padding: 8mm 12mm !important;
                        box-sizing: border-box !important;
                        background: white !important;
                        color: black !important;
                        overflow: hidden !important;
                        display: flex !important;
                        flex-direction: row !important;
                        align-items: stretch !important;
                    }
                    .storybook-print-page:last-child {
                        page-break-after: avoid !important;
                        break-after: avoid !important;
                    }
                    .print-half-page {
                        width: 50% !important;
                        max-width: 50% !important;
                        flex: 0 0 50% !important;
                        box-sizing: border-box !important;
                        height: 100% !important;
                    }
                }

                @media screen {
                    .storybook-print-container {
                        display: none;
                    }

                    /* Efeito de abertura suave e folheada de página (Clean Book Flip) */
                    .page-turn-next {
                        animation: smoothFlipNext 0.4s cubic-bezier(0.25, 1, 0.5, 1) forwards;
                    }
                    .page-turn-prev {
                        animation: smoothFlipPrev 0.4s cubic-bezier(0.25, 1, 0.5, 1) forwards;
                    }
                }

                @keyframes smoothFlipNext {
                    0% {
                        opacity: 0.5;
                        transform: translateX(18px) scale(0.99);
                        filter: blur(0.5px);
                    }
                    100% {
                        opacity: 1;
                        transform: translateX(0) scale(1);
                        filter: blur(0);
                    }
                }

                @keyframes smoothFlipPrev {
                    0% {
                        opacity: 0.5;
                        transform: translateX(-18px) scale(0.99);
                        filter: blur(0.5px);
                    }
                    100% {
                        opacity: 1;
                        transform: translateX(0) scale(1);
                        filter: blur(0);
                    }
                }
            `}</style>

            {/* --- VISUALIZADOR DE TELA (100% Altura/Largura quando Fullscreen) --- */}
            <div className={`storybook-screen-view relative w-full flex-1 flex flex-col justify-between bg-white rounded-3xl border-2 border-amber-200/90 shadow-xl overflow-hidden ${
                isFullscreen ? 'h-full min-h-0' : 'aspect-[16/10] min-h-[520px]'
            }`}>
                
                {/* Linha discreta de Vinco Central com Sombreamento de Livro Aberto */}
                <div className="absolute inset-y-0 left-1/2 w-6 -ml-3 bg-gradient-to-r from-stone-200/0 via-stone-300/40 to-stone-200/0 pointer-events-none z-30 hidden md:block" />
                <div className="absolute inset-y-0 left-1/2 w-px bg-stone-200 pointer-events-none z-30 hidden md:block" />

                {/* Conteúdo Dinâmico com Transição Suave */}
                <div className={`flex-1 flex flex-col md:flex-row h-full overflow-hidden ${
                    isFlipping ? (flipDirection === 'next' ? 'page-turn-next' : 'page-turn-prev') : ''
                }`}>

                    {/* --- CONTEÚDO: CAPA LIMPA --- */}
                    {isCover && (
                        <>
                            {/* Imagem de Capa ou Player de Vídeo */}
                            <div className="flex-1 bg-stone-50/50 p-6 sm:p-8 flex items-center justify-center relative border-b md:border-b-0 md:border-r border-stone-200 overflow-hidden group">
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
                                            src={book.cover.imageUrl} 
                                            alt="Capa do Livro" 
                                            className="w-full h-full max-h-[85vh] object-contain rounded-2xl border border-stone-200 shadow-2xs"
                                        />
                                        {/* Botão de Play se for vídeo do YouTube */}
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

                            {/* Texto de Capa Fluido e Equilibrado com Edição */}
                            <div className="flex-1 p-6 sm:p-8 md:p-10 flex flex-col justify-center bg-white text-stone-900 overflow-y-auto">
                                <div>
                                    {/* Barra de Formatação e Edição Exclusiva da Tela (Oculta no PDF/Impressão) */}
                                    <div className="flex items-center justify-between pb-3 mb-4 border-b border-stone-100 no-print select-none">
                                        {/* Controle de Tamanho de Fonte: A- 140% A+ */}
                                        <div className="flex items-center gap-1.5 bg-stone-100/80 hover:bg-stone-100 px-2.5 py-1 rounded-xl border border-stone-200/80 text-xs font-bold text-stone-700">
                                            <span className="text-stone-400 font-semibold text-[11px]">Fonte:</span>
                                            <button
                                                type="button"
                                                onClick={() => setFontScale(prev => Math.max(90, prev - 10))}
                                                className="px-1.5 py-0.5 rounded hover:bg-white text-stone-800 font-black cursor-pointer transition-colors"
                                                title="Diminuir fonte"
                                            >
                                                A-
                                            </button>
                                            <span className="text-indigo-600 font-mono font-extrabold text-xs min-w-[38px] text-center">
                                                {fontScale}%
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => setFontScale(prev => Math.min(200, prev + 10))}
                                                className="px-1.5 py-0.5 rounded hover:bg-white text-stone-800 font-black cursor-pointer transition-colors"
                                                title="Aumentar fonte"
                                            >
                                                A+
                                            </button>
                                        </div>

                                        {/* Controles de Alinhamento e Botão de Edição */}
                                        <div className="flex items-center gap-1 bg-stone-100/80 p-0.5 rounded-xl border border-stone-200/80">
                                            <button
                                                type="button"
                                                onClick={() => setTextAlign('left')}
                                                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${textAlign === 'left' ? 'bg-indigo-100 text-indigo-700 shadow-2xs' : 'text-stone-500 hover:text-stone-800'}`}
                                                title="Alinhar à esquerda"
                                            >
                                                <AlignLeft className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setTextAlign('center')}
                                                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${textAlign === 'center' ? 'bg-indigo-100 text-indigo-700 shadow-2xs' : 'text-stone-500 hover:text-stone-800'}`}
                                                title="Centralizar texto"
                                            >
                                                <AlignCenter className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setTextAlign('right')}
                                                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${textAlign === 'right' ? 'bg-indigo-100 text-indigo-700 shadow-2xs' : 'text-stone-500 hover:text-stone-800'}`}
                                                title="Alinhar à direita"
                                            >
                                                <AlignRight className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setTextAlign('justify')}
                                                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${textAlign === 'justify' ? 'bg-indigo-100 text-indigo-700 shadow-2xs' : 'text-stone-500 hover:text-stone-800'}`}
                                                title="Justificar texto"
                                            >
                                                <AlignJustify className="w-3.5 h-3.5" />
                                            </button>

                                            <div className="w-px h-4 bg-stone-300 mx-0.5" />

                                            {/* Alternar Edição do Texto da Capa */}
                                            <button
                                                type="button"
                                                onClick={() => setIsEditingText(prev => !prev)}
                                                className={`p-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${isEditingText ? 'bg-amber-500 text-white shadow-2xs' : 'text-indigo-600 hover:bg-indigo-50'}`}
                                                title={isEditingText ? 'Concluir edição' : 'Editar texto da história'}
                                            >
                                                {isEditingText ? <Check className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-3">
                                        <span className="text-[11px] font-black uppercase tracking-wider border border-stone-300 text-stone-600 px-3 py-1 rounded-md self-start">
                                            {book.theme || 'História Pedagógica'}
                                        </span>
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
                                                <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-stone-950 font-serif leading-tight">
                                                    {book.title}
                                                </h1>
                                                <p className="text-base sm:text-lg text-stone-600 font-medium italic">
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
                                                    fontSize: `${(15 * fontScale) / 100}px`,
                                                    textAlign: textAlign
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
                        </>
                    )}

                    {/* --- CONTEÚDO: PÁGINAS INTERNAS (1 a 10+) --- */}
                    {currentPage && (
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
                                            src={currentPage.imageUrl} 
                                            alt={`Página ${currentPage.pageNumber}`} 
                                            className="w-full h-full max-h-[85vh] object-contain rounded-2xl border border-stone-200 shadow-2xs"
                                        />
                                        {/* Botão de Play se for vídeo do YouTube */}
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
                            <div className="flex-1 p-6 sm:p-8 md:p-10 flex flex-col justify-between bg-white text-stone-900 overflow-y-auto">
                                <div>
                                    {/* Barra de Formatação e Edição Exclusiva da Tela (Oculta no PDF/Impressão) */}
                                    <div className="flex items-center justify-between pb-3 mb-4 border-b border-stone-100 no-print select-none">
                                        {/* Controle de Tamanho de Fonte: A- 140% A+ */}
                                        <div className="flex items-center gap-1.5 bg-stone-100/80 hover:bg-stone-100 px-2.5 py-1 rounded-xl border border-stone-200/80 text-xs font-bold text-stone-700">
                                            <span className="text-stone-400 font-semibold text-[11px]">Fonte:</span>
                                            <button
                                                type="button"
                                                onClick={() => setFontScale(prev => Math.max(90, prev - 10))}
                                                className="px-1.5 py-0.5 rounded hover:bg-white text-stone-800 font-black cursor-pointer transition-colors"
                                                title="Diminuir fonte"
                                            >
                                                A-
                                            </button>
                                            <span className="text-indigo-600 font-mono font-extrabold text-xs min-w-[38px] text-center">
                                                {fontScale}%
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => setFontScale(prev => Math.min(200, prev + 10))}
                                                className="px-1.5 py-0.5 rounded hover:bg-white text-stone-800 font-black cursor-pointer transition-colors"
                                                title="Aumentar fonte"
                                            >
                                                A+
                                            </button>
                                        </div>

                                        {/* Controles de Alinhamento e Botão de Edição */}
                                        <div className="flex items-center gap-1 bg-stone-100/80 p-0.5 rounded-xl border border-stone-200/80">
                                            <button
                                                type="button"
                                                onClick={() => setTextAlign('left')}
                                                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${textAlign === 'left' ? 'bg-indigo-100 text-indigo-700 shadow-2xs' : 'text-stone-500 hover:text-stone-800'}`}
                                                title="Alinhar à esquerda"
                                            >
                                                <AlignLeft className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setTextAlign('center')}
                                                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${textAlign === 'center' ? 'bg-indigo-100 text-indigo-700 shadow-2xs' : 'text-stone-500 hover:text-stone-800'}`}
                                                title="Centralizar texto"
                                            >
                                                <AlignCenter className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setTextAlign('right')}
                                                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${textAlign === 'right' ? 'bg-indigo-100 text-indigo-700 shadow-2xs' : 'text-stone-500 hover:text-stone-800'}`}
                                                title="Alinhar à direita"
                                            >
                                                <AlignRight className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setTextAlign('justify')}
                                                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${textAlign === 'justify' ? 'bg-indigo-100 text-indigo-700 shadow-2xs' : 'text-stone-500 hover:text-stone-800'}`}
                                                title="Justificar texto"
                                            >
                                                <AlignJustify className="w-3.5 h-3.5" />
                                            </button>

                                            <div className="w-px h-4 bg-stone-300 mx-0.5" />

                                            {/* Alternar Edição do Texto */}
                                            <button
                                                type="button"
                                                onClick={() => setIsEditingText(prev => !prev)}
                                                className={`p-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${isEditingText ? 'bg-amber-500 text-white shadow-2xs' : 'text-indigo-600 hover:bg-indigo-50'}`}
                                                title={isEditingText ? 'Concluir edição' : 'Editar texto da história'}
                                            >
                                                {isEditingText ? <Check className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Cabeçalho da Página */}
                                    <div className="flex justify-between items-center mb-4 pb-2.5 border-b border-stone-200">
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
                                            <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-stone-900 font-serif">
                                                {currentPage.title || `Capítulo ${currentPage.pageNumber}`}
                                            </h3>
                                        )}
                                        <span className="text-xs font-mono font-bold text-stone-600 bg-amber-100/60 border border-amber-300 px-3 py-1 rounded-full shrink-0">
                                            Página {currentPage.pageNumber}
                                        </span>
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
                                            className="text-stone-800 leading-relaxed font-serif space-y-4 whitespace-pre-line"
                                            style={{
                                                fontSize: `${(17 * fontScale) / 100}px`,
                                                textAlign: textAlign
                                            }}
                                        >
                                            {currentPage.text}
                                        </div>
                                    )}

                                    {/* Fala Marcante do Personagem */}
                                    {isEditingText ? (
                                        <div className="mt-4">
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
                                        <div className="mt-5 p-3.5 rounded-xl bg-amber-50/70 border-l-4 border-amber-500 text-sm sm:text-base italic text-stone-800 flex items-start gap-2.5 shadow-2xs">
                                            <MessageCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                                            <span>"{currentPage.dialogue}"</span>
                                        </div>
                                    ) : null}
                                </div>

                                {/* Pergunta Interativa para o Aluno (Desafio de Atenção) */}
                                {isEditingText ? (
                                    <div className="mt-5 pt-3 border-t border-stone-200">
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
                                    <div className="mt-6 pt-3.5 border-t border-stone-200 flex items-start gap-3 text-xs sm:text-sm font-bold text-stone-900 bg-amber-50/80 p-3.5 rounded-2xl border border-amber-300 shadow-2xs">
                                        <HelpCircle className="w-5 h-5 text-amber-800 shrink-0 mt-0.5" />
                                        <div>
                                            <span className="uppercase text-[11px] text-amber-900 tracking-wider block font-black mb-0.5">Desafio de Atenção:</span>
                                            <span className="leading-snug">{currentPage.interactiveQuestion}</span>
                                        </div>
                                    </div>
                                ) : null}
                            </div>
                        </>
                    )}

                    {/* --- CONTEÚDO: CONTRACAPA LIMPA --- */}
                    {isBackCover && (
                        <div className="flex-1 p-6 sm:p-12 flex flex-col justify-between bg-white text-center overflow-y-auto">
                            <div className="max-w-2xl mx-auto flex flex-col items-center">
                                <img src="/dracker_character.png" alt="Drácker" className="w-16 h-16 sm:w-20 sm:h-20 object-contain mb-3" />
                                <h2 className="text-xl sm:text-3xl font-black text-stone-900 font-serif mb-2">
                                    Fim da Nossa Expedição!
                                </h2>
                                <p className="text-sm sm:text-base text-stone-600 italic max-w-lg mb-5">
                                    "{book.moralLesson || 'Aprender juntos na floresta mágica transforma qualquer dúvida em pura descoberta!'}"
                                </p>

                                {/* Desafio de Atividade Final */}
                                {book.backCover?.activity && (
                                    <div className="w-full bg-amber-50/60 p-5 rounded-2xl border-2 border-dashed border-amber-300 text-left">
                                        <span className="text-xs font-black uppercase text-amber-900 tracking-wider flex items-center gap-1.5 mb-2">
                                            ✏️ Desafio Prático do Aluno:
                                        </span>
                                        <p className="text-xs sm:text-sm font-semibold text-stone-800 leading-relaxed">
                                            {book.backCover.activity}
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="text-xs text-stone-400 font-semibold mt-6 pt-3 border-t border-stone-200">
                                Drácker Adapta • Livro Infantil Pedagógico
                            </div>
                        </div>
                    )}
                </div>

                {/* Barra Inferior de Navegação de Páginas (Paginador) */}
                <div className="bg-white/95 backdrop-blur-md px-4 sm:px-6 py-2.5 sm:py-3 border-t border-stone-200 flex items-center justify-between z-40 shrink-0 no-print">
                    <button
                        onClick={() => changePage(currentPageIndex - 1, 'prev')}
                        disabled={currentPageIndex === 0 || isFlipping}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl font-bold text-xs text-brown-700 hover:bg-amber-100 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                    >
                        <ChevronLeft className="w-4 h-4" />
                        <span className="hidden sm:inline">Página Anterior</span>
                    </button>

                    <div className="flex items-center gap-1 sm:gap-1.5">
                        {Array.from({ length: totalViews }).map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => changePage(idx, idx > currentPageIndex ? 'next' : 'prev')}
                                disabled={isFlipping}
                                className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full transition-all cursor-pointer ${
                                    currentPageIndex === idx 
                                        ? 'bg-amber-600 scale-125 shadow-2xs' 
                                        : 'bg-stone-300 hover:bg-amber-300'
                                }`}
                                title={idx === 0 ? 'Capa' : idx === totalViews - 1 ? 'Contracapa' : `Página ${idx}`}
                            />
                        ))}
                        <span className="text-xs font-extrabold text-brown-800 ml-2 font-mono">
                            {currentPageIndex === 0 ? 'Capa' : currentPageIndex === totalViews - 1 ? 'Contracapa' : `${currentPageIndex} de ${pages.length}`}
                        </span>
                    </div>

                    <button
                        onClick={() => changePage(currentPageIndex + 1, 'next')}
                        disabled={currentPageIndex === totalViews - 1 || isFlipping}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl font-bold text-xs text-brown-700 hover:bg-amber-100 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                    >
                        <span className="hidden sm:inline">Próxima Página</span>
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* --- CONTAINER DE IMPRESSÃO (A4 Paisagem 100% - Divisão Exata 50/50) --- */}
            <div className="storybook-print-container">
                {/* 1. Capa Impressa */}
                <div className="storybook-print-page">
                    <div className="print-half-page p-6 flex flex-col items-center justify-center border-r border-stone-300 relative h-full">
                        {book.cover?.imageUrl ? (
                            <img 
                                src={book.cover.imageUrl} 
                                alt="Capa" 
                                className="max-h-[170mm] max-w-[95%] object-contain"
                            />
                        ) : (
                            <div className="text-center">
                                <img src="/dracker_character.png" alt="Drácker" className="w-28 h-28 object-contain mx-auto mb-3" />
                                <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Desenho / Ilustração da Capa</span>
                            </div>
                        )}
                        {book.cover?.videoUrl && (
                            <div className="absolute bottom-3 right-3 bg-white p-2 border border-stone-400 rounded-lg flex items-center gap-2">
                                <img 
                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(book.cover.videoUrl)}`} 
                                    alt="QR Code" 
                                    className="w-12 h-12"
                                />
                                <span className="text-[9px] font-bold text-stone-700 leading-tight">Vídeo Complementar<br/>da História</span>
                            </div>
                        )}
                    </div>
                    <div className="print-half-page p-8 sm:p-10 flex flex-col justify-center h-full">
                        <div>
                            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-600 border border-stone-400 px-3 py-1 rounded">
                                {book.theme || 'História Pedagógica'}
                            </span>
                            <h1 className="text-4xl sm:text-5xl font-black font-serif text-black mt-4 leading-tight">
                                {book.title}
                            </h1>
                            <p className="text-lg sm:text-xl text-stone-700 font-medium italic mt-2">
                                {book.subtitle}
                            </p>
                        </div>
                        <div className="border-t border-stone-300 pt-5 mt-6">
                            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Sinopse da Aventura:</span>
                            <p className="text-sm sm:text-base text-stone-800 mt-2 leading-relaxed text-justify">
                                {book.synopsis}
                            </p>
                            <div className="mt-6 pt-3 border-t border-stone-200 flex items-center justify-between text-xs text-stone-500 font-bold">
                                <span>Drácker Adapta • Livro Infantil</span>
                                <span className="border border-stone-400 px-2 py-0.5 rounded">Edição Escolar</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Todas as Páginas Internas Sequenciais (1 a 10+) */}
                {pages.map((p) => (
                    <div key={p.pageNumber} className="storybook-print-page">
                        {/* Ilustração / QR Code à Esquerda (50%) */}
                        <div className="print-half-page p-6 flex flex-col items-center justify-center border-r border-stone-300 relative h-full">
                            {p.imageUrl ? (
                                <img 
                                    src={p.imageUrl} 
                                    alt={`Página ${p.pageNumber}`} 
                                    className="max-h-[170mm] max-w-[95%] object-contain"
                                />
                            ) : (
                                <div className="text-center border-2 border-dashed border-stone-300 p-6 rounded-2xl w-full h-full flex flex-col items-center justify-center">
                                    <img src="/dracker_character.png" alt="Drácker" className="w-20 h-20 object-contain mb-2" />
                                    <span className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                                        Ilustração da Página {p.pageNumber}
                                    </span>
                                    <p className="text-[11px] text-stone-500 mt-1">
                                        Área reservada para o aluno colorir.
                                    </p>
                                </div>
                            )}

                            {/* QR Code impresso no canto se houver vídeo vinculado */}
                            {p.videoUrl && (
                                <div className="absolute bottom-3 right-3 bg-white p-2 border border-stone-400 rounded-lg flex items-center gap-2">
                                    <img 
                                        src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(p.videoUrl)}`} 
                                        alt="QR Code" 
                                        className="w-12 h-12"
                                    />
                                    <span className="text-[9px] font-bold text-stone-700 leading-tight">
                                        Vídeo da Página<br/>(Aponte a câmera)
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Texto e Desafio de Atenção à Direita (50% - Fluido e Bem Preenchido) */}
                        <div className="print-half-page p-8 sm:p-10 flex flex-col justify-between h-full">
                            <div>
                                <div className="flex justify-between items-center border-b border-stone-300 pb-2.5 mb-4">
                                    <h2 className="text-2xl sm:text-3xl font-black font-serif text-black">
                                        {p.title || `Capítulo ${p.pageNumber}`}
                                    </h2>
                                    <span className="text-xs font-mono font-bold text-stone-700 border border-stone-400 px-3 py-1 rounded-full">
                                        Página {p.pageNumber}
                                    </span>
                                </div>

                                <div className="text-base sm:text-lg font-serif text-stone-900 leading-relaxed whitespace-pre-line text-justify">
                                    {p.text}
                                </div>

                                {p.dialogue && (
                                    <div className="mt-4 p-3 bg-stone-50 border-l-4 border-stone-500 text-sm italic text-stone-800">
                                        "{p.dialogue}"
                                    </div>
                                )}
                            </div>

                            {/* Desafio de Atenção Obrigatório */}
                            {p.interactiveQuestion && (
                                <div className="mt-5 p-4 border border-stone-400 rounded-2xl bg-stone-50">
                                    <span className="text-xs font-black uppercase text-stone-700 block mb-1">
                                        🔍 Desafio de Atenção do Aluno:
                                    </span>
                                    <p className="text-sm font-bold text-stone-950">
                                        {p.interactiveQuestion}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                {/* Fim das Páginas (Contracapa suprimida na impressão para economia máxima de folha e evitar página em branco) */}
            </div>

            {/* --- MODAL DISCRETO PARA INSERIR URL DE IMAGEM OU YOUTUBE --- */}
            {isMediaModalOpen && (
                <div className="fixed inset-0 z-60 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95 duration-150">
                        <div className="flex items-center justify-between pb-3 border-b border-stone-200">
                            <div className="flex items-center gap-2">
                                <div className="p-2 rounded-lg bg-amber-100 text-amber-900">
                                    <Link className="w-4 h-4" />
                                </div>
                                <h3 className="text-sm font-black text-stone-900">
                                    {editingTarget === 'cover' ? 'Mídia da Capa' : `Mídia da Página ${editingTarget}`}
                                </h3>
                            </div>
                            <button 
                                onClick={() => setIsMediaModalOpen(false)}
                                className="p-1 text-stone-400 hover:text-stone-700 rounded-lg cursor-pointer"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveMedia} className="mt-4 flex flex-col gap-3">
                            <div>
                                <label className="block text-xs font-bold text-stone-700 mb-1">
                                    URL da Imagem ou Link do YouTube:
                                </label>
                                <input
                                    type="url"
                                    value={inputMediaUrl}
                                    onChange={(e) => setInputMediaUrl(e.target.value)}
                                    placeholder="https://... ou https://www.youtube.com/watch?v=..."
                                    className="w-full text-xs px-3 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-stone-50 focus:bg-white transition-all font-mono"
                                    autoFocus
                                />
                                <p className="text-[11px] text-stone-500 mt-1.5 leading-snug">
                                    💡 <strong>Dica:</strong> Se colar um link do <strong>YouTube</strong>, a ilustração exibirá a capa do vídeo e um <strong>QR Code discreto</strong> será gerado automaticamente para os alunos e pais assistirem!
                                </p>
                            </div>

                            <div className="flex items-center justify-end gap-2 mt-2 pt-3 border-t border-stone-100">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setInputMediaUrl('');
                                        handleSaveMedia();
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
            )}
        </div>
    );
};

export default StorybookViewer;
