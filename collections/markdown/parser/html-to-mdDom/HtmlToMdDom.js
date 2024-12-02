import { LineBlock, BlockIndent } from "../../elements/line-block.js";
import { StartMarker } from "../../elements/start-marker.js";
import { FenceBlock } from "../../elements/fence-block.js";
import { TwinMarker } from "../../elements/twin-marker.js";
import { MathBlock } from "../../elements/math-block.js";
import { TableGrid } from "../../elements/table-grid.js";
import { EmbedLink } from "../../elements/embed.js";
import {
	BlockElemTags,
	BlockMarkerClass,
	BlockTagMarker,
	BlockspaceElemTags,
	IgnoreTags,
	InlineClassMark,
	InlineElemTags,
	inlineMarkerClass,
} from "./enums.js";
import Tokenizer from "./tokenizer.js";

/**@description Convert serialized html string to markdown dom element */
export class HtmlDomParser {
	constructor() {
		this.tokenizer = new Tokenizer();
		this.setListener();
	}

	/**@public @param {string} buffer, @returns {Promise<DocumentFragment>}*/
	parse(buffer) {
		this.docFrag = new DocumentFragment();
		/** @type {HTMLElement[]}*/
		this.elemStack = [];
		/**@type {{index: number; Class: string; }[]} */
		this.nestBlockStack = [];
		queueMicrotask(() => this.tokenizer.consume(buffer));
		return new Promise((resolve, reject) => {
			this.tokenizer.on("finish", () => resolve(this.docFrag));
			this.tokenizer.on("error", reject);
		});
	}

	/** @param {string} tagName */
	openNewElement(tagName) {
		if (IgnoreTags.has(tagName)) return;
		if (BlockElemTags.has(tagName)) {
			if (tagName !== "ul" && tagName !== "ol") {
				this.openLine = new LineBlock();
				this.docFrag.appendChild(this.openLine);
			}
			return this.insertBlockElement(tagName);
		}

		if (!this.openElem) {
			this.openLine = new LineBlock();
			this.openElem = this.openLine;
			this.docFrag.appendChild(this.openLine);
		}

		if (InlineElemTags.has(tagName)) return this.insertInlineElement(tagName);
		if (this.elements[tagName]) return this.elements[tagName](tagName);
		if (BlockspaceElemTags.has(tagName)) return this.insertElement(tagName);
	}

	elements = {
		a: () => {},
		img: () => {},
		table: this.insertTableBlock.bind(this),
		pre: this.insertFenceBlock.bind(this),
		math: this.insertMathBlock.bind(this),
	};

	/** @param {string} tagName */
	insertBlockElement(tagName) {
		if (BlockMarkerClass[tagName]) this.insertMarkerBlockElem(tagName);
		else if (tagName === "ol" || tagName === "ul") this.insertListItem(tagName);
		else this.openElem = this.openLine;
	}

	/** @param {string} tagName */
	insertMarkerBlockElem(tagName) {
		tagName === "li" && this.nestBlockStack.at(-1).index++;
		this.insertStartMarker(tagName);
		const blockElem = document.createElement("span");
		this.openLine.append(blockElem);
		this.elemStack.push(blockElem);
		this.openElem = blockElem;
	}

	/** @param {string} tagName */
	insertListItem(tagName) {
		const Class = tagName === "ol" ? "counter" : tagName === "ul" && "list";
		this.nestBlockStack.push({ Class, index: 0 });
	}

	/** @param {string} tagName */
	insertStartMarker(tagName) {
		if (this.nestBlockStack.length > 1) {
			for (let index = 0; index < this.nestBlockStack.length - 1; index++) {
				const blockIndent = new BlockIndent();
				this.openLine.append(blockIndent);
			}
		}
		//prettier-ignore
		const mark =
			this.nestBlockStack.at(-1)?.Class === "counter"
				? this.nestBlockStack.at(-1).index + ". "
				: BlockTagMarker[tagName];
		const startMarker = new StartMarker(mark);
		this.openLine.append(startMarker);
		return startMarker;
	}

