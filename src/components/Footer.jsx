import React from 'react';

export const Footer = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="w-full bg-brown-100 text-brown-800 py-6 mt-8 no-print">
            <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="text-sm">
                    &copy; {currentYear} Dracker Adapta. Todos os direitos reservados.
                </div>
                <div className="flex gap-6 text-sm">
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
