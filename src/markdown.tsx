import React, { ReactNode, ReactType } from "react";
import ReactMarkdown, { MarkdownAbstractSyntaxTree, RenderProps } from "react-markdown";
import htmlParser from "react-markdown/plugins/html-parser";
import visit from "unist-util-visit";
import classnames from "classnames";
import { pf } from "./pathfinder";

type Plugin = (
    node: MarkdownAbstractSyntaxTree,
    renderProps?: RenderProps,
) => MarkdownAbstractSyntaxTree;

const actionRegex = /(\:(?:a|aa|aaa|r|f)\:)/;

export function markdownAction(s: pf.ActionKind): string {
    switch (s) {
        case 1:
            return ":a:";
        case 2:
            return ":aa:";
        case 3:
            return ":aaa:";
        case "reaction":
            return ":r:";
        case "bonus":
            return ":f:";
    }
    return "";
}

export function getActionKind(s: string): pf.ActionKind {
    switch (s) {
        case ":a:":
            return 1;
        case ":aa:":
            return 2;
        case ":aaa:":
            return 3;
        case ":r:":
            return "reaction";
        case ":f:":
            return "bonus";
    }
}

interface TagListProps {
    children?: ReactNode;
}
export function TagList({ children }: TagListProps) {
    return <div className="pf2-trait-container">{children}</div>;
}

interface TagProps {
    children?: ReactNode;
    className?: string;
}
export function Tag({ children, className }: TagProps) {
    return <div className={classnames("pf2-trait", className)}>{children}</div>;
}

interface ActionProps {
    value: pf.ActionKind;
}

export function Action({ value }: ActionProps) {
    switch (value) {
        case 1:
            return (
                <img
                    style={{ height: "1em" }}
                    src="https://2e.aonprd.com/Images/Actions/OneAction.png"
                />
            );
        case 2:
            return (
                <img
                    style={{ height: "1em" }}
                    src="https://2e.aonprd.com/Images/Actions/TwoActions.png"
                />
            );
        case 3:
            return (
                <img
                    style={{ height: "1em" }}
                    src="https://2e.aonprd.com/Images/Actions/ThreeActions.png"
                />
            );
        case "bonus":
            return (
                <img
                    style={{ height: "1em" }}
                    src="https://2e.aonprd.com/Images/Actions/FreeAction.png"
                />
            );
        case "reaction":
            return (
                <img
                    style={{ height: "1em" }}
                    src="https://2e.aonprd.com/Images/Actions/Reaction.png"
                />
            );
    }
    return <></>;
}

type Tree = MarkdownAbstractSyntaxTree;
type VisitReturnType = void | true | false | "skip" | number | [true | false | "skip", number];
type TreeVisitor = (node: Tree, index: number, parent: Tree) => VisitReturnType;

function visitTree(tree: Tree, fnOrSearch: TreeVisitor | string, fn?: TreeVisitor) {
    if (fn !== undefined) {
        const fn1 = (node: Tree, index: number, parent: Tree) => {
            return fn(node, index, parent);
        };
        visit(tree as any, fnOrSearch as any, fn1);
    } else {
        const fn1 = (node: Tree, index: number, parent: Tree) => {
            return (fnOrSearch as any)(node, index, parent);
        };
        visit(tree as any, fn1);
    }
}
function scanUntil(children: Tree[], check: (v: Tree) => boolean): number {
    let i = 0;
    while (i < children.length) {
        if (check(children[i])) {
            break;
        }
        i++;
    }
    return i;
}
function arrayJoin<T>(arr: T[], join: () => T) {
    const newArr: T[] = [];
    for (let i = 0; i < arr.length; i++) {
        if (i > 0) {
            newArr.push(join());
        }
        newArr.push(arr[i]);
    }
    return newArr;
}
function splitNodes(nodes: Tree[]) {
    let cur: Tree[] = [];
    const ret: Tree[][] = [cur];
    for (const node of nodes) {
        if (node.type == "text" && node.value.includes(",")) {
            const values = node.value.split(",").map(v => ({
                type: "text",
                value: v,
                position: node.position,
            }));
            if (values[0].value.length > 0) {
                cur.push(values[0]);
            }
            ret.push(...values.slice(1).map(x => [x]));
            cur = ret[ret.length - 1];
        } else {
            cur.push(node);
        }
    }
    for (const retNode of ret) {
        if (retNode.length > 0 && retNode[0].type == "text") {
            retNode[0].value = retNode[0].value.trimLeft();
        }
        if (retNode.length > 0 && retNode[retNode.length - 1].type == "text") {
            retNode[retNode.length - 1].value = retNode[retNode.length - 1].value.trimRight();
        }
    }
    return ret;
}

