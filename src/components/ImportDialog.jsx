import React from 'react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';

export const ImportDialog = ({
  isOpen,
  importedTabs,
  importedDate,
  importedVersion,
  currentTabsCount,
  onMerge,
  onReplace,
  onClose
}) => (
  <Modal
    isOpen={isOpen}
    onClose={onClose}
    title="Importar Atividades"
    className="max-w-md"
  >
    <div className="space-y-4">
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <p className="text-sm font-semibold text-blue-900 mb-2">📋 Backup Carregado</p>
        <p className="text-xs text-blue-800 mb-1">
          <strong>Versão:</strong> {importedVersion || '1.0'}
        </p>
        <p className="text-xs text-blue-800 mb-1">
          <strong>Data:</strong> {importedDate ? new Date(importedDate).toLocaleString('pt-BR') : 'N/A'}
        </p>
        <p className="text-xs text-blue-800">
          <strong>Atividades:</strong> {importedTabs.length}
        </p>
      </div>

      <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
        <p className="text-sm font-semibold text-amber-900 mb-2">⚙️ Selecione uma opção:</p>
        <p className="text-xs text-amber-800">
          Você tem <strong>{currentTabsCount} atividade(s)</strong> em trabalho. O que deseja fazer?
        </p>
      </div>

      <div className="space-y-3">
        <button
          onClick={onMerge}
          className="w-full p-3 rounded-lg border-2 border-green-300 bg-green-50 hover:bg-green-100 text-left transition-colors"
        >
          <p className="font-semibold text-green-900">✨ Mesclar</p>
          <p className="text-xs text-green-700 mt-1">Adicionar atividades do backup às atividades atuais</p>
        </button>

        <button
          onClick={onReplace}
          className="w-full p-3 rounded-lg border-2 border-red-300 bg-red-50 hover:bg-red-100 text-left transition-colors"
        >
          <p className="font-semibold text-red-900">🔄 Substituir</p>
          <p className="text-xs text-red-700 mt-1">Carregar apenas as atividades do backup (perder atuais)</p>
        </button>
      </div>

      <div className="pt-4 border-t border-gray-200 flex justify-end gap-3">
        <Button variant="secondary" onClick={onClose}>
          Cancelar
        </Button>
      </div>
    </div>
  </Modal>
);
