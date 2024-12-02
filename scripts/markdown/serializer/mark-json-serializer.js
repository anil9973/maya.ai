import { Element, Text } from "./element.js";
import { trimLeft } from "./util.js";
import {
	BlockClassMarker,
	BlockMarkerClass,
	CtmTagName,
	InlineClassMark,
	BlockElemTags,
	InlineElemTags,
	IgnoreByTag,
	InlineMarkerClass,
} from "./enums.js";

/** @description serialize html dom elements to json for save in indexdb */
export class MarkJsonSerializer {
	constructor() {}

	/**@param {NodeList} elements  */
	serialize(elements) {
		this.root = { type: "root", children: [] };
		this.insertChildElements(elements, null, null);
		return this.root.children;
	}

	/**@param {NodeList} elements, @param {Element} parentElem*/
	insertChildElements(elements, parentElem, nestInfo) {
		for (const element of elements) {
			const tagName = element["tagName"];
			if (IgnoreByTag.has(tagName)) continue;

			if (BlockElemTags.has(tagName)) this.insertBlockElement(element, nestInfo);
			else if (this.scopeBlockElems[tagName]) this.scopeBlockElems[tagName](element);
			else {
				if (element.nodeType === 3) {
					if (!element["data"].trimStart()) continue;
					const textData = trimLeft(element["data"]);
					textData && this.insertText(textData, (parentElem ??= this.insertLine()));
					continue;
				}
				parentElem ??= this.insertLine();
				if (InlineElemTags.has(tagName)) this.insertInlineElement(element, parentElem);
				else if (tagName === "A" || tagName === "IMG") this.insertLinkorImg(element, parentElem, tagName === "IMG");
				else if (tagName?.includes("-")) this.insertCtmElement(element, parentElem, nestInfo);
				else this.insertInlineElement(element, parentElem);
			}
		}
	}

	insertLine() {
		const lineBlock = new Element(CtmTagName.LineBlock);
		this.root.children.push(lineBlock);
		this.openLine = lineBlock;
		return lineBlock;
	}

	insertStartMarker(element, nestInfo) {
		if (nestInfo?.nestLevel) {
			for (let index = 0; index < nestInfo.nestLevel; index++) {
				const blockIndent = new Element(CtmTagName.BlockIndent);
				this.openLine.children.push(blockIndent);
			}
		}
		//insert fold-toggler
		/* if (nestInfo?.foldToggler) {
			const foldToggler = new Element(CtmTagName.FoldToggler);
			this.openLine.children.push(foldToggler);
		} */

		const Class = nestInfo?.Class ?? BlockMarkerClass[element.tagName];
		const startMarker = new Element(CtmTagName.StartMarker, { class: Class });
		const mark = Class !== "counter" ? BlockClassMarker[Class] : element["value"] + ". ";
		startMarker.children.push(new Text(mark));
		this.openLine.children.push(startMarker);
	}

	/**@param {HTMLElement} element */
	insertMarkerBlockElem(element, nestInfo) {
		this.insertLine();
		if (element.tagName === "LI") {
			/* const firstElemTag = element.firstElementChild?.tagName;
			nestInfo.foldToggler = firstElemTag === "OL" || firstElemTag === "UL"; */
			element["value"] = (element.previousElementSibling?.["value"] ?? 0) + 1;
		}
		this.insertStartMarker(element, nestInfo);
		const blockElem = new Element("SPAN");
		this.openLine.children.push(blockElem);
		this.insertChildElements(element.childNodes, blockElem, nestInfo);
	}

	/**@param {HTMLElement} element */
	inserlistItem(element, nestInfo) {
		this.insertLine();
		const Class = element.tagName === "OL" ? "counter" : element.tagName === "UL" && "list";
		if (nestInfo) {
			nestInfo.nestLevel ? ++nestInfo.nestLevel : (nestInfo.nestLevel = 1);
			nestInfo.Class = Class;
		} else nestInfo = { Class };
		this.insertChildElements(element.childNodes, this.openLine, nestInfo);
	}

	/**@param {HTMLElement} element */
	insertBlockElement(element, nestInfo) {
		if (BlockMarkerClass[element.tagName]) this.insertMarkerBlockElem(element, nestInfo);
		else if (element.tagName === "OL" || element.tagName === "UL") this.inserlistItem(element, nestInfo);
		else this.insertChildElements(element.childNodes, null);
	}

