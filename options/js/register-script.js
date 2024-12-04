import { reRegisterAutoTranslateScript, reRegisterSelectAiPopupScript } from "../../background/register-script.js";

const requestPermission = () => chrome.permissions.request({ origins: ["<all_urls>"] });

export async function registerAutoTranslateScript() {
	const granted = await requestPermission();
	if (!granted) return alert("permission required");
	reRegisterAutoTranslateScript();
}

export async function registerDomainAutoTranslateScript() {
	const { domainsLang } = await chrome.storage.local.get("domainsLang");
	const domainMatches = Object.keys(domainsLang ?? {});
	if (domainMatches.length === 0) return;
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

export async function registerSelectAiPopupScript() {
	const granted = await requestPermission();
	if (!granted) return alert("permission required");
	reRegisterSelectAiPopupScript();
}
