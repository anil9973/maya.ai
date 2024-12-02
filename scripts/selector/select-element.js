let timeId;

function onMouseEnter(event) {
	/**@type {HTMLElement} */
	const element = event.target;
	if (element === document.body || element.classList.contains("elem-ai-select")) return;
	timeId = setTimeout(() => {
		element.style.backgroundColor = "gray";
		element.style.outline = "1px dashed red";
	}, 200);
}

function onMouseLeave(event) {
	timeId && clearTimeout(timeId);
	/**@type {HTMLElement} */
	const element = event.target;
	if (element === document.body || element.classList.contains("elem-ai-select")) return;
	element.style.backgroundColor = "unset";
	element.style.outline = "none";
}

function onMouseDown(event) {
	/**@type {HTMLElement} */
	const element = event.target;
	element.style.backgroundColor = "rgba(134, 10, 235, 0.5)";
	element.classList.toggle("elem-ai-select");
	document.body.addEventListener("mouseup", () => showAiActionPopup(element), { once: true });
	removeSelectElemListener();
	event.stopImmediatePropagation();
}

async function showAiActionPopup(element) {
	const { onSelectImage, showPopupAtCaptureElem } = await import("../show-popup-func.js");
	element.tagName === "IMG" ? onSelectImage(element) : showPopupAtCaptureElem(element);
}

function setSelectElemListener() {
	document.body.addEventListener("mouseout", onMouseLeave);
	document.body.addEventListener("mouseover", onMouseEnter);
	document.body.addEventListener("mousedown", onMouseDown);
}
setSelectElemListener();

function removeSelectElemListener() {
	document.body.removeEventListener("mouseout", onMouseLeave);
	document.body.removeEventListener("mouseover", onMouseEnter);
	document.body.removeEventListener("mousedown", onMouseDown);
}
