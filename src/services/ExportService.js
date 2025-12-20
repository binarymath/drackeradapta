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

        // Mensagem de Carregamento
        overlay.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; width: 100vw; position: fixed; top: 0; left: 0; background: rgba(255,255,255,0.95); z-index: 100000;">
                <div style="width: 50px; height: 50px; border: 5px solid #f3f3f3; border-top: 5px solid #3498db; border-radius: 50%; animation: spin 1s linear infinite;"></div>
                <h2 style="margin-top: 20px; font-family: sans-serif; color: #333;">Gerando PDF...</h2>
                <p style="color: #666; font-family: sans-serif;">Por favor, aguarde um momento.</p>
                <style>@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }</style>
            </div>
        `;

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
        container.style.hyphens = 'none';
        container.style.wordBreak = 'normal';

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
        clone.querySelectorAll('.no-print').forEach(el => el.remove());

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
            el.style.marginRight = '0';

            // PDF: Reduce Size of Crossword/Grid Cells to fit page
            // Targets the w-8 h-8 (32px) cells and shrinks them to ~24px
            if (el.classList.contains('w-8') && el.classList.contains('h-8')) {
                el.style.width = '24px';
                el.style.height = '24px';
                el.style.fontSize = '10px'; // Smaller font for numbers inside
            }
            if (el.classList.contains('sm:w-10')) {
                el.style.width = '24px'; // Force override responsive utilities
                el.style.height = '24px';
            }
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
        if (!element) {
            alert('Erro: Nenhum conteúdo encontrado para exportar. Tente novamente.');
            return;
        }

        try {

            const contentDiv = document.createElement('div');

            // Clone o conteúdo visível
            const clone = element.cloneNode(true);

            // 1. Limpeza Estrutural
            clone.className = '';
            clone.style.cssText = 'overflow: visible; height: auto; display: block; background-color: white; color: black; font-family: Arial, sans-serif;';

            // Remove elementos de interface que não devem sair na impressão
            clone.querySelectorAll('.no-print, button, .wordsearch-controls').forEach(el => el.remove());

            // Remove o seletor de input do título se existir
            clone.querySelectorAll('input').forEach(input => input.remove());

            // 2. Injeção de Estilos Inline & Conversão de Grid com Tratamento de Erro Robusto
            const allElements = clone.querySelectorAll('*');
            allElements.forEach(el => {
                ExportService._processElementForDoc(el);
            });

            // Insere Título Principal no DOC se não existir no clone
            const titleEl = document.createElement('h1');
            titleEl.innerText = title;
            titleEl.style.fontSize = '26pt';
            titleEl.style.textAlign = 'center';
            titleEl.style.marginBottom = '30px';
            clone.insertBefore(titleEl, clone.firstChild);

            // Adiciona ao wrapper
            contentDiv.appendChild(clone);

            // Monta o cabeçalho específico para Word
            const header = `
                <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
                <head>
                    <meta charset='utf-8'>
                    <title>${title}</title>
                    <style>
                        body { font-family: Arial, sans-serif; }
                    </style>
                </head>
                <body>
            `;
            const footer = `</body></html>`;

            // Cria Blob e Download com o cabeçalho e rodapé
            const blob = new Blob(['\ufeff', header, contentDiv.innerHTML, footer], {
                type: 'application/msword'
            });

            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${title || 'atividade'}.doc`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // Mais tempo para garantir o download
            setTimeout(() => {
                URL.revokeObjectURL(url);
            }, 2000);

        } catch (err) {
            console.error(err);
            alert(`Ocorreu um erro ao gerar o arquivo DOC: ${err.message}`);
        }
    }

    // Helper seguro para processar cada elemento individualmente
    static _processElementForDoc(el) {
        try {
            el.style.color = '#000000';

            // TENTATIVA DE CONVERSÃO CSS GRID -> TABLE 
            if (el.classList.contains('grid')) {
                const style = el.getAttribute('style') || '';
                const match = style.match(/repeat\((\d+)/);

                if (match && match[1]) {
                    const cols = parseInt(match[1]);
                    const children = Array.from(el.children);

                    // Verifica se elemento ainda é válido e tem pai
                    if (children.length > 0 && el.parentNode) {
                        const table = document.createElement('table');
                        table.style.borderCollapse = 'collapse';
                        table.style.margin = '0 auto';
                        table.setAttribute('align', 'center');

                        let tr = document.createElement('tr');
                        children.forEach((child, index) => {
                            const td = document.createElement('td');
                            td.style.border = '1px solid #000';
                            td.style.width = '24px';
                            td.style.height = '24px';
                            td.style.textAlign = 'center';
                            td.style.verticalAlign = 'middle';
                            td.style.fontSize = '11pt';
                            td.style.fontWeight = 'bold';
                            td.innerText = child.innerText;

                            if (child.classList.contains('bg-green-300')) {
                                td.style.backgroundColor = '#86efac';
                            }
                            tr.appendChild(td);
                            if ((index + 1) % cols === 0) {
                                table.appendChild(tr);
                                tr = document.createElement('tr');
                            }
                        });
                        if (tr.children.length > 0) table.appendChild(tr);
                        el.parentNode.replaceChild(table, el);
                        return;
                    }
                }
            }

            // Cards e Parágrafos
            if (el.classList.contains('bg-white') || el.classList.contains('shadow-sm') || el.classList.contains('rounded-xl')) {
                el.style.border = '1px solid #ccc';
                el.style.padding = '10px';
                el.style.marginBottom = '15px';
                el.style.backgroundColor = '#ffffff';
                el.style.borderRadius = '8px';
            }

            // Container de lista de palavras (flex-wrap)
            if (el.classList.contains('flex-wrap')) {
                el.style.display = 'block';
                el.style.textAlign = 'center';
                el.style.marginBottom = '20px';
            }

            // Títulos e Textos
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

            // Pills
            if (el.classList.contains('bg-amber-100')) {
                el.style.backgroundColor = '#fef3c7';
                el.style.border = '1px solid #fde68a';
                el.style.color = '#78350f';
                el.style.padding = '6px 12px';
                el.style.borderRadius = '20px';
                el.style.margin = '4px';
                el.style.display = 'inline-block';
                el.style.fontWeight = 'bold';
                el.style.whiteSpace = 'nowrap';
                el.style.textTransform = 'uppercase';
            }
        } catch (e) {
            console.warn('Erro processando elemento individual no DOC:', e);
        }
    }
}
