import React, { useState, useEffect } from 'react';

export const CookieBanner = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const consent = localStorage.getItem('cookie_consent');
        if (!consent) {
            setIsVisible(true);
        }
    }, []);

    const handleAccept = () => {
        localStorage.setItem('cookie_consent', 'true');
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-brown-900 text-white p-4 shadow-lg z-50 flex flex-col md:flex-row items-center justify-between gap-4 no-print border-t border-brown-700">
            <div className="text-sm md:text-base max-w-4xl">
                <p>
                    Utilizamos cookies e tecnologias como o <strong>Google Analytics</strong> para entender como você interage com o site e melhorar sua experiência.
                    Ao clicar em <strong>"Concordo"</strong>, você aceita o uso dessas tecnologias.
                    Para mais detalhes, consulte nossa <a href="/politica-de-privacidade.html" className="underline text-brown-200 hover:text-white" target="_blank">Política de Privacidade</a>.
                </p>
            </div>
            <button
                onClick={handleAccept}
                className="bg-brown-100 text-brown-900 px-6 py-2 rounded-lg font-bold hover:bg-white transition-colors whitespace-nowrap shadow-md"
            >
                Concordo
            </button>
        </div>
    );
};
