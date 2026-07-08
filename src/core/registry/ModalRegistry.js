import { lazy } from 'react';

/**
 * ModalRegistry - Padrão Registry para Lazy Loading de Modais e Editores no Drácker
 * 
 * Mapeia cada modal/editor de estúdio para carregamento sob demanda, garantindo
 * que pacotes e formulários complexos só sejam baixados na abertura do modal.
 */
export const ModalRegistry = {
    quiz_editor: lazy(() => import('../../components/QuizEditorModal').then(m => ({ default: m.QuizEditorModal }))),
    voice_settings: lazy(() => import('../../components/VoiceSettingsModal').then(m => ({ default: m.VoiceSettingsModal }))),
    music_editor: lazy(() => import('../../components/MusicEditorModal').then(m => ({ default: m.MusicEditorModal }))),
    audio_recorder: lazy(() => import('../../components/AudioRecorderModal').then(m => ({ default: m.AudioRecorderModal }))),
    connect_dots_editor: lazy(() => import('../../components/ConnectDotsEditorModal').then(m => ({ default: m.ConnectDotsEditorModal }))),
    tab_selection: lazy(() => import('../../components/TabSelectionModal').then(m => ({ default: m.TabSelectionModal }))),
    import_dialog: lazy(() => import('../../components/ImportDialog').then(m => ({ default: m.ImportDialog }))),
    wordsearch_wizard: lazy(() => import('../../components/WordsearchWizard')),
    crossword_editor: lazy(() => import('../../components/CrosswordListEditor').then(m => ({ default: m.CrosswordListEditor }))),
    domino_editor: lazy(() => import('../../components/domino/DominoEditorModal').then(m => ({ default: m.DominoEditorModal })))
};

export default ModalRegistry;
