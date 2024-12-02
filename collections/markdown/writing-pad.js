import { tagCompletion } from "./elements/tag-completion.js";
import { LineBlock } from "./elements/line-block.js";
import { NoteRenderer } from "./note-renderer/dom-creator.js";

export class WritingPad extends HTMLElement {
	constructor(content) {
		super();
		this.renderContent(content);
	}

	static inputProcessor;
	static noteRenderer = new NoteRenderer();

	async renderContent(content) {
		try {
			const contentFrag = content ? WritingPad.noteRenderer.createDom(content) : new LineBlock(true);
			this.replaceChildren(contentFrag);
			WritingPad.inputProcessor && (WritingPad.inputProcessor.activeLine = this.lastElementChild);
		} catch (error) {
			console.error(error);
		}
	}

	connectedCallback() {
		this.setAttribute("contenteditable", "true");
		this.setAttribute("spellcheck", "false");
		this.setListener();
		this.after(tagCompletion);
	}

	async setListener() {
		if (!WritingPad.inputProcessor) {
			const { InputProcessor } = await import("./live-processor/input-processor.js");
			WritingPad.inputProcessor = new InputProcessor();
			WritingPad.inputProcessor.activeLine ??= this.lastElementChild;
		}
		$on(this, "beforeinput", (event) => WritingPad.inputProcessor.handleInputByType[event.inputType]?.(event));
		$on(this, "mouseup", WritingPad.inputProcessor.handleMouseUp.bind(WritingPad.inputProcessor));
		$on(this, "keydown", this.captureTab);
	}

	captureTab = (evt) => {
		if ((evt.altKey || evt.metaKey) && WritingPad.inputProcessor.altKeys[evt.code])
			return WritingPad.inputProcessor.altKeys[evt.code]();
		if (evt.code !== "Tab") return;
		WritingPad.inputProcessor.handleTab();
		evt.preventDefault();
	};

	disconnectedCallback() {
		document.body.appendChild(tagCompletion);
	}
}

customElements.define("writing-pad", WritingPad);
