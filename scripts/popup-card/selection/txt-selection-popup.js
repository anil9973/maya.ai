import "../../../collections/js/reset.js";
import "../util.js";
import { html } from "../../../collections/js/om.event.js";
import { getSelectedContent } from "../../../panel/summarizer/js/extractor.js";
import { getSync, setSync } from "../../../popup/js/constant.js";
// @ts-ignore
import selectionCss from "./selection-popup.css" with { type: "css" };

export class TextSelectionPopup extends HTMLElement {
	constructor() {
		super();
	}

	/** @type {Range} */
	range;

	static actions = [
		{
			icon: "prompt",
			title: i18n("ask_maya"),
			func: "customPrompt",
		},
		{
			icon: "read-aloud",
			title: i18n("read_aloud"),
			func: "readAloud",
		},
		{
			icon: "translate",
			title: `Translate to ${navigator.language}`,
			func: "translateText",
		},
		{
			icon: "explain",
			title: i18n("explain"),
			func: "explain",
		},
		{
			icon: "summary",
			title: i18n("summarize"),
			func: "summarize",
		},
		{
			icon: "extract-data",
			title: i18n("extract_data"),
			func: "extractData",
		},

		{
			icon: "question",
			title: i18n("answer_this_question"),
			func: "QnA",
		},

		{
			icon: "visualize",
			title: i18n("visualize_data"),
			func: "visualize",
		},
	];

	/** @type {Set<string>}*/
	static pinnedActions;

	setPosition(popupElem) {
		popupElem.style.left = this.style.left;
		popupElem.style.top = `calc(${this.style.top} + 40px)`;
	}

	async openSummarizerPopup(sourceTxtData) {
		const importUrl = chrome.runtime.getURL("/scripts/popup-card/summarizer/summarizer-popup.js");
		const { SummarizerPopup } = await import(importUrl);
		/**@type {SummarizerPopup} */
		// @ts-ignore
		const summaryPopup = document.createElement("summarizer-popup");
		const descriptors = Object.getOwnPropertyDescriptors(SummarizerPopup.prototype);
		Object.defineProperties(summaryPopup, descriptors);
		this.after(summaryPopup);
		await summaryPopup.connectedCallback();
		summaryPopup.summarizeText(sourceTxtData);
		this.setPosition(summaryPopup);
	}

	async openTranslatorPopup() {
		const importUrl = chrome.runtime.getURL("/scripts/popup-card/translator/translator-popup.js");
		const { TranslatorPopup } = await import(importUrl);
		/**@type {TranslatorPopup} */
		const translatorPopup = document.createElement("translator-popup");
		const descriptors = Object.getOwnPropertyDescriptors(TranslatorPopup.prototype);
		Object.defineProperties(translatorPopup, descriptors);
		this.shadowRoot.appendChild(translatorPopup);
		translatorPopup.connectedCallback();
		this.setPosition(translatorPopup);
		translatorPopup.translateText(this.range);
	}

	async openPromptResponsePopup(request) {
		if (!this.aiPromptResponsePopup) {
			const importUrl = chrome.runtime.getURL("/scripts/popup-card/prompt-response/prompt-response-popup.js");
			const { AiPromptResponsePopup } = await import(importUrl);
			const descriptors = Object.getOwnPropertyDescriptors(AiPromptResponsePopup.prototype);
			/**@type {AiPromptResponsePopup} */
			// @ts-ignore
			this.aiPromptResponsePopup = document.createElement("aiprompt-response-popup");
			Object.defineProperties(this.aiPromptResponsePopup, descriptors);
			this.shadowRoot.appendChild(this.aiPromptResponsePopup);
			this.setPosition(this.aiPromptResponsePopup);
			await this.aiPromptResponsePopup.connectedCallback();
			await this.aiPromptResponsePopup.createSession(null, this.sourceTxtData);
		} else await this.aiPromptResponsePopup.showPopover();
		request && this.aiPromptResponsePopup.sendMessage(request, null);
	}

	customPrompt() {
		this.openPromptResponsePopup();
	}

	async readAloud() {
		const toLang = (await getStore("toLang")).toLang || navigator.language?.split("-", 1)[0].toLowerCase();
		await chrome.runtime.sendMessage({ msg: "ttsSpeak", text: this.sourceTxtData, lang: toLang });
	}

	translateText() {
		this.openTranslatorPopup();
	}

	explain() {
		this.openPromptResponsePopup("Explain content with example");
	}

	async summarize() {
		const sourceTxtData = await getSelectedContent(this.range);
		this.openSummarizerPopup(sourceTxtData);
	}

