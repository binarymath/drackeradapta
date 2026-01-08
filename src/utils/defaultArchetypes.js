
import { Star, Zap, Shield, Smile, Search, Users, Sun, Sparkles, BookOpen, Music, Ghost, Anchor, Map, Clock, AlertCircle, Backpack, Flame, Award, Layers, MessageCircle, Calculator, Eye, Brain } from 'lucide-react';

export const DEFAULT_ARCHETYPES = {
    'O Estrategista': { iconName: 'BookOpen', color: 'bg-indigo-100 text-indigo-800 border-indigo-300', desc: 'Mestre da lógica e conhecimento profundo.' },
    'O Líder': { iconName: 'Star', color: 'bg-yellow-100 text-yellow-800 border-yellow-300', desc: 'Liderança segura e organizada.' },
    'O Comunicador': { iconName: 'Music', color: 'bg-pink-100 text-pink-800 border-pink-300', desc: 'Alegria e aprendizado em grupo.' },
    'O Observador': { iconName: 'Anchor', color: 'bg-emerald-100 text-emerald-800 border-emerald-300', desc: 'Sabedoria silenciosa e paciente.' },
    'O Ativo': { iconName: 'Zap', color: 'bg-orange-100 text-orange-800 border-orange-300', desc: 'Energia e aprendizado em movimento.' },
    'O Diplomata': { iconName: 'Smile', color: 'bg-green-100 text-green-800 border-green-300', desc: 'Paz e amizade em ambientes acolhedores.' },
    'O Inovador': { iconName: 'Users', color: 'bg-teal-100 text-teal-800 border-teal-300', desc: 'Adaptação e criatividade colorida.' },
    'O Autônomo': { iconName: 'Map', color: 'bg-brown-100 text-brown-800 border-brown-300', desc: 'Construindo caminhos de autonomia.' },
    'O Motivado': { iconName: 'Sun', color: 'bg-amber-100 text-amber-800 border-amber-300', desc: 'Curiosidade que ilumina o caminho.' },
    'O Analista': { iconName: 'Ghost', color: 'bg-brown-200 text-brown-800 border-brown-300', desc: 'Estratégia visual discreta.' },
    'O Sonhador': { iconName: 'Sparkles', color: 'bg-purple-100 text-purple-800 border-purple-300', desc: 'Imaginação ágil e busca constante.' }
};

