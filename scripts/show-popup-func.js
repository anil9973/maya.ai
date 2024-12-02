// Target image element
/** @param {Element | string} srcUrl*/
export function onSelectImage(srcUrl) {
	async function showImgSelectActionPopup(posX, posY, imgElem) {
		try {
			const popupUrl = chrome.runtime.getURL("/scripts/popup-card/selection/img-selection-popup.js");
			const { ImageSelectionPopup } = await import(popupUrl);
			const imgSelectActionPopup = document.createElement("img-selection-popup");
			const descriptors = Object.getOwnPropertyDescriptors(ImageSelectionPopup.prototype);
			Object.defineProperties(imgSelectActionPopup, descriptors);
			document.body.appendChild(imgSelectActionPopup);
			imgSelectActionPopup["connectedCallback"]();
			imgSelectActionPopup.style.left = `min(80%, ${posX}px)`;
			imgSelectActionPopup.style.top = Math.max(0, posY) + "px";
			imgSelectActionPopup["targetImgElem"] = imgElem;
		} catch (error) {
			console.error(error);
		}
	}

	function getTargetImgElem() {
		const imgElements = document.body.querySelectorAll("img");
		for (const imgElem of imgElements) if (imgElem.currentSrc === srcUrl) return imgElem;
	}
	const imgElem = typeof srcUrl === "string" ? getTargetImgElem() : srcUrl;
	if (!imgElem) return;
	const rect = imgElem.getBoundingClientRect();
	const posY = rect.top - 25 + scrollY;
	showImgSelectActionPopup(rect.left, posY, imgElem);
}

// Text Selection
export async function showTxtSelectActionPopup(posX, posY, range) {
	try {
		const popupUrl = chrome.runtime.getURL("/scripts/popup-card/selection/txt-selection-popup.js");
		const { TextSelectionPopup } = await import(popupUrl);
		const textSelectActionPopup = document.createElement("text-selection-popup");
		const descriptors = Object.getOwnPropertyDescriptors(TextSelectionPopup.prototype);
		Object.defineProperties(textSelectActionPopup, descriptors);
		document.body.appendChild(textSelectActionPopup);
		textSelectActionPopup["connectedCallback"]();
		textSelectActionPopup.style.left = `min(80%, ${posX}px)`;
		textSelectActionPopup.style.top = Math.max(0, posY) + "px";
		textSelectActionPopup["range"] = range;
	} catch (error) {
		console.error(error);
	}
}

/** @param {number} posX @param {number} posY @param {Range} [range]*/
export async function showEditFieldSelectActionPopup(posX, posY, range) {
	try {
		const popupUrl = chrome.runtime.getURL("/scripts/popup-card/selection/editfield-selection-popup.js");
		const { EditFieldSelectionPopup } = await import(popupUrl);
		/**@type {EditFieldSelectionPopup} */
		const editFieldSelectActionPopup = document.createElement("editfield-selection-popup");
		const descriptors = Object.getOwnPropertyDescriptors(EditFieldSelectionPopup.prototype);
		Object.defineProperties(editFieldSelectActionPopup, descriptors);
		document.body.appendChild(editFieldSelectActionPopup);
		editFieldSelectActionPopup.connectedCallback();
		editFieldSelectActionPopup.style.left = `min(80%, ${posX}px)`;
		editFieldSelectActionPopup.style.top = Math.max(0, posY) + "px";
		range
			? (editFieldSelectActionPopup.range = range)
			: (editFieldSelectActionPopup.inputFieldElem = document.activeElement);
	} catch (error) {
		console.error(error);
	}
}

export async function showPopupAtInputSelection() {
	const { showEditFieldSelectActionPopup } = await import(chrome.runtime.getURL("scripts/show-popup-func.js"));
	/**@type {HTMLInputElement} */
	// @ts-ignore
	const inputElem = document.activeElement;
	const rect = inputElem.getBoundingClientRect();
	const posY = rect.top - 25 + scrollY;
	showEditFieldSelectActionPopup(rect.left, posY);
}

export async function showPopupAtSelection() {
	const importUrl = chrome.runtime.getURL("scripts/show-popup-func.js");
	//biome-ignore format:
	const { showPopupAtInputSelection, showTxtSelectActionPopup, showEditFieldSelectActionPopup } = await import(importUrl);
	const focusElem = document.activeElement;
	if (focusElem.tagName === "TEXTAREA" || focusElem.tagName === "INPUT") return showPopupAtInputSelection();
	const selection = getSelection();
	if (selection.isCollapsed) return;
	const range = selection.getRangeAt(0);
	const rect = range.getBoundingClientRect();
	const posY = rect.top - 25 + scrollY;
	const textData = selection.toString()?.trim();
	if (!textData) return;
	focusElem.getAttribute("contenteditable") === "true"
		? showEditFieldSelectActionPopup(rect.left, posY, range.cloneRange())
		: showTxtSelectActionPopup(rect.left, posY, range.cloneRange());
}

/** @param {Element} element*/
export async function showPopupAtCaptureElem(element) {
	const { showTxtSelectActionPopup } = await import(chrome.runtime.getURL("scripts/show-popup-func.js"));
	const rect = element.getBoundingClientRect();
	const posY = rect.top - 25 + scrollY;
	const range = new Range();
	range.selectNode(element);
	showTxtSelectActionPopup(rect.left, posY, range);
}
