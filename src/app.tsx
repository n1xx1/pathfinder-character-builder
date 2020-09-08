import React, { useState, useMemo, useEffect, Dispatch, SetStateAction, useRef } from "react";
import { render } from "react-dom";
import "antd/dist/antd.css";
import {
    Select,
    Form,
    Input,
    Layout,
    Row,
    Col,
    InputNumber,
    Typography,
    Switch,
    Button,
} from "antd";
import { pf, ancestries, backgrounds, classes, feats, spells, ancestryList } from "./pathfinder";
import {
    Context,
    BonusMap,
    BonusList,
    BonusKindSkillProf,
    BonusKindAbility,
    profAsNumber,
    computeSkillProficiency,
    BonusKindFeat,
    BonusListEntry,
    computeSelectedFeats,
    calculateAbility,
    BonusKindOption,
} from "./utils";
import { CharacterPrinter } from "./character-printer";
import { renderCharacter } from "./character-render";
import _ from "lodash";
import { RenderMarkdown } from "./markdown";

function sortStrings(a: string, b: string) {
    return a.localeCompare(b);
}

const backgroundNames = Object.keys(backgrounds).sort(sortStrings);
const classNames = Object.keys(classes).sort(sortStrings);

const formLayout = {
    labelCol: { span: 8 },
    wrapperCol: { span: 16 },
};

interface AppSavedData {
    name: string;
    ancestryName: string;
    heritageName: string;
    backgroundName: string;
    className: string;
    level: number;
    values: BonusMap;
}

function saveData(s: AppSavedData) {
    localStorage.setItem("pf-save-data", JSON.stringify(s));
}
function loadData(): AppSavedData {
    const s: Partial<AppSavedData> = JSON.parse(localStorage.getItem("pf-save-data") ?? "{}");
    return {
        name: s.name ?? "",
        ancestryName: s.ancestryName ?? "",
        backgroundName: s.backgroundName ?? "",
        heritageName: s.heritageName ?? "",
        className: s.className ?? "",
        level: s.level ?? 1,
        values: s.values ?? {},
    };
}

