import { MarkdownParser } from "../scripts/markdown/parser/mark-htmldom/parser.js";
import { generateContentOnGeminiServer } from "./Gemini-api.js";
import { NOT_AVAILABLE } from "../popup/js/constant.js";
import { parseMarkDomStream } from "./writer.js";

export class PromptMessenger {
	constructor() {}

	static async checkAvailability() {
		const canPrompt = await ai.languageModel.capabilities();
		if (!canPrompt || canPrompt.available === "no") return NOT_AVAILABLE;
		return canPrompt.available;
	}

	/** @param {string} systemRole @param {{role:string, content:string}[]} [initialPrompts] */
	async createPromptSession(systemRole = "", initialPrompts) {
		initialPrompts ??= [];
		this.userPrompts = initialPrompts;
		// systemRole += `\nOutput language: ${navigator.language}`;
		this.session = await ai.languageModel.create({ systemPrompt: systemRole, initialPrompts });
	}

	/** @param {string} message*/
	async promptMessage(message, systemRole, initialPrompts) {
		this.abortController = new AbortController();
		const signal = this.abortController.signal;

		try {
			this.session ?? (await this.createPromptSession(systemRole, initialPrompts));
			return await this.session.prompt(message, { signal });
		} catch (error) {
			if (error.code === 9) {
				return await generateContentOnGeminiServer(`${this.userPrompts[0].content}\n${message}`);
			} else if (error.code !== 20) throw new Error(i18n("prompt_response_error"), { cause: error });
		}
	}

	/** @public */
	async promptMessageStream(message, systemRole, initialPrompts, writerHTMLElem) {
		this.abortController = new AbortController();
		const signal = this.abortController.signal;

		try {
			this.session ?? (await this.createPromptSession(systemRole, initialPrompts));
			const readStream = this.session.promptStreaming(message, { signal });
			return await parseMarkDomStream(readStream, writerHTMLElem);
		} catch (error) {
			console.error(error);
			if (error.code === 9 || error.cause?.code === 9) {
				const text = await generateContentOnGeminiServer(`${this.userPrompts[0].content}\n${message}`);
				text && parseMarkDom(text, writerHTMLElem);
			} else if (error.cause?.code !== 20) throw new Error(i18n("prompt_response_error"), { cause: error });
		}
	}

	/**
	 * @param {string} message
	 * @param {string} systemRole
	 * @param {{ role: string; content: string; }[]} initialPrompts
	 * @param {HTMLElement} writerHTMLElem
	 */
	async promptTextMsgStream(message, systemRole, initialPrompts, writerHTMLElem) {
		this.abortController = new AbortController();
		const signal = this.abortController.signal;

		try {
			this.session ?? (await this.createPromptSession(systemRole, initialPrompts));
			const readStream = this.session.promptStreaming(message, { signal });
			let previousChunk = "";
			for await (const chunk of readStream) {
				const newChunk = chunk.startsWith(previousChunk) ? chunk.slice(previousChunk.length) : chunk;
				writerHTMLElem.appendChild(new Text(newChunk));
				previousChunk = chunk;
			}
		} catch (error) {
			console.error(error);
			if (error.code === 9 || error.cause?.code === 9) {
				const text = await generateContentOnGeminiServer(`${this.userPrompts[0].content}\n${message}`);
				text && writerHTMLElem.appendChild(new Text(text));
			} else if (error.cause?.code !== 20) throw new Error(i18n("prompt_response_error"), { cause: error });
		}
	}

	stop() {
		this.abortController?.abort();
	}

	destroy() {
		this.stop();
		this.session?.destroy();
	}
}

/** @param {string} text @param {HTMLElement} writerHTMLElem*/
async function parseMarkDom(text, writerHTMLElem) {
	const markParser = new MarkdownParser();
	const contentFrag = await markParser.parse(text);
	contentFrag && writerHTMLElem.appendChild(contentFrag);
}
