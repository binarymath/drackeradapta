import React from 'react';
import {
    Cpu,
    Wand2,
    Printer,
    Users,
    ShieldCheck
} from 'lucide-react';
import { Card } from './ui/Card';
import { theme } from '../styles/theme';

export const AboutSystem = () => {
    return (
        <div className="max-w-5xl mx-auto space-y-10 animate-fade-in p-6">

            {/* Header Section */}
            <div className="text-center space-y-4 mb-12">
                <h1 className="text-5xl font-black text-brown-900 flex justify-center items-center gap-3">
                    <span className="bg-gradient-to-r from-brown-600 via-orange-600 to-amber-600 bg-clip-text text-transparent">
                        Drácker Adapta 2026
                    </span>
                </h1>
                <p className="text-xl text-brown-600 max-w-3xl mx-auto font-medium leading-relaxed">
                    O seu assistente pedagógico gamificado. Transforme qualquer assunto em uma jornada épica de aprendizado com inteligência artificial, RPG e atividades dinâmicas.
                </p>
            </div>

            {/* Main Features Grid */}
            <div className="grid md:grid-cols-3 gap-6">

                {/* Card 1: AI Generation */}
                <Card className="hover:-translate-y-1 hover:shadow-xl transition-all duration-300 border-orange-200 bg-gradient-to-br from-white to-orange-50">
                    <div className="flex flex-col items-center text-center space-y-4 p-4">
                        <div className="p-4 rounded-2xl bg-orange-100 text-orange-600 shadow-sm border border-orange-200">
                            <Wand2 className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-black text-brown-800">Criação Mágica</h3>
                        <p className="text-sm text-brown-600 font-medium">
                            Gere do zero atividades personalizadas: Caça-Palavras, Quizzes, Liga Pontos, Jogo da Forca, Músicas e Jogo da Memória usando a inteligência do Gemini AI, tudo em poucos segundos.
                        </p>
                    </div>
                </Card>

                {/* Card 2: RPG & Gamification */}
                <Card className="hover:-translate-y-1 hover:shadow-xl transition-all duration-300 border-blue-200 bg-gradient-to-br from-white to-blue-50">
                    <div className="flex flex-col items-center text-center space-y-4 p-4">
                        <div className="p-4 rounded-2xl bg-blue-100 text-blue-600 shadow-sm border border-blue-200">
                            <Users className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-black text-brown-800">Mestre de RPG</h3>
                        <p className="text-sm text-brown-600 font-medium">
                            Use o <strong>Drácker RPG</strong> e o <strong>Conselho de Guildas</strong> para transformar sua turma em heróis. Distribua classes (Paladinos, Magos, Bardos) e narre aventuras lúdicas baseadas no tema da sua aula.
                        </p>
                    </div>
                </Card>

                {/* Card 3: Export & Print */}
                <Card className="hover:-translate-y-1 hover:shadow-xl transition-all duration-300 border-green-200 bg-gradient-to-br from-white to-green-50">
                    <div className="flex flex-col items-center text-center space-y-4 p-4">
                        <div className="p-4 rounded-2xl bg-green-100 text-green-600 shadow-sm border border-green-200">
                            <Printer className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-black text-brown-800">Pronto para Sala</h3>
                        <p className="text-sm text-brown-600 font-medium">
                            Edite os textos das atividades inline, baixe apostilas vetoriais de altíssima qualidade em PDF e mescle vários arquivos em um só documento para facilitar a impressão.
                        </p>
                    </div>
                </Card>
            </div>

            {/* Tutorial Section */}
            <div className="space-y-6 mt-16 bg-white p-8 rounded-3xl shadow-sm border border-brown-100">
                <h2 className="text-3xl font-black text-brown-900 flex items-center gap-3">
                    <Cpu className="w-8 h-8 text-orange-500" />
                    Como dominar o sistema
                </h2>

                <div className="grid md:grid-cols-2 gap-4 mt-8">
                    {[
                        { step: 1, title: "Configure o Cérebro", desc: "No menu superior, insira sua chave da API do Google Gemini (é gratuita!). Sem ela, o Drácker não consegue pensar." },
                        { step: 2, title: "Detalhe o Contexto", desc: "Na barra lateral, digite o tema. No campo 'Contexto', seja específico (ex: 'Focar apenas no descobrimento do Brasil')." },
                        { step: 3, title: "Ajuste a Linguagem", desc: "Alterne a dificuldade na barra lateral. O Drácker ajustará o tom de voz se estiver falando com crianças ou adolescentes." },
                        { step: 4, title: "Gere a Atividade", desc: "Escolha o jogo (RPG, Caça-Palavras, etc) e clique em Gerar. Edite os textos clicando diretamente neles (ícone de lápis)." },
                        { step: 5, title: "Organize o PDF", desc: "Gere quantas abas quiser. No final, use a ferramenta de Unir PDFs para juntar todas as atividades em uma única apostila." },
                        { step: 6, title: "Salve Tudo", desc: "Para não perder o progresso das turmas e guildas, use o botão de Backup para salvar os dados no seu computador." }
                    ].map((item) => (
                        <div key={item.step} className="flex items-start gap-4 p-5 bg-brown-50 rounded-2xl border border-brown-200 hover:bg-brown-100 transition-colors">
                            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-brown-800 text-white flex items-center justify-center font-black text-lg">
                                {item.step}
                            </div>
                            <div>
                                <h4 className="font-bold text-lg text-brown-900">{item.title}</h4>
                                <p className="text-brown-700 text-sm mt-1 leading-relaxed">{item.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Safety & Design Note */}
            <div className="grid md:grid-cols-2 gap-6 mt-8">
                <Card className="bg-brown-900 text-brown-50 border-none shadow-xl">
                    <div className="flex items-start gap-4 p-4">
                        <ShieldCheck className="w-8 h-8 text-orange-400 flex-shrink-0 mt-1" />
                        <div>
                            <h4 className="text-xl font-bold text-white">Segurança 100% Local</h4>
                            <p className="text-sm text-brown-200 mt-2 leading-relaxed">
                                Acreditamos na sua privacidade. Suas turmas, guildas e configurações ficam salvas <strong>apenas no navegador do seu dispositivo</strong> (LocalStorage). Nós não rastreamos nada. Apenas o tema da aula é enviado à IA para que ela possa gerar as perguntas.
                            </p>
                        </div>
                    </div>
                </Card>

                <Card className="bg-gradient-to-br from-orange-100 to-amber-100 border-none shadow-xl">
                    <div className="flex items-start gap-4 p-4">
                        <div>
                            <h4 className="text-xl font-bold text-brown-900">Nossa Filosofia</h4>
                            <p className="text-sm text-brown-800 mt-2 italic font-medium leading-relaxed">
                                "A verdadeira magia da educação não está em repassar conteúdo, mas em adaptar o caminho para que cada explorador sinta que foi capaz de descobrir seu próprio tesouro!"
                                <br/><span className="text-brown-600 font-bold mt-2 block">— Drácker</span>
                            </p>
                        </div>
                    </div>
                </Card>
            </div>

        </div>
    );
};
