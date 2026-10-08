/**
 * Utilitários de array compartilhados.
 * `shuffle` usa Fisher-Yates (distribuição uniforme), ao contrário de
 * `sort(() => Math.random() - 0.5)`, que gera resultados enviesados.
 */

/** Embaralha IN-PLACE (mantém a semântica de Array.prototype.sort) e retorna o próprio array. */
export const shuffleInPlace = (arr) => {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
};

/** Retorna uma cópia embaralhada, sem alterar o original. */
export const shuffle = (arr) => shuffleInPlace([...arr]);

/** Sorteia um item aleatório (undefined se vazio). */
export const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];
