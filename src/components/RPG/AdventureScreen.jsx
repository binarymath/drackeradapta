
import React, { useState } from 'react';
import { Clock, MessageCircle, Skull, MapPin, Edit3, Save, Book, Users, Play, Printer } from 'lucide-react';
import { Button } from '../ui/Button';

export const AdventureScreen = ({ adventureData, setView }) => {
    const [editingId, setEditingId] = useState(null);
    const [editTemp, setEditTemp] = useState("");
    // Local state to manage edits without prop drilling save function for now, 
    // or we could pass a handler if we want persistence to bubble up.
    // For now, let's keep local state for the questions update inside this view 
    // (though ideally it should update the main state).

    // Ensure encounters is always an array
    const initialEncounters = Array.isArray(adventureData?.encounters) ? adventureData.encounters : [];
    const [localEncounters, setLocalEncounters] = useState(initialEncounters);

    // Sync state if props change (e.g. re-generation or switching tabs)
    React.useEffect(() => {
        if (adventureData?.encounters) {
            setLocalEncounters(adventureData.encounters);
        }
    }, [adventureData]);

    const saveEdit = (idx) => {
        const newEncounters = [...localEncounters];
        newEncounters[idx].question = editTemp;
        setLocalEncounters(newEncounters);
        setEditingId(null);
        // Here we would call onUpdate(newEncounters) if provided
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
                    <div className="flex gap-4 mb-6 bg-amber-50 p-4 rounded-lg border border-amber-100 print:bg-white print:border-black">
                        <div className="shrink-0 w-12 h-12 bg-white rounded-full border-2 border-amber-300 overflow-hidden">
                            <img src="/dracker_character.png" alt="Drácker" className="w-full h-full object-cover" />
                        </div>
                        <div>
                            <span className="text-xs font-bold text-amber-800 uppercase print:text-black">O Chamado do Drácker</span>
                            <p className="italic text-brown-700 text-sm print:text-black">
                                "{adventureData.intro} O culpado é <strong>{adventureData.villain}</strong>! Ele {adventureData.plot}."
                            </p>
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

                                        <p className="text-sm text-brown-600 mb-3 italic print:text-black">{enc.desc}</p>

                                        <div className={`p-4 rounded-lg border relative ${idx === 4 ? 'bg-white border-red-100' : 'bg-brown-50 border-brown-200'} print:bg-white print:border-black`}>
                                            <span className="absolute -top-2.5 left-3 bg-white px-2 text-[10px] font-bold uppercase text-brown-400 border rounded print:text-black print:border-black">
                                                Pergunta do Mestre
                                            </span>

                                            {editingId === enc.id ? (
                                                <div className="flex gap-2 mt-1">
                                                    <textarea
                                                        value={editTemp}
                                                        onChange={(e) => setEditTemp(e.target.value)}
                                                        className="w-full p-2 border rounded text-sm outline-none focus:border-blue-500"
                                                        rows={2}
                                                    />
                                                    <button onClick={() => saveEdit(idx)} className="bg-blue-600 text-white px-3 rounded text-xs font-bold hover:bg-blue-700">
                                                        <Save size={14} /> Salvar
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="group relative">
                                                    <p className="font-medium text-brown-900 mt-1 print:text-black">"{enc.question}"</p>
                                                    <button
                                                        onClick={() => { setEditingId(enc.id); setEditTemp(enc.question); }}
                                                        className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 text-brown-400 hover:text-blue-600 transition-opacity print:hidden"
                                                    >
                                                        <Edit3 size={16} />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="p-4 text-center text-brown-500 italic">
                                Nenhum encontro gerado nesta aventura.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
