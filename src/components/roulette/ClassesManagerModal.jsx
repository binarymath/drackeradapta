import React, { useState } from 'react';
import { X, Plus, Trash2, Edit2, Check, Users } from 'lucide-react';
import { Modal } from '../ui/Modal';

export const ClassesManagerModal = ({ isOpen, onClose, classes, setClasses, selectedClassId, setSelectedClassId }) => {
    const [editingClassId, setEditingClassId] = useState(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);
    const [editName, setEditName] = useState('');
    const [editStudents, setEditStudents] = useState('');

    const handleCreateClass = () => {
        const newClass = {
            id: Date.now().toString(),
            name: 'Nova Turma',
            students: []
        };
        setClasses([...classes, newClass]);
        setEditingClassId(newClass.id);
        setEditName(newClass.name);
        setEditStudents('');
    };

    const handleSaveClass = (id) => {
        const namesList = editStudents.split('\n').map(n => n.trim()).filter(n => n);
        
        const currentClass = classes.find(c => c.id === id) || { students: [] };
        
        const updatedStudents = namesList.map(name => {
            const existing = currentClass.students.find(s => s.name === name);
            if (existing) return existing;
            return {
                id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
                name: name,
                hits: 0,
                misses: 0,
                status: 'active',
                history: []
            };
        });

        const updatedClasses = classes.map(c => 
            c.id === id ? { ...c, name: editName, students: updatedStudents } : c
        );
        
        setClasses(updatedClasses);
        setEditingClassId(null);
        if (!selectedClassId) setSelectedClassId(id);
    };

    const handleDeleteClass = (id) => {
        setClasses(classes.filter(c => c.id !== id));
        if (selectedClassId === id) setSelectedClassId('');
        setConfirmDeleteId(null);
    };

    const startEdit = (cls) => {
        setEditingClassId(cls.id);
        setEditName(cls.name);
        setEditStudents(cls.students.map(s => s.name).join('\n'));
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Gerenciar Turmas" maxWidth="max-w-2xl">
            <div className="space-y-6">
                
                <div className="flex justify-between items-center bg-indigo-50 p-4 rounded-2xl border border-indigo-100">
                    <div className="flex items-center gap-3 text-indigo-900">
                        <Users className="w-6 h-6 text-indigo-500" />
                        <div>
                            <h3 className="font-bold">Suas Turmas</h3>
                            <p className="text-sm text-indigo-700">O histórico dos alunos é salvo automaticamente.</p>
                        </div>
                    </div>
                    <button 
                        onClick={handleCreateClass}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-colors"
                    >
                        <Plus className="w-4 h-4" /> Nova Turma
                    </button>
                </div>

                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                    {classes.length === 0 && (
                        <p className="text-center text-slate-400 py-8 italic">Nenhuma turma cadastrada.</p>
                    )}

                    {classes.map(cls => (
                        <div key={cls.id} className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                            {editingClassId === cls.id ? (
                                <div className="p-4 space-y-4 bg-slate-50">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1">Nome da Turma</label>
                                        <input 
                                            value={editName}
                                            onChange={e => setEditName(e.target.value)}
                                            className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-bold"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1">Alunos (um por linha)</label>
                                        <textarea 
                                            value={editStudents}
                                            onChange={e => setEditStudents(e.target.value)}
                                            rows={6}
                                            className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                                            placeholder="João da Silva&#10;Maria Souza..."
                                        />
                                        <p className="text-xs text-slate-500 mt-1">
                                            Alunos removidos acidentalmente perderão seu histórico. Novos alunos começarão do zero.
                                        </p>
                                    </div>
                                    <div className="flex justify-end gap-2 pt-2">
                                        <button 
                                            onClick={() => setEditingClassId(null)}
                                            className="px-4 py-2 rounded-lg font-bold text-slate-600 hover:bg-slate-200"
                                        >
                                            Cancelar
                                        </button>
                                        <button 
                                            onClick={() => handleSaveClass(cls.id)}
                                            className="px-4 py-2 rounded-lg font-bold text-white bg-emerald-500 hover:bg-emerald-600 flex items-center gap-1"
                                        >
                                            <Check className="w-4 h-4" /> Salvar
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-4 flex items-center justify-between">
                                    <div>
                                        <h4 className="font-bold text-slate-800 text-lg">{cls.name}</h4>
                                        <p className="text-sm text-slate-500">{cls.students.length} alunos cadastrados</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button 
                                            onClick={() => {
                                                setSelectedClassId(cls.id);
                                                onClose();
                                            }}
                                            className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${
                                                selectedClassId === cls.id 
                                                ? 'bg-indigo-100 text-indigo-700' 
                                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                            }`}
                                        >
                                            {selectedClassId === cls.id ? 'Selecionada' : 'Selecionar'}
                                        </button>
                                        <button 
                                            onClick={() => startEdit(cls)}
                                            className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                                            title="Editar Turma"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        
                                        {confirmDeleteId === cls.id ? (
                                            <div className="flex items-center bg-red-50 rounded-lg border border-red-200 p-1">
                                                <span className="text-xs text-red-600 font-bold px-2">Excluir?</span>
                                                <button 
                                                    onClick={() => handleDeleteClass(cls.id)}
                                                    className="p-1 text-white bg-red-500 hover:bg-red-600 rounded mr-1"
                                                >
                                                    <Check className="w-3 h-3" />
                                                </button>
                                                <button 
                                                    onClick={() => setConfirmDeleteId(null)}
                                                    className="p-1 text-slate-500 bg-white hover:bg-slate-100 rounded"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ) : (
                                            <button 
                                                onClick={() => setConfirmDeleteId(cls.id)}
                                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Excluir Turma"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </Modal>
    );
};
