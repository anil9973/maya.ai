import { html } from "../../../collections/js/om.event.js";
// @ts-ignore
import imgPreviewCss from "./image-preview.css" with { type: "css" };

export class ImagePreviewBox extends HTMLElement {
	constructor() {
		super();
	}

	render() {
		const imgUrl = "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Cat03.jpg/1200px-Cat03.jpg";
		return html`<img-action-bar>
            <button class="download-img">
                <svg class="download" viewBox="0 0 24 24">
                    <path />
                </svg>
                <span class="btn-text">${i18n("download")}</span>
            </button>

            <button class="replace-img">
                <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M14 4a2 2 0 0 1 2-2m0 8a2 2 0 0 1-2-2m6-6a2 2 0 0 1 2 2m0 4a2 2 0 0 1-2 2M3 7l3 3l3-3"/><path d="M6 10V5a3 3 0 0 1 3-3h1"/><rect width="8" height="8" x="2" y="14" rx="2"/></g></svg>
                <span class="btn-text">${i18n("replace")}</span>
            </button>

            <button class="copy-img">
                <svg class="copy" viewBox="0 0 24 24">
                    <path />
                </svg>
                <span class="btn-text">${i18n("copy")}</span>
            </button>
            <button class="close-btn">❌ <span class="btn-text">${i18n("close")}</span></button>
        </img-action-bar>
        <picture><img src="${imgUrl}"></picture>`;
	}

	connectedCallback() {
		this.id = "image-preview-box";
		this.setAttribute("popover", "");
		this.attachShadow({ mode: "open" });
		this.shadowRoot.adoptedStyleSheets = [imgPreviewCss];

		this.shadowRoot.replaceChildren(this.render());
		this.showPopover();
	}
}

customElements?.define("image-preview-box", ImagePreviewBox);
