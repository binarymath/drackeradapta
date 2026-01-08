
import React, { useState } from 'react';
import { X, Save, Plus, Trash, HelpCircle, ChevronRight, ChevronDown, RefreshCw } from 'lucide-react';
import { useSystemState } from '../../contexts/SystemStateContext';
import * as Icons from 'lucide-react';

const ICON_OPTIONS = ['Star', 'Zap', 'Shield', 'Smile', 'Search', 'Users', 'Sun', 'Sparkles', 'BookOpen', 'Music', 'Ghost', 'Anchor', 'Map', 'Clock', 'AlertCircle', 'Backpack', 'Flame', 'Award', 'Layers', 'MessageCircle', 'Calculator', 'Eye', 'Brain', 'Heart', 'Compass'];

const COLOR_OPTIONS = [
    'bg-yellow-100 text-yellow-800 border-yellow-300',
    'bg-orange-100 text-orange-800 border-orange-300',
    'bg-indigo-100 text-indigo-800 border-indigo-300',
    'bg-pink-100 text-pink-800 border-pink-300',
    'bg-brown-200 text-brown-800 border-brown-300',
    'bg-green-100 text-green-800 border-green-300',
    'bg-teal-100 text-teal-800 border-teal-300',
    'bg-emerald-100 text-emerald-800 border-emerald-300',
    'bg-brown-100 text-brown-800 border-brown-300',
    'bg-amber-100 text-amber-800 border-amber-300',
    'bg-purple-100 text-purple-800 border-purple-300',
    'bg-blue-100 text-blue-800 border-blue-300',
    'bg-red-100 text-red-800 border-red-300',
    'bg-gray-100 text-gray-800 border-gray-300'
];

