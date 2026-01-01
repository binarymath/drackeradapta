import { useState, useEffect } from 'react';
import { determineArchetype } from '../utils/drackerArchetypes';

export const useDrackerState = () => {
    const [view, setView] = useState('lobby');
    // Initialize with default or empty, App.jsx might override or merge later if needed, 
    // but for now we keep the default structure.
    // Ideally, we might want to load this from localStorage here if we were keeping it local,
    // but we are lifting it to be managed via App's backup system mostly.
    // However, for persistence between reloads relative to 'backup', 
    // we might want simple localStorage persistence similar to tabs.
    const [expeditions, setExpeditions] = useState(() => {
        const saved = localStorage.getItem('dracker_expeditions');
        return saved ? JSON.parse(saved) : [{ id: 1, name: 'Turma Principal', members: [] }];
    });

    const [currentExpeditionId, setCurrentExpeditionId] = useState(null);
    const [selectedMember, setSelectedMember] = useState(null);

    // Form State
    const [formData, setFormData] = useState({ name: '', gender: 'M', answers: {}, step: 0, photo: null, customDesc: '' });

    // Persist expeditions whenever they change
    useEffect(() => {
        localStorage.setItem('dracker_expeditions', JSON.stringify(expeditions));
    }, [expeditions]);

    const currentExpedition = expeditions.find(e => e.id === currentExpeditionId);

    const actions = {
        // Navigation
        goHome: () => setView('lobby'),
        goTeam: (id) => { setCurrentExpeditionId(id); setView('team'); },
        setExpeditions: (data) => setExpeditions(data), // Direct setter for imports

        // Expeditions
        createExpedition: (name) => setExpeditions([...expeditions, { id: Date.now(), name, members: [] }]),
        renameExpedition: (id, newName) => {
            setExpeditions(prev => prev.map(e => e.id === id ? { ...e, name: newName } : e));
        },
        deleteExpedition: (id) => setExpeditions(expeditions.filter(e => e.id !== id)),

        // Granular Import Action
        importExpedition: (newExp, shouldMerge = false) => {
            setExpeditions(prev => {
                const existingIndex = prev.findIndex(e => e.name === newExp.name);

                if (existingIndex > -1 && shouldMerge) {
                    // MERGE STRATEGY
                    const existingExp = prev[existingIndex];
                    const mergedMembers = [...existingExp.members];

                    newExp.members.forEach(newMem => {
                        const memIndex = mergedMembers.findIndex(m => m.name === newMem.name);
                        if (memIndex > -1) {
                            // Update existing member
                            mergedMembers[memIndex] = { ...mergedMembers[memIndex], ...newMem };
                        } else {
                            // Add new member
                            mergedMembers.push(newMem);
                        }
                    });

                    const updatedExpeditions = [...prev];
                    updatedExpeditions[existingIndex] = { ...existingExp, members: mergedMembers };
                    return updatedExpeditions;

                } else {
                    // CREATE NEW / COPY STRATEGY
                    let finalName = newExp.name;
                    // If not merging but name exists, append (Cópia) to avoid confusion, 
                    // or if it's a distinct Turma with same name? 
                    // System doesn't technically forbid duplicate names, but it confuses the Merge logic logic above.
                    // Let's enforce unique names for clarity if generating a new one?
                    // User said: "Utilize também o fator de ser a mesma turma" -> Implies name isn't unique ID.
                    // But if I create a new one with same name, future imports will be ambiguous.
                    // Best practice: Append suffix if name collision and !merge.
                    if (existingIndex > -1) {
                        let counter = 1;
                        while (prev.some(e => e.name === `${newExp.name} (${counter})`)) counter++;
                        finalName = `${newExp.name} (${counter})`;
                    }

                    const newExpedition = {
                        ...newExp,
                        id: Date.now() + Math.floor(Math.random() * 1000), // Ensure unique ID
                        name: finalName
                    };
                    return [...prev, newExpedition];
                }
            });
        },

        // Quiz Flow
        startQuiz: (name, gender) => { setFormData({ name, gender, answers: {}, step: 0, photo: null, customDesc: '' }); setView('quiz'); },
        answerQuiz: (trailId, answer) => setFormData(prev => ({ ...prev, answers: { ...prev.answers, [trailId]: answer } })),
        nextStep: () => setFormData(prev => ({ ...prev, step: prev.step + 1 })),
        prevStep: () => setFormData(prev => ({ ...prev, step: prev.step - 1 })),
        finishQuiz: (desc) => { setFormData(prev => ({ ...prev, customDesc: desc })); setView('result'); },
        setPhoto: (photo) => setFormData(prev => ({ ...prev, photo })),

        // Member CRUD
        addMember: () => {
            if (!currentExpeditionId) return;
            const arch = determineArchetype(formData.answers, formData.gender);
            const newMember = {
                id: Date.now(),
                name: formData.name,
                gender: formData.gender,
                answers: formData.answers,
                archetype: { ...arch, desc: formData.customDesc || arch.desc },
                date: new Date().toLocaleDateString('pt-BR'),
                photo: formData.photo,
                registry: []
            };
            setExpeditions(prev => prev.map(e => e.id === currentExpeditionId ? { ...e, members: [...e.members, newMember] } : e));
            setView('team');
        },
        updateMember: (updatedMember) => {
            setExpeditions(prev => prev.map(e => e.id === currentExpeditionId ? { ...e, members: e.members.map((m) => m.id === updatedMember.id ? updatedMember : m) } : e));
            setSelectedMember(updatedMember);
        },
        removeMember: (id) => {
            setExpeditions(prev => prev.map(e => e.id === currentExpeditionId ? { ...e, members: e.members.filter((m) => m.id !== id) } : e));
            setSelectedMember(null);
        }
    };

    return { view, expeditions, currentExpedition, selectedMember, setSelectedMember, formData, actions, setFormData, setView };
};