	/** @param {string} tagName */
	insertInlineElement(tagName) {
		if (inlineMarkerClass[tagName]) {
			const Class = inlineMarkerClass[tagName];
			//marker
			const marker = InlineClassMark[Class];
			const leftMarker = new TwinMarker(marker, null);
			const rightMarker = new TwinMarker(marker, leftMarker);
			rightMarker.setAttribute("right", ""); //TEMP

			//inline-marker
			const inlineElem = document.createElement("span");
			this.elemStack.push(inlineElem);
			(this.openElem ?? this.openLine).append(leftMarker, inlineElem, rightMarker);
			this.openElem = inlineElem;

			leftMarker.twinMarker = rightMarker;
		} else this.openElem = this.openLine;
	}

	insertElement(tagName) {
		const domElem = document.createElement(tagName);
		this.openElem.append(domElem);
		this.elemStack.push(domElem);
		this.openElem = domElem;
	}

	setAttrName(name) {
		this.attrName = name.slice(0, -1);
	}

	setAttrValue(value) {
		if (this.attrName === "href") return this.insertALinkImg(value);
		if (this.attrName === "src") return this.insertALinkImg(value, true);
		if (this.attrName === "alt") return (this.openElem.textContent = value);
		if (this.attrName === "type" && value === "checkbox")
			return this.openLine.firstElementChild["updateMark"]?.("[ ] ", 2);
	}

	addTextNode(text) {
		//if (!text.trim()) return; Improve later
		text = text.replaceAll(/[\n\t]/g, "");
		if (!text) return;
		(this.openElem ?? this.openLine).appendChild(new Text(text));
	}

	closeCrtElement() {
		this.elemStack.pop();
		this.openElem = this.elemStack.at(-1) ?? this.openLine;
	}

	/** @param {string} linkUrl */
	insertALinkImg(linkUrl, isImg) {
		isImg && this.openElem.append(new EmbedLink());
		// if (element.attributes.href.includes("#")) return

		//open square bracket
		const openSqrBracket = new TwinMarker("[", null);
		const closeSqrBracket = new TwinMarker("]", openSqrBracket);

		const altSpan = document.createElement("span");
		isImg && (altSpan.textContent = linkUrl);

		const openParenthesis = new TwinMarker("(", null);
		const urlElem = document.createElement("span");
		urlElem.textContent = linkUrl;
		const closeParenthesis = new TwinMarker(")", openParenthesis);

		this.openElem.append(openSqrBracket, altSpan, closeSqrBracket, openParenthesis, urlElem, closeParenthesis);
		openSqrBracket.twinMarker = closeSqrBracket;
		openParenthesis.twinMarker = closeParenthesis;

		this.elemStack.push(altSpan);
		this.openElem = altSpan;
	}

	insertTableBlock() {
		const tabGrid = new TableGrid();
		this.openLine ? this.openLine.before(tabGrid) : this.docFrag.appendChild(tabGrid);
		this.openElem = tabGrid.table;
		this.elemStack.push(this.openElem);
	}

	insertFenceBlock() {
		const fenceBlock = new FenceBlock();
		this.openLine ? this.openLine.before(fenceBlock) : this.docFrag.appendChild(fenceBlock);
		this.elemStack.push(fenceBlock.pre);
		this.openElem = fenceBlock.pre;
	}

	insertMathBlock() {
		const fenceBlock = new MathBlock();
		this.openLine ? this.openLine.before(fenceBlock) : this.docFrag.appendChild(fenceBlock);
		this.elemStack.push(fenceBlock.pre);
		this.openElem = fenceBlock.pre;
	}

	setListener() {
		this.tokenizer.on("openelem", this.openNewElement.bind(this));
		this.tokenizer.on("attrname", this.setAttrName.bind(this));
		this.tokenizer.on("attrvalue", this.setAttrValue.bind(this));
		this.tokenizer.on("text", this.addTextNode.bind(this));
		this.tokenizer.on("selfcloseelem", this.closeCrtElement.bind(this));
		this.tokenizer.on("closeelem", this.closeCrtElement.bind(this));
	}
}
