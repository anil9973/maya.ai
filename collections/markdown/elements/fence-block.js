import { LineBlock, setCaretAt } from "./line-block.js";

export class BlockMarker extends HTMLElement {
	constructor(mark) {
		super();
		this.markTxt = new Text(mark);
		this.blockMarker = null;
	}

	connectedCallback() {
		this.appendChild(this.markTxt);
	}

	disconnectedCallback() {
		this.blockMarker?.remove();
	}
}

customElements.define("block-marker", BlockMarker);

export class FenceBlock extends HTMLElement {
	constructor(content, lang = "") {
		super();
		this.lang = lang;
		this.pre = document.createElement("pre");
		this.pre.appendChild(new Text(content ?? " "));
	}

	render() {
		const startBlockMarker = new BlockMarker("```" + (this.lang ?? ""));
		const endBlockMarker = new BlockMarker("```");
		startBlockMarker.blockMarker = endBlockMarker;
		return [startBlockMarker, this.pre, endBlockMarker];
	}

	connectedCallback() {
		this.replaceChildren(...this.render());
		setCaretAt(this.children[1], 0);
		this.nextElementSibling ?? this.after(new LineBlock());
	}
}

customElements.define("fence-block", FenceBlock);