function App({}: {}) {
    const firstRender = useRef(true);

    const [name, setName] = useState("");
    const [pfAncestryName, setPfAncestryName] = useState("");
    const [pfHeritageName, setPfHeritageName] = useState("");
    const [pfBackgroundName, setPfBackgroundName] = useState("");
    const [pfClassName, setPfClassName] = useState("");
    const [level, setLevel] = useState(1);
    const [values, setValues] = useState({} as BonusMap);

    const pfAncestry = ancestries[pfAncestryName];
    const pfHeritage = pfAncestry?.heritages[pfHeritageName];
    const pfBackground = backgrounds[pfBackgroundName];
    const pfClass = classes[pfClassName];

    const heritageNames = useMemo(() => {
        if (pfAncestry) {
            return Object.keys(pfAncestry.heritages).sort(sortStrings);
        }
        return [];
    }, [pfAncestryName]);

    const context: Context = {
        name,
        level,
        bonusList: null,
        bonusMap: values,
        pfAncestry,
        pfHeritage,
        pfBackground,
        pfClass,
    };

    useEffect(() => {
        if (!pfHeritage) {
            setPfHeritageName("");
        }
    }, [pfHeritage]);

    const [bonusList, bonusMap] = useMemo(() => {
        const [bonusList, fixSet] = generateBonusList(context);
        const bonusMap = fixValuesMap(context, fixSet);
        return [bonusList, bonusMap];
    }, [pfAncestry, pfHeritage, pfBackground, pfClass, values, level]);

    context.bonusList = bonusList;
    context.bonusMap = bonusMap;

    const renderedCharacter = useMemo(() => {
        return renderCharacter(context);
    }, [pfAncestry, pfHeritage, pfBackground, pfClass, values, level, name]);

    useEffect(() => {
        if (firstRender.current) {
            const data = loadData();
            setName(data.name);
            setPfAncestryName(data.ancestryName);
            setPfHeritageName(data.heritageName);
            setPfBackgroundName(data.backgroundName);
            setPfClassName(data.className);
            setLevel(data.level);
            setValues(data.values);
            firstRender.current = false;
            return;
        }
        saveData({
            name,
            ancestryName: pfAncestry?.name ?? "",
            heritageName: pfHeritage?.name ?? "",
            backgroundName: pfBackground?.name ?? "",
            className: pfClass?.name ?? "",
            level,
            values: bonusMap,
        });
    }, [pfAncestry, pfHeritage, pfBackground, pfClass, values, level, name]);

    return (
        <Layout>
            <Layout.Content style={{ padding: "50px" }}>
                <Row style={{ background: "#fff", padding: "20px 0" }}>
                    <Col span={10} style={{ padding: "10px" }}>
                        <Form {...formLayout}>
                            <Form.Item label="Name">
                                <Input value={name} onChange={v => setName(v.target.value)} />
                            </Form.Item>
                            <Form.Item label="Level">
                                <InputNumber
                                    min={1}
                                    max={20}
                                    value={level}
                                    onChange={l => setLevel(+l)}
                                />
                            </Form.Item>
                            <Form.Item label="Ancestry">
                                <Select
                                    placeholder="Select..."
                                    value={pfAncestryName}
                                    onChange={v => setPfAncestryName(v)}
                                    showSearch
                                >
                                    {ancestryList.map(a => (
                                        <Select.Option key={a} value={a}>
                                            {a}
                                        </Select.Option>
                                    ))}
                                </Select>
                            </Form.Item>
                            {pfAncestry && (
                                <Form.Item label="Heritage">
                                    <Select
                                        placeholder="Select..."
                                        value={pfHeritageName}
                                        onChange={v => setPfHeritageName(v)}
                                        showSearch
                                    >
                                        {heritageNames.map(h => (
                                            <Select.Option key={h} value={h}>
                                                {h}
                                            </Select.Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            )}
                            <Form.Item label="Background">
                                <Select
                                    placeholder="Select..."
                                    value={pfBackgroundName}
                                    onChange={v => setPfBackgroundName(v)}
                                    showSearch
                                >
                                    {backgroundNames.map(b => (
                                        <Select.Option key={b} value={b}>
                                            {b}
                                        </Select.Option>
                                    ))}
                                </Select>
                            </Form.Item>
                            <Form.Item label="Class">
                                <Select
                                    placeholder="Select..."
                                    value={pfClassName}
                                    onChange={v => setPfClassName(v)}
                                    showSearch
                                >
                                    {classNames.map(c => (
                                        <Select.Option key={c} value={c}>
                                            {c}
                                        </Select.Option>
                                    ))}
                                </Select>
                            </Form.Item>
                            {bonusList.map(({ bonus, path, origin }, i) => (
                                <CreationBonus
                                    key={i}
                                    context={context}
                                    bonus={bonus}
                                    path={path}
                                    origin={origin}
                                    setValues={setValues}
                                />
                            ))}
                        </Form>
                        <Button onClick={handleClear}>Clear</Button>
                    </Col>
                    <Col span={14} style={{ padding: "0 10px" }}>
                        <CharacterPrinter pc={renderedCharacter} />
                    </Col>
                </Row>
            </Layout.Content>
        </Layout>
    );

    function handleClear() {
        setValues({});
        setPfClassName("");
        setPfBackgroundName("");
        setPfHeritageName("");
        setPfAncestryName("");
        setLevel(1);
    }
}

type FixSet = { [id: string]: 0 | 1 }; // 0 exclude, 1 include

function fixValuesMap(context: Context, fixSet: FixSet) {
    const fixSetList = Object.entries(fixSet);
    const bonusMap = { ...context.bonusMap };

    for (const k of Object.keys(bonusMap)) {
        const inclusions = fixSetList
            .filter(([fix, include]) => include && k.startsWith(fix))
            .map(([fix, include]) => fix);
        if (inclusions.length == 0) {
            delete bonusMap[k];
            continue;
        }
        const exclusions = fixSetList
            .filter(([fix, include]) => !include && k.startsWith(fix))
            .map(([fix, include]) => fix);
        if (exclusions.length == 0) {
            continue;
        }
        const heighestInclusion = inclusions.reduce((prev, fix) => Math.max(prev, fix.length), 0);
        const heightestExclusion = exclusions.reduce((prev, fix) => Math.max(prev, fix.length), 0);
        if (heighestInclusion > heightestExclusion) {
            continue;
        }
        delete bonusMap[k];
    }
    return bonusMap;
}

function generateBonusList(context: Context): [BonusList, FixSet] {
    const fixSet = {} as FixSet;
    let bonuses = [] as BonusList;

    for (const l of [1, 5, 10, 15, 20]) {
        if (context.level >= l) {
            fixSet[`base/${l}`] = 1;
            for (let i = 0; i < 4; i++) {
                bonuses.push({
                    bonus: { k: "ability" },
                    path: `base/${l}/${i}`,
                    origin: `from level ${l}`,
                });
            }
        }
    }

    if (context.pfAncestry) {
        fixSet[`ancestry/${context.pfAncestry.name}`] = 1;
        for (let i = 0; i < context.pfAncestry.bonus.length; i++) {
            const bonus = context.pfAncestry.bonus[i];
            bonuses.push({
                bonus,
                path: `ancestry/${context.pfAncestry.name}/${i}`,
                origin: `from "${context.pfAncestry.name}" ancestry`,
            });
        }
    }
    if (context.pfHeritage) {
        fixSet[`heritage/${context.pfHeritage.name}`] = 1;
        for (let i = 0; i < context.pfHeritage.bonus.length; i++) {
            const bonus = context.pfHeritage.bonus[i];
            bonuses.push({
                bonus,
                path: `heritage/${context.pfHeritage.name}/${i}`,
                origin: `from "${context.pfHeritage.name}" heritage`,
            });
        }
    }
    if (context.pfBackground) {
        fixSet[`background/${context.pfBackground.name}`] = 1;
        for (let i = 0; i < context.pfBackground.bonus.length; i++) {
            const bonus = context.pfBackground.bonus[i];
            bonuses.push({
                bonus,
                path: `background/${context.pfBackground.name}/${i}`,
                origin: `from "${context.pfBackground.name}" background`,
            });
        }
    }
    if (context.pfClass) {
        const path = `class/${context.pfClass.name}/key`;
        fixSet[path] = 1;
        if (Array.isArray(context.pfClass.key)) {
            bonuses.push({
                bonus: { k: "ability", choice: context.pfClass.key },
                path,
                origin: `from "${context.pfClass.name}" class`,
            });
        } else {
            bonuses.push({
                bonus: { k: "ability", ability: context.pfClass.key },
                path,
                origin: `from "${context.pfClass.name}" class`,
            });
        }

        for (const [k, feature] of Object.entries(context.pfClass.features)) {
            if (feature.level <= context.level) {
                const path = `class/${context.pfClass.name}/${feature.name}`;
                fixSet[path] = 1;
                if (feature.bonus) {
                    for (let i = 0; i < feature.bonus.length; i++) {
                        const bonus = feature.bonus[i];
                        bonuses.push({
                            bonus,
                            path: `class/${context.pfClass.name}/${feature.name}/${i}`,
                            origin: `from "${feature.name}" feature, from "${context.pfClass.name}" class`,
                        });
                    }
                }
            }
        }
    }

    bonuses = computeBonusesRecursive(context, bonuses, fixSet);
    return [bonuses, fixSet];
}

function computeBonusesRecursive(context: Context, bonuses: BonusList, fixSet: FixSet) {
    context.bonusList = bonuses;
    const oldLen = bonuses.length;
    computeSkillBonuses(context, bonuses, fixSet);
    computeFeatBonuses(context, bonuses, fixSet);
    computeOptionBonuses(context, bonuses, fixSet);
    computeIfBonuses(context, bonuses, fixSet);

    if (oldLen == bonuses.length) {
        return bonuses;
    }
    return computeBonusesRecursive(context, bonuses, fixSet);
}

function computeSkillBonuses(context: Context, bonuses: BonusList, fixSet: FixSet) {
    const skillBonuses: [number, BonusListEntry<pf.BonusProficiency>][] = Array.from(
        bonuses.entries(),
    ).filter(
        ([i, b]) => b.bonus.k === "proficiency" && b.bonus.skill == "any_skill" && b.bonus.count,
    ) as any;

    for (const [index, { path, bonus: skillBonus, origin }] of skillBonuses) {
        if (fixSet[`${path}`] !== undefined) {
            continue;
        }
        if (skillBonus.skill == "any_skill" && skillBonus.count) {
            let count = 0;
            if (typeof skillBonus.count == "string") {
                const expr = skillBonus.count.replace(
                    /(STR|DEX|CON|INT|WIS|CHA)/gi,
                    m => "" + calculateAbility(m as pf.Ability, context)[1],
                );
                count = eval(expr);
            } else {
                count = skillBonus.count;
            }

            fixSet[`${path}`] = 0;
            fixSet[`${path}/${count}`] = 1;
            for (let i = 0; i < count; i++) {
                bonuses.push({
                    bonus: {
                        k: "proficiency",
                        skill: "any_skill",
                        proficiency: skillBonus.proficiency,
                        filter: skillBonus.filter,
                        upgrade: skillBonus.upgrade,
                    },
                    path: `${path}/${i}`,
                    origin,
                });
            }
        }
    }
}

function computeFeatBonuses(context: Context, bonuses: BonusList, fixSet: FixSet) {
    const featBonuses: [number, BonusListEntry<pf.BonusFeat>][] = Array.from(
        bonuses.entries(),
    ).filter(([i, b]) => b.bonus.k === "feat") as any;

    for (const [index, { path, bonus, origin: parentOrigin }] of featBonuses) {
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
                for (let i = 0; i < feat.bonus.length; i++) {
                    const bonus = feat.bonus[i];
                    bonuses.splice(index + 1, 0, {
                        bonus,
                        path: `feat/${feat.name}/${i}`,
                        origin: `from "${feat.name}" feat, ${parentOrigin}`,
                    });
                }
            }
        }
        if (bonus.filter) {
            const bValue = context.bonusMap[path];
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
                    for (let i = 0; i < feat.bonus.length; i++) {
                        const bonus = feat.bonus[i];
                        bonuses.splice(index + 1, 0, {
                            bonus,
                            path: `feat/${feat.name}/${i}`,
                            origin: `from "${feat.name}" feat, ${parentOrigin}`,
                        });
                    }
                }
            }
        }
    }
}

