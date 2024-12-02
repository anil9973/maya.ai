import { Snippet } from "../../../../../collections/db/snippet-db.js";
import { html } from "../../../../../collections/js/om.compact.js";

export class SnippetCard extends HTMLElement {
	/** @param {Snippet} snippet*/
	constructor(snippet) {
		super();
		this.snippet = snippet;
	}

	render() {
		return html`<div class="column">
				<div class="title">${this.snippet.title}</div>
				<div class="prompt">${this.snippet.promptMsg}</div>
				<div class="description">${this.snippet.description}</div>
			</div>
			<div class="column">
				<div style="height: 1lh;"><kbd>${this.snippet.shortcutKey}</kbd></div>
			</div>`;
	}

	connectedCallback() {
		this.replaceChildren(this.render());
		$on(this, "click", () => fireEvent(this.parentElement.parentElement, "insertsnippet", this.snippet));
	}
}

customElements.define("snippet-card", SnippetCard);
