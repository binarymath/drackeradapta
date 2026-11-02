import React from "react";
/**
 * Utilitário central para conversão de URLs de imagem em todo o sistema Drácker.
 * Converte automaticamente links compartilhados ou links diretos do Google Drive
 * para uma URL de visualização otimizada compatível com tags <img src="..."> sem bloqueio de Referer.
 */
export function toDirectImageUrl(url) {
    if (!url || typeof url !== 'string') return url;

    const trimmed = url.trim();
    if (!trimmed) return trimmed;

    if (trimmed.startsWith('data:')) {
        return trimmed;
    }

    // Se já estiver no formato novo de download/view do Google Drive
    if (trimmed.includes('drive.usercontent.google.com/download')) {
        return trimmed;
    }

    // Identificar e extrair o ID do arquivo Google Drive / Docs / Google Photos / lh3
    let fileId = null;

    // Padrão 1: /file/d/ID ou /d/ID ou /folders/ID
    const fileMatch = trimmed.match(/\/(?:file\/)?d\/([a-zA-Z0-9_-]{15,})/);
    if (fileMatch && fileMatch[1]) {
        fileId = fileMatch[1];
    } else {
        // Padrão 2: ?id=ID ou &id=ID em links do Google Drive
        const idMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]{15,})/);
        if (idMatch && idMatch[1]) {
            fileId = idMatch[1];
        } else if (trimmed.includes('lh3.googleusercontent.com/d/')) {
            // Padrão 3: formato lh3 antigo ou com parâmetros
            const lhMatch = trimmed.match(/lh3\.googleusercontent\.com\/d\/([a-zA-Z0-9_-]{15,})/);
            if (lhMatch && lhMatch[1]) {
                fileId = lhMatch[1];
            }
        }
    }

    if (fileId) {
        // O endpoint lh3.googleusercontent.com funciona com CORS, sem bloqueios CORP e sem bloqueio de Referer no navegador
        return `https://lh3.googleusercontent.com/d/${fileId}=w1000`;
    }

    return trimmed;
}

export const getDirectImageUrl = toDirectImageUrl;

/**
 * Handler de fallback em caso de erro no carregamento da imagem (`onError`).
 * Alterna entre os 3 endpoints conhecidos do Google Drive para garantir a exibição no navegador.
 */
const FALLBACK_IMAGE_SRC = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMTUwIiB2aWV3Qm94PSIwIDAgMjAwIDE1MCI+CiAgICA8cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgZmlsbD0iI2Y4NzE3MSIgcng9IjEyIiAvPgogICAgPHRleHQgeD0iMTAwIiB5PSI3MCIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LXdlaWdodD0iYm9sZCI+TGluayBRdWVicmFkbyBvdSBQcml2YWRvPC90ZXh0PgogICAgPHRleHQgeD0iMTAwIiB5PSI5NSIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTAiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5WZXJpZmlxdWUgbyBsaW5rIGRhIGltYWdlbTwvdGV4dD4KPC9zdmc+Cg==';

export function handleDriveImageError(e) {
    if (!e || !e.target) return;
    const currentSrc = e.target.src || '';
    
    // Se a imagem falhar e já for o fallback, não faça nada para evitar loop
    if (currentSrc.includes('data:image/svg+xml')) return;

    if (!currentSrc.includes('google.com') && !currentSrc.includes('googleusercontent.com')) {
        e.target.src = FALLBACK_IMAGE_SRC;
        return;
    }

    let fileId = null;
    const idMatch = currentSrc.match(/[?&]id=([a-zA-Z0-9_-]{15,})/);
    const dMatch = currentSrc.match(/\/d\/([a-zA-Z0-9_-]{15,})/);
    if (idMatch && idMatch[1]) fileId = idMatch[1];
    else if (dMatch && dMatch[1]) fileId = dMatch[1];

    if (!fileId) {
        e.target.src = FALLBACK_IMAGE_SRC;
        return;
    }

    const attempt = parseInt(e.target.dataset.driveAttempt || '1', 10);
    if (attempt === 1) {
        e.target.dataset.driveAttempt = '2';
        e.target.src = `https://lh3.googleusercontent.com/d/${fileId}`;
    } else if (attempt === 2) {
        e.target.dataset.driveAttempt = '3';
        e.target.src = `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;
    } else {
        e.target.src = FALLBACK_IMAGE_SRC;
    }
}

/**
 * Verifica se a URL é do YouTube.
 */
export function isYouTubeUrl(url) {
    if (!url || typeof url !== 'string') return false;
    return /youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=)/.test(url);
}

/**
 * Extrai o ID do vídeo do YouTube.
 */
export function getYouTubeVideoId(url) {
    if (!url || typeof url !== 'string') return null;
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    return match ? match[1] : null;
}

/**
 * Converte um link do YouTube em um link de embed.
 */
export function getYouTubeEmbedUrl(url) {
    const videoId = getYouTubeVideoId(url);
    if (videoId) {
        return `https://www.youtube.com/embed/${videoId}?rel=0`;
    }
    return url;
}

