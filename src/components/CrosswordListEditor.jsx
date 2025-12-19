import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Save, Sparkles, FileText } from 'lucide-react';

// UI Components
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Input, TextArea } from './ui/Input';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';

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

    const footer = (
        <div className="flex justify-between items-center w-full">
            <div className="text-sm text-brown-500">
                Total: <b>{words.length}</b> palavras
            </div>
            <div className="flex gap-3">
                <Button onClick={onCancel} variant="secondary">Cancelar</Button>
                <Button onClick={handleConfirm} icon={Save}>Gerar Jogo</Button>
            </div>
        </div>
    );

    return (
        <Modal
            isOpen={true}
            onClose={onCancel}
            title="Gerador de Palavras Cruzadas"
            icon={Sparkles}
            size="xl"
            footer={footer}
        >
            <div className="space-y-6">

                {/* Topic Input */}
                <Card>
                    <Input
                        label="Título / Tema"
                        value={topicInput}
                        onChange={(e) => setTopicInput(e.target.value)}
                        className="text-lg font-bold"
                        placeholder="Ex: Sistema Solar"
                    />
                </Card>

                <Card className="p-0 overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-brown-100/50 border-b border-brown-200">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-bold text-brown-600 uppercase w-12">#</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-brown-600 uppercase w-1/3">Palavra (Resposta)</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-brown-600 uppercase">Dica (Pergunta)</th>
                                <th className="px-4 py-3 text-center text-xs font-bold text-brown-600 uppercase w-16">Ação</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-brown-100">
                            {words.map((item, idx) => (
                                <tr key={idx} className="hover:bg-brown-50 transition-colors group">
                                    <td className="px-4 py-3 text-center font-mono text-brown-400 text-xs">
                                        {idx + 1}
                                    </td>
                                    <td className="px-4 py-3">
                                        <input
                                            value={item.word}
                                            onChange={(e) => handleChange(idx, 'word', e.target.value)}
                                            className="w-full font-bold uppercase text-brown-800 bg-transparent border border-transparent hover:border-brown-300 focus:border-brown-500 focus:bg-white rounded px-2 py-1 outline-none transition-all"
                                            placeholder="PALAVRA"
                                        />
                                    </td>
                                    <td className="px-4 py-3">
                                        <textarea
                                            value={item.clue}
                                            onChange={(e) => handleChange(idx, 'clue', e.target.value)}
                                            rows={1}
                                            className="w-full text-brown-700 bg-transparent border border-transparent hover:border-brown-300 focus:border-brown-500 focus:bg-white rounded px-2 py-1 outline-none resize-none overflow-hidden transition-all"
                                            placeholder="Dica para esta palavra..."
                                            onInput={(e) => {
                                                e.target.style.height = 'auto';
                                                e.target.style.height = e.target.scrollHeight + 'px';
                                            }}
                                        />
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <Button
                                            onClick={() => handleRemoveWord(idx)}
                                            variant="ghost"
                                            className="p-2 text-brown-400 hover:text-red-500 hover:bg-red-50 h-auto"
                                            title="Remover palavra"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {words.length === 0 && (
                        <div className="p-8 text-center text-brown-400 italic">
                            Nenhuma palavra na lista. Adicione algumas!
                        </div>
                    )}

                    <div className="p-4 bg-brown-50 border-t border-brown-200">
                        <Button
                            onClick={handleAddWord}
                            variant="secondary"
                            className="bg-transparent hover:bg-brown-200"
                            icon={Plus}
                        >
                            Adicionar Nova Palavra
                        </Button>
                    </div>
                </Card>
            </div>
        </Modal>
    );
};
