import { pipeSnippetList } from "../../../collections/db/snippet-db.js";
import { getSync } from "../../../popup/js/constant.js";
import { SnippetCard } from "./snippet-card.js";

export class SnippetContainer extends HTMLElement {
	constructor() {
		super();
	}

	static openSnippetCategory;

	async onCategorySwitch({ detail }) {
		SnippetContainer.openSnippetCategory = detail;
		const snippetList = await pipeSnippetList(SnippetContainer.openSnippetCategory);
		this.replaceChildren(...this.render(snippetList));
	}

	render(snippetList) {
		return snippetList.map((snippet) => new SnippetCard(snippet));
	}

	async connectedCallback() {
		SnippetContainer.openSnippetCategory = (await getSync("openSnippetCategory")).openSnippetCategory;

		const snippetList = await pipeSnippetList(SnippetContainer.openSnippetCategory);
		this.replaceChildren(...this.render(snippetList));
		$on(this.previousElementSibling, "switchcategory", this.onCategorySwitch.bind(this));
		$on(document.getElementById("addSnippet"), "click", this.openAddSnippetDialog.bind(this));
	}

	async openAddSnippetDialog() {
		const { SnippetEditorDialog } = await import("./editor/snippet-editor-dialog.js");
		this.after(new SnippetEditorDialog());
	}
}

customElements.define("snippet-container", SnippetContainer);
