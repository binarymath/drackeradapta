
import React, { useState, useEffect } from 'react';
import { Sparkles, Copy, Edit2, Check, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { TextArea, Input } from '../ui/Input';

export const DrackerStoryRenderer = ({ drackerData, onUpdate }) => {
    const [editingStory, setEditingStory] = useState(false);
    const [storyText, setStoryText] = useState('');
    
    const [editingActivity, setEditingActivity] = useState(null); // { idx }
    const [activityForm, setActivityForm] = useState({ title: '', materials: '', steps: '' });

    useEffect(() => {
        if (drackerData) {
            setStoryText(drackerData.story);
        }
    }, [drackerData]);

    if (!drackerData) return null;

    const renderBoldText = (text) => {
        if (!text) return null;
        return String(text).split(/(\*\*.*?\*\*)/g).map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={i} className="text-brown-800 font-extrabold print:text-black">{part.slice(2, -2)}</strong>;
            }
            return part;
        });
    };

    const handleSaveStory = () => {
        if (onUpdate) {
            onUpdate({ ...drackerData, story: storyText });
        }
        setEditingStory(false);
    };

    const handleStartEditActivity = (idx, act) => {
        setEditingActivity(idx);
        setActivityForm({
            title: act.title || '',
            materials: act.materials || '',
            steps: act.steps || ''
        });
    };

    const handleSaveActivity = (idx) => {
        if (onUpdate) {
            const newActivities = [...drackerData.activities];
            newActivities[idx] = { ...newActivities[idx], ...activityForm };
            onUpdate({ ...drackerData, activities: newActivities });
        }
        setEditingActivity(null);
    };

    return (
        <div className="space-y-6 print:space-y-8">
            {/* CARD 1: HISTÓRIA */}
            <Card className="p-8 relative group overflow-hidden border border-brown-100 shadow-sm print:shadow-none print:border-4 print:border-brown-200 print:p-8 h-fit print:h-auto print:block">
                <div className="absolute top-0 right-0 p-4 opacity-20 pointer-events-none print:opacity-10" style={{ filter: 'sepia(100%) saturate(300%) hue-rotate(315deg) brightness(70%)' }}>
                    <img src="/dracker_character.png" alt="Drácker" className="w-32 h-32 object-contain opacity-50 print:w-48 print:h-48" />
                </div>

                {/* HEADER */}
                <div className="border-b border-brown-100 pb-4 mb-6 flex justify-between items-start print:border-b-2 print:border-brown-800 print:mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-brown-900 mb-1 print:text-4xl print:font-serif">Aprenda com o Drácker</h2>
                        <p className="text-brown-600 font-medium opacity-75 print:text-xl print:text-brown-800 print:italic">Uma história interativa para a turma</p>
                    </div>
                    <div className="flex gap-2 print:hidden z-10 relative">
                        <Button
                            onClick={() => {
                                navigator.clipboard.writeText(drackerData.story);
                                alert('História copiada!');
                            }}
                            variant="secondary"
                            className="text-xs"
                            icon={Copy}
                        >
                            Copiar
                        </Button>
                        {!editingStory && onUpdate && (
                            <Button
                                onClick={() => setEditingStory(true)}
                                variant="outline"
                                className="text-xs text-brown-600 border-brown-200 hover:bg-brown-50"
                                icon={Edit2}
                            >
                                Editar
                            </Button>
                        )}
                    </div>
                </div>

                {/* AUDIO SUGGESTION (Screen Only) */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 print:hidden no-print relative z-20">
                    <div className="flex items-start gap-3">
                        <Sparkles className="w-5 h-5 text-amber-600 mt-0.5" />
                        <div>
                            <h4 className="font-bold text-amber-900 text-sm">Dica de Narração Fluida</h4>
                            <p className="text-xs text-amber-800 mt-1">
                                Para uma leitura muito mais natural e fluida, copie o texto da história e cole no <b>Google AI Studio</b>.
                                <a
                                    href="https://aistudio.google.com/generate-speech"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="underline hover:text-amber-950 ml-1 font-bold decoration-amber-300"
                                >
                                    Acessar AI Studio
                                </a>
                            </p>
                        </div>
                    </div>
                </div>

                {/* STORY CONTENT */}
                <div className="prose prose-lg max-w-none text-brown-900 leading-loose font-serif print:text-xl print:leading-relaxed print:text-justify print:block relative z-10">
                    {editingStory ? (
                        <div className="space-y-4">
                            <TextArea 
                                value={storyText}
                                onChange={(e) => setStoryText(e.target.value)}
                                rows={10}
                                className="w-full text-lg leading-loose font-serif text-brown-900"
                            />
                            <div className="flex gap-2 justify-end">
                                <Button variant="secondary" onClick={() => { setStoryText(drackerData.story); setEditingStory(false); }} icon={X}>Cancelar</Button>
                                <Button onClick={handleSaveStory} icon={Check}>Salvar História</Button>
                            </div>
                        </div>
                    ) : (
                        drackerData.story.split('\n\n').map((paragraph, index) => (
                            <p key={index} className="indent-8 mb-4 text-justify print:mb-4">
                                {paragraph.split(/(\*\*.*?\*\*)/g).map((part, i) => {
                                    if (part.startsWith('**') && part.endsWith('**')) {
                                        return (
                                            <strong key={i} className="text-brown-800 font-extrabold print:text-black">
                                                {part.slice(2, -2)}
                                            </strong>
                                        );
                                    }
                                    return part;
                                })}
                            </p>
                        ))
                    )}
                </div>
            </Card>

            {/* CARD 2: ATIVIDADES */}
            <Card className="p-8 relative border border-brown-100 shadow-sm print:shadow-none print:border-4 print:border-brown-200 print:p-8 h-fit print:h-auto print:block break-before-auto">
                <div className="flex justify-between items-center mb-6 print:border-b print:border-brown-400 print:pb-2">
                    <h3 className="text-lg font-bold text-brown-800 flex items-center gap-2 print:text-3xl print:mb-0">
                        <img src="/dracker_character.png" alt="Brain" className="w-6 h-6 object-contain print:w-10 print:h-10" />
                        Atividades Práticas
                    </h3>
                </div>

                <ol className="list-none ml-0 space-y-6 print:block">
                    {drackerData.activities.map((act, idx) => {
                        const isObject = typeof act === 'object' && act !== null;
                        const isEditing = editingActivity === idx;

                        if (!isObject) {
                            return (
                                <li key={idx} className="text-brown-700 font-medium pl-2 border-b border-brown-100 pb-4 print:block">
                                    {String(act)}
                                </li>
                            );
                        }

                        if (isEditing) {
                            return (
                                <li key={idx} className="bg-brown-50 rounded-xl p-6 border border-amber-300 shadow-sm space-y-4">
                                    <div className="flex justify-between items-center mb-2 border-b border-amber-200 pb-2">
                                        <span className="font-bold text-amber-800">Editando Atividade #{idx + 1}</span>
                                    </div>
                                    <Input 
                                        label="Título" 
                                        value={activityForm.title} 
                                        onChange={(e) => setActivityForm({...activityForm, title: e.target.value})} 
                                        className="font-bold text-brown-900"
                                    />
                                    <Input 
                                        label="Materiais" 
                                        value={activityForm.materials} 
                                        onChange={(e) => setActivityForm({...activityForm, materials: e.target.value})} 
                                    />
                                    <TextArea 
                                        label="Como fazer" 
                                        value={activityForm.steps} 
                                        onChange={(e) => setActivityForm({...activityForm, steps: e.target.value})} 
                                        rows={12}
                                        className="text-sm leading-relaxed"
                                    />
                                    <div className="flex gap-2 justify-end pt-2">
                                        <Button variant="secondary" onClick={() => setEditingActivity(null)} icon={X}>Cancelar</Button>
                                        <Button onClick={() => handleSaveActivity(idx)} icon={Check}>Salvar</Button>
                                    </div>
                                </li>
                            );
                        }

                        return (
                            <li key={idx} className="bg-brown-50/50 rounded-xl p-4 border border-brown-100 hover:border-brown-200 transition-colors break-inside-avoid print:break-inside-avoid print:bg-transparent print:border-brown-300 print:mb-4 group">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-start gap-3 mb-3">
                                        <div className="w-8 h-8 rounded-full bg-brown-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm print:bg-brown-800 print:text-white">
                                            {idx + 1}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-brown-900 text-lg leading-tight">{renderBoldText(act.title)}</h4>
                                            {act.materials && (
                                                <div className="mt-1 flex items-start gap-2 text-sm text-brown-600">
                                                    <span className="font-bold text-xs uppercase tracking-wide bg-white px-2 py-0.5 rounded border border-brown-100 text-brown-500 shrink-0">Materiais</span>
                                                    <span className="italic">{renderBoldText(act.materials)}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    {onUpdate && (
                                        <Button 
                                            variant="ghost" 
                                            className="opacity-0 group-hover:opacity-100 transition-opacity text-brown-400 hover:text-brown-700 h-8 w-8 p-0 print:hidden" 
                                            onClick={() => handleStartEditActivity(idx, act)}
                                            title="Editar esta atividade"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </Button>
                                    )}
                                </div>

                                {act.steps && (
                                    <div className="ml-11 text-brown-800 text-sm leading-relaxed border-l-2 border-brown-200 pl-4 py-1">
                                        <span className="font-bold text-brown-500 text-xs uppercase mb-1 block">Como fazer:</span>
                                        <div className="whitespace-pre-wrap">
                                            {renderBoldText(act.steps)}
                                        </div>
                                    </div>
                                )}
                            </li>
                        );
                    })}
                </ol>

                {/* FOOTER */}
                <div className="mt-8 pt-4 border-t border-brown-100 flex items-center justify-between text-xs text-brown-400 print:mt-8 print:border-brown-800 print:text-brown-600">
                    <span className="flex items-center gap-1">
                        <img src="/dracker_character.png" alt="Logo" className="w-4 h-4 opacity-50 grayscale" />
                        Atividade Adaptada - Drácker
                    </span>
                    <span>{new Date().toLocaleDateString()}</span>
                </div>
            </Card>
        </div>
    );
};
