import React, { useState, useMemo } from 'react';
import { Search, X, Pin, PinOff, Copy, Trash2, ArrowRight, Sparkles, Layers, CheckCircle2, RotateCcw, History } from 'lucide-react';

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
  onCloseAll,
  onReopenTab,
  onDeleteTab
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSection, setActiveSection] = useState('open'); // 'open' | 'closed'

  const visibleTabs = useMemo(() => {
    return (tabs || []).filter(t => !t.hidden && t.type === activityType);
  }, [tabs, activityType]);

  const closedTabs = useMemo(() => {
    return (tabs || []).filter(t => t.hidden && t.type === activityType).sort((a, b) => (b.closedAt || 0) - (a.closedAt || 0));
  }, [tabs, activityType]);

  const filteredTabs = useMemo(() => {
    const list = activeSection === 'open' ? visibleTabs : closedTabs;
    if (!searchQuery.trim()) return list;
    const query = searchQuery.toLowerCase();
    return list.filter(t => {
      return (t.title || '').toLowerCase().includes(query);
    });
  }, [visibleTabs, closedTabs, activeSection, searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-brown-950/40 backdrop-blur-xs animate-in fade-in duration-200 select-none text-brown-900">
      <div className="w-full max-w-md h-full bg-white/95 backdrop-blur-xl border-l border-brown-200/80 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="flex flex-col p-5 pb-3 border-b border-brown-200/60 bg-gradient-to-r from-brown-50/80 to-white gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-brown-900 text-amber-300 flex items-center justify-center shadow-xs">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-brown-950 leading-tight">
                  Gerenciador de Atividades
                </h3>
                <p className="text-xs font-semibold text-brown-500">
                  {visibleTabs.length} abertas • {closedTabs.length} no histórico recente
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

          {/* Section Switcher (Abertas vs Fechadas) */}
          <div className="flex items-center gap-1.5 p-1 bg-brown-100/60 rounded-xl border border-brown-200/50">
            <button
              onClick={() => setActiveSection('open')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                activeSection === 'open'
                  ? 'bg-white text-brown-950 shadow-xs'
                  : 'text-brown-600 hover:text-brown-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-amber-600" />
              <span>Abertas ({visibleTabs.length})</span>
            </button>

            <button
              onClick={() => setActiveSection('closed')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                activeSection === 'closed'
                  ? 'bg-white text-brown-950 shadow-xs'
                  : 'text-brown-600 hover:text-brown-900'
              }`}
            >
              <History className="w-3.5 h-3.5 text-indigo-600" />
              <span>Fechadas ({closedTabs.length})</span>
            </button>
          </div>
        </div>

        {/* Search & Bulk Actions Bar */}
        <div className="p-4 border-b border-brown-100/80 bg-brown-50/40 flex flex-col gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-brown-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={activeSection === 'open' ? "Buscar por título da atividade aberta..." : "Buscar no histórico de abas fechadas..."}
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

          {activeSection === 'open' ? (
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
          ) : (
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-semibold text-brown-500 italic px-1">
                Clique no botão de recarregar para restaurar a atividade de onde parou.
              </span>
            </div>
          )}
        </div>

        {/* Tabs List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 scrollbar-thin scrollbar-thumb-brown-200 scrollbar-track-transparent">
          {filteredTabs.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-brown-400">
              <Sparkles className="w-10 h-10 mb-3 text-brown-300 animate-pulse" />
              <p className="text-sm font-bold text-brown-600">
                {activeSection === 'open' ? 'Nenhuma atividade aberta encontrada' : 'Nenhuma atividade no histórico recente'}
              </p>
              <p className="text-xs mt-1 text-brown-400">
                {activeSection === 'open' ? 'Tente buscar por outro termo ou crie uma nova atividade.' : 'As atividades que você fechar nesta sessão aparecerão aqui para serem reabertas.'}
              </p>
            </div>
          ) : (
            filteredTabs.map(tab => {
              const isActive = tab.id === activeTabId;
              const dateStr = tab.closedAt
                ? `Fechada às ${new Date(tab.closedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                : tab.createdAt
                ? new Date(tab.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : '';

              return (
                <div
                  key={tab.id}
                  onClick={() => {
                    if (activeSection === 'open') {
                      onSelectTab(tab.id);
                      onClose();
                    } else if (onReopenTab) {
                      onReopenTab(tab.id);
                      onClose();
                    }
                  }}
                  className={`group relative flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    activeSection === 'closed'
                      ? 'bg-brown-50/50 hover:bg-white border-brown-200/60 shadow-2xs opacity-80 hover:opacity-100'
                      : isActive
                      ? 'bg-gradient-to-r from-amber-50/90 via-white to-amber-50/90 border-amber-400/80 shadow-md ring-1 ring-amber-400/30'
                      : 'bg-white hover:bg-brown-50/70 border-brown-200/70 shadow-2xs hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      activeSection === 'closed' ? 'bg-brown-200 text-brown-600' : isActive ? 'bg-amber-500 text-white shadow-sm' : 'bg-brown-100 text-brown-700 group-hover:bg-brown-200'
                    }`}>
                      {activeSection === 'closed' ? <History className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm truncate ${isActive ? 'font-black text-brown-950' : 'font-bold text-brown-800'}`}>
                          {tab.title || 'Sem título'}
                        </span>
                        {tab.isPinned && activeSection === 'open' && (
                          <span className="shrink-0 flex items-center gap-0.5 bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded text-[10px] font-black">
                            Fixada
                          </span>
                        )}
                        {isActive && activeSection === 'open' && (
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

                  {/* Actions according to section */}
                  {activeSection === 'open' ? (
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
                  ) : (
                    <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => { if (onReopenTab) { onReopenTab(tab.id); onClose(); } }}
                        title="Reabrir esta atividade exatamente de onde parou"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-xs transition-all"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Reabrir</span>
                      </button>

                      <button
                        onClick={(e) => { if (onDeleteTab) onDeleteTab(tab.id, e); }}
                        title="Excluir do histórico permanentemente"
                        className="p-1.5 rounded-lg text-brown-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-brown-200/60 bg-white/80 text-center">
          <p className="text-[11px] font-semibold text-brown-400">
            {activeSection === 'open'
              ? 'Dica: Dê um duplo clique diretamente no título da aba na barra para renomeá-la rapidamente.'
              : 'Dica: Você também pode usar o botão "Reabrir Fechada" na barra principal para restaurar a última atividade de imediato.'}
          </p>
        </div>

      </div>
    </div>
  );
};
