import { escapeRx } from "../../../popup/js/constant.js";
import { getCrtTab } from "../../../popup/js/extractor.js";

export async function getFileHandle() {
	try {
		const tab = await getCrtTab();
		const fileName = tab.title.replaceAll(" ", "-").replaceAll(escapeRx, "").slice(0, 100);
		const types = [{ description: "Markdown", accept: { "text/*": [".md"] } }];
		// @ts-ignore
		return await showSaveFilePicker({ startIn: "documents", suggestedName: fileName + ".md", types });
	} catch (error) {
		console.error(error);
	}
}
