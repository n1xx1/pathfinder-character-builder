import _ from "lodash";
import { choices } from "yargs";
import { feats } from ".";
import { markdownAction } from "../markdown";
import { addBonus, addFlaw } from "../utils";
import { calculateAbilityAtLevel } from "./calculate";
import { computeCondition } from "./conditions";
import { pf } from "./definitions";
import { bonusesOfType } from "./utils";

export interface ChoiceAbility {
    kind: "ability";
    value: pf.Ability;
}

export interface ChoiceSkillProf {
    kind: "skill_prof";
    value: { skill: pf.Skill; level: number; upgrade: boolean };
}

export interface ChoiceFeat {
    kind: "feat";
    value: string;
    option?: string | string[];
}

export interface ChoiceSpell {
    kind: "spell";
    value: string;
}

export interface ChoiceOption {
    kind: "option";
    value: string;
}

export type Choice =
    | ChoiceAbility
    | ChoiceSkillProf
    | ChoiceFeat
    | ChoiceSpell
    | ChoiceOption;

export type ChoiceMap = { [path: string]: Choice };

export interface BonusListEntry<T extends pf.Bonus = pf.Bonus> {
    bonus: T;
    level: number;
    origin: string;
    path: string;
    arg?: string;
}
export type BonusList<T extends pf.Bonus = pf.Bonus> = BonusListEntry<T>[];

type FixSet = { [id: string]: 0 | 1 }; // 0 exclude, 1 include

export interface ProcessContext {
    level: number;
    ancestry: pf.Ancestry;
    heritage: pf.Heritage;
    background: pf.Background;
    class: pf.Class;
    choices: ChoiceMap;
}

export function processCharacter(ctx: ProcessContext) {
    const fixSet = {} as FixSet;
    let bonuses = [] as BonusList;

    for (let level = 1; level <= 20; level++) {
        addBaseBonusesForLevel(level, ctx, bonuses, fixSet);
    }

    let prevBonusesCount = 0;
    while (prevBonusesCount != bonuses.length) {
        prevBonusesCount = bonuses.length;
        processAllNormalBonuses(ctx, bonuses, fixSet);
        processIfBonuses(ctx, bonuses, fixSet, true);
    }

    fixChoices(ctx.choices, fixSet);
    return bonuses;
}

function processAllNormalBonuses(
    ctx: ProcessContext,
    bonuses: BonusList,
    fixSet: FixSet,
) {
    let prevBonusesCount = 0;
    while (prevBonusesCount != bonuses.length) {
        prevBonusesCount = bonuses.length;
        processSkillBonuses(ctx, bonuses, fixSet);
        processFeatBonuses(ctx, bonuses, fixSet);
        processOptionBonuses(ctx, bonuses, fixSet);
    }
}

function calculateSkillCount(
    count: string,
    level: number,
    ctx: ProcessContext,
    bonuses: BonusList,
) {
    const expr = count.replace(
        /(STR|DEX|CON|INT|WIS|CHA)/gi,
        m =>
            "" +
            calculateAbilityAtLevel(level, m as pf.Ability, ctx, bonuses)[1],
    );
    return eval(expr);
}

function processSkillBonuses(
    ctx: ProcessContext,
    bonuses: BonusList,
    fixSet: FixSet,
) {
    const skillBonuses = bonusesOfType<pf.BonusProficiency>(
        bonuses,
        b => b.k === "proficiency" && b.skill === "any_skill" && b.count > 0,
    );

    for (const [
        index,
        { level, path, bonus: skillBonus, origin },
    ] of skillBonuses) {
        if (fixSet[`${path}`] !== undefined) {
            continue;
        }
        if (skillBonus.skill == "any_skill" && skillBonus.count) {
            let count = 0;
            if (typeof skillBonus.count == "string") {
                count = calculateSkillCount(
                    skillBonus.count,
                    level,
                    ctx,
                    bonuses,
                );
            } else {
                count = skillBonus.count;
            }

            fixSet[`${path}`] = 0;
            for (let i = 0; i < count; i++) {
                fixSet[`${path}/${i}`] = 1;
                bonuses.push({
                    bonus: {
                        k: "proficiency",
                        skill: "any_skill",
                        proficiency: skillBonus.proficiency,
                        filter: skillBonus.filter,
                        upgrade: skillBonus.upgrade,
                    },
                    level,
                    path: `${path}/${i}`,
                    origin,
                });
            }
        }
    }
}

function addBonuses(
    bonuses: BonusList,
    additions: [number, BonusListEntry[]][],
) {
    let offset = 0;
    for (const [index, newBonuses] of additions) {
        bonuses.splice(offset + index + 1, 0, ...newBonuses);
        offset += newBonuses.length;
    }
}

