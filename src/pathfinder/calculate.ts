import { addBonus, addFlaw } from "../utils";
import { BonusList, ProcessContext } from "./character-processor";
import { pf } from "./definitions";
import { bonusesOfType } from "./utils";

export function profAsNumber(prof?: pf.Proficiency) {
    return { U: 0, T: 1, E: 2, M: 3, L: 4 }[prof ?? "U"];
}

export function profFromNumber(prof: number) {
    return ["U", "T", "E", "M", "L"][prof] as pf.Proficiency;
}

export function calculateSkillProficiency(
    ctx: ProcessContext,
    bonuses: BonusList,
    skill: pf.Skill,
) {
    return calculateSkillProficiencyAtLevel(20, ctx, bonuses, skill);
}

export function calculateSkillProficiencyAtLevel(
    level: number,
    ctx: ProcessContext,
    bonuses: BonusList,
    skill: pf.Skill,
): number {
    const matchingSkills = bonusesOfType<pf.BonusProficiency>(
        bonuses,
        f => f.k === "proficiency",
    ).filter(
        ([i, b]) =>
            b.level <= level &&
            (b.bonus.skill == skill ||
                (b.bonus.skill == "any_skill" &&
                    ctx.choices[b.path]?.kind == "skill_prof" &&
                    ctx.choices[b.path].value == skill)),
    );

    let skillLevel = 0;
    for (const [i, { bonus }] of matchingSkills) {
        if (!bonus.upgrade) {
            skillLevel = Math.max(skillLevel, profAsNumber(bonus.proficiency));
        }
    }
    for (const [i, { bonus }] of matchingSkills) {
        if (bonus.upgrade && skillLevel < profAsNumber(bonus.proficiency)) {
            skillLevel += 1;
        }
    }
    return skillLevel;
}

export function calculateAbilityAtLevel(
    level: number,
    ability: pf.Ability,
    { choices }: ProcessContext,
    bonuses: BonusList,
): [number, number] {
    let score = 10;
    for (const { level: bonusLevel, bonus, path } of bonuses) {
        if (level < bonusLevel) {
            continue;
        }
        if (
            bonus.k === "ability" &&
            (bonus.ability === ability ||
                (choices[path]?.kind === "ability" &&
                    choices[path].value === ability))
        ) {
            score = addBonus(score);
        }
        if (bonus.k === "ability_flaw" && bonus.ability === ability) {
            score = addFlaw(score);
        }
    }

    const mod = Math.floor((score - 10) / 2);
    return [score, mod];
}

export function calculateAbility(
    ability: pf.Ability,
    ctx: ProcessContext,
    bonuses: BonusList,
) {
    return calculateAbilityAtLevel(20, ability, ctx, bonuses);
}
