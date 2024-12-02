import { SPACE } from "../live-processor/enums.js";
import { BlockMarker } from "./fence-block.js";
import { setCaretAt } from "./line-block.js";

export class XmlComment extends HTMLElement {
	constructor(content) {
		super();
		this.contentTxt = new Text(content ?? SPACE);
		//TODO comment current line
	}

	render() {
		const startBlockMarker = new BlockMarker("<!--");
		const endBlockMarker = new BlockMarker("-->");
		startBlockMarker.blockMarker = endBlockMarker;
		return [startBlockMarker, document.createElement("span"), endBlockMarker];
	}

	connectedCallback() {
		this.replaceChildren(...this.render());
		this.children[1].appendChild(this.contentTxt);
		const selection = getSelection();
		if (selection.isCollapsed) return;
		const range = getSelection().getRangeAt(0);
		this.children[1].appendChild(range.extractContents());
		setCaretAt(this.children[1], 1);
	}
}

customElements.define("xml-comment", XmlComment);

export class ObsidianComment extends HTMLElement {
	constructor(content) {
		super();
		this.contentTxt = new Text(content ?? SPACE);
		//TODO comment current line
	}

	render() {
		const startBlockMarker = new BlockMarker("%%");
		const endBlockMarker = new BlockMarker("%%");
		startBlockMarker.blockMarker = endBlockMarker;
		return [startBlockMarker, document.createElement("span"), endBlockMarker];
	}

	connectedCallback() {
		this.replaceChildren(...this.render());
		this.children[1].appendChild(this.contentTxt);
		const selection = getSelection();
		if (selection.isCollapsed) return;
		const range = selection.getRangeAt(0);
		this.children[1].appendChild(range.extractContents());
		setCaretAt(this.children[1], 1);
	}
}

customElements.define("obsidian-comment", ObsidianComment);
