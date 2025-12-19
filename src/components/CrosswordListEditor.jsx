import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Save, Sparkles, FileText } from 'lucide-react';

export const CrosswordListEditor = ({
    initialData,
    onConfirm,
    onCancel,
    topic
}) => {
    // Initial State: Map incoming simple list or object structure
    const [words, setWords] = useState([]);
    const [topicInput, setTopicInput] = useState(topic || "");

    useEffect(() => {
        if (initialData && initialData.words) {
            setWords(initialData.words);
        }
    }, [initialData]);

    const handleAddWord = () => {
        setWords([...words, { word: '', clue: '' }]);
    };

    const handleRemoveWord = (index) => {
        const newWords = [...words];
        newWords.splice(index, 1);
        setWords(newWords);
    };

    const handleChange = (index, field, value) => {
        const newWords = [...words];
        newWords[index] = { ...newWords[index], [field]: value };
        // Force uppercase for words
        if (field === 'word') {
            newWords[index][field] = value.toUpperCase();
        }
        setWords(newWords);
    };

    const handleConfirm = () => {
        // Filter empty entries
        const validWords = words.filter(w => w.word.trim() && w.clue.trim());
        if (validWords.length < 2) {
            alert("Adicione pelo menos 2 palavras válidas.");
            return;
        }
        onConfirm({ words: validWords, topic: topicInput });
    };

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white w-full max-w-4xl rounded-xl shadow-2xl flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 flex justify-between items-center text-white shrink-0 rounded-t-xl">
                    <div>
                        <h2 className="text-2xl font-bold flex items-center gap-2">
                            <Sparkles className="w-6 h-6 text-yellow-300" />
                            Gerador de Palavras Cruzadas
                        </h2>
                        <p className="text-blue-100 text-sm mt-1">
                            Revise as palavras sugeridas pela IA antes de criar o jogo.
                        </p>
                    </div>
                    <button
                        onClick={onCancel}
                        className="p-2 hover:bg-white/20 rounded-full transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-slate-50">

                    {/* Topic Input */}
                    <div className="mb-6 bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                            Título / Tema
                        </label>
                        <input
                            value={topicInput}
                            onChange={(e) => setTopicInput(e.target.value)}
                            className="w-full text-lg font-bold border-b-2 border-slate-200 focus:border-blue-500 outline-none py-1 bg-transparent text-slate-800"
                            placeholder="Ex: Sistema Solar"
                        />
                    </div>

                    <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-slate-100 border-b border-slate-200">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase w-12">#</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase w-1/3">Palavra (Resposta)</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Dica (Pergunta)</th>
                                    <th className="px-4 py-3 text-center text-xs font-bold text-slate-500 uppercase w-16">Ação</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {words.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-blue-50/50 transition-colors group">
                                        <td className="px-4 py-3 text-center font-mono text-slate-400 text-xs">
                                            {idx + 1}
                                        </td>
                                        <td className="px-4 py-3">
                                            <input
                                                value={item.word}
                                                onChange={(e) => handleChange(idx, 'word', e.target.value)}
                                                className="w-full font-bold uppercase text-slate-700 bg-transparent border border-transparent hover:border-slate-300 focus:border-blue-500 focus:bg-white rounded px-2 py-1 outline-none"
                                                placeholder="PALAVRA"
                                            />
                                        </td>
                                        <td className="px-4 py-3">
                                            <textarea
                                                value={item.clue}
                                                onChange={(e) => handleChange(idx, 'clue', e.target.value)}
                                                rows={1}
                                                className="w-full text-slate-600 bg-transparent border border-transparent hover:border-slate-300 focus:border-blue-500 focus:bg-white rounded px-2 py-1 outline-none resize-none overflow-hidden"
                                                placeholder="Dica para esta palavra..."
                                                onInput={(e) => {
                                                    e.target.style.height = 'auto';
                                                    e.target.style.height = e.target.scrollHeight + 'px';
                                                }}
                                            />
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <button
                                                onClick={() => handleRemoveWord(idx)}
                                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                                                title="Remover palavra"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {words.length === 0 && (
                            <div className="p-8 text-center text-slate-400 italic">
                                Nenhuma palavra na lista. Adicione algumas!
                            </div>
                        )}

                        <div className="p-4 bg-slate-50 border-t border-slate-200">
                            <button
                                onClick={handleAddWord}
                                className="flex items-center gap-2 text-blue-600 font-bold hover:bg-blue-100 px-4 py-2 rounded transition-colors text-sm"
                            >
                                <Plus className="w-4 h-4" /> Adicionar Nova Palavra
                            </button>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 bg-white border-t border-slate-200 flex justify-between items-center shrink-0 rounded-b-xl">
                    <div className="text-sm text-slate-500">
                        Total: <b>{words.length}</b> palavras
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={onCancel}
                            className="px-6 py-3 rounded-lg text-slate-600 font-bold hover:bg-slate-100 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleConfirm}
                            className="px-8 py-3 rounded-lg bg-blue-600 text-white font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center gap-2"
                        >
                            <Save className="w-5 h-5" /> Gerar Jogo
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};
