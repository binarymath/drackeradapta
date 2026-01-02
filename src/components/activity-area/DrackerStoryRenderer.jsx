
import React from 'react';
import { Sparkles, Copy } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

export const DrackerStoryRenderer = ({ drackerData }) => {
    if (!drackerData) return null;

    return (
        <div className="space-y-6">
            <Card className="p-8 relative group overflow-hidden border border-brown-100 shadow-sm print:shadow-none print:border-4 print:border-brown-200 print:p-10">
                <div className="absolute top-0 right-0 p-4 opacity-20 pointer-events-none print:opacity-10" style={{ filter: 'sepia(100%) saturate(300%) hue-rotate(315deg) brightness(70%)' }}>
                    <img src="/dracker_character.png" alt="Drácker" className="w-32 h-32 object-contain opacity-50 print:w-48 print:h-48" />
                </div>

                {/* HEADER */}
                {/* AUDIO SUGGESTION */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 mt-6 mr-6 ml-6 print:hidden relative z-20">
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

                <div className="border-b border-brown-100 pb-4 mb-6 flex justify-between items-start print:border-b-2 print:border-brown-800 print:mb-8">
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



                {/* STORY CONTENT */}
                <div className="prose prose-lg max-w-none text-brown-900 leading-loose mb-10 font-serif print:text-xl print:leading-loose print:text-justify">
                    {drackerData.story.split('\n\n').map((paragraph, index) => (
                        <p key={index} className="indent-8 mb-6 text-justify">
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

                {/* ACTIVITIES CONTENT */}
                <Card className="bg-white/50 border-2 border-dashed border-brown-200 print:border-none print:bg-transparent print:p-0">
                    <h3 className="text-lg font-bold text-brown-800 mb-6 flex items-center gap-2 print:text-3xl print:mb-8 print:mt-4 print:border-b print:border-brown-400 print:pb-2 break-before-page">
                        <img src="/dracker_character.png" alt="Brain" className="w-6 h-6 object-contain print:w-10 print:h-10" />
                        Atividades Práticas
                    </h3>
                    <ol className="list-none ml-0 space-y-6">
                        {drackerData.activities.map((act, idx) => {
                            // Handle legacy string case or new object case
                            const isObject = typeof act === 'object' && act !== null;

                            if (!isObject) {
                                // Legacy rendering
                                return (
                                    <li key={idx} className="text-brown-700 font-medium pl-2 border-b border-brown-100 pb-4">
                                        {String(act).split(/(\*\*.*?\*\*)/g).map((part, i) => {
                                            if (part.startsWith('**') && part.endsWith('**')) {
                                                return <strong key={i} className="text-brown-800 font-extrabold">{part.slice(2, -2)}</strong>;
                                            }
                                            return part;
                                        })}
                                    </li>
                                );
                            }

                            // Rich Object Rendering
                            return (
                                <li key={idx} className="bg-brown-50/50 rounded-xl p-4 border border-brown-100 hover:border-brown-200 transition-colors break-inside-avoid print:break-before-page">
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
                                            {/* Split numeric steps (1., 2., 3.) and render as list or with breaks */}
                                            {act.steps.split(/(\d+\.\s+)/).filter(Boolean).reduce((acc, part, i, arr) => {
                                                // If part is a number (e.g. "1. "), it starts a new line.
                                                // Reconstruct: Number + Text
                                                if (/^\d+\.\s+$/.test(part)) {
                                                    // Take this part and the next one
                                                    const text = arr[i + 1];
                                                    if (text) {
                                                        acc.push(
                                                            <div key={i} className="mb-2 flex items-start">
                                                                <span className="font-bold mr-1 min-w-[20px]">{part.trim()}</span>
                                                                <span>{text.trim()}</span>
                                                            </div>
                                                        );
                                                        arr[i + 1] = ''; // Mark as consumed
                                                    }
                                                } else if (part !== '' && i === 0 && !/^\d+\.\s+$/.test(arr[0])) {
                                                    // Handle case where it doesn't start with a number (fallback text)
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
                </Card>

                {/* FOOTER */}
                <div className="mt-8 pt-4 border-t border-brown-100 flex items-center justify-between text-xs text-brown-400 print:mt-auto print:border-brown-800 print:text-brown-600">
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
