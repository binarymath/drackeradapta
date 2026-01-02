import React, { useState } from 'react';
import { UserPlus, Trophy, Trash2 } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

export const CrosswordStartScreen = ({
    playerName,
    setPlayerName,
    onStart,
    rankings,
    showRanking,
    setShowRanking,
    deleteRankingEntry,
    formatTime
}) => {
    return (
        <Card className="max-w-2xl mx-auto border-2 border-brown-200 shadow-xl overflow-hidden">
            <div className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                        <UserPlus className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-brown-900">Digite seu nome para jogar</h2>
                        <p className="text-sm text-brown-700">Seu nome ficará salvo no ranking local (JSON no navegador).</p>
                    </div>
                </div>

                <input
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    placeholder="Seu nome"
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />

                <Button
                    onClick={onStart}
                    disabled={!playerName.trim()}
                    className="w-full bg-amber-600 hover:bg-amber-700 text-white shadow-lg disabled:opacity-50"
                    icon={UserPlus}
                >
                    Começar Jogo
                </Button>

                <Button
                    onClick={() => setShowRanking(!showRanking)}
                    variant="secondary"
                    className="w-full border-amber-200 text-amber-800 hover:bg-amber-100"
                    icon={Trophy}
                >
                    {showRanking ? 'Esconder Ranking' : 'Mostrar Ranking'}
                </Button>

                {showRanking && rankings.length > 0 && (
                    <div className="mt-4 p-4 rounded-lg bg-amber-50 border border-amber-200">
                        <div className="flex items-center gap-2 mb-2">
                            <Trophy className="w-4 h-4 text-amber-600" />
                            <span className="text-sm font-semibold text-amber-800">Ranking Local</span>
                        </div>
                        <div className="space-y-1 text-sm text-amber-900">
                            {rankings.map((r, idx) => (
                                <div key={idx} className="flex justify-between items-center">
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
                    </div>
                )}
            </div>
        </Card>
    );
};
