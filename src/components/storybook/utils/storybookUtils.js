// Utilitários e constantes para o Storybook Infantil

export const DEFAULT_FONT_SCALES = {
    text: 140,      // Texto principal / narrativa / sinopse / lição
    title: 120,     // Título e subtítulo
    dialogue: 110,  // Fala do personagem
    question: 110,  // Pergunta ou desafio de atenção
    image: 100      // Logo / Imagem / Ilustração
};

export const DEFAULT_TEXT_ALIGNS = {
    text: 'justify',    // Texto principal / narrativa / sinopse / lição
    title: 'left',      // Título e subtítulo
    dialogue: 'left',   // Fala do personagem
    question: 'left',   // Pergunta ou desafio de atenção
    image: 'center'     // Posição da imagem / logo
};

// Extrair ID do vídeo do YouTube
export const extractYouTubeId = (url) => {
    if (!url) return null;
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    return match ? match[1] : null;
};

// Copiar texto para a área de transferência com fallback
export const copyTextToClipboard = async (fullText) => {
    try {
        await navigator.clipboard.writeText(fullText);
        return true;
    } catch {
        const textArea = document.createElement('textarea');
        textArea.value = fullText;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        return true;
    }
};
