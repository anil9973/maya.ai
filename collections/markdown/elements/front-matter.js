import { SPACE } from "../live-processor/enums.js";
import { BlockMarker } from "./fence-block.js";
import { setCaretAt } from "./line-block.js";

export class FrontMatter extends HTMLElement {
	constructor(properties) {
		super();
		this.properties = properties;
	}

	render() {
		const startBlockMarker = new BlockMarker("---");
		const endBlockMarker = new BlockMarker("---");
		startBlockMarker.blockMarker = endBlockMarker;
		this.appendChild(startBlockMarker);
		this.properties.forEach((value, key) => this.appendChild(new MetaDataProperty(value, key)));
		this.appendChild(endBlockMarker);
	}

	async connectedCallback() {
		this.properties ??= await getFrontMatter();
		this.render();
		setCaretAt(this.children[1], 1);
	}
}

customElements.define("frontmatter-block", FrontMatter);

export class MetaDataProperty extends HTMLElement {
	constructor(value, key) {
		super();
		this.value = value ?? SPACE;
		this.key = key ?? SPACE;
	}

	render() {
		return `<span class="property-key">${this.key}</span>: <span class="property-value">${this.value}</span>`;
	}

	connectedCallback() {
		this.innerHTML = this.render();
	}
}

customElements.define("metadata-property", MetaDataProperty);

async function getFrontMatter() {
	const { frontMatter } = await chrome.storage.sync.get("frontMatter");
	const properties = new Map();
	const [tab] = await chrome.tabs.query({ currentWindow: true, active: true });
	const host = tab.url && new URL(tab.url).host;

	frontMatter["createdAt"] && properties.set("createdAt", getFormatedDate(frontMatter.createdAt));
	frontMatter["title"] && properties.set("title", tab.title ?? SPACE);
	frontMatter["tags"] && properties.set("tags", "[]");
	frontMatter["source"] && properties.set("source", tab.url ?? SPACE);
	frontMatter["author"] && properties.set("author", SPACE);
	if (frontMatter["domain"] && host)
		properties.set("domain", properties.get("domain") === "reverse" ? getReverseDomain(host) : host);
	properties.size === 0 && properties.set(SPACE, SPACE);
	return properties;
}

function getFormatedDate(formatInfo) {
	if (formatInfo === "yyyy-mm-dd") return new Date().toISOString().slice(0, 10);
	formatInfo = formatInfo ? JSON.parse(formatInfo) : { dateStyle: "medium", timeStyle: "short" };
	return new Date().toLocaleString("default", formatInfo);
}
const getReverseDomain = (host) => host.split(".").reverse().join(".");
