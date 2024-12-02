import {
	CompletionText,
	deleteTextShotsInDb,
	pipeTextShotList,
	updateTextShotInDb,
} from "../../../collections/db/completion-text-db.js";
import { html } from "../../../collections/js/om.compact.js";

export class TextShotCard extends HTMLElement {
	/** @param {CompletionText} textShot*/
	constructor(textShot) {
		super();
		this.textShot = textShot;
	}

	async deleteText() {
		deleteTextShotsInDb([this.textShot.text]);
	}

	async updateTextSpan(event) {
		event.target.setAttribute("contenteditable", "false");
		const text = event.target.innerText.trim();
		if (!text) return;
		try {
			await updateTextShotInDb(text);
			await deleteTextShotsInDb([this.textShot.text]);
			this.textShot.text = text;
		} catch (error) {}
	}

	editText() {
		const textInput = this.firstElementChild;
		textInput.setAttribute("contenteditable", "true");
		textInput["focus"]();
		getSelection().getRangeAt(0).selectNodeContents(textInput);

		const updateNameFn = this.updateTextSpan.bind(this);
		textInput.addEventListener("blur", updateNameFn, { once: true });
	}

	render() {
		return html`<span>${this.textShot.text}</span>
			<action-box>
				<atom-icon ico="box-edit" title="" @click=${this.editText.bind(this)}></atom-icon>
				<atom-icon ico="delete" title="Delete text" @click=${this.deleteText.bind(this)}></atom-icon>
			</action-box>`;
	}

	connectedCallback() {
		this.replaceChildren(this.render());
	}
}

customElements.define("text-card", TextShotCard);

export class AutoCompletionDictionary extends HTMLElement {
	constructor() {
		super();
	}

	addCompletionText() {
		const textShotElem = new TextShotCard(new CompletionText());
		this.prepend(textShotElem);
		textShotElem.editText();
	}

	render(autoCompletionTexts) {
		return autoCompletionTexts.map((textShot) => new TextShotCard(textShot));
	}

	async connectedCallback() {
		const autoCompletionTexts = await pipeTextShotList();
		this.replaceChildren(...this.render(autoCompletionTexts));
		const addCompletionTextBtn = document.getElementById("addCompletionTextBtn");
		$on(addCompletionTextBtn, "click", this.addCompletionText.bind(this));
	}
}

customElements.define("auto-completion-dictionary", AutoCompletionDictionary);
