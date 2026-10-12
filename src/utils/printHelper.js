/**
 * printHelper.js – Utilitário de alta performance para impressão de atividades.
 *
 * Em vez de executar window.print() sobre a aplicação inteira (que possui milhares
 * de nós DOM, modais, chat, player de áudio e menus laterais), este utilitário isola
 * apenas o conteúdo da folha (#activity-area-print) em um iframe limpo e invisível.
 *
 * Isso reduz o tempo de preparação do diálogo de impressão do navegador de vários
 * segundos para menos de 150ms.
 */

import { toast } from '../components/ui/Toast';

export const fastPrintElement = (elementOrId = 'activity-area-print', options = {}) => {
    const element = typeof elementOrId === 'string' ? document.getElementById(elementOrId) : elementOrId;
    if (!element) {
        console.warn('[fastPrintElement] Elemento não encontrado, recorrendo à impressão da janela');
        window.print();
        return;
    }

    // Feedback imediato para o usuário
    toast('Preparando folha de impressão...');

    try {
        // Remove iframe anterior se ainda existir
        const existingFrame = document.getElementById('dracker-fast-print-frame');
        if (existingFrame) existingFrame.remove();

        const iframe = document.createElement('iframe');
        iframe.id = 'dracker-fast-print-frame';
        iframe.setAttribute('aria-hidden', 'true');
        iframe.style.position = 'fixed';
        iframe.style.right = '0';
        iframe.style.bottom = '0';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = '0';
        iframe.style.opacity = '0';
        iframe.style.pointerEvents = 'none';
        iframe.style.zIndex = '-9999';

        document.body.appendChild(iframe);

        const doc = iframe.contentWindow?.document;
        if (!doc) {
            window.print();
            return;
        }

        // Coleta estilos ativos da página (Tailwind, fontes, estilos inline)
        const styleNodes = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'));
        const stylesHtml = styleNodes.map(node => node.outerHTML).join('\n');

        // Clona o conteúdo do elemento removendo elementos que tenham a classe .no-print
        const clone = element.cloneNode(true);
        const noPrintElements = clone.querySelectorAll('.no-print, [data-no-print]');
        noPrintElements.forEach(el => el.remove());

        const pageTitle = options.title || document.title || 'Folha de Atividade - Drácker';

        doc.open();
        doc.write(`
            <!DOCTYPE html>
            <html lang="pt-BR">
            <head>
                <meta charset="UTF-8">
                <title>${pageTitle}</title>
                ${stylesHtml}
                <style>
                    @page {
                        margin: 1.2cm;
                        size: A4 portrait;
                    }
                    *, *::before, *::after {
                        box-sizing: border-box;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    html, body {
                        margin: 0 !important;
                        padding: 0 !important;
                        background: #ffffff !important;
                        color: #1a1a1a !important;
                        width: 100% !important;
                        min-height: auto !important;
                        overflow: visible !important;
                        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                    }
                    .no-print, [data-no-print] {
                        display: none !important;
                    }
                    /* Remove gargalos visuais desnecessários na impressão */
                    * {
                        box-shadow: none !important;
                        text-shadow: none !important;
                        animation: none !important;
                        transition: none !important;
                    }
                    img {
                        max-width: 100%;
                    }
                    .print-fast-wrapper {
                        width: 100%;
                        background: white;
                    }
                    .page-break {
                        break-before: page !important;
                        page-break-before: always !important;
                    }
                </style>
            </head>
            <body>
                <div class="print-fast-wrapper">
                    ${clone.innerHTML}
                </div>
            </body>
            </html>
        `);
        doc.close();

        const triggerPrint = () => {
            setTimeout(() => {
                try {
                    iframe.contentWindow?.focus();
                    iframe.contentWindow?.print();
                } catch (e) {
                    console.warn('[fastPrintElement] Erro ao disparar print no iframe:', e);
                    window.print();
                } finally {
                    // Limpeza do iframe após a impressão
                    setTimeout(() => {
                        iframe.remove();
                    }, 3000);
                }
            }, 60);
        };

        // Garante que imagens estejam carregadas antes de acionar a impressão
        const images = Array.from(doc.images || []);
        if (images.length > 0) {
            let loaded = 0;
            const onDone = () => {
                loaded++;
                if (loaded >= images.length) triggerPrint();
            };
            images.forEach(img => {
                if (img.complete) {
                    onDone();
                } else {
                    img.onload = onDone;
                    img.onerror = onDone;
                }
            });
            // Timeout de segurança caso alguma imagem remota demore para responder
            setTimeout(triggerPrint, 350);
        } else {
            triggerPrint();
        }

    } catch (err) {
        console.warn('[fastPrintElement] Falha na impressão isolada, recorrendo à padrão:', err);
        window.print();
    }
};
