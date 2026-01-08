import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import html2pdf from 'html2pdf.js';
import { useSystemState } from '../../contexts/SystemStateContext';
import * as Icons from 'lucide-react';

import { Badge, Button, TextArea, Card, Input } from './MemberUI';
import { generatePDFHTML } from './MemberPDFGenerator';
import { MemberSidebar } from './MemberSidebar';
import { MemberStatsTab } from './MemberStatsTab';
import { MemberLogbookTab } from './MemberLogbookTab';
import { MemberMobileFooter } from './MemberMobileFooter';

export const MemberModal = ({ member, expeditions = [], currentExpeditionId, onClose, onUpdate, onRemove, onRemoveFromExpedition, onCopy, onPrev, onNext }) => {
    const { drackerState, determineArchetype, getValue } = useSystemState();
    const { archetypes, trails: dynamicTrails } = drackerState; // Dynamic archetypes config
    const [modalTab, setModalTab] = useState('stats');
    const [editingTrailId, setEditingTrailId] = useState(null);
    const [editValue, setEditValue] = useState(null);
    const [newLogText, setNewLogText] = useState('');
    const [newLogResponsible, setNewLogResponsible] = useState('');
    const [newLogSubject, setNewLogSubject] = useState('');
    const fileRef = useRef(null);
    const modalRef = useRef(null);
    const touchStartX = useRef(0);
    const touchEndX = useRef(0);
    const [isGeneratingMessage, setIsGeneratingMessage] = useState(false);
    const [showUrlInput, setShowUrlInput] = useState(false);
    const [tempUrl, setTempUrl] = useState('');

    // Reset state on member change
    useEffect(() => {
        setModalTab('stats');
        setEditingTrailId(null);
        setEditValue(null);
        setShowUrlInput(false);
        setIsGeneratingMessage(false);
        // Scroll to top on mobile when member changes
        if (modalRef.current) {
            setTimeout(() => {
                modalRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
            }, 0);
        }
    }, [member?.id]);

    // Handle swipe gestures
    const handleTouchStart = (e) => {
        touchStartX.current = e.changedTouches[0].screenX;
    };

    const handleTouchEnd = (e) => {
        touchEndX.current = e.changedTouches[0].screenX;
        handleSwipe();
    };

    const handleSwipe = () => {
        const swipeThreshold = 50; // Minimum distance to trigger swipe
        const diff = touchStartX.current - touchEndX.current;

        if (Math.abs(diff) > swipeThreshold) {
            if (diff > 0) {
                // Swiped left - go to next
                onNext(member.id);
            } else {
                // Swiped right - go to previous
                onPrev(member.id);
            }
        }
    };

    if (!member) return null;

    const trails = dynamicTrails || []; // Use dynamic trails directly
    const selectTrails = trails.filter(t => t.type === 'select');
    const textTrails = trails.filter(t => t.type === 'text');

    // Archetype Config
    const archConfig = archetypes[member?.archetype?.title] || archetypes['O Sonhador'] || Object.values(archetypes)[0];
    const iconName = archConfig?.iconName || 'HelpCircle';
    const ArchIcon = Icons[iconName] || Icons.HelpCircle;

    const isDiversifiedType = (type) => typeof type === 'string' && type.toLowerCase().includes('divers');

    const diversifiedExpeditions = (expeditions || []).filter(
        e => e.id !== currentExpeditionId && isDiversifiedType(e.type)
    );

    const currentExpedition = (expeditions || []).find(e => e.id === currentExpeditionId);
    const isDiversifiedExpedition = isDiversifiedType(currentExpedition?.type);

    const memberExpeditions = (expeditions || []).filter(
        e => Array.isArray(e.memberIds) && e.memberIds.includes(member.id)
    );

    const autoArchetype = determineArchetype(member.answers, member.gender);

    const handleDownloadPDF = async () => {
        setIsGeneratingMessage(true);
        setTimeout(() => {
            const iframe = document.createElement('iframe');
            iframe.style.position = 'fixed';
            iframe.style.left = '-9999px';
            iframe.style.top = '0';
            iframe.style.width = '0';
            iframe.style.height = '0';
            iframe.style.border = 'none';
            document.body.appendChild(iframe);

            const doc = iframe.contentWindow.document;
            const content = generatePDFHTML(member, drackerState.trails);

            // Reconstruct full HTML document
            doc.open();
            doc.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Ficha de Explorador - ${member.name}</title>
                    <style>
                        @media print {
                            @page { margin: 0; }
                            body { margin: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                        }
                    </style>
                </head>
                <body>
                    ${content}
                    <script>
                        window.onload = function() {
                            // Helper to check if images are actually loaded
                            const images = document.querySelectorAll('img');
                            let loadedCount = 0;
                            
                            function checkImages() {
                                loadedCount++;
                                if (loadedCount >= images.length) {
                                    setTimeout(function() {
                                        window.print();
                                    }, 500);
                                }
                            }

                            if (images.length === 0) {
                                setTimeout(function() { window.print(); }, 500);
                            } else {
                                images.forEach(img => {
                                    if (img.complete) checkImages();
                                    else {
                                        img.onload = checkImages;
                                        img.onerror = checkImages;
                                    }
                                });
                            }
                        }
                    </script>
                </body>
                </html>
            `);
            doc.close();

            // Cleanup logic
            // Use a longer timeout or monitor focus regain, but simple timeout is robust enough for now
            setTimeout(() => {
                if (document.body.contains(iframe)) {
                    document.body.removeChild(iframe);
                }
                setIsGeneratingMessage(false);
            }, 3000);

        }, 100);
    };

    const handleEditSave = (trailId) => {
        const updatedAnswers = { ...member.answers };
        if (editValue) {
            updatedAnswers[trailId] = editValue;
            onUpdate(member.id, { answers: updatedAnswers });
        }
        setEditingTrailId(null);
        setEditValue(null);
    };

    const handleAddLog = () => {
        if (!newLogText.trim()) return;
        const newLog = {
            id: Date.now(),
            date: new Date().toLocaleDateString('pt-BR'),
            text: newLogText,
            responsible: newLogResponsible || 'Professor',
            subject: newLogSubject || 'Geral'
        };
        const updatedRegistry = [newLog, ...(member.registry || [])];
        onUpdate(member.id, { registry: updatedRegistry });
        setNewLogText('');
        setNewLogResponsible('');
        setNewLogSubject('');
    };

    // Hide external scrollbar when modal is open
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = '';
        };
    }, []);

    return (
        <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm animate-fade-in custom-scrollbar flex items-center justify-center" onClick={onClose}>
            {/* Side Navigation Arrows - Desktop Only */}
            <button
                onClick={(e) => { e.stopPropagation(); onPrev(member.id); }}
                className="hidden md:flex fixed left-4 top-1/2 -translate-y-1/2 p-2.5 bg-brown-600/90 hover:bg-brown-700 text-white transition-all rounded-full shadow-lg hover:shadow-xl hover:scale-110 z-[60] border-2 border-brown-700"
                title="Card Anterior"
            >
                <ChevronLeft className="w-7 h-7" />
            </button>

            <button
                onClick={(e) => { e.stopPropagation(); onNext(member.id); }}
                className="hidden md:flex fixed right-4 top-1/2 -translate-y-1/2 p-2.5 bg-brown-600/90 hover:bg-brown-700 text-white transition-all rounded-full shadow-lg hover:shadow-xl hover:scale-110 z-[60] border-2 border-brown-700"
                title="Próximo Card"
            >
                <ChevronRight className="w-7 h-7" />
            </button>

            <div className="flex items-center justify-center p-4 relative w-full h-full">
                <div
                    ref={modalRef}
                    className="bg-white rounded-3xl w-full max-w-5xl shadow-2xl flex flex-col md:flex-row h-auto max-h-[90vh] overflow-y-auto animate-scale-in relative z-50 my-auto custom-scrollbar touch-pan-y"
                    onClick={e => e.stopPropagation()}
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                >
                    <MemberSidebar
                        member={member}
                        onClose={onClose}
                        onUpdate={onUpdate}
                        onCopy={onCopy}
                        diversifiedExpeditions={diversifiedExpeditions}
                        isDiversifiedExpedition={isDiversifiedExpedition}
                        handleDownloadPDF={handleDownloadPDF}
                        isGeneratingMessage={isGeneratingMessage}
                        editingTrailId={editingTrailId}
                        setEditingTrailId={setEditingTrailId}
                        editValue={editValue}
                        setEditValue={setEditValue}
                        determineArchetype={determineArchetype}
                        memberExpeditions={memberExpeditions}
                    />

                    {/* Right Column: Content */}
                    <div className="flex-1 bg-white flex flex-col relative">
                        {/* Tabs */}
                        <div className="flex border-b border-brown-100 shrink-0 sticky top-0 bg-white z-20 items-center gap-1 md:gap-0 overflow-x-auto md:overflow-x-visible shadow-sm">
                            {/* Left Arrow - Hidden on Mobile */}
                            <button
                                onClick={(e) => { e.stopPropagation(); onPrev(member.id); }}
                                className="hidden md:flex p-2 text-brown-400 hover:text-brown-700 hover:bg-brown-50 transition-all rounded-lg mr-1 shrink-0"
                                title="Membro Anterior"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>

                            <button
                                onClick={() => setModalTab('stats')}
                                className={`flex-1 py-3 md:py-4 text-xs md:text-sm font-bold uppercase tracking-wider transition-colors border-b-2 whitespace-nowrap md:whitespace-normal ${modalTab === 'stats' ? 'border-brown-600 text-brown-800 bg-brown-50' : 'border-transparent text-gray-400 hover:text-brown-600'}`}
                            >
                                Atributos
                            </button>
                            <button
                                onClick={() => setModalTab('diary')}
                                className={`flex-1 py-3 md:py-4 text-xs md:text-sm font-bold uppercase tracking-wider transition-colors border-b-2 whitespace-nowrap md:whitespace-normal ${modalTab === 'diary' ? 'border-brown-600 text-brown-800 bg-brown-50' : 'border-transparent text-gray-400 hover:text-brown-600'}`}
                            >
                                Diário
                            </button>

                            {/* Right Arrow - Hidden on Mobile */}
                            <button
                                onClick={(e) => { e.stopPropagation(); onNext(member.id); }}
                                className="hidden md:flex p-2 text-brown-400 hover:text-brown-700 hover:bg-brown-50 transition-all rounded-lg ml-1 shrink-0"
                                title="Próximo Membro"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Tab Content */}
                        <div className="p-6 md:p-8 flex-1 custom-scrollbar">
                            {modalTab === 'stats' ? (
                                <MemberStatsTab
                                    member={member}
                                    trails={dynamicTrails}
                                    editingTrailId={editingTrailId}
                                    setEditingTrailId={setEditingTrailId}
                                    editValue={editValue}
                                    setEditValue={setEditValue}
                                    handleEditSave={handleEditSave}
                                />
                            ) : (
                                <MemberLogbookTab
                                    member={member}
                                    newLogText={newLogText}
                                    setNewLogText={setNewLogText}
                                    newLogResponsible={newLogResponsible}
                                    setNewLogResponsible={setNewLogResponsible}
                                    newLogSubject={newLogSubject}
                                    setNewLogSubject={setNewLogSubject}
                                    handleAddLog={handleAddLog}
                                    onUpdate={onUpdate}
                                />
                            )}
                        </div>

                        <MemberMobileFooter
                            member={member}
                            onPrev={onPrev}
                            onNext={onNext}
                            handleDownloadPDF={handleDownloadPDF}
                            isGeneratingMessage={isGeneratingMessage}
                            diversifiedExpeditions={diversifiedExpeditions}
                            onCopy={onCopy}
                            onRemove={onRemove}
                            onRemoveFromExpedition={onRemoveFromExpedition}
                            onClose={onClose}
                            expeditions={expeditions}
                            currentExpeditionId={currentExpeditionId}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MemberModal;
