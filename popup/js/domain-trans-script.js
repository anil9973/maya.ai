import { crtTabId } from "./extractor.js";

export async function addInDomainTranslate(domainMatch) {
	const scriptId = "domain_auto_translator";
	const scripts = await chrome.scripting.getRegisteredContentScripts({ ids: [scriptId] });
	if (!scripts || scripts.length === 0) return await registerDomainAutoTranslateScript(scriptId, domainMatch);
	const script = scripts[0];
	if (script.id !== scriptId) return;
	const index = script.matches.indexOf(domainMatch);
	index === -1 && script.matches?.push(domainMatch);
	await chrome.scripting.updateContentScripts([script]);
	await chrome.tabs.reload(await crtTabId());
}

async function registerDomainAutoTranslateScript(scriptId, matchUrl) {
	await chrome.scripting.registerContentScripts([
		{
			id: scriptId,
			allFrames: true,
			js: ["scripts/translate/domain-translate.js"],
			matches: [matchUrl],
			runAt: "document_end",
		},
	]);
	await chrome.tabs.reload(await crtTabId());
}

export async function removeFromDomainTranslate(domainMatch) {
	const scriptId = "domain_auto_translator";
	try {
		const scripts = await chrome.scripting.getRegisteredContentScripts({ ids: [scriptId] });
		if (!scripts || scripts.length === 0) return await registerDomainAutoTranslateScript(scriptId, domainMatch);
		const script = scripts[0];
		if (script.id !== scriptId) return;
		const index = script.matches?.indexOf(domainMatch);
		index === -1 || script.matches?.splice(index, 1);
		script.matches.length !== 0
			? await chrome.scripting.updateContentScripts([script])
			: chrome.scripting.unregisterContentScripts({ ids: [scriptId] });
		await chrome.tabs.reload(await crtTabId());
	} catch (error) {
		console.error(error);
	}
}
