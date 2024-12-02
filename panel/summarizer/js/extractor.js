import { HOST_ACCESS_ERR, WEBSTORE_ERR } from "../../../popup/js/constant.js";

export const crtTabId = async () => (await chrome.tabs.query({ currentWindow: true, active: true }))[0].id;

export async function extractYoutubeTransScript() {
	const tabId = await crtTabId();

	async function extractTranscript() {
		let transcriptContainer = document.getElementById("segments-container");
		if (!transcriptContainer) {
			document
				.querySelectorAll("ytd-structured-description-content-renderer")[1]
				.querySelector("button")
				["click"]();
			await new Promise((r) => setTimeout(r, 1200));
		}
		transcriptContainer = document.getElementById("segments-container");
		const transcriptStrings = transcriptContainer.querySelectorAll("yt-formatted-string");
		const transcript = Array.prototype.map.call(transcriptStrings, (elem) => elem.textContent).join(" ");
		return { pageTxtContent: transcript, pageTitle: document.title };
	}
	try {
		return await injectFuncScript(extractTranscript, tabId);
	} catch (error) {
		console.error(error);
	}
}

export async function extractPageContent(tabId) {
	tabId ??= await crtTabId();
	try {
		return await injectFuncScript(getMarkdownContent, tabId);
	} catch (error) {
		console.error(error);
		notify("Failed to extract article", "error");
		//setTimeout(() => document.body.appendChild(new ReportBug(error)), 2000);
	}
}

/**@param {(...args: any[]) => any} func*/
export async function injectFuncScript(func, tabId, ...args) {
	const results = await chrome.scripting.executeScript({
		target: { tabId },
		func: func,
		args: args,
	});
	return results?.[0]?.result;
}

/**@returns {Promise<string>} */
export async function extractSelectedContent() {
	const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
	try {
		return injectFuncScript(getSelectedContent, tab.id);
	} catch (error) {
		if (error.message === WEBSTORE_ERR || error.message.endsWith(HOST_ACCESS_ERR)) return;
		console.error(error);
		toast("Failed to extract article");
	}
}

/**@param {Range} range*/
export async function getSelectedContent(range) {
	const blockTags = new Set(["BLOCKQUOTE", "PRE", "OL", "UL"]);
	if (!range) {
		const selection = getSelection();
		if (selection.isCollapsed) return;
		range = selection.getRangeAt(0);
	}

	const ancestorElem =
		range.commonAncestorContainer.nodeType === 1
			? range.commonAncestorContainer
			: range.commonAncestorContainer.parentElement;
	const parentTag = blockTags.has(ancestorElem.parentElement.tagName)
		? ancestorElem.parentElement.tagName
		: ancestorElem["tagName"];
	const parentElem = document.createElement(parentTag.toLowerCase());
	parentElem.appendChild(range.cloneContents());

	return new Promise(async (resolve, reject) => {
		try {
			const generateUrl = chrome.runtime.getURL("/scripts/markdown/serializer/mark-txt-serializer.js");
			const { MarkTextSerializer } = await import(generateUrl);
			const markdownSerializer = new MarkTextSerializer();
			const mdContent = markdownSerializer.serialize(parentElem.children);
			resolve(mdContent);
		} catch (error) {
			console.error(error);
			reject(error);
		}
	});
}

