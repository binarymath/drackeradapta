import React from 'react';
import { Loader2 } from 'lucide-react';
import { theme } from '../../styles/theme';

export const Button = ({
    children,
    variant = 'primary',
    isLoading = false,
    icon: Icon,
    className = '',
    disabled,
    ...props
}) => {
    const baseStyles = theme.button.base || "transition-all font-bold rounded-lg flex items-center justify-center gap-2";

    const variants = {
        primary: theme.button.primary,
        secondary: "bg-brown-100 text-brown-800 hover:bg-brown-200 border border-brown-200", // Explicit fallback/override
        outline: "bg-transparent border border-brown-600 text-brown-600 hover:bg-brown-50",
        danger: theme.button.danger,
        ghost: "hover:bg-brown-50 text-brown-700",
        icon: "p-2 rounded-lg hover:bg-brown-100 text-brown-600 transition-colors",
    };

    const variantStyle = variants[variant] || variants.primary;
    const disabledStyle = (disabled || isLoading) ? "opacity-50 cursor-not-allowed" : "";

    return (
        <button
            className={`${baseStyles} ${variantStyle} ${disabledStyle} ${className}`}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            {!isLoading && Icon && <Icon className="w-5 h-5" />}
            {children}
        </button>
    );
};
