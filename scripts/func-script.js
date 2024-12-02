export async function extractPageThumbnail() {
	const meta1 = document.head.querySelector('meta[name="description"]');
	const description = meta1?.["content"] || document.title;

	const meta2 =
		document.head.querySelector('meta[property="og:image"]') ||
		document.head.querySelector('meta[name="twitter:image"]');
	return [description, meta2?.["content"]];
}

export async function translateCrtPage(toLang) {
	const { AutoWebPageTranslator } = await import(chrome.runtime.getURL("scripts/translate/translator.js"));
	new AutoWebPageTranslator(toLang);
}

export function extractHtmlTagsContent(tagName, visibleonly) {
	const tagElems = document.querySelectorAll(tagName);
	const elements = visibleonly ? Array.prototype.filter.call(tagElems, isElemVisible) : tagElems;

	function isElemVisible(element) {
		const rect = element.getBoundingClientRect();
		if (rect.top >= 0 && rect.left >= 0 && rect.bottom <= innerHeight && rect.right <= innerWidth) return true;
		return false;
	}

	const textArr =
		tagName === "a"
			? Array.prototype.map.call(elements, (elem) => `[${elem.href}](${elem.innerText})`)
			: tagName === "img"
				? Array.prototype.map.call(elements, (elem) => `[${elem.alt}](${elem.currentSrc || elem.src})`)
				: Array.prototype.map.call(elements, (elem) => elem.innerText);

	return textArr.join("\n");
}
