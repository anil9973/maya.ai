import { html } from "../../../../../collections/js/om.compact.js";
import { injectScript } from "../../../../../popup/js/actions.js";

export class AttachmentPlusBox extends HTMLElement {
	constructor() {
		super();
	}

	imageContents = [];
	textContents = [];

	/** @param {FileSystemFileHandle[]} fileHandles*/
	async readFiles(fileHandles) {
		fileHandles.forEach(async (fileHandle) => {
			const file = await fileHandle.getFile();
			const reader = new FileReader();
			if (file.type.startsWith("image")) {
				reader.onload = async (evt) => this.imageContents.push(`\nImage souce URl:${evt.target.result}\n`);
				reader.readAsDataURL(file);
			} else {
				reader.onload = async (evt) => {
					const content = evt.target.result;
					this.textContents.push(`\n===${file.type}===\n${content}\n===${file.type}===\n`);
				};
				reader.readAsText(file);
			}
		});
	}

	async pickFiles() {
		try {
			//biome-ignore format:
			const types = [{ description: "Text/Img file", accept: { "text/*": [".txt", ".md", ".html", , ".csv"], "image/*": [".png", ".jpeg", ".jpg", ".webp", ".svg", ".avif"] } }];
			/**@type {FileSystemFileHandle[]}*/
			// @ts-ignore
			const fileHandles = await showOpenFilePicker({ multiple: true, startIn: "documents", types });
			fileHandles.length === 0 || this.readFiles(fileHandles);
		} catch (error) {
			if (navigator["brave"] && error.message === "showDirectoryPicker is not defined") {
				toast(i18n("enable_file_access_api"));
				await new Promise((r) => setTimeout(r, 2000));
				return chrome.tabs.create({ url: "brave://flags/#file-system-access-api" });
			}
			console.warn(error.message);
		}
	}

	async captureScreenshot() {
		await injectScript("scripts/screenshot/cropper.js");
	}

	async selectAnything() {
		await injectScript("scripts/selector/select-element.js");
	}

	render() {
		const attachmentOptions = [
			{
				id: "upload_file",
				icon: "attachment-plus",
				title: i18n("upload_file"),
				shortcutKey: "Alt+A",
				func: this.pickFiles,
			},
			{
				id: "capture_screenshot",
				icon: "screenshot",
				title: i18n("screenshot"),
				shortcutKey: "Alt+S",
				func: this.captureScreenshot,
			},
			{
				id: "capture_element",
				icon: "capture",
				title: i18n("select_anything"),
				shortcutKey: "Alt+S",
				func: this.selectAnything,
			},
		];
		const option = (attach) =>
			html`<li @click=${attach.func.bind(this)}> <atom-icon ico="${attach.icon}"></atom-icon> <span>${attach.title}</span></li>`;
		return html`<atom-icon ico="attachment-plus"></atom-icon>
        <menu> ${attachmentOptions.map(option)}</menu>`;
	}

	connectedCallback() {
		this.tabIndex = 0;
		this.replaceChildren(this.render());
	}
}

customElements.define("attachment-plus-box", AttachmentPlusBox);
