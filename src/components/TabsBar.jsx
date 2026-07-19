import React, { useState } from 'react';
import { Layers, Sparkles, Loader2 } from 'lucide-react';
import { useActivity } from '../contexts/ActivityContext';
import { SmartTabsDrawer } from './SmartTabsDrawer';
import { getSmartActionConfig } from '../utils/smartActionConfig';

export const TabsBar = ({ 
    tabs, 
    activeTabId, 
    activityType, 
    onSelect, 
    onClose, 
    onReorder, 
    getTabLabel,
    onGenerate,
    isLoading 
}) => {
    const {
        pinTab,
        duplicateTab,
        closeOtherTabs,
        closeAllTabs,
        reopenTab,
        deleteTab
    } = useActivity();

    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    return (
        <div className="w-full flex items-center justify-between gap-3 p-2 bg-white/80 backdrop-blur-md border border-brown-200/80 rounded-2xl shadow-sm mb-4 transition-all select-none">
            {/* Botão de Ação / Gerar no Topo da Sessão */}
            {activityType !== 'video_gallery' ? (() => {
                const config = getSmartActionConfig(activityType, isLoading);
                const IconComponent = config.icon || Sparkles;
                return (
                    <button
                        onClick={onGenerate}
                        disabled={config.disabled || isLoading}
                        className={`flex-1 py-3 px-4 sm:px-5 rounded-xl flex items-center justify-between transition-all select-none group shadow-sm hover:shadow transition-transform active:scale-[0.99] ${config.className}`}
                    >
                        <div className="flex items-center gap-3 sm:gap-4 text-left min-w-0 pr-2">
                            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-white/20 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-inner">
                                {isLoading ? (
                                    <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin text-white" />
                                ) : (
                                    <IconComponent className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                                )}
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="text-sm sm:text-base font-black tracking-tight leading-tight truncate text-white">
                                    {config.label}
                                </div>
                                {config.sublabel && (
                                    <div className="text-xs sm:text-sm font-medium opacity-95 truncate mt-0.5 text-white/95 hidden sm:block">
                                        {config.sublabel}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="hidden md:flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white/15 hover:bg-white/25 text-white text-xs sm:text-sm font-extrabold shrink-0 transition-colors border border-white/20">
                            <span>Executar</span>
                            <span className="text-base leading-none">✨</span>
                        </div>
                    </button>
                );
            })() : <div className="flex-1"></div>}

            {/* Botão Gaveta 'Atividades' no Canto Direito */}
            <button
                onClick={() => setIsDrawerOpen(true)}
                className="flex items-center justify-center gap-2 px-4 sm:px-6 py-3 sm:py-3.5 rounded-xl bg-brown-900 hover:bg-brown-950 text-white text-xs sm:text-sm font-extrabold shadow-sm hover:shadow transition-all border border-brown-700/60 shrink-0 self-stretch active:scale-95"
                title="Abrir gerenciador de atividades (atividades abertas e histórico)"
            >
                <Layers className="w-4 h-4 sm:w-5 sm:h-5 text-amber-300 shrink-0" />
                <span className="whitespace-nowrap tracking-wide">Atividades</span>
            </button>

            <SmartTabsDrawer
                isOpen={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                tabs={tabs}
                activeTabId={activeTabId}
                activityType={activityType}
                onSelectTab={onSelect}
                onCloseTab={onClose}
                onPinTab={pinTab}
                onDuplicateTab={duplicateTab}
                onCloseOthers={closeOtherTabs}
                onCloseAll={closeAllTabs}
                onReopenTab={reopenTab}
                onDeleteTab={deleteTab}
            />
        </div>
    );
};
