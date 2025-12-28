import React, { useState, useEffect } from 'react';
import { X, Plus, Trash, Save } from 'lucide-react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Card } from './ui/Card';

export function ConnectDotsEditorModal({ isOpen, onClose, initialData, onConfirm }) {
    const [pairs, setPairs] = useState([]);

    useEffect(() => {
        if (isOpen && initialData) {
            setPairs(initialData);
        }
    }, [isOpen, initialData]);

    const handleUpdate = (id, field, value) => {
        setPairs(prev => prev.map(p =>
            p.id === id ? { ...p, [field]: value } : p
        ));
    };

    const handleDelete = (id) => {
        if (pairs.length <= 2) {
            alert("É necessário ter pelo menos 2 pares.");
            return;
        }
        setPairs(prev => prev.filter(p => p.id !== id));
    };

    const handleAdd = () => {
        const newId = Math.max(...pairs.map(p => p.id), 0) + 1;
        setPairs([...pairs, {
            id: newId,
            text: "Nova Pergunta",
            emoji: "Nova Resposta ✨",
            color: "bg-slate-100 border-slate-400"
        }]);
    };

    const handleSave = () => {
        // Basic validation
        if (pairs.some(p => !p.text.trim() || !p.emoji.trim())) {
            alert("Preencha todos os campos.");
            return;
        }
        onConfirm(pairs);
    };

    const availableColors = [
        'bg-blue-100 border-blue-400',
        'bg-green-100 border-green-400',
        'bg-red-100 border-red-400',
        'bg-yellow-100 border-yellow-400',
        'bg-purple-100 border-purple-400',
        'bg-orange-100 border-orange-400'
    ];

    const cycleColor = (id) => {
        setPairs(prev => prev.map(p => {
            if (p.id !== id) return p;
            const currentIndex = availableColors.indexOf(p.color);
            const nextIndex = (currentIndex + 1) % availableColors.length;
            return { ...p, color: availableColors[nextIndex] };
        }));
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Editar Liga Pontos">
            <div className="space-y-4 max-h-[70vh] overflow-y-auto p-1">

                {pairs.map((pair, index) => (
                    <Card key={pair.id} className="p-3 flex flex-col md:flex-row gap-3 items-center bg-gray-50 border-gray-200">
                        <span className="font-bold text-gray-500 w-6">{index + 1}.</span>

                        <div className="flex-1 w-full">
                            <label className="text-xs font-semibold text-gray-600 mb-1 block">Pergunta (Esquerda)</label>
                            <Input
                                value={pair.text}
                                onChange={(e) => handleUpdate(pair.id, 'text', e.target.value)}
                                maxLength={40}
                            />
                        </div>

                        <div className="flex-1 w-full">
                            <label className="text-xs font-semibold text-gray-600 mb-1 block">Resposta (Direita)</label>
                            <Input
                                value={pair.emoji}
                                onChange={(e) => handleUpdate(pair.id, 'emoji', e.target.value)}
                                maxLength={40}
                            />
                        </div>

                        <div className="flex flex-col items-center gap-1">
                            <label className="text-xs font-semibold text-gray-600">Cor</label>
                            <button
                                onClick={() => cycleColor(pair.id)}
                                className={`w-8 h-8 rounded-full border-2 ${pair.color.replace('bg-', 'bg-').split(' ')[0]} ${pair.color.split(' ')[1]}`}
                                title="Clique para mudar a cor"
                            />
                        </div>

                        <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => handleDelete(pair.id)}
                            className="mt-4 md:mt-0"
                        >
                            <Trash className="w-4 h-4" />
                        </Button>
                    </Card>
                ))}

                <Button onClick={handleAdd} variant="outline" className="w-full dashed border-2">
                    <Plus className="w-4 h-4 mr-2" /> Adicionar Par
                </Button>
            </div>

            <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
                <Button variant="ghost" onClick={onClose}>Cancelar</Button>
                <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700 text-white">
                    <Save className="w-4 h-4 mr-2" /> Salvar Alterações
                </Button>
            </div>
        </Modal>
    );
}
