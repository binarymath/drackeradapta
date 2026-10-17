import React from 'react';
import { toDirectImageUrl, handleDriveImageError } from '../../../utils/urlUtils';

export const StorybookPrintBooklet = ({
    book,
    pages,
    getPageScales,
    getPageAligns,
    printLayoutMode
}) => {
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
            <div className="flex items-center gap-3 border-b border-stone-300 pb-2 mb-3">
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
                    {/* Cabeçalho da página: Paginação à esquerda, próxima ao centro da folha A4 em paisagem */}
                    <div className="flex items-center gap-3 border-b border-stone-300 pb-2.5 mb-4">
                        <div className="flex flex-col items-center justify-center bg-white border border-stone-300 px-3 py-1 rounded-2xl shrink-0 select-none leading-tight min-w-[54px]">
                            <span className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider">
                                Página
                            </span>
                            <span className="text-xs font-black text-stone-800">
                                {p.pageNumber}
                            </span>
                        </div>
                        <h2 
                            className="sb-print-chapter-title font-black font-serif text-black flex-1"
                            style={{
                                fontSize: `${(26 * pScales.title) / 100}px`,
                                textAlign: pAligns.title || 'left',
                                lineHeight: 1.25
                            }}
                        >
                            {p.title || `Capítulo ${p.pageNumber}`}
                        </h2>
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
            {book.backCover?.imageUrl ? (
                <div 
                    className={`w-full flex-1 flex flex-col justify-center items-center ${
                        backAligns.image === 'left' ? 'items-start' :
                        backAligns.image === 'right' ? 'items-end' : 'items-center'
                    }`}
                >
                    <img 
                        src={toDirectImageUrl(book.backCover.imageUrl)} 
                        alt="Logo ou Imagem da Contracapa" 
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
            ) : (
                <div className="w-full flex-1 flex flex-col justify-center items-center">
                    <img src="/dracker_character.png" alt="Drácker" className="w-20 h-20 object-contain opacity-30 mb-2" />
                    <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">Espaço para Anotações do Aluno</span>
                </div>
            )}
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
                <div className="border-b border-stone-300 pb-2.5 mb-4 flex items-center gap-3">
                    <div className="flex flex-col items-center justify-center bg-white border border-stone-300 px-3 py-1 rounded-2xl shrink-0 select-none leading-tight min-w-[54px]">
                        <span className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider">
                            Final
                        </span>
                        <span className="text-xs font-black text-stone-800">
                            Contracapa
                        </span>
                    </div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900 border border-amber-400 bg-amber-50 px-3 py-1 rounded">
                        Conclusão da História
                    </span>
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

    return (
        <div className="storybook-print-container">
            {(() => {
                // ==========================================
                // 1. MODO LIVRETO GRAMPEADO (BOOKLET OCIDENTAL / BRASIL)
                // ==========================================
                // Em um mini-livro infantil grampeado no centro:
                // Cada folha A4 paisagem é dobrada no meio e contém:
                // - Folha 1 (Capa / Contracapa):
                //     Lado de Fora: Contracapa (Esquerda) | Capa (Direita)
                //     Lado de Dentro (Verso): Conclusão da História (Esquerda) | Sinopse/Apresentação (Direita)
                // - Folhas Internas:
                //     Cada folha interna contém a Ilustração na Esquerda e a História/Narrativa na Direita.
                // Isso elimina completamente quaisquer páginas em branco ou páginas de anotações soltas!
                if (printLayoutMode === 'booklet') {
                    return (
                        <>
                            {/* FOLHA 1 - FRENTE (EXTERNA): [ Contracapa (Final) | Capa (Início) ] */}
                            <div className="storybook-print-page relative">
                                {renderBackLeft()}
                                {renderCoverLeft()}
                            </div>

                            {/* FOLHA 1 - VERSO (INTERNA DA CAPA): [ Conclusão | Apresentação da Capa ] */}
                            <div className="storybook-print-page relative">
                                {renderBackRight()}
                                {renderCoverRight()}
                            </div>

                            {/* FOLHAS DO MIOLO (HISTÓRIAS INTERNAS): [ Ilustração (Esquerda) | Texto (Direita) ] */}
                            {pages.map(p => (
                                <div key={`booklet-page-${p.pageNumber}`} className="storybook-print-page relative">
                                    {renderStoryLeft(p)}
                                    {renderStoryRight(p)}
                                </div>
                            ))}
                        </>
                    );
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
    );
};
