import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, X, Sparkles, Check } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input, TextArea } from '../ui/Input';
import { Card } from '../ui/Card';

const QuizView = ({ currentStep, trails, answers, onAnswer, onNext, onPrev, onCancel }) => {
    const currentTrail = trails[currentStep];
    const progress = ((currentStep + 1) / trails.length) * 100;
    const [textAnswer, setTextAnswer] = useState(answers[currentTrail.id]?.label || '');

    // Reset text buffer when step changes
    React.useEffect(() => {
        if (currentTrail.type === 'text') {
            setTextAnswer(answers[currentTrail?.id]?.label || '');
        }
    }, [currentStep, currentTrail.id, answers, currentTrail.type]);

    const handleTextConfirm = () => {
        onAnswer(currentTrail.id, { label: textAnswer, value: 'text' });
        onNext();
    };


    return (
        <div className="max-w-4xl mx-auto flex flex-col h-screen md:h-auto md:justify-center animate-fade-in md:overflow-y-visible overflow-y-auto">
            {/* Header / Info Bar */}
            <div className="flex items-center justify-between mb-6 md:mb-8 px-4 pt-4 md:pt-0 shrink-0">
                <Button variant="ghost" onClick={onCancel} className="text-gray-400 hover:text-red-500 hover:bg-red-50">
                    <X size={24} /> <span className="hidden md:inline ml-2">Cancelar</span>
                </Button>
                <div className="text-center">
                    <span className="text-xs font-black tracking-[0.2em] text-brown-400 uppercase">Progresso da Missão</span>
                    <div className="flex items-center gap-3 mt-1">
                        <span className="text-2xl font-black text-brown-800">{currentStep + 1}</span>
                        <span className="text-sm font-bold text-brown-400">/ {trails.length}</span>
                    </div>
                </div>
                <div className="w-24"></div> {/* Spacer for center alignment */}
            </div>

            {/* Progress Bar */}
            <div className="h-2 bg-gray-100 rounded-full mb-8 md:mb-12 overflow-hidden shadow-inner mx-4 shrink-0">
                <div
                    className="h-full bg-gradient-to-r from-brown-400 to-brown-600 transition-all duration-700 ease-out relative"
                    style={{ width: `${progress}%` }}
                >
                    <div className="absolute right-0 top-0 h-full w-2 bg-white/30 animate-pulse"></div>
                </div>
            </div>

            {/* Main Question Card */}
            <div className="relative perspective-1000 px-4 pb-8 md:pb-0 flex-grow md:flex-grow-0">
                <Card className={`
                    border-0 shadow-2xl bg-white overflow-hidden relative
                    transition-all duration-500 transform
                    ${currentTrail.color} border-t-8
                `}>
                    <div className="p-8 md:p-12">
                        {/* Question Header */}
                        <div className="flex flex-col md:flex-row gap-6 md:items-start mb-10">
                            <div className={`
                                w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 shadow-lg transform rotate-3
                                ${currentTrail.color.replace('border', 'bg').replace('text', 'text-white')}
                            `}>
                                {currentTrail.icon}
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-sm font-bold opacity-60 uppercase tracking-widest">{currentTrail.title}</h3>
                                <h2 className="text-2xl md:text-3xl font-extrabold leading-tight text-gray-800">
                                    {currentTrail.question}
                                </h2>
                            </div>
                        </div>

                        {/* Options / Input */}
                        <div className="max-w-2xl mx-auto">
                            {currentTrail.type === 'select' ? (
                                <div className="grid gap-3">
                                    {currentTrail.options.map((option) => {
                                        const isSelected = answers[currentTrail.id]?.value === option.value;
                                        return (
                                            <button
                                                key={option.value}
                                                onClick={() => {
                                                    onAnswer(currentTrail.id, option);
                                                    setTimeout(onNext, 250); // Slight delay for visual feedback
                                                }}
                                                className={`
                                                    w-full p-4 md:p-5 text-left rounded-xl transition-all duration-200 group relative overflow-hidden
                                                    border-2 flex items-center justify-between
                                                    ${isSelected
                                                        ? 'border-brown-600 bg-brown-50 shadow-md transform scale-[1.01]'
                                                        : 'border-gray-100 hover:border-brown-200 hover:bg-gray-50'
                                                    }
                                                `}
                                            >
                                                <div>
                                                    <div className={`font-bold text-lg mb-1 ${isSelected ? 'text-brown-800' : 'text-gray-700'}`}>
                                                        {option.label}
                                                    </div>
                                                    <div className={`text-sm ${isSelected ? 'text-brown-600' : 'text-gray-400'}`}>
                                                        {option.desc}
                                                    </div>
                                                </div>
                                                {isSelected && (
                                                    <div className="w-8 h-8 bg-brown-600 rounded-full flex items-center justify-center text-white animate-scale-in">
                                                        <Check size={16} />
                                                    </div>
                                                )}
                                                <div className={`absolute inset-0 border-2 border-brown-600 rounded-xl opacity-0 transition-opacity duration-300 pointer-events-none ${isSelected ? 'opacity-100' : ''}`} />
                                            </button>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="space-y-6 animate-fade-in-up">
                                    <TextArea
                                        value={textAnswer}
                                        onChange={(e) => setTextAnswer(e.target.value)}
                                        placeholder={currentTrail.placeholder || "Escreva suas observações aqui..."}
                                        className="h-40 text-lg p-6 bg-gray-50 focus:bg-white resize-none shadow-inner border-gray-200"
                                        autoFocus
                                    />
                                    <div className="flex justify-between gap-3">
                                        <Button
                                            onClick={onPrev}
                                            disabled={currentStep === 0}
                                            variant="ghost"
                                            className="px-6 py-3 text-brown-600 hover:text-brown-800 hover:bg-brown-50 disabled:opacity-30 disabled:cursor-not-allowed"
                                        >
                                            <ChevronLeft size={18} className="mr-2" /> Anterior
                                        </Button>
                                        <div className="flex gap-3">
                                            <Button
                                                onClick={onNext}
                                                className="px-6 py-3 bg-gray-600 text-white hover:bg-gray-700 shadow-md"
                                            >
                                                <ChevronRight size={18} className="mr-2" /> Avançar
                                            </Button>
                                            <Button
                                                onClick={handleTextConfirm}
                                                className="px-8 py-3 bg-brown-800 text-white hover:bg-brown-900 shadow-xl"
                                            >
                                                Confirmar <Sparkles size={18} className="ml-2" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </Card>
            </div>

            {/* Navigation Footer with Arrows */}
            <div className="mt-6 md:mt-8 flex flex-col md:flex-row justify-between items-center gap-4 px-4 max-w-4xl mx-auto w-full pb-4 md:pb-0 shrink-0">
                {/* Mobile/Desktop: Anterior */}
                <div 
                    onClick={onPrev}
                    disabled={currentStep === 0}
                    className={`flex items-center gap-2 cursor-pointer transition-all ${
                        currentStep === 0 
                            ? 'opacity-30 cursor-not-allowed' 
                            : 'opacity-100 hover:scale-110'
                    }`}
                >
                    <span className="text-2xl md:text-3xl font-black text-brown-600">←</span>
                    <span className="text-lg md:text-xl font-bold text-brown-700">Anterior</span>
                </div>

                {/* Mobile/Desktop: Avançar */}
                <div 
                    onClick={onNext}
                    className="flex items-center gap-2 cursor-pointer hover:scale-110 transition-all"
                >
                    <span className="text-lg md:text-xl font-bold text-brown-700">Avançar</span>
                    <span className="text-2xl md:text-3xl font-black text-brown-600">→</span>
                </div>

                {/* Visual indicator dots for mobile/tablet could go here */}
            </div>
        </div>
    );
};

export default QuizView;
