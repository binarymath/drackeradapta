import React, { useState } from 'react';
import { ArrowLeft, Printer, HelpCircle } from 'lucide-react';

const MemoryPrintPreview = ({
    items, // Array de cards a imprimir
    topic,
    cardBackImage,
    onClose
}) => {
    const [printSide, setPrintSide] = useState('front'); // 'front' | 'back'

    const triggerPrint = () => {
        setTimeout(() => window.print(), 200);
    };

    return (
        <div id="print-root" className="fixed inset-0 z-[9999] bg-white text-black overflow-y-auto flex flex-col print:static print:h-auto print:overflow-visible print:block">

            {/* --- CONTROLES (Não aparecem na impressão) --- */}
            <div className="bg-brown-900 text-brown-50 p-4 shadow-md flex justify-between items-center no-print sticky top-0 z-50">
                <div className="flex items-center gap-3">
                    <button onClick={onClose} className="p-2 hover:bg-brown-800 rounded-lg flex items-center gap-2 text-sm transition-colors">
                        <ArrowLeft size={20} /> Voltar
                    </button>
                    <div className="h-6 w-px bg-brown-700 mx-2"></div>

                    <div className="flex bg-brown-800 rounded-lg p-1 gap-1">
                        <button
                            onClick={() => setPrintSide('front')}
                            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${printSide === 'front' ? 'bg-white text-brown-900 shadow' : 'text-brown-300 hover:text-white'}`}
                        >
                            Frentes
                        </button>
                        <button
                            onClick={() => setPrintSide('back')}
                            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${printSide === 'back' ? 'bg-white text-brown-900 shadow' : 'text-brown-300 hover:text-white'}`}
                        >
                            Versos
                        </button>
                    </div>
                </div>

                <button onClick={triggerPrint} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 shadow-lg transition-colors">
                    <Printer size={20} /> IMPRIMIR AGORA
                </button>
            </div>

            {/* --- ÁREA DE IMPRESSÃO --- */}
            <div className="flex-1 p-8 bg-gray-100 print:bg-white print:p-0 flex justify-center">
                <div className="w-[210mm] bg-white min-h-[297mm] shadow-xl p-[10mm] print:shadow-none print:w-full print:p-0 print:m-0 box-border">

                    {/* Cabeçalho da Página */}
                    <div className="text-center mb-4 border-b-2 border-black pb-2 print-header">
                        <h1 className="text-2xl font-bold uppercase">{topic || "Jogo da Memória"}</h1>
                        <p className="text-sm text-gray-500 italic">
                            {printSide === 'front' ? 'FRENTES - Imprima esta página primeiro.' : 'VERSOS - Imprima no verso da folha (centralizado).'}
                        </p>
                    </div>

                    {/* GRID DE CARTAS */}
                    {/* Usamos flex-wrap e dimensões exatas em mm */}
                    <div className="flex flex-wrap justify-center content-start gap-1 mx-auto print-grid">
                        {items.map((card) => {
                            // RENDERIZAÇÃO DA FRENTE
                            if (printSide === 'front') {
                                const img = card.customImage;
                                const hasText = card.content && card.content.trim() !== '';

                                return (
                                    <div key={`front-${card.id}`} className="print-card relative border border-dashed border-gray-400 flex flex-col items-center justify-center text-center p-2 overflow-hidden bg-white">
                                        {/* Se não tiver texto, imagem full opacity (igual verso). Se tiver texto, opacity-80 */}
                                        {img && (
                                            <img
                                                src={img}
                                                className={`absolute inset-0 w-full h-full object-cover ${hasText ? 'opacity-80' : ''}`}
                                                alt=""
                                            />
                                        )}

                                        {hasText && (
                                            <div className="relative z-10 font-bold text-lg leading-tight p-1 break-words w-full h-full flex items-center justify-center">
                                                <span className="bg-white/50 p-1 rounded backdrop-blur-[2px]">
                                                    {card.content}
                                                </span>
                                            </div>
                                        )}

                                        <div className="absolute top-1 left-1 text-[10px] text-gray-500 border border-gray-300 rounded px-1 leading-none bg-white/80 z-20">
                                            {card.type === 'question' ? '?' : '!'}
                                        </div>
                                    </div>
                                );
                            }
                            // RENDERIZAÇÃO DO VERSO
                            else {
                                return (
                                    <div key={`back-${card.id}`} className="print-card relative border border-dashed border-gray-400 flex flex-col items-center justify-center p-0 overflow-hidden bg-slate-100">
                                        {cardBackImage ? (
                                            <img src={cardBackImage} className="w-full h-full object-cover" alt="Verso" />
                                        ) : (
                                            <div className="flex flex-col items-center justify-center h-full w-full text-gray-300">
                                                <HelpCircle size={32} />
                                                <span className="text-[10px] mt-1">Verso</span>
                                            </div>
                                        )}
                                    </div>
                                );
                            }
                        })}
                    </div>

                    <div className="mt-8 text-center text-[10px] text-gray-400 pt-2 print-footer">
                        Gerado via Atividade Adaptada • {new Date().toLocaleDateString()}
                    </div>
                </div>
            </div>

            <style>{`
                /* Dimensões Padrão de Carta (Magic/Poker size): 63mm x 88mm */
                .print-card {
                    width: 63mm;
                    height: 88mm;
                    break-inside: avoid;
                    page-break-inside: avoid;
                }
                
                .print-grid {
                    max-width: 195mm; 
                }

                @media print {
                    .no-print { display: none !important; }
                    
                    /* Oculta tudo por padrão usando visibility para manter fluxo mas esconder visualmente */
                    body * {
                        visibility: hidden;
                    }

                    /* Exibe apenas o conteúdo deste modal de impressão */
                    #print-root, #print-root * {
                        visibility: visible;
                    }

                    /* Posiciona o modal de impressão para ocupar tudo */
                    #print-root {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        height: 100%;
                        overflow: visible !important;
                        background: white;
                        display: block !important;
                        z-index: 99999;
                    }

                    @page { 
                        size: A4 portrait; 
                        margin: 10mm; 
                    }
                }
            `}</style>
        </div>
    );
};

export default MemoryPrintPreview;
