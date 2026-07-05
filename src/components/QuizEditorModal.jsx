import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, CheckCircle, Save, AlertCircle, GripVertical, Image, Link2 } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { theme } from '../styles/theme';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Input, TextArea } from './ui/Input';
import { Card } from './ui/Card';

/** Converte URLs do Google Drive para URL direta de imagem embeddável */
function toDirectImageUrl(url) {
    if (!url) return url;
    const fileMatch = url.match(/drive\.google\.com\/file\/d\/([^/]+)/);
    if (fileMatch) return `https://drive.google.com/uc?export=view&id=${fileMatch[1]}`;
    const openMatch = url.match(/drive\.google\.com\/open\?id=([^&]+)/);
    if (openMatch) return `https://drive.google.com/uc?export=view&id=${openMatch[1]}`;
    const ucMatch = url.match(/drive\.google\.com\/uc\?.*id=([^&]+)/);
    if (ucMatch) return `https://drive.google.com/uc?export=view&id=${ucMatch[1]}`;
    return url;
}

function SortableOptionItem({ id, children }) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
    const style = { transform: CSS.Transform.toString(transform), transition };
    return (
        <div ref={setNodeRef} style={style} className="flex items-center gap-2 group/item">
            <div {...attributes} {...listeners} className="cursor-grab text-brown-300 hover:text-brown-500 touch-none">
                <GripVertical className="w-4 h-4" />
            </div>
            {children}
        </div>
    );
}

const BG_SWATCHES = [
    { c: '#ffffff', label: 'Branco' },
    { c: '#000000', label: 'Preto' },
    { c: '#fffde7', label: 'Creme' },
    { c: '#e3f2fd', label: 'Azul claro' },
    { c: '#f3e5f5', label: 'Lilás' },
    { c: '#e8f5e9', label: 'Verde claro' },
    { c: '#fff3e0', label: 'Laranja claro' },
    { c: '#fce4ec', label: 'Rosa claro' },
];

