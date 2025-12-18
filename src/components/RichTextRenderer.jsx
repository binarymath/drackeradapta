import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Key } from 'lucide-react';

const RichTextRenderer = ({ content, showAnswers = false, foundWords = [], foundPlacements = [], hideText = false, hideGrid = false }) => {
    if (!content) return null;

    const renderInlineStyles = (text) => {
        const cleanText = text.replace(/\$([^\$]+)\$/g, '$1');
        const parts = cleanText.split(/(\*\*.*?\*\*)/g);
        return parts.map((part, index) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={index} className="text-amber-900 font-bold">{part.slice(2, -2)}</strong>;
            }
            return part;
        });
    };

    const lines = content.split('\n');
    const elements = [];
    // Lista desativada: não renderizamos marcadores
    let listBuffer = [];
    let gridBuffer = [];
    let columnBuffer = [];
    let questionBuffer = [];
    let answerBuffer = [];

    const flushList = () => {
        // No-op: removemos marcadores de lista
        listBuffer = [];
    };

    const flushGrid = () => {
        if (gridBuffer.length > 0) {
            if (!hideGrid) {
                // Processa cada linha para separar letras corretamente
                const processedRows = gridBuffer.map(row => {
                    const trimmed = row.trim();
                    // Tenta separar por espaço primeiro
                    let letters = trimmed.split(/\s+/).filter(l => l.length > 0);

                    // Se não encontrou separação por espaço, tenta separar letra por letra
                    if (letters.length === 1 && trimmed.length > 1) {
                        letters = trimmed.split('').filter(l => /[A-Z]/i.test(l));
                    }

                    return letters;
                });

                const cols = processedRows[0]?.length || 0;

                if (cols === 0) return;

                // Monta índice de posições das palavras para destaque quando showAnswers=true
                const wordPositions = new Set();
                if (showAnswers) {
                    if (foundPlacements && foundPlacements.length > 0) {
                        // Usa coordenadas exatas fornecidas pelo gerador
                        for (const p of foundPlacements) {
                            const cells = p?.positions || p?.cells || [];
                            for (const cell of cells) {
                                if (Array.isArray(cell) && cell.length === 2) {
                                    const [r, c] = cell;
                                    wordPositions.add(`${r}-${c}`);
                                } else if (typeof cell === 'string') {
                                    wordPositions.add(cell);
                                }
                            }
                        }
                    } else if (foundWords && foundWords.length > 0) {
                        // Fallback: tentativa heurística horizontal (caso antigo)
                        const targetNorms = foundWords.map(w => w.toUpperCase());
                        for (let row = 0; row < processedRows.length; row++) {
                            for (let col = 0; col < processedRows[row].length; col++) {
                                for (const word of targetNorms) {
                                    const len = word.length;
                                    if (col + len <= processedRows[row].length) {
                                        const candidate = processedRows[row].slice(col, col + len).join('');
                                        if (candidate === word) {
                                            for (let i = 0; i < len; i++) {
                                                wordPositions.add(`${row}-${col + i}`);
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                elements.push(
                    <div key={`grid-${elements.length}`} className="mt-2 mb-0 flex justify-center">
                        <div className="inline-block">
                            <div
                                className="grid"
                                style={{ gridTemplateColumns: `repeat(${cols}, auto)`, gap: '0px', marginTop: '8px', marginBottom: '8px' }}
                            >
                                {processedRows.map((letters, rowIndex) =>
                                    letters.map((letter, colIndex) => {
                                        const isHighlighted = wordPositions.has(`${rowIndex}-${colIndex}`);
                                        return (
                                            <div
                                                key={`${rowIndex}-${colIndex}`}
                                                className={`flex items-center justify-center font-mono text-sm font-bold transition-colors cursor-pointer ${isHighlighted ? 'bg-green-300 text-slate-900' : 'text-slate-800 bg-white hover:bg-yellow-200'
                                                    }`}
                                                style={{ width: '32px', height: '32px', minWidth: '32px', minHeight: '32px' }}
                                            >
                                                {letter.toUpperCase()}
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>
                );
            }
            gridBuffer = [];
        }
    };

    const flushColumn = () => {
        if (columnBuffer.length > 0) {
            if (!hideGrid) {
                elements.push(
                    <div key={`col-${elements.length}`} className="my-6">
                        <div className="grid grid-cols-2 gap-6 items-start">
                            {columnBuffer.map((row, idx) => (
                                <React.Fragment key={idx}>
                                    <div className="text-left font-medium text-slate-800">{renderInlineStyles(row.left)}</div>
                                    <div className="text-right font-medium text-slate-800">{renderInlineStyles(row.right)}</div>
                                </React.Fragment>
                            ))}
                        </div>
                    </div>
                );
            }
            columnBuffer = [];
        }
    };

    const flushQuestion = () => {
        if (questionBuffer.length > 0) {
            elements.push(
                <div key={`q-${elements.length}`} className="mb-4 bg-white p-5 rounded-xl border border-blue-100 shadow-sm hover:border-blue-300 transition-colors">
                    {questionBuffer.map((qLine, qIdx) => {
                        const isEnunciado = /^\d+\./.test(qLine);
                        return (
                            <div key={qIdx} className={`${isEnunciado ? 'font-bold text-slate-800 text-lg mb-3' : 'ml-0 pl-4 py-1 text-slate-700 hover:bg-slate-50 rounded flex items-center'}`}>
                                {isEnunciado ? renderInlineStyles(qLine) : <span className="w-full">{renderInlineStyles(qLine)}</span>}
                            </div>
                        );
                    })}
                </div>
            );
            questionBuffer = [];
        }
    };

    const flushAnswerKey = () => {
        if (answerBuffer.length > 0) {
            elements.push(<AnswerKeyCard key={`ans-${elements.length}`} lines={answerBuffer} renderInlineStyles={renderInlineStyles} />);
            answerBuffer = [];
        }
    };

    let pastWordList = false;
    let inWordListSection = false;
    let textStarted = false;

    lines.forEach((line, index) => {
        const trimmedLine = line.trim();
        const isEmpty = trimmedLine === '';

        // --- DETECÇÃO DE GABARITO ---
        const isGabaritoHeader = /^(##|###|\*\*)\s*Gabarito|answers|respostas/i.test(trimmedLine);

        if (isGabaritoHeader || answerBuffer.length > 0) {
            // Se encontrou cabeçalho ou já está no buffer de gabarito
            // Mas cuidado para não pegar coisa errada. Geralmente é o final.
            // Vamos assumir que se começou, vai até o fim ou até próximo header forte.
            flushList(); flushGrid(); flushColumn(); flushQuestion();

            if (!isEmpty) {
                answerBuffer.push(trimmedLine.replace(/^(##|###|\*\*)\s*/, '').replace(/\*\*/g, ''));
            }
            return;
        }

        // --- DETECÇÃO DE QUESTÕES ---
        const isQuestionStart = /^\d+\.\s/.test(trimmedLine);
        const isAlternative = /^[a-e]\)\s/i.test(trimmedLine);

        if (isQuestionStart) {
            flushList(); flushGrid(); flushColumn(); flushQuestion();
            questionBuffer.push(trimmedLine);
            return;
        }

        if (questionBuffer.length > 0) {
            if (isEmpty) return; // Ignora linhas vazias dentro do bloco de questões para manter compacto
            if (isAlternative) {
                questionBuffer.push(trimmedLine);
                return;
            } else {
                // Se encontrou algo que não é alternativa e nem vazio, fecha a questão
                flushQuestion();
            }
        }

        // Identificação preliminar do tipo de linha
        const isWordListHeader = /palavras.*encontrar/i.test(trimmedLine);

        // 1. Detecta linhas de GRADE e LISTAS (Estrutura)
        let isStructure = false;
        let isGridRow = false;
        let isListRow = false; // Pipe ou Hifen
        let listParts = [];
        let listSeparator = '';

        // Check Grid
        if (trimmedLine.length >= 3) {
            const withSpaces = trimmedLine.split(/\s+/).filter(l => l.length > 0);
            if (withSpaces.length >= 3 && withSpaces.every(l => /^[A-Z]$/.test(l))) {
                isGridRow = true;
            }
            if (!isGridRow && /^[A-Z]{3,}$/.test(trimmedLine)) {
                isGridRow = true;
            }
        }

        // Check List (Pipe or Hyphen)
        const hasPipe = line.includes('|');
        const hasHyphenList = /^[A-ZÀ-Ú\s]+(-[A-ZÀ-Ú\s]+)+$/.test(trimmedLine);

        if (hasPipe || hasHyphenList) {
            isListRow = true;
            listSeparator = hasPipe ? '|' : '-';
            listParts = line.split(listSeparator);
        }

        isStructure = isGridRow || isListRow;

        // Atualiza Estado: detecta se passamos da lista de palavras
        if (inWordListSection) {
            // Se estamos na seção, e encontramos algo que NÃO é estrutura, NEM é vazio, NEM é cabeçalho repetido
            // Então acabou a lista, entramos no texto pós-lista
            if (!isStructure && !isEmpty && !isWordListHeader) {
                inWordListSection = false;
                pastWordList = true;
            }
        } else if (isWordListHeader) {
            // Entrou na seção
            inWordListSection = true;
        }

        // BLOQUEIO TOTAL: Esconder Texto ignora tudo após a lista
        if (hideText && pastWordList) {
            return;
        }


        // --- RENDERIZAÇÃO ---

        if (isGridRow) {
            flushList();
            flushColumn();
            gridBuffer.push(trimmedLine);
            return;
        } else {
            flushGrid();
        }

        if (isListRow && listParts.length >= 2 && listParts[0].trim() && listParts[1].trim()) {
            flushList();
            flushGrid();

            if (hasPipe) {
                columnBuffer.push({ left: listParts[0].trim(), right: listParts[1].trim() });
            } else {
                // Lista com hifen
                if (!hideGrid) {
                    elements.push(
                        <p key={`wl-${index}`} className="mb-2 text-center font-bold text-slate-800 tracking-wide">
                            {trimmedLine}
                        </p>
                    );
                }
                return;
            }
            return;
        } else {
            flushColumn();
        }

        // Filtro de Texto (para linhas que não entraram no Bloqueio Total acima, ex: introdução antes do grid)
        if (hideText) {
            const isStruct = /^[A-Z\s]{3,}$/.test(trimmedLine) || /\d+\.\s/.test(trimmedLine);
            if (!isWordListHeader && !isStruct && trimmedLine.length > 5) {
                return;
            }
        }

        // Regra Hide Grid para Header
        if (hideGrid && isWordListHeader) {
            return;
        }

        // 4. Renderiza Parágrafos e Títulos
        if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
            textStarted = true;
            elements.push(
                <div key={index} className="flex gap-2 mb-2 pl-4 items-start">
                    <div className="min-w-[6px] h-[6px] mt-[9px] rounded-full bg-indigo-500"></div>
                    <p className="text-slate-700 text-lg leading-relaxed text-justify">
                        {renderInlineStyles(trimmedLine.substring(2))}
                    </p>
                </div>
            );
            return;
        } else {
            flushList();
        }

        if (/^_{3,}$/.test(trimmedLine) || /^-{3,}$/.test(trimmedLine)) {
            elements.push(
                <div key={index} className="my-6 text-center">
                    <div className="inline-block text-slate-300 tracking-[0.5em] font-light text-sm">__________________________________________________</div>
                </div>
            );
            return;
        }

        if (trimmedLine.startsWith('[[TITULO]]')) {
            textStarted = true;
            const t = trimmedLine.replace('[[TITULO]]', '').trim();
            elements.push(
                <div key={index} className="relative mt-8 mb-6 text-center">
                    <h1 className="text-3xl font-black text-indigo-900 tracking-tight uppercase relative z-10 inline-block px-4 bg-slate-100/50 rounded-lg">
                        {t}
                    </h1>
                    <div className="absolute top-1/2 left-0 w-full h-1 bg-indigo-100 -z-0"></div>
                </div>
            );
            return;
        }
        if (trimmedLine.startsWith('### ')) {
            textStarted = true;
            elements.push(<h3 key={index} className="text-xl font-bold text-indigo-700 mt-8 mb-3 flex items-center gap-2"><div className="w-2 h-6 bg-indigo-400 rounded-full"></div>{trimmedLine.slice(4)}</h3>);
        } else if (trimmedLine.startsWith('## ')) {
            textStarted = true;
            elements.push(<h2 key={index} className="text-2xl font-bold text-slate-800 mt-10 mb-4 pb-2 border-b-2 border-indigo-100">{trimmedLine.slice(3)}</h2>);
        } else if (trimmedLine.startsWith('# ')) {
            textStarted = true;
            elements.push(<h1 key={index} className="text-3xl font-extrabold text-slate-900 mt-6 mb-6 text-center">{trimmedLine.slice(2)}</h1>);
        } else if (trimmedLine === '') {
            if (!hideGrid || textStarted) {
                elements.push(<div key={index} className="h-4"></div>);
            }
        } else if (trimmedLine) {
            textStarted = true;
            // Parágrafo Normal Estilizado (Compactado)
            elements.push(
                <div key={index} className="mb-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm leading-relaxed">
                    <p className="text-slate-800 text-lg leading-relaxed font-medium text-justify">
                        {renderInlineStyles(line)}
                    </p>
                </div>
            );
        }
    });

    flushList();
    flushGrid();
    flushGrid();
    flushColumn();
    flushQuestion();
    flushAnswerKey();
    return <>{elements}</>;
};

// Componente Isolado para o Card de Gabarito
const AnswerKeyCard = ({ lines, renderInlineStyles }) => {
    const [isVisible, setIsVisible] = useState(false);

    // Se estiver oculto (isVisible = false), NÃO renderiza o conteúdo detalhado,
    // garantindo que não saia no cloneNode do ExportService.

    return (
        <div className="mt-8 mb-4 border-t-2 border-slate-100 pt-6 no-break">
            <div
                onClick={() => setIsVisible(!isVisible)}
                className="flex items-center justify-between cursor-pointer bg-green-50 hover:bg-green-100 p-4 rounded-xl transition-colors border border-green-200"
            >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-200 flex items-center justify-center text-green-700">
                        <Key className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-green-900">Gabarito da Atividade</h3>
                        <p className="text-xs text-green-700">Clique para mostrar/ocultar as respostas</p>
                    </div>
                </div>
                {isVisible ? <ChevronUp className="text-green-600" /> : <ChevronDown className="text-green-600" />}
            </div>

            {isVisible && (
                <div className="mt-3 p-5 bg-white border-2 border-green-100 rounded-xl shadow-sm">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {lines.map((line, idx) => {
                            // Tenta formatar bonito se for "1. a"
                            const match = line.match(/^(\d+)[.)]\s*([a-eA-E].*)/);
                            if (match) {
                                return (
                                    <div key={idx} className="flex items-center gap-2 p-2 border-b border-slate-50">
                                        <span className="font-bold text-green-700 w-8">{match[1]}.</span>
                                        <span className="font-medium text-slate-700">{match[2]}</span>
                                    </div>
                                );
                            }
                            // Exclui o titulo se acabou entrando no buffer
                            if (/gabarito/i.test(line)) return null;

                            return <p key={idx} className="text-slate-700 border-b border-slate-50 py-1">{renderInlineStyles(line)}</p>;
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default RichTextRenderer;
