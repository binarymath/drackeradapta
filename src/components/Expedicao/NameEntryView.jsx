import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Music, Ghost, PenTool, BookOpen } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input, Select } from '../ui/Input';
import { Card } from '../ui/Card';

const NameEntryView = ({ onStart, onCancel }) => {
    const [name, setName] = useState('');
    const [gender, setGender] = useState('M');

    const handleStart = () => {
        if (!name.trim()) return;
        onStart(name, gender);
    };

    return (
        <div className="max-w-xl mx-auto animate-fade-in-up">
            <Card className="overflow-hidden border-0 shadow-2xl relative bg-white">
                {/* Decorative backgrounds */}
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-brown-400 via-brown-600 to-brown-800" />
                <div className="absolute -right-10 -top-10 opacity-5 text-brown-900 rotate-12">
                    <Music size={150} />
                </div>
                <div className="absolute -left-10 bottom-0 opacity-5 text-brown-900 -rotate-12">
                    <BookOpen size={150} />
                </div>

                <div className="p-8 md:p-12 space-y-8 relative z-10">
                    <div className="text-center space-y-2">
                        <h2 className="text-3xl font-extrabold text-brown-800 font-handwritten">Novo Registro</h2>
                        <p className="text-brown-500">Insira os dados do novo recruta para iniciar a avaliação.</p>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="block text-sm font-bold text-brown-700 uppercase tracking-wider">
                                Nome do Explorador(a)
                            </label>
                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-brown-400 group-focus-within:text-brown-600 transition-colors">
                                    <PenTool size={20} />
                                </div>
                                <Input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Ex: Arthur Pendragon"
                                    className="pl-12 text-lg h-14 bg-brown-50 focus:bg-white border-2 border-brown-100 focus:border-brown-400 transition-all shadow-inner"
                                    autoFocus
                                    onKeyDown={(e) => e.key === 'Enter' && handleStart()}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-bold text-brown-700 uppercase tracking-wider">
                                Gênero
                            </label>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => setGender('M')}
                                    className={`
                                        p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all duration-300
                                        ${gender === 'M'
                                            ? 'border-brown-600 bg-brown-50 text-brown-800 ring-2 ring-brown-600 ring-offset-2 shadow-md transform scale-[1.02]'
                                            : 'border-gray-200 text-gray-400 hover:border-brown-300 hover:bg-gray-50'
                                        }
                                    `}
                                >
                                    <Ghost size={24} />
                                    <span className="font-bold">Masculino</span>
                                </button>
                                <button
                                    onClick={() => setGender('F')}
                                    className={`
                                        p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all duration-300
                                        ${gender === 'F'
                                            ? 'border-brown-600 bg-brown-50 text-brown-800 ring-2 ring-brown-600 ring-offset-2 shadow-md transform scale-[1.02]'
                                            : 'border-gray-200 text-gray-400 hover:border-brown-300 hover:bg-gray-50'
                                        }
                                    `}
                                >
                                    <Ghost size={24} />
                                    <span className="font-bold">Feminino</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4 pt-4">
                        <Button variant="ghost" onClick={onCancel} className="flex-1 h-14 text-brown-500 hover:text-brown-800 hover:bg-brown-50">
                            <ArrowLeft size={20} className="mr-2" /> Cancelar
                        </Button>
                        <Button
                            onClick={handleStart}
                            disabled={!name.trim()}
                            className="flex-[2] h-14 text-lg bg-brown-800 hover:bg-brown-900 text-white shadow-xl shadow-brown-200/50"
                        >
                            Iniciar Avaliação <ArrowRight size={20} className="ml-2" />
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default NameEntryView;
