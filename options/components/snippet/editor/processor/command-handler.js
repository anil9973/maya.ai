import { CodeLine } from "../elements/code-line.js";
import { Keys } from "./enums.js";

const getLine = (node) => (node instanceof CodeLine ? node : node.parentElement.closest("code-line"));

export class CommandHandler {
	constructor() {}

	deleteInsideWord(event) {
		event.preventDefault();
		const selection = getSelection();
		const focusNode = selection.focusNode;
		const focusElem = focusNode.parentElement;
		if (focusElem && focusElem.tagName === "SPAN") return focusElem.remove();
		if (selection.focusNode instanceof Text) {
			const txtNode = selection.focusNode;
			const txtData = txtNode.data;

			let i = selection.focusOffset;
			while (i > 0 && txtData.charCodeAt(--i) !== 32) {}

			let l = selection.focusOffset;
			while (++l < txtNode.length && txtData.charCodeAt(l) !== 32) {}
			txtNode.deleteData(i, l - i);
		}
	}

	deleteCurrentLine() {
		const selection = getSelection();
		const lineBlock = getLine(selection.anchorNode);
		lineBlock.remove();
	}

	//FIXME multiline only work if select in backward
	moveLine(isUpward) {
		const selection = getSelection();
		const startLine = getLine(selection.focusNode);
		const endLine = getLine(selection.anchorNode);
		const range = selection.getRangeAt(0);
		range.setStartBefore(startLine);
		range.setEndAfter(endLine);

		isUpward
			? startLine.previousElementSibling.before(range.extractContents())
			: endLine.nextElementSibling.after(range.extractContents());
	}

	altKeys = {
		[Keys.ArrowUp]: this.moveLine.bind(this, true),
		[Keys.ArrowDown]: this.moveLine.bind(this),
		[Keys.Delete]: this.deleteCurrentLine.bind(this),
		[Keys.KeyV]: this["insertVarPlaceholder"].bind(this),
	};
}
