import { html, map } from "../../js/om.compact.js";

export class BlockLabels extends HTMLElement {
	/**@param {{name:string,color:number}[]} labels */
	constructor(labels) {
		super();
		this.labels = labels;
	}

	openLabelPopup({ currentTarget }) {
		/* if (currentTarget.nextElementSibling) return;
		const labelPicker = new LabelPicker();
		currentTarget.after(labelPicker);
		$on(labelPicker, "addlabel", ({ detail }) => this.labels.push(detail)); */
	}

	removeLabel(event) {
		if (!event.target.closest("atom-icon")) return;
		const li = event.target.closest("li");
		const labelTxt = li.textContent;
		const index = this.labels.findIndex((label) => label.name === labelTxt);
		index === -1 || (this.labels.splice(index, 1), li.remove());
	}

	render() {
		return html`<ul class="label-list" @click=${this.removeLabel.bind(this)}>
				${map(this.labels, (label) => html`<li style="--hue:${label.color}"><span>${label.name}</span><note-icon ico="close"></note-icon></li>`)}
			</ul>
			<div class="add-label" tabindex="0">
				<atom-icon ico="plus" @click=${this.openLabelPopup.bind(this)}></atom-icon>
			</div>`;
	}

	connectedCallback() {
		this.replaceChildren(this.render());
	}
}

customElements.define("block-labels", BlockLabels);
