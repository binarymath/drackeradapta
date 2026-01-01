import React, { useState, useRef, useEffect } from 'react';
import { Camera, SaveIcon, Trash2, Download, Upload as UploadIcon, X, Pencil, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input, TextArea } from '../ui/Input';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { getTrails, ARCHETYPES_CONFIG } from './ArchetypesConfig.jsx'; // Import central config
import html2pdf from 'html2pdf.js';

// Helper to generate PDF (simplified for extraction, or pass as util)
// Ideally this should be in a utils file, but for now I'll include the logic or expect it to be passed?
// The implementation plan didn't specify extracting `generatePDFHTML` to a separate file, 
// but it keeps `MemberModal` large if included.
// I will create a small local helper or better yet, move `generatePDFHTML` to a util file in a later step if needed. 
// For now, I'll copy the logic inside to be safe and self-contained, or move it to `utils/pdfGenerator.js`?
// Let's keep it inside or imported. Since I didn't verify `pdfGenerator.js` creation in the plan, I will include the function here locally to avoid breaking changes, 
// but cleaner would be to extract it. Given the constraints and the user's desire for "Clean Code", I should probably extract it.
// However, to reduce risk of missing dependencies, I'll strictly follow the extraction of the component.
// I'll keep the `generatePDFHTML` function logic within the component file but outside the export for now, or use the one I saw in the main file.

