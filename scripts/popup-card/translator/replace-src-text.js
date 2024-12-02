import { Translator } from "../../../AI/translator.js";

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

export class SourceTextReplacer extends Translator {
	constructor() {
		super();
		/**@type {Map<string,Text[]>} */
		this.textNodeMap = new Map();
		this.textDataList = [];
	}

	async init(sourceLang, targetLang) {
		const canTranslate = await Translator.checkAvailability(sourceLang, targetLang);
		if (canTranslate === "Not available") return alert("Translator not available");
		await this.createTranslator(sourceLang, targetLang);
	}

	setTranslatedTextNode(translatedTexts) {
		const values = this.textNodeMap.values();
		for (let index = 0; index < this.textNodeMap.size; index++) {
			const textNodes = values.next().value;
			const txtData = translatedTexts[index];
			for (let textNode of textNodes) replaceTransData(textNode, txtData);
		}
	}

	/**@param {Range} range */
	extractTextNodes(range) {
		const nodeIterator = document.createNodeIterator(range.commonAncestorContainer, NodeFilter.SHOW_TEXT);

		/**@type {Text} */
		let textNode;
		while ((textNode = nodeIterator.nextNode())) {
			if (this.textNodeMap.size === 0 && textNode !== range.startContainer) continue;
			if (textNode === range.startContainer) textNode = textNode.splitText(range.startOffset);
			if (textNode === range.endContainer) textNode.splitText(range.endOffset);

			const txtData = textNode.data;
			if (!txtData.trim()) continue;
			this.textNodeMap.has(txtData)
				? this.textNodeMap.get(txtData).push(textNode)
				: this.textNodeMap.set(txtData, [textNode]);
			if (textNode === range.endContainer) break;
		}
	}

	async replaceSrcTextWithTranslated() {
		const selection = getSelection();
		if (selection.isCollapsed) return;
		const range = selection.getRangeAt(0);

		try {
			this.extractTextNodes(range);
			const promises = [];
			for (const txtData of this.textNodeMap.keys()) promises.push(this.translate(txtData));
			const translatedTexts = await Promise.all(promises);

			this.setTranslatedTextNode(translatedTexts);
			const srcText = selection.toString();
			//biome-ignore format:
			range.startContainer.nodeType === 1 ?  range.startContainer["title"] = srcText : range.startContainer.parentElement.title = srcText
			selection.removeAllRanges();
		} catch (error) {
			console.error(error);
		}
	}

	/** @param {string} selectedText, @param {HTMLTextAreaElement} editFieldElem*/
	async replaceTextareaSelectedText(selectedText, editFieldElem) {
		try {
			const translatedText = await this.translate(selectedText);
			editFieldElem.setRangeText(translatedText);
		} catch (error) {
			console.error(error);
		}
	}
}
