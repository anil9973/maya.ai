export async function createActionBar() {
	const importUrl = chrome.runtime.getURL("/scripts/popup-card/prompt-response/action-bar.js");
	const { ActionBar } = await import(importUrl);
	const descriptors = Object.getOwnPropertyDescriptors(ActionBar.prototype);
	/**@type {import("./prompt-response/action-bar.js").ActionBar} */
	// @ts-ignore
	const actionBar = document.createElement("action-bar");
	Object.defineProperties(actionBar, descriptors);
	await actionBar.connectedCallback();
	return actionBar;
}

/** @param {HTMLElement} rootElem*/
export function findHeaderText(rootElem) {
	for (let idx = 1; idx < 6; idx++) {
		const hElem = rootElem.querySelector(`h${idx}`);
		if (hElem && hElem.textContent) return hElem.textContent;
	}
}

globalThis.toastErr = (msg) => {
	const toastElem = document.createElement("output");
	toastElem.id = "error-notifier";
	toastElem.hidden = true;
	document.body.appendChild(toastElem);

	const cssStyleSheet = new CSSStyleSheet();
	cssStyleSheet.insertRule(`#error-notifier {
		min-width: 8em;
		background-color: red;
		color: white;
		font-size: 16px;
		font-weight: bold;
		text-align: center;
		border-radius: 12px;
		padding: 4px 8px;
		position: fixed;
		z-index: 1000;
		margin-inline: auto;
		inset-inline: 0;
		top: 20px;
		width: max-content;
		translate: 0 -200%;
		animation: in-out 5s ease-out;
	}`);

	cssStyleSheet.insertRule(`@keyframes in-out { 10%, 90% { translate: 0 0; } }`);
	document.adoptedStyleSheets.push(cssStyleSheet);

	globalThis.toastErr = (msg) => {
		toastElem.hidden = false;
		toastElem.innerText = msg;
		setTimeout(() => (toastElem.hidden = true), 5100);
	};
	toastErr(msg);
};

globalThis.toast = (msg) => {
	const toastElem = document.createElement("output");
	toastElem.id = "ai-snackbar";
	toastElem.hidden = true;
	document.body.appendChild(toastElem);

	const cssStyleSheet = new CSSStyleSheet();
	cssStyleSheet.insertRule(`#ai-snackbar {
        min-width: 20ch;
        font-size: 20px;
        background-color: #333;
        color: rgb(255, 208, 0);
        text-align: center;
        border-radius: 12px;
        padding: 4px 8px;
        position: fixed;
        z-index: 1000;
        margin-inline: auto;
		inset-inline: 0;
        bottom: 20px;
        width: max-content;
        translate: 0 200%;
        animation: in-out 5s ease-out;
    }`);

	cssStyleSheet.insertRule(`@keyframes in-out { 10%, 90% { translate: 0 0; } }`);
	document.adoptedStyleSheets.push(cssStyleSheet);

	globalThis.toast = (msg) => {
		toastElem.hidden = false;
		toastElem.innerText = msg;
		setTimeout(() => (toastElem.hidden = true), 5100);
	};
	toast(msg);
};
