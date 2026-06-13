import React from 'react';
import { QuizEditorModal } from './QuizEditorModal';

import { VoiceSettingsModal } from './VoiceSettingsModal';
import { MusicEditorModal } from './MusicEditorModal';
import { AudioRecorderModal } from './AudioRecorderModal';
import { ConnectDotsEditorModal } from './ConnectDotsEditorModal';
import { TabSelectionModal } from './TabSelectionModal';
import { ImportDialog } from './ImportDialog';
import WordsearchWizard from './WordsearchWizard';
import { CrosswordListEditor } from './CrosswordListEditor';
import { DominoEditorModal } from './domino/DominoEditorModal';

export const AppModals = ({
    // Quiz
    showQuizEditor,
    setShowQuizEditor,
    handleQuizConfirm,
    quizEditorData,



    // Connect Dots
    showConnectDotsEditor,
    setShowConnectDotsEditor,
    handleConnectDotsConfirm,
    connectDotsEditorData,

    // Voice Settings
    showVoiceSettings,
    setShowVoiceSettings,
    speechSettings,
    setSpeechSettings,

    // Music
    showMusicEditor,
    setShowMusicEditor,
    handleMusicConfirm,
    musicEditorData,

    // Tab Selection
    tabSelectionModal,
    setTabSelectionModal,
    tabs,
    handleTabSelection,
    handleCreateNewFromModal,
    deleteTab,
    updateActivityData,

    // Import Dialog
    importDialog,
    handleMergeImport,
    handleReplaceImport,
    closeImportDialog,
    currentTabsCount,

    // Wordsearch Wizard
    apiKey,
    topic,
    lessonDetails,
    difficulty,
    directions,
    setDirections,
    handleWordsearchComplete,
    handleChildError,
    geminiService,
    wordsearchTrigger,
    wordsearchEditData,

    // Crossword
    showCrosswordEditor,
    setShowCrosswordEditor,
    crosswordEditorData,
    handleCrosswordConfirm,

    // Audio Recorder
    showAudioRecorder,
    setShowAudioRecorder,

    // Domino
    showDominoEditor,
    setShowDominoEditor,
    dominoEditorData,
    handleDominoConfirm
}) => {
    return (
        <>
            <QuizEditorModal
                isOpen={showQuizEditor}
                onClose={() => setShowQuizEditor(false)}
                onSave={handleQuizConfirm}
                initialData={quizEditorData}
            />



            <TabSelectionModal
                isOpen={tabSelectionModal.isOpen}
                tabs={tabs.filter(t => t.type === tabSelectionModal.type)}
                onSelect={handleTabSelection}
                onCreateNew={handleCreateNewFromModal}
                onDelete={deleteTab}
                onUpdate={updateActivityData}
                onClose={() => setTabSelectionModal(prev => ({ ...prev, isOpen: false }))}
            />

            <ImportDialog
                isOpen={importDialog.isOpen}
                importedTabs={importDialog.importedTabs}
                importedDate={importDialog.importedDate}
                importedVersion={importDialog.importedVersion}
                currentTabsCount={currentTabsCount}
                onMerge={handleMergeImport}
                onReplace={handleReplaceImport}
                onClose={closeImportDialog}
            />

            <VoiceSettingsModal
                isOpen={showVoiceSettings}
                onClose={() => setShowVoiceSettings(false)}
                currentSettings={speechSettings}
                onSave={setSpeechSettings}
            />

            <MusicEditorModal
                isOpen={showMusicEditor}
                onClose={() => setShowMusicEditor(false)}
                onSave={handleMusicConfirm}
                initialData={musicEditorData}
            />

            <WordsearchWizard
                apiKey={apiKey}
                topic={topic}
                lessonDetails={lessonDetails}
                difficulty={difficulty}
                directions={directions}
                setDirections={setDirections}
                onComplete={handleWordsearchComplete}
                onError={handleChildError}
                geminiService={geminiService}
                triggerStart={wordsearchTrigger}
                defaultTitle={topic}
                mode={wordsearchEditData ? 'edit' : 'create'}
                initialData={wordsearchEditData}
            />

            {showCrosswordEditor && crosswordEditorData && (
                <CrosswordListEditor
                    initialData={crosswordEditorData}
                    topic={topic}
                    lessonDetails={lessonDetails}
                    onConfirm={handleCrosswordConfirm}
                    onCancel={() => setShowCrosswordEditor(false)}
                />
            )}

            <DominoEditorModal
                isOpen={showDominoEditor}
                onClose={() => setShowDominoEditor(false)}
                onSave={handleDominoConfirm}
                initialData={dominoEditorData}
            />

            <ConnectDotsEditorModal
                isOpen={showConnectDotsEditor}
                onClose={() => setShowConnectDotsEditor(false)}
                initialData={connectDotsEditorData}
                onConfirm={handleConnectDotsConfirm}
            />

            <AudioRecorderModal
                isOpen={showAudioRecorder}
                onClose={() => setShowAudioRecorder(false)}
            />
        </>
    );
};
