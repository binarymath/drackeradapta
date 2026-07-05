import React, { useState, useMemo } from 'react';
import { toDirectImageUrl } from './DominoEditorModal';
import { LatexRenderer } from '../ui/LatexRenderer';

const DominoPrint = ({ data }) => {
    const { pairs = [], isCircular = false, topic = '' } = data || {};
    const [textFontSize, setTextFontSize] = useState(data?.textFontSize || data?.fontSizePx || 14);
    const [mathFontSize, setMathFontSize] = useState(data?.mathFontSize || data?.fontSizePx || 18);
    
    const pieces = useMemo(() => {
        if (!pairs || pairs.length === 0) return [];
        
        let generatedPieces = [];
        
        if (isCircular) {
            // Ciclo Fechado: A primeira peça recebe a resposta da última
            for (let i = 0; i < pairs.length; i++) {
                const prevIndex = i === 0 ? pairs.length - 1 : i - 1;
                generatedPieces.push({
                    id: "piece-" + i,
                    left: pairs[prevIndex].answer,
                    right: pairs[i].question
                });
            }
        } else {
            // Cadeia Linear: Peça de Início e Peça de Fim explícitas
            generatedPieces.push({
                id: 'piece-start',
                left: { type: 'text', content: 'INÍCIO' },
                right: pairs[0].question
            });
            
            for (let i = 1; i < pairs.length; i++) {
                generatedPieces.push({
                    id: "piece-" + i,
                    left: pairs[i - 1].answer,
                    right: pairs[i].question
                });
            }
            
            generatedPieces.push({
                id: 'piece-end',
                left: pairs[pairs.length - 1].answer,
                right: { type: 'text', content: 'FIM' }
            });
        }
        
        // Embaralhar as peças para a folha de impressão
        const shuffled = [...generatedPieces];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        
        return shuffled;
    }, [pairs, isCircular]);

    if (!pairs || pairs.length === 0) {
        return <div className="text-center p-10 text-brown-500">Nenhum dado de dominó disponível.</div>;
    }

    const renderSide = (sideData, isStartOrEnd) => {
        if (isStartOrEnd) {
            return (
                <div className="w-full h-full flex items-center justify-center bg-brown-100/30">
                    <span className="font-black tracking-widest text-brown-800 text-lg print:text-2xl uppercase transform -rotate-90 md:rotate-0 text-center px-2">
                        {sideData.content}
                    </span>
                </div>
            );
        }

        if (sideData.type === 'image' && sideData.content) {
            return (
                <div className="w-full h-full overflow-hidden flex items-center justify-center bg-white">
                    <img src={toDirectImageUrl(sideData.content)} alt="Domino side" className="w-full h-full object-fill" />
                </div>
            );
        }

        const contentStr = (sideData.content || '').toString();
        const hasLatex = /\$\$.*?\$\$|\$.*?\$|\\\[.*?\\\]|\\\(.*?\\\)|\\frac|\\sqrt|\\sin|\\cos|\^|_|\\alpha|\\beta|\\pi/.test(contentStr);
        if (sideData.type === 'formula' || sideData.type === 'math' || hasLatex) {
            return (
                <div className="w-full h-full p-2 flex items-center justify-center overflow-hidden">
                    <LatexRenderer content={sideData.content} mathFontSize={mathFontSize} textFontSize={textFontSize} className="font-bold text-brown-900 text-center flex items-center justify-center" />
                </div>
            );
        }
        const len = contentStr.length;
        let textSizeClass = 'text-xs print:text-[13px] leading-tight font-bold';
        if (len <= 6) {
            textSizeClass = 'text-base print:text-lg font-black';
        } else if (len <= 18) {
            textSizeClass = 'text-xs print:text-sm font-bold leading-snug';
        }

        return (
            <div className="w-full h-full p-2 flex items-center justify-center overflow-hidden">
                <span className="text-brown-900 text-center break-normal w-full px-1 font-bold leading-snug" style={{ fontSize: `${textFontSize}px` }}>
                    {sideData.content}
                </span>
            </div>
        );
    };

    return (
        <div className="bg-white min-h-screen p-8 print:p-0 print:bg-transparent text-black">
            <div className="mb-8 print:hidden text-center max-w-2xl mx-auto flex flex-col items-center">
                <div className="flex items-center gap-4 mb-2">
                    <img src="/dracker_character.png" alt="Drácker" className="w-20 h-20 md:w-24 md:h-24 object-contain drop-shadow-md" />
                    <h1 className="text-2xl md:text-3xl font-bold text-brown-800 uppercase tracking-wider">{topic || 'Dominó Educativo'}</h1>
                </div>
                <div className="mt-4 p-3 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg text-sm font-semibold w-full flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
                    <span>Total de Peças a Imprimir: <strong>{pieces.length}</strong></span>
                    <div className="flex flex-wrap items-center gap-3 font-bold text-amber-900">
                        <div className="flex items-center gap-1.5 bg-white border border-amber-300 rounded-lg px-2 py-1 text-xs shadow-2xs">
                            <span>📝 Texto:</span>
                            <select
                                value={textFontSize}
                                onChange={(e) => setTextFontSize(Number(e.target.value))}
                                className="bg-transparent font-black text-brown-900 cursor-pointer focus:outline-none"
                            >
                                <option value={12}>12 px</option>
                                <option value={14}>14 px</option>
                                <option value={16}>16 px</option>
                                <option value={18}>18 px</option>
                                <option value={20}>20 px</option>
                                <option value={22}>22 px</option>
                                <option value={24}>24 px</option>
                                <option value={28}>28 px</option>
                            </select>
                        </div>
                        <div className="flex items-center gap-1.5 bg-white border border-amber-300 rounded-lg px-2 py-1 text-xs shadow-2xs">
                            <span>🧮 Fórmula:</span>
                            <select
                                value={mathFontSize}
                                onChange={(e) => setMathFontSize(Number(e.target.value))}
                                className="bg-transparent font-black text-brown-900 cursor-pointer focus:outline-none"
                            >
                                <option value={14}>14 px</option>
                                <option value={16}>16 px</option>
                                <option value={18}>18 px</option>
                                <option value={20}>20 px</option>
                                <option value={22}>22 px</option>
                                <option value={24}>24 px</option>
                                <option value={28}>28 px</option>
                                <option value={32}>32 px</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Print Header */}
            <div className="hidden print:block mb-6 text-center border-b-2 border-black pb-4">
                <h1 className="text-2xl font-black uppercase tracking-wider">{topic || 'Dominó Educativo'}</h1>
                <p className="text-sm font-bold text-gray-600 mt-1">Recorte nas linhas pontilhadas para jogar.</p>
            </div>

            {/* Grid de Peças */}
            <div className="grid grid-cols-1 md:grid-cols-2 print:grid-cols-2 gap-6 print:gap-x-4 print:gap-y-6 max-w-4xl mx-auto">
                {pieces.map((piece, index) => {
                    const isStart = piece.left.content === 'INÍCIO';
                    const isEnd = piece.right.content === 'FIM';

                    return (
                        <div 
                            key={piece.id} 
                            className="aspect-[2/1] border-[3px] border-dashed border-gray-400 rounded-xl flex relative overflow-hidden bg-white shadow-sm print:shadow-none break-inside-avoid print:break-inside-avoid"
                            title={"Peça " + (index + 1)}
                        >
                            {/* Metade Esquerda */}
                            <div className="w-1/2 h-full border-r-[3px] border-solid border-gray-400 relative">
                                {renderSide(piece.left, isStart)}
                            </div>
                            
                            {/* Linha Central Decorativa do Dominó (Bolinha) */}
                            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-gray-400 rounded-full z-10"></div>

                            {/* Metade Direita */}
                            <div className="w-1/2 h-full relative">
                                {renderSide(piece.right, isEnd)}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default DominoPrint;
