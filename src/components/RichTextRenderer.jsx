import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Key, Copy } from 'lucide-react';

// UI Components
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { ActivityPrintHeader } from './ui/ActivityPrintHeader';
import { LatexRenderer } from './ui/LatexRenderer';
import { toast } from './ui/Toast';

const RichTextRenderer = ({
    content,
    showAnswers = false,
    foundWords = [],
    foundPlacements = [],
    hideText = false,
    hideGrid = false,
    title = null,
    fontSize = 15.5,
    storyFirst = true
}) => {
    const [textFontSize, setTextFontSize] = useState(fontSize || 15.5);
    const [mathFontSize, setMathFontSize] = useState(Math.round((fontSize || 15.5) * 1.2));

    React.useEffect(() => {
        if (fontSize) {
            setTextFontSize(fontSize);
            setMathFontSize(Math.round(fontSize * 1.2));
        }
    }, [fontSize]);

    if (!content) return null;

    const renderInlineStyles = (text) => {
        if (!text && text !== 0) return null;
        const str = text.toString();

        // Se for uma fórmula matemática pura curta (ex: item de lista ou cálculo isolado "3x + 5 = 14", "\frac{1}{2}")
        // e NÃO for um parágrafo longo de leitura (mais de 60 caracteres ou com múltiplas palavras):
        const isPureShortFormula = str.length < 60 && !/[a-zA-ZÀ-Úà-ú]{4,}\s+[a-zA-ZÀ-Úà-ú]{4,}\s+[a-zA-ZÀ-Úà-ú]{4,}/.test(str) &&
            (/\$|\\frac|\\sqrt|\^|_|\\sin|\\cos|\\pi|\\alpha|\\beta|\\times|\\cdot/.test(str) || /^[0-9xXyYzZ\s+\-/*÷=.,\(\)\[\]]+$/.test(str.trim()));

        if (isPureShortFormula) {
            return <LatexRenderer content={str} mathFontSize={mathFontSize} textFontSize={textFontSize} />;
        }

        // Para textos corridos e parágrafos normais:
        // Tokeniza apenas expressões matemáticas delimitadas ($...$, $$...$$, \frac, \sqrt) e negritos (**...**)
        const regex = /(\$\$[\s\S]*?\$\$|\$[^\$]+?\$|\\frac\{[^{}]*\}\{[^{}]*\}|\\sqrt\{[^{}]*\}|\*\*[\s\S]*?\*\*)/g;
        const parts = str.split(regex);

        return parts.map((part, index) => {
            if (!part) return null;
            if (part.startsWith('**') && part.endsWith('**')) {
                return (
                    <strong key={index} className="text-stone-900 font-extrabold">
                        {part.slice(2, -2)}
                    </strong>
                );
            }
            if (part.startsWith('$$') && part.endsWith('$$')) {
                return (
                    <LatexRenderer
                        key={index}
                        content={part}
                        mathFontSize={mathFontSize}
                        textFontSize={textFontSize}
                        defaultDisplayMode={true}
                    />
                );
            }
            if ((part.startsWith('$') && part.endsWith('$')) || part.startsWith('\\frac') || part.startsWith('\\sqrt')) {
                return (
                    <LatexRenderer
                        key={index}
                        content={part}
                        mathFontSize={mathFontSize}
                        textFontSize={textFontSize}
                        defaultDisplayMode={false}
                    />
                );
            }
            return part;
        });
    };

    const lines = content.split('\n');
    const elements = [];

    // Helper para gerar o cabeçalho oficial de avaliação
    const renderActivityHeader = (key = 'header') => {
        if (!title) return null;
        return (
            <ActivityPrintHeader
                key={key}
                title={title}
                subtitle="ATIVIDADE DE AVALIAÇÃO"
                pills={foundWords?.length ? [`📝 ${foundWords.length} Palavras`] : []}
            />
        );
    };

    let gridBuffer = [];
    let wordListBuffer = [];
    let columnBuffer = [];
    let questionBuffer = [];
    const questionNodes = [];
    let answerBuffer = [];
    let storyBuffer = [];
    let inWordListSection = false;
    let textStarted = false;

    // Helper: constrói o card de leitura (sem o título 'TEXTO DE APOIO / CONTEXTUALIZAÇÃO')
    const buildStoryCard = () => {
        if (hideText || storyBuffer.length === 0) return null;
        const currentStoryText = storyBuffer.join('\n').replace(/\*\*/g, '');

        return (
            <div
                key="story-card"
                className="dracker-print-card bg-white border border-slate-300 rounded-2xl p-5 sm:p-6 my-2 print:my-1 print:border-black print:shadow-none break-inside-avoid overflow-visible"
                style={{ fontSize: `${Math.max(14, Math.round(textFontSize * 0.95))}px` }}
            >
                {title && !hideText && (
                    <div className="flex justify-end pb-2 mb-3 border-b border-slate-200 no-print">
                        <Button
                            onClick={() => {
                                navigator.clipboard.writeText(currentStoryText);
                                toast('Texto copiado!');
                            }}
                            variant="secondary"
                            className="h-7 text-xs px-2.5 text-stone-600 bg-stone-100 hover:bg-stone-200 shadow-2xs"
                            icon={Copy}
                        >
                            Copiar Texto
                        </Button>
                    </div>
                )}

                <div className="font-sans text-stone-800 print:text-black text-left">
                    {storyBuffer.map((line, idx) => (
                        <p
                            key={idx}
                            className="indent-5 mb-4 last:mb-0 leading-[1.65] text-left break-words"
                            style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}
                        >
                            {renderInlineStyles(line)}
                        </p>
                    ))}
                </div>
            </div>
        );
    };

    // Helper: constrói o card do Caça-Palavras dimensionado para utilizar exatamente uma folha A4 inteira
    const buildGameCard = () => {
        if (hideGrid) return null;
        if (gridBuffer.length === 0 && wordListBuffer.length === 0) return null;

        const cardContent = [];

        // 1. GRADE DO CAÇA-PALAVRAS
        if (gridBuffer.length > 0) {
            const processedRows = gridBuffer.map(row => {
                const trimmed = row.trim();
                let letters = trimmed.split(/\s+/).filter(l => l.length > 0);
                if (letters.length === 1 && trimmed.length > 1) {
                    letters = trimmed.split('').filter(l => /[A-ZÀ-Ú0-9]/i.test(l));
                }
                return letters;
            });

            const cols = processedRows[0]?.length || 0;

            if (cols > 0) {
                // Identifica posições de palavras para gabarito
                const wordPositions = new Set();
                if (showAnswers) {
                    if (foundPlacements && foundPlacements.length > 0) {
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
                        const targetNorms = foundWords.map(w => typeof w === 'string' ? w.toUpperCase() : (w.word || '').toUpperCase());
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

                // Escala de fonte baseada no seletor do usuário (base normal = 15.5px)
                const fontScale = (textFontSize || 15.5) / 15.5;

                // Dimensionamento áureo para preencher exatamente a folha A4 (~580px a 600px de altura de grade)
                let baseCellPx = 37.5;
                if (cols <= 8) baseCellPx = 65;        // 8 * 65 = 520px
                else if (cols <= 10) baseCellPx = 58;  // 10 * 58 = 580px
                else if (cols <= 12) baseCellPx = 49;  // 12 * 49 = 588px
                else if (cols <= 14) baseCellPx = 42;  // 14 * 42 = 588px
                else if (cols <= 16) baseCellPx = 37.5;// 16 * 37.5 = 600px
                else if (cols <= 18) baseCellPx = 33;  // 18 * 33 = 594px
                else if (cols <= 20) baseCellPx = 30;  // 20 * 30 = 600px
                else if (cols <= 22) baseCellPx = 27;  // 22 * 27 = 594px
                else baseCellPx = 25;                  // 24 * 25 = 600px

                const computedCellPx = Math.round(baseCellPx * fontScale);
                const cellSize = `${computedCellPx}px`;

                // Tamanho da letra: grande, nítida e super legível (58% da célula)
                const letterFontSizePx = Math.max(14, Math.round(computedCellPx * 0.58));

                cardContent.push(
                    <div key="grid-content" className="flex justify-center my-2 print:my-1 w-full">
                        <div className="inline-block p-1 bg-stone-100 border border-stone-300 print:border-black rounded-xl overflow-hidden mx-auto shadow-2xs print:shadow-none">
                            <div
                                className="grid border border-stone-300 print:border-black bg-stone-300 print:bg-black gap-[1px]"
                                style={{
                                    gridTemplateColumns: `repeat(${cols}, ${cellSize})`,
                                    width: 'fit-content'
                                }}
                            >
                                {processedRows.map((letters, rowIndex) =>
                                    letters.map((letter, colIndex) => {
                                        const isHighlighted = wordPositions.has(`${rowIndex}-${colIndex}`);

                                        let cellBg = isHighlighted
                                            ? 'bg-amber-200 text-stone-900 print:bg-stone-300 print:text-black font-black'
                                            : 'bg-white hover:bg-stone-50 text-stone-900 print:text-black font-black';

                                        return (
                                            <div
                                                key={`${rowIndex}-${colIndex}`}
                                                className={`flex items-center justify-center font-black select-none tracking-normal ${cellBg}`}
                                                style={{
                                                    width: cellSize,
                                                    height: cellSize,
                                                    minWidth: cellSize,
                                                    minHeight: cellSize,
                                                    fontSize: `${letterFontSizePx}px`,
                                                    lineHeight: 1
                                                }}
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
        }

        // 2. LISTA DE PALAVRAS / DESAFIOS PARA ENCONTRAR
        if (wordListBuffer.length > 0) {
            const isMathList = wordListBuffer.some(part => (/[+\-x÷=]/.test(part) && /\d/.test(part)) || /\\frac|\\sqrt|\^|_|\\sin|\\cos|\\pi|\$/.test(part));
            const isClueList = wordListBuffer.some(part => part.length > 25);

            if (isMathList || isClueList) {
                cardContent.push(
                    <div key="word-list-content" className="mt-4 pt-3 print:mt-2 print:pt-2 border-t border-stone-200 print:border-stone-400">
                        <h4 className="text-center text-xs sm:text-sm font-bold text-stone-700 print:text-black uppercase tracking-wider mb-2.5">
                            {isMathList ? "📝 Desafios para Resolver" : "📝 Pistas para Encontrar"}
                        </h4>
                        <div className="flex flex-col gap-1.5 w-full max-w-2xl mx-auto">
                            {wordListBuffer.map((part, pIdx) => (
                                <div key={pIdx} className="flex items-start gap-2 py-1 border-b border-stone-200 print:border-stone-400 print:border-dashed last:border-0 text-left">
                                    <div className="w-3.5 h-3.5 mt-0.5 border border-stone-400 print:border-black rounded-xs shrink-0"></div>
                                    <span className="font-bold text-xs sm:text-sm text-stone-500 print:text-black">{String(pIdx + 1).padStart(2, '0')}.</span>
                                    <div
                                        className="min-w-0 flex-1 leading-snug font-semibold text-stone-900 print:text-black"
                                        style={{ fontSize: `${Math.max(13, Math.round(textFontSize * 0.92))}px` }}
                                    >
                                        <LatexRenderer content={part.trim().replace('?', '')} mathFontSize={Math.round(textFontSize * 1.15)} textFontSize={textFontSize} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            } else {
                cardContent.push(
                    <div key="word-list-content" className="mt-4 pt-3 border-t border-stone-200 print:border-stone-400">
                        <div className="text-center mb-2">
                            <h4 className="text-xs sm:text-sm font-bold text-stone-700 print:text-black uppercase tracking-wider inline-flex items-center gap-1.5">
                                <span>📝 Palavras para Encontrar</span>
                                <span className="text-xs font-semibold text-stone-500 print:text-stone-700">({wordListBuffer.length})</span>
                            </h4>
                        </div>
                        <div className="flex flex-wrap justify-center gap-2 px-2 max-w-3xl mx-auto">
                            {wordListBuffer.map((part, pIdx) => (
                                <div
                                    key={pIdx}
                                    className="inline-flex items-center gap-1.5 bg-stone-50 border border-stone-300 print:border-stone-700 rounded-lg px-3 py-1 shadow-2xs print:bg-white print:shadow-none"
                                    style={{ fontSize: `${Math.max(13, Math.round(textFontSize * 0.92))}px` }}
                                >
                                    <span className="w-3.5 h-3.5 rounded-xs border-2 border-stone-400 print:border-black flex items-center justify-center shrink-0"></span>
                                    <span className="font-extrabold text-stone-900 print:text-black uppercase tracking-wide">
                                        {part.trim()}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            }
        }

        return (
            <div key="game-card" className="dracker-print-card bg-white border border-slate-300 rounded-2xl p-3.5 sm:p-5 my-2 print:my-1 print:border-black print:shadow-none break-inside-avoid">
                {cardContent}
            </div>
        );
    };

    const flushQuestion = () => {
        if (questionBuffer.length > 0) {
            const lines = questionBuffer;
            const enunciadoLine = lines.find(l => /^\d+[.)]/.test(l.trim())) || lines[0];
            const otherLines = lines.filter(l => l !== enunciadoLine);
            const numMatch = enunciadoLine.trim().match(/^(\d+)[.)]\s*(.*)/);
            const num = numMatch ? numMatch[1] : null;
            const statement = numMatch ? numMatch[2] : enunciadoLine;

            questionNodes.push(
                <div key={`q-${questionNodes.length}`} className="dracker-print-card bg-white border-2 border-slate-300 rounded-xl p-3.5 sm:p-4 shadow-none break-inside-avoid print:border-black print:shadow-none mb-3 flex flex-col">
                    <div className="dracker-card-head flex items-start gap-2.5 mb-2 break-inside-avoid">
                        {num && (
                            <span className="dracker-card-num shrink-0 w-6 h-6 rounded-full bg-slate-800 text-white font-black text-xs flex items-center justify-center shadow-none print:bg-black">
                                {num}
                            </span>
                        )}
                        <div className="dracker-card-statement flex-1 font-bold text-slate-900 text-sm sm:text-base leading-snug">
                            {renderInlineStyles(statement)}
                        </div>
                    </div>
                    {otherLines.length > 0 && (
                        <div className="dracker-card-options space-y-1 mt-1.5">
                            {otherLines.map((line, lIdx) => (
                                <div key={lIdx} className="dracker-card-option flex items-center gap-2 bg-white border border-slate-200 print:border-slate-300 rounded-lg p-2 text-xs sm:text-sm text-slate-900">
                                    {renderInlineStyles(line)}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            );
            questionBuffer = [];
        }
    };

    const flushAnswerKey = () => {
        if (answerBuffer.length > 0) {
            elements.push(<AnswerKeyCard key="ans-card" lines={answerBuffer} renderInlineStyles={renderInlineStyles} showAnswers={showAnswers} />);
            answerBuffer = [];
        }
    };

    // Processamento linha a linha do conteúdo
    lines.forEach((line, index) => {
        const trimmedLine = line.trim();
        const isEmpty = trimmedLine === '';

        // --- DETECÇÃO DE GABARITO ---
        const isGabaritoHeader = /^(##|###|\*\*)\s*Gabarito|answers|respostas/i.test(trimmedLine);

        if (isGabaritoHeader || answerBuffer.length > 0) {
            flushQuestion();
            if (!isEmpty) {
                answerBuffer.push(trimmedLine.replace(/^(##|###|\*\*)\s*/, '').replace(/\*\*/g, ''));
            }
            return;
        }

        // --- DETECÇÃO DE QUESTÕES ---
        const isQuestionStart = /^\d+\.\s/.test(trimmedLine);
        const isAlternative = /^[a-e]\)(\s|$)/i.test(trimmedLine);

        if (isQuestionStart) {
            flushQuestion();
            questionBuffer.push(trimmedLine);
            return;
        }

        if (questionBuffer.length > 0) {
            if (isEmpty) return;
            if (isAlternative) {
                questionBuffer.push(trimmedLine);
                return;
            } else {
                flushQuestion();
            }
        }

        // --- IDENTIFICAÇÃO DE SEÇÃO DE PALAVRAS ---
        const isWordListHeader = /palavras.*encontrar|desafios.*encontrar|pistas.*encontrar/i.test(trimmedLine);

        // --- DETECÇÃO DE GRADE E LISTAS ---
        let isGridRow = false;
        let isListRow = false;
        let listParts = [];

        // Check Grid
        if (trimmedLine.length >= 3) {
            const withSpaces = trimmedLine.split(/\s+/).filter(l => l.length > 0);
            if (withSpaces.length >= 3 && withSpaces.every(l => /^[A-ZÀ-Ú0-9,\.\-=+*xX÷\/%]$/i.test(l))) {
                isGridRow = true;
            }
            if (!isGridRow && /^[A-ZÀ-Ú0-9,\.\-=+*xX÷\/%]{3,}$/i.test(trimmedLine)) {
                isGridRow = true;
            }
        }

        // Check List (Pipe, Hyphen or Bullet)
        const hasPipe = line.includes('|');
        const hasBullet = line.includes('•');
        const hasHyphenList = /^[A-ZÀ-Ú\s]+(-[A-ZÀ-Ú\s]+)+$/.test(trimmedLine);

        if (hasPipe || hasHyphenList || hasBullet) {
            isListRow = true;
            let listSeparator = hasPipe ? '|' : (hasBullet ? '•' : '-');
            listParts = line.split(listSeparator);
        }

        // Se estamos na seção de lista de palavras, evita falso-positivo de grade
        if (inWordListSection && isGridRow) {
            isGridRow = false;
            if (!isListRow && /[A-ZÀ-Ú0-9]/.test(trimmedLine)) {
                isListRow = true;
                listParts = trimmedLine.includes('  ') ? trimmedLine.split(/\s{2,}/) : (trimmedLine.includes('•') ? trimmedLine.split('•') : [trimmedLine]);
            }
        } else if (inWordListSection && !isListRow && !isWordListHeader && trimmedLine.length > 0) {
            if (!/^_{3,}$/.test(trimmedLine) && !/^-{3,}$/.test(trimmedLine)) {
                isListRow = true;
                listParts = trimmedLine.includes('  ') ? trimmedLine.split(/\s{2,}/) : (trimmedLine.includes('•') ? trimmedLine.split('•') : [trimmedLine]);
            }
        }

        // Atualiza estado da seção de palavras
        if (inWordListSection) {
            if (!isGridRow && !isListRow && !isEmpty && !isWordListHeader) {
                inWordListSection = false;
            }
        } else if (isWordListHeader) {
            inWordListSection = true;
            return; // Suprime texto bruto do header de palavras
        }

        // --- ENCAMINHAMENTO PARA BUFFERS ---
        if (isGridRow) {
            gridBuffer.push(trimmedLine);
            return;
        }

        if (isListRow && listParts.length >= 1) {
            if (inWordListSection || gridBuffer.length > 0) {
                listParts.forEach(p => {
                    const clean = p.trim();
                    if (clean) wordListBuffer.push(clean);
                });
                return;
            }
            if (hasPipe && listParts.length >= 2) {
                columnBuffer.push({ left: listParts[0].trim(), right: listParts[1].trim() });
                return;
            }
        }

        // Linhas de divisor estético (ignora para evitar linhas estranhas no print)
        if (/^_{3,}$/.test(trimmedLine) || /^-{3,}$/.test(trimmedLine)) {
            return;
        }

        // Títulos inline (suprime se já houver ActivityPrintHeader com título oficial)
        if (trimmedLine.startsWith('[[TITULO]]') || (trimmedLine.startsWith('# ') && title)) {
            textStarted = true;
            if (title) return;
            const t = trimmedLine.replace('[[TITULO]]', '').replace(/^#\s*/, '').trim();
            elements.push(
                <div key={index} className="relative mt-4 mb-3 print:mt-0 print:mb-2 text-center">
                    <h1 className="text-2xl print:text-xl font-black text-brown-900 tracking-tight uppercase relative z-10 inline-block px-4 bg-brown-50 print:bg-transparent rounded-lg">
                        {t}
                    </h1>
                </div>
            );
            return;
        }

        if (trimmedLine.startsWith('### ')) {
            textStarted = true;
            elements.push(<h3 key={index} className="text-lg font-bold text-stone-800 mt-4 mb-2 flex items-center gap-2"><div className="w-2 h-5 bg-amber-500 rounded-full"></div>{trimmedLine.slice(4)}</h3>);
            return;
        } else if (trimmedLine.startsWith('## ')) {
            textStarted = true;
            elements.push(<h2 key={index} className="text-xl font-bold text-stone-900 mt-5 mb-3 pb-1 border-b border-stone-200">{trimmedLine.slice(3)}</h2>);
            return;
        } else if (trimmedLine.startsWith('# ')) {
            textStarted = true;
            elements.push(<h1 key={index} className="text-2xl font-extrabold text-stone-900 mt-4 mb-3 text-center">{trimmedLine.slice(2)}</h1>);
            return;
        }

        // Parágrafos e texto da história
        if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
            textStarted = true;
            storyBuffer.push(trimmedLine);
            return;
        } else if (trimmedLine) {
            textStarted = true;
            storyBuffer.push(line);
        }
    });

    // Finaliza buffers
    flushQuestion();

    // Colunas extras caso existam
    if (columnBuffer.length > 0 && !hideGrid) {
        elements.push(
            <div key="extra-cols" className="my-4">
                <div className="grid grid-cols-2 gap-4 items-start">
                    {columnBuffer.map((row, idx) => (
                        <React.Fragment key={idx}>
                            <div className="text-left font-medium text-slate-800">{renderInlineStyles(row.left)}</div>
                            <div className="text-right font-medium text-slate-800">{renderInlineStyles(row.right)}</div>
                        </React.Fragment>
                    ))}
                </div>
            </div>
        );
        columnBuffer = [];
    }

    // CONSTRUÇÃO ESTRUTURADA DOS CARDS PRINCIPAIS:
    // O Caça-Palavras utiliza exatamente o tamanho de uma folha inteira A4.
    // Se houver texto de leitura e não estiver oculto, é separado por quebra explícita de página
    // para que ambos tenham 1 folha completa sem sobreposições ou quebras no meio.
    const storyCard = buildStoryCard();
    const gameCard = buildGameCard();
    const headerElement = renderActivityHeader('main-header');

    // Apenas UM cabeçalho oficial no topo da folha
    if (headerElement) {
        elements.push(headerElement);
    }

    if (storyCard && gameCard) {
        if (storyFirst) {
            elements.push(storyCard);
            elements.push(
                <div key="page-break" className="dracker-page-break html2pdf__page-break my-4 print:my-0" style={{ pageBreakBefore: 'always', breakBefore: 'page' }} />
            );
            elements.push(gameCard);
        } else {
            elements.push(gameCard);
            elements.push(
                <div key="page-break" className="dracker-page-break html2pdf__page-break my-4 print:my-0" style={{ pageBreakBefore: 'always', breakBefore: 'page' }} />
            );
            elements.push(storyCard);
        }
    } else {
        if (gameCard) elements.push(gameCard);
        if (storyCard) elements.push(storyCard);
    }

    // Questões de fixação caso existam
    if (questionNodes.length > 0) {
        elements.push(...questionNodes);
    }

    // Gabarito da atividade
    flushAnswerKey();

    return (
        <div className="dracker-print-wrap max-w-[800px] mx-auto w-full" style={{ fontSize: `${textFontSize}px` }}>
            {elements}
        </div>
    );
};

// Componente Isolado para o Card de Gabarito
const AnswerKeyCard = ({ lines, renderInlineStyles, showAnswers }) => {
    const [isVisible, setIsVisible] = useState(false);

    React.useEffect(() => {
        if (showAnswers !== undefined) {
            setIsVisible(showAnswers);
        }
    }, [showAnswers]);

    return (
        <Card
            className={`mt-6 mb-4 pt-4 ${isVisible ? '' : 'no-print'}`}
            style={isVisible ? { pageBreakBefore: 'always', breakBefore: 'page' } : {}}
        >
            <div
                onClick={() => setIsVisible(!isVisible)}
                className="flex items-center justify-between cursor-pointer bg-stone-50 hover:bg-stone-100 p-3.5 rounded-xl transition-colors border border-stone-200"
            >
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-800">
                        <Key className="w-4 h-4" />
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-stone-900">Gabarito da Atividade</h3>
                        <p className="text-xs text-stone-600">Clique para mostrar/ocultar as respostas</p>
                    </div>
                </div>
                {isVisible ? <ChevronUp className="text-stone-600" /> : <ChevronDown className="text-stone-600" />}
            </div>

            {isVisible && (
                <div className="mt-3 p-4 bg-white border border-stone-200 rounded-xl shadow-xs">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {lines.map((line, idx) => {
                            const match = line.match(/^(\d+)[.)]\s*([a-eA-E].*)/);
                            if (match) {
                                return (
                                    <div key={idx} className="flex items-center gap-2 p-1.5 border-b border-stone-100">
                                        <span className="font-bold text-stone-700 w-7">{match[1]}.</span>
                                        <span className="font-medium text-stone-700">{match[2]}</span>
                                    </div>
                                );
                            }
                            if (/gabarito/i.test(line)) return null;
                            return <p key={idx} className="text-stone-700 border-b border-stone-100 py-1">{renderInlineStyles(line)}</p>;
                        })}
                    </div>
                </div>
            )}
        </Card>
    );
};

export default RichTextRenderer;