// Generate PDF HTML for member sheet
const generatePDFHTML = (member) => {
    const trails = getTrails(member.gender);
    const selectTrails = trails.filter(t => t.type === 'select');
    const textTrails = trails.filter(t => t.type === 'text');

    const rows = [];
    for (let i = 0; i < selectTrails.length; i += 3) {
        rows.push(selectTrails.slice(i, i + 3));
    }

    // Helper to safely get text value
    const getValue = (value) => {
        if (!value) return 'Não informado';
        if (typeof value === 'object') return value.label || value.text || 'Não informado';
        return value;
    };

    const styles = `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
        @page { size: A4; margin: 80mm 200mm 80mm 300mm; }
        
        * { box-sizing: border-box; }
        
        body { 
            margin: 0; 
            padding: 0; 
            font-family: 'Inter', sans-serif; 
            color: #2c1810; 
            background: white; 
            -webkit-print-color-adjust: exact; 
            print-color-adjust: exact;
            font-size: 11pt;
            line-height: 1.5;
        }
        
        .container {
            position: relative;
            min-height: 100%;
            display: flex;
            flex-direction: column;
            padding: 0;
        }
        
        /* Header com gradiente */
        .header { 
            background: linear-gradient(135deg, #78350f 0%, #92400e 100%);
            color: white;
            padding: 20px 25px;
            margin: 0 0 15px 0;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        
        .header-content {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .header-title h1 { 
            font-size: 28px; 
            font-weight: 800; 
            margin: 0 0 5px 0;
            letter-spacing: -0.5px;
        }
        
        .header-subtitle {
            font-size: 13px;
            opacity: 0.9;
            font-weight: 600;
        }
        
        .header-date {
            text-align: right;
            background: rgba(255,255,255,0.15);
            padding: 10px 15px;
            border-radius: 8px;
            backdrop-filter: blur(10px);
        }
        
        .header-date-label {
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 1px;
            opacity: 0.8;
            margin-bottom: 3px;
        }
        
        .header-date-value {
            font-size: 16px;
            font-weight: 700;
        }
        
        /* Profile Card */
        .profile-card { 
            display: flex; 
            gap: 20px; 
            background: linear-gradient(to bottom right, #fff7ed, #fef3c7);
            padding: 30px; 
            border-radius: 12px; 
            border: 2px solid #fbbf24;
            margin: 15px 0;
            box-shadow: 0 2px 8px rgba(120, 53, 15, 0.1);
            page-break-inside: avoid;
        }
        
        .avatar-container { 
            position: relative;
        }
        
        .avatar { 
            width: 100px; 
            height: 100px; 
            border-radius: 50%; 
            overflow: hidden; 
            border: 4px solid #78350f; 
            background: linear-gradient(135deg, #e5e7eb, #d1d5db);
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        
        .avatar img { 
            width: 100%; 
            height: 100%; 
            object-fit: cover; 
        }
        
        .avatar-placeholder {
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 40px;
            color: #78350f;
            font-weight: 800;
        }
        
        .profile-info {
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: center;
        }
        
        .explorer-name { 
            font-size: 32px; 
            font-weight: 800; 
            margin: 0 0 10px 0;
            color: #78350f;
            line-height: 1.2;
        }
        
        .archetype-badge {
            display: inline-block;
            background: #78350f;
            color: white;
            padding: 6px 16px;
            border-radius: 20px;
            font-weight: 700;
            font-size: 13px;
            letter-spacing: 0.5px;
            box-shadow: 0 2px 4px rgba(120, 53, 15, 0.3);
        }
        
        .archetype-desc {
            margin-top: 10px;
            font-style: italic;
            color: #78350f;
            font-size: 12px;
            opacity: 0.8;
        }
        
        /* Section Titles */
        .section-title { 
            font-size: 18px; 
            font-weight: 800; 
            text-transform: uppercase;
            color: #78350f;
            border-bottom: 3px solid #fbbf24;
            padding-bottom: 8px;
            margin: 12px 0 12px 0;
            letter-spacing: 0.5px;
            page-break-after: avoid;
            display: flex;
            align-items: center;
        }
        
        .section-title::before {
            content: '◆';
            margin-right: 10px;
            color: #fbbf24;
        }
        
        /* Attributes Grid */
        .attributes-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 15px;
            margin: 15px 0;
        }
        
        .attribute-card {
            background: white;
            border: 2px solid #e5e7eb;
            border-radius: 10px;
            padding: 12px;
            transition: all 0.3s ease;
            page-break-inside: avoid;
        }
        
        .attribute-card:hover {
            border-color: #fbbf24;
            box-shadow: 0 4px 8px rgba(251, 191, 36, 0.2);
        }
        
        .attribute-label {
            font-size: 9px;
            text-transform: uppercase;
            font-weight: 800;
            color: #9ca3af;
            margin-bottom: 6px;
            letter-spacing: 0.5px;
        }
        
        .attribute-value {
            font-size: 13px;
            font-weight: 700;
            color: #78350f;
            margin-bottom: 4px;
        }
        
        .attribute-feedback {
            font-size: 10px;
            color: #6b7280;
            line-height: 1.4;
        }
        
        /* Text Fields */
        .text-field {
            background: #fef3c7;
            border: 1px solid #fbbf24;
            border-left: 4px solid #78350f;
            border-radius: 8px;
            padding: 12px;
            margin-bottom: 10px;
            margin-left: 0;
            margin-right: 0;
            page-break-inside: avoid;
        }
        
        .text-field-label {
            font-size: 10px;
            text-transform: uppercase;
            font-weight: 800;
            color: #78350f;
            margin-bottom: 8px;
            letter-spacing: 0.5px;
        }
        
        .text-field-value {
            font-size: 12px;
            line-height: 1.6;
            color: #2c1810;
            word-wrap: break-word;
        }
        
        /* Diary Entries */
        .diary-section {
            page-break-before: always;
            margin-top: 15px;
            margin-left: 0;
            margin-right: 0;
        }
        
        .diary-entry {
            padding: 10px 0;
            border-bottom: 1px dashed #d1d5db;
            page-break-inside: avoid;
        }
        
        .diary-entry:last-child {
            border-bottom: none;
        }
        
        .diary-header {
            font-weight: 700;
            color: #78350f;
            margin-bottom: 6px;
            font-size: 11px;
        }
        
        .diary-meta {
            font-size: 10px;
            color: #6b7280;
        }
        
        .diary-text {
            font-size: 11px;
            line-height: 1.7;
            color: #2c1810;
        }
        
        /* Signature Section */
        .signatures {
            margin-top: 40px;
            margin-left: 0;
            margin-right: 0;
            margin-bottom: 30px;
            padding: 30px 0;
            border-top: 2px solid #e5e7eb;
            display: flex;
            justify-content: space-around;
            gap: 40px;
            page-break-inside: avoid;
        }
        
        .signature-box {
            flex: 1;
            text-align: center;
        }
        
        .signature-line {
            width: 100%;
            height: 60px;
            border-bottom: 2px solid #2c1810;
            margin-bottom: 15px;
        }
        
        .signature-label {
            font-size: 12px;
            text-transform: uppercase;
            font-weight: 700;
            color: #78350f;
            letter-spacing: 1px;
            margin-bottom: 6px;
        }
        
        .signature-sublabel {
            font-size: 10px;
            color: #6b7280;
            margin-top: 6px;
            font-weight: 500;
        }
        
        /* Page break controls */
        .page-break { page-break-before: always; }
        .no-break { page-break-inside: avoid; }
    `;

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>${styles}</style>
        </head>
        <body>
            <div class="container">
                <!-- Header -->
                <div class="header">
                    <div class="header-content">
                        <div class="header-title">
                            <h1>🗺️ Ficha de Explorador</h1>
                            <div class="header-subtitle">Expedição Drácker • Registro Oficial</div>
                        </div>
                        <div class="header-date">
                            <div class="header-date-label">Data de Emissão</div>
                            <div class="header-date-value">${member.date || new Date().toLocaleDateString('pt-BR')}</div>
                        </div>
                    </div>
                </div>

                <!-- Profile Card -->
                <div class="profile-card">
                    <div class="avatar-container">
                        <div class="avatar">
                            ${member.photo 
                                ? `<img src="${member.photo}" alt="${member.name}">` 
                                : `<div class="avatar-placeholder">${member.name ? member.name[0].toUpperCase() : '?'}</div>`
                            }
                        </div>
                    </div>
                    <div class="profile-info">
                        <h2 class="explorer-name">${member.name || 'Explorador'}</h2>
                        <div class="archetype-badge">${member.archetype?.title || 'Arquétipo Não Definido'}</div>
                        ${member.archetype?.desc ? `<div class="archetype-desc">"${member.archetype.desc}"</div>` : ''}
                    </div>
                </div>

                <!-- Attributes Section -->
                ${selectTrails.length > 0 ? `
                <div class="no-break">
                    <h3 class="section-title">Habilidades & Traços</h3>
                    <div class="attributes-grid">
                        ${selectTrails.map(trail => `
                            <div class="attribute-card">
                                <div class="attribute-label">${trail.title}</div>
                                <div class="attribute-value">${getValue(member.answers?.[trail.id])}</div>
                                ${member.answers?.[trail.id]?.feedback 
                                    ? `<div class="attribute-feedback">${member.answers[trail.id].feedback}</div>` 
                                    : ''
                                }
                            </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}

                <!-- Text Fields Section -->
                ${textTrails.length > 0 ? `
                <div class="no-break">
                    <h3 class="section-title">Informações Complementares</h3>
                    ${textTrails.map(trail => `
                        <div class="text-field">
                            <div class="text-field-label">${trail.title}</div>
                            <div class="text-field-value">${getValue(member.answers?.[trail.id])}</div>
                        </div>
                    `).join('')}
                </div>
                ` : ''}

                <!-- Diary Section -->
                ${member.registry && member.registry.length > 0 ? `
                <div class="diary-section">
                    <h3 class="section-title">Diário de Bordo</h3>
                    ${member.registry.map(log => `
                        <div class="diary-entry">
                            <div class="diary-header">
                                📅 ${log.date}
                                <span class="diary-meta">
                                    • ${log.responsible || 'Professor'}
                                    ${log.subject ? ` • ${log.subject}` : ''}
                                </span>
                            </div>
                            <div class="diary-text">${log.text}</div>
                        </div>
                    `).join('')}
                </div>
                ` : ''}

                <!-- Signatures -->
                <div class="signatures">
                    <div class="signature-box">
                        <div class="signature-line"></div>
                        <div class="signature-label">Guia / Educador</div>
                        <div class="signature-sublabel">Assinatura e Carimbo</div>
                    </div>
                    <div class="signature-box">
                        <div class="signature-line"></div>
                        <div class="signature-label">Responsável</div>
                        <div class="signature-sublabel">Assinatura e Data</div>
                    </div>
                </div>
            </div>
        </body>
        </html>
    `;
};



const MemberModal = ({ member, expeditions = [], currentExpeditionId, onClose, onUpdate, onRemove, onRemoveFromExpedition, onCopy, onPrev, onNext }) => {
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

    const trails = getTrails(member.gender);
    const selectTrails = trails.filter(t => t.type === 'select');
    const textTrails = trails.filter(t => t.type === 'text');

    // Archetype Config
    const archConfig = ARCHETYPES_CONFIG[member.archetype.title] || ARCHETYPES_CONFIG['Colibri Sonhador'];
    const ArchIcon = archConfig.icon;

    const handleCopy = (targetId) => {
        if (!targetId) return;
        if (window.confirm('Adicionar este explorador a outra turma?')) {
            onCopy(member, parseInt(targetId));
            alert('Explorador adicionado com sucesso à turma!');
        }
    };

    const handleDownloadPDF = async () => {
        setIsGeneratingMessage(true);
        // Simulate wait for images if needed, or just generate
        setTimeout(async () => {
            try {
                const element = document.createElement('div');
                element.innerHTML = generatePDFHTML(member);
                // Margens em mm: [top, left, bottom, right]
                // Ajuste estes valores para controlar o espaçamento
                const opt = {
                    margin: [5, 10, 10, 5], // top, left, bottom, right em mm
                    filename: `Ficha_Explorador_${member.name.replace(/\s+/g, '_')}.pdf`,
                    image: { type: 'jpeg', quality: 0.98 },
                    html2canvas: { scale: 2, useCORS: true, logging: false },
                    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
                };
                await html2pdf().set(opt).from(element).save();
            } catch (err) {
                console.error(err);
                alert('Erro ao gerar PDF.');
            } finally {
                setIsGeneratingMessage(false);
            }
        }, 1000);
    };

    const handleUrlConfirm = () => {
        if (tempUrl) {
            onUpdate(member.id, { photo: tempUrl });
            setTempUrl('');
            setShowUrlInput(false);
        }
    }

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

    const handlePhotoUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                onUpdate(member.id, { photo: reader.result });
            };
            reader.readAsDataURL(file);
        }
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

                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 bg-white/80 hover:bg-white text-brown-400 hover:text-red-500 rounded-full z-10 transition-colors shadow-sm"
                    >
                        <X size={24} />
                    </button>

                    {/* Left Column: Info & Photo */}
                    <div className="w-full md:w-1/3 p-4 md:p-6 bg-brown-900 text-white relative flex flex-col items-center text-center shrink-0 min-h-min">
                        <div className="absolute inset-0 opacity-10 bg-[url('/noise.png')] pointer-events-none"></div>

                        <div className="relative group mb-6 mt-6 md:mt-8">
                            <div className="w-32 md:w-56 aspect-[3/4] rounded-xl p-2 bg-white shadow-xl rotate-1 hover:rotate-0 transition-transform duration-300 relative z-10 border border-brown-100/50">
                                <div className="w-full h-full rounded-lg overflow-hidden bg-gray-100 relative">
                                    {member.photo ? (
                                        <img src={member.photo} alt={member.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-white/50">
                                            <ArchIcon size={64} className="text-current opacity-50" />
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                                        <label className="cursor-pointer text-white flex flex-col items-center hover:scale-110 transition-transform">
                                            <Camera size={20} />
                                            <span className="text-[10px] uppercase font-bold mt-1">Trocar</span>
                                            <input type="file" ref={fileRef} className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                                        </label>
                                        <button
                                            onClick={() => setShowUrlInput(true)}
                                            className="text-white flex flex-col items-center hover:scale-110 transition-transform"
                                        >
                                            <UploadIcon size={20} />
                                            <span className="text-[10px] uppercase font-bold mt-1">URL</span>
                                        </button>
                                    </div>
                                </div>
                                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 z-20 whitespace-nowrap">
                                    <Badge className="bg-white text-brown-800 shadow-sm border border-brown-100 px-3">
                                        {member.archetype.title}
                                    </Badge>
                                </div>
                            </div>
                        </div>

                        <h2 className="text-2xl font-extrabold text-white mb-2 leading-tight">{member.name}</h2>

                        {editingTrailId === 'phrase' ? (
                            <div className="w-full mb-6 animate-fade-in space-y-2">
                                <TextArea
                                    value={editValue || ''}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    className="text-center text-sm italic min-h-[60px] text-brown-900"
                                />
                                <div className="flex justify-center gap-2">
                                    <Button size="sm" variant="ghost" className="text-white hover:text-white/80 hover:bg-white/10" onClick={() => setEditingTrailId(null)}>Can</Button>
                                    <Button size="sm" className="bg-white text-brown-900 hover:bg-gray-100" onClick={() => {
                                        onUpdate(member.id, { archetype: { ...member.archetype, desc: editValue } });
                                        setEditingTrailId(null);
                                    }}>Salvar</Button>
                                </div>
                            </div>
                        ) : (
                            <div className="relative group mb-6 w-full px-4">
                                <p className="text-sm italic opacity-80">"{member.archetype.desc}"</p>
                                <button
                                    onClick={() => {
                                        setEditingTrailId('phrase');
                                        setEditValue(member.archetype.desc);
                                    }}
                                    className="absolute -right-2 top-0 p-1.5 text-white bg-white/20 hover:bg-white hover:text-brown-900 rounded-full opacity-60 hover:opacity-100 transition-all shadow-sm"
                                    title="Editar Frase"
                                >
                                    <Pencil size={12} />
                                </button>
                            </div>
                        )}

                        <div className="space-y-2 w-full mt-auto hidden md:flex flex-col gap-3 px-2">
                            <button onClick={handleDownloadPDF} disabled={isGeneratingMessage} className="w-full bg-white/90 hover:bg-white text-brown-800 font-bold py-2.5 rounded-lg shadow-sm border border-brown-200 flex items-center justify-center gap-2 transition-all disabled:opacity-50 text-sm">
                                {isGeneratingMessage ? <span className="animate-pulse">Gerando...</span> : <><Download size={16} /> Baixar PDF</>}
                            </button>

                            {(() => {
                                const currentExp = expeditions?.find(e => e.id === currentExpeditionId);
                                const isPrincipal = currentExp?.type === 'principal' || !currentExp?.type;
                                const availableExpeditions = isPrincipal 
                                    ? expeditions.filter(e => e.id !== currentExpeditionId && e.type === 'diversificada')
                                    : [];
                                
                                return isPrincipal && availableExpeditions.length > 0 && (
                                    <select
                                        className="w-full p-2 text-xs border border-brown-200 rounded-lg text-center bg-white/80 text-brown-800 hover:bg-white focus:bg-white transition-colors cursor-pointer font-medium"
                                        onChange={(e) => {
                                            handleCopy(e.target.value);
                                            e.target.value = "";
                                        }}
                                        defaultValue=""
                                    >
                                        <option value="" disabled>Adicionar a turma...</option>
                                        {availableExpeditions.map(e => (
                                            <option key={e.id} value={e.id}>{e.name}</option>
                                        ))}
                                    </select>
                                );
                            })()}

                            {(() => {
                                const currentExp = expeditions?.find(e => e.id === currentExpeditionId);
                                const isPrincipal = currentExp?.type === 'principal' || !currentExp?.type;
                                
                                return (
                                    <button 
                                        onClick={() => { 
                                            if (isPrincipal) {
                                                if (window.confirm('Tem certeza que deseja excluir permanentemente este membro?')) onRemove(member.id);
                                            } else {
                                                if (window.confirm('Remover este membro desta turma?')) {
                                                    onRemoveFromExpedition(member.id, currentExpeditionId);
                                                    onClose();
                                                }
                                            }
                                        }} 
                                        className="w-full py-2 text-red-400 hover:text-red-300 text-xs font-bold flex items-center justify-center gap-1 transition-colors hover:bg-white/20 rounded-lg"
                                    >
                                        <Trash2 size={14} /> {isPrincipal ? 'Excluir' : 'Remover da Turma'}
                                    </button>
                                );
                            })()}
                        </div>

                        {/* URL Input Modal (Nested) */}
                        {showUrlInput && (
                            <div className="absolute inset-0 bg-white z-50 flex flex-col items-center justify-center p-4 animate-fade-in text-left">
                                <h4 className="font-bold text-brown-800 mb-2">URL da Imagem</h4>
                                <Input
                                    value={tempUrl}
                                    onChange={(e) => setTempUrl(e.target.value)}
                                    placeholder="https://"
                                    className="mb-2 text-sm"
                                    autoFocus
                                />
                                <div className="flex gap-2">
                                    <Button size="sm" variant="ghost" onClick={() => setShowUrlInput(false)}>Cancelar</Button>
                                    <Button size="sm" onClick={handleUrlConfirm}>Salvar</Button>
                                </div>
                            </div>
                        )}
                    </div>

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
                                <div className="space-y-8 animate-fade-in">
                                    {['select', 'text'].map(type => {
                                        const typeTrails = type === 'select' ? selectTrails : textTrails;
                                        if (typeTrails.length === 0) return null;
                                        return (
                                            <section key={type}>
                                                <h3 className="font-bold text-brown-300 text-xs uppercase tracking-[0.2em] mb-4 border-b border-brown-100 pb-2">
                                                    {type === 'select' ? 'Habilidades & Traços' : 'Informações Complementares'}
                                                </h3>
                                                <div className={type === 'select' ? "grid sm:grid-cols-2 gap-4" : "space-y-4"}>
                                                    {typeTrails.map(trail => {
                                                        const ans = member.answers[trail.id];
                                                        const isEditing = editingTrailId === trail.id;

                                                        return (
                                                            <div key={trail.id} className="group border border-brown-100 rounded-xl p-4 hover:border-brown-300 transition-colors bg-white hover:shadow-sm">
                                                                <div className="flex items-start gap-3">
                                                                    <div className={`p-2 rounded-lg ${trail.color.replace('border', 'bg').split(' ')[0]} bg-opacity-20 text-brown-600`}>
                                                                        {trail.icon}
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <div className="flex justify-between items-start mb-1">
                                                                            <span className="text-xs font-bold text-gray-400 uppercase">{trail.title}</span>
                                                                            <button
                                                                                onClick={() => { setEditingTrailId(trail.id); setEditValue(ans); }}
                                                                                className="p-1 text-gray-300 hover:text-brown-500 opacity-0 group-hover:opacity-100 transition-all transform hover:scale-110"
                                                                            >
                                                                                <Pencil size={12} />
                                                                            </button>
                                                                        </div>

                                                                        {isEditing ? (
                                                                            <div className="mt-2 space-y-2 animate-fade-in">
                                                                                {trail.type === 'select' ? (
                                                                                    <div className="grid gap-2">
                                                                                        {trail.options.map(opt => (
                                                                                            <button
                                                                                                key={opt.value}
                                                                                                onClick={() => { setEditValue(opt); }}
                                                                                                className={`text-left text-sm p-2 rounded border ${editValue?.value === opt.value ? 'bg-brown-100 border-brown-300 text-brown-900 font-bold' : 'border-gray-100 hover:bg-gray-50'}`}
                                                                                            >
                                                                                                {opt.label}
                                                                                            </button>
                                                                                        ))}
                                                                                    </div>
                                                                                ) : (
                                                                                    <TextArea
                                                                                        value={editValue?.label || ''}
                                                                                        onChange={(e) => setEditValue({ ...editValue, label: e.target.value })}
                                                                                        className="text-sm min-h-[80px]"
                                                                                    />
                                                                                )}
                                                                                <div className="flex gap-2 justify-end">
                                                                                    <Button size="sm" variant="ghost" onClick={() => setEditingTrailId(null)}>Cancelar</Button>
                                                                                    <Button size="sm" onClick={() => handleEditSave(trail.id)}>Salvar</Button>
                                                                                </div>
                                                                            </div>
                                                                        ) : (
                                                                            <div>
                                                                                <div className="font-bold text-brown-800 leading-tight">
                                                                                    {ans?.label || <span className="text-gray-300 italic">Não registrado</span>}
                                                                                </div>
                                                                                {ans?.feedback && (
                                                                                    <div className="text-xs text-brown-500 mt-1 italic leading-relaxed">
                                                                                        "{ans.feedback}"
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </section>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="space-y-6 animate-fade-in h-full flex flex-col">
                                    {/* New Log Input */}
                                    <Card className="p-4 bg-brown-50 border-brown-100 space-y-3 shrink-0">
                                        <div className="flex gap-2 mb-2">
                                            <Input
                                                placeholder="Responsável (Ex: Prof. Silva)"
                                                value={newLogResponsible}
                                                onChange={(e) => setNewLogResponsible(e.target.value)}
                                                className="text-sm bg-white"
                                            />
                                            <Input
                                                placeholder="Assunto (Ex: Comportamento)"
                                                value={newLogSubject}
                                                onChange={(e) => setNewLogSubject(e.target.value)}
                                                className="text-sm bg-white"
                                            />
                                        </div>
                                        <TextArea
                                            value={newLogText}
                                            onChange={(e) => setNewLogText(e.target.value)}
                                            placeholder="Escreva uma nova observação..."
                                            className="min-h-[80px] text-sm bg-white resize-none"
                                        />
                                        <div className="flex justify-end">
                                            <Button
                                                onClick={handleAddLog}
                                                disabled={!newLogText.trim()}
                                                size="sm"
                                                className="bg-brown-600 hover:bg-brown-700 text-white"
                                            >
                                                Adicionar Registro
                                            </Button>
                                        </div>
                                    </Card>

                                    {/* Logs List */}
                                    <div className="space-y-4 flex-1 overflow-y-auto md:overflow-y-visible pr-2 custom-scrollbar">
                                        {(member.registry && member.registry.length > 0) ? (
                                            member.registry.map(log => (
                                                <div key={log.id} className="flex gap-3 relative pb-6 last:pb-0">
                                                    {/* Timeline Line */}
                                                    <div className="absolute left-[19px] top-8 bottom-0 w-0.5 bg-brown-100 last:hidden"></div>

                                                    <div className="w-10 h-10 rounded-full bg-white border-2 border-brown-200 flex items-center justify-center shrink-0 z-10 shadow-sm text-[10px] font-bold text-brown-400 flex-col leading-none">
                                                        <span>{log.date.split('/')[0]}</span>
                                                        <span>{log.date.split('/')[1]}</span>
                                                    </div>
                                                    <div className="flex-1 bg-white border border-gray-100 p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-bold text-brown-800 text-sm">{log.responsible}</span>
                                                                <span className="text-xs text-gray-400">• {log.subject}</span>
                                                            </div>
                                                            <button
                                                                onClick={() => {
                                                                    if (window.confirm('Apagar este registro?')) {
                                                                        const updated = member.registry.filter(r => r.id !== log.id);
                                                                        onUpdate(member.id, { registry: updated });
                                                                    }
                                                                }}
                                                                className="text-gray-300 hover:text-red-400"
                                                            >
                                                                <Trash2 size={12} />
                                                            </button>
                                                        </div>
                                                        <p className="text-brown-600 text-sm leading-relaxed whitespace-pre-wrap">{log.text}</p>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center py-12 text-gray-400 italic">
                                                Nenhum registro no diário ainda.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Mobile Only Footer Actions */}
                        <div className="md:hidden p-4 bg-white border-t border-brown-200 shrink-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-30 space-y-3">
                            {/* Navigation Arrows - Mobile */}
                            <div className="flex gap-3 justify-center">
                                <button
                                    onClick={(e) => { e.stopPropagation(); onPrev(member.id); }}
                                    className="flex items-center justify-center p-2.5 bg-brown-600 hover:bg-brown-700 text-white rounded-full shadow-lg transition-all active:scale-95"
                                    title="Card Anterior"
                                >
                                    <ChevronLeft className="w-6 h-6" />
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); onNext(member.id); }}
                                    className="flex items-center justify-center p-2.5 bg-brown-600 hover:bg-brown-700 text-white rounded-full shadow-lg transition-all active:scale-95"
                                    title="Próximo Card"
                                >
                                    <ChevronRight className="w-6 h-6" />
                                </button>
                            </div>

                            <button onClick={handleDownloadPDF} disabled={isGeneratingMessage} className="w-full bg-brown-700 hover:bg-brown-600 text-white font-bold py-3 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 mb-3">
                                {isGeneratingMessage ? <span className="animate-pulse">Gerando...</span> : <><Download size={16} /> Baixar PDF</>}
                            </button>
                            {(() => {
                                const currentExp = expeditions?.find(e => e.id === currentExpeditionId);
                                const isPrincipal = currentExp?.type === 'principal' || !currentExp?.type;
                                const availableExpeditions = isPrincipal 
                                    ? expeditions.filter(e => e.id !== currentExpeditionId && e.type === 'diversificada')
                                    : [];
                                
                                return isPrincipal && availableExpeditions.length > 0 && (
                                    <div className="mb-3">
                                        <select
                                            className="w-full p-2 text-xs border border-brown-300 rounded-lg text-center bg-brown-50 text-brown-800 h-10"
                                            onChange={(e) => {
                                                handleCopy(e.target.value);
                                                e.target.value = "";
                                            }}
                                            defaultValue=""
                                        >
                                            <option value="" disabled>Adicionar a turma...</option>
                                            {availableExpeditions.map(e => (
                                                <option key={e.id} value={e.id}>{e.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                );
                            })()}
                            {(() => {
                                const currentExp = expeditions?.find(e => e.id === currentExpeditionId);
                                const isPrincipal = currentExp?.type === 'principal' || !currentExp?.type;
                                
                                return (
                                    <button 
                                        onClick={() => { 
                                            if (isPrincipal) {
                                                if (window.confirm('Tem certeza que deseja excluir permanentemente este membro?')) onRemove(member.id);
                                            } else {
                                                if (window.confirm('Remover este membro desta turma?')) {
                                                    onRemoveFromExpedition(member.id, currentExpeditionId);
                                                    onClose();
                                                }
                                            }
                                        }} 
                                        className="w-full py-2 text-red-400 hover:text-red-300 text-xs flex items-center justify-center gap-1 font-bold tracking-wide"
                                    >
                                        <Trash2 size={12} /> {isPrincipal ? 'Excluir Membro' : 'Remover da Turma'}
                                    </button>
                                );
                            })()}
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default MemberModal;