export const ArchetypeEditorModal = ({ onClose }) => {
    const { drackerState } = useSystemState();
    const { archetypes, trails, actions } = drackerState;

    // Local state for editing to avoid constant re-renders on global state
    const [localArchetypes, setLocalArchetypes] = useState(archetypes);
    const [localTrails, setLocalTrails] = useState(trails);
    const [activeTab, setActiveTab] = useState('profiles'); // profiles | trails
    const [expandedTrail, setExpandedTrail] = useState(null);

    const handleSave = () => {
        actions.updateArchetypes(localArchetypes);
        actions.updateTrails(localTrails);
        onClose();
    };

    const handleReset = () => {
        if (confirm("Tem certeza? Isso restaurará os perfis padrão.")) {
            actions.resetArchetypes();
            onClose();
        }
    }

    const updateArchetype = (key, field, value) => {
        setLocalArchetypes(prev => ({
            ...prev,
            [key]: { ...prev[key], [field]: value }
        }));
    };

    const updateTrail = (trailIndex, field, value) => {
        const newTrails = [...localTrails];
        newTrails[trailIndex] = { ...newTrails[trailIndex], [field]: value };
        setLocalTrails(newTrails);
    };

    const updateTrailOption = (trailIndex, optionIndex, field, value) => {
        const newTrails = [...localTrails];
        const newOptions = [...newTrails[trailIndex].options];
        newOptions[optionIndex] = { ...newOptions[optionIndex], [field]: value };
        newTrails[trailIndex].options = newOptions;
        setLocalTrails(newTrails);
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-brown-50">
                    <h2 className="text-xl font-bold text-brown-900 flex items-center gap-2">
                        <RefreshCw size={20} /> Editar Sistema de Arquétipos
                    </h2>
                    <div className="flex gap-2">
                        <button onClick={handleReset} className="px-3 py-1 text-xs text-red-600 hover:bg-red-50 rounded border border-transparent hover:border-red-200 transition-colors">
                            Restaurar Padrões
                        </button>
                        <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-full transition-colors">
                            <X size={20} className="text-brown-400" />
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-200 bg-white sticky top-0 z-10">
                    <button
                        onClick={() => setActiveTab('profiles')}
                        className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider text-center transition-colors ${activeTab === 'profiles' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                        Perfis de Estudante
                    </button>
                    <button
                        onClick={() => setActiveTab('trails')}
                        className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider text-center transition-colors ${activeTab === 'trails' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                        Perguntas (Trilhas)
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
                    {activeTab === 'profiles' && (
                        <div className="grid gap-6">
                            {Object.entries(localArchetypes).map(([key, arch]) => {
                                const Icon = Icons[arch.iconName] || Icons.HelpCircle;
                                return (
                                    <div key={key} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex gap-4 items-start">
                                        <div className={`p-3 rounded-lg flex-shrink-0 ${arch.color}`}>
                                            <Icon size={24} />
                                        </div>
                                        <div className="flex-1 grid gap-3">
                                            <div className="grid md:grid-cols-2 gap-3">
                                                <div>
                                                    <label className="text-xs font-bold text-gray-500 uppercase">Nome do Perfil</label>
                                                    {/* Note: Editing the KEY is hard because it's used as ID. For now edit display generic if we change structure, but here we can't easily change key without migrating data. 
                                                        Simplification: We edit the DESCRIPTION and Styles. Changing the ID (Name) breaks references in existing members.
                                                        If user really wants to rename "O Estrategista" to "O Pensador", we would need to migrate data. 
                                                        For this iteration, let's assume keys are fixed IDs but we could add a "DisplayName" field. 
                                                        The prompt implies changing everything, but re-mapping IDs is complex.
                                                        Allowing visual edits (Icon, Color, Description) is safer.
                                                    */}
                                                    <div className="font-bold text-gray-800 py-2">{key}</div>
                                                    <p className="text-xs text-amber-600 italic">O nome identificador não pode ser alterado para manter a integridade.</p>
                                                </div>
                                                <div>
                                                    <label className="text-xs font-bold text-gray-500 uppercase">Descrição</label>
                                                    <input
                                                        type="text"
                                                        value={arch.desc}
                                                        onChange={(e) => updateArchetype(key, 'desc', e.target.value)}
                                                        className="w-full p-2 border rounded text-sm"
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Ícone</label>
                                                    <select
                                                        value={arch.iconName}
                                                        onChange={(e) => updateArchetype(key, 'iconName', e.target.value)}
                                                        className="w-full p-2 border rounded text-sm"
                                                    >
                                                        {ICON_OPTIONS.map(icon => (
                                                            <option key={icon} value={icon}>{icon}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Estilo (Cor)</label>
                                                    <div className="flex flex-wrap gap-1">
                                                        {COLOR_OPTIONS.map((color, i) => (
                                                            <button
                                                                key={i}
                                                                onClick={() => updateArchetype(key, 'color', color)}
                                                                className={`w-6 h-6 rounded-full border-2 ${color.split(' ')[0]} ${arch.color === color ? 'border-black transform scale-125' : 'border-transparent'}`}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {activeTab === 'trails' && (
                        <div className="space-y-4">
                            {localTrails.map((trail, index) => (
                                <div key={trail.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                                    <div
                                        onClick={() => setExpandedTrail(expandedTrail === trail.id ? null : trail.id)}
                                        className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 bg-gray-50/50"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded ${trail.color}`}>
                                                {React.createElement(Icons[trail.iconName] || Icons.HelpCircle, { size: 18 })}
                                            </div>
                                            <div>
                                                <span className="font-bold text-gray-800">{trail.title}</span>
                                                <div className="text-xs text-gray-500 truncate max-w-md">{trail.question}</div>
                                            </div>
                                        </div>
                                        {expandedTrail === trail.id ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                                    </div>

                                    {expandedTrail === trail.id && (
                                        <div className="p-4 border-t border-gray-100 space-y-4 animate-slide-down">
                                            <div className="grid md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-xs font-bold text-gray-500 uppercase">Título</label>
                                                    <input
                                                        type="text"
                                                        value={trail.title}
                                                        onChange={(e) => updateTrail(index, 'title', e.target.value)}
                                                        className="w-full p-2 border rounded text-sm"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-xs font-bold text-gray-500 uppercase">Pergunta</label>
                                                    <input
                                                        type="text"
                                                        value={trail.question}
                                                        onChange={(e) => updateTrail(index, 'question', e.target.value)}
                                                        className="w-full p-2 border rounded text-sm"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Opções de Resposta</label>
                                                <div className="space-y-2">
                                                    {trail.options?.map((opt, optIndex) => (
                                                        <div key={optIndex} className="grid grid-cols-12 gap-2 items-center bg-gray-50 p-2 rounded">
                                                            <div className="col-span-3">
                                                                <input
                                                                    type="text"
                                                                    value={opt.label}
                                                                    onChange={(e) => updateTrailOption(index, optIndex, 'label', e.target.value)}
                                                                    className="w-full p-1 border rounded text-xs font-bold"
                                                                    placeholder="Rótulo"
                                                                />
                                                            </div>
                                                            <div className="col-span-4">
                                                                <input
                                                                    type="text"
                                                                    value={opt.desc}
                                                                    onChange={(e) => updateTrailOption(index, optIndex, 'desc', e.target.value)}
                                                                    className="w-full p-1 border rounded text-xs"
                                                                    placeholder="Descrição"
                                                                />
                                                            </div>
                                                            <div className="col-span-4">
                                                                <input
                                                                    type="text"
                                                                    value={opt.feedback}
                                                                    onChange={(e) => updateTrailOption(index, optIndex, 'feedback', e.target.value)}
                                                                    className="w-full p-1 border rounded text-xs text-blue-600"
                                                                    placeholder="Feedback"
                                                                />
                                                            </div>
                                                            {/* Value is key for logic, keep read-only ideally or hidden */}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 bg-white flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 rounded-lg text-gray-600 font-bold hover:bg-gray-100 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-6 py-2 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-md transition-all transform hover:scale-105 flex items-center gap-2"
                    >
                        <Save size={18} /> Salvar Alterações
                    </button>
                </div>
            </div>
        </div>
    );
};