/**
 * Detecta se o texto contém tags de mídia inline ([IMG], [YT], [VIDEO], etc.)
 */
export function hasInlineMedia(text) {
    if (!text || typeof text !== 'string') return false;
    return /\[(?:img|yt|video)/i.test(text);
}

/**
 * Extrai lista de URLs de imagens/vídeos de uma fonte que pode ser string com quebras/vírgulas, array ou JSON.
 */
export function extractMediaUrls(source) {
    if (!source) return [];
    if (Array.isArray(source)) return source.filter(Boolean);
    const str = String(source).trim();
    if (!str || str === '-' || str === '—') return [];
    if (str.startsWith('[') && str.endsWith(']')) {
        try {
            const parsed = JSON.parse(str);
            if (Array.isArray(parsed)) return parsed.filter(Boolean);
        } catch (e) {}
    }
    if (str.includes('\n')) {
        return str.split('\n').map(s => s.trim()).filter(Boolean);
    }
    if (str.includes(',') && !str.startsWith('data:')) {
        return str.split(',').map(s => s.trim()).filter(Boolean);
    }
    return [str];
}

/**
 * Normaliza quebras de linha antes de tags de fechamento de trechos, garantindo que
 * seleções com quebra de linha (ex: "[TAM=60]Fonte: ...\n[/TAM]") não sejam quebradas incorretamente
 * ao renderizar linhas.
 */
export function normalizeSnippetTags(text) {
    if (!text || typeof text !== 'string') return text;
    return text.replace(/(\r?\n)+(\[\/(?:tam|size|grande|big|gigante|huge|pequeno|small|muito_pequeno|tiny|\+[1-5]|\-[1-5]|b)\])/gi, '$2$1');
}

/**
 * Renderiza trechos com tamanhos customizados:
 * - [TAM=150]texto[/TAM] ou [SIZE=150]texto[/SIZE] (escala em porcentagem ou px)
 * - [GRANDE]texto[/GRANDE] (+40%)
 * - [GIGANTE]texto[/GIGANTE] (+80%)
 * - [PEQUENO]texto[/PEQUENO] (-25%)
 * - [MUITO_PEQUENO]texto[/MUITO_PEQUENO] (-40%)
 * - [+1] a [+5] (+25% por nível)
 * - [-1] a [-3] (-18% por nível)
 * - [B]texto[/B] (negrito de destaque)
 */
export function renderTextWithSnippetSizes(text) {
    if (!text || typeof text !== 'string') return text;

    // Normalizar caso haja quebra de linha antes do fechamento
    let processed = normalizeSnippetTags(text);

    // Regex unificada e resiliente:
    // Grupo 1: Nome da tag (tam, size, grande, b, +1, etc.)
    // Grupo 2: Valor opcional (=60, =150)
    // Grupo 3: Conteúdo (com tag de fechamento explícita [/tag] ou fechamento implícito antes do próximo [ ou fim de linha/texto)
    const tagRegex = /\[(tam|size|grande|big|gigante|huge|pequeno|small|muito_pequeno|tiny|\+[1-5]|\-[1-5]|b)(?:=([a-zA-Z0-9%]+))?\]([\s\S]*?)(?:\[\/\1\]|(?=\[|\n|$))/gi;

    if (!tagRegex.test(processed)) {
        // Remove quaisquer tags de fechamento órfãs residuais
        return processed.replace(/\[\/(?:tam|size|grande|big|gigante|huge|pequeno|small|muito_pequeno|tiny|\+[1-5]|\-[1-5]|b)\]/gi, '');
    }
    tagRegex.lastIndex = 0;

    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = tagRegex.exec(processed)) !== null) {
        if (match.index > lastIndex) {
            const leadingText = processed.substring(lastIndex, match.index)
                .replace(/\[\/(?:tam|size|grande|big|gigante|huge|pequeno|small|muito_pequeno|tiny|\+[1-5]|\-[1-5]|b)\]/gi, '');
            if (leadingText) {
                parts.push(leadingText);
            }
        }

        const rawTag = (match[1] || '').toLowerCase();
        const rawVal = match[2];
        const content = match[3] || '';

        let scalePercent = 100;
        let isBold = false;

        if (rawTag === 'tam' || rawTag === 'size') {
            scalePercent = parseInt(rawVal, 10) || 100;
        } else if (rawTag === 'grande' || rawTag === 'big') {
            scalePercent = 140;
        } else if (rawTag === 'gigante' || rawTag === 'huge') {
            scalePercent = 180;
        } else if (rawTag === 'pequeno' || rawTag === 'small') {
            scalePercent = 75;
        } else if (rawTag === 'muito_pequeno' || rawTag === 'tiny') {
            scalePercent = 60;
        } else if (rawTag.startsWith('+')) {
            const n = parseInt(rawTag.slice(1), 10) || 1;
            scalePercent = 100 + (n * 25);
        } else if (rawTag.startsWith('-')) {
            const n = parseInt(rawTag.slice(1), 10) || 1;
            scalePercent = Math.max(30, 100 - (n * 18));
        } else if (rawTag === 'b') {
            isBold = true;
        }

        parts.push(
            React.createElement('span', {
                key: `snippet-size-${match.index}`,
                style: {
                    fontSize: isBold && scalePercent === 100 ? undefined : `${scalePercent}%`,
                    fontWeight: isBold ? '900' : 'inherit',
                    lineHeight: 'normal',
                    display: 'inline'
                },
                className: 'inline transition-all font-inherit'
            }, renderTextWithSnippetSizes(content))
        );

        lastIndex = tagRegex.lastIndex;
    }

    if (lastIndex < processed.length) {
        const trailingText = processed.substring(lastIndex)
            .replace(/\[\/(?:tam|size|grande|big|gigante|huge|pequeno|small|muito_pequeno|tiny|\+[1-5]|\-[1-5]|b)\]/gi, '');
        if (trailingText) {
            parts.push(trailingText);
        }
    }

    return parts;
}

