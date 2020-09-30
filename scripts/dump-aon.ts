import { fetch, parseDom } from "./utils/fetch";
import { $, findElement, findElementIndex, scanUntil, TagA, TagH2, TagSpan } from "./utils/dom";
import yargs from "yargs";

const BASE_URL = "https://2e.aonprd.com/";

const regexFixPFS = /(<a .*?"PFS\.aspx"><span.*?><img alt="PFS .*?>)<\/a><\/span>/g;
const regexFixPFSReplace = "$1</span></a>";

async function readAon(url) {
    const res = await fetch(url);
    const text = await res.text();
    return parseDom(text.replace(regexFixPFS, regexFixPFSReplace));
}

async function getAllAncestries() {
    const dom = $(await readAon(`${BASE_URL}Ancestries.aspx`));

    const links = dom.find("h2.title>a:last-of-type");
    return Array.from(links).map(l => ({
        url: l.getAttribute("href"),
        name: l.innerText,
    }));
}

interface BookInfo {
    book: string;
    page: number;
    prd?: string;
}

function skipToAfterSource(contents: ChildNode[]): [ChildNode[], ChildNode[], BookInfo] {
    const sourceIndex = findElementIndex(contents, "b", v => v.textContent == "Source");
    const brIndex = findElementIndex(contents.slice(sourceIndex), "br");
    const preContents = contents.slice(0, sourceIndex);
    const sourceContents = contents.slice(sourceIndex, sourceIndex + brIndex + 1);
    const sourceName = findElement(sourceContents, "a").querySelector<TagA>(":scope>i").innerText;
    const [book, page] = sourceName.split(" pg. ");

    // skip FPS notes
    let restContents = contents.slice(sourceIndex + brIndex + 1);
    if (restContents.length > 0 && restContents[0].nodeName == "u") {
        const firstNode = restContents[0] as HTMLElement;
        const firstNodeLink = firstNode.querySelector<TagA>(":scope>a");
        if (firstNodeLink && firstNodeLink.getAttribute("href") == "PFS.aspx") {
            const brIndex = restContents.findIndex(v => v.nodeName == "br");
            restContents = restContents.slice(brIndex + 1);
        }
    }
    return [preContents, restContents, { book, page: +page }];
}

function createElement(dom: Document, contents: ChildNode[]) {
    const div = dom.createElement("div");
    for (const c of contents) {
        div.appendChild(c);
    }
    return div;
}

function getTraits(info: ChildNode[]) {
    return info
        .filter(
            x =>
                x.nodeName == "span" &&
                Array.from((<TagSpan>x).classList).some(c => c.startsWith("trait")),
        )
        .map(x => (<TagSpan>x).querySelector("a").innerText);
}

function getActionKind(url: string) {
    if (url.endsWith("OneAction.png") || url.endsWith("OneAction_I.png")) {
        return { markdown: ":a:", kind: 1 };
    } else if (url.endsWith("TwoActions.png") || url.endsWith("TwoActions_I.png")) {
        return { markdown: ":aa:", kind: 2 };
    } else if (url.endsWith("ThreeActions.png") || url.endsWith("ThreeActions_I.png")) {
        return { markdown: ":aaa:", kind: 3 };
    } else if (url.endsWith("Reaction.png") || url.endsWith("Reaction_I.png")) {
        return { markdown: ":r:", kind: "reaction" };
    } else if (url.endsWith("FreeAction.png") || url.endsWith("FreeAction_I.png")) {
        return { markdown: ":f:", kind: "bonus" };
    } else {
        throw new Error("invalid image: " + url);
    }
}

const hMatcher = /^h[1-6]$/;

function toMarkdown(el: ArrayLike<ChildNode>, out = "") {
    let skipToBr = false;
    for (const [i, e1] of Array.from(el).entries()) {
        if (skipToBr) {
            if (e1.nodeName == "br") {
                skipToBr = false;
            }
            continue;
        }

        if (!e1.nodeName) {
            let s = e1.textContent.replace("\n", " ").replace("\\r", " ");
            if (out.length == 0 || out[-1] == "\n") {
                s = s.trimLeft();
            }
            out += s;
        } else {
            const e = e1 as HTMLElement;
            if (e.nodeName == "br") {
                out += "  \n";
            } else if (e.nodeName == "i") {
                out += "*";
                out = toMarkdown(e.childNodes, out);
                out += "*";
            } else if (e.nodeName == "b") {
                out += "**";
                out = toMarkdown(e.childNodes, out);
                out += "**";
            } else if (e.nodeName == "u") {
                out = toMarkdown(e.childNodes, out);
            } else if (e.nodeName == "a") {
                out = toMarkdown(e.childNodes, out);
            } else if (e.nodeName == "sup") {
                out += "<sup>";
                out = toMarkdown(e.childNodes, out);
                out += "</sup>";
            } else if (e.nodeName == "div") {
                if ("sidebar" in e["class"]) {
                    continue;
                }
                throw new Error("invalid div: " + Array.from(e.classList).join(", "));
            } else if (e.nodeName == "span") {
                if (Array.from(e.classList).some(c => c.startsWith("trait"))) {
                    if (i == 0 || el[i - 1].nodeName != "span") {
                        out += "; ";
                    } else {
                        out += ", ";
                    }
                    out = toMarkdown(e.childNodes, out);
                } else if ((e.getAttribute("style") ?? "").includes("float:right")) {
                    out += " -- ";
                    out = toMarkdown(e.childNodes, out);
                } else if (
                    (e.getAttribute("style") ?? "").includes("float:left") &&
                    e.querySelector("img")
                ) {
                    continue;
                }
                throw new Error(`invalid span: ${e}`);
            } else if (e.nodeName == "ul") {
                for (const li of Array.from(e.childNodes)) {
                    if (li.nodeName == "li") {
                        out += "* ";
                        out = toMarkdown(li.childNodes, out);
                        out += "\n";
                    }
                }
                out += "\n";
            } else if (e.nodeName == "img") {
                out += getActionKind(e["src"])["markdown"];
            } else if (e.nodeName == "table") {
                const rows = e.querySelectorAll(":scope>tr");
                for (const [i, row] of Array.from(rows).entries()) {
                    out += "| ";
                    const cols = row.querySelectorAll(":scope>td");
                    for (const [j, col] of Array.from(cols).entries()) {
                        if (j > 0) {
                            out += " | ";
                        }
                        out = toMarkdown(col.childNodes, out);
                    }
                    out += " |\n";
                    if (i == 0) {
                        out +=
                            "| " +
                            Array.from({ length: cols.length })
                                .map(() => " - ")
                                .join("|") +
                            " |\n";
                    }
                }
            } else if (e.nodeName == "hr") {
                out += "\n\n---\n\n";
            } else if (e.nodeName.match(hMatcher)) {
                out += "\n\n" + "#".repeat(+e.nodeName[1]) + " ";
                out = toMarkdown(e.childNodes, out);
                out += "\n\n";
            } else {
                throw new Error(`cannot markdown: ${e}`);
            }
        }
    }
    return out;
}

async function getAncestryDetail(url: string) {
    const dom = await readAon(url);
    const data = {} as any;

    const pageTitle = dom.querySelector("#ctl00_MainContent_DetailedOutput>h1.title");
    let [contents, ancestryMechanics] = scanUntil(
        pageTitle.nextSibling,
        x => !!x && x.nodeName != "h1",
    ) as [ChildNode[], HTMLElement];

    const [info, ancestryInfo, source] = skipToAfterSource(contents);
    source.prd = url;

    data.name = pageTitle.querySelector<TagA>("a:last-of-type").innerText;
    data.source = source;
    data.traits = getTraits(info);

    const [ancestryMechanicsContents] = scanUntil(ancestryMechanics, x => !!x);
    ancestryMechanics = createElement(dom, ancestryMechanicsContents);

    const titles = ancestryMechanics.querySelectorAll<TagH2>("h2.title");
    for (const c of Array.from(titles)) {
        const title = c.innerText;
        const [contents] = scanUntil(
            c.nextSibling,
            x => !!x && x.nodeName != "h1" && x.nodeName != "h2",
        );

        switch (title) {
            case "Size":
                data.size = contents[0].textContent;
                break;
            case "Hit Points":
                data.hp = contents[0].textContent;
                break;
            case "Speed":
                data.speed = +contents[0].textContent.replace(" feet", "");
                break;
            case "Darkvision":
                data.darkvision = true;
                break;
            case "Low-Light Vision":
                data.lowlight_vision = true;
                break;
            case "Ability Boosts":
                data.ability_boosts = contents.filter(x => !x.nodeName).map(x => x.textContent);
                if (data.ability_boosts[0] == "Two free ability boosts") {
                    data.ability_boosts = ["Free", "Free"];
                }
                break;
            case "Ability Flaw(s)":
                data.ability_boosts = contents.filter(x => !x.nodeName).map(x => x.textContent);
                break;
            case "Languages":
                break;
            default:
                if (!data.other) {
                    data.other = [];
                }
                const desc = toMarkdown(contents);
                data.other.append({ name: title, desc });
                break;
        }
    }

    data.description = toMarkdown(ancestryInfo);
    data.heritages = getAncestryHeritages(url, data.name);
    return data;
}

async function getAncestryHeritages(url: string, name: string) {
    url = url.replace("Ancestries.aspx?ID=", "Heritages.aspx?Ancestry=");
    const dom = await readAon(url);
    const data = {};

    const firstHeritage = dom.querySelector("#ctl00_MainContent_DetailedOutput>h2.title");
    const [contents] = scanUntil(firstHeritage, x => !!x && x.nodeName != "h1");
    const titles = createElement(dom, contents).querySelectorAll<TagH2>(":scope>h2.title");
    for (const c of titles) {
        const nameLink =
    }
}

async function getAllBackgrounds() {
    const dom = await readAon(`${BASE_URL}Backgrounds.aspx`);

    const links = dom.querySelectorAll<TagA>("h2.title>a:last-of-type");
    return Array.from(links).map(l => ({
        url: l.getAttribute("href"),
        name: l.innerText,
    }));
}

async function getAllClasses() {
    const dom = await readAon(`${BASE_URL}Classes.aspx`);

    const links = dom.querySelectorAll<TagA>("#ctl00_MainContent_Navigation>h1>a");
    return Array.from(links)
        .filter(l => l.getAttribute("href")?.startsWith("Classes.aspx"))
        .map(l => ({
            url: l.getAttribute("href"),
            name: l.innerText,
        }));
}

const argv = yargs
    .strict()
    .scriptName("dump-aon")
    .usage("$0 [args]")
    .option("ancestry", {
        alias: "a",
        describe: "download ancestry from URL",
        type: "array",
    })
    .option("all-ancestries", {
        alias: "A",
        describe: "download all ancestries",
        type: "boolean",
    })
    .option("background", {
        alias: "b",
        describe: "download background from URL",
        type: "array",
    })
    .option("all-backgrounds", {
        alias: "B",
        describe: "download all backgrounds",
        type: "boolean",
    })
    .option("class", {
        alias: "c",
        describe: "download class from URL",
        type: "array",
    })
    .option("all-classes", {
        alias: "C",
        describe: "download all classes",
        type: "boolean",
    })
    .option("print", {
        alias: "p",
        describe: "print items",
        type: "boolean",
    })
    .help().argv;

(async () => {
    const ancestries = argv["all-ancestries"]
        ? (await getAllAncestries()).map(a => a.url)
        : argv.ancestry ?? [];
    const backgrounds = argv["all-backgrounds"]
        ? (await getAllBackgrounds()).map(a => a.url)
        : argv.background ?? [];
    const classes = argv["all-classes"]
        ? (await getAllClasses()).map(a => a.url)
        : argv.class ?? [];

    for (const ancestry of ancestries) {
        await getAncestryDetail(ancestry as string);
    }

    console.log(ancestries, backgrounds, classes);
})();
