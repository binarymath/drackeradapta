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
     * Helper para consolidar e deduplicar lista de turmas
     */
    static consolidateClasses(...classSources) {
        const classMap = new Map();
        
        classSources.forEach(source => {
            if (!source) return;
            const list = Array.isArray(source) ? source : [source];
            list.forEach(item => {
                if (!item) return;
                const key = item.id || item.name;
                if (!key) return;
                if (!classMap.has(key)) {
                    classMap.set(key, {
                        id: item.id ? String(item.id) : `cls_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
                        name: item.name || 'Turma Sem Nome',
                        students: Array.isArray(item.students) ? item.students : [],
                        groups: Array.isArray(item.groups) ? item.groups : (item.groups || [])
                    });
                } else {
                    const existing = classMap.get(key);
                    if ((!existing.students || existing.students.length === 0) && Array.isArray(item.students) && item.students.length > 0) {
                        existing.students = item.students;
                    }
                    if ((!existing.groups || existing.groups.length === 0) && Array.isArray(item.groups) && item.groups.length > 0) {
                        existing.groups = item.groups;
                    }
                }
            });
        });

        return Array.from(classMap.values());
    }

    /**
     * Salva um novo checkpoint/versionamento local
     */
    static saveCheckpoint(tabs, { versionTag, description = '', stripImages = true, author = 'Professor(a)', classes = null } = {}) {
        const existing = VersionedBackupService.getCheckpoints();
        
        // Coleta classes do localStorage como base
        let localClasses = [];
        try {
            const raw = localStorage.getItem('atividade_adaptada_classes');
            if (raw) localClasses = JSON.parse(raw);
        } catch (e) {
            console.warn('Erro ao ler classes para checkpoint:', e);
        }

        // Coleta classes embutidas nas próprias abas
        const tabClasses = (tabs || []).map(t => t?.classData).filter(Boolean);

        const allClasses = VersionedBackupService.consolidateClasses(classes, localClasses, tabClasses);

        const sanitizedTabs = (tabs || []).map(t => {
            const clean = VersionedBackupService.sanitizeActivityForBackup(t, stripImages);
            if (clean && clean.type === 'roulette') {
                if (!clean.classData && clean.classId) {
                    clean.classData = allClasses.find(c => c.id === clean.classId) || null;
                }
            }
            return clean;
        }).filter(Boolean);
        
        const nextVersionNumber = existing.length + 1;
        const versionId = `v${nextVersionNumber}.0`;
        const timestamp = new Date().toISOString();

        const checkpointData = {
            id: `chk_${Date.now()}`,
            versionId,
            versionTag: versionTag || `Checkpoint de Versão ${nextVersionNumber}`,
            description: description || `Backup contendo ${sanitizedTabs.length} atividade(s) e ${allClasses.length} turma(s).`,
            createdAt: timestamp,
            author,
            stripImages,
            stats: {
                totalActivities: sanitizedTabs.length,
                sizeInKB: 0
            },
            tabs: sanitizedTabs,
            classes: allClasses
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
    static exportJsonFile(checkpointOrTabs, { customFileName = null, isRawTabs = false, metadata = {}, classes = null } = {}) {
        let payload;
        const now = new Date();
        const dateStr = now.toLocaleDateString('pt-BR').replace(/\//g, '-');

        // Coleta todas as fontes de turmas disponíveis
        let localClasses = [];
        try {
            const rawClasses = localStorage.getItem('atividade_adaptada_classes');
            if (rawClasses) localClasses = JSON.parse(rawClasses);
        } catch (e) {
            console.warn('Erro ao ler classes para backup:', e);
        }

        const sourceTabs = isRawTabs ? (checkpointOrTabs || []) : (checkpointOrTabs?.tabs || []);
        const tabsClassData = sourceTabs.map(t => t?.classData).filter(Boolean);
        const checkpointClasses = !isRawTabs ? checkpointOrTabs?.classes : null;

        const allClasses = VersionedBackupService.consolidateClasses(
            classes,
            metadata.classes,
            checkpointClasses,
            localClasses,
            tabsClassData
        );

        if (isRawTabs) {
            // Se for exportação direta do estado de abas
            const stripImages = metadata.stripImages !== false; // por padrão leve
            const sanitizedTabs = (checkpointOrTabs || []).map(t => {
                const clean = VersionedBackupService.sanitizeActivityForBackup(t, stripImages);
                if (clean && clean.type === 'roulette') {
                    if (!clean.classData && clean.classId) {
                        clean.classData = allClasses.find(c => c.id === clean.classId) || null;
                    }
                }
                return clean;
            });
            const existingCheckpoints = VersionedBackupService.getCheckpoints();
            const verNum = existingCheckpoints.length + 1;

            payload = {
                fileFormat: "DRACKER_VERSIONED_BACKUP",
                formatVersion: "3.0",
                snapshot: {
                    versionId: metadata.versionId || `v${verNum}.0`,
                    versionTag: metadata.versionTag || `Backup Rápido (${dateStr})`,
                    description: metadata.description || `Backup contendo ${sanitizedTabs.length} atividade(s) e ${allClasses.length} turma(s).`,
                    createdAt: now.toISOString(),
                    author: metadata.author || "Professor(a)",
                    stripImages,
                    stats: {
                        totalActivities: sanitizedTabs.length,
                        sizeInKB: 0
                    },
                    classes: allClasses
                },
                activitiesData: sanitizedTabs,
                classes: allClasses
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
                    description: checkpointOrTabs.description || `Snapshot contendo ${(checkpointOrTabs.tabs || []).length} atividade(s) e ${allClasses.length} turma(s).`,
                    createdAt: checkpointOrTabs.createdAt || now.toISOString(),
                    author: checkpointOrTabs.author || "Professor(a)",
                    stripImages: checkpointOrTabs.stripImages ?? true,
                    stats: checkpointOrTabs.stats || { totalActivities: (checkpointOrTabs.tabs || []).length, sizeInKB: 0 },
                    classes: allClasses
                },
                activitiesData: checkpointOrTabs.tabs || [],
                classes: allClasses
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
    static exportHistoryPack(classes = null) {
        const checkpoints = VersionedBackupService.getCheckpoints();
        if (checkpoints.length === 0) {
            alert('Não há checkpoints salvos na linha do tempo para exportar.');
            return;
        }

        let localClasses = [];
        try {
            const raw = localStorage.getItem('atividade_adaptada_classes');
            if (raw) localClasses = JSON.parse(raw);
        } catch (e) {
            console.warn('Erro ao ler classes para histórico:', e);
        }

        const chkClasses = checkpoints.flatMap(c => c.classes || []);
        const allClasses = VersionedBackupService.consolidateClasses(classes, localClasses, chkClasses);

        const now = new Date();
        const dateStr = now.toLocaleDateString('pt-BR').replace(/\//g, '-');
        const payload = {
            fileFormat: "DRACKER_HISTORY_PACK",
            formatVersion: "3.0",
            exportedAt: now.toISOString(),
            totalCheckpoints: checkpoints.length,
            classes: allClasses,
            checkpoints: checkpoints.map(c => ({
                ...c,
                classes: c.classes && c.classes.length > 0 ? c.classes : allClasses
            }))
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

            const extractAllClasses = (sourceObj, tabList) => {
                const list = [];
                // 1. Array de classes na raiz ou no snapshot
                if (Array.isArray(sourceObj.classes)) list.push(...sourceObj.classes);
                if (Array.isArray(sourceObj.turmas)) list.push(...sourceObj.turmas);
                if (Array.isArray(sourceObj.snapshot?.classes)) list.push(...sourceObj.snapshot.classes);

                // 2. Classes dentro dos checkpoints (se for history pack)
                if (Array.isArray(sourceObj.checkpoints)) {
                    sourceObj.checkpoints.forEach(chk => {
                        if (Array.isArray(chk.classes)) list.push(...chk.classes);
                        if (Array.isArray(chk.tabs)) {
                            chk.tabs.forEach(t => {
                                if (t?.classData) list.push(t.classData);
                            });
                        }
                    });
                }

                // 3. Classes embutidas nas abas
                if (Array.isArray(tabList)) {
                    tabList.forEach(t => {
                        if (t?.classData) {
                            list.push(t.classData);
                        } else if (t?.type === 'roulette' && Array.isArray(t.items) && t.items.length > 0) {
                            // Se for roleta com items legados (alunos), extrai como turma
                            list.push({
                                id: t.classId || `cls_legacy_${t.id || Date.now()}`,
                                name: t.topic ? `Turma: ${t.topic}` : (t.title || 'Turma da Roleta'),
                                students: t.items.map((it, idx) => ({
                                    id: it.id || `std_${idx}`,
                                    name: it.name || `Aluno ${idx + 1}`,
                                    status: it.active !== false ? 'active' : 'removed',
                                    hits: it.hits || 0,
                                    misses: it.misses || 0,
                                    history: []
                                }))
                            });
                        }
                    });
                }

                return VersionedBackupService.consolidateClasses(list);
            };

            // 1. Verifica se é um Pacote de Histórico completo (.dracker-pack / .json)
            if (parsed.fileFormat === "DRACKER_HISTORY_PACK" && Array.isArray(parsed.checkpoints)) {
                const extractedClasses = extractAllClasses(parsed, []);
                return {
                    isValid: true,
                    isHistoryPack: true,
                    checkpoints: parsed.checkpoints,
                    totalCheckpoints: parsed.totalCheckpoints || parsed.checkpoints.length,
                    exportedAt: parsed.exportedAt || new Date().toISOString(),
                    classes: extractedClasses
                };
            }

            // 2. Formato versionado v3.0 (.json / DRACKER_VERSIONED_BACKUP)
            if (parsed.fileFormat === "DRACKER_VERSIONED_BACKUP" || parsed.snapshot) {
                const snapshot = parsed.snapshot || {};
                const rawTabs = parsed.activitiesData || parsed.tabs || [];
                const tabs = sanitizeTabList(rawTabs);
                const classes = extractAllClasses(parsed, tabs);
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
                    tabs,
                    classes
                };
            }

            // 3. Suporte para JSON v2.0 (objeto com chave .tabs)
            if (parsed.tabs && Array.isArray(parsed.tabs)) {
                const tabs = sanitizeTabList(parsed.tabs);
                const sizeKB = VersionedBackupService.calculateSizeKB(parsed);
                const classes = extractAllClasses(parsed, tabs);
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
                    tabs,
                    classes
                };
            }

            // 4. Suporte para Array direto de atividades [ {...}, {...} ]
            if (Array.isArray(parsed)) {
                const tabs = sanitizeTabList(parsed);
                const sizeKB = VersionedBackupService.calculateSizeKB(parsed);
                const classes = extractAllClasses({ activities: parsed }, tabs);
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
                    tabs,
                    classes
                };
            }

            // 5. Suporte para objetos com chave .activities ou .data
            const possibleTabs = parsed.activities || parsed.data;
            if (Array.isArray(possibleTabs)) {
                const tabs = sanitizeTabList(possibleTabs);
                const sizeKB = VersionedBackupService.calculateSizeKB(parsed);
                const classes = extractAllClasses(parsed, tabs);
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
                    tabs,
                    classes
                };
            }

            // 6. Suporte para atividade única avulsa em JSON
            if (parsed.type || parsed.content !== undefined || parsed.quizData || parsed.wordsearchData || parsed.crosswordData || parsed.questions || parsed.items) {
                const singleTab = sanitizeTabList([parsed])[0];
                const classes = extractAllClasses(parsed, [singleTab]);
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
                    tabs: [singleTab],
                    classes
                };
            }

            return { isValid: false, error: 'Estrutura de dados não reconhecida como atividade ou backup válido.' };
        } catch (err) {
            console.error('Erro ao processar arquivo de backup:', err);
            return { isValid: false, error: 'O arquivo não é um JSON legível ou está corrompido.' };
        }
    }
}
