export class EmbedLink extends HTMLElement {
	constructor() {
		super();
	}

	async setEmbedContent(embedContent) {
		const imgSrcElem =
			this.nextElementSibling.nextElementSibling.nextElementSibling.nextElementSibling.nextElementSibling;
		let imgUrl = imgSrcElem.textContent;

		imgSrcElem.id = imgUrl.slice(-36);

		if (!this.imgElem) {
			this.imgElem = new Image();
			this.imgElem.src = imgUrl;
			this.imgElem.onload = () => {
				embedContent.appendChild(this.imgElem);
				// imgUrl.startsWith("blob:") && URL.revokeObjectURL(imgUrl);
			};
		} else this.imgElem.src === imgUrl || (this.imgElem.src = imgUrl);
	}

	connectedCallback() {
		this.appendChild(new Text("!"));
	}
}
customElements.define("embed-link", EmbedLink);

export class EmbedContent extends HTMLElement {
	constructor() {
		super();
		this.setAttribute("contenteditable", "false");
	}

	connectedCallback() {}
}

customElements.define("embed-content", EmbedContent);
