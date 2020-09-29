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

function isElement(e: ChildNode): e is HTMLElement {
    return e.nodeType == e.ELEMENT_NODE;
}

class QueryDOMClass<T extends ChildNode> {
    private readonly e: T[];

    constructor(e: T[], query: string) {
        if (query) {
            this.e = e.filter(e => isElement(e) && e.matches(query));
        } else {
            this.e = e;
        }
    }

    *[Symbol.iterator]() {
        for (const x of this.e) {
            yield x;
        }
    }

    map<P>(cb: (e: QueryDOM<T>) => P): P[] {
        return this.e.map(v =>
            cb(
                queryDOM<T>([v]),
            ),
        );
    }

    filter<K extends keyof HTMLElementTagNameMap>(x: K): QueryDOM<HTMLElementTagNameMap[K]>;
    filter<E extends HTMLElement = HTMLElement>(x: string): QueryDOM<E>;
    filter(cb: (e: QueryDOM<T>) => boolean): QueryDOM<T>;

    filter(x: string | ((e: QueryDOM<T>) => boolean)) {
        if (typeof x === "string") {
            return queryDOM<T>(this.e, x);
        }
        return queryDOM<T>(this.e.filter(v => x(queryDOM([v]))));
    }

    find<K extends keyof HTMLElementTagNameMap>(x: K): QueryDOM<HTMLElementTagNameMap[K]>;
    find<E extends HTMLElement = HTMLElement>(x: string): QueryDOM<E>;
    find(query: string) {
        if (query.trimLeft().startsWith(">")) {
            query = ":scope " + query;
        }
        return queryDOM(
            _.flatten(
                this.e.map(e => (isElement(e) ? Array.from(e.querySelectorAll(query)) : [])),
            ) as HTMLElement[],
        );
    }
    children(filter?: string) {
        return queryDOM(
            _.flatten(this.e.map(e => (isElement(e) ? Array.from(e.children) : []))),
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
    nextUntil(query: string | ((e: QueryDOM<HTMLElement>) => boolean), filter?: string) {
        return queryDOM(
            _.flatten(
                this.e.map(e => {
                    const r = [] as HTMLElement[];
                    let e1 = e.nextElementSibling;
                    while (
                        e1 &&
                        (typeof query === "string"
                            ? e1.matches(query)
                            : query(queryDOM([e1 as HTMLElement])))
                    ) {
                        r.push(e1 as HTMLElement);
                        e1 = e1.nextElementSibling;
                    }
                    return r;
                }),
            ),
            filter,
        );
    }

    text(value: string): QueryDOM<T>;
    text(): string;
    text(value?: string) {
        if (value !== undefined) {
            for (const e of this.e) {
                e.innerText = value;
            }
            return this as any;
        }
        return this.e.map(e => e.innerText).join("");
    }

    html(value: string): QueryDOM<T>;
    html(): string;
    html(value?: string) {
        if (value !== undefined) {
            for (const e of this.e) {
                e.innerHTML = value;
            }
            return this as any;
        }
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

    attr(attr: string): string | null;
    attr(attr: string, set: string): QueryDOM<T>;
    attr(attrs: { [attr: string]: string }): QueryDOM<T>;

    attr(attr: string | { [attr: string]: string }, set?: string) {
        if (typeof attr !== "string") {
            for (const e of this.e) {
                for (const [k, v] of Object.entries(attr)) {
                    e.setAttribute(k, v);
                }
            }
            return this as any;
        }
        if (set !== undefined) {
            for (const e of this.e) {
                e.setAttribute(attr, set);
            }
            return this as any;
        }
        return this.e.length > 0 ? this.e[0].getAttribute(attr) : null;
    }

    prop<P extends keyof T>(prop: P): T[P] {
        return this.e.length > 0 ? this.e[0][prop] : null;
    }

    elements() {
        return this.e;
    }
    at(index: number = 0) {
        return this.e[index];
    }
    last() {
        return this.e.length > 0 ? queryDOM<T>([this.e[this.e.length - 1]]) : queryDOM<T>([]);
    }

    append(contents: QueryDOM): QueryDOM {
        for (const e of this.e) {
            e.append(...contents.e);
        }
        return this as any;
    }

    getter(index: number) {
        return queryDOM([this.e[index]]);
    }
}

export interface QueryDOM<T extends ChildNode = ChildNode> extends QueryDOMClass<T> {
    [index: number]: QueryDOM<T>;
}

function queryDOM<T extends ChildNode = ChildNode>(e: T[], query?: string): QueryDOM<T> {
    return new Proxy(new QueryDOMClass<T>(e, query), {
        get(t, k) {
            if (typeof k === "number") {
                return t.getter(k);
            }
            return t[k];
        },
    }) as any;
}

export declare function $Function<P extends keyof TagStringMap>(s: P): QueryDOM<TagStringMap[P]>;
export declare function $Function<E extends HTMLElement>(el: E): QueryDOM<E>;
export declare function $Function<E extends HTMLElement>(el: E[]): QueryDOM<E>;
export declare function $Function<E extends HTMLElement>(s: string): QueryDOM<E>;
export declare function $Function(el: Document): QueryDOM<HTMLElement>;

export function create$(doc: Document): typeof $Function {
    const rootDom = queryDOM([doc.documentElement]);
    return (el: string | Document | HTMLElement | HTMLElement[]) => {
        if (typeof el === "string") {
            if (el.match(/^<\\w+>$/)) {
                return queryDOM([doc.createElement(el.substr(1, el.length - 2))]);
            }
            if (el[0] == "<") {
                return queryDOM([doc.createElement("template")])
                    .html(el)
                    .children();
            }
            return rootDom.find(el);
        }
        if (Array.isArray(el)) {
            return queryDOM(el);
        }
        if (el.nodeType === el.DOCUMENT_NODE) {
            return queryDOM([(el as Document).documentElement]);
        }
        return queryDOM([el as HTMLElement]);
    };
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

interface TagStringMap {
    "<a>": TagA;
    "<abbr>": TagAbbr;
    "<address>": TagAddress;
    "<applet>": TagApplet;
    "<area>": TagArea;
    "<article>": TagArticle;
    "<aside>": TagAside;
    "<audio>": TagAudio;
    "<b>": TagB;
    "<base>": TagBase;
    "<basefont>": TagBasefont;
    "<bdi>": TagBdi;
    "<bdo>": TagBdo;
    "<blockquote>": TagBlockquote;
    "<body>": TagBody;
    "<br>": TagBr;
    "<button>": TagButton;
    "<canvas>": TagCanvas;
    "<caption>": TagCaption;
    "<cite>": TagCite;
    "<code>": TagCode;
    "<col>": TagCol;
    "<colgroup>": TagColgroup;
    "<data>": TagData;
    "<datalist>": TagDatalist;
    "<dd>": TagDd;
    "<del>": TagDel;
    "<details>": TagDetails;
    "<dfn>": TagDfn;
    "<dialog>": TagDialog;
    "<dir>": TagDir;
    "<div>": TagDiv;
    "<dl>": TagDl;
    "<dt>": TagDt;
    "<em>": TagEm;
    "<embed>": TagEmbed;
    "<fieldset>": TagFieldset;
    "<figcaption>": TagFigcaption;
    "<figure>": TagFigure;
    "<font>": TagFont;
    "<footer>": TagFooter;
    "<form>": TagForm;
    "<frame>": TagFrame;
    "<frameset>": TagFrameset;
    "<h1>": TagH1;
    "<h2>": TagH2;
    "<h3>": TagH3;
    "<h4>": TagH4;
    "<h5>": TagH5;
    "<h6>": TagH6;
    "<head>": TagHead;
    "<header>": TagHeader;
    "<hgroup>": TagHgroup;
    "<hr>": TagHr;
    "<html>": TagHtml;
    "<i>": TagI;
    "<iframe>": TagIframe;
    "<img>": TagImg;
    "<input>": TagInput;
    "<ins>": TagIns;
    "<kbd>": TagKbd;
    "<label>": TagLabel;
    "<legend>": TagLegend;
    "<li>": TagLi;
    "<link>": TagLink;
    "<main>": TagMain;
    "<map>": TagMap;
    "<mark>": TagMark;
    "<marquee>": TagMarquee;
    "<menu>": TagMenu;
    "<meta>": TagMeta;
    "<meter>": TagMeter;
    "<nav>": TagNav;
    "<noscript>": TagNoscript;
    "<object>": TagObject;
    "<ol>": TagOl;
    "<optgroup>": TagOptgroup;
    "<option>": TagOption;
    "<output>": TagOutput;
    "<p>": TagP;
    "<param>": TagParam;
    "<picture>": TagPicture;
    "<pre>": TagPre;
    "<progress>": TagProgress;
    "<q>": TagQ;
    "<rp>": TagRp;
    "<rt>": TagRt;
    "<ruby>": TagRuby;
    "<s>": TagS;
    "<samp>": TagSamp;
    "<script>": TagScript;
    "<section>": TagSection;
    "<select>": TagSelect;
    "<slot>": TagSlot;
    "<small>": TagSmall;
    "<source>": TagSource;
    "<span>": TagSpan;
    "<strong>": TagStrong;
    "<style>": TagStyle;
    "<sub>": TagSub;
    "<summary>": TagSummary;
    "<sup>": TagSup;
    "<table>": TagTable;
    "<tbody>": TagTbody;
    "<td>": TagTd;
    "<template>": TagTemplate;
    "<textarea>": TagTextarea;
    "<tfoot>": TagTfoot;
    "<th>": TagTh;
    "<thead>": TagThead;
    "<time>": TagTime;
    "<title>": TagTitle;
    "<tr>": TagTr;
    "<track>": TagTrack;
    "<u>": TagU;
    "<ul>": TagUl;
    "<var>": TagVar;
    "<video>": TagVideo;
    "<wbr>": TagWbr;
}
