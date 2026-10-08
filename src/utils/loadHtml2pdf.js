/**
 * Carrega o html2pdf.js sob demanda (uma única vez) a partir do pacote npm.
 * Substitui o <script> via CDN que antes duplicava a biblioteca no bundle.
 */
let html2pdfPromise = null;

export const loadHtml2pdf = () => {
    if (!html2pdfPromise) {
        html2pdfPromise = import('html2pdf.js')
            .then((mod) => mod.default || mod)
            .catch((err) => {
                html2pdfPromise = null; // permite nova tentativa
                throw err;
            });
    }
    return html2pdfPromise;
};
