import { EmbedContent, EmbedLink } from "../elements/embed.js";
import { FenceBlock } from "../elements/fence-block.js";
import { BlockIndent, LineBlock } from "../elements/line-block.js";
import { MathBlock } from "../elements/math-block.js";
import { StartMarker } from "../elements/start-marker.js";
import { TableGrid } from "../elements/table-grid.js";
import { TwinMarker } from "../elements/twin-marker.js";

export class CtmElemCreator {
	constructor() {}

	ctmElements = {
		"EMBED-LINK": this.createEmbedLink,
		"EMBED-CONTENT": this.createEmbedContent,
		"LINE-BLOCK": this.createLineBlock,
		"BLOCK-INDENT": this.createBlockIndent,
		"START-MARKER": this.createStartMarker,
		"TWIN-MARKER": this.createTwinMarker,
		"FENCE-BLOCK": this.createFenceBlock,
		"MATH-BLOCK": this.createMathBlock,
		"TABLE-GRID": this.createTableBlock,
	};

	createLineBlock(element) {
		const lineBlock = new LineBlock(false);
		return { ctmElem: lineBlock, childNodes: element.children };
	}

	createBlockIndent() {
		const blockIndent = new BlockIndent();
		return { ctmElem: blockIndent, childNodes: null };
	}

	createStartMarker(element) {
		const startMarker = new StartMarker(element.children[0].data, 0);
		return { ctmElem: startMarker, childNodes: null };
	}

	createTwinMarker(element) {
		if (this.twinMarker) {
			const twinMarker = new TwinMarker(element.children[0].data, this.twinMarker);
			twinMarker.setAttribute("right", "");
			const twinMarkerObj = { ctmElem: twinMarker, childNodes: null };
			this.twinMarker.twinMarker = twinMarker;
			this.twinMarker = null;
			return twinMarkerObj;
		}
		this.twinMarker = new TwinMarker(element.children[0].data, null);
		return { ctmElem: this.twinMarker, childNodes: null };
	}

	createEmbedLink(element) {
		const embedLink = new EmbedLink();
		return { ctmElem: embedLink, childNodes: null };
	}

	createEmbedContent(element) {
		const embedContent = new EmbedContent();
		return { ctmElem: embedContent, childNodes: element.children };
	}

	createTableBlock(element) {
		const tabGrid = new TableGrid();
		// @ts-ignore
		this.insertChildren(element.children, tabGrid.table);
		return { ctmElem: tabGrid, childNodes: null };
	}

	createFenceBlock(element) {
		const fencBlock = new FenceBlock(element.children[0].data);
		return { ctmElem: fencBlock, childNodes: null };
	}

	createMathBlock(element) {
		const mathBlock = new MathBlock(element.children[0].data);
		return { ctmElem: mathBlock, childNodes: null };
	}
}
