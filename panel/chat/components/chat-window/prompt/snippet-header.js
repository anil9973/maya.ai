import { AtomIcon } from "../../../../../collections/components/helper/atom-icon.js";
import { getSync, setSync } from "../../../../../popup/js/constant.js";

export class SnippetPopupHeader extends HTMLElement {
	constructor() {
		super();
	}

	async switchCategory({ target }) {
		const openSnippetCategory = target.value;
		await setSync({ openSnippetCategory });
		fireEvent(this, "switchcategory", openSnippetCategory);
	}

	render(snippetCategories) {
		const select = document.createElement("select");
		const span = document.createElement("span");
		select.add(new Option("All", "All"));
		snippetCategories &&
			Object.values(snippetCategories).forEach((category) => select.add(new Option(category.name, category.name)));
		span.appendChild(new Text("Snippets"));
		$on(select, "click", this.switchCategory.bind(this));
		return [select, span, new AtomIcon("open-linkurl")];
	}

	async connectedCallback() {
		const { snippetCategories, openSnippetCategory } = await getSync(["snippetCategories", "openSnippetCategory"]);
		this.replaceChildren(...this.render(snippetCategories));
		openSnippetCategory && (this.firstElementChild["value"] = openSnippetCategory);
		$on(this.lastElementChild, "click", () => chrome.runtime.openOptionsPage());
	}
}

customElements.define("snippet-popup-header", SnippetPopupHeader);
