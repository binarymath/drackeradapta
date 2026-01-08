
import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle, Skull, MapPin, Trophy, Star } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

export const RPGGameMode = ({ adventureData, onExit }) => {
    const [currentStage, setCurrentStage] = useState(0); // 0 = Intro, 1-5 = Encounters, 6 = Victory
    const [revealed, setRevealed] = useState(false);

    const encounters = adventureData.encounters || [];
    const totalStages = encounters.length;

    const handleNext = () => {
        if (currentStage < totalStages + 1) {
            setCurrentStage(prev => prev + 1);
            setRevealed(false);
        }
    };

    const handlePrev = () => {
        if (currentStage > 0) {
            setCurrentStage(prev => prev - 1);
            setRevealed(false);
        }
    };

    // Render Intro Slide
    if (currentStage === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[500px] animate-fade-in p-8 text-center bg-brown-50 rounded-xl border-4 border-brown-200">
                <div className="w-32 h-32 bg-white rounded-full border-4 border-amber-400 overflow-hidden shadow-xl mb-6">
                    <img src="/dracker_character.png" alt="Drácker" className="w-full h-full object-cover" />
                </div>
                <h2 className="text-4xl font-bold text-brown-900 mb-4">{adventureData.title}</h2>
                <div className="bg-white p-6 rounded-xl border border-brown-100 shadow-sm max-w-2xl mb-8">
                    <p className="text-xl text-brown-700 italic">"{adventureData.intro}"</p>
                    <p className="mt-4 font-bold text-amber-700">Missão: Derrotar {adventureData.villain}!</p>
                </div>
                <Button onClick={handleNext} className="text-lg px-8 py-4 bg-green-600 hover:bg-green-700 text-white shadow-lg animate-pulse">
                    Começar Aventura <ArrowRight className="ml-2" />
                </Button>
                <Button onClick={onExit} variant="ghost" className="mt-4 text-brown-500">
                    Voltar ao Menu
                </Button>
            </div>
        );
    }

    // Render Victory Slide
    if (currentStage > totalStages) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[500px] animate-fade-in p-8 text-center bg-amber-50 rounded-xl border-4 border-amber-300">
                <Trophy size={64} className="text-amber-500 mb-4 animate-bounce" />
                <h2 className="text-4xl font-bold text-amber-800 mb-4">Vitória!</h2>
                <p className="text-xl text-brown-700 mb-8 max-w-xl">
                    Parabéns heróis! Vocês derrotaram {adventureData.villain} e salvaram a Floresta Encantada. O Drácker está orgulhoso!
                </p>
                <div className="flex gap-4">
                    <Button onClick={() => setCurrentStage(0)} variant="secondary">
                        Jogar Novamente
                    </Button>
                    <Button onClick={onExit} className="bg-brown-600 text-white">
                        Finalizar Sessão
                    </Button>
                </div>
            </div>
        );
    }

    // Render Encounter Stages
    const encounter = encounters[currentStage - 1]; // Offset by 1 for intro
    const isBoss = currentStage === totalStages;

    return (
        <div className="max-w-4xl mx-auto animate-fade-in min-h-[500px] flex flex-col">
            {/* Progress Bar */}
            <div className="mb-6 flex gap-1">
                {Array.from({ length: totalStages }).map((_, i) => (
                    <div key={i} className={`h-2 flex-1 rounded-full ${i + 1 < currentStage ? 'bg-green-500' : i + 1 === currentStage ? 'bg-amber-500' : 'bg-gray-200'}`} />
                ))}
            </div>

            <Card className={`flex-1 flex flex-col p-8 border-4 ${isBoss ? 'border-red-200 bg-red-50' : 'border-brown-200 bg-white'}`}>
                <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-white rounded-full border-2 border-brown-300 overflow-hidden shadow block shrink-0">
                            <img src="/dracker_character.png" alt="Drácker" className="w-full h-full object-cover" />
                        </div>
                        <div>
                            <span className="text-xs font-bold uppercase tracking-wider opacity-60">Fase {currentStage}/{totalStages}</span>
                            <h2 className={`text-2xl font-bold ${isBoss ? 'text-red-800' : 'text-brown-800'}`}>
                                {encounter.title}
                            </h2>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {isBoss && <Skull className="text-red-500 animate-pulse" size={32} />}
                        <Button onClick={onExit} variant="secondary" className="text-xs px-2 py-1 bg-brown-200 text-brown-700 hover:bg-brown-300 border-brown-300 gap-1 h-8">
                            <ArrowLeft size={12} /> Voltar
                        </Button>
                    </div>
                </div>

                <div className="flex-1 flex flex-col items-center justify-center text-center space-y-8 my-4">
                    <p className="text-xl text-brown-700 leading-relaxed font-medium">
                        {encounter.desc}
                    </p>

                    {!revealed ? (
                        <Button onClick={() => setRevealed(true)} className="py-8 px-12 text-xl bg-brown-600 hover:bg-brown-700 text-white shadow-xl transition-transform hover:scale-105">
                            <Star className="mr-3 fill-current" /> Ver Desafio
                        </Button>
                    ) : (
                        <div className="w-full bg-white p-6 rounded-xl border-2 border-dashed border-amber-400 animate-in fade-in zoom-in duration-300">
                            <span className="text-sm font-bold text-amber-600 uppercase mb-2 block">Pergunta do Mestre</span>
                            <p className="text-2xl font-bold text-brown-900">{encounter.question}</p>
                        </div>
                    )}
                </div>

                <div className="flex justify-between mt-8 pt-6 border-t border-black/5">
                    <Button onClick={handlePrev} variant="ghost" disabled={currentStage === 1} className="text-brown-500">
                        <ArrowLeft size={16} className="mr-2" /> Anterior
                    </Button>

                    {revealed && (
                        <Button onClick={handleNext} className={`${isBoss ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'} text-white px-8`}>
                            {isBoss ? 'Vencer Vilão!' : 'Próxima Fase'} <ArrowRight size={16} className="ml-2" />
                        </Button>
                    )}
                </div>
            </Card>
        </div>
    );
};
