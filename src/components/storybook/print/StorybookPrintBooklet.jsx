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

    return (
        <div className="storybook-print-container">
            {(() => {
                // ==========================================
                // 1. MODO LIVRETO GRAMPEADO (BOOKLET)
                // ==========================================
                if (printLayoutMode === 'booklet') {
                    // No formato ocidental/brasileiro (leitura da esquerda para a direita, abertura da direita para a esquerda):
                    // A lombada (dobra/grampo) fica à ESQUERDA.
                    // Folha 1 (Frente - Lado Externo):
                    //   [ Lado Esquerdo: Contracapa | Lado Direito: Capa ]
                    // Ao abrir a capa (da direita para a esquerda), revela-se:
                    // Folha 1 (Verso - Lado Interno):
                    //   [ Lado Esquerdo: Apresentação da Capa | Lado Direito: Ilustração da Pág 1 ]
                    // Em cada página dupla aberta interna (Miolo):
                    //   [ Lado Esquerdo: Ilustração | Lado Direito: Narrativa do Capítulo ]
                    // Na última página interna:
                    //   [ Lado Esquerdo: Conclusão/Moral | Lado Direito: Página final de atividades ]
                    const logicalPages = [];
                    // Página 1 (Capa)
                    logicalPages.push({ type: 'cover_left' });
                    // Página 2 (Verso da Capa / Apresentação)
                    logicalPages.push({ type: 'cover_right' });
                    // Miolo do Livro: cada capítulo tem Ilustração (esquerda) e Texto (direita)
                    pages.forEach(p => {
                        logicalPages.push({ type: 'story_left', page: p });
                        logicalPages.push({ type: 'story_right', page: p });
                    });
                    // Páginas finais: Conclusão (interna) e Contracapa (externa)
                    logicalPages.push({ type: 'back_right' });
                    logicalPages.push({ type: 'back_left' });

                    // Para encadernação de livreto dobrado ao meio, o número de páginas A5 deve ser múltiplo de 4
                    const remainder = logicalPages.length % 4;
                    if (remainder !== 0) {
                        const paddingCount = 4 - remainder;
                        for (let i = 0; i < paddingCount; i++) {
                            // Insere páginas em branco extras antes da contracapa final se necessário
                            logicalPages.splice(logicalPages.length - 1, 0, { type: 'blank', index: i + 1 });
                        }
                    }

                    // Algoritmo de imposição de livreto (Saddle-Stitch Booklet):
                    // N = totalUnits (múltiplo de 4), totalSheets = N / 4
                    // Folha s (0 a totalSheets - 1):
                    // - Frente (lado externo):
                    //     Esquerda: logicalPages[N - 1 - 2*s]  -> para s=0: logicalPages[N - 1] (Contracapa / back_left)
                    //     Direita:  logicalPages[2*s]          -> para s=0: logicalPages[0]     (Capa / cover_left)
                    // - Verso (lado interno virado no eixo longo):
                    //     Esquerda: logicalPages[2*s + 1]      -> para s=0: logicalPages[1]     (Apresentação / cover_right)
                    //     Direita:  logicalPages[N - 2 - 2*s]  -> para s=0: logicalPages[N - 2] (Conclusão / back_right)
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

                        // Verso da folha s (Ao virar no eixo longo/horizontal da impressora)
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
    );
};
