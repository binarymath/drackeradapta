import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
    Play,
    Pause,
    Repeat,
    Shuffle,
    Volume2,
    VolumeX,
    Volume1,
    Music,
    Download,
    Search,
    Sparkles,
    ExternalLink,
    SkipBack,
    SkipForward,
    Radio,
    BookOpen,
    Lightbulb,
    Headphones,
    Flame,
    FileText,
    Trash2,
    ArrowRight,
    Pencil
} from 'lucide-react';
import { Button } from '../ui/Button';
import { formatMediaTime } from '../../utils/time';
import { useActivity } from '../../contexts/ActivityContext';
import { getAllCreatedSongs, removeFromMusicLibrary } from '../../utils/musicStorage';
import { toast } from '../ui/Toast';

const drackerPlaylist = [
    {
        id: 'area-magica',
        title: 'O Mistério da Área Mágica (Quadrado e Retângulo)',
        subject: 'Geometria',
        category: 'matematica',
        tagEmoji: '📐',
        desc: 'Aprenda a calcular área de figuras planas cantando com a Turma do Drácker.',
        audioUrl: '/audio/area_magica.m4a',
        imageUrl: '/audio/cover_area_magica.jpeg'
    },
    {
        id: 'fracoes-equivalentes',
        title: 'Frações Equivalentes',
        subject: 'Frações & Proporções',
        category: 'matematica',
        tagEmoji: '🍕',
        desc: 'Divida partes iguais e entenda frações de forma saborosa e lúdica.',
        audioUrl: '/audio/fracoes_equivalentes.m4a',
        imageUrl: '/audio/cover_fracoes.jpeg'
    },
    {
        id: 'festival-music',
        title: 'Festival Music',
        subject: 'Ritmo & Expressão',
        category: 'ritmo',
        tagEmoji: '🎉',
        desc: 'Canção festiva e animada para momentos de recreio e dinâmicas corporais.',
        audioUrl: '/audio/festival_music.m4a',
        imageUrl: '/audio/cover_festival.jpeg'
    },
    {
        id: 'multiplos-divisores',
        title: 'Múltiplos e Divisores',
        subject: 'Divisibilidade & Aritmética',
        category: 'matematica',
        tagEmoji: '🔢',
        desc: 'Descubra a magia dos múltiplos e divisores na matemática da floresta.',
        audioUrl: '/audio/multiplos_divisores.m4a',
        imageUrl: '/audio/cover_multiplos.jpeg'
    },
    {
        id: 'soma-subtracao',
        title: 'Soma e Subtração de Números Naturais',
        subject: 'Operações Fundamentais',
        category: 'matematica',
        tagEmoji: '➕',
        desc: 'Contar, juntar e subtrair: cálculos rápidos e divertidos com rimas.',
        audioUrl: '/audio/soma_subtracao.m4a',
        imageUrl: '/audio/cover_soma.jpeg'
    },
    {
        id: 'floresta-encantada',
        title: 'Lá na Floresta Encantada',
        subject: 'Aventura & Natureza',
        category: 'aventura',
        tagEmoji: '🌲',
        desc: 'Conheça o habitat do Drácker e seus amigos animais em uma linda canção.',
        audioUrl: '/audio/floresta_encantada.m4a',
        imageUrl: '/audio/cover_floresta.jpeg'
    }
];

