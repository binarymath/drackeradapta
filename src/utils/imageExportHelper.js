/**
 * imageExportHelper.js – Motor de exportação de imagens em alta resolução (PNG)
 * 
 * Permite salvar cards colecionáveis individuais ou conjuntos em formato PNG cristalino (3x / 300 DPI),
 * ideal para impressão fotográfica, envio no WhatsApp e uso em redes sociais.
 */

import { toast } from '../components/ui/Toast';

/**
 * Exporta qualquer elemento DOM para um arquivo PNG em alta resolução.
 * 
 * @param {HTMLElement|string} elementOrId - Elemento DOM ou ID do elemento
 * @param {string} filename - Nome do arquivo desejado
 * @param {Object} options - Opções adicionais (scale, backgroundColor, etc.)
 */
export const exportElementToPng = async (elementOrId, filename = 'card', options = {}) => {
    const rawElement = typeof elementOrId === 'string' ? document.getElementById(elementOrId) : elementOrId;
    if (!rawElement) {
        toast('Erro: Card não encontrado para gerar imagem.');
        return;
    }

    const safeTitle = (filename || 'card')
        .replace(/[/\\?%*:|"<>]/g, '-')
        .replace(/\s+/g, '_')
        .trim();
    const cleanFilename = safeTitle.toLowerCase().endsWith('.png') ? safeTitle : `${safeTitle}.png`;

    toast('Gerando imagem PNG em alta resolução...');

    try {
        // Aguarda carregamento de imagens internas
        const images = Array.from(rawElement.querySelectorAll('img'));
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

        await new Promise(resolve => setTimeout(resolve, 60));

        const html2canvas = (await import('html2canvas')).default || (await import('html2canvas'));

        // Escala padrão 3x para nitidez 300 DPI cristalina
        const scale = options.scale || 3;

        const canvas = await html2canvas(rawElement, {
            scale: scale,
            useCORS: true,
            logging: false,
            backgroundColor: options.backgroundColor !== undefined ? options.backgroundColor : null, // transparente por padrão
            scrollX: 0,
            scrollY: 0
        });

        // Cria o link de download
        const dataUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = cleanFilename;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast('Imagem PNG salva com sucesso!');
    } catch (err) {
        console.error('[exportElementToPng] Erro ao salvar PNG:', err);
        toast('Erro ao gerar imagem PNG. Tente novamente.');
    }
};
