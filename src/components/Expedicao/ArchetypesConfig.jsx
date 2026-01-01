import React from 'react';
import { Star, Zap, Shield, Smile, Search, Users, Sun, Sparkles, BookOpen, Music, Ghost, Anchor, Map, Clock, AlertCircle, Backpack, Flame, Award, Camera, Layers, MessageCircle, Calculator, Eye, Brain } from 'lucide-react';

export const ARCHETYPES_CONFIG = {
    'Águia Real': { icon: Star, color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
    'Lince Veloz': { icon: Zap, color: 'bg-orange-100 text-orange-800 border-orange-300' },
    'Coruja Sábia': { icon: BookOpen, color: 'bg-indigo-100 text-indigo-800 border-indigo-300' },
    'Arara Festiva': { icon: Music, color: 'bg-pink-100 text-pink-800 border-pink-300' },
    'Raposa Astuta': { icon: Ghost, color: 'bg-brown-200 text-brown-800 border-brown-300' },
    'Panda Gentil': { icon: Smile, color: 'bg-green-100 text-green-800 border-green-300' },
    'Camaleão Criativo': { icon: Users, color: 'bg-teal-100 text-teal-800 border-teal-300' },
    'Tartaruga Zen': { icon: Anchor, color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
    'Tatu Viajante': { icon: Map, color: 'bg-brown-100 text-brown-800 border-brown-300' },
    'Vagalume Brilhante': { icon: Sun, color: 'bg-amber-100 text-amber-800 border-amber-300' },
    'Colibri Sonhador': { icon: Sparkles, color: 'bg-purple-100 text-purple-800 border-purple-300' }
};

export const getTrails = (gender) => [
    {
        id: 'presenca', type: 'select', title: 'Nível de Presença', icon: <Clock className="w-4 h-4 text-cyan-700" />, color: 'bg-cyan-50 border-cyan-200 text-cyan-900',
        question: `Qual a frequência d${gender === 'F' ? 'a' : 'o'} explorador${gender === 'F' ? 'a' : ''} nas missões?`,
        options: [
            { label: `Explorador${gender === 'F' ? 'a' : ''} Assídu${gender === 'F' ? 'a' : 'o'}`, desc: 'Presente sempre.', value: 'lvl5', feedback: 'Aproveite a presença constante.' },
            { label: `Explorador${gender === 'F' ? 'a' : ''} Constante`, desc: 'Faltas raras.', value: 'lvl4', feedback: 'Mantém bom ritmo.' },
            { label: `Explorador${gender === 'F' ? 'a' : ''} Frequente`, desc: 'Faltas ocasionais.', value: 'lvl3', feedback: 'Atenção às lacunas.' },
            { label: `Explorador${gender === 'F' ? 'a' : ''} Intermitente`, desc: 'Faltas regulares.', value: 'lvl2', feedback: 'Resumos constantes necessários.' },
            { label: `Explorador${gender === 'F' ? 'a' : ''} Viajante`, desc: 'Faltas constantes.', value: 'lvl1', feedback: 'Plano de recuperação urgente.' }
        ]
    },
    {
        id: 'leitura', type: 'select', title: 'Nível de Leitura', icon: <BookOpen className="w-4 h-4 text-indigo-700" />, color: 'bg-indigo-50 border-indigo-200 text-indigo-900',
        question: 'Como está o nível de leitura?',
        options: [
            { label: `Guardi${gender === 'F' ? 'ã' : 'ão'} das Letras`, desc: 'Fluente e compreensiva.', value: 'lvl5', feedback: 'Estimule livros complexos.' },
            { label: `Narrador${gender === 'F' ? 'a' : ''} Habilidos${gender === 'F' ? 'a' : 'o'} `, desc: 'Lê bem, poucas dúvidas.', value: 'lvl4', feedback: 'Incentive leitura em voz alta.' },
            { label: 'Explorador de Palavras', desc: 'Frases simples, silaba.', value: 'lvl3', feedback: 'Textos curtos e rimas.' },
            { label: 'Decifrador de Símbolos', desc: 'Reconhece letras/sílabas.', value: 'lvl2', feedback: 'Consciência fonológica.' },
            { label: 'Ouvinte de Lendas', desc: 'Não lê autonomamente.', value: 'lvl1', feedback: 'Contação de histórias.' }
        ]
    },
    {
        id: 'matematica', type: 'select', title: 'Raciocínio Matemático', icon: <Calculator className="w-4 h-4 text-violet-700" />, color: 'bg-violet-50 border-violet-200 text-violet-900',
        question: 'Como resolve problemas lógicos?',
        options: [
            { label: 'Mestre da Lógica', desc: 'Abstração e cálculo mental.', value: 'lvl5', feedback: 'Desafios de lógica avançada.' },
            { label: 'Estrategista Numérico', desc: 'Resolve bem com rascunho.', value: 'lvl4', feedback: 'Explicação do raciocínio.' },
            { label: 'Alquimista dos Números', desc: 'Depende de material concreto.', value: 'lvl3', feedback: 'Transição concreto-abstrato.' },
            { label: 'Aprendiz de Contagem', desc: 'Conta nos dedos.', value: 'lvl2', feedback: 'Jogos de tabuleiro.' },
            { label: 'Iniciado nos Mistérios', desc: 'Dificuldade com quantidades.', value: 'lvl1', feedback: 'Pareamento e classificação.' }
        ]
    },
    {
        id: 'foco', type: 'select', title: 'Foco do Dragão', icon: <Eye className="w-4 h-4 text-amber-700" />, color: 'bg-amber-50 border-amber-200 text-amber-900',
        question: 'Comportamento durante explicação:',
        options: [
            { label: 'Olhar de Águia', desc: 'Foco total.', value: 'lvl5', feedback: 'Pode ajudar o grupo.' },
            { label: 'Voo Panorâmico', desc: 'Boa atenção.', value: 'lvl4', feedback: 'Autonomia ótima.' },
            { label: 'Voo Rasante', desc: 'Oscila, mas volta.', value: 'lvl3', feedback: 'Use palavras-chave.' },
            { label: 'Pouso Constante', desc: 'Interrompe ou levanta.', value: 'lvl2', feedback: 'Sentar perto do professor.' },
            { label: 'Cabeça nas Nuvens', desc: 'Dispersão total.', value: 'lvl1', feedback: 'Contato visual direto.' }
        ]
    },
    {
        id: 'saber', type: 'select', title: 'Estilo de Aprendizagem', icon: <Brain className="w-4 h-4 text-blue-700" />, color: 'bg-blue-50 border-blue-200 text-blue-900',
        question: 'Melhor via de aprendizado:',
        options: [
            { label: 'Ouvidos Atentos', desc: 'Auditivo.', value: 'audio', feedback: 'Debates e áudios.' },
            { label: 'Olhos Curiosos', desc: 'Visual.', value: 'visual', feedback: 'Mapas e imagens.' },
            { label: 'Mãos na Massa', desc: 'Cinestésico.', value: 'kinesthetic', feedback: 'Experimentos.' },
            { label: 'Espírito Lúdico', desc: 'Gamificação.', value: 'play', feedback: 'Jogos.' },
            { label: 'Mente Leitora', desc: 'Leitura/Escrita.', value: 'read', feedback: 'Resumos e livros.' }
        ]
    },
    {
        id: 'social', type: 'select', title: 'Círculo da Amizade', icon: <MessageCircle className="w-4 h-4 text-purple-700" />, color: 'bg-purple-50 border-purple-200 text-purple-900',
        question: 'Interação com a turma:',
        options: [
            { label: 'Liderança Natural', desc: 'Guia o grupo.', value: 'leader', feedback: 'Monitoria.' },
            { label: 'Diplomata', desc: 'Media conflitos.', value: 'mediator', feedback: 'Grupos heterogêneos.' },
            { label: 'Parceiro Leal', desc: 'Colabora bem.', value: 'partner', feedback: 'Trabalho em equipe.' },
            { label: 'Lobo Solitário', desc: 'Prefere sozinho.', value: 'lone', feedback: 'Respeito e incentivo.' },
            { label: 'Explorador Tímido', desc: 'Observa de longe.', value: 'shy', feedback: 'Mediação suave.' }
        ]
    },
    {
        id: 'conduta', type: 'select', title: 'Guardião da Conduta', icon: <AlertCircle className="w-4 h-4 text-red-700" />, color: 'bg-red-50 border-red-200 text-red-900',
        question: 'Organização e regras:',
        options: [
            { label: gender === 'F' ? 'Dama da Harmonia' : 'Cavaleiro da Harmonia', desc: 'Exemplar.', value: 'lvl5', feedback: 'Elogie a postura.' },
            { label: 'Escudeiro Fiel', desc: 'Segue regras bem.', value: 'lvl4', feedback: 'Confiável.' },
            { label: 'Vento da Mudança', desc: 'Questiona às vezes.', value: 'lvl3', feedback: 'Reforce combinados.' },
            { label: 'Trovão Distante', desc: 'Resistência passiva.', value: 'lvl2', feedback: 'Escolhas dirigidas.' },
            { label: 'Tempestade Indomável', desc: 'Desafio aberto.', value: 'lvl1', feedback: 'Diálogo individual.' }
        ]
    },
    {
        id: 'territorio', type: 'select', title: 'Domínio do Território', icon: <Layers className="w-4 h-4 text-brown-700" />, color: 'bg-brown-50 border-brown-200 text-brown-900',
        question: 'Gerenciamento do espaço (mesa):',
        options: [
            { label: `Arquitur${gender === 'F' ? 'a' : 'o'} do Espaço`, desc: 'Limpo e organizado.', value: 'lvl5', feedback: 'Referência.' },
            { label: 'Zelador do Ninho', desc: 'Acumula pouco.', value: 'lvl4', feedback: 'Bom gerenciamento.' },
            { label: 'Acumulador de Tesouros', desc: 'Bagunça produtiva.', value: 'lvl3', feedback: 'Pausas para arrumação.' },
            { label: 'Trilha de Rastros', desc: 'Atrapalha vizinhos.', value: 'lvl2', feedback: 'Seleção de material.' },
            { label: 'Ciclone em Ação', desc: 'Caos total.', value: 'lvl1', feedback: 'Delimitadores físicos.' }
        ]
    },
    {
        id: 'mochila', type: 'select', title: 'Mochila', icon: <Backpack className="w-4 h-4 text-green-700" />, color: 'bg-green-50 border-green-200 text-green-900',
        question: 'Materiais trazidos:',
        options: [
            { label: 'Inventário Completo', desc: 'Tudo pronto.', value: 'lvl5', feedback: 'Exemplar.' },
            { label: 'Bolsa do Mercador', desc: 'Quase tudo.', value: 'lvl4', feedback: 'Responsável.' },
            { label: 'Itens Misturados', desc: 'Desorganizado.', value: 'lvl3', feedback: 'Rotina de checagem.' },
            { label: 'Mochila Furada', desc: 'Esquece essenciais.', value: 'lvl2', feedback: 'Bilhete para casa.' },
            { label: 'Caos Mágico', desc: 'Perde tudo.', value: 'lvl1', feedback: 'Apoio familiar.' }
        ]
    },
    {
        id: 'emocoes', type: 'select', title: 'Emoções', icon: <Smile className="w-4 h-4 text-pink-700" />, color: 'bg-pink-50 border-pink-200 text-pink-900',
        question: 'Reação ao erro:',
        options: [
            { label: 'Escudo de Diamante', desc: 'Resiliência total.', value: 'lvl5', feedback: 'Liderança emocional.' },
            { label: 'Escudo de Madeira', desc: 'Recupera rápido.', value: 'lvl4', feedback: 'Boa estabilidade.' },
            { label: 'Espada Trêmula', desc: 'Reclama, frustra-se.', value: 'lvl3', feedback: 'Errar faz parte.' },
            { label: 'Névoa Cinzenta', desc: 'Isola-se/Triste.', value: 'lvl2', feedback: 'Acolhimento.' },
            { label: 'Vulcão Ativo', desc: 'Explosão imediata.', value: 'lvl1', feedback: 'Retire da tensão.' }
        ]
    },
    {
        id: 'motivacao', type: 'select', title: 'Motivação', icon: <Flame className="w-4 h-4 text-orange-700" />, color: 'bg-orange-50 border-orange-200 text-orange-900',
        question: 'Engajamento:',
        options: [
            { label: 'Fogo Eterno', desc: 'Intrínseca constante.', value: 'lvl5', feedback: 'Autonomia.' },
            { label: 'Tocha Guiada', desc: 'Motiva-se pelo grupo.', value: 'lvl4', feedback: 'Projetos em grupo.' },
            { label: 'Precisa de Lenha', desc: 'Elogio ou nota.', value: 'lvl3', feedback: 'Reforce o esforço.' },
            { label: 'Vela ao Vento', desc: 'Oscila, desiste.', value: 'lvl2', feedback: 'Micro-metas.' },
            { label: 'Brasa Fria', desc: 'Apatia total.', value: 'lvl1', feedback: 'Conexão pessoal.' }
        ]
    },
    {
        id: 'conquistas', type: 'text', title: 'Conquistas', icon: <Award className="w-4 h-4 text-amber-700" />, color: 'bg-amber-50 border-amber-200 text-amber-900',
        question: 'Medalhas e vitórias:', placeholder: 'Ex: Medalha de ouro, Ajudante do dia...'
    },
    {
        id: 'destaques', type: 'text', title: 'Destaques', icon: <Star className="w-4 h-4 text-indigo-700" />, color: 'bg-indigo-50 border-indigo-200 text-indigo-900',
        question: 'Disciplinas de destaque:', placeholder: 'Ex: Matemática, Artes, Liderança...'
    }
];
