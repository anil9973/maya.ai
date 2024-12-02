import { emphasisSelected, insertElem, insertLinkImg, setCaretAt } from "./processor-helper.js";
import { Brackets, CtmTagName, MarkerTags, Markers, TwinMarkers } from "./enums.js";
import { LineBlock, TextSpan } from "../elements/line-block.js";
import { tagCompletion } from "../elements/tag-completion.js";
import { saveBlobInDb } from "../../db/file-db.js";
import { StartMarker } from "../elements/start-marker.js";
import { TwinMarker } from "../elements/twin-marker.js";
import { EmbedLink } from "../elements/embed.js";
import { NavHandler } from "./nav-handler.js";

export class InputProcessor extends NavHandler {
	constructor() {
		super();
	}

	/** @type {import("../parser/html-to-mdDom/HtmlToMdDom.js").HtmlDomParser} */
	static htmlDomParser;

	/**@returns {Promise<DocumentFragment>} */
	async parseHtmlToMarkDom(htmlData) {
		if (!InputProcessor.htmlDomParser) {
			const { HtmlDomParser } = await import("../parser/html-to-mdDom/HtmlToMdDom.js");
			InputProcessor.htmlDomParser = new HtmlDomParser();
		}
		return InputProcessor.htmlDomParser.parse(htmlData);
	}

	setHashTag(focusElem, event) {
		if (focusElem.tagName === CtmTagName.StartMarker) {
			const span = new TextSpan("#" + event.data);
			span.className = "hashtag";
			focusElem.replaceWith(span);
			event.preventDefault();
			return tagCompletion.show(span);
		}
		focusElem.className = "hashtag";
		tagCompletion.show(focusElem);
	}

	updateTwinMarker(char, selection) {
		Brackets[char]
			? selection.anchorOffset !== selection.focusOffset
				? emphasisSelected(selection.getRangeAt(0), char)
				: insertElem(new TwinMarker(char), false)
			: (selection.focusNode.parentElement.updateMark(char, selection.focusOffset),
				setCaretAt(selection.focusNode, selection.focusOffset + 1));
	}

	twinMarkerInput(char) {
		const selection = getSelection();
		const focusNode = selection.focusNode;
		const focusElem = focusNode.parentElement;
		if (focusElem instanceof TwinMarker) return this.updateTwinMarker(char, selection);
		if (char === "[" && focusElem instanceof StartMarker) return focusElem.updateMark("[ ]", selection.focusOffset);

		selection.anchorOffset !== selection.focusOffset
			? emphasisSelected(selection.getRangeAt(0), char)
			: insertElem(new TwinMarker(char), true);
	}

	markerInput(char) {
		const selection = getSelection();
		const focusNode = selection.focusNode;
		if (focusNode instanceof LineBlock) return insertElem(new StartMarker(char), true);
		if (focusNode.parentElement instanceof LineBlock) {
			if (selection.focusOffset === 0 && !focusNode.previousSibling) insertElem(new StartMarker(char), true);
			else focusNode["after"](new TextSpan(char));
		} else {
			const focusElem = focusNode.parentElement;
			focusElem instanceof StartMarker
				? focusElem.updateMark(char, selection.focusOffset)
				: focusElem.after(new TextSpan(char));
		}
	}

	charInput(event) {
		const char = event.data;
		const isMarker = Markers.has(char);
		if (isMarker) {
			TwinMarkers.has(char) ? this.twinMarkerInput(char) : this.markerInput(char);
			return event.preventDefault();
		}
		if (char === "!") return insertElem(new EmbedLink(), true), event.preventDefault();

		const focusNode = getSelection().focusNode;
		const focusElem = focusNode.parentElement;
		if (char === " " && char === "#" && focusElem.className === "hashtag" && focusNode.nodeValue !== "#")
			return focusElem.after(new TextSpan(char)), tagCompletion.addTag(focusNode["data"]);
		if (char !== " " && focusNode["data"] === "#") return this.setHashTag(focusElem, event);
		if (MarkerTags.has(focusElem.tagName)) {
			if (char === " " && focusElem instanceof StartMarker)
				return focusElem.updateMark(char, getSelection().focusOffset), focusElem.updateClass();
			if (char === "^" && focusNode.nodeValue.endsWith("[")) return focusElem["updateMark"](char, 2);
			if (char === ":" && focusNode.nodeValue.endsWith("]")) return;
			focusElem.after(new TextSpan(char));
			focusElem["updateClass"]();
			return event.preventDefault();
		}
		if (focusElem.className === "hashtag") tagCompletion.filterList(char);
	}

	deleteChar() {
		const selection = getSelection();
		const focusElem = selection.focusNode.parentElement;
		MarkerTags.has(focusElem.tagName) && focusElem["updateMark"](null, selection.focusOffset);
	}

