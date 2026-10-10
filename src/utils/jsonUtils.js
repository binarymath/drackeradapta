/**
 * repairTruncatedJSON – Repara strings JSON que foram cortadas antes de fechar colchetes e chaves.
 */
export const repairTruncatedJSON = (jsonStr) => {
    if (!jsonStr || typeof jsonStr !== 'string') return null;
    let s = jsonStr.trim();

    // Se houver aspas não fechadas no final da string cortada
    let inString = false;
    let isEscaped = false;
    const stack = [];

    for (let i = 0; i < s.length; i++) {
        const char = s[i];
        if (isEscaped) {
            isEscaped = false;
            continue;
        }
        if (char === '\\') {
            isEscaped = true;
            continue;
        }
        if (char === '"') {
            inString = !inString;
            continue;
        }
        if (!inString) {
            if (char === '{' || char === '[') {
                stack.push(char);
            } else if (char === '}' || char === ']') {
                const last = stack[stack.length - 1];
                if ((char === '}' && last === '{') || (char === ']' && last === '[')) {
                    stack.pop();
                }
            }
        }
    }

    // Se parou no meio de uma string, fecha a string
    if (inString) {
        s += '"';
    }

    // Remove vírgulas órfãs no final
    s = s.replace(/,\s*$/, '');

    // Fecha todas as chaves e colchetes pendentes na ordem correta
    while (stack.length > 0) {
        const openChar = stack.pop();
        s = s.replace(/,\s*$/, '');
        if (openChar === '{') s += '}';
        else if (openChar === '[') s += ']';
    }

    try {
        return JSON.parse(s);
    } catch (_) {
        return null;
    }
};

/**
 * safeJSONParse – Parser robusto que lida com respostas da API Gemini.
 * Trata: markdown fences, blocos <thinking>, texto antes/depois do JSON,
 * trailing commas, newlines dentro de strings, aspas escapadas, JSONs truncados e outros problemas comuns.
 */
export const safeJSONParse = (text) => {
    if (!text) return null;

    let clean = text;

    // 1. Remove blocos de raciocínio (<thinking>...</thinking>)
    clean = clean.replace(/<thinking>[\s\S]*?<\/thinking>/gi, '');

    // 2. Remove markdown fences (```json ... ``` ou ``` ... ```)
    clean = clean
        .replace(/```json\s*/gi, '')
        .replace(/```\s*/g, '')
        .trim();

    // 3. Encontra o primeiro { ou [ e o último } ou ] correspondente
    const firstBrace   = clean.indexOf('{');
    const firstBracket = clean.indexOf('[');

    let start = -1;
    let end   = -1;

    if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
        start = firstBrace;
        end   = clean.lastIndexOf('}');
    } else if (firstBracket !== -1) {
        start = firstBracket;
        end   = clean.lastIndexOf(']');
    }

    if (start !== -1 && end !== -1 && end > start) {
        clean = clean.substring(start, end + 1);
    } else if (start !== -1) {
        // Se começou mas não fechou (truncado), pega do início até o final
        clean = clean.substring(start);
    }

    // ── Tentativa 1: parse nativo ──────────────────────────────
    let lastError = null;
    try {
        return JSON.parse(clean);
    } catch (e) { lastError = e; }

    // ── Tentativa 2: reparo de JSON truncado (bracket balancing) ──
    const repaired = repairTruncatedJSON(clean);
    if (repaired) return repaired;

    // ── Tentativa 3: fix trailing commas ──────────────────────
    let fixed = clean
        .replace(/,\s*}/g, '}')
        .replace(/,\s*]/g, ']');

    try {
        return JSON.parse(fixed);
    } catch (_) { /* continua */ }

    // ── Tentativa 4: remove quebras de linha dentro de strings ─
    let fixed2 = fixed.replace(/"([^"\\]|\\.)*"/gs, (match) =>
        match.replace(/\n/g, ' ').replace(/\r/g, '')
    );

    try {
        return JSON.parse(fixed2);
    } catch (_) { /* continua */ }

    const repaired2 = repairTruncatedJSON(fixed2);
    if (repaired2) return repaired2;

    // ── Tentativa 5: fix aspas simples por duplas em valores ──
    let fixed3 = fixed2.replace(/:\s*'([^']*)'/g, ': "$1"');
    try {
        return JSON.parse(fixed3);
    } catch (_) { /* continua */ }

    // ── Tentativa 6: remove aspas duplas escapadas incorretamente ──
    let fixed4 = fixed3.replace(/"((?:[^"\\]|\\.)*)"/g, (match, inner) => {
        const cleaned = inner.replace(/\\"/g, "'");
        return `"${cleaned}"`;
    });

    try {
        return JSON.parse(fixed4);
    } catch (_) { /* continua */ }

    const repaired4 = repairTruncatedJSON(fixed4);
    if (repaired4) return repaired4;

    // ── Tentativa 7: extração de RPG a partir de blocos de etapas ──
    try {
        const tituloMatch = text.match(/"titulo_aventura"\s*:\s*"([^"]{0,200})"/i);
        const historiaMatch = text.match(/"historia_abertura"\s*:\s*"([^"]{0,1000})"/i);
        const etapaMatches = [...text.matchAll(/\{\s*"round"\s*:\s*(\d+)[\s\S]*?"titulo_capitulo"\s*:\s*"([^"]+)"[\s\S]*?"narrativa_avanco"\s*:\s*"([^"]+)"[\s\S]*?\}/gi)];
        
        if (etapaMatches.length > 0) {
            const etapas = etapaMatches.map((m) => ({
                round: parseInt(m[1], 10) || 1,
                titulo_capitulo: m[2],
                local_cena: 'Cenário da Missão',
                item_recompensa: 'Artefato do Conhecimento',
                narrativa_avanco: m[3],
                enigmas: []
            }));
            return {
                titulo_aventura: tituloMatch?.[1] || 'Aventura do Conhecimento',
                historia_abertura: historiaMatch?.[1] || etapas[0]?.narrativa_avanco || '',
                etapas
            };
        }
    } catch (_) { /* continua */ }

    // ── Tentativa 8: extração genérica de questões ──
    try {
        const introMatch = text.match(/"intro_text"\s*:\s*"([^"]{0,500})"/);
        const questionBlocks = [...text.matchAll(/"statement"\s*:\s*"([^"]{0,500})"/g)];
        const correctBlocks  = [...text.matchAll(/"correct_answer"\s*:\s*"([^"]{0,300})"/g)];

        if (questionBlocks.length > 0) {
            const questions = questionBlocks.map((m, i) => ({
                statement: m[1],
                correct_answer: correctBlocks[i]?.[1] || '',
                distractors: [],
                difficulty: 'medium'
            }));
            return {
                intro_text: introMatch?.[1] || '',
                questions
            };
        }
    } catch (_) { /* continua */ }

    console.warn(
        '[safeJSONParse] Falhou após todas as tentativas.\n' +
        'Parse Error original: ' + (lastError ? lastError.message : 'N/A') + '\n' +
        'Text length: ' + (text ? text.length : 0) + '\n' +
        'Start of text: ' + text?.slice(0, 200) + '\n' +
        'End of text: ' + text?.slice(-300)
    );
    return null;
};
