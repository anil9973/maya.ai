import { LanguageDetector } from "../../AI/lang-detect.js";
import { NOT_AVAILABLE } from "./constant.js";
// @ts-ignore
import languages from "/assets/languages.json" with { type: "json" };

/** @param {string} sourceText*/
export async function checkForeignLang(sourceText) {
	const canDetect = await LanguageDetector.checkAvailability();
	if (canDetect === NOT_AVAILABLE) return notify("Language Detector not available");
	const sourceLang = await new LanguageDetector().detectLang(sourceText);
	const userLanguages = navigator.languages.map((lang) => lang?.split("-", 1)[0].toLowerCase());
	return !userLanguages.includes(sourceLang);
}

/** @param {string} lang*/
export const fixLangCode = (lang) => lang.split("-", 1)[0].toLowerCase();
