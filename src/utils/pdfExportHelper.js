/**
 * pdfExportHelper.js – Motor de exportação de PDF de alta fidelidade visual (WYSIWYG)
 *
 * Gera o PDF EXATAMENTE como o usuário vê na tela (mantendo grid, cores, bordas,
 * proporções e estilos originais), enquanto utiliza fatiamento inteligente de páginas
 * no canvas para garantir que NENHUM card de questão ou seção seja cortado ao meio.
 */

import { toast } from '../components/ui/Toast';

export const exportTradingCardsToPdf = async (rawElement, tradingCardsTarget, filename = 'cards', options = {}) => {
    const safeTitle = (filename || 'cards')
        .replace(/[/\\?%*:|"<>]/g, '-')
        .replace(/\s+/g, '_')
        .trim();
    const cleanFilename = safeTitle.toLowerCase().endsWith('.pdf') ? safeTitle : `${safeTitle}.pdf`;

    toast('Gerando PDF dos cards em alta resolução, aguarde...');

    try {
        rawElement.classList?.add('pdf-capture-mode');
        if (options.extraClass) {
            rawElement.classList?.add(options.extraClass);
        }

        // Aguarda renderização estável
        await new Promise(resolve => setTimeout(resolve, 80));

        const pageNodes = Array.from(tradingCardsTarget.querySelectorAll('.trading-card-print-page'));
        if (pageNodes.length === 0) {
            toast('Nenhum card selecionado para gerar PDF.');
            return;
        }

        // Aguarda carregamento de todas as imagens nos cards
        const images = Array.from(tradingCardsTarget.querySelectorAll('img'));
        if (images.length > 0) {
            await Promise.all(images.map(img => {
                if (img.complete) return Promise.resolve();
                return new Promise(resolve => {
                    img.onload = resolve;
                    img.onerror = resolve;
                    setTimeout(resolve, 350);
                });
            }));
        }

        await new Promise(resolve => setTimeout(resolve, 100));

        const html2canvas = (await import('html2canvas')).default || (await import('html2canvas'));
        const { jsPDF } = await import('jspdf');

        const pdf = new jsPDF({
            unit: 'mm',
            format: 'a4',
            orientation: 'portrait'
        });

        // Captura cada folha A4 individualmente garantindo fidelidade 100% sem cortes
        for (let i = 0; i < pageNodes.length; i++) {
            const pageEl = pageNodes[i];
            const canvas = await html2canvas(pageEl, {
                scale: 2, // 2x para nitidez cristalina
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff',
                width: 800,
                windowWidth: 800
            });

            const imgData = canvas.toDataURL('image/jpeg', 0.98);
            if (i > 0) {
                pdf.addPage('a4', 'portrait');
            }
            pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
        }

        pdf.save(cleanFilename);
        toast('PDF de cards baixado com sucesso!');
    } catch (err) {
        console.error('[exportTradingCardsToPdf] Erro:', err);
        toast('Erro ao gerar PDF dos cards. Tente novamente.');
    } finally {
        rawElement.classList?.remove('pdf-capture-mode');
        if (options.extraClass) {
            rawElement.classList?.remove(options.extraClass);
        }
    }
};

export const exportActivityToPdf = async (elementOrId = 'activity-area-print', filename = 'atividade', options = {}) => {
    const rawElement = typeof elementOrId === 'string' ? document.getElementById(elementOrId) : elementOrId;
    if (!rawElement) {
        toast('Erro: Conteúdo não encontrado para gerar PDF.');
        return;
    }

    // Caso especial: Trading Cards (Páginas discretas A4 com 4 cards por página)
    const tradingCardsTarget = rawElement.classList?.contains('trading-cards-print-target')
        ? rawElement
        : rawElement.querySelector?.('.trading-cards-print-target');

    if (tradingCardsTarget) {
        return await exportTradingCardsToPdf(rawElement, tradingCardsTarget, filename, options);
    }

    // Se houver um container interno formatado (como .qp-wrap ou .dracker-print-wrap), usamos como alvo direto de alta fidelidade
    const element = rawElement.querySelector?.('.qp-wrap') || 
                    rawElement.querySelector?.('.dracker-print-wrap') || 
                    rawElement;

    // Sanitiza nome do arquivo
    const safeTitle = (filename || 'atividade')
        .replace(/[/\\?%*:|"<>]/g, '-')
        .replace(/\s+/g, '_')
        .trim();
    const cleanFilename = safeTitle.toLowerCase().endsWith('.pdf') ? safeTitle : `${safeTitle}.pdf`;

    toast('Gerando PDF fiel à tela, aguarde...');

    try {
        // Marca modo de exportação para ocultar apenas botões e barras de controle (.no-print)
        rawElement.classList?.add('pdf-capture-mode');
        if (options.extraClass) {
            rawElement.classList?.add(options.extraClass);
        }

        // Aguarda todas as imagens dentro do elemento terminarem de carregar
        const images = Array.from(element.querySelectorAll('img'));
        if (images.length > 0) {
            await Promise.all(images.map(img => {
                if (img.complete) return Promise.resolve();
                return new Promise(resolve => {
                    img.onload = resolve;
                    img.onerror = resolve;
                    setTimeout(resolve, 400);
                });
            }));
        }

        // Breve pausa para garantir renderização estável
        await new Promise(resolve => setTimeout(resolve, 100));

        // Normaliza largura para padrão A4 proporcional (800px) durante a captura
        // Isso impede que monitores widescreen (1200px-1920px) encolham fontes, cards e grades ao converter para 194mm
        const prevWidth = element.style.width;
        const prevMaxWidth = element.style.maxWidth;
        const prevMargin = element.style.margin;
        const prevBoxSizing = element.style.boxSizing;

        element.style.width = '800px';
        element.style.maxWidth = '800px';
        element.style.margin = '0 auto';
        element.style.boxSizing = 'border-box';

        // Carrega dinamicamente html2canvas e jsPDF
        const html2canvas = (await import('html2canvas')).default || (await import('html2canvas'));
        const { jsPDF } = await import('jspdf');

        // Captura o elemento exatamente nas proporções A4 ideais
        const canvas = await html2canvas(element, {
            scale: 2, // 2x para nitidez cristalina
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff',
            scrollY: 0,
            width: 800,
            windowWidth: 800,
            onclone: (clonedDoc) => {
                // Garante que nenhum texto seja cortado nas bordas durante a renderização no canvas
                const targetWrap = clonedDoc.querySelector('.dracker-print-wrap') || clonedDoc.querySelector('.qp-wrap') || clonedDoc.body;
                if (targetWrap) {
                    targetWrap.querySelectorAll('p').forEach(p => {
                        p.style.textAlign = 'left';
                        p.style.wordBreak = 'break-word';
                        p.style.overflowWrap = 'break-word';
                    });
                }
            }
        });

        // =========================================================================
        // FATIAMENTO INTELIGENTE ANTI-CORTE DE CARDS (WYSIWYG CANVAS SLICING)
        // =========================================================================
        const elemRect = element.getBoundingClientRect();
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        const scale = canvasWidth / elemRect.width;

        // Mapeia as posições verticais (topo e base) de todos os cards e blocos indivisíveis
        const cardSelectors = '.dracker-print-card, .qp-card, .quiz-card, .card, #lyrics-card, #questions-card, .crossword-card, .crossword-section, .domino-piece, .break-inside-avoid, [data-avoid-break]';
        const cardNodes = Array.from(element.querySelectorAll(cardSelectors));

        const cardIntervals = cardNodes.map(node => {
            const rect = node.getBoundingClientRect();
            return {
                top: Math.round((rect.top - elemRect.top) * scale),
                bottom: Math.round((rect.bottom - elemRect.top) * scale)
            };
        }).sort((a, b) => a.top - b.top);

        // Mapeia posições de quebra forçada explícita de página
        const breakNodes = Array.from(element.querySelectorAll('.dracker-page-break, .html2pdf__page-break, [data-page-break="true"]'));
        const forcedBreaks = breakNodes.map(node => {
            const rect = node.getBoundingClientRect();
            return Math.round((rect.top - elemRect.top) * scale);
        }).filter(y => y > 0).sort((a, b) => a - b);

        // Dimensões A4 em milímetros (210mm x 297mm)
        const PAGE_MARGIN_HORIZONTAL_MM = 8;
        const PAGE_MARGIN_VERTICAL_MM = 10;
        const PRINTABLE_WIDTH_MM = 210 - (PAGE_MARGIN_HORIZONTAL_MM * 2); // 194mm
        const PRINTABLE_HEIGHT_MM = 297 - (PAGE_MARGIN_VERTICAL_MM * 2); // 277mm

        // Altura máxima proporcional de uma página A4 em pixels do canvas
        // Margem de segurança de ~95% para margens de respiro perfeitas
        const maxCanvasPageHeight = Math.floor(canvasWidth * (PRINTABLE_HEIGHT_MM / PRINTABLE_WIDTH_MM) * 0.95);

        // Calcula os pontos de corte onde as páginas devem ser divididas
        const slices = [];
        let currentY = 0;

        while (currentY < canvasHeight) {
            let idealCutY = currentY + maxCanvasPageHeight;

            if (idealCutY >= canvasHeight) {
                // Última fatia até o final
                slices.push({ top: currentY, bottom: canvasHeight });
                break;
            }

            // 1. Verifica se há uma quebra forçada explícita antes do limite da página
            const nextForcedBreak = forcedBreaks.find(bY => bY > currentY + 100 && bY <= idealCutY);
            if (nextForcedBreak) {
                idealCutY = nextForcedBreak;
            } else {
                // 2. Verifica se algum card é atravessado por este ponto de corte
                const intersectingCards = cardIntervals.filter(c => c.top < idealCutY && c.bottom > idealCutY);

                if (intersectingCards.length > 0) {
                    // Encontra o topo mais alto entre todos os cards cortados
                    const earliestTop = Math.min(...intersectingCards.map(c => c.top));

                    // Corta no espaço em branco acima da linha de cards (com folga de 6px)
                    const safeCutY = earliestTop - 6;

                    // Garante que a fatia faça progresso (mínimo de 150px)
                    if (safeCutY > currentY + 150) {
                        idealCutY = safeCutY;
                    }
                }
            }

            slices.push({ top: currentY, bottom: idealCutY });
            currentY = idealCutY;
        }

        // =========================================================================
        // CRIAÇÃO DO DOCUMENTO PDF MULTIPÁGINA
        // =========================================================================
        const pdf = new jsPDF({
            unit: 'mm',
            format: 'a4',
            orientation: 'portrait'
        });

        for (let i = 0; i < slices.length; i++) {
            const slice = slices[i];
            const sliceHeight = slice.bottom - slice.top;
            if (sliceHeight <= 0) continue;

            // Recorta a fatia exata do canvas
            const pageCanvas = document.createElement('canvas');
            pageCanvas.width = canvasWidth;
            pageCanvas.height = sliceHeight;
            const ctx = pageCanvas.getContext('2d');

            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);

            ctx.drawImage(
                canvas,
                0, slice.top, canvasWidth, sliceHeight,
                0, 0, canvasWidth, sliceHeight
            );

            const imgData = pageCanvas.toDataURL('image/jpeg', 0.97);
            const contentHeightMm = PRINTABLE_WIDTH_MM * (sliceHeight / canvasWidth);

            if (i > 0) {
                pdf.addPage('a4', 'portrait');
            }

            pdf.addImage(imgData, 'JPEG', PAGE_MARGIN_HORIZONTAL_MM, PAGE_MARGIN_VERTICAL_MM, PRINTABLE_WIDTH_MM, contentHeightMm);
        }

        pdf.save(cleanFilename);
        toast('PDF baixado com sucesso!');
    } catch (err) {
        console.error('[exportActivityToPdf] Erro:', err);
        toast('Erro ao gerar PDF. Tente novamente.');
    } finally {
        element.style.width = prevWidth;
        element.style.maxWidth = prevMaxWidth;
        element.style.margin = prevMargin;
        element.style.boxSizing = prevBoxSizing;
        rawElement.classList.remove('pdf-capture-mode');
        if (options.extraClass) {
            rawElement.classList.remove(options.extraClass);
        }
    }
};
