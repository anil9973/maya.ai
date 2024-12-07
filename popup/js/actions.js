import { crtTabIndex, getCrtTab, injectFuncScript } from "./extractor.js";
import { insertCropper, translateCrtPage } from "../../scripts/func-script.js";
import { getTabs } from "./constant.js";

export async function openCollections() {
	const index = await crtTabIndex();
	chrome.tabs.create({ url: "collections/index.html", index: index + 1 });
}

async function openSidePanel(panelType) {
	const path = `/panel/${panelType}/index.html`;
	getTabs({ active: true, currentWindow: true }).then(async (tabs) => {
		await chrome.sidePanel.setOptions({ path });
		await chrome.sidePanel["open"]({ tabId: tabs[0].id });
		await chrome.runtime.sendMessage(panelType).catch(() => {});
		close();
	});
}

export async function openChatPanel() {
	openSidePanel("chat");
}

export async function summarizeThisPage() {
	openSidePanel("summarizer");
}

export async function openPageTranslator() {
	const tab = await getCrtTab();
	const domainMatch = new URL(tab.url).origin + "/*";
	const { domainsLang } = await getStore("domainsLang");
	const domainExist = domainsLang?.[this.domainMatch] ? true : false;
	const toLang = eId("languages_list").value;
	if (!domainExist) {
		await injectFuncScript(translateCrtPage, tab.id, toLang);
		toast("Translating...");
		await new Promise((r) => setTimeout(r, 3000));
	}
	const { WebpageTranslator } = await import("../components/translate/webpage-translator.js");
	document.body.appendChild(new WebpageTranslator(domainMatch, toLang));
}

export async function showRecommendSites() {
	const { WebsiteRecommender } = await import("../components/site-recommender.js");
	const prompResponsePopup = new WebsiteRecommender();
	document.body.appendChild(prompResponsePopup);
}

export async function compareProduct() {
	const index = await crtTabIndex();
	chrome.tabs.create({ url: "pages/compare-product.html", index: index + 1 });
}

export async function injectSelector() {
	try {
		await injectScript("scripts/selector/select-element.js");
		close();
	} catch (error) {
		console.error(error);
		toast(error.message, "error");
	}
}

export async function captureScreenshot() {
	try {
		await injectFuncScript(insertCropper);
		close();
	} catch (error) {
		console.error(error);
		toast(error.message, "error");
	}
}

/**@param {string} script*/
export async function injectScript(script, action) {
	const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
	const injection = { target: { tabId: tab.id }, files: [script] };
	const execScript = async () => await chrome.scripting.executeScript(injection).catch((err) => console.warn(err));
	try {
		action ? await chrome.tabs.sendMessage(tab.id, action) : execScript();
	} catch (error) {
		execScript();
	}
}
