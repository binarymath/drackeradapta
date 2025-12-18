import React, { useState } from 'react';
import { X, Trash2, Save, FileText, CalendarClock } from 'lucide-react';

export const SaveLoadModal = ({ isOpen, onClose, onLoad, onSaveCurrent, onDelete, savedActivities }) => {
    const [name, setName] = useState('');

    const handleSave = () => {
        if (!name.trim()) return;
        onSaveCurrent(name);
        setName('');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <Save className="w-5 h-5 text-blue-600" /> Gerenciar Atividades Salvas
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-6 flex-1 overflow-y-auto">
                    {/* Save Current Section */}
                    <div className="bg-blue-50 p-5 rounded-lg border border-blue-100">
                        <label className="block text-sm font-bold text-blue-800 mb-2">Salvar Atividade Atual</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="flex-1 p-2 border border-blue-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Digite um nome para identificar (ex: Geografia - Rios)"
                            />
                            <button
                                onClick={handleSave}
                                disabled={!name.trim()}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                <Save className="w-4 h-4" /> Salvar
                            </button>
                        </div>
                    </div>

                    {/* Saved List Section */}
                    <div>
                        <h3 className="text-sm font-bold text-slate-700 mb-3 uppercase tracking-wider">Atividades Salvas ({savedActivities.length})</h3>

                        {savedActivities.length === 0 ? (
                            <div className="text-center py-10 text-slate-400 border-2 border-dashed border-slate-200 rounded-lg">
                                <FileText className="w-10 h-10 mx-auto mb-2 opacity-50" />
                                <p>Nenhuma atividade salva ainda.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {savedActivities.map((activity) => (
                                    <div key={activity.id} className="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow flex items-center justify-between group">
                                        <div className="flex-1">
                                            <h4 className="font-bold text-slate-800">{activity.name}</h4>
                                            <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                                                <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-medium">
                                                    {activity.type === 'wordsearch' ? 'Caça-Palavras' :
                                                        activity.type === 'quiz' ? 'Quiz' :
                                                            activity.type === 'summary' ? 'Drácker' :
                                                                activity.type === 'simplify' ? 'Simplificado' : 'Outro'}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <CalendarClock className="w-3 h-3" />
                                                    {new Date(activity.date).toLocaleDateString()} às {new Date(activity.date).toLocaleTimeString()}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => onLoad(activity)}
                                                className="px-3 py-1.5 bg-green-50 text-green-700 font-bold rounded hover:bg-green-100 transition-colors text-sm"
                                            >
                                                Abrir
                                            </button>
                                            <button
                                                onClick={() => {
                                                    if (window.confirm('Tem certeza que deseja excluir?')) {
                                                        onDelete(activity.id);
                                                    }
                                                }}
                                                className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