	extractData() {
		if (this.extractInputBox) return this.extractInputBox.firstElementChild["focus"]();
		const dataTypes = ["tabular", "facts", "contacts", "SEO keyword"];
		this.extractInputBox = document.createElement("extract-data-type");
		this.extractInputBox.innerHTML = `<input type="text" list="extract-data-types" autofocus>
		<datalist id="extract-data-types">${dataTypes.map((url) => html`<option value="${url}"></option>`)}</datalist>
		<svg class="done" viewBox="0 0 24 24">
			<title>Extract input data</title>
			<path />
		</svg>`;
		this.shadowRoot.appendChild(this.extractInputBox);
		const inputBox = this.extractInputBox.firstElementChild;
		inputBox["focus"]();
		const extractData = () => this.openPromptResponsePopup(`Extract ${inputBox["value"]} data`);
		$on(this.extractInputBox, "change", extractData);
		$on(this.extractInputBox.lastElementChild, "click", extractData);
	}

	QnA() {
		this.openPromptResponsePopup("Answer this question");
	}

	visualize() {
		//TODO
	}

	render() {
		const item = (action) => html`<svg
			class="${action.icon}"
			viewBox="0 0 24 24"
			@click=${this[action.func].bind(this)}>
			<title>${action.title}</title>
			<path />
		</svg>`;
		//biome-ignore format:
		const actions = TextSelectionPopup.actions.filter((action) =>TextSelectionPopup.pinnedActions.has(action.icon));
		const moreBtn = html`<label>
				<input type="checkbox" name="toggle-more-action" hidden />
				<svg class="chev-down" viewBox="0 0 24 24" style="margin-left: 8px">
					<title>${i18n("more_actions")}</title>
					<path />
				</svg>
			</label>`;
		return [...actions.map(item), moreBtn];
	}

	async connectedCallback() {
		this.setAttribute("popover", "");
		this.attachShadow({ mode: "open" });
		this.shadowRoot.adoptedStyleSheets = [selectionCss];
		//biome-ignore format:
		TextSelectionPopup.pinnedActions = new Set((await getSync("pinnedSelectTextActions")).pinnedSelectTextActions ?? ["prompt", "read-aloud", "translate", "explain", "summary"])
		this.shadowRoot.replaceChildren(...this.render());
		this.shadowRoot.lastElementChild.addEventListener("change", this.appendMoreAction.bind(this), { once: true });
		this.sourceTxtData = this.range.cloneContents().textContent;
		this.sourceTxtData && this.showPopover();
	}

	appendMoreAction({ target }) {
		const moreActionPopup = document.createElement("txt-select-more-action");
		const descriptors = Object.getOwnPropertyDescriptors(TextSelectMoreAction.prototype);
		Object.defineProperties(moreActionPopup, descriptors);
		target.after(moreActionPopup);
		moreActionPopup["connectedCallback"]();
		// @ts-ignore
		moreActionPopup.addEventListener("runactionfunc", ({ detail: funcName }) => this[funcName]?.());
	}
}

customElements?.define("text-selection-popup", TextSelectionPopup);

export class TextSelectMoreAction extends HTMLElement {
	constructor() {
		super();
	}

	runActionFunc(funcName) {
		this.dispatchEvent(new CustomEvent("runactionfunc", { detail: funcName }));
	}

	async updatePin(itemId, event) {
		const isPinned = TextSelectionPopup.pinnedActions.has(itemId);
		isPinned ? TextSelectionPopup.pinnedActions.delete(itemId) : TextSelectionPopup.pinnedActions.add(itemId);
		event.currentTarget.setAttribute("class", isPinned ? "pin" : "pinned");
		event.stopImmediatePropagation();
		if (isPinned) {
			//TODO
		}
		setSync({ pinnedSelectTextActions: [...TextSelectionPopup.pinnedActions] });
	}

	render() {
		const item = (action) => html`<li @click=${this.runActionFunc.bind(this, action.func)}>
			<svg class="${action.icon}" viewBox="0 0 24 24">
				<title>${action.title}</title>
				<path />
			</svg>

			<span>${action.title}</span>

			<svg class="${TextSelectionPopup.pinnedActions.has(action.icon) ? "pinned" : "pin"}" viewBox="0 0 24 24" @click=${this.updatePin.bind(this, action.icon)}>
				<title>${i18n("toggle_pin")}</title>
				<path />
			</svg>
		</li> `;
		return TextSelectionPopup.actions.map(item);
	}

	connectedCallback() {
		this.tabIndex = 0;
		this.replaceChildren(...this.render());
	}
}

customElements?.define("txt-select-more-action", TextSelectMoreAction);