export const DEFAULT_TRAILS = [
    {
        id: 'presenca', type: 'select', title: 'Nível de Presença', iconName: 'Clock', color: 'bg-cyan-50 border-cyan-200 text-cyan-900',
        question: `Qual a frequência do(a) explorador(a) nas missões?`,
        options: [
            { label: 'Sempre Presente', desc: 'Presente sempre.', value: 'lvl5', feedback: 'Aproveite a presença constante.' },
            { label: 'Constante', desc: 'Faltas raras.', value: 'lvl4', feedback: 'Mantém bom ritmo.' },
            { label: 'Frequente', desc: 'Faltas ocasionais.', value: 'lvl3', feedback: 'Atenção às lacunas.' },
            { label: 'Intermitente', desc: 'Faltas regulares.', value: 'lvl2', feedback: 'Resumos constantes necessários.' },
            { label: 'Viajante', desc: 'Faltas constantes.', value: 'lvl1', feedback: 'Plano de recuperação urgente.' }
        ]
    },
    {
        id: 'leitura', type: 'select', title: 'Nível de Leitura', iconName: 'BookOpen', color: 'bg-indigo-50 border-indigo-200 text-indigo-900',
        question: 'Como está o nível de leitura?',
        options: [
            { label: 'Guardião das Letras', desc: 'Fluente e compreensiva.', value: 'lvl5', feedback: 'Estimule livros complexos.' },
            { label: 'Narrador Habilidoso', desc: 'Lê bem, poucas dúvidas.', value: 'lvl4', feedback: 'Incentive leitura em voz alta.' },
            { label: 'Explorador de Palavras', desc: 'Frases simples, sílaba.', value: 'lvl3', feedback: 'Textos curtos e rimas.' },
            { label: 'Decifrador de Símbolos', desc: 'Reconhece letras/sílabas.', value: 'lvl2', feedback: 'Consciência fonológica.' },
            { label: 'Ouvinte de Lendas', desc: 'Não lê autonomamente.', value: 'lvl1', feedback: 'Contação de histórias.' }
        ]
    },
    // ... Copying structure from original but simplifying labels where appropriate for "Student Profile" feel?
    // Maintaining generic labels for logic questions as requested "change animals to student profile" typically implies the ARCHETYPES change, but maybe questions too?
    // I will keep the questions relatively stable but ensure the defaults are clean.
    {
        id: 'matematica', type: 'select', title: 'Raciocínio Matemático', iconName: 'Calculator', color: 'bg-violet-50 border-violet-200 text-violet-900',
        question: 'Como resolve problemas lógicos?',
        options: [
            { label: 'Mestre da Lógica', desc: 'Abstração e cálculo mental.', value: 'lvl5', feedback: 'Desafios de lógica avançada.' },
            { label: 'Estrategista Numérico', desc: 'Resolve bem com rascunho.', value: 'lvl4', feedback: 'Explicação do raciocínio.' },
            { label: 'Alquimista dos Números', desc: 'Depende de material concreto.', value: 'lvl3', feedback: 'Transição concreto-abstrato.' },
            { label: 'Aprendiz de Contagem', desc: 'Conta nos dedos.', value: 'lvl2', feedback: 'Jogos de tabuleiro.' },
            { label: 'Iniciado nos Mistérios', desc: 'Dificuldade com quantidades.', value: 'lvl1', feedback: 'Pareamento e classificação.' }
        ]
    },
    // Adding the rest of the trails... (abbreviated for this tool call, will include full in real file)
    {
        id: 'foco', type: 'select', title: 'Foco e Atenção', iconName: 'Eye', color: 'bg-amber-50 border-amber-200 text-amber-900',
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
        id: 'saber', type: 'select', title: 'Estilo de Aprendizagem', iconName: 'Brain', color: 'bg-blue-50 border-blue-200 text-blue-900',
        question: 'Melhor via de aprendizado:',
        options: [
            { label: 'Auditivo', desc: 'Ouve bem.', value: 'audio', feedback: 'Debates e áudios.' },
            { label: 'Visual', desc: 'Vê bem.', value: 'visual', feedback: 'Mapas e imagens.' },
            { label: 'Cinestésico', desc: 'Faz bem.', value: 'kinesthetic', feedback: 'Experimentos.' },
            { label: 'Lúdico', desc: 'Joga bem.', value: 'play', feedback: 'Jogos.' },
            { label: 'Leitor/Escritor', desc: 'Lê bem.', value: 'read', feedback: 'Resumos e livros.' }
        ]
    },
    {
        id: 'social', type: 'select', title: 'Interação Social', iconName: 'MessageCircle', color: 'bg-purple-50 border-purple-200 text-purple-900',
        question: 'Interação com a turma:',
        options: [
            { label: 'Liderança', desc: 'Guia o grupo.', value: 'leader', feedback: 'Monitoria.' },
            { label: 'Mediador', desc: 'Media conflitos.', value: 'mediator', feedback: 'Grupos heterogêneos.' },
            { label: 'Parceiro', desc: 'Colabora bem.', value: 'partner', feedback: 'Trabalho em equipe.' },
            { label: 'Individualista', desc: 'Prefere sozinho.', value: 'lone', feedback: 'Respeito e incentivo.' },
            { label: 'Observador', desc: 'Observa de longe.', value: 'shy', feedback: 'Mediação suave.' }
        ]
    },
    {
        id: 'conduta', type: 'select', title: 'Conduta e Regras', iconName: 'AlertCircle', color: 'bg-red-50 border-red-200 text-red-900',
        question: 'Organização e regras:',
        options: [
            { label: 'Exemplar', desc: 'Segue tudo.', value: 'lvl5', feedback: 'Elogie a postura.' },
            { label: 'Confiável', desc: 'Segue bem.', value: 'lvl4', feedback: 'Confiável.' },
            { label: 'Questionador', desc: 'Questiona às vezes.', value: 'lvl3', feedback: 'Reforce combinados.' },
            { label: 'Resistente', desc: 'Resistência passiva.', value: 'lvl2', feedback: 'Escolhas dirigidas.' },
            { label: 'Desafiador', desc: 'Desafio aberto.', value: 'lvl1', feedback: 'Diálogo individual.' }
        ]
    },
    {
        id: 'territorio', type: 'select', title: 'Organização do Espaço', iconName: 'Layers', color: 'bg-brown-50 border-brown-200 text-brown-900',
        question: 'Gerenciamento do espaço (mesa):',
        options: [
            { label: 'Organizado', desc: 'Limpo e organizado.', value: 'lvl5', feedback: 'Referência.' },
            { label: 'Zeloso', desc: 'Acumula pouco.', value: 'lvl4', feedback: 'Bom gerenciamento.' },
            { label: 'Acumulador', desc: 'Bagunça produtiva.', value: 'lvl3', feedback: 'Pausas para arrumação.' },
            { label: 'Espalhado', desc: 'Atrapalha vizinhos.', value: 'lvl2', feedback: 'Seleção de material.' },
            { label: 'Caótico', desc: 'Caos total.', value: 'lvl1', feedback: 'Delimitadores físicos.' }
        ]
    },
    {
        id: 'mochila', type: 'select', title: 'Material (Mochila)', iconName: 'Backpack', color: 'bg-green-50 border-green-200 text-green-900',
        question: 'Materiais trazidos:',
        options: [
            { label: 'Completo', desc: 'Tudo pronto.', value: 'lvl5', feedback: 'Exemplar.' },
            { label: 'Quase Completo', desc: 'Quase tudo.', value: 'lvl4', feedback: 'Responsável.' },
            { label: 'Misturado', desc: 'Desorganizado.', value: 'lvl3', feedback: 'Rotina de checagem.' },
            { label: 'Faltoso', desc: 'Esquece essenciais.', value: 'lvl2', feedback: 'Bilhete para casa.' },
            { label: 'Sem Material', desc: 'Perde tudo.', value: 'lvl1', feedback: 'Apoio familiar.' }
        ]
    },
    {
        id: 'emocoes', type: 'select', title: 'Gestão Emocional', iconName: 'Smile', color: 'bg-pink-50 border-pink-200 text-pink-900',
        question: 'Reação ao erro:',
        options: [
            { label: 'Resiliente', desc: 'Resiliência total.', value: 'lvl5', feedback: 'Liderança emocional.' },
            { label: 'Estável', desc: 'Recupera rápido.', value: 'lvl4', feedback: 'Boa estabilidade.' },
            { label: 'Frustrado', desc: 'Reclama, frustra-se.', value: 'lvl3', feedback: 'Errar faz parte.' },
            { label: 'Triste', desc: 'Isola-se/Triste.', value: 'lvl2', feedback: 'Acolhimento.' },
            { label: 'Explosivo', desc: 'Explosão imediata.', value: 'lvl1', feedback: 'Retire da tensão.' }
        ]
    },
    {
        id: 'motivacao', type: 'select', title: 'Motivação', iconName: 'Flame', color: 'bg-orange-50 border-orange-200 text-orange-900',
        question: 'Engajamento:',
        options: [
            { label: 'Intrínseca', desc: 'Fogo constante.', value: 'lvl5', feedback: 'Autonomia.' },
            { label: 'Social', desc: 'Motiva-se pelo grupo.', value: 'lvl4', feedback: 'Projetos em grupo.' },
            { label: 'Extrínseca', desc: 'Elogio ou nota.', value: 'lvl3', feedback: 'Reforce o esforço.' },
            { label: 'Oscilante', desc: 'Oscila, desiste.', value: 'lvl2', feedback: 'Micro-metas.' },
            { label: 'Apática', desc: 'Apatia total.', value: 'lvl1', feedback: 'Conexão pessoal.' }
        ]
    },
    {
        id: 'conquistas', type: 'text', title: 'Conquistas', iconName: 'Award', color: 'bg-amber-50 border-amber-200 text-amber-900',
        question: 'Medalhas e vitórias:', placeholder: 'Ex: Medalha de ouro, Ajudante do dia...'
    },
    {
        id: 'destaques', type: 'text', title: 'Destaques', iconName: 'Star', color: 'bg-indigo-50 border-indigo-200 text-indigo-900',
        question: 'Disciplinas de destaque:', placeholder: 'Ex: Matemática, Artes, Liderança...'
    }
];
