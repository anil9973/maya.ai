import { NoteRenderer } from "./note-renderer/dom-creator.js";
import { LineBlock } from "./elements/line-block.js";
// @ts-ignore
import mdFormatCss from "../style/mark-format.css" with { type: "css" };
import mdBlockFormatCss from "../style/mark-block-format.css" with { type: "css" };
document.adoptedStyleSheets.push(mdFormatCss, mdBlockFormatCss);

export class MarkWriterPad extends HTMLElement {
	constructor(content) {
		super();
		this.renderContent(content);
	}

	static inputProcessor;
	static noteRenderer = new NoteRenderer();

	async renderContent(content) {
		try {
			const contentFrag = content ? MarkWriterPad.noteRenderer.createDom(content) : new LineBlock(true);
			this.replaceChildren(contentFrag);
			MarkWriterPad.inputProcessor && (MarkWriterPad.inputProcessor.activeLine = this.lastElementChild);
		} catch (error) {
			console.error(error);
		}
	}

	connectedCallback() {
		this.setAttribute("contenteditable", "true");
		this.setAttribute("spellcheck", "false");
	}
}

customElements.define("mark-writer-pad", MarkWriterPad);
