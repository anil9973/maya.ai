import { setCaretAt } from "../processor/processor-helper.js";

const variableList = [
	"CLIPBOARD",
	"SELECTED_TEXT",
	"ALL_TAB_URL",
	"ALL_TAB_TITLE",
	"CLIPBOARD",
	"CURRENT_DATE_TIME",
	"CURRENT_DATE",
	"CURRENT_TIME",
	"TAB_URL",
	"TAB_TITLE",
	"PAGE_DESCRIPTION",
	"PAGE_ALL_H_TAG",
	"PAGE_ALL_H1_TAG",
	"PAGE_ALL_H2_TAG",
	"PAGE_ALL_H3_TAG",
	"PAGE_ALL_PRE_TAG",
	"PAGE_ALL_IMG",
	"PAGE_ALL_URL",
	"PAGE_ALL_ADDRESS",
	"PAGE_ALL_BULLET_LIST_TAG",
	"PAGE_ALL_NUMBERED_LIST_TAG",
	"PAGE_ALL_TABLE",
	"PAGE_VISIBLE_H_TAG",
	"PAGE_VISIBLE_IMG_TAG",
	"PAGE_VISIBLE_A_TAG",
	"PAGE_VISIBLE_ADDRESS",
	"PAGE_VISIBLE_TABLE",
	"PAGE_VISIBLE_BULLET_LIST_TAG",
	"PAGE_VISIBLE_NUMBERED_LIST_TAG",
	"PAGE_VISIBLE_H1_TAG",
	"PAGE_VISIBLE_H2_TAG",
	"PAGE_VISIBLE_H3_TAG",
	"PAGE_PARAGRAPH_TAG",
	"PAGE_LANG",
	"SELECTED_TAB_URL",
	"SELECTED_TAB_TITLE",
	"SELECTED_TEXT",
];

class VariableCompletion extends HTMLElement {
	constructor() {
		super();
	}

	/* navigate(arrowType) {
		this.children[this.selectIdx].removeAttribute("select");
		this.selectIdx = arrowType === UpDown.ArrowDown ? ++this.selectIdx : --this.selectIdx;
		this.children[this.selectIdx].setAttribute("select", "");
	} */

	selectIdx;
	addTag(tag) {
		tag = tag.slice(1);
		if (variableList.indexOf(tag) !== -1) return;
		variableList.push(tag);
		setStore({ tags: variableList });
		this.appendChild(new Option(tag, tag));
	}

	doComplete(event) {
		const selectOpt = event ? event.target : this.children[this.selectIdx];
		if (selectOpt.tagName === "OPTION") {
			const txtNode = this.triggerElem.firstChild;
			txtNode instanceof Text
				? txtNode.replaceData(0, txtNode.length, selectOpt.textContent)
				: this.triggerElem.appendChild(new Text(selectOpt.textContent));
			this.hidePopover();
			const nextTextNode = new Text(" ");
			this.triggerElem.parentElement.after(nextTextNode);
			setCaretAt(nextTextNode, 1);
			this.triggerElem = null;
		}
	}

	/** @param {Element} triggerElem */
	show(triggerElem) {
		const rect = triggerElem.getBoundingClientRect();
		this.triggerElem = triggerElem;
		this.style.left = rect.left + "px";
		this.style.top = rect.top + 16 + "px";
		this.showPopover();
		this.isShow = true;
	}

	filterList(char) {
		const txt = char ? this.triggerElem.textContent.slice(1) + char : this.triggerElem.textContent.slice(1, -1);
		for (const option of this.children) option["hidden"] = !option.textContent.startsWith(txt);
		if (!txt || !this.querySelector(":not([hidden])")) this.hidePopover();
	}

	connectedCallback() {
		this.setAttribute("popover", "");
		this.append(...variableList.map((varTxt) => new Option(varTxt, varTxt)));
		this.children[0]?.setAttribute("select", "");
		this.selectIdx = 0;
		$on(this, "pointerup", this.doComplete);
		$on(this, "toggle", (event) => {
			if (event.newState !== "closed") return;
			for (const option of this.children) option["hidden"] &&= false;
		});
	}
}

customElements.define("variable-completion", VariableCompletion);

export const varCompletion = new VariableCompletion();
