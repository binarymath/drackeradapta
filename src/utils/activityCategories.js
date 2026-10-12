/**
 * activityCategories.js
 * Mapeamento e agrupamento das atividades por macro-categorias pedagógicas
 * e subdivisões específicas por ferramenta.
 */

export const CATEGORIES_CONFIG = {
    games: {
        id: 'games',
        label: 'Jogos & Gamificação',
        description: 'Caça-palavras, cruzadinhas, RPG, roleta e dinâmicas interativas',
        color: 'amber',
        badgeBg: 'bg-amber-100 text-amber-900 border-amber-300',
        headerBorder: 'border-amber-200',
        headerBg: 'bg-amber-50/70'
    },
    math: {
        id: 'math',
        label: 'Matemática & Recursos Visuais',
        description: 'Frações interativas, retas numéricas e cards conceituais',
        color: 'blue',
        badgeBg: 'bg-blue-100 text-blue-900 border-blue-300',
        headerBorder: 'border-blue-200',
        headerBg: 'bg-blue-50/70'
    },
    music: {
        id: 'music',
        label: 'Música & Multimídia',
        description: 'Rádio Drácker, paródias musicais educativas e vídeos',
        color: 'rose',
        badgeBg: 'bg-rose-100 text-rose-900 border-rose-300',
        headerBorder: 'border-rose-200',
        headerBg: 'bg-rose-50/70'
    },
    eval: {
        id: 'eval',
        label: 'Avaliações & Conteúdo Didático',
        description: 'Questionários, avaliações, resumos e relatórios de desempenho',
        color: 'indigo',
        badgeBg: 'bg-indigo-100 text-indigo-900 border-indigo-300',
        headerBorder: 'border-indigo-200',
        headerBg: 'bg-indigo-50/70'
    },
    ai: {
        id: 'ai',
        label: 'Inteligência Artificial & Diálogo',
        description: 'Conversas orientadas e tutoria inteligente com o Drácker',
        color: 'emerald',
        badgeBg: 'bg-emerald-100 text-emerald-900 border-emerald-300',
        headerBorder: 'border-emerald-200',
        headerBg: 'bg-emerald-50/70'
    },
    other: {
        id: 'other',
        label: 'Outras Atividades & Utilitários',
        description: 'Ferramentas complementares e mesclagem de documentos',
        color: 'slate',
        badgeBg: 'bg-slate-100 text-slate-800 border-slate-300',
        headerBorder: 'border-slate-200',
        headerBg: 'bg-slate-50/70'
    }
};

