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
		const conversationInfos = (await getStore("conversationInfos")).conversationInfos ?? {};
		const conversationMap = new Map();
		conversationMap.set("Today", Object.values(conversationInfos));
		this.replaceChildren(...this.render(conversationMap));
		this.showPopover();
	}
}

customElements.define("conversation-history", ConversationHistory);
