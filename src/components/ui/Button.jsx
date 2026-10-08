import React from 'react';
import { Loader2 } from 'lucide-react';

export const Button = ({
    children,
    variant = 'primary',
    isLoading = false,
    icon: Icon,
    className = '',
    disabled,
    ...props
}) => {
    const variants = {
        primary: "btn-primary",
        secondary: "btn-secondary",
        outline: "btn-ghost",
        danger: "btn-danger",
        ghost: "btn-ghost",
        icon: "btn-icon",
    };

    const variantStyle = variants[variant] || variants.primary;

    return (
        <button
            className={`${variantStyle} ${className}`}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            {!isLoading && Icon && <Icon className="w-5 h-5" />}
            {children}
        </button>
    );
};
