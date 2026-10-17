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
import { toDirectImageUrl, handleDriveImageError } from '../../utils/urlUtils';

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

    // Modo de Impressão: 'booklet' (Livreto Grampeado Frente e Verso) ou 'sequential' (Páginas sequenciais)
    const [printLayoutMode, setPrintLayoutMode] = useState('booklet');

    // Chave identificadora da página ativa ('cover', número da página ou 'backcover')
    const activePageKey = isCover ? 'cover' : isBackCover ? 'backcover' : (currentPage ? currentPage.pageNumber : 1);

    // Barra de ferramentas de texto (Tamanho da fonte por elemento, Alinhamento e Edição de Texto POR PÁGINA)
    const [targetTextPart, setTargetTextPart] = useState('text'); // 'text' | 'title' | 'dialogue' | 'question' | 'all'
    const DEFAULT_FONT_SCALES = {
        text: 140,      // Texto principal / narrativa / sinopse / lição
        title: 120,     // Título e subtítulo
        dialogue: 110,  // Fala do personagem
        question: 110,  // Pergunta ou desafio de atenção
        image: 100      // Logo / Imagem / Ilustração
    };
    const DEFAULT_TEXT_ALIGNS = {
        text: 'justify',    // Texto principal / narrativa / sinopse / lição
        title: 'left',      // Título e subtítulo
        dialogue: 'left',   // Fala do personagem
        question: 'left',   // Pergunta ou desafio de atenção
        image: 'center'     // Posição da imagem / logo
    };

    // Mapas de estilos por página: chave ('cover' | 1 | 2 | ... | 'backcover') -> { text, title, dialogue, question, image }
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
                        question: align,
                        image: align
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

    // Ajusta o tamanho da fonte ou imagem para o elemento selecionado ou para todos na PÁGINA ATIVA
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
                        question: Math.min(220, Math.max(80, pageScale.question + delta)),
                        image: Math.min(300, Math.max(50, (pageScale.image || 100) + delta))
                    }
                };
            }
            const maxVal = targetTextPart === 'image' ? 300 : 220;
            const minVal = targetTextPart === 'image' ? 50 : 80;
            return {
                ...prev,
                [activePageKey]: {
                    ...pageScale,
                    [targetTextPart]: Math.min(maxVal, Math.max(minVal, (pageScale[targetTextPart] || 100) + delta))
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
        } else if (target === 'backcover') {
            setInputMediaUrl(book.backCover?.imageUrl || '/dracker_e_seus_amigos.png');
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
        } else if (trimmedUrl) {
            // Converte links do Google Drive (share, /view, ?usp=sharing, uc?export=view) para URL direta
            finalImageUrl = toDirectImageUrl(trimmedUrl);
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
        } else if (editingTarget === 'backcover') {
            const updatedBook = {
                ...book,
                backCover: {
                    ...(book.backCover || {}),
                    imageUrl: finalImageUrl || undefined
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

        const isDrive = trimmedUrl.includes('drive.google.com') || trimmedUrl.includes('googleusercontent.com');
        toast(ytId 
            ? 'Vídeo do YouTube e QR Code vinculados com sucesso!' 
            : isDrive 
                ? 'Imagem do Google Drive vinculada e convertida com sucesso!' 
                : 'Imagem atualizada com sucesso!');
        setIsMediaModalOpen(false);
    };

    // Copiar todo o texto da página ativa (disponível somente no modo online/tela)
    const handleCopyPageText = async () => {
        const parts = [];
        let pageLabel = 'da página';

        if (isCover) {
            pageLabel = 'da Capa';
            if (book.title) parts.push(book.title);
            if (book.subtitle) parts.push(book.subtitle);
            if (book.synopsis) parts.push(`Sinopse: ${book.synopsis}`);
        } else if (currentPage) {
            pageLabel = `da página ${currentPage.pageNumber}`;
            if (currentPage.title) parts.push(currentPage.title);
            if (currentPage.text) parts.push(currentPage.text);
            if (currentPage.dialogue) parts.push(`"${currentPage.dialogue}"`);
            if (currentPage.interactiveQuestion) parts.push(`Desafio de Atenção: ${currentPage.interactiveQuestion}`);
        } else if (isBackCover) {
            pageLabel = 'da Contracapa';
            parts.push('Fim da Nossa Expedição!');
            if (book.moralLesson) parts.push(book.moralLesson);
            if (book.backCover?.activity) parts.push(`Desafio do Aluno: ${book.backCover.activity}`);
        }

        if (parts.length === 0) return;

        const fullText = parts.join('\n\n');
        try {
            await navigator.clipboard.writeText(fullText);
            toast(`Texto ${pageLabel} copiado para a área de transferência!`);
        } catch {
            // Fallback para ambientes restritos
            const textArea = document.createElement('textarea');
            textArea.value = fullText;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            toast(`Texto ${pageLabel} copiado!`);
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
                                <option value="image">🖼️ Logo / Imagem</option>
                                <option value="all">✨ Todos os Textos</option>
                            </select>

                            <div className="w-px h-3.5 bg-stone-200 mx-0.5 hidden sm:block" />

                            <button
                                type="button"
                                onClick={() => adjustFontScale(-10)}
                                className="px-1.5 py-0.5 rounded hover:bg-white text-stone-800 font-black cursor-pointer transition-colors"
                                title="Diminuir tamanho da fonte ou imagem selecionada"
                            >
                                A-
                            </button>
                            <span className="text-indigo-600 font-mono font-extrabold text-xs min-w-[36px] text-center" title="Percentual da fonte ou imagem selecionada">
                                {targetTextPart === 'all' ? `${currentFontScales.text}%` : `${currentFontScales[targetTextPart] || 100}%`}
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

                    {/* Seletor do Modo de Impressão (Livreto Grampeado Booklet vs Sequencial) */}
                    <div className="flex items-center gap-1 bg-stone-50 border border-stone-200/90 rounded-xl p-1 shadow-2xs">
                        <select
                            value={printLayoutMode}
                            onChange={(e) => setPrintLayoutMode(e.target.value)}
                            className="bg-white border border-stone-200 text-stone-800 text-[11px] font-bold rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer shadow-2xs"
                            title="Escolha o modo de montagem da folha de impressão"
                        >
                            <option value="booklet">📖 Modo Livreto (Dobra Frente/Verso)</option>
                            <option value="sequential">📄 Modo Sequencial (Página por Página)</option>
                        </select>
                    </div>

                    {/* Botão de Impressão */}
                    <button
                        onClick={handlePrint}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-black text-brown-950 bg-amber-200/80 hover:bg-amber-300 rounded-xl border border-amber-300 shadow-2xs transition-all cursor-pointer active:scale-95"
                        title={printLayoutMode === 'booklet' 
                            ? 'Imprimir em modo Livreto Frente e Verso (Para dobrar e grampear no meio)' 
                            : 'Imprimir todas as páginas em ordem sequencial'}
                    >
                        <Printer className="w-3.5 h-3.5 text-amber-900" />
                        <span className="hidden sm:inline">
                            {printLayoutMode === 'booklet' ? 'Imprimir Livreto (A4)' : 'Imprimir (A4 Paisagem)'}
                        </span>
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
                
                {/* Linha discreta de Vinco Central com Sombreamento de Livro Aberto (oculta na contracapa única) */}
                {!isBackCover && (
                    <>
                        <div className="absolute inset-y-0 left-1/2 w-6 -ml-3 bg-gradient-to-r from-stone-200/0 via-stone-300/40 to-stone-200/0 pointer-events-none z-30 hidden md:block" />
                        <div className="absolute inset-y-0 left-1/2 w-px bg-stone-200 pointer-events-none z-30 hidden md:block" />
                    </>
                )}

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
                                            src={toDirectImageUrl(book.cover.imageUrl)} 
                                            alt="Capa do Livro" 
                                            onError={handleDriveImageError}
                                            referrerPolicy="no-referrer"
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
                                    {/* Cabeçalho da Capa com badge e copiar */}
                                    <div className="flex justify-between items-center pb-2 mb-3 border-b border-stone-200">
                                        <span className="text-[11px] font-black uppercase tracking-wider border border-stone-300 text-stone-600 px-3 py-1 rounded-md">
                                            {book.theme || 'História Pedagógica'}
                                        </span>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <button
                                                type="button"
                                                onClick={handleCopyPageText}
                                                className="p-1.5 text-stone-400 hover:text-stone-800 hover:bg-stone-100 rounded-xl transition-all cursor-pointer border border-transparent hover:border-stone-200 active:scale-95 shadow-2xs"
                                                title="Copiar todo o texto da Capa"
                                                aria-label="Copiar texto da Capa"
                                            >
                                                <Copy className="w-4 h-4 text-stone-600" />
                                            </button>

                                            <div className="flex flex-col items-center justify-center bg-white border border-stone-200/90 px-3 py-1 rounded-2xl shadow-2xs shrink-0 select-none leading-tight min-w-[54px]">
                                                <span className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider">
                                                    Início
                                                </span>
                                                <span className="text-xs font-black text-stone-800">
                                                    Capa
                                                </span>
                                            </div>
                                        </div>
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
                                            src={toDirectImageUrl(currentPage.imageUrl)} 
                                            alt={`Página ${currentPage.pageNumber}`} 
                                            onError={handleDriveImageError}
                                            referrerPolicy="no-referrer"
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

                            <div className="max-w-2xl mx-auto w-full flex flex-col my-auto">
                                {/* Imagem de Drácker e seus amigos com redimensionamento e alinhamento individual */}
                                <div 
                                    className={`w-full flex mb-4 relative group ${
                                        currentTextAligns.image === 'left' ? 'justify-start' :
                                        currentTextAligns.image === 'right' ? 'justify-end' : 'justify-center'
                                    }`}
                                >
                                    <div className="relative inline-block">
                                        <img 
                                            src={toDirectImageUrl(book.backCover?.imageUrl || '/dracker_e_seus_amigos.png')} 
                                            alt="Drácker e seus amigos" 
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
                                            title="Trocar imagem da contracapa"
                                        >
                                            <Link className="w-3 h-3 text-amber-700" />
                                            <span>Mudar Imagem</span>
                                        </button>
                                    </div>
                                </div>

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
                {(() => {
                    const coverScales = getPageScales('cover');
                    const coverAligns = getPageAligns('cover');
                    const backScales = getPageScales('backcover');
                    const backAligns = getPageAligns('backcover');

                    // Funções modulares para renderizar cada metade de página (A5) com precisão
                    const renderCoverLeft = () => (
                        <div className="print-half-page p-6 flex flex-col items-center justify-center border-r border-stone-300 relative h-full">
                            {book.cover?.imageUrl ? (
                                <img 
                                    src={toDirectImageUrl(book.cover.imageUrl)} 
                                    alt="Capa" 
                                    onError={handleDriveImageError}
                                    referrerPolicy="no-referrer"
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
                    );

                    const renderCoverRight = () => (
                        <div className="print-half-page p-8 sm:p-10 flex flex-col justify-center h-full">
                            <div className="flex justify-between items-center border-b border-stone-300 pb-2 mb-3">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-stone-600 border border-stone-400 px-3 py-1 rounded">
                                    {book.theme || 'História Pedagógica'}
                                </span>
                                <div className="flex flex-col items-center justify-center bg-white border border-stone-300 px-3 py-1 rounded-2xl shrink-0 select-none leading-tight min-w-[54px]">
                                    <span className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider">
                                        Início
                                    </span>
                                    <span className="text-xs font-black text-stone-800">
                                        Capa
                                    </span>
                                </div>
                            </div>
                            <div>
                                <h1 
                                    className="sb-print-title font-black font-serif text-black mt-2 leading-tight"
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
                        </div>
                    );

                    const renderStoryLeft = (p) => (
                        <div className="print-half-page p-6 flex flex-col items-center justify-center border-r border-stone-300 relative h-full">
                            {p.imageUrl ? (
                                <img 
                                    src={toDirectImageUrl(p.imageUrl)} 
                                    alt={`Página ${p.pageNumber}`} 
                                    onError={handleDriveImageError}
                                    referrerPolicy="no-referrer"
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
                    );

                    const renderStoryRight = (p) => {
                        const pScales = getPageScales(p.pageNumber);
                        const pAligns = getPageAligns(p.pageNumber);
                        return (
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
                        );
                    };

                    const renderBackLeft = () => (
                        <div className="print-half-page p-6 flex flex-col justify-center items-center border-r border-stone-300 relative h-full text-center">
                            <div 
                                className={`w-full flex-1 flex flex-col justify-center items-center ${
                                    backAligns.image === 'left' ? 'items-start' :
                                    backAligns.image === 'right' ? 'items-end' : 'items-center'
                                }`}
                            >
                                <img 
                                    src={toDirectImageUrl(book.backCover?.imageUrl || '/dracker_e_seus_amigos.png')} 
                                    alt="Drácker e seus amigos" 
                                    onError={handleDriveImageError}
                                    referrerPolicy="no-referrer"
                                    style={{
                                        width: `${Math.round((380 * (backScales.image || 100)) / 100)}px`,
                                        maxWidth: '96%',
                                        maxHeight: '145mm'
                                    }}
                                    className="object-contain" 
                                />
                            </div>
                            <div className="mt-2 shrink-0">
                                <h3 className="text-base font-black font-serif text-stone-900">
                                    Drácker Adapta
                                </h3>
                                <p className="text-xs text-stone-500 mt-0.5">
                                    Histórias que ensinam, inspiram e transformam.
                                </p>
                            </div>
                        </div>
                    );

                    const renderBackRight = () => (
                        <div className="print-half-page p-8 sm:p-10 flex flex-col justify-between h-full">
                            <div>
                                <div className="border-b border-stone-300 pb-2.5 mb-4 flex justify-between items-center">
                                    <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900 border border-amber-400 bg-amber-50 px-3 py-1 rounded">
                                        Conclusão da História
                                    </span>
                                    <div className="flex flex-col items-center justify-center bg-white border border-stone-300 px-3 py-1 rounded-2xl shrink-0 select-none leading-tight min-w-[54px]">
                                        <span className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider">
                                            Final
                                        </span>
                                        <span className="text-xs font-black text-stone-800">
                                            Contracapa
                                        </span>
                                    </div>
                                </div>

                                <h2 
                                    className="font-black font-serif text-black leading-tight mb-3"
                                    style={{
                                        fontSize: `${Math.round((24 * backScales.title) / 100)}px`,
                                        textAlign: backAligns.title || 'left'
                                    }}
                                >
                                    {book.backCover?.title || 'Fim da Nossa Expedição!'}
                                </h2>
                                <p 
                                    className="font-serif italic text-stone-800 leading-relaxed bg-stone-50 p-3.5 rounded-xl border-l-4 border-amber-500 mb-5"
                                    style={{
                                        fontSize: `${Math.round((14 * backScales.text) / 100)}px`,
                                        textAlign: backAligns.text || 'left'
                                    }}
                                >
                                    "{book.moralLesson || 'Aprender juntos na floresta mágica transforma qualquer dúvida em pura descoberta!'}"
                                </p>

                                {book.backCover?.activity && (
                                    <div 
                                        className="p-4 border-2 border-dashed border-stone-400 rounded-2xl bg-stone-50"
                                        style={{
                                            textAlign: backAligns.question || 'left'
                                        }}
                                    >
                                        <span className="text-xs font-black uppercase text-stone-800 block mb-1">
                                            ✏️ Desafio Prático do Aluno:
                                        </span>
                                        <p 
                                            className="font-semibold text-stone-900 leading-relaxed"
                                            style={{
                                                fontSize: `${Math.round((12.5 * backScales.question) / 100)}px`
                                            }}
                                        >
                                            {book.backCover.activity}
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="border-t border-stone-200 pt-3 flex items-center justify-between text-xs text-stone-500 font-bold">
                                <span>Drácker Adapta • Livro Pedagógico</span>
                                <span className="border border-stone-400 px-2 py-0.5 rounded">Edição Concluída</span>
                            </div>
                        </div>
                    );

                    const renderBlank = (label = 'Página para anotações do aluno') => (
                        <div className="print-half-page p-6 flex flex-col justify-center items-center h-full text-center border-r border-stone-200 bg-stone-50/30">
                            <img src="/dracker_character.png" alt="Drácker" className="w-16 h-16 object-contain opacity-40 mb-2" />
                            <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">{label}</span>
                        </div>
                    );

                    // ==========================================
                    // 1. MODO LIVRETO GRAMPEADO (BOOKLET)
                    // ==========================================
                    if (printLayoutMode === 'booklet') {
                        // Constrói a lista de páginas lógicas (A5)
                        const logicalPages = [];
                        logicalPages.push({ type: 'cover_left' });
                        logicalPages.push({ type: 'cover_right' });
                        pages.forEach(p => {
                            logicalPages.push({ type: 'story_left', page: p });
                            logicalPages.push({ type: 'story_right', page: p });
                        });
                        logicalPages.push({ type: 'back_left' });
                        logicalPages.push({ type: 'back_right' });

                        // Para encadernação de livreto dobrado ao meio, o número de páginas A5 deve ser múltiplo de 4
                        const remainder = logicalPages.length % 4;
                        if (remainder !== 0) {
                            const paddingCount = 4 - remainder;
                            for (let i = 0; i < paddingCount; i++) {
                                logicalPages.push({ type: 'blank', index: i + 1 });
                            }
                        }

                        // Algoritmo clássico de imposição de livreto (Saddle-Stitch Booklet)
                        const totalUnits = logicalPages.length;
                        const totalSheets = totalUnits / 4;
                        const imposedSheets = [];

                        for (let s = 0; s < totalSheets; s++) {
                            // Frente da folha s
                            const frontLeftIdx = totalUnits - 1 - (2 * s);
                            const frontRightIdx = 2 * s;
                            imposedSheets.push({
                                sheetNumber: s + 1,
                                side: 'Frente',
                                left: logicalPages[frontLeftIdx],
                                right: logicalPages[frontRightIdx]
                            });

                            // Verso da folha s (Ao virar no eixo longo)
                            const backLeftIdx = (2 * s) + 1;
                            const backRightIdx = totalUnits - 2 - (2 * s);
                            imposedSheets.push({
                                sheetNumber: s + 1,
                                side: 'Verso',
                                left: logicalPages[backLeftIdx],
                                right: logicalPages[backRightIdx]
                            });
                        }

                        const renderPageItem = (item) => {
                            if (!item) return renderBlank();
                            switch (item.type) {
                                case 'cover_left': return renderCoverLeft();
                                case 'cover_right': return renderCoverRight();
                                case 'story_left': return renderStoryLeft(item.page);
                                case 'story_right': return renderStoryRight(item.page);
                                case 'back_left': return renderBackLeft();
                                case 'back_right': return renderBackRight();
                                default: return renderBlank();
                            }
                        };

                        return imposedSheets.map((sheet, idx) => (
                            <div key={`sheet-${idx}`} className="storybook-print-page relative">
                                {renderPageItem(sheet.left)}
                                {renderPageItem(sheet.right)}
                            </div>
                        ));
                    }

                    // ==========================================
                    // 2. MODO SEQUENCIAL NORMAL (Página a Página)
                    // ==========================================
                    return (
                        <>
                            {/* Capa */}
                            <div className="storybook-print-page">
                                {renderCoverLeft()}
                                {renderCoverRight()}
                            </div>

                            {/* Páginas de História */}
                            {pages.map(p => (
                                <div key={p.pageNumber} className="storybook-print-page">
                                    {renderStoryLeft(p)}
                                    {renderStoryRight(p)}
                                </div>
                            ))}

                            {/* Contracapa */}
                            <div className="storybook-print-page">
                                {renderBackLeft()}
                                {renderBackRight()}
                            </div>
                        </>
                    );
                })()}
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
                                    💡 <strong>Dica:</strong> Aceita links do <strong>Google Drive</strong> (compartilhados ou de visualização), imagens diretas da web ou links do <strong>YouTube</strong> (com capa oficial e QR Code gerados automaticamente)!
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
