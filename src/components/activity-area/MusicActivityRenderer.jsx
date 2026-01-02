
import React from 'react';
import { Download, Copy } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { GameToggleCard } from './GameToggleCard';

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
                        <h2 className="text-xl font-bold text-brown-900 print:text-orange-600 print:text-3xl print:font-serif mb-0">
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
    );
};