export const SUBDIVISIONS_CONFIG = {
    wordsearch: {
        key: 'wordsearch',
        label: 'Caça-Palavras',
        categoryId: 'games',
        addLabel: 'Novo Caça-Palavras',
        color: 'amber'
    },
    crossword: {
        key: 'crossword',
        label: 'Palavras Cruzadas',
        categoryId: 'games',
        addLabel: 'Nova Cruzadinha',
        color: 'amber'
    },
    rpg: {
        key: 'rpg',
        label: 'RPG Investigativo',
        categoryId: 'games',
        addLabel: 'Nova Missão RPG',
        color: 'amber'
    },
    roulette: {
        key: 'roulette',
        label: 'Roleta Pedagógica',
        categoryId: 'games',
        addLabel: 'Nova Roleta',
        color: 'amber'
    },
    domino: {
        key: 'domino',
        label: 'Dominó Pedagógico',
        categoryId: 'games',
        addLabel: 'Novo Dominó',
        color: 'amber'
    },
    domino_game: {
        key: 'domino',
        label: 'Dominó Pedagógico',
        categoryId: 'games',
        addLabel: 'Novo Dominó',
        color: 'amber'
    },
    memory: {
        key: 'memory',
        label: 'Jogo da Memória',
        categoryId: 'games',
        addLabel: 'Novo Jogo da Memória',
        color: 'amber'
    },
    hangman: {
        key: 'hangman',
        label: 'Jogo da Forca',
        categoryId: 'games',
        addLabel: 'Nova Forca',
        color: 'amber'
    },
    connect_dots: {
        key: 'connect_dots',
        label: 'Ligar os Pontos',
        categoryId: 'games',
        addLabel: 'Novo Liga Pontos',
        color: 'amber'
    },

    fractions: {
        key: 'fractions',
        label: 'Frações Interativas',
        categoryId: 'math',
        addLabel: 'Nova Fração',
        color: 'blue'
    },
    number_line: {
        key: 'number_line',
        label: 'Reta Numérica',
        categoryId: 'math',
        addLabel: 'Nova Reta',
        color: 'blue'
    },
    trading_cards: {
        key: 'trading_cards',
        label: 'Trading Cards',
        categoryId: 'math',
        addLabel: 'Novos Cards',
        color: 'blue'
    },

    simplify: {
        key: 'simplify',
        label: 'Rádio Drácker / Músicas',
        categoryId: 'music',
        addLabel: 'Nova Música',
        color: 'rose'
    },
    video_gallery: {
        key: 'video_gallery',
        label: 'Galeria de Vídeos',
        categoryId: 'music',
        addLabel: 'Novo Vídeo',
        color: 'rose'
    },

    quiz: {
        key: 'quiz',
        label: 'Quizzes & Avaliações',
        categoryId: 'eval',
        addLabel: 'Novo Quiz',
        color: 'indigo'
    },
    quiz_game: {
        key: 'quiz',
        label: 'Quizzes & Avaliações',
        categoryId: 'eval',
        addLabel: 'Novo Quiz',
        color: 'indigo'
    },
    summary: {
        key: 'summary',
        label: 'Resumos Pedagógicos',
        categoryId: 'eval',
        addLabel: 'Novo Resumo',
        color: 'indigo'
    },
    reports: {
        key: 'reports',
        label: 'Relatórios de Desempenho',
        categoryId: 'eval',
        addLabel: 'Novo Relatório',
        color: 'indigo'
    },

    chat_dracker: {
        key: 'chat_dracker',
        label: 'Conversas com Drácker',
        categoryId: 'ai',
        addLabel: 'Nova Conversa',
        color: 'emerald'
    },

    merge_pdf: {
        key: 'merge_pdf',
        label: 'Mesclar PDF',
        categoryId: 'other',
        addLabel: 'Mesclar PDF',
        color: 'slate'
    }
};

/**
 * Normaliza o tipo da aba para a chave canônica da subdivisão
 */
export function getSubdivisionKey(type) {
    if (!type) return 'other';
    if (type === 'quiz_game') return 'quiz';
    if (type === 'domino_game') return 'domino';
    return SUBDIVISIONS_CONFIG[type]?.key || type;
}

/**
 * Retorna metadados de uma subdivisão
 */
export function getSubdivisionConfig(type) {
    const key = getSubdivisionKey(type);
    return SUBDIVISIONS_CONFIG[key] || {
        key,
        label: key.replace(/_/g, ' ').toUpperCase(),
        categoryId: 'other',
        addLabel: 'Nova Atividade',
        color: 'slate'
    };
}

/**
 * Agrupa abas por macro-categoria e dentro de cada uma por subdivisões específicas
 */
export function groupTabsHierarchy(tabs) {
    const validTabs = (tabs || []).filter(t => !['dashboard', 'about_system', 'home'].includes(t.type));
    
    // Categorias ordenadas
    const categoryOrder = ['games', 'math', 'music', 'eval', 'ai', 'other'];
    const groups = [];

    for (const catId of categoryOrder) {
        const catConfig = CATEGORIES_CONFIG[catId];
        const catTabs = validTabs.filter(t => {
            const sub = getSubdivisionConfig(t.type);
            return sub.categoryId === catId;
        });

        if (catTabs.length > 0) {
            // Subdividir por tipo específico dentro da categoria
            const subMap = new Map();
            for (const tab of catTabs) {
                const subKey = getSubdivisionKey(tab.type);
                if (!subMap.has(subKey)) {
                    subMap.set(subKey, []);
                }
                subMap.get(subKey).push(tab);
            }

            const subdivisions = [];
            subMap.forEach((items, subKey) => {
                const subConfig = getSubdivisionConfig(subKey);
                subdivisions.push({
                    key: subKey,
                    config: subConfig,
                    tabs: items
                });
            });

            // Ordenar subdivisões por contagem decrescente
            subdivisions.sort((a, b) => b.tabs.length - a.tabs.length);

            groups.push({
                category: catConfig,
                totalTabs: catTabs.length,
                subdivisions
            });
        }
    }

    return groups;
}

