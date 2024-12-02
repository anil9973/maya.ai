const tagList = (await getStore("tags")).tags ?? [];

class TagCompletion extends HTMLElement {
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
		if (tagList.indexOf(tag) !== -1) return;
		tagList.push(tag);
		setStore({ tags: tagList });
		this.appendChild(this.option(tag));
	}

	doComplete(event) {
		const selectOpt = event ? event.target : this.children[this.selectIdx];
		if (selectOpt.tagName === "OPTION") {
			const txtNode = this.triggerElem.firstChild;
			if (!(txtNode instanceof Text)) return;
			txtNode.replaceData(1, txtNode.length - 1, selectOpt.textContent);
			this.hidePopover();
			this.triggerElem = null;
		}
	}

	/** @param {HTMLElement}triggerElem */
	show(triggerElem) {
		this.triggerElem = triggerElem;
		const rect = triggerElem.getBoundingClientRect();
		this.style.left = rect.left + "px";
		this.style.top = rect.top + 15 + "px";
		this.showPopover();
		this.isShow = true;
	}

	filterList(char) {
		const txt = char ? this.triggerElem.textContent.slice(1) + char : this.triggerElem.textContent.slice(1, -1);
		for (const option of this.children) option["hidden"] = !option.textContent.startsWith(txt);
		if (!this.querySelector(":not([hidden])")) this.hidePopover();
	}

	option(tag) {
		const optionElem = document.createElement("option");
		optionElem.value = optionElem.textContent = tag;
		return optionElem;
	}

	connectedCallback() {
		this.setAttribute("popover", "");
		this.append(...tagList.map(this.option));
		this.children[0]?.setAttribute("select", "");
		this.selectIdx = 0;
		$on(this, "pointerdown", this.doComplete);
		$on(this, "toggle", (event) => {
			if (event.newState !== "closed") return;
			for (const option of this.children) option["hidden"] &&= false;
		});
	}
}

customElements.define("tag-completion", TagCompletion);

export const tagCompletion = new TagCompletion();
