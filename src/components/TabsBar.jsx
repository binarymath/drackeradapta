import React from 'react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, horizontalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { X } from 'lucide-react';

const SortableTab = ({ tab, activeTabId, onSelect, onClose, getTabLabel }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: tab.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isActive = activeTabId === tab.id;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onSelect(tab.id)}
      className={`group flex items-center gap-2 px-4 py-2 rounded-t-xl cursor-pointer whitespace-nowrap transition-all select-none relative ${isActive ? 'bg-white text-brown-800 font-bold shadow-[0_-4px_12px_rgba(146,64,14,0.08)] z-10 before:absolute before:top-0 before:left-0 before:right-0 before:h-[3px] before:bg-brown-500 before:rounded-t-xl' : 'bg-brown-100/40 text-brown-500 hover:bg-brown-100/80 hover:text-brown-700 mt-1'}`}
    >
      <span className="text-sm max-w-[140px] truncate" title={tab.title}>
        {getTabLabel(tab)}
      </span>
      <button
        onClick={(e) => onClose(tab.id, e)}
        className={`p-0.5 rounded-full transition-colors ml-1 ${isActive ? 'text-brown-400 hover:text-red-500 hover:bg-red-50' : 'text-transparent group-hover:text-brown-400 hover:!text-red-500 hover:bg-red-50'}`}
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
};

export const TabsBar = ({ tabs, activeTabId, activityType, onSelect, onClose, onReorder, getTabLabel }) => {
  const visibleTabs = tabs.filter(t => !t.hidden && t.type === activityType);
  
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = visibleTabs.findIndex(t => t.id === active.id);
    const newIndex = visibleTabs.findIndex(t => t.id === over.id);
    const reorderedVisible = arrayMove(visibleTabs, oldIndex, newIndex);
    
    // Reconstruct the full array preserving hidden and other-type tabs
    const otherTabs = tabs.filter(t => t.hidden || t.type !== activityType);
    onReorder([...reorderedVisible, ...otherTabs]);
  };

  return (
    <div className="flex flex-col w-full px-2 pt-2 bg-gradient-to-t from-white to-brown-50/50 rounded-t-2xl border-b border-brown-200">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={visibleTabs.map(t => t.id)} strategy={horizontalListSortingStrategy}>
          <div className="flex items-end gap-1 overflow-x-auto px-2 scrollbar-thin scrollbar-thumb-brown-200 scrollbar-track-transparent">
            {visibleTabs.map(tab => (
              <SortableTab
                key={tab.id}
                tab={tab}
                activeTabId={activeTabId}
                onSelect={onSelect}
                onClose={onClose}
                getTabLabel={getTabLabel}
              />
            ))}
            {visibleTabs.length === 0 && <span className="text-[13px] text-brown-400 italic px-4 py-2">Nenhuma atividade gerada ainda...</span>}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
};
