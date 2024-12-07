import { ActionSnackbar } from "../helper/action-snackbar.js";
import { deleteBlocksInDb } from "../../db/block-db.js";
import { BlockLabels } from "./block-labels.js";
import { html } from "../../js/om.compact.js";

export class VideoCard extends HTMLElement {
	constructor(video) {
		super();
		this.video = video;
	}

	async deleteVideo() {
		const deleteId = setTimeout(() => deleteBlocksInDb([this.video.id]).then(() => this.remove()), 5000);
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
		return html`<video src="${this.video.video.srcUrl}" alt="" preload="none" controls></video>
		<div class="description">${this.video.video.description}</div>
		<atom-icon ico="delete" title="" style="bottom:0.5em" @click=${this.deleteVideo.bind(this)}></atom-icon>`;
	}

	connectedCallback() {
		this.replaceChildren(this.render());
		this.video.video.labels && this.appendChild(new BlockLabels(this.video.video.labels));
	}
}

customElements.define("video-card", VideoCard);
