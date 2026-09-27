import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, Check, MessageSquare } from 'lucide-react';

const POSITIVE_PRESETS = [
    'Monitorou a aula',
    'Participação ativa e resposta correta',
    'Excelente raciocínio e explicação',
    'Ajudou um colega / Trabalho em equipe',
    'Comportamento exemplar e disciplina',
    'Iniciativa e criatividade na aula',
];

const NEGATIVE_PRESETS = [
    'Conversa paralela / Desatenção',
    'Uso inadequado de celular/dispositivo',
    'Desrespeito às regras do jogo ou da aula',
    'Recusa ou atraso para responder',
    'Interrupção ou barulho excessivo',
];

export const PointJustificationModal = ({
    isOpen,
    onClose,
    targetName,
    targetType = 'student', // 'student' | 'group'
    delta = 1,
    onConfirm
}) => {
    const isPositive = delta > 0;
    const presets = isPositive ? POSITIVE_PRESETS : NEGATIVE_PRESETS;

    const [selectedPreset, setSelectedPreset] = useState(presets[0]);
    const [customText, setCustomText] = useState('');
    const [isCustomSelected, setIsCustomSelected] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setSelectedPreset(presets[0]);
            setCustomText('');
            setIsCustomSelected(false);
        }
    }, [isOpen, delta]);

    if (!isOpen) return null;

    const handleSelectPreset = (preset) => {
        setSelectedPreset(preset);
        setIsCustomSelected(false);
    };

    const handleSelectCustom = () => {
        setIsCustomSelected(true);
    };

    const handleSubmit = (e) => {
        e?.preventDefault();
        const justification = isCustomSelected 
            ? (customText.trim() || (isPositive ? 'Bônus por Mérito' : 'Penalidade de Regra'))
            : selectedPreset;

        onConfirm(justification);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in select-none">
            <div 
                className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden transform transition-all duration-200 scale-100"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Cabeçalho do Modal com azul para positivo e marrom para negativo */}
                <div className={`p-5 text-white flex items-center justify-between ${
                    isPositive 
                        ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700' 
                        : 'bg-gradient-to-r from-amber-900 via-stone-800 to-amber-950'
                }`}>
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center font-black text-lg shrink-0 shadow-inner">
                            {isPositive ? <Plus className="w-6 h-6 stroke-[3]" /> : <Minus className="w-6 h-6 stroke-[3]" />}
                        </div>
                        <div className="min-w-0">
                            <span className="text-[11px] font-black uppercase tracking-wider opacity-90 block">
                                {isPositive ? 'Adicionar Ponto' : 'Remover Ponto'} • {targetType === 'group' ? 'Equipe' : 'Aluno'}
                            </span>
                            <h3 className="text-base font-black truncate leading-tight" title={targetName}>
                                {targetName}
                            </h3>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer text-white shrink-0"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Corpo do Modal */}
                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                    <div>
                        <label className="block text-xs font-extrabold uppercase tracking-wide text-slate-600 mb-2 flex items-center gap-1.5">
                            <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                            Selecione a Justificativa:
                        </label>

                        {/* Lista de Presets */}
                        <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1 custom-scrollbar">
                            {presets.map((preset) => {
                                const isSelected = !isCustomSelected && selectedPreset === preset;
                                return (
                                    <button
                                        key={preset}
                                        type="button"
                                        onClick={() => handleSelectPreset(preset)}
                                        className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-between border ${
                                            isSelected
                                                ? isPositive
                                                    ? 'bg-blue-50 text-blue-950 border-blue-300 shadow-2xs font-extrabold'
                                                    : 'bg-amber-50 text-amber-950 border-amber-300 shadow-2xs font-extrabold'
                                                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                                        }`}
                                    >
                                        <span className="pr-2 leading-tight">{preset}</span>
                                        {isSelected && (
                                            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-white shrink-0 ${
                                                isPositive ? 'bg-blue-600' : 'bg-amber-800'
                                            }`}>
                                                <Check className="w-3 h-3 stroke-[3]" />
                                            </div>
                                        )}
                                    </button>
                                );
                            })}

                            {/* Opção "Outro" */}
                            <button
                                type="button"
                                onClick={handleSelectCustom}
                                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-between border ${
                                    isCustomSelected
                                        ? isPositive
                                            ? 'bg-blue-50 text-blue-950 border-blue-300 shadow-2xs font-extrabold'
                                            : 'bg-amber-50 text-amber-950 border-amber-300 shadow-2xs font-extrabold'
                                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                                }`}
                            >
                                <span>✏️ Outro motivo (escrever brevemente)</span>
                                {isCustomSelected && (
                                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-white shrink-0 ${
                                        isPositive ? 'bg-blue-600' : 'bg-amber-800'
                                    }`}>
                                        <Check className="w-3 h-3 stroke-[3]" />
                                    </div>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Campo de Texto quando "Outro" estiver selecionado */}
                    {isCustomSelected && (
                        <div className="pt-1 animate-fade-in">
                            <input
                                type="text"
                                autoFocus
                                value={customText}
                                onChange={(e) => setCustomText(e.target.value)}
                                placeholder="Digite brevemente a justificativa..."
                                maxLength={100}
                                className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-800 placeholder-slate-400 shadow-2xs"
                            />
                            <span className="text-[10px] text-slate-400 mt-1 block text-right">
                                {customText.length}/100 caracteres
                            </span>
                        </div>
                    )}

                    {/* Botões do Rodapé */}
                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-black text-white transition-all shadow-md cursor-pointer active:scale-98 ${
                                isPositive
                                    ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'
                                    : 'bg-amber-800 hover:bg-amber-900 shadow-amber-300'
                            }`}
                        >
                            {isPositive ? 'Confirmar (+1)' : 'Confirmar (-1)'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

