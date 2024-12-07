import "../../collections/js/reset.js";
import "../../collections/components/helper/atom-icon.js";
import "../../collections/components/helper/alert-box.js";
import "../components/snippet/snippet-category.js";
import "../components/snippet/snippet-container.js";
import "../components/autocompletion/auto-completion.js";
import "./config.js";
import "./contact-mail.js";
import { connect } from "../../collections/db/db.js";

import "../style/layout.css";
import "../style/base.css";
import "../style/setting.css";
import "../style/snippet.css";
import "../style/snippet-editor.css";
import "../style/auto-completion.css";

setLang("Configuration");
setLang("configuration");
setLang("keyboard_shortcuts");
setLang("markdown_formatting");
setLang("formatting_syntax");
setLang("emphasis_text_syntax");
setLang("keyboard_shortcuts0");
setLang("emphasis_syntax");
setLang("text_editing_command");
setLang("changelog");
setLang("contact_us");
setLang("contactus");
setLang("starter_guide");
setLang("more_extensions");

if ((location.hash = "#new-install")) {
	(async function () {
		const importUrl = chrome.runtime.getURL("/assets/completion-texts.json");
		const { default: textList } = await import(importUrl, { with: { type: "json" } });
		connect().then(async (db) => {
			const transaction = db.transaction("CompletionTextShots", "readwrite");
			const textShotStore = transaction.objectStore("CompletionTextShots");
			for (const textSpan of textList) textShotStore.put({ text: textSpan, useCount: 0 });
		});
	})();
}
