import { ActionSnackbar } from "../helper/action-snackbar.js";
import { deleteBlocksInDb } from "../../db/block-db.js";
import { getFileById } from "../../db/file-db.js";
import { html } from "../../js/om.compact.js";
import { BlockLabels } from "./block-labels.js";

export class ImageCard extends HTMLElement {
	constructor(image) {
		super();
		this.image = image;
	}

	async deleteImage() {
		const deleteId = setTimeout(() => deleteBlocksInDb([this.image.id]).then(() => this.remove()), 5000);
		try {
			const snackElem = new ActionSnackbar();
			document.body.appendChild(snackElem);
			await snackElem.show(deleteId);
			this.hidden = true;
		} catch (error) {
			this.hidden = false;
		}
	}

	async setLocalImage(imgElem) {
		const srcUrl = this.image.image.srcUrl;
		if (srcUrl.startsWith("../")) {
			/* const mediaUrl = await readLocalImgFile(null, srcUrl);
			imgElem.src = mediaUrl ? mediaUrl : await getBlobUrl(srcUrl.slice(3)); */
		} else imgElem.src = await getBlobUrl(srcUrl.slice(-36));
		imgElem.onload = () => URL.revokeObjectURL(imgElem.src);

		async function getBlobUrl(blobId) {
			const blob = await getFileById(blobId);
			// @ts-ignore
			return blob && URL.createObjectURL(blob);
		}
	}

	render() {
		return html`<img src="${this.image.image.srcUrl}" alt="" loading="lazy" decoding="async">
		<div class="description">${this.image.image.description}</div>
		<atom-icon ico="delete" title="" style="bottom:0.5em" @click=${this.deleteImage.bind(this)}></atom-icon>`;
	}

	connectedCallback() {
		this.replaceChildren(this.render());
		this.image.image.labels && this.appendChild(new BlockLabels(this.image.image.labels));
		this.image.image.srcUrl.startsWith("http") || this.setLocalImage(this.firstElementChild);
	}
}

customElements.define("image-card", ImageCard);
