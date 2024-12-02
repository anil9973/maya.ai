import { BlockIndent, setCaretAt } from "./line-block.js";
import { CtmTagName, SPACE } from "../live-processor/enums.js";
import { FrontMatter } from "./front-matter.js";

export class StartMarker extends HTMLElement {
	/**@param {string} char*/
	constructor(char, blockType) {
		super();
		this.markTxt = new Text(char);
		blockType && this.setBlockType(blockType);
	}

	insertTaskBox(checked = false) {
		const checkbox = document.createElement("input");
		checkbox.type = "checkbox";
		checkbox.checked = checked;
		const text = new Text(SPACE);
		this.replaceChildren(checkbox, text);
	}

	setBlockType(blockType) {
		if (blockType === "list") this.markTxt.replaceData(0, 1, "•");
		else if (blockType === "task-list") this.insertTaskBox(false);
		this.className = blockType;
	}

	getSpaceMark(markType) {
		let Class;
		if (markType.startsWith("#")) Class = "header-" + markType.length;
		else if (markType === "-" || markType === "*" || markType === "+" || markType === "•") {
			Class = "list";
			this.markTxt.replaceData(0, 1, "•");
		} else if (+markType[0] && markType[1] === ".") Class = "counter";
		else if (markType.endsWith(" [ ]") || markType.endsWith("\xa0[ ]")) {
			Class = "task-list";
			this.insertTaskBox(false);
		} else if (markType.endsWith(" [x]") || markType.endsWith("\xa0[x]")) {
			Class = "task-list";
			this.insertTaskBox(true);
		} else if (markType === ":") {
			Class = "description";
		}
		return Class;
	}

	updateClass() {
		let Class = "";
		this.markTxt.data.startsWith(" ") && this.markTxt.deleteData(0, 1);
		const txtData = this.markTxt.data;
		const markType = this.markTxt.data.trimEnd();
		if (txtData.startsWith(">")) Class = "quote";
		else if (txtData === "#") Class = "hashtag";
		else if (txtData.startsWith("---")) Class = "divider";
		else {
			if (txtData.endsWith(" ")) Class = this.getSpaceMark(markType);
			else if (this.className) {
				Class = "";
				if (this.className === "list") this.markTxt.replaceData(0, 1, "-");
				else if (this.className === "task-list") this.replaceChildren(this.markTxt);
			}
		}
		Class && (this.className = Class);
	}

	updateMark(mark, offset) {
		if (!mark && this.previousElementSibling instanceof BlockIndent) return this.previousElementSibling.remove();
		mark ? this.markTxt.insertData(offset, mark) : this.markTxt.deleteData(offset - 1, 1);

		if (!mark && this.markTxt.data.trim() === "") this.remove();
		else this.updateClass(), this.fixCaretPosition(offset);
		if (this.markTxt.data === "---" && !this.parentElement.previousElementSibling) {
			this.parentElement.before(new FrontMatter()), this.parentElement.replaceChildren();
		}
	}

	fixCaretPosition(offset) {
		const length = this.markTxt.length;
		const focusOffset = offset === length - 1 ? length : this.markTxt.data.endsWith(SPACE) ? length - 1 : length;
		setCaretAt(this.markTxt, focusOffset);
	}

	connectedCallback() {
		this.previousSibling?.["tagName"] === CtmTagName.BlockIndent || this.previousSibling?.remove();
		this.appendChild(this.markTxt);
		setCaretAt(this.markTxt, this.markTxt.length);
		this.nextElementSibling ? this.updateClass() : this.nextSibling ? this.wrapNextSibling() : this.updateClass();
	}

	wrapNextSibling() {
		this.updateClass();
		const range = new Range();
		range.setStartBefore(this.nextSibling);
		range.setEndAfter(this.parentElement.lastChild);
		const span = document.createElement("span");
		range.surroundContents(span);
	}
}

customElements.define("start-marker", StartMarker);
