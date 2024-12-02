import { html } from "../../js/om.compact.js";

const weekDays = {
	"week 1": ["01", "07"],
	"week 2": ["07", 14],
	"week 3": [14, 21],
	"week 4": [21, 31],
};

export class CalendarMonth extends HTMLElement {
	constructor(month, weeks) {
		super();
		this.month = month;
		this.weeks = weeks;
	}

	filterCollectionByMonth({ target }) {
		const [startDay, endDay] = weekDays[target.textContent] ?? ["01", 31];
		const filter = [`${startDay} ${this.month}`, `${endDay} ${this.month}`];
		fireEvent(document.body, "viewmodefilter", filter);
	}

	render() {
		return html`<details>
			<summary @click=${this.filterCollectionByMonth.bind(this)}><span>${this.month}</span></summary>
			<ul @click=${this.filterCollectionByMonth.bind(this)}>
				${this.weeks.map((route) => `<li>${route}</li>`).join("")}
			</ul>
		</details> `;
	}

	connectedCallback() {
		this.replaceChildren(this.render());
	}
}

customElements.define("calendar-month", CalendarMonth);

export class CollectionCalendar extends HTMLElement {
	constructor() {
		super();
	}

	render(collectionCalendar) {
		const docFrag = new DocumentFragment();
		for (const month in collectionCalendar)
			docFrag.appendChild(new CalendarMonth(month, collectionCalendar[month]));
		return docFrag;
	}

	async connectedCallback() {
		const collectionCalendar = (await getStore("collectionCalendar"))["collectionCalendar"] ?? {};
		this.replaceChildren(this.render(collectionCalendar));
	}
}

customElements.define("collection-calendar", CollectionCalendar);
