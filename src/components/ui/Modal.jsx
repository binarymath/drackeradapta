import React from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export const Modal = ({ isOpen, onClose, title, children, footer, icon: Icon, size = 'md' }) => {
    if (!isOpen) return null;

    const maxWidthClass = {
        sm: 'max-w-md',
        md: 'max-w-2xl',
        lg: 'max-w-4xl',
        xl: 'max-w-6xl',
        '2xl': 'max-w-[1400px]',
        '90vw': 'max-w-[90vw]',
        'full': 'max-w-[95vw]'
    }[size] || 'max-w-2xl';

    const containerClasses = "bg-white rounded-3xl shadow-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 border-2 border-slate-100";

    const content = (
        <div className="fixed inset-0 z-[12000] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className={`${containerClasses} ${maxWidthClass}`}>
                {/* Header */}
                <div className="p-5 border-b-2 border-slate-100 flex items-center justify-between bg-white">
                    <div className="flex items-center gap-3">
                        {Icon && (
                            <div className="w-10 h-10 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600">
                                <Icon className="w-6 h-6" />
                            </div>
                        )}
                        <h2 className="heading-gamified text-xl">{title}</h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hover:text-slate-600 active:scale-95">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4 overflow-y-auto flex-1 bg-slate-50/50">
                    {children}
                </div>

                {/* Footer */}
                {footer && (
                    <div className="px-6 py-4 border-t-2 border-slate-100 bg-white flex justify-end gap-3">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );

    // Portal no body: o modal sempre fica na frente (acima da roleta maximizada, card e painel lateral)
    if (typeof document === 'undefined') return content;
    return createPortal(content, document.body);
};
