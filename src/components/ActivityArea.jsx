import React, { useState, useEffect } from 'react';
import { FileText } from 'lucide-react';
import { QuizGame } from './QuizGame';
import { QuizPrint } from './QuizPrint';
import { WordSearchGame } from './WordSearchGame';
import { MusicGame } from './MusicGame';
import RichTextRenderer from './RichTextRenderer';
import { CrosswordActivity } from './CrosswordActivity';
import ConnectDotsGame from './ConnectDotsGame';
import DrackerVideoGallery from './DrackerVideoGallery';
import DominoGame from './domino/DominoGame';
import DominoPrint from './domino/DominoPrint';

import { PDFMergerTool } from './PDFMergerTool';
import { AboutSystem } from './AboutSystem';
import MemoryGame from './memory/MemoryGame';
import DrackerRPG from './RPG/DrackerRPG';
import HangmanGame from './HangmanGame';

import html2pdf from 'html2pdf.js';

// UI Components
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { Input } from './ui/Input'; // Used in Wordsearch customization

// Sub-components
import { ActivityHeader } from './activity-area/ActivityHeader';
import { DrackerStoryRenderer } from './activity-area/DrackerStoryRenderer';
import { MusicActivityRenderer } from './activity-area/MusicActivityRenderer';
import { GameToggleCard } from './activity-area/GameToggleCard';
import { SunoNativePlayer } from './activity-area/SunoNativePlayer';

