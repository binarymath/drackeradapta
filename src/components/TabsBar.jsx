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
      className={`flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer whitespace-nowrap transition-colors border select-none ${isActive ? 'bg-brown-100 border-brown-300 text-brown-800 font-bold shadow-sm' : 'bg-brown-50 border-brown-100 text-brown-600 hover:bg-brown-100'}`}
    >
      <span className="text-sm max-w-[120px] truncate" title={tab.title}>
        {getTabLabel(tab)}
      </span>
      <button
        onClick={(e) => onClose(tab.id, e)}
        className="text-brown-400 hover:text-red-500 transition-colors ml-1 p-0.5 rounded-full hover:bg-brown-200/50"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
};

export const TabsBar = ({ tabs, activeTabId, onSelect, onClose, onReorder, getTabLabel }) => {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = tabs.findIndex(t => t.id === active.id);
    const newIndex = tabs.findIndex(t => t.id === over.id);
    const reordered = arrayMove(tabs, oldIndex, newIndex);
    onReorder(reordered);
  };

  return (
    <div className="flex flex-col gap-2 bg-white p-2 rounded-xl shadow-sm border border-brown-200">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={tabs.map(t => t.id)} strategy={horizontalListSortingStrategy}>
          <div className="flex gap-2 overflow-x-auto pb-2 px-1 scrollbar-thin scrollbar-thumb-brown-200 scrollbar-track-transparent">
            {tabs.map(tab => (
              <SortableTab
                key={tab.id}
                tab={tab}
                activeTabId={activeTabId}
                onSelect={onSelect}
                onClose={onClose}
                getTabLabel={getTabLabel}
              />
            ))}
            {tabs.length === 0 && <span className="text-sm text-brown-400 italic px-4 py-2">Nenhuma atividade gerada ainda...</span>}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
};
