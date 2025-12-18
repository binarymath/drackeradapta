import React, { useState, useEffect } from 'react';
import { X, Save, Plus, Trash2, GripVertical, Music } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const SortableQuestionItem = ({ question, index, onRemove, onChange, id }) => {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div ref={setNodeRef} style={style} className="flex items-start gap-2 bg-slate-50 p-2 rounded border border-slate-200 group">
            <button {...attributes} {...listeners} className="mt-2 text-slate-400 cursor-move hover:text-slate-600 touch-none">
                <GripVertical className="w-5 h-5" />
            </button>
            <div className="flex-1">
                <label className="text-xs font-bold text-slate-500 mb-1 block">Pergunta {index + 1}</label>
                <textarea
                    value={question}
                    onChange={(e) => onChange(id, e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-blue-500 min-h-[100px] resize-y"
                    placeholder="Digite a pergunta aqui..."
                />
            </div>
            <button onClick={() => onRemove(id)} className="mt-2 text-red-300 hover:text-red-500 hover:bg-red-50 p-1 rounded transition-colors">
                <Trash2 className="w-5 h-5" />
            </button>
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

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <Music className="w-5 h-5 text-purple-600" /> Editor: Música do Drácker
                    </h2>
                    <div className="flex gap-2">
                        <button onClick={handleSave} className="px-4 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 flex items-center gap-2 text-sm shadow-sm transition-all hover:scale-105">
                            <Save className="w-4 h-4" /> Salvar Edições
                        </button>
                        <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500">
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-hidden flex flex-col md:flex-row">

                    {/* Left: Lyrics Editor */}
                    <div className="flex-1 p-6 border-r border-slate-100 overflow-y-auto bg-white">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-slate-700 flex items-center gap-2">
                                🎵 Letra da Música
                            </h3>
                            <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded">Markdown Suportado</span>
                        </div>
                        <textarea
                            value={lyrics}
                            onChange={(e) => setLyrics(e.target.value)}
                            className="w-full h-[calc(100%-3rem)] p-4 border border-slate-200 rounded-lg text-sm leading-relaxed font-mono focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none bg-slate-50"
                            placeholder="[Intro]..."
                        />
                    </div>

                    {/* Right: Questions Editor */}
                    <div className="flex-1 p-6 overflow-y-auto bg-slate-50/50">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-slate-700 flex items-center gap-2">
                                📝 Perguntas de Interpretação
                            </h3>
                            <button onClick={addQuestion} className="text-xs bg-purple-100 text-purple-700 px-3 py-1.5 rounded-full font-bold hover:bg-purple-200 flex items-center gap-1 transition-colors">
                                <Plus className="w-3 h-3" /> Adicionar
                            </button>
                        </div>

                        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                            <SortableContext items={questions.map(q => q.id)} strategy={verticalListSortingStrategy}>
                                <div className="space-y-3 pb-10">
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
                    </div>
                </div>
            </div>
        </div>
    );
};
