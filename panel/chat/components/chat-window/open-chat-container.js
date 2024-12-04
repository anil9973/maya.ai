import { PromptMessenger } from "../../../../AI/prompt-message.js";
import { PromptContainer } from "./prompt/prompt-container.js";
import { MessageContainer } from "./message-container.js";
// @ts-ignore
import chatWindowCss from "../../style/chat-window.css" with { type: "css" };
import promptCss from "../../style/prompt-input.css" with { type: "css" };
document.adoptedStyleSheets.push(chatWindowCss, promptCss);

export class OpenChatContainer extends HTMLElement {
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

customElements.define("open-chat-container", OpenChatContainer);
