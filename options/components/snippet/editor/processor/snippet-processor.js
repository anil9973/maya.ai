import { textAutoCompletion } from "../elements/text-auto-completion.js";
import { VarPlaceholder } from "../elements/var-placeholder.js";
import { varCompletion } from "../elements/variable-completion.js";
import { CommandHandler } from "./command-handler.js";
import { setCaretAt } from "./processor-helper.js";

export class SnippetProcessor extends CommandHandler {
	constructor() {
		super();
	}

	showAutoCompletion() {
		const selection = getSelection(),
			focusNode = selection.focusNode,
			focusElem = focusNode.nodeType === 1 ? focusNode : focusNode.parentElement;
		// @ts-ignore
		focusElem.tagName !== "VAR"
			? textAutoCompletion.show(focusElem, selection.getRangeAt(0))
			: varCompletion.show(focusElem);
	}

	insertVarPlaceholder() {
		const selection = getSelection(),
			focusNode = selection.focusNode;
		// @ts-ignore
		focusNode.tagName === "CODE-LINE"
			? focusNode.appendChild(new VarPlaceholder())
			: focusNode.after(new VarPlaceholder());
	}

	charInput(event) {
		const char = event.data;
		if (char === "$") return this.insertVarPlaceholder(), event.preventDefault();
		if (char === " ") return this.showAutoCompletion();
	}

	/**@param {InputEvent} event*/
	inputTxtHandler = (event) => {
		varCompletion.isShow
			? varCompletion.filterList(event.data)
			: textAutoCompletion.isShow && textAutoCompletion.filterList(event.data);
		event.data && this.charInput(event);
	};

	handleInputByType = {
		insertText: this.inputTxtHandler,
		deleteContentBackward: this.inputTxtHandler.bind(this),
		/* insertFromPaste: this.dropPasteHandler.bind(this),
		insertFromDrop: this.dropPasteHandler.bind(this), */
	};

	async dropPasteHandler(event) {
		event.preventDefault();
		const pasteData = event.dataTransfer.getData("text/plain");
		if (!pasteData) return;
		document.execCommand("insertText", null, pasteData);
	}

	deleteLine(event) {
		const selection = getSelection();
		if (selection.focusOffset !== selection.anchorOffset) return;

		const focusNode = selection.focusNode;
		if (!focusNode.previousSibling) {
			const focusElem = focusNode.nodeType === 1 ? focusNode : focusNode.parentElement;
			const lineElem = focusElem["closest"]("code-line");
			lineElem.previousElementSibling?.append(...lineElem.childNodes);
			lineElem.remove();
			setCaretAt(focusNode, 0);
			return event.preventDefault();
		}
	}

	captureTab = (event) => {
		if (event.code !== "Tab") return;
		varCompletion.isShow
			? varCompletion.doComplete()
			: textAutoCompletion.isShow && textAutoCompletion.doComplete();
		event.preventDefault();
	};
}