function computeOptionBonuses(context: Context, bonuses: BonusList, fixSet: FixSet) {
    const optionBonuses: [number, BonusListEntry<pf.BonusOption>][] = Array.from(
        bonuses.entries(),
    ).filter(([i, b]) => b.bonus.k === "option") as any;

    const additions: [number, BonusListEntry[]][] = [];
    for (const [index, { path, bonus: optionBonus, origin: parentOrigin }] of optionBonuses) {
        if (fixSet[`${path}`] !== undefined) {
            continue;
        }

        fixSet[`${path}`] = 0;
        const bValue = context.bonusMap[path];
        if (bValue?.kind === "option") {
            const selectedOption = optionBonus.options[bValue.value];
            fixSet[`${path}/${selectedOption.name}`] = 1;

            const newBonuses: BonusListEntry[] = [];
            for (let i = 0; i < selectedOption.bonus.length; i++) {
                const bonus = selectedOption.bonus[i];
                newBonuses.push({
                    bonus,
                    path: `${path}/${selectedOption.name}/${i}`,
                    origin: `from "${selectedOption.name}" option, ${parentOrigin}`,
                });
            }
            additions.push([index, newBonuses]);
        }
    }
    let offset = 0;
    for (const [index, newBonuses] of additions) {
        bonuses.splice(offset + index + 1, 0, ...newBonuses);
        offset += newBonuses.length;
    }
}

