import { pf } from "../definitions";
import { generateSpellSlots } from "../utils";

export const archetypeFeats: { [id: string]: pf.Feat } = {
    "Wizard Dedication": {
        name: "Wizard Dedication",
        traits: ["Archetype", "Dedication", "Multiclass"],
        description: "???",
        level: 2,
        prerequisites: ["ability:INT,14"],
        bonus: [
            {
                k: "spellcasting",
                slots: generateSpellSlots((l, s) => (s == 0 ? 2 : 0)),
                spellbook: {
                    "0": 4,
                    "1": 0,
                    n: 0,
                },
            },
            {
                k: "if",
                if: ["skill:arcana,T"],
                bonus: [{ k: "proficiency", skill: "any_skill", proficiency: "T" }],
                else_bonus: [{ k: "proficiency", skill: "arcana", proficiency: "T" }],
            },
        ],
    },
    "Arcane School Spell": {
        name: "Arcane School Spell",
        traits: ["Archetype"],
        description: "...",
        level: 4,
        prerequisites: ["feat:Wizard Dedication"],
        bonus: [
            {
                k: "option",
                options: {},
            },
        ],
    },
};
