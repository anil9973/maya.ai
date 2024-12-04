import "../../../collections/js/reset.js";
import "../../../collections/components/helper/atom-icon.js";
import "../components/chat-toolbar.js";
import "../components/chat-window/open-chat-container.js";
import { crtTabId } from "../../summarizer/js/extractor.js";
// @ts-ignore
import baseCss from "../style/base.css" with { type: "css" };
document.adoptedStyleSheets.push(baseCss);

chrome.windows.getCurrent({ windowTypes: ["normal"] }).then((win) => (globalThis.windowId = win.id));

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
	if (request === "chat") {
		crtTabId().then((tabId) => onTabSwitch({ tabId, windowId: globalThis.windowId }));
		sendResponse("opening_tab_chat...");
	}
});

const openChatContainer = $("open-chat-container");
async function onTabSwitch({ tabId, windowId }) {
	if (windowId !== globalThis.windowId) return;
	const tab = await chrome.tabs.get(tabId);
	openChatContainer.firstElementChild.switchConversation(tab);
}
chrome.tabs.onActivated.addListener(onTabSwitch);
