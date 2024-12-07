import "../../toast.js";
import "../../../collections/js/reset.js";
import { html } from "../../../collections/js/om.event.js";
import { getSync, setSync } from "../../../popup/js/constant.js";
// @ts-ignore
import selectionCss from "./selection-popup.css" with { type: "css" };

export class EditFieldSelectionPopup extends HTMLElement {
	constructor() {
		super();
	}

	/** @type {Range} */
	range;
	/** @type {HTMLInputElement}*/
	inputFieldElem;

	static actions = [
		{
			icon: "prompt",
			title: i18n("custom_instruction"),
			func: "customPrompt",
		},
		{
			icon: "auto-fix",
			title: i18n("improve"),
			func: "improve",
		},

		{
			icon: "translate",
			title: i18n("translate"),
			func: "translateText",
		},

		{
			icon: "grammar",
			title: i18n("fix_grammar"),
			func: "fixGrammer",
		},

		{
			icon: "collapse",
			title: i18n("make_shorter"),
			func: "makeShorter",
		},

		{
			icon: "simplify",
			title: i18n("simplify"),
			func: "simplify",
		},
		{
			icon: "expand",
			title: i18n("make_longer"),
			func: "makeLonger",
		},

		{
			icon: "done",
			title: i18n("finish_writing"),
			func: "finishWriting",
		},
		{
			icon: "explain",
			title: i18n("explain"),
			func: "explain",
		},
	];

	/** @type {Set<string>}*/
	static pinnedActions;

	insertWriteContent({ detail: textContent }) {
		if (this.range) {
			//biome-ignore format:
			getSelection().setBaseAndExtent(this.range.startContainer, this.range.startOffset, this.range.endContainer, this.range.endOffset);
			document.execCommand("insertText", null, textContent);
		} else if (this.inputFieldElem) {
			this.inputFieldElem.focus();
			//biome-ignore format:
			this.inputFieldElem.setRangeText(textContent, this.inputFieldElem.selectionStart, this.inputFieldElem.selectionEnd)
		}
		this.hidePopover();
	}

	setPosition(popupElem) {
		popupElem.style.left = this.style.left;
		if (this.offsetTop < innerHeight - 300) popupElem.style.top = `calc(${this.style.top} + 44px)`;
		else popupElem.style.bottom = innerHeight - this.offsetTop + 40 + "px";
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
		translatorPopup.translateText(this.range, this.inputFieldElem);
		this.setPosition(translatorPopup);
	}

