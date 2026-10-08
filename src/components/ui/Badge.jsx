import React from 'react';

export const Badge = ({ children, variant = 'info', className = '' }) => {
    const variants = {
        success: "bg-emerald-100 text-emerald-800",
        warning: "bg-amber-100 text-amber-800",
        error: "bg-rose-100 text-rose-800",
        info: "bg-indigo-100 text-indigo-800",
    };

    return (
        <span className={`${variants[variant] || variants.info} ml-2 px-2 py-1 text-xs font-bold rounded-full flex items-center gap-1 shadow-sm ${className}`}>
            {children}
        </span>
    );
};
