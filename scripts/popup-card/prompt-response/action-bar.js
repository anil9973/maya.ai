import { html } from "../../../collections/js/om.event.js";
import { escapeRx } from "../../../popup/js/constant.js";

export class ActionBar extends HTMLElement {
	constructor() {
		super();
	}

	/** @type {import("../../markdown/serializer/mark-txt-serializer.js").MarkTextSerializer}*/
	static markTxtSerializer;

	/** @type {import("../../markdown/serializer/mark-json-serializer.js").MarkJsonSerializer} */
	static markJsonSerializer;

	async getMarkJsonContents() {
		if (!ActionBar.markJsonSerializer) {
			const url = "../../markdown/serializer/mark-json-serializer.js";
			const { MarkJsonSerializer } = await import(url);
			ActionBar.markJsonSerializer = new MarkJsonSerializer();
		}

		try {
			// @ts-ignore
			return ActionBar.markJsonSerializer.serialize(this.previousElementSibling.children);
		} catch (error) {
			console.error(error);
		}
	}

	async getMarkTextContent() {
		if (!ActionBar.markTxtSerializer) {
			const { MarkTextSerializer } = await import("../../markdown/serializer/mark-txt-serializer.js");
			ActionBar.markTxtSerializer = new MarkTextSerializer();
		}
		// @ts-ignore
		return ActionBar.markTxtSerializer.serialize(this.previousElementSibling.children);
	}

	async copyAsMarkContent({ currenTarget }) {
		const mdTxtContent = await this.getMarkTextContent();
		navigator.clipboard
			.writeText(mdTxtContent)
			.then(() => (currenTarget.setAttribute("class", "copied"), toast(i18n("message_copied"))))
			.catch((err) => alert(err.message));
	}

	async downloadAsMarkContent() {
		const mdTxtContent = await this.getMarkTextContent();
		const fileBlob = new Blob([mdTxtContent], { type: "text/markdown" });
		const filename = document.title.replaceAll(" ", "-").replaceAll(escapeRx, "").slice(0, 100) + ".md";
		const a = document.createElement("a");
		a.setAttribute("href", URL.createObjectURL(fileBlob));
		a.setAttribute("download", filename);
		a.click();
	}

	readAloud() {
		const message = { msg: "ttsSpeak", text: this.previousElementSibling["innerText"], lang: navigator.language };
		chrome.runtime.sendMessage(message);
	}

	sendInstruction({ currentTarget }) {
		if (currentTarget.getAttribute("class") === "stop") {
			fireEvent(this, "stoprequest");
			return currentTarget.setAttribute("class", "send");
		}
		fireEvent(this, "sendinstruction", currentTarget.previousElementSibling.value);
		currentTarget.previousElementSibling.value = "";
	}

	onInputFieldKeyup({ shiftKey, code, target }) {
		if (code === "Enter") shiftKey || (fireEvent(this, "sendinstruction", target.value), (target.value = ""));
	}

	render() {
		return html`<textarea placeholder="message instruction" @keyup=${this.onInputFieldKeyup.bind(this)}></textarea>
			<svg class="stop" viewBox="0 0 24 24" @click=${this.sendInstruction.bind(this)}>
				<title>${i18n("send_instruction")}</title>
				<path />
			</svg>
			<svg class="read-aloud" viewBox="0 0 24 24" @click=${this.readAloud.bind(this)}>
				<title>${i18n("read_aloud")}</title>
				<path />
			</svg>
			
			<svg class="copy" viewBox="0 0 24 24" @click=${this.copyAsMarkContent.bind(this)}>
				<title>${i18n("copy")}</title>
				<path />
			</svg>
			
			<svg class="download" viewBox="0 0 24 24" @click=${this.downloadAsMarkContent.bind(this)}>
				<title>${i18n("download")}</title>
				<path />
			</svg>`;
	}

	connectedCallback() {
		this.replaceChildren(this.render());
	}
}

customElements?.define("action-bar", ActionBar);
