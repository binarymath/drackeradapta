import React, { useState, useEffect } from 'react';
import { X, Save, Plus, Trash2, GripVertical, Music } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// UI Components
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Input, TextArea } from './ui/Input';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';

const SortableQuestionItem = ({ question, index, onRemove, onChange, id }) => {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div ref={setNodeRef} style={style} className="flex items-start gap-2 group transition-all">
            <button {...attributes} {...listeners} className="mt-4 text-brown-300 cursor-move hover:text-brown-500 touch-none">
                <GripVertical className="w-5 h-5" />
            </button>
            <div className="flex-1">
                <label className="text-xs font-bold text-brown-500 mb-1 block">Pergunta {index + 1}</label>
                <TextArea
                    value={question}
                    onChange={(e) => onChange(id, e.target.value)}
                    className="min-h-[100px]"
                    placeholder="Digite a pergunta aqui..."
                />
            </div>
            <Button
                onClick={() => onRemove(id)}
                variant="ghost"
                className="mt-6 p-2 text-brown-300 hover:text-red-500 hover:bg-red-50"
                title="Excluir pergunta"
            >
                <Trash2 className="w-5 h-5" />
            </Button>
        </div>
    );
};

export const MusicEditorModal = ({ isOpen, onClose, onSave, initialData }) => {
    const [lyrics, setLyrics] = useState('');
    const [questions, setQuestions] = useState([]);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    useEffect(() => {
        if (isOpen && initialData) {
            setLyrics(initialData.lyrics || '');
            // Ensure questions have IDs for dnd-kit
            const initialQuestions = (initialData.questions || []).map((q, idx) => ({
                id: `q-${Date.now()}-${idx}`,
                text: typeof q === 'string' ? q : q.text || ''
            }));
            setQuestions(initialQuestions);
        }
    }, [isOpen, initialData]);

    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (active.id !== over.id) {
            setQuestions((items) => {
                const oldIndex = items.findIndex(i => i.id === active.id);
                const newIndex = items.findIndex(i => i.id === over.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    const handleQuestionChange = (id, newText) => {
        setQuestions(prev => prev.map(q => q.id === id ? { ...q, text: newText } : q));
    };

    const addQuestion = () => {
        setQuestions([...questions, { id: `q-${Date.now()}`, text: '' }]);
    };

    const removeQuestion = (id) => {
        if (questions.length <= 1) {
            alert("Você precisa ter pelo menos uma pergunta.");
            return;
        }
        setQuestions(questions.filter(q => q.id !== id));
    };

    const handleSave = () => {
        onSave({
            lyrics,
            questions: questions.map(q => q.text)
        });
        onClose();
    };

    const footer = (
        <div className="flex justify-end gap-3 w-full">
            <Button onClick={onClose} variant="secondary">Cancelar</Button>
            <Button onClick={handleSave} icon={Save}>Salvar Edições</Button>
        </div>
    );

    if (!isOpen) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Editor: Música do Drácker"
            icon={Music}
            size="xl" // Using standard size enum if xl is not valid, but let's assume xl is supported in Modal
            footer={footer}
        >
            <div className="flex flex-col md:flex-row gap-6 h-full min-h-[500px]">

                {/* Left: Lyrics Editor */}
                <div className="flex-1 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                        <h3 className="font-bold text-brown-700 flex items-center gap-2">
                            🎵 Letra da Música
                        </h3>
                        <Badge variant="info">Markdown Suportado</Badge>
                    </div>
                    <TextArea
                        value={lyrics}
                        onChange={(e) => setLyrics(e.target.value)}
                        className="flex-1 font-mono text-sm leading-relaxed"
                        placeholder="[Intro]..."
                    />
                </div>

                {/* Right: Questions Editor */}
                <div className="flex-1 flex flex-col gap-4 overflow-y-auto">
                    <div className="flex items-center justify-between">
                        <h3 className="font-bold text-brown-700 flex items-center gap-2">
                            📝 Perguntas ({questions.length})
                        </h3>
                        <Button
                            onClick={addQuestion}
                            variant="secondary"
                            className="bg-brown-100 border-brown-200 text-xs py-1"
                            icon={Plus}
                        >
                            Adicionar
                        </Button>
                    </div>

                    <Card className="flex-1 bg-brown-50/50 border-brown-100 overflow-y-auto max-h-[500px]">
                        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                            <SortableContext items={questions.map(q => q.id)} strategy={verticalListSortingStrategy}>
                                <div className="space-y-4">
                                    {questions.map((q, index) => (
                                        <SortableQuestionItem
                                            key={q.id}
                                            id={q.id}
                                            question={q.text}
                                            index={index}
                                            onRemove={removeQuestion}
                                            onChange={handleQuestionChange}
                                        />
                                    ))}
                                </div>
                            </SortableContext>
                        </DndContext>
                    </Card>
                </div>
            </div>
        </Modal>
    );
};