function computeIfBonuses(context: Context, bonuses: BonusList, fixSet: FixSet) {
    const ifBonuses: [number, BonusListEntry<pf.BonusIf>][] = Array.from(bonuses.entries()).filter(
        ([i, b]) => b.bonus.k === "if",
    ) as any;

    const additions: [number, BonusListEntry[]][] = [];
    for (const [index, { path, bonus: ifBonus, origin }] of ifBonuses) {
        if (fixSet[`${path}`] !== undefined) {
            continue;
        }

        fixSet[`${path}`] = 0;
        if (computePrerequisite(context, ifBonus.if)) {
            fixSet[`${path}/true`] = 1;

            const newBonuses: BonusListEntry[] = [];
            for (let i = 0; i < ifBonus.bonus.length; i++) {
                const bonus = ifBonus.bonus[i];
                newBonuses.push({ bonus, path: `${path}/true/${i}`, origin });
            }
            additions.push([index, newBonuses]);
        } else {
            if (ifBonus.else_bonus) {
                fixSet[`${path}/false`] = 1;

                const newBonuses: BonusListEntry[] = [];
                for (let i = 0; i < ifBonus.else_bonus.length; i++) {
                    const bonus = ifBonus.else_bonus[i];
                    newBonuses.push({ bonus, path: `${path}/false/${i}`, origin });
                }
                additions.push([index, newBonuses]);
            }
        }
    }
    let offset = 0;
    for (const [index, newBonuses] of additions) {
        bonuses.splice(offset + index + 1, 0, ...newBonuses);
        offset += newBonuses.length;
    }
}