export const QuizEditorModal = ({ isOpen, onClose, onSave, initialData }) => {
    const [introText, setIntroText] = useState('');
    const [questions, setQuestions] = useState([]);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    useEffect(() => {
        if (isOpen && initialData) {
            setIntroText(initialData.intro_text || '');
            const formatted = (initialData.questions || []).map((q, qIndex) => {
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
                    image_url: q.image_url || '',
                    image_bg_color: q.image_bg_color || 'transparent',
                    options,
                };
            });
            setQuestions(formatted);
        }
    }, [isOpen, initialData]);

    const handleDragEnd = (event, qIndex) => {
        const { active, over } = event;
        if (active.id !== over.id) {
            setQuestions(prev => {
                const next = [...prev];
                const opts = next[qIndex].options;
                const oldIndex = opts.findIndex(o => o.id === active.id);
                const newIndex = opts.findIndex(o => o.id === over.id);
                next[qIndex].options = arrayMove(opts, oldIndex, newIndex);
                return next;
            });
        }
    };

    const handleAddQuestion = () => {
        setQuestions(prev => [...prev, {
            id: `new-q-${Date.now()}`,
            statement: 'Nova Pergunta',
            difficulty: 'medium',
            image_url: '',
            image_bg_color: 'transparent',
            options: [
                { text: '', isCorrect: true,  id: `new_${Date.now()}_1` },
                { text: '', isCorrect: false, id: `new_${Date.now()}_2` },
                { text: '', isCorrect: false, id: `new_${Date.now()}_3` },
                { text: '', isCorrect: false, id: `new_${Date.now()}_4` },
            ],
        }]);
    };

    const handleDeleteQuestion = index => {
        setQuestions(prev => prev.filter((_, i) => i !== index));
    };

    const handleQuestionChange = (index, field, value) => {
        setQuestions(prev => {
            const next = [...prev];
            next[index][field] = value;
            return next;
        });
    };

    const handleImageUrlChange = (qIndex, value) => {
        setQuestions(prev => {
            const next = [...prev];
            next[qIndex].image_url = value;
            return next;
        });
    };

    const handleImageBgColorChange = (qIndex, value) => {
        setQuestions(prev => {
            const next = [...prev];
            next[qIndex].image_bg_color = value;
            return next;
        });
    };

    const handleOptionChange = (qIndex, oIndex, value) => {
        setQuestions(prev => {
            const next = [...prev];
            next[qIndex].options[oIndex].text = value;
            return next;
        });
    };

    const handleSetCorrect = (qIndex, oIndex) => {
        setQuestions(prev => {
            const next = [...prev];
            next[qIndex].options.forEach(o => (o.isCorrect = false));
            next[qIndex].options[oIndex].isCorrect = true;
            return next;
        });
    };

    const handleAddOption = qIndex => {
        setQuestions(prev => {
            const next = [...prev];
            if (next[qIndex].options.length >= 5) return next;
            next[qIndex].options.push({ text: '', isCorrect: false, id: `opt-${Date.now()}` });
            return next;
        });
    };

    const handleDeleteOption = (qIndex, oIndex) => {
        setQuestions(prev => {
            const next = [...prev];
            if (next[qIndex].options.length <= 2) return next;
            const wasCorrect = next[qIndex].options[oIndex].isCorrect;
            next[qIndex].options.splice(oIndex, 1);
            if (wasCorrect && next[qIndex].options.length > 0) {
                next[qIndex].options[0].isCorrect = true;
            }
            return next;
        });
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
                    distractors,
                    ordered_options: q.options.map(o => o.text),
                    difficulty: q.difficulty || 'medium',
                    image_url: q.image_url ? toDirectImageUrl(q.image_url.trim()) : undefined,
                    image_bg_color: q.image_bg_color && q.image_bg_color !== 'transparent' ? q.image_bg_color : undefined,
                };
            }),
        };
        onSave(exportData);
    };

    const footer = (
        <div className="flex justify-between w-full items-center">
            <span className="text-xs text-brown-400">* O Gabarito será gerado automaticamente com base na seleção.</span>
            <div className="flex gap-3">
                <Button onClick={onClose} variant="secondary">Cancelar</Button>
                <Button onClick={handleSave} icon={Save}>Finalizar e Gerar</Button>
            </div>
        </div>
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Editor de Quiz" icon={CheckCircle} size="lg" footer={footer}>
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
                        onChange={e => setIntroText(e.target.value)}
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
                                {/* Número da questão */}
                                <div className="flex-none pt-2">
                                    <div className="w-6 h-6 rounded-full bg-brown-100 text-brown-600 flex items-center justify-center text-xs font-bold">
                                        {qIndex + 1}
                                    </div>
                                </div>

                                {/* Corpo da questão */}
                                <div className="flex-1 space-y-4">

                                    {/* Enunciado + dificuldade */}
                                    <div className="flex gap-3 items-start">
                                        <Input
                                            type="text"
                                            value={q.statement}
                                            onChange={e => handleQuestionChange(qIndex, 'statement', e.target.value)}
                                            className="font-semibold text-brown-900 flex-1"
                                            placeholder="Digite a pergunta aqui..."
                                        />
                                        <div className="flex-shrink-0 flex gap-1 pt-1" title="Dificuldade desta questão">
                                            {[
                                                { v: 'easy',   label: '🟢', tip: 'Fácil' },
                                                { v: 'medium', label: '🟡', tip: 'Médio' },
                                                { v: 'hard',   label: '🔴', tip: 'Difícil' },
                                            ].map(d => (
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

                                    {/* ── Campo de imagem ── */}
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2">
                                            <Image className="w-3.5 h-3.5 text-brown-400" />
                                            <span className="text-xs font-semibold text-brown-500 uppercase tracking-wider">Imagem (opcional)</span>
                                        </div>

                                        {/* URL */}
                                        <div className="flex items-center gap-2">
                                            <Link2 className="w-4 h-4 text-brown-300 flex-shrink-0" />
                                            <input
                                                type="url"
                                                value={q.image_url || ''}
                                                onChange={e => handleImageUrlChange(qIndex, e.target.value)}
                                                placeholder="URL da imagem ou link do Google Drive..."
                                                className="flex-1 text-xs p-1.5 rounded border border-brown-200 hover:border-brown-300 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-200 transition-colors bg-white"
                                            />
                                        </div>

                                        {/* Cor de fundo (só quando há URL) */}
                                        {q.image_url && (
                                            <div className="flex items-center gap-2 pl-6">
                                                <span className="text-[10px] font-semibold text-brown-400 uppercase tracking-wider whitespace-nowrap">Fundo:</span>
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                    {/* Color picker arco-íris → abre o nativo */}
                                                    <label className="cursor-pointer" title="Cor personalizada">
                                                        <input
                                                            type="color"
                                                            value={(!q.image_bg_color || q.image_bg_color === 'transparent') ? '#ffffff' : q.image_bg_color}
                                                            onChange={e => handleImageBgColorChange(qIndex, e.target.value)}
                                                            className="sr-only"
                                                        />
                                                        <span
                                                            className="w-5 h-5 rounded-full border-2 border-brown-300 hover:border-brown-500 block cursor-pointer transition-all"
                                                            style={{
                                                                background: (!q.image_bg_color || q.image_bg_color === 'transparent')
                                                                    ? 'conic-gradient(red, yellow, lime, aqua, blue, magenta, red)'
                                                                    : q.image_bg_color,
                                                            }}
                                                            title="Escolher cor personalizada"
                                                        />
                                                    </label>

                                                    {/* Botão "Nenhum" (transparente) */}
                                                    <button
                                                        type="button"
                                                        onClick={() => handleImageBgColorChange(qIndex, 'transparent')}
                                                        className={`text-[9px] px-1.5 py-0.5 rounded border font-bold transition-all ${
                                                            (!q.image_bg_color || q.image_bg_color === 'transparent')
                                                                ? 'bg-brown-500 text-white border-brown-600'
                                                                : 'bg-white text-brown-500 border-brown-200 hover:bg-brown-50'
                                                        }`}
                                                    >
                                                        Nenhum
                                                    </button>

                                                    {/* Swatches rápidos */}
                                                    {BG_SWATCHES.map(({ c, label }) => (
                                                        <button
                                                            key={c}
                                                            type="button"
                                                            onClick={() => handleImageBgColorChange(qIndex, c)}
                                                            className={`w-5 h-5 rounded-full border-2 transition-all ${
                                                                q.image_bg_color === c
                                                                    ? 'border-brown-600 scale-110 shadow-sm'
                                                                    : 'border-transparent hover:border-brown-400'
                                                            }`}
                                                            style={{
                                                                background: c,
                                                                boxShadow: q.image_bg_color === c
                                                                    ? '0 0 0 2px #92400e'
                                                                    : '0 0 0 1px #d97706',
                                                            }}
                                                            title={label}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Preview com fundo personalizado */}
                                        {q.image_url && (
                                            <div
                                                className="mt-1 rounded-lg border border-brown-100 overflow-hidden"
                                                style={{
                                                    maxHeight: '160px',
                                                    background: (q.image_bg_color && q.image_bg_color !== 'transparent')
                                                        ? q.image_bg_color
                                                        : 'repeating-conic-gradient(#e0e0e0 0% 25%, #f5f5f5 0% 50%) 0 0 / 12px 12px',
                                                }}
                                            >
                                                <img
                                                    src={toDirectImageUrl(q.image_url.trim())}
                                                    alt="Preview"
                                                    className="w-full object-contain"
                                                    style={{ maxHeight: '160px' }}
                                                    onError={e => {
                                                        e.target.style.display = 'none';
                                                        e.target.nextSibling && (e.target.nextSibling.style.display = 'flex');
                                                    }}
                                                    onLoad={e => { e.target.style.display = 'block'; }}
                                                />
                                                <div className="hidden items-center justify-center gap-1 p-3 text-xs text-red-500">
                                                    <AlertCircle className="w-4 h-4" />
                                                    <span>Não foi possível carregar a imagem. Verifique o link.</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    {/* ── Fim campo de imagem ── */}

                                    {/* Alternativas */}
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
                                            onDragEnd={e => handleDragEnd(e, qIndex)}
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
                                                            onChange={e => handleOptionChange(qIndex, oIndex, e.target.value)}
                                                            className={`flex-1 text-sm p-2 rounded border transition-colors outline-none ${
                                                                opt.isCorrect
                                                                    ? 'border-green-300 bg-green-50/50 text-green-900 font-medium'
                                                                    : 'border-brown-200 hover:border-brown-300 focus:border-brown-400'
                                                            }`}
                                                            placeholder="Alternativa..."
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

                                {/* Botão excluir questão */}
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
