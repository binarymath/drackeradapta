import React from 'react';
import { theme } from '../../styles/theme';

export const Badge = ({ children, variant = 'info', className = '' }) => {
    const variants = {
        success: theme.status.success,
        warning: theme.status.warning,
        error: theme.status.error,
        info: theme.status.info,
    };

    return (
        <span className={`${variants[variant] || theme.status.info} ${theme.status.badge} ${className}`}>
            {children}
        </span>
    );
};
