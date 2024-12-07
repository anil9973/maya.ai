import { ResponseErrorDialog } from "../../../../collections/components/helper/response-error.js";
import {
	ChatMessage,
	insertChatMessageInDb,
	pipeConversationMessage,
	Sender,
} from "../../../../collections/db/conversation-db.js";
import { PromptMessenger } from "../../../../AI/prompt-message.js";
import { getTabs } from "../../../../popup/js/constant.js";
import { AiPromptResponse } from "./prompt-response.js";
import { UserQuery } from "./user-query.js";

export class MessageContainer extends HTMLElement {
	constructor() {
		super();
	}

	async openConversation(conversationId, pageData) {
		this.conversationId = conversationId;
		const chatMessages = await pipeConversationMessage(this.conversationId);
		//TODO sort by time
		const prompts = [{ role: "user", content: `Webpage URL: '${pageData.url}' and title: '${pageData.title}'` }];
		if (chatMessages?.length !== 0) {
			const userMessages = chatMessages?.filter((message) => message.sender === "user");
			prompts.push(...userMessages?.map((message) => ({ role: message.sender, content: message.content })));
		}
		this.promptMessenger.createPromptSession("Assistant", prompts);
		this.replaceChildren(...this.render(chatMessages));
	}

	/** @param {chrome.tabs.Tab} [tab]*/
	async switchConversation(tab) {
		await this.promptMessenger?.destroy();
		this.promptMessenger = new PromptMessenger();
		tab ??= (await getTabs({ currentWindow: true, active: true }))[0];
		const tabConversations = (await chrome.storage.session.get("tabConversations")).tabConversations ?? {};
		this.conversationId = tabConversations[tab.id];
		if (this.conversationId) this.openConversation(this.conversationId, tab);
		else {
			this.childElementCount == 0 || this.replaceChildren();
			const prompts = [{ role: "user", content: `Webpage URL: '${tab.url}' and title: '${tab.title}'` }];
			this.promptMessenger.createPromptSession("Assistant", prompts);
			this.conversationId = crypto.randomUUID();
			addEventListener("markstreamcomplete", this.createConversion.bind(this, tab), { once: true });
		}
		//save open tab conversation
		tabConversations[tab.id] = this.conversationId;
		chrome.storage.session.set({ tabConversations });
		//TODO chrome.tabs.onUpdated.addListener(onTabSwitch);
	}

	async createConversion(tab) {
		try {
			const promptMessenger = new PromptMessenger();
			const role = "Content Title Generator";
			const prompts = [{ role: "user", content: this.innerText }];
			const message =
				"Generate title of provided content within character Limit 100. Don't provide example or explaination";
			const title = await promptMessenger.promptMessage(message, role, prompts);
			const conversationInfos = (await getStore("conversationInfos")).conversationInfos ?? {};
			const conversation = {
				id: this.conversationId,
				name: title?.slice(0, 100),
				url: tab.url,
				title: tab.title,
				createdAt: Date.now(),
			};
			conversationInfos[this.conversationId] = conversation;
			await setStore({ conversationInfos });
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
		this.switchConversation();
		$on(document.body, "openconversion", ({ detail }) => this.openConversation(detail.id, { url: detail.url, title: detail.title }));
		$on(this.nextElementSibling, "sendpromptmessage", ({ detail }) => this.sendMessage(detail));
	}
}

customElements.define("message-container", MessageContainer);
