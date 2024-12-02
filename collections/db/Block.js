import { addDateInCollection, addDomainInCollection, get2RoutePath } from "../../popup/js/category.js";

const rdmHue = () => Math.floor(Math.random() * 18) * 20;
const mapLabels = (labels) => labels.map((label) => ({ color: rdmHue(), name: label }));

export class Block {
	/** @param {string} type @param {BookmarkBlock|ImageBlock|NoteBlock} block*/
	constructor(type, block, blockId = crypto.randomUUID()) {
		this.id = blockId;
		this[type] = block;

		this.date = new Date().toLocaleDateString("default", { day: "2-digit", month: "long", year: "numeric" });

		this.trashed = false;
		this.trashedAt = null;
		this.createdAt = new Date().toISOString();
		this.updatedAt = null;

		// @ts-ignore
		this.setDomain(block.url || block.pageUrl);
		addDateInCollection();
	}

	setDomain(pageUrl) {
		if (!URL.canParse(pageUrl)) return;
		const url = new URL(pageUrl);
		this.domain = url.host;
		this.route = get2RoutePath(url);
		addDomainInCollection(url, this.route);
	}

	async setFolder(...categories) {
		const folders = (await getStore("folders")).folders ?? { root: [] };
		let parentId = "root";
		for (const folderName of categories) {
			const idx = folders[parentId]?.findIndex((item) => item.name === folderName);
			folders[parentId] ??= [];
			let folder;
			if (idx === -1) {
				folder = { id: Math.random().toString(36).slice(2), name: folderName };
				folders[parentId].push(folder);
				parentId = folder.id;
			} else if (parentId && folders[parentId].findIndex((item) => item.name === folderName) === -1) {
				folder = folders[parentId].splice(idx, 1)[0];
				folders[parentId].push(folder);
				parentId = folder.id;
			}
			await setStore({ folders });
		}

		this.folder = parentId;
	}
}

export class BookmarkBlock {
	/**
	 * @param {string} title
	 * @param {string} url
	 * @param {string} description
	 * @param {string} thumbnail
	 * @param {string[]} labels
	 */
	constructor(title, url, description, thumbnail, labels) {
		this.title = title;
		this.url = url;
		this.description = description;
		this.thumbnail = thumbnail;
		this.labels = mapLabels(labels);
	}
}

export class NoteBlock {
	/**
	 * @param {string} title
	 * @param {string} url
	 * @param {any[]} markContent
	 * @param {string} description
	 * @param {string} thumbnail
	 */
	constructor(title, markContent, url, description, thumbnail, labels) {
		this.title = title;
		this.url = url;
		this.description = description;
		this.thumbnail = thumbnail;
		this.content = markContent;
		this.labels = mapLabels(labels);
	}
}

export class ImageBlock {
	/**
	 * @param {string} srcUrl
	 * @param {string} alt
	 * @param {string} description
	 * @param {string} caption
	 */
	constructor(srcUrl, pageUrl, description, alt, caption, labels) {
		this.srcUrl = srcUrl;
		this.pageUrl = pageUrl;
		this.alt = alt;
		this.caption = caption;
		this.description = description;
		this.labels = mapLabels(labels);
	}
}

export class CollectionFolder {
	constructor(id, isFolder) {
		this.id = id;
		this.name = id;
		this.isFolder = isFolder;
	}
}

export const BlockType = {
	Image: "image",
	Bookmark: "bookmark",
	Note: "note",
};
