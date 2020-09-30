import { fetch, parseDom } from "./utils/fetch";
import { create$, QueryDOM, scanUntil, TagA, TagH1, TagH2, TagSpan } from "./utils/dom";
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
    const $ = create$(await readAon(`${BASE_URL}Ancestries.aspx`));

    const links = $<TagA>("h2.title>a:last-of-type");
    return links.map(l => ({
        url: BASE_URL + l.attr("href"),
        name: l.text(),
    }));
}

interface BookInfo {
    book: string;
    page: number;
    prd?: string;
}

function skipToAfterSource(contents: QueryDOM): [ChildNode[], ChildNode[], BookInfo] {
    const preContents = contents.nextUntil(v => v.prop("nodeName") == "b" && v.text() == "Source");
    const sourceContents = preContents
        .last()
        .next()
        .nextUntil(v => v.prop("nodeName") == "br");

    const sourceName = sourceContents.filter("a").find<TagA>(":scope>i").text();
    const [book, page] = sourceName.split(" pg. ");

    throw "test";
    // skip FPS notes
    // let restContents = contents.slice(sourceIndex + brIndex + 1);
    // if (restContents.length > 0 && restContents[0].nodeName == "u") {
    //     const firstNode = restContents[0] as HTMLElement;
    //     const firstNodeLink = firstNode.querySelector<TagA>(":scope>a");
    //     if (firstNodeLink && firstNodeLink.getAttribute("href") == "PFS.aspx") {
    //         const brIndex = restContents.findIndex(v => v.nodeName == "br");
    //         restContents = restContents.slice(brIndex + 1);
    //     }
    // }
    // return [preContents, restContents, { book, page: +page }];
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
    const $ = create$(await readAon(url));

    const data = {} as any;

    const pageTitle = $<TagH1>("#ctl00_MainContent_DetailedOutput>h1.title");

    const contents = pageTitle.nextUntil(x => x.prop("nodeName") == "h1");
    console.log(pageTitle.html());
    console.log(contents.html());

    const contentsStart = $("<div>").append(contents).children()[0];
    const anchestryMechanics = contents.last();

    const [info, ancestryInfo, source] = skipToAfterSource(contentsStart);
    source.prd = url;

    data.name = pageTitle.find<TagA>("a:last-of-type").text();
    data.source = source;
    data.traits = getTraits(info);
    //
    // const [ancestryMechanicsContents] = scanUntil(ancestryMechanics, x => !!x);
    // ancestryMechanics = createElement(dom, ancestryMechanicsContents);
    //
    // const titles = ancestryMechanics.querySelectorAll<TagH2>("h2.title");
    // for (const c of Array.from(titles)) {
    //     const title = c.innerText;
    //     const [contents] = scanUntil(
    //         c.nextSibling,
    //         x => !!x && x.nodeName != "h1" && x.nodeName != "h2",
    //     );
    //
    //     switch (title) {
    //         case "Size":
    //             data.size = contents[0].textContent;
    //             break;
    //         case "Hit Points":
    //             data.hp = contents[0].textContent;
    //             break;
    //         case "Speed":
    //             data.speed = +contents[0].textContent.replace(" feet", "");
    //             break;
    //         case "Darkvision":
    //             data.darkvision = true;
    //             break;
    //         case "Low-Light Vision":
    //             data.lowlight_vision = true;
    //             break;
    //         case "Ability Boosts":
    //             data.ability_boosts = contents.filter(x => !x.nodeName).map(x => x.textContent);
    //             if (data.ability_boosts[0] == "Two free ability boosts") {
    //                 data.ability_boosts = ["Free", "Free"];
    //             }
    //             break;
    //         case "Ability Flaw(s)":
    //             data.ability_boosts = contents.filter(x => !x.nodeName).map(x => x.textContent);
    //             break;
    //         case "Languages":
    //             break;
    //         default:
    //             if (!data.other) {
    //                 data.other = [];
    //             }
    //             const desc = toMarkdown(contents);
    //             data.other.append({ name: title, desc });
    //             break;
    //     }
    // }
    //
    // data.description = toMarkdown(ancestryInfo);
    // data.heritages = getAncestryHeritages(url, data.name);
    return data;
}

async function getAncestryHeritages(url: string, name: string) {
    url = url.replace("Ancestries.aspx?ID=", "Heritages.aspx?Ancestry=");
    const $ = create$(await readAon(url));
    const data = {};

    const firstHeritage = $<TagH2>("#ctl00_MainContent_DetailedOutput>h2.title")[0];
    const contents = firstHeritage.nextUntil("h1");
    const titles = $("<div>").append(contents).find<TagH2>(">h2.title");
}

async function getAllBackgrounds() {
    const $ = create$(await readAon(`${BASE_URL}Backgrounds.aspx`));

    const links = $<TagA>("h2.title>a:last-of-type");
    return links.map(l => ({
        url: l.attr("href"),
        name: l.text(),
    }));
}

async function getAllClasses() {
    const $ = create$(await readAon(`${BASE_URL}Classes.aspx`));

    const links = $<TagA>("#ctl00_MainContent_Navigation>h1>a");
    return links
        .filter(l => l.attr("href")?.startsWith("Classes.aspx"))
        .map(l => ({
            url: l.attr("href"),
            name: l.text(),
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
        console.log(ancestry);
        await getAncestryDetail(ancestry as string);
    }

    console.log(ancestries, backgrounds, classes);
})();
