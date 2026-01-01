import React from 'react';
import {
    Cpu,
    Wand2,
    Printer,
    Users,
    ShieldCheck,
    Heart
} from 'lucide-react';
import { Card } from './ui/Card';
import { theme } from '../styles/theme';

export const AboutSystem = () => {
    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-fade-in p-6">

            {/* Header Section */}
            <div className="text-center space-y-4 mb-12">
                <h1 className="text-4xl font-bold text-brown-900 flex justify-center items-center gap-3">
                    <span className="bg-gradient-to-r from-brown-600 to-orange-600 bg-clip-text text-transparent">
                        Dracker Adapta 2026
                    </span>
                </h1>
                <p className="text-xl text-brown-600 max-w-2xl mx-auto">
                    Seu assistente inteligente para adaptação de atividades escolares e gestão de expedições de aprendizado.
                </p>
            </div>

            {/* Main Features Grid */}
            <div className="grid md:grid-cols-3 gap-6">

                {/* Card 1: AI Generation */}
                <Card className="hover:shadow-lg transition-all duration-300 border-orange-100">
                    <div className="flex flex-col items-center text-center space-y-4 p-4">
                        <div className="p-4 rounded-full bg-orange-50 text-orange-600">
                            <Wand2 className="w-8 h-8" />
                        </div>
                        <h3 className="text-lg font-bold text-brown-800">Criação Instantânea</h3>
                        <p className="text-sm text-brown-600">
                            Gere caça-palavras, quizzes, cruzadinhas e músicas educativas em segundos usando a inteligência do Gemini AI.
                        </p>
                    </div>
                </Card>

                {/* Card 2: Expedition Management */}
                <Card className="hover:shadow-lg transition-all duration-300 border-green-100">
                    <div className="flex flex-col items-center text-center space-y-4 p-4">
                        <div className="p-4 rounded-full bg-green-50 text-green-600">
                            <Users className="w-8 h-8" />
                        </div>
                        <h3 className="text-lg font-bold text-brown-800">Expedição Drácker</h3>
                        <p className="text-sm text-brown-600">
                            Gerencie suas turmas, acompanhe o progresso dos alunos e crie fichas de perfil RPG gamificadas.
                        </p>
                    </div>
                </Card>

                {/* Card 3: Export & Print */}
                <Card className="hover:shadow-lg transition-all duration-300 border-blue-100">
                    <div className="flex flex-col items-center text-center space-y-4 p-4">
                        <div className="p-4 rounded-full bg-blue-50 text-blue-600">
                            <Printer className="w-8 h-8" />
                        </div>
                        <h3 className="text-lg font-bold text-brown-800">Exportação Perfeita</h3>
                        <p className="text-sm text-brown-600">
                            Imprima atividades e fichas diretamente pelo navegador com qualidade vetorial e layout ABNT.
                        </p>
                    </div>
                </Card>
            </div>

            {/* Tutorial Section */}
            <div className="space-y-6 mt-12">
                <h2 className="text-2xl font-bold text-brown-800 flex items-center gap-2">
                    <Cpu className="w-6 h-6 text-brown-600" />
                    Como Usar o Sistema
                </h2>

                <div className="grid gap-4">
                    {[
                        { step: 1, title: "Configure sua Chave API", desc: "Clique na engrenagem no topo do menu lateral e insira sua chave do Google Gemini (GRATUITO)." },
                        { step: 2, title: "Escolha uma Atividade", desc: "Selecione entre Quiz, Caça-Palavras, Música ou outros no menu lateral." },
                        { step: 3, title: "Defina o Tópico", desc: "Digite o assunto da aula (ex: 'Ciclo da Água') e clique em Gerar." },
                        { step: 4, title: "Personalize", desc: "Edite as perguntas ou palavras geradas conforme necessário." },
                        { step: 5, title: "Imprima ou Salve", desc: "Use o botão de imprimir da atividade ou salve o progresso da turma." },
                        { step: 6, title: "Backup e Segurança", desc: "Use o botão 'Backup' (ícone de disquete) para salvar um arquivo .json. Para recuperar os dados, clique no botão 'Restaurar'." }
                    ].map((item) => (
                        <div key={item.step} className="flex items-start gap-4 p-4 bg-white rounded-lg border border-brown-100 hover:bg-brown-50 transition-colors">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-brown-600 text-white flex items-center justify-center font-bold font-mono">
                                {item.step}
                            </div>
                            <div>
                                <h4 className="font-bold text-brown-900">{item.title}</h4>
                                <p className="text-brown-600 text-sm mt-1">{item.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Safety & Design Note */}
            <div className="grid md:grid-cols-2 gap-6 mt-8">
                <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200">
                    <div className="flex items-start gap-4 p-2">
                        <ShieldCheck className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                        <div>
                            <h4 className="font-bold text-gray-800">Privacidade Total</h4>
                            <p className="text-sm text-gray-600 mt-1">
                                Seus dados e as informações dos alunos ficam salvos apenas neste dispositivo (LocalStorage). Nada é enviado para servidores externos além do texto necessário para a IA gerar as atividades.
                            </p>
                        </div>
                    </div>
                </Card>

                <Card className="bg-gradient-to-br from-brown-50 to-brown-100 border-brown-200">
                    <div className="flex items-start gap-4 p-2">
                        <div>
                            <h4 className="font-bold text-brown-800">Feito com Carinho</h4>
                            <p className="text-sm text-gray-600 mt-1 italic">
                                "A verdadeira magia da educação é adaptar o caminho para que cada explorador possa descobrir seu próprio tesouro!" — Drácker
                            </p>
                        </div>
                    </div>
                </Card>
            </div>

        </div>
    );
};
