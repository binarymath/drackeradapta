
import React, { useState } from 'react';
import { Clock, MessageCircle, Skull, MapPin, Edit3, Save, Book, Users, Play, Printer, Copy } from 'lucide-react';
import { Button } from '../ui/Button';

export const AdventureScreen = ({ adventureData, setView }) => {
    // State for questions editing
    const [editingQuestionId, setEditingQuestionId] = useState(null);
    const [questionTemp, setQuestionTemp] = useState("");

    // State for story editing
    const [editingStoryId, setEditingStoryId] = useState(null);
    const [storyTemp, setStoryTemp] = useState("");

    // State for Chamado (Call) editing
    const [editingChamado, setEditingChamado] = useState(false);
    const [chamadoText, setChamadoText] = useState("");

    // Ensure encounters is always an array
    const initialEncounters = Array.isArray(adventureData?.encounters) ? adventureData.encounters : [];
    const [localEncounters, setLocalEncounters] = useState(initialEncounters);

    // Sync state if props change (e.g. re-generation or switching tabs)
    React.useEffect(() => {
        if (adventureData?.encounters) {
            setLocalEncounters(adventureData.encounters);
        }
        if (adventureData) {
            // Construct the initial Chamado text
            const initialChamado = `${adventureData.intro} O culpado é ${adventureData.villain}! Ele ${adventureData.plot}.`;
            setChamadoText(initialChamado);
        }
    }, [adventureData]);

    const saveQuestionEdit = (idx) => {
        const newEncounters = [...localEncounters];
        newEncounters[idx].question = questionTemp;
        setLocalEncounters(newEncounters);
        setEditingQuestionId(null);
    };

    const saveStoryEdit = (idx) => {
        const newEncounters = [...localEncounters];
        newEncounters[idx].desc = storyTemp;
        setLocalEncounters(newEncounters);
        setEditingStoryId(null);
    };

    const saveChamadoEdit = () => {
        setEditingChamado(false);
        // Note: this only saves to local state. 
        // If "Chamado" was a property of adventureData, we'd ideally propagate it up, 
        // but for now local persistence within the view is the goal.
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        // Optional: Toast notification could be added here
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between bg-brown-200 p-2 rounded-lg print:hidden">
                <div className="flex gap-2">
                    {/* Navigation buttons */}
                </div>
                <div className="flex gap-2">
                    <Button onClick={() => setView('game')} className="text-sm py-1 bg-amber-600 text-white hover:bg-amber-700 border-amber-700 gap-2 shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5">
                        <Play size={16} fill="currentColor" /> Jogar Online
                    </Button>
                    <Button onClick={() => setView('rules')} variant="secondary" className="text-sm py-1 bg-brown-800 text-white hover:bg-brown-900 border-brown-700 gap-2">
                        <Book size={16} /> Regras de XP
                    </Button>
                    <Button onClick={() => setView('management')} variant="secondary" className="text-sm py-1 bg-brown-800 text-white hover:bg-brown-900 border-brown-700 gap-2">
                        <Users size={16} /> Guildas
                    </Button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg border border-brown-200">
                <div className="bg-brown-800 text-amber-400 p-6 flex justify-between items-center print:bg-white print:text-black print:border-b-2 print:border-black rounded-t-xl">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-16 h-16 bg-white rounded-full border-4 border-amber-400 overflow-hidden shadow-lg shrink-0">
                                <img src="/dracker_character.png" alt="Drácker" className="w-full h-full object-cover" />
                            </div>
                            <div>
                                <h2 className="text-3xl font-bold">{adventureData.title}</h2>

                            </div>
                        </div>
                    </div>
                    <Button onClick={() => window.print()} className="print:hidden bg-brown-700 hover:bg-brown-600 border-brown-600">
                        <Printer className="w-5 h-5" />
                    </Button>
                </div>

                <div className="p-6 space-y-6">
                    <div className="flex gap-4 mb-6 bg-amber-50 p-4 rounded-lg border border-amber-100 print:bg-white print:border-black group relative">
                        <div className="shrink-0 w-12 h-12 bg-white rounded-full border-2 border-amber-300 overflow-hidden">
                            <img src="/dracker_character.png" alt="Drácker" className="w-full h-full object-cover" />
                        </div>
                        <div className="w-full">
                            <div className="flex justify-between items-start">
                                <span className="text-xs font-bold text-amber-800 uppercase print:text-black">O Chamado do Drácker</span>
                                {!editingChamado && (
                                    <div className="flex gap-1 absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity print:hidden bg-white/80 p-1 rounded">
                                        <button
                                            onClick={() => setEditingChamado(true)}
                                            className="text-brown-400 hover:text-blue-600"
                                            title="Editar"
                                        >
                                            <Edit3 size={16} />
                                        </button>
                                        <button
                                            onClick={() => copyToClipboard(chamadoText)}
                                            className="text-brown-400 hover:text-green-600"
                                            title="Copiar"
                                        >
                                            <Copy size={16} />
                                        </button>
                                    </div>
                                )}
                            </div>

                            {editingChamado ? (
                                <div className="mt-2 space-y-2">
                                    <textarea
                                        value={chamadoText}
                                        onChange={(e) => setChamadoText(e.target.value)}
                                        className="w-full p-3 border rounded-md text-sm outline-none focus:border-blue-500 bg-white min-h-[100px]"
                                        placeholder="Edite o chamado..."
                                    />
                                    <div className="flex justify-end">
                                        <button onClick={saveChamadoEdit} className="bg-blue-600 text-white px-3 py-1 rounded text-xs font-bold hover:bg-blue-700 flex items-center gap-1">
                                            <Save size={14} /> Salvar
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <p className="italic text-brown-700 text-sm print:text-black mt-1" dangerouslySetInnerHTML={{ __html: chamadoText.replace(/\n/g, '<br/>') }} />
                            )}
                        </div>
                    </div>

                    <div className="relative border-l-2 border-brown-200 ml-4 space-y-8 pb-4 print:border-l-0 print:ml-0">
                        {localEncounters && localEncounters.length > 0 ? (
                            localEncounters.map((enc, idx) => (
                                <div key={idx} className="relative pl-8 print:pl-0 print:mb-4">
                                    <div className={`absolute -left-[17px] top-0 w-9 h-9 rounded-full flex items-center justify-center font-bold border-4 z-10 print:hidden ${idx === 4 ? 'bg-red-500 text-white border-white' : 'bg-white text-brown-500 border-brown-200'}`}>
                                        {idx + 1}
                                    </div>

                                    <div className={`border rounded-lg p-5 shadow-sm print:border-black print:bg-white ${idx === 4 ? 'bg-red-50 border-red-200' : 'bg-white border-brown-200'}`}>
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className={`font-bold text-lg flex items-center gap-2 ${idx === 4 ? 'text-red-900' : 'text-brown-800'} print:text-black`}>
                                                {idx === 4 ? <Skull size={18} /> : <MapPin size={18} />} {enc.title}
                                            </h3>
                                            <span className="text-xs font-bold uppercase px-2 py-1 rounded bg-brown-100 text-brown-500 print:border print:border-black print:text-black">
                                                {enc.difficulty}
                                            </span>
                                        </div>

                                        <div className="mb-3 group relative">
                                            {editingStoryId === enc.id ? (
                                                <div className="space-y-2">
                                                    <textarea
                                                        value={storyTemp}
                                                        onChange={(e) => setStoryTemp(e.target.value)}
                                                        className="w-full p-3 border rounded-md text-sm outline-none focus:border-blue-500 bg-white min-h-[100px]"
                                                        placeholder="Edite a história..."
                                                    />
                                                    <div className="flex justify-end">
                                                        <button onClick={() => saveStoryEdit(idx)} className="bg-blue-600 text-white px-3 py-1 rounded text-xs font-bold hover:bg-blue-700 flex items-center gap-1">
                                                            <Save size={14} /> Salvar
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    <p className="text-sm text-brown-600 italic print:text-black pr-6">{enc.desc}</p>
                                                    <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity print:hidden flex gap-1 bg-white/80 p-1 rounded">
                                                        <button
                                                            onClick={() => { setEditingStoryId(enc.id); setStoryTemp(enc.desc); }}
                                                            className="text-brown-400 hover:text-blue-600"
                                                            title="Editar"
                                                        >
                                                            <Edit3 size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => copyToClipboard(enc.desc)}
                                                            className="text-brown-400 hover:text-green-600"
                                                            title="Copiar"
                                                        >
                                                            <Copy size={16} />
                                                        </button>
                                                    </div>
                                                </>
                                            )}
                                        </div>

                                        <div className={`p-4 rounded-lg border relative ${idx === 4 ? 'bg-white border-red-100' : 'bg-brown-50 border-brown-200'} print:bg-white print:border-black`}>
                                            <span className="absolute -top-2.5 left-3 bg-white px-2 text-[10px] font-bold uppercase text-brown-400 border rounded print:text-black print:border-black">
                                                Pergunta do Mestre
                                            </span>

                                            {editingQuestionId === enc.id ? (
                                                <div className="space-y-2 mt-1">
                                                    <textarea
                                                        value={questionTemp}
                                                        onChange={(e) => setQuestionTemp(e.target.value)}
                                                        className="w-full p-3 border rounded text-sm outline-none focus:border-blue-500 min-h-[80px]"
                                                        placeholder="Edite a pergunta..."
                                                    />
                                                    <div className="flex justify-end">
                                                        <button onClick={() => saveQuestionEdit(idx)} className="bg-blue-600 text-white px-3 py-1 rounded text-xs font-bold hover:bg-blue-700 flex items-center gap-1">
                                                            <Save size={14} /> Salvar
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="group relative">
                                                    <p className="font-medium text-brown-900 mt-1 print:text-black pr-6">"{enc.question}"</p>
                                                    <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity print:hidden flex gap-1 bg-white/50 p-1 rounded">
                                                        <button
                                                            onClick={() => { setEditingQuestionId(enc.id); setQuestionTemp(enc.question); }}
                                                            className="text-brown-400 hover:text-blue-600"
                                                            title="Editar"
                                                        >
                                                            <Edit3 size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => copyToClipboard(enc.question)}
                                                            className="text-brown-400 hover:text-green-600"
                                                            title="Copiar"
                                                        >
                                                            <Copy size={16} />
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="p-4 text-center text-brown-50 italic">
                                Nenhum encontro gerado nesta aventura.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
