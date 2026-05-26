
import React from 'react';
import { Download, Copy } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { GameToggleCard } from './GameToggleCard';
import { SunoNativePlayer } from './SunoNativePlayer';

export const MusicActivityRenderer = ({
    musicData,
    printMode,
    isGameMode,
    setIsGameMode,
    pdfShowAlternatives,
    setPdfShowAlternatives,
    handleDirectDownload
}) => {
    if (!musicData) return null;

    return (
        <div className="space-y-6">
            {/* Player Nativo da Playlist */}
            <div className="mb-6 no-print space-y-3">
                <SunoNativePlayer />
                <div className="flex justify-center mt-2">
                    <a
                        href="https://suno.com/@drackermusic"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm font-bold text-purple-600 hover:text-purple-800 transition-colors bg-purple-50 hover:bg-purple-100 px-4 py-2 rounded-full border border-purple-200"
                    >
                        🎧 Ouvir mais músicas no Suno
                    </a>
                </div>
            </div>

            {/* Game Mode / Print Toggle */}
            <GameToggleCard
                title="Jogo de Interpretação Musical"
                description="Responda as perguntas com múltipla escolha!"
                isGameMode={isGameMode}
                onToggle={() => setIsGameMode(!isGameMode)}
                color="green"
            />

            {/* Card 1: Music Lyrics */}
            <div className={printMode === 'questions' ? 'no-print' : ''}>
                <Card id="lyrics-card" className="p-8 relative group border border-brown-100 shadow-sm print:shadow-none print:border-4 print:border-brown-200 print:p-10">
                    <div className="absolute top-0 right-0 p-4 opacity-10 print:opacity-5">
                        <span className="text-6xl print:text-8xl">🎵</span>
                    </div>
                    <div className="flex justify-between items-start border-b border-brown-100 pb-4 mb-6 print:border-b-2 print:border-brown-800 print:mb-8 relative z-10">
                        <div className="flex items-center gap-4 sm:gap-6">
                            <img
                                src="/dracker_character.png"
                                alt="Drácker"
                                className="w-16 h-16 sm:w-20 sm:h-20 object-contain shrink-0 drop-shadow-md"
                            />
                            <div className="flex flex-col">
                                <div className="text-[10px] sm:text-xs font-extrabold tracking-[0.2em] uppercase text-amber-700 mb-1">
                                    Atividade Musical
                                </div>
                                <h2 className="text-2xl sm:text-3xl font-black text-brown-900 leading-tight">
                                    {musicData.title}
                                </h2>
                            </div>
                        </div>
                        <div className="flex flex-col gap-2 shrink-0">
                            <Button
                                onClick={() => handleDirectDownload('lyrics-card', 'Música_Dracker.pdf')}
                                variant="secondary"
                                className="text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200 print:hidden"
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
                                className="text-xs print:hidden"
                                icon={Copy}
                            >
                                Copiar
                            </Button>
                        </div>
                    </div>
                    <div className="font-sans text-brown-800 text-lg leading-relaxed print:font-serif print:text-xl print:leading-loose whitespace-pre-wrap print:block">
                        {musicData.lyrics
                            .replace(/^(Letra da M[uú]sica|T[ií]tulo|M[uú]sica):?.*(\n|$)/im, '')
                            .trim()
                            .split('\n').map((line, idx) => {
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
                    <div className="flex justify-between items-start mb-6 border-b border-brown-100 pb-4 print:border-brown-800 print:mb-8 relative z-10">
                        <div className="flex items-center gap-4 sm:gap-6">
                            <img
                                src="/dracker_character.png"
                                alt="Drácker"
                                className="w-16 h-16 sm:w-20 sm:h-20 object-contain shrink-0 drop-shadow-md"
                            />
                            <div className="flex flex-col">
                                <div className="text-[10px] sm:text-xs font-extrabold tracking-[0.2em] uppercase text-amber-700 mb-1">
                                    Interpretação Musical
                                </div>
                                <h2 className="text-2xl sm:text-3xl font-black text-brown-900 leading-tight">
                                    {musicData.title}
                                </h2>
                            </div>
                        </div>
                        <div className="flex flex-col items-end gap-2 shrink-0 print:hidden no-pdf">
                            <Button
                                onClick={() => handleDirectDownload('questions-card', 'Perguntas_Dracker.pdf')}
                                variant="secondary"
                                className="text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200 w-full justify-center"
                                icon={Download}
                            >
                                Baixar Perguntas
                            </Button>
                            <label className="flex items-center gap-2 cursor-pointer text-[11px] font-bold text-brown-700 select-none bg-brown-50 px-3 py-1.5 rounded-lg border border-brown-200 hover:bg-brown-100 transition-colors w-full justify-center">
                                <input
                                    type="checkbox"
                                    checked={pdfShowAlternatives}
                                    onChange={(e) => setPdfShowAlternatives(e.target.checked)}
                                    className="rounded border-brown-300 text-purple-600 focus:ring-purple-500 w-3.5 h-3.5"
                                />
                                Incluir Alternativas
                            </label>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                        {(musicData.questions || []).map((q, idx) => {
                            const questionText = typeof q === 'string' ? q : (q.text || q.question || `Pergunta ${idx + 1}`);
                            const options = Array.from(new Set(
                                (((typeof q === 'object' && (q.options || q.alternatives)) || [])).map(o => o.trim()).filter(Boolean)
                            ));
                            const LETTERS = ['A', 'B', 'C', 'D', 'E'];

                            return (
                                <div key={idx} className="bg-white border-2 border-amber-200 rounded-xl p-5 shadow-sm break-inside-avoid print:border-brown-400 print:shadow-none flex flex-col">
                                    <div className="flex items-start gap-3 mb-4">
                                        <span className="shrink-0 w-7 h-7 bg-gradient-to-br from-amber-600 to-amber-700 text-white rounded-full flex items-center justify-center font-black text-sm shadow-md print:bg-black print:text-white print:shadow-none">
                                            {idx + 1}
                                        </span>
                                        <p className="text-brown-900 font-bold text-sm sm:text-base print:text-black leading-snug pt-0.5">
                                            {questionText.replace(/^\d+[.)]\s*/, '')}
                                        </p>
                                    </div>

                                    {options.length > 0 && pdfShowAlternatives && (
                                        <div className="space-y-2 mt-auto">
                                            {options.map((opt, i) => (
                                                <div key={i} className="flex items-center gap-3 bg-amber-50/50 border border-amber-100 rounded-lg p-2.5 print:bg-white print:border-brown-200">
                                                    <span className="shrink-0 w-5 h-5 rounded-full border-2 border-amber-300 bg-amber-100 text-amber-800 flex items-center justify-center text-[10px] font-black print:border-brown-500 print:bg-white print:text-black">
                                                        {LETTERS[i]}
                                                    </span>
                                                    <span className="text-brown-700 font-medium text-sm leading-tight print:text-black">{opt}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

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
    );
};
