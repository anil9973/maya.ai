import { generateContentOnGeminiServer } from "./Gemini-api.js";
import { NOT_AVAILABLE } from "../popup/js/constant.js";

export class SwPromptMessenger {
	constructor() {}

	async init() {
		const canResponse = await SwPromptMessenger.checkAvailability();
		if (canResponse === "Not available") return alert("Prompt API not available");
		if (canResponse === "after-download") console.log("Prompt messenger downloading in progress");
	}

	static async checkAvailability() {
		const canPrompt = await ai.languageModel.capabilities();
		if (!canPrompt || canPrompt.available === "no") return NOT_AVAILABLE;
		return canPrompt.available;
	}

	async createPromptModel() {
		this.session = await ai.languageModel.create();
	}

	/** @param {string} message*/
	async promptMessage(message) {
		try {
			this.session ?? (await this.createPromptModel());
			return await this.session.prompt(message);
		} catch (error) {
			console.error(error);
			if (error.code === 9) {
				return await generateContentOnGeminiServer(message);
			} else throw new Error(i18n("prompt_response_error"), { cause: error });
		}
	}

	destroy() {
		this.session.destroy();
	}
}
