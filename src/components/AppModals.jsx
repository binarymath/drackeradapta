import React, { Suspense, lazy } from 'react';

// Módulos de Modais/Editores Carregados sob Demanda via Code Splitting (React.lazy)
const QuizEditorModal = lazy(() => import('./QuizEditorModal').then(m => ({ default: m.QuizEditorModal })));
const VoiceSettingsModal = lazy(() => import('./VoiceSettingsModal').then(m => ({ default: m.VoiceSettingsModal })));
const MusicEditorModal = lazy(() => import('./MusicEditorModal').then(m => ({ default: m.MusicEditorModal })));
const AudioRecorderModal = lazy(() => import('./AudioRecorderModal').then(m => ({ default: m.AudioRecorderModal })));
const ConnectDotsEditorModal = lazy(() => import('./ConnectDotsEditorModal').then(m => ({ default: m.ConnectDotsEditorModal })));
const TabSelectionModal = lazy(() => import('./TabSelectionModal').then(m => ({ default: m.TabSelectionModal })));
const ImportDialog = lazy(() => import('./ImportDialog').then(m => ({ default: m.ImportDialog })));
const WordsearchWizard = lazy(() => import('./WordsearchWizard'));
const CrosswordListEditor = lazy(() => import('./CrosswordListEditor').then(m => ({ default: m.CrosswordListEditor })));
const DominoEditorModal = lazy(() => import('./domino/DominoEditorModal').then(m => ({ default: m.DominoEditorModal })));

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
        <Suspense fallback={null}>
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
        </Suspense>
    );
};