/**
 * Renderiza o texto da pergunta, substituindo:
 * 1) [img]URL[/img], [yt]URL[/yt], [video]URL[/video] (com ou sem tamanho [img=300]...[/img])
 * 2) [IMG: URL], [YT: URL], [VIDEO: URL] (com ou sem tamanho [IMG=300: URL])
 * 3) [IMG], [IMG1], [IMG2], [YT], [YT1], [VIDEO] (com ou sem tamanho [IMG=300])
 * 4) Trechos com tamanhos customizados: [TAM=150]...[/TAM], [GRANDE], [PEQUENO], etc.
 * por elementos de mídia inline e estilizações escalonadas.
 */
export function renderQuestionText(text, defaultImageUrl = null) {
    if (!text) return null;
    
    const mediaList = extractMediaUrls(defaultImageUrl);
    let standaloneCounter = 0;

    // Regex para encontrar mídias
    const regex = /\[(img|yt|video)(?:=([a-zA-Z0-9%]+))?\](.*?)\[\/\1\]|\[(img|yt|video)(?:=([a-zA-Z0-9%]+))?:\s*([^\]]+)\]|\[(img|yt|video)(\d+)?(?:=([a-zA-Z0-9%]+))?\]/gi;
    
    if (!regex.test(text)) {
        return renderTextWithSnippetSizes(text);
    }
    regex.lastIndex = 0;

    const parts = [];
    let lastIndex = 0;
    
    let match;
    while ((match = regex.exec(text)) !== null) {
        if (match.index > lastIndex) {
            parts.push(renderTextWithSnippetSizes(text.substring(lastIndex, match.index)));
        }
        
        let tagType = '';
        let sizeStr = null;
        let urlToRender = null;
        
        if (match[1]) {
            // [img=300]url[/img]
            tagType = match[1].toLowerCase();
            sizeStr = match[2];
            urlToRender = match[3]?.trim();
        } else if (match[4]) {
            // [IMG=300: url]
            tagType = match[4].toLowerCase();
            sizeStr = match[5];
            urlToRender = match[6]?.trim();
        } else if (match[7]) {
            // [IMG], [IMG1], [IMG=300], [YT], [VIDEO]
            tagType = match[7].toLowerCase();
            const indexStr = match[8];
            sizeStr = match[9];

            if (indexStr) {
                const targetIdx = parseInt(indexStr, 10) - 1;
                urlToRender = mediaList[targetIdx] || mediaList[0] || null;
            } else {
                urlToRender = mediaList[standaloneCounter] || mediaList[0] || null;
                standaloneCounter++;
            }
        }

        let inlineStyle = {};
        let className = "rounded-xl border-2 border-slate-200 shadow-sm object-contain my-2 mx-auto inline-block align-middle";
        
        if (sizeStr) {
            let width = sizeStr;
            let height = 'auto';
            if (sizeStr.includes('x')) {
                const partsStr = sizeStr.split('x');
                width = partsStr[0];
                height = partsStr[1] || 'auto';
            }
            if (!isNaN(width)) width += 'px';
            if (!isNaN(height) && height !== 'auto') height += 'px';
            
            inlineStyle = { width, height, maxHeight: 'none' };
        } else {
            // Default size
            className += " max-h-64 sm:max-h-80";
        }
        
        if (urlToRender) {
            const isVideo = isYouTubeUrl(urlToRender) || tagType === 'yt' || tagType === 'video';
            if (isVideo) {
                parts.push(
                    React.createElement('iframe', {
                        key: `media-${match.index}`,
                        src: getYouTubeEmbedUrl(urlToRender),
                        allow: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture",
                        allowFullScreen: true,
                        className: "rounded-xl border-2 border-slate-200 shadow-sm aspect-video w-full max-w-2xl my-3 mx-auto block",
                        style: inlineStyle
                    })
                );
            } else {
                parts.push(
                    React.createElement('img', {
                        key: `media-${match.index}`,
                        src: toDirectImageUrl(urlToRender),
                        alt: "Mídia da questão",
                        className: className,
                        style: inlineStyle,
                        referrerPolicy: "no-referrer",
                        onError: urlToRender.startsWith('data:') ? undefined : handleDriveImageError
                    })
                );
            }
        } else {
            // Se usou [IMG] mas não tem nenhuma URL correspondente
            parts.push(match[0]);
        }
        
        lastIndex = regex.lastIndex;
    }
    
    if (lastIndex < text.length) {
        parts.push(renderTextWithSnippetSizes(text.substring(lastIndex)));
    }
    
    return parts;
}

/**
 * Retorna uma chave identificadora única e estável para uma questão.
 * Usado para isolar configurações individuais (tamanho de fonte, alinhamento, edições)
 * garantindo que a alteração ou ajuste de uma pergunta nunca afete outra.
 */
export function getQuestionKey(q) {
    if (!q) return 'default';
    if (q.questionId) return String(q.questionId);
    const tab = q.tabOrigin ? `${q.tabOrigin}_` : '';
    if (q.questionNumber) return `${tab}qn_${q.questionNumber}`;
    if (q.id && q.id !== 'todos_respondem' && q.id !== 'simultaneous' && !q.isGroup && (!q.name || q.isQuestionOnly)) {
        return `${tab}id_${q.id}`;
    }
    if (q.question) return `${tab}txt_${String(q.question).trim().slice(0, 80)}`;
    return 'default';
}


