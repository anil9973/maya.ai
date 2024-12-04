import { BookmarkBlock, Block, BlockType, ImageBlock, NoteBlock } from "../collections/db/Block.js";
import { extractJSONContent, getDateTimeName, injectFuncScript } from "./util.js";
import { escapeRx, getTabs, tabgroupColors } from "../popup/js/constant.js";
import { generateContentOnGeminiServer } from "../AI/Gemini-api.js";
import { extractPageThumbnail } from "../scripts/func-script.js";
import { insertBlockInDb } from "../collections/db/block-db.js";
import { SwPromptMessenger } from "../AI/sw-prompt-message.js";
import { saveFileInDb } from "../collections/db/file-db.js";
import { getCrtTab } from "../popup/js/extractor.js";

export class AutoBookmarkCategorizer extends SwPromptMessenger {
	constructor() {
		super();
	}

	async getCategory(url, title) {
		// Output result in language ${navigator.language}
		const message = `I want to categorize this tab with url: "${url}" and title: "${title}". Please suggest category and hashtags in json format. Don't provide explanation or example.`;
		const response = await this.promptMessage(message);
		return extractJSONContent(response);
	}

	async getParentFolderId(...categories) {
		let parentId = "2";
		async function getChildFolderId(folderName) {
			const bookmarks = await chrome.bookmarks.getChildren(parentId);
			const bookmark = bookmarks.find((bm) => bm.title === folderName);
			return bookmark ? bookmark.id : (await chrome.bookmarks.create({ parentId, title: folderName })).id;
		}

		for (const category of categories) parentId = await getChildFolderId(category);
		return parentId;
	}

	async bookmarkTab(url, categories, hashTags) {
		const [tab] = await getTabs({ url });
		if (tab.url !== url) return;
		/**@type {string[]} */
		const pageData = await injectFuncScript(extractPageThumbnail, tab.id);
		//biome-ignore format:
		const bookmarkBlock = new BookmarkBlock(tab.title, tab.url, pageData[0], pageData[1] || tab.favIconUrl, hashTags);
		const block = new Block(BlockType.Bookmark, bookmarkBlock);
		await block.setFolder(categories);
		await insertBlockInDb(block);
	}

	async moveBookmarkInFolderTree(id, categories) {
		const parentFolderId = await this.getParentFolderId(categories);
		await chrome.bookmarks.move(id, { index: 0, parentId: parentFolderId });
	}

	/** @param {string} id @param {chrome.bookmarks.BookmarkTreeNode} bookmark */
	async onBookmarkCreated(id, bookmark) {
		if (!bookmark.url) return;
		try {
			const dataObj = await this.getCategory(bookmark.url, bookmark.title);
			if (!dataObj.category) return;
			await this.bookmarkTab(bookmark.url, dataObj.category, dataObj.hashtags);
			await this.moveBookmarkInFolderTree(id, dataObj.category);
		} catch (error) {
			console.error(error);
		}
	}
}

export class AutoTabGrouper extends SwPromptMessenger {
	constructor() {
		super();
	}

	excludeDomains = new Set(["www.google.com", "duckduckgo.com"]);

	/** @returns {chrome.tabGroups.ColorEnum} */
	// @ts-ignore
	getRandomClr = () => tabgroupColors[Math.floor(Math.random() * 9)];

	async getGroupName(tabUrl, tabTitle) {
		//  Output result in language ${navigator.language}
		const message = `I want to categorize this tab with url: "${tabUrl}" and title:"${tabTitle}". Please suggest category name. Don't provide explanation or example.`;
		return await this.promptMessage(message);
	}

	async applyTabGroup(tabId, groupTitle) {
		const tabGroups = await chrome.tabGroups.query({ title: groupTitle });
		if (tabGroups.length !== 0) chrome.tabs.group({ tabIds: tabId, groupId: tabGroups[0].id });
		else {
			try {
				const newId = await chrome.tabs.group({ tabIds: tabId });
				chrome.tabGroups.update(newId, { collapsed: false, title: groupTitle, color: this.getRandomClr() });
			} catch (error) {
				console.warn(error);
			}
		}
	}

	async addTabInGroup(tab) {
		if (this.excludeDomains.has(new URL(tab.url).host)) return;
		const tabGroupName = await this.getGroupName(tab.url, tab.title);
		tabGroupName && this.applyTabGroup(tab.id, tabGroupName);
	}

	/**@param { chrome.tabs.TabChangeInfo} info, @param {chrome.tabs.Tab} tab */
	onUpdateTab(_, info, tab) {
		info.status === "complete" && tab.groupId === -1 && tab.url.startsWith("http") && this.addTabInGroup(tab);
	}
}

export class ImageCategorizer extends SwPromptMessenger {
	constructor() {
		super();
	}

	/** @param {Blob} blob*/
	blobToBase64(blob) {
		return new Promise((resolve, _) => {
			const reader = new FileReader();
			reader.onloadend = () => resolve(reader.result);
			reader.readAsDataURL(blob);
		});
	}

	/** @param {ImageBlock} imgBlock */
	async addImageInDb(imgBlock, categories) {
		const block = new Block(BlockType.Image, imgBlock);
		await block.setFolder(categories);
		await insertBlockInDb(block);
	}

