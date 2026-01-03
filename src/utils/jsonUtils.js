export const safeJSONParse = (text) => {
    if (!text) return null;

    // 1. Remove Markdown Wrappers (```json ... ```) case-insensitively
    // We also remove the "json" label if it appears alone at the start
    let clean = text.replace(/```json\s*/gi, '')
        .replace(/```\s*/g, '')
        .trim();

    // 2. Extract JSON Object or Array
    // Find first '{' or '['
    const firstOpenBrace = clean.indexOf('{');
    const firstOpenBracket = clean.indexOf('[');

    let start = -1;
    let end = -1;

    // Determine if we are looking for object or array
    // If both exist, pick the earlier one
    if (firstOpenBrace !== -1 && (firstOpenBracket === -1 || firstOpenBrace < firstOpenBracket)) {
        start = firstOpenBrace;
        end = clean.lastIndexOf('}');
    } else if (firstOpenBracket !== -1) {
        start = firstOpenBracket;
        end = clean.lastIndexOf(']');
    }

    if (start !== -1 && end !== -1) {
        clean = clean.substring(start, end + 1);
    }

    // 3. Attempt Native Parse
    try {
        return JSON.parse(clean);
    } catch (e) {
        // 4. Attempt simple fixes if native parse fails

        // Fix 1: Trailing commas
        // Replaces ,} with } and ,] with ]
        let fixed = clean
            .replace(/,\s*}/g, '}')
            .replace(/,\s*]/g, ']');

        try {
            return JSON.parse(fixed);
        } catch (e2) {
            console.warn("JSON Parse failed even after simple fixes. Raw:", text, "Cleaned:", clean);
            return null; // Return null to indicate failure
        }
    }
};
