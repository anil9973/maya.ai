import { ResponseErrorDialog } from "../../../../collections/components/helper/response-error.js";
import { getSync, setSync } from "../../../../popup/js/constant.js";
import { PromptMessenger } from "../../../../AI/prompt-message.js";
import { Summarizer } from "../../../../AI/summarizer.js";
import { AISummaryTypes } from "../../../../AI/enums.js";
import { SummaryBox } from "./summary-box.js";
// @ts-ignore
import summaryContainerCss from "../../style/summary-container.css" with { type: "css" };
document.adoptedStyleSheets.push(summaryContainerCss);

export class SummaryContainer extends HTMLElement {
	constructor() {
		super();
	}

	async summarize(summaryBox, context) {
		try {
			await this.aiSummarizer.summarizeStream(this.pageData.pageTxtContent, context, summaryBox.lastElementChild);
		} catch (error) {
			console.error(error);
			document.body.appendChild(new ResponseErrorDialog(error.cause ? error.cause.message : error.message));
		}
	}

	async summarizeUsingPrompt(summaryType, summaryBox, context) {
		try {
			if (!this.aiPromptSummarizer) {
				this.aiPromptSummarizer = new PromptMessenger();
				const prompts = [{ role: "user", content: this.pageData.pageTxtContent }];
				await this.aiPromptSummarizer.createPromptSession("Webpage sumamrizer", prompts);
			}
			const message = `Without providing any explanations or examples, generate a concise ${summaryType} summary of the webpage content provided in the following URL: '${this.pageData.pageTxtContent}`;
			const role = "Webpage Summarizer";
			await this.aiPromptSummarizer.promptMessageStream(message, role, context, summaryBox.lastElementChild);
		} catch (error) {
			console.error(error);
			document.body.appendChild(new ResponseErrorDialog(error.cause ? error.cause.message : error.message));
		}
	}

	summaryOnPromptInput(e) {
		console.log(e);
		//TODO this.summarizeUsingPrompt(summaryType, summaryBox, context)
	}

	async onSummaryTypeChange(summaryType) {
		let summaryBox = document.getElementById(this.tabId + summaryType);
		AISummaryTypes.has(summaryType) && (await this.aiSummarizer.changeSummaryType(summaryType));
		if (!summaryBox) {
			summaryBox = new SummaryBox(this.tabId, summaryType);
			this.appendChild(summaryBox);
			AISummaryTypes.has(summaryType)
				? this.summarize(summaryBox)
				: this.summarizeUsingPrompt(summaryType, summaryBox);
		}
		summaryBox.scrollIntoView();
		setSync({ summaryType });
	}

	async connectedCallback() {
		const [tab] = await chrome.tabs.query({ currentWindow: true, active: true });
		this.tabId = tab.id;
		this.pageUrl = tab.url;

		const canSummarize = await Summarizer.checkAvailability();
		if (canSummarize === "Not available") return notify(i18n("summary_api_not_available"), "error");
		if (canSummarize === "after-download") notify(i18n("summarizer_downloading_in_progress"));
		const summaryType = (await getSync("summaryType")).summaryType ?? "key-points";
		this.aiSummarizer = new Summarizer();

		if (tab.url?.startsWith("https://www.youtube.com/watch?v=")) {
			// this.pageData = await extractYoutubeTransScript();
			this.pageData = { pageTxtContent: tab.url };
		} else if (tab.url?.endsWith(".pdf")) this.pageData = { pageTxtContent: tab.url };
		else if (tab.url?.startsWith("chrome://") || tab.url?.startsWith("https://chromewebstore.google.com/"))
			return notify("Chrome page cannot summarize", "error");
		// else this.pageData = await extractPageContent();
		else this.pageData = { pageTxtContent: tab.url };

		requestIdleCallback(() => this.onSummaryTypeChange(summaryType));
		$on(this.previousElementSibling, "changesummarytype", ({ detail }) => this.onSummaryTypeChange(detail));
		$on(this, "summaryonpromptinput", this.summaryOnPromptInput.bind(this));
	}
}

customElements.define("summary-container", SummaryContainer);
