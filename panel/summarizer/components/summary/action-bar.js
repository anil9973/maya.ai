import { AtomIcon } from "../../../../collections/components/helper/atom-icon.js";

export class ActionBar extends HTMLElement {
	constructor() {
		super();
	}

	/** @type {import("../../../../scripts/markdown/serializer/mark-txt-serializer.js").MarkTextSerializer} */
	static markTxtSerializer;

	/** @type {import("../../../../scripts/markdown/serializer/mark-json-serializer.js").MarkJsonSerializer} */
	static markJsonSerializer;

	async getMarkJsonContents() {
		if (!ActionBar.markJsonSerializer) {
			const url = "../../../../scripts/markdown/serializer/mark-json-serializer.js";
			const { MarkJsonSerializer } = await import(url);
			ActionBar.markJsonSerializer = new MarkJsonSerializer();
		}

		try {
			const markWriterPad = $("mark-writer-pad", this.parentElement);
			return ActionBar.markJsonSerializer.serialize(markWriterPad.children);
		} catch (error) {
			console.error(error);
		}
	}

	async getMarkTextContent() {
		if (!ActionBar.markTxtSerializer) {
			const { MarkTextSerializer } = await import("../../../../scripts/markdown/serializer/mark-txt-serializer.js");
			ActionBar.markTxtSerializer = new MarkTextSerializer();
		}
		const markWriterPad = this.nextElementSibling;
		// @ts-ignore
		return ActionBar.markTxtSerializer.serialize(markWriterPad.children);
	}

	async copyAsMarkContent({ currenTarget }) {
		const mdTxtContent = await this.getMarkTextContent();
		navigator.clipboard
			.writeText(mdTxtContent)
			.then(() => ((currenTarget.icon = "copied"), toast(i18n("note_content_copied"))))
			.catch((err) => notify(err.message, "error"));
	}

	async downloadAsMarkContent() {
		toast(i18n("downloading"));
		const tabId = +this.closest("tabpage-summary")?.id;
		const markTextContent = await this.getMarkTextContent();
		const markJsonContent = await this.getMarkJsonContents();
		const message = { msg: "addNoteInCollection", tabId, markTextContent, markJsonContent };
		const response = await chrome.runtime.sendMessage(message);
		if (response.errCaused) return toast(response.errCaused, "error");
	}

	readAloud() {
		const textContent = this.nextElementSibling["innerText"];
		chrome.tts.speak(textContent, { lang: navigator.language, enqueue: true });
	}

	onPromptInput({ target }) {
		fireEvent(this, "promptmessagechange", target.value);
	}

	render() {
		const input = document.createElement("textarea");
		$on(input, "change", this.onPromptInput.bind(this));
		return [input, new AtomIcon("read-aloud"), new AtomIcon("copy"), new AtomIcon("download")];
	}

	connectedCallback() {
		this.replaceChildren(...this.render());
		$on(this.children[1], "click", this.readAloud.bind(this));
		$on(this.children[2], "click", this.copyAsMarkContent.bind(this));
		$on(this.lastElementChild, "click", this.downloadAsMarkContent.bind(this));
	}
}

customElements.define("action-bar", ActionBar);
