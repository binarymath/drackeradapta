import React from 'react';

// ---------------------------------------------------------------------------
// MarkdownText — renderizador leve de markdown para respostas da IA
// Suporta: ## títulos, **negrito**, *itálico*, `code`, listas (- / 1.) e parágrafos
// ---------------------------------------------------------------------------
export const MarkdownText = ({ text, className = '' }) => {
    if (!text) return null;

    const renderInline = (line) => {
        // Divide pelo padrão **bold**, *italic*, `code`
        const parts = [];
        const regex = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/g;
        let last = 0;
        let m;
        while ((m = regex.exec(line)) !== null) {
            if (m.index > last) parts.push(<span key={last}>{line.slice(last, m.index)}</span>);
            if (m[2]) parts.push(<strong key={m.index} className="font-bold text-white">{m[2]}</strong>);
            else if (m[3]) parts.push(<em key={m.index} className="italic text-indigo-200">{m[3]}</em>);
            else if (m[4]) parts.push(<code key={m.index} className="bg-white/10 px-1 py-0.5 rounded text-purple-200 font-mono text-[11px]">{m[4]}</code>);
            last = m.index + m[0].length;
        }
        if (last < line.length) parts.push(<span key={last}>{line.slice(last)}</span>);
        return parts.length > 0 ? parts : line;
    };

    const lines = text.split('\n');
    const elements = [];
    let i = 0;
    while (i < lines.length) {
        const line = lines[i];
        // Títulos ## ou ###
        if (/^#{1,3}\s/.test(line)) {
            const level = line.match(/^(#{1,3})/)[1].length;
            const content = line.replace(/^#{1,3}\s+/, '');
            const sizeClass = level === 1 ? 'text-sm font-black text-indigo-100 mt-3 mb-1' :
                              level === 2 ? 'text-xs font-black text-indigo-200 mt-2.5 mb-1 uppercase tracking-wide' :
                                           'text-xs font-bold text-purple-200 mt-2 mb-0.5';
            elements.push(<p key={i} className={sizeClass}>{renderInline(content)}</p>);
        }
        // Listas com hífen ou asterisco
        else if (/^[-*]\s/.test(line)) {
            const content = line.replace(/^[-*]\s+/, '');
            elements.push(
                <div key={i} className="flex gap-2 items-start mt-1">
                    <span className="text-purple-400 mt-0.5 shrink-0">•</span>
                    <span>{renderInline(content)}</span>
                </div>
            );
        }
        // Listas numeradas 1. 2. etc
        else if (/^\d+\.\s/.test(line)) {
            const num = line.match(/^(\d+)\.\s/)[1];
            const content = line.replace(/^\d+\.\s+/, '');
            elements.push(
                <div key={i} className="flex gap-2 items-start mt-1">
                    <span className="text-indigo-400 font-bold shrink-0 min-w-[16px]">{num}.</span>
                    <span>{renderInline(content)}</span>
                </div>
            );
        }
        // Linha separadora ---
        else if (/^---+$/.test(line.trim())) {
            elements.push(<hr key={i} className="border-white/10 my-2" />);
        }
        // Linha vazia → espaçamento
        else if (line.trim() === '') {
            elements.push(<div key={i} className="h-2" />);
        }
        // Parágrafo normal
        else {
            elements.push(<p key={i} className="leading-relaxed">{renderInline(line)}</p>);
        }
        i++;
    }
    return <div className={`text-xs text-slate-200 space-y-0.5 ${className}`}>{elements}</div>;
};
