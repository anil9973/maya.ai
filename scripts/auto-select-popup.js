(async function () {
	const { showPopupAtSelection } = await import(chrome.runtime.getURL("scripts/show-popup-func.js"));
	document.body.addEventListener("pointerup", showPopupAtSelection);
})();
