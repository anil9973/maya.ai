import { NOT_AVAILABLE } from "../popup/js/constant.js";

const defaultLang = navigator.language?.split("-", 1)[0].toLowerCase();

export class AiTranslator {
	constructor() {}

	//== Lang Detector =
	static async checkLangDetectAvailability() {
		const canDetect = await ai.languageDetector.capabilities();
		if (!canDetect || canDetect.available === "no") return "Not available";
		return canDetect.available;
	}

	async createLangDetector() {
		const status = await AiTranslator.checkLangDetectAvailability();
		if (status !== "readily") console.info("Detect lang after download");
		this.langDetector = await ai.languageDetector.create();
	}

	async detectLang(sourceText) {
		this.langDetector ?? (await this.createLangDetector());
		const results = await this.langDetector.detect(sourceText);
		if (results && results[0].confidence > 0.2) return results[0].detectedLanguage;
	}
	//Lang Detector

	/** @param {string} sourceLanguage @param {string} targetLanguage*/
	static async checkAvailability(sourceLanguage, targetLanguage) {
		if (!self.translation || !self.translation.canTranslate) return;
		const languagePair = { sourceLanguage, targetLanguage };
		const canTranslate = await translation.canTranslate(languagePair);
		if (!canTranslate || canTranslate === "no") return NOT_AVAILABLE;
		return canTranslate;
	}

	/** @param {string} sourceLanguage @param {string} targetLanguage*/
	async createTranslator(sourceLanguage, targetLanguage) {
		const languagePair = { sourceLanguage, targetLanguage };
		this[sourceLanguage] ??= await ai.translator.create(languagePair);
	}

	/** @param {string} sourceText @param {string} [targetLang] @param {string} [sourceLang] */
	async translate(sourceText, targetLang, sourceLang) {
		targetLang ??= defaultLang;
		sourceLang ??= await this.detectLang(sourceText);
		if (sourceLang === targetLang) return sourceText;
		this[sourceLang] ?? (await this.createTranslator(sourceLang, targetLang));

		this.abortController = new AbortController();
		const signal = this.abortController.signal;
		return this[sourceLang].translate(sourceText, { signal });
	}

	stop() {
		this.abortController?.abort();
	}

	async destroy(sourceLang) {
		await this[sourceLang].destroy();
	}
}
