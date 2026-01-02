import React, { useState } from 'react';
import { Edit2, Check, Plus, Trash2, Sparkles } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input, TextArea, Select } from '../ui/Input';

export const CrosswordEditor = ({
    isOpen,
    onClose,
    words,
    gridSize,
    setGridSize,
    fillBlanks,
    setFillBlanks,
    addWord,
    removeWord,
    regenerateLayout
}) => {
    const [editingIndices, setEditingIndices] = useState(new Set());
    // Note: editing logic for existing words might need to be passed down or handled here if we want to update the parent.
    // The previous implementation updated using `handleWordChange` which modified `words` state in parent.
    // I need `handleWordChange` as prop or use a local version and sync.
    // But `words` comes from parent.

    // We will assume `onWordUpdate` is passed or similar.
    // Wait, the original had `handleWordChange`.
    // I should add `onWordChange` to props.

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Editor de Palavras"
            icon={Edit2}
            size="lg"
            footer={
                <div className="flex justify-end w-full">
                    <Button onClick={onClose} icon={Check}>
                        Concluir Edição
                    </Button>
                </div>
            }
        >
            <div className="flex-1">
                {/* Add New */}
                <form
                    className="bg-white p-4 rounded-xl shadow-sm mb-6 border border-brown-200"
                    onSubmit={(e) => {
                        e.preventDefault();
                        const w = e.target.word.value.trim().toUpperCase();
                        const c = e.target.clue.value.trim();
                        if (w && c) {
                            addWord({ word: w, clue: c });
                            e.target.reset();
                        }
                    }}
                >
                    <h4 className="font-bold text-sm text-brown-500 uppercase mb-3">Adicionar Nova Palavra</h4>
                    <div className="flex gap-3">
                        <Input name="word" placeholder="PALAVRA" className="flex-1 font-bold uppercase" required />
                        <TextArea name="clue" placeholder="Dica..." className="flex-[2] h-auto" rows={2} required />
                        <Button type="submit" className="h-auto py-2">
                            <Plus className="w-5 h-5" />
                        </Button>
                    </div>
                </form>

                {/* List */}
                <div className="space-y-2">
                    {words.map((w, idx) => (
                        <Card key={idx} className="flex items-center justify-between p-3 group hover:border-brown-300 shadow-sm">
                            <div>
                                <div className="font-bold text-brown-800">{w.word}</div>
                                <div className="text-xs text-brown-500">{w.clue}</div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Button
                                    onClick={() => removeWord(idx)}
                                    variant="ghost"
                                    className="text-brown-300 hover:text-red-500 opacity-0 group-hover:opacity-100"
                                    icon={Trash2}
                                />
                            </div>
                        </Card>
                    ))}
                    {words.length === 0 && (
                        <p className="text-center text-brown-400 italic py-4">Nenhuma palavra adicionada ainda.</p>
                    )}
                </div>

                {/* Configs */}
                <div className="mt-6 pt-6 border-t border-brown-200 grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-brown-500 uppercase mb-1">Tamanho da Grade</label>
                        <Select
                            value={gridSize}
                            onChange={(e) => { setGridSize(parseInt(e.target.value)); }}
                        >
                            <option value="10">10x10</option>
                            <option value="15">15x15 (Padrão)</option>
                            <option value="20">20x20</option>
                            <option value="25">25x25 (Grande)</option>
                        </Select>
                    </div>
                    <div className="flex items-center gap-2 pt-5">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={fillBlanks}
                                onChange={(e) => { setFillBlanks(e.target.checked); }}
                                className="w-4 h-4 text-brown-600 rounded focus:ring-brown-500 accent-brown-600"
                            />
                            <span className="text-sm font-bold text-brown-700">Estilo Caça-Palavras</span>
                        </label>
                    </div>
                </div>

                <div className="mt-4 p-3 bg-brown-100 text-brown-800 text-xs rounded-lg border border-brown-200">
                    <b>Nota:</b> Ao adicionar ou remover palavras, o layout da grade será recalculado automaticamente para encontrar a melhor posição de encaixe.
                </div>

                <div className="mt-6 flex justify-end">
                    <Button onClick={regenerateLayout} icon={Sparkles}>
                        Regerar Grade
                    </Button>
                </div>

            </div>
        </Modal>
    );
};