interface AbilitySelectProps {
    value: pf.Ability;
    onChange(value: pf.Ability): void;
    exclude?: pf.Ability[];
}

function AbilitySelect({ value, onChange, exclude }: AbilitySelectProps) {
    value = exclude?.includes(value) ? null : value;
    return (
        <Select value={value} onChange={onChange} showSearch>
            {!exclude?.includes("STR") && <Select.Option value="STR">Strength</Select.Option>}
            {!exclude?.includes("DEX") && <Select.Option value="DEX">Dexterity</Select.Option>}
            {!exclude?.includes("CON") && <Select.Option value="CON">Constitution</Select.Option>}
            {!exclude?.includes("INT") && <Select.Option value="INT">Intelligence</Select.Option>}
            {!exclude?.includes("WIS") && <Select.Option value="WIS">Wisdom</Select.Option>}
            {!exclude?.includes("CHA") && <Select.Option value="CHA">Charisma</Select.Option>}
        </Select>
    );
}

interface SkillSelectProps {
    value: pf.Skill;
    onChange(value: pf.Skill): void;
    exclude?: pf.Skill[];
}

function SkillSelect({ value, onChange, exclude }: SkillSelectProps) {
    return (
        <Select value={value} onChange={onChange} showSearch>
            {(exclude?.indexOf("acrobatics") ?? -1) == -1 && (
                <Select.Option value={"acrobatics"}>Acrobatics</Select.Option>
            )}
            {(exclude?.indexOf("arcana") ?? -1) == -1 && (
                <Select.Option value={"arcana"}>Arcana</Select.Option>
            )}
            {(exclude?.indexOf("athletics") ?? -1) == -1 && (
                <Select.Option value={"athletics"}>Athletics</Select.Option>
            )}
            {(exclude?.indexOf("crafting") ?? -1) == -1 && (
                <Select.Option value={"crafting"}>Crafting</Select.Option>
            )}
            {(exclude?.indexOf("deception") ?? -1) == -1 && (
                <Select.Option value={"deception"}>Deception</Select.Option>
            )}
            {(exclude?.indexOf("diplomacy") ?? -1) == -1 && (
                <Select.Option value={"diplomacy"}>Diplomacy</Select.Option>
            )}
            {(exclude?.indexOf("intimidation") ?? -1) == -1 && (
                <Select.Option value={"intimidation"}>Intimidation</Select.Option>
            )}
            {(exclude?.indexOf("medicine") ?? -1) == -1 && (
                <Select.Option value={"medicine"}>Medicine</Select.Option>
            )}
            {(exclude?.indexOf("nature") ?? -1) == -1 && (
                <Select.Option value={"nature"}>Nature</Select.Option>
            )}
            {(exclude?.indexOf("occultism") ?? -1) == -1 && (
                <Select.Option value={"occultism"}>Occultism</Select.Option>
            )}
            {(exclude?.indexOf("performance") ?? -1) == -1 && (
                <Select.Option value={"performance"}>Performance</Select.Option>
            )}
            {(exclude?.indexOf("religion") ?? -1) == -1 && (
                <Select.Option value={"religion"}>Religion</Select.Option>
            )}
            {(exclude?.indexOf("society") ?? -1) == -1 && (
                <Select.Option value={"society"}>Society</Select.Option>
            )}
            {(exclude?.indexOf("stealth") ?? -1) == -1 && (
                <Select.Option value={"stealth"}>Stealth</Select.Option>
            )}
            {(exclude?.indexOf("survival") ?? -1) == -1 && (
                <Select.Option value={"survival"}>Survival</Select.Option>
            )}
            {(exclude?.indexOf("thievery") ?? -1) == -1 && (
                <Select.Option value={"thievery"}>Thievery</Select.Option>
            )}
        </Select>
    );
}

