import React from 'react';
import { Users, Lightbulb, ThumbsUp, Shuffle, User, CheckCircle, XCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { gameAudio } from '../../../utils/gameAudio';

export const RouletteModeAjuda = ({
    winner,
    activeStudents,
    helpTab,
    setHelpTab,
    isDrawingHelper,
    helperStudent,
    setHelperStudent,
    drawingNameDisplay,
    handleDrawHelper,
    availableHelpers,
    onHelpResult,
    showHintRevealed,
    setShowHintRevealed,
    getMaskedHint,
    onRevealHint
}) => {
    return (
        <div className="bg-sky-50/90 border-2 border-sky-200 p-5 rounded-2xl space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Abas de Ajuda */}
            <div className="flex bg-white p-1 rounded-xl border border-sky-200 shadow-2xs gap-1">
                <button
                    onClick={() => { setHelpTab('colleague'); gameAudio.playTick(); }}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        helpTab === 'colleague' 
                        ? 'bg-sky-600 text-white shadow-xs' 
                        : 'text-slate-600 hover:bg-sky-50'
                    }`}
                >
                    <Users className="w-3.5 h-3.5" />
                    <span>Colega Ajudante</span>
                </button>
                <button
                    onClick={() => { setHelpTab('hint'); gameAudio.playTick(); }}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        helpTab === 'hint' 
                        ? 'bg-sky-600 text-white shadow-xs' 
                        : 'text-slate-600 hover:bg-sky-50'
                    }`}
                >
                    <Lightbulb className="w-3.5 h-3.5" />
                    <span>Ver Pista</span>
                </button>
                <button
                    onClick={() => { setHelpTab('class'); gameAudio.playTick(); }}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        helpTab === 'class' 
                        ? 'bg-sky-600 text-white shadow-xs' 
                        : 'text-slate-600 hover:bg-sky-50'
                    }`}
                >
                    <ThumbsUp className="w-3.5 h-3.5" />
                    <span>Opinião da Sala</span>
                </button>
            </div>

            {/* ABA 1: COLEGA AJUDANTE */}
            {helpTab === 'colleague' && (
                <div className="space-y-3">
                    <div className="bg-white p-4 rounded-xl border border-sky-100 text-center shadow-2xs">
                        {isDrawingHelper ? (
                            <div className="py-4 space-y-2">
                                <div className="text-xs font-bold text-sky-600 uppercase tracking-widest">Sorteando Ajudante...</div>
                                <div className="text-3xl font-black text-indigo-700 animate-pulse font-mono">
                                    {drawingNameDisplay || '...'}
                                </div>
                            </div>
                        ) : helperStudent ? (
                            <div className="py-2 space-y-1">
                                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 uppercase tracking-wider">
                                    ✨ Colega Escolhido(a)
                                </span>
                                <h3 className="text-2xl font-black text-slate-800 flex items-center justify-center gap-2">
                                    <User className="w-6 h-6 text-sky-500" />
                                    {helperStudent.name}
                                </h3>
                                <p className="text-xs text-slate-500">
                                    {helperStudent.name} agora está em dupla com {winner.name}!
                                </p>
                            </div>
                        ) : (
                            <div className="py-3 text-slate-600 text-xs">
                                Nenhum colega selecionado ainda. Clique abaixo para sortear ou escolha na lista.
                            </div>
                        )}

                        <div className="flex flex-wrap items-center justify-center gap-2 mt-3 pt-3 border-t border-slate-100">
                            <button
                                disabled={isDrawingHelper}
                                onClick={handleDrawHelper}
                                className="px-4 py-2 bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-xl text-xs font-black shadow-xs hover:from-sky-600 hover:to-blue-700 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                            >
                                <Shuffle className="w-3.5 h-3.5" />
                                {helperStudent ? 'Sortear Outro Colega 🎲' : 'Sortear Colega Ajudante 🎲'}
                            </button>

                            {/* Seletor Manual */}
                            <select
                                value={helperStudent?.id || ''}
                                onChange={(e) => {
                                    const helpersPool = availableHelpers.length > 0 ? availableHelpers : activeStudents;
                                    const selected = helpersPool.find(s => s.id === e.target.value);
                                    setHelperStudent(selected || null);
                                    if (selected) gameAudio.playTick();
                                }}
                                className="text-xs font-bold text-slate-700 bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-2 outline-none cursor-pointer"
                            >
                                <option value="">Escolher manualmente...</option>
                                {(availableHelpers.length > 0 ? availableHelpers : activeStudents)
                                    .filter(s => s.id !== winner.id && s.status !== 'absent')
                                    .map(s => (
                                        <option key={s.id} value={s.id}>
                                            {s.name} {s.status === 'removed' ? '(Fora da Roleta)' : ''}
                                        </option>
                                    ))
                                }
                            </select>
                        </div>
                    </div>

                    {/* Ações de Desfecho da Dupla */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                        <button
                            onClick={() => {
                                gameAudio.playSuccess();
                                confetti({ particleCount: 45, spread: 75 });
                                if (onHelpResult) {
                                    onHelpResult({
                                        helperStudentId: helperStudent?.id || null,
                                        isCorrect: true,
                                        questionText: winner.question,
                                        helpType: 'colleague'
                                    });
                                }
                            }}
                            className="p-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-black text-xs sm:text-sm shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                            <CheckCircle className="w-4 h-4" />
                            {helperStudent ? `Acertaram em Dupla! (+1 para ambos)` : 'Acertou com Ajuda! (+1 ponto)'}
                        </button>

                        <button
                            onClick={() => {
                                if (onHelpResult) {
                                    onHelpResult({
                                        helperStudentId: helperStudent?.id || null,
                                        isCorrect: false,
                                        questionText: winner.question,
                                        helpType: 'colleague'
                                    });
                                }
                            }}
                            className="p-3 bg-white border border-red-200 text-red-600 hover:bg-red-50 rounded-xl font-bold text-xs sm:text-sm shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                            <XCircle className="w-4 h-4" />
                            Errou (Tentativa com Ajuda)
                        </button>
                    </div>
                </div>
            )}

            {/* ABA 2: PISTA / DICA */}
            {helpTab === 'hint' && (
                <div className="bg-white p-4 rounded-xl border border-sky-100 space-y-3">
                    <div className="text-xs font-black text-sky-900 uppercase tracking-wider flex items-center gap-1.5">
                        <Lightbulb className="w-4 h-4 text-amber-500" />
                        Pista Pedagógica:
                    </div>
                    
                    {!showHintRevealed ? (
                        <div className="text-center py-4 space-y-2">
                            <p className="text-xs text-slate-500">
                                A pista revela as letras da resposta ou o professor pode dar uma dica oral!
                            </p>
                            <button
                                onClick={() => { 
                                    setShowHintRevealed(true); 
                                    if (onRevealHint) onRevealHint();
                                    gameAudio.playTick(); 
                                }}
                                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-black text-xs shadow-xs transition-all cursor-pointer"
                            >
                                Revelar Letras da Resposta 🔍
                            </button>
                        </div>
                    ) : (
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
                            <div className="text-2xs font-bold text-amber-800 uppercase">Letras da resposta:</div>
                            <div className="font-mono text-base font-black text-slate-800 tracking-wider">
                                {getMaskedHint(winner.answer)}
                            </div>
                        </div>
                    )}

                    <div className="pt-2 flex justify-center gap-2">
                        <button
                            onClick={() => {
                                gameAudio.playSuccess();
                                if (onHelpResult) {
                                    onHelpResult({ 
                                        helperStudentId: null, 
                                        isCorrect: true, 
                                        questionText: winner.question, 
                                        helpType: 'hint' 
                                    });
                                }
                            }}
                            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-black transition-all cursor-pointer"
                        >
                            Acertou com a Dica! ✅
                        </button>
                    </div>
                </div>
            )}

            {/* ABA 3: OPINIÃO DA SALA */}
            {helpTab === 'class' && (
                <div className="bg-white p-4 rounded-xl border border-sky-100 text-center space-y-3">
                    <ThumbsUp className="w-8 h-8 text-sky-500 mx-auto" />
                    <h4 className="text-sm font-black text-slate-800">
                        Consulta à Sala de Aula
                    </h4>
                    <p className="text-xs text-slate-600 max-w-md mx-auto">
                        Peça para a turma levantar a mão para quem acha que sabe a resposta, ou permita que um colega fale uma palavra-chave para auxiliar!
                    </p>

                    <div className="pt-2 flex justify-center gap-2">
                        <button
                            onClick={() => {
                                gameAudio.playSuccess();
                                if (onHelpResult) {
                                    onHelpResult({ 
                                        helperStudentId: null, 
                                        isCorrect: true, 
                                        questionText: winner.question, 
                                        helpType: 'class_opinion' 
                                    });
                                }
                            }}
                            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-black transition-all cursor-pointer"
                        >
                            Acertou com a Turma! ✅
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
