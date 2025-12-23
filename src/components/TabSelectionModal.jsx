import React from 'react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';

export const TabSelectionModal = ({ isOpen, tabs, onSelect, onCreateNew, onClose }) => (
  <Modal
    isOpen={isOpen}
    onClose={onClose}
    title="Atividades Encontradas"
    className="max-w-md"
  >
    <div className="space-y-4">
      <p className="text-brown-700">
        Você já tem atividades desse tipo abertas. Deseja abrir uma existente ou criar uma nova?
      </p>

      <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => onSelect(tab.id)}
            className="w-full text-left p-3 rounded-lg bg-brown-50 hover:bg-brown-100 border border-brown-200 transition-colors flex items-center justify-between group"
          >
            <span className="font-medium text-brown-800 truncate">{tab.title}</span>
            <span className="text-xs text-brown-500 group-hover:text-brown-700">Abrir</span>
          </button>
        ))}
      </div>

      <div className="pt-4 border-t border-brown-100 flex justify-end gap-3">
        <Button variant="secondary" onClick={onClose}>
          Cancelar
        </Button>
        <Button onClick={onCreateNew}>
          Nova Atividade
        </Button>
      </div>
    </div>
  </Modal>
);
