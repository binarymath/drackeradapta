import { useState, useEffect } from 'react';
import { determineArchetype } from '../utils/drackerArchetypes';

export const useDrackerState = () => {
    const [view, setView] = useState('lobby');

    // Centralized members storage - shared across expeditions
    const [allMembers, setAllMembers] = useState(() => {
        const saved = localStorage.getItem('dracker_all_members');
        let members = saved ? JSON.parse(saved) : [];

        // Migrate old expeditions if needed
        const savedExpeditions = localStorage.getItem('dracker_expeditions');
        if (savedExpeditions) {
            const exps = JSON.parse(savedExpeditions);
            // Check if any expedition has old format (members array instead of memberIds)
            exps.forEach(exp => {
                if (exp.members && exp.members.length > 0 && !exp.memberIds) {
                    // This is old format, add members to centralized storage
                    exp.members.forEach(member => {
                        if (!members.find(m => m.id === member.id)) {
                            members.push(member);
                        }
                    });
                }
            });
            if (members.length > 0) {
                localStorage.setItem('dracker_all_members', JSON.stringify(members));
            }
        }

        return members;
    });

    // Expeditions now only reference member IDs, not the full member data
    const [expeditions, setExpeditions] = useState(() => {
        const saved = localStorage.getItem('dracker_expeditions');
        if (!saved) {
            return [{ id: 1, name: 'Turma Principal', memberIds: [], type: 'principal' }];
        }

        const exps = JSON.parse(saved);

        // Migrate old format to new format
        return exps.map(exp => {
            let migrated = { ...exp };

            // Migrate members array to memberIds
            if (exp.members && exp.members.length > 0 && !exp.memberIds) {
                migrated = {
                    ...migrated,
                    memberIds: exp.members.map(m => m.id),
                    members: undefined // Remove old format
                };
            }

            // Ensure memberIds exists
            if (!migrated.memberIds) {
                migrated.memberIds = [];
            }

            // Migrate type (default to 'principal' for existing expeditions)
            if (!migrated.type) {
                migrated.type = 'principal';
            }

            return migrated;
        });
    });

    const [currentExpeditionId, setCurrentExpeditionId] = useState(null);
    const [selectedMember, setSelectedMember] = useState(null);

    // Form State
    const [formData, setFormData] = useState({ name: '', gender: 'M', answers: {}, step: 0, photo: null, customDesc: '' });

    // Migration: Save migrated data on first mount
    useEffect(() => {
        const savedExp = localStorage.getItem('dracker_expeditions');
        if (savedExp) {
            const exps = JSON.parse(savedExp);
            // Check if migration is needed
            const needsMigration = exps.some(exp => exp.members && exp.members.length > 0 && !exp.memberIds);
            if (needsMigration) {
                // Data was migrated, save it
                localStorage.setItem('dracker_expeditions', JSON.stringify(expeditions));
                localStorage.setItem('dracker_all_members', JSON.stringify(allMembers));
            }
        }
    }, []); // Only run once on mount

    // Persist both expeditions and members
    useEffect(() => {
        localStorage.setItem('dracker_expeditions', JSON.stringify(expeditions));
    }, [expeditions]);

    useEffect(() => {
        localStorage.setItem('dracker_all_members', JSON.stringify(allMembers));
    }, [allMembers]);

    const currentExpedition = expeditions.find(e => e.id === currentExpeditionId);

    // Get members for current expedition (by resolving member IDs)
    const currentMembers = currentExpedition?.memberIds?.map(memberId => allMembers.find(m => m.id === memberId)).filter(Boolean) || [];

    const actions = {
        // Navigation
        goHome: () => setView('lobby'),
        goTeam: (id) => { setCurrentExpeditionId(id); setView('team'); },
        setExpeditions: (data) => setExpeditions(data),

        // Expeditions
        createExpedition: (name, type = 'principal') => setExpeditions([...expeditions, { id: Date.now(), name, memberIds: [], type }]),
        renameExpedition: (id, newName) => {
            setExpeditions(prev => prev.map(e => e.id === id ? { ...e, name: newName } : e));
        },
        deleteExpedition: (id) => setExpeditions(expeditions.filter(e => e.id !== id)),

        // Granular Import Action
        importExpedition: (newExp, shouldMerge = false) => {
            // Handle legacy format (members in expedition) or new format (memberIds)
            const importedMembers = newExp.members || [];
            const importedMemberIds = newExp.memberIds || [];

            setExpeditions(prev => {
                const existingIndex = prev.findIndex(e => e.name === newExp.name);
                let newMemberIds = [];

                if (existingIndex > -1 && shouldMerge) {
                    // MERGE STRATEGY
                    newMemberIds = [...prev[existingIndex].memberIds];
                } else {
                    newMemberIds = [];
                }

                // Add imported members
                importedMemberIds.forEach(memberId => {
                    if (!newMemberIds.includes(memberId)) {
                        newMemberIds.push(memberId);
                    }
                });

                if (existingIndex > -1 && shouldMerge) {
                    const updatedExpeditions = [...prev];
                    updatedExpeditions[existingIndex] = { ...prev[existingIndex], memberIds: newMemberIds };
                    return updatedExpeditions;
                } else {
                    let finalName = newExp.name;
                    if (existingIndex > -1) {
                        let counter = 1;
                        while (prev.some(e => e.name === `${newExp.name} (${counter})`)) counter++;
                        finalName = `${newExp.name} (${counter})`;
                    }

                    const newExpedition = {
                        ...newExp,
                        id: Date.now() + Math.floor(Math.random() * 1000),
                        name: finalName,
                        memberIds: newMemberIds
                    };
                    return [...prev, newExpedition];
                }
            });

            // Add imported members to central storage
            if (importedMembers.length > 0) {
                setAllMembers(prev => {
                    const existingIds = new Set(prev.map(m => m.id));
                    const newMembers = importedMembers.filter(m => !existingIds.has(m.id));
                    return [...prev, ...newMembers];
                });
            }
        },

        // Helper for bulk importing members (used by scoped backup)
        importMembers: (newMembers) => {
            if (!newMembers || !Array.isArray(newMembers)) return;
            setAllMembers(prev => {
                const existingIds = new Set(prev.map(m => m.id));
                const uniqueNew = newMembers.filter(m => !existingIds.has(m.id));
                return [...prev, ...uniqueNew];
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

            // Add to central members storage
            setAllMembers(prev => [...prev, newMember]);

            // Add member ID to current expedition
            setExpeditions(prev => prev.map(e => e.id === currentExpeditionId ? { ...e, memberIds: [...e.memberIds, newMember.id] } : e));
            setView('team');
        },

        updateMember: (updatedMember) => {
            // Update in central storage
            setAllMembers(prev => prev.map(m => m.id === updatedMember.id ? updatedMember : m));
            setSelectedMember(updatedMember);
        },

        removeMember: (id) => {
            // Remove member ID from current expedition only (not from central storage, as it might be used elsewhere)
            setExpeditions(prev => prev.map(e => e.id === currentExpeditionId ? { ...e, memberIds: e.memberIds.filter(mId => mId !== id) } : e));
            setSelectedMember(null);
        },

        navigateMember: (direction, currentMemberId) => {
            const members = currentMembers;
            const targetId = currentMemberId || (selectedMember?.id);

            const currentIndex = members.findIndex(m => String(m.id) === String(targetId));

            if (currentIndex === -1) {
                return;
            }

            let newIndex = currentIndex + direction;
            if (newIndex < 0) newIndex = members.length - 1;
            if (newIndex >= members.length) newIndex = 0;

            setSelectedMember(members[newIndex]);
        },

        // Add member to another expedition (link, not copy)
        addMemberToExpedition: (memberId, targetExpeditionId) => {
            setExpeditions(prev => prev.map(e => {
                if (e.id === Number(targetExpeditionId) && !e.memberIds.includes(memberId)) {
                    return { ...e, memberIds: [...e.memberIds, memberId] };
                }
                return e;
            }));
        },

        // Remove member from specific expedition (but keep in allMembers)
        removeMemberFromExpedition: (memberId, expeditionId) => {
            setExpeditions(prev => prev.map(e => {
                if (e.id === Number(expeditionId)) {
                    return { ...e, memberIds: e.memberIds.filter(id => id !== memberId) };
                }
                return e;
            }));
        },

        // Legacy copyMember for backward compatibility
        copyMember: (member, targetExpeditionId) => {
            // Use the new addMemberToExpedition method (linking instead of copying)
            actions.addMemberToExpedition(member.id, targetExpeditionId);
        }
    };

    return {
        view,
        expeditions: expeditions || [],
        currentExpedition,
        selectedMember,
        setSelectedMember,
        formData,
        actions,
        setFormData,
        setView,
        allMembers: allMembers || [],
        setAllMembers,
        currentMembers: currentMembers || [] // Resolved members for current expedition
    };
};
