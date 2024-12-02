import { setCaretAt } from "../processor/processor-helper.js";
import { varCompletion } from "./variable-completion.js";

export class VarPlaceholder extends HTMLElement {
	constructor() {
		super();
	}

	render() {
		const varElem = document.createElement("var");
		const selection = getSelection();
		selection.anchorOffset === selection.focusOffset || selection.getRangeAt(0).surroundContents(varElem);
		return [new Text("${"), varElem, new Text("}")];
	}

	connectedCallback() {
		this.replaceChildren(...this.render());

		if (!this.firstElementChild.hasChildNodes()) {
			varCompletion.show(this.firstElementChild);
			setCaretAt(this.firstElementChild, 0);
		} else {
			const nextTextNode = new Text(" ");
			this.firstElementChild.parentElement.after(nextTextNode);
			setCaretAt(nextTextNode, 1);
		}
	}
}

customElements.define("var-placeholder", VarPlaceholder);
