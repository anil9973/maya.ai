import { deleteBlocksInDb } from "../../db/block-db.js";
import { ActionSnackbar } from "../helper/action-snackbar.js";
import { BlockLabels } from "./block-labels.js";
import { html } from "../../js/om.compact.js";

export class BookmarkCard extends HTMLElement {
	constructor(bookmark) {
		super();
		this.bookmark = bookmark;
	}

	openBookmarkUrl() {
		chrome.tabs.create({ url: this.bookmark.bookmark.url });
	}

	async deleteBookmark() {
		const deleteId = setTimeout(() => deleteBlocksInDb([this.bookmark.id]).then(() => this.remove()), 5000);
		try {
			const snackElem = new ActionSnackbar();
			document.body.appendChild(snackElem);
			await snackElem.show(deleteId);
			this.hidden = true;
		} catch (error) {
			this.hidden = false;
		}
	}

	render() {
		const bookmark = this.bookmark.bookmark;
		return html`<img src="${bookmark.thumbnail}" alt="" />
			<h3>${bookmark.title}</h3>
			<p>${bookmark.description}</p>
			<div class="link-url">${bookmark.url}</div>
			<atom-icon ico="open-linkurl" title="" style="top:0.5em" @click=${this.openBookmarkUrl.bind(this)}></atom-icon>
			<atom-icon ico="delete" title="" style="bottom:0.5em" @click=${this.deleteBookmark.bind(this)}></atom-icon>`;
	}

	connectedCallback() {
		this.replaceChildren(this.render());
		this.appendChild(new BlockLabels([{ name: "google", color: 230 }]));
	}
}

customElements.define("bookmark-card", BookmarkCard);