export const SunoNativePlayer = ({ compact = false, onOpenMusicEditor = null }) => {
    const { tabs, selectActivityTab, addActivityTab } = useActivity();
    const [libraryVersion, setLibraryVersion] = useState(0);
    const [viewMode, setViewMode] = useState('catalog'); // 'catalog' | 'created'
    const playlistRef = useRef(null);

    const [currentIdx, setCurrentIdx] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [loopTrackId, setLoopTrackId] = useState(null);
    const [isShuffle, setIsShuffle] = useState(false);
    const [volume, setVolume] = useState(0.85);
    const [isMuted, setIsMuted] = useState(false);
    const [activeCategory, setActiveCategory] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    const audioRef = useRef(null);

    useEffect(() => {
        const handleUpdate = () => setLibraryVersion(v => v + 1);
        const handleOpenCreated = () => {
            setViewMode('created');
            setTimeout(() => {
                playlistRef.current?.scrollIntoView({ behavior: 'smooth' });
            }, 50);
        };
        window.addEventListener('dracker_music_library_updated', handleUpdate);
        window.addEventListener('dracker_open_created_music', handleOpenCreated);
        return () => {
            window.removeEventListener('dracker_music_library_updated', handleUpdate);
            window.removeEventListener('dracker_open_created_music', handleOpenCreated);
        };
    }, []);

    const createdSongs = useMemo(() => {
        return getAllCreatedSongs(tabs);
    }, [tabs, libraryVersion]);

    const handleOpenCreatedSong = (song) => {
        if (song.isTabOpen && song.tabId) {
            selectActivityTab(song.tabId);
            toast(`Abrindo "${song.title}"`);
            return;
        }
        const existingTab = (tabs || []).find(t => 
            t.type === 'simplify' && 
            !t.hidden && 
            ((t.musicData?.title || t.title || '').trim().toLowerCase() === (song.title || '').trim().toLowerCase())
        );
        if (existingTab) {
            selectActivityTab(existingTab.id);
            toast(`Abrindo "${song.title}"`);
            return;
        }
        if (addActivityTab) {
            addActivityTab({
                title: song.title,
                type: 'simplify',
                content: song.content || `# 🎵 Música do Drácker: ${song.title}\n\n## Lyrics\n${song.lyrics || ''}\n\n`,
                musicData: song.musicData || {
                    title: song.title,
                    lyrics: song.lyrics,
                    style: song.style,
                    synopsis: song.synopsis,
                    questions: song.questions
                }
            });
            toast(`Abrindo "${song.title}"`);
        }
    };

    const handleDeleteCreatedSong = (e, songId, songTitle) => {
        e.stopPropagation();
        if (window.confirm(`Deseja remover a música "${songTitle}" da sua biblioteca?`)) {
            removeFromMusicLibrary(songId);
            toast(`Música "${songTitle}" removida.`);
        }
    };

    const filteredCreatedSongs = useMemo(() => {
        if (!searchQuery.trim()) return createdSongs;
        const q = searchQuery.toLowerCase();
        return createdSongs.filter(s => 
            (s.title || '').toLowerCase().includes(q) ||
            (s.style || '').toLowerCase().includes(q) ||
            (s.synopsis || '').toLowerCase().includes(q) ||
            (s.lyrics || '').toLowerCase().includes(q)
        );
    }, [createdSongs, searchQuery]);

    // Sincronização do volume
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = isMuted ? 0 : volume;
        }
    }, [volume, isMuted]);

    // Disparo de áudio ao mudar de faixa ou play/pause
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        if (isPlaying) {
            audio.load();
            const playPromise = audio.play();
            if (playPromise !== undefined) {
                playPromise.catch((e) => {
                    if (e.name !== 'AbortError') {
                        console.warn("Audio play prevented or failed:", e);
                        setIsPlaying(false);
                    }
                });
            }
        } else {
            audio.pause();
        }
    }, [currentIdx, isPlaying]);

    const currentTrack = drackerPlaylist[currentIdx] || drackerPlaylist[0];

    const togglePlay = (idx = currentIdx) => {
        if (currentIdx === idx) {
            setIsPlaying((prev) => !prev);
        } else {
            setCurrentIdx(idx);
            setIsPlaying(true);
        }
    };

    const nextTrack = () => {
        if (isShuffle && drackerPlaylist.length > 1) {
            let nextIdx = Math.floor(Math.random() * drackerPlaylist.length);
            while (nextIdx === currentIdx) {
                nextIdx = Math.floor(Math.random() * drackerPlaylist.length);
            }
            setCurrentIdx(nextIdx);
        } else {
            setCurrentIdx((prev) => (prev + 1) % drackerPlaylist.length);
        }
        setIsPlaying(true);
    };

    const prevTrack = () => {
        if (audioRef.current && audioRef.current.currentTime > 3) {
            audioRef.current.currentTime = 0;
            return;
        }
        if (isShuffle && drackerPlaylist.length > 1) {
            let prevIdx = Math.floor(Math.random() * drackerPlaylist.length);
            while (prevIdx === currentIdx) {
                prevIdx = Math.floor(Math.random() * drackerPlaylist.length);
            }
            setCurrentIdx(prevIdx);
        } else {
            setCurrentIdx((prev) => (prev - 1 + drackerPlaylist.length) % drackerPlaylist.length);
        }
        setIsPlaying(true);
    };

    const handleEnded = () => {
        if (loopTrackId === currentTrack.id) {
            if (audioRef.current) {
                audioRef.current.currentTime = 0;
                audioRef.current.play().catch(console.error);
            }
        } else {
            nextTrack();
        }
    };

    const handleTimeUpdate = () => {
        if (audioRef.current) {
            setProgress(audioRef.current.currentTime);
            setDuration(audioRef.current.duration || 0);
        }
    };

    const handleSeek = (e) => {
        const bounds = e.currentTarget.getBoundingClientRect();
        const percent = Math.min(Math.max(0, (e.clientX - bounds.left) / bounds.width), 1);
        if (audioRef.current && duration) {
            audioRef.current.currentTime = percent * duration;
            setProgress(percent * duration);
        }
    };

    const toggleLoop = (e, id) => {
        e?.stopPropagation();
        setLoopTrackId((prev) => (prev === id ? null : id));
    };

    const toggleShuffle = () => {
        setIsShuffle((prev) => !prev);
    };

    const handleVolumeChange = (e) => {
        const val = parseFloat(e.target.value);
        setVolume(val);
        if (val > 0 && isMuted) {
            setIsMuted(false);
        }
    };

    const toggleMute = () => {
        setIsMuted((prev) => !prev);
    };

    const handleDownload = async (url, title) => {
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error('Falha no download');
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = blobUrl;
            a.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.m4a`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(blobUrl);
        } catch (error) {
            console.error('Erro ao baixar áudio:', error);
            window.open(url, '_blank');
        }
    };

    // Filtros de playlist
    const filteredPlaylist = useMemo(() => {
        return drackerPlaylist.filter((item) => {
            const matchesCategory =
                activeCategory === 'all' || item.category === activeCategory;
            const matchesSearch =
                !searchQuery.trim() ||
                item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.subject.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesCategory && matchesSearch;
        });
    }, [activeCategory, searchQuery]);

    // Progresso percentual para sliders
    const progressPercent = duration > 0 ? (progress / duration) * 100 : 0;

    // --- MODO COMPACTO (Para uso embutido em telas de atividades menores) ---
    if (compact) {
        return (
            <div className="w-full bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                <audio
                    ref={audioRef}
                    src={currentTrack?.audioUrl}
                    preload="auto"
                    onTimeUpdate={handleTimeUpdate}
                    onEnded={handleEnded}
                />
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <img
                        src={currentTrack.imageUrl}
                        alt={currentTrack.title}
                        className="w-12 h-12 rounded-xl object-cover shadow-sm shrink-0"
                    />
                    <div className="min-w-0">
                        <h4 className="font-bold text-sm text-slate-800 truncate">{currentTrack.title}</h4>
                        <span className="text-xs text-rose-600 font-semibold">{currentTrack.subject}</span>
                    </div>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                    <button
                        onClick={prevTrack}
                        className="p-2 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                        title="Anterior"
                    >
                        <SkipBack className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => togglePlay(currentIdx)}
                        className="w-10 h-10 rounded-full bg-gradient-to-r from-pink-500 to-rose-600 text-white flex items-center justify-center shadow-md shadow-pink-500/20 hover:scale-105 transition-all cursor-pointer"
                    >
                        {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
                    </button>
                    <button
                        onClick={nextTrack}
                        className="p-2 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                        title="Próxima"
                    >
                        <SkipForward className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => handleDownload(currentTrack.audioUrl, currentTrack.title)}
                        className="p-2 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                        title="Baixar Áudio"
                    >
                        <Download className="w-4 h-4" />
                    </button>
                </div>
            </div>
        );
    }

    // --- MODO ESTÚDIO COMPLETO (Clean & Moderno) ---
    return (
        <div className="w-full space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto px-2 sm:px-4 pb-12">
            <audio
                ref={audioRef}
                src={currentTrack?.audioUrl}
                preload="auto"
                onTimeUpdate={handleTimeUpdate}
                onEnded={handleEnded}
            />

            {/* 1. HERO HEADER: Identidade & Ações Rápidas */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-rose-50/70 via-amber-50/40 to-slate-50 border border-slate-200/80 p-6 md:p-8 shadow-xs">
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-pink-200/30 rounded-full blur-3xl pointer-events-none"></div>
                <div className="absolute bottom-0 right-1/4 -mb-12 w-48 h-48 bg-amber-200/30 rounded-full blur-2xl pointer-events-none"></div>

                <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                        <div className="relative group shrink-0">
                            <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-tr from-pink-500 via-rose-500 to-amber-500 p-1 shadow-md shadow-pink-500/20 transform group-hover:scale-105 transition-all">
                                <img
                                    src="/cover_musica_dracker.jpg"
                                    alt="Rádio Drácker"
                                    onError={(e) => { e.target.src = '/dracker_2026.jpg'; }}
                                    className="w-full h-full object-cover rounded-[0.85rem]"
                                />
                            </div>
                            <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
                                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isPlaying ? 'bg-emerald-400' : 'bg-slate-300'}`}></span>
                                <span className={`relative inline-flex rounded-full h-4 w-4 border-2 border-white ${isPlaying ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                            </span>
                        </div>

                        <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-200/70">
                                    <Radio className="w-3 h-3 text-rose-600" /> Estúdio Musical
                                </span>
                                <span className="text-xs font-semibold text-slate-400">•</span>
                                <span className="text-xs font-bold text-slate-500">6 Canções do Acervo</span>
                            </div>

                            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-800 tracking-tight font-['Fredoka']">
                                Rádio <span className="bg-gradient-to-r from-pink-600 to-amber-600 bg-clip-text text-transparent">Drácker</span>
                            </h1>

                            <p className="text-sm md:text-base text-slate-600 font-medium max-w-2xl leading-relaxed">
                                Canções, rimas e ritmos didáticos selecionados para memorização de fórmulas, matemática divertida e acolhimento da turma.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0 flex-wrap sm:flex-nowrap w-full md:w-auto">
                        <Button
                            onClick={() => togglePlay(currentIdx)}
                            variant="primary"
                            className="h-11 px-5 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white font-extrabold shadow-md shadow-pink-500/20 border-none cursor-pointer flex items-center gap-2 flex-1 md:flex-initial justify-center"
                        >
                            {isPlaying ? (
                                <>
                                    <Pause className="w-4 h-4 fill-current" /> Pausar Rádio
                                </>
                            ) : (
                                <>
                                    <Play className="w-4 h-4 fill-current" /> Tocar Canções
                                </>
                            )}
                        </Button>

                        <a
                            href="https://suno.com/@drackermusic"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="h-11 px-3 sm:px-4 rounded-2xl bg-white/80 hover:bg-white border border-slate-200 text-slate-600 hover:text-slate-900 font-bold text-xs shadow-2xs transition-all flex items-center gap-1.5 shrink-0"
                            title="Visitar perfil do Drácker no Suno"
                        >
                            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                            <span className="hidden sm:inline">Perfil no Suno</span>
                        </a>
                    </div>
                </div>
            </div>

            {/* 2. LAYOUT STUDIO: 2 Colunas (Now Playing + Playlist) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* COLUNA ESQUERDA: Now Playing Studio (5 colunas) */}
                <div className="lg:col-span-5 bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col gap-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-36 h-36 bg-pink-100/40 rounded-full blur-3xl pointer-events-none"></div>

                    {/* Capa de Álbum em Destaque com efeito Vinil */}
                    <div className="relative group w-full aspect-square max-w-[320px] mx-auto rounded-3xl overflow-hidden shadow-lg border-4 border-slate-50 bg-slate-100 flex items-center justify-center">
                        <img
                            src={currentTrack.imageUrl}
                            alt={currentTrack.title}
                            className={`w-full h-full object-cover transition-transform duration-700 ${isPlaying ? 'scale-105' : 'scale-100 group-hover:scale-105'}`}
                        />

                        {/* Overlay vinil suave */}
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent flex flex-col justify-end p-5 text-white">
                            <div className="flex items-center justify-between gap-2">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-white/20 backdrop-blur-md border border-white/30 text-white">
                                    <span>{currentTrack.tagEmoji}</span>
                                    <span>{currentTrack.subject}</span>
                                </span>

                                {/* Equalizer animado sobre a capa */}
                                {isPlaying && (
                                    <div className="flex items-end gap-1 h-5 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md">
                                        <div className="w-1 bg-pink-400 rounded-full animate-bounce h-full" style={{ animationDuration: '600ms' }}></div>
                                        <div className="w-1 bg-amber-400 rounded-full animate-bounce h-3/4" style={{ animationDuration: '450ms' }}></div>
                                        <div className="w-1 bg-rose-400 rounded-full animate-bounce h-full" style={{ animationDuration: '750ms' }}></div>
                                        <div className="w-1 bg-purple-400 rounded-full animate-bounce h-2/3" style={{ animationDuration: '500ms' }}></div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Informações da Faixa Ativa */}
                    <div className="text-center space-y-1.5">
                        <h3 className="font-black text-xl sm:text-2xl text-slate-800 leading-snug line-clamp-2">
                            {currentTrack.title}
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-500 font-medium">
                            {currentTrack.desc}
                        </p>
                    </div>

                    {/* Barra de Progresso Precisa com Scrubbing */}
                    <div className="space-y-1.5 pt-1">
                        <div
                            onClick={handleSeek}
                            className="relative w-full h-2.5 bg-slate-100 hover:h-3.5 rounded-full cursor-pointer transition-all overflow-hidden border border-slate-200/60 group"
                        >
                            <div
                                className="absolute top-0 left-0 h-full bg-gradient-to-r from-pink-500 to-rose-600 rounded-full transition-all duration-150"
                                style={{ width: `${progressPercent}%` }}
                            ></div>
                        </div>
                        <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-400 px-0.5">
                            <span>{formatMediaTime(progress)}</span>
                            <span>{formatMediaTime(duration)}</span>
                        </div>
                    </div>

                    {/* Controles Principais de Áudio */}
                    <div className="flex items-center justify-center gap-3 sm:gap-5 pt-1">
                        <button
                            type="button"
                            onClick={toggleShuffle}
                            className={`p-2.5 rounded-2xl transition-all cursor-pointer ${
                                isShuffle
                                    ? 'bg-rose-100 text-rose-700 shadow-xs ring-2 ring-rose-400/30'
                                    : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                            }`}
                            title={isShuffle ? 'Modo aleatório ativado' : 'Ativar modo aleatório'}
                        >
                            <Shuffle className="w-4 h-4" />
                        </button>

                        <button
                            type="button"
                            onClick={prevTrack}
                            className="p-3 rounded-2xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-all cursor-pointer hover:scale-105 active:scale-95"
                            title="Faixa anterior"
                        >
                            <SkipBack className="w-5 h-5 fill-current" />
                        </button>

                        <button
                            type="button"
                            onClick={() => togglePlay(currentIdx)}
                            className="w-14 h-14 sm:w-16 sm:h-16 rounded-3xl bg-gradient-to-br from-pink-500 via-rose-500 to-amber-500 hover:brightness-105 text-white flex items-center justify-center shadow-lg shadow-pink-500/25 transition-all transform hover:scale-105 active:scale-95 cursor-pointer"
                            title={isPlaying ? 'Pausar' : 'Reproduzir'}
                        >
                            {isPlaying ? (
                                <Pause className="w-6 h-6 sm:w-7 sm:h-7 fill-current" />
                            ) : (
                                <Play className="w-6 h-6 sm:w-7 sm:h-7 fill-current ml-0.5" />
                            )}
                        </button>

                        <button
                            type="button"
                            onClick={nextTrack}
                            className="p-3 rounded-2xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-all cursor-pointer hover:scale-105 active:scale-95"
                            title="Próxima faixa"
                        >
                            <SkipForward className="w-5 h-5 fill-current" />
                        </button>

                        <button
                            type="button"
                            onClick={(e) => toggleLoop(e, currentTrack.id)}
                            className={`p-2.5 rounded-2xl transition-all cursor-pointer ${
                                loopTrackId === currentTrack.id
                                    ? 'bg-amber-100 text-amber-700 shadow-xs ring-2 ring-amber-400/30'
                                    : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                            }`}
                            title={loopTrackId === currentTrack.id ? 'Repetição contínua ativa' : 'Repetir esta música'}
                        >
                            <Repeat className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Barra de Volume & Download Direto */}
                    <div className="flex items-center justify-between gap-4 pt-3 border-t border-slate-100 mt-2">
                        <div className="flex items-center gap-2.5 flex-1 max-w-[200px]">
                            <button
                                type="button"
                                onClick={toggleMute}
                                className="text-slate-400 hover:text-slate-700 transition-colors p-1 cursor-pointer"
                                title={isMuted ? 'Desmutar' : 'Mutar áudio'}
                            >
                                {isMuted || volume === 0 ? (
                                    <VolumeX className="w-4 h-4 text-rose-500" />
                                ) : volume < 0.5 ? (
                                    <Volume1 className="w-4 h-4 text-slate-500" />
                                ) : (
                                    <Volume2 className="w-4 h-4 text-slate-600" />
                                )}
                            </button>
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.05"
                                value={isMuted ? 0 : volume}
                                onChange={handleVolumeChange}
                                className="w-full h-1.5 bg-slate-200 accent-pink-600 rounded-lg cursor-pointer"
                                title={`Volume: ${Math.round((isMuted ? 0 : volume) * 100)}%`}
                            />
                        </div>

                        <button
                            type="button"
                            onClick={() => handleDownload(currentTrack.audioUrl, currentTrack.title)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-600 font-bold text-xs transition-all border border-slate-200/80 cursor-pointer"
                            title="Baixar arquivo de áudio"
                        >
                            <Download className="w-3.5 h-3.5" />
                            <span>Baixar Faixa</span>
                        </button>
                    </div>
                </div>

                {/* COLUNA DIREITA: Playlist Didática & Músicas Criadas (7 colunas) */}
                <div ref={playlistRef} className="lg:col-span-7 bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
                    
                    {/* Header com Segmented Tabs e Busca */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                        {/* Seletor de visualização */}
                        <div className="flex items-center p-1 bg-slate-100 rounded-2xl border border-slate-200/80 w-full sm:w-auto">
                            <button
                                type="button"
                                onClick={() => setViewMode('catalog')}
                                className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                                    viewMode === 'catalog'
                                        ? 'bg-white text-slate-900 shadow-xs'
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                <Headphones className="w-3.5 h-3.5 text-rose-500" />
                                <span>Acervo Drácker (6)</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setViewMode('created')}
                                className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                                    viewMode === 'created'
                                        ? 'bg-purple-600 text-white shadow-xs'
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                <Sparkles className="w-3.5 h-3.5" />
                                <span>Músicas Criadas ({createdSongs.length})</span>
                            </button>
                        </div>

                        {/* Busca textual de faixas */}
                        <div className="relative w-full sm:w-56">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder={viewMode === 'created' ? "Buscar nas criadas..." : "Buscar canção ou tema..."}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-3 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-rose-400 focus:outline-none transition-all placeholder:text-slate-400"
                            />
                        </div>
                    </div>

                    {/* CONTEÚDO DA ABA SELECIONADA */}
                    {viewMode === 'catalog' ? (
                        <>
                            {/* Filtros em Pílulas */}
                            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar flex-wrap sm:flex-nowrap">
                                {[
                                    { id: 'all', label: 'Todas as Canções', count: 6 },
                                    { id: 'matematica', label: '📐 Matemática & Geometria', count: 4 },
                                    { id: 'ritmo', label: '🎉 Ritmo & Movimento', count: 1 },
                                    { id: 'aventura', label: '🌲 Aventura na Floresta', count: 1 }
                                ].map((cat) => (
                                    <button
                                        key={cat.id}
                                        type="button"
                                        onClick={() => setActiveCategory(cat.id)}
                                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                                            activeCategory === cat.id
                                                ? 'bg-slate-800 text-white shadow-xs'
                                                : 'bg-slate-100 hover:bg-slate-200/80 text-slate-600'
                                        }`}
                                    >
                                        {cat.label} ({cat.count})
                                    </button>
                                ))}
                                {createdSongs.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={() => setViewMode('created')}
                                        className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 flex items-center gap-1.5"
                                        title="Alternar para músicas criadas por você"
                                    >
                                        <Sparkles className="w-3 h-3 text-purple-600" />
                                        <span>Minhas Criadas ({createdSongs.length})</span>
                                    </button>
                                )}
                            </div>

                            {/* Lista de Músicas do Acervo */}
                            <div className="space-y-3">
                                {filteredPlaylist.length === 0 ? (
                                    <div className="py-12 text-center text-slate-400 flex flex-col items-center">
                                        <Music className="w-12 h-12 mb-3 opacity-30 text-rose-500" />
                                        <p className="font-bold text-sm text-slate-600">Nenhuma canção encontrada.</p>
                                        <p className="text-xs text-slate-400 mt-1">Tente ajustar o filtro ou o termo de busca.</p>
                                    </div>
                                ) : (
                                    filteredPlaylist.map((item) => {
                                        const originalIdx = drackerPlaylist.findIndex((p) => p.id === item.id);
                                        const isCurrent = currentIdx === originalIdx;
                                        const isThisPlaying = isCurrent && isPlaying;
                                        const isLoopingThis = loopTrackId === item.id;

                                        return (
                                            <div
                                                key={item.id}
                                                onClick={() => togglePlay(originalIdx)}
                                                className={`group relative p-3 sm:p-4 rounded-2xl transition-all border flex items-center justify-between gap-4 cursor-pointer ${
                                                    isCurrent
                                                        ? 'bg-rose-50/70 border-rose-300/80 shadow-xs ring-1 ring-rose-400/20'
                                                        : 'bg-white hover:bg-slate-50/80 border-slate-200/70 hover:border-slate-300'
                                                }`}
                                            >
                                                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                                                    {/* Thumbnail da Capa com Botão Play em Hover */}
                                                    <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-slate-100 shrink-0 shadow-2xs border border-slate-200/60">
                                                        <img
                                                            src={item.imageUrl}
                                                            alt={item.title}
                                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                        />
                                                        <div className={`absolute inset-0 flex items-center justify-center transition-opacity ${
                                                            isThisPlaying
                                                                ? 'bg-rose-900/40 opacity-100'
                                                                : 'bg-black/30 opacity-0 group-hover:opacity-100'
                                                        }`}>
                                                            {isThisPlaying ? (
                                                                <Pause className="w-5 h-5 text-white fill-current" />
                                                            ) : (
                                                                <Play className="w-5 h-5 text-white fill-current ml-0.5" />
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Informações da Faixa */}
                                                    <div className="min-w-0 flex-1 space-y-0.5">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-white border border-slate-200/80 text-rose-700 shadow-2xs">
                                                                {item.tagEmoji} {item.subject}
                                                            </span>
                                                            {isThisPlaying && (
                                                                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                                                    <Flame className="w-2.5 h-2.5 text-emerald-600" /> Tocando
                                                                </span>
                                                            )}
                                                        </div>

                                                        <h4 className={`font-black text-sm sm:text-base leading-snug truncate transition-colors ${
                                                            isCurrent ? 'text-rose-900' : 'text-slate-800 group-hover:text-rose-600'
                                                        }`}>
                                                            {item.title}
                                                        </h4>

                                                        <p className="text-xs text-slate-500 font-medium truncate">
                                                            {item.desc}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Ações Rápidas na Linha */}
                                                <div className="flex items-center gap-1.5 shrink-0">
                                                    {isThisPlaying && (
                                                        <div className="hidden sm:flex items-end gap-1 h-4 mr-2">
                                                            <div className="w-1 bg-rose-500 rounded-full animate-bounce h-full" style={{ animationDuration: '600ms' }}></div>
                                                            <div className="w-1 bg-amber-500 rounded-full animate-bounce h-2/3" style={{ animationDuration: '400ms' }}></div>
                                                            <div className="w-1 bg-pink-500 rounded-full animate-bounce h-4/5" style={{ animationDuration: '700ms' }}></div>
                                                        </div>
                                                    )}

                                                    <button
                                                        type="button"
                                                        onClick={(e) => toggleLoop(e, item.id)}
                                                        className={`p-2 rounded-xl transition-all cursor-pointer ${
                                                            isLoopingThis
                                                                ? 'bg-amber-100 text-amber-700 ring-1 ring-amber-300'
                                                                : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100 opacity-60 group-hover:opacity-100'
                                                        }`}
                                                        title={isLoopingThis ? 'Repetição ativada' : 'Repetir esta faixa'}
                                                    >
                                                        <Repeat className="w-4 h-4" />
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDownload(item.audioUrl, item.title);
                                                        }}
                                                        className="p-2 rounded-xl text-slate-400 hover:text-rose-700 hover:bg-rose-100/60 transition-all opacity-60 group-hover:opacity-100 cursor-pointer"
                                                        title="Baixar Faixa"
                                                    >
                                                        <Download className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </>
                    ) : (
                        /* ABA: MINHAS MÚSICAS CRIADAS */
                        <div className="space-y-4">
                            <div className="flex items-center justify-between pb-1 flex-wrap gap-2">
                                <div>
                                    <h4 className="font-extrabold text-sm text-slate-800 flex items-center gap-1.5">
                                        <Sparkles className="w-4 h-4 text-purple-600" />
                                        <span>Minhas Canções e Atividades ({createdSongs.length})</span>
                                    </h4>
                                    <p className="text-xs text-slate-500 font-medium">
                                        Clique em uma música para abrir suas letras, questões e folha de atividades
                                    </p>
                                </div>
                                {onOpenMusicEditor && (
                                    <button
                                        type="button"
                                        onClick={onOpenMusicEditor}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-bold transition-all cursor-pointer shadow-2xs"
                                    >
                                        <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                                        <span>Compor Nova Canção</span>
                                    </button>
                                )}
                            </div>

                            {filteredCreatedSongs.length === 0 ? (
                                <div className="py-12 px-4 text-center text-slate-400 flex flex-col items-center bg-slate-50/60 rounded-2xl border border-dashed border-slate-200">
                                    <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3 shadow-2xs">
                                        <Sparkles className="w-7 h-7" />
                                    </div>
                                    <h4 className="font-bold text-sm text-slate-700">Nenhuma música criada encontrada</h4>
                                    <p className="text-xs text-slate-500 mt-1 max-w-md">
                                        {searchQuery
                                            ? 'Nenhuma música criada corresponde ao termo de busca pesquisado.'
                                            : 'Você ainda não compôs nenhuma canção personalizada. Use o botão de composição para criar canções pedagógicas com rimas e questões de interpretação!'}
                                    </p>
                                    {onOpenMusicEditor && !searchQuery && (
                                        <Button
                                            onClick={onOpenMusicEditor}
                                            className="mt-4 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm cursor-pointer"
                                        >
                                            <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                                            Compor Minha Primeira Música Agora
                                        </Button>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {filteredCreatedSongs.map((song) => (
                                        <div
                                            key={song.id}
                                            onClick={() => handleOpenCreatedSong(song)}
                                            className="group p-4 rounded-2xl bg-white hover:bg-purple-50/40 border border-slate-200/80 hover:border-purple-300 transition-all shadow-2xs cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                                        >
                                            <div className="flex items-start gap-3.5 min-w-0 flex-1">
                                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 via-indigo-500 to-purple-600 text-white flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                                                    <Music className="w-6 h-6" />
                                                </div>
                                                <div className="min-w-0 flex-1 space-y-1">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        {song.style && (
                                                            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 border border-purple-200/70">
                                                                {song.style}
                                                            </span>
                                                        )}
                                                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md border ${
                                                            song.isTabOpen
                                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                                : 'bg-slate-100 text-slate-600 border-slate-200'
                                                        }`}>
                                                            {song.isTabOpen ? 'Aba Aberta' : 'Na Biblioteca'}
                                                        </span>
                                                        {song.questions?.length > 0 && (
                                                            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                                                                {song.questions.length} questões
                                                            </span>
                                                        )}
                                                    </div>
                                                    <h4 className="font-black text-sm sm:text-base text-slate-800 group-hover:text-purple-700 transition-colors line-clamp-1">
                                                        {song.title}
                                                    </h4>
                                                    {song.synopsis ? (
                                                        <p className="text-xs text-slate-500 font-medium line-clamp-1">
                                                            {song.synopsis}
                                                        </p>
                                                    ) : song.lyrics ? (
                                                        <p className="text-xs text-slate-400 font-medium line-clamp-1 italic">
                                                            "{song.lyrics.split('\n').filter(Boolean).slice(0, 2).join(' / ')}..."
                                                        </p>
                                                    ) : null}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleOpenCreatedSong(song);
                                                    }}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-2xs transition-all cursor-pointer group-hover:shadow-sm"
                                                    title="Abrir página completa com letra, questões, impressão e jogo online"
                                                >
                                                    <span>Abrir Atividade</span>
                                                    <ArrowRight className="w-3.5 h-3.5" />
                                                </button>
                                                {!song.isTabOpen && (
                                                    <button
                                                        type="button"
                                                        onClick={(e) => handleDeleteCreatedSong(e, song.id, song.title)}
                                                        className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                                        title="Remover da biblioteca"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* 3. BLOCO DIDÁTICO: Dicas de Uso em Sala de Aula */}
            <div className="bg-gradient-to-br from-slate-50 via-amber-50/20 to-rose-50/30 rounded-3xl p-6 sm:p-8 border border-slate-200/80 space-y-4">
                <div className="flex items-center gap-2.5 text-slate-800">
                    <div className="p-2 bg-amber-100 text-amber-700 rounded-xl">
                        <Lightbulb className="w-5 h-5" />
                    </div>
                    <div>
                        <h4 className="font-black text-lg text-slate-800 tracking-tight">Como usar a Rádio Drácker na sua Rotina Pedagógica</h4>
                        <p className="text-xs text-slate-500 font-medium">Ideias simples para enriquecer suas aulas e dinamizar o aprendizado.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                    <div className="bg-white p-4 rounded-2xl border border-slate-200/70 shadow-2xs space-y-1.5">
                        <span className="text-xl">🎒</span>
                        <h5 className="font-black text-sm text-slate-800">Acolhimento Lúdico</h5>
                        <p className="text-xs text-slate-500 leading-relaxed font-medium">
                            Toque uma música ao abrir a sala para criar conexão imediata com o tema e diminuir a dispersão no início da aula.
                        </p>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-slate-200/70 shadow-2xs space-y-1.5">
                        <span className="text-xl">🧠</span>
                        <h5 className="font-black text-sm text-slate-800">Fixação Mnemônica</h5>
                        <p className="text-xs text-slate-500 leading-relaxed font-medium">
                            Músicas com métrica e rimas ajudam os alunos a memorizarem regras geométricas e operações com frações de forma natural.
                        </p>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-slate-200/70 shadow-2xs space-y-1.5">
                        <span className="text-xl">⏱️</span>
                        <h5 className="font-black text-sm text-slate-800">Cronômetro Musical</h5>
                        <p className="text-xs text-slate-500 leading-relaxed font-medium">
                            Use a duração de uma faixa de 2 a 3 minutos para marcar o tempo limite de gincanas e desafios rápidos em grupo.
                        </p>
                    </div>
                </div>
            </div>

        </div>
    );
};
