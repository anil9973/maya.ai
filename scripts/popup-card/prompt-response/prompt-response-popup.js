import { PromptMessenger } from "../../../AI/prompt-message.js";
import { createActionBar } from "../util.js";
// @ts-ignore
import popupCss from "./prompt-response.css" with { type: "css" };

export class AiPromptResponsePopup extends HTMLElement {
	constructor() {
		super();
	}

	/** @param {string} message*/
	async sendMessage(message) {
		try {
			const initialPrompts = null;
			await this.promptMessenger.promptMessageStream(message, "Assistant", initialPrompts, this.writingPad);
			$(".stop", this.shadowRoot)?.setAttribute("class", "send");
		} catch (error) {
			if (error.cause?.code === 20) return;
			console.error(error);
			toastErr(error.cause?.message ?? error.message);
		}
	}

	async createSession(systemRole = "Assistant", initialData = "") {
		const prompts = [{ role: "user", content: initialData }];
		await this.promptMessenger.createPromptSession(systemRole, prompts);
	}

	render() {
		this.writingPad = document.createElement("mark-writer-pad");
		this.writingPad.setAttribute("contenteditable", "true");
		return [this.writingPad];
	}

	async connectedCallback() {
		const canPrompt = await PromptMessenger.checkAvailability();
		if (canPrompt === "Not available") return alert(i18n("prompt_api_not_available"));
		if (canPrompt === "after-download") notify(i18n("prompt_api_downloading_in_progress"));
		const actionBar = await createActionBar();
		this.setAttribute("popover", "");
		this.attachShadow({ mode: "open" });
		this.shadowRoot.adoptedStyleSheets = [popupCss];
		this.shadowRoot.replaceChildren(...this.render(), actionBar);
		this.promptMessenger = new PromptMessenger();
		this.showPopover();

		$on(actionBar, "sendinstruction", ({ detail }) => this.sendMessage(detail));
		$on(actionBar, "stoprequest", () => this.promptMessenger.stop());
	}

	disconnectedCallback() {
		this.promptMessenger.destroy();
	}
}

customElements?.define("aiprompt-response-popup", AiPromptResponsePopup);
