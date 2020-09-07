import * as React from "react";
import * as _ from "lodash";
import { pf } from "./pathfinder/definitions";
import { BonusMap, calculateAbility, Context, profFromNumber, computeSkillProficiency } from "./utils";
import { RenderedCharacter } from "./character-render";
import { Descriptions, Row, Col, Typography, List, Table } from "antd";

export interface CharacterPrinterProps {
    pc: RenderedCharacter;
}

export function CharacterPrinter({ pc }: CharacterPrinterProps) {
    return (
        <>
            <Row>
                <Col span={24}>
                    <Typography.Title>{pc.name || "Unnamed"}</Typography.Title>

                    <Descriptions bordered>
                        <Descriptions.Item label="Ancestry" span={3}>
                            {pc.ancestry}
                            {pc.heritage && ` (${pc.heritage})`}
                        </Descriptions.Item>
                        <Descriptions.Item label="Background" span={3}>
                            {pc.background}
                        </Descriptions.Item>
                        <Descriptions.Item label="Class" span={3}>
                            {pc.class ? `${pc.class} ${pc.level}` : ""}
                        </Descriptions.Item>
                    </Descriptions>
                </Col>
            </Row>
            <Row>
                <Col span={12} style={{ padding: "10px" }}>
                    <Descriptions title="Abilities" bordered>
                        <Descriptions.Item span={3} label="Strength">
                            {printMod(pc.abilities.STR.mod)} ({pc.abilities.STR.score})
                        </Descriptions.Item>
                        <Descriptions.Item span={3} label="Dexterity">
                            {printMod(pc.abilities.DEX.mod)} ({pc.abilities.DEX.score})
                        </Descriptions.Item>
                        <Descriptions.Item span={3} label="Constitution">
                            {printMod(pc.abilities.CON.mod)} ({pc.abilities.CON.score})
                        </Descriptions.Item>
                        <Descriptions.Item span={3} label="Intelligence">
                            {printMod(pc.abilities.INT.mod)} ({pc.abilities.INT.score})
                        </Descriptions.Item>
                        <Descriptions.Item span={3} label="Wisdom">
                            {printMod(pc.abilities.WIS.mod)} ({pc.abilities.WIS.score})
                        </Descriptions.Item>
                        <Descriptions.Item span={3} label="Charisma">
                            {printMod(pc.abilities.CHA.mod)} ({pc.abilities.CHA.score})
                        </Descriptions.Item>
                    </Descriptions>
                </Col>
                <Col span={12} style={{ padding: "10px" }}>
                    <Descriptions title="Skills" bordered>
                        <Descriptions.Item span={3} label={`Acrobatics (${pc.skills["acrobatics"].prof})`}>
                            {printMod(pc.skills["acrobatics"].mod)}
                        </Descriptions.Item>
                        <Descriptions.Item span={3} label={`Arcana (${pc.skills["arcana"].prof})`}>
                            {printMod(pc.skills["arcana"].mod)}
                        </Descriptions.Item>
                        <Descriptions.Item span={3} label={`Athletics (${pc.skills["athletics"].prof})`}>
                            {printMod(pc.skills["athletics"].mod)}
                        </Descriptions.Item>
                        <Descriptions.Item span={3} label={`Crafting (${pc.skills["crafting"].prof})`}>
                            {printMod(pc.skills["crafting"].mod)}
                        </Descriptions.Item>
                        <Descriptions.Item span={3} label={`Deception (${pc.skills["deception"].prof})`}>
                            {printMod(pc.skills["deception"].mod)}
                        </Descriptions.Item>
                        <Descriptions.Item span={3} label={`Diplomacy (${pc.skills["diplomacy"].prof})`}>
                            {printMod(pc.skills["diplomacy"].mod)}
                        </Descriptions.Item>
                        <Descriptions.Item span={3} label={`Intimidation (${pc.skills["intimidation"].prof})`}>
                            {printMod(pc.skills["intimidation"].mod)}
                        </Descriptions.Item>
                        <Descriptions.Item span={3} label={`Medicine (${pc.skills["medicine"].prof})`}>
                            {printMod(pc.skills["medicine"].mod)}
                        </Descriptions.Item>
                        <Descriptions.Item span={3} label={`Nature (${pc.skills["nature"].prof})`}>
                            {printMod(pc.skills["nature"].mod)}
                        </Descriptions.Item>
                        <Descriptions.Item span={3} label={`Occultism (${pc.skills["occultism"].prof})`}>
                            {printMod(pc.skills["occultism"].mod)}
                        </Descriptions.Item>
                        <Descriptions.Item span={3} label={`Performance (${pc.skills["performance"].prof})`}>
                            {printMod(pc.skills["performance"].mod)}
                        </Descriptions.Item>
                        <Descriptions.Item span={3} label={`Religion (${pc.skills["religion"].prof})`}>
                            {printMod(pc.skills["religion"].mod)}
                        </Descriptions.Item>
                        <Descriptions.Item span={3} label={`Society (${pc.skills["society"].prof})`}>
                            {printMod(pc.skills["society"].mod)}
                        </Descriptions.Item>
                        <Descriptions.Item span={3} label={`Stealth (${pc.skills["stealth"].prof})`}>
                            {printMod(pc.skills["stealth"].mod)}
                        </Descriptions.Item>
                        <Descriptions.Item span={3} label={`Survival (${pc.skills["survival"].prof})`}>
                            {printMod(pc.skills["survival"].mod)}
                        </Descriptions.Item>
                        <Descriptions.Item span={3} label={`Thievery (${pc.skills["thievery"].prof})`}>
                            {printMod(pc.skills["thievery"].mod)}
                        </Descriptions.Item>
                    </Descriptions>
                </Col>
            </Row>

            <Row>
                <Col span={12} style={{ padding: "10px" }}>
                    <Descriptions title="Actions and Activities" bordered>
                        {pc.actions.map(a => (
                            <Descriptions.Item key={a} span={3} label={a}>
                                "{a}" description
                            </Descriptions.Item>
                        ))}
                    </Descriptions>
                </Col>
                <Col span={12} style={{ padding: "10px" }}>
                    <Descriptions title="Bonus" bordered>
                        {_.entries(_.groupBy(pc.bonuses, b => b.category)).map(([k, cat]) => (
                            <Descriptions.Item key={k} span={3} label={k}>
                                <List>
                                    {cat.map(({ text }, i) => (
                                        <List.Item key={i}>{formatBonus(pc, text)}</List.Item>
                                    ))}
                                </List>
                            </Descriptions.Item>
                        ))}
                    </Descriptions>
                </Col>
            </Row>
            <Row>
                <Col span={12} style={{ padding: "10px" }}>
                    <Descriptions title="Feats" bordered>
                        {pc.feats.map(f => (
                            <Descriptions.Item key={f} span={3} label={f}>
                                "{f}" description
                            </Descriptions.Item>
                        ))}
                    </Descriptions>
                </Col>
            </Row>
            {pc.spellcasting && (
                <Row>
                    <Col span={12}>
                        <Table
                            dataSource={pc.spellcasting.slots.slice(1).map((s, i) => ({
                                key: i,
                                level: i,
                                "0": s[0] || "-",
                                "1": s[1] || "-",
                                "2": s[2] || "-",
                                "3": s[3] || "-",
                                "4": s[4] || "-",
                                "5": s[5] || "-",
                                "6": s[6] || "-",
                                "7": s[7] || "-",
                                "8": s[8] || "-",
                                "9": s[9] || "-",
                                "10": s[10] || "-",
                            }))}
                            columns={[
                                { title: "Level", dataIndex: "level", key: "level" },
                                { title: "Cantrips", dataIndex: "0", key: "0" },
                                { title: "1st", dataIndex: "1", key: "1" },
                                { title: "2nd", dataIndex: "2", key: "2" },
                                { title: "3rd", dataIndex: "3", key: "3" },
                                { title: "4th", dataIndex: "4", key: "4" },
                                { title: "5th", dataIndex: "5", key: "5" },
                                { title: "6th", dataIndex: "6", key: "6" },
                                { title: "7th", dataIndex: "7", key: "7" },
                                { title: "8th", dataIndex: "8", key: "8" },
                                { title: "9th", dataIndex: "9", key: "9" },
                                { title: "10th", dataIndex: "10", key: "10" },
                            ]}
                            pagination={false}
                            size="small"
                        />
                    </Col>
                </Row>
            )}
        </>
    );
}

export function CharacterPrinterAbility({ abilities }: { abilities: RenderedCharacter["abilities"] }) {}

function printMod(x: number) {
    if (x >= 0) {
        return `+${x}`;
    }
    return `${x}`;
}

const createFormatFunction = functionCreator(
    {
        max: Math.max,
        min: Math.min,
        ceil: Math.ceil,
        floor: Math.floor,
    },
    ["level"],
);

function formatBonus(pc: RenderedCharacter, text: string) {
    return text.replace(/\{(.*?)\}/g, (a, b) => {
        const value = createFormatFunction(b, {
            level: pc.level,
        });
        if (typeof value === "number") {
            return value.toString();
        }
        return value;
    });
}

function functionCreator(data: any, dyndatadefs: string[]) {
    const initializer = [
        ...Object.keys(data).map(d => `var ${d} = __data.${d}`),
        ...dyndatadefs.map(d => `var ${d} = __dyndata.${d}`),
    ].join("; ");

    return function (body: string, dyndata: any) {
        return new Function("__data", "__dyndata", `${initializer}; return ${body};`).call(undefined, data, dyndata);
    };
}
