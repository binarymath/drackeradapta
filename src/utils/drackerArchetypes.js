
export const determineArchetype = (answers, gender) => {
    const isFemale = gender === 'F';
    if (!answers) return { title: 'Colibri Sonhador', desc: `Explorador${isFemale ? 'a' : ''} misterios${isFemale ? 'a' : 'o'}.` };

    const isHigh = (val) => ['lvl5', 'lvl4', 'advanced', 'fluent', 'exemplar', 'organized', 'lit'].includes(val);
    const isLow = (val) => ['lvl1', 'lvl2', 'basic', 'pre', 'challenge', 'messy', 'off'].includes(val);

    const { saber, foco, motivacao, mochila, emocoes, social, matematica: logica, conduta, territorio } =
        Object.fromEntries(Object.entries(answers).map(([k, v]) => [k, v?.value]));

    if (isHigh(logica) && isHigh(foco)) return { title: 'Coruja Sábia', desc: 'Mestre da lógica e conhecimento profundo.' };
    if ((social === 'leader' || social === 'mediator') && (isHigh(conduta) || isHigh(foco) || isHigh(territorio))) return { title: 'Águia Real', desc: 'Liderança segura e organizada.' };
    if ((social === 'partner' || social === 'leader') && (saber === 'audio' || saber === 'play')) return { title: 'Arara Festiva', desc: 'Alegria e aprendizado em grupo.' };
    if (social === 'lone' && (saber === 'audio' || isHigh(foco))) return { title: 'Tartaruga Zen', desc: 'Sabedoria silenciosa e paciente.' };
    if (saber === 'kinesthetic' && (isHigh(motivacao) || isLow(conduta))) return { title: 'Lince Veloz', desc: 'Energia e aprendizado em movimento.' };
    if (isHigh(foco)) return { title: 'Coruja Sábia', desc: 'Observação atenta e silenciosa.' };
    if (isLow(emocoes) || (social === 'shy' && emocoes === 'lvl3')) return { title: 'Panda Gentil', desc: 'Paz e amizade em ambientes acolhedores.' };
    if ((social === 'lone' || social === 'shy') && (saber === 'visual' || saber === 'read')) return { title: 'Raposa Astuta', desc: 'Estratégia visual discreta.' };
    if (saber === 'play' || saber === 'visual') return { title: 'Camaleão Criativo', desc: 'Adaptação e criatividade colorida.' };
    if (mochila === 'lvl3' || mochila === 'lvl2') return { title: 'Tatu Viajante', desc: 'Construindo caminhos de autonomia.' };
    if (isHigh(motivacao)) return { title: 'Vagalume Brilhante', desc: 'Curiosidade que ilumina o caminho.' };

    return { title: 'Colibri Sonhador', desc: 'Imaginação ágil e busca constante.' };
};