	createPromptMessageForImg(srcUrl, alt, pageUrl, pageTitle) {
		return `I have already extracted an image with the source URL '${srcUrl}' from the website '${pageUrl}' and title: '${pageTitle}'. Alternative text for this image is '${alt}'. Now, I want to organize this image for easy access. Please analyze image and suggest a category name where it can be saved, generate relevant hashtags, and write a clear description for the image. Return the output in JSON format without providing any explanations or examples. The result should be in the language '${navigator.language}`;
	}

	createPromptMessageForScreenshot(imgBase64, pageUrl, pageTitle) {
		return `I have already captured screenshot with the base64 URL '${imgBase64}' from the website '${pageUrl}' and title: '${pageTitle}'. Now, I want to organize this screenshot image for easy access. Please analyze image and suggest a category name where it can be saved, generate relevant hashtags, and write a clear description for the image. Return the output in JSON format without providing any explanations or examples. The result should be in the language '${navigator.language}`;
	}

	async generateDescription(message) {
		try {
			const response = await this.promptMessage(message);
			this.session.destroy();
			return extractJSONContent(response);
		} catch (error) {
			console.error(error);
			const responseText = await generateContentOnGeminiServer(message);
			if (responseText) {
				return extractJSONContent(responseText);
			}
		}
	}

	//add image in collection
	async addImage(srcUrl, alt, pageUrl, pageTitle) {
		try {
			const message = this.createPromptMessageForImg(srcUrl, alt, pageUrl, pageTitle);
			const infoData = await this.generateDescription(message);
			if (!infoData) return;
			const filename = infoData.category + srcUrl.slice(srcUrl.lastIndexOf("/"));
			const localDirHandler = null;
			if (localDirHandler) {
				/*TODO const dirHandle = await getLocalDirectory();
				await writeImgToLocalFile(dirHandle, srcUrl, filename); */
			} else await chrome.downloads.download({ filename, url: srcUrl });
			const imgBlock = new ImageBlock(srcUrl, pageUrl, infoData.description, alt, null, infoData.hashtags);
			await this.addImageInDb(imgBlock, infoData.category);
		} catch (error) {
			console.error(error);
		}
	}

	//add screenshot in collection
	/** @param {Blob} imageBlob @param {string} pageUrl @param {string} pageTitle */
	async addScreenshot(imageBlob, pageUrl, pageTitle) {
		try {
			const imgBase64 = await this.blobToBase64(imageBlob);
			const message = this.createPromptMessageForScreenshot(imgBase64, pageUrl, pageTitle);
			const infoData = await this.generateDescription(message);
			if (!infoData) return;
			const filename = `${infoData.category}/screenshot_${getDateTimeName()}.png`;
			const localDirHandler = null;
			const imageUrl = "blob://" + crypto.randomUUID();
			if (localDirHandler) {
				/*TODO const dirHandle = await getLocalDirectory();
				await writeBlobToLocalFile(dirHandle, imageBlob, filename); */
			} else {
				await chrome.downloads.download({ filename, url: imgBase64 });
				await saveFileInDb(imageBlob, imageUrl.slice(-36));
			}
			//biome-ignore format:
			const imgBlock = new ImageBlock(imageUrl, pageUrl, infoData.description, null, "screenshot", infoData.hashtags);
			await this.addImageInDb(imgBlock);
		} catch (error) {
			console.error(error);
		}
	}
}

export class NoteCategorizer extends SwPromptMessenger {
	constructor() {
		super();
	}

	createPromptMmessageForNote(summaryType, contents, pageUrl, pageTitle) {
		return `I have already generated a ${summaryType} summary from the website '${pageUrl}' with the title '${pageTitle}'. The summary content is: '${contents}'. Now, I want to organize this summary note for easy access. Please analyze the summary content and suggest an appropriate category name where it can be saved. Also, generate relevant hashtags based on the content. Return the result in JSON format without providing any explanations or examples. The output should be in the language '${navigator.language}'.`;
	}

	async generateCategory(message) {
		try {
			const response = await this.promptMessage(message);
			this.session.destroy();
			return extractJSONContent(response);
		} catch (error) {
			console.error(error);
			const responseText = await generateContentOnGeminiServer(message);
			if (responseText) {
				return extractJSONContent(responseText);
			}
		}
	}

	async addNote({ markTextContent, markJsonContent, tabId }, tab) {
		tab ??= tabId ? await chrome.tabs.get(tabId) : await getCrtTab();
		try {
			const message = this.createPromptMmessageForNote(markTextContent, tab.url, tab.title);
			const infoData = await this.generateCategory(message);
			if (!infoData) return;
			const name = tab.title.replaceAll(" ", "-").replaceAll(escapeRx, "").slice(0, 100) + ".md";
			const filename = infoData.category ? `${infoData.category}/${name}` : name;
			const localDirHandler = null;
			if (localDirHandler) {
				/*TODO const dirHandle = await getLocalDirectory();
				await writeImgToLocalFile(dirHandle, srcUrl, filename); */
			} else {
				await chrome.downloads.download({ filename, url: `data:text/markdown;base64,${btoa(markTextContent)}` });
			}

			const [description, thumbnail] = await injectFuncScript(extractPageThumbnail, tab.id);
			//biome-ignore format:
			const noteBlock = new NoteBlock(tab.title, markJsonContent, description, tab.url, thumbnail || tab.favIconUrl, infoData.hashtags);
			const block = new Block(BlockType.Note, noteBlock);
			await block.setFolder(infoData.category);
			await insertBlockInDb(block);
		} catch (error) {
			console.error(error);
		}
	}
}