interface CreationBonusFeatProps {
    bonus: pf.BonusFeat;
    context: Context;
    path: string;
    onChange: (v: string) => void;
}

function CreationBonusFeat({ context, bonus, path, onChange }: CreationBonusFeatProps) {
    const { bonusMap } = context;
    const value = (bonusMap[path] as BonusKindFeat)?.value;
    const filteredFeats = useMemo(() => computeFilteredFeats(context, bonus.filter, value), [
        bonus,
        bonusMap,
    ]);
    return (
        <Select value={value} onChange={onChange} showSearch>
            {filteredFeats.map(f => (
                <Select.Option key={f.name} value={f.name}>
                    {f.name}
                </Select.Option>
            ))}
        </Select>
    );
}

interface CreationBonusSpellProps {
    bonus: pf.BonusSpell;
    context: Context;
    path: string;
    onChange: (v: string) => void;
}

function CreationBonusSpell({ context, bonus, path, onChange }: CreationBonusSpellProps) {
    const { bonusMap } = context;
    const filteredFeats = useMemo(() => computeFilteredSpells(context, bonus.filter), [bonus]);
    const value = (bonusMap[path] as BonusKindFeat)?.value;
    return (
        <Select value={value} onChange={onChange} showSearch>
            {filteredFeats.map(f => (
                <Select.Option key={f.name} value={f.name}>
                    {f.name}
                </Select.Option>
            ))}
        </Select>
    );
}

const proficiencyIgnoredSkills: pf.BonusProficiency["skill"][] = [
    "perception",
    "fortitude",
    "reflex",
    "will",
    "unarmed",
    "weapon_simple",
    "weapon_martial",
    "unarmored",
    "armor_light",
    "lore",
    "weapons",
    "spell_attack",
    "spell_dc",
    "class_dc",
    ...pf.skills,
];

interface CreationBonusProps {
    bonus: pf.Bonus;
    context: Context;
    path: string;
    origin: string;
    setValues: Dispatch<SetStateAction<BonusMap>>;
}

