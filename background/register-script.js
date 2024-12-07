import { addInDomainTranslate } from "../popup/js/domain-trans-script.js";

export async function registerDynamicScriptonUpdate() {
	const storeData = await getStore(["autoTranslateOn", "selectAIPopupOn", "domainsLang"]);
	storeData.autoTranslateOn && reRegisterAutoTranslateScript();
	const domainMatches = Object.keys(storeData.domainsLang ?? {});
	if (domainMatches.length !== 0) registerDomainAutoTranslateScript(domainMatches);
	storeData.selectAIPopupOn && reRegisterSelectAiPopupScript();
}

async function registerDomainAutoTranslateScript(domainMatches) {
	await chrome.scripting.registerContentScripts([
		{
			id: "domain_auto_translator",
			allFrames: true,
			js: ["scripts/translate/domain-translate.js"],
			matches: domainMatches,
			runAt: "document_end",
		},
	]);
}

export async function reRegisterAutoTranslateScript() {
	await chrome.scripting.registerContentScripts([
		{
			id: "auto_translate",
			allFrames: true,
			js: ["scripts/translate/auto-page-translate.js"],
			matches: ["https://*/*"],
			runAt: "document_end",
		},
	]);
}

export async function reRegisterSelectAiPopupScript() {
	await chrome.scripting.registerContentScripts([
		{
			id: "select-ai-popup",
			allFrames: true,
			js: ["scripts/auto-select-popup.js"],
			matches: ["https://*/*"],
			runAt: "document_idle",
		},
	]);
}

export async function addDomainInTranslate(domainMatch, toLang) {
	try {
		const granted = await chrome.permissions.request({ origins: [domainMatch] });
		if (!granted) return alert(i18n("permission_denied"));
		const domainsLang = (await getStore("domainsLang")).domainsLang ?? {};
		await addInDomainTranslate(domainMatch);
		domainsLang[domainMatch] = toLang;
		setStore({ domainsLang });
	} catch (error) {
		console.error(error);
	}
}
