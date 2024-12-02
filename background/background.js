import { AutoBookmarkCategorizer, AutoTabGrouper, ImageCategorizer, NoteCategorizer } from "./categorizer.js";
import { addDomainInTranslate, registerDynamicScriptonUpdate } from "./register-script.js";
import { categorizeExistBookmarks, groupOpenedTabs, injectFuncScript2 } from "./util.js";
import { onSelectImage, showPopupAtSelection } from "../scripts/show-popup-func.js";
import { SwPromptMessenger } from "../AI/sw-prompt-message.js";
import { getCrtTab } from "../popup/js/extractor.js";
import { Screenshoter } from "./screenshot.js";

globalThis.getStore = chrome.storage.local.get.bind(chrome.storage.local);
globalThis.setStore = chrome.storage.local.set.bind(chrome.storage.local);
globalThis.i18n = chrome.i18n.getMessage.bind(this);
var onBookmarkCreated;
var onUpdateTab;

const MessageHandler = {
	ttsSpeak: (request) => chrome.tts.speak(request.text, { lang: request.lang, enqueue: true }),
	addDomainInTranslate: (request) => addDomainInTranslate(request.domain, request.toLang),
	addNoteInCollection: (request, sender) => {
		chrome.permissions.request({ permissions: ["downloads"] });
		return new NoteCategorizer().addNote(request, sender.tab);
	},

	addImageInCollection: (request, sender) => {
		chrome.permissions.request({ permissions: ["downloads"] });
		return new ImageCategorizer().addImage(request.imgSrcUrl, request.alt, sender.url, sender.tab.title);
	},

	captureShot: (request, sender) => {
		chrome.permissions.request({ permissions: ["downloads"] });
		//biome-ignore format:
		return new Screenshoter(request.coordinate, request.screenHeight, sender.tab.id).captureAndSave(request, sender.url, sender.tab.title)
	},

	toggle_auto_tabgrouping: (request, sender) => {
		return chrome.permissions.request({ permissions: ["tabs", "tabGroups"] }).then((granted) => {
			if (!granted) return;
			setStore({ autoTabGroupingOn: request.autoTabGroupingOn });
			request.autoTabGroupingOn ? setAutoGroupListener() : chrome.tabs.onUpdated.removeListener(onUpdateTab);
			request.groupOpenedTabs && groupOpenedTabs();
		});
	},

	toggle_auto_categorize_bookmark: (request, sender) => {
		const permissions = { permissions: ["tabs", "bookmarks"] };
		request.includePageThumbnail && (permissions.origins = ["https://*/*"]);

		return chrome.permissions.request(permissions).then((granted) => {
			if (!granted) return;
			setStore({ categorizeBookmarkOn: request.categorizeBookmarkOn });
			request.categorizeBookmarkOn
				? setBookmarkCategorizer()
				: chrome.bookmarks.onCreated.removeListener(onUpdateTab);
			request.categorizeExistBookmarks && categorizeExistBookmarks();
		});
	},

	checkProductTab: (request, sender) => {
		return new Promise(async (resolve, reject) => {
			const tabs = await chrome.tabs.query({ highlighted: true, currentWindow: true });
			const activeTab = tabs.find((tab) => tab.active);
			if (!activeTab) return;
			let otherTab = tabs.find((tab) => !tab.active);
			const index = activeTab.index !== 0 ? activeTab.index - 1 : 1;
			otherTab ??= (await chrome.tabs.query({ index, currentWindow: true }))[0];
			//biome-ignore format:
			await chrome.storage.session.set({ compareProducts: [{ url: activeTab.url, title: activeTab.title }, { url: otherTab.url, title: otherTab.title}]});
			const message = `I need to compare two products before purchasing. Check whether the provided URL '${activeTab.url}' with title '${activeTab.title}' and '${otherTab.url}'  with title ${otherTab.title}' is related to a product. Respond with 'true' if the URL is about a product or 'false' if it is not. Do not provide any explanation or example.`;
			const promptMessager = new SwPromptMessenger();
			return resolve(promptMessager.promptMessage(message));
		});
	},
};

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
	if (MessageHandler[request.msg]) {
		MessageHandler[request.msg](request, sender)?.then?.(sendResponse);
		return true;
	}
});

function setBookmarkCategorizer() {
	const bookmarkCategorizer = new AutoBookmarkCategorizer();
	onBookmarkCreated = bookmarkCategorizer.onBookmarkCreated.bind(bookmarkCategorizer);
	chrome.bookmarks.onCreated.addListener(onBookmarkCreated);
}

function setAutoGroupListener() {
	const autoTabGrouper = new AutoTabGrouper();
	onUpdateTab = autoTabGrouper.onUpdateTab.bind(autoTabGrouper);
	chrome.tabs.onUpdated.addListener(onUpdateTab);
}

getStore("categorizeBookmarkOn").then(
	({ categorizeBookmarkOn }) => categorizeBookmarkOn && setBookmarkCategorizer(),
);
getStore("autoTabGroupingOn").then(({ autoTabGroupingOn }) => autoTabGroupingOn && setAutoGroupListener());

export const contextHandler = {
	textSelectAction: (info, tab) => {
		injectFuncScript2(showPopupAtSelection, tab.id, "showTxtSelectAiAction", info.frameId);
	},

	imgSelectAction: async (info, tab) => {
		injectFuncScript2(onSelectImage, tab.id, "showImgSelectAiAction", info.frameId, info.srcUrl);
	},

	goToCollections: (info, tab) => {
		chrome.tabs.create({ url: "/collections/index.html", index: tab.index + 1 });
	},
};
chrome.contextMenus.onClicked.addListener((info, tab) => contextHandler[info.menuItemId](info, tab));

//command-handler
const commands = {
	selectTextAIPopup: async () => {
		const tab = await getCrtTab();
		injectFuncScript2(showPopupAtSelection, tab.id, "showTxtSelectAiAction");
	},

	openCollections: async () => chrome.tabs.create({ url: "collections/index.html" }),
};
chrome.commands.onCommand.addListener((command) => commands[command]?.());

export function setInstallation({ reason }) {
	async function oneTimeInstall() {
		const LAMBA_KD = crypto.randomUUID();
		await setStore({ extUserId: LAMBA_KD });

		chrome.commands.getAll(async (commands) => {
			const missingShortcuts = [];
			for (const gks of commands) gks.shortcut === "" && missingShortcuts.push(gks);
			missingShortcuts.length === 0 || (await chrome.storage.local.set({ missingShortcuts }));
			chrome.tabs.create({ url: "/guide/welcome-guide.html" });
		});
	}
	reason === "install" && oneTimeInstall();
	reason === "update" && onUpdate();

	function onUpdate() {
		registerDynamicScriptonUpdate();
	}

	chrome.contextMenus.create({
		id: "textSelectAction",
		title: i18n("ai_action_on_selected_text") + " (Alt+A)",
		contexts: ["selection"],
	});

	chrome.contextMenus.create({
		id: "imgSelectAction",
		title: i18n("ai_action_on_selected_image"),
		contexts: ["image"],
	});

	chrome.contextMenus.create({
		id: "goToCollections",
		title: i18n("open_collections"),
		contexts: ["action"],
	});
}

// installation setup
chrome.runtime.onInstalled.addListener(setInstallation);
