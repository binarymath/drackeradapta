import React from 'react';
import {
    Cpu,
    Wand2,
    Printer,
    Users,
    ShieldCheck,
    Play,
    Music,
    MessageSquare,
    Gamepad2,
    ArrowRight,
    Sparkles,
    FileText,
    BrainCircuit,
    Grid,
    Brain,
    Compass,
    Files,
    ArrowLeftRight,
    PieChart,
    BookOpen,
    Layers,
    Zap,
    Award,
    CheckCircle2
} from 'lucide-react';
import { Card } from './ui/Card';
import { useActivity } from '../contexts/ActivityContext';

export const AboutSystem = () => {
    const { handleActivityTypeChange, setActivityType, setActiveTabId } = useActivity();

    const navigateTo = (type) => {
        if (handleActivityTypeChange) {
            handleActivityTypeChange(type);
        } else {
            setActivityType(type);
            setActiveTabId(null);
        }
    };

    const categories = [
        {
            title: "1. Estúdios Visuais & Matemáticos",
            desc: "Ambientes gráficos interativos com manipulação visual e exportação milimétrica.",
            icon: <ArrowLeftRight className="w-5 h-5 text-emerald-600" />,
            modules: [
                {
                    id: 'number_line',
                    title: 'Reta Numérica',
                    desc: 'Crie e personalize retas com pinos, intervalos e frações com controle milimétrico de fonte.',
                    icon: <ArrowLeftRight className="w-6 h-6" />,
                    color: 'from-emerald-500 to-teal-600',
                    badge: 'Interativo'
                },
                {
                    id: 'fractions',
                    title: 'Frações e Operações',
                    desc: 'Gráficos de pizza e barra, equivalência visual e operações com controle de escalas independentes.',
                    icon: <PieChart className="w-6 h-6" />,
                    color: 'from-indigo-500 to-blue-600',
                    badge: 'Visual'
                },
                {
                    id: 'domino',
                    title: 'Dominó Pedagógico',
                    desc: 'Monte peças personalizadas com perguntas/respostas ou imagens do Drive perfeitamente ajustadas.',
                    icon: <Grid className="w-6 h-6" />,
                    color: 'from-amber-500 to-yellow-600',
                    badge: 'Impresso'
                },
                {
                    id: 'trading_cards',
                    title: 'Cards Colecionáveis',
                    desc: 'Crie cartas no estilo RPG/Super Trunfo com atributos, descrições e imagens pedagógicas.',
                    icon: <Layers className="w-6 h-6" />,
                    color: 'from-violet-500 to-purple-600',
                    badge: 'Gamificado'
                }
            ]
        },
        {
            title: "2. Avaliação & Gamificação com IA",
            desc: "Gere atividades de fixação instantaneamente adaptadas à faixa etária da sua turma.",
            icon: <Wand2 className="w-5 h-5 text-blue-600" />,
            modules: [
                {
                    id: 'quiz',
                    title: 'Quiz e Provas com IA',
                    desc: 'Gere questionários de múltipla escolha com gabarito e justificativas adaptadas ao nível educacional.',
                    icon: <FileText className="w-6 h-6" />,
                    color: 'from-blue-600 to-cyan-600',
                    badge: 'IA Inteligente'
                },
                {
                    id: 'wordsearch',
                    title: 'Caça-Palavras',
                    desc: 'Assistente completo que gera grade de letras e texto pedagógico contextualizado para impressão.',
                    icon: <Grid className="w-6 h-6" />,
                    color: 'from-emerald-600 to-green-600',
                    badge: 'IA & Grade'
                },
                {
                    id: 'crossword',
                    title: 'Palavras Cruzadas',
                    desc: 'Estúdio interativo com cálculo de interseções, dicas inteligentes e layout profissional.',
                    icon: <PuzzleIcon className="w-6 h-6" />,
                    color: 'from-indigo-600 to-violet-600',
                    badge: 'Dinâmico'
                },
                {
                    id: 'memory',
                    title: 'Jogo da Memória',
                    desc: 'Crie pares de conceito/definição ou imagens. Jogue online na tela ou exporte para cartas.',
                    icon: <Brain className="w-6 h-6" />,
                    color: 'from-teal-500 to-cyan-600',
                    badge: 'Duplo Uso'
                },
                {
                    id: 'connect_dots',
                    title: 'Ligar Pontos',
                    desc: 'Atividade de associação lógica entre colunas interativas, ideal para fixação de conceitos.',
                    icon: <Zap className="w-6 h-6" />,
                    color: 'from-blue-500 to-indigo-600',
                    badge: 'Interativo'
                },
                {
                    id: 'hangman',
                    title: 'Jogo da Forca',
                    desc: 'Rodadas interativas na tela com palavras selecionadas por inteligência artificial para a sala.',
                    icon: <Gamepad2 className="w-6 h-6" />,
                    color: 'from-orange-500 to-amber-600',
                    badge: 'Para Sala'
                }
            ]
        },
        {
            title: "3. Metodologia, Narração & IA Interativa",
            desc: "Ferramentas para debate de alto nível, investigação e metodologias ativas.",
            icon: <Cpu className="w-5 h-5 text-orange-600" />,
            modules: [
                {
                    id: 'chat_dracker',
                    title: 'Conversar com o Drácker',
                    desc: 'Seu mentor pedagógico particular para planos de aula, dúvidas curriculares e sugestões criativas.',
                    icon: <MessageSquare className="w-6 h-6" />,
                    color: 'from-amber-600 to-orange-600',
                    badge: 'Chat IA'
                },
                {
                    id: 'rpg',
                    title: 'Mestre RPG Detetive',
                    desc: 'Conduza aventuras narrativas onde os alunos resolvem mistérios usando conhecimentos escolares.',
                    icon: <Compass className="w-6 h-6" />,
                    color: 'from-rose-500 to-red-600',
                    badge: 'Aventura'
                },
                {
                    id: 'summary',
                    title: 'Metodologia Ativa',
                    desc: 'Sínteses pedagógicas, debates orientados por problemas reais e dinâmicas colaborativas.',
                    icon: <BookOpen className="w-6 h-6" />,
                    color: 'from-orange-500 to-amber-600',
                    badge: 'Didática'
                }
            ]
        },
        {
            title: "4. Multimídia & Produtividade",
            desc: "Recursos de áudio, vídeo e compilação final para montar apostilas completas.",
            icon: <Music className="w-5 h-5 text-purple-600" />,
            modules: [
                {
                    id: 'simplify',
                    title: 'Rádio Drácker',
                    desc: 'Crie canções pedagógicas, paródias e rimas sobre qualquer matéria para engajar a turma.',
                    icon: <Music className="w-6 h-6" />,
                    color: 'from-purple-600 to-pink-600',
                    badge: 'Áudio & Letra'
                },
                {
                    id: 'video_gallery',
                    title: 'Canal do Drácker',
                    desc: 'Acervo de vídeos pedagógicos selecionados e organizados para enriquecer suas aulas visualmente.',
                    icon: <Play className="w-6 h-6" />,
                    color: 'from-red-500 to-rose-600',
                    badge: 'Vídeos'
                },
                {
                    id: 'merge_pdf',
                    title: 'Unir PDFs em Apostila',
                    desc: 'Junte todas as atividades geradas e seus próprios documentos em um único arquivo de impressão A4.',
                    icon: <Files className="w-6 h-6" />,
                    color: 'from-slate-600 to-zinc-700',
                    badge: 'Apostila'
                }
            ]
        }
    ];

    return (
        <div className="max-w-6xl mx-auto space-y-12 animate-fade-in p-4 sm:p-8">
            
            {/* Hero Section */}
            <div className="relative overflow-hidden rounded-3xl bg-white p-8 sm:p-12 shadow-sm border border-brown-200">
                <div className="absolute top-0 right-0 p-12 opacity-[0.04] pointer-events-none">
                    <Sparkles className="w-72 h-72 text-orange-900 animate-pulse" />
                </div>
                <div className="relative z-10 max-w-3xl">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-50 border border-orange-200 text-orange-700 font-black text-xs mb-6 uppercase tracking-widest shadow-2xs">
                        <Wand2 className="w-4 h-4 text-orange-600" /> Inteligência Artificial & Gamificação Educacional
                    </div>
                    <h1 className="text-4xl sm:text-5xl font-black text-brown-900 leading-tight mb-6 tracking-tight">
                        Página Inicial — <br/>
                        <span className="bg-gradient-to-r from-orange-600 to-amber-500 bg-clip-text text-transparent">
                            Drácker Adapta 2026
                        </span>
                    </h1>
                    <p className="text-lg text-brown-600 font-medium leading-relaxed max-w-2xl">
                        O ecossistema pedagógico de ponta desenhado para professores. Crie atividades impressas milimetricamente ajustadas, jogos interativos, avaliações adaptadas com IA e apostilas em segundos.
                    </p>
                </div>
            </div>

            {/* All Modules Categorized */}
            <div className="space-y-10">
                {categories.map((cat, idx) => (
                    <div key={idx} className="space-y-4">
                        <div className="flex items-center gap-2.5 pb-2 border-b border-brown-200/80">
                            {cat.icon}
                            <h2 className="text-xl sm:text-2xl font-black text-brown-900">
                                {cat.title}
                            </h2>
                        </div>
                        <p className="text-sm text-brown-600 font-medium pb-2">
                            {cat.desc}
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-5">
                            {cat.modules.map((mod) => (
                                <div 
                                    key={mod.id} 
                                    onClick={() => navigateTo(mod.id)}
                                    className="group relative cursor-pointer"
                                >
                                    <Card className="h-full border border-brown-200/80 shadow-xs hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden bg-white p-6 flex flex-col justify-between">
                                        <div>
                                            <div className="flex items-start justify-between gap-4 mb-4">
                                                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${mod.color} flex items-center justify-center text-white shadow-md transform group-hover:scale-105 group-hover:rotate-2 transition-transform duration-300 shrink-0`}>
                                                    {mod.icon}
                                                </div>
                                                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-brown-50 text-brown-700 border border-brown-200 shrink-0">
                                                    {mod.badge}
                                                </span>
                                            </div>
                                            <h3 className="text-lg sm:text-xl font-black text-brown-900 mb-2 group-hover:text-orange-600 transition-colors">
                                                {mod.title}
                                            </h3>
                                            <p className="text-xs sm:text-sm text-brown-600 font-medium leading-relaxed">
                                                {mod.desc}
                                            </p>
                                        </div>
                                        <div className="mt-4 pt-3 border-t border-brown-100 flex items-center justify-end text-xs font-bold text-orange-600 group-hover:translate-x-1 transition-transform">
                                            <span>Abrir Estúdio &rarr;</span>
                                        </div>
                                    </Card>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Tutorial & Best Practices */}
            <div className="space-y-6 mt-16 bg-gradient-to-br from-brown-50 to-orange-50/60 p-8 sm:p-10 rounded-3xl shadow-inner border border-brown-200/80">
                <div className="flex items-center gap-3">
                    <Sparkles className="w-6 h-6 text-orange-600" />
                    <h2 className="text-2xl font-black text-brown-900">
                        Fluxo Rápido de Trabalho para Aulas
                    </h2>
                </div>
                <p className="text-sm text-brown-700 max-w-3xl">
                    Siga estas etapas recomendadas para aproveitar ao máximo o Drácker Adapta em sua rotina diária educacional.
                </p>

                <div className="grid md:grid-cols-3 gap-6 mt-6">
                    {[
                        { step: 1, title: "Conecte sua API Key", desc: "Abra 'Cérebro Pedagógico' no topo da lateral e insira a chave gratuita do Google Gemini para ativar todas as ferramentas inteligentes." },
                        { step: 2, title: "Selecione o Módulo", desc: "Clique em qualquer um dos 16 estúdios acima ou na barra lateral (Tipo) para começar o desenvolvimento pedagógico específico." },
                        { step: 3, title: "Ajuste o Tom e Faixa Etária", desc: "Na lateral, escolha entre Anos Iniciais, Finais ou Ensino Médio para que a IA comunique na linguagem perfeita para seus alunos." },
                        { step: 4, title: "Gere ou Monte Visualmente", desc: "Em estúdios com IA (Quiz, Caça-Palavras), clique no botão de ação da lateral. Em estúdios gráficos (Reta, Frações), crie e edite ao vivo na tela." },
                        { step: 5, title: "Ajuste Fino de Escala (px)", desc: "Use os controles deslizantes de fonte e imagem nos estúdios para garantir que tudo fique legível sem cortar ou encavalar." },
                        { step: 6, title: "Exporte em Apostila PDF", desc: "Trabalhe em múltiplas atividades no estúdio e depois use a ferramenta 'Unir PDFs em Apostila' para gerar o material final pronto para impressão A4." }
                    ].map((item) => (
                        <div key={item.step} className="bg-white p-6 rounded-2xl shadow-xs border border-brown-200/80 hover:border-orange-300 transition-all relative overflow-hidden group">
                            <div className="absolute -right-3 -top-3 text-7xl font-black text-brown-50 group-hover:text-orange-100/60 transition-colors z-0 select-none">
                                {item.step}
                            </div>
                            <div className="relative z-10">
                                <span className="inline-block px-2.5 py-0.5 rounded-md bg-orange-100 text-orange-800 text-xs font-black mb-2">
                                    Etapa {item.step}
                                </span>
                                <h4 className="font-black text-base text-brown-900 mb-1.5">{item.title}</h4>
                                <p className="text-brown-600 text-xs leading-relaxed">{item.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Safety & Philosophy */}
            <div className="grid md:grid-cols-2 gap-6 mt-8">
                <Card className="bg-brown-900 text-brown-50 border-none shadow-xl overflow-hidden relative p-8">
                    <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-4 translate-y-4 pointer-events-none">
                        <ShieldCheck className="w-56 h-56" />
                    </div>
                    <div className="relative z-10 flex flex-col justify-center h-full space-y-3">
                        <div className="flex items-center gap-3">
                            <ShieldCheck className="w-8 h-8 text-orange-400 shrink-0" />
                            <h4 className="text-xl sm:text-2xl font-black text-white">Segurança & Privacidade 100% Local</h4>
                        </div>
                        <p className="text-brown-200 text-sm sm:text-base leading-relaxed font-medium">
                            Suas turmas, planejamentos curriculares e sessões de trabalho são salvas exclusivamente no <strong>localStorage do seu próprio navegador</strong>. Não enviamos dados de alunos a servidores externos.
                        </p>
                    </div>
                </Card>

                <Card className="bg-gradient-to-br from-amber-100 via-orange-100 to-amber-200 border-none shadow-xl p-8">
                    <div className="flex flex-col justify-center h-full space-y-4">
                        <h4 className="text-xl sm:text-2xl font-black text-brown-900">Filosofia Educacional</h4>
                        <p className="text-base sm:text-lg text-brown-800 italic font-semibold leading-relaxed">
                            "A verdadeira inovação da tecnologia educacional não é substituir a didática do professor, mas multiplicar o tempo que ele tem para encantar cada aluno!"
                        </p>
                        <span className="text-orange-700 font-black tracking-widest text-xs sm:text-sm uppercase">— Drácker Adapta 2026</span>
                    </div>
                </Card>
            </div>

        </div>
    );
};

// Helper component for puzzle icon inside grid without conflict
function PuzzleIcon({ className }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H7.5a3.375 3.375 0 0 0-3.375 3.375v1.5a1.125 1.125 0 0 1-1.125 1.125h-1.5a3.375 3.375 0 0 0-3.375 3.375v2.625A1.125 1.125 0 0 1 2.25 12h-1.5a3.375 3.375 0 0 0-3.375 3.375v2.625A3.375 3.375 0 0 0 0.75 21.375h2.625a1.125 1.125 0 0 1 1.125 1.125v1.5a3.375 3.375 0 0 0 3.375 3.375h2.625a1.125 1.125 0 0 1 1.125-1.125v-1.5a3.375 3.375 0 0 0 3.375-3.375h2.625A3.375 3.375 0 0 0 21 18.375v-2.625a1.125 1.125 0 0 1-1.125-1.125h1.5a3.375 3.375 0 0 0 3.375-3.375V8.625" />
        </svg>
    );
}
