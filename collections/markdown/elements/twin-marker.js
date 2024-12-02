import { Brackets, CtmTagName, TwinMarkClass } from "../live-processor/enums.js";
import { FenceBlock } from "./fence-block.js";
import { setCaretAt } from "./line-block.js";
import { MathBlock } from "./math-block.js";

export class TwinMarker extends HTMLElement {
	constructor(char, twinMarker) {
		super();
		this.twinMarker = twinMarker;
		char && (this.markTxt = new Text(char));
	}

	updateClass() {
		if (this.hasAttribute("right")) return;
		if (!Brackets[this.markTxt.data] && !this.twinMarker?.hasAttribute("right")) return;
		if (this.markTxt.data === "(" && this.previousElementSibling.tagName !== CtmTagName.TwinMarker) return;
		if (!this.nextElementSibling) return;
		this.className = TwinMarkClass[this.markTxt.data];
	}

	updateMark(mark, offset = getSelection().focusOffset) {
		if (mark) {
			if (this.markTxt.data === "`") return this.parentElement.replaceWith(new FenceBlock());
			if (this.markTxt.data === "$") return this.parentElement.replaceWith(new MathBlock());
			this.markTxt.insertData(offset, mark);
			this.twinMarker.markTxt.insertData(offset, Brackets[mark] ? Brackets[mark] : mark);
		} else {
			this.markTxt.deleteData(offset - 1, 1);
			this.twinMarker.markTxt.deleteData(offset - 1, 1);
		}
		this.updateClass();
	}

	connectedCallback() {
		this.appendChild(this.markTxt);
		if (this.hasAttribute("right")) return;
		if (this.twinMarker === undefined) {
			const mark = this.markTxt.data;
			this.twinMarker = new TwinMarker(Brackets[mark] ? Brackets[mark] : mark, this);
			this.twinMarker.setAttribute("right", "");
			this.after(this.twinMarker);
			return setCaretAt(this.markTxt, this.markTxt.length);
		}
		this.nextElementSibling && this.updateClass();
	}

	disconnectedCallback() {
		this.twinMarker?.remove();
	}
}

customElements.define("twin-marker", TwinMarker);
