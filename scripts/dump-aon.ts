import { fetch, parseDom } from "./utils";
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
    const dom = await readAon(`${BASE_URL}Ancestries.aspx`);

    const links = dom.querySelectorAll<HTMLAnchorElement>("h2.title>a:last-of-type");
    return Array.from(links).map(l => ({
        url: l.getAttribute("href"),
        name: l.innerText,
    }));
}

async function getAllBackgrounds() {
    const dom = await readAon(`${BASE_URL}Backgrounds.aspx`);

    const links = dom.querySelectorAll<HTMLAnchorElement>("h2.title>a:last-of-type");
    return Array.from(links).map(l => ({
        url: l.getAttribute("href"),
        name: l.innerText,
    }));
}

async function getAllClasses() {
    const dom = await readAon(`${BASE_URL}Classes.aspx`);

    const links = dom.querySelectorAll<HTMLAnchorElement>("#ctl00_MainContent_Navigation>h1>a");
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
        : argv.ancestry ?? [];

    console.log(ancestries, backgrounds, classes);
})();
