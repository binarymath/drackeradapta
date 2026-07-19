import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Sparkles, PackageOpen, ListChecks, Copy, CheckCheck } from 'lucide-react';

const renderMarkdownText = (text) => {
    if (!text) return null;
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={index} className="font-black text-brown-900">{part.slice(2, -2)}</strong>;
        }
        // Remove single asterisks that Gemini sometimes puts for italics
        return part.replace(/\*/g, '');
    });
};

export const DrackerSummaryRenderer = ({ data, title }) => {
    const [copiedId, setCopiedId] = useState(null);

    if (!data) return null;

    const { story, activities } = data;

    const handleCopy = (text, id) => {
        const plainText = text.replace(/\*\*/g, '').replace(/\*/g, '');
        navigator.clipboard.writeText(plainText);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const copyActivity = (act, idx) => {
        let text = `${act.title}\n\n`;
        if (act.description) text += `${act.description}\n\n`;
        if (act.materials) text += `Materiais Necessários:\n${act.materials}\n\n`;
        if (act.steps) text += `Passo a Passo:\n${act.steps}\n`;
        handleCopy(text, `activity-${idx}`);
    };

    return (
        <div className="space-y-8 animate-in fade-in zoom-in duration-300 print:block print:space-y-6">
            {/* Cabecalho e História */}
            <Card className="bg-white border-orange-200 shadow-md relative overflow-hidden print:shadow-none print:border-none print:bg-transparent print:p-0">
                <div className="absolute -right-12 -top-12 opacity-[0.05] pointer-events-none print:hidden">
                    <Sparkles className="w-64 h-64 text-orange-900" />
                </div>
                
                <div className="relative z-10 p-6 sm:p-8 print:p-0">
                    <h1 className="text-3xl font-black text-brown-900 mb-6 flex items-center gap-3 print:text-2xl print:mb-4">
                        <img src="/dracker_character.png" alt="Drácker" className="w-12 h-12 object-contain print:hidden" />
                        {title || 'Drácker Metodologia Ativa'}
                    </h1>
                    
                    {story && (
                        <div className="text-brown-800 max-w-4xl mt-2">
                            {story.split('\n').filter(p => p.trim() !== '').map((paragraph, i) => (
                                <p key={i} className="text-left text-lg sm:text-xl leading-[1.8] tracking-wide font-normal mb-6 print:text-base print:mb-4 text-brown-700">
                                    {renderMarkdownText(paragraph)}
                                </p>
                            ))}
                        </div>
                    )}
                </div>
            </Card>

            {/* Atividades Práticas */}
            {activities && activities.length > 0 && (
                <div className="space-y-6 print:space-y-4">
                    <h2 className="text-2xl font-black text-brown-900 mb-4 flex items-center gap-2 print:text-xl print:mb-2">
                        <Sparkles className="w-6 h-6 text-orange-500" />
                        Ideias de Atividades Práticas
                    </h2>

                    <div className="grid grid-cols-1 gap-6 print:gap-6">
                        {activities.map((act, idx) => (
                            <Card key={idx} className="bg-white border-2 border-orange-200 shadow-md p-6 sm:p-8 mb-6 print:mb-8 print:p-6 print:border-2 print:border-brown-300 print:shadow-none break-inside-avoid">
                                <div className="flex items-start justify-between mb-5 pb-3 border-b-2 border-orange-100 print:border-brown-200">
                                    <h3 className="text-2xl font-black text-brown-900 flex items-start gap-4 print:text-xl">
                                        <span className="flex-shrink-0 w-10 h-10 rounded-full bg-orange-500 text-white flex items-center justify-center font-black text-lg print:bg-brown-100 print:text-brown-900 print:border-2 print:border-brown-300">
                                            {idx + 1}
                                        </span>
                                        <span className="pt-1">{renderMarkdownText(act.title)}</span>
                                    </h3>
                                    <button
                                        onClick={() => copyActivity(act, idx)}
                                        className="no-print shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-bold text-brown-500 hover:text-orange-700 hover:bg-orange-50 border border-transparent hover:border-orange-200 rounded-lg transition-all"
                                        title="Copiar atividade completa"
                                    >
                                        {copiedId === `activity-${idx}` ? (
                                            <><CheckCheck className="w-4 h-4 text-green-600" /> <span className="hidden sm:inline">Copiado</span></>
                                        ) : (
                                            <><Copy className="w-4 h-4" /> <span className="hidden sm:inline">Copiar Tudo</span></>
                                        )}
                                    </button>
                                </div>

                                <div className="space-y-6 sm:ml-14 print:ml-2 max-w-4xl">
                                    {act.description && (
                                        <div className="text-brown-700 italic text-base sm:text-lg leading-[1.7] tracking-wide bg-brown-50/50 p-4 rounded-xl border border-brown-100 print:bg-transparent print:border-none print:p-0">
                                            {act.description.split('\n').filter(p => p.trim() !== '').map((paragraph, i) => (
                                                <p key={i} className="mb-3">{renderMarkdownText(paragraph)}</p>
                                            ))}
                                        </div>
                                    )}

                                    {act.materials && (
                                        <div className="bg-orange-50/70 p-5 rounded-xl border border-orange-100 print:bg-white print:border-brown-200 group">
                                            <div className="flex justify-between items-center mb-3">
                                                <h4 className="font-black text-orange-800 flex items-center gap-2 text-sm uppercase tracking-wider print:text-brown-800">
                                                    <PackageOpen className="w-5 h-5 text-orange-500 print:text-brown-600" /> Materiais Necessários
                                                </h4>
                                                <button
                                                    onClick={() => handleCopy(act.materials, `materials-${idx}`)}
                                                    className="no-print opacity-0 group-hover:opacity-100 p-1.5 text-brown-400 hover:text-orange-600 hover:bg-orange-100 rounded-md transition-all"
                                                    title="Copiar materiais"
                                                >
                                                    {copiedId === `materials-${idx}` ? <CheckCheck className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                                </button>
                                            </div>
                                            <div className="text-brown-800 leading-[1.7] tracking-wide text-base sm:text-lg">
                                                {act.materials.split('\n').filter(p => p.trim() !== '').map((paragraph, i) => (
                                                    <p key={i} className="mb-2 flex gap-2">
                                                        <span className="text-orange-500 mt-1 font-bold print:text-brown-600">•</span> 
                                                        <span>{renderMarkdownText(paragraph.replace(/^-/, '').trim())}</span>
                                                    </p>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {act.steps && (
                                        <div className="pt-4 mt-6 border-t border-dashed border-brown-200 print:border-brown-300">
                                            <h4 className="font-black text-indigo-800 flex items-center gap-2 mb-4 text-sm uppercase tracking-wider print:text-brown-900">
                                                <ListChecks className="w-5 h-5 text-indigo-500 print:text-brown-700" /> Passo a Passo
                                            </h4>
                                            <div className="space-y-4">
                                                {act.steps.split('\n').filter(p => p.trim() !== '').map((paragraph, i) => (
                                                    <div key={i} className="flex gap-3 bg-white p-4 rounded-xl border border-brown-100 shadow-sm print:shadow-none print:border-brown-300 print:bg-white group transition-colors hover:border-indigo-200">
                                                        <div className="w-1.5 rounded-full bg-indigo-300 flex-shrink-0 print:bg-brown-400"></div>
                                                        <p className="text-brown-800 leading-[1.7] tracking-wide text-base sm:text-lg m-0 flex-1">
                                                            {renderMarkdownText(paragraph)}
                                                        </p>
                                                        <button
                                                            onClick={() => handleCopy(paragraph, `step-${idx}-${i}`)}
                                                            className="no-print opacity-0 group-hover:opacity-100 p-1.5 text-brown-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-all self-start"
                                                            title="Copiar passo"
                                                        >
                                                            {copiedId === `step-${idx}-${i}` ? <CheckCheck className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
