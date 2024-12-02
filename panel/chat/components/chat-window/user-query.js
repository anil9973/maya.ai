import { ChatMessage } from "../../../../collections/db/conversation-db.js";

export class UserQuery extends HTMLElement {
	/** @param {ChatMessage} chatMessage*/
	constructor(chatMessage) {
		super();
		this.chatMessage = chatMessage;
	}

	connectedCallback() {
		this.replaceChildren(new Text(this.chatMessage.content));
	}
}

customElements.define("user-query", UserQuery);
