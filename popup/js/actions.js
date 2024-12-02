import { crtTabIndex, getCrtTab, injectFuncScript } from "./extractor.js";
import { getTabs } from "./constant.js";
import { checkForeignLang } from "./util.js";
import { translateCrtPage } from "../../scripts/func-script.js";

export async function openCollections() {
	const index = await crtTabIndex();
	chrome.tabs.create({ url: "collections/index.html", index: index + 1 });
}

async function openSidePanel(panelType) {
	const path = `/panel/${panelType}/index.html`;
	getTabs({ active: true, currentWindow: true }).then(async (tabs) => {
		await chrome.sidePanel.setOptions({ path });
		await chrome.sidePanel["open"]({ tabId: tabs[0].id });
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
	/* const isForeignLang = await checkForeignLang(tab.title);
	if (isForeignLang) { */
	const toLang = eId("languages_list").value;
	await injectFuncScript(translateCrtPage, tab.id, toLang);
	toast("Translating...");
	await new Promise((r) => setTimeout(r, 3000));
	const { WebpageTranslator } = await import("../components/translate/webpage-translator.js");
	document.body.appendChild(new WebpageTranslator(domainMatch, toLang));
	/* } else {
		const { TranslatorDialog } = await import("../components/translate/translator-dialog.js");
		document.body.appendChild(new TranslatorDialog());
	} */
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
	await injectScript("scripts/selector/select-element.js");
	close();
}

export async function captureScreenshot() {
	await injectScript("scripts/screenshot/cropper.js");
	close();
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
