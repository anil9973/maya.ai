import { crtTabId } from "../../../popup/js/extractor.js";
import { SummaryTypesRow } from "./summary-types.js";
import { SummaryContainer } from "./summary/summary-container.js";

export class TabpageSummary extends HTMLElement {
	constructor() {
		super();
	}

	render() {
		return [new SummaryTypesRow(), new SummaryContainer()];
	}

	async connectedCallback() {
		this.replaceChildren(...this.render());
		crtTabId().then((tabId) => (this.id = String(tabId)));
	}
}

customElements.define("tabpage-summary", TabpageSummary);
