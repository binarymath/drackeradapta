import React, { useState } from 'react';
import { X, Trash2, Save, FileText, CalendarClock, FolderOpen } from 'lucide-react';

// UI Components
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';

export const SaveLoadModal = ({ isOpen, onClose, onLoad, onSaveCurrent, onDelete, savedActivities }) => {
    const [name, setName] = useState('');

    const handleSave = () => {
        if (!name.trim()) return;
        onSaveCurrent(name);
        setName('');
    };

    if (!isOpen) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Gerenciar Atividades Salvas"
            icon={Save}
            size="lg"
        >
            <div className="space-y-6">
                {/* Save Current Section */}
                <Card className="bg-brown-100/50 border-brown-200">
                    <label className="block text-sm font-bold text-brown-800 mb-2">Salvar Atividade Atual</label>
                    <div className="flex gap-2">
                        <Input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="flex-1 bg-white"
                            placeholder="Digite um nome para identificar (ex: Geografia - Rios)"
                        />
                        <Button
                            onClick={handleSave}
                            disabled={!name.trim()}
                            className="w-auto px-6 whitespace-nowrap"
                            icon={Save}
                        >
                            Salvar
                        </Button>
                    </div>
                </Card>

                {/* Saved List Section */}
                <div>
                    <h3 className="text-sm font-bold text-brown-700 mb-3 uppercase tracking-wider flex items-center justify-between">
                        Atividades Salvas
                        <Badge variant="info">{savedActivities.length}</Badge>
                    </h3>

                    {savedActivities.length === 0 ? (
                        <div className="text-center py-10 text-brown-400 border-2 border-dashed border-brown-200 rounded-lg bg-brown-50/50">
                            <FileText className="w-10 h-10 mx-auto mb-2 opacity-50" />
                            <p>Nenhuma atividade salva ainda.</p>
                        </div>
                    ) : (
                        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                            {savedActivities.map((activity) => (
                                <Card key={activity.id} className="flex items-center justify-between group hover:shadow-md transition-all">
                                    <div className="flex-1">
                                        <h4 className="font-bold text-brown-900 line-clamp-1">{activity.name}</h4>
                                        <div className="flex items-center gap-3 text-xs text-brown-500 mt-1">
                                            <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-auto">
                                                {activity.type === 'wordsearch' ? 'Caça-Palavras' :
                                                    activity.type === 'quiz' ? 'Quiz' :
                                                        activity.type === 'summary' ? 'Drácker' :
                                                            activity.type === 'simplify' ? 'Simplificado' : 'Outro'}
                                            </Badge>
                                            <span className="flex items-center gap-1">
                                                <CalendarClock className="w-3 h-3" />
                                                {new Date(activity.date).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button
                                            onClick={() => onLoad(activity)}
                                            variant="secondary"
                                            className="px-3 py-1 text-xs h-auto"
                                            icon={FolderOpen}
                                        >
                                            Abrir
                                        </Button>
                                        <Button
                                            onClick={() => {
                                                if (window.confirm('Tem certeza que deseja excluir?')) {
                                                    onDelete(activity.id);
                                                }
                                            }}
                                            variant="ghost"
                                            className="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 h-auto"
                                            title="Excluir"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
};
