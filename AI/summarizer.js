import { NOT_AVAILABLE, setSync, getSync } from "../popup/js/constant.js";
import { AISummaryType } from "./enums.js";
import { generateContentOnGeminiServer } from "./Gemini-api.js";
import { parseMarkDomStream } from "./writer.js";

export class Summarizer {
	constructor() {}

	static async checkAvailability() {
		const canSummarize = await ai.summarizer.capabilities();
		if (!canSummarize || canSummarize.available === "no") return NOT_AVAILABLE;
		return canSummarize.available;
	}

	async changeSummaryType(type = AISummaryType.KEY_POINTS) {
		await setSync({ summaryType: type });
		await this.summarizer?.destroy();
		await this.createSummarizer(null, type);
	}

	async createSummarizer(context, summaryType, length = "medium") {
		const format = "markdown";
		context && (this.context = context);
		summaryType ??= (await getSync("summaryType")).summaryType ?? AISummaryType.KEY_POINTS;
		this.summarizer = await ai.summarizer.create({ type: summaryType, sharedContext: context, length, format });
	}

	/** @param {string} inputText, @returns {Promise<string>}*/
	async summarize(inputText, context) {
		this.abortController = new AbortController();
		const signal = this.abortController.signal;
		this.summarizer ?? (await this.createSummarizer(context, { signal }));
		return this.summarizer.summarize(inputText);
	}

	/** @param {string} inputText*/
	async summarizeStream(inputText, context, writerHTMLElem) {
		try {
			this.summarizer ?? (await this.createSummarizer(context));
			this.abortController = new AbortController();
			const signal = this.abortController.signal;
			const readStream = await this.summarizer.summarizeStreaming(inputText, { signal });
			return parseMarkDomStream(readStream, writerHTMLElem);
		} catch (error) {
			console.error(error);
			if (error.code === 9 || error.cause?.code === 9) {
				const text = await generateContentOnGeminiServer(`Summarize following contents:\n${inputText}`);
				text && writerHTMLElem.appendChild(new Text(text));
			} else if (error.cause?.code !== 20) throw new Error(i18n("prompt_response_error"), { cause: error });
		}
	}

	stop() {
		this.abortController?.abort();
	}
}
