
import React, { useState, useRef } from 'react';
import { X, Camera, Pencil, UploadCloud as UploadIcon, Download, Printer } from 'lucide-react';
import { Badge, Button, TextArea } from './MemberUI';

export const MemberSidebar = ({
    member,
    onClose,
    onUpdate,
    onCopy,
    diversifiedExpeditions,
    isDiversifiedExpedition,
    handleDownloadPDF,
    isGeneratingMessage,
    editingTrailId,
    setEditingTrailId,
    editValue,
    setEditValue,
    determineArchetype,
    memberExpeditions, // Added prop
    breadcrumbs // Optional
}) => {
    const fileRef = useRef(null);
    const [showUrlInput, setShowUrlInput] = useState(false);
    const [tempUrl, setTempUrl] = useState('');

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

    const handleUrlConfirm = () => {
        if (tempUrl) {
            onUpdate(member.id, { photo: tempUrl });
            setTempUrl('');
            setShowUrlInput(false);
        }
    };

    const autoArchetype = determineArchetype(member.answers, member.gender);

    const handleAnimalEdit = () => {
        const next = window.prompt('Defina o animal da floresta (deixe vazio para automático):', member?.archetype?.title || autoArchetype.title || '');
        if (next === null) return;
        const title = next.trim();
        if (!title) {
            onUpdate(member.id, { ...member, archetype: { ...autoArchetype, desc: member.archetype.desc || autoArchetype.desc } });
            return;
        }
        onUpdate(member.id, { ...member, archetype: { ...member.archetype, title } });
    };

    const handleCopyClick = (targetId) => {
        if (!targetId) return;
        if (window.confirm('Adicionar este explorador a outra turma?')) {
            onCopy(member, parseInt(targetId));
            alert('Explorador adicionado com sucesso à turma!');
        }
    };

    // RPG Roles data
    const rpgRoles = [
        { name: "Guardião", desc: "Lidera o grupo, mantém o foco." },
        { name: "Escriba", desc: "Registra ideias e organiza a entrega." },
        { name: "Bardo", desc: "Porta-voz, apresenta ideias." },
        { name: "Sábio", desc: "Pesquisador, busca informações." },
        { name: "Ladino", desc: "Estrategista, encontra soluções criativas." },
        { name: "Druida", desc: "Mediador, resolve conflitos." },
        { name: "Explorador", desc: "Logística, cuida dos materiais." }
    ];

    const currentRoleDesc = rpgRoles.find(r => r.name === member.rpgClass)?.desc;

    return (
        <div className="w-full md:w-1/3 p-4 md:p-6 bg-brown-900 text-white relative flex flex-col items-center text-center shrink-0 min-h-min nav-safe-area-bottom">
            <div className="absolute inset-0 opacity-10 bg-[url('/noise.png')] pointer-events-none"></div>

            {/* Close Button - Top Left */}
            <button
                onClick={onClose}
                className="absolute top-2 left-2 md:top-3 md:left-3 p-1.5 md:p-2 bg-white hover:bg-red-50 text-brown-600 hover:text-red-500 rounded-full z-20 transition-all shadow-md hover:shadow-lg border-2 border-brown-200 hover:border-red-300 active:scale-95"
                title="Fechar Modal"
            >
                <X size={18} strokeWidth={3} />
            </button>

            <div className="relative group mb-6 mt-6 md:mt-8">
                <div className="w-32 md:w-56 aspect-[3/4] rounded-xl p-2 bg-white shadow-xl rotate-1 hover:rotate-0 transition-transform duration-300 relative z-10 border border-brown-100/50">
                    <div className="w-full h-full rounded-lg overflow-hidden bg-gray-100 relative">
                        {member.photo ? (
                            <img src={member.photo} alt={member.name} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-brown-100 to-brown-50">
                                <img src="/dracker_expedition_logo.png" alt="Dracker Expedition Logo" className="w-full h-full object-cover" />
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
                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 z-20 whitespace-nowrap flex items-center gap-2">
                        <Badge className="bg-white text-brown-800 shadow-sm border border-brown-100 px-3">
                            {member.archetype.title}
                        </Badge>
                        <button
                            type="button"
                            onClick={handleAnimalEdit}
                            className="p-1.5 rounded-full bg-brown-700 text-white hover:bg-brown-800 shadow-md border border-brown-800 transition-all focus:outline-none focus:ring-2 focus:ring-white/80"
                            title="Editar animalzinho"
                        >
                            <Pencil size={14} strokeWidth={2.5} />
                        </button>
                    </div>
                </div>
            </div>

            {showUrlInput && (
                <div className="w-full mb-4 animate-fade-in px-2">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={tempUrl}
                            onChange={(e) => setTempUrl(e.target.value)}
                            placeholder="Cole a URL da imagem..."
                            className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-white/40 focus:outline-none focus:border-white/50"
                        />
                        <button
                            onClick={handleUrlConfirm}
                            className="bg-green-600 hover:bg-green-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold"
                        >
                            OK
                        </button>
                    </div>
                </div>
            )}

            <h2 className="text-2xl font-extrabold text-white mb-2 leading-tight px-2">{member.name}</h2>

            {memberExpeditions && memberExpeditions.length > 0 && (
                <div className="flex flex-wrap justify-center gap-1 mb-3 px-3">
                    {memberExpeditions.map(exp => (
                        <span
                            key={exp.id}
                            className={`text-[10px] font-bold px-2.5 py-1 rounded-full border backdrop-blur-sm ${exp.type && exp.type.toLowerCase().includes('divers') ? 'bg-purple-100/80 text-purple-800 border-purple-200' : 'bg-white/80 text-brown-800 border-brown-200'}`}
                            title={`Turma: ${exp.name}`}
                        >
                            {exp.name}
                        </span>
                    ))}
                </div>
            )}

            {editingTrailId === 'phrase' ? (
                <div className="w-full mb-6 animate-fade-in space-y-2 px-2">
                    <TextArea
                        value={editValue || ''}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="text-center text-sm italic min-h-[60px] text-brown-900"
                    />
                    <div className="flex justify-center gap-2">
                        <Button size="sm" variant="ghost" className="text-white hover:text-white/80 hover:bg-white/10" onClick={() => setEditingTrailId(null)}>Cancelar</Button>
                        <Button
                            size="sm"
                            variant="secondary"
                            className="text-brown-900 font-bold px-4"
                            onClick={() => {
                                onUpdate(member.id, { archetype: { ...member.archetype, desc: editValue } });
                                setEditingTrailId(null);
                            }}
                        >
                            Salvar
                        </Button>
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

            {/* RPG Class Selector */}
            <div className="w-full px-4 mb-6 relative z-20">
                <label className="text-[10px] uppercase font-bold text-white/60 mb-1 block tracking-wider">Classe RPG</label>
                <div className="relative">
                    <select
                        value={member.rpgClass || ''}
                        onChange={(e) => onUpdate(member.id, { rpgClass: e.target.value })}
                        className="w-full bg-black/20 border border-white/20 text-white rounded-lg p-2 text-sm appearance-none cursor-pointer hover:bg-black/30 transition-colors focus:outline-none focus:border-white/50"
                    >
                        <option value="">Selecione uma Classe...</option>
                        {rpgRoles.map(role => (
                            <option key={role.name} value={role.name} className="text-gray-900">{role.name}</option>
                        ))}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">▼</div>
                </div>
                {member.rpgClass && (
                    <p className="text-[10px] text-white/60 mt-1 italic">
                        {currentRoleDesc}
                    </p>
                )}
            </div>

            <div className="space-y-2 w-full mt-auto flex md:flex flex-col gap-3 px-2">
                <button onClick={handleDownloadPDF} disabled={isGeneratingMessage} className="w-full bg-white/90 hover:bg-white text-brown-800 font-bold py-2.5 rounded-lg shadow-sm border border-brown-200 flex items-center justify-center gap-2 transition-all disabled:opacity-50 text-sm">
                    {isGeneratingMessage ? <span className="animate-pulse">Preparando...</span> : <><Printer size={16} /> Imprimir Ficha</>}
                </button>

                {(() => {
                    if (diversifiedExpeditions.length === 0) {
                        // This logic relies on outside prop
                        if (isDiversifiedExpedition) return null;
                        return (
                            <div className="w-full text-center text-[11px] text-brown-500 bg-white/60 border border-dashed border-brown-200 rounded-lg py-2 px-3">
                                Crie uma Turma Diversificada no Lobby para liberar este seletor.
                            </div>
                        );
                    }

                    return (
                        <select
                            className="w-full p-2 text-xs border border-brown-200 rounded-lg text-center bg-white/80 text-brown-800 hover:bg-white focus:bg-white transition-colors cursor-pointer font-medium"
                            onChange={(e) => {
                                handleCopyClick(e.target.value);
                                e.target.value = "";
                            }}
                            defaultValue=""
                        >
                            <option value="" disabled>Adicionar a turma...</option>
                            {diversifiedExpeditions.map(e => (
                                <option key={e.id} value={e.id}>{e.name}</option>
                            ))}
                        </select>
                    );
                })()}
            </div>
        </div>
    );
};
