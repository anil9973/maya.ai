import { ChatMessage, insertChatMessageInDb, Sender } from "../../../../collections/db/conversation-db.js";
import { MarkWriterPad } from "../../../summarizer/components/summary/mark-writer-pad.js";
import { ResponseActionBar } from "./response-action.js";

export class AiPromptResponse extends HTMLElement {
	/** @param {ChatMessage} [chatMessage]*/
	constructor(chatMessage) {
		super();
		this.chatMessage = chatMessage;
	}

	async saveChatMessage() {
		try {
			const conversationId = this.parentElement["conversationId"];
			this.chatMessage = new ChatMessage(conversationId, Sender.AI_MODEL, this.markWriterPad.innerHTML);
			await insertChatMessageInDb(this.chatMessage);
			const commands = this.parentElement.nextElementSibling["autoCommands"];
			commands && this.lastElementChild["runAutoCommands"](commands);
		} catch (error) {
			console.error(error);
		}
	}

	render() {
		this.markWriterPad = new MarkWriterPad();
		return [this.markWriterPad, new ResponseActionBar()];
	}

	connectedCallback() {
		this.replaceChildren(...this.render());
		this.markWriterPad.renderContent(this.chatMessage?.content);
		addEventListener("markstreamcomplete", this.saveChatMessage.bind(this), { once: true });
	}
}

customElements.define("ai-prompt-response", AiPromptResponse);
