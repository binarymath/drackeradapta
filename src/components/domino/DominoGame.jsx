import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import confetti from 'canvas-confetti';
import { toDirectImageUrl } from './DominoEditorModal';
import { LatexRenderer } from '../ui/LatexRenderer';

const DominoGame = ({ data, isGameMode }) => {
    const { pairs = [], isCircular = false } = data || {};
    
    // Convert pairs to pieces (same logic as Print)
    const allPieces = useMemo(() => {
        if (!pairs || pairs.length === 0) return [];
        let generatedPieces = [];
        
        if (isCircular) {
            for (let i = 0; i < pairs.length; i++) {
                const prevIndex = i === 0 ? pairs.length - 1 : i - 1;
                generatedPieces.push({
                    id: "piece-" + i,
                    left: pairs[prevIndex].answer,
                    right: pairs[i].question,
                    pairIndex: i
                });
            }
        } else {
            generatedPieces.push({
                id: 'piece-start',
                left: { type: 'text', content: 'INÍCIO' },
                right: pairs[0].question,
                isStart: true
            });
            for (let i = 1; i < pairs.length; i++) {
                generatedPieces.push({
                    id: "piece-" + i,
                    left: pairs[i - 1].answer,
                    right: pairs[i].question,
                    pairIndex: i
                });
            }
            generatedPieces.push({
                id: 'piece-end',
                left: pairs[pairs.length - 1].answer,
                right: { type: 'text', content: 'FIM' },
                isEnd: true
            });
        }
        return generatedPieces;
    }, [pairs, isCircular]);

    const [hand, setHand] = useState([]);
    const [chain, setChain] = useState([]);
    const [errorMsg, setErrorMsg] = useState('');
    const [gameWon, setGameWon] = useState(false);
    const [textFontSize, setTextFontSize] = useState(data?.textFontSize || data?.fontSizePx || 14);
    const [mathFontSize, setMathFontSize] = useState(data?.mathFontSize || data?.fontSizePx || 18);

    useEffect(() => {
        if (isGameMode && allPieces.length > 0) {
            startGame();
        }
    }, [isGameMode, allPieces]);

    const startGame = () => {
        // Shuffle pieces
        const shuffled = [...allPieces].sort(() => Math.random() - 0.5);
        
        // Pick a random first piece for BOTH linear and circular
        const firstPieceIndex = 0;

        const firstPiece = shuffled.splice(firstPieceIndex, 1)[0];
        setChain([firstPiece]);
        setHand(shuffled);
        setGameWon(false);
        setErrorMsg('');
    };

    const attemptPlay = (piece, targetSide = null) => {
        if (gameWon) return;

        const leftOpen = chain[0].left.content;
        const rightOpen = chain[chain.length - 1].right.content;

        const newLeft = piece.left.content;
        const newRight = piece.right.content;

        // Logical match check: find the pair that holds the question, and check if the answer matches.
        const checkMatch = (questionContent, answerContent) => {
            const pair = pairs.find(p => p.question.content === questionContent);
            return pair && pair.answer.content === answerContent;
        };

        let matched = false;
        let newChain = [...chain];

        const canMatchRight = checkMatch(rightOpen, newLeft);
        const canMatchLeft = checkMatch(newRight, leftOpen);

        if (targetSide === 'right' && canMatchRight) {
            newChain = [...chain, piece];
            matched = true;
        } else if (targetSide === 'left' && canMatchLeft) {
            newChain = [piece, ...chain];
            matched = true;
        } else if (!targetSide) {
            // Click fallback: try right, then left
            if (canMatchRight) {
                newChain = [...chain, piece];
                matched = true;
            } else if (canMatchLeft) {
                newChain = [piece, ...chain];
                matched = true;
            }
        }

        if (matched) {
            setChain(newChain);
            setHand(hand.filter(p => p.id !== piece.id));
            setErrorMsg('');
            
            if (hand.length === 1) {
                // Game over! Won!
                setGameWon(true);
                confetti({
                    particleCount: 150,
                    spread: 80,
                    origin: { y: 0.6 }
                });
            }
        } else {
            // Error!
            setErrorMsg(targetSide ? 'Essa peça não encaixa nesta ponta!' : 'Essa peça não encaixa em nenhuma das pontas abertas!');
            setTimeout(() => setErrorMsg(''), 3000);
        }
    };

    const handleDrop = (e, side) => {
        e.preventDefault();
        const pieceId = e.dataTransfer.getData('pieceId');
        if (!pieceId) return;

        const piece = hand.find(p => p.id === pieceId);
        if (!piece) return;

        attemptPlay(piece, side);
    };

    const handleUndo = (piece) => {
        if (chain.length <= 1 || gameWon) return;
        
        if (chain[0].id === piece.id) {
            setChain(chain.slice(1));
            setHand([...hand, piece]);
        } else if (chain[chain.length - 1].id === piece.id) {
            setChain(chain.slice(0, chain.length - 1));
            setHand([...hand, piece]);
        }
    };

    const renderSide = (sideData) => {
        if (!sideData) return null;
        if (sideData.content === 'INÍCIO' || sideData.content === 'FIM') {
            return <div className="font-black text-brown-800 uppercase tracking-wider">{sideData.content}</div>;
        }
        if (sideData.type === 'image') {
            return <div className="w-full h-full overflow-hidden flex items-center justify-center bg-white"><img src={toDirectImageUrl(sideData.content)} alt="Domino side" className="w-full h-full object-fill" /></div>;
        }
        const contentStr = (sideData.content || '').toString();
        const hasLatex = /\$\$.*?\$\$|\$.*?\$|\\\[.*?\\\]|\\\(.*?\\\)|\\frac|\\sqrt|\\sin|\\cos|\^|_|\\alpha|\\beta|\\pi/.test(contentStr);
        if (sideData.type === 'formula' || sideData.type === 'math' || hasLatex) {
            return (
                <div className="w-full h-full p-2 flex items-center justify-center overflow-y-auto max-h-full custom-scrollbar">
                    <LatexRenderer content={sideData.content} mathFontSize={mathFontSize} textFontSize={textFontSize} className="font-bold text-brown-900 text-center" />
                </div>
            );
        }
        return (
            <div className="text-brown-900 text-center px-2 break-normal w-full overflow-y-auto max-h-full custom-scrollbar flex items-center justify-center font-bold leading-snug" style={{ fontSize: `${textFontSize}px` }}>
                {sideData.content}
            </div>
        );
    };

    const renderPiece = (piece, actionHandler, type = 'none') => {
        const isHand = type === 'hand';
        const isUndoable = type === 'undo';

        return (
            <div 
                key={piece.id} 
                draggable={isHand}
                onDragStart={isHand ? (e) => {
                    e.dataTransfer.setData('pieceId', piece.id);
                } : undefined}
                onClick={isHand || isUndoable ? () => actionHandler(piece) : undefined}
                className={"flex items-center w-64 h-28 md:w-80 md:h-36 border-[3px] rounded-xl relative bg-white overflow-hidden shadow-sm flex-shrink-0 transition-transform " + (
                    isHand ? "cursor-grab active:cursor-grabbing hover:scale-105 border-brown-300 hover:border-amber-500 hover:shadow-md" : 
                    isUndoable ? "cursor-pointer hover:scale-[1.02] border-brown-300 hover:border-red-400 shadow-md" :
                    "border-gray-400 opacity-90"
                )}
            >
                {/* Left */}
                <div className="w-1/2 h-full flex items-center justify-center border-r-[3px] border-gray-400 relative pointer-events-none">
                    {renderSide(piece.left)}
                </div>
                {/* Center dot */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-gray-400 rounded-full z-10 pointer-events-none"></div>
                {/* Right */}
                <div className="w-1/2 h-full flex items-center justify-center relative pointer-events-none">
                    {renderSide(piece.right)}
                </div>
            </div>
        );
    };

    if (!isGameMode) return null;

    return (
        <div className="flex flex-col gap-6 w-full p-4 md:p-6 bg-brown-50 rounded-xl min-h-[60vh]">
            
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-4 rounded-xl shadow-sm border border-brown-100 gap-3">
                <div>
                    <h2 className="text-xl font-bold text-brown-800">Dominó Interativo</h2>
                    <p className="text-sm text-brown-500">Conecte as perguntas com as respostas corretas!</p>
                </div>
                <div className="flex flex-wrap gap-3 items-center">
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 px-2 py-1 rounded-lg text-xs font-bold text-amber-900 shadow-2xs">
                            <span>📝 Texto:</span>
                            <select
                                value={textFontSize}
                                onChange={(e) => setTextFontSize(Number(e.target.value))}
                                className="bg-white border border-amber-300 rounded px-1 py-0.5 text-xs font-black text-brown-900 cursor-pointer focus:outline-none"
                            >
                                <option value={12}>12 px</option>
                                <option value={14}>14 px</option>
                                <option value={16}>16 px</option>
                                <option value={18}>18 px</option>
                                <option value={20}>20 px</option>
                                <option value={22}>22 px</option>
                                <option value={24}>24 px</option>
                            </select>
                        </div>
                        <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 px-2 py-1 rounded-lg text-xs font-bold text-amber-900 shadow-2xs">
                            <span>🧮 Fórmula:</span>
                            <select
                                value={mathFontSize}
                                onChange={(e) => setMathFontSize(Number(e.target.value))}
                                className="bg-white border border-amber-300 rounded px-1 py-0.5 text-xs font-black text-brown-900 cursor-pointer focus:outline-none"
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
                    <div className="bg-amber-100 text-amber-800 px-4 py-2 rounded-lg font-bold text-sm">
                        Faltam: {hand.length} peças
                    </div>
                    <Button onClick={startGame} variant="outline" icon={RefreshCw}>Recomeçar</Button>
                </div>
            </div>

            {/* Error Message */}
            {errorMsg && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2 animate-bounce">
                    <AlertCircle className="w-5 h-5" />
                    <span className="font-bold text-sm">{errorMsg}</span>
                </div>
            )}

            {/* Game Board (Chain) */}
            <div className="flex-1 bg-white border border-brown-200 rounded-xl p-4 md:p-8 flex flex-wrap justify-center items-center gap-2 md:gap-4 content-start overflow-y-auto">
                {/* Left placeholder */}
                {!gameWon && chain[0]?.left?.content !== 'INÍCIO' && (
                    <div 
                        onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
                        onDrop={(e) => handleDrop(e, 'left')}
                        className="flex items-center justify-center w-64 h-28 md:w-80 md:h-36 border-[3px] border-dashed border-amber-300 rounded-xl bg-amber-50/50 hover:bg-amber-100 transition-colors"
                    >
                        <span className="text-amber-600 font-bold text-sm md:text-base text-center px-4 pointer-events-none">
                            Arraste para encaixar à esquerda
                        </span>
                    </div>
                )}

                {chain.map((piece, idx) => {
                    const isUndoable = !gameWon && chain.length > 1 && (idx === 0 || idx === chain.length - 1);
                    return (
                        <div key={piece.id} className="animate-in fade-in zoom-in duration-300 relative group">
                            {renderPiece(piece, isUndoable ? handleUndo : null, isUndoable ? 'undo' : 'board')}
                            {isUndoable && (
                                <div className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-20 shadow-md" onClick={() => handleUndo(piece)} title="Desfazer jogada">
                                    <RefreshCw className="w-4 h-4" />
                                </div>
                            )}
                        </div>
                    );
                })}
                
                {/* Right placeholder */}
                {!gameWon && chain[chain.length - 1]?.right?.content !== 'FIM' && (
                    <div 
                        onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
                        onDrop={(e) => handleDrop(e, 'right')}
                        className="flex items-center justify-center w-64 h-28 md:w-80 md:h-36 border-[3px] border-dashed border-amber-300 rounded-xl bg-amber-50/50 hover:bg-amber-100 transition-colors"
                    >
                        <span className="text-amber-600 font-bold text-sm md:text-base text-center px-4 pointer-events-none">
                            Arraste para encaixar à direita
                        </span>
                    </div>
                )}
            </div>

            {/* Player Hand */}
            {gameWon ? (
                <Card className="bg-green-50 border-green-200 flex flex-col items-center py-8">
                    <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
                    <h2 className="text-2xl font-black text-green-800 mb-2">Parabéns!</h2>
                    <p className="text-green-700 font-medium mb-6">Você conectou todas as {allPieces.length} peças com sucesso!</p>
                    <Button onClick={startGame} className="bg-green-600 hover:bg-green-700 text-white" icon={RefreshCw}>Jogar Novamente</Button>
                </Card>
            ) : (
                <div className="bg-brown-100/50 p-4 rounded-xl border border-brown-200">
                    <h3 className="font-bold text-brown-700 mb-3 text-sm uppercase tracking-wider">Suas Peças (Arraste ou Clique para jogar)</h3>
                    <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
                        {hand.map((piece) => renderPiece(piece, attemptPlay, 'hand'))}
                    </div>
                </div>
            )}

        </div>
    );
};

export default DominoGame;
