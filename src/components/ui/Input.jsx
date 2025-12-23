import React from 'react';
import { theme } from '../../styles/theme';

export const Input = ({ label, className = '', error, ...props }) => {
    return (
        <div className="w-full">
            {label && <label className={theme.text.label}>{label}</label>}
            <input
                className={`${theme.input.text} ${error ? 'border-red-500 focus:ring-red-500' : ''} ${className}`}
                {...props}
            />
            {error && <span className="text-xs text-red-500 mt-1">{error}</span>}
        </div>
    );
};

export const TextArea = ({ label, className = '', error, wrapperClassName = '', ...props }) => {
    return (
        <div className={`w-full ${wrapperClassName}`}>
            {label && <label className={theme.text.label}>{label}</label>}
            <textarea
                className={`${theme.input.textarea} ${error ? 'border-red-500 focus:ring-red-500' : ''} ${className}`}
                {...props}
            />
            {error && <span className="text-xs text-red-500 mt-1">{error}</span>}
        </div>
    );
};

export const Select = ({ label, options = [], className = '', error, ...props }) => {
    return (
        <div className="w-full">
            {label && <label className="block text-xs font-semibold mb-1 text-brown-900">{label}</label>}
            <select
                className={`${theme.input.select} ${error ? 'border-red-500' : ''} ${className}`}
                {...props}
            >
                {options.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
            </select>
            {error && <span className="text-xs text-red-500 mt-1">{error}</span>}
        </div>
    );
};
