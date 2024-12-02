import { Block } from "../../db/Block.js";
import { pipeBlockList } from "../../db/block-db.js";
import { ImageCard } from "../blockcards/image-card.js";
import { BookmarkCard } from "../blockcards/bookmark-card.js";
import { NotepadCard } from "../blockcards/notepad-card.js";
// @ts-ignore
import containerCss from "../../style/category-container.css" with { type: "css" };
import blockLabelCss from "../../style/block-labels.css" with { type: "css" };
document.adoptedStyleSheets.push(containerCss, blockLabelCss);

const folderPaths = (await getStore("folderPaths")).folderPaths ?? {};

export class CategoryContainer extends HTMLElement {
	constructor() {
		super();
	}

	/**@param {Map<string, Block[]>} collectionMap*/
	render(collectionMap) {
		const docFrag = new DocumentFragment();
		collectionMap.forEach((collections, key) => {
			const categoryItem = document.createElement("category-item");
			const labelElem = document.createElement("category-label");
			labelElem.textContent = this.viewMode === "folder" ? (folderPaths[key] ?? key) : key;
			const collectionsBox = document.createElement("category-collectionbox");
			//biome-ignore format:
			collectionsBox.append(...collections.map((block) => block["note"] ? new NotepadCard(block) : block["bookmark"] ? new BookmarkCard(block) : block["image"] && new ImageCard(block)));
			categoryItem.append(labelElem, collectionsBox);
			docFrag.append(categoryItem);
		});

		return docFrag;
	}

	async connectedCallback() {
		const replaceViewCollections = async (viewMode, filter) => {
			this.viewMode = viewMode;
			localStorage.setItem("viewMode", viewMode);
			try {
				const collectionMap = await pipeBlockList(viewMode, filter);
				this.replaceChildren(this.render(collectionMap));
			} catch (error) {
				console.error(error);
				// document.body.appendChild(new ReportBug(error));
			}
		};
		replaceViewCollections("date");
		$on(document.body, "viewmodechange", ({ detail }) => replaceViewCollections(detail));
		$on(document.body, "viewmodefilter", ({ detail }) => replaceViewCollections(this.viewMode, detail));
	}
}

customElements.define("category-container", CategoryContainer);
