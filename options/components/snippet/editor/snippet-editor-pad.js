import { textAutoCompletion } from "./elements/text-auto-completion.js";
import { SnippetProcessor } from "./processor/snippet-processor.js";
import { varCompletion } from "./elements/variable-completion.js";
import { CodeLine } from "./elements/code-line.js";

export class SnippetEditorpad extends HTMLElement {
	constructor() {
		super();
	}

	static snippetProcessor = new SnippetProcessor();
	promptmsg;

	render() {
		return [new CodeLine(this.promptmsg)];
	}

	connectedCallback() {
		this.setAttribute("contenteditable", "true");
		this.setAttribute("spellcheck", "false");
		this.replaceChildren(...this.render());
		this.after(varCompletion);
		this.after(textAutoCompletion);
		this.setListener();
	}

	setListener() {
		//biome-ignore format:
		$on(this, "beforeinput", (event) => SnippetEditorpad.snippetProcessor?.handleInputByType[event.inputType]?.(event));
		$on(this, "keydown", this.handleKeyDown.bind(this));
		$on(this, "mouseup", ({ target }) => {
			const activeLines = this.querySelectorAll(":scope > code-line:state(active)");
			for (const activeLine of activeLines) activeLine["active"] = false;
			if (target === this) return (this.lastElementChild["active"] = true);
			target.closest("code-line").active = true;
		});
	}

	handleKeyDown(event) {
		//biome-ignore format:
		if ((event.altKey || event.metaKey) && SnippetEditorpad.snippetProcessor?.altKeys[event.code]) return SnippetEditorpad.snippetProcessor?.altKeys[event.code]();
		if (event.ctrlKey && event.code === "Space") SnippetEditorpad.snippetProcessor?.showAutoCompletion();
		if (event.code !== "Tab") return;
		SnippetEditorpad.snippetProcessor?.captureTab(event);
		event.preventDefault();
	}
}

customElements.define("snippet-editor-pad", SnippetEditorpad);