function CreationBonus({ bonus, path, setValues, context, origin }: CreationBonusProps) {
    const { bonusMap } = context;
    switch (bonus.k) {
        case "ability":
            if (!bonus.ability) {
                let choice = bonus.choice as pf.Ability[];
                if (bonus.choice?.includes("OTHER")) {
                    const otherAbility: BonusListEntry<pf.BonusSpecial> = context.bonusList.find(
                        f => f.bonus.k === "special" && f.bonus.id.startsWith("ability_key_other:"),
                    ) as any;
                    if (otherAbility) {
                        const otherKey = trimPrefix(
                            otherAbility.bonus.id,
                            "ability_key_other:",
                        ) as pf.Ability;
                        choice = bonus.choice.map(c => (c === "OTHER" ? otherKey : c));
                    } else {
                        choice = bonus.choice.filter(c => c !== "OTHER") as pf.Ability[];
                    }
                }

                return (
                    <Form.Item label="Ability Boost" extra={origin}>
                        <AbilitySelect
                            value={(bonusMap[path] as BonusKindAbility)?.value}
                            onChange={v =>
                                setValues(v1 => ({ ...v1, [path]: { value: v, kind: "ability" } }))
                            }
                            exclude={generateAbilityExcludes(path, context, choice)}
                        />
                    </Form.Item>
                );
            }
            return null;
        case "proficiency":
            if (bonus.skill === "any_skill") {
                if (bonus.count) {
                    // TODO: implement
                    return null;
                } else {
                    const value = (bonusMap[path] as BonusKindSkillProf)?.value?.skill;
                    return (
                        <Form.Item
                            label={
                                bonus.upgrade
                                    ? `Improve proficiency up to ${
                                          pf.proficiencyName[bonus.proficiency]
                                      } in`
                                    : `Become ${pf.proficiencyName[bonus.proficiency]} in`
                            }
                            extra={origin}
                        >
                            <SkillSelect
                                value={value}
                                onChange={v =>
                                    setValues(v1 => ({
                                        ...v1,
                                        [path]: {
                                            value: {
                                                skill: v,
                                                level: profAsNumber(bonus.proficiency),
                                                upgrade: !!bonus.upgrade,
                                            },
                                            kind: "skill_prof",
                                        },
                                    }))
                                }
                                exclude={generateSkillExcludes(
                                    path,
                                    context,
                                    bonus.proficiency,
                                    bonus.filter,
                                    bonus.upgrade,
                                )}
                            />
                        </Form.Item>
                    );
                }
            } else if (proficiencyIgnoredSkills.indexOf(bonus.skill) >= 0) {
                return null;
            }
            break;
        case "feat":
            if (bonus.filter) {
                return (
                    <Form.Item label="Feat" extra={origin}>
                        <CreationBonusFeat
                            bonus={bonus}
                            context={context}
                            path={path}
                            onChange={v =>
                                setValues(v1 => ({ ...v1, [path]: { value: v, kind: "feat" } }))
                            }
                        />
                    </Form.Item>
                );
            }
            return null;
        case "special":
            switch (bonus.id) {
                case "familiar":
                    return (
                        <Form.Item label="Familiar" extra={origin}>
                            TODO
                        </Form.Item>
                    );
            }
            return null;
        case "spell":
            if (bonus.filter) {
                return (
                    <Form.Item label="Spell" extra={origin}>
                        <CreationBonusSpell
                            bonus={bonus}
                            context={context}
                            path={path}
                            onChange={v =>
                                setValues(v1 => ({ ...v1, [path]: { value: v, kind: "spell" } }))
                            }
                        />
                    </Form.Item>
                );
            }
            return null;
        case "option":
            const value = (bonusMap[path] as BonusKindOption)?.value;
            return (
                <Form.Item label={"Option"} extra={origin}>
                    <Select
                        placeholder="Select..."
                        value={value}
                        onChange={v =>
                            setValues(v1 => ({ ...v1, [path]: { value: v, kind: "option" } }))
                        }
                        showSearch
                    >
                        {Object.keys(bonus.options)
                            .sort(sortStrings)
                            .map(o => (
                                <Select.Option key={o} value={o}>
                                    {o}
                                </Select.Option>
                            ))}
                    </Select>
                </Form.Item>
            );
        case "ability_flaw":
        case "spellcasting":
        case "action":
        case "bonus":
        case "if":
        case "remove_action":
        case "starting_focus":
            return null;
    }
    return (
        <Form.Item label="Unknown bonus" extra={origin}>
            <pre style={{ maxWidth: 400 }}>unknown bonus {JSON.stringify(bonus)}</pre>
        </Form.Item>
    );
}

function trimPrefix(s: string, prefix: string) {
    if (s.startsWith(prefix)) {
        return s.substring(prefix.length);
    }
    return s;
}

function computeFilteredFeats(context: Context, filter: pf.FeatTrait[], value: string) {
    const selectedFeats = Object.fromEntries(computeSelectedFeats(context).map(k => [k, true])) as {
        [id: string]: true;
    };

    let filteredFeats = Object.values(feats);
    for (const pre of filter) {
        const preLevel = trimPrefix(pre, "level:");
        if (preLevel.length != pre.length) {
            filteredFeats = filteredFeats.filter(feat => feat.level <= +preLevel);
            continue;
        }
        const preTraits = trimPrefix(pre, "trait:");
        if (preTraits.length != pre.length) {
            const traits = preTraits.split(",");
            filteredFeats = filteredFeats.filter(feat =>
                traits.every(t => feat.traits.indexOf(t) >= 0),
            );
            continue;
        }
        throw `invalid trait filter ${pre}`;
    }
    filteredFeats = filteredFeats.filter(feat => !selectedFeats[feat.name] || value == feat.name);
    return filteredFeats;
}