//inject function
function getMarkdownContent() {
	const host = location.host;
	const index = host.indexOf(".");
	const domain = host.lastIndexOf(".") === index ? host : host.slice(index + 1);

	return new Promise(async (resolve, reject) => {
		/* const articleTimes = {
			"medium.com": () => document.body.querySelector('span[data-testid="storyPublishDate"]')?.textContent,
			"dev.to": () => document.body.querySelector("time")?.title,
			"makeuseof.com": () => document.body.querySelector("time")?.dateTime,
		};

		const pageAuthors = {
			"medium.com": () => document.body.querySelector('a[data-testid="authorName"]')?.textContent,
			"dev.to": () => document.body.querySelector("a.crayons-link.fw-bold")?.textContent,
			"makeuseof.com": () => document.body.querySelector("a.meta_txt.author")?.textContent,
			"longreads.com": () => document.body.querySelector("a.url.fn.n")?.textContent,
			"narratively.com": () => document.body.querySelector("a.url.fn.n")?.textContent,
			"newyorker.com": () => document.body.querySelector(".byline__name-link")?.textContent,
		}; 

		function getTags() {
			// const relTags =
			// 	document.querySelectorAll("a[rel~='tag']").length === 0 && document.querySelectorAll("a[href*='tag']");
			// return Array.prototype.map.call(relTags, (a) => a.textContent);
		}*/

		let rootArticleElem;

		function getArticleRoot() {
			// biome-ignore format:
			const IgnoreTags = new Set(["IMG","FIGURE","PICTURE", "svg", "CANVAS", "VIDEO", "STYLE", "HEADER", "NAV", "SCRIPT","ASIDE","BLOCKQUOTE","P","FOOTER","H1","H2","H3","UL","OL","FORM", "LI","A","TEXTAREA","INPUT","DL","DD","TABLE"]);
			const minWidth = innerWidth * 0.5;
			const elementStack = [];

			/** @param {HTMLElement} parentElem*/
			function traverse(parentElem) {
				function filterElem(elem) {
					if (IgnoreTags.has(elem.tagName)) return false;
					if (elem.childElementCount === 0) return false;
					//if (elem.computedStyleMap().get("position").value !== "static") return false;
					return true;
				}
				const childElements = Array.prototype.filter.call(parentElem.children, filterElem);
				const heights = Array.prototype.map.call(childElements, (elem) => elem.offsetHeight);

				const maxHeight = Math.max(...heights);
				const index = heights.indexOf(maxHeight);
				const element = childElements[index];
				if (!element) return;
				if (element.offsetWidth < minWidth) return;
				if (element.offsetHeight < elementStack.at(-1)?.offsetHeight * 0.5) return;
				elementStack.push(element);
				traverse(element);
			}

			traverse(document.body);
			return elementStack.at(-1);
		}

		async function getPageTitle() {
			const getReverseDomain = (host) => host.split(".").reverse().join(".");

			function getDate() {
				return new Date().toLocaleDateString("default", { dateStyle: "medium" }).replaceAll(" ", "-");
			}

			const escapeRx = new RegExp(/[\s:|?<>/~#^*\[\]]/g);
			const variables = {
				date: getDate(),
				pageTitle: document.title.replaceAll(" ", "-").replaceAll(escapeRx, "").slice(0, 100),
				reverseDate: new Date().toISOString().slice(0, 10),
				domain: location.host,
				reverseDomain: getReverseDomain(location.host),
			};
			let { fileNameFormat } = await chrome.storage.sync.get("fileNameFormat");
			fileNameFormat ||= "date-pageTitle";
			for (const varName in variables) fileNameFormat = fileNameFormat.replace(varName, variables[varName]);
			return fileNameFormat;
		}

		const selection = getSelection();
		if (!selection.isCollapsed) {
			rootArticleElem = selection.getRangeAt(0).cloneContents();
			rootArticleElem.children.length === 0 && (rootArticleElem = getArticleRoot());
		} else rootArticleElem = getArticleRoot();

		try {
			const generateUrl = chrome.runtime.getURL("/scripts/markdown/serializer/mark-txt-serializer.js");
			const { MarkTextSerializer } = await import(generateUrl);
			const markdownSerializer = new MarkTextSerializer();
			const mdContent = markdownSerializer.serialize(rootArticleElem.children);

			const pageTitle = await getPageTitle();
			/* const time = articleTimes[domain]?.() ?? document.querySelector("time")?.textContent;

			const author =
				pageAuthors[domain]?.() ??
				document.querySelector("a[rel=author]")?.textContent.trim() ??
				document.querySelector("[class~='author']")?.textContent.trim(); */

			// resolve({ mdContent, pageTitle, time, author, imagePaths, tags: getTags() });
			resolve({ pageTxtContent: mdContent, pageTitle });
		} catch (error) {
			console.error(error);
			chrome.runtime.sendMessage({ error });
			reject(error);
		}
		//BUG Cannot read properties of null (reading 'src')
	});
}
