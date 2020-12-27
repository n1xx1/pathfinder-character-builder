import { pf } from "./pathfinder";
import {
    Context,
    calculateAbility,
    computeSkillProficiency,
    profFromNumber,
    computeProficiency,
    computeSelectedFeats,
} from "./utils";
import * as _ from "lodash";

export interface RenderedAbility {
    mod: number;
    score: number;
}
export interface RenderedSkill {
    mod: number;
    prof: pf.Proficiency;
}
export interface RenderedSpellcasting {
    slots: number[];
}
export interface RenderedCharacter {
    name: string;

    ancestry: string;
    heritage?: string;
    background: string;
    class: string;
    level: number;

    abilities: { [id in pf.Ability]: RenderedAbility };
    skills: { [id in pf.Skill]: RenderedSkill };
    perception: RenderedSkill;
    fortitude: RenderedSkill;
    reflex: RenderedSkill;
    will: RenderedSkill;

    bonuses: { category: string; text: string; arg?: string }[];
    actions: { name: string; description: string }[];
    feats: string[];

    spellcasting?: RenderedSpellcasting;
}

export function renderCharacter(context: Context): RenderedCharacter {
    const { pfAncestry, pfHeritage, pfBackground, pfClass, level } = context;

    const scores = {
        STR: calculateAbility("STR", context),
        DEX: calculateAbility("DEX", context),
        CON: calculateAbility("CON", context),
        INT: calculateAbility("INT", context),
        WIS: calculateAbility("WIS", context),
        CHA: calculateAbility("CHA", context),
    };

    const skillProfs = _.fromPairs(
        pf.skills.map(skill => [
            skill,
            computeSkillProficiency(context, skill),
        ]),
    ) as {
        [k in pf.Skill]: number;
    };

    const perception = computeProficiency(context, "perception");
    const fortitude = computeProficiency(context, "fortitude");
    const reflex = computeProficiency(context, "reflex");
    const will = computeProficiency(context, "will");

    const bonuses = context.bonusList
        .filter(({ bonus }) => bonus.k === "bonus")
        .map(({ bonus, arg }) => ({
            category: (bonus as pf.BonusBonus).category,
            text: (bonus as pf.BonusBonus).text,
            arg: arg,
        }));

    const removedActions = context.bonusList
        .map(({ bonus }) => bonus.k === "remove_action" && bonus.name)
        .filter(x => x);

    const actions = context.bonusList
        .map(
            ({ bonus }) =>
                bonus.k === "action" && {
                    name: bonus.name,
                    description: bonus.description ?? "No description",
                },
        )
        .filter(x => x && !removedActions.includes(x.name));

    const feats = computeSelectedFeats(context);

    let spellcasting: RenderedSpellcasting = undefined;

    const spellcasterBonus = context.bonusList.find(
        b => b.bonus.k === "spellcasting",
    )?.bonus as pf.BonusSpellcasting;
    if (spellcasterBonus) {
        spellcasting = {
            slots: spellcasterBonus.slots[level],
        };
    }

    return {
        name: context.name,
        ancestry: pfAncestry?.name ?? "",
        heritage: pfHeritage?.name,
        background: pfBackground?.name,
        class: pfClass?.name ?? "",
        level,
        abilities: {
            STR: { score: scores.STR[0], mod: scores.STR[1] },
            DEX: { score: scores.DEX[0], mod: scores.DEX[1] },
            CON: { score: scores.CON[0], mod: scores.CON[1] },
            INT: { score: scores.INT[0], mod: scores.INT[1] },
            WIS: { score: scores.WIS[0], mod: scores.WIS[1] },
            CHA: { score: scores.CHA[0], mod: scores.CHA[1] },
        },
        skills: _.mapValues(skillProfs, (prof, skill) => ({
            mod: calculateSkillMod(
                context,
                prof,
                scores[pf.skillAbility[skill]][1],
            ),
            prof: profFromNumber(prof),
        })),
        perception: {
            mod: calculateSkillMod(context, perception, scores.WIS[1]),
            prof: profFromNumber(perception),
        },
        fortitude: {
            mod: calculateSkillMod(context, fortitude, scores.CON[1]),
            prof: profFromNumber(fortitude),
        },
        reflex: {
            mod: calculateSkillMod(context, reflex, scores.DEX[1]),
            prof: profFromNumber(reflex),
        },
        will: {
            mod: calculateSkillMod(context, will, scores.WIS[1]),
            prof: profFromNumber(will),
        },
        bonuses,
        actions,
        feats,
        spellcasting,
    };
}

function calculateSkillMod(
    { level }: Context,
    prof: number,
    abilityMod: number,
) {
    if (prof == 0) {
        return abilityMod;
    }
    return prof * 2 + level + abilityMod;
}
