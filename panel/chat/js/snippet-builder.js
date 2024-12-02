import { crtTabId, extractSelectedContent, injectFuncScript } from "../../../popup/js/extractor.js";
import { extractHtmlTagsContent, extractPageThumbnail } from "../../../scripts/func-script.js";
import { getTabs } from "../../../popup/js/constant.js";

const tabId = await crtTabId();

export class SnippetBuilder {
	constructor() {}

	state;
	parts = [];

	async build(buffer) {
		this.buffer = buffer;
		this.sectionStart = 0;
		this.index = -1;
		this.size = buffer.length;
		await this.consume();
		return this.parts.join("");
	}

	variableFuncs = {
		ALL_TAB_URL: async () => (await getTabs({ currentWindow: true })).map((tab) => tab.url).join("\n"),
		ALL_TAB_TITLE: async () => (await getTabs({ currentWindow: true })).map((tab) => tab.title),
		CLIPBOARD: () => navigator.clipboard.readText(),
		CURRENT_DATE_TIME: () => new Date().toLocaleString(),
		CURRENT_DATE: () => new Date().toLocaleDateString(),
		CURRENT_TIME: () => new Date().toLocaleTimeString(),
		TAB_URL: async () => (await getTabs({ active: true })).map((tab) => tab.url)[0],
		TAB_TITLE: async () => (await getTabs({ active: true })).map((tab) => tab.title)[0],
		PAGE_DESCRIPTION: async () => (await injectFuncScript(extractPageThumbnail))?.[0],
		PAGE_ALL_H_TAG: async () => (await injectFuncScript(extractHtmlTagsContent, tabId, "h1", false))?.[0],
		PAGE_ALL_H1_TAG: async () => (await injectFuncScript(extractHtmlTagsContent, tabId, "h1", false))?.[0],
		PAGE_ALL_H2_TAG: async () => (await injectFuncScript(extractHtmlTagsContent, tabId, "h2", false))?.[0],
		PAGE_ALL_H3_TAG: async () => (await injectFuncScript(extractHtmlTagsContent, tabId, "h3", false))?.[0],
		PAGE_ALL_PRE_TAG: async () => (await injectFuncScript(extractHtmlTagsContent, tabId, "pre", false))?.[0],
		PAGE_ALL_IMG: async () => (await injectFuncScript(extractHtmlTagsContent, tabId, "img", false))?.[0],
		PAGE_ALL_URL: async () => (await injectFuncScript(extractHtmlTagsContent, tabId, "a", false))?.[0],
		PAGE_ALL_ADDRESS: async () => (await injectFuncScript(extractHtmlTagsContent, tabId, "address", false))?.[0],
		PAGE_ALL_BULLET_LIST_TAG: async () => (await injectFuncScript(extractHtmlTagsContent, tabId, "ul", false))?.[0],
		PAGE_ALL_NUMBERED_LIST_TAG: async () =>
			(await injectFuncScript(extractHtmlTagsContent, tabId, "ol", false))?.[0],
		PAGE_ALL_TABLE: async () => (await injectFuncScript(extractHtmlTagsContent, tabId, "table", false))?.[0],
		PAGE_VISIBLE_H_TAG: async () => (await injectFuncScript(extractHtmlTagsContent, tabId, "h", true))?.[0],
		PAGE_VISIBLE_IMG_TAG: async () => (await injectFuncScript(extractHtmlTagsContent, tabId, "img", true))?.[0],
		PAGE_VISIBLE_A_TAG: async () => (await injectFuncScript(extractHtmlTagsContent, tabId, "a", true))?.[0],
		PAGE_VISIBLE_ADDRESS: async () => (await injectFuncScript(extractHtmlTagsContent, tabId, "address", true))?.[0],
		PAGE_VISIBLE_TABLE: async () => (await injectFuncScript(extractHtmlTagsContent, tabId, "table", true))?.[0],
		PAGE_VISIBLE_BULLET_LIST_TAG: async () =>
			(await injectFuncScript(extractHtmlTagsContent, tabId, "ul", true))?.[0],
		PAGE_VISIBLE_NUMBERED_LIST_TAG: async () =>
			(await injectFuncScript(extractHtmlTagsContent, tabId, "ol", true))?.[0],
		PAGE_VISIBLE_H1_TAG: async () => (await injectFuncScript(extractHtmlTagsContent, tabId, "h1", true))?.[0],
		PAGE_VISIBLE_H2_TAG: async () => (await injectFuncScript(extractHtmlTagsContent, tabId, "h2", true))?.[0],
		PAGE_VISIBLE_H3_TAG: async () => (await injectFuncScript(extractHtmlTagsContent, tabId, "h3", true))?.[0],
		PAGE_PARAGRAPH_TAG: async () => (await injectFuncScript(extractHtmlTagsContent, tabId, "p", true))?.[0],
		PAGE_LANG: async () => (await injectFuncScript(extractHtmlTagsContent, tabId))?.[0],
		// PAGE_AUTHOR: async () => (await injectFuncScript(extractHtmlTagsContent, tabId))?.[0],
		SELECTED_TAB_URL: async () => (await getTabs({ highlighted: true })).map((tab) => tab.url).join("\n"),
		SELECTED_TAB_TITLE: async () => (await getTabs({ highlighted: true })).map((tab) => tab.title).join("\n"),

		SELECTED_TEXT: async () => {
			const selection = getSelection();
			if (!selection.isCollapsed) {
				const text = selection.toString()?.trim();
				if (text) return text;
			}
			return await extractSelectedContent();
		},
	};

	fastForwardTo(char) {
		while (this.buffer[++this.index] !== char) if (this.index === this.size - 1) break;
	}

	async stateInVariable() {
		this.state = "InVariable";
		const string = this.buffer.slice(this.sectionStart, this.index - 2);
		this.parts.push(string);

		this.sectionStart = ++this.index; // skip '{'
		this.fastForwardTo("}");
		const varName = this.buffer.slice(this.sectionStart, this.index);
		const varValue = (await this.variableFuncs[varName]?.()) ?? varName;
		this.parts.push("\n" + varValue);
		this.sectionStart = ++this.index; // skip '}'
	}

	async consume() {
		this.state === "InVariable" && this.stateInVariable();
		while (++this.index < this.size) {
			this.buffer[this.index] === "{" && this.buffer[this.index - 1] === "$" && (await this.stateInVariable());
		}
		this.parts.push(this.buffer.slice(this.sectionStart, this.index));
	}
}
