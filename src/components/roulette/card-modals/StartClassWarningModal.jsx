import React from 'react';
import { AlertTriangle, Play, FlaskConical, X } from 'lucide-react';

export const StartClassWarningModal = ({ 
    isOpen, 
    onClose, 
    onStartAndSpin, 
    onTestSpin 
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>
            
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl flex flex-col relative animate-in fade-in zoom-in-95 duration-200">
                {/* Cabeçalho */}
                <div className="p-5 sm:p-6 border-b border-amber-100 flex items-center justify-between shrink-0 bg-amber-50 rounded-t-2xl">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
                            <AlertTriangle className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-amber-950">Aula Não Iniciada</h2>
                            <p className="text-xs font-medium text-amber-700/70">Atenção ao salvar o progresso</p>
                        </div>
                    </div>
                    
                    <button 
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-white/50 border border-amber-200 text-amber-600 flex items-center justify-center hover:bg-white hover:text-amber-800 transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
                
                {/* Corpo */}
                <div className="p-6 text-slate-600 text-sm font-medium">
                    <p>
                        Você está prestes a realizar um sorteio, mas a aula oficial ainda <strong className="text-slate-800">não foi iniciada</strong>.
                    </p>
                    <p className="mt-2">
                        Se você girar agora, os pontos e históricos <strong className="text-rose-600">não serão salvos</strong> no relatório. O que deseja fazer?
                    </p>
                </div>

                {/* Rodapé / Botões */}
                <div className="p-5 bg-slate-50 border-t border-slate-100 rounded-b-2xl flex flex-col gap-3">
                    <button
                        onClick={onStartAndSpin}
                        className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-sm"
                    >
                        <Play className="w-4 h-4" />
                        Iniciar Aula e Girar
                    </button>
                    
                    <button
                        onClick={onTestSpin}
                        className="w-full flex items-center justify-center gap-2 bg-white text-slate-700 py-3 rounded-xl font-bold border border-slate-200 hover:bg-slate-100 transition-colors"
                    >
                        <FlaskConical className="w-4 h-4 text-slate-400" />
                        Girar como Teste (Não salvar dados)
                    </button>
                </div>
            </div>
        </div>
    );
};
