export class ExportService {
    /**
     * Exporta a atividade para PDF com design amigável para crianças
     * Com quebras de página estratégicas entre atividades
     * @param {HTMLElement} element - O elemento DOM da atividade
     * @param {string} title - O título da atividade
     */
    static async exportToPDF(element, title = 'Atividade') {
        if (!element) return;

        const overlay = document.createElement('div');
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100vw';
        overlay.style.height = '100vh';
        overlay.style.zIndex = '99999';
        overlay.style.backgroundColor = 'white';
        overlay.style.overflowY = 'auto';
        overlay.style.padding = '40px';
        overlay.id = 'pdf-export-overlay';

        overlay.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; width: 100vw; position: fixed; top: 0; left: 0; background: rgba(255,255,255,0.95); z-index: 100000;">
                <div style="width: 50px; height: 50px; border: 5px solid #f3f3f3; border-top: 5px solid #3498db; border-radius: 50%; animation: spin 1s linear infinite;"></div>
                <h2 style="margin-top: 20px; font-family: sans-serif; color: #333;">Gerando PDF...</h2>
                <p style="color: #666; font-family: sans-serif;">Por favor, aguarde um momento.</p>
                <style>@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }</style>
            </div>
        `;

        // Detecta se é palavras cruzadas (para ajustar título e margens)
        const isCrosswordActivity = /HORIZONTAIS|VERTICAIS|Horizontal|Vertical/i.test(element.textContent || '');
        // Detecta se é quiz/questões (para evitar quebras extras)
        const isQuizActivity = /QUIZ|PERGUNTA|QUESTÃO|QUESTOES|QUESTÕES/i.test(element.textContent || '');
        // Detecta se é música do Drácker (para remover alternativas)
        const isMusicActivity = /Música do Drácker|Perguntas de Interpretação/i.test(element.textContent || '');

        const container = document.createElement('div');
        container.style.width = '100%';
        container.style.maxWidth = '680px';
        container.style.margin = '0 auto';
        container.style.padding = isCrosswordActivity ? '6px' : '20px';
        container.style.color = '#333';
        container.style.backgroundColor = 'white';
        container.style.fontFamily = '"Verdana", "Arial", sans-serif';
        container.style.fontSize = '14pt';
        container.style.lineHeight = '1.6';

        // Título principal com design infantil - REDUZIDO
        if (title) {
            const h1 = document.createElement('h1');
            h1.textContent = title;
            h1.style.textAlign = 'center';
            h1.style.fontSize = isCrosswordActivity ? '16pt' : '22pt'; // Ainda menor para palavras cruzadas
            h1.style.fontWeight = 'bold';
            h1.style.color = '#d97706';
            h1.style.marginBottom = isCrosswordActivity ? '6pt' : '12pt'; // Menor para palavras cruzadas
            h1.style.marginTop = '0';
            h1.style.paddingBottom = isCrosswordActivity ? '4px' : '8px'; // Menor para palavras cruzadas
            h1.style.borderBottom = isCrosswordActivity ? '2px solid #fbbf24' : '4px solid #fbbf24'; // Borda menor para palavras cruzadas
            h1.style.textTransform = 'uppercase';
            h1.style.letterSpacing = isCrosswordActivity ? '1px' : '2px'; // Menor para palavras cruzadas
            h1.style.pageBreakAfter = 'avoid'; // Mantém junto com próximo elemento
            container.appendChild(h1);
        }

        const clone = element.cloneNode(true);
        clone.className = '';
        clone.style.cssText = 'width: 100%; margin: 0; padding: 0; height: auto; overflow: visible; display: block;';

        // Remove elementos desnecessários
        clone.querySelectorAll('button').forEach(b => b.remove());
        clone.querySelectorAll('.wordsearch-controls').forEach(el => el.remove());
        clone.querySelectorAll('.no-print').forEach(el => el.remove());
        clone.querySelectorAll('img').forEach(el => el.remove());
        clone.querySelectorAll('svg').forEach(el => el.remove());

        // Para quiz/questões, removemos <br> para evitar quebras manuais de linha
        if (isQuizActivity) {
            clone.querySelectorAll('br').forEach(br => br.replaceWith(' '));
        }

        // Remove barra/título específico de palavras cruzadas (toolbar) para PDF
        if (isCrosswordActivity) {
            // Remove badges com contagem de palavras
            clone.querySelectorAll('span,div').forEach(el => {
                const txt = (el.textContent || '').trim().toLowerCase();
                if (txt.endsWith('palavras') && el.tagName !== 'LI') {
                    el.remove();
                }
            });
            // Remove h2/h3 que contenham "palavras cruzadas"
            clone.querySelectorAll('h1,h2,h3,h4').forEach(el => {
                const txt = (el.textContent || '').trim().toLowerCase();
                if (txt.includes('palavras cruzadas')) {
                    el.remove();
                }
            });
            // Remove cartões que só abrigam a barra de título
            clone.querySelectorAll('.flex').forEach(el => {
                const txt = (el.textContent || '').trim().toLowerCase();
                if (txt.includes('palavras cruzadas') && txt.includes('palavras')) {
                    el.remove();
                }
            });
        }

        // Remove cartão do modo jogo e barra de botões para atividades de música
        if (isMusicActivity) {
            // Remove o cartão "Jogo de Interpretação Musical"
            clone.querySelectorAll('div').forEach(el => {
                const txt = (el.textContent || '').trim();
                if (txt.includes('Jogo de Interpretação Musical') || txt.includes('Jogar Agora')) {
                    el.remove();
                }
            });
        }

        // CONVERTE GRIDS PARA TABELAS HTML (essencial para PDF)
        const grids = clone.querySelectorAll('[class*="grid"]');
        grids.forEach(gridEl => {
            // Detecta se é um grid de caça-palavras/palavras-cruzadas
            const cells = Array.from(gridEl.querySelectorAll('div[class*="flex"]'));
            if (cells.length > 0) {
                // Calcula o tamanho do grid (assume que é quadrado)
                const gridSize = Math.sqrt(cells.length);
                if (Number.isInteger(gridSize)) {
                    // Cria tabela HTML
                    const table = document.createElement('table');
                    table.style.borderCollapse = 'collapse';
                    table.style.margin = isCrosswordActivity ? '4pt auto' : '8pt auto';
                    table.style.pageBreakInside = 'avoid';
                    
                    // Preenche tabela
                    for (let i = 0; i < cells.length; i += gridSize) {
                        const tr = document.createElement('tr');
                        for (let j = 0; j < gridSize && i + j < cells.length; j++) {
                            const td = document.createElement('td');
                            const cellEl = cells[i + j];
                            const cellText = (cellEl.innerText || cellEl.textContent || '').trim();
                            const cornerSpan = cellEl.querySelector('span');
                            const cornerText = cornerSpan ? (cornerSpan.textContent || '').trim() : '';
                            
                            if (isCrosswordActivity) {
                                td.style.position = 'relative';
                                // Não renderiza letra principal; apenas número pequeno no canto
                                if (cornerText) {
                                    const numSpan = document.createElement('span');
                                    numSpan.textContent = cornerText;
                                    numSpan.style.position = 'absolute';
                                    numSpan.style.top = '0.5px';
                                    numSpan.style.left = '1.5px';
                                    numSpan.style.fontSize = '6pt';
                                    numSpan.style.fontWeight = '700';
                                    numSpan.style.color = '#555';
                                    numSpan.style.lineHeight = '1';
                                    td.appendChild(numSpan);
                                }
                            } else {
                                // Para outras atividades (ex.: caça-palavras), mantém texto central
                                td.textContent = cellText;
                            }
                            td.style.border = '0.5px solid #ccc'; // Linhas muito finas e cinza muito claro
                            td.style.width = isCrosswordActivity ? '18px' : '32px';
                            td.style.height = isCrosswordActivity ? '18px' : '32px';
                            td.style.textAlign = 'center';
                            td.style.verticalAlign = 'middle';
                            td.style.fontSize = isCrosswordActivity ? '8.5pt' : '13pt';
                            td.style.fontWeight = 'bold';
                            td.style.backgroundColor = '#ffffff'; // Branco sólido
                            td.style.color = '#000'; // Texto preto
                            td.style.padding = '0';
                            tr.appendChild(td);
                        }
                        table.appendChild(tr);
                    }
                    if (gridEl.parentNode) {
                        gridEl.parentNode.replaceChild(table, gridEl);
                    }
                }
            }
        });

        // Aplica estilos infantis
        const allEls = clone.querySelectorAll('*');
        let firstH2Found = false; // Controla para não quebrar página no primeiro H2
        const totalElements = allEls.length;
        
        // Detecta se é palavras cruzadas pela presença das dicas/títulos
        const isCrossword = /HORIZONTAIS|VERTICAIS|Horizontal|Vertical/i.test(clone.textContent || '');
        
        allEls.forEach((el, idx) => {
            el.style.fontFamily = '"Verdana", "Arial", sans-serif';
            el.style.fontSize = isCrossword ? '9.5pt' : '14pt'; // Extra-compacto para cruzadas
            el.style.lineHeight = isCrossword ? '1.25' : '1.6'; // Extra-compacto para cruzadas
            el.style.color = '#333';

            // Títulos secundários com destaque
            if (el.tagName === 'H2' || el.tagName === 'H3') {
                el.style.fontSize = isCrossword ? '12pt' : '16pt'; // Extra-compacto para cruzadas
                el.style.fontWeight = 'bold';
                el.style.color = '#d97706';
                el.style.marginTop = isCrossword ? '4pt' : '16pt'; // Extra-compacto para cruzadas
                el.style.marginBottom = isCrossword ? '3pt' : '8pt'; // Extra-compacto para cruzadas
                el.style.paddingBottom = '4px';
                el.style.borderBottom = '2px solid #fbbf24';
                
                // Palavras cruzadas: NUNCA quebra página
                if (isCrossword) {
                    el.style.pageBreakBefore = 'avoid';
                    el.style.pageBreakAfter = 'avoid';
                    el.style.pageBreakInside = 'avoid';
                } else {
                    // Quebra ANTES do título, mas não no primeiro
                    if (firstH2Found) {
                        el.style.pageBreakBefore = 'always'; // Quebra ANTES do título
                    } else {
                        el.style.pageBreakBefore = 'avoid'; // Primeiro H2 não quebra
                        firstH2Found = true;
                    }
                    el.style.pageBreakAfter = 'avoid'; // Mantém com o conteúdo seguinte
                }
            }

            // Tabelas (convertidas de grids)
            if (el.tagName === 'TABLE') {
                el.style.marginBottom = isCrossword ? '3pt' : '8pt'; // Extra-compacto para cruzadas
                el.style.margin = isCrossword ? '6pt auto' : '12pt auto'; // Menor para palavras cruzadas
                el.style.lineHeight = isCrossword ? '1.22' : '1.5'; // Extra-compacto para cruzadas
                el.style.backgroundColor = 'transparent'; // Fundo transparente
            }

            if (el.tagName === 'TD' || el.tagName === 'TH') {
                el.style.marginBottom = isCrossword ? '1.5pt' : '4pt'; // Extra-compacto para cruzadas
                el.style.marginLeft = isCrossword ? '10pt' : '16pt'; // Extra-compacto para cruzadas
                el.style.height = isCrossword ? '18px' : '32px'; // Extra-compacto para cruzadas
                el.style.textAlign = 'center';
                el.style.verticalAlign = 'middle';
                el.style.fontSize = isCrossword ? '8.5pt' : '13pt'; // Extra-compacto para cruzadas
                el.style.padding = isCrossword ? '1.5pt' : '4pt'; // Extra-compacto para cruzadas
                el.style.padding = '0';
                el.style.backgroundColor = '#ffffff'; // Branco sólido
                el.style.color = '#000'; // Texto preto
            }

            // Parágrafos de texto
            if (el.tagName === 'P') {
                el.style.marginBottom = isCrossword ? '4.5pt' : '8pt'; // Um pouco mais de respiro
                el.style.textAlign = 'left';
                el.style.lineHeight = isCrossword ? '1.3' : '1.5'; // Mantém compacidade
            }

            // Listas
            if (el.tagName === 'LI' || el.tagName === 'OL' || el.tagName === 'UL') {
                el.style.marginBottom = isCrossword ? '15pt' : '4pt'; // Espaço maior entre perguntas
                el.style.marginLeft = isCrossword ? '10pt' : '16pt'; // Mantém compacto lateral
                if (isCrossword) {
                    el.style.lineHeight = '1.42'; // Altura interna adicional
                    el.style.paddingTop = '2pt';
                }
            }

            // Reduz visual dos badges 'HORIZONTAIS' e 'VERTICAIS' para economizar espaço
            if (isCrossword && el.textContent) {
                const txt = el.textContent.trim().toUpperCase();
                if (txt === 'HORIZONTAIS' || txt === 'VERTICAIS') {
                    el.style.background = 'transparent';
                    el.style.border = 'none';
                    el.style.padding = '0 4pt';
                    el.style.borderRadius = '0';
                    el.style.fontSize = '11pt';
                    el.style.color = '#000';
                    el.style.display = 'inline-block';
                }
            }

            // Reduz padding desnecessário
                if (el.classList.contains('p-6') || el.classList.contains('p-8')) {
                    el.style.padding = isCrossword ? '1pt' : '4pt'; // Extra-compacto para cruzadas
            }

            // Para quiz/questões: não quebrar o cartão no meio. Se não couber, empurra para a próxima página.
            if (isQuizActivity) {
                const hasCard = el.classList.contains('card') || el.classList.contains('Card') || el.classList.contains('shadow') || el.classList.contains('shadow-md');
                if (hasCard) {
                    el.style.pageBreakInside = 'avoid';
                    el.style.pageBreakAfter = 'auto';
                    el.style.pageBreakBefore = el.style.pageBreakBefore || 'auto';
                }
            }

            // Quebra de página após atividades principais (mas não no último elemento)
            const isLastSection = idx > totalElements - 50; // Últimos 50 elementos não quebram
            if ((el.classList.contains('prose') || el.classList.contains('space-y-6')) && idx > 0 && !isLastSection && !isCrossword && !isQuizActivity) {
                el.style.pageBreakAfter = 'always';
                el.style.marginBottom = '20pt';
            }
            
            // Remove quebras de página e margens excessivas dos últimos elementos
            if (isLastSection) {
                el.style.pageBreakAfter = 'avoid';
                el.style.pageBreakBefore = 'avoid';
                el.style.marginBottom = '0';
                el.style.marginTop = el.style.marginTop || '0';
            }
        });

        container.appendChild(clone);
        overlay.appendChild(container);
        document.body.appendChild(overlay);

        await new Promise(resolve => setTimeout(resolve, 1500));

        const opt = {
            margin: isCrosswordActivity ? [4, 4, 4, 4] : [15, 15, 15, 15], // Margens laterais ainda menores para cruzadas
            filename: `${title || 'atividade'}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: {
                scale: 2,
                useCORS: true,
                scrollY: 0,
                allowTaint: true
            },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
            pagebreak: { mode: 'css', avoid: ['tr'] }
        };

        if (window.html2pdf) {
            await window.html2pdf().set(opt).from(container).save();
        } else {
            alert('Biblioteca PDF não encontrada. Tente imprimir usando Ctrl+P.');
        }

        document.body.removeChild(overlay);
    }

    /**
     * Exporta para Word com formatação amigável para crianças
     * @param {HTMLElement} element - O elemento DOM da atividade
     * @param {string} title - O título da atividade
     */
    static exportToDOCX(element, title = 'Atividade') {
        if (!element) {
            alert('Erro: Nenhum conteúdo encontrado para exportar. Tente novamente.');
            return;
        }

        try {
            const textContent = ExportService._extractPlainTextForChildren(element);

            const header = `
                <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
                <head>
                    <meta charset='utf-8'>
                    <title>${title}</title>
                    <style>
                        body { 
                            font-family: 'Verdana', 'Arial', sans-serif; 
                            font-size: 14pt; 
                            line-height: 1.5; 
                            margin: 1cm 1.5cm 1.5cm 1.5cm;
                            color: #333;
                        }
                        h1 { 
                            font-size: 22pt; 
                            text-align: center; 
                            margin-bottom: 8pt; 
                            margin-top: 0;
                            font-weight: bold;
                            color: #d97706;
                            text-transform: uppercase;
                            border-bottom: 4pt solid #fbbf24;
                            padding-bottom: 8pt;
                            letter-spacing: 2pt;
                            page-break-after: avoid;
                        }
                        h2 { 
                            font-size: 16pt; 
                            margin-top: 12pt; 
                            margin-bottom: 8pt; 
                            font-weight: bold;
                            color: #d97706;
                            border-bottom: 2pt solid #fbbf24;
                            padding-bottom: 4pt;
                            page-break-after: avoid;
                        }
                        h3 {
                            font-size: 14pt;
                            font-weight: bold;
                            color: #d97706;
                            margin-top: 8pt;
                            margin-bottom: 6pt;
                        }
                        p { 
                            margin-bottom: 8pt;
                            text-align: left;
                            line-height: 1.5;
                        }
                        ol, ul {
                            margin-left: 1.5cm;
                            margin-bottom: 8pt;
                        }
                        li {
                            margin-bottom: 4pt;
                            line-height: 1.5;
                        }
                        table {
                            margin: 8pt 0;
                            border-collapse: collapse;
                            width: auto;
                            page-break-inside: avoid;
                        }
                        td, th {
                            border: 1pt solid #333;
                            padding: 3pt;
                            text-align: center;
                            font-size: 12pt;
                            width: 20pt;
                            height: 20pt;
                        }
                        .section-break {
                            page-break-after: always;
                            margin-bottom: 10pt;
                        }
                    </style>
                </head>
                <body>
            `;
            const footer = `</body></html>`;

            const formattedContent = `
                <h1>${title}</h1>
                <div>${textContent}</div>
            `;

            const blob = new Blob(['\ufeff', header, formattedContent, footer], {
                type: 'application/msword'
            });

            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${title || 'atividade'}.doc`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            setTimeout(() => {
                URL.revokeObjectURL(url);
            }, 2000);

        } catch (err) {
            console.error(err);
            alert(`Ocorreu um erro ao gerar o arquivo DOC: ${err.message}`);
        }
    }

    /**
     * Extrai conteúdo formatado para crianças
     * Inclui caça-palavras, palavras-cruzadas, quizzes, histórias e atividades
     * @param {HTMLElement} element - O elemento DOM
     * @returns {string} HTML formatado
     */
    static _extractPlainTextForChildren(element) {
        const clone = element.cloneNode(true);
        clone.querySelectorAll('.no-print, button, input, .wordsearch-controls, img, svg').forEach(el => el.remove());

        let html = '';

        // Extrai caça-palavras
        const wordsearchGrid = clone.querySelector('[class*="grid"]');
        if (wordsearchGrid) {
            const title = clone.querySelector('h2, h3');
            if (title) {
                html += `<h2>${ExportService._escapeHtml(title.innerText)}</h2>\n`;
            }
            
            // Constrói tabela do grid
            const cells = Array.from(wordsearchGrid.querySelectorAll('div[class*="flex"]'));
            if (cells.length > 0) {
                const gridSize = Math.sqrt(cells.length);
                html += `<table border="1">\n`;
                for (let i = 0; i < cells.length; i += gridSize) {
                    html += `<tr>\n`;
                    for (let j = 0; j < gridSize && i + j < cells.length; j++) {
                        const cellText = (cells[i + j].innerText || '').trim();
                        html += `<td>${ExportService._escapeHtml(cellText)}</td>\n`;
                    }
                    html += `</tr>\n`;
                }
                html += `</table>\n`;
                html += `<div class="section-break"></div>\n`;
            }
        }

        // Extrai lista de palavras a procurar
        const wordsList = clone.querySelector('[class*="flex-wrap"]');
        if (wordsList) {
            html += `<h3>Palavras a Procurar</h3>\n`;
            const words = Array.from(wordsList.querySelectorAll('[class*="bg-"]'));
            words.forEach(word => {
                const text = (word.innerText || '').trim();
                if (text) {
                    html += `<p>• ${ExportService._escapeHtml(text)}</p>\n`;
                }
            });
            html += `<div class="section-break"></div>\n`;
        }

        // Extrai história (Dracker)
        const storySection = clone.querySelector('div.prose, [class*="prose"]');
        if (storySection) {
            const storyTitle = storySection.previousElementSibling;
            if (storyTitle && (storyTitle.tagName === 'H2' || storyTitle.tagName === 'H3')) {
                html += `<h2>${ExportService._escapeHtml(storyTitle.innerText)}</h2>\n`;
            } else {
                html += `<h2>Aprenda com o Drácker</h2>\n`;
            }
            
            const paragraphs = Array.from(storySection.querySelectorAll('p'));
            paragraphs.forEach(p => {
                const text = (p.innerText || p.textContent || '').trim();
                if (text) {
                    html += `<p>${ExportService._escapeHtml(text)}</p>\n`;
                }
            });
            html += `<div class="section-break"></div>\n`;
        }

        // Extrai atividades práticas
        const activitiesSection = clone.querySelector('[class*="dashed"]');
        if (activitiesSection) {
            html += `<h2>Atividades Práticas</h2>\n`;
            const listItems = Array.from(activitiesSection.querySelectorAll('li'));
            html += `<ol>\n`;
            listItems.forEach(li => {
                const text = (li.innerText || li.textContent || '').trim();
                if (text) {
                    html += `<li>${ExportService._escapeHtml(text)}</li>\n`;
                }
            });
            html += `</ol>\n`;
            html += `<div class="section-break"></div>\n`;
        }

        // Extrai quizzes
        const quizzes = clone.querySelectorAll('[class*="quiz"], [class*="question"]');
        if (quizzes.length > 0) {
            html += `<h2>Questões</h2>\n`;
            quizzes.forEach((quiz, idx) => {
                const questionText = quiz.querySelector('h3, p, [class*="question-text"]');
                if (questionText) {
                    html += `<h3>Questão ${idx + 1}</h3>\n`;
                    html += `<p>${ExportService._escapeHtml(questionText.innerText)}</p>\n`;
                }
                
                const options = Array.from(quiz.querySelectorAll('[class*="option"], [class*="answer"]'));
                if (options.length > 0) {
                    html += `<ul>\n`;
                    options.forEach(opt => {
                        const optText = (opt.innerText || '').trim();
                        if (optText && !optText.includes('Enviar')) {
                            html += `<li>${ExportService._escapeHtml(optText)}</li>\n`;
                        }
                    });
                    html += `</ul>\n`;
                }
            });
            html += `<div class="section-break"></div>\n`;
        }

        // Fallback: extrai todo texto disponível
        if (!html.trim()) {
            const allText = (element.innerText || element.textContent || '').trim();
            const paragraphs = allText.split('\n\n');
            html = paragraphs
                .map(p => p.trim())
                .filter(p => p.length > 5)
                .map(p => `<p>${ExportService._escapeHtml(p)}</p>`)
                .join('\n');
        }

        return html;
    }

    /**
     * Escapa caracteres especiais HTML
     * @param {string} text - Texto a ser escapado
     * @returns {string} Texto escapado
     */
    static _escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }

}
