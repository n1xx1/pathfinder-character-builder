import { pf } from "../definitions";

export const ancestryFeats: { [id: string]: pf.Feat } = {
    "Adapted Cantrip": {
        name: "Adapted Cantrip",
        description: "...",
        level: 1,
        traits: ["Human"],
        prerequisites: ["spellcasting"],
        bonus: [{ k: "spell", filter: ["cantrip"] }],
    },
    "Ancestral Linguistic": {
        name: "Ancestral Linguistic",
        description: "...",
        level: 1,
        traits: ["Elf"],
        prerequisites: ["custom:at least 100 years old"],
        bonus: [
            {
                k: "bonus",
                category: "daily preparations",
                text:
                    "During your daily preparations, you can recede into old memories to become fluent in one common language or one other language you have access to. You know this language until you prepare again.",
            },
        ],
    },
    "Ancestral Longevity": {
        name: "Ancestral Longevity",
        description: "...",
        level: 1,
        traits: ["Elf"],
        prerequisites: ["custom:at least 100 years old"],
        bonus: [
            {
                k: "bonus",
                category: "daily preparations",
                text:
                    "During your daily preparations, you can reflect upon your life experiences to gain the trained proficiency rank in one skill of your choice. This proficiency lasts until you prepare again.",
            },
        ],
    },
    "Cooperative Nature": {
        name: "Cooperative Nature",
        description: "...",
        level: 1,
        traits: ["Human"],
        bonus: [{ k: "bonus", category: "", text: "+4 circumstance bonus on checks to Aid" }],
    },
    "Dragon Spit": {
        name: "Dragon Spit",
        description: "...",
        level: 1,
        traits: ["Human"],
        bonus: [
            {
                k: "spell",
                innate: "arcane",
                spell: ["acid splash", "electric arc", "produce flame", "ray of frost"],
            },
        ],
    },
    "Elemental Wrath": {
        name: "Elemental Wrath",
        description: "...",
        level: 1,
        traits: ["Elf"],
        bonus: [
            {
                k: "option",
                options: {
                    // TODO: modify spells
                    Acid: {
                        name: "Acid",
                        description: "...",
                        bonus: [{ k: "spell", spell: "acid splash", innate: "primal" }],
                    },
                    Cold: {
                        name: "Cold",
                        description: "...",
                        bonus: [{ k: "spell", spell: "acid splash", innate: "primal" }],
                    },
                    Electricity: {
                        name: "Electricity",
                        description: "...",
                        bonus: [{ k: "spell", spell: "acid splash", innate: "primal" }],
                    },
                    Fire: {
                        name: "Fire",
                        description: "...",
                        bonus: [{ k: "spell", spell: "acid splash", innate: "primal" }],
                    },
                },
            },
        ],
    },
    "Elven Aloofness": {
        name: "Elven Aloofness",
        description: "...",
        level: 1,
        traits: ["Elf"],
        bonus: [{ k: "bonus", category: "", text: "TODO" }],
    },
    "Elven Lore": {
        name: "Elven Lore",
        description: "...",
        level: 1,
        traits: ["Elf"],
        bonus: [
            {
                k: "if",
                if: ["skill:arcana,T"],
                bonus: [{ k: "proficiency", proficiency: "T", skill: "any_skill" }],
                else_bonus: [{ k: "proficiency", proficiency: "T", skill: "arcana" }],
            },
            {
                k: "if",
                if: ["skill:nature,T"],
                bonus: [{ k: "proficiency", proficiency: "T", skill: "any_skill" }],
                else_bonus: [{ k: "proficiency", proficiency: "T", skill: "nature" }],
            },
            { k: "proficiency", proficiency: "T", skill: "lore", kind: "Elven" },
        ],
    },
    "Elven Verve": {
        name: "Elven Verve",
        description: "...",
        level: 1,
        traits: ["Elf"],
        bonus: [{ k: "bonus", category: "", text: "TODO" }],
    },
    "Elven Weapon Familiarity": {
        name: "Elven Weapon Familiarity",
        description: "",
        level: 1,
        traits: [],
        bonus: [
            {
                k: "proficiency",
                skill: "weapons",
                proficiency: "T",
                weapons: [
                    "longbow",
                    "composite longbow",
                    "longsword",
                    "rapier",
                    "shortbow",
                    "composite shortbow",
                ],
            },
            // TODO: elf weapons
        ],
    },
    Forlon: {
        name: "Forlon",
        description: "...",
        level: 1,
        traits: ["Elf"],
        bonus: [{ k: "bonus", category: "", text: "TODO" }],
    },

    "General Training": {
        name: "General Training",
        description: "...",
        level: 1,
        traits: ["Human"],
        bonus: [{ k: "feat", filter: ["trait:General"] }],
    },
    "Know Your Own": {
        name: "Know Your Own",
        description: "...",
        level: 1,
        traits: ["Elf"],
        bonus: [{ k: "bonus", category: "", text: "TODO" }],
    },
    "Nimble Elf": {
        name: "Nimble Elf",
        description: "...",
        level: 1,
        traits: ["Elf"],
        bonus: [{ k: "speed", increase: 5 }],
    },
    "Otherworldy Magic": {
        name: "Otherwordly Magic",
        description: "...",
        level: 1,
        traits: ["Elf"],
        bonus: [{ k: "spell", filter: ["tradition:arcane", "cantrip"], innate: "arcane" }], // TODO: hightened
    },
};

const t = {
    "": {
        name: "",
        description: "",
        level: 1,
        traits: [],
        bonus: [],
    },
};
