
import React from 'react';
import { Sparkles, Copy } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

export const DrackerStoryRenderer = ({ drackerData }) => {
    if (!drackerData) return null;

    return (
        <div className="space-y-6 print:space-y-8">
            {/* CARD 1: HISTÓRIA */}
            <Card className="p-8 relative group overflow-hidden border border-brown-100 shadow-sm print:shadow-none print:border-4 print:border-brown-200 print:p-8 h-fit print:h-auto print:block">
                <div className="absolute top-0 right-0 p-4 opacity-20 pointer-events-none print:opacity-10" style={{ filter: 'sepia(100%) saturate(300%) hue-rotate(315deg) brightness(70%)' }}>
                    <img src="/dracker_character.png" alt="Drácker" className="w-32 h-32 object-contain opacity-50 print:w-48 print:h-48" />
                </div>

                {/* HEADER */}
                <div className="border-b border-brown-100 pb-4 mb-6 flex justify-between items-start print:border-b-2 print:border-brown-800 print:mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-brown-900 mb-1 print:text-4xl print:font-serif">Aprenda com o Drácker</h2>
                        <p className="text-brown-600 font-medium opacity-75 print:text-xl print:text-brown-800 print:italic">Uma história interativa para a turma</p>
                    </div>
                    <Button
                        onClick={() => {
                            navigator.clipboard.writeText(drackerData.story);
                            alert('História copiada!');
                        }}
                        variant="secondary"
                        className="text-xs print:hidden"
                        icon={Copy}
                    >
                        Copiar Texto
                    </Button>
                </div>

                {/* AUDIO SUGGESTION (Screen Only) */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 print:hidden no-print relative z-20">
                    <div className="flex items-start gap-3">
                        <Sparkles className="w-5 h-5 text-amber-600 mt-0.5" />
                        <div>
                            <h4 className="font-bold text-amber-900 text-sm">Dica de Narração Fluida</h4>
                            <p className="text-xs text-amber-800 mt-1">
                                Para uma leitura muito mais natural e fluida, copie o texto da história e cole no <b>Google AI Studio</b>.
                                <a
                                    href="https://aistudio.google.com/generate-speech"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="underline hover:text-amber-950 ml-1 font-bold decoration-amber-300"
                                >
                                    Acessar AI Studio
                                </a>
                            </p>
                        </div>
                    </div>
                </div>

                {/* STORY CONTENT */}
                <div className="prose prose-lg max-w-none text-brown-900 leading-loose font-serif print:text-xl print:leading-relaxed print:text-justify print:block">
                    {drackerData.story.split('\n\n').map((paragraph, index) => (
                        <p key={index} className="indent-8 mb-4 text-justify print:mb-4">
                            {paragraph.split(/(\*\*.*?\*\*)/g).map((part, i) => {
                                if (part.startsWith('**') && part.endsWith('**')) {
                                    return (
                                        <strong key={i} className="text-brown-800 font-extrabold print:text-black">
                                            {part.slice(2, -2)}
                                        </strong>
                                    );
                                }
                                return part;
                            })}
                        </p>
                    ))}
                </div>
            </Card>

            {/* CARD 2: ATIVIDADES */}
            <Card className="p-8 relative border border-brown-100 shadow-sm print:shadow-none print:border-4 print:border-brown-200 print:p-8 h-fit print:h-auto print:block break-before-auto">
                <h3 className="text-lg font-bold text-brown-800 mb-6 flex items-center gap-2 print:text-3xl print:mb-6 print:border-b print:border-brown-400 print:pb-2">
                    <img src="/dracker_character.png" alt="Brain" className="w-6 h-6 object-contain print:w-10 print:h-10" />
                    Atividades Práticas
                </h3>

                <ol className="list-none ml-0 space-y-6 print:block">
                    {drackerData.activities.map((act, idx) => {
                        const isObject = typeof act === 'object' && act !== null;

                        if (!isObject) {
                            return (
                                <li key={idx} className="text-brown-700 font-medium pl-2 border-b border-brown-100 pb-4 print:block">
                                    {String(act).split(/(\*\*.*?\*\*)/g).map((part, i) => {
                                        if (part.startsWith('**') && part.endsWith('**')) {
                                            return <strong key={i} className="text-brown-800 font-extrabold">{part.slice(2, -2)}</strong>;
                                        }
                                        return part;
                                    })}
                                </li>
                            );
                        }

                        return (
                            <li key={idx} className="bg-brown-50/50 rounded-xl p-4 border border-brown-100 hover:border-brown-200 transition-colors break-inside-avoid print:break-inside-avoid print:bg-transparent print:border-brown-300 print:mb-4">
                                <div className="flex items-start gap-3 mb-3">
                                    <div className="w-8 h-8 rounded-full bg-brown-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm print:bg-brown-800 print:text-white">
                                        {idx + 1}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-brown-900 text-lg leading-tight">{act.title}</h4>
                                        {act.materials && (
                                            <div className="mt-1 flex items-start gap-2 text-sm text-brown-600">
                                                <span className="font-bold text-xs uppercase tracking-wide bg-white px-2 py-0.5 rounded border border-brown-100 text-brown-500 shrink-0">Materiais</span>
                                                <span className="italic">{act.materials}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {act.steps && (
                                    <div className="ml-11 text-brown-800 text-sm leading-relaxed border-l-2 border-brown-200 pl-4 py-1">
                                        <span className="font-bold text-brown-500 text-xs uppercase mb-1 block">Como fazer:</span>
                                        {act.steps.split(/(\d+\.\s+)/).filter(Boolean).reduce((acc, part, i, arr) => {
                                            if (/^\d+\.\s+$/.test(part)) {
                                                const text = arr[i + 1];
                                                if (text) {
                                                    acc.push(
                                                        <div key={i} className="mb-2 flex items-start">
                                                            <span className="font-bold mr-1 min-w-[20px]">{part.trim()}</span>
                                                            <span>{text.trim()}</span>
                                                        </div>
                                                    );
                                                    arr[i + 1] = '';
                                                }
                                            } else if (part !== '' && i === 0 && !/^\d+\.\s+$/.test(arr[0])) {
                                                acc.push(<div key={i} className="mb-2">{part}</div>);
                                            }
                                            return acc;
                                        }, [])}
                                    </div>
                                )}
                            </li>
                        );
                    })}
                </ol>

                {/* FOOTER */}
                <div className="mt-8 pt-4 border-t border-brown-100 flex items-center justify-between text-xs text-brown-400 print:mt-8 print:border-brown-800 print:text-brown-600">
                    <span className="flex items-center gap-1">
                        <img src="/dracker_character.png" alt="Logo" className="w-4 h-4 opacity-50 grayscale" />
                        Atividade Adaptada - Drácker
                    </span>
                    <span>{new Date().toLocaleDateString()}</span>
                </div>
            </Card>
        </div>
    );
};
