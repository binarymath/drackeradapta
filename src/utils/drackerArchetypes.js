export const determineArchetype = (answers, gender) => {
    // Default fallback
    if (!answers) return { title: 'O Sonhador', desc: 'Imaginação ágil e busca constante.' };

    const isHigh = (val) => ['lvl5', 'lvl4', 'advanced', 'fluent', 'exemplar', 'organized', 'lit', 'leader', 'mediator'].includes(val);
    const isLow = (val) => ['lvl1', 'lvl2', 'basic', 'pre', 'challenge', 'messy', 'off', 'lone', 'shy'].includes(val);

    const { saber, foco, motivacao, mochila, emocoes, social, matematica: logica, conduta, territorio } =
        Object.fromEntries(Object.entries(answers).map(([k, v]) => [k, v?.value]));

    // Logic Mapping to new "Student Profiles"
    // 'O Estrategista' (was Coruja Sábia)
    if (isHigh(logica) && isHigh(foco)) return { title: 'O Estrategista', desc: 'Mestre da lógica e conhecimento profundo.' };

    // 'O Líder' (was Águia Real)
    if ((social === 'leader' || social === 'mediator') && (isHigh(conduta) || isHigh(foco) || isHigh(territorio))) return { title: 'O Líder', desc: 'Liderança segura e organizada.' };

    // 'O Comunicador' (was Arara Festiva)
    if ((social === 'partner' || social === 'leader') && (saber === 'audio' || saber === 'play')) return { title: 'O Comunicador', desc: 'Alegria e aprendizado em grupo.' };

    // 'O Observador' (was Tartaruga Zen)
    if (social === 'lone' && (saber === 'audio' || isHigh(foco))) return { title: 'O Observador', desc: 'Sabedoria silenciosa e paciente.' };

    // 'O Ativo' (was Lince Veloz) - Fixed: 'Lince Veloz' was kinesthetic
    if (saber === 'kinesthetic' && (isHigh(motivacao) || isLow(conduta))) return { title: 'O Ativo', desc: 'Energia e aprendizado em movimento.' };

    // 'O Diplomata' (was Panda Gentil)
    if (isLow(emocoes) || (social === 'shy' && emocoes === 'lvl3')) return { title: 'O Diplomata', desc: 'Paz e amizade em ambientes acolhedores.' };

    // 'O Analista' (was Raposa Astuta)
    if ((social === 'lone' || social === 'shy') && (saber === 'visual' || saber === 'read')) return { title: 'O Analista', desc: 'Estratégia visual discreta.' };

    // 'O Inovador' (was Camaleão Criativo)
    if (saber === 'play' || saber === 'visual') return { title: 'O Inovador', desc: 'Adaptação e criatividade colorida.' };

    // 'O Autônomo' (was Tatu Viajante)
    if (mochila === 'lvl3' || mochila === 'lvl2') return { title: 'O Autônomo', desc: 'Construindo caminhos de autonomia.' };

    // 'O Motivado' (was Vagalume Brilhante)
    if (isHigh(motivacao)) return { title: 'O Motivado', desc: 'Curiosidade que ilumina o caminho.' };

    // Default
    return { title: 'O Sonhador', desc: 'Imaginação ágil e busca constante.' };
};
