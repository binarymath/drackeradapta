import React, { useState } from 'react';
import { Camera, SaveIcon, Trash2, Check, Sparkles, Upload as UploadIcon, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input, TextArea } from '../ui/Input';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { ARCHETYPES_CONFIG } from './ArchetypesConfig.jsx';


const ResultView = ({ name, archetype, onSave, onDiscard, customDesc, setCustomDesc, photo, onPhotoUpload, onSetPhoto }) => {
    const config = ARCHETYPES_CONFIG[archetype?.title] || ARCHETYPES_CONFIG['Colibri Sonhador'];
    const Icon = config.icon || Sparkles;
    const [isEditingDesc, setIsEditingDesc] = useState(false);
    const [tempDesc, setTempDesc] = useState('');
    const [showUrlInput, setShowUrlInput] = useState(false);
    const [tempUrl, setTempUrl] = useState('');

    const handleUrlConfirm = () => {
        if (tempUrl) {
            onSetPhoto(tempUrl);
            setShowUrlInput(false);
            setTempUrl('');
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-scale-in">
            {/* Success Header */}
            <div className="text-center space-y-2 mb-8">
                <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-bold border border-green-200 shadow-sm animate-bounce-slow">
                    <Check size={16} /> Avaliação Concluída com Sucesso!
                </div>
                <h2 className="text-4xl md:text-5xl font-extrabold text-brown-800 drop-shadow-sm font-handwritten">
                    Novo Explorador Registrado
                </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-8 items-start">
                {/* 1. ARCHETYPE CARD */}
                <Card className="overflow-hidden border-4 border-brown-200 bg-white relative shadow-2xl rotate-1 hover:rotate-0 transition-transform duration-500">
                    {/* Card Header Background */}
                    <div className={`h-32 ${config.color.split(' ')[0]} relative overflow-hidden`}>
                        <div className="absolute inset-0 opacity-20 bg-[url('/noise.png')]"></div>
                        <div className="absolute -bottom-10 -right-10 opacity-20 text-current transform rotate-12 scale-150">
                            <Icon size={180} />
                        </div>
                    </div>

                    {/* Avatar & Badge */}
                    <div className="px-8 relative -mt-16 text-center">
                        <div className="relative inline-block group">
                            <div className="w-32 h-32 rounded-full border-4 border-white shadow-xl bg-gray-100 overflow-hidden relative z-10 mx-auto">
                                {photo ? (
                                    <img src={photo} alt={name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-brown-50 text-brown-300">
                                        <Icon size={48} />
                                    </div>
                                )}
                                {/* Photo Hover Overlay */}
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                                    <label className="cursor-pointer text-white flex flex-col items-center hover:scale-110 transition-transform">
                                        <Camera size={20} />
                                        <span className="text-[10px] uppercase font-bold mt-1">Trocar Foto</span>
                                        <input type="file" className="hidden" accept="image/*" onChange={onPhotoUpload} />
                                    </label>
                                    <button
                                        onClick={() => setShowUrlInput(true)}
                                        className="text-white flex flex-col items-center hover:scale-110 transition-transform"
                                    >
                                        <UploadIcon size={20} />
                                        <span className="text-[10px] uppercase font-bold mt-1">Via URL</span>
                                    </button>
                                </div>
                            </div>
                            <div className="absolute bottom-0 right-1/2 translate-x-1/2 translate-y-1/2 z-20">
                                <Badge className={`text-sm px-3 py-1 shadow-md ${config.color}`}>
                                    {archetype.title}
                                </Badge>
                            </div>
                        </div>

                        {/* Name & Desc */}
                        <div className="mt-8 mb-6 space-y-4">
                            <h3 className="text-3xl font-extrabold text-brown-800 leading-tight">{name}</h3>

                            <div className="relative group/desc">
                                {isEditingDesc ? (
                                    <div className="animate-fade-in">
                                        <TextArea
                                            value={tempDesc}
                                            onChange={(e) => setTempDesc(e.target.value)}
                                            className="text-center text-brown-600 italic text-lg p-2 bg-yellow-50 min-h-[100px]"
                                            autoFocus
                                        />
                                        <div className="flex gap-2 justify-center mt-2">
                                            <Button size="sm" variant="ghost" onClick={() => setIsEditingDesc(false)}>Cancelar</Button>
                                            <Button size="sm" onClick={() => { setCustomDesc(tempDesc); setIsEditingDesc(false); }}>Salvar</Button>
                                        </div>
                                    </div>
                                ) : (
                                    <p
                                        className="text-lg text-brown-600 italic leading-relaxed px-4 cursor-pointer hover:text-brown-800 transition-colors"
                                        onClick={() => { setTempDesc(customDesc || archetype.desc); setIsEditingDesc(true); }}
                                        title="Clique para editar a descrição"
                                    >
                                        "{customDesc || archetype.desc}"
                                    </p>
                                )}
                                {!isEditingDesc && (
                                    <span className="absolute -top-4 -right-2 opacity-0 group-hover/desc:opacity-100 transition-opacity text-xs bg-brown-100 text-brown-600 px-1 rounded">Editar</span>
                                )}
                            </div>
                        </div>
                    </div>
                </Card>

                {/* URL Input Modal (Internal) */}
                {showUrlInput && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in">
                        <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-sm space-y-4">
                            <h4 className="font-bold text-lg text-brown-800">Colar URL da Imagem</h4>
                            <Input
                                value={tempUrl}
                                onChange={(e) => setTempUrl(e.target.value)}
                                placeholder="https://..."
                                autoFocus
                            />
                            <div className="flex justify-end gap-2">
                                <Button variant="ghost" onClick={() => setShowUrlInput(false)}>Cancelar</Button>
                                <Button onClick={handleUrlConfirm}>Confirmar</Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* 2. SUMMARY & ACTIONS */}
                <div className="space-y-6 flex flex-col h-full justify-center">
                    <Card className="p-6 bg-brown-50 border-brown-100 space-y-4">
                        <h4 className="font-bold text-brown-800 uppercase tracking-wider text-sm flex items-center gap-2">
                            <Sparkles size={16} /> Resumo dos Traços
                        </h4>
                        <div className="space-y-3">
                            {/* We could pass a summary of traits here if we wanted, for now just static or derived from archetype logic */}
                            <p className="text-sm text-brown-600">
                                O arquétipo <strong>{archetype.title}</strong> foi identificado com base nas respostas predominantes, destacando características de {config.color.includes('yellow') ? 'Foco e Precisão' : config.color.includes('orange') ? 'Energia e Velocidade' : 'Equilíbrio e Sabedoria'}.
                            </p>
                        </div>
                    </Card>

                    <div className="flex gap-4 pt-4">
                        <Button
                            variant="ghost"
                            onClick={onDiscard}
                            className="flex-1 border-2 border-brown-100 hover:border-red-200 hover:bg-red-50 hover:text-red-600 text-brown-400 h-14"
                        >
                            <Trash2 size={20} className="mr-2" /> Descartar
                        </Button>
                        <Button
                            onClick={onSave}
                            className="flex-[2] shadow-lg shadow-brown-200/50 h-14 text-lg bg-green-600 hover:bg-green-700 text-white border-none"
                        >
                            <SaveIcon className="mr-2" size={20} /> Registrar Recruta
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ResultView;
