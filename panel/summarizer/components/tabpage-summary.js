import { crtTabId } from "../../../popup/js/extractor.js";
import { SummaryTypesRow } from "./summary-types.js";
import { SummaryContainer } from "./summary/summary-container.js";

export class TabpageSummary extends HTMLElement {
	constructor(tabId) {
		super();
		tabId ? (this.id = tabId) : crtTabId().then((tabId) => (this.id = String(tabId)));
	}

	render() {
		return [new SummaryTypesRow(), new SummaryContainer()];
	}

	async connectedCallback() {
		this.replaceChildren(...this.render());
	}
}

customElements.define("tabpage-summary", TabpageSummary);
