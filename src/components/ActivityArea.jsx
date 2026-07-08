import React, { useState, useEffect } from 'react';
import { useActivity } from '../contexts/ActivityContext';
import { FileText, Sparkles } from 'lucide-react';
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
import { DrackerSummaryRenderer } from './activity-area/DrackerSummaryRenderer';

import HangmanGame from './HangmanGame';
import DetectiveRPG from './rpg/DetectiveRPG';
import ChatDracker from './chat/ChatDracker';
import { TradingCardMaker } from './trading-cards/TradingCardMaker';
import { NumberLineMaker } from './number-line/NumberLineMaker';
import { FractionsMaker } from './fractions/FractionsMaker';

import html2pdf from 'html2pdf.js';

// UI Components
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { Input } from './ui/Input'; // Used in Wordsearch customization

// Sub-components
import { ActivityHeader } from './activity-area/ActivityHeader';

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

    connectDotsData,

    dominoData,

    isFullWidth,
    toggleFullWidth,
    openManualMusicEditor
}) => {
    const { topic, lessonDetails, activeTabId } = useActivity();
    // --- State ---
    const [printMode, setPrintMode] = useState('all'); // 'all', 'lyrics', 'questions'
    const [isGameMode, setIsGameMode] = useState(false);
    const [pdfShowAlternatives, setPdfShowAlternatives] = useState(true);
    const [quizPrintMode, setQuizPrintMode] = useState('full');  // 'full' | 'text-only'
    const [quizShowDifficulty, setQuizShowDifficulty] = useState(true);
    const [quizImageMaxHeight, setQuizImageMaxHeight] = useState(160); // px
    const [quizImageBgColor, setQuizImageBgColor] = useState('#ffffff');
    // null = todas as questões; Set<number> = índices selecionados
    const [selectedQuizIndexes, setSelectedQuizIndexes] = useState(null);
    const [showQuestionPicker, setShowQuestionPicker] = useState(false);
    // Map<idx, count> — quantas vezes imprimir cada questão (padrão 1)
    const [quizQuestionRepeats, setQuizQuestionRepeats] = useState(new Map());

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

        (activityType === 'hangman') ||
        (activityType === 'trading_cards') ||
        (activityType === 'chat_dracker') ||
        (activityType === 'number_line') ||
        (activityType === 'fractions') ||
        (activityType === 'domino' && dominoData);

    // Reset game mode when content changes
    useEffect(() => {
        setIsGameMode(false);
        setPdfShowAlternatives(false);
        setQuizPrintMode('full');
        setQuizShowDifficulty(true);
        setSelectedQuizIndexes(null);
        setShowQuestionPicker(false);
        setQuizImageMaxHeight(160);
        setQuizImageBgColor('#ffffff');
        setQuizQuestionRepeats(new Map());
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
                                />
                            )}

                            {/* Quiz Toggle */}
                            {activityType === 'quiz' && quizData && (
                                <>
                                    <GameToggleCard
                                        isGameMode={isGameMode}
                                        onToggle={() => setIsGameMode(!isGameMode)}
                                        color="blue"
                                        toggleLabel="Jogar Online"
                                    />

                                    {/* Controles de formatação de impressão – Painel dedicado abaixo do card */}
                                    {!isGameMode && (
                                        <div className="flex flex-col gap-4 p-4 bg-slate-50/90 border border-slate-200/80 rounded-2xl no-print mb-6 shadow-sm">
                                            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/60 pb-3">
                                                <div className="flex items-center gap-2">
                                                    <span className="flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1 rounded-lg shadow-2xs text-slate-800 text-xs font-bold">
                                                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                                                        Configuração da Folha de Questões
                                                    </span>
                                                    <span className="text-xs font-semibold text-slate-500 hidden sm:inline">
                                                        • Personalize o formato e o layout da avaliação
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap items-center justify-between gap-4">
                                                {/* Grupo 1: Modo de Exibição */}
                                                <div className="flex flex-wrap items-center gap-3">
                                                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                                        Layout:
                                                    </span>
                                                    <div className="flex items-center gap-1.5 bg-slate-200/60 p-1 rounded-xl">
                                                        <button
                                                            onClick={() => setQuizPrintMode('full')}
                                                            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                                                                quizPrintMode === 'full'
                                                                    ? 'bg-white text-blue-700 shadow-sm'
                                                                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                                                            }`}
                                                            title="Cards com alternativas A/B/C/D"
                                                        >
                                                            <span>📋</span> Com Alternativas
                                                        </button>
                                                        <button
                                                            onClick={() => setQuizPrintMode('text-only')}
                                                            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                                                                quizPrintMode === 'text-only'
                                                                    ? 'bg-white text-blue-700 shadow-sm'
                                                                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                                                            }`}
                                                            title="Apenas enunciado + linhas para resposta"
                                                        >
                                                            <span>✏️</span> Só Enunciado
                                                        </button>
                                                    </div>

                                                    <label className="flex items-center gap-2 cursor-pointer select-none bg-white border border-slate-200 px-3 py-1.5 rounded-xl hover:bg-slate-50 transition-all shadow-2xs whitespace-nowrap">
                                                        <input
                                                            type="checkbox"
                                                            checked={quizShowDifficulty}
                                                            onChange={e => setQuizShowDifficulty(e.target.checked)}
                                                            className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 accent-blue-600"
                                                        />
                                                        <span className="text-xs font-bold text-slate-700">Mostrar Nível de Dificuldade</span>
                                                    </label>
                                                </div>

                                                {/* Grupo 2: Seleção de Questões */}
                                                <div className="relative ml-auto">
                                                    <button
                                                        onClick={() => setShowQuestionPicker(p => !p)}
                                                        className={`px-4 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-2 shadow-2xs whitespace-nowrap ${
                                                            showQuestionPicker || selectedQuizIndexes
                                                                ? 'bg-blue-600 text-white border-blue-700 hover:bg-blue-700'
                                                                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                                                        }`}
                                                    >
                                                        <span>🗂</span>
                                                        <span>
                                                            Selecionar Questões {selectedQuizIndexes ? `(${selectedQuizIndexes.size}/${quizData.questions.length})` : '(Todas)'}
                                                        </span>
                                                    </button>

                                                    {showQuestionPicker && (
                                                        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-2xl p-3.5 shadow-xl z-50 max-h-80 overflow-y-auto space-y-2.5">
                                                            <div className="flex flex-col gap-2 pb-2.5 border-b border-slate-100">
                                                                <div className="flex items-center justify-between">
                                                                    <label className="flex items-center gap-2 cursor-pointer select-none">
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={selectedQuizIndexes === null || selectedQuizIndexes?.size === quizData.questions.length}
                                                                            onChange={(e) => {
                                                                                if (e.target.checked) {
                                                                                    setSelectedQuizIndexes(null);
                                                                                } else {
                                                                                    setSelectedQuizIndexes(new Set());
                                                                                }
                                                                            }}
                                                                            className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
                                                                        />
                                                                        <span className="text-xs font-bold text-slate-800">Todas as questões ({quizData.questions.length})</span>
                                                                    </label>
                                                                    <button
                                                                        onClick={() => setShowQuestionPicker(false)}
                                                                        className="text-xs font-bold text-slate-400 hover:text-slate-600 px-2 py-0.5 rounded hover:bg-slate-100"
                                                                    >
                                                                        Fechar ✕
                                                                    </button>
                                                                </div>
                                                                <div className="flex items-center gap-2 pt-0.5">
                                                                    <button
                                                                        onClick={() => setSelectedQuizIndexes(null)}
                                                                        className="flex-1 py-1 px-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-lg transition-colors border border-blue-200 text-center shadow-2xs"
                                                                    >
                                                                        ✓ Selecionar todas
                                                                    </button>
                                                                    <button
                                                                        onClick={() => setSelectedQuizIndexes(new Set())}
                                                                        className="flex-1 py-1 px-2.5 bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-700 text-xs font-bold rounded-lg transition-colors border border-slate-200 hover:border-red-200 text-center shadow-2xs"
                                                                    >
                                                                        ✕ Desmarcar todas
                                                                    </button>
                                                                </div>
                                                            </div>
                                                            <div className="space-y-1.5 pt-1">
                                                                {quizData.questions.map((q, idx) => {
                                                                    const checked = selectedQuizIndexes === null || selectedQuizIndexes.has(idx);
                                                                    const repeatCount = quizQuestionRepeats.get(idx) ?? 1;
                                                                    return (
                                                                        <div key={idx} className="flex items-start gap-2 p-1.5 rounded-lg hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                                                                            <input
                                                                                type="checkbox"
                                                                                checked={checked}
                                                                                onChange={() => {
                                                                                    setSelectedQuizIndexes(prev => {
                                                                                        const base = prev === null
                                                                                            ? new Set(quizData.questions.map((_, i) => i))
                                                                                            : new Set(prev);
                                                                                        if (base.has(idx)) base.delete(idx);
                                                                                        else base.add(idx);
                                                                                        return base.size === quizData.questions.length ? null : base;
                                                                                    });
                                                                                }}
                                                                                className="w-3.5 h-3.5 mt-0.5 accent-blue-600 flex-shrink-0 rounded cursor-pointer"
                                                                            />
                                                                            <span className="text-xs text-slate-700 leading-tight flex-1 min-w-0 line-clamp-2">
                                                                                <strong className="text-slate-900 font-bold">{idx + 1}.</strong> {q.statement.replace(/^\d+[.)\]]?\s*/, '').slice(0, 60)}{q.statement.length > 60 ? '…' : ''}
                                                                            </span>
                                                                            <div className="flex items-center gap-1 flex-shrink-0 bg-slate-100 px-1.5 py-0.5 rounded-md border border-slate-200">
                                                                                <button
                                                                                    onClick={() => setQuizQuestionRepeats(prev => {
                                                                                        const next = new Map(prev);
                                                                                        next.set(idx, Math.max(1, (next.get(idx) ?? 1) - 1));
                                                                                        return next;
                                                                                    })}
                                                                                    className="w-4 h-4 rounded bg-white text-slate-700 text-xs font-bold flex items-center justify-center hover:bg-slate-200 leading-none shadow-2xs"
                                                                                    title="Imprimir menos vezes"
                                                                                >−</button>
                                                                                <span className="text-xs font-bold text-slate-800 w-5 text-center">{repeatCount}×</span>
                                                                                <button
                                                                                    onClick={() => setQuizQuestionRepeats(prev => {
                                                                                        const next = new Map(prev);
                                                                                        next.set(idx, Math.min(10, (next.get(idx) ?? 1) + 1));
                                                                                        return next;
                                                                                    })}
                                                                                    className="w-4 h-4 rounded bg-white text-slate-700 text-xs font-bold flex items-center justify-center hover:bg-slate-200 leading-none shadow-2xs"
                                                                                    title="Imprimir mais vezes"
                                                                                >+</button>
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Controles de Imagem (se houver questões com imagem) */}
                                            {quizData.questions.some(q => q.image_url) && (
                                                <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-200/60 bg-white/60 p-3 rounded-xl">
                                                    <div className="flex items-center gap-3 flex-1 min-w-[240px]">
                                                        <span className="text-xs font-bold text-slate-700 whitespace-nowrap">
                                                            📐 Altura das Imagens: <strong className="text-blue-600">{quizImageMaxHeight}px</strong>
                                                        </span>
                                                        <input
                                                            type="range"
                                                            min={60}
                                                            max={400}
                                                            step={10}
                                                            value={quizImageMaxHeight}
                                                            onChange={e => setQuizImageMaxHeight(Number(e.target.value))}
                                                            className="flex-1 accent-blue-600 h-1.5 rounded-lg cursor-pointer"
                                                            title="Redimensionar imagens nas questões"
                                                        />
                                                    </div>

                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="text-xs font-bold text-slate-700 whitespace-nowrap">
                                                            🎨 Fundo das Imagens:
                                                        </span>
                                                        <div className="flex items-center gap-1.5">
                                                            <button
                                                                onClick={() => setQuizImageBgColor('transparent')}
                                                                className={`px-2 py-1 rounded-lg text-xs font-bold border transition-all ${
                                                                    quizImageBgColor === 'transparent'
                                                                        ? 'bg-blue-600 text-white border-blue-700 shadow-2xs'
                                                                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                                                                }`}
                                                                title="Sem fundo (transparente)"
                                                            >
                                                                Nenhum
                                                            </button>
                                                            <input
                                                                type="color"
                                                                value={quizImageBgColor === 'transparent' ? '#ffffff' : quizImageBgColor}
                                                                onChange={e => setQuizImageBgColor(e.target.value)}
                                                                className="w-7 h-7 rounded-lg cursor-pointer border border-slate-300 p-0.5 bg-white shadow-2xs"
                                                                title="Cor personalizada de fundo da imagem"
                                                            />
                                                            {['#ffffff','#000000','#fffde7','#e3f2fd','#f3e5f5'].map(c => (
                                                                <button
                                                                    key={c}
                                                                    onClick={() => setQuizImageBgColor(c)}
                                                                    className={`w-6 h-6 rounded-full border-2 transition-all shadow-2xs ${
                                                                        quizImageBgColor === c ? 'border-blue-600 scale-110' : 'border-slate-300 hover:border-slate-400'
                                                                    }`}
                                                                    style={{ background: c }}
                                                                    title={c}
                                                                />
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </>
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
                                    selectedIndexes={selectedQuizIndexes}
                                    imageMaxHeight={quizImageMaxHeight}
                                    imageBgColor={quizImageBgColor}
                                    questionRepeats={quizQuestionRepeats}
                                />
                            ) : isMusicGame && musicData ? (
                                <MusicGame
                                    musicData={musicData}
                                    onRestart={() => setIsGameMode(true)}
                                    onExitToPrint={() => setIsGameMode(false)}
                                />
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
                            ) : activityType === 'rpg' ? (
                                <DetectiveRPG key={activeTabId || 'new_rpg'} topic={topic} context={lessonDetails} isFullWidth={isFullWidth} />
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
                            ) : activityType === 'chat_dracker' ? (
                                <ChatDracker />
                            ) : activityType === 'trading_cards' ? (
                                <TradingCardMaker />
                            ) : activityType === 'number_line' ? (
                                <NumberLineMaker />
                            ) : activityType === 'fractions' ? (
                                <FractionsMaker />
                            ) : activityType === 'summary' && drackerData ? (
                                <DrackerSummaryRenderer data={drackerData} title={activityTitle} />
                            ) : (
                                /* Default Text Renderer (Quiz Print Mode / Wordsearch Print Mode) */
                                <>
                                    {activityType === 'wordsearch' && (
                                        <div className="flex flex-wrap items-center justify-between gap-3 p-2.5 sm:p-3 bg-slate-50/80 border border-slate-200/70 rounded-xl no-print mb-4">
                                            <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                                                <span className="flex items-center gap-1.5 bg-white border border-slate-200 px-2.5 py-1 rounded-lg shadow-2xs text-slate-700">
                                                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                                                    Painel de Edição
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
                                                <label className="flex items-center gap-1.5 cursor-pointer bg-white border border-slate-200 px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-700 shadow-2xs">
                                                    <input
                                                        type="checkbox"
                                                        checked={wordsearchHideText}
                                                        onChange={(e) => {
                                                            setWordsearchHideText(e.target.checked);
                                                            if (e.target.checked) setWordsearchHideGrid(false);
                                                        }}
                                                        className="w-3.5 h-3.5 rounded text-purple-600 focus:ring-purple-500 accent-purple-600"
                                                    />
                                                    <span>Esconder Texto</span>
                                                </label>
                                                <label className="flex items-center gap-1.5 cursor-pointer bg-white border border-slate-200 px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-700 shadow-2xs">
                                                    <input
                                                        type="checkbox"
                                                        checked={wordsearchHideGrid}
                                                        onChange={(e) => {
                                                            setWordsearchHideGrid(e.target.checked);
                                                            if (e.target.checked) setWordsearchHideText(false);
                                                        }}
                                                        className="w-3.5 h-3.5 rounded text-purple-600 focus:ring-purple-500 accent-purple-600"
                                                    />
                                                    <span>Esconder Grade</span>
                                                </label>
                                            </div>
                                            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap ml-auto">
                                                <Button
                                                    onClick={onEdit}
                                                    variant="secondary"
                                                    className="h-8 text-xs px-3 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-semibold whitespace-nowrap shadow-2xs"
                                                >
                                                    Editar / Adicionar
                                                </Button>
                                                <Button
                                                    onClick={() => setShowAnswers(!showAnswers)}
                                                    variant={showAnswers ? "primary" : "secondary"}
                                                    className={`h-8 text-xs px-3.5 font-semibold whitespace-nowrap shadow-2xs transition-all ${
                                                        showAnswers
                                                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-none'
                                                            : 'bg-white hover:bg-slate-100 border border-slate-300 text-slate-700'
                                                    }`}
                                                >
                                                    {showAnswers ? 'Ocultar Gabarito' : 'Mostrar Gabarito'}
                                                </Button>
                                            </div>
                                        </div>
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
