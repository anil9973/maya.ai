import { ActionBar } from "./action-bar.js";
import { MarkWriterPad } from "./mark-writer-pad.js";

export class SummaryBox extends HTMLElement {
	constructor(tabId, summaryType) {
		super();
		this.id = tabId + summaryType;
	}

	connectedCallback() {
		this.replaceChildren(new ActionBar(), new MarkWriterPad());
	}
}

customElements.define("summary-box", SummaryBox);
