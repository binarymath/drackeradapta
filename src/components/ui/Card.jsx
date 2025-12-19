import React from 'react';
import { theme } from '../../styles/theme';

export const Card = ({ children, className = '', ...props }) => {
    return (
        <div className={`${theme.layout.card} ${className}`} {...props}>
            {children}
        </div>
    );
};
