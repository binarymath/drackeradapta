import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Repeat, Music } from 'lucide-react';
import { Card } from '../ui/Card';

const drackerPlaylist = [
  {
    id: '59f10673-6242-4bc2-b5a6-209b6ab8f228',
    title: 'O Mistério da Área Mágica (Quadrado e Retângulo)',
    subject: 'Geometria',
    audioUrl: 'https://cdn1.suno.ai/59f10673-6242-4bc2-b5a6-209b6ab8f228.mp3',
    imageUrl: 'https://cdn1.suno.ai/image_59f10673-6242-4bc2-b5a6-209b6ab8f228.jpeg'
  },
  {
    id: 'dd4c699f-d069-46ab-be9e-77e63cb5b897',
    title: 'Frações Equivalentes',
    subject: 'Frações',
    audioUrl: 'https://cdn1.suno.ai/dd4c699f-d069-46ab-be9e-77e63cb5b897.mp3',
    imageUrl: 'https://cdn1.suno.ai/image_dd4c699f-d069-46ab-be9e-77e63cb5b897.jpeg'
  },
  {
    id: 'b4076f8b-f978-4a01-bcfb-86f1e8648d87',
    title: 'Festival Music',
    subject: 'Música e Ritmo',
    audioUrl: 'https://cdn1.suno.ai/b4076f8b-f978-4a01-bcfb-86f1e8648d87.mp3',
    imageUrl: 'https://cdn1.suno.ai/image_b4076f8b-f978-4a01-bcfb-86f1e8648d87.jpeg'
  },
  {
    id: 'e86c030b-e12b-4931-a2a1-1d6246caf89a',
    title: 'Operações de Multiplicação e Divisão de Frações',
    subject: 'Matemática na Floresta',
    audioUrl: 'https://cdn1.suno.ai/e86c030b-e12b-4931-a2a1-1d6246caf89a.mp3',
    imageUrl: 'https://cdn1.suno.ai/image_e86c030b-e12b-4931-a2a1-1d6246caf89a.jpeg'
  },
  {
    id: 'f549d52a-d6a2-4ccc-a3d0-f89e73f83daf',
    title: 'O Segredo da Floresta',
    subject: 'Aventura',
    audioUrl: 'https://cdn1.suno.ai/f549d52a-d6a2-4ccc-a3d0-f89e73f83daf.mp3',
    imageUrl: 'https://cdn1.suno.ai/image_f549d52a-d6a2-4ccc-a3d0-f89e73f83daf.jpeg'
  }
];

