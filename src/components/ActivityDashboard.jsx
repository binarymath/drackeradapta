import React from 'react';
import { PlusCircle, Search, FileText, Pencil, Trash2, BrainCircuit, Music, Play, LayoutGrid } from 'lucide-react';
import { Card } from './ui/Card';

export const ActivityDashboard = ({ tabs, onSelect, onCreateNew, onDeleteTab, onEditTab }) => {
    
    // Helper to get an icon based on activity type
    const getActivityIcon = (type) => {
        switch (type) {
            case 'wordsearch': return <Search className="w-8 h-8 text-amber-500" />;
            case 'quiz': return <BrainCircuit className="w-8 h-8 text-indigo-500" />;
            case 'simplify': return <Music className="w-8 h-8 text-rose-500" />;
            case 'video_gallery': return <Play className="w-8 h-8 text-red-500" />;
            default: return <FileText className="w-8 h-8 text-slate-500" />;
        }
    };

    const getBgColor = (type) => {
        switch (type) {
            case 'wordsearch': return 'bg-amber-50 group-hover:bg-amber-100/50';
            case 'quiz': return 'bg-indigo-50 group-hover:bg-indigo-100/50';
            case 'simplify': return 'bg-rose-50 group-hover:bg-rose-100/50';
            case 'video_gallery': return 'bg-red-50 group-hover:bg-red-100/50';
            default: return 'bg-slate-50 group-hover:bg-slate-100/50';
        }
    };

    return (
        <div className="w-full h-full p-4 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col">
            
            <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-brown-100 rounded-2xl text-brown-600 border-2 border-brown-200 shadow-sm">
                    <LayoutGrid className="w-8 h-8" />
                </div>
                <div>
                    <h2 className="text-3xl font-black text-brown-900 tracking-tight font-handwritten">Minhas Atividades</h2>
                    <p className="text-brown-600 font-medium">Veja e gerencie as atividades que você já criou nesta sessão.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-24 overflow-y-auto">
                
                {tabs.filter(t => !['dashboard', 'about_system', 'home'].includes(t.type)).map((tab) => (
                    <div 
                        key={tab.id}
                        onClick={() => onSelect(tab.id)}
                        className="group relative cursor-pointer"
                    >
                        <Card className={`h-full border-2 border-slate-200/60 p-6 flex flex-col gap-4 transition-all duration-300 hover:shadow-xl hover:-translate-y-1.5 hover:border-slate-300 ${getBgColor(tab.type)}`}>
                            {/* Action Buttons */}
                            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all z-10">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (onEditTab) onEditTab(tab);
                                    }}
                                    className="p-2 rounded-full bg-white/80 border border-slate-200 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 transition-all hover:scale-110 active:scale-95 shadow-sm"
                                    title="Editar atividade"
                                >
                                    <Pencil className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDeleteTab(tab.id);
                                    }}
                                    className="p-2 rounded-full bg-white/80 border border-slate-200 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all hover:scale-110 active:scale-95 shadow-sm"
                                    title="Excluir atividade"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="bg-white w-16 h-16 rounded-2xl flex items-center justify-center border-2 border-slate-100 shadow-sm group-hover:scale-110 transition-transform duration-300">
                                {getActivityIcon(tab.type)}
                            </div>
                            
                            <div className="flex-1 mt-2">
                                <h3 className="font-bold text-lg text-slate-800 line-clamp-2 leading-tight">
                                    {tab.title || "Atividade Sem Nome"}
                                </h3>
                                <p className="text-xs font-bold text-slate-500 mt-2 uppercase tracking-wider">
                                    {(() => {
                                        const isPt = navigator.language.startsWith('pt');
                                        const labels = {
                                            'wordsearch': isPt ? 'Caça-Palavras' : 'Wordsearch',
                                            'quiz': 'Quiz',
                                            'quiz_game': 'Quiz',
                                            'simplify': isPt ? 'Música' : 'Music',
                                            'connect_dots': isPt ? 'Ligar os Pontos' : 'Connect Dots',
                                            'domino': isPt ? 'Dominó' : 'Dominoes',
                                            'domino_game': isPt ? 'Dominó' : 'Dominoes',
                                            'video_gallery': isPt ? 'Galeria de Vídeos' : 'Video Gallery',
                                            'crossword': isPt ? 'Palavras Cruzadas' : 'Crossword',
                                            'merge_pdf': isPt ? 'Mesclar PDF' : 'Merge PDF',
                                            'memory': isPt ? 'Jogo da Memória' : 'Memory Game',
                                            'hangman': isPt ? 'Forca' : 'Hangman',
                                            'rpg': 'RPG',
                                            'chat_dracker': isPt ? 'Conversa com Drácker' : 'Chat',
                                            'trading_cards': 'Trading Cards',
                                            'number_line': isPt ? 'Reta Numérica' : 'Number Line',
                                            'fractions': isPt ? 'Frações' : 'Fractions',
                                            'roulette': isPt ? 'Roleta' : 'Roulette'
                                        };
                                        return labels[tab.type] || tab.type.replace('_', ' ');
                                    })()}
                                </p>
                            </div>
                        </Card>
                    </div>
                ))}

                {/* Create New Card */}
                <div 
                    onClick={onCreateNew}
                    className="cursor-pointer group"
                >
                    <div className="h-full min-h-[220px] rounded-3xl border-4 border-dashed border-brown-200/70 bg-transparent p-6 flex flex-col items-center justify-center gap-4 transition-all duration-300 hover:bg-brown-50/50 hover:border-brown-400 hover:-translate-y-1.5 hover:shadow-lg">
                        <div className="bg-brown-100 text-brown-500 p-4 rounded-full group-hover:scale-110 group-hover:bg-brown-500 group-hover:text-white transition-all duration-300 shadow-sm">
                            <PlusCircle className="w-8 h-8" />
                        </div>
                        <span className="font-bold text-brown-600 text-lg group-hover:text-brown-800 transition-colors">Nova Atividade</span>
                    </div>
                </div>

            </div>
        </div>
    );
};
