import React from 'react';
import { X, Copy, Check, Utensils, Clock, MapPin, Users, Sparkles } from 'lucide-react';
import { toast } from '../../ui/Toast';

export const StorybookLessonPlanModal = ({ isOpen, onClose, book }) => {
    const [copied, setCopied] = React.useState(false);

    if (!isOpen || !book) return null;

    const plan = book.lessonPlan || {
        title: `Receita de Bolo da Aula: ${book.title || 'Aventura do Drácker'}`,
        duration: '50 minutos',
        location: '100% na Sala de Aula',
        materials: ['Folhas de papel sulfite ou caderno', 'Lápis, borracha e canetas coloridas', 'Quadro / Lousa da sala'],
        activeMethodology: 'Think-Pair-Share (Pense, Compartilhe em Duplas e Produza em Equipe) com Mediação Ativa',
        stepByStep: {
            beginning: 'Início / Aquecimento Lúdico (5 a 10 min): O professor apresenta a capa ou o mistério central do livro na lousa e lança uma pergunta-gatilho desafiadora para ativar os conhecimentos prévios dos estudantes.',
            middle: 'Meio / Desenvolvimento Ativo (20 a 25 min): Os alunos se organizam em pequenos grupos de carteiras (3 a 4 alunos) para resolver os Desafios de Atenção de cada capítulo e produzir uma solução coletiva sem sair de seus lugares.',
            ending: 'Fim / Fechamento e Partilha (10 min): Cada equipe escolhe um porta-voz para uma apresentação relâmpago de 1 minuto ("Partilha dos Dragões"). O professor consolida o aprendizado e destaca a mensagem formativa.'
        },
        chefTip: 'Para turmas mais dinâmicas, crie um placar rápido na lousa com pontos de descoberta. Se preferir realizar de forma 100% individual, cada aluno resolve o desafio em sua própria folha com autonomia.'
    };

    const handleCopyPlan = () => {
        const text = `🍳 ${plan.title || 'RECEITA DE BOLO DA AULA'}\n` +
            `⏱️ Duração: ${plan.duration || '50 min'} | 📍 Local: ${plan.location || 'Sala de Aula'}\n\n` +
            `📦 1. INGREDIENTES DA AULA:\n` +
            `• Materiais: ${Array.isArray(plan.materials) ? plan.materials.join(', ') : plan.materials}\n` +
            `• Metodologia Ativa: ${plan.activeMethodology}\n\n` +
            `👩‍🍳 2. MODO DE PREPARO (Passo a Passo):\n` +
            `🟢 INÍCIO: ${plan.stepByStep?.beginning || ''}\n\n` +
            `🟡 MEIO: ${plan.stepByStep?.middle || ''}\n\n` +
            `🔴 FIM: ${plan.stepByStep?.ending || ''}\n\n` +
            `💡 DICA DO CHEF DRÁCKER:\n${plan.chefTip || ''}`;

        navigator.clipboard.writeText(text);
        setCopied(true);
        toast('Receita da aula copiada para a área de transferência!');
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in no-print">
            <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-amber-200 flex flex-col max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="flex justify-between items-center pb-3 border-b border-stone-200 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md">
                            <Utensils className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-base sm:text-lg font-black text-brown-950 flex items-center gap-2">
                                Receita de Bolo da Aula
                                <span className="bg-amber-100 text-amber-900 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">
                                    Guia do Professor
                                </span>
                            </h3>
                            <p className="text-xs text-stone-500 font-semibold">
                                Sequência didática prática para aplicar direto na sala de aula
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body com Scroll */}
                <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1 custom-scrollbar text-stone-800 text-sm">
                    {/* Tarjeta de Resumo */}
                    <div className="bg-amber-50/70 border border-amber-200 p-4 rounded-2xl flex flex-wrap gap-4 text-xs font-bold text-amber-950">
                        <div className="flex items-center gap-1.5">
                            <Clock className="w-4 h-4 text-amber-700" />
                            <span>{plan.duration || '50 min'}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <MapPin className="w-4 h-4 text-amber-700" />
                            <span>{plan.location || 'Sala de Aula'}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Users className="w-4 h-4 text-amber-700" />
                            <span>Grupos de Carteiras ou Individual</span>
                        </div>
                    </div>

                    {/* Ingredientes */}
                    <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200">
                        <h4 className="font-black text-xs uppercase tracking-wider text-brown-900 mb-2 flex items-center gap-1.5">
                            <span>📦 1. Ingredientes da Aula</span>
                        </h4>
                        <div className="space-y-1 text-xs text-stone-700">
                            <p><strong>Materiais:</strong> {Array.isArray(plan.materials) ? plan.materials.join(', ') : plan.materials}</p>
                            <p><strong>Metodologia Ativa:</strong> {plan.activeMethodology}</p>
                        </div>
                    </div>

                    {/* Modo de Preparo */}
                    <div className="space-y-3">
                        <h4 className="font-black text-xs uppercase tracking-wider text-brown-900 flex items-center gap-1.5">
                            <span>👩‍🍳 2. Modo de Preparo (Passo a Passo)</span>
                        </h4>

                        <div className="p-3.5 bg-emerald-50/70 border-l-4 border-emerald-500 rounded-xl">
                            <span className="text-xs font-black uppercase text-emerald-900 block mb-1">
                                🟢 Início / Aquecimento (5 a 10 min)
                            </span>
                            <p className="text-xs text-stone-800 leading-relaxed">
                                {plan.stepByStep?.beginning}
                            </p>
                        </div>

                        <div className="p-3.5 bg-amber-50/70 border-l-4 border-amber-500 rounded-xl">
                            <span className="text-xs font-black uppercase text-amber-900 block mb-1">
                                🟡 Meio / Desenvolvimento Ativo (20 a 25 min)
                            </span>
                            <p className="text-xs text-stone-800 leading-relaxed">
                                {plan.stepByStep?.middle}
                            </p>
                        </div>

                        <div className="p-3.5 bg-rose-50/70 border-l-4 border-rose-500 rounded-xl">
                            <span className="text-xs font-black uppercase text-rose-900 block mb-1">
                                🔴 Fim / Fechamento e Partilha (10 min)
                            </span>
                            <p className="text-xs text-stone-800 leading-relaxed">
                                {plan.stepByStep?.ending}
                            </p>
                        </div>
                    </div>

                    {/* Dica do Chef Drácker */}
                    {plan.chefTip && (
                        <div className="p-3.5 bg-amber-100/60 border border-amber-300 rounded-2xl flex items-start gap-2.5">
                            <Sparkles className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                            <div>
                                <span className="text-xs font-black uppercase tracking-wider text-amber-950 block mb-0.5">
                                    💡 Dica do Chef Drácker:
                                </span>
                                <p className="text-xs text-amber-900 leading-relaxed font-medium">
                                    {plan.chefTip}
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Buttons */}
                <div className="pt-3 border-t border-stone-200 flex justify-between items-center shrink-0">
                    <span className="text-xs text-stone-500 font-semibold hidden sm:inline">
                        Aplicação facilitada em sala de aula
                    </span>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={handleCopyPlan}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 font-black text-xs transition-colors cursor-pointer"
                        >
                            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                            <span>{copied ? 'Copiado!' : 'Copiar Receita'}</span>
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-900 text-white font-black text-xs transition-colors cursor-pointer"
                        >
                            Fechar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
