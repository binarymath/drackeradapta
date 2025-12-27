import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Save, Sparkles, FileText, Pencil, Check } from 'lucide-react';

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
    const [editingIndices, setEditingIndices] = useState(new Set());

    useEffect(() => {
        if (initialData && initialData.words) {
            setWords(initialData.words);
        }
    }, [initialData]);

    const handleAddWord = () => {
        const newIdx = words.length;
        setWords([...words, { word: '', clue: '' }]);
        setEditingIndices(prev => new Set(prev).add(newIdx));
    };

    const handleRemoveWord = (index) => {
        const newWords = [...words];
        newWords.splice(index, 1);
        setWords(newWords);

        // Adjust editing indices
        const newSet = new Set();
        editingIndices.forEach(idx => {
            if (idx < index) newSet.add(idx);
            if (idx > index) newSet.add(idx - 1);
        });
        setEditingIndices(newSet);
    };

    const toggleEdit = (index) => {
        setEditingIndices(prev => {
            const next = new Set(prev);
            if (next.has(index)) {
                next.delete(index);
            } else {
                next.add(index);
            }
            return next;
        });
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
                                <th className="px-4 py-3 text-center text-xs font-bold text-brown-600 uppercase w-24">Ação</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-brown-100">
                            {words.map((item, idx) => {
                                const isEditing = editingIndices.has(idx);
                                return (
                                    <tr key={idx} className={`transition-colors ${isEditing ? 'bg-brown-50' : 'hover:bg-brown-50'}`}>
                                        <td className="px-4 py-3 text-center font-mono text-brown-400 text-xs">
                                            {idx + 1}
                                        </td>
                                        <td className="px-4 py-3">
                                            {isEditing ? (
                                                <input
                                                    value={item.word}
                                                    onChange={(e) => handleChange(idx, 'word', e.target.value)}
                                                    className="w-full font-bold uppercase text-brown-800 bg-white border border-brown-300 focus:border-brown-500 rounded px-2 py-1 outline-none transition-all shadow-sm"
                                                    placeholder="PALAVRA"
                                                    autoFocus
                                                />
                                            ) : (
                                                <span className="font-bold text-brown-800 pl-2 block">{item.word || '...'}</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            {isEditing ? (
                                                <textarea
                                                    value={item.clue}
                                                    onChange={(e) => handleChange(idx, 'clue', e.target.value)}
                                                    rows={2}
                                                    className="w-full text-brown-700 bg-white border border-brown-300 focus:border-brown-500 rounded px-2 py-1 outline-none resize-none transition-all shadow-sm"
                                                    placeholder="Dica para esta palavra..."
                                                />
                                            ) : (
                                                <span className="text-brown-600 pl-2 block leading-snug">{item.clue || '...'}</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                <Button
                                                    onClick={() => toggleEdit(idx)}
                                                    variant="ghost"
                                                    className={`p-2 h-auto ${isEditing ? 'text-green-600 hover:bg-green-50' : 'text-brown-400 hover:bg-brown-100'}`}
                                                    title={isEditing ? "Salvar edição" : "Editar palavra"}
                                                >
                                                    {isEditing ? <Check className="w-4 h-4" /> : <Pencil className="w-4 h-4" />}
                                                    {/* Using Sparkles as generic edit for consistency with header, but user asked for 'Edit' option. 
                                                        Actually, for Edit commonly Pencil is used. I'll stick to a Pencil icon if available or Edit icon.
                                                        The original imports had Sparkles, FileText. I might need to import Pencil or Edit.
                                                        Checking imports: X, Plus, Trash2, Save, Sparkles, FileText.
                                                        Let's add Pencil and Check to imports for better UX.
                                                    */}
                                                </Button>
                                                <Button
                                                    onClick={() => handleRemoveWord(idx)}
                                                    variant="ghost"
                                                    className="p-2 text-brown-400 hover:text-red-500 hover:bg-red-50 h-auto"
                                                    title="Remover palavra"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
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
