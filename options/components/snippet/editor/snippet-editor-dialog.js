import { getSnippetByShortcutKey, insertSnippetInDb, Snippet } from "../../../../collections/db/snippet-db.js";
import { html, react } from "../../../../collections/js/om.compact.js";
import { SnippetCard } from "../snippet-card.js";
import "./snippet-editor-pad.js";
import "./command-selector.js";
import "../snippet-category.js";

export class SnippetEditorDialog extends HTMLDialogElement {
	/** @param {Snippet} [snippet]*/
	constructor(snippet) {
		super();
		this.snippet = react(snippet ?? new Snippet());
	}

	async addSnippet() {
		const snippet = Object.assign({}, this.snippet);
		snippet.commands = Object.values(this.snippet.commands);
		snippet.category = $("snippet-category", this).firstElementChild.value;
		snippet.promptMsg = $("snippet-editor-pad", this).innerText;

		try {
			await insertSnippetInDb(snippet);
			$("snippet-container").appendChild(new SnippetCard(snippet));
			notify(i18n("Snippet_created"));
			this.remove();
		} catch (error) {
			console.error(error);
		}
	}

	/** @param {KeyboardEvent} event */
	async onShortcutKeyDown(event) {
		event.preventDefault();
		if (!event.code.startsWith("Key") && !event.code.startsWith("Digit")) return;
		if (event.ctrlKey || event.shiftKey || event.altKey || event.metaKey) {
			let shortcutKey = "";
			event.ctrlKey && (shortcutKey += "Ctrl+");
			event.shiftKey && (shortcutKey += "Shift+");
			event.altKey && (shortcutKey += "Alt+");
			event.metaKey && (shortcutKey += "Meta+");
			shortcutKey += event.key.toLocaleUpperCase();
			event.target["value"] = this.snippet.shortcutKey = shortcutKey;

			const snippet = await getSnippetByShortcutKey(shortcutKey);
			if (snippet) {
				notify(i18n("shortcut_key_already_assigned"));
			}
		}
	}

	render() {
		return html`<snippet-form>
			<div class="row">
				<div>
					<label>${i18n("category")}</label>
					<snippet-category category="${this.snippet.category}"></snippet-category>
				</div>
				<div>
					<label>${i18n("keyboard_shortcut")}</label>
					<input type="text" name="keyboard" style="width: 16ch;" .value=${() => this.snippet.shortcutKey} @keydown=${this.onShortcutKeyDown.bind(this)} />
				</div>
			</div>

			<div>
				<label>${i18n("title")}</label>
				<input type="text" name="snippet_title" .value=${() => this.snippet.title}  />
			</div>

			<div>
				<label>${i18n("description")}</label>
				<textarea .value=${() => this.snippet.description}></textarea>
			</div>

			<div>
				<label>${i18n("prompt_message")}</label>
				<editor-pad-wrapper>
					<snippet-editor-pad .promptmsg=${() => this.snippet.promptMsg}></snippet-editor-pad>
				</editor-pad-wrapper>
			</div>

			<div>
				<label>${i18n("run_commands_after_ai_model_responsed")}</label>
				<command-selector .commands=${this.snippet.commands}></command-selector>
			</div>
			<button type="submit" @click=${this.addSnippet.bind(this)}>${i18n("create_snippet")}</button>
		</snippet-form>`;
	}

	async connectedCallback() {
		this.id = "snippet-editor-dialog";
		this.replaceChildren(this.render());
		this.showModal();
	}
}

customElements.define("snippet-editor-dialog", SnippetEditorDialog, { extends: "dialog" });
