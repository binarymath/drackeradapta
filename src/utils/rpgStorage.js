// Utilitário para persistência e contagem das missões construídas de RPG no Drácker
export const RPG_LIBRARY_STORAGE_KEY = 'dracker_rpg_missions_library';

export const getSavedRPGLibrary = () => {
    try {
        const raw = localStorage.getItem(RPG_LIBRARY_STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch (e) {
        return [];
    }
};

export const saveToRPGLibrary = (missionRecord) => {
    if (!missionRecord || !missionRecord.data || !missionRecord.data.etapas) return [];
    try {
        const existing = getSavedRPGLibrary();
        
        // Garante que cada missão possua um ID exclusivo e permanente da missão
        const recordId = missionRecord.id || missionRecord.data.id || `rpg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        missionRecord.id = recordId;
        if (missionRecord.data && !missionRecord.data.id) {
            missionRecord.data.id = recordId;
        }

        // Substitui apenas se for EXATAMENTE a mesma missão (mesmo id).
        // NUNCA apaga missões anteriores diferentes mesmo que tenham sido feitas na mesma aba ou com título similar!
        const filtered = existing.filter(m => {
            const mId = m.id || m.data?.id;
            return mId !== recordId;
        });

        const updated = [missionRecord, ...filtered].slice(0, 100);
        localStorage.setItem(RPG_LIBRARY_STORAGE_KEY, JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent('dracker_rpg_missions_updated'));
        return updated;
    } catch (e) {
        console.warn('Erro ao salvar missão na biblioteca:', e);
        return [];
    }
};

export const removeFromRPGLibrary = (missionId) => {
    try {
        const existing = getSavedRPGLibrary();
        const updated = existing.filter(m => (m.id || m.data?.id) !== missionId);
        localStorage.setItem(RPG_LIBRARY_STORAGE_KEY, JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent('dracker_rpg_missions_updated'));
        return updated;
    } catch (e) {
        return [];
    }
};

export const countAllBuiltMissions = (tabs = [], activeTabId = null, activeActivity = null) => {
    const seenIds = new Set();
    let count = 0;

    // 1. Aba atual
    const curData = activeActivity?.rpgData?.currentData;
    if (curData && curData.etapas && curData.etapas.length > 0) {
        const mId = curData.id || `cur_${curData.titulo_aventura}`;
        seenIds.add(mId);
        count++;
    }

    // 2. Outras abas
    if (Array.isArray(tabs)) {
        tabs.forEach(t => {
            if (t.id === activeTabId) return;
            let mData = t.rpgData?.currentData || (t.data?.etapas ? t.data : null);
            if (!mData && typeof t.content === 'string' && t.content.includes('"etapas"')) {
                try {
                    const parsed = JSON.parse(t.content);
                    if (parsed?.etapas) mData = parsed;
                } catch (e) {}
            }
            if (mData && mData.etapas && mData.etapas.length > 0) {
                const mId = mData.id || `tab_${t.id}`;
                if (!seenIds.has(mId)) {
                    seenIds.add(mId);
                    count++;
                }
            }
        });
    }

    // 3. Biblioteca salva no localStorage
    const libMissions = getSavedRPGLibrary();
    libMissions.forEach(m => {
        if (!m || !m.data || !m.data.etapas || m.data.etapas.length === 0) return;
        const mId = m.id || m.data.id || `lib_${m.title}`;
        if (!seenIds.has(mId)) {
            seenIds.add(mId);
            count++;
        }
    });

    return count;
};
