/**
 * googleSheetsService.js
 * Serviço para buscar e processar planilhas do Google Sheets, Google Drive
 * e arquivos Excel (.xlsx / .xls / .csv) com extração completa de imagens embutidas e fórmulas.
 */

import * as XLSX from 'xlsx';
import JSZip from 'jszip';

const VALID_DIFFICULTIES = ['Fácil', 'Média', 'Difícil'];

function normalizeText(str) {
    if (!str) return '';
    return String(str)
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();
}

/**
 * Converte links do Google Drive para URL de imagem direta, preserva Base64 e extrai URLs de fórmulas.
 */
export function formatImageUrl(url) {
    if (!url || typeof url !== 'string') return '';
    const trimmed = url.trim();
    if (!trimmed) return '';

    const invalidPlaceholders = [
        '-', '—', '#value!', '#n/a', '#ref!', '#name?', '#calc!', '#null!', '#div/0!',
        'sem imagem', 'nao', 'não', 'n/a', 'none', 'null', 'undefined'
    ];
    if (invalidPlaceholders.includes(trimmed.toLowerCase())) return '';

    // Imagens Base64 embutidas (extraídas diretamente do arquivo Excel)
    if (trimmed.startsWith('data:image')) {
        return trimmed;
    }

    // Fórmulas do Excel / Google Sheets: =IMAGE("url") ou =DISP.IMAGEM("url") ou =HYPERLINK("url")
    const formulaMatch = trimmed.match(/(?:IMAGE|DISP\.IMAGEM|HYPERLINK)\s*\(\s*["\x27]([^"\x27]+)["\x27]/i);
    if (formulaMatch?.[1]) {
        return formatImageUrl(formulaMatch[1]);
    }

    // Google Drive: Converte diretamente para formato compatível sem bloqueio de referer/CORS
    const matchFile = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (matchFile?.[1]) {
        return `https://lh3.googleusercontent.com/d/${matchFile[1]}=w1000`;
    }
    const matchId = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (trimmed.includes('drive.google.com') && matchId?.[1]) {
        return `https://lh3.googleusercontent.com/d/${matchId[1]}=w1000`;
    }

    return trimmed;
}


/**
 * Extrai o Sheet/File ID e o GID numérico de uma URL do Google Sheets ou Google Drive.
 */
export function extractSheetInfo(url) {
    if (!url || typeof url !== 'string') return { sheetId: null, gid: null, isDriveFile: false };
    const trimmed = url.trim();

    const sheetMatch = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
    const driveMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    const openMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    const gid = trimmed.match(/[#&?]gid=(\d+)/)?.[1] ?? null;

    if (sheetMatch?.[1]) {
        return { sheetId: sheetMatch[1], gid, isDriveFile: false };
    }
    if (driveMatch?.[1]) {
        return { sheetId: driveMatch[1], gid, isDriveFile: true };
    }
    if (trimmed.includes('drive.google.com') && openMatch?.[1]) {
        return { sheetId: openMatch[1], gid, isDriveFile: true };
    }

    if (/^[a-zA-Z0-9_-]{20,60}$/.test(trimmed)) {
        return { sheetId: trimmed, gid: null, isDriveFile: false };
    }

    return { sheetId: null, gid: null, isDriveFile: false };
}

/**
 * Monta a URL do endpoint gviz/tq.
 */
export function buildGvizUrl(sheetId, { gid, sheetName, range } = {}) {
    let base = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json`;
    if (range) base += `&range=${encodeURIComponent(range)}`;
    if (gid) return `${base}&gid=${gid}`;
    if (sheetName) return `${base}&sheet=${encodeURIComponent(sheetName)}`;
    return base;
}

/**
 * Extrai todas as imagens embutidas dentro do arquivo .xlsx via JSZip,
 * mapeando os desenhos para as coordenadas exatas da célula (linha, coluna).
 */
export async function extractXlsxMediaAndDrawings(arrayBuffer) {
    if (!arrayBuffer) return { mediaMap: {}, mediaList: [], cellImages: {}, rowImages: {} };
    try {
        const zip = await JSZip.loadAsync(arrayBuffer);
        const mediaMap = {};
        const mediaList = [];

        // 1. Coleta todas as mídias embutidas (xl/media/image*.png)
        for (const [path, file] of Object.entries(zip.files)) {
            if (path.startsWith('xl/media/') && !file.dir) {
                const fileName = path.replace('xl/media/', '');
                const ext = fileName.split('.').pop().toLowerCase();
                const mime = ext === 'png' ? 'image/png' : (ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : (ext === 'webp' ? 'image/webp' : 'image/png'));
                const b64 = await file.async('base64');
                const dataUrl = `data:${mime};base64,${b64}`;
                mediaMap[fileName] = dataUrl;
                mediaList.push(dataUrl);
            }
        }

        const cellImages = {}; // `${row}_${col}` => dataUrl
        const rowImages = {};  // row => [{ col, dataUrl }]

        // 2. Mapeamento de desenhos (xl/drawings/drawing*.xml)
        for (const [path, file] of Object.entries(zip.files)) {
            if (path.startsWith('xl/drawings/') && path.endsWith('.xml') && !path.includes('_rels')) {
                const drawingFileName = path.replace('xl/drawings/', '');
                const relsPath = `xl/drawings/_rels/${drawingFileName}.rels`;
                const relsFile = zip.file(relsPath);

                const relsMap = {};
                if (relsFile) {
                    const relsXml = await relsFile.async('text');
                    const relMatches = [...relsXml.matchAll(/Id="([^"]+)"[^>]*Target="([^"]+)"/g)];
                    for (const m of relMatches) {
                        const target = m[2].replace(/^.*media\//, '');
                        if (mediaMap[target]) {
                            relsMap[m[1]] = mediaMap[target];
                        }
                    }
                }

                const drawingXml = await file.async('text');
                const anchorRegex = /<(?:\w+:)?(?:twoCellAnchor|oneCellAnchor)[^>]*>([\s\S]*?)<\/(?:\w+:)?(?:twoCellAnchor|oneCellAnchor)>/gi;
                let aMatch;
                while ((aMatch = anchorRegex.exec(drawingXml)) !== null) {
                    const block = aMatch[1];
                    const fromMatch = block.match(/<(?:\w+:)?from[^>]*>([\s\S]*?)<\/(?:\w+:)?from>/i);
                    const searchArea = fromMatch ? fromMatch[1] : block;

                    const colMatch = searchArea.match(/<(?:\w+:)?col>(\d+)<\/(?:\w+:)?col>/i);
                    const rowMatch = searchArea.match(/<(?:\w+:)?row>(\d+)<\/(?:\w+:)?row>/i);
                    const embedMatch = block.match(/(?:r:embed|embed)="([^"]+)"/i);

                    if (colMatch && rowMatch && embedMatch && relsMap[embedMatch[1]]) {
                        const col = parseInt(colMatch[1], 10);
                        const row = parseInt(rowMatch[1], 10);
                        const dataUrl = relsMap[embedMatch[1]];

                        cellImages[`${row}_${col}`] = dataUrl;
                        if (!rowImages[row]) rowImages[row] = [];
                        rowImages[row].push({ col, dataUrl });
                    }
                }
            }
        }

        // 3. Mapeamento de imagens de célula modernas (xl/cellimages.xml)
        const cellImagesFile = zip.file('xl/cellimages.xml');
        const cellImagesRelsFile = zip.file('xl/_rels/cellimages.xml.rels');
        if (cellImagesFile && cellImagesRelsFile) {
            const relsXml = await cellImagesRelsFile.async('text');
            const relsMap = {};
            const relMatches = [...relsXml.matchAll(/Id="([^"]+)"[^>]*Target="([^"]+)"/g)];
            for (const m of relMatches) {
                const target = m[2].replace(/^.*media\//, '');
                if (mediaMap[target]) {
                    relsMap[m[1]] = mediaMap[target];
                }
            }

            const cellImagesXml = await cellImagesFile.async('text');
            const imageBlocks = [...cellImagesXml.matchAll(/<(?:\w+:)?cellImage[^>]*>([\s\S]*?)<\/(?:\w+:)?cellImage>/gi)];
            let cIdx = 0;
            for (const b of imageBlocks) {
                const embedMatch = b[1].match(/(?:r:embed|embed)="([^"]+)"/i);
                if (embedMatch && relsMap[embedMatch[1]]) {
                    cellImages[`cellimg_${cIdx}`] = relsMap[embedMatch[1]];
                    cIdx++;
                }
            }
        }

        return { mediaMap, mediaList, cellImages, rowImages };
    } catch (err) {
        console.warn('Aviso: Não foi possível inspecionar arquivos de mídia do zip da planilha:', err);
        return { mediaMap: {}, mediaList: [], cellImages: {}, rowImages: {} };
    }
}

/**
 * Lê uma planilha preservando fórmulas (=IMAGE) e imagens embutidas.
 */
function extractImagesAndFormulasFromWorksheet(ws, mediaContext = {}) {
    if (!ws || !ws['!ref']) return [];
    const range = XLSX.utils.decode_range(ws['!ref']);
    const rows = [];
    const cellImagesMap = mediaContext?.cellImages || {};
    const rowImagesMap = mediaContext?.rowImages || {};

    for (let R = range.s.r; R <= range.e.r; ++R) {
        const row = [];
        row.__rowIndex = R;
        row.__rowImages = rowImagesMap[R] || [];

        for (let C = range.s.c; C <= range.e.c; ++C) {
            const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
            const cell = ws[cellAddress];

            // 1. Imagem embutida detectada pelo Anchor no Excel
            if (cellImagesMap[`${R}_${C}`]) {
                row.push(cellImagesMap[`${R}_${C}`]);
                continue;
            }

            // 2. Fórmula =IMAGE("...") ou =DISP.IMAGEM("...")
            if (cell?.f) {
                const formulaMatch = String(cell.f).match(/(?:IMAGE|DISP\.IMAGEM|HYPERLINK)\s*\(\s*["\x27]([^"\x27]+)["\x27]/i);
                if (formulaMatch?.[1]) {
                    row.push(formulaMatch[1]);
                    continue;
                }
            }

            // 3. Valor normal
            if (cell?.v !== undefined && cell?.v !== null) {
                row.push(String(cell.v).trim());
            } else if (cell?.f) {
                row.push(String(cell.f).trim());
            } else {
                row.push('');
            }
        }
        rows.push(row);
    }
    return rows;
}

/**
 * Decompõe o texto de alternativas e vincula as imagens correspondentes.
 */
function parseAlternatives(rawText, altImages = {}) {
    const trimmed = (rawText || '').trim();
    if (!trimmed && !Object.values(altImages).some(Boolean)) {
        return { isDiscursive: false, options: [] };
    }

    const isDiscursive = /discursiva|resposta\s+aberta/i.test(trimmed);
    if (isDiscursive) {
        return { isDiscursive: true, options: [] };
    }

    // Padrão A) B) C) D) etc.
    const letterPattern = /(?:^|\n)\s*([A-Da-d])\s*[\)\.\-:]\s*([\s\S]*?)(?=(?:\n\s*[A-Da-d]\s*[\)\.\-:]|$))/g;
    const matches = [];
    let match;
    while ((match = letterPattern.exec(trimmed)) !== null) {
        matches.push({
            letter: match[1].toUpperCase(),
            text: match[2].trim()
        });
    }

    if (matches.length > 0) {
        const options = matches.map(m => ({
            letter: m.letter,
            text: m.text,
            imageUrl: altImages[m.letter] || ''
        }));
        return { isDiscursive: false, options };
    }

    // Se não encontrou prefixos A) B) mas existem imagens das alternativas
    const activeImageLetters = ['A', 'B', 'C', 'D'].filter(l => Boolean(altImages[l]));
    if (activeImageLetters.length > 0) {
        const lines = trimmed.split('\n').map(l => l.trim()).filter(Boolean);
        const options = ['A', 'B', 'C', 'D'].map((letter, idx) => ({
            letter,
            text: lines[idx] || '',
            imageUrl: altImages[letter] || ''
        })).filter(o => o.text || o.imageUrl);
        return { isDiscursive: false, options };
    }

    // Se houver múltiplas linhas de texto simples
    const lines = trimmed.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length > 1) {
        const options = lines.map((line, idx) => ({
            letter: String.fromCharCode(65 + idx),
            text: line,
            imageUrl: altImages[String.fromCharCode(65 + idx)] || ''
        }));
        return { isDiscursive: false, options };
    }

    return {
        isDiscursive: false,
        options: trimmed ? [{ letter: 'A', text: trimmed, imageUrl: '' }] : []
    };
}

/**
 * Parser de linhas de planilhas.
 * Aceita matrizes de células ou linhas do Google GViz.
 */
export function parseSpreadsheetRows(rows, fallbackMediaList = []) {
    if (!rows || rows.length === 0) return [];

    const getCellValue = (row, idx) => {
        if (!row || idx === undefined || idx < 0) return '';
        if (row.c) {
            const cell = row.c[idx];
            if (!cell) return '';
            if (cell.v !== null && cell.v !== undefined) return String(cell.v).trim();
            if (cell.f) return String(cell.f).trim();
            return '';
        }
        if (Array.isArray(row)) {
            const val = row[idx];
            if (val !== null && val !== undefined) return String(val).trim();
            return '';
        }
        return '';
    };

    const getRowLength = (row) => (row?.c ? row.c.length : (Array.isArray(row) ? row.length : 0));

    // 1. Procurar título da tarefa no bloco superior de metadados
    let detectedTaskTitle = '';
    for (let r = 0; r < Math.min(5, rows.length); r++) {
        const len = getRowLength(rows[r]);
        for (let c = 0; c < len; c++) {
            const val = normalizeText(getCellValue(rows[r], c));
            if (val === 'tarefa' || val === 'titulo' || val === 'nome da tarefa') {
                const nextRowVal = getCellValue(rows[r + 1], c);
                if (nextRowVal) detectedTaskTitle = nextRowVal;
                break;
            }
        }
        if (detectedTaskTitle) break;
    }

    // 2. Localizar cabeçalho da tabela de questões
    let questionHeaderRowIdx = -1;
    const colMap = {};

    for (let r = 0; r < Math.min(10, rows.length); r++) {
        const len = getRowLength(rows[r]);
        let hasQuestao = false;
        let hasEnunciadoOrAlt = false;

        for (let c = 0; c < len; c++) {
            const val = normalizeText(getCellValue(rows[r], c));
            if (val === 'questao' || val === 'q' || (val.startsWith('questao') && !val.includes('enunciado'))) hasQuestao = true;
            if (val.includes('enunciado') || val.includes('alternativa') || val.includes('pergunta')) hasEnunciadoOrAlt = true;
        }

        if (hasQuestao && hasEnunciadoOrAlt) {
            questionHeaderRowIdx = r;
            for (let c = 0; c < len; c++) {
                const norm = normalizeText(getCellValue(rows[r], c));

                if (norm.includes('enunciado') || (norm.includes('pergunta') && colMap.enunciado === undefined)) {
                    if (norm.includes('imagem') || norm.includes('img')) {
                        colMap.imgEnunciado = c;
                    } else {
                        colMap.enunciado = c;
                    }
                } else if (norm === 'questao' || norm === 'q' || (norm.startsWith('questao') && !norm.includes('enunciado')) || norm === 'item') {
                    if (colMap.questao === undefined) colMap.questao = c;
                } else if (norm.includes('acerto')) {
                    colMap.acertoTurma = c; // Ignorado conforme solicitação do usuário
                } else if (norm.includes('alternativa') && !norm.includes('imagem') && !norm.includes('img')) {
                    colMap.alternativas = c;
                } else if (norm.includes('imagem') || norm.includes('img')) {
                    if (norm.includes('alt. a') || norm.includes('alt a') || norm.endsWith(' a')) colMap.imgA = c;
                    else if (norm.includes('alt. b') || norm.includes('alt b') || norm.endsWith(' b')) colMap.imgB = c;
                    else if (norm.includes('alt. c') || norm.includes('alt c') || norm.endsWith(' c')) colMap.imgC = c;
                    else if (norm.includes('alt. d') || norm.includes('alt d') || norm.endsWith(' d')) colMap.imgD = c;
                    else if (colMap.imgEnunciado === undefined) colMap.imgEnunciado = c;
                } else if (norm.includes('resposta') || norm.includes('gabarito')) {
                    colMap.resposta = c;
                }
            }
            break;
        }
    }

    // Se detectou o formato de Avaliação/Tarefas
    if (questionHeaderRowIdx !== -1 && colMap.enunciado !== undefined) {
        const questions = [];

        for (let r = questionHeaderRowIdx + 1; r < rows.length; r++) {
            const qNum = getCellValue(rows[r], colMap.questao);
            const enunciado = getCellValue(rows[r], colMap.enunciado);
            if (!qNum && !enunciado) continue;

            let imgEnunciadoRaw = colMap.imgEnunciado !== undefined ? getCellValue(rows[r], colMap.imgEnunciado) : '';
            const alternativasRaw = colMap.alternativas !== undefined ? getCellValue(rows[r], colMap.alternativas) : '';
            const respostaRaw = colMap.resposta !== undefined ? getCellValue(rows[r], colMap.resposta) : '';

            let imgA = formatImageUrl(colMap.imgA !== undefined ? getCellValue(rows[r], colMap.imgA) : '');
            let imgB = formatImageUrl(colMap.imgB !== undefined ? getCellValue(rows[r], colMap.imgB) : '');
            let imgC = formatImageUrl(colMap.imgC !== undefined ? getCellValue(rows[r], colMap.imgC) : '');
            let imgD = formatImageUrl(colMap.imgD !== undefined ? getCellValue(rows[r], colMap.imgD) : '');

            // Se a célula da coluna de imagem do enunciado não tinha imagem,
            // verifica se há imagem ancorada exatamente nesta linha da planilha (r):
            if (!imgEnunciadoRaw && rows[r]?.__rowImages?.length > 0) {
                const altSet = new Set([imgA, imgB, imgC, imgD].filter(Boolean));
                const rowImg = rows[r].__rowImages.find(img => !altSet.has(img.dataUrl));
                if (rowImg) {
                    imgEnunciadoRaw = rowImg.dataUrl;
                }
            }

            const altImages = {
                A: imgA,
                B: imgB,
                C: imgC,
                D: imgD
            };

            const { isDiscursive, options } = parseAlternatives(alternativasRaw, altImages);

            const qObj = {
                id: `gs_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
                questionNumber: qNum || `Q${questions.length + 1}`,
                question: enunciado || qNum,
                answer: respostaRaw || '',
                imageUrl: formatImageUrl(imgEnunciadoRaw),
                difficulty: 'Média',
                isDiscursive,
                options: options.length > 0 ? options : undefined,
                optionImages: Object.values(altImages).some(Boolean) ? altImages : undefined
            };

            questions.push(qObj);
        }

        questions.taskTitle = detectedTaskTitle;
        return questions;
    }

    // Fallback: Formato tradicional de 4 colunas (Pergunta, Resposta, Imagem, Dificuldade)
    const firstVal = normalizeText(getCellValue(rows[0], 0));
    const startIndex = (firstVal === 'pergunta' || firstVal === 'questoes') ? 1 : 0;
    const questions = [];

    for (let r = startIndex; r < rows.length; r++) {
        const question = getCellValue(rows[r], 0);
        const answer = getCellValue(rows[r], 1);
        let imageRaw = getCellValue(rows[r], 2);
        const diffRaw = getCellValue(rows[r], 3);

        if (!question) continue;

        if (!imageRaw && rows[r]?.__rowImages?.length > 0) {
            imageRaw = rows[r].__rowImages[0].dataUrl;
        }

        questions.push({
            id: `gs_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            question,
            answer,
            imageUrl: formatImageUrl(imageRaw),
            difficulty: VALID_DIFFICULTIES.includes(diffRaw) ? diffRaw : 'Média'
        });
    }

    questions.taskTitle = detectedTaskTitle;
    return questions;
}

/**
 * Converte um Workbook XLSX em estrutura completa com todas as abas e questões pré-processadas,
 * extraindo imagens embutidas do zip e fórmulas.
 */
export async function parseWorkbook(workbook, arrayBuffer = null) {
    if (!workbook?.SheetNames || workbook.SheetNames.length === 0) {
        throw new Error('A planilha não contém nenhuma aba legível.');
    }

    let mediaAndDrawings = { mediaMap: {}, mediaList: [], cellImages: {}, rowImages: {} };
    if (arrayBuffer) {
        mediaAndDrawings = await extractXlsxMediaAndDrawings(arrayBuffer);
    }

    const sheetNames = workbook.SheetNames;
    const sheets = {};
    let defaultSheetName = null;

    for (const name of sheetNames) {
        const ws = workbook.Sheets[name];
        const rows = extractImagesAndFormulasFromWorksheet(ws, mediaAndDrawings);
        const questions = parseSpreadsheetRows(rows);
        sheets[name] = {
            name,
            taskTitle: questions.taskTitle || name,
            questions,
            count: questions.length,
            rawRows: rows
        };

        if (!defaultSheetName && questions.length > 0) {
            defaultSheetName = name;
        }
    }

    return {
        sheetNames,
        sheets,
        defaultSheetName: defaultSheetName || sheetNames[0]
    };
}

/**
 * Lê e parseia um arquivo Excel (.xlsx, .xls, .csv) a partir de um ArrayBuffer com imagens embutidas.
 */
export async function parseXlsxBuffer(buffer) {
    const workbook = XLSX.read(buffer, { type: 'array' });
    return parseWorkbook(workbook, buffer);
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

    const table = data?.table;
    const rows = table?.rows ?? [];
    const rawRows = [
        (table?.cols ?? []).map(column => column.label || column.id || ''),
        ...rows.map(row => (row.c ?? []).map(cell => cell?.v ?? cell?.f ?? ''))
    ];

    return {
        questions: rows.length > 0 ? parseSpreadsheetRows(rows) : [],
        rawRows: rawRows.filter(row => row.some(value => String(value ?? '').trim()))
    };
}

/**
 * Carrega a planilha completa com todas as abas (SheetNames) e dados processados.
 */
export async function fetchSpreadsheetWorkbook(sheetId, options = {}) {
    if (!sheetId) throw new Error('ID da planilha ou arquivo inválido.');

    let arrayBuffer = null;
    let lastError = null;

    // 1. Tentar primeiro via export direto do Google Sheets em XLSX
    try {
        const exportUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=xlsx`;
        const resp = await fetch(exportUrl, { mode: 'cors' });
        if (resp.ok) {
            arrayBuffer = await resp.arrayBuffer();
        } else if (resp.status === 401 || resp.status === 403) {
            throw new Error('PLANILHA_PRIVADA');
        }
    } catch (err) {
        if (err.message === 'PLANILHA_PRIVADA') throw err;
        lastError = err;
    }

    // 2. Se falhar, tentar via proxy local /api/drive-proxy
    if (!arrayBuffer) {
        try {
            const proxyUrl = `/api/drive-proxy?id=${sheetId}`;
            const resp = await fetch(proxyUrl);
            if (resp.ok) {
                arrayBuffer = await resp.arrayBuffer();
            } else if (resp.status === 401 || resp.status === 403) {
                throw new Error('PLANILHA_PRIVADA');
            }
        } catch (err) {
            if (err.message === 'PLANILHA_PRIVADA') throw err;
            lastError = err;
        }
    }

    // 3. Se ainda não obteve buffer, tentar GViz como recurso de compatibilidade
    if (!arrayBuffer) {
        try {
            const gvizUrl = buildGvizUrl(sheetId, options);
            const resp = await fetch(gvizUrl, { mode: 'cors' });
            if (resp.status === 401 || resp.status === 403) throw new Error('PLANILHA_PRIVADA');
            if (resp.ok) {
                const text = await resp.text();
                const { questions, rawRows } = parseGvizResponse(text);
                const defaultName = options.sheetName || 'Planilha Principal';
                return {
                    sheetNames: [defaultName],
                    sheets: {
                        [defaultName]: {
                            name: defaultName,
                            taskTitle: questions.taskTitle || defaultName,
                            questions,
                            count: questions.length,
                            rawRows
                        }
                    },
                    defaultSheetName: defaultName
                };
            }
        } catch (err) {
            if (err.message === 'PLANILHA_PRIVADA') throw err;
            lastError = err;
        }
    }

    if (!arrayBuffer) {
        const msg = String(lastError?.message || '');
        if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg === 'PLANILHA_PRIVADA') {
            throw new Error('PLANILHA_PRIVADA');
        }
        throw new Error(msg || 'Não foi possível ler a planilha. Verifique as permissões de compartilhamento.');
    }

    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    return parseWorkbook(workbook, arrayBuffer);
}

/**
 * Função de conveniência: busca as questões de uma aba específica.
 */
export async function fetchSheetQuestions(sheetId, options = {}) {
    const wbData = await fetchSpreadsheetWorkbook(sheetId, options);
    const targetName = options.sheetName || wbData.defaultSheetName;
    const sheet = wbData.sheets[targetName] || wbData.sheets[wbData.defaultSheetName];
    const questions = sheet?.questions || [];
    questions.taskTitle = sheet?.taskTitle;
    return questions;
}

/**
 * Parse da resposta JSONP do gviz/tq para alunos.
 */
function parseGvizStudentsResponse(rawText) {
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
        typeof firstVal === 'string' && (firstVal.trim().toLowerCase().includes('nome') || firstVal.trim().toLowerCase().includes('aluno')) ? 1 : 0;

    return rows
        .slice(startIndex)
        .map(row => {
            const cols = row.c ?? [];
            const name = String(cols[0]?.v ?? '').trim();
            const className = String(cols[1]?.v ?? '').trim() || 'Turma Única';
            const groupName = String(cols[2]?.v ?? '').trim();

            if (!name) return null;

            return {
                id: `st_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
                name,
                className,
                groupName
            };
        })
        .filter(Boolean);
}

/**
 * Busca e parseia alunos de uma aba específica do Google Sheets.
 */
export async function fetchSheetStudents(sheetId, options = {}) {
    if (!sheetId) throw new Error('ID da planilha inválido.');

    const url = buildGvizUrl(sheetId, { ...options, range: 'A:C' });

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
    return parseGvizStudentsResponse(text);
}
