import { BonusList, BonusListEntry } from "./character-processor";
import { pf } from "./definitions";

export function generateSpellSlots(
    formula: (level: number, slot: number) => number,
) {
    const out = Array.from({ length: 21 }).map(() =>
        Array.from({ length: 10 }).map(() => 0),
    );
    for (let level = 1; level <= 20; level++) {
        for (let slot = 0; slot <= 10; slot++) {
            out[level][slot] = formula(level, slot);
        }
    }
    return out;
}

export function bonusesOfType<T extends pf.Bonus = pf.Bonus>(
    bonuses: BonusList,
    filter: (f: pf.Bonus) => boolean,
): [number, BonusListEntry<T>][] {
    return Array.from(bonuses.entries()).filter(([i, b]) =>
        filter(b.bonus as any),
    ) as any;
}
