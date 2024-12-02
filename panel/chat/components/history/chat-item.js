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
		fireEvent(document.body, "openconversion", liElem.id);
	}

	render() {
		return html`<summary>${this.date}</summary>
        <ul>${this.chats.map((chat) => `<li id="${chat.id}">${chat.title}</li>`).join("")}</ul>`;
	}

	connectedCallback() {
		this.open = true;
		this.replaceChildren(this.render());
		$on(this.parentElement, "click", this.onClick.bind(this));
	}
}

customElements.define("chat-item", DateChatItem, { extends: "details" });
