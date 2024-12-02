import { deleteBlocksInDb, updateBlockInDb } from "../../db/block-db.js";
import { WritingPad } from "../../markdown/writing-pad.js";
import { AtomIcon } from "../helper/atom-icon.js";
import { html } from "../../js/om.compact.js";
// @ts-ignore
import notepadCss from "../../style/notepad-dialog.css" with { type: "css" };
document.adoptedStyleSheets.push(notepadCss);

export class NotepadDialog extends HTMLDialogElement {
	constructor(note) {
		super();
		this.note = note;
	}

	static markJsonSerializer;

	render() {
		return html`<header>
			<input type="text" placeholder="Untitled note" .value=${() => this.note.note?.title} />
		</header>`;
	}

	connectedCallback() {
		this.id = "notepad-dialog";
		this.writingPad = new WritingPad(this.note.note.content);
		this.replaceChildren(this.render(), this.writingPad);
		this.firstElementChild.append(new AtomIcon("close-circle"));
		this.firstElementChild.lastElementChild["title"] = i18n("save_and_close_note");
		//
		this.showModal();
		$on(this, "close", () => this.onNoteClose());
		$on(this.firstElementChild.lastElementChild, "click", this.onNoteClose.bind(this));
	}

	onNoteClose() {
		const textContent = this.writingPad.innerText;
		if (!textContent && !this.note.title) {
			const noteId = [this.note.note.id];
			deleteBlocksInDb(noteId);
			//TODO removeNotes(noteId);
			return this.remove();
		}

		this.saveNote();
		this.hidden = true;
		this.className === "new" && fireEvent(this, "newnote");
	}

	async saveNote() {
		if (!NotepadDialog.markJsonSerializer) {
			const { MarkJsonSerializer } = await import("../../../scripts/markdown/serializer/mark-json-serializer.js");
			NotepadDialog.markJsonSerializer = new MarkJsonSerializer();
		}
		try {
			const note = Object.assign({}, this.note);
			this.note.ctmCss && (note.ctmCss = Object.assign({}, this.note.ctmCss));

			const length = this.writingPad.textContent.length;
			const serializedContent = NotepadDialog.markJsonSerializer.serialize(this.writingPad.children);
			note.content = serializedContent;
			note.contentLength = length;
			await updateBlockInDb(note);
			this.remove();
			notify(i18n("note_saved"));
		} catch (error) {
			console.error(error);
		}
	}
}

customElements.define("notepad-dialog", NotepadDialog, { extends: "dialog" });
