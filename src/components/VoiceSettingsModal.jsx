import React, { useEffect, useState } from 'react';
import { X, Play, Save } from 'lucide-react';

export const VoiceSettingsModal = ({ isOpen, onClose, currentSettings, onSave }) => {
    const [voices, setVoices] = useState([]);
    const [selectedVoiceURI, setSelectedVoiceURI] = useState(currentSettings.voiceURI || '');
    const [rate, setRate] = useState(currentSettings.rate || 1.1);
    const [pitch, setPitch] = useState(currentSettings.pitch || 1.0);

    useEffect(() => {
        const loadVoices = () => {
            const allVoices = window.speechSynthesis.getVoices();
            // Filter primarily for Portuguese, but allow others if needed
            const ptVoices = allVoices.filter(v => v.lang.includes('pt') || v.lang.includes('PT'));
            setVoices(ptVoices.length > 0 ? ptVoices : allVoices);

            // If no voice selected yet, pick the first one or logic from App
            if (!selectedVoiceURI && ptVoices.length > 0) {
                const defaultVoice = ptVoices.find(v =>
                    v.name.includes('Google') ||
                    v.name.includes('Luciana')
                ) || ptVoices[0];
                setSelectedVoiceURI(defaultVoice.voiceURI);
            }
        };

        loadVoices();
        window.speechSynthesis.onvoiceschanged = loadVoices;
    }, [selectedVoiceURI]);

    useEffect(() => {
        if (isOpen) {
            setSelectedVoiceURI(currentSettings.voiceURI);
            setRate(currentSettings.rate);
            setPitch(currentSettings.pitch);
        }
    }, [isOpen, currentSettings]);

    const handleTest = () => {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance("Olá! Esta é a voz do Drácker.");
        utterance.lang = 'pt-BR';
        const voice = window.speechSynthesis.getVoices().find(v => v.voiceURI === selectedVoiceURI);
        if (voice) utterance.voice = voice;
        utterance.rate = rate;
        utterance.pitch = pitch;
        window.speechSynthesis.speak(utterance);
    };

    const handleSaveLocal = () => {
        onSave({ voiceURI: selectedVoiceURI, rate, pitch });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md  animate-in zoom-in-95 duration-200">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 rounded-t-xl">
                    <h2 className="text-lg font-bold text-slate-800">Configurar Narrador</h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Voz</label>
                        <select
                            value={selectedVoiceURI}
                            onChange={(e) => setSelectedVoiceURI(e.target.value)}
                            className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white"
                        >
                            {voices.map(v => (
                                <option key={v.voiceURI} value={v.voiceURI}>
                                    {v.name} ({v.lang})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <div className="flex justify-between mb-2">
                            <label className="text-sm font-semibold text-slate-700">Velocidade</label>
                            <span className="text-xs text-slate-500">{rate}x</span>
                        </div>
                        <input
                            type="range"
                            min="0.5"
                            max="2"
                            step="0.1"
                            value={rate}
                            onChange={(e) => setRate(parseFloat(e.target.value))}
                            className="w-full"
                        />
                    </div>

                    <div>
                        <div className="flex justify-between mb-2">
                            <label className="text-sm font-semibold text-slate-700">Tom (Agudo/Grave)</label>
                            <span className="text-xs text-slate-500">{pitch}</span>
                        </div>
                        <input
                            type="range"
                            min="0.5"
                            max="2"
                            step="0.1"
                            value={pitch}
                            onChange={(e) => setPitch(parseFloat(e.target.value))}
                            className="w-full"
                        />
                    </div>

                    <div className="pt-2 flex gap-3">
                        <button
                            onClick={handleTest}
                            className="flex-1 py-2 rounded-lg border border-blue-200 text-blue-700 font-semibold hover:bg-blue-50 flex items-center justify-center gap-2"
                        >
                            <Play className="w-4 h-4" /> Testar
                        </button>
                        <button
                            onClick={handleSaveLocal}
                            className="flex-1 py-2 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 flex items-center justify-center gap-2"
                        >
                            <Save className="w-4 h-4" /> Salvar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
