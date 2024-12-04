import { MarkdownParser } from "../scripts/markdown/parser/mark-htmldom/parser.js";
import { NOT_AVAILABLE } from "../popup/js/constant.js";
import { PromptMessenger } from "./prompt-message.js";

export class AiWriter {
	constructor() {}

	static async checkAvailability() {
		const canPrompt = await ai.languageModel.capabilities();
		if (!canPrompt || canPrompt.available === "no") return NOT_AVAILABLE;
		return canPrompt.available;
	}

	async createWriter(context, tone) {
		this.writer = await ai.writer.create({ tone: "formal", sharedContext: context });
	}

	/**@public @param {string} message*/
	async write(message, context) {
		this.writer ?? (await this.createWriter(context));
		try {
			this.abortController = new AbortController();
			const signal = this.abortController.signal;
			return await this.writer.write(message, { context, signal });
		} catch (error) {
			console.error(error);
			if (error.code === 9 || error.name === "NotReadableError") {
				if (!this.promptWriter) {
					this.promptWriter = new PromptMessenger();
					const prompts = [{ role: "user", content: this.writer.sharedContext }];
					await this.promptWriter.createPromptSession("Text Writer", prompts);
				}
				this.promptWriter.promptMessage(message);
			} else if (error.code !== 20) throw new Error("Failed to write content", { cause: error });
		}
	}

	/** @public */
	async writeStream(message, context, writerHTMLElem) {
		this.writer ?? (await this.createWriter(context));
		this.abortController = new AbortController();
		const signal = this.abortController.signal;
		try {
			const readStream = this.writer.writeStreaming(message, { context, signal });
			return await parseMarkDomStream(readStream, writerHTMLElem);
		} catch (error) {
			console.error(error);
			if (error.code === 9 || error.cause?.code === 9 || error.cause?.name === "NotReadableError")
				return this.write(message);
			if (error.cause.code !== 20) throw new Error("Failed to rewrite content", { cause: error });
		}
	}

	/** @public */
	async writeTextStream(message, context, writerHTMLElem) {
		this.writer ?? (await this.createWriter(context));
		try {
			this.abortController = new AbortController();
			const signal = this.abortController.signal;
			const readStream = this.writer.writeStreaming(message, { context, signal });
			let previousChunk = "";
			for await (const chunk of readStream) {
				const newChunk = chunk.startsWith(previousChunk) ? chunk.slice(previousChunk.length) : chunk;
				writerHTMLElem && writerHTMLElem.appendChild(new Text(newChunk));
				previousChunk = chunk;
			}
		} catch (error) {
			console.error(error);
			if (error.code === 9 || error.cause?.code === 9 || error.cause?.name === "NotReadableError") {
				if (!this.promptWriter) {
					this.promptWriter = new PromptMessenger();
					const prompts = [{ role: "user", content: this.writer.sharedContext }];
					await this.promptWriter.createPromptSession("Text Writer", prompts);
				}
				this.promptWriter.promptTextMsgStream(message, "Text writer", null, writerHTMLElem);
			} else if (error.code !== 20) throw new Error("Failed to write content", { cause: error });
		}
	}

	stop() {
		this.abortController?.abort();
	}

	destroy() {
		this.writer.destroy();
	}
}

/** @param {ReadableStream<string>} readStream*/
export async function parseMarkDomStream(readStream, writerHTMLElem) {
	let previousChunk = "";
	const transformStream = new TransformStream({
		transform(chunk, controller) {
			const newChunk = chunk.startsWith(previousChunk) ? chunk.slice(previousChunk.length) : chunk;
			if (!newChunk) return;
			controller.enqueue(newChunk);
			previousChunk = chunk;
		},

		flush() {
			dispatchEvent(new Event("markstreamcomplete"));
		},
	});
	const stream = readStream.pipeThrough(transformStream);
	writerHTMLElem.replaceChildren();

	const markParser = new MarkdownParser();
	for await (const contentFrag of markParser.parseStream(stream)) {
		writerHTMLElem.appendChild(contentFrag);
	}
}
