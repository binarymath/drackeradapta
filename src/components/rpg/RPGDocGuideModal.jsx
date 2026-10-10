import React from 'react';
import { 
    BookOpen, Sparkles, Target, Compass, Users, CheckCircle, 
    XCircle, Award, Lightbulb, HelpCircle, Layers, FileText
} from 'lucide-react';
import { Button } from '../ui/Button';

export const RPGDocGuideModal = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-fade-in no-print">
            <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 flex flex-col max-h-[90vh]">
                
                {/* Cabeçalho do Card */}
                <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-amber-500 text-white flex items-center justify-center text-2xl shadow-sm shrink-0">
                            📜
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                                    Documento Pedagógico
                                </span>
                                <span className="text-xs font-semibold text-slate-400">
                                    Mestre Drácker
                                </span>
                            </div>
                            <h3 className="text-lg sm:text-xl font-black text-slate-900 leading-tight">
                                RPG Educacional: O que é, Finalidade e Como Jogar
                            </h3>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
                        title="Fechar Documento"
                    >
                        <XCircle className="w-6 h-6" />
                    </button>
                </div>

                {/* Conteúdo com Scroll */}
                <div className="overflow-y-auto py-5 space-y-6 flex-1 pr-1.5 text-slate-700 leading-relaxed text-sm custom-scrollbar">
                    
                    {/* 1. O QUE É O RPG */}
                    <div className="bg-indigo-50/60 rounded-2xl p-5 border border-indigo-100 space-y-2.5">
                        <div className="flex items-center gap-2.5 text-indigo-900 font-black text-base">
                            <Compass className="w-5 h-5 text-indigo-600" />
                            <h4>1. O que é o RPG Educacional?</h4>
                        </div>
                        <p className="text-slate-600 text-xs sm:text-sm">
                            O <b>RPG Educacional (Role-Playing Game)</b> é uma metodologia ativa de aprendizagem baseada em narrativas e gamificação. Em vez de uma aula expositiva tradicional ou uma simples lista de exercícios, a turma é transportada para uma <b>expedição investigativa</b> ambientada em universos fascinantes (como florestas encantadas, estações espaciais, reinos medievais ou oceanos profundos).
                        </p>
                        <p className="text-slate-600 text-xs sm:text-sm">
                            Nessa dinâmica, o professor assume o papel de <b>Mestre da Aventura</b>, e os estudantes tornam-se <b>exploradores ou detetives do conhecimento</b>, trabalhando em equipe ou individualmente para solucionar enigmas curriculares e desvendar um grande mistério.
                        </p>
                    </div>

                    {/* 2. QUAL A FINALIDADE PEDAGÓGICA */}
                    <div className="bg-amber-50/60 rounded-2xl p-5 border border-amber-100 space-y-3">
                        <div className="flex items-center gap-2.5 text-amber-950 font-black text-base">
                            <Target className="w-5 h-5 text-amber-600" />
                            <h4>2. Qual a Finalidade Pedagógica?</h4>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                            <div className="bg-white p-3.5 rounded-xl border border-amber-200/70 shadow-2xs space-y-1">
                                <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                                    <Sparkles className="w-4 h-4 text-amber-500" /> Engajamento e Imersão
                                </span>
                                <p className="text-[11px] text-slate-500 leading-normal">
                                    O conteúdo da disciplina deixa de ser abstrato e passa a ter utilidade prática imediata dentro do enredo da história.
                                </p>
                            </div>

                            <div className="bg-white p-3.5 rounded-xl border border-amber-200/70 shadow-2xs space-y-1">
                                <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                                    <Lightbulb className="w-4 h-4 text-amber-500" /> Raciocínio Lógico & Crítico
                                </span>
                                <p className="text-[11px] text-slate-500 leading-normal">
                                    Cada capítulo desafia a turma com perguntas contextualizadas, promovendo o debate, a dedução e a aplicação do conhecimento.
                                </p>
                            </div>

                            <div className="bg-white p-3.5 rounded-xl border border-amber-200/70 shadow-2xs space-y-1">
                                <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                                    <Users className="w-4 h-4 text-amber-500" /> Colaboração e Inclusão
                                </span>
                                <p className="text-[11px] text-slate-500 leading-normal">
                                    Integração direta com as equipes da turma criadas na plataforma Drácker, garantindo que todos os alunos participem ativamente.
                                </p>
                            </div>

                            <div className="bg-white p-3.5 rounded-xl border border-amber-200/70 shadow-2xs space-y-1">
                                <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                                    <Award className="w-4 h-4 text-amber-500" /> Reforço Positivo & Relíquias
                                </span>
                                <p className="text-[11px] text-slate-500 leading-normal">
                                    Em vez de punir o erro, a plataforma oferece dicas construtivas do Drácker e premia o progresso com artefatos mágicos colecionáveis.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* 3. COMO JOGAR NA PLATAFORMA */}
                    <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-3.5">
                        <div className="flex items-center gap-2.5 text-slate-900 font-black text-base">
                            <Layers className="w-5 h-5 text-indigo-600" />
                            <h4>3. Como Jogar o RPG na Plataforma Drácker</h4>
                        </div>

                        <div className="space-y-3">
                            {/* Passo 1 */}
                            <div className="flex items-start gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                                <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs font-black shrink-0 mt-0.5">
                                    1
                                </span>
                                <div>
                                    <h5 className="font-bold text-slate-900 text-xs sm:text-sm">
                                        Defina o Tema e Contexto na Tela de Montagem
                                    </h5>
                                    <p className="text-slate-500 text-xs mt-0.5">
                                        Informe o tópico pedagógico da aula (ex: <i>Frações Equivalentes</i>, <i>Ciclo da Água</i>, <i>Revolução Industrial</i>) e adicione orientações ou contexto caso deseje personalizar o foco.
                                    </p>
                                </div>
                            </div>

                            {/* Passo 2 */}
                            <div className="flex items-start gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                                <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs font-black shrink-0 mt-0.5">
                                    2
                                </span>
                                <div>
                                    <h5 className="font-bold text-slate-900 text-xs sm:text-sm">
                                        Escolha o Universo e Modo de Participação
                                    </h5>
                                    <p className="text-slate-500 text-xs mt-0.5">
                                        Selecione o cenário (Floresta, Espaço, Medieval ou Oceano) e o modo de jogo: <b>Equipes Oficiais</b> (grupos da roleta), <b>Jornada no Caderno Escolar</b> (desafio individual que todos resolvem no caderno) ou <b>Equipes Livres</b>.
                                    </p>
                                </div>
                            </div>

                            {/* Passo 3 */}
                            <div className="flex items-start gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                                <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs font-black shrink-0 mt-0.5">
                                    3
                                </span>
                                <div>
                                    <h5 className="font-bold text-slate-900 text-xs sm:text-sm">
                                        Conduza a Aventura na Lousa ou Projetor
                                    </h5>
                                    <p className="text-slate-500 text-xs mt-0.5">
                                        Clique em <b>Iniciar Missão</b>. A IA gera instantaneamente a história completa com início, meio e fim dividida em capítulos. Projete no telão para a turma acompanhar a narrativa e os desafios de cada cena.
                                    </p>
                                </div>
                            </div>

                            {/* Passo 4 */}
                            <div className="flex items-start gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                                <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs font-black shrink-0 mt-0.5">
                                    4
                                </span>
                                <div>
                                    <h5 className="font-bold text-slate-900 text-xs sm:text-sm">
                                        Resolução dos Enigmas & Desbloqueio de Relíquias
                                    </h5>
                                    <p className="text-slate-500 text-xs mt-0.5">
                                        Os alunos resolvem os enigmas propostos. Se precisarem de auxílio, o professor pode revelar a <b>Dica do Drácker</b>. Ao acertar, a turma desbloqueia uma <b>Relíquia Mágica do Conhecimento</b> e avança de capítulo.
                                    </p>
                                </div>
                            </div>

                            {/* Passo 5 */}
                            <div className="flex items-start gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                                <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs font-black shrink-0 mt-0.5">
                                    5
                                </span>
                                <div>
                                    <h5 className="font-bold text-slate-900 text-xs sm:text-sm">
                                        Grande Revelação Final & Celebração
                                    </h5>
                                    <p className="text-slate-500 text-xs mt-0.5">
                                        No capítulo final, ocorre o desfecho triunfante da história! A plataforma exibe o pódio da turma, o balão pedagógico de síntese do Drácker e o <b>Inventário de Relíquias Conquistadas</b> ao longo da aula.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Rodapé do Modal */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                    <span className="text-xs font-medium text-slate-400 hidden sm:inline">
                        Plataforma Drácker • Gamificação Curricular
                    </span>
                    <Button
                        type="button"
                        onClick={onClose}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm px-6 py-2 rounded-xl shadow-xs cursor-pointer ml-auto"
                    >
                        Entendido, vamos à aventura!
                    </Button>
                </div>

            </div>
        </div>
    );
};

export default RPGDocGuideModal;
