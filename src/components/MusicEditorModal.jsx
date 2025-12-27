import React, { useState, useEffect } from 'react';
import { Save, Plus, Trash2, GripVertical, Music } from 'lucide-react';
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
                    value={question.text}
                    onChange={(e) => onChange(id, 'text', e.target.value)}
                    className="min-h-[100px]"
                    placeholder="Digite a pergunta aqui..."
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                    <Input
                        label="Resposta correta"
                        value={question.correctAnswer}
                        onChange={(e) => onChange(id, 'correct', e.target.value)}
                        placeholder="Alternativa correta"
                    />
                    {question.distractors.map((opt, optIdx) => (
                        <Input
                            key={optIdx}
                            label={`Alternativa incorreta ${optIdx + 1}`}
                            value={opt}
                            onChange={(e) => onChange(id, 'distractor', e.target.value, optIdx)}
                            placeholder="Digite uma alternativa incorreta"
                        />
                    ))}
                </div>
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
            // Ensure questions have IDs for dnd-kit and already carry alternatives
            const initialQuestions = (initialData.questions || []).map((q, idx) => {
                const text = typeof q === 'string' ? q : (q.text || q.question || '');
                const correct = typeof q === 'object' ? (q.correctAnswer || q.correct_answer || q.answer || q.correct_option || '') : '';
                const distractors = typeof q === 'object' ? (q.distractors || q.incorrect_options || []) : [];
                const filledDistractors = [...distractors];
                while (filledDistractors.length < 3) filledDistractors.push('');
                return {
                    id: `q-${Date.now()}-${idx}-${Math.floor(Math.random() * 1000)}`,
                    text,
                    correctAnswer: correct,
                    distractors: filledDistractors.slice(0, 3),
                    difficulty: (q.difficulty || (idx < 4 ? 'facil' : idx < 8 ? 'medio' : 'dificil'))
                };
            });
            setQuestions(initialQuestions.length ? initialQuestions : [{ id: `q-${Date.now()}-0`, text: '', correctAnswer: '', distractors: ['', '', ''] }]);
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

    const handleQuestionChange = (id, field, value, distractorIndex = 0) => {
        setQuestions(prev => prev.map(q => {
            if (q.id !== id) return q;
            if (field === 'text') return { ...q, text: value };
            if (field === 'correct') return { ...q, correctAnswer: value };
            if (field === 'distractor') {
                const next = [...(q.distractors || [])];
                next[distractorIndex] = value;
                return { ...q, distractors: next };
            }
            return q;
        }));
    };

    const addQuestion = () => {
        setQuestions([...questions, { id: `q-${Date.now()}-${Math.floor(Math.random() * 1000)}`, text: '', correctAnswer: '', distractors: ['', '', ''] }]);
    };

    const removeQuestion = (id) => {
        if (questions.length <= 1) {
            alert("Você precisa ter pelo menos uma pergunta.");
            return;
        }
        setQuestions(questions.filter(q => q.id !== id));
    };

    const handleSave = () => {
        // Build normalized questions with options
        let normalizedQuestions = questions.map(q => {
            const cleanedDistractors = (q.distractors || []).map(d => d?.trim()).filter(Boolean);
            const options = Array.from(new Set([q.correctAnswer, ...cleanedDistractors].filter(Boolean)));
            return {
                text: q.text,
                correctAnswer: q.correctAnswer,
                distractors: cleanedDistractors,
                options,
                ordered_options: options.sort(() => Math.random() - 0.5),
                difficulty: q.difficulty || ''
            };
        });
        // Removed 10-question enforcement to respect user choice/generation

        // Enforce difficulty distribution: 4 fácil, 4 médio, 2 difícil
        normalizedQuestions = normalizedQuestions.map((q, idx) => ({
            ...q,
            difficulty: (idx < 4 ? 'facil' : idx < 8 ? 'medio' : 'dificil')
        }));

        onSave({
            lyrics,
            questions: normalizedQuestions
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
            <div className="space-y-4">
                {/* Destaque da Playlist */}
                {/* Destaque da Playlist */}
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-300 rounded-lg overflow-hidden shadow-sm flex flex-col sm:flex-row">
                    <div className="w-full sm:w-32 h-32 relative">
                        <img
                            src="/cover_musica_dracker.jpg"
                            alt="Capa Playlist"
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <div className="p-4 flex flex-col justify-center flex-1">
                        <div className="flex items-center justify-between">
                            <div>
                                <h4 className="font-bold text-purple-900 text-lg">Playlist Oficial: Músicas do Drácker</h4>
                                <p className="text-sm text-purple-700 mb-2">Acesse todas as músicas no Suno</p>
                            </div>
                            <a
                                href="https://suno.com/@drackermusic"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hidden sm:inline-flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors gap-2 text-sm"
                            >
                                🎧 Ouvir Playlist
                            </a>
                        </div>
                        {/* Mobile button */}
                        <a
                            href="https://suno.com/@drackermusic"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="sm:hidden mt-2 block w-full p-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded text-center text-sm transition-colors"
                        >
                            🎧 Ouvir Playlist
                        </a>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row gap-6 h-full min-h-[800px]">

                    {/* Left: Lyrics Editor */}
                    <div className="flex-1 flex flex-col gap-2 overflow-hidden">
                        <div className="flex items-center justify-between">
                            <h3 className="font-bold text-brown-700 flex items-center gap-2">
                                🎵 Letra da Música
                            </h3>
                            <div className="flex gap-2">
                                {initialData?.metadata?.apiRequests && (
                                    <Badge variant="warning" className="text-[10px]">
                                        API Calls: {initialData.metadata.apiRequests}
                                    </Badge>
                                )}
                                <Badge variant="info">Completa e Editável</Badge>
                            </div>
                        </div>
                        <TextArea
                            value={lyrics}
                            onChange={(e) => setLyrics(e.target.value)}
                            wrapperClassName="flex-1 flex flex-col"
                            className="flex-1 font-mono text-sm leading-relaxed overflow-y-auto"
                            placeholder="[Intro]..."
                        />
                    </div>

                    {/* Right: Questions Editor */}
                    <div className="flex-1 flex flex-col gap-4 overflow-hidden">
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

                        <Card className="flex-1 bg-brown-50/50 border-brown-100 overflow-y-auto">
                            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                                <SortableContext items={questions.map(q => q.id)} strategy={verticalListSortingStrategy}>
                                    <div className="space-y-4">
                                        {questions.map((q, index) => (
                                            <SortableQuestionItem
                                                key={q.id}
                                                id={q.id}
                                                question={q}
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
            </div>
        </Modal>
    );
};
