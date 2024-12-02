import { html } from "../../../collections/js/om.compact.js";
import { getSync, setSync } from "../../../popup/js/constant.js";

export class SnippetCategory extends HTMLElement {
	constructor() {
		super();
	}

	async addCategory() {
		const categoryName = prompt(i18n("Enter_Category_Name"));
		const snippetCategories = (await getSync("snippetCategories")).snippetCategories ?? [];
		const categoryId = Math.random().toString(36).slice(2);
		snippetCategories[categoryId] = { id: categoryId, name: categoryName };
		setSync({ snippetCategories });
		this.firstElementChild["value"] = categoryName;
		fireEvent(this.parentElement, "switchcategory", categoryId);
	}

	async updateCategoryName(categoryId, event) {
		event.target.setAttribute("contenteditable", "false");
		const name = event.target.textContent.trim();
		const { snippetCategories } = await getSync("snippetCategories");
		snippetCategories[categoryId].name = name;
		setSync({ snippetCategories });
		this.lastElementChild["togglePopover"]();
		this.selectedElem.contains(event.target) && (this.firstElementChild["value"] = name);
	}

	actions = {
		edit: (/** @type {HTMLLIElement} */ liElem) => {
			const titleInput = liElem.firstElementChild;
			titleInput.setAttribute("contenteditable", "true");
			titleInput["focus"]();
			getSelection().getRangeAt(0).selectNodeContents(titleInput);

			const updateNameFn = this.updateCategoryName.bind(this, liElem.id);
			const onInput = (event) => {
				if (event.inputType === "insertParagraph") {
					this.updateCategoryName(liElem.id, event);
					titleInput.removeEventListener("beforeinput", onInput);
					titleInput.removeEventListener("blur", updateNameFn);
					event.preventDefault();
				}
			};
			titleInput.addEventListener("beforeinput", onInput);
			titleInput.addEventListener("blur", updateNameFn, { once: true });
		},

		delete: async (/** @type {HTMLLIElement} */ liElem) => {
			const { snippetCategories } = await getSync("snippetCategories");
			delete snippetCategories[liElem.id];
			setSync({ snippetCategories });
			liElem.hasAttribute("selected") && this.switchCategory(this.lastElementChild.firstElementChild);
			liElem.remove();
			this.lastElementChild["togglePopover"]();
			toast(i18n("category_removed"));
		},
	};

	async switchCategory(liElem) {
		const name = liElem.firstElementChild.textContent.trim();
		this.firstElementChild["value"] = name;
		this.selectedElem = liElem;
		this.selectedElem.setAttribute("selected", "");
		await setSync({ openSnippetCategory: liElem.id });
		fireEvent(this.parentElement, "switchcategory", liElem.id);
	}

	onClick({ target }) {
		const liElem = target.closest("li");
		const svg = target.closest("svg");
		if (svg) return this.actions[svg.getAttribute("class")](liElem);

		if (liElem.id === "add-category") return this.addCategory();
		if (liElem === this.selectedElem) return;
		this.selectedElem?.removeAttribute("selected");
		this.lastElementChild["togglePopover"]();
		this.switchCategory(liElem);
	}

	render(categories = {}, openCategoryName) {
		const ids = Object.keys(categories);
		const categoryElem = (category, index) => `<li id="${ids[index]}">
					<span>${category.name}</span>
					<atom-icon ico="edit" title=""></atom-icon>
					<atom-icon ico="delete" title=""></atom-icon>
				</li>`;

		return html`<input type="button" value="${openCategoryName}" /><atom-icon ico="chev-down" title=""></atom-icon>
			<menu>
                ${Object.values(categories).map(categoryElem).join("")}
                <li id="add-category">➕ ${i18n("add_category")}</li>
			</menu>`;
	}

	async connectedCallback() {
		this.tabIndex = 0;
		const { snippetCategories, openSnippetCategory } = await getSync(["snippetCategories", "openSnippetCategory"]);
		const openCategory = this.getAttribute("category") || openSnippetCategory || "Select Category";
		this.replaceChildren(this.render(snippetCategories, openCategory));
		if (openSnippetCategory) {
			this.selectedElem = document.getElementById(openSnippetCategory);
			this.selectedElem.setAttribute("selected", "");
		}
		$on(this.lastElementChild, "click", this.onClick.bind(this));
	}
}

customElements.define("snippet-category", SnippetCategory);
