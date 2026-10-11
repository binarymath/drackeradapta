import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
    Music, Play, Pause, Trash2, Volume2, Link as LinkIcon, Upload, X, Clock, 
    GripVertical, Check, Edit2, Save, SkipBack, SkipForward, Sparkles, Youtube, CheckCircle2 
} from 'lucide-react';
import { formatMediaTime } from '../../utils/time';
import { toast } from '../ui/Toast';

// Duração de faixa: inválida => "--:--"
const formatDuration = (sec) => formatMediaTime(sec, '--:--');

// Helper for ISO8601 to Seconds (PT1M30S -> 90)
const parseISO8601Duration = (duration) => {
    const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    const hours = (parseInt(match[1]) || 0);
    const minutes = (parseInt(match[2]) || 0);
    const seconds = (parseInt(match[3]) || 0);
    return hours * 3600 + minutes * 60 + seconds;
};

export const RouletteBackgroundMusic = ({ 
    className = "", 
    isExploded = false, 
    onSyncRequest = null, 
    timerIsRunning = null, 
    restartTrackTrigger = 0,
    seekTarget = null,
    isDragging = false
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [portalNode, setPortalNode] = useState(null);

    // Setup do Portal Node para renderizar na tela cheia ou no body
    useEffect(() => {
        if (typeof document !== 'undefined') {
            const updatePortalNode = () => {
                const fsElement = document.fullscreenElement || 
                                  document.webkitFullscreenElement || 
                                  document.mozFullScreenElement || 
                                  document.msFullscreenElement;
                const usableFs = fsElement && fsElement !== document.documentElement ? fsElement : null;
                setPortalNode(usableFs || document.body);
            };
            updatePortalNode();
            const events = ['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange', 'MSFullscreenChange'];
            events.forEach(event => document.addEventListener(event, updatePortalNode));
            return () => {
                events.forEach(event => document.removeEventListener(event, updatePortalNode));
            };
        }
    }, []);

    // Fechar com ESC
    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') setIsOpen(false);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen]);

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
    const [syncWithMusic, setSyncWithMusic] = useState(() => {
        try {
            const saved = localStorage.getItem('roulette_music_sync');
            return saved !== null ? JSON.parse(saved) : true;
        } catch (e) {
            return true;
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem('roulette_music_sync', JSON.stringify(syncWithMusic));
        } catch (e) {}
    }, [syncWithMusic]);

    const [ytPlayerReady, setYtPlayerReady] = useState(false);
    const [ytInput, setYtInput] = useState('');
    const [isLoadingUrl, setIsLoadingUrl] = useState(false);
    const fileInputRef = useRef(null);
    const audioRef = useRef(null);
    const ytPlayerRef = useRef(null);

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

    // Handle Local Audio fading & Parar imediatamente quando a bomba explodir
    useEffect(() => {
        if (isExploded) {
            setIsPlaying(false);
            if (audioRef.current) {
                audioRef.current.pause();
            }
            if (ytPlayerRef.current && typeof ytPlayerRef.current.pauseVideo === 'function') {
                ytPlayerRef.current.pauseVideo();
            }
            return;
        }

        if (audioRef.current && currentTrack?.type === 'local') {
            let currentVol = audioRef.current.volume;
            const targetVolume = volume;
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
            onSyncRequest({ action: 'togglePlay' });
            return;
        }

        if (!currentTrack) return;
        setIsPlaying(!isPlaying);
        if (currentTrack.type === 'local' && audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play().catch(e => console.log(e));
            }
        }
        if (currentTrack.type === 'youtube' && ytPlayerRef.current && typeof ytPlayerRef.current.playVideo === 'function') {
            if (isPlaying) {
                ytPlayerRef.current.pauseVideo();
            } else {
                ytPlayerRef.current.playVideo();
            }
        }
    };

    // Global timer state changes
    useEffect(() => {
        if (timerIsRunning !== null && syncWithMusic && !isExploded) {
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
    }, [timerIsRunning, syncWithMusic, currentTrack, isExploded]);

    const handleTrackEnded = () => {
        if (playlist.length > 0) {
            const nextIdx = (currentIndex + 1) % playlist.length;
            setCurrentIndex(nextIdx);
            setIsPlaying(true);
            const nextTrack = playlist[nextIdx];
            if (syncWithMusic && onSyncRequest && !isExploded && nextTrack && nextTrack.duration > 0) {
                onSyncRequest({
                    action: 'sync_on',
                    duration: nextTrack.duration,
                    isPlaying: true
                });
            }
        }
    };

    const nextTrack = () => {
        if (playlist.length > 0) {
            const nextIdx = (currentIndex + 1) % playlist.length;
            setCurrentIndex(nextIdx);
            setIsPlaying(true);
            const nTrack = playlist[nextIdx];
            if (syncWithMusic && onSyncRequest && !isExploded && nTrack && nTrack.duration > 0) {
                onSyncRequest({
                    action: 'sync_on',
                    duration: nTrack.duration,
                    isPlaying: true
                });
            }
        }
    };

    const prevTrack = () => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
            setIsPlaying(true);
        } else {
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

    // Seek da música para a posição exata quando o slider da bomba é movido
    useEffect(() => {
        if (seekTarget && syncWithMusic && currentTrack && !isExploded) {
            const targetTime = Math.max(0, seekTarget.time);
            if (currentTrack.type === 'local' && audioRef.current) {
                try {
                    const maxDur = audioRef.current.duration || targetTime;
                    audioRef.current.currentTime = Math.min(maxDur, targetTime);
                } catch (e) {}
            }
            if (currentTrack.type === 'youtube' && ytPlayerRef.current && typeof ytPlayerRef.current.seekTo === 'function') {
                try {
                    ytPlayerRef.current.seekTo(targetTime, true);
                } catch (e) {}
            }
        }
    }, [seekTarget]);

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
                            if (syncWithMusic && onSyncRequest && !isExploded) {
                                onSyncRequest({
                                    action: 'sync_on',
                                    duration: Math.floor(dur),
                                    isPlaying: isPlaying
                                });
                            }
                        }
                    },
                    onStateChange: (event) => {
                        if (event.data === window.YT.PlayerState.ENDED) {
                            handleTrackEnded();
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

    // Checagem contínua para YouTube quando a música chega ao final e envio de sync_time
    useEffect(() => {
        let ytInterval = null;
        if (syncWithMusic && isPlaying && currentTrack?.type === 'youtube' && !isExploded) {
            ytInterval = setInterval(() => {
                if (ytPlayerRef.current && typeof ytPlayerRef.current.getCurrentTime === 'function' && typeof ytPlayerRef.current.getDuration === 'function') {
                    const dur = ytPlayerRef.current.getDuration();
                    const curr = ytPlayerRef.current.getCurrentTime();
                    if (dur > 0) {
                        const remaining = Math.max(0, Math.ceil(dur - curr));
                        if (curr >= dur - 0.5 || remaining <= 0) {
                            handleTrackEnded();
                        } else if (!isDragging && onSyncRequest) {
                            onSyncRequest({
                                action: 'sync_time',
                                remaining: remaining
                            });
                        }
                    }
                }
            }, 500);
        }
        return () => {
            if (ytInterval) clearInterval(ytInterval);
        };
    }, [syncWithMusic, isPlaying, currentTrack?.id, isExploded, isDragging]);

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
    }, [syncWithMusic, currentTrack?.id, currentTrack?.duration, isExploded]);

    // Add Local File
    const handleFileUpload = (e) => {
        if (playlist.length >= 10) {
            toast('A playlist atingiu o limite de 10 músicas.');
            return;
        }
        const file = e.target.files[0];
        if (!file) return;

        const objectUrl = URL.createObjectURL(file);
        
        const tempAudio = new Audio(objectUrl);
        tempAudio.onloadedmetadata = () => {
            const newTrack = {
                id: Date.now().toString(),
                type: 'local',
                url: objectUrl,
                name: file.name.replace(/\.[^/.]+$/, ''),
                duration: Math.floor(tempAudio.duration)
            };
            setPlaylist(prev => [...prev, newTrack]);
            if (playlist.length === 0) setIsPlaying(true);
            toast('Música local adicionada à playlist!');
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
            toast('Link do YouTube inválido.');
            return;
        }

        setIsLoadingUrl(true);
        let trackDuration = 0;
        let trackTitle = `YouTube Track (${videoId})`;

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
        toast('Música do YouTube adicionada com sucesso!');
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
        setEditUrl(track.url);
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

        if (track.type === 'youtube' && editUrl.includes('youtu')) {
            const match = editUrl.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/);
            if (match && match[2].length === 11) {
                finalUrl = match[2];
            }
        }

        if (track.type === 'youtube' && finalUrl !== track.url) {
            finalDuration = 0;
        }

        setPlaylist(prev => prev.map(t => 
            t.id === id ? { ...t, name: editName || t.name, url: finalUrl, duration: finalDuration } : t
        ));
        
        cancelEditTrack();
        toast('Faixa atualizada com sucesso!');
    };

    return (
        <div className={`inline-flex items-center ${className}`}>
            {/* The Invisible Players */}
            {currentTrack?.type === 'local' && (
                <audio 
                    ref={audioRef} 
                    src={currentTrack.url} 
                    autoPlay={isPlaying}
                    onEnded={handleTrackEnded}
                    onLoadedMetadata={(e) => {
                        const dur = Math.floor(e.target.duration);
                        if (dur > 0 && (!currentTrack.duration || currentTrack.duration !== dur)) {
                            setPlaylist(prev => prev.map(t => 
                                t.id === currentTrack.id ? { ...t, duration: dur } : t
                            ));
                            if (syncWithMusic && onSyncRequest && !isExploded) {
                                onSyncRequest({
                                    action: 'sync_on',
                                    duration: dur,
                                    isPlaying: isPlaying
                                });
                            }
                        }
                    }}
                    onTimeUpdate={() => {
                        if (audioRef.current && syncWithMusic && !isExploded && isPlaying) {
                            const dur = audioRef.current.duration;
                            const curr = audioRef.current.currentTime;
                            if (dur > 0) {
                                const remaining = Math.max(0, Math.ceil(dur - curr));
                                if (dur - curr <= 0.4 || remaining <= 0) {
                                    handleTrackEnded();
                                } else if (!isDragging && onSyncRequest) {
                                    onSyncRequest({
                                        action: 'sync_time',
                                        remaining: remaining
                                    });
                                }
                            }
                        }
                    }}
                    className="hidden" 
                />
            )}
            
            {currentTrack?.type === 'youtube' && (
                <div id={`yt-player-${currentTrack.id}`} className="hidden"></div>
            )}

            {/* Botão de Acionamento da Playlist no Cronômetro */}
            <button
                type="button"
                onClick={() => setIsOpen(true)}
                className={`p-1.5 sm:p-2 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 select-none shadow-2xs ${
                    currentTrack 
                        ? 'border-indigo-500 bg-indigo-600/25 text-indigo-200 hover:bg-indigo-600/35 hover:text-white shadow-[0_0_12px_rgba(99,102,241,0.4)]' 
                        : 'border-slate-700 bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white'
                }`}
                title="Abrir Playlist de Músicas do Cronômetro"
            >
                <Music className={`w-3.5 h-3.5 ${currentTrack && isPlaying ? 'animate-bounce text-indigo-400' : ''}`} />
                {currentTrack ? (
                    <span className="text-[11px] font-bold max-w-[80px] sm:max-w-[100px] truncate text-indigo-200">
                        {currentTrack.name}
                    </span>
                ) : (
                    <span className="text-[11px] font-bold text-slate-400 hidden sm:inline-block">
                        Música
                    </span>
                )}
            </button>

            {/* MODAL EXTERNO / DEDICADO DA PLAYLIST (FORA DO CRONÔMETRO, AMPLO E SUPER LEGÍVEL) */}
            {isOpen && portalNode && createPortal(
                <div 
                    className="fixed inset-0 z-[15000] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200 select-none"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) setIsOpen(false);
                    }}
                >
                    <div 
                        className="bg-slate-900 border-2 border-indigo-500/50 rounded-3xl w-full max-w-xl max-h-[92vh] flex flex-col shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden animate-in zoom-in-95 duration-250 text-white"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Cabeçalho do Estúdio */}
                        <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-700 px-6 py-4 flex items-center justify-between shrink-0 shadow-md border-b border-white/10">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-white/15 rounded-2xl shadow-inner flex items-center justify-center">
                                    <Music className="w-6 h-6 text-indigo-100" />
                                </div>
                                <div>
                                    <span className="text-[10px] font-black uppercase tracking-wider text-indigo-200 block">
                                        Trilha Sonora & Efeitos
                                    </span>
                                    <h3 className="text-lg sm:text-xl font-black text-white leading-tight flex items-center gap-2">
                                        Playlist do Cronômetro
                                        {currentTrack && (
                                            <span className="text-2xs font-bold px-2.5 py-0.5 rounded-full bg-white/20 border border-white/30 text-white">
                                                {isPlaying ? '▶ Tocando' : '⏸ Pausada'}
                                            </span>
                                        )}
                                    </h3>
                                </div>
                            </div>
                            <button 
                                type="button" 
                                onClick={() => setIsOpen(false)} 
                                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center text-white transition-colors cursor-pointer"
                                title="Fechar Playlist"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Conteúdo Completo e Super Legível */}
                        <div className="p-5 sm:p-6 overflow-y-auto custom-scrollbar flex-1 space-y-5 text-slate-100">
                            
                            {/* Card 1: Modo de Sincronização */}
                            <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/80 flex items-center justify-between gap-4 shadow-sm">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Clock className="w-4 h-4 text-indigo-400 shrink-0" />
                                        <h5 className="text-sm font-bold text-white">Sincronizar Duração com a Bomba</h5>
                                    </div>
                                    <p className="text-xs text-slate-300 leading-relaxed">
                                        {syncWithMusic 
                                            ? '⚡ Ativado: O tempo da bomba e a música correm juntos. A bomba explode exatamente ao final da música!' 
                                            : '🎵 Desativado: A música toca livremente em segundo plano sem alterar o tempo configurado.'}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setSyncWithMusic(!syncWithMusic)}
                                    className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                        syncWithMusic ? 'bg-indigo-600 shadow-[0_0_12px_rgba(99,102,241,0.6)]' : 'bg-slate-700'
                                    }`}
                                >
                                    <span className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                                        syncWithMusic ? 'translate-x-5' : 'translate-x-0'
                                    }`} />
                                </button>
                            </div>

                            {/* Card 2: Faixa Atual & Mesa de Controle */}
                            {currentTrack ? (
                                <div className="bg-gradient-to-br from-indigo-950/80 via-slate-800/90 to-purple-950/50 p-4 rounded-2xl border border-indigo-500/40 shadow-md space-y-3">
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="min-w-0 flex-1">
                                            <span className="text-[10px] uppercase font-black tracking-wider text-indigo-300 block mb-0.5">
                                                Faixa Ativa no Momento
                                            </span>
                                            <p className="text-sm sm:text-base font-bold text-white truncate" title={currentTrack.name}>
                                                {currentTrack.name}
                                            </p>
                                        </div>
                                        <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-xl bg-slate-900/80 border border-slate-700 text-indigo-200 shrink-0">
                                            {formatDuration(currentTrack.duration)} • {currentTrack.type === 'youtube' ? 'YouTube' : 'Áudio Local'}
                                        </span>
                                    </div>
                                    
                                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/10">
                                        <div className="flex items-center gap-2">
                                            <button 
                                                type="button"
                                                onClick={prevTrack} 
                                                className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center text-indigo-300 hover:text-white transition-all active:scale-95 cursor-pointer shadow-xs"
                                                title="Faixa Anterior"
                                            >
                                                <SkipBack className="w-4 h-4" />
                                            </button>
                                            <button 
                                                type="button"
                                                onClick={togglePlay}
                                                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs sm:text-sm flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-indigo-600/30 cursor-pointer"
                                            >
                                                {isPlaying ? <><Pause className="w-4 h-4" /> Pausar</> : <><Play className="w-4 h-4 ml-0.5 fill-white" /> Tocar Agora</>}
                                            </button>
                                            <button 
                                                type="button"
                                                onClick={nextTrack} 
                                                className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center text-indigo-300 hover:text-white transition-all active:scale-95 cursor-pointer shadow-xs"
                                                title="Próxima Faixa"
                                            >
                                                <SkipForward className="w-4 h-4" />
                                            </button>
                                        </div>

                                        {currentTrack.type === 'local' && (
                                            <div className="flex items-center gap-2.5 min-w-[130px]">
                                                <Volume2 className="w-4 h-4 text-slate-400 shrink-0" />
                                                <input 
                                                    type="range" min="0" max="1" step="0.05" value={volume}
                                                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                                                    className="w-full accent-indigo-500 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                                                    title={`Volume: ${Math.round(volume * 100)}%`}
                                                />
                                                <span className="text-2xs font-mono text-slate-400 w-7">{Math.round(volume * 100)}%</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-slate-800/40 border border-dashed border-slate-700 p-6 rounded-2xl text-center text-slate-400">
                                    <Music className="w-8 h-8 mx-auto mb-2 opacity-50 text-indigo-400" />
                                    <p className="text-xs sm:text-sm font-medium">Nenhuma música cadastrada na playlist ainda.</p>
                                    <p className="text-[11px] text-slate-500 mt-1">Adicione um link do YouTube ou envie um arquivo MP3 abaixo.</p>
                                </div>
                            )}

                            {/* Card 3: Lista de Faixas na Fila */}
                            {playlist.length > 0 && (
                                <div className="space-y-2.5">
                                    <div className="flex items-center justify-between px-1">
                                        <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                                            Músicas na Fila ({playlist.length}/10)
                                        </h5>
                                        <span className="text-[11px] text-slate-400 font-mono">
                                            Clique no Play para trocar de faixa
                                        </span>
                                    </div>

                                    <div className="space-y-2">
                                        {playlist.map((track, idx) => (
                                            <div 
                                                key={track.id} 
                                                className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                                                    idx === currentIndex 
                                                        ? 'bg-indigo-950/60 border-indigo-500/50 shadow-sm' 
                                                        : 'bg-slate-800/70 border-slate-700/60 hover:bg-slate-800'
                                                }`}
                                            >
                                                <button 
                                                    type="button"
                                                    onClick={() => { 
                                                        setCurrentIndex(idx); 
                                                        setIsPlaying(true); 
                                                        if (syncWithMusic && onSyncRequest && !isExploded && track.duration > 0) {
                                                            onSyncRequest({
                                                                action: 'sync_on',
                                                                duration: track.duration,
                                                                isPlaying: true
                                                            });
                                                        }
                                                    }}
                                                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 cursor-pointer transition-transform active:scale-90 ${
                                                        idx === currentIndex 
                                                            ? 'bg-indigo-600 text-white shadow-sm' 
                                                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white'
                                                    }`}
                                                    title={idx === currentIndex && isPlaying ? "Tocando agora" : "Tocar esta música"}
                                                >
                                                    {idx === currentIndex && isPlaying ? <Music className="w-3.5 h-3.5 animate-pulse" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
                                                </button>
                                                
                                                {editingTrackId === track.id ? (
                                                    <div className="flex-1 min-w-0 flex flex-col gap-2 py-1">
                                                        <input 
                                                            type="text" 
                                                            value={editName}
                                                            onChange={e => setEditName(e.target.value)}
                                                            placeholder="Nome da música..."
                                                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                                        />
                                                        {track.type === 'youtube' && (
                                                            <input 
                                                                type="text" 
                                                                value={editUrl}
                                                                onChange={e => setEditUrl(e.target.value)}
                                                                placeholder="Link do YouTube..."
                                                                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                                            />
                                                        )}
                                                        <div className="flex justify-end gap-2 mt-1">
                                                            <button 
                                                                type="button"
                                                                onClick={cancelEditTrack} 
                                                                className="text-xs text-slate-400 hover:text-white px-3 py-1 border border-slate-700 rounded-lg transition-colors cursor-pointer"
                                                            >
                                                                Cancelar
                                                            </button>
                                                            <button 
                                                                type="button"
                                                                onClick={() => saveEditTrack(track.id)} 
                                                                className="bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1 text-xs font-bold px-3.5 py-1 rounded-lg transition-colors cursor-pointer"
                                                            >
                                                                <Save className="w-3.5 h-3.5" /> Salvar
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <div className="flex-1 min-w-0 flex flex-col">
                                                            <span className={`text-xs sm:text-sm truncate ${idx === currentIndex ? 'text-indigo-200 font-bold' : 'text-slate-200 font-medium'}`}>
                                                                {track.name}
                                                            </span>
                                                            <span className="text-[10px] text-slate-400 font-mono">
                                                                {formatDuration(track.duration)} • {track.type === 'youtube' ? 'YouTube' : 'Áudio Local'}
                                                            </span>
                                                        </div>

                                                        <button 
                                                            type="button"
                                                            onClick={() => startEditTrack(track)}
                                                            className="p-2 text-slate-400 hover:text-indigo-300 hover:bg-indigo-500/10 rounded-lg transition-colors cursor-pointer"
                                                            title="Editar Nome / Link"
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>

                                                        <button 
                                                            type="button"
                                                            onClick={() => removeTrack(idx)}
                                                            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                                                            title="Remover da Playlist"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Card 4: Adicionar Mídia (YouTube ou Arquivo Local) */}
                            {playlist.length < 10 && (
                                <div className="p-4 bg-slate-800/50 rounded-2xl border border-slate-700/60 space-y-4">
                                    <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                                        <Sparkles className="w-4 h-4 text-amber-400" /> Adicionar Nova Música à Playlist
                                    </h5>

                                    <form onSubmit={handleYoutubeSubmit} className="space-y-1.5">
                                        <label className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                                            <Youtube className="w-3.5 h-3.5 text-rose-500" /> Link do YouTube
                                        </label>
                                        <div className="flex gap-2">
                                            <input 
                                                type="text" 
                                                value={ytInput}
                                                onChange={(e) => setYtInput(e.target.value)}
                                                placeholder="Cole o link do YouTube aqui (ex: https://youtube.com/watch?v=...)"
                                                disabled={isLoadingUrl}
                                                className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 disabled:opacity-50"
                                            />
                                            <button 
                                                type="submit"
                                                disabled={isLoadingUrl || !ytInput.trim()}
                                                className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1.5 shadow-sm shrink-0"
                                            >
                                                {isLoadingUrl ? 'Buscando...' : <><Play className="w-3.5 h-3.5 fill-white" /> Inserir</>}
                                            </button>
                                        </div>
                                    </form>

                                    <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between gap-3">
                                        <span className="text-xs text-slate-400">Ou use um arquivo de áudio do dispositivo:</span>
                                        <button 
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-xl px-4 py-2 text-xs text-white font-bold transition-colors flex items-center gap-2 cursor-pointer shrink-0"
                                        >
                                            <Upload className="w-3.5 h-3.5 text-indigo-300" />
                                            Carregar MP3
                                        </button>
                                        <input type="file" accept="audio/*" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                                    </div>
                                </div>
                            )}

                        </div>

                        {/* Rodapé */}
                        <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex justify-end shrink-0">
                            <button
                                type="button"
                                onClick={() => setIsOpen(false)}
                                className="px-6 py-2.5 rounded-xl font-bold text-sm text-white bg-indigo-600 hover:bg-indigo-500 transition-all shadow-md active:scale-95 cursor-pointer"
                            >
                                Concluído
                            </button>
                        </div>
                    </div>
                </div>,
                portalNode
            )}
        </div>
    );
};
