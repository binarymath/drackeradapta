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
 * Renderiza o texto da pergunta, substituindo [img]URL[/img], [IMG] e [yt]URL[/yt] por mídia inline.
 */
export function renderQuestionText(text, defaultImageUrl = null) {
    if (!text) return null;
    
    // Regex para encontrar [img]...[/img], [IMG], [IMG=300], [IMG=300x200]
    // Também suporta [yt]...[/yt] e [video]...[/video]
    const regex = /\[(?:img|yt|video)(?:=([a-zA-Z0-9%]+))?\](.*?)\[\/(?:img|yt|video)\]|\[IMG(?:=([a-zA-Z0-9%]+))?\]/gi;
    const parts = [];
    let lastIndex = 0;
    
    let match;
    while ((match = regex.exec(text)) !== null) {
        if (match.index > lastIndex) {
            parts.push(text.substring(lastIndex, match.index));
        }
        
        let urlToRender = null;
        let isStandalone = false;
        
        if (match[0].toLowerCase().includes('[/img]')) {
            urlToRender = match[2]?.trim();
        } else {
            isStandalone = true;
            urlToRender = defaultImageUrl;
        }

        let sizeStr = match[1] || match[3];
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
            className += " max-h-64";
        }
        
        if (urlToRender) {
            if (isYouTubeUrl(urlToRender) || match[0].toLowerCase().startsWith('[yt') || match[0].toLowerCase().startsWith('[video')) {
                parts.push(
                    React.createElement('iframe', {
                        key: match.index,
                        src: getYouTubeEmbedUrl(urlToRender),
                        allowFullScreen: true,
                        className: "rounded-xl border-2 border-slate-200 shadow-sm aspect-video w-full max-w-2xl my-4 mx-auto block",
                        style: inlineStyle
                    })
                );
            } else {
                parts.push(
                    React.createElement('img', {
                        key: match.index,
                        src: toDirectImageUrl(urlToRender),
                        alt: "",
                        className: className,
                        style: inlineStyle,
                        referrerPolicy: "no-referrer",
                        onError: handleDriveImageError
                    })
                );
            }
        } else {
            // Se usou [IMG] mas não tem defaultImageUrl
            parts.push(match[0]);
        }
        
        lastIndex = regex.lastIndex;
    }
    
    if (lastIndex < text.length) {
        parts.push(text.substring(lastIndex));
    }
    
    return parts;
}

