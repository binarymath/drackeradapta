import React from 'react';

export const Input = ({ label, className = '', error, ...props }) => {
    return (
        <div className="w-full">
            {label && <label className="block text-[15px] font-bold mb-2 text-slate-700 tracking-wide">{label}</label>}
            <input
                className={`input-gamified ${error ? 'border-rose-500 focus:ring-rose-500/20' : ''} ${className}`}
                {...props}
            />
            {error && <span className="text-xs text-rose-500 mt-1">{error}</span>}
        </div>
    );
};

export const TextArea = ({ label, className = '', error, wrapperClassName = '', ...props }) => {
    return (
        <div className={`w-full ${wrapperClassName}`}>
            {label && <label className="block text-[15px] font-bold mb-2 text-slate-700 tracking-wide">{label}</label>}
            <textarea
                className={`input-gamified min-h-[4.5rem] resize-y ${error ? 'border-rose-500 focus:ring-rose-500/20' : ''} ${className}`}
                {...props}
            />
            {error && <span className="text-xs text-rose-500 mt-1">{error}</span>}
        </div>
    );
};

export const Select = ({ label, options = [], className = '', error, ...props }) => {
    return (
        <div className="w-full">
            {label && <label className="block text-[15px] font-bold mb-2 text-slate-700 tracking-wide">{label}</label>}
            <select
                className={`input-gamified cursor-pointer ${error ? 'border-rose-500 focus:ring-rose-500/20' : ''} ${className}`}
                {...props}
            >
                {options.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
            </select>
            {error && <span className="text-xs text-rose-500 mt-1">{error}</span>}
        </div>
    );
};
