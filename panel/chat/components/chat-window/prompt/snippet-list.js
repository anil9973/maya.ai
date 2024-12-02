import { pipeSnippetList } from "../../../../../collections/db/snippet-db.js";
import { getSync } from "../../../../../popup/js/constant.js";
import { SnippetCard } from "./snippet-card.js";

export class SnippetList extends HTMLElement {
	constructor() {
		super();
	}

	static openSnippetCategory;

	async onCategorySwitch({ detail }) {
		SnippetList.openSnippetCategory = detail;
		const snippetList = await pipeSnippetList(SnippetList.openSnippetCategory);
		this.replaceChildren(...this.render(snippetList));
	}

	render(snippetList) {
		return snippetList.map((snippet) => new SnippetCard(snippet));
	}

	async connectedCallback() {
		SnippetList.openSnippetCategory = (await getSync("openSnippetCategory")).openSnippetCategory;

		const snippetList = await pipeSnippetList(SnippetList.openSnippetCategory);
		this.replaceChildren(...this.render(snippetList));
		$on(this.previousElementSibling, "switchcategory", this.onCategorySwitch.bind(this));
	}
}

customElements.define("snippet-list", SnippetList);
