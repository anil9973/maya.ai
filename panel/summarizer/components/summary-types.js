import { getSync } from "../../../popup/js/constant.js";

export class SummaryType extends HTMLElement {
	constructor(type) {
		super();
		this.type = type;
		this._internals = this.attachInternals();
	}

	set active(flag) {
		// @ts-ignore
		flag ? this._internals.states.add("active") : this._internals.states.delete("active");
	}

	onTabClick() {
		const summaryTypeElem = $("summary-type:state(active)", this.parentElement);
		summaryTypeElem && (summaryTypeElem.active = false);
		fireEvent(this.parentElement, "changesummarytype", this.type.type);
		this.active = true;
	}

	connectedCallback() {
		const span = document.createElement("span");
		const text = new Text(this.type.name);
		span.appendChild(text);
		this.append(span);
		$on(this, "click", this.onTabClick);
	}
}

customElements.define("summary-type", SummaryType);

export class SummaryTypesRow extends HTMLElement {
	constructor() {
		super();
	}

	static types = [
		{
			type: "key-points",
			name: "Key Points",
			icon: "",
		},
		{
			type: "tl;dr",
			name: "TL;DR",
			icon: "",
		},

		{
			type: "teaser",
			name: "Teaser",
			icon: "",
		},
		{
			type: "headline",
			name: "Headline",
			icon: "",
		},

		{
			type: "mind-map",
			name: "Mind map",
			icon: "",
		},

		{
			type: "timeline",
			name: "Timeline",
			icon: "",
		},
		{
			type: "faq",
			name: "FAQ",
			icon: "",
		},
	];

	render() {
		return SummaryTypesRow.types.map((type) => new SummaryType(type));
	}

	async connectedCallback() {
		this.replaceChildren(...this.render());
		const summaryType = (await getSync("summaryType")).summaryType ?? "key-points";
		const index = SummaryTypesRow.types.findIndex((type) => type.type === summaryType);
		this.children[index]["active"] = true;
	}
}

customElements.define("summary-types-row", SummaryTypesRow);
