import React from 'react';
import { useActivity } from '../contexts/ActivityContext';
import { Music, Play, MessageSquare, Compass, ArrowLeftRight, PieChart, BarChart3 } from 'lucide-react';

export const Sidebar = ({
    activityType,
    setActivityType,
    showSettings,
    setShowSettings,
}) => {
    const { activityOptions } = useActivity();

    const handleActivitySelect = (type) => {
        setActivityType(type);
    };

    const navLinks = [
        { id: 'about_system', label: 'Início', icon: <span className="text-xl">ℹ️</span> },
        { id: 'summary', label: 'Metodologia Ativa', icon: <MessageSquare className="w-5 h-5" /> },
        { id: 'rpg', label: 'RPG', icon: <Compass className="w-5 h-5" /> },
        { id: 'number_line', label: 'Reta Num', icon: <ArrowLeftRight className="w-5 h-5" /> },
        { id: 'fractions', label: 'Frações', icon: <PieChart className="w-5 h-5" /> },
        ...activityOptions.filter(opt => 
            opt.id !== 'summary' && 
            opt.id !== 'rpg' && 
            opt.id !== 'number_line' && 
            opt.id !== 'fractions' && 
            opt.id !== 'about_system' && 
            opt.id !== 'chat_dracker' && 
            opt.id !== 'video_gallery' && 
            opt.id !== 'simplify'
        )
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
