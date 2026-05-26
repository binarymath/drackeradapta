/**
 * safeJSONParse – Parser robusto que lida com respostas da API Gemini.
 * Trata: markdown fences, blocos <thinking>, texto antes/depois do JSON,
 * trailing commas, newlines dentro de strings, aspas escapadas e outros problemas comuns.
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
    }

    // ── Tentativa 1: parse nativo ──────────────────────────────
    try {
        return JSON.parse(clean);
    } catch (_) { /* continua */ }

    // ── Tentativa 2: fix trailing commas ──────────────────────
    let fixed = clean
        .replace(/,\s*}/g, '}')
        .replace(/,\s*]/g, ']');

    try {
        return JSON.parse(fixed);
    } catch (_) { /* continua */ }

    // ── Tentativa 3: remove quebras de linha dentro de strings ─
    // Substitui \n literais (não escapados) dentro de valores de string por espaço
    let fixed2 = fixed.replace(/"([^"\\]|\\.)*"/gs, (match) =>
        match.replace(/\n/g, ' ').replace(/\r/g, '')
    );

    try {
        return JSON.parse(fixed2);
    } catch (_) { /* continua */ }

    // ── Tentativa 4: fix aspas simples por duplas em valores ──
    let fixed3 = fixed2.replace(/:\s*'([^']*)'/g, ': "$1"');
    try {
        return JSON.parse(fixed3);
    } catch (_) { /* continua */ }

    // ── Tentativa 5: remove aspas duplas escapadas incorretamente ──
    // Ex: "texto \"com aspas\" aqui" → "texto 'com aspas' aqui"
    let fixed4 = fixed3.replace(/"((?:[^"\\]|\\.)*)"/g, (match, inner) => {
        const cleaned = inner.replace(/\\"/g, "'");
        return `"${cleaned}"`;
    });

    try {
        return JSON.parse(fixed4);
    } catch (_) { /* continua */ }

    // ── Tentativa 6: extração agressiva — captura só blocos de questões ──
    // Caso o JSON esteja tão corrompido que nenhuma das anteriores funcione,
    // tenta reconstruir um objeto mínimo válido
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
        'Raw (primeiros 600 chars):', text?.slice(0, 600), '\n' +
        'Cleaned:', clean?.slice(0, 600)
    );
    return null;
};
