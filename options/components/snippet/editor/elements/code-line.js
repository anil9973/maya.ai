import { setCaretAt } from "../processor/processor-helper.js";
import { textAutoCompletion } from "./text-auto-completion.js";

export class CodeLine extends HTMLElement {
	constructor(text, active = true) {
		super();
		text && this.appendChild(new Text(text));
		this._internals = this.attachInternals();
		this.active = active;
	}

	/**@param {boolean} flag*/
	set active(flag) {
		// @ts-ignore
		flag ? this._internals.states.add("active") : this._internals.states.delete("active");
	}

	connectedCallback() {
		// @ts-ignore
		this._internals.states.has("active") && setCaretAt(this, 0);
		textAutoCompletion.isConnected && textAutoCompletion.show(this);
	}
}

customElements.define("code-line", CodeLine);
