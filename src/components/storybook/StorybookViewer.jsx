import React, { useState } from 'react';
import { 
    BookOpen, 
    ChevronLeft, 
    ChevronRight, 
    Printer, 
    Sparkles, 
    Download, 
    Edit3, 
    Check, 
    HelpCircle, 
    MessageCircle, 
    Image as ImageIcon,
    Loader2
} from 'lucide-react';
import { Button } from '../ui/Button';
import { useGemini } from '../../contexts/GeminiContext';
import { toast } from '../ui/Toast';

export const StorybookViewer = ({ data, onUpdate }) => {
    const { geminiService, apiKey } = useGemini();
    const book = data || {};
    const pages = book.pages || [];

    // Estado da visualização
    // 0 = Capa
    // 1 .. pages.length = Páginas de conteúdo
    // pages.length + 1 = Contracapa
    const [currentPageIndex, setCurrentPageIndex] = useState(0);
    const [isEditing, setIsEditing] = useState(false);
    const [isGeneratingImg, setIsGeneratingImg] = useState(false);
    const [generatingPageNum, setGeneratingPageNum] = useState(null);

    const totalViews = pages.length + 2; // Capa + Páginas + Contracapa
    const isCover = currentPageIndex === 0;
    const isBackCover = currentPageIndex === totalViews - 1;
    const currentPage = !isCover && !isBackCover ? pages[currentPageIndex - 1] : null;

    // Função para gerar ilustração via Imagen 3 com a mesma API key
    const handleGenerateImageForCurrentPage = async () => {
        if (!apiKey) {
            toast('Configure sua chave de API nas configurações antes de gerar ilustrações.');
            return;
        }

        const promptToUse = isCover 
            ? book.cover?.imagePrompt || `Children's storybook cover illustration, friendly little brown dragon named Drácker in magical enchanted forest, vibrant soft colors`
            : currentPage?.imagePrompt || `Children's storybook page illustration, Drácker the cute brown dragon in a teaching adventure, fairy woodland, warm colors`;

        try {
            setIsGeneratingImg(true);
            setGeneratingPageNum(currentPageIndex);
            toast('Pintando a cena com Imagen 3... Isso leva alguns segundos!');
            
            const base64Img = await geminiService.generateImageWithImagen(promptToUse, {
                aspectRatio: '1:1',
                safetyFilterLevel: 'block_medium_and_above'
            });

            if (isCover) {
                const updatedBook = {
                    ...book,
                    cover: { ...book.cover, imageUrl: base64Img }
                };
                if (onUpdate) onUpdate(updatedBook);
            } else if (currentPage) {
                const updatedPages = [...pages];
                updatedPages[currentPageIndex - 1] = {
                    ...currentPage,
                    imageUrl: base64Img
                };
                const updatedBook = { ...book, pages: updatedPages };
                if (onUpdate) onUpdate(updatedBook);
            }

            toast('Ilustração gerada e aplicada com sucesso!');
        } catch (error) {
            console.error('Erro ao gerar ilustração:', error);
            toast(`Não foi possível gerar a imagem: ${error.message || 'Tente novamente.'}`);
        } finally {
            setIsGeneratingImg(false);
            setGeneratingPageNum(null);
        }
    };

    // Imprimir o livro no navegador (modo folheto / apresentação)
    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto py-2">
            
            {/* Barra de Ferramentas Superior */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-amber-200/80 shadow-md no-print">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center text-white shadow-sm">
                        <BookOpen className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-base sm:text-lg font-black text-brown-950 leading-tight">
                            {book.title || 'Livro Infantil do Drácker'}
                        </h2>
                        <div className="flex items-center gap-2 text-xs text-brown-600 font-semibold mt-0.5">
                            <span className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full text-[10px] font-black uppercase">
                                {book.theme || 'História Pedagógica'}
                            </span>
                            <span>•</span>
                            <span>{pages.length} páginas ilustradas</span>
                            <span>•</span>
                            <span>Faixa: {book.targetAge || '6-10 anos'}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={handleGenerateImageForCurrentPage}
                        disabled={isGeneratingImg}
                        className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-black text-white bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 rounded-xl shadow-sm transition-all disabled:opacity-50 cursor-pointer active:scale-95"
                        title="Gerar ou regerar a ilustração desta página usando Imagen 3 com sua chave"
                    >
                        {isGeneratingImg ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Ilustrando...</span>
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-4 h-4 text-amber-200" />
                                <span>Ilustrar Esta Página</span>
                            </>
                        )}
                    </button>

                    <button
                        onClick={handlePrint}
                        className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-black text-brown-800 bg-amber-50 hover:bg-amber-100 rounded-xl border border-amber-300 shadow-2xs transition-all cursor-pointer"
                        title="Imprimir livro em alta resolução para encadernação"
                    >
                        <Printer className="w-4 h-4 text-amber-700" />
                        <span>Imprimir</span>
                    </button>
                </div>
            </div>

            {/* Estilo Especial de Impressão Ultra-Clean (Economia Máxima de Tinta) */}
            <style>{`
                @media print {
                    body {
                        background: white !important;
                    }
                    .no-print {
                        display: none !important;
                    }
                    .storybook-print-page {
                        page-break-after: always;
                        break-after: page;
                        width: 100% !important;
                        min-height: 100vh !important;
                        background: white !important;
                        color: black !important;
                        border: none !important;
                        box-shadow: none !important;
                    }
                }
            `}</style>

            {/* Visualizador de Páginas Ultra-Clean (Fundo Branco Limpo - Economia de Tinta) */}
            <div className="relative w-full aspect-[4/3] sm:aspect-[16/10] md:min-h-[580px] bg-white rounded-3xl border-2 border-stone-200 shadow-lg overflow-hidden flex flex-col justify-between">
                
                {/* Linha discreta de Vinco Central */}
                <div className="absolute inset-y-0 left-1/2 w-px bg-stone-200 pointer-events-none z-30 hidden md:block" />

                {/* --- CONTEÚDO: CAPA LIMPA --- */}
                {isCover && (
                    <div className="flex-1 flex flex-col md:flex-row h-full storybook-print-page">
                        {/* Imagem de Capa em Linha Limpa / Ilustração */}
                        <div className="flex-1 bg-white p-6 sm:p-8 flex items-center justify-center relative border-b md:border-b-0 md:border-r border-stone-200 overflow-hidden">
                            {book.cover?.imageUrl ? (
                                <img 
                                    src={book.cover.imageUrl} 
                                    alt="Capa do Livro" 
                                    className="w-full h-full max-h-[440px] object-contain rounded-2xl border border-stone-200"
                                />
                            ) : (
                                <div className="flex flex-col items-center justify-center text-center p-6 bg-stone-50/60 rounded-2xl border-2 border-dashed border-stone-300 w-full h-full max-h-[440px]">
                                    <div className="p-3 rounded-full bg-white border border-stone-200 mb-3 shadow-2xs">
                                        <img src="/dracker_character.png" alt="Drácker" className="w-28 h-28 object-contain" />
                                    </div>
                                    <span className="text-sm font-black text-stone-800 mb-1">Capa do Livro Infantil</span>
                                    <p className="text-xs text-stone-500 max-w-xs mb-3">
                                        Capa limpa projetada para economia de tinta na impressão escolar.
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Texto de Capa Limpo */}
                        <div className="flex-1 p-8 md:p-12 flex flex-col justify-between bg-white text-stone-900">
                            <div className="flex flex-col gap-3">
                                <span className="text-[11px] font-black uppercase tracking-wider border border-stone-300 text-stone-600 px-3 py-1 rounded-md self-start">
                                    {book.theme || 'História Pedagógica'}
                                </span>
                                <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-stone-950 font-serif leading-tight">
                                    {book.title}
                                </h1>
                                <p className="text-base sm:text-lg text-stone-600 font-medium italic">
                                    {book.subtitle}
                                </p>
                            </div>

                            <div className="mt-8 pt-6 border-t border-stone-200 flex flex-col gap-2">
                                <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">Sinopse:</span>
                                <p className="text-sm text-stone-700 leading-relaxed font-sans">
                                    {book.synopsis || 'Uma jornada inesquecível de descobertas com o Drácker e seus grandes amigos da floresta!'}
                                </p>
                                <span className="text-xs font-semibold text-stone-500 mt-2">
                                    Drácker Adapta • Livro Didático Infantil
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- CONTEÚDO: PÁGINA INTERNA (Clean & White) --- */}
                {currentPage && (
                    <div className="flex-1 flex flex-col md:flex-row h-full storybook-print-page">
                        {/* Lado Esquerdo: Área de Desenho / Ilustração Limpa para Colorir */}
                        <div className="flex-1 bg-white p-6 sm:p-8 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-stone-200 relative">
                            {currentPage.imageUrl ? (
                                <img 
                                    src={currentPage.imageUrl} 
                                    alt={`Página ${currentPage.pageNumber}`} 
                                    className="w-full h-full max-h-[440px] object-contain rounded-2xl border border-stone-200"
                                />
                            ) : (
                                <div className="flex flex-col items-center justify-center text-center p-6 bg-stone-50/50 rounded-2xl border-2 border-dashed border-stone-300 w-full h-full max-h-[440px]">
                                    <div className="w-20 h-20 rounded-2xl bg-white border border-stone-200 flex items-center justify-center p-2 mb-3 shadow-2xs">
                                        <img src="/dracker_character.png" alt="Drácker" className="w-full h-full object-contain" />
                                    </div>
                                    <span className="text-xs font-black text-stone-700 uppercase tracking-wider mb-1">
                                        Ilustração da Página {currentPage.pageNumber}
                                    </span>
                                    <p className="text-xs text-stone-500 max-w-xs italic mb-2">
                                        Espaço dedicado para os alunos colorirem após a leitura!
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Lado Direito: Texto da História em Fundo Branco Limpo */}
                        <div className="flex-1 p-8 md:p-12 flex flex-col justify-between bg-white text-stone-900">
                            <div>
                                <div className="flex justify-between items-center mb-4 pb-2 border-b border-stone-100">
                                    <h3 className="text-xl sm:text-2xl font-black text-stone-900 font-serif">
                                        {currentPage.title || `Capítulo ${currentPage.pageNumber}`}
                                    </h3>
                                    <span className="text-xs font-bold text-stone-500 bg-stone-100 px-2.5 py-0.5 rounded-full font-mono">
                                        Página {currentPage.pageNumber}
                                    </span>
                                </div>

                                {/* Texto da narrativa com excelente legibilidade e economia de tinta */}
                                <div className="text-base sm:text-[17px] text-stone-800 leading-relaxed font-serif space-y-3 whitespace-pre-line">
                                    {currentPage.text}
                                </div>

                                {/* Fala Marcante do Personagem */}
                                {currentPage.dialogue && (
                                    <div className="mt-5 p-3.5 rounded-xl bg-stone-50 border-l-4 border-stone-400 text-sm italic text-stone-800 flex items-start gap-2.5">
                                        <MessageCircle className="w-4 h-4 text-stone-500 shrink-0 mt-0.5" />
                                        <span>"{currentPage.dialogue}"</span>
                                    </div>
                                )}
                            </div>

                            {/* Pergunta Interativa para o Aluno */}
                            {currentPage.interactiveQuestion && (
                                <div className="mt-6 pt-3 border-t border-stone-200 flex items-start gap-2 text-xs font-bold text-stone-800 bg-stone-50 p-3 rounded-xl border border-stone-200">
                                    <HelpCircle className="w-4 h-4 text-stone-600 shrink-0 mt-0.5" />
                                    <div>
                                        <span className="uppercase text-[10px] text-stone-500 tracking-wider block font-black">Desafio de Atenção:</span>
                                        <span>{currentPage.interactiveQuestion}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* --- CONTEÚDO: CONTRACAPA LIMPA --- */}
                {isBackCover && (
                    <div className="flex-1 p-8 sm:p-14 flex flex-col justify-between bg-white text-center storybook-print-page">
                        <div className="max-w-2xl mx-auto flex flex-col items-center">
                            <img src="/dracker_character.png" alt="Drácker" className="w-20 h-20 object-contain mb-4" />
                            <h2 className="text-2xl sm:text-3xl font-black text-stone-900 font-serif mb-2">
                                Fim da Nossa Expedição!
                            </h2>
                            <p className="text-base text-stone-600 italic max-w-lg mb-6">
                                "{book.moralLesson || 'Aprender juntos na floresta mágica transforma qualquer dúvida em pura descoberta!'}"
                            </p>

                            {/* Desafio de Atividade Final */}
                            {book.backCover?.activity && (
                                <div className="w-full bg-stone-50 p-6 rounded-2xl border-2 border-dashed border-stone-300 text-left">
                                    <span className="text-xs font-black uppercase text-stone-700 tracking-wider flex items-center gap-1.5 mb-2">
                                        ✏️ Desafio Prático do Aluno:
                                    </span>
                                    <p className="text-sm font-semibold text-stone-800 leading-relaxed">
                                        {book.backCover.activity}
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="text-xs text-stone-400 font-semibold mt-6 pt-4 border-t border-stone-200">
                            Drácker Adapta • Livro Infantil Pedagógico
                        </div>
                    </div>
                )}

                {/* Barra Inferior de Navegação de Páginas (Paginador) */}
                <div className="bg-white/95 backdrop-blur-md px-6 py-3 border-t border-amber-200/70 flex items-center justify-between z-40 shrink-0 no-print">
                    <button
                        onClick={() => setCurrentPageIndex(prev => Math.max(0, prev - 1))}
                        disabled={currentPageIndex === 0}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl font-bold text-xs text-brown-700 hover:bg-amber-100 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                    >
                        <ChevronLeft className="w-4 h-4" />
                        <span>Página Anterior</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                        {Array.from({ length: totalViews }).map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => setCurrentPageIndex(idx)}
                                className={`w-3 h-3 rounded-full transition-all cursor-pointer ${
                                    currentPageIndex === idx 
                                        ? 'bg-amber-600 scale-125 shadow-xs' 
                                        : 'bg-brown-200 hover:bg-brown-300'
                                }`}
                                title={idx === 0 ? 'Capa' : idx === totalViews - 1 ? 'Contracapa' : `Página ${idx}`}
                            />
                        ))}
                        <span className="text-xs font-extrabold text-brown-800 ml-2 font-mono">
                            {currentPageIndex === 0 ? 'Capa' : currentPageIndex === totalViews - 1 ? 'Contracapa' : `${currentPageIndex} de ${pages.length}`}
                        </span>
                    </div>

                    <button
                        onClick={() => setCurrentPageIndex(prev => Math.min(totalViews - 1, prev + 1))}
                        disabled={currentPageIndex === totalViews - 1}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl font-bold text-xs text-brown-700 hover:bg-amber-100 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                    >
                        <span>Próxima Página</span>
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StorybookViewer;
