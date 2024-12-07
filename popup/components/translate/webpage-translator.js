import {
	registerAutoTranslateScript,
	registerDomainAutoTranslateScript,
} from "../../../options/js/register-script.js";
import { html } from "../../../collections/js/om.compact.js";
// @ts-ignore
import switchCss from "../../style/enable-switch.css" with { type: "css" };
import { removeFromDomainTranslate } from "../../js/domain-trans-script.js";
document.adoptedStyleSheets.push(switchCss);

export class WebpageTranslator extends HTMLDialogElement {
	constructor(domainMatch, toLang) {
		super();
		this.domainMatch = domainMatch;
		this.toLang = toLang;
	}

	async translateThisDomain(event) {
		const checked = event.target.checked;
		if (checked) {
			const message = { msg: "addDomainInTranslate", domain: this.domainMatch, toLang: this.toLang };
			const response = await chrome.runtime.sendMessage(message);
			if (response.errCaused) return toast(response.errCaused, true);
		} else {
			const domainsLang = (await getStore("domainsLang")).domainsLang ?? {};
			await removeFromDomainTranslate(this.domainMatch);
			delete domainsLang[this.domainMatch];
		}
	}

	async onAutoTranslateToggle(event) {
		try {
			if (event.target.checked) {
				await registerAutoTranslateScript();
				chrome.scripting.unregisterContentScripts({ ids: ["domain_auto_translator"] }).catch((err) => {});
			} else {
				await chrome.scripting.unregisterContentScripts({ ids: ["auto_translate"] }).catch((err) => {});
				await registerDomainAutoTranslateScript();
				await setStore({ autoTranslateOn: false });
			}
		} catch (error) {
			console.error(error);
		}
	}

	render(domainExist) {
		return html`<atom-icon ico="close-circle" title="" @click=${this.remove.bind(this)}></atom-icon>
		<h3 style="text-align:center;margin-top:0">${i18n("auto_translate")}</h3>
        <li>
            <span>${i18n("auto_translate_this_domain")}</span>
			<label class="switch">
				<input type="checkbox" ?checked=${domainExist} @change=${this.translateThisDomain.bind(this)} />
				<span class="slider"></span>
			</label>
		</li>

        <li>
            <span>${i18n("auto_translate_webpages")}</span>
			<label class="switch">
				<input type="checkbox" @change=${this.onAutoTranslateToggle.bind(this)} />
				<span class="slider"></span>
			</label>
		</li>`;
	}

	async connectedCallback() {
		const { domainsLang } = await getStore("domainsLang");
		const domainExist = domainsLang?.[this.domainMatch] ? true : false;
		this.id = "webpage-translator";
		this.replaceChildren(this.render(domainExist));
		this.showModal();
		document.body.style.width = "22rem";
	}

	disconnectedCallback() {
		document.body.style.width = "unset";
	}
}

customElements.define("webpage-translator", WebpageTranslator, { extends: "dialog" });
