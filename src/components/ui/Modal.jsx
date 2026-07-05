import React from 'react';
import { X } from 'lucide-react';
import { theme } from '../../styles/theme';

export const Modal = ({ isOpen, onClose, title, children, footer, icon: Icon, size = 'md' }) => {
    if (!isOpen) return null;

    const maxWidthClass = {
        sm: 'max-w-md',
        md: 'max-w-2xl',
        lg: 'max-w-4xl',
        xl: 'max-w-6xl',
        '2xl': 'max-w-[1400px]',
        'full': 'max-w-[95vw]'
    }[size] || 'max-w-2xl';

    const containerClasses = theme.modal.container.replace('max-w-2xl', '').trim();

    return (
        <div className={theme.modal.overlay}>
            <div className={`${containerClasses} ${maxWidthClass}`}>
                {/* Header */}
                <div className={theme.modal.header}>
                    <div className="flex items-center gap-2">
                        {Icon && (
                            <div className="w-8 h-8 rounded-full bg-brown-100 flex items-center justify-center text-brown-600">
                                <Icon className="w-5 h-5" />
                            </div>
                        )}
                        <h2 className={theme.text.title}>{title}</h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-brown-200 rounded-full transition-colors text-brown-500">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className={theme.modal.body}>
                    {children}
                </div>

                {/* Footer */}
                {footer && (
                    <div className={theme.modal.footer}>
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
};
