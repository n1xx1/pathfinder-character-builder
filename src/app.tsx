import React, {
    useState,
    useMemo,
    useEffect,
    Dispatch,
    SetStateAction,
    useRef,
} from "react";
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
    Button,
} from "antd";
import {
    pf,
    ancestries,
    backgrounds,
    classes,
    feats,
    spells,
    ancestryList,
} from "./pathfinder";
import {
    Context,
    profAsNumber,
    computeSkillProficiency,
    computeSelectedFeats,
    calculateAbility,
} from "./utils";
import { CharacterPrinter } from "./character-printer";
import { renderCharacter } from "./character-render";
import _ from "lodash";
import { markdownAction, RenderMarkdown } from "./markdown";
import {
    BonusList,
    BonusListEntry,
    ChoiceAbility,
    ChoiceFeat,
    ChoiceMap,
    ChoiceOption,
    ChoiceSkillProf,
    processCharacter,
} from "./pathfinder/character-processor";

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
    values: ChoiceMap;
}

function saveData(s: AppSavedData) {
    localStorage.setItem("pf-save-data", JSON.stringify(s));
}
function loadData(): AppSavedData {
    const s: Partial<AppSavedData> = JSON.parse(
        localStorage.getItem("pf-save-data") ?? "{}",
    );
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
    const [values, setValues] = useState({} as ChoiceMap);

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
        choices: values,
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

    const bonusList = useMemo(
        () =>
            processCharacter({
                ancestry: pfAncestry,
                heritage: pfHeritage,
                background: pfBackground,
                class: pfClass,
                choices: context.choices,
                level,
            }),
        [pfAncestry, pfHeritage, pfBackground, pfClass, values, level],
    );
    context.bonusList = bonusList;

    const renderedCharacter = useMemo(() => {
        return renderCharacter(context);
    }, [pfAncestry, pfHeritage, pfBackground, pfClass, values, level, name]);

    useEffect(() => {
        if (firstRender.current) {
            const data = loadData();
            loadSave(data);
            firstRender.current = false;
            return;
        }
        saveData(createSave());
    }, [pfAncestry, pfHeritage, pfBackground, pfClass, values, level, name]);

    return (
        <Layout>
            <Layout.Content style={{ padding: "50px" }}>
                <Row style={{ background: "#fff", padding: "20px 0" }}>
                    <Col span={10} style={{ padding: "10px" }}>
                        <Form {...formLayout}>
                            <Form.Item label="Name">
                                <Input
                                    value={name}
                                    onChange={v => setName(v.target.value)}
                                />
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
                        <Input.TextArea
                            rows={20}
                            style={{ marginTop: "20px" }}
                            onChange={e => loadSave(JSON.parse(e.target.value))}
                            value={JSON.stringify(
                                createSave(),
                                undefined,
                                "  ",
                            )}
                        />
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

    function loadSave(data: AppSavedData) {
        setName(data.name);
        setPfAncestryName(data.ancestryName);
        setPfHeritageName(data.heritageName);
        setPfBackgroundName(data.backgroundName);
        setPfClassName(data.className);
        setLevel(data.level);
        setValues(data.values);
    }

    function createSave(): AppSavedData {
        return {
            name,
            ancestryName: pfAncestry?.name ?? "",
            heritageName: pfHeritage?.name ?? "",
            backgroundName: pfBackground?.name ?? "",
            className: pfClass?.name ?? "",
            level,
            values: context.choices,
        };
    }
}

type FixSet = { [id: string]: 0 | 1 }; // 0 exclude, 1 include

function fixValuesMap(context: Context, fixSet: FixSet) {
    const fixSetList = Object.entries(fixSet);
    const bonusMap = { ...context.choices };

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
        delete bonusMap[k];
    }
    return bonusMap;
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
            {!exclude?.includes("STR") && (
                <Select.Option value="STR">Strength</Select.Option>
            )}
            {!exclude?.includes("DEX") && (
                <Select.Option value="DEX">Dexterity</Select.Option>
            )}
            {!exclude?.includes("CON") && (
                <Select.Option value="CON">Constitution</Select.Option>
            )}
            {!exclude?.includes("INT") && (
                <Select.Option value="INT">Intelligence</Select.Option>
            )}
            {!exclude?.includes("WIS") && (
                <Select.Option value="WIS">Wisdom</Select.Option>
            )}
            {!exclude?.includes("CHA") && (
                <Select.Option value="CHA">Charisma</Select.Option>
            )}
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
                <Select.Option value={"intimidation"}>
                    Intimidation
                </Select.Option>
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

function CreationBonusFeat({
    context,
    bonus,
    path,
    onChange,
}: CreationBonusFeatProps) {
    const { choices } = context;
    const value = (choices[path] as ChoiceFeat)?.value;
    const filteredFeats = useMemo(
        () =>
            Object.entries(
                _.groupBy(
                    computeFilteredFeats(context, bonus.filter, value),
                    v => v.level,
                ),
            ).map(([k, v]) => ({
                groupName: `Level ${k}`,
                values: v,
            })),
        [bonus, choices],
    );
    return (
        <Select value={value} onChange={onChange} showSearch>
            {filteredFeats.map(g => (
                <Select.OptGroup label={g.groupName} key={g.groupName}>
                    {g.values.map(f => (
                        <Select.Option key={f.name} value={f.name}>
                            <span
                                style={{
                                    color:
                                        f.prerequisites &&
                                        computePrerequisite(
                                            context,
                                            f.prerequisites,
                                        )
                                            ? "#f00"
                                            : "inherit",
                                }}
                            >
                                {f.name}
                            </span>
                        </Select.Option>
                    ))}
                </Select.OptGroup>
            ))}
        </Select>
    );
}

interface CreationBonusClassFeatProps {
    bonus: pf.BonusClassFeat;
    context: Context;
    path: string;
    onChange: (v: string) => void;
}

function CreationBonusClassFeat({
    context,
    bonus,
    path,
    onChange,
}: CreationBonusClassFeatProps) {
    const { choices } = context;
    const value = (choices[path] as ChoiceFeat)?.value;
    const filteredFeats = useMemo(
        () =>
            Object.entries(
                _.groupBy(
                    computeFilteredClassFeats(context, bonus.level, value),
                    v => v.level,
                ),
            ).map(([k, v]) => ({
                groupName: `Level ${k}`,
                values: v,
            })),
        [bonus, choices],
    );
    return (
        <Select value={value} onChange={onChange} showSearch>
            {filteredFeats.map(g => (
                <Select.OptGroup label={g.groupName} key={g.groupName}>
                    {g.values.map(f => (
                        <Select.Option key={f.name} value={f.name}>
                            <span
                                style={{
                                    color:
                                        f.prerequisites &&
                                        computePrerequisite(
                                            context,
                                            f.prerequisites,
                                        )
                                            ? "#f00"
                                            : "inherit",
                                }}
                            >
                                {f.name}
                            </span>
                        </Select.Option>
                    ))}
                </Select.OptGroup>
            ))}
        </Select>
    );
}

interface CreationBonusAncestryFeatProps {
    bonus: pf.BonusAncestryFeat;
    context: Context;
    path: string;
    onChange: (v: string) => void;
}

function CreationBonusAncestryFeat({
    context,
    bonus,
    path,
    onChange,
}: CreationBonusAncestryFeatProps) {
    const { choices } = context;
    const value = (choices[path] as ChoiceFeat)?.value;
    const filteredFeats = useMemo(
        () =>
            Object.entries(
                _.groupBy(
                    computeFilteredAncestryFeats(context, bonus.level, value),
                    v => v.level,
                ),
            ).map(([k, v]) => ({
                groupName: `Level ${k}`,
                values: v,
            })),
        [bonus, choices],
    );
    return (
        <Select value={value} onChange={onChange} showSearch>
            {filteredFeats.map(g => (
                <Select.OptGroup label={g.groupName} key={g.groupName}>
                    {g.values.map(f => (
                        <Select.Option key={f.name} value={f.name}>
                            <span
                                style={{
                                    color:
                                        f.prerequisites &&
                                        computePrerequisite(
                                            context,
                                            f.prerequisites,
                                        )
                                            ? "#f00"
                                            : "inherit",
                                }}
                            >
                                {f.name}
                            </span>
                        </Select.Option>
                    ))}
                </Select.OptGroup>
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

function CreationBonusSpell({
    context,
    bonus,
    path,
    onChange,
}: CreationBonusSpellProps) {
    const { choices } = context;
    const filteredFeats = useMemo(
        () => computeFilteredSpells(context, bonus.filter),
        [bonus],
    );
    const value = (choices[path] as ChoiceFeat)?.value;
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
    setValues: Dispatch<SetStateAction<ChoiceMap>>;
}

function CreationBonus({
    bonus,
    path,
    setValues,
    context,
    origin,
}: CreationBonusProps) {
    const { choices } = context;
    switch (bonus.k) {
        case "ability":
            if (!bonus.ability) {
                let choice = bonus.choice as pf.Ability[];
                if (bonus.choice?.includes("OTHER")) {
                    const otherAbility: BonusListEntry<pf.BonusSpecial> = context.bonusList.find(
                        f =>
                            f.bonus.k === "special" &&
                            f.bonus.id.startsWith("ability_key_other:"),
                    ) as any;
                    if (otherAbility) {
                        const otherKey = trimPrefix(
                            otherAbility.bonus.id,
                            "ability_key_other:",
                        ) as pf.Ability;
                        choice = bonus.choice.map(c =>
                            c === "OTHER" ? otherKey : c,
                        );
                    } else {
                        choice = bonus.choice.filter(
                            c => c !== "OTHER",
                        ) as pf.Ability[];
                    }
                }

                return (
                    <Form.Item label="Ability Boost" extra={origin}>
                        <AbilitySelect
                            value={(choices[path] as ChoiceAbility)?.value}
                            onChange={v =>
                                setValues(v1 => ({
                                    ...v1,
                                    [path]: { value: v, kind: "ability" },
                                }))
                            }
                            exclude={generateAbilityExcludes(
                                path,
                                context,
                                choice,
                            )}
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
                    const value = (choices[path] as ChoiceSkillProf)?.value
                        ?.skill;
                    return (
                        <Form.Item
                            label={
                                bonus.upgrade
                                    ? `Improve proficiency up to ${
                                          pf.proficiencyName[bonus.proficiency]
                                      } in`
                                    : `Become ${
                                          pf.proficiencyName[bonus.proficiency]
                                      } in`
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
                                                level: profAsNumber(
                                                    bonus.proficiency,
                                                ),
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
                let featKind = "";
                if (bonus.filter?.some(f => f == "trait:General")) {
                    featKind = "General ";
                }
                if (bonus.filter?.some(f => f == "trait:Skill")) {
                    featKind = "Skill ";
                }
                return (
                    <Form.Item label={`${featKind}Feat`} extra={origin}>
                        <CreationBonusFeat
                            bonus={bonus}
                            context={context}
                            path={path}
                            onChange={v =>
                                setValues(v1 => ({
                                    ...v1,
                                    [path]: {
                                        value: v,
                                        kind: "feat",
                                        option: bonus.option,
                                    },
                                }))
                            }
                        />
                    </Form.Item>
                );
            }
            return null;
        case "class_feat":
            return (
                <Form.Item label="Class Feat" extra={origin}>
                    <CreationBonusClassFeat
                        context={context}
                        bonus={bonus}
                        onChange={v =>
                            setValues(v1 => ({
                                ...v1,
                                [path]: { value: v, kind: "feat" },
                            }))
                        }
                        path={path}
                    />
                </Form.Item>
            );
        case "ancestry_feat":
            return (
                <Form.Item label="Ancestry Feat" extra={origin}>
                    <CreationBonusAncestryFeat
                        context={context}
                        bonus={bonus}
                        onChange={v =>
                            setValues(v1 => ({
                                ...v1,
                                [path]: { value: v, kind: "feat" },
                            }))
                        }
                        path={path}
                    />
                </Form.Item>
            );
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
                                setValues(v1 => ({
                                    ...v1,
                                    [path]: { value: v, kind: "spell" },
                                }))
                            }
                        />
                    </Form.Item>
                );
            }
            return null;
        case "option":
            const key = `${path}/key`;
            const value = (choices[key] as ChoiceOption)?.value;
            return (
                <Form.Item label={"Option"} extra={origin}>
                    <Select
                        placeholder="Select..."
                        value={value}
                        onChange={v =>
                            setValues(v1 => ({
                                ...v1,
                                [key]: { value: v, kind: "option" },
                            }))
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
        case "bonus":
            if (bonus.category == "TODO") {
                return (
                    <Form.Item label="Bonus" extra={origin}>
                        TODO
                    </Form.Item>
                );
            }
            return null;
        case "ability_flaw":
        case "spellcasting":
        case "action":
        case "if":
        case "remove_action":
        case "starting_focus":
            return null;
    }
    return (
        <Form.Item label="Unknown bonus" extra={origin}>
            <pre style={{ maxWidth: 400 }}>
                unknown bonus {JSON.stringify(bonus)}
            </pre>
        </Form.Item>
    );
}

function trimPrefix(s: string, prefix: string) {
    if (s.startsWith(prefix)) {
        return s.substring(prefix.length);
    }
    return s;
}

function computeFilteredFeats(
    context: Context,
    filter: pf.FeatTrait[],
    value: string,
) {
    const selectedFeats = Object.fromEntries(
        computeSelectedFeats(context).map(k => [k, true]),
    ) as {
        [id: string]: true;
    };

    let filteredFeats = Object.values(feats);
    for (const pre of filter) {
        const preLevel = trimPrefix(pre, "level:");
        if (preLevel.length != pre.length) {
            filteredFeats = filteredFeats.filter(
                feat => feat.level <= +preLevel,
            );
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
        if (preTraits == "todo:skillful") {
            continue;
        }
        throw `invalid trait filter ${pre}`;
    }
    filteredFeats = filteredFeats.filter(
        feat => !selectedFeats[feat.name] || value == feat.name,
    );
    return filteredFeats;
}

function computeFilteredAncestryFeats(
    context: Context,
    level: number,
    value: string,
) {
    const selectedFeats = Object.fromEntries(
        computeSelectedFeats(context).map(k => [k, true]),
    ) as {
        [id: string]: true;
    };

    let filteredFeats = Object.values(feats)
        .filter(
            feat =>
                feat.traits.some(
                    t => t == "Archetype" || t == context.pfClass.name,
                ) && feat.level <= level,
        )
        .filter(feat => {
            if (feat.prerequisites) {
                return computePrerequisite(context, feat.prerequisites);
            }
            return true;
        });

    filteredFeats = filteredFeats.filter(
        feat => !selectedFeats[feat.name] || value == feat.name,
    );
    return filteredFeats;
}

function computeFilteredClassFeats(
    context: Context,
    level: number,
    value: string,
) {
    const selectedFeats = Object.fromEntries(
        computeSelectedFeats(context).map(k => [k, true]),
    ) as {
        [id: string]: true;
    };

    let filteredFeats = Object.values(feats)
        .filter(
            feat =>
                feat.traits.some(
                    t => t == "Archetype" || t == context.pfClass.name,
                ) && feat.level <= level,
        )
        .filter(feat => {
            if (feat.prerequisites) {
                return computePrerequisite(context, feat.prerequisites);
            }
            return true;
        });

    filteredFeats = filteredFeats.filter(
        feat => !selectedFeats[feat.name] || value == feat.name,
    );
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
            filteredSpells = filteredSpells.filter(
                spell => spell.level == +preLevel,
            );
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
            const tradition = (preTradition == "self"
                ? "arcane"
                : preTradition) as pf.Tradition;
            filteredSpells = filteredSpells.filter(spell =>
                spell.traditions.includes(tradition as pf.Tradition),
            );
            continue;
        }
        throw `invalid spell filter ${pre}`;
    }
    return filteredSpells;
}

function computePrerequisite(context: Context, pres: pf.Prerequisite[]) {
    const { level, bonusList, choices } = context;
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
            const realProficiency = trimPrefix(preSkill, "=");
            if (realProficiency.length != pre.length) {
                if (level != profAsNumber(proficiency as pf.Proficiency)) {
                    return false;
                }
            } else {
                if (level < profAsNumber(proficiency as pf.Proficiency)) {
                    return false;
                }
            }
            continue;
        }
        const preAbility = trimPrefix(pre, "ability:");
        if (preAbility.length != pre.length) {
            const [ability, abilityScore] = preSkill.split(",");
            const [score, mod] = calculateAbility(
                ability as pf.Ability,
                context,
            );
            if (score < +abilityScore) {
                return false;
            }
            continue;
        }
        const preSpecial = trimPrefix(pre, "special:");
        if (preSpecial.length != pre.length) {
            const found = bonusList.some(
                f => f.bonus.k === "special" && f.bonus.id === preSpecial,
            );
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
                    const b = choices[f.path];
                    if (b) {
                        return b.kind === "feat" && b.value === preFeat;
                    }
                }
                if (f.bonus.k == "class_feat") {
                    const b = choices[f.path];
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

function generateAbilityExcludes(
    path: string,
    { choices }: Context,
    abilities?: pf.Ability[],
    checkDepth = 1,
): pf.Ability[] {
    const parts = path.split("/");
    const checkPath = parts
        .slice(0, Math.max(parts.length - checkDepth, 0))
        .join("/");
    const excludes = {} as { [k in pf.Ability]: any };
    for (const [k, bonus] of Object.entries(choices)) {
        if (k !== path && k.startsWith(checkPath) && bonus.kind === "ability") {
            excludes[bonus.value] = 1;
        }
    }
    if (abilities) {
        for (const k of ["STR", "DEX", "CON", "INT", "WIS", "CHA"]) {
            if (abilities.indexOf(k as pf.Ability) == -1) {
                excludes[k] = 1;
            }
        }
    }
    return Object.keys(excludes) as pf.Ability[];
}

function computeProficienciesLevels(context: Context) {
    return Object.fromEntries(
        pf.skills.map(skill => [
            skill,
            computeSkillProficiency(context, skill),
        ]),
    );
}

function generateSkillExcludes(
    path: string,
    context: Context,
    prof: pf.Proficiency,
    skills?: pf.Skill[],
    upgrade?: boolean,
) {
    const { choices } = context;
    const profLevels = computeProficienciesLevels(context);
    const pathSkill = (choices[path] as ChoiceSkillProf)?.value.skill;
    return Object.entries(profLevels)
        .filter(([skill, level]) => {
            if (pathSkill == skill) {
                return false;
            }
            if (skills && skills.indexOf(skill as pf.Skill) == -1) {
                return false;
            }
            if (upgrade) {
                return level >= profAsNumber(prof);
            }
            return level != profAsNumber(prof) - 1;
        })
        .map(([skill]) => skill) as pf.Skill[];
}

render(<App />, document.getElementById("wrapper"));
