import { SnippetPopupHeader } from "./snippet-header.js";
import { SnippetList } from "./snippet-list.js";

export class SnippetContainer extends HTMLElement {
	constructor() {
		super();
	}

	render() {
		return [new SnippetPopupHeader(), new SnippetList()];
	}

	connectedCallback() {
		this.id = "snippet-container";
		this.setAttribute("popover", "");
		this.replaceChildren(...this.render());
		this.showPopover();
	}
}

customElements.define("snippet-container", SnippetContainer);
