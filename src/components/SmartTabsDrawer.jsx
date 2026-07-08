import React, { useState, useMemo } from 'react';
import { Search, X, Pin, PinOff, Copy, Trash2, ArrowRight, Sparkles, Layers, CheckCircle2 } from 'lucide-react';

export const SmartTabsDrawer = ({
  isOpen,
  onClose,
  tabs,
  activeTabId,
  activityType,
  onSelectTab,
  onCloseTab,
  onPinTab,
  onDuplicateTab,
  onCloseOthers,
  onCloseAll
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const visibleTabs = useMemo(() => {
    return (tabs || []).filter(t => !t.hidden && t.type === activityType);
  }, [tabs, activityType]);

  const filteredTabs = useMemo(() => {
    if (!searchQuery.trim()) return visibleTabs;
    const query = searchQuery.toLowerCase();
    return visibleTabs.filter(t => {
      const titleMatch = (t.title || '').toLowerCase().includes(query);
      return titleMatch;
    });
  }, [visibleTabs, searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-brown-950/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md h-full bg-white/95 backdrop-blur-xl border-l border-brown-200/80 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-brown-200/60 bg-gradient-to-r from-brown-50/80 to-white">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brown-900 text-amber-300 flex items-center justify-center shadow-xs">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-brown-950 leading-tight">
                Gerenciador de Atividades
              </h3>
              <p className="text-xs font-semibold text-brown-500">
                {visibleTabs.length} {visibleTabs.length === 1 ? 'atividade aberta' : 'atividades abertas'} nesta sessão
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-brown-400 hover:text-brown-700 hover:bg-brown-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Bulk Actions Bar */}
        <div className="p-4 border-b border-brown-100/80 bg-brown-50/40 flex flex-col gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-brown-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por título da atividade..."
              className="w-full pl-9 pr-8 py-2 text-xs font-semibold rounded-xl border border-brown-200 bg-white text-brown-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-600 transition-all shadow-2xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-brown-400 hover:text-brown-700"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center justify-between gap-2">
            <button
              onClick={() => { onCloseOthers(activeTabId); onClose(); }}
              disabled={visibleTabs.length <= 1}
              className="flex-1 py-1.5 px-3 rounded-xl bg-amber-50 hover:bg-amber-100/80 text-amber-800 border border-amber-200/60 text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 shadow-2xs"
            >
              <span>Fechar Outras Abas</span>
            </button>
            <button
              onClick={() => { onCloseAll(activityType); onClose(); }}
              disabled={visibleTabs.length === 0}
              className="py-1.5 px-3 rounded-xl bg-red-50 hover:bg-red-100/80 text-red-700 border border-red-200/60 text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 shadow-2xs"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Limpar Todas</span>
            </button>
          </div>
        </div>

        {/* Tabs List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 scrollbar-thin scrollbar-thumb-brown-200 scrollbar-track-transparent">
          {filteredTabs.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-brown-400">
              <Sparkles className="w-10 h-10 mb-3 text-brown-300 animate-pulse" />
              <p className="text-sm font-bold text-brown-600">Nenhuma atividade encontrada</p>
              <p className="text-xs mt-1 text-brown-400">Tente buscar por outro termo ou crie uma nova atividade.</p>
            </div>
          ) : (
            filteredTabs.map(tab => {
              const isActive = tab.id === activeTabId;
              const dateStr = tab.createdAt ? new Date(tab.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

              return (
                <div
                  key={tab.id}
                  onClick={() => { onSelectTab(tab.id); onClose(); }}
                  className={`group relative flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-amber-50/90 via-white to-amber-50/90 border-amber-400/80 shadow-md ring-1 ring-amber-400/30'
                      : 'bg-white hover:bg-brown-50/70 border-brown-200/70 shadow-2xs hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      isActive ? 'bg-amber-500 text-white shadow-sm' : 'bg-brown-100 text-brown-700 group-hover:bg-brown-200'
                    }`}>
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm truncate ${isActive ? 'font-black text-brown-950' : 'font-bold text-brown-800'}`}>
                          {tab.title || 'Sem título'}
                        </span>
                        {tab.isPinned && (
                          <span className="shrink-0 flex items-center gap-0.5 bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded text-[10px] font-black">
                            Fixada
                          </span>
                        )}
                        {isActive && (
                          <span className="shrink-0 flex items-center gap-1 bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded text-[10px] font-black">
                            <CheckCircle2 className="w-3 h-3" />
                            Ativa
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-[11px] font-medium text-brown-400">
                        <span>{dateStr || 'Sessão atual'}</span>
                        <span>•</span>
                        <span className="capitalize">{tab.type === 'wordsearch' ? 'Caça-Palavras' : tab.type}</span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => onPinTab(tab.id)}
                      title={tab.isPinned ? "Desfixar" : "Fixar aba"}
                      className={`p-1.5 rounded-lg transition-colors ${
                        tab.isPinned ? 'text-amber-600 bg-amber-50 hover:bg-amber-100' : 'text-brown-400 hover:text-brown-700 hover:bg-brown-100'
                      }`}
                    >
                      {tab.isPinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
                    </button>

                    <button
                      onClick={() => onDuplicateTab(tab.id)}
                      title="Duplicar atividade"
                      className="p-1.5 rounded-lg text-brown-400 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={(e) => onCloseTab(tab.id, e)}
                      title="Fechar atividade"
                      className="p-1.5 rounded-lg text-brown-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => { onSelectTab(tab.id); onClose(); }}
                      className={`ml-1 p-1.5 rounded-xl ${
                        isActive ? 'bg-amber-500 text-white' : 'bg-brown-100 text-brown-700 group-hover:bg-brown-800 group-hover:text-white'
                      } transition-all`}
                    >
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-brown-200/60 bg-white/80 text-center">
          <p className="text-[11px] font-semibold text-brown-400">
            Dica: Dê um duplo clique diretamente no título da aba na barra para renomeá-la rapidamente.
          </p>
        </div>

      </div>
    </div>
  );
};
