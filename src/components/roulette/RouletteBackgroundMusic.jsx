import React, { useState, useRef, useEffect } from 'react';
import { Music, Play, Pause, Trash2, Volume2, Link as LinkIcon, Upload, X, Clock, GripVertical, Check, Edit2, Save, SkipBack, SkipForward } from 'lucide-react';

// Helper for ISO8601 to Seconds (PT1M30S -> 90)
const parseISO8601Duration = (duration) => {
    const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    const hours = (parseInt(match[1]) || 0);
    const minutes = (parseInt(match[2]) || 0);
    const seconds = (parseInt(match[3]) || 0);
    return hours * 3600 + minutes * 60 + seconds;
};

// Formatter mm:ss
const formatDuration = (sec) => {
    if (!sec || isNaN(sec)) return '--:--';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
};

export const RouletteBackgroundMusic = ({ className = "", isExploded = false, onSyncRequest = null, timerIsRunning = null, restartTrackTrigger = 0 }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [playlist, setPlaylist] = useState(() => {
        try {
            const saved = localStorage.getItem('roulette_playlist');
            if (saved) {
                return JSON.parse(saved);
            }
        } catch(e) {}
        return [];
    });
    
    const [editingTrackId, setEditingTrackId] = useState(null);
    const [editName, setEditName] = useState('');
    const [editUrl, setEditUrl] = useState('');
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [volume, setVolume] = useState(0.4);
    
    // Config: Mode A (Sync) vs Mode B (Independent)
    const [syncWithMusic, setSyncWithMusic] = useState(false);
    const [ytPlayerReady, setYtPlayerReady] = useState(false);
    
    const [ytInput, setYtInput] = useState('');
    const [isLoadingUrl, setIsLoadingUrl] = useState(false);
    const fileInputRef = useRef(null);
    const audioRef = useRef(null);
    const ytPlayerRef = useRef(null);
    const menuRef = useRef(null);

    // Current track
    const currentTrack = playlist[currentIndex] || null;

    // Save to localStorage whenever playlist changes
    useEffect(() => {
        try {
            const toSave = playlist.filter(t => t.type === 'youtube').map(t => ({
                id: t.id,
                type: t.type,
                url: t.url,
                name: t.name,
                duration: t.duration
            }));
            localStorage.setItem('roulette_playlist', JSON.stringify(toSave));
        } catch(e) {}
    }, [playlist]);

    // YT API Script loader
    useEffect(() => {
        if (!window.YT) {
            const tag = document.createElement('script');
            tag.src = "https://www.youtube.com/iframe_api";
            const firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
            window.onYouTubeIframeAPIReady = () => {
                setYtPlayerReady(true);
            };
        } else {
            setYtPlayerReady(true);
        }
    }, []);

    // Outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        if (isOpen) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    // Handle Local Audio fading
    useEffect(() => {
        if (audioRef.current && currentTrack?.type === 'local') {
            const targetVolume = isExploded ? Math.min(volume, 0.1) : volume;
            let currentVol = audioRef.current.volume;
            const step = 0.05;
            const fadeInterval = setInterval(() => {
                if (Math.abs(currentVol - targetVolume) < step) {
                    audioRef.current.volume = targetVolume;
                    clearInterval(fadeInterval);
                } else {
                    currentVol += currentVol < targetVolume ? step : -step;
                    audioRef.current.volume = Math.max(0, Math.min(1, currentVol));
                }
            }, 50);
            return () => clearInterval(fadeInterval);
        }
    }, [volume, currentTrack, isExploded]);

    // Play/Pause toggler
    const togglePlay = () => {
        if (syncWithMusic && onSyncRequest) {
            // Em modo sincronizado, o relógio da bomba é o mestre do Play/Pause.
            onSyncRequest({ action: 'togglePlay' });
            return;
        }

        const nextState = !isPlaying;
        setIsPlaying(nextState);
        
        if (currentTrack?.type === 'local' && audioRef.current) {
            if (nextState) audioRef.current.play();
            else audioRef.current.pause();
        }
        
        if (currentTrack?.type === 'youtube' && ytPlayerRef.current && typeof ytPlayerRef.current.playVideo === 'function') {
            if (nextState) ytPlayerRef.current.playVideo();
            else ytPlayerRef.current.pauseVideo();
        }
    };

    // External Timer Sync (Bomb -> Music)
    useEffect(() => {
        if (syncWithMusic && timerIsRunning !== null && timerIsRunning !== isPlaying) {
            setIsPlaying(timerIsRunning);
            if (currentTrack?.type === 'local' && audioRef.current) {
                if (timerIsRunning) audioRef.current.play().catch(e => console.log(e));
                else audioRef.current.pause();
            }
            if (currentTrack?.type === 'youtube' && ytPlayerRef.current && typeof ytPlayerRef.current.playVideo === 'function') {
                if (timerIsRunning) ytPlayerRef.current.playVideo();
                else ytPlayerRef.current.pauseVideo();
            }
        }
    }, [syncWithMusic, timerIsRunning]); // Remove isPlaying so it doesn't fight

    // Auto-advance
    const nextTrack = () => {
        if (currentIndex < playlist.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setIsPlaying(true);
        } else {
            // End of playlist
            setIsPlaying(false);
        }
    };

    const prevTrack = () => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
            setIsPlaying(true);
        } else {
            // First track
            setCurrentIndex(0);
        }
    };

    // Track Restart (When Bomb is restarted after explosion)
    useEffect(() => {
        if (restartTrackTrigger > 0 && currentTrack) {
            if (currentTrack.type === 'local' && audioRef.current) {
                audioRef.current.currentTime = 0;
                audioRef.current.play().catch(e => console.log(e));
                setIsPlaying(true);
            }
            if (currentTrack.type === 'youtube' && ytPlayerRef.current && typeof ytPlayerRef.current.seekTo === 'function') {
                ytPlayerRef.current.seekTo(0);
                ytPlayerRef.current.playVideo();
                setIsPlaying(true);
            }
        }
    }, [restartTrackTrigger, currentTrack]);

    // YT Player Initialization
    useEffect(() => {
        let player = null;
        if (currentTrack?.type === 'youtube' && ytPlayerReady) {
            player = new window.YT.Player(`yt-player-${currentTrack.id}`, {
                height: '0',
                width: '0',
                videoId: currentTrack.url,
                playerVars: {
                    autoplay: isPlaying ? 1 : 0,
                    controls: 0,
                },
                events: {
                    onReady: (event) => {
                        const dur = event.target.getDuration();
                        if (dur > 0) {
                            setPlaylist(prev => prev.map(t => 
                                t.id === currentTrack.id ? { ...t, duration: Math.floor(dur) } : t
                            ));
                        }
                    },
                    onStateChange: (event) => {
                        if (event.data === window.YT.PlayerState.ENDED) {
                            nextTrack();
                        }
                    }
                }
            });
            ytPlayerRef.current = player;
        }

        return () => {
            if (player && typeof player.destroy === 'function') {
                player.destroy();
                ytPlayerRef.current = null;
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentTrack?.id, ytPlayerReady]);

    // Sync trigger (When toggled ON or track changes)
    useEffect(() => {
        if (syncWithMusic && currentTrack && onSyncRequest && !isExploded) {
            if (currentTrack.duration > 0) {
                onSyncRequest({
                    action: 'sync_on',
                    duration: currentTrack.duration,
                    isPlaying: isPlaying
                });
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [syncWithMusic, currentTrack?.id, currentTrack?.duration, isExploded]); // Only when track changes or sync is toggled

    // Add Local File
    const handleFileUpload = (e) => {
        if (playlist.length >= 10) {
            alert('A playlist atingiu o limite de 10 músicas.');
            return;
        }
        const file = e.target.files[0];
        if (!file) return;

        const objectUrl = URL.createObjectURL(file);
        
        // Extrair duração via audio fantasma
        const tempAudio = new Audio(objectUrl);
        tempAudio.onloadedmetadata = () => {
            const newTrack = {
                id: Date.now().toString(),
                type: 'local',
                url: objectUrl,
                name: file.name,
                duration: Math.floor(tempAudio.duration)
            };
            setPlaylist(prev => [...prev, newTrack]);
            if (playlist.length === 0) setIsPlaying(true);
        };
    };

    // Add YT File
    const handleYoutubeSubmit = async (e) => {
        e.preventDefault();
        if (!ytInput.trim() || playlist.length >= 10) return;

        const extractVideoID = (url) => {
            const match = url.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/);
            return (match && match[2].length === 11) ? match[2] : null;
        };

        const videoId = extractVideoID(ytInput);
        if (!videoId) {
            alert('Link inválido.');
            return;
        }

        setIsLoadingUrl(true);
        // Para YouTube sem API Key, a duração começa em 0 e será atualizada pelo YT.Player onReady
        let trackDuration = 0;
        let trackTitle = `YouTube Track`;

        try {
            const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY;
            if (apiKey) {
                const res = await fetch(`https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=snippet,contentDetails&key=${apiKey}`);
                const data = await res.json();
                if (data.items && data.items.length > 0) {
                    trackDuration = parseISO8601Duration(data.items[0].contentDetails.duration);
                    trackTitle = data.items[0].snippet.title;
                }
            }
        } catch (err) {
            console.error('Failed to fetch YT metadata', err);
        }

        const newTrack = {
            id: Date.now().toString(),
            type: 'youtube',
            url: videoId,
            name: trackTitle,
            duration: trackDuration
        };

        setPlaylist(prev => [...prev, newTrack]);
        if (playlist.length === 0) setIsPlaying(true);
        setYtInput('');
        setIsLoadingUrl(false);
    };

    const removeTrack = (index) => {
        setPlaylist(prev => {
            const next = [...prev];
            next.splice(index, 1);
            return next;
        });
        if (index === currentIndex) {
            setIsPlaying(false);
            if (index < playlist.length - 1) {
                setIsPlaying(true);
            } else if (index > 0) {
                setCurrentIndex(index - 1);
                setIsPlaying(true);
            } else {
                setCurrentIndex(0);
            }
        } else if (index < currentIndex) {
            setCurrentIndex(prev => prev - 1);
        }
    };

    const startEditTrack = (track) => {
        setEditingTrackId(track.id);
        setEditName(track.name);
        setEditUrl(track.url); // For youtube it's the videoId, but we could just show the URL
    };

    const cancelEditTrack = () => {
        setEditingTrackId(null);
        setEditName('');
        setEditUrl('');
    };

    const saveEditTrack = (id) => {
        const track = playlist.find(t => t.id === id);
        if (!track) return;

        let finalUrl = editUrl;
        let finalDuration = track.duration;

        // Extract ID if user pasted full URL
        if (track.type === 'youtube' && editUrl.includes('youtu')) {
            const match = editUrl.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/);
            if (match && match[2].length === 11) {
                finalUrl = match[2];
            }
        }

        // Se a url mudou, forçar reset da duração pra 0 pro ytPlayer puxar de novo
        if (track.type === 'youtube' && finalUrl !== track.url) {
            finalDuration = 0;
        }

        setPlaylist(prev => prev.map(t => 
            t.id === id ? { ...t, name: editName || t.name, url: finalUrl, duration: finalDuration } : t
        ));
        
        cancelEditTrack();
    };

    return (
        <div className={`relative ${className}`} ref={menuRef}>
            {/* The Invisible Players */}
            {currentTrack?.type === 'local' && (
                <audio 
                    ref={audioRef} 
                    src={currentTrack.url} 
                    autoPlay={isPlaying}
                    onEnded={nextTrack}
                    className="hidden" 
                />
            )}
            
            {currentTrack?.type === 'youtube' && (
                <div id={`yt-player-${currentTrack.id}`} className="hidden"></div>
            )}

            {/* Listener for YouTube iframe state changes via postMessage would go here if needed, 
                but due to CORS and iframe sandboxing, catching 'onEnded' via iframe postMessage without
                the full YT script wrapper is tricky. For MVP, YT videos might not auto-advance flawlessly 
                unless we wrap it in a proper YT.Player instance. */}

            {/* Toggle Button */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`p-1.5 rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 ${
                    currentTrack 
                        ? 'border-indigo-500 bg-indigo-500/20 text-indigo-300 shadow-[0_0_10px_rgba(99,102,241,0.4)]' 
                        : 'border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white'
                }`}
                title="Playlist de Fundo"
            >
                <Music className={`w-3.5 h-3.5 ${currentTrack && isPlaying ? 'animate-pulse' : ''}`} />
                {currentTrack && (
                    <span className="text-[10px] font-bold max-w-[60px] truncate hidden sm:inline-block">
                        {currentTrack.name}
                    </span>
                )}
            </button>

            {/* Popover Menu */}
            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl z-[100] animate-in slide-in-from-top-2 fade-in duration-200 overflow-hidden flex flex-col max-h-[70vh]">
                    <div className="flex items-center justify-between p-4 border-b border-slate-800 shrink-0 bg-slate-900/95 sticky top-0 z-10">
                        <h4 className="text-sm font-black text-white flex items-center gap-2">
                            <Music className="w-4 h-4 text-indigo-400" /> Playlist
                        </h4>
                        <button onClick={() => setIsOpen(false)} className="text-slate-500 hover:text-white transition-colors">
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="p-4 overflow-y-auto custom-scrollbar flex-1 space-y-4">
                        {/* Settings / Sync */}
                        {playlist.length > 0 && (
                            <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700 flex items-start gap-3">
                                <div className="flex-1">
                                    <h5 className="text-xs font-bold text-white mb-1">Sincronizar com Cronômetro</h5>
                                    <p className="text-[10px] text-slate-400 leading-tight">
                                        {syncWithMusic ? 'A bomba explodirá exatamente quando a música atual acabar.' : 'A música tocará livremente no fundo.'}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setSyncWithMusic(!syncWithMusic)}
                                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                        syncWithMusic ? 'bg-indigo-500' : 'bg-slate-700'
                                    }`}
                                >
                                    <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                        syncWithMusic ? 'translate-x-4' : 'translate-x-0'
                                    }`} />
                                </button>
                            </div>
                        )}

                        {/* Current Player Controls (if any) */}
                        {currentTrack && (
                            <div className="bg-gradient-to-br from-indigo-900/40 to-slate-800 p-3 rounded-xl border border-indigo-500/30">
                                <p className="text-xs font-bold text-indigo-200 truncate mb-1" title={currentTrack.name}>
                                    {currentTrack.name}
                                </p>
                                <p className="text-[10px] text-slate-400 mb-3 font-mono">
                                    {formatDuration(currentTrack.duration)} • {currentTrack.type === 'youtube' ? 'YouTube' : 'Computador'}
                                </p>
                                
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-2">
                                        <button 
                                            onClick={prevTrack} 
                                            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-indigo-300 hover:text-white transition-colors shrink-0"
                                            title="Voltar faixa"
                                        >
                                            <SkipBack className="w-4 h-4" />
                                        </button>
                                        <button 
                                            onClick={togglePlay}
                                            className="w-10 h-10 rounded-full bg-indigo-600 hover:bg-indigo-500 flex items-center justify-center text-white transition-colors shadow-lg shrink-0"
                                        >
                                            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-1" />}
                                        </button>
                                        <button 
                                            onClick={nextTrack} 
                                            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-indigo-300 hover:text-white transition-colors shrink-0"
                                            title="Próxima faixa"
                                        >
                                            <SkipForward className="w-4 h-4" />
                                        </button>
                                    </div>

                                    {currentTrack.type === 'local' && (
                                        <div className="flex-1 flex items-center gap-2">
                                            <Volume2 className="w-3.5 h-3.5 text-slate-400" />
                                            <input 
                                                type="range" min="0" max="1" step="0.05" value={volume}
                                                onChange={(e) => setVolume(parseFloat(e.target.value))}
                                                className="w-full accent-indigo-500 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Playlist Area */}
                        {playlist.length > 0 && (
                            <div className="space-y-2">
                                <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-1">Fila ({playlist.length}/10)</h5>
                                <div className="space-y-1.5">
                                    {playlist.map((track, idx) => (
                                        <div 
                                            key={track.id} 
                                            className={`flex items-center gap-2 p-2 rounded-lg border ${
                                                idx === currentIndex ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-slate-800 border-slate-700/50'
                                            }`}
                                        >
                                            <button 
                                                onClick={() => { setCurrentIndex(idx); setIsPlaying(true); }}
                                                className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                                                    idx === currentIndex ? 'bg-indigo-500 text-white' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                                                }`}
                                            >
                                                {idx === currentIndex && isPlaying ? <Music className="w-3 h-3" /> : <Play className="w-3 h-3 ml-0.5" />}
                                            </button>
                                            
                                            {editingTrackId === track.id ? (
                                                <div className="flex-1 min-w-0 flex flex-col gap-1.5 py-1">
                                                    <input 
                                                        type="text" 
                                                        value={editName}
                                                        onChange={e => setEditName(e.target.value)}
                                                        placeholder="Nome da música"
                                                        className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                                                    />
                                                    {track.type === 'youtube' && (
                                                        <input 
                                                            type="text" 
                                                            value={editUrl}
                                                            onChange={e => setEditUrl(e.target.value)}
                                                            placeholder="Link do YouTube"
                                                            className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                                                        />
                                                    )}
                                                    <div className="flex justify-end gap-2 mt-1">
                                                        <button onClick={cancelEditTrack} className="text-[10px] text-slate-500 hover:text-white px-2 py-1 border border-slate-700 rounded transition-colors">Cancelar</button>
                                                        <button onClick={() => saveEditTrack(track.id)} className="bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1 text-[10px] font-bold px-3 py-1 rounded transition-colors">
                                                            <Save className="w-3 h-3" /> Salvar
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="flex-1 min-w-0 flex flex-col">
                                                        <span className={`text-xs truncate ${idx === currentIndex ? 'text-indigo-200 font-bold' : 'text-slate-300'}`}>
                                                            {track.name}
                                                        </span>
                                                        <span className="text-[9px] text-slate-500 font-mono">{formatDuration(track.duration)}</span>
                                                    </div>

                                                    <button 
                                                        onClick={() => startEditTrack(track)}
                                                        className="p-1.5 text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10 rounded transition-colors"
                                                        title="Editar Faixa"
                                                    >
                                                        <Edit2 className="w-3.5 h-3.5" />
                                                    </button>

                                                    <button 
                                                        onClick={() => removeTrack(idx)}
                                                        className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors"
                                                        title="Remover"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Add Media Area */}
                        {playlist.length < 10 && (
                            <div className="pt-2 border-t border-slate-800 space-y-3">
                                <form onSubmit={handleYoutubeSubmit} className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block px-1">Adicionar do YouTube</label>
                                    <div className="flex gap-2">
                                        <input 
                                            type="text" 
                                            value={ytInput}
                                            onChange={(e) => setYtInput(e.target.value)}
                                            placeholder="Link do vídeo..."
                                            disabled={isLoadingUrl}
                                            className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
                                        />
                                        <button 
                                            type="submit"
                                            disabled={isLoadingUrl}
                                            className="bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors border border-slate-700 disabled:opacity-50"
                                        >
                                            {isLoadingUrl ? '...' : <Play className="w-3 h-3" />}
                                        </button>
                                    </div>
                                </form>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block px-1">Ou Arquivo de Áudio</label>
                                    <button 
                                        onClick={() => fileInputRef.current?.click()}
                                        className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-300 font-medium transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Upload className="w-3.5 h-3.5 text-slate-400" />
                                        Procurar no PC (.mp3)
                                    </button>
                                    <input type="file" accept="audio/*" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
