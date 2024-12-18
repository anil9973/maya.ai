import { AtomIcon } from "../../../../collections/components/helper/atom-icon.js";
import { escapeRx } from "../../../../popup/js/constant.js";
import { getCrtTab } from "../../../../popup/js/extractor.js";

export class ResponseActionBar extends HTMLElement {
	constructor() {
		super();
	}

	runAutoCommands(autoCommands) {
		for (const command of autoCommands) this[command]?.();
	}

	/** @type {import("../../../../scripts/markdown/serializer/mark-txt-serializer.js").MarkTextSerializer}*/
	static markTxtSerializer;

	/** @type {import("../../../../scripts/markdown/serializer/mark-json-serializer.js").MarkJsonSerializer} */
	static markJsonSerializer;

	openFirstLink() {
		const linkUrl = $("a", this.previousElementSibling)?.href;
		linkUrl && chrome.tabs.create({ url: linkUrl });
	}

	openAllLink() {
		const linkUrls = this.previousElementSibling.querySelectorAll("a");
		if (linkUrls.length !== 0) for (const aElem of linkUrls) chrome.tabs.create({ url: aElem.href });
	}

	replaceSelectText() {
		const textContent = this.previousElementSibling.textContent;
		document.execCommand("insertText", null, textContent);
	}

	async exportTableAsCSV() {
		const table = this.previousElementSibling.querySelector("table");
		if (!table) return toast("No table found", "error");
		const { TableToCSVConverter } = await import("../../js/csv.js");
		const tableToCSVConveter = new TableToCSVConverter();
		const csvText = tableToCSVConveter.convert(table);

		const blob = new Blob([csvText], { type: "text/csv" });
		const a = document.createElement("a");
		a.href = URL.createObjectURL(blob);
		a.download = Date.now() + ".csv";
		a.click();
		setTimeout(() => URL.revokeObjectURL(a.href), 3000);
	}

	async getMarkJsonContents() {
		if (!ResponseActionBar.markJsonSerializer) {
			const url = "../../../../scripts/markdown/serializer/mark-json-serializer.js";
			const { MarkJsonSerializer } = await import(url);
			ResponseActionBar.markJsonSerializer = new MarkJsonSerializer();
		}

		try {
			// @ts-ignore
			return ResponseActionBar.markJsonSerializer.serialize(this.previousElementSibling.children);
		} catch (error) {
			console.error(error);
		}
	}

	async getMarkTextContent() {
		if (!ResponseActionBar.markTxtSerializer) {
			const { MarkTextSerializer } = await import("../../../../scripts/markdown/serializer/mark-txt-serializer.js");
			ResponseActionBar.markTxtSerializer = new MarkTextSerializer();
		}
		// @ts-ignore
		return ResponseActionBar.markTxtSerializer.serialize(this.previousElementSibling.children);
	}

	async copy() {
		const mdTxtContent = await this.getMarkTextContent();
		navigator.clipboard
			.writeText(mdTxtContent)
			.then(() => toast(i18n("message_copied")))
			.catch((err) => alert(err.message));
	}

	async download() {
		const tab = await getCrtTab();
		const mdTxtContent = await this.getMarkTextContent();
		const fileBlob = new Blob([mdTxtContent], { type: "text/markdown" });
		const filename = tab.title.replaceAll(" ", "-").replaceAll(escapeRx, "").slice(0, 100) + ".md";
		const a = document.createElement("a");
		const blobUrl = URL.createObjectURL(fileBlob);
		a.setAttribute("href", blobUrl);
		a.setAttribute("download", filename);
		a.click();
		setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
	}

	readAloud() {
		const textContent = this.previousElementSibling["innerText"];
		chrome.tts.speak(textContent, { lang: navigator.language, enqueue: true });
	}

	render() {
		return [new AtomIcon("download"), new AtomIcon("copy"), new AtomIcon("read-aloud")];
	}

	connectedCallback() {
		this.replaceChildren(...this.render());
		$on(this.firstElementChild, "click", this.download.bind(this));
		$on(this.children[1], "click", this.copy.bind(this));
		$on(this.lastElementChild, "click", this.readAloud.bind(this));
	}
}

customElements.define("response-action-bar", ResponseActionBar);
