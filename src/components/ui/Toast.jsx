import React, { useEffect, useState } from 'react';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

/**
 * Sistema de notificações (substitui window.alert).
 * Uso em qualquer lugar (componentes, hooks, serviços):
 *   import { toast } from '../components/ui/Toast';
 *   toast('Mensagem');            // tipo detectado automaticamente
 *   toast.error('Falhou');  toast.success('Salvo!');  toast.info('Aviso');
 * O <ToastHost /> deve estar montado uma vez (em App.jsx).
 */

const listeners = new Set();
let nextId = 1;

const emit = (type, message, duration) => {
    const text = typeof message === 'string' ? message : String(message ?? '');
    const item = {
        id: nextId++,
        type,
        message: text,
        // mensagens longas ficam mais tempo na tela
        duration: duration ?? Math.min(12000, Math.max(4000, text.length * 60))
    };
    listeners.forEach((l) => l(item));
    return item.id;
};

const detectType = (msg) =>
    /erro|falha|n[ãa]o (foi|possu|encontr|há|existe|é poss)|inv[áa]lid|incompat|imposs[íi]vel/i.test(String(msg))
        ? 'error'
        : /sucesso|salvo|copiad|conclu[íi]d|import(ad|ou)/i.test(String(msg))
            ? 'success'
            : 'info';

export const toast = (message, duration) => emit(detectType(message), message, duration);
toast.error = (m, d) => emit('error', m, d);
toast.success = (m, d) => emit('success', m, d);
toast.info = (m, d) => emit('info', m, d);

const STYLES = {
    error: { icon: AlertTriangle, cls: 'border-rose-300 bg-rose-50 text-rose-900', iconCls: 'text-rose-600' },
    success: { icon: CheckCircle2, cls: 'border-emerald-300 bg-emerald-50 text-emerald-900', iconCls: 'text-emerald-600' },
    info: { icon: Info, cls: 'border-sky-300 bg-sky-50 text-sky-900', iconCls: 'text-sky-600' }
};

export const ToastHost = () => {
    const [items, setItems] = useState([]);

    useEffect(() => {
        const onToast = (item) => {
            setItems((prev) => [...prev.slice(-4), item]);
            setTimeout(() => setItems((prev) => prev.filter((i) => i.id !== item.id)), item.duration);
        };
        listeners.add(onToast);
        return () => listeners.delete(onToast);
    }, []);

    if (items.length === 0) return null;

    return (
        <div
            className="fixed top-4 right-4 z-[10000] flex flex-col gap-2 w-[min(92vw,380px)] no-print"
            role="region"
            aria-label="Notificações"
        >
            {items.map((item) => {
                const { icon: Icon, cls, iconCls } = STYLES[item.type];
                return (
                    <div
                        key={item.id}
                        role={item.type === 'error' ? 'alert' : 'status'}
                        className={`flex items-start gap-3 rounded-xl border px-4 py-3 shadow-lg text-sm font-medium whitespace-pre-line animate-in fade-in slide-in-from-right-4 duration-200 ${cls}`}
                    >
                        <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${iconCls}`} aria-hidden="true" />
                        <span className="flex-1">{item.message}</span>
                        <button
                            type="button"
                            aria-label="Fechar notificação"
                            onClick={() => setItems((prev) => prev.filter((i) => i.id !== item.id))}
                            className="opacity-60 hover:opacity-100"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                );
            })}
        </div>
    );
};
