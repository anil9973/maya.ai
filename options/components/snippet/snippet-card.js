import { ActionSnackbar } from "../../../collections/components/helper/action-snackbar.js";
import { deleteSnippetsInDb, Snippet } from "../../../collections/db/snippet-db.js";
import { html } from "../../../collections/js/om.compact.js";

export class SnippetCard extends HTMLElement {
	/** @param {Snippet} snippet*/
	constructor(snippet) {
		super();
		this.snippet = snippet;
	}

	async deleteSnippet() {
		const deleteId = setTimeout(() => deleteSnippetsInDb([this.snippet.id]).then(() => this.remove()), 5000);
		try {
			const snackElem = new ActionSnackbar();
			document.body.appendChild(snackElem);
			await snackElem.show(deleteId);
			this.hidden = true;
		} catch (error) {
			this.hidden = false;
		}
	}

	async openSnippetEditor() {
		const { SnippetEditorDialog } = await import("./editor/snippet-editor-dialog.js");
		this.parentElement.after(new SnippetEditorDialog(this.snippet));
	}

	render() {
		return html`<div class="column">
				<div class="title">${this.snippet.title}</div>
				<div class="prompt">${this.snippet.promptMsg}</div>
				<div class="description">${this.snippet.description}</div>
			</div>
			<div class="column">
				<div style="height: 1lh;"><kbd>${this.snippet.shortcutKey}</kbd></div>
				<atom-icon ico="box-edit" title="${i18n("edit_snippet")}" @click=${this.openSnippetEditor.bind(this)}></atom-icon>
				<atom-icon ico="delete" title="${i18n("delete_snippet")}" @click=${this.deleteSnippet.bind(this)}></atom-icon>
			</div>`;
	}

	connectedCallback() {
		this.replaceChildren(this.render());
	}
}

customElements.define("snippet-card", SnippetCard);
