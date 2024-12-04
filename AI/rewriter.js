import { NOT_AVAILABLE } from "../popup/js/constant.js";
import { PromptMessenger } from "./prompt-message.js";
import { parseMarkDomStream } from "./writer.js";

export class AiRewriter {
	constructor() {}

	static async checkAvailability() {
		const canPrompt = await ai.languageModel.capabilities();
		if (!canPrompt || canPrompt.available === "no") return NOT_AVAILABLE;
		return canPrompt.available;
	}

	async createRewriter(context) {
		this.rewriter = await ai.rewriter.create({ sharedContext: context });
	}

	/** @param {string} message*/
	async rewrite(message, context) {
		try {
			this.rewriter ?? (await this.createRewriter(context));
			this.abortController = new AbortController();
			const signal = this.abortController.signal;
			return await this.rewriter.rewrite(message, { context, signal });
		} catch (error) {
			console.error(error);
			if (error.code === 9 || error.name === "NotReadableError") {
				if (!this.promptWriter) {
					this.promptWriter = new PromptMessenger();
					const prompts = [{ role: "user", content: this.rewriter.sharedContext }];
					await this.promptWriter.createPromptSession("Text Rewriter", prompts);
				}
				return await this.promptWriter.promptMessage(message);
			} else if (error.code !== 20) throw new Error(i18n("failed_to_rewrite_content"), { cause: error });
		}
	}

	/** @public */
	async rewriteStream(message, context, writerHTMLElem) {
		this.rewriter ?? (await this.createRewriter(context));
		try {
			this.abortController = new AbortController();
			const signal = this.abortController.signal;
			const readStream = this.rewriter.rewriteStreaming(message, { context, signal });
			return await parseMarkDomStream(readStream, writerHTMLElem);
		} catch (error) {
			console.error(error);
			if (error.code === 9 || error.cause?.code === 9 || error.cause?.name === "NotReadableError")
				return await this.rewrite(message);
			if (error.cause.code !== 20) throw new Error(i18n("failed_to_rewrite_content"), { cause: error });
		}
	}

	/** @public */
	async rewriteTextStream(message, context, writerHTMLElem) {
		this.rewriter ?? (await this.createRewriter(context));
		try {
			this.abortController = new AbortController();
			const signal = this.abortController.signal;
			const readStream = this.rewriter.rewriteStreaming(message, { context, signal });
			let previousChunk = "";
			for await (const chunk of readStream) {
				const newChunk = chunk.startsWith(previousChunk) ? chunk.slice(previousChunk.length) : chunk;
				writerHTMLElem.appendChild(new Text(newChunk));
				previousChunk = chunk;
			}
		} catch (error) {
			console.error(error);
			if (error.code === 9 || error.cause?.code === 9 || error.name === "NotReadableError") {
				if (!this.promptRewriter) {
					this.promptRewriter = new PromptMessenger();
					const prompts = [{ role: "user", content: this.rewriter.sharedContext }];
					await this.promptRewriter.createPromptSession("Text Rewriter", prompts);
				}
				this.promptRewriter.promptTextMsgStream(message, null, null, writerHTMLElem);
			} else if (error.cause.code !== 20) throw new Error(i18n("failed_to_rewrite_content"), { cause: error });
		}
	}

	stop() {
		this.abortController?.abort();
	}

	destroy() {
		this.rewriter.destroy();
	}
}
