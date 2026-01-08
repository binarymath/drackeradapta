
import React from 'react';
import { Book, CheckCircle, Star, Heart, Dice5, Trophy, ArrowLeft } from 'lucide-react';
import { Button } from '../ui/Button';

// Nota: Vamos adaptar o design para usar os componentes de UI existentes do projeto (Button, Card, etc) onde possível,
// mas mantendo a estética visual original que o usuário gostou, com talvez algumas melhorias de consistência.

export const RulesScreen = ({ onBack }) => {
    return (
        <div className="animate-fade-in space-y-6">
            <div className="bg-brown-900 text-white p-6 rounded-xl shadow-xl border-b-4 border-amber-500 flex justify-between items-center print:bg-white print:text-black print:border-black">
                <div>
                    <h2 className="text-3xl font-bold text-amber-400 flex items-center gap-3 print:text-black">
                        <Book size={32} /> Grimório de Regras
                    </h2>
                </div>
                <div className="flex gap-2 print:hidden">
                    <Button onClick={() => window.print()} variant="secondary" className="gap-2">
                        <Book size={16} /> Imprimir
                    </Button>
                    <Button onClick={onBack} variant="primary" className="gap-2 bg-amber-600 hover:bg-amber-700 border-amber-800">
                        <ArrowLeft size={16} /> Voltar
                    </Button>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-md border border-brown-200 print:shadow-none print:border-black h-full">
                    <h3 className="font-bold text-xl text-brown-800 mb-4 flex items-center gap-2 border-b border-brown-100 pb-2">
                        <Trophy className="text-green-600" /> O Mérito (Resposta)
                    </h3>
                    <table className="w-full text-sm">
                        <thead className="bg-brown-50 text-brown-500 uppercase text-xs print:bg-gray-200">
                            <tr><th className="py-2 px-3 text-left rounded-l">Ação</th><th className="py-2 px-3 text-right rounded-r">XP</th></tr>
                        </thead>
                        <tbody className="divide-y divide-brown-50">
                            <tr><td className="py-3 px-3 font-medium text-brown-800 flex items-center gap-2"><CheckCircle size={14} className="text-green-600" /> Resposta Correta</td><td className="py-3 px-3 text-right font-bold text-green-600">+50 XP</td></tr>
                            <tr><td className="py-3 px-3 font-medium text-brown-800 flex items-center gap-2"><Star size={14} className="text-amber-500" /> Resposta Completa</td><td className="py-3 px-3 text-right font-bold text-amber-600">+20 XP</td></tr>
                            <tr><td className="py-3 px-3 font-medium text-brown-800 flex items-center gap-2"><Heart size={14} className="text-blue-500" /> Cooperação/Silêncio</td><td className="py-3 px-3 text-right font-bold text-blue-600">+10 XP</td></tr>
                        </tbody>
                    </table>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-md border border-brown-200 print:shadow-none print:border-black h-full">
                    <h3 className="font-bold text-xl text-brown-800 flex items-center gap-2 mb-4 border-b border-brown-100 pb-2">
                        <Dice5 className="text-purple-600" /> O Dado (Sorte)
                    </h3>
                    <div className="space-y-4">
                        <div className="flex items-center gap-4 p-3 rounded-lg border border-brown-200 bg-brown-50">
                            <div className="w-12 h-12 bg-brown-200 text-brown-500 font-bold text-xl flex items-center justify-center rounded-lg border-2 border-brown-300">1</div>
                            <div className="flex-1"><div className="flex justify-between items-center"><strong className="text-brown-700">Tropeço</strong><span className="font-bold text-brown-400 bg-brown-100 px-2 py-1 rounded">+0 XP</span></div></div>
                        </div>
                        <div className="flex items-center gap-4 p-3 rounded-lg border border-blue-100 bg-blue-50">
                            <div className="w-12 h-12 bg-blue-100 text-blue-600 font-bold text-xl flex items-center justify-center rounded-lg border-2 border-blue-200">2-3</div>
                            <div className="flex-1"><div className="flex justify-between items-center"><strong className="text-blue-800">Raspando</strong><span className="font-bold text-blue-600 bg-blue-100 px-2 py-1 rounded">+10 XP</span></div></div>
                        </div>
                        <div className="flex items-center gap-4 p-3 rounded-lg border border-green-100 bg-green-50">
                            <div className="w-12 h-12 bg-green-100 text-green-700 font-bold text-xl flex items-center justify-center rounded-lg border-2 border-green-300">4-5</div>
                            <div className="flex-1"><div className="flex justify-between items-center"><strong className="text-green-800">Belo Golpe!</strong><span className="font-bold text-green-600 bg-green-100 px-2 py-1 rounded">+30 XP</span></div></div>
                        </div>
                        <div className="flex items-center gap-4 p-3 rounded-lg border border-amber-100 bg-amber-50 shadow-sm">
                            <div className="w-12 h-12 bg-amber-500 text-white font-bold text-xl flex items-center justify-center rounded-lg shadow-md border-2 border-amber-400">6</div>
                            <div className="flex-1"><div className="flex justify-between items-center"><strong className="text-amber-800">CRÍTICO!</strong><span className="font-bold text-amber-600 bg-amber-100 px-2 py-1 rounded">+50 XP</span></div></div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-brown-800 text-brown-300 p-8 rounded-xl shadow-xl border-t-4 border-amber-500 print:bg-white print:text-black print:border-2 print:border-black">
                <h4 className="text-2xl font-bold text-amber-400 mb-6 flex items-center justify-center gap-3 print:text-black"><Trophy size={28} /> Ranking Final da Aventura</h4>
                <div className="grid md:grid-cols-3 gap-6 text-center">
                    <div className="p-4 border-2 border-brown-600 rounded-xl bg-brown-700 flex flex-col items-center print:bg-brown-100 print:border-brown-400">
                        <span className="text-brown-400 font-bold uppercase tracking-widest text-sm mb-2 print:text-brown-600">Nível 1</span>
                        <div className="text-2xl font-bold text-white mb-1 print:text-black">Aprendiz</div>
                        <div className="bg-brown-600 px-3 py-1 rounded text-sm text-brown-300 font-mono print:bg-white print:text-black print:border">0 - 200 XP</div>
                    </div>
                    <div className="p-4 border-2 border-blue-500 rounded-xl bg-blue-900/20 flex flex-col items-center print:bg-blue-50 print:border-blue-300">
                        <span className="text-blue-400 font-bold uppercase tracking-widest text-sm mb-2 print:text-blue-800">Nível 2</span>
                        <div className="text-3xl font-bold text-blue-100 mb-1 print:text-black">Mestre</div>
                        <div className="bg-blue-900/50 px-3 py-1 rounded text-sm text-blue-200 font-mono print:bg-white print:text-black print:border-blue-200">201 - 400 XP</div>
                    </div>
                    <div className="p-4 border-2 border-amber-500 rounded-xl bg-amber-900/20 flex flex-col items-center print:bg-amber-50 print:border-amber-400">
                        <span className="text-amber-400 font-bold uppercase tracking-widest text-sm mb-2 print:text-amber-800">Nível 3</span>
                        <div className="text-4xl font-bold text-amber-100 mb-1 print:text-black">Lenda</div>
                        <div className="bg-amber-900/50 px-3 py-1 rounded text-sm text-amber-200 font-mono print:bg-white print:text-black print:border-amber-200">401+ XP</div>
                    </div>
                </div>
            </div>
        </div>
    );
};
