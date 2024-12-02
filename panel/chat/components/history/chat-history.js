import { DateChatItem } from "./chat-item.js";
// @ts-ignore
import chatHistoryCss from "../../style/chat-history.css" with { type: "css" };
document.adoptedStyleSheets.push(chatHistoryCss);

export class ConversationHistory extends HTMLElement {
	constructor() {
		super();
	}

	/** @param {Map<string, string>} conversationMap */
	render(conversationMap) {
		const elements = [];
		conversationMap.forEach((chats, date) => elements.push(new DateChatItem(date, chats)));
		return elements;
	}

	async connectedCallback() {
		this.id = "conversation-history";
		this.setAttribute("popover", "");
		const conversationTitles = (await getStore("conversationTitles")).conversationTitles ?? {};
		const conversationMap = new Map();
		const conversations = [];
		for (const chatId in conversationTitles) conversations.push({ id: chatId, title: conversationTitles[chatId] });

		conversationMap.set("Today", conversations);
		this.replaceChildren(...this.render(conversationMap));
		this.showPopover();
	}
}

customElements.define("conversation-history", ConversationHistory);
