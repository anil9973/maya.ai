import { html } from "../../../collections/js/om.compact.js";
// @ts-ignore
import switchCss from "../../style/enable-switch.css" with { type: "css" };
document.adoptedStyleSheets.push(switchCss);

export class WelcomeConfigDialog extends HTMLDialogElement {
	constructor() {
		super();
	}

	async toggleTabGrouping({ target }) {
		setStore({ showWelcomeConfig: false });
		const groupOpenedTabs = eId("group_opened_tabs").checked;
		const message = { msg: "toggle_auto_tabgrouping", autoTabGroupingOn: target.checked, groupOpenedTabs };
		const response = await chrome.runtime.sendMessage(message);
		console.log(response);
	}

	async toggleCategorizeBookmark({ target }) {
		const categorizeExistBookmarks = eId("categorize_existing_bookmark").checked;
		const includePageThumbnail = eId("include_webpage_thumbnail").checked;
		const message = {
			msg: "toggle_auto_categorize_bookmark",
			categorizeBookmarkOn: target.checked,
			categorizeExistBookmarks,
			includePageThumbnail,
		};
		const response = await chrome.runtime.sendMessage(message);
		console.log(response);
	}

	render() {
		return html`<h3 style="text-align:center;margin-top:0">${i18n("welcome_to_maya_ai")}</h3>
			<li>
				<div>
					<div>${i18n("automatic_tab_grouping")}</div>
					<label> 
						<input type="checkbox" name="toggle" id="group_opened_tabs" /> 
						<span>${i18n("auto_group_opened_tabs")}</span> </label>
				</div>
				<label class="switch">
					<input type="checkbox" @change=${this.toggleTabGrouping.bind(this)} />
					<span class="slider"></span>
				</label>
			</li>

			<li>
				<div>
					<div>${i18n("automatic_bookmark_categorization")}</div>
					<label>
						<input type="checkbox" name="toggle" id="categorize_existing_bookmark" />
						<span>${i18n("organize_existing_bookmarks")}</span> <br>

						<input type="checkbox" id="include_webpage_thumbnail" />
						<span>Include webpage description & thumbnail</span>
					</label>
				</div>
				<label class="switch">
					<input type="checkbox" @click=${this.toggleCategorizeBookmark.bind(this)} />
					<span class="slider"></span>
				</label>
			</li>`;
	}

	connectedCallback() {
		this.id = "welcome-config-dialog";
		this.replaceChildren(this.render());
		this.showModal();
		document.body.style.width = "26rem";
		setStore({ showWelcomeConfig: true });
	}
}

customElements.define("welcome-config-dialog", WelcomeConfigDialog, { extends: "dialog" });
