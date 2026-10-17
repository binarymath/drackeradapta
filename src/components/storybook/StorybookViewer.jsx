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
    Type,
    Copy
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

    const totalViews = pages.length + 2; // Capa + Páginas + Contracapa
    const isCover = currentPageIndex === 0;
    const isBackCover = currentPageIndex === totalViews - 1;
    const currentPage = !isCover && !isBackCover ? pages[currentPageIndex - 1] : null;

    // Chave identificadora da página ativa ('cover', número da página ou 'backcover')
    const activePageKey = isCover ? 'cover' : isBackCover ? 'backcover' : (currentPage ? currentPage.pageNumber : 1);

    // Barra de ferramentas de texto (Tamanho da fonte por elemento, Alinhamento e Edição de Texto POR PÁGINA)
    const [targetTextPart, setTargetTextPart] = useState('text'); // 'text' | 'title' | 'dialogue' | 'question' | 'all'
    const DEFAULT_FONT_SCALES = {
        text: 140,      // Texto principal / narrativa / sinopse
        title: 120,     // Título e subtítulo
        dialogue: 110,  // Fala do personagem
        question: 110   // Pergunta ou desafio de atenção
    };
    const DEFAULT_TEXT_ALIGNS = {
        text: 'justify',    // Texto principal / narrativa / sinopse
        title: 'left',      // Título e subtítulo
        dialogue: 'left',   // Fala do personagem
        question: 'left'    // Pergunta ou desafio de atenção
    };

    // Mapas de estilos por página: chave ('cover' | 1 | 2 | ... | 'backcover') -> { text, title, dialogue, question }
    const [pageFontScales, setPageFontScales] = useState({});
    const [pageTextAligns, setPageTextAligns] = useState({});

    // Helpers para obter estilos de uma página específica
    const getPageScales = (pageKey) => ({
        ...DEFAULT_FONT_SCALES,
        ...(pageFontScales[pageKey] || {})
    });
    const getPageAligns = (pageKey) => ({
        ...DEFAULT_TEXT_ALIGNS,
        ...(pageTextAligns[pageKey] || {})
    });

    // Estilos da página atualmente ativa na tela
    const currentFontScales = getPageScales(activePageKey);
    const currentTextAligns = getPageAligns(activePageKey);

    const [isEditingText, setIsEditingText] = useState(false);

    // Alinhamento atual da parte selecionada na página ativa (para destacar os botões)
    const currentAlignment = targetTextPart === 'all' 
        ? (currentTextAligns.text || 'justify') 
        : (currentTextAligns[targetTextPart] || 'left');

    // Ajusta o alinhamento para a parte selecionada ou para todas na PÁGINA ATIVA
    const setAlignmentForTarget = (align) => {
        setPageTextAligns(prev => {
            const pageAlign = { ...DEFAULT_TEXT_ALIGNS, ...(prev[activePageKey] || {}) };
            if (targetTextPart === 'all') {
                return {
                    ...prev,
                    [activePageKey]: {
                        text: align,
                        title: align,
                        dialogue: align,
                        question: align
                    }
                };
            }
            return {
                ...prev,
                [activePageKey]: {
                    ...pageAlign,
                    [targetTextPart]: align
                }
            };
        });
    };

    // Ajusta o tamanho da fonte para o elemento selecionado ou para todos na PÁGINA ATIVA
    const adjustFontScale = (delta) => {
        setPageFontScales(prev => {
            const pageScale = { ...DEFAULT_FONT_SCALES, ...(prev[activePageKey] || {}) };
            if (targetTextPart === 'all') {
                return {
                    ...prev,
                    [activePageKey]: {
                        text: Math.min(220, Math.max(80, pageScale.text + delta)),
                        title: Math.min(220, Math.max(80, pageScale.title + delta)),
                        dialogue: Math.min(220, Math.max(80, pageScale.dialogue + delta)),
                        question: Math.min(220, Math.max(80, pageScale.question + delta))
                    }
                };
            }
            return {
                ...prev,
                [activePageKey]: {
                    ...pageScale,
                    [targetTextPart]: Math.min(220, Math.max(80, (pageScale[targetTextPart] || 100) + delta))
                }
            };
        });
    };

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

    // Navegação com efeito refinado de folheada (mais cadenciado para sensação real de virar página)
    const changePage = (newIndex, direction) => {
        if (newIndex < 0 || newIndex >= totalViews || isFlipping || newIndex === currentPageIndex) return;
        setIsPlayingVideo(false);
        setFlipDirection(direction);
        setIsFlipping(true);
        setTimeout(() => {
            setCurrentPageIndex(newIndex);
            setTimeout(() => {
                setIsFlipping(false);
            }, 550);
        }, 250);
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

    // Copiar todo o texto da página ativa (disponível somente no modo online/tela)
    const handleCopyPageText = async () => {
        if (!currentPage) return;
        const parts = [];
        if (currentPage.title) parts.push(currentPage.title);
        if (currentPage.text) parts.push(currentPage.text);
        if (currentPage.dialogue) parts.push(`"${currentPage.dialogue}"`);
        if (currentPage.interactiveQuestion) parts.push(`Desafio de Atenção: ${currentPage.interactiveQuestion}`);

        const fullText = parts.join('\n\n');
        try {
            await navigator.clipboard.writeText(fullText);
            toast(`Texto da página ${currentPage.pageNumber} copiado para a área de transferência!`);
        } catch {
            // Fallback para ambientes restritos
            const textArea = document.createElement('textarea');
            textArea.value = fullText;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            toast(`Texto da página ${currentPage.pageNumber} copiado!`);
        }
    };

    // Imprimir o livro no navegador em modo A4 Paisagem direto (fiel às customizações e sem páginas em branco)
    const handlePrint = () => {
        toast('Preparando livro para impressão e PDF...');
        setTimeout(() => {
            window.print();
        }, 80);
    };

    return (
        <div className={`transition-all duration-300 w-full ${
            isFullscreen 
                ? 'fixed inset-0 z-50 bg-amber-50/70 backdrop-blur-md flex flex-col justify-between p-3 sm:p-5 h-screen w-screen overflow-hidden' 
                : 'flex flex-col gap-4 max-w-7xl w-full mx-auto py-2'
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
                        {/* Seletor de Elemento Textual + Controle de Fonte */}
                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-xs font-bold text-stone-700">
                            <span className="text-stone-400 font-semibold text-[11px] hidden sm:inline">Parte:</span>
                            <select
                                value={targetTextPart}
                                onChange={(e) => setTargetTextPart(e.target.value)}
                                className="bg-white border border-stone-200 text-stone-800 text-[11px] font-bold rounded-lg px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer shadow-2xs"
                                title="Escolha qual parte textual deseja redimensionar"
                            >
                                <option value="text">📖 Narrativa / Texto</option>
                                <option value="title">🏷️ Título</option>
                                <option value="dialogue">💬 Falas dos Personagens</option>
                                <option value="question">❓ Desafio de Atenção</option>
                                <option value="all">✨ Todos os Textos</option>
                            </select>

                            <div className="w-px h-3.5 bg-stone-200 mx-0.5 hidden sm:block" />

                            <button
                                type="button"
                                onClick={() => adjustFontScale(-10)}
                                className="px-1.5 py-0.5 rounded hover:bg-white text-stone-800 font-black cursor-pointer transition-colors"
                                title="Diminuir tamanho da fonte selecionada"
                            >
                                A-
                            </button>
                            <span className="text-indigo-600 font-mono font-extrabold text-xs min-w-[36px] text-center" title="Percentual da fonte selecionada">
                                {targetTextPart === 'all' ? `${currentFontScales.text}%` : `${currentFontScales[targetTextPart]}%`}
                            </span>
                            <button
                                type="button"
                                onClick={() => adjustFontScale(10)}
                                className="px-1.5 py-0.5 rounded hover:bg-white text-stone-800 font-black cursor-pointer transition-colors"
                                title="Aumentar tamanho da fonte selecionada"
                            >
                                A+
                            </button>
                        </div>

                        {/* Alinhamentos conforme parte selecionada */}
                        <div className="flex items-center gap-0.5 border-l border-stone-200 pl-1">
                            <button
                                type="button"
                                onClick={() => setAlignmentForTarget('left')}
                                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${currentAlignment === 'left' ? 'bg-indigo-100 text-indigo-700 shadow-2xs' : 'text-stone-500 hover:text-stone-800'}`}
                                title={`Alinhar ${targetTextPart === 'all' ? 'todos os textos' : 'elemento selecionado'} à esquerda`}
                            >
                                <AlignLeft className="w-3.5 h-3.5" />
                            </button>
                            <button
                                type="button"
                                onClick={() => setAlignmentForTarget('center')}
                                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${currentAlignment === 'center' ? 'bg-indigo-100 text-indigo-700 shadow-2xs' : 'text-stone-500 hover:text-stone-800'}`}
                                title={`Centralizar ${targetTextPart === 'all' ? 'todos os textos' : 'elemento selecionado'}`}
                            >
                                <AlignCenter className="w-3.5 h-3.5" />
                            </button>
                            <button
                                type="button"
                                onClick={() => setAlignmentForTarget('right')}
                                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${currentAlignment === 'right' ? 'bg-indigo-100 text-indigo-700 shadow-2xs' : 'text-stone-500 hover:text-stone-800'}`}
                                title={`Alinhar ${targetTextPart === 'all' ? 'todos os textos' : 'elemento selecionado'} à direita`}
                            >
                                <AlignRight className="w-3.5 h-3.5" />
                            </button>
                            <button
                                type="button"
                                onClick={() => setAlignmentForTarget('justify')}
                                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${currentAlignment === 'justify' ? 'bg-indigo-100 text-indigo-700 shadow-2xs' : 'text-stone-500 hover:text-stone-800'}`}
                                title={`Justificar ${targetTextPart === 'all' ? 'todos os textos' : 'elemento selecionado'}`}
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

                    {/* Símbolo de Tela Cheia discreto ao lado direito de Imprimir (sem texto) */}
                    <button
                        onClick={() => setIsFullscreen(prev => !prev)}
                        className="p-2 text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl border border-stone-200 shadow-2xs transition-all cursor-pointer active:scale-95 flex items-center justify-center shrink-0"
                        title={isFullscreen ? 'Restaurar visualização normal (Esc)' : 'Ocupar 100% da tela'}
                        aria-label={isFullscreen ? 'Restaurar visualização' : 'Tela cheia'}
                    >
                        {isFullscreen ? (
                            <Minimize2 className="w-4 h-4 text-stone-700" />
                        ) : (
                            <Maximize2 className="w-4 h-4 text-stone-700" />
                        )}
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
                        visibility: visible !important;
                        width: 297mm !important;
                        margin: 0 !important;
                        padding: 0 !important;
                    }
                    .storybook-print-container,
                    .storybook-print-container * {
                        visibility: visible !important;
                    }
                    .storybook-print-page {
                        page-break-inside: avoid !important;
                        break-inside: avoid !important;
                        page-break-after: always !important;
                        break-after: page !important;
                        width: 297mm !important;
                        height: 205mm !important;
                        max-width: 297mm !important;
                        max-height: 205mm !important;
                        padding: 7mm 10mm !important;
                        box-sizing: border-box !important;
                        background: white !important;
                        color: black !important;
                        overflow: hidden !important;
                        display: flex !important;
                        flex-direction: row !important;
                        align-items: stretch !important;
                    }
                    .storybook-print-page:last-child {
                        page-break-after: auto !important;
                        break-after: auto !important;
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

                    /* Efeito suave e cadenciado de folheada de página com perspectiva */
                    .page-turn-next {
                        perspective: 1200px;
                        animation: smoothFlipNext 0.75s cubic-bezier(0.22, 1, 0.36, 1) forwards;
                    }
                    .page-turn-prev {
                        perspective: 1200px;
                        animation: smoothFlipPrev 0.75s cubic-bezier(0.22, 1, 0.36, 1) forwards;
                    }
                }

                @keyframes smoothFlipNext {
                    0% {
                        opacity: 0.2;
                        transform: perspective(1200px) rotateY(-4deg) translateX(36px) scale(0.975);
                        filter: blur(1px);
                    }
                    40% {
                        opacity: 0.85;
                        transform: perspective(1200px) rotateY(-1.5deg) translateX(12px) scale(0.99);
                        filter: blur(0.3px);
                    }
                    100% {
                        opacity: 1;
                        transform: perspective(1200px) rotateY(0deg) translateX(0) scale(1);
                        filter: blur(0);
                    }
                }

                @keyframes smoothFlipPrev {
                    0% {
                        opacity: 0.2;
                        transform: perspective(1200px) rotateY(4deg) translateX(-36px) scale(0.975);
                        filter: blur(1px);
                    }
                    40% {
                        opacity: 0.85;
                        transform: perspective(1200px) rotateY(1.5deg) translateX(-12px) scale(0.99);
                        filter: blur(0.3px);
                    }
                    100% {
                        opacity: 1;
                        transform: perspective(1200px) rotateY(0deg) translateX(0) scale(1);
                        filter: blur(0);
                    }
                }
            `}</style>

            {/* --- VISUALIZADOR DE TELA (100% Altura/Largura quando Fullscreen) --- */}
            <div className={`storybook-screen-view no-print no-pdf relative w-full flex-1 flex flex-col justify-between bg-white rounded-3xl border-2 border-amber-200/90 shadow-xl overflow-hidden ${
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
                        {(() => {
                            const coverScales = getPageScales('cover');
                            const coverAligns = getPageAligns('cover');
                            return (
                                <>
                                    <div>
                                        <span className="text-[11px] font-bold uppercase tracking-wider text-stone-600 border border-stone-400 px-3 py-1 rounded">
                                            {book.theme || 'História Pedagógica'}
                                        </span>
                                        <h1 
                                            className="sb-print-title font-black font-serif text-black mt-4 leading-tight"
                                            style={{
                                                fontSize: `${(36 * coverScales.title) / 100}px`,
                                                textAlign: coverAligns.title || 'left',
                                                lineHeight: 1.25
                                            }}
                                        >
                                            {book.title}
                                        </h1>
                                        <p 
                                            className="sb-print-subtitle text-stone-700 font-medium italic mt-2"
                                            style={{
                                                fontSize: `${(18 * coverScales.title) / 100}px`,
                                                textAlign: coverAligns.title || 'left',
                                                lineHeight: 1.35
                                            }}
                                        >
                                            {book.subtitle}
                                        </p>
                                    </div>
                                    <div className="border-t border-stone-300 pt-5 mt-6">
                                        <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Sinopse da Aventura:</span>
                                        <p 
                                            className="sb-print-synopsis text-stone-800 mt-2 leading-relaxed"
                                            style={{
                                                fontSize: `${(15 * coverScales.text) / 100}px`,
                                                textAlign: coverAligns.text || 'justify',
                                                lineHeight: 1.6
                                            }}
                                        >
                                            {book.synopsis}
                                        </p>
                                        <div className="mt-6 pt-3 border-t border-stone-200 flex items-center justify-between text-xs text-stone-500 font-bold">
                                            <span>Drácker Adapta • Livro Infantil</span>
                                            <span className="border border-stone-400 px-2 py-0.5 rounded">Edição Escolar</span>
                                        </div>
                                    </div>
                                </>
                            );
                        })()}
                    </div>
                </div>

                {/* 2. Todas as Páginas Internas Sequenciais (1 a 10+) */}
                {pages.map((p) => {
                    const pScales = getPageScales(p.pageNumber);
                    const pAligns = getPageAligns(p.pageNumber);
                    return (
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
                                        <h2 
                                            className="sb-print-chapter-title font-black font-serif text-black flex-1 pr-3"
                                            style={{
                                                fontSize: `${(26 * pScales.title) / 100}px`,
                                                textAlign: pAligns.title || 'left',
                                                lineHeight: 1.25
                                            }}
                                        >
                                            {p.title || `Capítulo ${p.pageNumber}`}
                                        </h2>
                                        <div className="flex flex-col items-center justify-center bg-white border border-stone-300 px-3 py-1 rounded-2xl shrink-0 select-none leading-tight min-w-[54px]">
                                            <span className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider">
                                                Página
                                            </span>
                                            <span className="text-xs font-black text-stone-800">
                                                {p.pageNumber}
                                            </span>
                                        </div>
                                    </div>

                                    <div 
                                        className="sb-print-narrative font-serif text-stone-900 leading-relaxed whitespace-pre-line"
                                        style={{
                                            fontSize: `${(17 * pScales.text) / 100}px`,
                                            textAlign: pAligns.text || 'justify',
                                            lineHeight: 1.65
                                        }}
                                    >
                                        {p.text}
                                    </div>

                                    {p.dialogue && (
                                        <div 
                                            className="sb-print-dialogue mt-4 p-3 bg-stone-50 border-l-4 border-stone-500 italic text-stone-800"
                                            style={{
                                                fontSize: `${(14 * pScales.dialogue) / 100}px`,
                                                textAlign: pAligns.dialogue || 'left',
                                                lineHeight: 1.5
                                            }}
                                        >
                                            "{p.dialogue}"
                                        </div>
                                    )}
                                </div>

                                {/* Desafio de Atenção Obrigatório */}
                                {p.interactiveQuestion && (
                                    <div 
                                        className="sb-print-question mt-5 p-4 border border-stone-400 rounded-2xl bg-stone-50"
                                        style={{
                                            fontSize: `${(13 * pScales.question) / 100}px`,
                                            textAlign: pAligns.question || 'left',
                                            lineHeight: 1.45
                                        }}
                                    >
                                        <span className="text-xs font-black uppercase text-stone-700 block mb-1">
                                            🔍 Desafio de Atenção do Aluno:
                                        </span>
                                        <p className="font-bold text-stone-950">
                                            {p.interactiveQuestion}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}

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
