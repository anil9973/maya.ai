import { connect, Store } from "./db.js";

export class CompletionText {
	constructor(text = "") {
		this.text = text;
		this.useCount = 0;
	}
}

export async function pipeTextShotList() {
	return new Promise((resolve, reject) => {
		connect().then((db) => {
			const transaction = db.transaction(Store.CompletionTextShots, "readonly");
			const textShotStore = transaction.objectStore(Store.CompletionTextShots);
			const fetchQuery = textShotStore.getAll();
			fetchQuery.onsuccess = ({ target }) => resolve(target["result"]);
			fetchQuery.onerror = (e) => reject(e);
			db.close();
		});
	});
}

/**@param {string} text*/
export async function insertTextShotInDb(text) {
	return new Promise((resolve, reject) => {
		connect().then(async (db) => {
			const transaction = db.transaction(Store.CompletionTextShots, "readwrite");
			const textShotStore = transaction.objectStore(Store.CompletionTextShots);
			for (const textChunk of text.split("\n")) {
				const textSpan = textChunk.trim();
				if (!textSpan || textSpan.length > 120) continue;
				const getTask = textShotStore.get(textSpan);
				getTask.onsuccess = (e) => {
					const textShot = e.target["result"] ?? new CompletionText(textSpan);
					textShot.useCount++;
					textShotStore.put(textShot);
				};
			}

			transaction.oncomplete = (e) => resolve(e);
			transaction.onerror = (e) => reject(e);
			db.close();
		});
	});
}

/**@param {string} textSpan*/
export const updateTextShotInDb = (textSpan) => insertTextShotInDb(textSpan);

/**@param {Set<string>|string[]} textShotIds*/
export async function deleteTextShotsInDb(textShotIds) {
	return new Promise((resolve, reject) => {
		connect().then(async (db) => {
			const transaction = db.transaction(Store.CompletionTextShots, "readwrite");
			const textShotStore = transaction.objectStore(Store.CompletionTextShots);
			for (const textShotId of textShotIds) textShotStore.delete(textShotId);
			transaction.oncomplete = (e) => resolve(e);
			transaction.onerror = (e) => reject(e);
			db.close();
		});
	});
}