/**
 * Agrupa abas diretamente por subdivisões individuais (sem o agrupamento de macro-categoria)
 */
export function groupTabsBySubdivisionDirect(tabs) {
    const validTabs = (tabs || []).filter(t => !['dashboard', 'about_system', 'home'].includes(t.type));
    const subMap = new Map();

    for (const tab of validTabs) {
        const subKey = getSubdivisionKey(tab.type);
        if (!subMap.has(subKey)) {
            subMap.set(subKey, []);
        }
        subMap.get(subKey).push(tab);
    }

    const result = [];
    subMap.forEach((items, subKey) => {
        result.push({
            key: subKey,
            config: getSubdivisionConfig(subKey),
            tabs: items
        });
    });

    // Mais populares primeiro
    return result.sort((a, b) => b.tabs.length - a.tabs.length);
}

/**
 * Agrupa abas por Turmas / Sessões de Aula Oficial
 */
export function groupTabsByClass(tabs, classes = [], officialSession = null) {
    const validTabs = (tabs || []).filter(t => !['dashboard', 'about_system', 'home'].includes(t.type));
    const groups = [];

    // 1. Sessão Ativa de Aula Oficial
    if (officialSession?.isClassActive && officialSession?.currentSessionId) {
        const activeTabs = validTabs.filter(t => t.currentSessionId === officialSession.currentSessionId);
        if (activeTabs.length > 0) {
            groups.push({
                id: 'active_session',
                title: `🔴 Aula Oficial Ativa: ${officialSession.className || 'Turma em Andamento'}`,
                description: 'Atividades abertas e utilizadas na aula oficial atual',
                isLive: true,
                tabs: activeTabs
            });
        }
    }

    // 2. Por Turma Cadastrada
    for (const cls of classes || []) {
        const classTabs = validTabs.filter(t => String(t.classId) === String(cls.id));
        if (classTabs.length > 0) {
            groups.push({
                id: `class_${cls.id}`,
                title: `Turma: ${cls.name}`,
                description: cls.subject ? `Disciplina: ${cls.subject}` : 'Atividades associadas a esta turma',
                tabs: classTabs
            });
        }
    }

    // 3. Atividades sem turma / Gerais
    const unassignedTabs = validTabs.filter(t => !t.classId && (!officialSession?.isClassActive || t.currentSessionId !== officialSession?.currentSessionId));
    if (unassignedTabs.length > 0 || groups.length === 0) {
        groups.push({
            id: 'unassigned',
            title: 'Atividades Gerais / Sem Turma Fixa',
            description: 'Atividades de planejamento e uso livre',
            tabs: unassignedTabs.length > 0 ? unassignedTabs : validTabs
        });
    }

    return groups;
}

/**
 * Calcula a lista de chips com contagens para a barra de filtros
 */
export function getSubdivisionChips(tabs) {
    const validTabs = (tabs || []).filter(t => !['dashboard', 'about_system', 'home'].includes(t.type));
    const counts = new Map();

    for (const tab of validTabs) {
        const subKey = getSubdivisionKey(tab.type);
        counts.set(subKey, (counts.get(subKey) || 0) + 1);
    }

    const chips = [];
    counts.forEach((count, subKey) => {
        chips.push({
            key: subKey,
            count,
            config: getSubdivisionConfig(subKey)
        });
    });

    return chips.sort((a, b) => b.count - a.count);
}
