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
        // O endpoint drive.usercontent.google.com/download?id=ID&export=view funciona com CORS e sem bloqueio de Referer no navegador
        return `https://drive.usercontent.google.com/download?id=${fileId}&export=view`;
    }

    return trimmed;
}

export const getDirectImageUrl = toDirectImageUrl;

/**
 * Handler de fallback em caso de erro no carregamento da imagem (`onError`).
 * Alterna entre os 3 endpoints conhecidos do Google Drive para garantir a exibição no navegador.
 */
export function handleDriveImageError(e) {
    if (!e || !e.target) return;
    const currentSrc = e.target.src || '';
    if (!currentSrc.includes('google.com') && !currentSrc.includes('googleusercontent.com')) {
        e.target.style.display = 'none';
        if (e.target.nextSibling && e.target.nextSibling.style) {
            e.target.nextSibling.style.display = 'flex';
        }
        return;
    }

    let fileId = null;
    const idMatch = currentSrc.match(/[?&]id=([a-zA-Z0-9_-]{15,})/);
    const dMatch = currentSrc.match(/\/d\/([a-zA-Z0-9_-]{15,})/);
    if (idMatch && idMatch[1]) fileId = idMatch[1];
    else if (dMatch && dMatch[1]) fileId = dMatch[1];

    if (!fileId) {
        e.target.style.display = 'none';
        if (e.target.nextSibling && e.target.nextSibling.style) {
            e.target.nextSibling.style.display = 'flex';
        }
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
        e.target.style.display = 'none';
        if (e.target.nextSibling && e.target.nextSibling.style) {
            e.target.nextSibling.style.display = 'flex';
        }
    }
}
