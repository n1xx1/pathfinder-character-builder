import { profAsNumber } from "../utils";
import {
    calculateAbilityAtLevel,
    calculateSkillProficiencyAtLevel,
} from "./calculate";
import { BonusList, ProcessContext } from "./character-processor";
import { pf } from "./definitions";

export function computeCondition(
    bonuses: BonusList,
    ctx: ProcessContext,
    pres: pf.Prerequisite[],
    level = 20,
) {
    level = Math.min(ctx.level, level);

    for (const pre of pres) {
        const preLevel = trimPrefix(pre, "level:");
        if (preLevel.length != pre.length) {
            if (preLevel.startsWith("<")) {
                if (level >= +preLevel.substr(1)) {
                    return false;
                }
            } else if (level < +preLevel) {
                return false;
            }
            continue;
        }
        const preSkill = trimPrefix(pre, "skill:");
        if (preSkill.length != pre.length) {
            const [skill, proficiency] = preSkill.split(",");
            const skillLevel = calculateSkillProficiencyAtLevel(
                level,
                ctx,
                bonuses,
                skill as pf.Skill,
            );
            const realProficiency = trimPrefix(preSkill, "=");
            if (realProficiency.length != pre.length) {
                if (skillLevel != profAsNumber(proficiency as pf.Proficiency)) {
                    return false;
                }
            } else {
                if (skillLevel < profAsNumber(proficiency as pf.Proficiency)) {
                    return false;
                }
            }
            continue;
        }
        const preAbility = trimPrefix(pre, "ability:");
        if (preAbility.length != pre.length) {
            const [ability, abilityScore] = preSkill.split(",");
            const [score, mod] = calculateAbilityAtLevel(
                level,
                ability as pf.Ability,
                ctx,
                bonuses,
            );
            if (score < +abilityScore) {
                return false;
            }
            continue;
        }
        const preSpecial = trimPrefix(pre, "special:");
        if (preSpecial.length != pre.length) {
            const found = bonuses.some(
                f => f.bonus.k === "special" && f.bonus.id === preSpecial,
            );
            if (!found) {
                return false;
            }
            continue;
        }
        const preFeat = trimPrefix(pre, "feat:");
        if (preFeat.length != pre.length) {
            const found = bonuses.some(f => {
                if (f.bonus.k === "feat") {
                    if (f.bonus.feat) {
                        return f.bonus.feat === preFeat;
                    }
                    const b = ctx.choices[f.path];
                    if (b) {
                        return b.kind === "feat" && b.value === preFeat;
                    }
                }
                if (f.bonus.k == "class_feat") {
                    const b = ctx.choices[f.path];
                    if (b) {
                        return b.kind === "feat" && b.value === preFeat;
                    }
                }
                return false;
            });
            if (!found) {
                return false;
            }
            continue;
        }
        // TODO: handle other cases
        throw `invalid prerequisite ${pre}`;
    }
    return true;
}

function trimPrefix(s: string, prefix: string) {
    if (s.startsWith(prefix)) {
        return s.substring(prefix.length);
    }
    return s;
}
