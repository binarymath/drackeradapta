import { lazy } from 'react';

/**
 * ActivityRegistry - Padrão Registry para Lazy Loading e Módulos de Domínio no Drácker
 * 
 * Mapeia cada tipo de atividade/estúdio para o seu respectivo componente com carregamento
 * sob demanda via React.lazy(). Garante que apenas o módulo necessário seja baixado,
 * reduzindo drasticamente o tamanho do bundle principal inicial.
 */
export const ActivityRegistry = {
    quiz_game: lazy(() => import('../../components/QuizGame').then(m => ({ default: m.QuizGame }))),
    quiz_print: lazy(() => import('../../components/QuizPrint').then(m => ({ default: m.QuizPrint }))),
    wordsearch: lazy(() => import('../../components/WordSearchGame').then(m => ({ default: m.WordSearchGame }))),
    music: lazy(() => import('../../components/MusicGame').then(m => ({ default: m.MusicGame }))),
    crossword: lazy(() => import('../../components/CrosswordActivity').then(m => ({ default: m.CrosswordActivity }))),
    connect_dots: lazy(() => import('../../components/ConnectDotsGame')),
    video_gallery: lazy(() => import('../../components/DrackerVideoGallery')),
    domino_game: lazy(() => import('../../components/domino/DominoGame')),
    domino_print: lazy(() => import('../../components/domino/DominoPrint')),
    merge_pdf: lazy(() => import('../../components/PDFMergerTool').then(m => ({ default: m.PDFMergerTool }))),
    memory: lazy(() => import('../../components/memory/MemoryGame')),
    hangman: lazy(() => import('../../components/HangmanGame')),
    rpg: lazy(() => import('../../components/rpg/DetectiveRPG')),
    chat_dracker: lazy(() => import('../../components/chat/ChatDracker')),
    trading_cards: lazy(() => import('../../components/trading-cards/TradingCardMaker').then(m => ({ default: m.TradingCardMaker }))),
    number_line: lazy(() => import('../../components/number-line/NumberLineMaker').then(m => ({ default: m.NumberLineMaker }))),
    fractions: lazy(() => import('../../components/fractions/FractionsMaker').then(m => ({ default: m.FractionsMaker })))
};

export default ActivityRegistry;
