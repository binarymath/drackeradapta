import React, { useEffect, useRef, useState } from 'react';
import { AlertTriangle } from 'lucide-react';

/**
 * Diálogo de confirmação assíncrono (substitui window.confirm).
 * Uso:   if (await confirmDialog('Excluir?')) { ... }
 * Opções: { title, confirmText, cancelText, danger }
 * O <ConfirmHost /> deve estar montado uma vez (em App.jsx).
 */

let openHandler = null;

export const confirmDialog = (message, options = {}) => {
    // Fallback seguro caso o host ainda não esteja montado
    if (!openHandler) return Promise.resolve(window.confirm(message));
    return new Promise((resolve) => openHandler({ message, options, resolve }));
};

export const ConfirmHost = () => {
    const [state, setState] = useState(null);
    const confirmBtnRef = useRef(null);

    useEffect(() => {
        openHandler = (req) => setState(req);
        return () => { openHandler = null; };
    }, []);

    const close = (result) => {
        state?.resolve(result);
        setState(null);
    };

    useEffect(() => {
        if (!state) return;
        confirmBtnRef.current?.focus();
        const onKey = (e) => { if (e.key === 'Escape') close(false); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [state]);

    if (!state) return null;
    const { message, options } = state;
    const {
        title = 'Confirmação',
        confirmText = 'Confirmar',
        cancelText = 'Cancelar',
        danger = /exclu|delet|remov|irrevers|substitu|limpo/i.test(message)
    } = options;

    return (
        <div
            className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 no-print"
            onMouseDown={(e) => { if (e.target === e.currentTarget) close(false); }}
        >
            <div
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="confirm-title"
                aria-describedby="confirm-message"
                className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200 p-6 animate-in fade-in zoom-in-95 duration-150"
            >
                <div className="flex items-start gap-3">
                    <div className={`shrink-0 rounded-full p-2 ${danger ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'}`}>
                        <AlertTriangle className="w-5 h-5" aria-hidden="true" />
                    </div>
                    <div className="flex-1">
                        <h2 id="confirm-title" className="text-base font-bold text-slate-900">{title}</h2>
                        <p id="confirm-message" className="mt-1 text-sm text-slate-600 whitespace-pre-line">{message}</p>
                    </div>
                </div>
                <div className="mt-6 flex justify-end gap-2">
                    <button
                        type="button"
                        onClick={() => close(false)}
                        className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
                    >
                        {cancelText}
                    </button>
                    <button
                        type="button"
                        ref={confirmBtnRef}
                        onClick={() => close(true)}
                        className={`px-4 py-2 rounded-xl text-sm font-bold text-white transition-colors ${danger ? 'bg-rose-600 hover:bg-rose-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};