	/**@param {HTMLElement} element */
	insertInlineElement(element, parentElem) {
		if (InlineMarkerClass[element.tagName]) {
			const Class = InlineMarkerClass[element.tagName];
			//left-marker
			const leftmarker = new Element(CtmTagName.TwinMarker, { class: Class });
			const mark = InlineClassMark[Class];
			leftmarker.children.push(new Text(mark));

			//inline-marker
			const inlineElem = new Element("SPAN");
			this.insertChildElements(element.childNodes, inlineElem);

			//right-marker
			const rightmarker = new Element(CtmTagName.TwinMarker);
			rightmarker.children.push(new Text(mark));
			parentElem.children.push(leftmarker, inlineElem, rightmarker);
		} else this.insertChildElements(element.childNodes, parentElem);
	}

	/**@param {string} text, @param {Element} parentElem*/
	insertText(text, parentElem) {
		const textNode = new Text(text);
		parentElem.children.push(textNode);
	}

	/**@param {HTMLElement} element, @param {Element} parentElem*/
	insertCtmElement(element, parentElem, nestInfo) {
		const styleMap = element["computedStyleMap"]();
		const display = styleMap.get("display")?.toString();
		display
			? display.startsWith("inline")
				? this.insertInlineElement(element, parentElem)
				: this.insertBlockElement(element, nestInfo)
			: this.insertInlineElement(element, parentElem);
	}

	/**@param {HTMLElement} element, @param {Element} parentElem*/
	insertLinkorImg(element, parentElem, isImg) {
		parentElem ??= this.insertLine();

		if (isImg) {
			const embedlink = new Element(CtmTagName.EmbedLink);
			embedlink.children.push(new Text("!"));
			parentElem.children.push(embedlink);
		} else if (element.hasAttribute("href")) {
			if (element.getAttribute("href").startsWith("#"))
				return this.insertChildElements(element.childNodes, parentElem, null);
		} else return this.insertChildElements(element.childNodes, parentElem, null);

		//open square bracket
		const openSqrBracket = new Element(CtmTagName.TwinMarker, { class: "link-title" });
		openSqrBracket.children.push(new Text("["));

		const altSpan = new Element("span");
		const text = isImg ? (element.getAttribute("alt") ?? new Date().toISOString()) : element.textContent;
		this.insertText(text, altSpan);

		const closeSqrBracket = new Element(CtmTagName.TwinMarker);
		closeSqrBracket.children.push(new Text("]"));

		const openBracket = new Element(CtmTagName.TwinMarker, { class: "link-url" });
		openBracket.children.push(new Text("("));

		//link-url
		const url = isImg ? element["currentSrc"] || element["src"] : element["href"];
		const linkUrl = new Element("SPAN");
		linkUrl.children.push(new Text(url));

		const closeBracket = new Element(CtmTagName.TwinMarker);
		closeBracket.children.push(new Text(")"));

		parentElem.children.push(openSqrBracket, altSpan, closeSqrBracket, openBracket, linkUrl, closeBracket);
	}

	scopeBlockElems = {
		PRE: (element) => {
			const blockElem = new Element("FENCE-BLOCK");
			blockElem.children.push(new Text(element["innerText"]));
			this.root.children.push(blockElem);
		},
		math: (element) => {
			const blockElem = new Element("MATH-BLOCK");
			const annotation = element.querySelector("annotation");
			const textContent = annotation ? `\n$$\n${annotation.textContent}\n$$\n` : element.outerHTML;
			blockElem.children.push(new Text(textContent));
			this.root.children.push(blockElem);
		},

		TABLE: (/** @type {HTMLTableElement} */ tableElem) => {
			const tableBlock = new Element("TABLE-GRID");
			/**@param {HTMLTableRowElement} rowElem*/
			const generateRow = (rowElem) => {
				const row = new Element("TR");
				for (const cellElem of rowElem.cells) {
					const cell = new Element("TD");
					this.insertChildElements(cellElem.childNodes, cell);
					row.children.push(cell);
				}
				tableBlock.children.push(row);
			};
			for (const rowElem of tableElem.rows) generateRow(rowElem);
			this.root.children.push(tableBlock);
		},
	};
}
