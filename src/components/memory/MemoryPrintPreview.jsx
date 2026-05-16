import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, Printer, HelpCircle } from 'lucide-react';

const CARDS_PER_PAGE = 9; // 3x3 grid

const MemoryPrintPreview = ({
    items, // Array de cards a imprimir
    topic,
    cardBackImage,
    onClose
}) => {
    const [printSide, setPrintSide] = useState('all'); // 'front' | 'back' | 'all'

    // Bloquear scroll do body quando aberto
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = 'auto'; };
    }, []);

    const triggerPrint = () => {
        setTimeout(() => window.print(), 200);
    };

    const chunkArray = (array, size) => {
        const chunks = [];
        for (let i = 0; i < array.length; i += size) {
            chunks.push(array.slice(i, i + size));
        }
        return chunks;
    };

    const cardChunks = chunkArray(items, CARDS_PER_PAGE);

    const renderCard = (card, side) => {
        if (card.isEmpty) {
            return <div key={card.id} className="print-card" style={{ borderColor: 'transparent', background: 'transparent' }}></div>;
        }

        if (side === 'front') {
            const img = card.customImage;
            const hasText = card.content && card.content.trim() !== '';

            return (
                <div key={`front-${card.id}`} className="print-card relative border-2 border-gray-400 flex flex-col items-center justify-center text-center overflow-hidden bg-white box-border rounded-lg">
                    {img && (
                        <img
                            src={img}
                            className={`absolute inset-0 w-full h-full object-cover ${hasText ? 'opacity-80' : ''}`}
                            alt=""
                        />
                    )}

                    {hasText && (
                        <div className="relative z-10 font-bold leading-tight p-2 break-words w-full h-full flex items-center justify-center">
                            <span className="bg-white/80 p-1 rounded backdrop-blur-[2px] text-black text-[11pt] sm:text-[13pt]">
                                {card.content}
                            </span>
                        </div>
                    )}

                    <div className="absolute top-1 left-1 text-[8pt] text-gray-500 border border-gray-300 rounded px-1 leading-none bg-white/90 z-20 font-bold">
                        {card.type === 'question' ? '?' : '!'}
                    </div>
                </div>
            );
        } else {
            return (
                <div key={`back-${card.id}`} className="print-card relative border-2 border-gray-200 flex flex-col items-center justify-center p-0 overflow-hidden bg-slate-50 box-border rounded-lg">
                    {cardBackImage ? (
                        <img src={cardBackImage} className="w-full h-full object-cover" alt="Verso" />
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full w-full text-gray-300">
                            <HelpCircle size={48} strokeWidth={1} />
                        </div>
                    )}
                </div>
            );
        }
    };

    const renderPage = (chunk, side, pageIndex, totalPages) => (
        <div key={`${side}-page-${pageIndex}`} className="print-page bg-white shadow-2xl print:shadow-none box-border flex flex-col print:m-0">
            {/* Cabeçalho Compacto */}
            <div className="text-center mb-4 border-b-2 border-black pb-2 flex flex-col items-center justify-center">
                <h1 className="text-[16pt] font-black uppercase text-black m-0 leading-tight">{topic || "Jogo da Memória"}</h1>
                <div className="w-full flex justify-between items-center px-6 mt-1">
                    <span className="text-[9pt] text-gray-700 font-bold">
                        {side === 'front' ? 'PÁGINA DE FRENTES (IMPRIMIR PRIMEIRO)' : 'PÁGINA DE VERSOS (IMPRIMIR NO VERSO)'}
                    </span>
                    <span className="text-[9pt] text-gray-500 font-bold">FOLHA {pageIndex + 1}/{totalPages}</span>
                </div>
            </div>

            {/* GRID DE CARTAS */}
            <div className="grid grid-cols-3 grid-rows-3 gap-[3mm] mx-auto flex-1 content-center justify-center items-center">
                {chunk.map(card => renderCard(card, side))}
            </div>

            <div className="mt-4 text-center text-[8pt] text-gray-400 uppercase tracking-widest pb-1 border-t border-gray-200">
                Gerado via Atividade Adaptada • {new Date().toLocaleDateString()}
            </div>
        </div>
    );

    const content = (
        <div id="print-root" className="fixed inset-0 z-[99999] bg-slate-800/90 backdrop-blur-md text-black overflow-y-auto flex flex-col print:static print:h-auto print:overflow-visible print:block print:bg-white">

            {/* --- CONTROLES --- */}
            <div className="bg-white text-slate-900 p-4 shadow-xl flex justify-between items-center no-print sticky top-0 z-50 border-b border-slate-200">
                <div className="flex items-center gap-4">
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-600">
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h2 className="font-bold text-xl leading-none">Imprimir Jogo</h2>
                        <p className="text-xs text-slate-500 mt-1">{items.length} cartas • {cardChunks.length * (printSide === 'all' ? 2 : 1)} folhas</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex bg-slate-100 rounded-lg p-1 border border-slate-200">
                        <button
                            onClick={() => setPrintSide('all')}
                            className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${printSide === 'all' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Tudo
                        </button>
                        <button
                            onClick={() => setPrintSide('front')}
                            className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${printSide === 'front' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Frentes
                        </button>
                        <button
                            onClick={() => setPrintSide('back')}
                            className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${printSide === 'back' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Versos
                        </button>
                    </div>

                    <button onClick={triggerPrint} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded-lg font-black flex items-center gap-2 shadow-lg transition-all transform active:scale-95">
                        <Printer size={20} /> GERAR PDF / IMPRIMIR
                    </button>
                </div>
            </div>

            {/* --- ÁREA DE IMPRESSÃO --- */}
            <div className="flex-1 p-12 print:bg-white print:p-0 flex flex-col items-center gap-12 print:gap-0 print:block">
                {/* Renderiza Frentes */}
                {(printSide === 'all' || printSide === 'front') && (
                    cardChunks.map((chunk, idx) => {
                        const padded = [...chunk];
                        while (padded.length < CARDS_PER_PAGE) {
                            padded.push({ id: `empty-front-${idx}-${padded.length}`, isEmpty: true });
                        }
                        return renderPage(padded, 'front', idx, cardChunks.length);
                    })
                )}
                
                {/* Renderiza Versos */}
                {(printSide === 'all' || printSide === 'back') && (
                    cardChunks.map((chunk, idx) => {
                        const padded = [...chunk];
                        while (padded.length < CARDS_PER_PAGE) {
                            padded.push({ id: `empty-back-${idx}-${padded.length}`, isEmpty: true });
                        }
                        // Espelhar colunas para alinhamento perfeito no verso (flip na borda longa)
                        const mirrored = [
                            padded[2], padded[1], padded[0],
                            padded[5], padded[4], padded[3],
                            padded[8], padded[7], padded[6]
                        ];
                        return renderPage(mirrored, 'back', idx, cardChunks.length);
                    })
                )}
            </div>

            <style>{`
                /* DIMENSÕES A4 RÍGIDAS */
                .print-page {
                    width: 210mm;
                    height: 297mm;
                    padding: 10mm;
                    margin: 0 auto;
                    page-break-after: always;
                    break-after: page;
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                    background: white;
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                }

                .print-card {
                    width: 58mm;
                    height: 82mm;
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                }

                @media print {
                    .no-print { display: none !important; }
                    
                    #root { display: none !important; }
                    
                    body {
                        margin: 0 !important;
                        padding: 0 !important;
                        overflow: visible !important;
                    }

                    body * {
                        visibility: hidden;
                    }

                    #print-root, #print-root * {
                        visibility: visible;
                    }

                    #print-root {
                        position: static !important;
                        width: 100% !important;
                        height: auto !important;
                        overflow: visible !important;
                        display: block !important;
                        background: white !important;
                    }

                    .print-page {
                        width: 210mm !important;
                        height: 297mm !important;
                        padding: 15mm !important; /* Aumentado para margem de segurança */
                        margin: 0 auto !important;
                        border: none !important;
                        box-shadow: none !important;
                        page-break-after: always !important;
                        break-after: page !important;
                        display: flex !important;
                    }

                    @page { 
                        size: A4 portrait; 
                        margin: 0; 
                    }
                }
            `}</style>
        </div>
    );

    return createPortal(content, document.body);
};

export default MemoryPrintPreview;
