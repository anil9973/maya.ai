(async function () {
	const domainMatch = location.origin + "/*";
	const { domainsLang } = await chrome.storage.local.get("domainsLang");
	const toLang = domainsLang?.[domainMatch] ?? navigator.language.split("-", 1)[0].toLowerCase();
	const { AutoWebPageTranslator } = await import(chrome.runtime.getURL("scripts/translate/translator.js"));
	new AutoWebPageTranslator(toLang);
})();
