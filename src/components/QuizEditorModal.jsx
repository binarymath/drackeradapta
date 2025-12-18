import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, CheckCircle, Save, AlertCircle, GripVertical } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function SortableOptionItem({ id, children }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div ref={setNodeRef} style={style} className="flex items-center gap-2 group/item">
            <div {...attributes} {...listeners} className="cursor-grab text-slate-300 hover:text-slate-500 touch-none">
                <GripVertical className="w-4 h-4" />
            </div>
            {children}
        </div>
    );
}

export const QuizEditorModal = ({ isOpen, onClose, onSave, initialData }) => {
    const [introText, setIntroText] = useState('');
    const [questions, setQuestions] = useState([]);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    useEffect(() => {
        if (isOpen && initialData) {
            setIntroText(initialData.intro_text || '');

            const formattedQuestions = (initialData.questions || []).map((q, qIndex) => {
                const options = [];
                if (q.correct_answer) {
                    options.push({ text: q.correct_answer, isCorrect: true, id: `q${qIndex}_opt0` });
                }
                (q.distractors || []).forEach((d, dIndex) => {
                    options.push({ text: d, isCorrect: false, id: `q${qIndex}_opt${dIndex + 1}` });
                });

                // Shuffle options initially so it's not biased to 'a)'
                for (let i = options.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [options[i], options[j]] = [options[j], options[i]];
                }

                return {
                    id: `q-${Date.now()}-${qIndex}`,
                    statement: q.statement || '',
                    options: options
                };
            });

            setQuestions(formattedQuestions);
        }
    }, [isOpen, initialData]);

    const handleDragEnd = (event, qIndex) => {
        const { active, over } = event;

        if (active.id !== over.id) {
            setQuestions((prevQuestions) => {
                const newQuestions = [...prevQuestions];
                const currentOptions = newQuestions[qIndex].options;
                const oldIndex = currentOptions.findIndex((o) => o.id === active.id);
                const newIndex = currentOptions.findIndex((o) => o.id === over.id);

                newQuestions[qIndex].options = arrayMove(currentOptions, oldIndex, newIndex);
                return newQuestions;
            });
        }
    };

    const handleAddQuestion = () => {
        setQuestions([
            ...questions,
            {
                id: `new-q-${Date.now()}`,
                statement: 'Nova Pergunta',
                options: [
                    { text: '', isCorrect: true, id: `new_${Date.now()}_1` },
                    { text: '', isCorrect: false, id: `new_${Date.now()}_2` },
                    { text: '', isCorrect: false, id: `new_${Date.now()}_3` },
                    { text: '', isCorrect: false, id: `new_${Date.now()}_4` },
                ]
            }
        ]);
    };

    const handleDeleteQuestion = (index) => {
        const newQuestions = [...questions];
        newQuestions.splice(index, 1);
        setQuestions(newQuestions);
    };

    const handleQuestionChange = (index, field, value) => {
        const newQuestions = [...questions];
        newQuestions[index][field] = value;
        setQuestions(newQuestions);
    };

    const handleOptionChange = (qIndex, oIndex, value) => {
        const newQuestions = [...questions];
        newQuestions[qIndex].options[oIndex].text = value;
        setQuestions(newQuestions);
    };

    const handleSetCorrect = (qIndex, oIndex) => {
        const newQuestions = [...questions];
        newQuestions[qIndex].options.forEach(opt => opt.isCorrect = false);
        newQuestions[qIndex].options[oIndex].isCorrect = true;
        setQuestions(newQuestions);
    };

    const handleAddOption = (qIndex) => {
        const newQuestions = [...questions];
        if (newQuestions[qIndex].options.length >= 5) return;
        newQuestions[qIndex].options.push({
            text: '',
            isCorrect: false,
            id: `opt-${Date.now()}`
        });
        setQuestions(newQuestions);
    };

    const handleDeleteOption = (qIndex, oIndex) => {
        const newQuestions = [...questions];
        if (newQuestions[qIndex].options.length <= 2) return;

        if (newQuestions[qIndex].options[oIndex].isCorrect) {
            // Logic to update correct answer if needed
        }

        const wasCorrect = newQuestions[qIndex].options[oIndex].isCorrect;
        newQuestions[qIndex].options.splice(oIndex, 1);

        if (wasCorrect && newQuestions[qIndex].options.length > 0) {
            newQuestions[qIndex].options[0].isCorrect = true;
        }

        setQuestions(newQuestions);
    };

    const handleSave = () => {
        const exportData = {
            intro_text: introText,
            questions: questions.map(q => {
                const correct = q.options.find(o => o.isCorrect);
                const distractors = q.options.filter(o => !o.isCorrect).map(o => o.text);

                return {
                    statement: q.statement,
                    correct_answer: correct ? correct.text : (q.options[0]?.text || ''),
                    distractors: distractors,
                    ordered_options: q.options.map(o => o.text) // Persist the visual order
                };
            })
        };
        onSave(exportData);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                            <CheckCircle className="w-5 h-5" />
                        </div>
                        <h2 className="text-lg font-bold text-slate-800">Editor de Quiz</h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
                    <div className="bg-white p-5 rounded-lg shadow-sm border border-slate-200">
                        <label className="block text-sm font-bold text-slate-700 mb-2">
                            Texto Introdutório
                            <span className="ml-2 text-xs font-normal text-slate-400">(Aparece antes das questões)</span>
                        </label>
                        <textarea
                            value={introText}
                            onChange={(e) => setIntroText(e.target.value)}
                            className="w-full p-3 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all min-h-[100px]"
                            placeholder="Escreva um texto para contextualizar o quiz..."
                        />
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Questões ({questions.length})</h3>
                        </div>

                        {questions.map((q, qIndex) => (
                            <div key={q.id} className="bg-white p-5 rounded-lg shadow-sm border border-slate-200 group transition-all hover:shadow-md">
                                <div className="flex gap-4">
                                    <div className="flex-none pt-2">
                                        <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">
                                            {qIndex + 1}
                                        </div>
                                    </div>

                                    <div className="flex-1 space-y-4">
                                        <div>
                                            <input
                                                type="text"
                                                value={q.statement}
                                                onChange={(e) => handleQuestionChange(qIndex, 'statement', e.target.value)}
                                                className="w-full font-semibold text-slate-800 p-3 border border-slate-200 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-all"
                                                placeholder="Digite a pergunta aqui..."
                                            />
                                        </div>

                                        <div className="space-y-2 pl-2 border-l-2 border-slate-100">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Alternativas</span>
                                                <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                                                    Arraste para reordenar
                                                </span>
                                            </div>

                                            <DndContext
                                                sensors={sensors}
                                                collisionDetection={closestCenter}
                                                onDragEnd={(e) => handleDragEnd(e, qIndex)}
                                            >
                                                <SortableContext
                                                    items={q.options.map(o => o.id)}
                                                    strategy={verticalListSortingStrategy}
                                                >
                                                    {q.options.map((opt, oIndex) => (
                                                        <SortableOptionItem key={opt.id} id={opt.id}>
                                                            <input
                                                                type="radio"
                                                                name={`correct_${q.id}`}
                                                                checked={opt.isCorrect}
                                                                onChange={() => handleSetCorrect(qIndex, oIndex)}
                                                                className="w-5 h-5 text-green-600 border-slate-300 focus:ring-green-500 cursor-pointer"
                                                                title="Esta é a resposta correta?"
                                                            />
                                                            <input
                                                                type="text"
                                                                value={opt.text}
                                                                onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)}
                                                                className={`flex-1 text-sm p-2 rounded border transition-colors ${opt.isCorrect ? 'border-green-300 bg-green-50/50 text-green-900 font-medium' : 'border-slate-200 hover:border-slate-300 focus:border-blue-400'}`}
                                                                placeholder={`Alternativa...`}
                                                            />

                                                            {q.options.length > 2 && (
                                                                <button
                                                                    onClick={() => handleDeleteOption(qIndex, oIndex)}
                                                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-all"
                                                                    title="Excluir esta alternativa"
                                                                >
                                                                    <X className="w-4 h-4" />
                                                                </button>
                                                            )}
                                                        </SortableOptionItem>
                                                    ))}
                                                </SortableContext>
                                            </DndContext>

                                            {q.options.length < 5 && (
                                                <button
                                                    onClick={() => handleAddOption(qIndex)}
                                                    className="text-xs text-blue-500 hover:text-blue-700 font-medium ml-7 mt-1 flex items-center gap-1"
                                                >
                                                    <Plus className="w-3 h-3" /> Adicionar Alternativa
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex-none flex flex-col gap-2">
                                        <button
                                            onClick={() => handleDeleteQuestion(qIndex)}
                                            className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded transition-all"
                                            title="Excluir questão"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={handleAddQuestion}
                        className="w-full py-4 border-2 border-dashed border-slate-300 rounded-lg text-slate-500 font-semibold hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all flex items-center justify-center gap-2"
                    >
                        <Plus className="w-5 h-5" /> Adicionar Nova Questão
                    </button>
                </div>

                <div className="p-4 border-t border-slate-100 bg-white flex items-center justify-between">
                    <span className="text-xs text-slate-400">
                        * O Gabarito será gerado automaticamente com base na seleção.
                    </span>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="px-5 py-2.5 rounded-lg text-slate-600 font-medium hover:bg-slate-100 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-6 py-2.5 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-md hover:shadow-lg transition-all flex items-center gap-2"
                        >
                            <Save className="w-4 h-4" /> Finalizar e Gerar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
