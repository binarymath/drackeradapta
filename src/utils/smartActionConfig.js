import { 
    Sparkles, Wand2, Puzzle, Grid, Gamepad2, Film, BookOpen, 
    PlusCircle, Music, MessageSquare, HelpCircle, Layers, Zap 
} from 'lucide-react';

export const getSmartActionConfig = (activityType, isLoading) => {
    if (isLoading) {
        return {
            label: 'Processando Atividade...',
            sublabel: 'Aguarde enquanto preparamos os recursos e a IA...',
            icon: Sparkles,
            disabled: true,
            className: 'bg-amber-600 text-white shadow-lg cursor-wait opacity-90'
        };
    }

    switch (activityType) {
        case 'wordsearch':
            return {
                label: 'Abrir Assistente de Caça-Palavras',
                sublabel: 'Configurar grade, palavras e gerar com IA',
                icon: Wand2,
                className: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md hover:-translate-y-0.5 border border-emerald-500/50'
            };
        case 'crossword':
            return {
                label: 'Abrir Estúdio de Cruzadinhas',
                sublabel: 'Adicionar vocabulário, dicas e grade',
                icon: Puzzle,
                className: 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:-translate-y-0.5 border border-indigo-500/50'
            };
        case 'domino':
            return {
                label: 'Abrir Estúdio de Dominó',
                sublabel: 'Criar pares de perguntas/respostas ou imagens',
                icon: Grid,
                className: 'bg-amber-600 hover:bg-amber-700 text-white shadow-md hover:-translate-y-0.5 border border-amber-500/50'
            };
        case 'quiz':
            return {
                label: 'Gerar Quiz com IA',
                sublabel: 'Criar questões adaptadas ao tema e nível',
                icon: Sparkles,
                className: 'bg-brown-600 hover:bg-brown-700 text-white shadow-md hover:-translate-y-0.5 border border-brown-500/50'
            };
        case 'simplify':
            return {
                label: 'Gerar Canção com IA',
                sublabel: 'Criar paródias, rimas e cifras no tema da aula',
                icon: Music,
                className: 'bg-purple-600 hover:bg-purple-700 text-white shadow-md hover:-translate-y-0.5 border border-purple-500/50'
            };
        case 'memory':
            return {
                label: 'Configurar Jogo da Memória',
                sublabel: 'Modo IA, pares manuais ou imagens do Drive',
                icon: Layers,
                className: 'bg-teal-600 hover:bg-teal-700 text-white shadow-md hover:-translate-y-0.5 border border-teal-500/50'
            };
        case 'connect_dots':
            return {
                label: 'Gerar Atividade de Ligar Pontos',
                sublabel: 'Criar colunas de associação lógica via IA',
                icon: Zap,
                className: 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:-translate-y-0.5 border border-blue-500/50'
            };
        case 'rpg':
            return {
                label: 'Iniciar Aventura RPG Detetive',
                sublabel: 'Abrir painel narrativo e investigativo',
                icon: Gamepad2,
                className: 'bg-rose-600 hover:bg-rose-700 text-white shadow-md hover:-translate-y-0.5 border border-rose-500/50'
            };
        case 'hangman':
            return {
                label: 'Iniciar Jogo da Forca',
                sublabel: 'Criar rodada interativa sobre o tema',
                icon: Gamepad2,
                className: 'bg-orange-600 hover:bg-orange-700 text-white shadow-md hover:-translate-y-0.5 border border-orange-500/50'
            };
        case 'video_gallery':
            return {
                label: 'Abrir Galeria Drácker',
                sublabel: 'Explorar acervo de vídeos pedagógicos',
                icon: Film,
                className: 'bg-cyan-600 hover:bg-cyan-700 text-white shadow-md hover:-translate-y-0.5 border border-cyan-500/50'
            };
        case 'number_line':
            return {
                label: 'Nova Aba de Reta Numérica',
                sublabel: 'Abre uma nova área de trabalho neste estúdio',
                icon: PlusCircle,
                className: 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-md hover:-translate-y-0.5 border border-emerald-600/50'
            };
        case 'fractions':
            return {
                label: 'Nova Aba de Frações',
                sublabel: 'Abre uma nova área de trabalho neste estúdio',
                icon: PlusCircle,
                className: 'bg-indigo-700 hover:bg-indigo-800 text-white shadow-md hover:-translate-y-0.5 border border-indigo-600/50'
            };
        case 'trading_card':
            return {
                label: 'Nova Aba de Cards Colecionáveis',
                sublabel: 'Abre um novo painel de criação de cards',
                icon: PlusCircle,
                className: 'bg-violet-600 hover:bg-violet-700 text-white shadow-md hover:-translate-y-0.5 border border-violet-500/50'
            };
        case 'chat_dracker':
            return {
                label: 'Chat Drácker Ativo',
                sublabel: 'Interaja diretamente com a IA no painel central',
                icon: MessageSquare,
                disabled: true,
                className: 'bg-brown-300 text-white cursor-not-allowed opacity-60'
            };
        default:
            return {
                label: 'Gerar Atividade',
                sublabel: 'Processar conteúdo adaptado via IA',
                icon: Sparkles,
                className: 'bg-brown-600 hover:bg-brown-700 text-white shadow-md hover:-translate-y-0.5 border border-brown-500/50'
            };
    }
};
