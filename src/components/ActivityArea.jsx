import React from 'react';
import { Copy, FileText, Download, Sparkles, Check, Pencil, Play, Gamepad2 } from 'lucide-react';
import { QuizGame } from './QuizGame';
import { WordSearchGame } from './WordSearchGame';
import { MusicGame } from './MusicGame';
import RichTextRenderer from './RichTextRenderer';
import { CrosswordActivity } from './CrosswordActivity';

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
    onCrosswordUpdate
}) => {
    const hasContent = generatedContent || (activityType === 'crossword' && crosswordData);
    const [isGameMode, setIsGameMode] = React.useState(false);
    const isWordsearchGame = isGameMode && activityType === 'wordsearch';
    const isCrosswordGame = isGameMode && activityType === 'crossword';
    const isMusicGame = isGameMode && activityType === 'simplify';

    // Reset game mode when content changes
    React.useEffect(() => {
        setIsGameMode(false);
    }, [generatedContent]);

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
                                />                            ) : isMusicGame && musicData ? (
                                <MusicGame
                                    musicData={musicData}
                                    onRestart={() => setIsGameMode(true)}
                                    onExitToPrint={() => setIsGameMode(false)}
                                />                            ) : activityType === 'summary' && drackerData ? (
                                <div className="space-y-6">
                                    <Card className="p-8 relative group overflow-hidden border border-brown-100 shadow-sm">
                                        <div className="absolute top-0 right-0 p-4 opacity-20 pointer-events-none" style={{ filter: 'sepia(100%) saturate(300%) hue-rotate(315deg) brightness(70%)' }}>
                                            <img src="/dracker.png" alt="Drácker" className="w-32 h-32 object-contain opacity-50" />
                                        </div>

                                        {/* HEADER */}
                                        <div className="border-b border-brown-100 pb-4 mb-6 flex justify-between items-start">
                                            <div>
                                                <h2 className="text-2xl font-bold text-brown-900 mb-1">Aprenda com o Drácker</h2>
                                                <p className="text-brown-600 font-medium opacity-75">Uma história interativa para a turma</p>
                                            </div>
                                            <Button
                                                onClick={() => {
                                                    navigator.clipboard.writeText(drackerData.story);
                                                    alert('História copiada!');
                                                }}
                                                variant="secondary"
                                                className="text-xs"
                                                icon={Copy}
                                            >
                                                Copiar Texto
                                            </Button>
                                        </div>

                                        {/* STORY CONTENT */}
                                        <div className="prose prose-lg max-w-none text-brown-900 leading-loose mb-10 font-serif">
                                            {drackerData.story.split('\n\n').map((paragraph, index) => (
                                                <p key={index} className="indent-8 mb-6 text-justify">
                                                    {paragraph.split(/(\*\*.*?\*\*)/g).map((part, i) => {
                                                        if (part.startsWith('**') && part.endsWith('**')) {
                                                            return (
                                                                <strong key={i} className="text-brown-800 font-extrabold">
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
                                        <Card className="bg-white/50 border-2 border-dashed border-brown-200">
                                            <h3 className="text-lg font-bold text-brown-800 mb-6 flex items-center gap-2">
                                                <img src="/dracker.png" alt="Brain" className="w-6 h-6 object-contain" />
                                                Atividades Práticas
                                            </h3>
                                            <ol className="list-decimal list-outside ml-5 space-y-4">
                                                {drackerData.activities.map((act, idx) => (
                                                    <li key={idx} className="text-brown-700 font-medium pl-2">
                                                        {act.split(/(\*\*.*?\*\*)/g).map((part, i) => {
                                                            if (part.startsWith('**') && part.endsWith('**')) {
                                                                return (
                                                                    <strong key={i} className="text-brown-800 font-extrabold">
                                                                        {part.slice(2, -2)}
                                                                    </strong>
                                                                );
                                                            }
                                                            return part;
                                                        })}
                                                    </li>
                                                ))}
                                            </ol>
                                        </Card>
                                    </Card>
                                </div>
                            ) : activityType === 'simplify' && musicData ? (
                                <div className="space-y-6">
                                    {/* Card: Destaque da Playlist */}
                                    <Card className="mb-6 bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-300 no-print shadow-lg">
                                        <div className="p-4 space-y-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-purple-200 flex items-center justify-center text-purple-600 font-bold text-lg">
                                                    🎵
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-purple-900">Playlist Oficial: Músicas do Drácker</h3>
                                                    <p className="text-xs text-purple-700">Acesse todas as músicas criadas com Drácker no Producer.ai</p>
                                                </div>
                                            </div>
                                            <a
                                                href="https://www.producer.ai/professornerd"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="block w-full p-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg text-center transition-colors"
                                            >
                                                🎧 Ouvir Playlist Completa
                                            </a>
                                        </div>
                                    </Card>

                                    {/* Card: Game Mode Toggle */}
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
                                    <Card className="p-6 relative group">
                                        <div className="absolute top-0 right-0 p-2 opacity-10">
                                            <span className="text-6xl">🎵</span>
                                        </div>
                                        <div className="flex justify-between items-center border-b border-brown-100 pb-2 mb-4">
                                            <h2 className="text-xl font-bold text-brown-900">Música do Drácker</h2>
                                            <Button
                                                onClick={() => {
                                                    navigator.clipboard.writeText(musicData.lyrics);
                                                    alert('Letra copiada!');
                                                }}
                                                variant="secondary"
                                                className="text-xs z-10"
                                                icon={Copy}
                                            >
                                                Copiar Letra
                                            </Button>
                                        </div>
                                        <div className="font-sans text-brown-700 text-lg leading-relaxed">
                                            {musicData.lyrics.split('\n').map((line, idx) => {
                                                // Renderiza markdown simples: **texto** → negrito
                                                const parts = line.split(/(\*\*.*?\*\*)/g);
                                                return (
                                                    <div key={idx} className="whitespace-pre-wrap">
                                                        {parts.map((part, i) => {
                                                            if (part.startsWith('**') && part.endsWith('**')) {
                                                                return <strong key={i} className="font-extrabold">{part.slice(2, -2)}</strong>;
                                                            }
                                                            return part;
                                                        })}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </Card>
                                    {/* Card 2: Questions */}
                                    <Card className="p-6 relative">
                                        <div className="absolute top-0 right-0 p-2 opacity-10">
                                            <span className="text-6xl">📝</span>
                                        </div>
                                        <h2 className="text-xl font-bold text-brown-800 mb-4 border-b border-brown-100 pb-2">Perguntas de Interpretação</h2>
                                        <ol className="list-decimal list-inside space-y-4">
                                            {musicData.questions.map((q, idx) => {
                                                const questionText = typeof q === 'string' ? q : (q.text || q.question || `Pergunta ${idx + 1}`);
                                                const options = Array.from(new Set(
                                                    (typeof q === 'object' ? (q.options || q.ordered_options || []) : [])
                                                        .concat(typeof q === 'object' ? (q.distractors || q.incorrect_options || []) : [])
                                                        .concat(typeof q === 'object' ? (q.correctAnswer || q.correct_answer || q.answer || q.correct_option || []) : [])
                                                )).filter(Boolean);

                                                return (
                                                    <li key={idx} className="text-brown-900 font-medium">
                                                        {questionText}
                                                        {options.length > 0 && (
                                                            <div className="mt-2 space-y-2 text-sm text-brown-800 no-print">
                                                                <span className="font-semibold text-brown-900">Alternativas (visíveis só na edição)</span>
                                                                <div className="grid gap-2 sm:grid-cols-2">
                                                                    {options.map((opt, optIdx) => (
                                                                        <div
                                                                            key={optIdx}
                                                                            className="px-3 py-2 rounded-lg border border-brown-100 bg-brown-50"
                                                                        >
                                                                            <span className="font-semibold text-brown-700 mr-2">{String.fromCharCode(65 + optIdx)})</span>
                                                                            <span className="text-brown-800">{opt}</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                        <div className="mt-2 h-8 border-b border-dotted border-brown-300 w-full"></div>
                                                    </li>
                                                );
                                            })}
                                        </ol>
                                    </Card>
                                </div>
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
                        <div className="h-full flex flex-col items-center justify-center text-brown-300">
                            {isLoading ? (
                                <div className="flex flex-col items-center gap-4">
                                    <img src="/dracker.png" alt="Loading" className="w-16 h-16 animate-bounce" />
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
                </div>
            </div >
        </div >
    );
};
