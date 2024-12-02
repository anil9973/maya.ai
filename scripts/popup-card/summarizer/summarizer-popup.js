import { getSync, setSync } from "../../../popup/js/constant.js";
import { PromptMessenger } from "../../../AI/prompt-message.js";
import { html } from "../../../collections/js/om.event.js";
import { Summarizer } from "../../../AI/summarizer.js";
import { AISummaryTypes } from "../../../AI/enums.js";
import { createActionBar } from "../util.js";
// @ts-ignore
import popupCss from "../prompt-response/prompt-response.css" with { type: "css" };

export class SummarizerPopup extends HTMLElement {
	constructor() {
		super();
	}

	/**@public */
	async summarizeText(sourceTxtData, context) {
		this.sourceTxtData = sourceTxtData;
		this.onSummaryTypeChange(this.summaryType);
	}

	/** @param {HTMLElement} summaryPad*/
	async summarize(summaryPad) {
		try {
			await this.aiSummarizer.summarizeStream(this.sourceTxtData, null, summaryPad);
		} catch (error) {
			if (error.cause?.code === 20) return;
			console.error(error);
			toastErr(error.message);
		}
	}

	async summarizeUsingPrompt(summaryPad) {
		try {
			if (!this.aiPromptSummarizer) {
				this.aiPromptSummarizer = new PromptMessenger();
				const prompts = [{ role: "user", content: this.sourceTxtData }];
				await this.aiPromptSummarizer.createPromptSession("Text summarizer", prompts);
			}
			const message = `Without providing any explanations or examples, generate a concise ${this.summaryType} summary`;
			await this.aiPromptSummarizer.promptMessageStream(message, null, null, summaryPad);
		} catch (error) {
			if (error.cause?.code === 20) return;
			console.error(error);
			toastErr(error.message);
		}
	}

	async onSummaryTypeChange(summaryType) {
		let summaryPad = document.getElementById(summaryType);
		AISummaryTypes.has(summaryType) && (await this.aiSummarizer.changeSummaryType(summaryType));
		if (!summaryPad) {
			summaryPad = document.createElement("mark-writer-pad");
			summaryPad.id = summaryType;
			summaryPad.setAttribute("contenteditable", "plaintext-only");
			this.shadowRoot.children[1].appendChild(summaryPad);
			AISummaryTypes.has(summaryType) ? this.summarize(summaryPad) : this.summarizeUsingPrompt(summaryPad);
		}
		summaryPad.scrollIntoView();
		setSync({ summaryType });
	}

	async onTabClick({ target }) {
		const activeTypeTab = target.closest("summary-type");
		if (!activeTypeTab) return;
		this.activeTypeTab?.removeAttribute("active");
		this.activeTypeTab = activeTypeTab;
		this.activeTypeTab.setAttribute("active", "");
		this.summaryType = this.activeTypeTab.id;
		this.onSummaryTypeChange(this.summaryType);
	}

	render() {
		const types = [
			{
				type: "key-points",
				name: "Key Points",
				icon: "",
			},
			{
				type: "tl;dr",
				name: "TL;DR",
				icon: "",
			},

			{
				type: "teaser",
				name: "Teaser",
				icon: "",
			},
			{
				type: "headline",
				name: "Headline",
				icon: "",
			},
			{
				type: "mind-map",
				name: "Mind map",
				icon: "",
			},

			{
				type: "timeline",
				name: "Timeline",
				icon: "",
			},
			{
				type: "faq",
				name: "FAQ",
				icon: "",
			},
		];
		return html`<summary-types-row @click=${this.onTabClick.bind(this)}>${types.map((type) => `<summary-type id="${type.type}"><span >${type.name}</span></summary-type>`).join("")}</summary-types-row>
		<summary-pad-container></summary-pad-container>`;
	}

	async connectedCallback() {
		const canSummarize = await Summarizer.checkAvailability();
		if (canSummarize === "Not available") return alert(i18n("summary_api_not_available"));
		if (canSummarize === "after-download") notify(i18n("summarizer_downloading_in_progress"));

		const actionBar = await createActionBar();
		this.setAttribute("popover", "");
		this.attachShadow({ mode: "open" });
		this.shadowRoot.adoptedStyleSheets = [popupCss];
		this.shadowRoot.replaceChildren(this.render(), actionBar);
		this.showPopover();
		this.summaryType = (await getSync("summaryType")).summaryType ?? "key-points";
		this.activeTypeTab = this.shadowRoot.getElementById(this.summaryType);
		this.activeTypeTab?.setAttribute("active", "");
		this.aiSummarizer = new Summarizer();

		$on(actionBar, "sendinstruction", ({ detail }) => alert("Comging soon. Under construction"));
		$on(actionBar, "stoprequest", () =>
			AISummaryTypes.has(this.summaryType) ? this.aiSummarizer.stop() : this.aiPromptSummarizer.stop(),
		);
	}
}

customElements?.define("summarizer-popup", SummarizerPopup);