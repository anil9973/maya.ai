import { html, map, react } from "../../js/om.compact.js";

const collectionfolders = (await getStore("folders")).folders ?? { root: [] };
export const collections = react(collectionfolders);
let openFolder = "root";

/**@param {{name:string,isFolder?:boolean}} collectionObj*/
async function addCollectionInStore(collectionObj, parentId) {
	try {
		const collectionfolders = (await getStore("folders")).collectionfolders ?? { root: [] };
		const idx = collectionfolders[parentId ?? openFolder]?.findIndex((item) => item.name === collectionObj.name);
		if (idx === -1) {
			collectionfolders[openFolder].push(collectionObj);
			collectionObj.isFolder && (collectionfolders[collectionObj["id"]] = []);
			await setStore({ collections: collectionfolders });
		} else if (
			parentId &&
			collectionfolders[openFolder].findIndex((item) => item.name === collectionObj.name) === -1
		) {
			const [collectionItem] = collectionfolders[parentId].splice(idx, 1);
			collectionfolders[openFolder].push(collectionItem);
			await setStore({ collections: collectionfolders });
		}
	} catch (error) {
		console.error(error);
	}
}

export class FolderTree extends HTMLElement {
	constructor() {
		super();
	}

	changeCollectionFolder({ target }) {
		const dragParentId = this.dragCollection.closest("ul")?.id;
		const collection = this.dragCollection.children[1].textContent;
		const collectionIdx = collectionfolders[dragParentId].findIndex(({ name }) => name === collection);
		const [collectionObj] = collectionfolders[dragParentId].splice(collectionIdx, 1);

		openFolder = target.closest("div")?.nextElementSibling
			? target.closest("div")?.nextElementSibling.id
			: target.closest("ul")?.id;

		openFolder ??= "root";
		collectionfolders[openFolder].push(collectionObj);
		addCollectionInStore(collectionObj, dragParentId);
		this.dragCollection = null;
	}

	createNewFile() {
		if (!collections[openFolder]) {
			collections[openFolder] = react([]);
			const newLayer = html`${map(collections[openFolder], this.layerItem)}`;
			newLayer.firstElementChild["hidden"] = false;
			this.children[1].appendChild(newLayer);
		}
		const folderId = Math.random().toString(36).slice(3);
		const folder = { id: folderId, name: folderId, isFolder: true };
		collections[openFolder].push(folder);

		const titleInput = this.querySelector("#openFolder").lastElementChild.firstElementChild.children[1];
		titleInput.setAttribute("contenteditable", "true");
		titleInput["focus"]();
		getSelection().getRangeAt(0).selectNodeContents(titleInput);
		titleInput.addEventListener("blur", this.updateFolderName.bind(this, folder), { once: true });
	}

	updateFolderName(folder, { target }) {
		folder.name = target.textContent;
		if (!folder.name) return;
		addCollectionInStore(folder);
		target.setAttribute("contenteditable", "false");
	}

	openFolder({ currentTarget }) {
		$("div.selected", this)?.classList.remove("selected");
		const divElem = currentTarget;
		const nxtElem = divElem.nextElementSibling;
		divElem.classList.add("selected");
		if (nxtElem && nxtElem?.nodeName === "UL") {
			nxtElem.hidden = !nxtElem.hidden;
			divElem.firstElementChild.ico = nxtElem.hidden ? "folder" : "folder-open";
			// nxtElem.hidden || (openFolder = nxtElem.id);
		}
		openFolder = divElem.dataset.id;
		//TODO add nested folders
		fireEvent(document.body, "viewmodefilter", openFolder);
	}

	layerItem = (collection) => html`<li>
		<div @click=${this.openFolder.bind(this)} data-id="${collection.id}" draggable="true">
			<atom-icon ico="folder"></atom-icon>
			<span>${collection.name}</span>
		</div>
		${collection.isFolder ? this.createLayer(collections[collection.id], collection.id) : ""}
	</li>`;

	createLayer(itemArr, folderId) {
		return html`<ul id=${folderId} hidden>
			${map(itemArr, this.layerItem)}
		</ul>`;
	}

	render() {
		return this.createLayer(collections.root, "root");
	}

	async connectedCallback() {
		this.replaceChildren(this.render());
		this.firstElementChild["hidden"] = false;

		$on(this, "dragstart", ({ target }) => (this.dragCollection = target));
		$on(this, "dragover", (event) => event.preventDefault());
		$on(this, "drop", this.changeCollectionFolder);
	}
}

customElements.define("folder-tree", FolderTree);
