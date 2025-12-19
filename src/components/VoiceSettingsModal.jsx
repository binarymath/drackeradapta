import React, { useEffect, useState } from 'react';
import { X, Play, Save, RefreshCw, Volume2 } from 'lucide-react';

// UI Components
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import { Select } from './ui/Input';

export const VoiceSettingsModal = ({ isOpen, onClose, currentSettings, onSave }) => {
    const [voices, setVoices] = useState([]);
    const [selectedVoiceURI, setSelectedVoiceURI] = useState(currentSettings.voiceURI || '');
    const [rate, setRate] = useState(currentSettings.rate || 1.1);
    const [pitch, setPitch] = useState(currentSettings.pitch || 1.0);

    useEffect(() => {
        const loadVoices = () => {
            const allVoices = window.speechSynthesis.getVoices();

            // Sort voices: PT-BR first, then other PT, then alphabetical
            allVoices.sort((a, b) => {
                const aIsPTBR = a.lang === 'pt-BR';
                const bIsPTBR = b.lang === 'pt-BR';
                if (aIsPTBR && !bIsPTBR) return -1;
                if (!aIsPTBR && bIsPTBR) return 1;

                const aIsPT = a.lang.includes('pt');
                const bIsPT = b.lang.includes('pt');
                if (aIsPT && !bIsPT) return -1;
                if (!aIsPT && bIsPT) return 1;

                return a.name.localeCompare(b.name);
            });

            setVoices(allVoices);

            // If no voice selected yet, try to find a good default
            if (!selectedVoiceURI && allVoices.length > 0) {
                const defaultVoice = allVoices.find(v =>
                    v.lang.includes('pt') && (v.name.includes('Google') || v.name.includes('Microsoft'))
                ) || allVoices.find(v => v.lang.includes('pt')) || allVoices[0];

                if (defaultVoice) {
                    setSelectedVoiceURI(defaultVoice.voiceURI);
                }
            }
        };

        // Try to load immediately and also on ensure
        loadVoices();

        // Some browsers need a little nudge or timeout if voices are lazy loaded
        if (window.speechSynthesis.getVoices().length === 0) {
            setTimeout(loadVoices, 500);
            setTimeout(loadVoices, 2000);
        }

        window.speechSynthesis.onvoiceschanged = loadVoices;
        return () => { window.speechSynthesis.onvoiceschanged = null; };
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

    const footer = (
        <div className="flex gap-3 w-full">
            <Button
                onClick={handleTest}
                variant="outline"
                className="flex-1"
                icon={Play}
            >
                Testar
            </Button>
            <Button
                onClick={handleSaveLocal}
                className="flex-1"
                icon={Save}
            >
                Salvar
            </Button>
        </div>
    );

    if (!isOpen) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Configurar Narrador"
            icon={Volume2}
            size="sm"
            footer={footer}
        >
            <div className="space-y-6">
                <div>
                    <div className="flex justify-between items-center mb-2">
                        <label className="text-sm font-semibold text-brown-700">Voz ({voices.length} encontradas)</label>
                        <Button
                            onClick={() => {
                                const all = window.speechSynthesis.getVoices();
                                setVoices(all);
                            }}
                            variant="ghost"
                            className="text-xs h-auto py-1 px-2"
                            icon={RefreshCw}
                        >
                            Atualizar
                        </Button>
                    </div>
                    <select // Using native select for efficiency with large lists, could standardise later
                        value={selectedVoiceURI}
                        onChange={(e) => setSelectedVoiceURI(e.target.value)}
                        className="w-full p-2 border border-brown-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brown-500 focus:border-transparent"
                    >
                        {voices.map(v => {
                            const isNatural = v.name.includes('Natural') || v.name.includes('Neural') || v.name.includes('Online');
                            return (
                                <option key={v.voiceURI} value={v.voiceURI} className={isNatural ? 'font-bold text-green-700 bg-green-50' : ''}>
                                    {isNatural ? '✨ ' : ''}{v.name} ({v.lang}) {isNatural ? '- Ótima Qualidade' : ''}
                                </option>
                            );
                        })}
                    </select>
                    {voices.length === 0 && <p className="text-xs text-red-500 mt-1">Nenhuma voz detectada. Tente clicar em atualizar.</p>}
                </div>

                <div>
                    <div className="flex justify-between mb-2">
                        <label className="text-sm font-semibold text-brown-700">Velocidade</label>
                        <span className="text-xs text-brown-500">{rate}x</span>
                    </div>
                    <input
                        type="range"
                        min="0.5"
                        max="2"
                        step="0.1"
                        value={rate}
                        onChange={(e) => setRate(parseFloat(e.target.value))}
                        className="w-full h-2 bg-brown-200 rounded-lg appearance-none cursor-pointer accent-brown-600"
                    />
                </div>

                <div>
                    <div className="flex justify-between mb-2">
                        <label className="text-sm font-semibold text-brown-700">Tom (Agudo/Grave)</label>
                        <span className="text-xs text-brown-500">{pitch}</span>
                    </div>
                    <input
                        type="range"
                        min="0.5"
                        max="2"
                        step="0.1"
                        value={pitch}
                        onChange={(e) => setPitch(parseFloat(e.target.value))}
                        className="w-full h-2 bg-brown-200 rounded-lg appearance-none cursor-pointer accent-brown-600"
                    />
                </div>
            </div>
        </Modal>
    );
};
