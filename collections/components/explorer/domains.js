import { html } from "../../js/om.compact.js";

export class DomainItem extends HTMLElement {
	constructor(domain) {
		super();
		this.domain = domain;
	}

	static blockCards;

	filterCollectionBydomain() {
		fireEvent(document.body, "viewmodefilter", this.domain.name);
	}

	filterCollectionByRoute({ target }) {
		if (!target.closest("summary")) return;
		const route = target.textContent.trim();
		DomainItem.blockCards ??= document.body.querySelectorAll("note-pad");
		for (const notePad of DomainItem.blockCards) notePad.hidden = notePad.note.route !== route;
	}

	render() {
		let routes = "";
		for (const route in this.domain.routes) {
			routes += `<details>
				<summary>${route}</summary>
				<ul class="url-paths">
					${this.domain.routes[route].map((path) => `<li style="font-size: 0.7rem">${path}</li>`).join("")}
				</ul>
			</details>`;
			routes;
		}
		return html`<details>
			<summary class="domain"  @click=${this.filterCollectionByRoute.bind(this)}>
				<img src="${this.domain.favIconUrl}" /> <span>${this.domain.name}</span>
			</summary>
			<ul class="routes" @click=${this.filterCollectionByRoute.bind(this)}>
				${routes}
			</ul>
		</details> `;
	}

	connectedCallback() {
		this.replaceChildren(this.render());
	}
}

customElements.define("domain-item", DomainItem);

export class DomainList extends HTMLElement {
	constructor() {
		super();
	}

	async connectedCallback() {
		const domains = (await getStore("domains"))["domains"] ?? {};
		this.replaceChildren(...Object.values(domains).map((domain) => new DomainItem(domain)));
	}
}

customElements.define("domain-list", DomainList);
