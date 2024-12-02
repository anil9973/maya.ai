import "./calendar.js";
import "./domains.js";
import "./folder-tree.js";
import { html, react } from "../../js/om.compact.js";
import { CollectionCalendar } from "./calendar.js";
import { DomainList } from "./domains.js";
import { FolderTree } from "./folder-tree.js";
// @ts-ignore
import explorerCss from "../../style/collections-explorer.css" with { type: "css" };
// @ts-ignore
import treeCss from "../../style/folder-tree.css" with { type: "css" };

const props = react({ viewMode: "date" });

export class CollectionsExplorer extends HTMLElement {
	constructor() {
		super();
		this.attachShadow({ mode: "open" });
		this.shadowRoot.adoptedStyleSheets = [explorerCss, treeCss];
	}

	toggleViewModel({ target }) {
		const viewMode = target.value;
		props.viewMode = viewMode;
		const viewModeList =
			viewMode === "date" ? new CollectionCalendar() : viewMode === "domain" ? new DomainList() : new FolderTree();
		this.shadowRoot.lastElementChild.replaceWith(viewModeList);
		fireEvent(document.body, "viewmodechange", viewMode);
	}

	render() {
		return html`<viewmode-header @change=${this.toggleViewModel.bind(this)}>
			<label>
				<input type="radio" name="viewmode" value="date" hidden checked />
				<span class="active"><atom-icon ico="calendar"></atom-icon>${i18n("date")}</span>
			</label>
			<label>
				<input type="radio" name="viewmode" value="domain" hidden />
				<span><atom-icon ico="web"></atom-icon> ${i18n("domain")}</span>
			</label>
			<label>
				<input type="radio" name="viewmode" value="folder" hidden />
				<span><atom-icon ico="folders"></atom-icon> ${i18n("folder")}</span>
			</label>
		</viewmode-header>`;
	}

	connectedCallback() {
		this.shadowRoot.replaceChildren(this.render(), new CollectionCalendar());
	}
}

customElements.define("collections-explorer", CollectionsExplorer);
