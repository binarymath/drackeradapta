import React from 'react';
import { getTrails } from './Expedicao/ArchetypesConfig.jsx';
import { determineArchetype } from '../utils/drackerArchetypes';
import LobbyView from './Expedicao/LobbyView';
import TeamView from './Expedicao/TeamView';
import NameEntryView from './Expedicao/NameEntryView';
import QuizView from './Expedicao/QuizView';
import ResultView from './Expedicao/ResultView';
import MemberModal from './Expedicao/MemberModal';

// Main Controller Component
export default function ExpedicaoDracker({ drackerState }) {
    if (!drackerState) return <div className="p-8 text-center text-red-500">Erro: Estado da expedição não carregado.</div>;

    const {
        view,
        expeditions,
        allMembers,
        currentExpedition,
        selectedMember,
        setSelectedMember,
        formData,
        actions,
        setView,
    } = drackerState;

    // --- Actions Wrappers ---

    const handleImport = (data) => {
        if (Array.isArray(data)) {
            data.forEach(exp => actions.importExpedition(exp, false));
        } else {
            actions.importExpedition(data, false);
        }
    };

    const handleStartQuiz = (name, gender) => {
        actions.startQuiz(name, gender);
        // startQuiz sets view to 'quiz' in the hook
    };

    const handleQuizAnswer = (trailId, answer) => {
        actions.answerQuiz(trailId, answer);
    };

    const handleQuizNext = () => {
        const trails = getTrails(formData.gender);
        if (formData.step < trails.length - 1) {
            actions.nextStep();
        } else {
            // Finish logic
            // We pass existing customDesc if any (from formData) - though finishQuiz expects it
            actions.finishQuiz(formData.customDesc || '');
        }
    };

    const handleQuizPrev = () => {
        actions.prevStep();
    };

    const handleSaveResult = () => {
        actions.addMember();
    };

    // --- Render Logic ---

    // 1. Lobby (Main View)
    if (view === 'lobby') {
        return (
            <LobbyView
                expeditions={expeditions}
                allMembers={allMembers}
                onCreate={actions.createExpedition}
                onRename={actions.renameExpedition}
                onDelete={actions.deleteExpedition}
                onSelect={actions.goTeam}
                onImport={handleImport}
            />
        );
    }

    // 2. Team View (Expedition Grid)
    if (view === 'team') {
        const activeExpedition = currentExpedition || expeditions.find(e => e.id === drackerState.currentExpeditionId);
        const isDiversificada = activeExpedition?.type === 'diversificada';
        
        return (
            <>
                <TeamView
                    expedition={activeExpedition}
                    allMembers={drackerState.allMembers}
                    onBack={actions.goHome}
                    onNewMember={() => {
                        if (isDiversificada) {
                            alert('⚠️ Turmas Diversificadas não podem ter recrutas novos.\n\nAdicione membros das Turmas Principais usando o seletor no Modal Individual.');
                        } else {
                            setView('name_entry');
                        }
                    }}
                    onOpenMember={setSelectedMember}
                />

                {selectedMember && (
                    <MemberModal
                        member={selectedMember}
                        expeditions={expeditions}
                        currentExpeditionId={activeExpedition?.id}
                        onClose={() => setSelectedMember(null)}
                        onUpdate={(id, updates) => actions.updateMember({ ...selectedMember, ...updates })}
                        onRemove={(id) => actions.removeMember(id)}
                        onRemoveFromExpedition={(memberId, expeditionId) => actions.removeMemberFromExpedition(memberId, expeditionId)}
                        onCopy={actions.copyMember}
                        onPrev={(id) => actions.navigateMember(-1, id)}
                        onNext={(id) => actions.navigateMember(1, id)}
                    />
                )}
            </>
        );
    }

    // 3. Name Entry (Start of New Member Flow)
    if (view === 'name_entry') {
        return (
            <NameEntryView
                onStart={handleStartQuiz}
                onCancel={() => setView('team')}
            />
        );
    }

    // 4. Quiz (Assessment Flow)
    if (view === 'quiz') {
        const trails = getTrails(formData.gender);
        return (
            <QuizView
                currentStep={formData.step}
                trails={trails}
                answers={formData.answers}
                onAnswer={handleQuizAnswer}
                onNext={handleQuizNext}
                onPrev={handleQuizPrev}
                onCancel={() => setView('team')}
            />
        );
    }

    // 5. Result (Preview & Save)
    if (view === 'result') {
        // Calculate preview archetype based on current answers
        const calculatedArchetype = determineArchetype(formData.answers, formData.gender);

        return (
            <ResultView
                name={formData.name}
                archetype={calculatedArchetype}
                customDesc={formData.customDesc}
                setCustomDesc={(desc) => actions.finishQuiz(desc)} // Updates formData.customDesc via wrapper if needed, or we call setFormData directly? 
                // hook `finishQuiz` updates customDesc. Calling it again is fine or we use `setDesc` action if implies distinct?
                // `finishQuiz` sets view to result. Calling it again safely updates desc and keeps view.

                photo={formData.photo}
                onPhotoUpload={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => actions.setPhoto(reader.result);
                        reader.readAsDataURL(file);
                    }
                }}
                onSetPhoto={actions.setPhoto}
                onSave={handleSaveResult}
                onDiscard={() => setView('team')}
            />
        );
    }

    return null;
}
