import "../../../collections/js/reset.js";
import "../../toast.js";
import { html } from "../../../collections/js/om.event.js";
import { AiTranslator } from "../../../AI/translator.js";
// @ts-ignore
import languages from "/assets/languages.json" with { type: "json" };
// @ts-ignore
import popupCss from "./translator-popup.css" with { type: "css" };

/** @param {string} lang*/
const fixLangCode = (lang) => lang.split("-", 1)[0].toLowerCase();

export class TranslatorPopup extends HTMLElement {
	constructor() {
		super();
	}

	/**@param {Range} range*/
	async translateText(range, inputFieldElem) {
		try {
			this.sourceTxtData = this.range
				? this.range.cloneContents().textContent
				: inputFieldElem.value.substring(inputFieldElem.selectionStart, inputFieldElem.selectionEnd);
			if (!this.sourceTxtData) return;
			this.range = range;
			this.inputFieldElem = inputFieldElem;
			this.translator = new AiTranslator();
			const canDetectLang = await AiTranslator.checkLangDetectAvailability();

			// if (canDetectLang === "Not available") return alert("Cannot detect language");
			await this.translator.createLangDetector();
			//biome-ignore format:
			this.fromLang = canDetectLang === "readily" ? await this.translator.detectLang(this.sourceTxtData.slice(0, 120)) : fixLangCode(document.documentElement.lang);
			this.toLang ??= (await getStore("toLang")).toLang ?? fixLangCode(navigator.language);
			if (this.fromLang === this.toLang) return toast("Source and target language are identical");

			const canTranslate = await AiTranslator.checkAvailability(this.fromLang, this.toLang);
			if (canTranslate === "Not available") return toast(i18n("translator_not_available"));

			await this.translator.createTranslator(this.fromLang, this.toLang);
			await this._translateText(this.fromLang, this.sourceTxtData);
			this.shadowRoot.replaceChildren(this.render());
			$('select[name="original-lang"]', this.shadowRoot).value = this.fromLang;
			$('select[name="translated-lang"]', this.shadowRoot).value = this.toLang;
			this.showPopover();
		} catch (error) {
			toast(error.message);
		}
	}

	async _translateText(from, textData = this.sourceTxtData) {
		const translatedText = await this.translator.translate(textData, from, this.toLang);
		this.transTextData && ($("textarea", this.shadowRoot).value = translatedText);
		this.transTextData = translatedText;
	}

	onFromLangChange(event) {
		this.fromLang = event.target.value;
		this._translateText(this.fromLang);
		sessionStorage.setItem("fromLang", this.fromLang);
	}

	translateOutputData() {
		const fromLang = this.fromLang;
		this.fromLang = this.toLang;
		this.toLang = fromLang;
		this._translateText(this.fromLang, this.transTextData);
		$('[name="original-lang"]', this.shadowRoot).value = this.fromLang;
		$('[name="translated-lang"]', this.shadowRoot).value = this.toLang;
	}

	onToLangChange(event) {
		this.toLang = event.target.value;
		this._translateText(this.fromLang);
		setStore({ toLang: this.toLang });
	}

	setRange() {
		const selection = getSelection();
		//biome-ignore format:
		selection.setBaseAndExtent(this.range.startContainer, this.range.startOffset, this.range.endContainer, this.range.endOffset);
	}

	async replaceText() {
		const { SourceTextReplacer } = await import("./replace-src-text.js");
		const srcTextReplacer = new SourceTextReplacer();
		await srcTextReplacer.init(this.fromLang, this.toLang);
		if (this.range) {
			this.setRange();
			return srcTextReplacer.replaceSrcTextWithTranslated();
		}
		if (this.inputFieldElem)
			new SourceTextReplacer().replaceTextareaSelectedText(
				this.sourceTxtData,
				this.inputFieldElem,
				this.transTextData,
			);
	}

	copyText() {
		navigator.clipboard
			.writeText(this.transTextData)
			.then(() => toast("Copied"))
			.catch((err) => console.error(err));
	}

	async ttsSpeak(text, lang) {
		return await chrome.runtime.sendMessage({ msg: "ttsSpeak", text, lang });
	}

	async speak(prop, event) {
		event.currentTarget.setAttribute("class", "speaking");
		prop === "orig"
			? this.ttsSpeak(this.sourceTxtData, this.fromLang)
			: this.ttsSpeak(this.transTextData, this.toLang);
		setTimeout(() => event.currentTarget.setAttribute("class", "speak"), 2000);
	}

	render() {
		const languageList = Object.keys(languages);
		return html`<header>
				<svg
					viewBox="0 0 24 24"
					class="speak"
					@click=${this.speak.bind(this, "orig")}>
					<title>${i18n("pronounce_source_text")}</title>
					<path />
				</svg>

				<select
					name="original-lang"
					value="${this.fromLang}"
					@change=${this.onFromLangChange.bind(this)}>
					${languageList.map((lang) => `<option value="${lang}">${languages[lang]}</option>`).join("")}
				</select>

				<svg class="swap" viewBox="0 0 24 24" @click=${this.translateOutputData.bind(this)}>
					<title>${i18n("reverse_language")} (Alt+R)</title>
					<path />
				</svg>

				<select
					name="translated-lang"
					value="${this.toLang}"
					@change=${this.onToLangChange.bind(this)}>
					${languageList.map((lang) => `<option value="${lang}">${languages[lang]}</option>`).join("")}
				</select>

				<svg viewBox="0 0 16 16" class="replace" style="right:24px" @pointerdown=${this.replaceText.bind(this)}>
					<title>${i18n("replace_src_text_with_translated")} (Alt+R)</title>
					<path />
				</svg>
			</header>
			<article>
				<section>
					<svg
						class="speak"
						viewBox="0 0 24 24"
						style="right:2px"
						@click=${this.speak.bind(this, "trans")}>
						<title>${i18n("pronounce_translated_text")}</title>
						<path />
					</svg>
					
					<textarea>${this.transTextData}</textarea>
				</section>
			</article>
			<output hidden></output>`;
	}

	async connectedCallback() {
		this.setAttribute("popover", "");
		this.attachShadow({ mode: "open" });
		this.shadowRoot.adoptedStyleSheets = [popupCss];
	}
}

customElements?.define("translator-popup", TranslatorPopup);
