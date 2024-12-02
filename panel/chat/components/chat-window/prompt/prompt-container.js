import { AtomIcon } from "../../../../../collections/components/helper/atom-icon.js";
import { SnippetBuilder } from "../../../js/snippet-builder.js";
import { PromptEditorpad } from "./prompt-editor-pad.js";
import { AttachmentPlusBox } from "./attachment-plus.js";

export class PromptContainer extends HTMLElement {
	constructor() {
		super();
	}

	get autoCommands() {
		const autoCommands = this.snippetCommands;
		this.snippetCommands = null;
		return autoCommands;
	}

	async sendMessage() {
		let message = this.children[1].textContent;
		const qnMessage = await new SnippetBuilder().build(message);
		const fileBox = this.firstElementChild;
		fileBox["textContents"].length === 0 || (message += fileBox["textContents"].join(""));
		fileBox["imageContents"].length === 0 || (message += fileBox["imageContents"].join(""));
		this.children[1].textContent = "";
		//TODO save auto-completion
		fireEvent(this, "sendpromptmessage", qnMessage);
	}

	render() {
		return [new AttachmentPlusBox(), new PromptEditorpad(), new AtomIcon("send")];
	}

	connectedCallback() {
		this.replaceChildren(...this.render());
		$on(this.lastElementChild, "click", this.sendMessage.bind(this));
	}
}

customElements.define("prompt-input-container", PromptContainer);

// Explain Pros and cons of product in webpage
