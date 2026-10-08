/**
 * Formatadores de tempo compartilhados (substituem cópias locais em vários componentes).
 */

const pad2 = (n) => String(n).padStart(2, '0');

/** Milissegundos -> "mm:ss". Valores inválidos/ausentes viram "--:--" (rankings dos jogos). */
export const formatMs = (ms) => {
    if (!ms || !Number.isFinite(ms) || ms === Number.MAX_SAFE_INTEGER) return '--:--';
    const totalSeconds = Math.max(0, Math.round(ms / 1000));
    return `${pad2(Math.floor(totalSeconds / 60))}:${pad2(totalSeconds % 60)}`;
};

/** Segundos inteiros -> "m:ss" (sem zero à esquerda nos minutos). */
export const formatMinSec = (seconds) => {
    const mins = Math.floor(seconds / 60);
    return `${mins}:${pad2(seconds % 60)}`;
};

/** Segundos inteiros -> "mm:ss" (nunca negativo). */
export const formatClock = (totalSeconds) => {
    const safe = Math.max(0, totalSeconds || 0);
    return `${pad2(Math.floor(safe / 60))}:${pad2(safe % 60)}`;
};

/** Tempo de mídia (pode ser fracionado/NaN) -> "m:ss"; usa `fallback` se inválido. */
export const formatMediaTime = (sec, fallback = '0:00') => {
    if (!sec || isNaN(sec)) return fallback;
    return `${Math.floor(sec / 60)}:${pad2(Math.floor(sec % 60))}`;
};