	/**@param {InputEvent} event*/
	inputTxtHandler = (event) => {
		if (this.insidePreBlock) return;
		event.data ? this.charInput(event) : this.deleteChar();
	};

	async insertMarkdownContent(contentFrag) {
		try {
			const selection = getSelection(),
				focusNode = selection.focusNode,
				focusElem = focusNode instanceof HTMLElement ? focusNode : focusNode.parentElement,
				firstLine = contentFrag.firstElementChild,
				lastLine = contentFrag.lastElementChild;
			if (!focusElem.closest("writing-pad")) selection.setPosition($("writing-pad").lastElementChild, 0);
			if (MarkerTags.has(focusElem.tagName)) focusElem.after(...firstLine.childNodes);
			else if (focusNode instanceof Text) {
				const nwTxtNode = focusNode.splitText(selection.focusOffset);
				nwTxtNode.before(...firstLine.childNodes);
				selection.setPosition(nwTxtNode);
			} else focusElem.append(...firstLine.childNodes);
			firstLine.remove();
			if (contentFrag.childElementCount === 0) return;
			this.activeLine ??= focusElem.closest("line-block");
			this.activeLine.after(contentFrag);
			lastLine.nextElementSibling || this.insertBlankLine(lastLine);
			selection.setPosition(lastLine.nextElementSibling, 0);
		} catch (error) {
			console.error(error);
		}
	}

	dropPasteHandler = (event) => {
		const pasteInfo = event.dataTransfer;
		const types = new Set(pasteInfo.types);
		if (this.insidePreBlock) {
			document.execCommand("insertText", true, pasteInfo.getData("text/plain"));
			return event.preventDefault();
		}
		if (types.has("text/uri-list") || types.has("Files")) {
			let imgUrl = pasteInfo.getData("text/uri-list");
			let filename;
			if (!imgUrl.startsWith("http")) {
				const imgFile = pasteInfo.files[0];
				if (imgFile.type.startsWith("image/")) {
					imgUrl = URL.createObjectURL(imgFile);
					const blobId = imgUrl.slice(-36);
					saveBlobInDb(imgFile, blobId);
					filename = imgFile.name;
				}
			} else filename = imgUrl.slice(imgUrl.lastIndexOf("/") + 1);

			const linkFrag = insertLinkImg(imgUrl, filename, true);
			this.activeLine.appendChild(linkFrag);
			this.activeLine.nextElementSibling || this.insertBlankLine(this.activeLine);
			event.preventDefault();
		} else if (types.has("text/html")) {
			this.parseHtmlToMarkDom(pasteInfo.getData("text/html"))
				.then((contentFrag) => this.insertMarkdownContent(contentFrag))
				.catch((err) => console.error(err));
			event.preventDefault();
		} else {
			const pasteData = pasteInfo.getData("text/plain");
			const focusElem = getSelection().focusNode.parentElement;
			if (MarkerTags.has(focusElem.tagName))
				return focusElem.after(new TextSpan(pasteData)), event.preventDefault();
			if (pasteData.startsWith("http") && !pasteData.includes(" ")) {
				const linkFrag = insertLinkImg(pasteData);
				this.activeLine.appendChild(linkFrag);
				event.preventDefault();
			}
		}
	};

	deleteContentBackward = (event) => {
		if (this.insidePreBlock) return;
		const selection = getSelection();
		if (selection.focusOffset !== 0) return this.inputTxtHandler(event);

		const focusNode = selection.focusNode;
		if (focusNode["tagName"] === "WRITING-PAD") return event.preventDefault();
		if (focusNode["tagName"] === CtmTagName.LineBlock) {
			if (!this.activeLine.previousElementSibling) return event.preventDefault();
			// @ts-ignore
			this.activeLine = this.activeLine.previousElementSibling;
			this.activeLine.active = true;
			focusNode["remove"]();
			return event.preventDefault();
		}
		//biome-ignore format:
		if (focusNode.parentElement["tagName"] !== CtmTagName.LineBlock && focusNode.parentElement["tagName"] !== CtmTagName.StartMarker) return;
		if (!focusNode.previousSibling) {
			this.activeLine.querySelector("start-marker")?.remove();
			this.activeLine.previousElementSibling.append(...this.activeLine.childNodes);
			// @ts-ignore
			this.activeLine = this.activeLine.previousElementSibling;
			this.activeLine.active = true;
		}
	};

	handleInputByType = {
		insertText: this.inputTxtHandler,
		deleteContentBackward: this.deleteContentBackward,
		deleteContentForward: this.inputTxtHandler,
		insertParagraph: (event) => {
			if (this.insidePreBlock) return;
			this.createNewLine();
			return event.preventDefault();
		},
		insertFromPaste: this.dropPasteHandler,
		insertFromDrop: this.dropPasteHandler,
	};
}
