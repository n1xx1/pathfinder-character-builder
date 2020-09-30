import FetchCache from "@sozialhelden/fetch-cache";
import nodeFetch from "node-fetch";
import { JSDOM } from "jsdom";

const fetchCache = new FetchCache({
    fetch: nodeFetch,
    cacheOptions: {},
});

export const fetch = ((input, init, dispose) => {
    return fetchCache.fetch(input, init, dispose);
}) as typeof nodeFetch;

export function parseDom(html: string) {
    return new JSDOM(html).window.document;
}
