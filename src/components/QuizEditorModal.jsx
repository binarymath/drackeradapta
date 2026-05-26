import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, CheckCircle, Save, AlertCircle, GripVertical } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { theme } from '../styles/theme';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Input, TextArea } from './ui/Input';
import { Card } from './ui/Card';

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
            <div {...attributes} {...listeners} className="cursor-grab text-brown-300 hover:text-brown-500 touch-none">
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

                for (let i = options.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [options[i], options[j]] = [options[j], options[i]];
                }

                return {
                    id: `q-${Date.now()}-${qIndex}`,
                    statement: q.statement || '',
                    difficulty: q.difficulty || 'medium',
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
                difficulty: 'medium',
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
                    ordered_options: q.options.map(o => o.text),
                    difficulty: q.difficulty || 'medium'
                };
            })
        };
        onSave(exportData);
    };

    const footer = (
        <div className="flex justify-between w-full items-center">
            <span className="text-xs text-brown-400">
                * O Gabarito será gerado automaticamente com base na seleção.
            </span>
            <div className="flex gap-3">
                <Button onClick={onClose} variant="secondary">Cancelar</Button>
                <Button onClick={handleSave} icon={Save}>Finalizar e Gerar</Button>
            </div>
        </div>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Editor de Quiz"
            icon={CheckCircle}
            size="lg"
            footer={footer}
        >
            <div className="space-y-6">
                <Card>
                    <TextArea
                        label={
                            <span>
                                Texto Introdutório
                                <span className="ml-2 text-xs font-normal text-brown-400">(Aparece antes das questões)</span>
                            </span>
                        }
                        value={introText}
                        onChange={(e) => setIntroText(e.target.value)}
                        className="min-h-[100px]"
                        placeholder="Escreva um texto para contextualizar o quiz..."
                    />
                </Card>

                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-brown-700 uppercase tracking-wider">Questões ({questions.length})</h3>
                    </div>

                    {questions.map((q, qIndex) => (
                        <Card key={q.id} className="group transition-all hover:shadow-md">
                            <div className="flex gap-4">
                                <div className="flex-none pt-2">
                                    <div className="w-6 h-6 rounded-full bg-brown-100 text-brown-600 flex items-center justify-center text-xs font-bold">
                                        {qIndex + 1}
                                    </div>
                                </div>

                                <div className="flex-1 space-y-4">
                                    <div className="flex gap-3 items-start">
                                        <Input
                                            type="text"
                                            value={q.statement}
                                            onChange={(e) => handleQuestionChange(qIndex, 'statement', e.target.value)}
                                            className="font-semibold text-brown-900 flex-1"
                                            placeholder="Digite a pergunta aqui..."
                                        />
                                        {/* Seletor de dificuldade */}
                                        <div className="flex-shrink-0 flex gap-1 pt-1" title="Dificuldade desta questão">
                                            {[{v:'easy',label:'🟢',tip:'Fácil'},{v:'medium',label:'🟡',tip:'Médio'},{v:'hard',label:'🔴',tip:'Difícil'}].map(d => (
                                                <button
                                                    key={d.v}
                                                    type="button"
                                                    onClick={() => handleQuestionChange(qIndex, 'difficulty', d.v)}
                                                    title={d.tip}
                                                    className={`w-7 h-7 rounded-full text-sm flex items-center justify-center border-2 transition-all ${
                                                        (q.difficulty || 'medium') === d.v
                                                            ? 'border-brown-500 scale-110 shadow-sm'
                                                            : 'border-transparent opacity-50 hover:opacity-80'
                                                    }`}
                                                >
                                                    {d.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-2 pl-2 border-l-2 border-brown-100">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs font-semibold text-brown-500 uppercase tracking-wider">Alternativas</span>
                                            <span className="text-xs text-brown-600 bg-brown-50 px-2 py-1 rounded-full border border-brown-100">
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
                                                            className="w-5 h-5 text-green-600 border-brown-300 focus:ring-green-500 cursor-pointer accent-green-600"
                                                            title="Esta é a resposta correta?"
                                                        />
                                                        <input
                                                            type="text"
                                                            value={opt.text}
                                                            onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)}
                                                            className={`flex-1 text-sm p-2 rounded border transition-colors outline-none ${opt.isCorrect ? 'border-green-300 bg-green-50/50 text-green-900 font-medium' : 'border-brown-200 hover:border-brown-300 focus:border-brown-400'}`}
                                                            placeholder={`Alternativa...`}
                                                        />

                                                        {q.options.length > 2 && (
                                                            <Button
                                                                onClick={() => handleDeleteOption(qIndex, oIndex)}
                                                                variant="ghost"
                                                                className="p-2 text-brown-400 hover:text-red-600 hover:bg-red-50"
                                                                title="Excluir esta alternativa"
                                                            >
                                                                <X className="w-4 h-4" />
                                                            </Button>
                                                        )}
                                                    </SortableOptionItem>
                                                ))}
                                            </SortableContext>
                                        </DndContext>

                                        {q.options.length < 5 && (
                                            <Button
                                                onClick={() => handleAddOption(qIndex)}
                                                variant="ghost"
                                                className="text-xs text-brown-500 hover:text-brown-700 ml-7 mt-1 justify-start h-auto p-1"
                                                icon={Plus}
                                            >
                                                Adicionar Alternativa
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                <div className="flex-none flex flex-col gap-2">
                                    <Button
                                        onClick={() => handleDeleteQuestion(qIndex)}
                                        variant="ghost"
                                        className="p-2 text-brown-300 hover:text-red-500 hover:bg-red-50"
                                        title="Excluir questão"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>

                <Button
                    onClick={handleAddQuestion}
                    variant="outline"
                    className="w-full py-4 border-dashed text-brown-500 hover:bg-brown-50"
                    icon={Plus}
                >
                    Adicionar Nova Questão
                </Button>
            </div>
        </Modal>
    );
};
