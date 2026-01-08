
import React from 'react';
import { Pencil } from 'lucide-react';
import { Button, TextArea } from './MemberUI';

export const MemberStatsTab = ({
    member,
    trails,
    editingTrailId,
    setEditingTrailId,
    editValue,
    setEditValue,
    handleEditSave
}) => {
    const selectTrails = trails.filter(t => t.type === 'select');
    const textTrails = trails.filter(t => t.type === 'text');

    return (
        <div className="space-y-8 animate-fade-in">
            {['select', 'text'].map(type => {
                const typeTrails = type === 'select' ? selectTrails : textTrails;
                if (typeTrails.length === 0) return null;
                return (
                    <section key={type}>
                        <h3 className="font-bold text-brown-300 text-xs uppercase tracking-[0.2em] mb-4 border-b border-brown-100 pb-2">
                            {type === 'select' ? 'Habilidades & Traços' : 'Informações Complementares'}
                        </h3>
                        <div className={type === 'select' ? "grid sm:grid-cols-2 gap-4" : "space-y-4"}>
                            {typeTrails.map(trail => {
                                const ans = member.answers?.[trail.id];
                                const isEditing = editingTrailId === trail.id;

                                return (
                                    <div key={trail.id} className="group border border-brown-100 rounded-xl p-4 hover:border-brown-300 transition-colors bg-white hover:shadow-sm">
                                        <div className="flex items-start gap-3">
                                            <div className={`p-2 rounded-lg ${trail.color.replace('border', 'bg').split(' ')[0]} bg-opacity-20 text-brown-600`}>
                                                {trail.icon}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className="text-xs font-bold text-gray-400 uppercase">{trail.title}</span>
                                                    <button
                                                        onClick={() => { setEditingTrailId(trail.id); setEditValue(ans); }}
                                                        className="p-1 text-gray-300 hover:text-brown-500 opacity-0 group-hover:opacity-100 transition-all transform hover:scale-110"
                                                    >
                                                        <Pencil size={12} />
                                                    </button>
                                                </div>

                                                {isEditing ? (
                                                    <div className="mt-2 space-y-2 animate-fade-in">
                                                        {trail.type === 'select' ? (
                                                            <div className="grid gap-2">
                                                                {trail.options.map(opt => (
                                                                    <button
                                                                        key={opt.value}
                                                                        onClick={() => { setEditValue(opt); }}
                                                                        className={`text-left text-sm p-2 rounded border ${editValue?.value === opt.value ? 'bg-brown-100 border-brown-300 text-brown-900 font-bold' : 'border-gray-100 hover:bg-gray-50'}`}
                                                                    >
                                                                        {opt.label}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <TextArea
                                                                value={editValue?.label || ''}
                                                                onChange={(e) => setEditValue({ ...editValue, label: e.target.value })}
                                                                className="text-sm min-h-[80px]"
                                                            />
                                                        )}
                                                        <div className="flex gap-2 justify-end">
                                                            <Button size="sm" variant="ghost" onClick={() => setEditingTrailId(null)}>Cancelar</Button>
                                                            <Button size="sm" onClick={() => handleEditSave(trail.id)}>Salvar</Button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div>
                                                        <div className="font-bold text-brown-800 leading-tight">
                                                            {ans?.label || <span className="text-gray-300 italic">Não registrado</span>}
                                                        </div>
                                                        {ans?.feedback && (
                                                            <div className="text-xs text-brown-500 mt-1 italic leading-relaxed">
                                                                "{ans.feedback}"
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                );
            })}
        </div>
    );
};
