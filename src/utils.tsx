import { pf } from "./pathfinder";
import { BonusList, ChoiceMap } from "./pathfinder/character-processor";

export interface Context {
    name: string;
    level: number;
    bonusList: BonusList;
    choices: ChoiceMap;
    pfAncestry: pf.Ancestry;
    pfHeritage: pf.Heritage;
    pfBackground: pf.Background;
    pfClass: pf.Class;
}

export function addBonus(score: number) {
    if (score >= 18) {
        return score + 1;
    } else {
        return score + 2;
    }
}
export function addFlaw(score: number) {
    if (score > 18) {
        return score - 1;
    } else {
        return score - 2;
    }
}

export function calculateAbility(
    ability: pf.Ability,
    { choices, bonusList }: Context,
): [number, number] {
    let score = 10;
    for (const { bonus } of bonusList) {
        if (bonus.k === "ability" && bonus.ability === ability) {
            score = addBonus(score);
        }
        if (bonus.k === "ability_flaw" && bonus.ability === ability) {
            score = addFlaw(score);
        }
    }
    for (const [k, { value, kind }] of Object.entries(choices)) {
        if (kind === "ability" && value == ability) {
            score = addBonus(score);
        }
    }
    const mod = Math.floor((score - 10) / 2);
    return [score, mod];
}

export function profAsNumber(prof?: pf.Proficiency) {
    return { U: 0, T: 1, E: 2, M: 3, L: 4 }[prof ?? "U"];
}

export function profFromNumber(prof: number) {
    return ["U", "T", "E", "M", "L"][prof] as pf.Proficiency;
}

export function computeSkillProficiency(
    { bonusList, choices }: Context,
    skill: pf.Skill,
): number {
    let level = 0;
    for (const { bonus } of bonusList) {
        if (
            bonus.k === "proficiency" &&
            bonus.skill == skill &&
            !bonus.upgrade
        ) {
            level = Math.max(level, profAsNumber(bonus.proficiency));
        }
    }
    for (const [k, value] of Object.entries(choices)) {
        if (
            value.kind === "skill_prof" &&
            value.value.skill == skill &&
            !value.value.upgrade
        ) {
            level = Math.max(level, value.value.level);
        }
    }
    for (const { bonus } of bonusList) {
        if (
            bonus.k === "proficiency" &&
            bonus.skill == skill &&
            bonus.upgrade &&
            level < profAsNumber(bonus.proficiency)
        ) {
            level += 1;
        }
    }
    for (const [k, value] of Object.entries(choices)) {
        if (
            value.kind === "skill_prof" &&
            value.value.skill == skill &&
            value.value.upgrade &&
            level < value.value.level
        ) {
            level += 1;
        }
    }
    return level;
}

type NormalSkillProficiencies =
    | "perception"
    | pf.WeaponKind
    | pf.ArmorKind
    | pf.SavingThrow;

export function computeProficiency(
    { bonusList }: Context,
    skill: NormalSkillProficiencies,
) {
    let level = 0;
    for (const { bonus } of bonusList) {
        if (
            bonus.k === "proficiency" &&
            bonus.skill == skill &&
            !bonus.upgrade
        ) {
            level = Math.max(level, profAsNumber(bonus.proficiency));
        }
    }
    return level;
}

export function computeSelectedFeats(context: Context) {
    return context.bonusList
        .map(({ path, bonus }) => {
            if (bonus.k === "feat") {
                if (bonus.feat) {
                    return bonus.feat;
                }
                const v = context.choices[path];
                if (v?.kind === "feat") {
                    return v.value;
                }
            }
            if (bonus.k === "class_feat") {
                const v = context.choices[path];
                if (v?.kind === "feat") {
                    return v.value;
                }
            }
            if (bonus.k === "ancestry_feat") {
                const v = context.choices[path];
                if (v?.kind === "feat") {
                    return v.value;
                }
            }
            return null;
        })
        .filter(x => x);
}
