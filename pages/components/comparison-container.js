import { PromptMessenger } from "../../AI/prompt-message.js";

export class ComparisonContainer extends HTMLElement {
	constructor() {
		super();
	}

	async comparison(compareProducts) {
		console.log(compareProducts);
		try {
			const prompts = [{ role: "user", content: JSON.stringify(compareProducts) }];
			await this.promptMessenger.createPromptSession("Compare products", prompts);
			const message = `Compare the product features, pricing, review summaries, and ratings for the provided two URLs with titles. Based on the comparison, please recommend which product should be purchased and explain why. Provide the reasoning in a concise manner, focusing on key differences that matter to the buyer.`;
			const comparisonTable = new ComparisonTable();
			this.appendChild(comparisonTable);
			await this.promptMessenger.promptMessageStream(message, null, null, comparisonTable);
		} catch (error) {
			console.error(error);
		}
	}

	async connectedCallback() {
		const canPrompt = await PromptMessenger.checkAvailability();
		if (canPrompt === "Not available") return alert(i18n("prompt_api_not_available"));
		if (canPrompt === "after-download") notify(i18n("prompt_api_downloading_in_progress"));

		const { compareProducts } = await chrome.storage.session.get("compareProducts");
		console.log(compareProducts);
		if (!compareProducts) return close();
		this.promptMessenger = new PromptMessenger();
		setTimeout(() => this.comparison(compareProducts), 1000);
	}
}

customElements.define("product-comparison-container", ComparisonContainer);

export class ComparisonTable extends HTMLElement {
	constructor() {
		super();
	}

	connectedCallback() {}
}

customElements.define("comparison-table", ComparisonTable);
