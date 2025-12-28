function CustomPlaylistTitle({ config, id }) {
    const title = React.useMemo(() => {
        const playlist = config.PLAYLISTS?.find(p => p.id === id);
        return playlist ? playlist.title : "Vídeos Educativos Selecionados";
    }, [config, id]);

    return <p className="text-xs text-brown-500 font-medium">{title}</p>;
}
