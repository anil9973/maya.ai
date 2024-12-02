import { textAutoCompletion } from "../../../../../options/components/snippet/editor/elements/text-auto-completion.js";
import { varCompletion } from "../../../../../options/components/snippet/editor/elements/variable-completion.js";
import { SnippetProcessor } from "../../../../../options/components/snippet/editor/processor/snippet-processor.js";
import { getSnippetByShortcutKey, Snippet } from "../../../../../collections/db/snippet-db.js";

export class PromptEditorpad extends HTMLElement {
	constructor() {
		super();
	}

	static snippetProcessor = new SnippetProcessor();

	connectedCallback() {
		this.setAttribute("contenteditable", "plaintext-only");
		this.setAttribute("spellcheck", "false");
		this.setListener();
		this.after(varCompletion);
		this.after(textAutoCompletion);
	}

	setListener() {
		//biome-ignore format:
		$on(this, "beforeinput", (event) => PromptEditorpad.snippetProcessor?.handleInputByType[event.inputType]?.(event));
		$on(this, "keydown", this.handleKeyDown.bind(this));
	}

	handleKeyDown(event) {
		//biome-ignore format:
		if ((event.altKey || event.metaKey) && PromptEditorpad.snippetProcessor?.altKeys[event.code]) return PromptEditorpad.snippetProcessor?.altKeys[event.code]();
		if (event.code === "Period" && (event.altKey || event.metaKey)) return this.pastePreviousMessage();
		if (event.code === "Slash") return this.showSnippetPopup();
		if (event.code === "Enter")
			return event.shiftKey ? this.showSnippetPopup() : this.parentElement["sendMessage"]();
		if (event.ctrlKey || event.shiftKey || event.altKey || event.metaKey) return this.onShortcutKeyPress(event);
		if (event.code !== "Tab") return;
		PromptEditorpad.snippetProcessor?.captureTab(event);
		event.preventDefault();
	}

	/** @param {KeyboardEvent} event */
	async onShortcutKeyPress(event) {
		if (!event.code.startsWith("Key") && !event.code.startsWith("Digit")) return;
		let shortcutKey = "";
		event.ctrlKey && (shortcutKey += "Ctrl+");
		event.shiftKey && (shortcutKey += "Shift+");
		event.altKey && (shortcutKey += "Alt+");
		event.metaKey && (shortcutKey += "Meta+");
		shortcutKey += event.key.toLocaleUpperCase();
		const snippet = await getSnippetByShortcutKey(shortcutKey);
		snippet && this.insertSnippet(snippet);
	}

	async showSnippetPopup() {
		if (this.snippetPopup) return this.snippetPopup.showPopover();
		const { SnippetContainer } = await import("./snippet-container.js");
		this.snippetPopup = new SnippetContainer();
		this.after(this.snippetPopup);
		$on(this.snippetPopup, "insertsnippet", ({ detail }) => this.insertSnippet(detail));
	}

	/** @param {Snippet} snippet*/
	insertSnippet(snippet) {
		this.parentElement["snippetCommands"] = snippet.commands;
		this.textContent = snippet.promptMsg;
		//TODO Select variable placeholder
	}

	pastePreviousMessage() {
		const lastUserPrompt = Array.prototype.at.call(document.querySelectorAll("user-query"), -1)?.textContent;
		lastUserPrompt && (this.textContent = lastUserPrompt);
	}
}

customElements.define("prompt-editor-pad", PromptEditorpad);
