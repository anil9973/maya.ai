import { PromptMessenger } from "../../AI/prompt-message.js";
import { crtTabIndex, getCrtTab } from "../js/extractor.js";
const cssStyleSheet = new CSSStyleSheet();
cssStyleSheet.insertRule(`mark-writer-pad {
	display: block;
	min-height: 10lh;
	max-height: 24lh;
	width: 29rem;
	padding: 5px;
	border-radius: 0 0 5px 5px;
	overflow-y: auto;
	scrollbar-width: thin;
	background-color: light-dark(white, black);

	&:empty {
		background-image: url(/assets/matrix.svg);
	}

	& ul,
	& ol {
		padding-left: 24px;
	}

	& a::after {
		content: url(/assets/link-url.svg);
		vertical-align: middle;
		margin-inline: 2px 0.2em;
		cursor: pointer;
	}
}`);

document.adoptedStyleSheets.push(cssStyleSheet);

export class WebsiteRecommender extends HTMLElement {
	constructor() {
		super();
	}

	async sendMessage() {
		const tab = await getCrtTab();
		const message = `Based on the website with URL '${tab.url}' and title '${tab.title}', recommend similar websites with URL that are related in content, purpose, or topic. Please suggest a list of relevant websites that could provide similar information or services to the one provided in the given URL and title. The recommendations should be tailored to the context of the original website.`;
		await this.promptMessenger.promptMessageStream(message, "Website recommendations", null, this.writingPad);
		this.promptMessenger.destroy();
	}

	render() {
		this.writingPad = document.createElement("mark-writer-pad");
		this.writingPad.setAttribute("contenteditable", "true");
		return [this.writingPad];
	}

	async connectedCallback() {
		const canPrompt = await PromptMessenger.checkAvailability();
		if (canPrompt === "Not available") return alert(i18n("Prompt_API_not_available"));
		if (canPrompt === "after-download") notify(i18n("Prompt_api_downloading_in_progress"));
		this.setAttribute("popover", "");
		this.replaceChildren(...this.render());
		this.showPopover();
		this.style.margin = "2em 1.5em";
		this.promptMessenger = new PromptMessenger();
		this.sendMessage();
		document.body.style.width = "32rem";
	}
}

customElements?.define("aiprompt-response-popup", WebsiteRecommender);

const tabIndex = await crtTabIndex();
navigation.addEventListener("navigate", (event) => {
	if (event.destination.url.startsWith("chrome")) return;
	event.intercept({
		async handler() {
			chrome.tabs.create({ url: event.destination.url, index: tabIndex + 1, active: false });
		},
	});
});
