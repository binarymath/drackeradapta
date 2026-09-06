import React from 'react';
import { User, HelpCircle, UserMinus, UserCheck, Sparkles, CheckCircle, XCircle, RotateCw } from 'lucide-react';
import confetti from 'canvas-confetti';

export const RouletteCard = ({ winner, onCorrect, onIncorrect, onAbsent }) => {
    
    // Dispara confetes ao renderizar
    React.useEffect(() => {
        const end = Date.now() + 2 * 1000;
        const colors = ['#f87171', '#fbbf24', '#34d399', '#60a5fa', '#a78bfa'];

        (function frame() {
            confetti({
                particleCount: 5,
                angle: 60,
                spread: 55,
                origin: { x: 0 },
                colors: colors
            });
            confetti({
                particleCount: 5,
                angle: 120,
                spread: 55,
                origin: { x: 1 },
                colors: colors
            });

            if (Date.now() < end) {
                requestAnimationFrame(frame);
            }
        }());
    }, []);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-500 relative border-4 border-amber-300">
                {/* Header Decorativo */}
                <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-8 text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                    <Sparkles className="w-12 h-12 text-white/50 absolute top-4 left-4" />
                    <Sparkles className="w-8 h-8 text-white/50 absolute bottom-4 right-4" />
                    
                    <h2 className="text-xl font-bold text-amber-100 uppercase tracking-widest mb-2">Aluno Sorteado</h2>
                    <h1 className="text-5xl font-black text-white drop-shadow-lg flex items-center justify-center gap-4">
                        <User className="w-10 h-10" />
                        {winner.name}
                    </h1>
                </div>

                {/* Conteúdo (Pergunta) */}
                <div className="p-8 bg-slate-50">
                    <div className="bg-white border-2 border-indigo-100 p-8 rounded-2xl shadow-sm relative text-center">
                        <div className="inline-flex items-center justify-center gap-2 text-indigo-600 font-bold mb-4 bg-indigo-50 px-4 py-2 rounded-full border border-indigo-100">
                            <HelpCircle className="w-5 h-5" />
                            <span>Pergunta</span>
                        </div>
                        {winner.imageUrl && (
                            <div className="mb-6 flex justify-center">
                                <img 
                                    src={winner.imageUrl} 
                                    alt="Imagem da pergunta" 
                                    className="max-h-64 rounded-xl border-2 border-slate-200 shadow-md object-contain"
                                    onError={(e) => e.target.style.display='none'}
                                />
                            </div>
                        )}
                        <p className="text-2xl text-slate-800 font-bold leading-relaxed">
                            {winner.question}
                        </p>
                    </div>
                </div>

                {/* Ações */}
                <div className="p-6 bg-slate-100 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-center gap-4">
                    <button 
                        onClick={onCorrect}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-4 bg-emerald-500 border-2 border-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 hover:border-emerald-600 transition-colors shadow-sm text-lg"
                    >
                        <CheckCircle className="w-5 h-5" />
                        Acertou
                    </button>
                    
                    <button 
                        onClick={onIncorrect}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-4 bg-white border-2 border-red-200 text-red-500 font-bold rounded-xl hover:bg-red-50 hover:border-red-300 transition-colors shadow-sm text-lg"
                    >
                        <XCircle className="w-5 h-5" />
                        Errou
                    </button>

                    <button 
                        onClick={onAbsent}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-4 bg-slate-200 border-2 border-slate-300 text-slate-600 font-bold rounded-xl hover:bg-slate-300 hover:border-slate-400 transition-colors shadow-sm text-lg"
                        title="O aluno não está presente. Rodar novamente e remover da rodada de hoje."
                    >
                        <RotateCw className="w-5 h-5" />
                        Rode Novamente
                    </button>
                </div>
            </div>
        </div>
    );
};
