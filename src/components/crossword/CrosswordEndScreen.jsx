import React from 'react';
import { Trophy, RefreshCw, Trash2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

export const CrosswordEndScreen = ({
    lastRunTimeMs,
    formatTime,
    showRanking,
    setShowRanking,
    onRestart,
    rankings,
    playerName,
    deleteRankingEntry
}) => {
    return (
        <div className="flex flex-col items-center justify-center p-8 space-y-6 animate-fade-in max-w-2xl mx-auto">
            <div className="w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center mb-4 border-4 border-yellow-300 shadow-lg">
                <Trophy className="w-12 h-12 text-yellow-600" />
            </div>
            <h2 className="text-3xl font-bold text-brown-900">Palavras Cruzadas Completas!</h2>
            {Number.isFinite(lastRunTimeMs) && (
                <p className="text-sm text-brown-600">Tempo: {formatTime(lastRunTimeMs)}</p>
            )}

            <div className="flex gap-3">
                <Button onClick={() => setShowRanking(!showRanking)} variant="secondary" className="border-amber-200 text-amber-800 hover:bg-amber-100" icon={Trophy}>
                    {showRanking ? 'Esconder Ranking' : 'Ver Ranking'}
                </Button>
                <Button onClick={onRestart} icon={RefreshCw} className="bg-brown-600 hover:bg-brown-700 text-white px-8 py-3 text-lg rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all">
                    Jogar Novamente
                </Button>
            </div>

            {showRanking && rankings.length > 0 && (
                <Card className="w-full bg-white border border-amber-200 p-4 text-sm text-brown-800">
                    <div className="flex items-center gap-2 mb-2 font-semibold text-amber-800">
                        <Trophy className="w-4 h-4" /> Ranking Local
                    </div>
                    <div className="space-y-1">
                        {rankings.map((r, idx) => (
                            <div key={idx} className={`flex justify-between items-center ${r.name === (playerName?.trim() || 'Jogador') ? 'font-bold text-green-700' : ''}`}>
                                <span>{idx + 1}. {r.name}</span>
                                <div className="flex items-center gap-2">
                                    <span>{r.words} palavras • {formatTime(r.timeMs)}</span>
                                    <button
                                        onClick={() => deleteRankingEntry(idx)}
                                        className="p-1 text-amber-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                        title="Deletar participante"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            )}
        </div>
    );
};
