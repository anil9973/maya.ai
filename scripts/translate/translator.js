import "../toast.js";
import { AiTranslator } from "../../AI/translator.js";

const fixLangCode = (lang) => lang?.split("-", 1)[0].toLowerCase();
const i18n = chrome.i18n.getMessage.bind(this);

/**@param {Text} textNode*/
function replaceTransData(textNode, transTxt) {
	if (!transTxt) return;
	const data = textNode.data;
	const size = data.length;

	//trim left
	let startI = -1;
	while (startI++ < size) if (data[startI] !== " " && data[startI] !== "\n") break;
	//trim right
	let endI = size;
	while (endI--) if (data[endI] !== " " && data[endI] !== "\n") break;
	return textNode.replaceData(startI, endI + 1 - startI, transTxt);
}

export class AutoWebPageTranslator extends AiTranslator {
	/** @param {string} toLang */
	constructor(toLang) {
		super();
		this.toLang = toLang;
		/**@type {Map<string,Text[]>} */
		this.textNodeMap = new Map();
		this.textDataList = [];
		this.init();
	}

	async init() {
		const canLangDetect = await AiTranslator.checkLangDetectAvailability();
		if (canLangDetect === "Not available") return alert(i18n("translator_not_available"));
		await this.createLangDetector();

		const translateLangElem = async (langElem, elemLang) => {
			const canTranslate = await AiTranslator.checkAvailability(sourceLang, this.toLang);
			if (canTranslate === "Not available")
				return toast(`${sourceLang} to ${this.toLang} Translator not available`, true);
			await this.createTranslator(sourceLang, this.toLang);
			await this.translateElem(langElem, this.toLang, elemLang);
		};

		this.toLang ??= (await chrome.storage.local.get("toLang")).toLang ?? fixLangCode(navigator.language);
		const sourceLang = fixLangCode(document.documentElement.lang) || (await this.detectLang(document.title));
		if (sourceLang === this.toLang) {
			toast(i18n("source_and_target_lang_identical"), true);
			for (const langElem of document.body.querySelectorAll("[lang]")) {
				const elemLang = fixLangCode(langElem["lang"]);
				elemLang === this.toLang || translateLangElem(langElem, elemLang);
			}
		} else translateLangElem(document.documentElement, sourceLang);
		toast("Translating...");
		this.observeAddTextNodes();
	}

	setTranslatedTextNode(translatedTexts) {
		const values = this.textNodeMap.values();
		for (let index = 0; index < this.textNodeMap.size; index++) {
			const textNodes = values.next().value;
			const txtData = translatedTexts[index];
			for (let textNode of textNodes) replaceTransData(textNode, txtData);
		}
	}

	extractTextNodes(rootElem = document.body) {
		const nodeIterator = document.createNodeIterator(rootElem, NodeFilter.SHOW_TEXT);

		/**@type {Text} */
		let textNode;
		while ((textNode = nodeIterator.nextNode())) {
			const txtData = textNode.data;
			if (!txtData.trim()) continue;
			this.textNodeMap.has(txtData)
				? this.textNodeMap.get(txtData).push(textNode)
				: this.textNodeMap.set(txtData, [textNode]);
		}
	}

	/** @param {HTMLElement|HTMLElement[]} rootElem, @param {string} toLang @param {string} sourceLang */
	async translateElem(rootElem, toLang, sourceLang) {
		try {
			if (Array.isArray(rootElem)) {
				rootElem.forEach(this.extractTextNodes.bind(this));
				rootElem.length = 0;
			} else this.extractTextNodes(rootElem);
			const promises = [];
			for (const txtData of this.textNodeMap.keys()) promises.push(this.translate(txtData, toLang, sourceLang));
			const translatedTexts = await Promise.all(promises);
			//BUG sometime Promise not resolved
			this.setTranslatedTextNode(translatedTexts);
		} catch (error) {
			console.error(error);
			toast(error.message, true);
		} finally {
			this.textNodeMap.clear();
			this.textDataList.length = 0;
		}
	}

	async observeAddTextNodes() {
		const rootElements = [];
		let timerId;
		const txtAddedListener = (mutationList) => {
			mutationList.forEach(async (mutation) => {
				if (mutation.addedNodes.length === 0 || !mutation.addedNodes[0].textContent.trim()) return;
				const firstNode = mutation.addedNodes[0];
				const parentElem = firstNode.closest?.("[contenteditable]");
				if (parentElem && parentElem.contenteditable === "true") return;
				const sourceLang = firstNode.lang || (await this.detectLang(firstNode.textContent.slice(0, 100)));
				for (const node of mutation.addedNodes) {
					if (sourceLang === this.toLang) continue;
					rootElements.push(node);
					clearTimeout(timerId);
					timerId = setTimeout(() => this.translateElem(rootElements, this.toLang, sourceLang), 2000);
				}
			});
		};

		const transObserver = new MutationObserver(txtAddedListener);
		transObserver.observe(document.body, { childList: true, subtree: true });
	}
}
