import "../../../collections/js/reset.js";
import "../util.js";
import { html } from "../../../collections/js/om.event.js";
// @ts-ignore
import selectionCss from "./selection-popup.css" with { type: "css" };

export class ImageSelectionPopup extends HTMLElement {
	constructor() {
		super();
	}

	/** @type {HTMLImageElement}*/
	targetImgElem;

	async saveImage() {
		this.hidePopover();
		toast("Downloading...");
		const imgSrcUrl = this.targetImgElem.currentSrc || this.targetImgElem.src;
		const message = { msg: "addImageInCollection", imgSrcUrl, alt: this.targetImgElem.alt };
		const response = await chrome.runtime.sendMessage(message);
	}

	setPosition(popupElem) {
		popupElem.style.left = this.style.left;
		popupElem.style.top = `calc(${this.style.top} + 40px)`;
	}

	async openPromptResponsePopup(request) {
		if (!this.aiPromptResponsePopup) {
			const imgSrcUrl = this.targetImgElem.currentSrc || this.targetImgElem.src;
			const context = `Image source URL: '${imgSrcUrl}' and alternative text for image: '${this.targetImgElem.alt}'`;
			const importUrl = chrome.runtime.getURL("/scripts/popup-card/prompt-response/prompt-response-popup.js");
			const { AiPromptResponsePopup } = await import(importUrl);
			const descriptors = Object.getOwnPropertyDescriptors(AiPromptResponsePopup.prototype);
			/**@type {AiPromptResponsePopup} */
			// @ts-ignore
			this.aiPromptResponsePopup = document.createElement("aiprompt-response-popup");
			Object.defineProperties(this.aiPromptResponsePopup, descriptors);
			this.shadowRoot.appendChild(this.aiPromptResponsePopup);
			this.setPosition(this.aiPromptResponsePopup);
			await this.aiPromptResponsePopup.connectedCallback();
			await this.aiPromptResponsePopup.createSession("Image Processing & analysis", context);
		} else await this.aiPromptResponsePopup.showPopover();
		request && this.aiPromptResponsePopup.sendMessage(request, null);
	}

	extractText() {
		this.openPromptResponsePopup("Extract text");
	}

	identifyObject() {
		this.openPromptResponsePopup("Identify Object");
	}

	render() {
		return html`<svg class="download" viewBox="0 0 24 24" @click=${this.saveImage.bind(this)}>
				<title>${i18n("save_as_png")}</title>
				<path />
			</svg>

			<svg class="OCR" viewBox="0 0 24 24" @click=${this.extractText.bind(this)}>
				<title>${i18n("extract_text_from_images")}</title>
				<path />
			</svg>

			<svg class="object" viewBox="0 0 24 24" @click=${this.identifyObject.bind(this)}>
				<title>${i18n("identify_object")}</title>
				<path />
			</svg>

			<label>
				<input type="checkbox" name="toggle-image-edit" hidden />
				<svg class="img-edit" viewBox="0 0 24 24">
					<title>${i18n("edit_image")}</title>
					<path />
				</svg>
			</label>`;
	}

	connectedCallback() {
		this.setAttribute("popover", "");
		this.attachShadow({ mode: "open" });
		this.shadowRoot.adoptedStyleSheets = [selectionCss];
		this.shadowRoot.replaceChildren(this.render());
		this.shadowRoot.lastElementChild.addEventListener("change", this.appendEditTools, { once: true });
		this.showPopover();
	}

	appendEditTools({ target }) {
		const imgEditToolsPopup = document.createElement("img-edit-tools-popup");
		const descriptors = Object.getOwnPropertyDescriptors(ImageEditToolsPopup.prototype);
		Object.defineProperties(imgEditToolsPopup, descriptors);
		target.after(imgEditToolsPopup);
		imgEditToolsPopup["connectedCallback"]();
	}
}

customElements?.define("img-selection-popup", ImageSelectionPopup);

export class ImageEditToolsPopup extends HTMLElement {
	constructor() {
		super();
	}

