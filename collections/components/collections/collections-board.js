import "./category-container.js";
import { SearchBar } from "./search-bar.js";
import { CategoryContainer } from "./category-container.js";

export class AiCollectionboard extends HTMLElement {
	constructor() {
		super();
	}

	connectedCallback() {
		this.replaceChildren(new SearchBar(), new CategoryContainer());
	}
}

customElements.define("collections-board", AiCollectionboard);
