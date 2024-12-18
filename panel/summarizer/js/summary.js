import "../../../collections/js/reset.js";
import "../../../collections/components/helper/atom-icon.js";
import "../../../collections/components/helper/alert-box.js";
import { TabpageSummary } from "../components/tabpage-summary.js";
import { crtTabId } from "./extractor.js";
// @ts-ignore
import baseCss from "../style/base.css" with { type: "css" };
import toolbarCss from "../style/top-toolbar.css" with { type: "css" };
document.adoptedStyleSheets.push(baseCss, toolbarCss);

chrome.windows.getCurrent({ windowTypes: ["normal"] }).then((win) => (globalThis.windowId = win.id));

function onTabSwitch({ tabId, windowId }) {
	if (windowId !== globalThis.windowId) return;
	const tabSummaryContainer = document.getElementById(tabId);
	if (tabSummaryContainer) return tabSummaryContainer.scrollIntoView();
	const crtTabSummaryContainer = new TabpageSummary(tabId);

	$("main", document.body).appendChild(crtTabSummaryContainer);
	crtTabSummaryContainer.scrollIntoView();
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
	if (request === "summarizer") {
		crtTabId().then((tabId) => onTabSwitch({ tabId, windowId: globalThis.windowId }));
		sendResponse("Summarizing...");
	}
});

getStore("autoSummarizeOnTabSwitch").then(({ autoSummarizeOnTabSwitch: autoSummarize }) => {
	autoSummarize && chrome.tabs.onActivated.addListener(onTabSwitch);
});
