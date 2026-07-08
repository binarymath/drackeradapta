import React, { useState, useRef, useEffect } from 'react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, horizontalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { X, ChevronLeft, ChevronRight, Layers, Sparkles, Pin, MoreVertical, CheckCircle2, RotateCcw } from 'lucide-react';
import { useActivity } from '../contexts/ActivityContext';
import { TabContextMenu } from './TabContextMenu';
import { SmartTabsDrawer } from './SmartTabsDrawer';

const SortableCapsuleTab = ({
  tab,
  activeTabId,
  onSelect,
  onClose,
  getTabLabel,
  isCollapsed,
  onContextMenu,
  onRename
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: tab.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || 'transform 250ms cubic-bezier(0.2, 0, 0, 1)',
  };

  const isActive = activeTabId === tab.id;
  const [isEditingInline, setIsEditingInline] = useState(false);
  const [inlineTitle, setInlineTitle] = useState(tab.title || '');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isEditingInline && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditingInline]);

  const handleInlineSave = () => {
    setIsEditingInline(false);
    if (inlineTitle.trim() && inlineTitle !== tab.title) {
      onRename(tab.id, inlineTitle.trim());
    } else {
      setInlineTitle(tab.title || '');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleInlineSave();
    if (e.key === 'Escape') {
      setIsEditingInline(false);
      setInlineTitle(tab.title || '');
    }
  };

  const numMatch = (tab.title || '').match(/#(\d+)$/);
  const collapsedLabel = numMatch ? `#${numMatch[1]}` : (tab.title || '').substring(0, 3).toUpperCase();

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => !isEditingInline && onSelect(tab.id)}
      onDoubleClick={(e) => {
        e.stopPropagation();
        setIsEditingInline(true);
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onContextMenu(e, tab);
      }}
      className={`group flex items-center gap-2 px-3.5 py-2 rounded-xl cursor-pointer whitespace-nowrap transition-all select-none relative shrink-0 ${
        isActive
          ? 'bg-gradient-to-r from-amber-50/95 via-white to-amber-50/95 text-brown-950 font-black shadow-md border border-amber-400/80 ring-1 ring-amber-400/30 z-20'
          : 'bg-white/70 hover:bg-white text-brown-600 hover:text-brown-900 font-bold border border-brown-200/60 hover:border-brown-300 shadow-2xs hover:shadow-xs mt-0.5'
      }`}
    >
      {tab.isPinned && (
        <Pin className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-amber-600' : 'text-amber-500'}`} />
      )}

      {isActive && !tab.isPinned && (
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
      )}

      <Sparkles className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-amber-500' : 'text-brown-400 group-hover:text-amber-600'}`} />

      {isEditingInline ? (
        <input
          ref={inputRef}
          type="text"
          value={inlineTitle}
          onChange={(e) => setInlineTitle(e.target.value)}
          onBlur={handleInlineSave}
          onKeyDown={handleKeyDown}
          onClick={(e) => e.stopPropagation()}
          className="w-28 sm:w-36 px-2 py-0.5 text-xs font-bold bg-white border border-amber-500 rounded-lg text-brown-950 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
        />
      ) : isCollapsed && !isActive ? (
        <span className="text-xs font-extrabold tracking-tight px-0.5">
          {collapsedLabel}
        </span>
      ) : (
        <span className="text-xs max-w-[160px] sm:max-w-[190px] truncate" title={`${tab.title || 'Atividade'} (Duplo clique para renomear)`}>
          {getTabLabel ? getTabLabel(tab) : (tab.title || 'Sem título')}
        </span>
      )}

      <button
        onClick={(e) => {
          e.stopPropagation();
          onContextMenu(e, tab);
        }}
        className={`p-1 rounded-lg transition-colors opacity-0 group-hover:opacity-100 ${
          isActive ? 'text-brown-500 hover:bg-amber-100 hover:text-brown-950' : 'text-brown-400 hover:bg-brown-100 hover:text-brown-800'
        }`}
        title="Mais opções da atividade"
      >
        <MoreVertical className="w-3 h-3" />
      </button>

      <button
        onClick={(e) => onClose(tab.id, e)}
        className={`p-1 rounded-lg transition-colors ml-0.5 ${
          isActive
            ? 'text-brown-400 hover:text-red-600 hover:bg-red-50'
            : 'text-transparent group-hover:text-brown-400 hover:!text-red-600 hover:bg-red-50'
        }`}
        title="Fechar atividade"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

export const TabsBar = ({ tabs, activeTabId, activityType, onSelect, onClose, onReorder, getTabLabel }) => {
  const {
    renameTab,
    pinTab,
    duplicateTab,
    closeOtherTabs,
    closeAllTabs,
    reopenTab,
    reopenLastClosedTab,
    deleteTab
  } = useActivity();

  const visibleTabs = (tabs || []).filter(t => !t.hidden && t.type === activityType);
  const closedTabs = (tabs || []).filter(t => t.hidden && t.type === activityType);

  const scrollContainerRef = useRef(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  const [contextMenuState, setContextMenuState] = useState({ isOpen: false, x: 0, y: 0, tab: null });
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const isSmartCollapsingActive = visibleTabs.length > 5;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const checkOverflow = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setShowLeftArrow(scrollLeft > 10);
      setShowRightArrow(scrollWidth - clientWidth - scrollLeft > 10);
    }
  };

  useEffect(() => {
    checkOverflow();
    window.addEventListener('resize', checkOverflow);
    return () => window.removeEventListener('resize', checkOverflow);
  }, [visibleTabs, activeTabId]);

  const handleScroll = (direction) => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -220 : 220;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = visibleTabs.findIndex(t => t.id === active.id);
    const newIndex = visibleTabs.findIndex(t => t.id === over.id);
    const reorderedVisible = arrayMove(visibleTabs, oldIndex, newIndex);

    const otherTabs = tabs.filter(t => t.hidden || t.type !== activityType);
    onReorder([...reorderedVisible, ...otherTabs]);
  };

  const handleOpenContextMenu = (e, tab) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setContextMenuState({
      isOpen: true,
      x: rect.left,
      y: rect.bottom + 6,
      tab
    });
  };

  return (
    <div className="w-full flex items-center justify-between gap-1.5 p-1.5 bg-white/70 backdrop-blur-md border border-brown-200/70 rounded-2xl shadow-sm mb-3 transition-all select-none">
      
      {showLeftArrow && (
        <button
          onClick={() => handleScroll('left')}
          className="flex items-center justify-center w-8 h-8 rounded-xl bg-brown-100 hover:bg-brown-200 text-brown-800 shadow-2xs transition-colors shrink-0"
          title="Rolar abas para a esquerda"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={visibleTabs.map(t => t.id)} strategy={horizontalListSortingStrategy}>
          <div
            ref={scrollContainerRef}
            onScroll={checkOverflow}
            className="flex-1 flex items-center gap-1.5 overflow-x-auto no-scrollbar px-1 py-0.5 scroll-smooth"
          >
            {visibleTabs.map(tab => (
              <SortableCapsuleTab
                key={tab.id}
                tab={tab}
                activeTabId={activeTabId}
                onSelect={onSelect}
                onClose={onClose}
                getTabLabel={getTabLabel}
                isCollapsed={isSmartCollapsingActive}
                onContextMenu={handleOpenContextMenu}
                onRename={renameTab}
              />
            ))}
            {visibleTabs.length === 0 && (
              <span className="text-xs text-brown-400 font-semibold italic px-4 py-2">
                Nenhuma atividade gerada nesta sessão ainda...
              </span>
            )}
          </div>
        </SortableContext>
      </DndContext>

      {showRightArrow && (
        <button
          onClick={() => handleScroll('right')}
          className="flex items-center justify-center w-8 h-8 rounded-xl bg-brown-100 hover:bg-brown-200 text-brown-800 shadow-2xs transition-colors shrink-0"
          title="Rolar abas para a direita"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      )}

      {/* Botões do Canto Direito */}
      <div className="flex items-center gap-1.5 shrink-0">
        
        {/* Botão Reabrir Aba Fechada */}
        {closedTabs.length > 0 && (
          <button
            onClick={() => reopenLastClosedTab(activityType)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-2xs transition-all border border-emerald-500 animate-in fade-in zoom-in duration-200"
            title={`Reabrir última atividade fechada (${closedTabs.length} no histórico)`}
          >
            <RotateCcw className="w-3.5 h-3.5 animate-spin-once" />
            <span className="hidden sm:inline">Reabrir</span>
            <span className="bg-emerald-800 text-amber-200 px-1.5 py-0.5 rounded text-[10px] font-black">
              {closedTabs.length}
            </span>
          </button>
        )}

        {/* Botão Gaveta 'Todas as Abas (X)' */}
        <button
          onClick={() => setIsDrawerOpen(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-brown-900 hover:bg-brown-950 text-white text-xs font-extrabold shadow-2xs transition-all border border-brown-700/60"
          title="Abrir gerenciador avançado de abas (Todas as atividades abertas e histórico)"
        >
          <Layers className="w-3.5 h-3.5 text-amber-300" />
          <span>Todas ({visibleTabs.length})</span>
        </button>

      </div>

      {contextMenuState.isOpen && (
        <TabContextMenu
          x={contextMenuState.x}
          y={contextMenuState.y}
          tab={contextMenuState.tab}
          onClose={() => setContextMenuState(prev => ({ ...prev, isOpen: false }))}
          onPin={pinTab}
          onRename={(id) => {
            setContextMenuState(prev => ({ ...prev, isOpen: false }));
            const t = visibleTabs.find(item => item.id === id);
            if (t) {
              const newTitle = window.prompt("Digite o novo nome para a atividade:", t.title || '');
              if (newTitle && newTitle.trim()) {
                renameTab(id, newTitle.trim());
              }
            }
          }}
          onDuplicate={duplicateTab}
          onCloseOthers={closeOtherTabs}
          onCloseAll={closeAllTabs}
        />
      )}

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
