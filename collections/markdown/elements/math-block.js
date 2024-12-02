import { BlockMarker } from "./fence-block.js";
import { LineBlock, setCaretAt } from "./line-block.js";

export class MathBlock extends HTMLElement {
	constructor(content) {
		super();
		this.pre = document.createElement("pre");
		this.pre.appendChild(new Text(content ?? " "));
	}

	render() {
		const startBlockMarker = new BlockMarker("$$");
		const endBlockMarker = new BlockMarker("$$");
		startBlockMarker.blockMarker = endBlockMarker;
		return [startBlockMarker, this.pre, endBlockMarker];
	}

	connectedCallback() {
		this.replaceChildren(...this.render());
		setCaretAt(this.children[1], 0);
		this.nextElementSibling ?? this.after(new LineBlock());
	}
}

customElements.define("math-block", MathBlock);
