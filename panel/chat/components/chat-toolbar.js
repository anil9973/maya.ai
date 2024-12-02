import { html } from "../../../collections/js/om.compact.js";

export class ChatToolbar extends HTMLElement {
	constructor() {
		super();
	}

	async openChatHistory() {
		if (this.conversationHistory) return this.conversationHistory.showPopover();
		const { ConversationHistory } = await import("./history/chat-history.js");
		this.conversationHistory = new ConversationHistory();
		this.appendChild(this.conversationHistory);
	}

	render() {
		return html`<atom-icon ico="menu" title="Open Chat history" @click=${this.openChatHistory.bind(this)}></atom-icon>`;
	}

	connectedCallback() {
		this.replaceChildren(this.render());
	}
}

customElements.define("chat-toolbar", ChatToolbar);
