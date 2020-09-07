import { pf } from "../definitions";

export const classFeats: { [id: string]: pf.Feat } = {
    "Counterspell (Prepared)": {
        name: "Counterspell (Prepared)",
        traits: ["Abjuration", "Arcane", "Witch", "Wizard"],
        description: "???",
        level: 1,
        bonus: [{ k: "action", action: "Counterspell" }],
    },
    "Eschew Materials": {
        name: "Eschew Materials",
        traits: ["Wizard"],
        description: "???",
        level: 1,
    },
    Familiar: {
        name: "Familiar",
        traits: ["Wizard", "Sorcerer"],
        description: "???",
        level: 1,
        bonus: [{ k: "special", id: "familiar" }],
    },
    "Flexible Studies": {
        name: "Flexible Studies",
        traits: ["Investigator"],
        description: "???",
        level: 1,
        bonus: [
            {
                k: "bonus",
                text:
                    "During your daily preparations, you can cram on a certain subject to become temporarily trained in one skill of your choice. This proficiency lasts until you prepare again",
                category: "",
            },
        ],
    },
    "Hand of the Apprentice": {
        name: "Hand of the Apprentice",
        traits: ["Wizard"],
        description: "???",
        level: 1,
        prerequisites: ["special:arcane_school_universalist"],
        bonus: [
            { k: "starting_focus", amount: 1 },
            { k: "spell", spell: "hand of the apprentice" },
        ],
    },
    "Known Weaknesses": {
        name: "Known Weaknesses",
        traits: ["Investigator"],
        description: "...",
        level: 1,
        bonus: [
            {
                k: "bonus",
                text:
                    "Whenever you Devise a Stratagem, you can also attempt a check to Recall Knowledge as part of that action. If you critically succeed at the Recall Knowledge check, you notice a weakness and gain a +1 circumstance bonus to your attack roll from Devise a Stratagem. If you immediately convey this information to your allies as part of the check, each ally gains a +1 circumstance bonus to their next attack roll against the subject, as long as their attack is made before the beginning of your next turn.",
                category: "",
            },
        ],
    },
    "Reach Spell": {
        name: "Reach Spell",
        traits: [
            "Bard",
            "Cleric",
            "Concentrate",
            "Metamagic",
            "Oracle",
            "Sorcerer",
            "Witch",
            "Wizard",
        ],
        description: "???",
        level: 1,
        bonus: [{ k: "action", action: "Reach Spell" }],
    },
    "Spellbook Prodigy": {
        name: "Spellbook Prodigy",
        traits: ["Wizard"],
        description: "???",
        level: 1,
        prerequisites: ["skill:arcana,T"],
    },
    "Takedown Expert": {
        name: "Takedown Expert",
        traits: ["Investigator"],
        description: "...",
        level: 1,
        bonus: [{ k: "bonus", text: "TODO", category: "" }],
    },
    "Widen Spell": {
        name: "Widen Spell",
        traits: ["Druid", "Manipulate", "Metamagic", "Oracle", "Sorcerer", "Witch"],
        description: "???",
        level: 1,
        bonus: [{ k: "action", action: "Widen Spell" }],
    },
    "Cantrip Expansion": {
        name: "Cantrip Expansion",
        traits: ["Bard", "Cleric", "Oracle", "Sorcerer", "Witch", "Wizard"],
        description: "???",
        level: 2,
        bonus: [
            {
                k: "if",
                if: ["spellcaster_prepared"],
                bonus: [{ k: "spellcasting_slot", level: 0, add: 2 }],
                else_bonus: [
                    { k: "spell", filter: ["tradition:self", "cantrip"] },
                    { k: "spell", filter: ["tradition:self", "cantrip"] },
                ],
            },
        ],
    },
    "Conceal Spell": {
        name: "Conceal Spell",
        traits: ["Concentrate", "Manipulate", "Metamagic", "Witch", "Wizard"],
        description: "???",
        level: 2,
        bonus: [{ k: "action", action: "Conceal Spell" }],
    },
    "Energy Ablation": {
        name: "Energy Ablation",
        traits: ["Metamagic", "Wizard"],
        description: "...",
        level: 2,
        bonus: [{ k: "action", action: "Energy Ablation" }],
    },
    "Enhanced Familiar": {
        name: "Enhanced Familiar",
        traits: ["Druid", "Sorcerer", "Witch", "Wizard"],
        description: "???",
        level: 2,
        prerequisites: ["special:familiar"],
    },
    "Nonlethal Spell": {
        name: "Nonlethal Spell",
        traits: ["Manipulate", "Metamagic", "Wizard"],
        description: "???",
        level: 2,
        bonus: [{ k: "action", action: "Nonlethal Spell" }],
    },
    "Bespell Weapon": {
        name: "Bespell Weapon",
        traits: ["Oracle", "Sorcerer", "Wizard"],
        description: "...",
        level: 4,
        bonus: [{ k: "action", action: "Bespell Weapon" }],
    },
    "Call Bonded Item": {
        name: "Call Bonded Item",
        traits: ["Concentrate", "Conjuration", "Teleportation", "Wizard"],
        description: "...",
        level: 4,
        prerequisites: ["special:arcane_bond"],
        bonus: [{ k: "action", action: "Call Bonded Item" }],
    },
    "Linked Focus": {
        name: "Linked Focus",
        traits: ["Wizard"],
        description: "...",
        level: 4,
        prerequisites: ["special:arcane_bond", "special:arcane_school"],
        bonus: [
            {
                k: "bonus",
                category: "",
                text:
                    "When you Drain your Bonded Item to cast a spell of your arcane school, you also regain 1 Focus Point.",
            },
        ],
    },
    "Silent Spell": {
        name: "Silent Spell",
        traits: ["Concentrate", "Metamagic", "Wizard"],
        description: "...",
        level: 4,
        prerequisites: ["feat:Conceal Spell"],
        bonus: [{ k: "action", action: "Silent Spell" }],
    },
};
