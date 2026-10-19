import React from 'react';
import { useActivity } from '../contexts/ActivityContext';
import { 
    Music, 
    Play, 
    MessageSquare, 
    Compass, 
    ArrowLeftRight, 
    PieChart, 
    BarChart3,
    Dices,
    FileText,
    Grid,
    BookOpen
} from 'lucide-react';

export const Sidebar = ({
    activityType,
    setActivityType,
    showSettings,
    setShowSettings,
}) => {
    const { activityOptions, tabs, selectActivityTab, addActivityTab } = useActivity();

    const handleActivitySelect = (type) => {
        if (type === 'storybook') {
            const storybookTab = [...(tabs || [])].reverse().find(tab => tab.type === 'storybook' && !tab.hidden);
            if (storybookTab) {
                selectActivityTab(storybookTab.id);
                return;
            }

            const chatTab = (tabs || []).find(tab => tab.type === 'chat_dracker' && !tab.hidden);
            if (chatTab) {
                selectActivityTab(chatTab.id);
            } else {
                setActivityType('chat_dracker');
            }
            return;
        }

        if (type === 'simplify') {
            const radioTab = (tabs || []).find(t => t.type === 'simplify' && !t.musicData && !t.hidden);
            if (radioTab) {
                selectActivityTab(radioTab.id);
                return;
            } else if (addActivityTab) {
                addActivityTab({
                    title: "Rádio Drácker",
                    type: 'simplify',
                    content: 'Rádio Drácker - Músicas e Ritmos Pedagógicos',
                    data: {}
                });
                return;
            }
        }
        if (type === 'video_gallery') {
            const videoTab = (tabs || []).find(t => t.type === 'video_gallery' && !t.hidden);
            if (videoTab) {
                selectActivityTab(videoTab.id);
                return;
            } else if (addActivityTab) {
                addActivityTab({
                    title: "Galeria Drácker",
                    type: 'video_gallery',
                    content: 'Galeria de Vídeos',
                    data: {}
                });
                return;
            }
        }
        if (type === 'trading_cards' || type === 'trading_card') {
            const cardTab = (tabs || []).find(t => (t.type === 'trading_cards' || t.type === 'trading_card') && !t.hidden);
            if (cardTab) {
                selectActivityTab(cardTab.id);
                return;
            } else if (addActivityTab) {
                addActivityTab({
                    title: "Criador de Cards",
                    type: 'trading_cards',
                    content: 'Criador de Cards Colecionáveis Didáticos',
                    data: {}
                });
                return;
            }
        }
        setActivityType(type);
    };

    const priorityItems = [
        { id: 'about_system', label: 'Início', icon: <span className="text-xl">ℹ️</span> },
        { id: 'simplify', label: 'Rádio Drácker', icon: <Music className="w-5 h-5" /> },
        { id: 'video_gallery', label: 'Vídeos Interativos', icon: <Play className="w-5 h-5" /> },
        { id: 'roulette', label: 'Roleta', icon: <Dices className="w-5 h-5" /> },
        { id: 'rpg', label: 'RPG', icon: <Compass className="w-5 h-5" /> },
        { id: 'storybook', label: 'Storybook', icon: <BookOpen className="w-5 h-5" /> },
        { id: 'quiz', label: 'Quiz', icon: <FileText className="w-5 h-5" /> },
        { id: 'wordsearch', label: 'Caça Palavras', icon: <Grid className="w-5 h-5" /> },
        { id: 'crossword', label: 'Palavras Cruzadas', icon: <Grid className="w-5 h-5" /> },
    ];

    const remainingPredefined = [
        { id: 'summary', label: 'Metodologia Ativa', icon: <MessageSquare className="w-5 h-5" /> },
        { id: 'number_line', label: 'Reta Num', icon: <ArrowLeftRight className="w-5 h-5" /> },
        { id: 'fractions', label: 'Frações', icon: <PieChart className="w-5 h-5" /> },
    ];

    const handledIds = new Set([
        ...priorityItems.map(item => item.id),
        ...remainingPredefined.map(item => item.id),
        'chat_dracker',
        'reports'
    ]);

    const otherActivityOptions = (activityOptions || []).filter(opt => !handledIds.has(opt.id));

    const navLinks = [
        ...priorityItems,
        ...remainingPredefined,
        ...otherActivityOptions
    ];

    return (
        <div className="w-20 lg:w-24 h-screen bg-indigo-950 flex flex-col items-center py-6 gap-6 shadow-2xl z-50 rounded-r-3xl border-r border-indigo-900/50">
            {/* Logo */}
            <div 
                className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-amber-500 flex items-center justify-center font-black text-white text-2xl shadow-lg cursor-pointer transform hover:scale-105 transition-transform" 
                onClick={() => setActivityType('about_system')}
            >
                D
            </div>

            {/* Links */}
            <div className="flex-1 w-full flex flex-col items-center gap-2 overflow-y-auto no-scrollbar px-2 custom-scrollbar-hide">
                {navLinks.map((opt) => {
                    const isActive = activityType === opt.id;
                    
                    if (opt.url) {
                        return (
                            <a
                                key={opt.id}
                                href={opt.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full flex flex-col items-center gap-1.5 p-2 rounded-2xl transition-all text-indigo-300 hover:text-white hover:bg-indigo-800/50"
                                title={opt.label}
                            >
                                <span className="[&>svg]:w-6 [&>svg]:h-6 flex items-center justify-center">
                                    {opt.icon}
                                </span>
                                <span className="text-[9px] font-bold text-center leading-tight hidden lg:block px-1 break-normal w-full">
                                    {opt.label}
                                </span>
                            </a>
                        );
                    }

                    return (
                        <button
                            key={opt.id}
                            onClick={() => handleActivitySelect(opt.id)}
                            className={`w-full flex flex-col items-center gap-1.5 p-2 rounded-2xl transition-all relative ${
                                isActive 
                                    ? 'bg-indigo-600 text-white shadow-md' 
                                    : 'text-indigo-300 hover:text-white hover:bg-indigo-800/50'
                            }`}
                            title={opt.label}
                        >
                            <span className="[&>svg]:w-6 [&>svg]:h-6 flex items-center justify-center">
                                {opt.icon}
                            </span>
                            <span className="text-[9px] font-bold text-center leading-tight hidden lg:block px-1 break-normal w-full">
                                {opt.label}
                            </span>
                        </button>
                    );
                })}
            </div>
            
            {/* Reports bottom */}
            <div className="pt-4 border-t border-indigo-900/80 w-full flex justify-center px-2">
                <button
                    onClick={() => handleActivitySelect('reports')}
                    className={`w-full flex flex-col items-center gap-1.5 p-2 rounded-2xl transition-all relative ${
                        activityType === 'reports'
                            ? 'bg-amber-500 text-white shadow-md' 
                            : 'text-amber-300 hover:text-white hover:bg-amber-600/50'
                    }`}
                    title="Relatórios"
                >
                    <span className="[&>svg]:w-6 [&>svg]:h-6 flex items-center justify-center">
                        <BarChart3 className="w-6 h-6" />
                    </span>
                    <span className="text-[9px] font-bold text-center leading-tight hidden lg:block px-1 break-normal w-full">
                        Relatórios
                    </span>
                </button>
            </div>
        </div>
    );
};
