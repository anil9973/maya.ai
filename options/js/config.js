import {
	registerAutoTranslateScript,
	registerDomainAutoTranslateScript,
	registerSelectAiPopupScript,
} from "./register-script.js";
// @ts-ignore
import languages from "/assets/languages.json" with { type: "json" };

const keys = [
	"autoTabGroupingOn",
	"categorizeBookmarkOn",
	"toLang",
	"compareProductOn",
	"autoSummarizeOnTabSwitch",
	"selectAIPopupOn",
];
const storeData = await getStore(keys);

const autoSummarizerSwitch = eId("auto_summarizer");
autoSummarizerSwitch.checked = storeData.autoSummarizeOnTabSwitch;
$on(autoSummarizerSwitch, "change", async ({ target }) => {
	const granted = await chrome.permissions.request({ origins: ["<all_urls>"] });
	if (!granted) return;
	setStore({ autoSummarizeOnTabSwitch: target.checked });
});

//Auto Translate config
const languageSelectElem = eId("toLanguages");
const languageList = Object.keys(languages);
languageList.forEach((lang) => {
	const option = document.createElement("option");
	option.value = lang;
	option.textContent = languages[lang];
	languageSelectElem.appendChild(option);
});
languageSelectElem.value = storeData.toLang;
$on(languageSelectElem, "change", ({ target }) => setStore({ toLang: target.value }));

const autoTranslateSwitch = eId("toggle_auto_translate");
autoTranslateSwitch.checked = storeData.autoTranslateOn;
$on(autoTranslateSwitch, "change", onAutoTranslateToggle);

//translator button
const selectAIPopupSwitch = eId("toggle_select_ai_popup");
selectAIPopupSwitch.checked = storeData.selectAIPopupOn;
$on(selectAIPopupSwitch, "change", async ({ target }) => {
	target.checked
		? await registerSelectAiPopupScript()
		: await chrome.scripting.unregisterContentScripts({ ids: ["select-ai-popup"] });
	setStore({ selectAIPopupOn: target.checked });
});

//Compare product from tabs
const compareProductSwitch = eId("compareProduct");
compareProductSwitch.checked = storeData.compareProductOn;
$on(compareProductSwitch, "change", async ({ target }) => {
	const granted = await chrome.permissions.request({ permissions: ["tabs"] });
	granted && setStore({ compareProductOn: target.checked });
});

// Categorization
const tabGroupingSwitch = eId("toggle_tab_grouping");
const bookmarkCategorizerSwitch = eId("toggle_bookmark_categorizer");
const groupOpenTabsSwitch = eId("group_opened_tabs");
const categorizeExistBookmarkSwitch = eId("categorize_existing_bookmark");
const includePageThumbnailSwitch = eId("include_webpage_thumbnail");
storeData.autoTabGroupingOn ?? (groupOpenTabsSwitch.parentElement.hidden = false);
storeData.categorizeBookmarkOn ?? (categorizeExistBookmarkSwitch.parentElement.hidden = false);

tabGroupingSwitch.checked = storeData.autoTabGroupingOn;
bookmarkCategorizerSwitch.checked = storeData.categorizeBookmarkOn;

$on(bookmarkCategorizerSwitch, "change", toggleCategorizeBookmark);
$on(tabGroupingSwitch, "change", toggleTabGrouping);

async function toggleTabGrouping({ target }) {
	const message = {
		msg: "toggle_auto_tabgrouping",
		autoTabGroupingOn: target.checked,
		groupOpenedTabs: groupOpenTabsSwitch.checked,
	};
	const response = await chrome.runtime.sendMessage(message);
	console.log(response);
}

async function toggleCategorizeBookmark({ target }) {
	const message = {
		msg: "toggle_auto_categorize_bookmark",
		categorizeBookmarkOn: target.checked,
		categorizeExistBookmarks: categorizeExistBookmarkSwitch.checked,
		includePageThumbnail: includePageThumbnailSwitch.checked,
	};
	const response = await chrome.runtime.sendMessage(message);
	console.log(response);
}

async function onAutoTranslateToggle(event) {
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