export const SunoNativePlayer = () => {
    const [currentIdx, setCurrentIdx] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [loopTrackId, setLoopTrackId] = useState(null);
    const audioRef = useRef(null);

    const togglePlay = (idx) => {
        if (currentIdx === idx) {
            if (isPlaying) {
                audioRef.current.pause();
                setIsPlaying(false);
            } else {
                audioRef.current.play();
                setIsPlaying(true);
            }
        } else {
            setCurrentIdx(idx);
            setIsPlaying(true);
        }
    };

    const toggleLoop = (e, id) => {
        e.stopPropagation();
        setLoopTrackId(prev => prev === id ? null : id);
    };

    const nextTrack = () => {
        const currentTrack = drackerPlaylist[currentIdx];
        if (loopTrackId === currentTrack.id) {
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch(e => console.error(e));
        } else {
            setCurrentIdx((prev) => (prev + 1) % drackerPlaylist.length);
            setIsPlaying(true);
        }
    };

    const handleTimeUpdate = () => {
        if (audioRef.current) {
            setProgress(audioRef.current.currentTime);
            setDuration(audioRef.current.duration || 0);
        }
    };

    const formatTime = (time) => {
        if (!time || isNaN(time)) return "0:00";
        const mins = Math.floor(time / 60);
        const secs = Math.floor(time % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleProgressClick = (e) => {
        const bounds = e.currentTarget.getBoundingClientRect();
        const percent = (e.clientX - bounds.left) / bounds.width;
        if (audioRef.current && duration) {
            audioRef.current.currentTime = percent * duration;
            setProgress(percent * duration);
        }
    };

    useEffect(() => {
        if (isPlaying && audioRef.current) {
            audioRef.current.play().catch(e => {
                console.error("Audio play failed:", e);
                setIsPlaying(false);
            });
        }
    }, [currentIdx, isPlaying]);

    const track = drackerPlaylist[currentIdx];

    return (
        <Card className="w-full max-w-2xl mx-auto border-2 border-purple-300 bg-gradient-to-r from-purple-50 to-pink-50 shadow-xl overflow-hidden no-print flex flex-col">
            <audio 
                ref={audioRef} 
                src={track?.audioUrl} 
                onTimeUpdate={handleTimeUpdate}
                onEnded={nextTrack}
            />

            {/* Cabeçalho da Playlist (Light Theme) */}
            <div className="p-5 border-b border-purple-200 flex items-center gap-4 bg-white/50 backdrop-blur-sm">
                <div className="w-12 h-12 rounded-full bg-purple-200 flex items-center justify-center text-purple-600 shadow-inner shrink-0">
                    <Music className="w-6 h-6" />
                </div>
                <div>
                    <h3 className="font-bold text-xl text-purple-900">Rádio Drácker</h3>
                    <p className="text-purple-700 text-xs font-medium">Músicas pedagógicas para a turma</p>
                </div>
            </div>

            {/* Barra de Progresso Global (Para a música atual) */}
            <div className="w-full bg-purple-100/50 px-6 py-3 border-b border-purple-200 flex items-center gap-4">
                <span className="text-xs text-purple-800 font-mono w-10 text-right font-medium">{formatTime(progress)}</span>
                <div 
                    className="flex-1 h-2.5 bg-purple-200/60 rounded-full cursor-pointer hover:h-3.5 transition-all relative overflow-hidden"
                    onClick={handleProgressClick}
                >
                    <div 
                        className="absolute top-0 left-0 h-full bg-purple-600 rounded-full"
                        style={{ width: `${duration ? (progress / duration) * 100 : 0}%` }}
                    ></div>
                </div>
                <span className="text-xs text-purple-800 font-mono w-10 font-medium">{formatTime(duration)}</span>
            </div>

            {/* Lista de Músicas (Light Theme) */}
            <div className="flex-1 overflow-y-auto max-h-[350px] p-3 space-y-2 custom-scrollbar bg-white/40">
                {drackerPlaylist.map((item, idx) => {
                    const isCurrent = currentIdx === idx;
                    const isItemPlaying = isCurrent && isPlaying;
                    const isLoopingThis = loopTrackId === item.id;

                    return (
                        <div 
                            key={item.id}
                            onClick={() => { if (!isCurrent) togglePlay(idx); }}
                            className={`flex items-center gap-4 p-3 rounded-xl transition-all border cursor-pointer ${
                                isCurrent 
                                    ? 'bg-purple-100 border-purple-400 shadow-sm' 
                                    : 'bg-white border-purple-100 hover:border-purple-300 hover:bg-purple-50 hover:shadow-sm'
                            }`}
                        >
                            <button 
                                onClick={(e) => { e.stopPropagation(); togglePlay(idx); }}
                                className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center transition-all ${
                                    isItemPlaying 
                                        ? 'bg-purple-600 text-white shadow-md' 
                                        : 'bg-purple-100 text-purple-600 hover:bg-purple-200 group-hover:scale-105'
                                }`}
                            >
                                {isItemPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-1" />}
                            </button>

                            <div className="flex-1 min-w-0 flex items-center justify-between gap-4">
                                <div>
                                    <h4 className={`font-bold truncate ${isCurrent ? 'text-purple-900' : 'text-brown-900'}`}>
                                        {item.title}
                                    </h4>
                                    <p className="text-xs text-purple-600 truncate mt-0.5">{item.subject}</p>
                                </div>
                                
                                <div className="flex items-center gap-3 shrink-0 mr-2">
                                    {isItemPlaying && (
                                        <div className="flex gap-1 items-end h-4">
                                            <div className="w-1 bg-purple-500 animate-bounce h-full rounded-sm" style={{animationDelay: '0ms'}}></div>
                                            <div className="w-1 bg-pink-500 animate-bounce h-2/3 rounded-sm" style={{animationDelay: '150ms'}}></div>
                                            <div className="w-1 bg-purple-500 animate-bounce h-4/5 rounded-sm" style={{animationDelay: '300ms'}}></div>
                                        </div>
                                    )}
                                    <button
                                        onClick={(e) => toggleLoop(e, item.id)}
                                        className={`p-1.5 rounded-full transition-all ${
                                            isLoopingThis 
                                                ? 'bg-amber-100 text-amber-600 shadow-sm border border-amber-300' 
                                                : 'text-purple-300 hover:text-purple-600 hover:bg-purple-200'
                                        }`}
                                        title={isLoopingThis ? "Repetir desativado" : "Repetir música automaticamente"}
                                    >
                                        <Repeat className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </Card>
    );
};
