import React from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

/**
 * Escapa HTML para prevenir XSS ao renderizar texto puro misturado com LaTeX
 */
function escapeHtml(text) {
    if (!text && text !== 0) return '';
    return text.toString()
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;")
        .replace(/\n/g, "<br/>");
}

/**
 * Normaliza sintaxe LaTeX comum corrigindo comandos sem barra invertida (ex: frac{3}{4} -> \frac{3}{4}, sqrt{16} -> \sqrt{16})
 */
function normalizeLatexSyntax(str) {
    if (!str || typeof str !== 'string') return str;
    let s = str;
    // Comandos estruturais e funções que recebem argumentos ou parênteses/chaves
    s = s.replace(/(?<!\\)\b(frac|sqrt|left|right|vec|hat|bar|int|sum|prod|lim|max|min|over)\b(?=\s*[\{\(\[\d])/g, '\\$1');
    // Símbolos matemáticos e letras gregas
    s = s.replace(/(?<!\\)\b(pi|alpha|beta|gamma|delta|theta|omega|sigma|mu|lambda|infty|pm|div|times|cdot|approx|neq|leq|geq)\b/g, '\\$1');
    // Funções trigonométricas e logarítmicas
    s = s.replace(/(?<!\\)\b(sin|cos|tan|cot|sec|csc|log|ln)\b(?=\s*[\{\(\[\d]|x|y|z|\\)/g, '\\$1');
    return s;
}

/**
 * Converte uma string com ou sem LaTeX em HTML formatado com KaTeX
 */
export function renderLatexToString(content, defaultDisplayMode = false) {
    if (!content && content !== 0) return '';
    let str = content.toString().trim();
    if (!str) return '';

    str = normalizeLatexSyntax(str);

    // Verifica se a string contém delimitadores LaTeX: $$, $, \[, \], \(, \)
    const hasDelimiters = /\$\$.*?\$\$|\$.*?\$|\\\[.*?\\\]|\\\(.*?\\\)/s.test(str);

    if (!hasDelimiters) {
        // Tenta renderizar primeiro como fórmula matemática inteira (se for apenas matemática pura, ex: \frac{3}{4} + \sqrt{16})
        try {
            const hasPortugueseWords = /[áéíóúâêôãõçÁÉÍÓÚÂÊÔÃÕÇ]/.test(str) && !/\\text\{/.test(str);
            if (!hasPortugueseWords) {
                return katex.renderToString(str, {
                    throwOnError: true,
                    displayMode: defaultDisplayMode || str.length <= 20,
                    output: 'html'
                });
            }
        } catch (e) {
            // Se falhou (porque tem texto misturado com comandos sem delimitadores $)
        }

        // Auto-detecção de expressões LaTeX perdidas no texto sem $...$
        let autoWrapped = str;
        autoWrapped = autoWrapped.replace(/(\\[a-zA-Z]+(?:\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\})*(?:\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\})*|[a-zA-Z0-9]+\^[a-zA-Z0-9\{\}\+\-]+|[a-zA-Z0-9]+_[a-zA-Z0-9\{\}\+\-]+)/g, (match) => {
            return `$${match}$`;
        });

        if (/\$.*?\$/.test(autoWrapped)) {
            str = autoWrapped;
        } else {
            return escapeHtml(str);
        }
    }

    // Se houver delimitadores (ou se foram adicionados pelo auto-wrap), processamos cada bloco
    const regex = /(\$\$.*?\$\$|\\\[.*?\\\]|\$.*?\$|\\\(.*?\\\))/gs;
    
    let lastIndex = 0;
    let match;
    let resultHtml = '';

    while ((match = regex.exec(str)) !== null) {
        if (match.index > lastIndex) {
            const textBefore = str.slice(lastIndex, match.index);
            resultHtml += `<span class="inline-text">${escapeHtml(textBefore)}</span>`;
        }

        const mathBlock = match[0];
        let mathCode = '';
        let isDisplay = false;

        if (mathBlock.startsWith('$$') && mathBlock.endsWith('$$')) {
            mathCode = mathBlock.slice(2, -2);
            isDisplay = true;
        } else if (mathBlock.startsWith('\\[') && mathBlock.endsWith('\\]')) {
            mathCode = mathBlock.slice(2, -2);
            isDisplay = true;
        } else if (mathBlock.startsWith('$') && mathBlock.endsWith('$')) {
            mathCode = mathBlock.slice(1, -1);
            isDisplay = false;
        } else if (mathBlock.startsWith('\\(') && mathBlock.endsWith('\\)')) {
            mathCode = mathBlock.slice(2, -2);
            isDisplay = false;
        }

        try {
            resultHtml += katex.renderToString(mathCode.trim(), {
                throwOnError: false,
                displayMode: isDisplay,
                output: 'html'
            });
        } catch (e) {
            resultHtml += `<span>${escapeHtml(mathBlock)}</span>`;
        }

        lastIndex = regex.lastIndex;
    }

    if (lastIndex < str.length) {
        const textAfter = str.slice(lastIndex);
        resultHtml += `<span class="inline-text">${escapeHtml(textAfter)}</span>`;
    }

    return resultHtml;
}

/**
 * Componente React para renderizar LaTeX / Fórmulas Matemáticas com KaTeX
 */
export const LatexRenderer = ({ content, className = '', defaultDisplayMode = false, style = {}, fontSize = null, mathFontSize = null, textFontSize = null }) => {
    if (!content && content !== 0) return null;
    const html = renderLatexToString(content, defaultDisplayMode);
    
    const mSize = mathFontSize || fontSize;
    const tSize = textFontSize || fontSize;

    const combinedStyle = {
        ...(mSize ? { '--katex-font-size': typeof mSize === 'number' ? `${mSize}px` : mSize } : {}),
        ...(tSize ? { '--text-font-size': typeof tSize === 'number' ? `${tSize}px` : tSize } : {}),
        ...(!mSize && !tSize && fontSize ? { fontSize: typeof fontSize === 'number' ? `${fontSize}px` : fontSize } : {}),
        ...style
    };

    return (
        <div 
            className={`latex-renderer inline-block max-w-full overflow-x-auto custom-scrollbar leading-normal ${className}`}
            style={combinedStyle}
            dangerouslySetInnerHTML={{ __html: html }}
        />
    );
};

export default LatexRenderer;