export const ActivityArea = ({
    generatedContent,
    activityType,
    foundWords,
    showAnswers,
    setShowAnswers,
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
    activityTitle,
    setActivityTitle,
    onCrosswordUpdate,
    onDrackerUpdate,
    connectDotsData,
    rpgData,
    dominoData,
    drackerState,
    isFullWidth,
    toggleFullWidth,
    openManualMusicEditor
}) => {
    // --- State ---
    const [printMode, setPrintMode] = useState('all'); // 'all', 'lyrics', 'questions'
    const [isGameMode, setIsGameMode] = useState(false);
    const [pdfShowAlternatives, setPdfShowAlternatives] = useState(true);
    const [quizPrintMode, setQuizPrintMode] = useState('full');  // 'full' | 'text-only'
    const [quizShowDifficulty, setQuizShowDifficulty] = useState(true);

    // Derived Booleans for Game Modes
    const isWordsearchGame = isGameMode && activityType === 'wordsearch';
    const isCrosswordGame = isGameMode && activityType === 'crossword';
    const isMusicGame = isGameMode && activityType === 'simplify';

    const hasContent = generatedContent ||
        (activityType === 'crossword' && crosswordData) ||
        (activityType === 'connect_dots' && connectDotsData) ||
        (activityType === 'video_gallery') ||
        (activityType === 'merge_pdf') ||
        (activityType === 'about_system') ||
        (activityType === 'rpg' && rpgData) ||
        (activityType === 'hangman') ||
        (activityType === 'domino' && dominoData);

    // Reset game mode when content changes
    useEffect(() => {
        setIsGameMode(false);
        setPdfShowAlternatives(false);
        setQuizPrintMode('full');
        setQuizShowDifficulty(true);
    }, [generatedContent, activityType]);

    // Used by MusicActivityRenderer
    const handleDirectDownload = (elementId, filename) => {
        const element = document.getElementById(elementId);
        if (!element) return;

        const opt = {
            margin: 10, // mm
            filename: filename,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, logging: false },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        element.classList.add('pdf-capture-mode');
        if (pdfShowAlternatives && elementId === 'questions-card') {
            element.classList.add('pdf-show-alternatives');
        }

        html2pdf().set(opt).from(element).save().then(() => {
            element.classList.remove('pdf-capture-mode');
            element.classList.remove('pdf-show-alternatives');
        });
    };

    // --- Render Logic ---

    return (
        <div className="w-full flex-1 flex flex-col print:block">
            <div className="bg-white rounded-2xl shadow-xl border border-brown-200 min-h-96 flex flex-col transition-all print:block print:shadow-none print:border-none">

                <ActivityHeader
                    hasContent={hasContent}
                    activityType={activityType}
                    onEdit={onEdit}
                    showAnswers={showAnswers}
                    setShowAnswers={setShowAnswers}
                    handleDownloadPdf={handleDownloadPdf}
                    foundWords={foundWords}
                    isFullWidth={isFullWidth}
                    toggleFullWidth={toggleFullWidth}
                    openManualMusicEditor={openManualMusicEditor}
                    activityTitle={activityTitle}
                    setActivityTitle={setActivityTitle}
                />

                <div className={`flex-1 ${isFullWidth ? 'p-1 sm:p-2' : 'p-4 sm:p-8'} overflow-y-auto print:overflow-visible custom-scrollbar print:p-0`} ref={activityAreaRef} id="activity-area-print">
                    {hasContent ? (
                        <>
                            {/* --- SETUP / TOGGLE CARDS --- */}

                            {/* Wordsearch Customization Card */}
                            {activityType === 'wordsearch' && (
                                <GameToggleCard
                                    title="Personalizar & Jogar"
                                    description="Configure a impressão ou jogue online."
                                    isGameMode={isWordsearchGame}
                                    onToggle={() => setIsGameMode(!isGameMode)}
                                    color="amber"
                                >
                                    <div className="flex flex-col gap-2 mr-4 md:mr-8 min-w-[200px]">
                                        <div className="flex flex-col gap-1">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={wordsearchHideText}
                                                    onChange={(e) => {
                                                        setWordsearchHideText(e.target.checked);
                                                        if (e.target.checked) setWordsearchHideGrid(false);
                                                    }}
                                                    className="w-3 h-3 rounded text-brown-600 focus:ring-brown-500 accent-brown-600"
                                                />
                                                <span className="text-[10px] font-bold text-brown-700">Só Jogo (Esconder Texto)</span>
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={wordsearchHideGrid}
                                                    onChange={(e) => {
                                                        setWordsearchHideGrid(e.target.checked);
                                                        if (e.target.checked) setWordsearchHideText(false);
                                                    }}
                                                    className="w-3 h-3 rounded text-brown-600 focus:ring-brown-500 accent-brown-600"
                                                />
                                                <span className="text-[10px] font-bold text-brown-700">Só História (Esconder Jogo)</span>
                                            </label>
                                        </div>
                                    </div>
                                </GameToggleCard>
                            )}

                            {/* Quiz Toggle */}
                            {activityType === 'quiz' && quizData && (
                                <GameToggleCard
                                    title="Modo Jogo Interativo"
                                    description="Transforme este quiz em um jogo divertido agora!"
                                    isGameMode={isGameMode}
                                    onToggle={() => setIsGameMode(!isGameMode)}
                                    color="amber"
                                >
                                    {/* Controles de impressão – visíveis só quando não está em modo jogo */}
                                    {!isGameMode && (
                                        <div className="flex flex-col gap-1.5 mr-3">
                                            <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Layout de Impressão</span>
                                            <div className="flex gap-1.5">
                                                <button
                                                    onClick={() => setQuizPrintMode('full')}
                                                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                                                        quizPrintMode === 'full'
                                                            ? 'bg-amber-600 text-white border-amber-700'
                                                            : 'bg-white text-amber-800 border-amber-300 hover:bg-amber-50'
                                                    }`}
                                                    title="Cards com alternativas A/B/C/D"
                                                >
                                                    📋 Com Alternativas
                                                </button>
                                                <button
                                                    onClick={() => setQuizPrintMode('text-only')}
                                                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                                                        quizPrintMode === 'text-only'
                                                            ? 'bg-amber-600 text-white border-amber-700'
                                                            : 'bg-white text-amber-800 border-amber-300 hover:bg-amber-50'
                                                    }`}
                                                    title="Apenas enunciado + linhas para resposta. Cabe mais questões por página."
                                                >
                                                    ✏️ Só Enunciado
                                                </button>
                                            </div>
                                            <label className="flex items-center gap-1.5 cursor-pointer select-none mt-0.5">
                                                <input
                                                    type="checkbox"
                                                    checked={quizShowDifficulty}
                                                    onChange={e => setQuizShowDifficulty(e.target.checked)}
                                                    className="w-3 h-3 accent-amber-600"
                                                />
                                                <span className="text-[10px] font-bold text-amber-700">Mostrar dificuldade</span>
                                            </label>
                                        </div>
                                    )}
                                </GameToggleCard>
                            )}

                            {/* Crossword Toggle */}
                            {activityType === 'crossword' && crosswordData && (
                                <GameToggleCard
                                    title="Palavras Cruzadas"
                                    description="Impressão primeiro; jogue online se quiser."
                                    isGameMode={isGameMode}
                                    onToggle={() => setIsGameMode(!isGameMode)}
                                    color="blue"
                                />
                            )}

                            {/* Connect Dots Toggle */}
                            {activityType === 'connect_dots' && connectDotsData && !isGameMode && ( // Show card only slightly different logic? No, let's keep it consistent
                                <GameToggleCard
                                    title="Liga Pontos"
                                    description="Imprima a folha ou jogue online!"
                                    isGameMode={isGameMode}
                                    onToggle={() => setIsGameMode(!isGameMode)}
                                    color="purple"
                                />
                            )}

                            {/* Domino Toggle */}
                            {activityType === 'domino' && dominoData && (
                                <GameToggleCard
                                    title="Dominó Pedagógico"
                                    description="Imprima e recorte ou jogue online arrastando as peças!"
                                    isGameMode={isGameMode}
                                    onToggle={() => setIsGameMode(!isGameMode)}
                                    color="amber"
                                />
                            )}

                            {/* --- GAME / CONTENT RENDERERS --- */}

                            {isWordsearchGame ? (
                                <WordSearchGame
                                    content={generatedContent}
                                    wordsToFind={(foundWords || []).map(w => typeof w === 'string' ? w.replace(/\s+/g, '') : (w.word || '').replace(/\s+/g, ''))}
                                    cluesList={(foundWords || []).map(w => typeof w === 'string' ? w : (w.clue || w.word))}
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
                                    onRestart={() => setIsGameMode(true)}
                                />
                            ) : activityType === 'quiz' && quizData && !isGameMode ? (
                                <QuizPrint
                                    quizData={quizData}
                                    title={activityTitle}
                                    showAnswers={showAnswers}
                                    printMode={quizPrintMode}
                                    showDifficulty={quizShowDifficulty}
                                />
                            ) : isMusicGame && musicData ? (
                                <MusicGame
                                    musicData={musicData}
                                    onRestart={() => setIsGameMode(true)}
                                    onExitToPrint={() => setIsGameMode(false)}
                                />
                            ) : activityType === 'summary' && drackerData ? (
                                <DrackerStoryRenderer drackerData={drackerData} onUpdate={onDrackerUpdate} />
                            ) : activityType === 'simplify' && musicData ? (
                                <MusicActivityRenderer
                                    musicData={musicData}
                                    printMode={printMode}
                                    isGameMode={isGameMode}
                                    setIsGameMode={setIsGameMode}
                                    pdfShowAlternatives={pdfShowAlternatives}
                                    setPdfShowAlternatives={setPdfShowAlternatives}
                                    handleDirectDownload={handleDirectDownload}
                                />
                            ) : activityType === 'video_gallery' ? (
                                <DrackerVideoGallery />
                            ) : activityType === 'about_system' ? (
                                <AboutSystem />
                            ) : activityType === 'merge_pdf' ? (
                                <PDFMergerTool />
                            ) : activityType === 'connect_dots' && connectDotsData ? (
                                <ConnectDotsGame
                                    data={connectDotsData}
                                    isGameMode={isGameMode}
                                />
                            ) : activityType === 'hangman' ? (
                                <HangmanGame />
                            ) : activityType === 'domino' && dominoData ? (
                                isGameMode ? (
                                    <DominoGame data={dominoData} isGameMode={isGameMode} />
                                ) : (
                                    <DominoPrint data={dominoData} />
                                )
                            ) : activityType === 'memory' ? (
                                <MemoryGame isFullWidth={isFullWidth} />
                            ) : activityType === 'rpg' && rpgData ? (
                                <DrackerRPG data={rpgData} />
                            ) : (
                                /* Default Text Renderer (Quiz Print Mode / Wordsearch Print Mode) */
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
                        /* --- EMPTY / LOADING STATE --- */
                        <div className="h-full flex flex-col items-center justify-center text-brown-300 p-8">
                            {!isLoading && activityType === 'simplify' && (
                                <div className="w-full mb-8 animate-in fade-in zoom-in duration-300">
                                    <SunoNativePlayer />
                                </div>
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
                    )}
                </div >
            </div >
        </div >
    );
};
