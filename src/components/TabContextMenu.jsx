import React, { useEffect, useRef } from 'react';
import { Pin, PinOff, Edit3, Copy, Trash2, XCircle } from 'lucide-react';

export const TabContextMenu = ({
  x,
  y,
  tab,
  onClose,
  onPin,
  onRename,
  onDuplicate,
  onCloseOthers,
  onCloseAll
}) => {
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  if (!tab) return null;

  // Ajuste de posições caso ultrapasse as bordas da tela
  const adjustedX = Math.min(x, window.innerWidth - 220);
  const adjustedY = Math.min(y, window.innerHeight - 250);

  return (
    <div
      ref={menuRef}
      style={{ top: adjustedY, left: adjustedX }}
      className="fixed z-50 w-52 bg-white/95 backdrop-blur-xl border border-brown-200/80 rounded-2xl shadow-2xl py-1.5 animate-in fade-in zoom-in-95 duration-150 select-none text-brown-900"
    >
      <div className="px-3 py-1.5 border-b border-brown-100/80">
        <p className="text-[11px] font-bold text-brown-400 uppercase tracking-wider truncate">
          {tab.title || 'Atividade'}
        </p>
      </div>

      <div className="py-1">
        <button
          onClick={() => { onPin(tab.id); onClose(); }}
          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-brown-700 hover:bg-brown-50 hover:text-brown-950 transition-colors"
        >
          {tab.isPinned ? <PinOff className="w-4 h-4 text-amber-600" /> : <Pin className="w-4 h-4 text-amber-600" />}
          <span>{tab.isPinned ? 'Desfixar Aba' : 'Fixar Aba'}</span>
        </button>

        <button
          onClick={() => { onRename(tab.id); onClose(); }}
          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-brown-700 hover:bg-brown-50 hover:text-brown-950 transition-colors"
        >
          <Edit3 className="w-4 h-4 text-indigo-600" />
          <span>Renomear</span>
        </button>

        <button
          onClick={() => { onDuplicate(tab.id); onClose(); }}
          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-brown-700 hover:bg-brown-50 hover:text-brown-950 transition-colors"
        >
          <Copy className="w-4 h-4 text-emerald-600" />
          <span>Duplicar</span>
        </button>
      </div>

      <div className="border-t border-brown-100/80 py-1">
        <button
          onClick={() => { onCloseOthers(tab.id); onClose(); }}
          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-50/80 hover:text-amber-900 transition-colors"
        >
          <Trash2 className="w-4 h-4 text-amber-600" />
          <span>Fechar Outras Abas</span>
        </button>

        <button
          onClick={() => { onCloseAll(tab.type); onClose(); }}
          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
        >
          <XCircle className="w-4 h-4 text-red-500" />
          <span>Fechar Todas</span>
        </button>
      </div>
    </div>
  );
};
