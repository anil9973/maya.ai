import "../toast.js";

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
