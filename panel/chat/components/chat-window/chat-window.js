import { MessageContainer } from "./message-container.js";
import { PromptContainer } from "./prompt/prompt-container.js";
import { PromptMessenger } from "../../../../AI/prompt-message.js";
// @ts-ignore
import chatWindowCss from "../../style/chat-window.css" with { type: "css" };
import promptCss from "../../style/prompt-input.css" with { type: "css" };
document.adoptedStyleSheets.push(chatWindowCss, promptCss);

export class ChatWindow extends HTMLElement {
	constructor() {
		super();
	}

	render() {
		return [new MessageContainer(), new PromptContainer()];
	}

	async connectedCallback() {
		const canResponse = await PromptMessenger.checkAvailability();
		if (canResponse === "Not available") return alert(i18n("prompt_api_not_available"));
		if (canResponse === "after-download") notify(i18n("prompt_messenger_downloading_in_progress"));
		this.replaceChildren(...this.render());
	}
}

customElements.define("chat-window", ChatWindow);
