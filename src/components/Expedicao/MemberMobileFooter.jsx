
import React from 'react';
import { Download, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './MemberUI';

export const MemberMobileFooter = ({
    member,
    onPrev,
    onNext,
    handleDownloadPDF,
    isGeneratingMessage,
    diversifiedExpeditions,
    onCopy,
    onRemove,
    onRemoveFromExpedition,
    onClose, // Added
    expeditions,
    currentExpeditionId
}) => {

    // Logic from MemberModal
    const handleCopy = (targetId) => {
        if (!targetId) return;
        if (window.confirm('Adicionar este explorador a outra turma?')) {
            onCopy(member, parseInt(targetId));
            alert('Explorador adicionado com sucesso à turma!');
        }
    };

    const currentExp = expeditions?.find(e => e.id === currentExpeditionId);
    const isPrincipal = currentExp?.type === 'principal' || !currentExp?.type;

    return (
        <div className="md:hidden p-4 bg-white border-t border-brown-200 shrink-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-30 space-y-3">
            {/* Navigation Arrows - Mobile */}
            <div className="flex gap-3 justify-center">
                <button
                    onClick={(e) => { e.stopPropagation(); onPrev(member.id); }}
                    className="flex items-center justify-center p-2.5 bg-brown-600 hover:bg-brown-700 text-white rounded-full shadow-lg transition-all active:scale-95"
                    title="Card Anterior"
                >
                    <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); onNext(member.id); }}
                    className="flex items-center justify-center p-2.5 bg-brown-600 hover:bg-brown-700 text-white rounded-full shadow-lg transition-all active:scale-95"
                    title="Próximo Card"
                >
                    <ChevronRight className="w-6 h-6" />
                </button>
            </div>

            <button onClick={handleDownloadPDF} disabled={isGeneratingMessage} className="w-full bg-brown-700 hover:bg-brown-600 text-white font-bold py-3 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 mb-3">
                {isGeneratingMessage ? <span className="animate-pulse">Gerando...</span> : <><Download size={16} /> Baixar PDF</>}
            </button>
            {(() => {
                if (diversifiedExpeditions.length === 0) {
                    return null;
                }

                return (
                    <div className="mb-3">
                        <select
                            className="w-full p-2 text-xs border border-brown-300 rounded-lg text-center bg-brown-50 text-brown-800 h-10"
                            onChange={(e) => {
                                handleCopy(e.target.value);
                                e.target.value = "";
                            }}
                            defaultValue=""
                        >
                            <option value="" disabled>Adicionar a turma...</option>
                            {diversifiedExpeditions.map(e => (
                                <option key={e.id} value={e.id}>{e.name}</option>
                            ))}
                        </select>
                    </div>
                );
            })()}

            <button
                onClick={() => {
                    if (isPrincipal) {
                        if (window.confirm('Tem certeza que deseja excluir permanentemente este membro?')) onRemove(member.id);
                    } else {
                        if (window.confirm('Remover este membro desta turma?')) {
                            onRemoveFromExpedition(member.id, currentExpeditionId);
                            onClose();
                        }
                    }
                }}
                className="w-full py-2 text-red-400 hover:text-red-300 text-xs flex items-center justify-center gap-1 font-bold tracking-wide"
            >
                <Trash2 size={12} /> {isPrincipal ? 'Excluir Membro' : 'Remover da Turma'}
            </button>
        </div>
    );
};
