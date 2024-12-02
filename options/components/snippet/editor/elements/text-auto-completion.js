import { setCaretAt } from "../processor/processor-helper.js";

const textList = ["improve this", "translate this"];

class TextAutoCompletion extends HTMLElement {
	constructor() {
		super();
	}
	/** @type {number}*/
	selectIdx;

	/* navigate(arrowType) {
		this.children[this.selectIdx].removeAttribute("select");
		this.selectIdx = arrowType === UpDown.ArrowDown ? ++this.selectIdx : --this.selectIdx;
		this.children[this.selectIdx].setAttribute("select", "");
	} */

	addText(text) {
		if (textList.indexOf(text) !== -1) return;
		textList.push(text);
		setStore({ tags: textList });
		this.appendChild(new Option(text, text));
	}

	doComplete(event) {
		const selectOpt = event ? event.target : this.children[this.selectIdx];
		if (selectOpt.tagName === "OPTION") {
			if (this.targetTxtNode) {
				this.targetTxtNode.replaceData(this.targetStartIndex, this.targetTxtNode.length, selectOpt.textContent);
				setCaretAt(this.targetTxtNode, this.targetTxtNode.length);
			} else this.triggerElem.appendChild(new Text(selectOpt.textContent));
			this.hidePopover();
			this.triggerElem = null;
			this.isShow = false;
		}
	}

	/** @param {Element} triggerElem @param {Range} [range]*/
	show(triggerElem, range) {
		let rect = range?.getBoundingClientRect();
		rect?.top !== 0 ? rect : triggerElem.getBoundingClientRect();
		range.startContainer instanceof Text && (this.targetTxtNode = range.startContainer);
		this.triggerElem = triggerElem;
		this.targetStartIndex = range.startOffset + 1;
		this.style.left = rect.left + "px";
		this.style.top = rect.top + 16 + "px";
		this.showPopover();
		this.isShow = true;
	}

	filterList(char) {
		// @ts-ignore
		this.targetTxtNode ??= getSelection().focusNode;
		const txt = char
			? this.targetTxtNode.data.slice(this.targetStartIndex) + char
			: this.targetTxtNode.data.slice(this.targetStartIndex, -1);
		for (const option of this.children) option["hidden"] = !option.textContent.startsWith(txt);
		if (!txt || !this.querySelector(":not([hidden])")) this.hidePopover(), (this.isShow = false);
	}

	connectedCallback() {
		this.setAttribute("popover", "");
		this.append(...textList.map((text) => new Option(text, text)));
		this.children[0]?.setAttribute("select", "");
		this.selectIdx = 0;
		$on(this, "pointerup", this.doComplete);
		$on(this, "toggle", (event) => {
			if (event.newState !== "closed") return;
			for (const option of this.children) option["hidden"] &&= false;
		});
	}
}

customElements.define("text-auto-completion", TextAutoCompletion);

export const textAutoCompletion = new TextAutoCompletion();