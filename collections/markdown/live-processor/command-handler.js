import { setCaretAt } from "./processor-helper.js";
import { LineBlock } from "../elements/line-block.js";
import { XmlComment } from "../elements/comment.js";
import { TableGrid } from "../elements/table-grid.js";
import { Keys } from "./enums.js";

const getLine = (node) => (node instanceof LineBlock ? node : node.parentElement.closest("line-block"));

export class CommandHandler {
	/**@type {LineBlock} */
	activeLine;

	constructor() {}

	insertTable() {
		const table = new TableGrid();
		this.activeLine.appendChild(table);
		this.activeLine.nextElementSibling || this["insertBlankLine"](this.activeLine);
		getSelection().setPosition($("td", table), 0);
	}

	insertComment() {
		const comment = new XmlComment();
		this.activeLine.appendChild(comment);
	}

	deleteInsideWord() {
		const selection = getSelection();
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
		if (!lineBlock) return;
		this.activeLine = lineBlock.nextElementSibling;
		setCaretAt(this.activeLine, 0);
		lineBlock.remove();
	}

	//FIXME only work if select in backward
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
		[Keys.Backspace]: this.deleteInsideWord.bind(this),
		[Keys.KeyT]: this.insertTable.bind(this),
		[Keys.Slash]: this.insertComment.bind(this),
	};

	/**@public @param {KeyboardEvent} event  */
	keyCommandHandler = (event) => {
		const { altKey, metaKey, code } = event;
		if ((altKey || metaKey) && this.altKeys[code]) return this.altKeys[code]();
	};
}
