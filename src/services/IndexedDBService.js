import { openDB } from 'idb';

const DB_NAME = 'DrackerAdaptaDB';
const DB_VERSION = 2; // Incremented version to create new store
const STORE_METADATA = 'checkpoints_metadata';
const STORE_DATA = 'checkpoints_data';
const STORE_PROJECTS = 'projects_state';

export class IndexedDBService {
    /**
     * Inicializa ou atualiza o banco de dados.
     */
    static async getDB() {
        return openDB(DB_NAME, DB_VERSION, {
            upgrade(db, oldVersion, newVersion, transaction) {
                if (!db.objectStoreNames.contains(STORE_METADATA)) {
                    db.createObjectStore(STORE_METADATA, { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains(STORE_DATA)) {
                    db.createObjectStore(STORE_DATA, { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains(STORE_PROJECTS)) {
                    db.createObjectStore(STORE_PROJECTS, { keyPath: 'id' });
                }
            },
        });
    }

    /**
     * Migra os dados antigos do localStorage para o IndexedDB na primeira execução.
     */
    static async migrateFromLocalStorage(db) {
        try {
            const legacyKey = 'dracker_checkpoints_v3';
            const saved = localStorage.getItem(legacyKey);
            if (!saved) return;
            
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length > 0) {
                for (const chk of parsed) {
                    const id = chk.id || `chk_legacy_${Date.now()}_${Math.random()}`;
                    await db.put(STORE_DATA, {
                        id,
                        tabs: chk.tabs || [],
                        classes: chk.classes || [],
                        createdAt: chk.createdAt || new Date().toISOString()
                    });
                    await db.put(STORE_METADATA, {
                        id,
                        versionTag: chk.versionTag || 'Backup Legado',
                        description: chk.description || 'Migrado da versão anterior',
                        createdAt: chk.createdAt || new Date().toISOString(),
                        author: chk.author || 'Professor(a)',
                        type: chk.type || 'manual',
                        stats: chk.stats || {
                            totalActivities: (chk.tabs || []).length,
                            sizeInKB: 0
                        }
                    });
                }
                console.log('Migração de localStorage para IndexedDB concluída com sucesso.');
                localStorage.removeItem(legacyKey);
            }
        } catch (err) {
            console.error('Falha na migração do localStorage', err);
        }
    }

    /**
     * Salva um novo checkpoint de forma assíncrona.
     * Retorna o ID gerado.
     */
    static async saveCheckpoint(tabs, classes, metadata = {}, workspaceId = null) {
        const db = await this.getDB();
        const timestamp = new Date().getTime();
        const id = `chk_${timestamp}`;
        const createdAt = new Date().toISOString();

        // Salva o objeto pesado no STORE_DATA
        await db.put(STORE_DATA, {
            id,
            tabs: tabs || [],
            classes: classes || [],
            createdAt
        });

        // Salva apenas informações essenciais no STORE_METADATA
        await db.put(STORE_METADATA, {
            id,
            versionTag: metadata.versionTag || `Snapshot ${new Date().toLocaleTimeString('pt-BR')}`,
            description: metadata.description || `Backup contendo ${tabs?.length || 0} atividade(s).`,
            createdAt,
            author: metadata.author || 'Professor(a)',
            type: metadata.type || 'manual', // 'auto-save', 'manual', etc
            workspaceId: workspaceId,
            stats: {
                totalActivities: tabs?.length || 0,
                sizeInKB: 0 // Será omitido/recalculado depois se necessário, IndexedDB lida bem
            }
        });

        await this.runGarbageCollection(db);

        return id;
    }

    /**
     * Retorna a linha do tempo (apenas metadados), ordenados do mais novo para o mais antigo.
     */
    static async getTimeline(workspaceId = null) {
        const db = await this.getDB();
        await this.migrateFromLocalStorage(db); // Tenta migrar se houver dados antigos
        const allMeta = await db.getAll(STORE_METADATA);
        
        let filtered = allMeta;
        if (workspaceId) {
            filtered = allMeta.filter(m => m.workspaceId === workspaceId);
        }
        
        return filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    /**
     * Retorna o payload completo de um checkpoint para restauração ou inspeção.
     */
    static async getCheckpointData(id) {
        const db = await this.getDB();
        const data = await db.get(STORE_DATA, id);
        const meta = await db.get(STORE_METADATA, id);
        return { ...data, meta };
    }

    /**
     * Exclui um checkpoint específico (ambos metadados e dados).
     */
    static async deleteCheckpoint(id) {
        const db = await this.getDB();
        await db.delete(STORE_METADATA, id);
        await db.delete(STORE_DATA, id);
    }

    /**
     * Limpa TODO o histórico de versões.
     */
    static async clearAllCheckpoints() {
        const db = await this.getDB();
        await db.clear(STORE_METADATA);
        await db.clear(STORE_DATA);
    }

    /**
     * Regra automática de limpeza: Limpa se passar de X limites.
     */
    static async runGarbageCollection(db) {
        const MAX_CHECKPOINTS = 30; // Podemos deixar um limite alto
        const allMeta = await db.getAll(STORE_METADATA);
        
        // Ignora versões favoritadas/pinadas (se implementado depois com metadata.pinned = true)
        const removable = allMeta
            .filter(m => !m.pinned)
            .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)); // Mais velhos primeiro

        if (removable.length > MAX_CHECKPOINTS) {
            const excess = removable.length - MAX_CHECKPOINTS;
            const toDelete = removable.slice(0, excess);
            
            for (const item of toDelete) {
                await db.delete(STORE_METADATA, item.id);
                await db.delete(STORE_DATA, item.id);
            }
        }
    }

    // ==========================================
    // MÓDULO DE PROJETOS (WORKSPACES)
    // ==========================================

    /**
     * Retorna a lista de todos os projetos disponíveis.
     */
    static async listProjects() {
        const db = await this.getDB();
        const allProjects = await db.getAll(STORE_PROJECTS);
        return allProjects.sort((a, b) => b.lastAccessed - a.lastAccessed);
    }

    /**
     * Busca os dados de um projeto específico.
     */
    static async getProject(projectId) {
        const db = await this.getDB();
        return await db.get(STORE_PROJECTS, projectId);
    }

    /**
     * Cria ou atualiza um projeto.
     */
    static async saveProjectState(projectId, projectData) {
        const db = await this.getDB();
        
        // Verifica se já existe para preservar atributos como 'createdAt'
        const existing = await db.get(STORE_PROJECTS, projectId) || {};
        
        const payload = {
            ...existing,
            id: projectId,
            name: projectData.name || existing.name || 'Novo Projeto',
            tabs: projectData.tabs || existing.tabs || [],
            classes: projectData.classes || existing.classes || [],
            createdAt: existing.createdAt || Date.now(),
            lastAccessed: Date.now()
        };
        
        await db.put(STORE_PROJECTS, payload);
        return payload;
    }

    /**
     * Deleta um projeto e todos os seus checkpoints.
     */
    static async deleteProject(projectId) {
        const db = await this.getDB();
        
        // Exclui o projeto
        await db.delete(STORE_PROJECTS, projectId);
        
        // Exclui os checkpoints deste projeto
        const allMeta = await db.getAll(STORE_METADATA);
        const projectMeta = allMeta.filter(m => m.workspaceId === projectId);
        
        for (const meta of projectMeta) {
            await db.delete(STORE_METADATA, meta.id);
            await db.delete(STORE_DATA, meta.id);
        }
    }
}
