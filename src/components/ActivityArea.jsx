import React from 'react';
import { Copy, FileText, Download, Sparkles, Check, Pencil, Play, Gamepad2 } from 'lucide-react';
import { QuizGame } from './QuizGame';
import { WordSearchGame } from './WordSearchGame';
import { MusicGame } from './MusicGame';
import RichTextRenderer from './RichTextRenderer';
import { CrosswordActivity } from './CrosswordActivity';
import ConnectDotsGame from './ConnectDotsGame';
import DrackerVideoGallery from './DrackerVideoGallery';
import { PDFMergerTool } from './PDFMergerTool';

import html2pdf from 'html2pdf.js';

// UI Components
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { Card } from './ui/Card';
import { Input } from './ui/Input';

export const ActivityArea = ({
    generatedContent,
    activityType,
    foundWords,
    showAnswers,
    setShowAnswers,
    handleCopy,
    handleDownloadDoc,
    handleDownloadPdf,
    activityAreaRef,
    wordsearchTitle,
    setWordsearchTitle,
    wordsearchHideText,
    setWordsearchHideText,
    wordsearchHideGrid,
    setWordsearchHideGrid,
    foundPlacements,
    isLoading,
    isGeneratingAudio,
    onEdit,

    musicData,
    drackerData,
    crosswordData,
    quizData,
    onCrosswordUpdate,
    connectDotsData
}) => {
    const hasContent = generatedContent || (activityType === 'crossword' && crosswordData) || (activityType === 'connect_dots' && connectDotsData) || (activityType === 'video_gallery') || (activityType === 'merge_pdf');
    const [printMode, setPrintMode] = React.useState('all'); // 'all', 'lyrics', 'questions'
    const [isGameMode, setIsGameMode] = React.useState(false);
    const [pdfShowAlternatives, setPdfShowAlternatives] = React.useState(false);
    const isWordsearchGame = isGameMode && activityType === 'wordsearch';
    const isCrosswordGame = isGameMode && activityType === 'crossword';
    const isMusicGame = isGameMode && activityType === 'simplify';

    // Reset game mode when content changes
    React.useEffect(() => {
        setIsGameMode(false);
        setPdfShowAlternatives(false);
    }, [generatedContent]);

    const handlePrint = (mode) => {
        setPrintMode(mode);
        setTimeout(() => {
            window.print();
            setPrintMode('all');
        }, 500);
    };

    const handleDirectDownload = (elementId, filename) => {
        const element = document.getElementById(elementId);
        if (!element) return;

        // Apply temporary print styles for capture if needed, 
        // but html2pdf handles visible content. 
        // We might need to ensure the element is visible.

        const opt = {
            margin: 10, // mm
            filename: filename,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, logging: false },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        // We temporarily set printMode to ensure the right content is visible if logic depends on it,
        // though strictly targeting by ID is better.
        // However, the essay lines are "only-print". html2pdf captures SCREEN state usually unless customized.
        // We might need to force the "print" state visuals. 
        // Actually, html2pdf renders what is in the DOM. 
        // If our essay lines are `.only-print` (display: none on screen), they won't show in html2pdf!
        // We need a way to Toggle "Preview Mode" or add a class to valid elements before downloading.

        // Strategy: Force a class on the element or body to trigger "print-like" styles for the capture.
        element.classList.add('pdf-capture-mode');
        if (pdfShowAlternatives && elementId === 'questions-card') {
            element.classList.add('pdf-show-alternatives');
        }

        html2pdf().set(opt).from(element).save().then(() => {
            element.classList.remove('pdf-capture-mode');
            element.classList.remove('pdf-show-alternatives');
        });
    };

    return (
        <div className="lg:col-span-8">
            <div className="bg-white rounded-2xl shadow-xl border border-brown-200 min-h-96 flex flex-col transition-all">
                <div className="p-4 border-b border-brown-100 flex items-center justify-between bg-brown-50/50 no-print rounded-t-2xl">
                    <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${hasContent ? 'bg-green-500' : 'bg-brown-300'}`}></span>
                        <span className="text-xs font-bold text-brown-500 uppercase">
                            {hasContent ? 'Pronto' : 'Aguardando'}
                        </span>
                    </div>

                    <div className="flex gap-2">
                        {hasContent && (
                            <>
                                {(activityType === 'quiz' || activityType === 'summary' || activityType === 'simplify') && (
                                    <Button
                                        onClick={onEdit}
                                        variant="secondary"
                                        className="h-8 text-sm px-3"
                                        icon={Pencil}
                                    >
                                        {activityType === 'quiz' ? 'Quiz' : 'Editar'}
                                    </Button>
                                )}
                                {activityType === 'wordsearch' && foundWords.length > 0 && (
                                    <Button
                                        onClick={() => setShowAnswers(!showAnswers)}
                                        variant={showAnswers ? "primary" : "secondary"}
                                        className={`h-8 text-sm px-3 ${showAnswers ? 'bg-green-600 hover:bg-green-700 text-white' : ''}`}
                                        icon={showAnswers ? Check : undefined}
                                    >
                                        {showAnswers ? 'Respostas' : 'Respostas'}
                                    </Button>
                                )}
                                <Button onClick={handleCopy} variant="ghost" className="h-8 w-8 p-0" icon={Copy} title="Copiar" />
                                <Button onClick={handleDownloadDoc} variant="ghost" className="h-8 w-8 p-0" icon={FileText} title="Baixar DOCX" />
                                <Button onClick={handleDownloadPdf} variant="ghost" className="h-8 w-8 p-0" icon={Download} title="Imprimir PDF" />
                            </>
                        )}
                    </div>
                </div>

                <div className="flex-1 p-8 overflow-y-auto" ref={activityAreaRef} id="activity-area-print">
                    {hasContent ? (
                        <>
                            {activityType === 'wordsearch' && (
                                <Card className="mb-6 bg-brown-50 no-print">
                                    <Input
                                        label="Nome da Atividade"
                                        value={wordsearchTitle}
                                        onChange={(e) => setWordsearchTitle(e.target.value)}
                                        placeholder="Digite o título da atividade"
                                    />
                                    <div className="flex flex-col gap-2 mt-4">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={wordsearchHideText}
                                                onChange={(e) => {
                                                    setWordsearchHideText(e.target.checked);
                                                    if (e.target.checked) setWordsearchHideGrid(false);
                                                }}
                                                className="w-4 h-4 rounded text-brown-600 focus:ring-brown-500 accent-brown-600"
                                            />
                                            <span className="text-xs font-bold text-brown-700">Esconder a História (Só o Jogo)</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={wordsearchHideGrid}
                                                onChange={(e) => {
                                                    setWordsearchHideGrid(e.target.checked);
                                                    if (e.target.checked) setWordsearchHideText(false);
                                                }}
                                                className="w-4 h-4 rounded text-brown-600 focus:ring-brown-500 accent-brown-600"
                                            />
                                            <span className="text-xs font-bold text-brown-700">Esconder o Jogo (Só a História)</span>
                                        </label>
                                    </div>
                                    <Button
                                        onClick={() => setIsGameMode(!isGameMode)}
                                        className={`mt-4 w-full border-none shadow-lg animate-pulse-slow ${isWordsearchGame ? 'bg-amber-100 text-amber-900 hover:bg-amber-200' : 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:scale-105'}`}
                                        icon={Gamepad2}
                                    >
                                        {isWordsearchGame ? 'Voltar ao modo impressão' : 'Jogar Agora (Online)'}
                                    </Button>
                                </Card>
                            )}



                            {/* QUIZ GAME TOGGLE */}
                            {activityType === 'quiz' && quizData && (
                                <Card className="mb-6 bg-amber-50 border-amber-200 no-print flex items-center justify-between p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                                            <Gamepad2 className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-amber-900">Modo Jogo Interativo</h3>
                                            <p className="text-xs text-amber-700">Transforme este quiz em um jogo divertido agora!</p>
                                        </div>
                                    </div>
                                    <Button
                                        onClick={() => setIsGameMode(!isGameMode)}
                                        className={`transition-all shadow-sm ${isGameMode ? 'bg-amber-100 text-amber-900 hover:bg-amber-200 border-amber-300' : 'bg-amber-600 text-white hover:bg-amber-700'}`}
                                    >
                                        {isGameMode ? 'Voltar para Impressão' : 'Jogar Agora'}
                                    </Button>
                                </Card>
                            )}

                            {activityType === 'crossword' && crosswordData && (
                                <Card className="mb-6 bg-blue-50 border-blue-200 no-print flex items-center justify-between p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                            <Gamepad2 className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-blue-900">Palavras Cruzadas</h3>
                                            <p className="text-xs text-blue-700">Impressão primeiro; jogue online se quiser.</p>
                                        </div>
                                    </div>
                                    <Button
                                        onClick={() => setIsGameMode(!isGameMode)}
                                        className={`transition-all shadow-sm ${isCrosswordGame ? 'bg-blue-100 text-blue-900 hover:bg-blue-200 border-blue-300' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                                    >
                                        {isCrosswordGame ? 'Voltar ao modo impressão' : 'Jogar Agora (Online)'}
                                    </Button>
                                </Card>
                            )}

                            {/* --- INTERACTIVE GAMES --- */}

                            {isWordsearchGame ? (
                                <WordSearchGame
                                    content={generatedContent}
                                    wordsToFind={(foundWords || []).map(w => typeof w === 'string' ? w.replace(/\s+/g, '') : (w.word || '').replace(/\s+/g, ''))}
                                    onRestart={() => setIsGameMode(false)}
                                />
                            ) : isCrosswordGame ? (
                                <CrosswordActivity
                                    data={crosswordData}
                                    onUpdate={onCrosswordUpdate}
                                    isGameMode={true}
                                    onRestart={() => setIsGameMode(false)}
                                />
                            ) : activityType === 'crossword' && crosswordData ? (
                                <CrosswordActivity
                                    data={crosswordData}
                                    onUpdate={onCrosswordUpdate}
                                    isGameMode={false}
                                    onRestart={() => setIsGameMode(false)}
                                />
                            ) : isGameMode && quizData ? (
                                <QuizGame
                                    quizData={quizData}
                                    onRestart={() => setIsGameMode(true)} // Force re-render or handle inside component
                                />) : isMusicGame && musicData ? (
                                    <MusicGame
                                        musicData={musicData}
                                        onRestart={() => setIsGameMode(true)}
                                        onExitToPrint={() => setIsGameMode(false)}
                                    />) : activityType === 'summary' && drackerData ? (
                                        <div className="space-y-6">
                                            <Card className="p-8 relative group overflow-hidden border border-brown-100 shadow-sm print:shadow-none print:border-4 print:border-brown-200 print:p-10">
                                                <div className="absolute top-0 right-0 p-4 opacity-20 pointer-events-none print:opacity-10" style={{ filter: 'sepia(100%) saturate(300%) hue-rotate(315deg) brightness(70%)' }}>
                                                    <img src="/dracker_character.png" alt="Drácker" className="w-32 h-32 object-contain opacity-50 print:w-48 print:h-48" />
                                                </div>

                                                {/* HEADER */}
                                                {/* AUDIO SUGGESTION */}
                                                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 mt-6 mr-6 ml-6 print:hidden relative z-20">
                                                    <div className="flex items-start gap-3">
                                                        <Sparkles className="w-5 h-5 text-amber-600 mt-0.5" />
                                                        <div>
                                                            <h4 className="font-bold text-amber-900 text-sm">Dica de Narração Fluida</h4>
                                                            <p className="text-xs text-amber-800 mt-1">
                                                                Para uma leitura muito mais natural e fluida, copie o texto da história e cole no <b>Google AI Studio</b>.
                                                                <a
                                                                    href="https://aistudio.google.com/generate-speech"
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="underline hover:text-amber-950 ml-1 font-bold decoration-amber-300"
                                                                >
                                                                    Acessar AI Studio
                                                                </a>
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="border-b border-brown-100 pb-4 mb-6 flex justify-between items-start print:border-b-2 print:border-brown-800 print:mb-8">
                                                    <div>
                                                        <h2 className="text-2xl font-bold text-brown-900 mb-1 print:text-4xl print:font-serif">Aprenda com o Drácker</h2>
                                                        <p className="text-brown-600 font-medium opacity-75 print:text-xl print:text-brown-800 print:italic">Uma história interativa para a turma</p>
                                                    </div>
                                                    <Button
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(drackerData.story);
                                                            alert('História copiada!');
                                                        }}
                                                        variant="secondary"
                                                        className="text-xs print:hidden"
                                                        icon={Copy}
                                                    >
                                                        Copiar Texto
                                                    </Button>
                                                </div>



                                                {/* STORY CONTENT */}
                                                <div className="prose prose-lg max-w-none text-brown-900 leading-loose mb-10 font-serif print:text-xl print:leading-loose print:text-justify">
                                                    {drackerData.story.split('\n\n').map((paragraph, index) => (
                                                        <p key={index} className="indent-8 mb-6 text-justify">
                                                            {paragraph.split(/(\*\*.*?\*\*)/g).map((part, i) => {
                                                                if (part.startsWith('**') && part.endsWith('**')) {
                                                                    return (
                                                                        <strong key={i} className="text-brown-800 font-extrabold print:text-black">
                                                                            {part.slice(2, -2)}
                                                                        </strong>
                                                                    );
                                                                }
                                                                return part;
                                                            })}
                                                        </p>
                                                    ))}
                                                </div>

                                                {/* ACTIVITIES CONTENT */}
                                                <Card className="bg-white/50 border-2 border-dashed border-brown-200 print:border-none print:bg-transparent print:p-0">
                                                    <h3 className="text-lg font-bold text-brown-800 mb-6 flex items-center gap-2 print:text-3xl print:mb-8 print:mt-4 print:border-b print:border-brown-400 print:pb-2 break-before-page">
                                                        <img src="/dracker_character.png" alt="Brain" className="w-6 h-6 object-contain print:w-10 print:h-10" />
                                                        Atividades Práticas
                                                    </h3>
                                                    <ol className="list-none ml-0 space-y-6">
                                                        {drackerData.activities.map((act, idx) => {
                                                            // Handle legacy string case or new object case
                                                            const isObject = typeof act === 'object' && act !== null;

                                                            if (!isObject) {
                                                                // Legacy rendering
                                                                return (
                                                                    <li key={idx} className="text-brown-700 font-medium pl-2 border-b border-brown-100 pb-4">
                                                                        {String(act).split(/(\*\*.*?\*\*)/g).map((part, i) => {
                                                                            if (part.startsWith('**') && part.endsWith('**')) {
                                                                                return <strong key={i} className="text-brown-800 font-extrabold">{part.slice(2, -2)}</strong>;
                                                                            }
                                                                            return part;
                                                                        })}
                                                                    </li>
                                                                );
                                                            }

                                                            // Rich Object Rendering
                                                            return (
                                                                <li key={idx} className="bg-brown-50/50 rounded-xl p-4 border border-brown-100 hover:border-brown-200 transition-colors break-inside-avoid print:break-before-page">
                                                                    <div className="flex items-start gap-3 mb-3">
                                                                        <div className="w-8 h-8 rounded-full bg-brown-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm print:bg-brown-800 print:text-white">
                                                                            {idx + 1}
                                                                        </div>
                                                                        <div>
                                                                            <h4 className="font-bold text-brown-900 text-lg leading-tight">{act.title}</h4>
                                                                            {act.materials && (
                                                                                <div className="mt-1 flex items-start gap-2 text-sm text-brown-600">
                                                                                    <span className="font-bold text-xs uppercase tracking-wide bg-white px-2 py-0.5 rounded border border-brown-100 text-brown-500 shrink-0">Materiais</span>
                                                                                    <span className="italic">{act.materials}</span>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>

                                                                    {act.steps && (
                                                                        <div className="ml-11 text-brown-800 text-sm leading-relaxed border-l-2 border-brown-200 pl-4 py-1">
                                                                            <span className="font-bold text-brown-500 text-xs uppercase mb-1 block">Como fazer:</span>
                                                                            {/* Split numeric steps (1., 2., 3.) and render as list or with breaks */}
                                                                            {act.steps.split(/(\d+\.\s+)/).filter(Boolean).reduce((acc, part, i, arr) => {
                                                                                // If part is a number (e.g. "1. "), it starts a new line.
                                                                                // Reconstruct: Number + Text
                                                                                if (/^\d+\.\s+$/.test(part)) {
                                                                                    // Take this part and the next one
                                                                                    const text = arr[i + 1];
                                                                                    if (text) {
                                                                                        acc.push(
                                                                                            <div key={i} className="mb-2 flex items-start">
                                                                                                <span className="font-bold mr-1 min-w-[20px]">{part.trim()}</span>
                                                                                                <span>{text.trim()}</span>
                                                                                            </div>
                                                                                        );
                                                                                        arr[i + 1] = ''; // Mark as consumed
                                                                                    }
                                                                                } else if (part !== '' && i === 0 && !/^\d+\.\s+$/.test(arr[0])) {
                                                                                    // Handle case where it doesn't start with a number (fallback text)
                                                                                    acc.push(<div key={i} className="mb-2">{part}</div>);
                                                                                }
                                                                                return acc;
                                                                            }, [])}
                                                                        </div>
                                                                    )}
                                                                </li>
                                                            );
                                                        })}
                                                    </ol>
                                                </Card>

                                                {/* FOOTER */}
                                                <div className="mt-8 pt-4 border-t border-brown-100 flex items-center justify-between text-xs text-brown-400 print:mt-auto print:border-brown-800 print:text-brown-600">
                                                    <span className="flex items-center gap-1">
                                                        <img src="/dracker_character.png" alt="Logo" className="w-4 h-4 opacity-50 grayscale" />
                                                        Atividade Adaptada - Drácker
                                                    </span>
                                                    <span>{new Date().toLocaleDateString()}</span>
                                                </div>
                                            </Card>
                                        </div>
                                    ) : activityType === 'simplify' && musicData ? (
                                        <div className="space-y-6">
                                            {/* Card: Destaque da Playlist */}
                                            <Card className="mb-6 bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-300 no-print shadow-lg overflow-hidden">
                                                <div className="p-0 flex flex-col sm:flex-row">
                                                    <div className="w-full sm:w-48 h-48 sm:h-auto relative">
                                                        <img
                                                            src="/cover_musica_dracker.jpg"
                                                            alt="Músicas do Drácker"
                                                            className="w-full h-full object-cover"
                                                        />
                                                    </div>
                                                    <div className="p-6 flex flex-col justify-center flex-1">
                                                        <h3 className="font-bold text-purple-900 text-xl mb-2">Playlist Oficial: Músicas do Drácker</h3>
                                                        <p className="text-purple-700 mb-4">Acesse todas as músicas criadas com Drácker no Suno.</p>
                                                        <a
                                                            href="https://suno.com/@drackermusic"
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center justify-center px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg transition-colors gap-2 shadow-sm self-start"
                                                        >
                                                            🎧 Ouvir Playlist Completa
                                                        </a>
                                                    </div>
                                                </div>
                                            </Card>

                                            {/* Game Mode / Print Toggle */}
                                            <Card className="mb-6 bg-green-50 border-green-200 no-print flex items-center justify-between p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                                                        <Gamepad2 className="w-6 h-6" />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-green-900">Jogo de Interpretação Musical</h3>
                                                        <p className="text-xs text-green-700">Responda as perguntas com múltipla escolha!</p>
                                                    </div>
                                                </div>
                                                <Button
                                                    onClick={() => setIsGameMode(!isGameMode)}
                                                    className={`transition-all shadow-sm ${isGameMode ? 'bg-green-100 text-green-900 hover:bg-green-200 border-green-300' : 'bg-green-600 text-white hover:bg-green-700'}`}
                                                >
                                                    {isGameMode ? 'Voltar para Impressão' : 'Jogar Agora'}
                                                </Button>
                                            </Card>

                                            {/* Card 1: Music Lyrics */}
                                            <div className={printMode === 'questions' ? 'no-print' : ''}>
                                                <Card id="lyrics-card" className="p-8 relative group border border-brown-100 shadow-sm print:shadow-none print:border-4 print:border-brown-200 print:p-10">
                                                    <div className="absolute top-0 right-0 p-4 opacity-10 print:opacity-5">
                                                        <span className="text-6xl print:text-8xl">🎵</span>
                                                    </div>
                                                    <div className="flex justify-between items-center border-b border-brown-100 pb-4 mb-6 print:border-b-2 print:border-brown-800 print:mb-8">
                                                        <h2 className="text-2xl font-bold text-brown-900 print:text-4xl print:font-serif">
                                                            Música do Drácker: <span className="text-purple-700">{musicData.title}</span>
                                                        </h2>
                                                        <div className="flex gap-2">
                                                            <Button
                                                                onClick={() => handleDirectDownload('lyrics-card', 'Música_Dracker.pdf')}
                                                                variant="secondary"
                                                                className="text-xs z-10 print:hidden bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200"
                                                                icon={Download}
                                                            >
                                                                Baixar Letra
                                                            </Button>
                                                            <Button
                                                                onClick={() => {
                                                                    navigator.clipboard.writeText(musicData.lyrics);
                                                                    alert('Letra copiada!');
                                                                }}
                                                                variant="secondary"
                                                                className="text-xs z-10 print:hidden"
                                                                icon={Copy}
                                                            >
                                                                Copiar
                                                            </Button>
                                                        </div>
                                                    </div>
                                                    <div className="font-sans text-brown-800 text-lg leading-relaxed print:font-serif print:text-xl print:leading-loose whitespace-pre-wrap print:block">
                                                        {musicData.lyrics.split('\n').map((line, idx) => {
                                                            const parts = line.split(/(\*\*.*?\*\*)/g);
                                                            return (
                                                                <div key={idx} className={`${line.trim() === '' ? 'h-6' : ''} break-inside-avoid`}>
                                                                    {parts.map((part, i) => {
                                                                        if (part.startsWith('**') && part.endsWith('**')) {
                                                                            return <strong key={i} className="font-extrabold text-brown-900 print:text-black">{part.slice(2, -2)}</strong>;
                                                                        }
                                                                        return part;
                                                                    })}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>

                                                    {/* Footer for Lyrics Page */}
                                                    <div className="hidden print:flex mt-auto pt-8 border-t border-brown-200 justify-between text-xs text-brown-600">
                                                        <span className="flex items-center gap-1 font-bold">
                                                            <img src="/dracker_character.png" alt="Logo" className="w-4 h-4 opacity-50 grayscale" />
                                                            Atividade Musical - Drácker
                                                        </span>
                                                        <span>{new Date().toLocaleDateString()}</span>
                                                    </div>
                                                </Card>
                                            </div>

                                            {/* Card 1b: Style (Hidden in Print usually, or kept simple) */}
                                            <div className="no-print">
                                                {musicData.style && (
                                                    <Card className="p-6 relative group">
                                                        <div className="absolute top-0 right-0 p-2 opacity-10">
                                                            <span className="text-6xl">🎨</span>
                                                        </div>
                                                        <div className="flex justify-between items-center border-b border-brown-100 pb-2 mb-4">
                                                            <h2 className="text-xl font-bold text-brown-900">Estilo Musical</h2>
                                                            <Button
                                                                onClick={() => {
                                                                    navigator.clipboard.writeText(musicData.style);
                                                                    alert('Estilo copiado!');
                                                                }}
                                                                variant="secondary"
                                                                className="text-xs z-10"
                                                                icon={Copy}
                                                            >
                                                                Copiar Estilo
                                                            </Button>
                                                        </div>
                                                        <div className="font-sans text-brown-700 text-base leading-relaxed whitespace-pre-wrap">
                                                            {musicData.style}
                                                        </div>
                                                    </Card>
                                                )}
                                            </div>

                                            {/* Explicit Page Break */}
                                            {printMode === 'all' && <div className="page-break"></div>}

                                            {/* Card 2: Questions */}
                                            <div className={printMode === 'lyrics' ? 'no-print' : ''}>
                                                <Card id="questions-card" className="p-8 relative mt-6 print:border-4 print:border-brown-200 print:p-10 print:shadow-none">
                                                    <div className="absolute top-0 right-0 p-4 opacity-10 print:opacity-5">
                                                        <span className="text-6xl print:text-8xl">📝</span>
                                                    </div>
                                                    <div className="flex justify-between items-center mb-6 border-b border-brown-100 pb-4 print:border-brown-800 print:mb-8">
                                                        <h2 className="text-xl font-bold text-brown-900 print:text-3xl print:font-serif mb-0">
                                                            Perguntas de Interpretação: <span className="text-purple-700">{musicData.title}</span>
                                                        </h2>
                                                        <div className="flex items-center gap-4 z-10 no-pdf print:hidden">
                                                            <label className="flex items-center gap-2 cursor-pointer text-sm text-brown-700 select-none bg-brown-50 px-3 py-1.5 rounded-lg border border-brown-200 hover:bg-brown-100 transition-colors">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={pdfShowAlternatives}
                                                                    onChange={(e) => setPdfShowAlternatives(e.target.checked)}
                                                                    className="rounded border-brown-300 text-purple-600 focus:ring-purple-500 w-4 h-4"
                                                                />
                                                                Incluir Alternativas
                                                            </label>
                                                            <Button
                                                                onClick={() => handleDirectDownload('questions-card', 'Perguntas_Dracker.pdf')}
                                                                variant="secondary"
                                                                className="text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200"
                                                                icon={Download}
                                                            >
                                                                Baixar Perguntas
                                                            </Button>
                                                        </div>
                                                    </div>
                                                    <ol className="list-decimal list-outside ml-6 space-y-6 print:space-y-8">
                                                        {(musicData.questions || []).map((q, idx) => {
                                                            const questionText = typeof q === 'string' ? q : (q.text || q.question || `Pergunta ${idx + 1}`);
                                                            const options = Array.from(new Set(
                                                                (((typeof q === 'object' && (q.options || q.alternatives)) || [])).map(o => o.trim()).filter(Boolean)
                                                            ));

                                                            return (
                                                                <li key={idx} className="text-brown-800 font-medium print:text-xl print:text-black break-inside-avoid">
                                                                    <div className="mb-3 font-bold print:mb-4">{questionText}</div>
                                                                    {/* Print: Essay Lines */}
                                                                    <div className="only-print essay-lines space-y-4 my-4">
                                                                        {[1, 2, 3].map((line, lIdx) => (
                                                                            <div key={lIdx} className="border-b border-brown-300 h-8 w-full"></div>
                                                                        ))}
                                                                    </div>

                                                                    {options.length > 0 && (
                                                                        <div className="pl-4 space-y-2 no-print alternatives-list">
                                                                            {/* Screen: Alternatives */}
                                                                            {options.map((opt, i) => (
                                                                                <div key={i} className="flex items-center gap-2 text-brown-700 font-normal text-base">
                                                                                    <div className="w-5 h-5 rounded-full border-2 border-brown-300 shrink-0"></div>
                                                                                    <span>{opt}</span>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                </li>
                                                            );
                                                        })}
                                                    </ol>

                                                    {/* Footer for Questions Page */}
                                                    <div className="hidden print:flex mt-16 pt-8 border-t border-brown-200 justify-between text-xs text-brown-600">
                                                        <span className="flex items-center gap-1 font-bold">
                                                            <img src="/dracker_character.png" alt="Logo" className="w-4 h-4 opacity-50 grayscale" />
                                                            Interpretação - Drácker
                                                        </span>
                                                        <span>{new Date().toLocaleDateString()}</span>
                                                    </div>
                                                </Card>
                                            </div>
                                        </div>
                                    ) : activityType === 'video_gallery' ? (
                                        <DrackerVideoGallery />
                                    ) : activityType === 'merge_pdf' ? (
                                        <PDFMergerTool />
                                    ) : activityType === 'connect_dots' && connectDotsData ? (
                                        <>
                                            <Card className="mb-6 bg-purple-50 border-purple-200 no-print flex items-center justify-between p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                                                        <Gamepad2 className="w-6 h-6" />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-purple-900">Liga Pontos</h3>
                                                        <p className="text-xs text-purple-700">Imprima a folha ou jogue online!</p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    {onEdit && (
                                                        <Button
                                                            onClick={onEdit}
                                                            variant="outline"
                                                            className="border-purple-300 text-purple-700 hover:bg-purple-100"
                                                        >
                                                            <Pencil className="w-4 h-4 mr-2" />
                                                            Editar
                                                        </Button>
                                                    )}
                                                    <Button
                                                        onClick={() => setIsGameMode(!isGameMode)}
                                                        className={`transition-all shadow-sm ${isGameMode ? 'bg-purple-100 text-purple-900 hover:bg-purple-200 border-purple-300' : 'bg-purple-600 text-white hover:bg-purple-700'}`}
                                                    >
                                                        {isGameMode ? 'Voltar para Impressão' : 'Jogar Agora'}
                                                    </Button>
                                                </div>
                                            </Card>
                                            <ConnectDotsGame
                                                data={connectDotsData}
                                                isGameMode={isGameMode}
                                            />
                                        </>
                                    ) : (
                                <>
                                    {activityType === 'wordsearch' && (
                                        <Card className="mb-6 bg-purple-50 border-purple-200 no-print flex items-center justify-between p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="flex gap-2">
                                                    <Button
                                                        onClick={() => setShowAnswers(!showAnswers)}
                                                        variant={showAnswers ? "primary" : "secondary"}
                                                        className={`h-8 text-sm px-3 ${showAnswers ? 'bg-green-600 hover:bg-green-700 text-white' : ''}`}
                                                    >
                                                        {showAnswers ? 'Respostas' : 'Soluções'}
                                                    </Button>
                                                    <Button
                                                        onClick={onEdit}
                                                        variant="secondary"
                                                        className="h-8 text-sm px-3"
                                                    >
                                                        Editar/Adicionar
                                                    </Button>
                                                </div>
                                            </div>
                                        </Card>
                                    )}
                                    <RichTextRenderer
                                        content={generatedContent}
                                        showAnswers={showAnswers}
                                        foundWords={foundWords}
                                        foundPlacements={foundPlacements}
                                        hideText={activityType === 'wordsearch' && wordsearchHideText}
                                        hideGrid={activityType === 'wordsearch' && wordsearchHideGrid}
                                        title={activityType === 'wordsearch' ? wordsearchTitle : null}
                                    />
                                </>
                            )}


                        </>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-brown-300 p-8">
                            {!isLoading && activityType === 'simplify' && (
                                <Card className="w-full max-w-2xl mb-8 bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-300 shadow-xl overflow-hidden animate-in fade-in zoom-in duration-300">
                                    <div className="p-0 flex flex-col sm:flex-row">
                                        <div className="w-full sm:w-40 h-40 sm:h-auto relative">
                                            <img
                                                src="/cover_musica_dracker.jpg"
                                                alt="Músicas do Drácker"
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div className="p-5 flex flex-col justify-center flex-1">
                                            <h3 className="font-bold text-purple-900 text-xl mb-1">Playlist Oficial</h3>
                                            <p className="text-sm text-purple-700 mb-4">Conheça as músicas do Drácker!</p>
                                            <a
                                                href="https://suno.com/@drackermusic"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center justify-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors gap-2 self-start"
                                            >
                                                🎧 Ouvir no Suno
                                            </a>
                                        </div>
                                    </div>
                                </Card>
                            )}

                            {isLoading ? (
                                <div className="flex flex-col items-center gap-4">
                                    <img src="/dracker_character.png" alt="Loading" className="w-16 h-16 animate-bounce" />
                                    <p className="text-brown-500">Criando...</p>
                                </div>
                            ) : (
                                <>
                                    <FileText className="w-12 h-12 mb-4" />
                                    <p className="text-brown-400">Área de Atividades</p>
                                    {isGeneratingAudio && (
                                        <p className="text-xs mt-2 text-brown-400">Processando áudio em background...</p>
                                    )}
                                </>
                            )}
                        </div>
                    )
                    }
                </div >
            </div >
        </div >
    );
};
