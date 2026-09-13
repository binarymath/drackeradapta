export class VersionedBackupService {
    static CHECKPOINTS_KEY = 'dracker_checkpoints_v3';
    static MAX_LOCAL_CHECKPOINTS = 15;

    /**
     * Remove dados transientes ou pesados (como previews de PDF ou mídias Base64 se solicitado)
     * preservando 100% da receita pedagógica das atividades.
     */
    static sanitizeActivityForBackup(tab, stripImages = true) {
        if (!tab) return null;

        const clean = { ...tab };

        // Descarte de buffers transientes de UI e previews de exportação
        delete clean.previewPdf;
        delete clean.tempCanvas;
        delete clean.exporting;
        delete clean.isGenerating;

        // Limpeza de imagens Base64 se o modo leve estiver ativado
        if (stripImages) {
            if (clean.imageUrl && typeof clean.imageUrl === 'string' && clean.imageUrl.startsWith('data:image/')) {
                clean.imageUrl = '';
                clean._hadStrippedImage = true;
            }
            if (clean.generatedImages && Array.isArray(clean.generatedImages)) {
                clean.generatedImages = clean.generatedImages.map(img => {
                    if (typeof img === 'string' && img.startsWith('data:image/')) return '[imagem_removida_modo_leve]';
                    return img;
                });
            }
            // Em peças de dominó ou cards que contenham Base64 pesado
            if (clean.pieces && Array.isArray(clean.pieces)) {
                clean.pieces = clean.pieces.map(piece => {
                    const p = { ...piece };
                    if (p.image && typeof p.image === 'string' && p.image.startsWith('data:image/')) {
                        p.image = '';
                    }
                    return p;
                });
            }
        }

        // Se houver histórico de chat, manter no máximo as últimas 30 interações para não inchar o backup
        if (clean.messages && Array.isArray(clean.messages) && clean.messages.length > 30) {
            clean.messages = clean.messages.slice(-30);
        }

        return clean;
    }

    /**
     * Calcula o peso exato em KB de uma estrutura de dados
     */
    static calculateSizeKB(data) {
        try {
            const str = JSON.stringify(data);
            const bytes = new Blob([str]).size;
            return parseFloat((bytes / 1024).toFixed(2));
        } catch {
            return 0;
        }
    }

    /**
     * Retorna a lista de checkpoints salvos localmente na Linha do Tempo
     */
    static getCheckpoints() {
        try {
            const saved = localStorage.getItem(VersionedBackupService.CHECKPOINTS_KEY);
            if (!saved) return [];
            const parsed = JSON.parse(saved);
            return Array.isArray(parsed) ? parsed : [];
        } catch (err) {
            console.error('Erro ao ler checkpoints:', err);
            return [];
        }
    }

    /**
     * Salva um novo checkpoint/versionamento local
     */
    static saveCheckpoint(tabs, { versionTag, description = '', stripImages = true, author = 'Professor(a)' } = {}) {
        const existing = VersionedBackupService.getCheckpoints();
        
        const sanitizedTabs = (tabs || []).map(t => VersionedBackupService.sanitizeActivityForBackup(t, stripImages)).filter(Boolean);
        
        const nextVersionNumber = existing.length + 1;
        const versionId = `v${nextVersionNumber}.0`;
        const timestamp = new Date().toISOString();

        const checkpointData = {
            id: `chk_${Date.now()}`,
            versionId,
            versionTag: versionTag || `Checkpoint de Versão ${nextVersionNumber}`,
            description: description || `Backup contendo ${sanitizedTabs.length} atividade(s).`,
            createdAt: timestamp,
            author,
            stripImages,
            stats: {
                totalActivities: sanitizedTabs.length,
                sizeInKB: 0
            },
            tabs: sanitizedTabs
        };

        checkpointData.stats.sizeInKB = VersionedBackupService.calculateSizeKB(checkpointData);

        // Adiciona ao topo e limita quantidade no localStorage
        const updated = [checkpointData, ...existing].slice(0, VersionedBackupService.MAX_LOCAL_CHECKPOINTS);

        try {
            localStorage.setItem(VersionedBackupService.CHECKPOINTS_KEY, JSON.stringify(updated));
        } catch (err) {
            console.warn('LocalStorage cheio ao salvar checkpoint. Tentando limpar antigos...', err);
            // Se der erro de quota, mantém apenas os 5 mais recentes
            const emergencyList = [checkpointData, ...existing].slice(0, 5);
            localStorage.setItem(VersionedBackupService.CHECKPOINTS_KEY, JSON.stringify(emergencyList));
        }

        return checkpointData;
    }

    /**
     * Exclui um checkpoint local
     */
    static deleteCheckpoint(checkpointId) {
        const existing = VersionedBackupService.getCheckpoints();
        const filtered = existing.filter(c => c.id !== checkpointId);
        localStorage.setItem(VersionedBackupService.CHECKPOINTS_KEY, JSON.stringify(filtered));
        return filtered;
    }

    /**
     * Gera e dispara o download de um arquivo .json otimizado
     */
    static exportJsonFile(checkpointOrTabs, { customFileName = null, isRawTabs = false, metadata = {} } = {}) {
        let payload;
        const now = new Date();
        const dateStr = now.toLocaleDateString('pt-BR').replace(/\//g, '-');

        if (isRawTabs) {
            // Se for exportação direta do estado de abas
            const stripImages = metadata.stripImages !== false; // por padrão leve
            const sanitizedTabs = (checkpointOrTabs || []).map(t => VersionedBackupService.sanitizeActivityForBackup(t, stripImages));
            const existingCheckpoints = VersionedBackupService.getCheckpoints();
            const verNum = existingCheckpoints.length + 1;

            payload = {
                fileFormat: "DRACKER_VERSIONED_BACKUP",
                formatVersion: "3.0",
                snapshot: {
                    versionId: metadata.versionId || `v${verNum}.0`,
                    versionTag: metadata.versionTag || `Backup Rápido (${dateStr})`,
                    description: metadata.description || "Backup gerado diretamente da área de trabalho.",
                    createdAt: now.toISOString(),
                    author: metadata.author || "Professor(a)",
                    stripImages,
                    stats: {
                        totalActivities: sanitizedTabs.length,
                        sizeInKB: 0
                    }
                },
                activitiesData: sanitizedTabs
            };
            payload.snapshot.stats.sizeInKB = VersionedBackupService.calculateSizeKB(payload);
        } else {
            // Se for exportação de um checkpoint existente
            payload = {
                fileFormat: "DRACKER_VERSIONED_BACKUP",
                formatVersion: "3.0",
                snapshot: {
                    versionId: checkpointOrTabs.versionId || "v1.0",
                    versionTag: checkpointOrTabs.versionTag || `Snapshot (${dateStr})`,
                    description: checkpointOrTabs.description || "",
                    createdAt: checkpointOrTabs.createdAt || now.toISOString(),
                    author: checkpointOrTabs.author || "Professor(a)",
                    stripImages: checkpointOrTabs.stripImages ?? true,
                    stats: checkpointOrTabs.stats || { totalActivities: (checkpointOrTabs.tabs || []).length, sizeInKB: 0 }
                },
                activitiesData: checkpointOrTabs.tabs || []
            };
            payload.snapshot.stats.sizeInKB = VersionedBackupService.calculateSizeKB(payload);
        }

        const jsonStr = JSON.stringify(payload, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        
        const cleanName = (payload.snapshot.versionTag || 'backup')
            .toLowerCase()
            .replace(/[^a-z0-9_-]/g, '_')
            .replace(/_+/g, '_')
            .replace(/^_|_$/g, '');

        link.download = customFileName || `${cleanName}_${dateStr}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 2000);

        return payload;
    }

    /**
     * Alias de retrocompatibilidade para exportJsonFile
     */
    static exportDrackerFile(checkpointOrTabs, options = {}) {
        return VersionedBackupService.exportJsonFile(checkpointOrTabs, options);
    }

    /**
     * Exporta todas as versões da Linha do Tempo em um pacote único (.json)
     */
    static exportHistoryPack() {
        const checkpoints = VersionedBackupService.getCheckpoints();
        if (checkpoints.length === 0) {
            alert('Não há checkpoints salvos na linha do tempo para exportar.');
            return;
        }

        const now = new Date();
        const dateStr = now.toLocaleDateString('pt-BR').replace(/\//g, '-');
        const payload = {
            fileFormat: "DRACKER_HISTORY_PACK",
            formatVersion: "3.0",
            exportedAt: now.toISOString(),
            totalCheckpoints: checkpoints.length,
            checkpoints: checkpoints
        };

        const jsonStr = JSON.stringify(payload, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `dracker_historico_completo_${dateStr}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 2000);
    }

    /**
     * Faz o parse e valida um arquivo .json ou legado .dracker de backup
     */
    static parseBackupFile(fileContentStr) {
        try {
            const parsed = typeof fileContentStr === 'string' ? JSON.parse(fileContentStr) : fileContentStr;
            if (!parsed) {
                return { isValid: false, error: 'O arquivo está vazio ou inválido.' };
            }

            const sanitizeTabList = (rawList) => {
                if (!Array.isArray(rawList)) return [];
                return rawList.filter(Boolean).map((t, idx) => ({
                    ...t,
                    id: t.id ? String(t.id) : `tab_imported_${Date.now()}_${idx}`,
                    title: t.title || t.topic || `Atividade #${idx + 1}`,
                    type: t.type || 'quiz',
                    content: t.content !== undefined ? t.content : '',
                    hidden: false
                }));
            };

            // 1. Verifica se é um Pacote de Histórico completo (.dracker-pack / .json)
            if (parsed.fileFormat === "DRACKER_HISTORY_PACK" && Array.isArray(parsed.checkpoints)) {
                return {
                    isValid: true,
                    isHistoryPack: true,
                    checkpoints: parsed.checkpoints,
                    totalCheckpoints: parsed.totalCheckpoints || parsed.checkpoints.length,
                    exportedAt: parsed.exportedAt || new Date().toISOString()
                };
            }

            // 2. Formato versionado v3.0 (.json / DRACKER_VERSIONED_BACKUP)
            if (parsed.fileFormat === "DRACKER_VERSIONED_BACKUP" || parsed.snapshot) {
                const snapshot = parsed.snapshot || {};
                const rawTabs = parsed.activitiesData || parsed.tabs || [];
                const tabs = sanitizeTabList(rawTabs);
                return {
                    isValid: true,
                    isVersioned: true,
                    isHistoryPack: false,
                    snapshot: {
                        versionId: snapshot.versionId || 'v3.0',
                        versionTag: snapshot.versionTag || 'Backup Versionado',
                        description: snapshot.description || 'Arquivo de backup no formato otimizado.',
                        createdAt: snapshot.createdAt || new Date().toISOString(),
                        author: snapshot.author || 'Professor(a)',
                        stripImages: snapshot.stripImages ?? true,
                        stats: snapshot.stats || { totalActivities: tabs.length, sizeInKB: VersionedBackupService.calculateSizeKB(parsed) }
                    },
                    tabs
                };
            }

            // 3. Suporte para JSON v2.0 (objeto com chave .tabs)
            if (parsed.tabs && Array.isArray(parsed.tabs)) {
                const tabs = sanitizeTabList(parsed.tabs);
                const sizeKB = VersionedBackupService.calculateSizeKB(parsed);
                return {
                    isValid: true,
                    isVersioned: false,
                    isHistoryPack: false,
                    snapshot: {
                        versionId: parsed.version || 'v2.0',
                        versionTag: `Backup (${parsed.exportDate ? new Date(parsed.exportDate).toLocaleDateString('pt-BR') : 'Importado'})`,
                        description: 'Arquivo de backup importado em formato JSON.',
                        createdAt: parsed.exportDate || new Date().toISOString(),
                        author: 'Backup JSON',
                        stripImages: false,
                        stats: { totalActivities: tabs.length, sizeInKB: sizeKB }
                    },
                    tabs
                };
            }

            // 4. Suporte para Array direto de atividades [ {...}, {...} ]
            if (Array.isArray(parsed)) {
                const tabs = sanitizeTabList(parsed);
                const sizeKB = VersionedBackupService.calculateSizeKB(parsed);
                return {
                    isValid: true,
                    isVersioned: false,
                    isHistoryPack: false,
                    snapshot: {
                        versionId: 'raw_array',
                        versionTag: `Lista de Atividades (${tabs.length})`,
                        description: `Arquivo JSON com lista de ${tabs.length} atividade(s).`,
                        createdAt: new Date().toISOString(),
                        author: 'Importação Direta',
                        stripImages: false,
                        stats: { totalActivities: tabs.length, sizeInKB: sizeKB }
                    },
                    tabs
                };
            }

            // 5. Suporte para objetos com chave .activities ou .data
            const possibleTabs = parsed.activities || parsed.data;
            if (Array.isArray(possibleTabs)) {
                const tabs = sanitizeTabList(possibleTabs);
                const sizeKB = VersionedBackupService.calculateSizeKB(parsed);
                return {
                    isValid: true,
                    isVersioned: false,
                    isHistoryPack: false,
                    snapshot: {
                        versionId: 'collection',
                        versionTag: `Coleção de Atividades (${tabs.length})`,
                        description: `Arquivo JSON contendo ${tabs.length} atividade(s).`,
                        createdAt: new Date().toISOString(),
                        author: 'Importação JSON',
                        stripImages: false,
                        stats: { totalActivities: tabs.length, sizeInKB: sizeKB }
                    },
                    tabs
                };
            }

            // 6. Suporte para atividade única avulsa em JSON
            if (parsed.type || parsed.content !== undefined || parsed.quizData || parsed.wordsearchData || parsed.crosswordData || parsed.questions || parsed.items) {
                const singleTab = sanitizeTabList([parsed])[0];
                return {
                    isValid: true,
                    isVersioned: false,
                    isHistoryPack: false,
                    snapshot: {
                        versionId: 'single_activity',
                        versionTag: singleTab.title || 'Atividade Individual',
                        description: 'Atividade avulsa importada diretamente em JSON.',
                        createdAt: new Date().toISOString(),
                        author: 'Importação Individual',
                        stripImages: false,
                        stats: { totalActivities: 1, sizeInKB: VersionedBackupService.calculateSizeKB(parsed) }
                    },
                    tabs: [singleTab]
                };
            }

            return { isValid: false, error: 'Estrutura de dados não reconhecida como atividade ou backup válido.' };
        } catch (err) {
            console.error('Erro ao processar arquivo de backup:', err);
            return { isValid: false, error: 'O arquivo não é um JSON legível ou está corrompido.' };
        }
    }
}
