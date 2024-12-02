import { getBlockInfo, isLineEnd, openLink, setCaretAt } from "./processor-helper.js";
import { BlockIndent, LineBlock } from "../elements/line-block.js";
import { StartMarker } from "../elements/start-marker.js";
import { CtmTagName, BlockMarkers } from "./enums.js";
import { CommandHandler } from "./command-handler.js";

export class NavHandler extends CommandHandler {
	constructor() {
		super();
	}

	createNewLine() {
		const caretRange = getSelection().getRangeAt(0);
		const crtLine = this.activeLine;
		crtLine.active = false;
		this.activeLine = new LineBlock(true);
		crtLine.nextElementSibling?.tagName === CtmTagName.EmbedContent
			? crtLine.nextElementSibling.after(this.activeLine)
			: crtLine.after(this.activeLine);
		const lastElem = crtLine.lastElementChild;
		if (lastElem?.tagName === "START-MARKER" && lastElem?.className !== "divider") crtLine.replaceChildren();
		else {
			const tagName = crtLine.firstElementChild?.tagName;
			if (tagName === CtmTagName.StartMarker || tagName === CtmTagName.BlockIndent) {
				const { nestLayer, blockType } = getBlockInfo(crtLine);
				for (let index = 0; index < nestLayer; index++) this.activeLine.appendChild(new BlockIndent());
				BlockMarkers[blockType] && this.activeLine.appendChild(new StartMarker(BlockMarkers[blockType], blockType));
			}
		}
		const lineEnd = isLineEnd(caretRange, crtLine);
		//BUG isLineEnd is wrong when block indent or blockquote deleted
		lineEnd || this.moveElementsIntoNewLine(caretRange, crtLine);
	}

	insertBlankLine(crtLine) {
		this.activeLine.active = false;
		this.activeLine = new LineBlock(true);
		crtLine.nextElementSibling?.tagName === CtmTagName.EmbedContent
			? crtLine.nextElementSibling.after(this.activeLine)
			: crtLine.after(this.activeLine);
	}

	/**@param {Range} range*/
	moveElementsIntoNewLine(range, crtLine) {
		const crtNode = range.startContainer;
		if (crtNode instanceof Text && range.startOffset < crtNode.length) {
			const newTxtNode = crtNode.splitText(range.startOffset);
			const crtTagName = crtNode.parentElement.tagName;
			if (crtTagName === "LINE-BLOCK") range.insertNode(newTxtNode);
			else {
				range.setStartAfter(crtNode.parentElement);
				const element = document.createElement(crtNode.parentElement.tagName);
				element.appendChild(newTxtNode);
				range.insertNode(element);
			}
			range.setEndAfter(crtLine.lastChild);
			//BUG range.extractContents() remove link, temp-solution -> cloneContents() & deleteContents()
			this.activeLine.appendChild(range.cloneContents());
			this.activeLine.firstElementChild instanceof StartMarker && this.activeLine.firstElementChild.updateClass();
			range.deleteContents();
		} else if (crtNode === crtLine) this.activeLine.append(...crtLine.childNodes);
	}

	handleMouseUp() {
		let crtElem = getSelection().focusNode?.parentElement;
		// @ts-ignore
		if (crtElem.tagName === "WRITING-PAD") crtElem = crtElem.lastElementChild;
		if (crtElem.closest("pre")) return (this.insidePreBlock = true);
		this.insidePreBlock &&= false;

		/**@type {LineBlock} */
		const activeLine = crtElem.closest("line-block");
		if (!activeLine) return;
		if (this.activeLine !== activeLine) {
			if (crtElem.previousElementSibling?.className === "link-title") openLink(crtElem);
			this.activeLine && (this.activeLine.active = false);
			this.activeLine = activeLine;
			this.activeLine.active = true;
		}
	}

	handleTab() {
		const selection = getSelection();
		const focusElem = selection.focusNode.parentElement;
		if (focusElem.tagName === "TD") {
			const targetElem =
				focusElem.nextElementSibling ?? focusElem.parentElement.nextElementSibling.firstElementChild;
			const offset = targetElem.firstElementChild?.firstChild?.["length"] ?? targetElem.firstChild?.["length"] ?? 0;
			setCaretAt(targetElem, offset);
		} else if (focusElem.nextElementSibling?.tagName === "TWIN-MARKER") {
			const textNode = focusElem.nextElementSibling.firstChild;
			setCaretAt(textNode, textNode.nodeValue.length);
		} else {
			const blockIndent = new BlockIndent();
			this.activeLine.prepend(blockIndent);
		}
	}
}
