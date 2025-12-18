export class ExportService {
    /**
     * Exporta a atividade para PDF usando a função nativa de impressão do navegador.
     * Isso garante compatibilidade WYSIWYG com o CSS @media print.
     */
    /**
     * Exporta a atividade para PDF gerando um arquivo para download.
     * Utiliza html2pdf.js com uma técnica de overlay para garantir captura correta.
     * @param {HTMLElement} element - O elemento DOM da atividade
     * @param {string} title - O título da atividade
     */
    static async exportToPDF(element, title = 'Atividade') {
        if (!element) return;

        // TÉCNICA DO OVERLAY VISÍVEL (Snapshot)
        // O html2canvas falha com elementos invisíveis ou fora da viewport.
        // Vamos criar uma "página de impressão" temporária sobrepondo tudo.
        const overlay = document.createElement('div');
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100vw'; // Viewport width
        overlay.style.height = '100vh'; // Viewport height
        overlay.style.zIndex = '99999'; // Acima de tudo
        overlay.style.backgroundColor = 'white';
        overlay.style.overflowY = 'auto'; // Permite scroll se necessário, mas o PDF vai pegar o full height
        overlay.style.padding = '40px';
        overlay.id = 'pdf-export-overlay';

        // Container do conteúdo (A4 simulado ou fluido)
        const container = document.createElement('div');
        container.style.width = '100%';
        // Ajustando para largura segura (A4 210mm - 20mm margem = 190mm ~ 718px)
        // Reduzindo para 650px para garantir folga absoluta
        container.style.maxWidth = '650px';
        container.style.margin = '0 auto';
        container.style.padding = '0'; // Remove padding do container para controle total
        container.style.color = 'black';
        container.style.backgroundColor = 'white'; // Fundo branco explícito
        container.style.fontFamily = 'Arial, sans-serif';
        // Força quebra de linha para evitar cortes
        container.style.overflowWrap = 'break-word';
        container.style.wordWrap = 'break-word';
        container.style.hyphens = 'auto';

        // 1. Título
        if (title) {
            const h1 = document.createElement('h1');
            h1.textContent = title;
            h1.style.textAlign = 'center';
            h1.style.fontSize = '24px';
            h1.style.fontWeight = 'bold';
            h1.style.marginBottom = '20px';
            h1.style.marginTop = '0';
            h1.style.color = '#000';
            container.appendChild(h1);
        }

        // 2. Conteúdo Clonado
        const clone = element.cloneNode(true);

        // Limpa classes que atrapalham
        clone.className = '';
        clone.style.width = '100%'; // Garante uso da largura do container
        clone.style.margin = '0';
        clone.style.padding = '0';
        clone.style.height = 'auto';
        clone.style.overflow = 'visible';
        clone.style.display = 'block';

        // Remove interface
        clone.querySelectorAll('button').forEach(b => b.remove());
        clone.querySelectorAll('.wordsearch-controls').forEach(el => el.remove());

        // Força estilos de impressão (Preto no Branco) e TEXTO ESQUERDA
        const allEls = clone.querySelectorAll('*');
        allEls.forEach(el => {
            el.style.color = '#000';

            // Remove justificativa que causa espaçamento irregular no PDF
            if (getComputedStyle(el).textAlign === 'justify') {
                el.style.textAlign = 'left';
            }
            // Remove tracking (espaçamento entre letras)
            el.style.letterSpacing = 'normal';

            // Remove fundos escuros/coloridos se não forem essenciais
            if (el.classList.contains('bg-white')) el.style.backgroundColor = 'white';

            // Garante que nenhum elemento filho ultrapasse a largura do container
            el.style.maxWidth = '100% !important';
            el.style.boxSizing = 'border-box';

            // Remove margins negativas ou muito grandes
            el.style.marginLeft = '0';
            el.style.marginRight = '0';
        });

        container.appendChild(clone);
        overlay.appendChild(container);
        document.body.appendChild(overlay);

        // AUMENTADO: Delay para garantir renderização (reflow) - 1.5 segundo
        await new Promise(resolve => setTimeout(resolve, 1500));

        const opt = {
            margin: [10, 10, 10, 10], // mm
            filename: `${title || 'atividade'}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: {
                scale: 2,
                useCORS: true,
                logging: true,
                scrollY: 0
            },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
            pagebreak: { mode: ['avoid-all', 'css'] }
        };

        if (window.html2pdf) {
            await window.html2pdf().set(opt).from(container).save();
        } else {
            alert('Biblioteca PDF não encontrada. Tente imprimir usando Ctrl+P.');
        }

        document.body.removeChild(overlay);
    }

    /**
     * Exporta o elemento HTML fornecido para um arquivo .doc (Word)
     * Usa estilos inline para garantir compatibilidade com o Word.
     * @param {HTMLElement} element - O elemento DOM da atividade
     * @param {string} title - O título da atividade
     */
    static exportToDOCX(element, title = 'Atividade') {
        if (!element) return;

        const contentDiv = document.createElement('div');
        contentDiv.innerHTML = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>${title}</title>
      </head>
      <body>
      </body>
      </html>
    `;

        // Clone o conteúdo visível
        const clone = element.cloneNode(true);

        // 1. Limpeza Estrutural
        clone.className = '';
        clone.style.cssText = 'overflow: visible; height: auto; display: block; background-color: white; color: black; font-family: Arial, sans-serif;';

        // Remove elementos de interface que não devem sair na impressão
        clone.querySelectorAll('.no-print, button, .wordsearch-controls').forEach(el => el.remove());

        // Remove o seletor de input do título se existir, deixa só o texto se tiver
        clone.querySelectorAll('input').forEach(input => {
            // Se for input de título, transformamos em h1? Não, geralmente o input está na área de controle que removemos.
            // Mas o renderizador pode ter inputs? Não, o renderer usa divs.
            // Garante remoção de qualquer input residual.
            input.remove();
        });

        // 2. Injeção de Estilos Inline (Crítico para Word)
        const allElements = clone.querySelectorAll('*');
        allElements.forEach(el => {
            el.style.color = '#000000';

            // Estilos para Grades/Tabelas (usados no caça-palavras)
            if (el.classList.contains('grid')) {
                el.style.display = 'grid'; // Word suporta grids básicos ou vira tabela no importa
                // Melhor converter grids complexos se precisar, mas vamos tentar manter simples.
                // Word interpreta melhor tabelas.
            }

            // Cards e Parágrafos
            if (el.classList.contains('bg-white') || el.classList.contains('shadow-sm') || el.classList.contains('rounded-xl')) {
                el.style.border = '1px solid #ccc';
                el.style.padding = '10px';
                el.style.marginBottom = '15px';
                el.style.backgroundColor = '#ffffff';
                el.style.borderRadius = '8px';
            }

            // Títulos
            if (el.tagName === 'H1') {
                el.style.fontSize = '24pt';
                el.style.textAlign = 'center';
                el.style.fontWeight = 'bold';
                el.style.marginBottom = '20px';
            }
            if (el.tagName === 'H2') {
                el.style.fontSize = '18pt';
                el.style.fontWeight = 'bold';
                el.style.borderBottom = '1px solid #ccc';
                el.style.marginTop = '20px';
                el.style.marginBottom = '10px';
            }
            if (el.tagName === 'P') {
                el.style.fontSize = '12pt';
                el.style.marginBottom = '10px';
                el.style.lineHeight = '1.5';
                el.style.textAlign = 'justify';
            }

            // Grid cells (letras)
            if (el.classList.contains('font-mono') && el.innerText.length === 1) {
                el.style.border = '1px solid #eee';
                el.style.width = '30px';
                el.style.height = '30px';
                el.style.textAlign = 'center';
                el.style.display = 'inline-block'; // Word prefere isso que flex/grid as vezes
                el.style.lineHeight = '30px';
                el.style.margin = '1px';
            }
        });

        // Insere Título Principal no DOC se não existir no clone (ex: se estava na UI control)
        const titleEl = document.createElement('h1');
        titleEl.innerText = title;
        titleEl.style.fontSize = '26pt';
        titleEl.style.textAlign = 'center';
        titleEl.style.marginBottom = '30px';
        clone.insertBefore(titleEl, clone.firstChild);

        // Adiciona ao wrapper
        contentDiv.querySelector('body').appendChild(clone);

        // Cria Blob e Download
        const blob = new Blob(['\ufeff', contentDiv.innerHTML], {
            type: 'application/msword'
        });

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${title || 'atividade'}.doc`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Small delay to ensure browser has time to register the download
        setTimeout(() => {
            URL.revokeObjectURL(url);
        }, 100);
    }
}