const traitClassNames = {
    Rare: "pf2-trait-rare",
    Uncommon: "pf2-trait-uncommon",
    Unique: "pf2-trait-unique",
    CE: "pf2-trait-alignment",
    NE: "pf2-trait-alignment",
    LE: "pf2-trait-alignment",
    CN: "pf2-trait-alignment",
    N: "pf2-trait-alignment",
    LN: "pf2-trait-alignment",
    CG: "pf2-trait-alignment",
    NG: "pf2-trait-alignment",
    LG: "pf2-trait-alignment",
};

function traitParser(tree: Tree, renderProps: RenderProps) {
    visitTree(tree, "paragraph", (node, index, parent) => {
        if (node.children?.length && node.children[0].type == "text") {
            const firstNode = node.children[0];
            if (firstNode.value.startsWith("; ")) {
                const len = scanUntil(node.children.slice(1), v => v.type == "break");
                firstNode.value = firstNode.value.substr(2); // skip "; "
                const split = splitNodes(node.children.slice(0, 1 + len));

                const nowEmpty = node.children.length == 1 + len;

                node.children.splice(0, 1 + len);

                parent.children.splice(index, nowEmpty ? 1 : 0, {
                    type: "pf2TraitContainer",
                    position: node.position,
                    children: arrayJoin(
                        split.map(s => {
                            let className: string = undefined;
                            if (s.length == 1 && s[0].type == "text") {
                                className = traitClassNames[s[0].value];
                            }
                            return {
                                type: "pf2Trait",
                                position: s[0].position,
                                children: s,
                                className,
                            } as any;
                        }),
                        () => ({ type: "text", position: node.position, value: " " } as Tree),
                    ),
                } as any);
                return index + 1;
            }
        }
    });
    return tree;
}

function actionParser(tree: Tree, renderProps: RenderProps) {
    visitTree(tree, "text", (node, index, parent) => {
        const matches = node.value.split(actionRegex);
        if (matches.length > 1) {
            const replace = matches
                .filter(m => m.length > 0)
                .map(m => {
                    const actionKind = getActionKind(m);
                    if (actionKind) {
                        return {
                            type: "pf2Action",
                            position: node.position,
                            value: actionKind as any,
                        };
                    }
                    return { type: "text", position: node.position, value: m };
                });

            parent.children.splice(index, 1, ...replace);
            return index + replace.length;
        }
        return true;
    });
    return tree;
}

const markdownPlugins: Plugin[] = [
    htmlParser(),
    actionParser,
    traitParser,
    (tree, renderProps) => {
        visit(tree as any, node => {
            //console.log(node);
            return true;
        });
        return tree;
    },
];
const markdownRenderers: { [nodeType: string]: ReactType } = {
    pf2TraitContainer: TagList,
    pf2Trait: Tag,
    pf2Action: Action,
};

interface RenderMarkdownProps {
    source: string;
}

export function RenderMarkdown({ source }: RenderMarkdownProps) {
    return (
        <ReactMarkdown
            escapeHtml={false}
            source={source}
            astPlugins={markdownPlugins}
            renderers={markdownRenderers}
        />
    );
}
