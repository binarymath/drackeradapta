import React, { useState } from 'react';
import { Plus, Pencil, Trash2, Users, Upload as UploadIcon, Download } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';

const LobbyView = ({ expeditions = [], allMembers = [], onCreate, onRename, onDelete, onSelect, onImport }) => {
    const [newExpName, setNewExpName] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [editName, setEditName] = useState('');
    const fileInputRef = React.useRef(null);

    const handleCreate = () => {
        if (!newExpName.trim()) return;
        setPendingExpName(newExpName);
        setShowTypeModal(true);
        setIsCreating(false);
    };

    const handleConfirmType = (type) => {
        onCreate(pendingExpName, type);
        setNewExpName('');
        setPendingExpName('');
        setShowTypeModal(false);
    };

    const handleStartRename = (exp) => {
        setEditingId(exp.id);
        setEditName(exp.name);
    };

    const handleSaveRename = (id) => {
        if (!editName.trim()) return;
        onRename(id, editName);
        setEditingId(null);
    };

    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);

                // 1. Full System Backup (scoped import logic)
                // We typically look for 'expeditions' or 'tabs' keys.
                // Even if tabs exist, for THIS scoped import, we only care about Dracker data.
                if (data.expeditions && Array.isArray(data.expeditions)) {
                    const memberCount = data.allMembers?.length || 0;
                    const expCount = data.expeditions.length;

                    if (window.confirm(`Backup identificado.\n\nDeseja importar:\n- ${expCount} Turmas\n- ${memberCount} Exploradores\n\nIsso será MESCLADO com seus dados atuais.`)) {
                        onImport({
                            expeditions: data.expeditions,
                            allMembers: data.allMembers || []
                        });
                    }
                }
                // 2. Legacy Array (List of expeditions only)
                else if (Array.isArray(data)) {
                    if (window.confirm(`Deseja importar ${data.length} expedições?`)) {
                        onImport({ expeditions: data });
                    }
                }
                // 3. Single Expedition Object
                else if (data.id && data.name) {
                    onImport({ expeditions: [data] });
                }
                else {
                    alert('Formato de arquivo não reconhecido.');
                }
            } catch (error) {
                console.error('Erro ao ler arquivo:', error);
                alert('Erro ao ler o arquivo. Verifique se é um JSON válido.');
            }
        };
        reader.readAsText(file);
        event.target.value = ''; // Reset
    };

    const handleExport = () => {
        // Create a backup compatible with main system backup, but empty tabs
        const backupData = {
            version: '1.2',
            exportDate: new Date().toISOString(),
            tabs: [], // Empty so it doesn't clutter main backup if imported there
            expeditions: expeditions,
            allMembers: allMembers
        };

        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `expedicoes_dracker_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.json`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    };


    const [isCreating, setIsCreating] = useState(false);
    const [showTypeModal, setShowTypeModal] = useState(false);
    const [pendingExpName, setPendingExpName] = useState('');

    return (
        <>
            {/* Modal de Seleção de Tipo */}
            {showTypeModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowTypeModal(false)}>
                    <div className="bg-white rounded-2xl p-8 max-w-md w-full space-y-6 animate-fade-in" onClick={(e) => e.stopPropagation()}>
                        <div className="text-center">
                            <h3 className="text-2xl font-bold text-brown-800 mb-2">Tipo de Turma</h3>
                            <p className="text-brown-600 text-sm">Escolha o tipo para <strong>{pendingExpName}</strong></p>
                        </div>

                        <div className="space-y-3">
                            <button
                                onClick={() => handleConfirmType('principal')}
                                className="w-full p-4 rounded-xl border-2 border-brown-300 hover:border-brown-500 bg-white hover:bg-brown-50 transition-all text-left group"
                            >
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-brown-100 flex items-center justify-center text-brown-600 font-bold text-lg group-hover:bg-brown-200 transition-colors">🎯</div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-brown-800 mb-1">Turma Principal</h4>
                                        <p className="text-xs text-brown-600">Pode excluir cards permanentemente. Pode adicionar membros a turmas diversificadas.</p>
                                    </div>
                                </div>
                            </button>

                            <button
                                onClick={() => handleConfirmType('diversificada')}
                                className="w-full p-4 rounded-xl border-2 border-purple-300 hover:border-purple-500 bg-white hover:bg-purple-50 transition-all text-left group"
                            >
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-lg group-hover:bg-purple-200 transition-colors">🌟</div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-purple-800 mb-1">Turma Diversificada</h4>
                                        <p className="text-xs text-purple-600">Apenas remove membros da turma (não exclui permanentemente). Sem seletor de turmas.</p>
                                    </div>
                                </div>
                            </button>
                        </div>

                        <button
                            onClick={() => setShowTypeModal(false)}
                            className="w-full py-2 text-gray-500 hover:text-gray-700 text-sm font-medium"
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            )}

            <div className="max-w-6xl mx-auto space-y-8 animate-fade-in pb-12">
                {/* Header */}
                <div className="text-center space-y-4">
                    <h1 className="text-4xl md:text-5xl font-extrabold text-brown-800 drop-shadow-sm font-handwritten">
                        🗺️ Saguão das Expedições
                    </h1>
                    <p className="text-lg text-brown-600 max-w-2xl mx-auto">
                        Gerencie suas turmas de exploradores. Crie, organize e prepare-se para a jornada!
                    </p>
                    <div className="flex justify-center gap-4 pt-4">
                        <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="gap-2">
                            <UploadIcon size={16} /> Importar Backup
                        </Button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileUpload}
                            className="hidden"
                            accept=".json"
                        />
                        <Button variant="outline" onClick={handleExport} className="gap-2">
                            <Download size={16} /> Exportar Backup
                        </Button>
                    </div>
                </div>

                {/* Grid List */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">

                    {/* Add New Card */}
                    <div
                        onClick={() => setIsCreating(true)}
                        className={`
                        group relative flex flex-col items-center justify-center p-8 rounded-3xl border-2 border-dashed border-brown-300 
                        bg-brown-50/50 hover:bg-white hover:border-brown-400 hover:shadow-xl cursor-pointer transition-all duration-300 min-h-[200px]
                        ${isCreating ? 'ring-4 ring-brown-200 border-brown-500 bg-white' : ''}
                    `}
                    >
                        {isCreating ? (
                            <div className="w-full space-y-3 animate-fade-in" onClick={e => e.stopPropagation()}>
                                <div className="w-12 h-12 bg-brown-100 rounded-full flex items-center justify-center mx-auto text-brown-600 mb-2">
                                    <Plus size={24} />
                                </div>
                                <h3 className="text-center font-bold text-brown-800">Nova Turma</h3>
                                <Input
                                    value={newExpName}
                                    onChange={(e) => setNewExpName(e.target.value)}
                                    placeholder="Nome da Turma"
                                    className="text-center bg-brown-50 font-bold"
                                    autoFocus
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleCreate();
                                        if (e.key === 'Escape') setIsCreating(false);
                                    }}
                                />
                                <div className="flex gap-2 justify-center pt-2">
                                    <Button size="sm" variant="ghost" onClick={() => setIsCreating(false)}>Cancelar</Button>
                                    <Button size="sm" onClick={handleCreate} disabled={!newExpName.trim()}>Criar</Button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="w-16 h-16 rounded-full bg-white border-2 border-brown-200 flex items-center justify-center text-brown-400 group-hover:text-brown-600 group-hover:scale-110 transition-transform shadow-sm mb-4">
                                    <Plus size={32} />
                                </div>
                                <h3 className="font-bold text-brown-500 group-hover:text-brown-800 text-lg">Criar Nova Turma</h3>
                            </>
                        )}
                    </div>

                    {/* Existing Expeditions */}
                    {expeditions.map(exp => (
                        <div
                            key={exp.id}
                            onClick={() => { if (editingId !== exp.id) onSelect(exp.id); }}
                            className={`
                            group relative p-6 rounded-3xl border-2 transition-all duration-300 cursor-pointer flex flex-col
                            hover:-translate-y-1 hover:shadow-xl bg-white min-h-[200px]
                            ${editingId === exp.id ? 'border-brown-400 ring-4 ring-brown-100' : 'border-brown-100 hover:border-brown-300'}
                        `}
                        >
                            {/* Decorative Background Icon */}
                            <div className="absolute right-4 bottom-4 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
                                <Users size={80} className="text-brown-800" />
                            </div>

                            <div className="relative z-10 flex-1 flex flex-col">
                                {editingId === exp.id ? (
                                    <div className="flex gap-2 mb-4" onClick={e => e.stopPropagation()}>
                                        <Input
                                            value={editName}
                                            onChange={(e) => setEditName(e.target.value)}
                                            className="h-10 text-xl font-bold"
                                            autoFocus
                                            onBlur={() => handleSaveRename(exp.id)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleSaveRename(exp.id)}
                                        />
                                    </div>
                                ) : (
                                    <div className="flex justify-between items-start mb-4">
                                        <h3 className="text-2xl font-extrabold text-brown-800 leading-tight break-words pr-8" title={exp.name}>
                                            {exp.name?.length > 30 ? exp.name?.substring(0, 30) + '...' : exp.name}
                                        </h3>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity absolute right-[-8px] top-[-8px]">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleStartRename(exp); }}
                                                className="p-2 text-brown-400 hover:text-brown-600 hover:bg-brown-50 rounded-full transition-colors"
                                                title="Renomear"
                                            >
                                                <Pencil size={16} />
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (window.confirm('Tem certeza? Todos os membros serão perdidos.')) onDelete(exp.id);
                                                }}
                                                className="p-2 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                                                title="Excluir"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-center gap-2 text-brown-600 font-bold bg-brown-50 px-3 py-1.5 rounded-lg self-start text-sm mb-6">
                                    <Users size={16} />
                                    <span>{exp.memberIds?.length || 0} Exploradores</span>
                                </div>

                                <div className="mt-auto">
                                    <div className="flex -space-x-3 overflow-hidden py-1 pl-1">
                                        {exp.memberIds?.slice(0, 6).map((memberId, i) => {
                                            const m = allMembers.find(member => member.id === memberId);
                                            if (!m) return null;
                                            return (
                                                <div
                                                    key={m.id || i}
                                                    className="w-10 h-10 rounded-full border-2 border-white bg-brown-200 flex items-center justify-center text-[10px] font-bold text-brown-700 shadow-sm relative hover:z-20 hover:scale-110 transition-transform cursor-help"
                                                    title={m.name}
                                                >
                                                    {m.photo ? (
                                                        <img src={m.photo} className="w-full h-full rounded-full object-cover" alt={m.name} />
                                                    ) : (
                                                        m.name[0]
                                                    )}
                                                </div>
                                            );
                                        })}
                                        {(exp.memberIds?.length || 0) > 6 && (
                                            <div className="w-10 h-10 rounded-full border-2 border-white bg-brown-100 flex items-center justify-center text-xs font-bold text-brown-500 shadow-sm z-10">
                                                +{(exp.memberIds?.length || 0) - 6}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
};

export default LobbyView;
