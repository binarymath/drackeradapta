// Utilitário para persistência e recuperação de músicas criadas na Rádio Drácker
export const MUSIC_LIBRARY_STORAGE_KEY = 'dracker_music_library';

export const getSavedMusicLibrary = () => {
    try {
        const raw = localStorage.getItem(MUSIC_LIBRARY_STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch (e) {
        return [];
    }
};

export const saveToMusicLibrary = (musicRecord) => {
    if (!musicRecord || !musicRecord.title) return [];
    try {
        const existing = getSavedMusicLibrary();
        const recordId = musicRecord.id || `music_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        const recordToSave = {
            ...musicRecord,
            id: recordId,
            savedAt: musicRecord.savedAt || Date.now()
        };

        const filtered = existing.filter(m => (m.id !== recordId) && (m.title?.trim().toLowerCase() !== recordToSave.title?.trim().toLowerCase()));
        const updated = [recordToSave, ...filtered].slice(0, 100);
        localStorage.setItem(MUSIC_LIBRARY_STORAGE_KEY, JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent('dracker_music_library_updated'));
        return updated;
    } catch (e) {
        console.warn('Erro ao salvar música na biblioteca:', e);
        return [];
    }
};

export const removeFromMusicLibrary = (musicId) => {
    try {
        const existing = getSavedMusicLibrary();
        const updated = existing.filter(m => m.id !== musicId);
        localStorage.setItem(MUSIC_LIBRARY_STORAGE_KEY, JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent('dracker_music_library_updated'));
        return updated;
    } catch (e) {
        return [];
    }
};

export const getAllCreatedSongs = (tabs = []) => {
    const saved = getSavedMusicLibrary();
    const seenTitles = new Set();
    const songs = [];

    // 1. Canções em abas abertas no momento
    (tabs || []).forEach(t => {
        if (t.type === 'simplify' && t.musicData && !t.hidden) {
            const key = (t.musicData.title || t.title || '').trim().toLowerCase();
            if (key && !seenTitles.has(key)) {
                seenTitles.add(key);
                songs.push({
                    id: t.id,
                    tabId: t.id,
                    isTabOpen: true,
                    title: t.musicData.title || t.title,
                    lyrics: t.musicData.lyrics || '',
                    style: t.musicData.style || '',
                    synopsis: t.musicData.synopsis || '',
                    questions: t.musicData.questions || [],
                    musicData: t.musicData,
                    content: t.content
                });
            }
        }
    });

    // 2. Canções salvas na biblioteca local
    saved.forEach(s => {
        const key = (s.title || '').trim().toLowerCase();
        if (key && !seenTitles.has(key)) {
            seenTitles.add(key);
            songs.push({
                id: s.id,
                tabId: null,
                isTabOpen: false,
                title: s.title,
                lyrics: s.lyrics || '',
                style: s.style || '',
                synopsis: s.synopsis || '',
                questions: s.questions || [],
                musicData: s,
                content: s.content || ''
            });
        }
    });

    return songs;
};
