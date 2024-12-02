import { getCrtTab } from "./extractor.js";

//biome-ignore format:
const languageCodes = new Set(["ar", "cs", "da", "de", "en", "es", "fr","hi", "it", "iw", "ja", "ko", "pl", "pt", "ru", "sk","sv", "tr","th", "uk","zh"]);

export const blockTags = new Set(["BLOCKQUOTE", "PRE", "OL", "UL"]);

/** @param {URL} url*/
export function get2RoutePath(url) {
	const path = url.pathname.endsWith("/") ? url.pathname.slice(1, -1) : url.pathname.slice(1);
	const parts = path.split("/");
	languageCodes.has(parts[0].split("-")[0]) && parts.shift();
	return parts.length > 2 ? parts.slice(0, 2).join("/") : parts[0];
}

function getWeek(day) {
	let weekNum = 1;
	day > 7 && day <= 14
		? (weekNum = 2)
		: day > 7 && day <= 14
			? (weekNum = 2)
			: day > 14 && day <= 21
				? (weekNum = 3)
				: day > 21 && (weekNum = 4);
	return "week " + weekNum;
}

export async function addDateInCollection() {
	const collectionCalendar = (await chrome.storage.local.get("collectionCalendar"))["collectionCalendar"] ?? {};
	const date = new Date().toLocaleDateString("default", { day: "numeric", month: "long", year: "numeric" });
	const month = date.slice(2);
	collectionCalendar[month] ??= [];

	const day = +date.slice(0, 2);
	const week = getWeek(day);
	const idx = collectionCalendar[month].indexOf(week);
	if (idx !== -1) return;

	collectionCalendar[month].push(week);
	chrome.storage.local.set({ collectionCalendar });
}

export async function addDomainInCollection(url, route) {
	const domain = url.host;
	const domains = (await getStore("domains"))["domains"] ?? {};
	const tab = await getCrtTab();
	const urlPath = url.host === "www.youtube.com" ? url.searchParams.get("v") : url.pathname;
	domains[domain] ??= { favIconUrl: tab?.favIconUrl, name: domain, routes: {} };
	domains[domain].routes[route] ??= [];
	if (domains[domain].routes[route].indexOf(urlPath) !== -1) return;
	domains[domain].routes[route].push(urlPath);
	await setStore({ domains });
}
