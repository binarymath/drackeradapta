/**
 * googleSheetsService.js
 * Serviço para buscar questões de planilhas públicas do Google Sheets
 * usando o endpoint gviz/tq (sem API key).
 *
 * Requisito: planilha deve estar em "Qualquer pessoa com o link pode visualizar".
 *
 * Estrutura esperada da planilha:
 *   Coluna A: Pergunta (obrigatório)
 *   Coluna B: Resposta  (obrigatório)
 *   Coluna C: URL da Imagem (opcional - aceita link do Google Drive)
 *   Coluna D: Dificuldade (opcional - "Fácil", "Média" ou "Difícil")
 *   Linha 1:  Cabeçalho (ignorada no parse)
 */

const VALID_DIFFICULTIES = ['Fácil', 'Média', 'Difícil'];

/**
 * Converte links do Google Drive para URL de imagem direta.
 */
export function formatImageUrl(url) {
    if (!url || typeof url !== 'string') return '';
    const trimmed = url.trim();
    if (!trimmed) return '';

    const matchFile = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (matchFile?.[1]) {
        return `https://drive.google.com/uc?export=view&id=${matchFile[1]}`;
    }
    const matchId = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (trimmed.includes('drive.google.com') && matchId?.[1]) {
        return `https://drive.google.com/uc?export=view&id=${matchId[1]}`;
    }
    return trimmed;
}

/**
 * Extrai o Sheet ID e o GID numérico de uma URL do Google Sheets.
 * @param {string} url
 * @returns {{ sheetId: string|null, gid: string|null }}
 */
export function extractSheetInfo(url) {
    if (!url) return { sheetId: null, gid: null };
    const sheetId = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/)?.[1] ?? null;
    const gid = url.match(/[#&?]gid=(\d+)/)?.[1] ?? null;
    return { sheetId, gid };
}

/**
 * Monta a URL do endpoint gviz/tq.
 * Prioridade: gid > sheetName > primeira aba
 */
export function buildGvizUrl(sheetId, { gid, sheetName } = {}) {
    const base = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&range=A:D`;
    if (gid) return `${base}&gid=${gid}`;
    if (sheetName) return `${base}&sheet=${encodeURIComponent(sheetName)}`;
    return base;
}

/**
 * Parse da resposta JSONP do gviz/tq.
 */
function parseGvizResponse(rawText) {
    const jsonMatch = rawText.match(/google\.visualization\.Query\.setResponse\(([\s\S]*)\)\s*;?\s*$/);
    if (!jsonMatch?.[1]) {
        throw new Error('Formato de resposta inválido. Verifique se a planilha está pública.');
    }

    let data;
    try {
        data = JSON.parse(jsonMatch[1]);
    } catch {
        throw new Error('Não foi possível ler os dados da planilha.');
    }

    if (data.status === 'error') {
        const msg = data.errors?.[0]?.detailed_message || data.errors?.[0]?.message || '';
        if (msg.toLowerCase().includes('sheet') || msg.toLowerCase().includes('tab')) {
            throw new Error('ABA_NAO_ENCONTRADA');
        }
        throw new Error(msg || 'Erro ao ler a planilha.');
    }

    const rows = data?.table?.rows ?? [];
    if (rows.length === 0) return [];

    const firstVal = rows[0]?.c?.[0]?.v;
    const startIndex =
        typeof firstVal === 'string' && firstVal.trim().toLowerCase() === 'pergunta' ? 1 : 0;

    return rows
        .slice(startIndex)
        .map(row => {
            const cols = row.c ?? [];
            const question = String(cols[0]?.v ?? '').trim();
            const answer = String(cols[1]?.v ?? '').trim();
            const imageRaw = String(cols[2]?.v ?? '').trim();
            const diffRaw = String(cols[3]?.v ?? '').trim();

            if (!question) return null;

            return {
                id: `gs_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
                question,
                answer,
                imageUrl: formatImageUrl(imageRaw),
                difficulty: VALID_DIFFICULTIES.includes(diffRaw) ? diffRaw : 'Média',
            };
        })
        .filter(Boolean);
}

/**
 * Função principal: busca e parseia questões de uma aba específica.
 *
 * @param {string} sheetId
 * @param {{ gid?: string, sheetName?: string }} options
 * @returns {Promise<Array>}
 */
export async function fetchSheetQuestions(sheetId, options = {}) {
    if (!sheetId) throw new Error('ID da planilha inválido.');

    const url = buildGvizUrl(sheetId, options);

    let response;
    try {
        response = await fetch(url, { mode: 'cors' });
    } catch {
        throw new Error(
            'Não foi possível conectar ao Google Sheets. Verifique sua conexão com a internet.'
        );
    }

    if (response.status === 401 || response.status === 403) {
        throw new Error('PLANILHA_PRIVADA');
    }

    if (!response.ok) {
        throw new Error(`Erro ao buscar planilha (status ${response.status}).`);
    }

    const text = await response.text();
    return parseGvizResponse(text);
}
