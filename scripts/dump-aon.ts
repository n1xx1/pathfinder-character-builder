import { fetch, parseDom } from "./utils/fetch";
import yargs from "yargs";
import cheerio from "cheerio";

import Root = cheerio.Root;
import Cheerio = cheerio.Cheerio;

const BASE_URL = "https://2e.aonprd.com/";

const regexFixPFS = /(<a .*?"PFS\.aspx"><span.*?><img alt="PFS .*?>)<\/a><\/span>/g;
const regexFixPFSReplace = "$1</span></a>";

async function readAon(url: string) {
    const res = await fetch(url);
    const text = await res.text();
    return cheerio.load(text.replace(regexFixPFS, regexFixPFSReplace));
}

async function getAllAncestries() {
    const $ = await readAon(`${BASE_URL}Ancestries.aspx`);

    const links = $("h2.title>a:last-of-type");
    return links.toArray().map(l => ({
        url: BASE_URL + $(l).attr("href"),
        name: $(l).text(),
    }));
}

interface BookInfo {
    book: string;
    page: number;
    prd?: string;
}

function skipToAfterSource(contents: Cheerio): [Cheerio, Cheerio, BookInfo] {
    const preContents = contents.nextUntil("b:contains('Source')");
    const sourceContents = preContents.last().next().nextUntil("br");

    const sourceName = sourceContents.filter("a").find(">i").text();
    const [book, page] = sourceName.split(" pg. ");

    throw "test";
    // skip FPS notes
    // let restContents = contents.slice(sourceIndex + brIndex + 1);
    // if (restContents.length > 0 && restContents[0].nodeName == "u") {
    //     const firstNode = restContents[0] as HTMLElement;
    //     const firstNodeLink = firstNode.querySelector<TagA>(">a");
    //     if (firstNodeLink && firstNodeLink.getAttribute("href") == "PFS.aspx") {
    //         const brIndex = restContents.findIndex(v => v.nodeName == "br");
    //         restContents = restContents.slice(brIndex + 1);
    //     }
    // }
    // return [preContents, restContents, { book, page: +page }];
}

function getTraits($: Root, info: Cheerio) {
    return info
        .filter((i, x) => x.tagName == "span" && (x.attribs["class"]?.includes("trait") ?? false))
        .toArray()
        .map(x => $(x).find("a").text());
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

function toMarkdown($: Root, el: Cheerio, out = "") {
    let skipToBr = false;
    el.each((i, e) => {
        if (skipToBr) {
            if (e.tagName == "br") {
                skipToBr = false;
            }
            return;
        }
        if (!e.tagName) {
            let s = e.nodeValue.replace("\n", " ").replace("\\r", " ");
            if (out.length == 0 || out[-1] == "\n") {
                s = s.trimLeft();
            }
            out += s;
        } else if (e.tagName == "br") {
            out += "  \n";
        } else if (e.tagName == "i") {
            out += "*";
            out = toMarkdown($, $(e).contents(), out);
            out += "*";
        } else if (e.tagName == "b") {
            out += "**";
            out = toMarkdown($, $(e).contents(), out);
            out += "**";
        } else if (e.tagName == "u") {
            out = toMarkdown($, $(e).contents(), out);
        } else if (e.tagName == "a") {
            out = toMarkdown($, $(e).contents(), out);
        } else if (e.tagName == "sup") {
            out += "<sup>";
            out = toMarkdown($, $(e).contents(), out);
            out += "</sup>";
        } else if (e.tagName == "div") {
            if ($(e).hasClass("sidebar")) {
                return;
            }
            throw new Error("invalid div: " + $(e).attr("class"));
        } else if (e.tagName == "span") {
            if (
                $(e)
                    .attr("class")
                    .split("s+")
                    .some(c => c.startsWith("trait"))
            ) {
                if (i == 0 || el[i - 1].tagName != "span") {
                    out += "; ";
                } else {
                    out += ", ";
                }
                out = toMarkdown($, $(e).contents(), out);
            } else if ($(e).css("float") == "right") {
                out += " -- ";
                out = toMarkdown($, $(e).contents(), out);
            } else if ($(e).css("float") == "left" && $(e).find("img")) {
                return;
            }
            throw new Error(`invalid span: ${e}`);
        } else if (e.tagName == "ul") {
            $(e)
                .find(">li")
                .each((j, li) => {
                    out += "* ";
                    out = toMarkdown($, $(li).contents(), out);
                    out += "\n";
                });
            out += "\n";
        } else if (e.tagName == "img") {
            out += getActionKind($(e).attr("src"))["markdown"];
        } else if (e.tagName == "table") {
            const rows = $(e)
                .find(">tr")
                .each((j, row) => {
                    out += "| ";
                    const cols = $(row)
                        .find(">td")
                        .each((k, col) => {
                            if (k > 0) {
                                out += " | ";
                            }
                            out = toMarkdown($, $(col).contents(), out);
                        });
                    for (const [j, col] of Array.from(cols).entries()) {
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
                });
        } else if (e.tagName == "hr") {
            out += "\n\n---\n\n";
        } else if (e.tagName.match(hMatcher)) {
            out += "\n\n" + "#".repeat(+e.tagName[1]) + " ";
            out = toMarkdown($, $(e).contents(), out);
            out += "\n\n";
        } else {
            throw new Error(`cannot markdown: ${e}`);
        }
    });

    return out;
}

function debugCheerio($: Root, c: Cheerio) {
    console.log(
        c
            .toArray()
            .map(e => $(e).clone().wrap("<container />").parent().html())
            .join("; "),
    );
}

async function getAncestryDetail(url: string) {
    const $ = await readAon(url);

    const data = {} as any;

    const pageTitle = $("#ctl00_MainContent_DetailedOutput>h1.title").eq(0);

    const contents = pageTitle.next().nextUntil("h1");
    debugCheerio($, pageTitle);
    debugCheerio($, contents);

    const contentsStart = $("<div>").append(contents).children().first();
    const anchestryMechanics = contents.last();

    const [info, ancestryInfo, source] = skipToAfterSource(contentsStart);
    source.prd = url;

    data.name = pageTitle.find("a:last-of-type").text();
    data.source = source;
    data.traits = getTraits($, info);
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
    const $ = await readAon(url);
    const data = {};

    const firstHeritage = $("#ctl00_MainContent_DetailedOutput>h2.title");
    const contents = firstHeritage.nextUntil("h1");
    const titles = $("<div>").append(contents).find(">h2.title");

    console.log(titles);
}

async function getAllBackgrounds() {
    const $ = await readAon(`${BASE_URL}Backgrounds.aspx`);

    const links = $("h2.title>a:last-of-type");
    return links.toArray().map(l => ({
        url: $(l).attr("href"),
        name: $(l).text(),
    }));
}

async function getAllClasses() {
    const $ = await readAon(`${BASE_URL}Classes.aspx`);

    const links = $("#ctl00_MainContent_Navigation>h1>a");
    return links
        .filter((i, l) => $(l).attr("href")?.startsWith("Classes.aspx"))
        .toArray()
        .map(l => ({
            url: $(l).attr("href"),
            name: $(l).text(),
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
