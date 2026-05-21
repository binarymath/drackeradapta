/**
 * safeJSONParse – Parser robusto que lida com respostas da API Gemini.
 * Trata: markdown fences, blocos <thinking>, texto antes/depois do JSON,
 * trailing commas e outros problemas comuns.
 */
export const safeJSONParse = (text) => {
    if (!text) return null;

    let clean = text;

    // 1. Remove blocos de raciocínio (<thinking>...</thinking>)
    //    O gemini-2.5-flash pode emitir esses blocos antes do JSON
    clean = clean.replace(/<thinking>[\s\S]*?<\/thinking>/gi, '');

    // 2. Remove markdown fences (```json ... ``` ou ``` ... ```)
    clean = clean
        .replace(/```json\s*/gi, '')
        .replace(/```\s*/g, '')
        .trim();

    // 3. Encontra o primeiro { ou [ e o último } ou ] correspondente
    //    para extrair apenas o bloco JSON, ignorando texto ao redor
    const firstBrace    = clean.indexOf('{');
    const firstBracket  = clean.indexOf('[');

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

    // 4. Tenta parse nativo
    try {
        return JSON.parse(clean);
    } catch (e1) {
        // 5. Fix trailing commas: ,} → }  e  ,] → ]
        let fixed = clean
            .replace(/,\s*}/g, '}')
            .replace(/,\s*]/g, ']');

        try {
            return JSON.parse(fixed);
        } catch (e2) {
            // 6. Fix aspas simples por duplas (não toca em contrações tipo "it's")
            let fixed2 = fixed.replace(/:\s*'([^']*)'/g, ': "$1"');
            try {
                return JSON.parse(fixed2);
            } catch (e3) {
                console.warn(
                    '[safeJSONParse] Falhou após todas as tentativas.\n' +
                    'Raw (primeiros 600 chars):', text?.slice(0, 600), '\n' +
                    'Cleaned:', clean?.slice(0, 600)
                );
                return null;
            }
        }
    }
};
