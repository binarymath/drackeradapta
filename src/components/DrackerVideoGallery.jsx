import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Youtube, Play, X, Loader2, AlertCircle, ExternalLink } from 'lucide-react';
import { DRACKER_CONFIG } from '../dracker_config';

/**
 * DrackerVideoGallery
 * Exibe vídeos de uma Playlist do YouTube.
 */
export default function DrackerVideoGallery() {
    // Garante que existe ao menos uma playlist ou usa vazio
    const initialPlaylist = DRACKER_CONFIG.PLAYLISTS?.[0]?.id || '';
    const [playlistId, setPlaylistId] = useState(initialPlaylist);
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [activeVideoId, setActiveVideoId] = useState(null);

    const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY || "AIzaSyDOXx3S4F9P7V4Cd419uLcsR9f0-d3qJSo";

    const fetchPlaylist = useCallback(async () => {
        if (!apiKey) {
            setError('API Key não configurada. Verifique o arquivo .env');
            return;
        }

        if (!playlistId) {
            setError('Selecione ou insira uma Playlist.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await fetch(
                `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&maxResults=12&playlistId=${playlistId}&key=${apiKey}`
            );

            const data = await response.json();

            if (data.error) {
                throw new Error(`${data.error.message} (Código: ${data.error.code})`);
            }

            const formattedVideos = data.items.map(item => ({
                id: item.contentDetails.videoId,
                snippet: item.snippet
            }));

            setVideos(formattedVideos);
        } catch (err) {
            setError(`Erro ao carregar playlist: ${err.message}`);
        } finally {
            setLoading(false);
        }
    }, [apiKey, playlistId]);

    // Função para fechar o player
    const closePlayer = () => setActiveVideoId(null);

    // Efeito para carregar automaticamente ao mudar o ID (se não for vazio e não tiver carregado)
    useEffect(() => {
        if (playlistId && videos.length === 0 && !loading) {
            fetchPlaylist();
        }
    }, [playlistId]); // Removido fetchPlaylist e outros para evitar loop, mas idealmente seria [fetchPlaylist] se useCallback estiver correto.
    // Vamos simplificar: quando o usuário seleciona, já chama o fetch ou usamos um useEffect?
    // Melhor deixar o botão Carregar para forçar, mas o Select pode acionar também.
    // Vou manter o botão para ser explícito, mas o select atualiza o state.

    const currentPlaylistTitle = useMemo(() => {
        const playlist = DRACKER_CONFIG.PLAYLISTS?.find(p => p.id === playlistId);
        return playlist ? playlist.title : "Vídeos Educativos Selecionados";
    }, [playlistId]);

    return (

        <div className="w-full h-full bg-brown-50 rounded-2xl overflow-hidden flex flex-col border border-brown-200">
            {/* Header */}
            <div className="bg-white border-b border-brown-200 px-6 py-4 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                    <div className="bg-red-600 p-2 rounded-lg shadow-sm">
                        <Youtube className="text-white w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="font-bold text-lg text-brown-900 tracking-tight leading-none">{currentPlaylistTitle}</h2>
                        <p className="text-xs text-brown-500 font-medium">Galeria Drácker</p>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
                {/* Erro */}
                {error && (
                    <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-xl flex gap-3 items-center text-red-700 text-sm">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        <p><strong>Status:</strong> {error}</p>
                    </div>
                )}

                {/* Grelha de Vídeos */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <Loader2 className="w-10 h-10 text-brown-600 animate-spin" />
                        <span className="text-brown-400 font-medium uppercase tracking-widest text-xs">Sincronizando...</span>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {videos.length === 0 && !error && !loading && (
                            <div className="col-span-full py-20 text-center text-brown-400 flex flex-col items-center">
                                <Youtube className="w-16 h-16 mb-4 opacity-20" />
                                <p className="text-lg font-medium">Nenhum vídeo disponível.</p>
                                <p className="text-sm opacity-75">Verifique a configuração da playlist.</p>
                            </div>
                        )}
                        {videos.map((video) => (
                            <div
                                key={video.id}
                                className="group bg-white rounded-2xl overflow-hidden border border-brown-200 hover:border-brown-400 transition-all hover:shadow-lg hover:-translate-y-1"
                            >
                                <div
                                    className="relative aspect-video cursor-pointer overflow-hidden"
                                    onClick={() => setActiveVideoId(video.id)}
                                >
                                    <img
                                        src={video.snippet.thumbnails?.high?.url || video.snippet.thumbnails?.medium?.url}
                                        alt={video.snippet.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                    />
                                    <div className="absolute inset-0 bg-brown-900/20 group-hover:bg-brown-900/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                        <div className="w-14 h-14 bg-red-600 rounded-full flex items-center justify-center shadow-xl text-white transform scale-90 group-hover:scale-100 transition-all duration-300">
                                            <Play className="w-6 h-6 fill-current" />
                                        </div>
                                    </div>
                                </div>

                                <div className="p-5">
                                    <h3 className="font-bold text-brown-900 text-base line-clamp-2 mb-2 leading-snug group-hover:text-red-700 transition-colors">
                                        {video.snippet.title}
                                    </h3>

                                    <div className="flex items-center justify-between mt-4 border-t border-brown-100 pt-3">
                                        <a
                                            href={`https://www.youtube.com/watch?v=${video.id}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs font-bold text-brown-500 hover:text-red-600 flex items-center gap-1 transition-colors uppercase tracking-wide"
                                        >
                                            <ExternalLink className="w-3 h-3" /> Assistir no YouTube
                                        </a>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Player Modal */}
            {activeVideoId && (
                <div className="fixed inset-0 z-[100] bg-brown-900/80 backdrop-blur-sm flex items-center justify-center p-4 md:p-10" onClick={closePlayer}>
                    <div className="w-full max-w-5xl bg-black rounded-2xl overflow-hidden shadow-2xl relative aspect-video border-4 border-white/10" onClick={e => e.stopPropagation()}>
                        <button
                            onClick={closePlayer}
                            className="absolute top-4 right-4 z-10 p-2 bg-black/50 hover:bg-red-600 text-white rounded-full transition-colors backdrop-blur-md border border-white/20"
                        >
                            <X className="w-6 h-6" />
                        </button>
                        <iframe
                            src={`https://www.youtube.com/embed/${activeVideoId}?autoplay=1&rel=0&modestbranding=1`}
                            title="Reprodução de Vídeo"
                            className="w-full h-full border-none"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                        ></iframe>
                    </div>
                </div>
            )}
        </div>
    );
}
