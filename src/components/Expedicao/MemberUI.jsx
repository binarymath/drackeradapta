
import React from 'react';

export const Badge = ({ children, className }) => <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${className}`}>{children}</span>;

export const Button = ({ children, className, variant, size, ...props }) => {
    const baseStyle = "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";
    const variantStyles = {
        ghost: "hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        default: "bg-primary text-primary-foreground hover:bg-primary/90"
    };
    return <button className={`${baseStyle} ${variantStyles[variant] || variantStyles.default} ${className}`} {...props}>{children}</button>;
};

export const TextArea = ({ className, ...props }) => <textarea className={`flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${className}`} {...props} />;

export const Card = ({ children, className, ...props }) => <div className={`rounded-xl border bg-card text-card-foreground shadow ${className}`} {...props}>{children}</div>;

export const Input = ({ className, ...props }) => <input className={`flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${className}`} {...props} />;
