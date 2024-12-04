import { registerAutoTranslateScript } from "../options/js/register-script.js";
import { getTabs } from "../popup/js/constant.js";
import { crtTabId } from "../popup/js/extractor.js";
import { AutoTabGrouper } from "./categorizer.js";

export function getDateTimeName() {
	return new Date()
		.toLocaleString("default", { dateStyle: "medium", timeStyle: "short" })
		.replaceAll(" ", "-")
		.replaceAll(",", "")
		.replaceAll(":", "_");
}

/**@param {(...args: any[]) => any} func*/
export async function injectFuncScript(func, tabId, ...args) {
	tabId ??= await crtTabId();

	try {
		const results = await chrome.scripting.executeScript({
			target: { tabId },
			func: func,
			args: args,
		});
		return results[0].result;
	} catch (error) {
		console.warn(error);
	}
}

/**@param {(...args)=>void} func*/
export async function injectFuncScript2(func, tabId, command, frameId, arg = null) {
	const target = { tabId };
	frameId ? frameId > 0 && (target.frameIds = [frameId]) : (target.allFrames = true);
	const execScript = () =>
		chrome.scripting.executeScript({ target, func, args: [arg] }).catch((err) => console.error(err));

	try {
		const response = await chrome.tabs.sendMessage(tabId, { img: command, arg });
		response ?? execScript();
	} catch (error) {
		execScript();
	}
}

/**@param {string} script*/
export async function injectScript(command, script, tabId, frameId) {
	tabId ??= (await chrome.tabs.query({ active: true, currentWindow: true }))[0].id;
	const target = { tabId };
	frameId > 0 && (target.frameIds = [frameId]);

	const execScript = () =>
		chrome.scripting.executeScript({ target, files: [script] }).catch((err) => console.error(err));

	try {
		const response = await chrome.tabs.sendMessage(tabId, command);
		response ?? (await execScript());
	} catch (error) {
		await execScript().catch((err) => console.error(err));
	}
}

/** @param {string} markText*/
export function extractJSONContent(markText) {
	markText = markText.trim();
	let jsonStartIndex = markText.indexOf("```json");
	if (jsonStartIndex === -1) return markText;

	jsonStartIndex = jsonStartIndex + 7;
	const blockEndIndex = markText.indexOf("```", jsonStartIndex);
	const jsonContent = markText.slice(jsonStartIndex, blockEndIndex);
	return JSON.parse(jsonContent.trim());
}

export async function enableAutoTranslate() {
	await registerAutoTranslateScript();
	await setStore({ autoTranslateOn: true });
	chrome.scripting.unregisterContentScripts({ ids: ["domain_auto_translator"] }).catch((err) => {});
}

//groupOpenedTabs
export async function groupOpenedTabs() {
	const tabs = await getTabs({ currentWindow: true });
	const autoTabGrouper = new AutoTabGrouper();
	for (const tab of tabs) autoTabGrouper.addTabInGroup(tab);
}

export async function categorizeExistBookmarks() {
	//TODO
}
