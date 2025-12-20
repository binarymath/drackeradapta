import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Key } from 'lucide-react';

// UI Components
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';

const RichTextRenderer = ({ content, showAnswers = false, foundWords = [], foundPlacements = [], hideText = false, hideGrid = false, title = null }) => {
    if (!content) return null;

    const renderInlineStyles = (text) => {
        const cleanText = text.replace(/\$([^\$]+)\$/g, '$1');
        const parts = cleanText.split(/(\*\*.*?\*\*)/g);
        return parts.map((part, index) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={index} className="text-brown-700 font-extrabold">{part.slice(2, -2)}</strong>;
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
    let storyBuffer = [];
    let titleRendered = false;
    let wordListBuffer = [];

    const flushList = () => {
        // No-op: removemos marcadores de lista
        listBuffer = [];
    };

    const flushGameCard = () => {
        // Renderiza se tiver Grid OU Lista de Palavras (Game Mode)
        if (gridBuffer.length > 0 || wordListBuffer.length > 0) {

            // Só renderiza a estrutura se não estiver tudo oculto
            // Se hideGrid=true, não mostramos nada?
            // Regra: se hideGrid=true, o jogo inteiro some (Grid + Lista).
            // A menos que queiramos manter a lista?
            // O user pediu "Esconder o Jogo (Só a História)". O jogo é o grid + palavras.
            if (hideGrid) {
                gridBuffer = [];
                wordListBuffer = [];
                return;
            }

            const cardContent = [];

            // 1. RENDER GRID
            if (gridBuffer.length > 0) {
                const processedRows = gridBuffer.map(row => {
                    const trimmed = row.trim();
                    let letters = trimmed.split(/\s+/).filter(l => l.length > 0);
                    if (letters.length === 1 && trimmed.length > 1) {
                        letters = trimmed.split('').filter(l => /[A-Z]/i.test(l));
                    }
                    return letters;
                });

                const cols = processedRows[0]?.length || 0;

                if (cols > 0) {
                    // Logic to highlight words
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

                    cardContent.push(
                        <div key="grid-content" className="flex justify-center mb-6">
                            <div className="inline-block p-4 bg-brown-50 rounded-lg border border-brown-200 shadow-inner">
                                <div
                                    className="grid"
                                    style={{ gridTemplateColumns: `repeat(${cols}, auto)`, gap: '0px' }}
                                >
                                    {processedRows.map((letters, rowIndex) =>
                                        letters.map((letter, colIndex) => {
                                            const isHighlighted = wordPositions.has(`${rowIndex}-${colIndex}`);
                                            return (
                                                <div
                                                    key={`${rowIndex}-${colIndex}`}
                                                    className={`flex items-center justify-center font-mono text-sm font-bold transition-colors cursor-pointer border border-brown-100/50 ${isHighlighted ? 'bg-brown-500 text-white shadow-sm scale-110 z-10 rounded' : 'text-brown-900 bg-white hover:bg-brown-200'
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
            }

            // 2. RENDER WORD LIST
            if (wordListBuffer.length > 0) {
                cardContent.push(
                    <div key="word-list-content" className="mt-4 pt-4 border-t-2 border-dashed border-brown-200">
                        <h4 className="text-center text-sm font-bold text-brown-500 uppercase tracking-widest mb-4">Palavras para Encontrar</h4>
                        <div className="flex flex-wrap justify-center gap-3 px-4">
                            {wordListBuffer.map((part, pIdx) => (
                                <Badge key={pIdx} variant="outline" className="text-sm font-bold uppercase tracking-wider cursor-help">
                                    {part.trim()}
                                </Badge>
                            ))}
                        </div>
                    </div>
                );
            }

            // Wrapper Card
            elements.push(
                <Card key={`game-card-${elements.length}`} className="my-8 print:shadow-none print:border-brown-300">
                    {cardContent}
                </Card>
            );

            gridBuffer = [];
            wordListBuffer = [];
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
                <Card key={`q-${elements.length}`} className="mb-4 hover:border-brown-300 transition-colors">
                    {questionBuffer.map((qLine, qIdx) => {
                        const isEnunciado = /^\d+\./.test(qLine);
                        return (
                            <div key={qIdx} className={`${isEnunciado ? 'font-bold text-brown-900 text-lg mb-3' : 'ml-0 pl-4 py-1 text-brown-700 hover:bg-brown-50 rounded flex items-center'}`}>
                                {isEnunciado ? renderInlineStyles(qLine) : <span className="w-full">{renderInlineStyles(qLine)}</span>}
                            </div>
                        );
                    })}
                </Card>
            );
            questionBuffer = [];
        }
    };

    const flushStory = () => {
        if (storyBuffer.length > 0) {
            elements.push(
                <Card key={`story-${elements.length}`} className="relative mb-6 overflow-hidden">

                    {/* Title inside Card (only for the first story block) */}
                    {title && !hideText && !titleRendered && (
                        <div className="border-b border-brown-100 pb-4 mb-6">
                            <h2 className="text-2xl font-bold text-brown-900 mb-1">{title}</h2>
                        </div>
                    )}

                    {/* Story Content */}
                    <div className="prose prose-lg max-w-none text-brown-900 leading-loose font-serif">
                        {storyBuffer.map((line, idx) => (
                            <p key={idx} className="indent-8 mb-6 text-justify">
                                {renderInlineStyles(line)}
                            </p>
                        ))}
                    </div>
                </Card>
            );
            storyBuffer = [];
            if (title) titleRendered = true;
        }
    };

    const flushAnswerKey = () => {
        if (answerBuffer.length > 0) {
            elements.push(<AnswerKeyCard key={`ans-${elements.length}`} lines={answerBuffer} renderInlineStyles={renderInlineStyles} showAnswers={showAnswers} />);
            answerBuffer = [];
        }
    };

    let pastWordList = false;
    let inWordListSection = false;
    let textStarted = false;

    // Render Title if provided and Text NOT hidden -> Now handled inside flushStory for the first block
    // to include it in the card. If no story text exists but title does, we might miss it?
    // We should allow flushing an empty story with title if title exists? 
    // Usually there is text. If not, we can force a flush at the end.

    lines.forEach((line, index) => {
        const trimmedLine = line.trim();
        const isEmpty = trimmedLine === '';

        // --- DETECÇÃO DE GABARITO ---
        const isGabaritoHeader = /^(##|###|\*\*)\s*Gabarito|answers|respostas/i.test(trimmedLine);

        if (isGabaritoHeader || answerBuffer.length > 0) {
            // Se encontrou cabeçalho ou já está no buffer de gabarito
            // Mas cuidado para não pegar coisa errada. Geralmente é o final.
            // Vamos assumir que se começou, vai até o fim ou até próximo header forte.
            flushList(); flushGameCard(); flushColumn(); flushQuestion(); flushStory();

            if (!isEmpty) {
                answerBuffer.push(trimmedLine.replace(/^(##|###|\*\*)\s*/, '').replace(/\*\*/g, ''));
            }
            return;
        }

        // --- DETECÇÃO DE QUESTÕES ---
        const isQuestionStart = /^\d+\.\s/.test(trimmedLine);
        // Permite "a)" seguido de espaço OU fim de linha (caso de opção vazia)
        const isAlternative = /^[a-e]\)(\s|$)/i.test(trimmedLine);

        if (isQuestionStart) {
            flushList(); flushGameCard(); flushColumn(); flushQuestion(); flushStory();
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

        // Check List (Pipe, Hyphen or Bullet)
        const hasPipe = line.includes('|');
        const hasBullet = line.includes('•');
        const hasHyphenList = /^[A-ZÀ-Ú\s]+(-[A-ZÀ-Ú\s]+)+$/.test(trimmedLine);

        if (hasPipe || hasHyphenList || hasBullet) {
            isListRow = true;
            if (hasPipe) listSeparator = '|';
            else if (hasBullet) listSeparator = '•';
            else listSeparator = '-';

            listParts = line.split(listSeparator);
        }

        isStructure = isGridRow || isListRow;

        // CORREÇÃO: Se estamos na seção de Lista de Palavras, NÃO pode ser grid.
        // Isso evita que palavras curtas (ex: "PEGA") ou espaçadas (ex: "P E G A") sejam confundidas com o grid.
        if (inWordListSection && isGridRow) {
            isGridRow = false; // Desativa detecção de grid

            // Força detecção como lista se parecer palavras (maíusculas)
            if (!isListRow && /[A-ZÀ-Ú]/.test(trimmedLine)) {
                isListRow = true;
                // Tenta dividir por espaços duplos se houver, senão pega a linha toda
                if (trimmedLine.includes('  ')) {
                    listParts = trimmedLine.split(/\s{2,}/);
                } else {
                    listParts = [trimmedLine];
                }
            }
            isStructure = isListRow;
        } else if (inWordListSection && !isListRow && !isWordListHeader && trimmedLine.length > 0) {
            // Fallback para linhas que não parecem grid mas estão na seção (ex: palavras soltas sem bullet)
            if (/^[A-ZÀ-Ú\s]+$/.test(trimmedLine) && trimmedLine.length < 50) {
                isListRow = true;
                if (trimmedLine.includes('  ')) {
                    listParts = trimmedLine.split(/\s{2,}/);
                } else {
                    listParts = [trimmedLine];
                }
                isStructure = true;
            }
        }

        // Atualiza Estado
        if (inWordListSection) {
            if (!isStructure && !isEmpty && !isWordListHeader) {
                inWordListSection = false;
                pastWordList = true;
            }
        } else if (isWordListHeader) {
            inWordListSection = true;
        }

        if (hideText && pastWordList) {
            return;
        }

        // --- RENDERIZAÇÃO ---

        if (isGridRow) {
            flushList();
            flushColumn();
            flushStory(); // End story before grid
            gridBuffer.push(trimmedLine);
            return;
        } else {
            // Se não é linha de grid, não flusha imediatamente! 
            // O grid pode ser seguido por palavras
        }

        if (isListRow && listParts.length >= 1) {
            flushList(); // Clear bullet buffer
            // flushGrid(); -> REMOVIDO: não queremos flushar o grid ainda se estamos acumulando lista

            // Se for Word List Section, acumula
            if (inWordListSection || gridBuffer.length > 0) {
                if (hasPipe && listParts.length >= 2) {
                    // Pipes também podem ser usados para lista de palavras
                    listParts.forEach(p => wordListBuffer.push(p));
                } else {
                    listParts.forEach(p => wordListBuffer.push(p));
                }
                return;
            }

            // Se for lista normal (fora do contexto do jogo), flusha o jogo anterior e renderiza normal
            flushGameCard();

            if (hasPipe && listParts.length >= 2) {
                columnBuffer.push({ left: listParts[0].trim(), right: listParts[1].trim() });
            } else if (!hasPipe) {
                // Renderização Estilizada para Lista de Palavras (com Bolinha ou Hifen ou Únicas)
                if (!hideGrid) {
                    elements.push(
                        <div key={`wl-${index}`} className="flex flex-wrap justify-center gap-3 my-2 px-4">
                            {listParts.map((part, pIdx) => (
                                <Badge key={pIdx} variant="secondary" className="px-3 py-1 text-sm font-bold shadow-sm uppercase tracking-wider">
                                    {part.trim()}
                                </Badge>
                            ))}
                        </div>
                    );
                }
                return;
            }
            return;
        } else {
            flushColumn();
        }

        // Filtro de Texto
        if (hideText) {
            const isStruct = /^[A-Z\s]{3,}$/.test(trimmedLine) || /\d+\.\s/.test(trimmedLine) || isListRow;
            if (!isWordListHeader && !isStruct && trimmedLine.length > 5) {
                return;
            }
        }

        // Regra Hide Grid para Header
        if (hideGrid && isWordListHeader) {
            return;
        }

        // Se é header de lista de palavras, SUPRIME o output de texto e prepara o buffer
        if (isWordListHeader) {
            flushStory();
            // Não flusha grid/game aqui, pois o header vem antes ou depois do grid e queremos eles juntos
            return;
        }

        // 4. Renderiza Parágrafos e Títulos (Acumula no Buffer de História)
        if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
            textStarted = true;
            // Listas / Bullets na história também entram no card
            storyBuffer.push(trimmedLine);
            return;
        } else {
            flushList();
        }

        if (/^_{3,}$/.test(trimmedLine) || /^-{3,}$/.test(trimmedLine)) {
            flushStory();
            elements.push(
                <div key={index} className="my-6 text-center">
                    <div className="inline-block text-slate-300 tracking-[0.5em] font-light text-sm">__________________________________________________</div>
                </div>
            );
            return;
        }

        if (trimmedLine.startsWith('[[TITULO]]')) {
            // Ignora titulo inline se já temos o title prop ou trata como header
            // Melhor tratar como flushStory para começar novo bloco
            flushStory();
            textStarted = true;
            const t = trimmedLine.replace('[[TITULO]]', '').trim();
            elements.push(
                <div key={index} className="relative mt-8 mb-6 text-center">
                    <h1 className="text-3xl font-black text-brown-900 tracking-tight uppercase relative z-10 inline-block px-4 bg-brown-50 rounded-lg">
                        {t}
                    </h1>
                    <div className="absolute top-1/2 left-0 w-full h-1 bg-brown-100 -z-0"></div>
                </div>
            );
            return;
        }
        if (trimmedLine.startsWith('### ')) {
            flushStory();
            textStarted = true;
            elements.push(<h3 key={index} className="text-xl font-bold text-brown-700 mt-8 mb-3 flex items-center gap-2"><div className="w-2 h-6 bg-brown-400 rounded-full"></div>{trimmedLine.slice(4)}</h3>);
        } else if (trimmedLine.startsWith('## ')) {
            flushStory();
            textStarted = true;
            elements.push(<h2 key={index} className="text-2xl font-bold text-brown-800 mt-10 mb-4 pb-2 border-b-2 border-brown-100">{trimmedLine.slice(3)}</h2>);
        } else if (trimmedLine.startsWith('# ')) {
            flushStory();
            textStarted = true;
            elements.push(<h1 key={index} className="text-3xl font-extrabold text-brown-900 mt-6 mb-6 text-center">{trimmedLine.slice(2)}</h1>);
        } else if (trimmedLine === '') {
            // Linha vazia na história pode ser só espaço. Não flusha, só ignora ou adiciona <br/> se quiser.
            // Para Wordsearch, quebras de linha duplas marcam parágrafos.
            // Como estamos acumulando em storyBuffer, strings vazias podem ser ignoradas ou usadas para separar.
            // O split('\n') do RichTextRenderer já quebra linhas.
            // Se for vazia e estivermos em story mode, ignoramos (para não criar <p> vazio).
            if (!hideGrid || textStarted) {
                // elements.push(<div key={index} className="h-4"></div>); // Antigo espaçador
            }
        } else if (trimmedLine) {
            textStarted = true;
            // Acumula parágrafo normal
            storyBuffer.push(line);
        }
    });

    flushList();
    flushGameCard(); // Flusha Game Card final
    flushColumn();
    flushQuestion();
    flushStory(); // Flusha o resto da história
    flushAnswerKey();
    return <>{elements}</>;
};

// Componente Isolado para o Card de Gabarito
const AnswerKeyCard = ({ lines, renderInlineStyles, showAnswers }) => {
    const [isVisible, setIsVisible] = useState(false);

    React.useEffect(() => {
        if (showAnswers !== undefined) {
            setIsVisible(showAnswers);
        }
    }, [showAnswers]);

    // Se estiver oculto (isVisible = false), NÃO renderiza o conteúdo detalhado,
    // garantindo que não saia no cloneNode do ExportService.

    return (
        <Card
            className={`mt-8 mb-4 pt-6 ${isVisible ? '' : 'no-print'}`}
            style={isVisible ? { pageBreakBefore: 'always', breakBefore: 'page' } : {}}
        >
            <div
                onClick={() => setIsVisible(!isVisible)}
                className="flex items-center justify-between cursor-pointer bg-brown-50 hover:bg-brown-100 p-4 rounded-xl transition-colors border border-brown-200"
            >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-brown-200 flex items-center justify-center text-brown-700">
                        <Key className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-brown-900">Gabarito da Atividade</h3>
                        <p className="text-xs text-brown-700">Clique para mostrar/ocultar as respostas</p>
                    </div>
                </div>
                {isVisible ? <ChevronUp className="text-brown-600" /> : <ChevronDown className="text-brown-600" />}
            </div>

            {isVisible && (
                <div className="mt-3 p-5 bg-white border-2 border-brown-100 rounded-xl shadow-sm">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {lines.map((line, idx) => {
                            // Tenta formatar bonito se for "1. a"
                            const match = line.match(/^(\d+)[.)]\s*([a-eA-E].*)/);
                            if (match) {
                                return (
                                    <div key={idx} className="flex items-center gap-2 p-2 border-b border-brown-50">
                                        <span className="font-bold text-brown-700 w-8">{match[1]}.</span>
                                        <span className="font-medium text-brown-700">{match[2]}</span>
                                    </div>
                                );
                            }
                            // Exclui o titulo se acabou entrando no buffer
                            if (/gabarito/i.test(line)) return null;

                            return <p key={idx} className="text-brown-700 border-b border-brown-50 py-1">{renderInlineStyles(line)}</p>;
                        })}
                    </div>
                </div>
            )}
        </Card>
    );
};

export default RichTextRenderer;
