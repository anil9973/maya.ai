import { Translator } from "../../AI/translator.js";

const fixLangCode = (lang) => lang?.split("-", 1)[0].toLowerCase();
const i18n = chrome.i18n.getMessage.bind(this);

/**@param {Text} textNode*/
function replaceTransData(textNode, transTxt) {
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

export class AutoWebPageTranslator extends Translator {
	constructor(toLang) {
		super();
		this.toLang = toLang;
		console.log(this.toLang);
		/**@type {Map<string,Text[]>} */
		this.textNodeMap = new Map();
		this.textDataList = [];
		this.init();
	}

	async init() {
		const canLangDetect = await Translator.checkLangDetectAvailability();
		if (canLangDetect === "Not available") return alert(i18n("translator_not_available"));
		await this.createLangDetector();
		this.toLang ??= (await chrome.storage.local.get("toLang")).toLang ?? fixLangCode(navigator.language);
		const sourceLang = await this.detectLang(document.title);
		if (sourceLang === this.toLang) return alert(i18n("source_and_target_lang_identical"));

		const canTranslate = await Translator.checkAvailability(sourceLang, this.toLang);
		if (canTranslate === "Not available") return alert(`${sourceLang} to ${this.toLang} Translator not available`);
		await this.createTranslator(sourceLang, this.toLang);
		console.log("Translating...");
		await this.translateElem(document.documentElement, this.toLang, sourceLang);
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

	/** @public @param {string} toLang @param {string} sourceLang */
	async translateElem(rootElem, toLang, sourceLang) {
		try {
			this.extractTextNodes(rootElem);
			const promises = [];
			for (const txtData of this.textNodeMap.keys()) promises.push(this.translate(txtData, toLang, sourceLang));
			const translatedTexts = await Promise.all(promises);
			//BUG sometime Promise not resolved
			this.setTranslatedTextNode(translatedTexts);
		} catch (error) {
			console.error(error);
		} finally {
			this.textNodeMap.clear();
			this.textDataList.length = 0;
		}
	}

	async observeAddTextNodes() {
		const txtAddedListener = (mutationList) => {
			for (const mutation of mutationList) {
				if (mutation.addedNodes.length === 0 || mutation.addedNodes[0].textContent.trim()) continue;
				//biome-ignore format:
				this.detectLang(document.title).then((sourceLang) => { sourceLang === this.toLang || this.translateElem(mutation.addedNodes[0], this.toLang, sourceLang) });
			}
		};

		const transObserver = new MutationObserver(txtAddedListener);
		transObserver.observe(document.body, { characterData: true, childList: true, subtree: true });
	}
}
