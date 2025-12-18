import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, CheckCircle, Save, GripVertical } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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
        <div ref={setNodeRef} style={style} className="flex items-center gap-2 mb-2">
            <div {...attributes} {...listeners} className="cursor-grab text-slate-300 hover:text-slate-500 touch-none pt-2">
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
        if (isOpen && initialData) {
            setStory(initialData.story || '');
            const mappedActivities = (initialData.activities || []).map((act, index) => ({
                id: `act-${Date.now()}-${index}`,
                text: act
            }));
            setActivities(mappedActivities);
        }
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

    const handleActivityChange = (id, value) => {
        setActivities(activities.map(act =>
            act.id === id ? { ...act, text: value } : act
        ));
    };

    const handleDeleteActivity = (id) => {
        setActivities(activities.filter(act => act.id !== id));
    };

    const handleAddActivity = () => {
        setActivities([...activities, { id: `new-${Date.now()}`, text: '' }]);
    };

    const handleSave = () => {
        const exportData = {
            story: story,
            activities: activities.map(a => a.text)
        };
        onSave(exportData);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                            <CheckCircle className="w-5 h-5" />
                        </div>
                        <h2 className="text-lg font-bold text-slate-800">Editor: Aprenda com o Drácker</h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">

                    {/* Story Section */}
                    <div className="bg-white p-5 rounded-lg shadow-sm border border-slate-200">
                        <label className="block text-sm font-bold text-slate-700 mb-2">
                            História do Drácker
                            <span className="ml-2 text-xs font-normal text-slate-400">(A aventura na floresta encantada)</span>
                        </label>
                        <textarea
                            value={story}
                            onChange={(e) => setStory(e.target.value)}
                            className="w-full p-3 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all min-h-[400px]"
                            placeholder="Era uma vez..."
                            rows={15}
                        />
                    </div>

                    {/* Activities List */}
                    <div className="bg-white p-5 rounded-lg shadow-sm border border-slate-200">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Atividades Práticas ({activities.length})</h3>
                            <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                                Arraste para reordenar
                            </span>
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
                                {activities.map((act, index) => (
                                    <SortableActivityItem key={act.id} id={act.id}>
                                        <div className="flex-none pt-2 font-bold text-slate-400 text-sm w-6 text-center">
                                            {index + 1}.
                                        </div>
                                        <textarea
                                            value={act.text}
                                            onChange={(e) => handleActivityChange(act.id, e.target.value)}
                                            className="flex-1 p-3 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all resize-y min-h-[120px]"
                                            placeholder={`Descrição da atividade ${index + 1}...`}
                                            rows={5}
                                        />
                                        <button
                                            onClick={() => handleDeleteActivity(act.id)}
                                            className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded transition-all"
                                            title="Excluir atividade"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </SortableActivityItem>
                                ))}
                            </SortableContext>
                        </DndContext>

                        <button
                            onClick={handleAddActivity}
                            className="w-full py-3 mt-4 border-2 border-dashed border-slate-300 rounded-lg text-slate-500 font-semibold hover:border-green-400 hover:text-green-600 hover:bg-green-50 transition-all flex items-center justify-center gap-2"
                        >
                            <Plus className="w-5 h-5" /> Adicionar Atividade
                        </button>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-100 bg-white flex items-center justify-between">
                    <span className="text-xs text-slate-400">
                        * O texto final será gerado combinando a história e as atividades.
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
                            className="px-6 py-2.5 rounded-lg bg-green-600 text-white font-bold hover:bg-green-700 shadow-md hover:shadow-lg transition-all flex items-center gap-2"
                        >
                            <Save className="w-4 h-4" /> Salvar e Gerar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