	async previewImage() {
		const importUrl = chrome.runtime.getURL("scripts/popup-card/image-preview/image-preview.js");
		const { ImagePreviewBox } = await import(importUrl);
		const imgPreviewBox = document.createElement("image-preview-box");
		const descriptors = Object.getOwnPropertyDescriptors(ImagePreviewBox.prototype);
		Object.defineProperties(imgPreviewBox, descriptors);
		document.body.appendChild(imgPreviewBox);
		imgPreviewBox["connectedCallback"]();
	}

	editImage() {
		const prompts = [];
		const toolElems = this.children;
		if ($('input[type="checkbox"]', toolElems[0]).checked) prompts.push("Remove background");
		if ($('input[type="checkbox"]', toolElems[1]).checked) {
			const text = `Resize image to width=${$('input[name="width"]', toolElems[1]).value} & height=${$('input[name="height"]', toolElems[1]).value}`;
			prompts.push(text);
		}

		if ($('input[type="checkbox"]', toolElems[2]).checked) {
			const text = `Compress image to size=${$('input[type="number"]', toolElems[2]).value}`;
			prompts.push(text);
		}

		if ($('input[type="checkbox"]', toolElems[3]).checked) prompts.push("Remove text from this image");

		if ($('input[type="checkbox"]', toolElems[4]).checked) {
			const text = `Replace background with new background=${$('input[type="text"]', toolElems[4]).value}`;
			prompts.push(text);
		}

		if ($('input[type="checkbox"]', toolElems[5]).checked)
			prompts.push($('input[type="text"]', toolElems[4]).value);
		if (prompts.length === 0) return;

		const editPrompt = prompts.join(" and ");
		return alert("Coming Soon. Waiting for Imagen 3 Public API release");
		this.previewImage();
	}

	render() {
		return html`<li>
				<label>
					<input type="checkbox" name="toggle-tool" />
					<svg class="remove-background" viewBox="0 0 24 24">
						<path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" />
					</svg>
					<span>${i18n("remove_background")}</span>
				</label>
			</li>

			<li class="resize-img">
				<label>
					<input type="checkbox" name="toggle-tool" />
					<svg class="resize" viewBox="0 0 24 24">
						<path />
					</svg>
					<span>${i18n("resize")}</span>
				</label>
				<div class="input-box">
					<input type="number" name="width" />
					<span class="small">px</span>
					<span>X</span>
					<input type="number" name="height" />
					<span class="small">px</span>
				</div>
			</li>

			<li>
				<label>
					<input type="checkbox" name="toggle-tool" />
					<svg class="compress" viewBox="0 0 24 24">
						<path />
					</svg>
					<span>${i18n("compress")}</span>
				</label>
				<div class="input-box"> 
					<input type="number" name="size" />
					<span class="small">KB</span>
				</div>
			</li>

			<li>
				<label>
					<input type="checkbox" name="toggle-tool" />
					<svg class="remove-text" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke="currentColor" stroke-width="2" />
					</svg>
					<span>${i18n("remove_text")}</span>
				</label>
			</li>

			<li style="flex-wrap:wrap">
				<label>
					<input type="checkbox" name="toggle-tool" />
					<svg class="replace-background" viewBox="0 0 24 24">
						<path />
					</svg>
					<span>${i18n("replace_background")}</span>
				</label>
				<div class="input-box">
					<input type="text" name="background" placeholder="Describe new background" />
				</div>
			</li>

			<li style="flex-wrap:wrap">
				<label>
					<input type="checkbox" name="toggle-tool" />
					<svg class="prompt" viewBox="0 0 24 24">
						<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m5 7l5 5l-5 5m8 0h6"/>
					</svg>
					<span>${i18n("custom_prompt")}</span>
				</label>
				<div class="input-box">
					<input type="text" name="write-prompt" placeholder="Write prompt" />
				</div>
			</li>
			
			<button @click=${this.editImage.bind(this)}>${i18n("Edit_Image")}</button>`;
	}

	connectedCallback() {
		this.replaceChildren(this.render());
	}
}

customElements?.define("img-edit-tools-popup", ImageEditToolsPopup);
