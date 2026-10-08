import React from 'react';

export const Card = ({ children, className = '', ...props }) => {
    return (
        <div className={`card-gamified ${className}`} {...props}>
            {children}
        </div>
    );
};
