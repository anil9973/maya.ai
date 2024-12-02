import { ResponseErrorDialog } from "../../../../collections/components/helper/response-error.js";
import {
	ChatMessage,
	insertChatMessageInDb,
	pipeConversationMessage,
	Sender,
} from "../../../../collections/db/conversation-db.js";
import { AiPromptResponse } from "./prompt-response.js";
import { getSession } from "../../../../popup/js/constant.js";
import { PromptMessenger } from "../../../../AI/prompt-message.js";
import { UserQuery } from "./user-query.js";

export class MessageContainer extends HTMLElement {
	constructor() {
		super();
	}

	async openConversation(conversationId, pageData) {
		this.conversationId = conversationId;
		const chatMessages = await pipeConversationMessage(this.conversationId);
		const prompts = chatMessages?.map((message) => ({ role: message.sender, content: message.content })) ?? [];
		prompts.push({ role: "user", content: `Webpage URL: '${pageData.url}' and title: '${pageData.title}'` });
		this.promptMessenger.createPromptSession("Assistant", prompts);
		this.replaceChildren(...this.render(chatMessages));
	}

	async createConversion() {
		try {
			const promptMessenger = new PromptMessenger();
			const role = "Content Title Generator";
			const prompts = [{ role: "user", content: this.innerText }];
			const message = "Generate title of provided content within character Limit 100";
			const title = await promptMessenger.promptMessage(message, role, prompts);
			const conversationTitles = (await getStore("conversationTitles")).conversationTitles ?? {};
			conversationTitles[this.conversationId] = title?.slice(0, 100);
			setStore({ conversationTitles });
			promptMessenger.destroy();
		} catch (error) {
			notify(error.message, "error");
		}
	}

	/** @param {string} message*/
	async sendMessage(message) {
		try {
			const chatMessage = new ChatMessage(this.conversationId, Sender.USER, message);
			const promptResponseBox = new AiPromptResponse();
			this.append(new UserQuery(chatMessage), promptResponseBox);
			const writerField = promptResponseBox.firstElementChild;
			await this.promptMessenger.promptMessageStream(message, "Assistant", null, writerField);
			await insertChatMessageInDb(chatMessage);
		} catch (error) {
			console.error(error);
			document.body.appendChild(new ResponseErrorDialog(error.cause.message ?? error.message));
		}
	}

	/** @param {ChatMessage[]} chatMessages*/
	render(chatMessages) {
		return chatMessages.map((chatMessage) =>
			chatMessage.sender === Sender.USER ? new UserQuery(chatMessage) : new AiPromptResponse(chatMessage),
		);
	}

	async connectedCallback() {
		const [tab] = await chrome.tabs.query({ currentWindow: true, active: true });

		this.promptMessenger = new PromptMessenger();
		this.conversationId = (await getSession("lastConversionId")).lastConversionId;
		if (this.conversationId) this.openConversation(this.conversationId, tb);
		else {
			const prompts = [{ role: "user", content: `Webpage URL: '${tab.url}' and title: '${tab.title}'` }];
			this.promptMessenger.createPromptSession("Assistant", prompts);
			this.conversationId = crypto.randomUUID();
			addEventListener("markstreamcomplete", this.createConversion.bind(this), { once: true });
		}
		$on(document.body, "openconversion", ({ detail }) => this.openConversation(detail));
		$on(this.nextElementSibling, "sendpromptmessage", ({ detail }) => this.sendMessage(detail));
	}
}

customElements.define("message-container", MessageContainer);