const featBonusTypes: pf.Bonus["k"][] = ["feat", "class_feat", "ancestry_feat"];

function processFeatBonuses(
    ctx: ProcessContext,
    bonuses: BonusList,
    fixSet: FixSet,
) {
    const featBonuses = bonusesOfType<pf.BonusFeat>(bonuses, b =>
        featBonusTypes.includes(b.k),
    );

    const additions: [number, BonusListEntry[]][] = [];
    for (const [index, { path, bonus, origin, level }] of featBonuses) {
        if (bonus.feat) {
            const feat = feats[bonus.feat];
            if (feat == null) {
                continue;
            }

            if (fixSet[`feat/${feat.name}`] !== undefined) {
                continue;
            }

            fixSet[`feat/${feat.name}`] = 1;
            if (feat.bonus) {
                let featBonuses = feat.bonus;
                if (bonus.option) {
                    const featOptions: pf.BonusOption[] = feat.bonus.filter(
                        b => b.k === "option",
                    ) as any;

                    for (const [i, featOption] of featOptions.entries()) {
                        const optionValue = Array.isArray(bonus.option)
                            ? bonus.option[i]
                            : bonus.option;
                        if (!optionValue) {
                            continue;
                        }

                        const option = featOption.options[optionValue];
                        featBonuses = featBonuses.filter(f => f != featOption);
                        additions.push([
                            index,
                            option.bonus.map((bonus, j) => ({
                                level,
                                bonus,
                                path: `feat/${feat.name}/${i}/${j}`,
                                origin: `from "${feat.name}" feat, ${origin}`,
                            })),
                        ]);
                    }
                }

                additions.push([
                    index,
                    featBonuses.map((bonus, i) => ({
                        bonus,
                        level,
                        path: `feat/${feat.name}/${i}`,
                        origin: `from "${feat.name}" feat, ${origin}`,
                    })),
                ]);
            }
            continue;
        }

        const bValue = ctx.choices[path];
        if (bValue?.kind === "feat") {
            const feat = feats[bValue.value];
            if (feat == null) {
                continue;
            }

            if (fixSet[`feat/${feat.name}`] !== undefined) {
                continue;
            }

            fixSet[`feat/${feat.name}`] = 1;
            if (feat.bonus) {
                additions.push([
                    index,
                    feat.bonus.map((bonus, i) => {
                        if (bonus.k == "action" && bonus.name == "#self") {
                            bonus.description = `### ${
                                feat.name
                            } ${markdownAction(
                                bonus.actions,
                            )}\n\n; ${feat.traits.join(", ")}\n\n${
                                feat.description
                            }`;
                        }

                        return {
                            bonus,
                            level,
                            path: `feat/${feat.name}/${i}`,
                            origin: `from "${feat.name}" feat, ${origin}`,
                        };
                    }),
                ]);
            }
        }
    }
    addBonuses(bonuses, additions);
}

function processOptionBonuses(
    ctx: ProcessContext,
    bonuses: BonusList,
    fixSet: FixSet,
) {
    const optionBonuses = bonusesOfType<pf.BonusOption>(
        bonuses,
        b => b.k == "option",
    );

    const additions: [number, BonusListEntry[]][] = [];
    for (const [index, { path, bonus, origin, level }] of optionBonuses) {
        if (fixSet[`${path}`] !== undefined) {
            continue;
        }

        fixSet[`${path}`] = 0;
        fixSet[`${path}/key`] = 1;
        const bValue = ctx.choices[path];
        if (bValue?.kind === "option") {
            const selectedOption = bonus.options[bValue.value];
            fixSet[`${path}/${selectedOption.name}`] = 1;

            additions.push([
                index,
                selectedOption.bonus.map((b, i) => ({
                    bonus: b,
                    level: level,
                    path: `${path}/selectedOption.name/${i}`,
                    origin: `from "${selectedOption.name}" option, ${origin}`,
                })),
            ]);
        }
    }
    addBonuses(bonuses, additions);
}

function processIfBonuses(
    ctx: ProcessContext,
    bonuses: BonusList,
    fixSet: FixSet,
    onlyOne: boolean,
) {
    const ifBonuses = _.orderBy(
        bonusesOfType<pf.BonusIf>(bonuses, b => b.k == "if"),
        ([i, b]) => b.level,
        "asc",
    );

    const additions: [number, BonusListEntry[]][] = [];
    for (const [index, { path, bonus, origin, level }] of ifBonuses) {
        if (fixSet[`${path}`] !== undefined) {
            continue;
        }

        fixSet[`${path}`] = 0;
        if (computeCondition(bonuses, ctx, bonus.if)) {
            fixSet[`${path}/true`] = 1;

            additions.push([
                index,
                bonus.bonus.map((b, i) => ({
                    bonus: b,
                    level,
                    path: `${path}/true/${i}`,
                    origin,
                })),
            ]);
        } else {
            if (bonus.else_bonus) {
                fixSet[`${path}/false`] = 1;

                additions.push([
                    index,
                    bonus.else_bonus.map((b, i) => ({
                        bonus: b,
                        level,
                        path: `${path}/false/${i}`,
                        origin,
                    })),
                ]);
            }
        }
        if (onlyOne) {
            break;
        }
    }
    addBonuses(bonuses, additions);
}

