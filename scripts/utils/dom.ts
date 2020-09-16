import _ from "lodash";

export function scanUntil(e: ChildNode, until: (x: ChildNode) => boolean) {
    const ret: ChildNode[] = [];
    while (until(e)) {
        ret.push(e);
        e = e.nextSibling;
    }
    return [ret, e] as [ChildNode[], ChildNode];
}

export function findElement<K extends keyof HTMLElementTagNameMap, T>(
    contents: ChildNode[],
    names: K[],
    predicate?: (el: ChildNode) => boolean,
): HTMLElementTagNameMap[K];
export function findElement<K extends keyof HTMLElementTagNameMap, T>(
    contents: ChildNode[],
    names: K,
    predicate?: (el: ChildNode) => boolean,
): HTMLElementTagNameMap[K];
export function findElement(
    contents: ChildNode[],
    names: string[] | string,
    predicate?: (el: ChildNode) => boolean,
) {
    const index = findElementIndex(contents, names, predicate);
    return index == -1 ? null : contents[index];
}

export function findElementIndex(
    contents: ChildNode[],
    names: string[] | string,
    predicate?: (el: ChildNode) => boolean,
) {
    names = Array.isArray(names) ? names : [names];
    return contents.findIndex(v => names.includes(v.nodeName) && (!predicate || predicate(v)));
}

class QueryDOM<T extends HTMLElement> {
    e: T[];

    constructor(e: T[], query: string) {
        if (query) {
            this.e = e.filter(e => e.matches(query));
        } else {
            this.e = e;
        }
    }

    *[Symbol.iterator]() {
        for (const x of this.e) {
            yield x;
        }
    }

    find<K extends keyof HTMLElementTagNameMap>(x: K): QueryDOM<HTMLElementTagNameMap[K]>;
    find<E extends HTMLElement = HTMLElement>(x: string): QueryDOM<E>;
    find(query: string) {
        if (query.trimLeft().startsWith(">")) {
            query = ":scope " + query;
        }
        return queryDOM(
            _.flatten(this.e.map(e => Array.from(e.querySelectorAll(query)))) as HTMLElement[],
        );
    }
    children(filter?: string) {
        return queryDOM(
            _.flatten(this.e.map(e => Array.from(e.children) as HTMLElement[])),
            filter,
        );
    }
    siblings(filter?: string) {
        return queryDOM(
            this.parent()
                .children(filter)
                .e.filter(x => this.e.every(e => x !== e)),
        );
    }
    next(filter?: string) {
        return queryDOM(
            this.e.map(e => e.nextElementSibling).filter(e => e) as HTMLElement[],
            filter,
        );
    }
    nextAll(filter?: string) {
        return queryDOM(
            _.flatten(
                this.e.map(e => {
                    const r = [] as HTMLElement[];
                    let e1 = e.nextElementSibling;
                    while (e1) {
                        r.push(e1 as HTMLElement);
                        e1 = e1.nextElementSibling;
                    }
                    return r;
                }),
            ),
            filter,
        );
    }
    nextUntil(query: string, filter?: string) {
        return queryDOM(
            _.flatten(
                this.e.map(e => {
                    const r = [] as HTMLElement[];
                    let e1 = e.nextElementSibling;
                    while (e1 && e1.matches(query)) {
                        r.push(e1 as HTMLElement);
                        e1 = e1.nextElementSibling;
                    }
                    return r;
                }),
            ),
            filter,
        );
    }
    text() {
        return this.e.map(e => e.innerText).join("");
    }
    html() {
        return this.e.map(e => e.innerHTML).join("");
    }
    is(query: string) {
        return queryDOM(this.e, query);
    }
    parent(query?: string) {
        return queryDOM(
            _.uniqWith(
                this.e.map(e => e.parentElement),
                (a, b) => a === b,
            ),
            query,
        );
    }
    getter(index: number) {
        return this.e[index];
    }
}

function queryDOM<T extends HTMLElement>(e: T[], query?: string) {
    return new Proxy(new QueryDOM<T>(e, query), {
        get(t, k) {
            if (typeof k === "number") {
                return t.getter(k);
            }
            return t[k];
        },
    });
}

export function $(el: Document | HTMLElement) {
    return queryDOM([
        el.nodeType === el.DOCUMENT_NODE
            ? ((el as unknown) as Document).documentElement
            : ((el as unknown) as HTMLElement),
    ]);
}

