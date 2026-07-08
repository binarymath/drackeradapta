import React, { useState } from 'react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Trash2, ExternalLink, Pencil, Check, X } from 'lucide-react';
import { Input } from './ui/Input';

export const TabSelectionModal = ({ isOpen, tabs, onSelect, onCreateNew, onClose, onDelete, onUpdate }) => {
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');

  // Sort tabs by most recent first robustly
  const sortedTabs = [...tabs].sort((a, b) => {
    const getTimestamp = (tab) => {
      if (tab.createdAt && !isNaN(new Date(tab.createdAt).getTime())) {
        return new Date(tab.createdAt).getTime();
      }
      const digits = String(tab.id).replace(/\D/g, '');
      const num = parseInt(digits, 10);
      return (!isNaN(num) && num > 1000000000000) ? num : 0;
    };
    return getTimestamp(b) - getTimestamp(a);
  });

  const formatDate = (timestamp, tab) => {
    let date;
    if (tab && tab.createdAt && !isNaN(new Date(tab.createdAt).getTime())) {
      date = new Date(tab.createdAt);
    } else {
      const digits = String(timestamp).replace(/\D/g, '');
      const num = parseInt(digits, 10);
      if (!isNaN(num) && num > 1000000000000) {
        date = new Date(num);
      }
    }
    if (!date || isNaN(date.getTime())) {
      return 'Sessão atual';
    }
    try {
      return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch (e) {
      return 'Sessão atual';
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Atividades Encontradas"
      className="max-w-md"
    >
      <div className="space-y-4">
        <p className="text-sm text-brown-600 bg-brown-50/50 p-3 rounded-lg border border-brown-100">
          Você já tem atividades desse tipo geradas no sistema. Deseja abrir uma existente ou criar uma nova?
        </p>

        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
          {sortedTabs.map(tab => (
            <div
              key={tab.id}
              className="group flex flex-col p-3 rounded-xl bg-white border border-brown-200 hover:border-brown-400 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex-1 min-w-0">
                  {editingId === tab.id ? (
                    <div className="flex items-center gap-2 mt-1 mb-1" onClick={e => e.stopPropagation()}>
                      <Input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            onUpdate(tab.id, { title: editTitle });
                            setEditingId(null);
                          } else if (e.key === 'Escape') {
                            setEditingId(null);
                          }
                        }}
                        autoFocus
                        className="h-7 text-sm py-0"
                      />
                      <button onClick={() => { onUpdate(tab.id, { title: editTitle }); setEditingId(null); }} className="p-1 text-green-600 hover:bg-green-50 rounded">
                        <Check className="w-4 h-4" />
                      </button>
                      <button onClick={() => setEditingId(null)} className="p-1 text-red-500 hover:bg-red-50 rounded">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-brown-900 truncate" title={tab.title}>
                        {tab.title || 'Atividade sem título'}
                      </h4>
                      <button 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          setEditingId(tab.id); 
                          setEditTitle(tab.title || ''); 
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 text-brown-400 hover:text-brown-600 hover:bg-brown-50 rounded transition-all"
                        title="Renomear"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                  <p className="text-xs text-brown-500 font-medium mt-0.5">
                    Criado em {formatDate(tab.id, tab)}
                  </p>
                </div>
                {onDelete && (
                  <button
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      if(window.confirm('Tem certeza que deseja excluir esta atividade permanentemente?')) {
                        onDelete(tab.id); 
                      }
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                    title="Remover definitivamente"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              <Button 
                onClick={() => onSelect(tab.id)} 
                variant="secondary" 
                className="w-full text-sm h-8 bg-brown-50 hover:bg-brown-100 border-none text-brown-700"
                icon={ExternalLink}
              >
                Abrir Atividade
              </Button>
            </div>
          ))}
          {sortedTabs.length === 0 && (
            <div className="text-center p-6 text-brown-400 text-sm italic">
              Nenhuma atividade salva.
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-brown-100 flex justify-between gap-3">
          <Button variant="ghost" onClick={onClose} className="text-brown-500">
            Cancelar
          </Button>
          <Button onClick={onCreateNew} className="shadow-sm">
            + Nova Atividade
          </Button>
        </div>
      </div>
    </Modal>
  );
};
