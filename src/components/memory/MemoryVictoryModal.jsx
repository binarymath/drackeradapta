import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Trophy, Clock, Hash, RotateCcw, Medal } from 'lucide-react';

const MemoryVictoryModal = ({ isOpen, onClose, moves, time, topic, onRestart }) => {
    const [playerName, setPlayerName] = useState('');
    const [ranking, setRanking] = useState([]);
    const [activeTab, setActiveTab] = useState('moves'); // 'moves' | 'time'
    const [saved, setSaved] = useState(false);

    // Load LocalRanking on mount
    useEffect(() => {
        if (isOpen) {
            const savedRanking = localStorage.getItem('memory_ranking');
            if (savedRanking) {
                setRanking(JSON.parse(savedRanking));
            }
            setSaved(false);
            setPlayerName('');
        }
    }, [isOpen]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleSaveScore = () => {
        if (!playerName.trim()) return;

        const newScore = {
            id: Date.now(),
            name: playerName,
            moves,
            time,
            topic: topic || 'Livre',
            date: new Date().toISOString()
        };

        const newRanking = [...ranking, newScore];
        setRanking(newRanking);
        localStorage.setItem('memory_ranking', JSON.stringify(newRanking));
        setSaved(true);
    };

    const getSortedRanking = () => {
        return [...ranking].sort((a, b) => {
            if (activeTab === 'moves') {
                if (a.moves !== b.moves) return a.moves - b.moves;
                return a.time - b.time; // tie-breaker
            } else {
                if (a.time !== b.time) return a.time - b.time;
                return a.moves - b.moves; // tie-breaker
            }
        }).slice(0, 10); // Top 10
    };

    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Parabéns! 🎉" className="max-w-md">
            <div className="text-center space-y-6">

                {/* Score Summary */}
                <div className="bg-brown-50 p-6 rounded-xl border border-brown-100 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Trophy size={100} className="text-yellow-600" />
                    </div>

                    <h2 className="text-2xl font-bold text-brown-800 mb-2">Você Venceu!</h2>
                    <p className="text-brown-600 mb-6">Concluiu o jogo "{topic}"</p>

                    <div className="flex justify-center gap-6">
                        <div className="flex flex-col items-center">
                            <div className="bg-white p-3 rounded-full shadow-sm mb-2 text-blue-500">
                                <Clock size={24} />
                            </div>
                            <span className="text-xs text-gray-500 uppercase font-bold">Tempo</span>
                            <span className="text-xl font-bold text-brown-800">{formatTime(time)}</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <div className="bg-white p-3 rounded-full shadow-sm mb-2 text-green-500">
                                <Hash size={24} />
                            </div>
                            <span className="text-xs text-gray-500 uppercase font-bold">Jogadas</span>
                            <span className="text-xl font-bold text-brown-800">{moves}</span>
                        </div>
                    </div>
                </div>

                {/* Save Score */}
                {!saved ? (
                    <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4">
                        <p className="text-sm text-brown-600">Digite seu nome para o ranking:</p>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={playerName}
                                onChange={(e) => setPlayerName(e.target.value)}
                                placeholder="Seu Nome"
                                className="flex-1 border border-brown-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-brown-400 outline-none"
                                onKeyDown={(e) => e.key === 'Enter' && handleSaveScore()}
                                autoFocus
                            />
                            <Button onClick={handleSaveScore} disabled={!playerName.trim()}>
                                Salvar
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="bg-green-50 text-green-700 p-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 animate-in zoom-in">
                        <Medal size={16} /> Pontuação Salva!
                    </div>
                )}

                {/* Ranking Table */}
                <div className="border-t border-brown-100 pt-4">
                    <div className="flex gap-2 mb-4 bg-brown-100/30 p-1 rounded-lg">
                        <button
                            onClick={() => setActiveTab('moves')}
                            className={`flex-1 py-1.5 text-xs font-bold rounded flex items-center justify-center gap-1 transition-all ${activeTab === 'moves' ? 'bg-white shadow text-brown-800' : 'text-brown-500'}`}
                        >
                            <Hash size={12} /> Por Jogadas
                        </button>
                        <button
                            onClick={() => setActiveTab('time')}
                            className={`flex-1 py-1.5 text-xs font-bold rounded flex items-center justify-center gap-1 transition-all ${activeTab === 'time' ? 'bg-white shadow text-brown-800' : 'text-brown-500'}`}
                        >
                            <Clock size={12} /> Por Tempo
                        </button>
                    </div>

                    <div className="bg-white rounded-lg border border-brown-100 overflow-hidden text-sm">
                        <table className="w-full text-left">
                            <thead className="bg-brown-50 text-brown-600 text-xs uppercase">
                                <tr>
                                    <th className="p-2 pl-4">#</th>
                                    <th className="p-2">Nome</th>
                                    <th className="p-2 text-right">
                                        {activeTab === 'moves' ? 'Jogadas' : 'Tempo'}
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {getSortedRanking().map((score, idx) => (
                                    <tr key={score.id} className={`border-b border-brown-50 last:border-0 hover:bg-brown-50/50 ${score.id === ranking[ranking.length - 1]?.id && saved ? 'bg-yellow-50' : ''}`}>
                                        <td className="p-2 pl-4 font-bold text-brown-400">{idx + 1}º</td>
                                        <td className="p-2 font-medium text-brown-800 truncate max-w-[120px]" title={score.topic}>{score.name}</td>
                                        <td className="p-2 text-right font-bold text-brown-600">
                                            {activeTab === 'moves' ? score.moves : formatTime(score.time)}
                                        </td>
                                    </tr>
                                ))}
                                {ranking.length === 0 && (
                                    <tr>
                                        <td colSpan="3" className="p-4 text-center text-gray-400 italic">
                                            Ainda não há pontuações.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <Button variant="secondary" onClick={onRestart} className="w-full">
                    <RotateCcw size={16} className="mr-2" /> Jogar Novamente
                </Button>
            </div>
        </Modal>
    );
};

export default MemoryVictoryModal;
