import { fixLangCode } from "../../js/util.js";
import { LangInputBox } from "./lang-input-box.js";
import { Translator } from "../../../AI/translator.js";
import { html } from "../../../collections/js/om.compact.js";
import { getCrtTab } from "../../js/extractor.js";
import { WEBSTORE_ERR } from "../../js/constant.js";
import { LanguageDetector } from "../../../AI/lang-detect.js";
// @ts-ignore
import translatorCss from "../../style/translator-dialog.css" with { type: "css" };
document.adoptedStyleSheets.push(translatorCss);

export class TranslatorDialog extends HTMLDialogElement {
	constructor(sourceText) {
		super();
		this.sourceText = sourceText;
	}

	fabBtn() {
		function swapTransLanguage() {
			this.nextElementSibling.transData
				? this.previousElementSibling.swapTransLanguage()
				: this.nextElementSibling.swapTransLanguage();
		}
		return html`<fab-swap-btn @click=${swapTransLanguage}>
			<atom-icon ico="swap-bold" title="${i18n("swap_languages")}"></atom-icon>
		</fab-swap-btn>`;
	}

	async connectedCallback() {
		this.id = "translator";
		const tab = await getCrtTab();
		if (tab.url?.startsWith("chrome") || tab.url?.startsWith(WEBSTORE_ERR)) return;

		const langDetector = new LanguageDetector();
		let sourceLang = await langDetector.detectLang(this.sourceText ? this.sourceText : tab.title);
		let toLang = (await getStore("toLang")).toLang ?? fixLangCode(navigator.language);
		const canTranslate = await Translator.checkAvailability(sourceLang, toLang);
		if (canTranslate === "Not available") return console.log("Translator not available");
		this.replaceChildren(new LangInputBox(sourceLang), new LangInputBox(toLang));
		this.firstElementChild["inputTxtValue"] = this.sourceText;
		document.body.style.width = "32rem";
		this.showModal();
		langDetector.destroy();
	}
}

customElements.define("translator-dialog", TranslatorDialog, { extends: "dialog" });
