import React from 'react';

export const Footer = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="w-full shrink-0 border-t border-brown-200 bg-brown-50 text-brown-700 py-2 mt-3 no-print">
            <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-1 sm:gap-4">
                <div className="text-[11px] sm:text-xs text-center sm:text-left">
                    &copy; {currentYear} Dracker Adapta. Todos os direitos reservados.
                </div>
                <div className="flex gap-4 text-[11px] sm:text-xs">
                    <a href="/politica-de-privacidade.html" className="hover:text-brown-600 hover:underline transition-colors" target="_blank" rel="noopener noreferrer">
                        Política de Privacidade
                    </a>
                    <a href="/termos-de-uso.html" className="hover:text-brown-600 hover:underline transition-colors" target="_blank" rel="noopener noreferrer">
                        Termos de Uso
                    </a>
                </div>
            </div>
        </footer>
    );
};
