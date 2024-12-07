import { deleteBlocksInDb } from "../../db/block-db.js";
import { MarkWriterPad } from "../../markdown/mark-writer-pad.js";
import { ActionSnackbar } from "../helper/action-snackbar.js";
import { AtomIcon } from "../helper/atom-icon.js";
import { BlockLabels } from "./block-labels.js";

export class NotepadCard extends HTMLElement {
	constructor(note) {
		super();
		this.note = note;
	}

	async viewNote() {
		const { NotepadDialog } = await import("../misc/notepad-dialog.js");
		const notePad = new NotepadDialog(this.note);
		document.body.appendChild(notePad);
	}

	async deleteNote() {
		const deleteId = setTimeout(() => deleteBlocksInDb([this.note.id]).then(() => this.remove()), 5000);
		try {
			const snackElem = new ActionSnackbar();
			document.body.appendChild(snackElem);
			await snackElem.show(deleteId);
			this.hidden = true;
		} catch (error) {
			this.hidden = false;
		}
	}

	async insertCollectionContent() {}

	render() {
		const note = this.note.note;
		const collectionBar = document.createElement("header");
		const collectionTitle = document.createElement("input");
		collectionTitle.placeholder = i18n("Untitled_collection");
		collectionTitle.value = this.note?.note.title || "";

		this.deleteBtn = new AtomIcon("delete");
		this.deleteBtn.title = i18n("toggle_edit_mode");
		this.deleteBtn.setAttribute("toggle", "");
		$on(this.deleteBtn, "change", this.deleteNote.bind(this));
		collectionBar.append(collectionTitle, this.deleteBtn);

		const thumbnail = new Image();
		note.thumbnail && (thumbnail.src = note.thumbnail);
		$on(thumbnail, "error", () => thumbnail.remove());

		const noteContent = note.content?.slice(0, 10);
		this.writingPad = new MarkWriterPad(noteContent);
		$on(this.writingPad, "click", this.viewNote.bind(this));
		this.replaceChildren(thumbnail, collectionBar, this.writingPad, new BlockLabels(note.labels));
	}

	connectedCallback() {
		this.render();
		this.insertCollectionContent();
	}
}

customElements.define("note-pad", NotepadCard);
