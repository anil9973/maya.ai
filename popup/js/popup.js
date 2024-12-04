import "../../collections/js/reset.js";
import "../../collections/components/helper/atom-icon.js";
import { WEBSTORE_ERR } from "./constant.js";
import { extractSelectedContent, getCrtTab } from "./extractor.js";
import languages from "/assets/languages.json" with { type: "json" };
// @ts-ignore
import baseCss from "../style/base.css" with { type: "css" };
import topbarCss from "../style/top-toolbar.css" with { type: "css" };
import actionBtnCss from "../style/action-btn.css" with { type: "css" };
document.adoptedStyleSheets.push(baseCss, topbarCss, actionBtnCss);

setLang("chat_with_page");
setLang("summary");
setLang("compare_product");
setLang("select_anything");
setLang("translate_webpage");
setLang("screenshot");
setLang("ai_recommended_websites");
setLang("recommended_sites");

//action buttons
import {
	captureScreenshot,
	compareProduct,
	injectSelector,
	openChatPanel,
	openCollections,
	openPageTranslator,
	showRecommendSites,
	summarizeThisPage,
} from "./actions.js";

const openCollectionBtn = eId("openCollections");
$on(openCollectionBtn, "click", openCollections);

const chatPanelBtn = eId("chatWithPage");
$on(chatPanelBtn, "click", openChatPanel);

const summarizerBtn = eId("summarizePage");
$on(summarizerBtn, "click", summarizeThisPage);

const translatorBtn = eId("translate");
$on(translatorBtn, "click", openPageTranslator);

const elemSelectorBtn = eId("selectElem");
$on(elemSelectorBtn, "click", injectSelector);

const screenshotBtn = eId("capture_screenshot");
$on(screenshotBtn, "click", captureScreenshot);

const compareProductBtn = eId("compareProduct");
$on(compareProductBtn, "click", compareProduct);

const recommendBtn = eId("recommendSites");
$on(recommendBtn, "click", showRecommendSites);

const langSelectElem = eId("languages_list");
for (const lang in languages) {
	const option = new Option(languages[lang], lang);
	langSelectElem.add(option);
}

//keyboard shortcuts
const keys = {
	KeyC: openChatPanel,
	KeyS: summarizeThisPage,
	KeyM: injectSelector,
	KeyK: captureScreenshot,
	KeyR: showRecommendSites,
};

function onKeyDown(evt) {
	if (evt.altKey || evt.metaKey) keys[evt.code]?.();
}
document.body.addEventListener("keydown", onKeyDown);

//Welcome config dialog
getStore("showWelcomeConfig").then(async ({ showWelcomeConfig }) => {
	if (showWelcomeConfig) return;
	const { WelcomeConfigDialog } = await import("../components/helper/welcome-config.js");
	setTimeout(() => document.body.appendChild(new WelcomeConfigDialog()), 1000);
});

//If text selected in current webpage
(async function () {
	const tab = await getCrtTab();
	if (!tab.url || tab.url?.startsWith("chrome") || tab.url?.startsWith(WEBSTORE_ERR)) return;

	const textData = await extractSelectedContent(tab.id);
	if (!textData) return;

	const { TranslatorDialog } = await import("../components/translate/translator-dialog.js");
	document.body.appendChild(new TranslatorDialog(textData));
})();

//Check this tab and previous tab is about product
async function checkproductTab() {
	const isProductTab = await chrome.runtime.sendMessage({ msg: "checkProductTab" });
	if (isProductTab.includes("true")) compareProductBtn.style.display = "flex";
}
getStore("compareProductOn").then(({ compareProductOn }) => compareProductOn && setTimeout(checkproductTab, 1000));
