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
    BrainCircuit
} from 'lucide-react';
import { Card } from './ui/Card';
import { useActivity } from '../contexts/ActivityContext';

export const AboutSystem = () => {
    const { setActivityType, setActiveTabId } = useActivity();

    const navigateTo = (type) => {
        setActivityType(type);
        setActiveTabId(null);
    };

    const modules = [
        {
            id: 'chat_dracker',
            title: 'Conversar com Drácker',
            desc: 'Converse, tire dúvidas e peça dicas pedagógicas',
            icon: <MessageSquare className="w-8 h-8" />,
            color: 'from-amber-400 to-orange-400',
            bg: 'bg-amber-50'
        },
        {
            id: 'quiz',
            title: 'Quiz e Provas',
            desc: 'Crie questionários com IA instantaneamente',
            icon: <FileText className="w-8 h-8" />,
            color: 'from-blue-500 to-cyan-500',
            bg: 'bg-blue-50'
        },
        {
            id: 'summary',
            title: 'Metodologia Ativa',
            desc: 'Aprenda com o Drácker de forma dinâmica',
            icon: <MessageSquare className="w-8 h-8" />,
            color: 'from-amber-500 to-orange-500',
            bg: 'bg-amber-50'
        },
        {
            id: 'simplify',
            title: 'Rádio Drácker',
            desc: 'Músicas pedagógicas para a turma',
            icon: <Music className="w-8 h-8" />,
            color: 'from-purple-500 to-pink-500',
            bg: 'bg-purple-50'
        },
        {
            id: 'video_gallery',
            title: 'Canal do Drácker',
            desc: 'Vídeos educativos selecionados',
            icon: <Play className="w-8 h-8" />,
            color: 'from-red-500 to-rose-500',
            bg: 'bg-red-50'
        },
        {
            id: 'connect_dots',
            title: 'Jogos Interativos',
            desc: 'Liga pontos, forca e caça-palavras',
            icon: <Gamepad2 className="w-8 h-8" />,
            color: 'from-green-500 to-emerald-500',
            bg: 'bg-green-50'
        }
    ];

    return (
        <div className="max-w-6xl mx-auto space-y-12 animate-fade-in p-4 sm:p-8">
            
            {/* Hero Section */}
            <div className="relative overflow-hidden rounded-3xl bg-white p-8 sm:p-12 shadow-sm border border-brown-200">
                <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none">
                    <Sparkles className="w-64 h-64 text-orange-900 animate-pulse" />
                </div>
                <div className="relative z-10 max-w-3xl">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 border border-orange-200 text-orange-700 font-bold text-sm mb-6 uppercase tracking-widest">
                        <Wand2 className="w-4 h-4" /> Inteligência Artificial
                    </div>
                    <h1 className="text-4xl sm:text-5xl font-black text-brown-900 leading-tight mb-6">
                        Bem-vindo ao <br/>
                        <span className="bg-gradient-to-r from-orange-600 to-amber-500 bg-clip-text text-transparent">
                            Drácker Adapta 2026
                        </span>
                    </h1>
                    <p className="text-lg text-brown-600 font-medium leading-relaxed max-w-2xl">
                        O seu assistente pedagógico gamificado. Transforme qualquer assunto em uma jornada épica de aprendizado com inteligência artificial, RPG e atividades dinâmicas.
                    </p>
                </div>
            </div>

            {/* Modules Navigation Grid */}
            <div>
                <h2 className="text-2xl font-black text-brown-900 mb-6 flex items-center gap-3">
                    <Cpu className="w-6 h-6 text-orange-500" /> 
                    Explore o Sistema
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {modules.map((mod) => (
                        <div 
                            key={mod.id} 
                            onClick={() => navigateTo(mod.id)}
                            className="group relative cursor-pointer"
                        >
                            <Card className={`h-full border-none shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2 overflow-hidden bg-white`}>
                                <div className="p-6">
                                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${mod.color} flex items-center justify-center text-white shadow-lg mb-6 transform group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300`}>
                                        {mod.icon}
                                    </div>
                                    <h3 className="text-xl font-black text-brown-900 mb-2 group-hover:text-orange-600 transition-colors">
                                        {mod.title}
                                    </h3>
                                    <p className="text-brown-500 font-medium leading-relaxed">
                                        {mod.desc}
                                    </p>
                                </div>
                                <div className={`h-1.5 w-full bg-gradient-to-r ${mod.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
                            </Card>
                        </div>
                    ))}
                </div>
            </div>

            {/* Tutorial Section */}
            <div className="space-y-6 mt-16 bg-gradient-to-br from-brown-50 to-orange-50 p-8 sm:p-10 rounded-3xl shadow-inner border border-brown-100">
                <h2 className="text-2xl font-black text-brown-900 flex items-center gap-3">
                    <Sparkles className="w-6 h-6 text-orange-500" />
                    Como dominar a plataforma
                </h2>

                <div className="grid md:grid-cols-2 gap-8 mt-8">
                    {[
                        { step: 1, title: "Configure o Cérebro", desc: "No menu superior, insira sua chave da API do Google Gemini. Sem ela, o Drácker não consegue pensar." },
                        { step: 2, title: "Detalhe o Contexto", desc: "Na barra lateral, digite o tema. No campo 'Contexto', seja bem específico." },
                        { step: 3, title: "Ajuste a Linguagem", desc: "Alterne a dificuldade na barra lateral. O Drácker ajustará o tom de voz para a faixa etária." },
                        { step: 4, title: "Gere a Atividade", desc: "Escolha o jogo (Caça-Palavras, Dominó, etc) e clique em Gerar. Edite clicando no texto." },
                        { step: 5, title: "Organize o PDF", desc: "Gere quantas abas quiser. No final, use Unir PDFs para juntar todas as atividades em uma apostila." },
                        { step: 6, title: "Salve Tudo", desc: "Para não perder o progresso das turmas e guildas, use o botão de Backup para salvar os dados." }
                    ].map((item) => (
                        <div key={item.step} className="bg-white p-6 rounded-2xl shadow-sm border border-brown-100 hover:border-orange-300 transition-colors relative overflow-hidden group">
                            <div className="absolute -right-4 -top-4 text-9xl font-black text-brown-50 group-hover:text-orange-50 transition-colors z-0">
                                {item.step}
                            </div>
                            <div className="relative z-10">
                                <h4 className="font-bold text-lg text-brown-900 mb-2">{item.title}</h4>
                                <p className="text-brown-600 text-sm leading-relaxed">{item.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Safety & Design Note */}
            <div className="grid md:grid-cols-2 gap-6 mt-8">
                <Card className="bg-brown-900 text-brown-50 border-none shadow-xl overflow-hidden relative">
                    <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-4 translate-y-4">
                        <ShieldCheck className="w-48 h-48" />
                    </div>
                    <div className="relative z-10 flex flex-col h-full justify-center p-6 sm:p-8">
                        <div className="flex items-center gap-3 mb-4">
                            <ShieldCheck className="w-8 h-8 text-orange-400" />
                            <h4 className="text-xl font-black text-white">Segurança 100% Local</h4>
                        </div>
                        <p className="text-brown-200 mt-2 leading-relaxed font-medium">
                            Acreditamos na sua privacidade. Suas turmas, guildas e configurações ficam salvas <strong>apenas no navegador do seu dispositivo</strong>. Nós não rastreamos nada.
                        </p>
                    </div>
                </Card>

                <Card className="bg-gradient-to-br from-amber-100 via-orange-100 to-amber-200 border-none shadow-xl">
                    <div className="flex flex-col h-full justify-center p-6 sm:p-8">
                        <h4 className="text-xl font-black text-brown-900 mb-4">Nossa Filosofia</h4>
                        <p className="text-lg text-brown-800 italic font-medium leading-relaxed">
                            "A verdadeira magia da educação não está em repassar conteúdo, mas em adaptar o caminho para que cada explorador sinta que foi capaz de descobrir seu próprio tesouro!"
                        </p>
                        <span className="text-orange-600 font-black mt-4 uppercase tracking-widest text-sm">— Drácker</span>
                    </div>
                </Card>
            </div>

        </div>
    );
};
