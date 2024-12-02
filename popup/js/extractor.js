import { HOST_ACCESS_ERR, WEBSTORE_ERR } from "./constant.js";

export const crtTabIndex = async () => (await chrome.tabs.query({ currentWindow: true, active: true }))[0].index;
export const crtTabId = async () => (await chrome.tabs.query({ currentWindow: true, active: true }))[0].id;
export const getCrtTab = async () => (await chrome.tabs.query({ currentWindow: true, active: true }))[0];

/**@returns {Promise<string>} */
export async function extractSelectedContent(tabId) {
	tabId ??= await crtTabId();
	try {
		const results = await chrome.scripting.executeScript({
			target: { tabId },
			func: getSelectedContent,
		});
		return results[0].result;
	} catch (error) {
		if (error.message === WEBSTORE_ERR || error.message.endsWith(HOST_ACCESS_ERR)) return;
		console.error(error);
		// setTimeout(() => document.body.appendChild(new ReportBug(error)), 2000);
	}
}

async function getSelectedContent() {
	const selection = getSelection();
	if (selection.isCollapsed) return;
	return selection.toString()?.trim();
}

/**@param {(...args: any[]) => any} func*/
export async function injectFuncScript(func, tabId, ...args) {
	tabId ??= await crtTabId();
	const results = await chrome.scripting.executeScript({
		target: { tabId },
		func: func,
		args: args,
	});
	return results[0]?.result;
}
