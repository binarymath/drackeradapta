import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, CheckCircle, Save, GripVertical } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// UI Components
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Input, TextArea } from './ui/Input';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';

function SortableActivityItem({ id, children }) {
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
        <div ref={setNodeRef} style={style} className="flex items-center gap-2 mb-2 group/item">
            <div {...attributes} {...listeners} className="cursor-grab text-brown-300 hover:text-brown-500 touch-none pt-2">
                <GripVertical className="w-4 h-4" />
            </div>
            {children}
        </div>
    );
}

export const DrackerEditorModal = ({ isOpen, onClose, onSave, initialData }) => {
    const [story, setStory] = useState('');
    const [activities, setActivities] = useState([]);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    useEffect(() => {
        if (!isOpen) return;

        const timestamp = Date.now();
        setStory(initialData?.story || '');

        const mappedActivities = (initialData?.activities || []).map((act, index) => {
            const isObject = typeof act === 'object' && act !== null;
            return {
                id: `act-${timestamp}-${index}`,
                title: isObject ? (act.title || '') : String(act), // Fallback for legacy string
                materials: isObject ? (act.materials || '') : '',
                steps: isObject ? (act.steps || '') : '',
                // Keep original text if it was a string just in case, but we prioritize the new fields
                original: act
            };
        });

        const paddedActivities = [...mappedActivities];
        while (paddedActivities.length < 5) {
            const label = paddedActivities.length + 1;
            paddedActivities.push({
                id: `act-${timestamp}-placeholder-${label}`,
                title: `Nova Atividade ${label}`,
                materials: 'Papel, lápis...',
                steps: 'Descreva o passo a passo...'
            });
        }

        setActivities(paddedActivities);
    }, [isOpen, initialData]);

    const handleDragEnd = (event) => {
        const { active, over } = event;

        if (active.id !== over.id) {
            setActivities((items) => {
                const oldIndex = items.findIndex((item) => item.id === active.id);
                const newIndex = items.findIndex((item) => item.id === over.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    const handleActivityChange = (id, field, value) => {
        setActivities(activities.map(act =>
            act.id === id ? { ...act, [field]: value } : act
        ));
    };

    const handleDeleteActivity = (id) => {
        setActivities(activities.filter(act => act.id !== id));
    };

    const handleAddActivity = () => {
        setActivities([...activities, {
            id: `new-${Date.now()}`,
            title: 'Nova Atividade',
            materials: '',
            steps: ''
        }]);
    };

    const handleSave = () => {
        const exportData = {
            story: story,
            activities: activities.map(a => ({
                title: a.title,
                materials: a.materials,
                steps: a.steps
            }))
        };
        onSave(exportData);
    };

    const footer = (
        <div className="flex justify-between w-full items-center">
            <span className="text-xs text-brown-400">
                * O texto final será gerado combinando a história e as atividades.
            </span>
            <div className="flex gap-3">
                <Button onClick={onClose} variant="secondary">Cancelar</Button>
                <Button onClick={handleSave} icon={Save}>Salvar e Gerar</Button>
            </div>
        </div>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Editor: Aprenda com o Drácker"
            icon={CheckCircle}
            size="xl"
            footer={footer}
        >
            <div className="space-y-6">
                <Card>
                    <TextArea
                        label={
                            <span>
                                História do Drácker
                                <span className="ml-2 text-xs font-normal text-brown-400">(A aventura na floresta encantada)</span>
                            </span>
                        }
                        value={story}
                        onChange={(e) => setStory(e.target.value)}
                        className="min-h-[200px]"
                        placeholder="Era uma vez..."
                        rows={8}
                    />
                </Card>

                <Card>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold text-brown-700 uppercase tracking-wider">Atividades Práticas ({activities.length})</h3>
                        <Badge variant="info">Arraste para reordenar</Badge>
                    </div>

                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext
                            items={activities.map(a => a.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            <div className="space-y-4">
                                {activities.map((act, index) => (
                                    <SortableActivityItem key={act.id} id={act.id}>
                                        <div className="w-full bg-brown-50/50 p-4 rounded-xl border border-brown-100 hover:border-brown-300 transition-all">
                                            <div className="flex items-center justify-between mb-2">
                                                <Badge className="bg-brown-200 text-brown-800">#{index + 1}</Badge>
                                                <Button
                                                    onClick={() => handleDeleteActivity(act.id)}
                                                    variant="ghost"
                                                    className="h-6 w-6 p-0 text-brown-400 hover:text-red-500"
                                                    title="Excluir atividade"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>

                                            <div className="space-y-3">
                                                <Input
                                                    placeholder="Título da Atividade"
                                                    value={act.title}
                                                    onChange={(e) => handleActivityChange(act.id, 'title', e.target.value)}
                                                    className="font-bold text-brown-900"
                                                />
                                                <Input
                                                    placeholder="Materiais (ex: Papel, cola...)"
                                                    value={act.materials}
                                                    onChange={(e) => handleActivityChange(act.id, 'materials', e.target.value)}
                                                    className="text-sm"
                                                    label="Materiais:"
                                                />
                                                <TextArea
                                                    placeholder="Passo a passo detalhado..."
                                                    value={act.steps}
                                                    onChange={(e) => handleActivityChange(act.id, 'steps', e.target.value)}
                                                    className="text-sm min-h-[80px]"
                                                    rows={3}
                                                    label="Como fazer:"
                                                />
                                            </div>
                                        </div>
                                    </SortableActivityItem>
                                ))}
                            </div>
                        </SortableContext>
                    </DndContext>

                    <Button
                        onClick={handleAddActivity}
                        variant="outline"
                        className="w-full py-4 mt-6 border-dashed text-brown-500 hover:bg-brown-50"
                        icon={Plus}
                    >
                        Adicionar Atividade
                    </Button>
                </Card>
            </div>
        </Modal>
    );
};
