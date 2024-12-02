import { CtmTagName } from "../live-processor/enums.js";
import { EmbedContent } from "./embed.js";

/**@param {Node} node, @param {number} position*/
export async function setCaretAt(node, position) {
	getSelection().setPosition(node, position);
}

export class LineBlock extends HTMLElement {
	constructor(active) {
		super();
		this._internals = this.attachInternals();
		active && (this.active = active);
	}
	embedContent;

	/**@param {boolean} active*/
	set active(active) {
		active ? this._internals.states.add("active") : this._internals.states.delete("active");
		if (!active) {
			const embedLinks = this.querySelectorAll("embed-link");
			if (embedLinks.length !== 0) {
				if (!this.embedContent) {
					this.embedContent = new EmbedContent();
					this.after(this.embedContent);
				}
				// @ts-ignore
				for (const embedLink of embedLinks) embedLink.setEmbedContent(this["embedContent"]);
			}
		}
	}

	connectedCallback() {
		this._internals.states.has("active") && setCaretAt(this, 0);
	}

	disconnectedCallback() {}
}

customElements.define("line-block", LineBlock);

export class BlockIndent extends HTMLElement {
	constructor() {
		super();
		this.setAttribute("contenteditable", "false");
	}

	connectedCallback() {
		this.previousSibling?.["tagName"] === CtmTagName.BlockIndent || this.previousSibling?.remove();
	}
}

customElements.define("block-indent", BlockIndent);

export class TextSpan extends HTMLSpanElement {
	constructor(text = " ") {
		super();
		this.appendChild(new Text(text));
	}

	connectedCallback() {
		setCaretAt(this.firstChild, this.firstChild.nodeValue?.length);
	}
}

customElements.define("text-span", TextSpan, { extends: "span" });
