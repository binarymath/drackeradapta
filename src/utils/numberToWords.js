/**
 * Utilitário para conversão de números em palavras por extenso em Português (Brasil)
 * Especialmente formatado para cruzadinhas pedagógicas.
 */

const UNIDADES = [
    '', 'UM', 'DOIS', 'TRÊS', 'QUATRO', 'CINCO', 'SEIS', 'SETE', 'OITO', 'NOVE',
    'DEZ', 'ONZE', 'DOZE', 'TREZE', 'QUATORZE', 'QUINZE', 'DEZESSEIS', 'DEZESSETE', 'DEZOITO', 'DEZENOVE'
];

const DEZENAS = [
    '', '', 'VINTE', 'TRINTA', 'QUARENTA', 'CINQUENTA', 'SESSENTA', 'SETENTA', 'OITENTA', 'NOVENTA'
];

const CENTENAS = [
    '', 'CENTO', 'DUZENTOS', 'TREZENTOS', 'QUATROCENTOS', 'QUINHENTOS',
    'SEISCENTOS', 'SETECENTOS', 'OITOCENTOS', 'NOVECENTOS'
];

/**
 * Converte um número inteiro (0 a 999.999) em texto por extenso em português.
 * Ex: 25 -> "VINTE E CINCO", 100 -> "CEM", 108 -> "CENTO E OITO"
 */
export function numberToPortugueseWords(num) {
    if (num === null || num === undefined || isNaN(num)) return '';
    const n = Math.abs(Math.round(Number(num)));

    if (n === 0) return 'ZERO';

    function convertGroup(val) {
        if (val === 0) return '';
        if (val === 100) return 'CEM';

        const parts = [];
        const c = Math.floor(val / 100);
        const d = Math.floor((val % 100) / 10);
        const u = val % 10;
        const du = val % 100;

        if (c > 0) {
            parts.push(CENTENAS[c]);
        }

        if (du > 0) {
            if (du < 20) {
                parts.push(UNIDADES[du]);
            } else {
                parts.push(DEZENAS[d]);
                if (u > 0) {
                    parts.push(UNIDADES[u]);
                }
            }
        }

        return parts.join(' E ');
    }

    if (n < 1000) {
        return convertGroup(n);
    }

    if (n < 1000000) {
        const milhares = Math.floor(n / 1000);
        const resto = n % 1000;
        const milStr = milhares === 1 ? 'MIL' : `${convertGroup(milhares)} MIL`;

        if (resto === 0) return milStr;
        if (resto <= 100 || resto % 100 === 0) {
            return `${milStr} E ${convertGroup(resto)}`;
        }
        return `${milStr} ${convertGroup(resto)}`;
    }

    return String(n);
}

/**
 * Normaliza um texto para preenchimento na grade da cruzadinha
 * Remove acentos, pontuações e converte para maiúsculas.
 * Ex: "VINTE E CINCO" -> "VINTEECINCO"
 * Ex: "TRÊS" -> "TRES"
 */
export function normalizeForCrossword(text) {
    if (!text) return '';
    return text.toString()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '');
}

/**
 * Se a entrada for um número (ou string numérica), converte para extenso.
 * Se já for uma palavra, mantém a palavra.
 */
export function formatAnswerForMathCrossword(val, format = 'text_words') {
    if (val === null || val === undefined) return '';
    const str = val.toString().trim();
    if (!str) return '';

    const isNumeric = /^-?\d+(\.\d+)?$/.test(str);

    if (isNumeric) {
        if (format === 'numeric') {
            return str;
        }
        return numberToPortugueseWords(parseInt(str, 10));
    }

    return str.toUpperCase();
}
