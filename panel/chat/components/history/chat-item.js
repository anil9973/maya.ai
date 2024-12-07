import { html } from "../../../../collections/js/om.compact.js";

export class DateChatItem extends HTMLDetailsElement {
	constructor(date, chats) {
		super();
		this.date = date;
		this.chats = chats;
	}

	onClick({ target }) {
		const liElem = target.closest("li");
		if (!liElem) return;
		const conversion = this.chats.find((chat) => chat.id === liElem.id);
		fireEvent(document.body, "openconversion", conversion);
	}

	render() {
		return html`<summary>${this.date}</summary>
        <ul>${this.chats.map((chat) => `<li id="${chat.id}">${chat.name}</li>`).join("")}</ul>`;
	}

	connectedCallback() {
		this.open = true;
		this.replaceChildren(this.render());
		$on(this.parentElement, "click", this.onClick.bind(this));
	}
}

customElements.define("chat-item", DateChatItem, { extends: "details" });
