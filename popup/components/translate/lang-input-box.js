import { html, react } from "../../../collections/js/om.compact.js";
import { AiTranslator } from "../../../AI/translator.js";
// @ts-ignore
import languages from "/assets/languages.json" with { type: "json" };

export class LangInputBox extends HTMLElement {
	constructor(inputLang) {
		super();
		this.inputLang = inputLang;
		this.props = react({ inputTxtValue: "" });
	}

	/**@type {LangInputBox} */
	get transLangBox() {
		// @ts-ignore
		return this.nextElementSibling ?? this.previousElementSibling;
	}

	/** @param {string} text*/
	set inputTxtValue(text) {
		this.props.inputTxtValue = text;
		this.translateText();
	}

	async translateText(inputTxtValue) {
		inputTxtValue && (this.props.inputTxtValue = inputTxtValue);
		if (!this.props.inputTxtValue) return (this.transLangBox.lastElementChild["value"] = "");
		//biome-ignore format:
		const translatedText = await this.translator.translate(this.props.inputTxtValue,this.inputLang, this.transLangBox.inputLang);
		this.transLangBox.lastElementChild["value"] = translatedText;
	}

	async onTransLangChange({ target }) {
		this.inputLang = target.value;
		if (this.nextElementSibling) {
			await this.translator.createTranslator(this.inputLang, this.transLangBox.inputLang);
			this.translateText();
		} else {
			await this.transLangBox.translator.createTranslator(this.transLangBox.inputLang, this.inputLang);
			this.transLangBox.translateText();
		}
	}

	timeId;
	onInputTextEdit(event) {
		const srcText = event.target.value;
		if (this.timeId) {
			clearTimeout(this.timeId);
			this.timeId = null;
			if (event.type === "input") return;
		}
		const time = event.type === "input" ? 3000 : 0;
		this.timeId = setTimeout(() => this.translateText(srcText), time);
	}

	async ttsSpeak(text, lang) {
		return await chrome.tts.speak(text, { lang: this.inputLang, enqueue: true });
	}

	async pronounce({ currentTarget }) {
		currentTarget.className = "speaking";
		await this.ttsSpeak(this.props.inputTxtValue, this.inputLang);
		setTimeout(() => (currentTarget.className = ""), 2000);
	}

	render() {
		const languageList = Object.keys(languages);
		return html`<header>
				<select .value=${this.inputLang} @change=${this.onTransLangChange.bind(this)}>
					${languageList.map((lang) => `<option value="${lang}">${languages[lang]}</option>`).join("")}
				</select>
				<atom-icon ico="speak"></atom-icon>
			</header>
			<textarea
				.value=${() => this.props.inputTxtValue}
				@change=${this.onInputTextEdit.bind(this)}
				@input=${this.onInputTextEdit.bind(this)}></textarea>`;
	}

	async connectedCallback() {
		this.replaceChildren(this.render());
		this.translator = new AiTranslator();
	}

	disconnectedCallback() {
		document.body.style.removeProperty("width");
	}
}

customElements.define("lang-input-box", LangInputBox);