export type TagA = HTMLAnchorElement;
export type TagAbbr = HTMLElement;
export type TagAddress = HTMLElement;
export type TagApplet = HTMLAppletElement;
export type TagArea = HTMLAreaElement;
export type TagArticle = HTMLElement;
export type TagAside = HTMLElement;
export type TagAudio = HTMLAudioElement;
export type TagB = HTMLElement;
export type TagBase = HTMLBaseElement;
export type TagBasefont = HTMLBaseFontElement;
export type TagBdi = HTMLElement;
export type TagBdo = HTMLElement;
export type TagBlockquote = HTMLQuoteElement;
export type TagBody = HTMLBodyElement;
export type TagBr = HTMLBRElement;
export type TagButton = HTMLButtonElement;
export type TagCanvas = HTMLCanvasElement;
export type TagCaption = HTMLTableCaptionElement;
export type TagCite = HTMLElement;
export type TagCode = HTMLElement;
export type TagCol = HTMLTableColElement;
export type TagColgroup = HTMLTableColElement;
export type TagData = HTMLDataElement;
export type TagDatalist = HTMLDataListElement;
export type TagDd = HTMLElement;
export type TagDel = HTMLModElement;
export type TagDetails = HTMLDetailsElement;
export type TagDfn = HTMLElement;
export type TagDialog = HTMLDialogElement;
export type TagDir = HTMLDirectoryElement;
export type TagDiv = HTMLDivElement;
export type TagDl = HTMLDListElement;
export type TagDt = HTMLElement;
export type TagEm = HTMLElement;
export type TagEmbed = HTMLEmbedElement;
export type TagFieldset = HTMLFieldSetElement;
export type TagFigcaption = HTMLElement;
export type TagFigure = HTMLElement;
export type TagFont = HTMLFontElement;
export type TagFooter = HTMLElement;
export type TagForm = HTMLFormElement;
export type TagFrame = HTMLFrameElement;
export type TagFrameset = HTMLFrameSetElement;
export type TagH1 = HTMLHeadingElement;
export type TagH2 = HTMLHeadingElement;
export type TagH3 = HTMLHeadingElement;
export type TagH4 = HTMLHeadingElement;
export type TagH5 = HTMLHeadingElement;
export type TagH6 = HTMLHeadingElement;
export type TagHead = HTMLHeadElement;
export type TagHeader = HTMLElement;
export type TagHgroup = HTMLElement;
export type TagHr = HTMLHRElement;
export type TagHtml = HTMLHtmlElement;
export type TagI = HTMLElement;
export type TagIframe = HTMLIFrameElement;
export type TagImg = HTMLImageElement;
export type TagInput = HTMLInputElement;
export type TagIns = HTMLModElement;
export type TagKbd = HTMLElement;
export type TagLabel = HTMLLabelElement;
export type TagLegend = HTMLLegendElement;
export type TagLi = HTMLLIElement;
export type TagLink = HTMLLinkElement;
export type TagMain = HTMLElement;
export type TagMap = HTMLMapElement;
export type TagMark = HTMLElement;
export type TagMarquee = HTMLMarqueeElement;
export type TagMenu = HTMLMenuElement;
export type TagMeta = HTMLMetaElement;
export type TagMeter = HTMLMeterElement;
export type TagNav = HTMLElement;
export type TagNoscript = HTMLElement;
export type TagObject = HTMLObjectElement;
export type TagOl = HTMLOListElement;
export type TagOptgroup = HTMLOptGroupElement;
export type TagOption = HTMLOptionElement;
export type TagOutput = HTMLOutputElement;
export type TagP = HTMLParagraphElement;
export type TagParam = HTMLParamElement;
export type TagPicture = HTMLPictureElement;
export type TagPre = HTMLPreElement;
export type TagProgress = HTMLProgressElement;
export type TagQ = HTMLQuoteElement;
export type TagRp = HTMLElement;
export type TagRt = HTMLElement;
export type TagRuby = HTMLElement;
export type TagS = HTMLElement;
export type TagSamp = HTMLElement;
export type TagScript = HTMLScriptElement;
export type TagSection = HTMLElement;
export type TagSelect = HTMLSelectElement;
export type TagSlot = HTMLSlotElement;
export type TagSmall = HTMLElement;
export type TagSource = HTMLSourceElement;
export type TagSpan = HTMLSpanElement;
export type TagStrong = HTMLElement;
export type TagStyle = HTMLStyleElement;
export type TagSub = HTMLElement;
export type TagSummary = HTMLElement;
export type TagSup = HTMLElement;
export type TagTable = HTMLTableElement;
export type TagTbody = HTMLTableSectionElement;
export type TagTd = HTMLTableDataCellElement;
export type TagTemplate = HTMLTemplateElement;
export type TagTextarea = HTMLTextAreaElement;
export type TagTfoot = HTMLTableSectionElement;
export type TagTh = HTMLTableHeaderCellElement;
export type TagThead = HTMLTableSectionElement;
export type TagTime = HTMLTimeElement;
export type TagTitle = HTMLTitleElement;
export type TagTr = HTMLTableRowElement;
export type TagTrack = HTMLTrackElement;
export type TagU = HTMLElement;
export type TagUl = HTMLUListElement;
export type TagVar = HTMLElement;
export type TagVideo = HTMLVideoElement;
export type TagWbr = HTMLElement;
