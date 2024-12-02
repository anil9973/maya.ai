(async function () {
	const { AutoWebPageTranslator } = await import(chrome.runtime.getURL("scripts/translate/translator.js"));
	new AutoWebPageTranslator();
})();
