
import React from 'react';
import { Trash2 } from 'lucide-react';
import { Card, Button, TextArea, Input } from './MemberUI';

export const MemberLogbookTab = ({
    member,
    newLogText,
    setNewLogText,
    newLogResponsible,
    setNewLogResponsible,
    newLogSubject,
    setNewLogSubject,
    handleAddLog,
    onUpdate
}) => {
    return (
        <div className="space-y-6 animate-fade-in h-full flex flex-col">
            {/* New Log Input */}
            <Card className="p-4 bg-brown-50 border-brown-100 space-y-3 shrink-0">
                <div className="flex gap-2 mb-2">
                    <Input
                        placeholder="Responsável (Ex: Prof. Silva)"
                        value={newLogResponsible}
                        onChange={(e) => setNewLogResponsible(e.target.value)}
                        className="text-sm bg-white"
                    />
                    <Input
                        placeholder="Assunto (Ex: Comportamento)"
                        value={newLogSubject}
                        onChange={(e) => setNewLogSubject(e.target.value)}
                        className="text-sm bg-white"
                    />
                </div>
                <TextArea
                    value={newLogText}
                    onChange={(e) => setNewLogText(e.target.value)}
                    placeholder="Escreva uma nova observação..."
                    className="min-h-[80px] text-sm bg-white resize-none"
                />
                <div className="flex justify-end">
                    <Button
                        onClick={handleAddLog}
                        disabled={!newLogText.trim()}
                        size="sm"
                        className="bg-brown-600 hover:bg-brown-700 text-white"
                    >
                        Adicionar Registro
                    </Button>
                </div>
            </Card>

            {/* Logs List */}
            <div className="space-y-4 flex-1 overflow-y-auto md:overflow-y-visible pr-2 custom-scrollbar">
                {(member.registry && member.registry.length > 0) ? (
                    member.registry.map(log => (
                        <div key={log.id} className="flex gap-3 relative pb-6 last:pb-0">
                            {/* Timeline Line */}
                            <div className="absolute left-[19px] top-8 bottom-0 w-0.5 bg-brown-100 last:hidden"></div>

                            <div className="w-10 h-10 rounded-full bg-white border-2 border-brown-200 flex items-center justify-center shrink-0 z-10 shadow-sm text-[10px] font-bold text-brown-400 flex-col leading-none">
                                <span>{log.date.split('/')[0]}</span>
                                <span>{log.date.split('/')[1]}</span>
                            </div>
                            <div className="flex-1 bg-white border border-gray-100 p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-brown-800 text-sm">{log.responsible}</span>
                                        <span className="text-xs text-gray-400">• {log.subject}</span>
                                    </div>
                                    <button
                                        onClick={() => {
                                            if (window.confirm('Apagar este registro?')) {
                                                const updated = member.registry.filter(r => r.id !== log.id);
                                                onUpdate(member.id, { registry: updated });
                                            }
                                        }}
                                        className="text-gray-300 hover:text-red-400"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                                <p className="text-brown-600 text-sm leading-relaxed whitespace-pre-wrap">{log.text}</p>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-12 text-gray-400 italic">
                        Nenhum registro no diário ainda.
                    </div>
                )}
            </div>
        </div>
    );
};
