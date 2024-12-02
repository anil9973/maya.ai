import { EmbedLink } from "../elements/embed.js";
import { LineBlock } from "../elements/line-block.js";
import { TwinMarker } from "../elements/twin-marker.js";
import { Brackets } from "./enums.js";

/**@param {Node} node, @param {number} position*/
export async function setCaretAt(node, position) {
	getSelection().setPosition(node, position);
}

/**@param {HTMLElement} node, @param {boolean} [asChild]*/
export function insertElem(node, asChild) {
	const selection = getSelection();
	const caretRange = selection.getRangeAt(0);
	asChild || caretRange.setStartAfter(selection.focusNode.parentElement);
	caretRange.surroundContents(node);
	caretRange.collapse(false);
}

/**@param {Range} range, @param {string} marker*/
export function emphasisSelected(range, marker) {
	const leftMark = new TwinMarker(marker, null);
	const rightMark = new TwinMarker(Brackets[marker] ? Brackets[marker] : marker, leftMark);
	rightMark.setAttribute("right", "");
	const span = document.createElement("span");
	range.surroundContents(span);
	span.before(leftMark);
	span.after(rightMark);

	leftMark.twinMarker = rightMark;
	setCaretAt(leftMark.markTxt, 1);
}

/**@param {string} srcUrl, @returns {DocumentFragment}*/
export function insertLinkImg(srcUrl, linkTitle, isImg) {
	const linkFrag = new DocumentFragment();
	if (isImg) {
		const embedLink = new EmbedLink();
		linkFrag.append(embedLink);
	}
	const openSqrBracket = new TwinMarker("[", null);
	const linkTitleElem = document.createElement("span");
	linkTitleElem.textContent = linkTitle ? linkTitle : isImg ? new Date().toISOString() + ".png" : srcUrl;
	const closeSqrBracket = new TwinMarker("]", openSqrBracket);
	const openParenthesis = new TwinMarker("(", null);
	const urlElem = document.createElement("span");
	urlElem.textContent = srcUrl;
	const closeParenthesis = new TwinMarker(")", openParenthesis);
	linkFrag.append(openSqrBracket, linkTitleElem, closeSqrBracket, openParenthesis, urlElem, closeParenthesis);
	openSqrBracket.twinMarker = closeSqrBracket;
	openParenthesis.twinMarker = closeParenthesis;
	return linkFrag;
}

/**@param {LineBlock} crtLine*/
export function getBlockInfo(crtLine) {
	let childElem = crtLine.firstElementChild;
	let nestLayer = 0;
	while (childElem.tagName === "BLOCK-INDENT") {
		nestLayer++;
		childElem = childElem.nextElementSibling;
		if (!childElem.nextElementSibling) break;
	}
	return { nestLayer, blockType: childElem.className };
}

/**@param {Range} caretRange, @param {LineBlock} crtLine*/
export function isLineEnd(caretRange, crtLine) {
	const textNode = crtLine.lastElementChild ? crtLine.lastElementChild.lastChild : crtLine.lastChild;
	if (caretRange.endContainer === textNode) return caretRange.endOffset === crtLine.lastChild["length"];

	return false;
}

export function openLink(crtElem) {
	if (crtElem.previousElementSibling?.previousElementSibling?.tagName === "EMBED-LINK") return;
	const linkUrl = crtElem.nextElementSibling.nextElementSibling.nextElementSibling.textContent;
	linkUrl.startsWith("http") && chrome.tabs.create({ url: linkUrl });
}

//Debug
/* export function observe(targetElem) {
	const observer = new MutationObserver(txtChangeListener.bind(this));
	observer.observe(targetElem, { childList: true, subtree: true });

	function txtChangeListener(mutationList) {
		for (const mutation of mutationList) {
			if (mutation.addedNodes.length === 0) return;
			mutation.addedNodes[0].nodeType === 1 && console.trace(mutation.addedNodes[0]);
		}
	}
}
 */
