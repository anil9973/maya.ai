import { addInDomainTranslate } from "../popup/js/domain-trans-script.js";

export async function registerDynamicScriptonUpdate() {
	const storeData = await getStore(["autoTranslateOn", "translatorBtnOn", "domainsLang"]);
	storeData.autoTranslateOn && registerAutoTranslateScript();
	const domainMatches = Object.keys(storeData.domainsLang ?? {});
	if (domainMatches.length !== 0) registerDomainAutoTranslateScript(domainMatches);
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

async function registerAutoTranslateScript() {
	await chrome.scripting.registerContentScripts([
		{
			id: "auto_translate",
			allFrames: true,
			js: ["scripts/translate/auto-page-translate.js"],
			matches: ["<all_urls>"],
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
