export function generateSpellSlots(formula: (level: number, slot: number) => number) {
    const out = Array.from({ length: 21 }).map(() => Array.from({ length: 10 }).map(() => 0));
    for (let level = 1; level <= 20; level++) {
        for (let slot = 0; slot <= 10; slot++) {
            out[level][slot] = formula(level, slot);
        }
    }
    return out;
}
