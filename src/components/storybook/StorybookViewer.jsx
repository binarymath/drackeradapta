import React, { useState, useEffect } from 'react';
import { toast } from '../ui/Toast';
import { useActivity } from '../../contexts/ActivityContext';
import { toDirectImageUrl } from '../../utils/urlUtils';
import { 
    DEFAULT_FONT_SCALES, 
    DEFAULT_TEXT_ALIGNS, 
    extractYouTubeId, 
    copyTextToClipboard 
} from './utils/storybookUtils';
import { StorybookMediaModal } from './modals/StorybookMediaModal';
import { StorybookLessonPlanModal } from './modals/StorybookLessonPlanModal';
import { StorybookToolbar } from './controls/StorybookToolbar';
import { StorybookPagination } from './controls/StorybookPagination';
import { StorybookCoverView } from './screen/StorybookCoverView';
import { StorybookPageView } from './screen/StorybookPageView';
import { StorybookBackCoverView } from './screen/StorybookBackCoverView';
import { StorybookPrintBooklet } from './print/StorybookPrintBooklet';

export const StorybookViewer = ({ data, onUpdate }) => {
    const book = data || {};
    const pages = book.pages || [];
    const { activeActivity, tabs, selectActivityTab, handleActivityTypeChange } = useActivity();

    // Encontra a aba do chat que gerou o storybook
    const handleGoToChat = () => {
        const sourceId = activeActivity?.sourceChatTabId;
        const matchingChatTab = (tabs || []).find(t => 
            (sourceId && t.id === sourceId) || t.type === 'chat_dracker'
        );

        if (matchingChatTab && selectActivityTab) {
            selectActivityTab(matchingChatTab.id);
            toast('Voltando para a conversa com o Drácker...');
        } else if (handleActivityTypeChange) {
            handleActivityTypeChange('chat_dracker');
            toast('Abrindo conversa com o Drácker...');
        }
    };

    // Estado da visualização
    // 0 = Capa | 1 .. pages.length = Páginas | pages.length + 1 = Contracapa
    const [currentPageIndex, setCurrentPageIndex] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [flipDirection, setFlipDirection] = useState('next'); // 'next' | 'prev'
    const [isFlipping, setIsFlipping] = useState(false);

    // Modal para adicionar/editar URL de Imagem ou Vídeo do YouTube
    const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
    const [isLessonPlanOpen, setIsLessonPlanOpen] = useState(false);
    const [editingTarget, setEditingTarget] = useState(null); // 'cover', 'backcover' ou número da página
    const [inputMediaUrl, setInputMediaUrl] = useState('');
    const [isPlayingVideo, setIsPlayingVideo] = useState(false);

    const totalViews = pages.length + 2; // Capa + Páginas + Contracapa
    const isCover = currentPageIndex === 0;
    const isBackCover = currentPageIndex === totalViews - 1;
    const currentPage = !isCover && !isBackCover ? pages[currentPageIndex - 1] : null;

    // Modo de Impressão: 'booklet' (Livreto Grampeado Frente e Verso) ou 'sequential'
    const [printLayoutMode, setPrintLayoutMode] = useState('booklet');

    // Chave identificadora da página ativa ('cover', número da página ou 'backcover')
    const activePageKey = isCover ? 'cover' : isBackCover ? 'backcover' : (currentPage ? currentPage.pageNumber : 1);

    // Barra de ferramentas de texto (Tamanho da fonte por elemento, Alinhamento e Edição de Texto POR PÁGINA)
    const [targetTextPart, setTargetTextPart] = useState('text'); // 'text' | 'title' | 'dialogue' | 'question' | 'image' | 'all'
    const [pageFontScales, setPageFontScales] = useState({});
    const [pageTextAligns, setPageTextAligns] = useState({});
    const [isEditingText, setIsEditingText] = useState(false);

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

    // Alinhamento atual da parte selecionada na página ativa
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

    // Navegação com efeito refinado de folheada
    const changePage = React.useCallback((newIndex, direction) => {
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
    }, [totalViews, isFlipping, currentPageIndex]);

    // Atalhos de teclado: Escape (tela cheia) e Setas Direita/Esquerda (navegação de páginas)
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isFullscreen) {
                setIsFullscreen(false);
                return;
            }

            // Ignorar setas se o usuário estiver digitando em um input, textarea ou contentEditable
            const activeTag = document.activeElement?.tagName?.toLowerCase();
            const isEditing = activeTag === 'input' || activeTag === 'textarea' || document.activeElement?.isContentEditable;
            if (isEditing) return;

            if (e.key === 'ArrowRight') {
                if (currentPageIndex < totalViews - 1 && !isFlipping) {
                    changePage(currentPageIndex + 1, 'next');
                }
            } else if (e.key === 'ArrowLeft') {
                if (currentPageIndex > 0 && !isFlipping) {
                    changePage(currentPageIndex - 1, 'prev');
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isFullscreen, currentPageIndex, totalViews, isFlipping, changePage]);

    // Abre o modal discreto para configurar imagem ou vídeo do YouTube
    const handleOpenMediaModal = (target) => {
        setEditingTarget(target);
        if (target === 'cover') {
            setInputMediaUrl(book.cover?.videoUrl || book.cover?.imageUrl || '');
        } else if (target === 'backcover') {
            setInputMediaUrl(book.backCover?.imageUrl || '');
        } else {
            const pageItem = pages[target - 1];
            setInputMediaUrl(pageItem?.videoUrl || pageItem?.imageUrl || '');
        }
        setIsMediaModalOpen(true);
    };

    // Salva a URL de mídia (com detecção automática de YouTube ou Google Drive)
    const handleSaveMedia = (e) => {
        e?.preventDefault();
        const trimmedUrl = inputMediaUrl.trim();
        const ytId = extractYouTubeId(trimmedUrl);

        let finalImageUrl = trimmedUrl;
        let finalVideoUrl = null;

        if (ytId) {
            finalVideoUrl = `https://www.youtube.com/watch?v=${ytId}`;
            finalImageUrl = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
        } else if (trimmedUrl) {
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

    // Copiar todo o texto da página ativa
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
        await copyTextToClipboard(fullText);
        toast(`Texto ${pageLabel} copiado para a área de transferência!`);
    };

    // Imprimir o livro no navegador
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
            {/* Barra de Ferramentas Superior */}
            <StorybookToolbar 
                book={book}
                pagesCount={pages.length}
                targetTextPart={targetTextPart}
                setTargetTextPart={setTargetTextPart}
                currentFontScales={currentFontScales}
                currentAlignment={currentAlignment}
                adjustFontScale={adjustFontScale}
                setAlignmentForTarget={setAlignmentForTarget}
                isEditingText={isEditingText}
                setIsEditingText={setIsEditingText}
                printLayoutMode={printLayoutMode}
                setPrintLayoutMode={setPrintLayoutMode}
                handlePrint={handlePrint}
                isFullscreen={isFullscreen}
                setIsFullscreen={setIsFullscreen}
                onGoToChat={handleGoToChat}
            />

            {/* Estilos de Impressão A4 Paisagem 100% e Animação de Folheada */}
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

            {/* Visualizador de Livro Aberto em Tela */}
            <div className={`storybook-screen-view relative bg-white rounded-3xl border border-stone-200/90 shadow-xl overflow-hidden flex flex-col justify-between select-text ${
                isFullscreen ? 'h-full min-h-0' : 'min-h-[70svh] md:aspect-[16/10] md:min-h-[520px]'
            }`}>
                {/* Linha discreta de Vinco Central com Sombreamento de Livro Aberto */}
                {!isBackCover && (
                    <>
                        <div className="absolute inset-y-0 left-1/2 w-6 -ml-3 bg-gradient-to-r from-stone-200/0 via-stone-300/40 to-stone-200/0 pointer-events-none z-30 hidden md:block" />
                        <div className="absolute inset-y-0 left-1/2 w-px bg-stone-200 pointer-events-none z-30 hidden md:block" />
                    </>
                )}

                {/* Conteúdo Dinâmico em Tela com Transição */}
                <div className={`flex-1 flex flex-col md:flex-row min-h-0 md:h-full overflow-y-auto md:overflow-hidden ${
                    isFlipping ? (flipDirection === 'next' ? 'page-turn-next' : 'page-turn-prev') : ''
                }`}>
                    {/* Capa */}
                    {isCover && (
                        <StorybookCoverView 
                            book={book}
                            isPlayingVideo={isPlayingVideo}
                            setIsPlayingVideo={setIsPlayingVideo}
                            handleOpenMediaModal={handleOpenMediaModal}
                            handleCopyPageText={handleCopyPageText}
                            isEditingText={isEditingText}
                            onUpdate={onUpdate}
                            currentFontScales={currentFontScales}
                            currentTextAligns={currentTextAligns}
                        />
                    )}

                    {/* Páginas Internas */}
                    {currentPage && (
                        <StorybookPageView 
                            currentPage={currentPage}
                            currentPageIndex={currentPageIndex}
                            pages={pages}
                            book={book}
                            isPlayingVideo={isPlayingVideo}
                            setIsPlayingVideo={setIsPlayingVideo}
                            handleOpenMediaModal={handleOpenMediaModal}
                            handleCopyPageText={handleCopyPageText}
                            isEditingText={isEditingText}
                            isFullscreen={isFullscreen}
                            onUpdate={onUpdate}
                            currentFontScales={currentFontScales}
                            currentTextAligns={currentTextAligns}
                        />
                    )}

                    {/* Contracapa */}
                    {isBackCover && (
                        <StorybookBackCoverView 
                            book={book}
                            handleCopyPageText={handleCopyPageText}
                            handleOpenMediaModal={handleOpenMediaModal}
                            isEditingText={isEditingText}
                            onUpdate={onUpdate}
                            currentFontScales={currentFontScales}
                            currentTextAligns={currentTextAligns}
                        />
                    )}
                </div>

                {/* Barra Inferior de Navegação */}
                <StorybookPagination 
                    currentPageIndex={currentPageIndex}
                    totalViews={totalViews}
                    pagesCount={pages.length}
                    isFlipping={isFlipping}
                    changePage={changePage}
                />
            </div>

            {/* Container de Impressão (Booklet Duplex e Sequencial) */}
            <StorybookPrintBooklet 
                book={book}
                pages={pages}
                getPageScales={getPageScales}
                getPageAligns={getPageAligns}
                printLayoutMode={printLayoutMode}
            />

            {/* Modal de Mídia (Imagens Google Drive, Presets e YouTube) */}
            <StorybookMediaModal 
                isOpen={isMediaModalOpen}
                onClose={() => setIsMediaModalOpen(false)}
                editingTarget={editingTarget}
                inputMediaUrl={inputMediaUrl}
                setInputMediaUrl={setInputMediaUrl}
                onSave={handleSaveMedia}
            />

            {/* Modal com a Receita de Bolo da Aula (Guia do Professor) */}
            <StorybookLessonPlanModal 
                isOpen={isLessonPlanOpen}
                onClose={() => setIsLessonPlanOpen(false)}
                book={book}
            />
        </div>
    );
};