	async openPromptResponsePopup(context, message) {
		try {
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
				await this.aiPromptResponsePopup.createSession("Form field explainer", context);
			} else await this.aiPromptResponsePopup.showPopover();
			message && this.aiPromptResponsePopup.sendMessage(message, null);
		} catch (error) {
			console.error(error);
			toast(error.message, true);
		}
	}

	explain() {
		function findHeaderText(rootElem) {
			for (let idx = 1; idx < 6; idx++) {
				const hElem = rootElem.querySelector(`h${idx}`);
				if (hElem && hElem.textContent) return hElem.textContent;
			}
		}

		let context, message;
		if (this.inputFieldElem) {
			const labelTxt = this.inputFieldElem.labels[0]?.textContent;
			const placeholder = this.inputFieldElem.placeholder;
			const pattern = this.inputFieldElem.pattern;
			const formElem =
				this.inputFieldElem.closest("form") ?? this.inputFieldElem.parentElement?.parentElement?.parentElement;
			const formTitle = findHeaderText(formElem);
			const error =
				this.inputFieldElem.nextElementSibling?.textContent ||
				this.inputFieldElem.parentElement?.nextElementSibling?.textContent;
			let rangeInfo = "";
			this.inputFieldElem.min && (rangeInfo += `min: '${this.inputFieldElem.min}'`);
			this.inputFieldElem.max && (rangeInfo += `max: '${this.inputFieldElem.max}'`);
			context = `I am trying to fill out a form with title: '${formTitle}' and need assistance with a specific input field. Here are the input field details: InputType: ${this.inputFieldElem.type} Label: '${labelTxt}', Placeholder: '${placeholder}', Input Pattern: '${pattern}', required: '${this.inputFieldElem.required}', RangeInfo: '${rangeInfo}' and Error Message: '${error}'. `;
			message = `Please explain how to properly fill in this input field based on the given details, including an example of correct input that matches the pattern. Provide the explanation and example in the language '${navigator.language}'.`;
		} else {
			context = "";
			message = "";
			//TODO
		}

		this.openPromptResponsePopup(context, message);
	}

	async openWriterPopup(request) {
		const sourceTxtData = this.range
			? this.range.cloneContents().textContent
			: this.inputFieldElem.value.substring(this.inputFieldElem.selectionStart, this.inputFieldElem.selectionEnd);
		if (!sourceTxtData) return;
		try {
			if (!this.aiWriterPreviewPopup) {
				const context = `Without adding any explanations or examples, improve the provided text content. The input text is: '${sourceTxtData}'`;
				const importUrl = chrome.runtime.getURL("/scripts/popup-card/writer/writer-preview.js");
				const { AiWriterPreviewPopup } = await import(importUrl);
				/**@type {AiWriterPreviewPopup} */
				this.aiWriterPreviewPopup = document.createElement("aiwriter-preview-popup");
				const descriptors = Object.getOwnPropertyDescriptors(AiWriterPreviewPopup.prototype);
				Object.defineProperties(this.aiWriterPreviewPopup, descriptors);
				this.shadowRoot.appendChild(this.aiWriterPreviewPopup);
				await this.aiWriterPreviewPopup.connectedCallback();
				this.setPosition(this.aiWriterPreviewPopup);
				this.aiWriterPreviewPopup.addEventListener("insertaicontent", this.insertWriteContent.bind(this));
				await this.aiWriterPreviewPopup.aiWriter.createWriter(context);
				await this.aiWriterPreviewPopup.aiRewriter.createRewriter(context);
			} else this.aiWriterPreviewPopup.showPopover();

			request === "Complete writing based on"
				? await this.aiWriterPreviewPopup.writeRequest(request)
				: request && (await this.aiWriterPreviewPopup.rewriteRequest(request));
		} catch (error) {
			console.error(error);
			toast(error.message, true);
		}
	}

	customPrompt() {
		this.openWriterPopup();
	}

	improve() {
		this.openWriterPopup("Improve");
	}

	translateText() {
		this.openTranslatorPopup();
	}

	fixGrammer() {
		this.openWriterPopup("Fix Grammar");
	}

	makeShorter() {
		this.openWriterPopup("Make shorter");
	}

	simplify() {
		this.openWriterPopup("Simply");
	}

	makeLonger() {
		this.openWriterPopup("Make longer");
	}

	finishWriting() {
		this.openWriterPopup("Complete writing based on");
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
		const actions = EditFieldSelectionPopup.actions.filter((action) => EditFieldSelectionPopup.pinnedActions.has(action.icon));
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
		EditFieldSelectionPopup.pinnedActions = new Set((await getSync("pinnedSelectEditFieldActions")).pinnedSelectEditFieldActions ?? ["prompt", "auto-fix", "translate",  "explain", "done"]);
		this.shadowRoot.replaceChildren(...this.render());
		this.shadowRoot.lastElementChild.addEventListener("change", this.appendMoreAction, { once: true });
		this.showPopover();
	}

	appendMoreAction({ target }) {
		const moreActionPopup = document.createElement("editfield-select-more-action");
		const descriptors = Object.getOwnPropertyDescriptors(EditFieldSelectMoreAction.prototype);
		Object.defineProperties(moreActionPopup, descriptors);
		target.after(moreActionPopup);
		moreActionPopup["connectedCallback"]();
		// @ts-ignore
		moreActionPopup.addEventListener("runactionfunc", ({ detail: funcName }) => this[funcName]?.());
	}
}

customElements?.define("editfield-selection-popup", EditFieldSelectionPopup);

export class EditFieldSelectMoreAction extends HTMLElement {
	constructor() {
		super();
	}

	runActionFunc(funcName) {
		this.dispatchEvent(new CustomEvent("runactionfunc", { detail: funcName }));
	}

	async updatePin(itemId, event) {
		const isPinned = EditFieldSelectionPopup.pinnedActions.has(itemId);
		isPinned
			? EditFieldSelectionPopup.pinnedActions.delete(itemId)
			: EditFieldSelectionPopup.pinnedActions.add(itemId);
		event.currentTarget.setAttribute("class", isPinned ? "pin" : "pinned");
		event.stopImmediatePropagation();
		if (isPinned) {
			//TODO
		}
		setSync({ pinnedSelectEditFieldActions: [...EditFieldSelectionPopup.pinnedActions] });
	}

	render() {
		const item = (action) => html`<li  @click=${this.runActionFunc.bind(this, action.func)}>
			<svg class="${action.icon}" viewBox="0 0 24 24">
				<title>${action.title}</title>
				<path />
			</svg>

			<span>${action.title}</span>

			<svg class="${EditFieldSelectionPopup.pinnedActions.has(action.icon) ? "pinned" : "pin"}" viewBox="0 0 24 24" @click=${this.updatePin.bind(this, action.icon)}>
				<title>${i18n("toggle_pin")}</title>
				<path />
			</svg>
		</li> `;
		return EditFieldSelectionPopup.actions.map(item);
	}

	connectedCallback() {
		this.replaceChildren(...this.render());
	}
}

customElements?.define("editfield-select-more-action", EditFieldSelectMoreAction);
