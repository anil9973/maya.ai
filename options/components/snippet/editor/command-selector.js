import { html, map, react } from "../../../../collections/js/om.compact.js";

export class CommandSelector extends HTMLElement {
	constructor() {
		super();
	}

	static commandList = [
		{ id: "copy", name: "Copy" },
		{ id: "download", name: "Download" },
		{ id: "readAloud", name: "Read aloud" },
		{ id: "openFirstLink", name: "Open first Link" },
		{ id: "openAllLink", name: "Open all Link" },
		{ id: "replaceSelectText", name: "Replace selected text" },
		{ id: "exportTableAsCSV", name: "Export table in CSV file" },
	];

	commands;

	onSelectChange({ target }) {
		if (target.checked) {
			this.selected.push(target.value);
			this.commands[target.value] = CommandSelector.commandList.find((cmd) => cmd.name === target.value).id;
			//BUG index is not defined in reactive push
			this.firstElementChild.lastElementChild["dataset"].index = this.selected.length - 1; //TEMP change later
		} else {
			const index = this.selected.indexOf(target.value);
			if (index === -1) return;
			this.selected.splice(index, 1);
			delete this.commands[target.value];
		}
	}

	onInputFieldClick({ target }) {
		if (target.closest("atom-icon")) {
			const index = +target.closest("chip-item").dataset.index;
			this.selected.splice(index, 1);
			this.lastElementChild.children[index].firstElementChild["checked"] = false;
		}
	}

	render() {
		const chipItem = (item, index) =>
			html`<chip-item data-index="${index}"><span>${item}</span> <atom-icon ico="close"></atom-icon></chip-item>`;
		const dataItem = (item) =>
			html`<li>
				<input type="checkbox" value="${item.name}" ?checked="${this.selected.includes(item)}" />
				<span>${item.name}</span>
			</li>`;

		return html`<chip-input-box
				contenteditable="true"
				spellcheck="false"
				@click=${this.onInputFieldClick.bind(this)}>
				${map(this.selected, chipItem)}
			</chip-input-box>
			<multi-select-popup @click=${this.onSelectChange.bind(this)}>${map(CommandSelector.commandList, dataItem)}</multi-select-popup>`;
	}

	connectedCallback() {
		this.selected = react(Object.keys(this.commands));
		this.replaceChildren(this.render());
	}
}

customElements.define("command-selector", CommandSelector);