function computeFilteredSpells(context: Context, filter: pf.SpellTrait[]) {
    let filteredSpells = Object.values(spells);
    for (const pre of filter) {
        if (pre === "cantrip") {
            filteredSpells = filteredSpells.filter(spell => spell.level == 0);
            continue;
        }
        const preLevel = trimPrefix(pre, "level:");
        if (preLevel.length != pre.length) {
            filteredSpells = filteredSpells.filter(spell => spell.level == +preLevel);
            continue;
        }
        const preTraits = trimPrefix(pre, "trait:");
        if (preTraits.length != pre.length) {
            const traits = preTraits.split(",");
            filteredSpells = filteredSpells.filter(spell =>
                traits.every(t => spell.traits.indexOf(t) >= 0),
            );
            continue;
        }
        const preTradition = trimPrefix(pre, "tradition:");
        if (preTradition.length != pre.length) {
            // TODO: implement "self"
            const tradition = (preTradition == "self" ? "arcane" : preTradition) as pf.Tradition;
            filteredSpells = filteredSpells.filter(spell =>
                spell.traditions.includes(tradition as pf.Tradition),
            );
            continue;
        }
        throw `invalid trait filter ${pre}`;
    }
    return filteredSpells;
}

function computePrerequisite(context: Context, pres: pf.Prerequisite[]) {
    const { level, bonusList, bonusMap } = context;
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
            const level = computeSkillProficiency(context, skill as pf.Skill);
            if (level < profAsNumber(proficiency as pf.Proficiency)) {
                return false;
            }
            continue;
        }
        const preAbility = trimPrefix(pre, "ability:");
        if (preAbility.length != pre.length) {
            const [ability, abilityScore] = preSkill.split(",");
            const [score, mod] = calculateAbility(ability as pf.Ability, context);
            if (score < +abilityScore) {
                return false;
            }
            continue;
        }
        const preSpecial = trimPrefix(pre, "special:");
        if (preSpecial.length != pre.length) {
            const found = bonusList.some(f => f.bonus.k === "special" && f.bonus.id === preSpecial);
            if (!found) {
                return false;
            }
            continue;
        }
        const preFeat = trimPrefix(pre, "feat:");
        if (preFeat.length != pre.length) {
            const found = bonusList.some(f => {
                if (f.bonus.k === "feat") {
                    if (f.bonus.feat) {
                        return f.bonus.feat === preFeat;
                    }
                    const b = bonusMap[f.path];
                    return b.kind === "feat" && b.value === preFeat;
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

function generateAbilityExcludes(
    path: string,
    { bonusMap }: Context,
    choices?: pf.Ability[],
    checkDepth = 1,
): pf.Ability[] {
    const parts = path.split("/");
    const checkPath = parts.slice(0, Math.max(parts.length - checkDepth, 0)).join("/");
    const excludes = {} as { [k in pf.Ability]: any };
    for (const [k, bonus] of Object.entries(bonusMap)) {
        if (k !== path && k.startsWith(checkPath) && bonus.kind === "ability") {
            excludes[bonus.value] = 1;
        }
    }
    if (choices) {
        for (const k of ["STR", "DEX", "CON", "INT", "WIS", "CHA"]) {
            if (choices.indexOf(k as pf.Ability) == -1) {
                excludes[k] = 1;
            }
        }
    }
    return Object.keys(excludes) as pf.Ability[];
}

function computeProficienciesLevels(context: Context) {
    return Object.fromEntries(
        pf.skills.map(skill => [skill, computeSkillProficiency(context, skill)]),
    );
}

function generateSkillExcludes(
    path: string,
    context: Context,
    prof: pf.Proficiency,
    choices?: pf.Skill[],
    upgrade?: boolean,
) {
    const { bonusMap } = context;
    const profLevels = computeProficienciesLevels(context);
    const pathSkill = (bonusMap[path] as BonusKindSkillProf)?.value.skill;
    return Object.entries(profLevels)
        .filter(([skill, level]) => {
            if (pathSkill == skill) {
                return false;
            }
            if (choices && choices.indexOf(skill as pf.Skill) == -1) {
                return false;
            }
            return level >= profAsNumber(prof);
        })
        .map(([skill]) => skill) as pf.Skill[];
}

render(<App />, document.getElementById("wrapper"));