function addBaseBonusesForLevel(
    level: number,
    ctx: ProcessContext,
    bonuses: BonusList,
    fixSet: FixSet,
) {
    // level ability boosts
    if (level == 1 || level == 5 || level == 10 || level == 15 || level == 20) {
        if (ctx.level >= level) {
            fixSet[`base/${level}`] = 1;
            for (let i = 0; i < 4; i++) {
                bonuses.push({
                    bonus: { k: "ability" },
                    level: level,
                    path: `base/${level}/${i}`,
                    origin: `from Level ${level}`,
                });
            }
        }
    }

    // ancestry
    if (level == 1 && ctx.ancestry) {
        fixSet[`ancestry/${ctx.ancestry.name}`] = 1;
        for (let i = 0; i < ctx.ancestry.bonus.length; i++) {
            const bonus = ctx.ancestry.bonus[i];
            bonuses.push({
                bonus,
                level: 1,
                path: `ancestry/${ctx.ancestry.name}/${i}`,
                origin: `from "${ctx.ancestry.name}" ancestry`,
            });
        }
    }

    // heritage
    if (level == 1 && ctx.heritage) {
        fixSet[`heritage/${ctx.heritage.name}`] = 1;
        for (let i = 0; i < ctx.heritage.bonus.length; i++) {
            const bonus = ctx.heritage.bonus[i];
            bonuses.push({
                bonus,
                level: 1,
                path: `heritage/${ctx.heritage.name}/${i}`,
                origin: `from "${ctx.heritage.name}" heritage`,
            });
        }
    }

    // background
    if (level == 1 && ctx.background) {
        fixSet[`background/${ctx.background.name}`] = 1;
        for (let i = 0; i < ctx.background.bonus.length; i++) {
            const bonus = ctx.background.bonus[i];
            bonuses.push({
                bonus,
                level: 1,
                path: `background/${ctx.background.name}/${i}`,
                origin: `from "${ctx.background.name}" background`,
            });
        }
    }

    // class
    if (ctx.class) {
        if (level == 1) {
            const path = `class/${ctx.class.name}/key`;
            fixSet[path] = 1;
            if (Array.isArray(ctx.class.key)) {
                bonuses.push({
                    bonus: { k: "ability", choice: ctx.class.key },
                    level: 1,
                    path,
                    origin: `from "${ctx.class.name}" class`,
                });
            } else {
                bonuses.push({
                    bonus: { k: "ability", ability: ctx.class.key },
                    level: 1,
                    path,
                    origin: `from "${ctx.class.name}" class`,
                });
            }
        }

        for (const [k, feature] of Object.entries(ctx.class.features)) {
            if (feature.level == level) {
                const path = `class/${ctx.class.name}/${feature.name}`;
                fixSet[path] = 1;
                if (feature.bonus) {
                    for (let i = 0; i < feature.bonus.length; i++) {
                        const bonus = feature.bonus[i];
                        bonuses.push({
                            bonus,
                            level: feature.level,
                            path: `class/${ctx.class.name}/${feature.name}/${i}`,
                            origin: `from "${feature.name}" feature, from "${ctx.class.name}" class`,
                        });
                    }
                }
            }
        }
    }
}

function fixChoices(choices: ChoiceMap, fixSet: FixSet) {
    const fixSetList = Object.entries(fixSet);

    for (const k of Object.keys(choices)) {
        const inclusions = fixSetList
            .filter(([fix, include]) => include && k.startsWith(fix))
            .map(([fix, include]) => fix);
        if (inclusions.length == 0) {
            delete choices[k];
            continue;
        }
        const exclusions = fixSetList
            .filter(([fix, include]) => !include && k.startsWith(fix))
            .map(([fix, include]) => fix);
        if (exclusions.length == 0) {
            continue;
        }
        const heighestInclusion = inclusions.reduce(
            (prev, fix) => Math.max(prev, fix.length),
            0,
        );
        const heightestExclusion = exclusions.reduce(
            (prev, fix) => Math.max(prev, fix.length),
            0,
        );
        if (heighestInclusion > heightestExclusion) {
            continue;
        }
        delete choices[k];
    }
}
