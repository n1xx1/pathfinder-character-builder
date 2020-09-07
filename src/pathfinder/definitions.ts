export namespace pf {
    export type Ability = "STR" | "DEX" | "CON" | "INT" | "WIS" | "CHA";

    export type Skill =
        | "acrobatics"
        | "arcana"
        | "athletics"
        | "crafting"
        | "deception"
        | "diplomacy"
        | "intimidation"
        | "medicine"
        | "nature"
        | "occultism"
        | "performance"
        | "religion"
        | "society"
        | "stealth"
        | "survival"
        | "thievery";

    export const skills: Skill[] = [
        "acrobatics",
        "arcana",
        "athletics",
        "crafting",
        "deception",
        "diplomacy",
        "intimidation",
        "medicine",
        "nature",
        "occultism",
        "performance",
        "religion",
        "society",
        "stealth",
        "survival",
        "thievery",
    ];

    export const skillAbility: { [id in Skill]: Ability } = {
        acrobatics: "DEX",
        arcana: "INT",
        athletics: "STR",
        crafting: "INT",
        deception: "CHA",
        diplomacy: "CHA",
        intimidation: "CHA",
        medicine: "WIS",
        nature: "WIS",
        occultism: "INT",
        performance: "CHA",
        religion: "WIS",
        society: "INT",
        stealth: "DEX",
        survival: "WIS",
        thievery: "DEX",
    };

    export type Proficiency = "U" | "T" | "E" | "M" | "L";

    export const proficiencyName: { [k in Proficiency]: string } = {
        U: "Untrained",
        T: "Trained",
        E: "Expert",
        M: "Master",
        L: "Legendary",
    };

    export type WeaponKind = "unarmed" | "weapon_simple" | "weapon_martial";

    export type ArmorKind = "unarmored" | "armor_light" | "armor_medium";

    export type Tradition = "arcane" | "divine" | "primal" | "occult";

    export type SavingThrow = "fortitude" | "reflex" | "will";

    export type Size = "medium" | "small" | "large";

    // "tradition:self", "tradition:Arcane", "level:", "trait:Illusion", "cantrip"
    export type SpellTrait = string;

    // "level:", "trait:"
    export type FeatTrait = string;

    // ???
    export type BonusCategory = string;

    export interface BonusSpellcasting {
        k: "spellcasting";
        slots: number[][];
        spellbook?: {
            "0": number;
            "1": number;
            n: number;
        };
    }

    export interface BonusAction {
        k: "action";
        name: string;
        source?: Source;
        actions?: ActionKind;
        description?: string;
    }

    export interface BonusRemoveAction {
        k: "remove_action";
        name: string; // either feat name with action #self, or action name
    }

    export interface BonusSpell {
        k: "spell";
        innate?: Tradition;
        spell?: string | string[];
        filter?: SpellTrait[];
    }

    export type BonusFeat = {
        k: "feat";
        feat?: string;
        option?: string | string[];
        filter?: FeatTrait[];
    };

    export type BonusProficiency = {
        k: "proficiency";
        proficiency: Proficiency;
        upgrade?: boolean;
    } & (
        | { skill: "perception" | Skill | SavingThrow | WeaponKind | ArmorKind }
        | { skill: "any_skill"; filter?: Skill[]; count?: string | number }
        | { skill: "lore"; kind?: string; description: string }
        | { skill: "weapons"; weapons: string[] }
        | { skill: "weapons"; category: string[] }
        | { skill: "class_dc"; class: string }
        | { skill: "spell_attack" | "spell_dc"; tradition: Tradition }
    );

    export interface BonusAbility {
        k: "ability";
        ability?: Ability;
        choice?: (Ability | "OTHER")[];
    }

    export interface BonusAbilityFlaw {
        k: "ability_flaw";
        ability: Ability;
    }

    export interface BonusStartingFocus {
        k: "starting_focus" | "increase_focus";
        amount: number;
    }

    export interface BonusSpellcastingSlot {
        k: "spellcasting_slot";
        level: number;
        add: number;
    }

    export interface BonusSpecial {
        k: "special";
        id: string; // familiar,
        value?: number | string | (string | number)[];
    }

    export interface BonusBonus {
        k: "bonus";
        category: string; // ???
        text: string;
    }

    export interface BonusSpeed {
        k: "speed";
        increase: number;
    }

    export interface BonusIf {
        k: "if";
        if: Prerequisite[];
        bonus: Bonus[];
        else_bonus?: Bonus[];
    }

    export interface BonusOption {
        k: "option";
        options: {
            [id: string]: {
                name: string;
                source?: Source;
                description: string;
                prerequisites?: Prerequisite[];
                bonus: Bonus[];
            };
        };
    }

    export interface BonusItem {
        k: "item";
        name: string;
        details?: string;
    }

    export type Bonus =
        | BonusSpellcasting
        | BonusAction
        | BonusRemoveAction
        | BonusSpell
        | BonusFeat
        | BonusProficiency
        | BonusAbilityFlaw
        | BonusAbility
        | BonusStartingFocus
        | BonusSpellcastingSlot
        | BonusSpecial
        | BonusBonus
        | BonusSpeed
        | BonusIf
        | BonusOption
        | BonusItem;

    export interface Source {
        book: string;
        page: number;
        prd: string;
    }

    export interface Ancestry {
        name: string;
        source: Source;
        description: string;
        hp: number;
        size: Size;
        speed: number;
        traits: string[];
        bonus: Bonus[];
        heritages: { [name: string]: Heritage };
    }

    export interface Heritage {
        name: string;
        source: Source;
        description: string;
        bonus: Bonus[];
    }

    export interface Class {
        name: string;
        source: Source;
        description: string;
        key: Ability | (Ability | "OTHER")[];
        hp: number;
        features: { [name: string]: Feature };
    }

    export interface Background {
        name: string;
        source: Source;
        description: string;
        bonus: Bonus[];
    }

    export type ActionKind = 1 | 2 | 3 | "bonus" | "reaction";

    export interface Action {
        action: ActionKind | string;
        name: string;
        frequency: string;
        requirements: string;
    }

    export interface Feature {
        name: string;
        level: number;
        description: string;
        bonus?: Bonus[];
    }

    // "feat:Feat",
    // "skill:aracana,T", "level:n", "class:Wizard", "ability:DEX,10"
    // "special:familiar", "special:spellcaster", "special:spellcaster_prepared"
    export type Prerequisite = string;

    export type FeatDictionary = { [name: string]: Feat };

    export interface Feat {
        name: string;
        level: number;
        source: Source;
        description: string;
        traits: string[];
        prerequisites?: Prerequisite[];
        bonus?: Bonus[];
    }

    export interface Spell {
        name: string;
        level: number;
        traits: string[];
        description: string;
        traditions: Tradition[];
    }
    export interface FocusSpell {
        level: number;
        traits: string[];
    }
}

type Dict<T> = { [id: string]: T };
