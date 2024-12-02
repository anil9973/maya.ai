import { connect, Store } from "./db.js";

export class Snippet {
	constructor(title = "", promptMsg = "", shortcutKey = "", category = "", description = "") {
		this.id = Math.random().toString(36).slice(2);
		this.title = title;
		this.promptMsg = promptMsg;
		this.description = description;
		this.shortcutKey = shortcutKey;
		this.category = category;
		this.commands = {};
		this.createdAt = Date.now();
		this.updatedAt = null;
	}
}

/**@returns {Promise<Snippet[]>} */
export async function pipeSnippetList(category) {
	return new Promise((resolve, reject) => {
		connect().then((db) => {
			const transaction = db.transaction(Store.Snippets, "readonly");
			const snippetStore = transaction.objectStore(Store.Snippets);
			const fetchQuery = category
				? snippetStore.index("category").getAll(IDBKeyRange.only(category))
				: snippetStore.getAll();
			fetchQuery.onsuccess = ({ target }) => resolve(target["result"]);
			fetchQuery.onerror = (e) => reject(e);
			db.close();
		});
	});
}

/**@returns {Promise<Snippet>} */
export async function getSnippetByShortcutKey(shortcutKey) {
	return new Promise((resolve, reject) => {
		connect().then((db) => {
			const transaction = db.transaction(Store.Snippets, "readonly");
			const snippetStore = transaction.objectStore(Store.Snippets);
			const fetchQuery = snippetStore.index("shortcutKey").get(IDBKeyRange.only(shortcutKey));

			fetchQuery.onsuccess = ({ target }) => resolve(target["result"]);
			fetchQuery.onerror = (e) => reject(e);
			db.close();
		});
	});
}

/**@param {Snippet} snippet*/
export async function insertSnippetInDb(snippet) {
	return new Promise((resolve, reject) => {
		connect().then(async (db) => {
			const store = db.transaction(Store.Snippets, "readwrite").objectStore(Store.Snippets);
			const putTask = store.put(snippet);
			putTask.onsuccess = (e) => resolve(e);
			putTask.onerror = (e) => reject(e);
			db.close();
		});
	});
}

/**@param {Snippet} snippetData*/
export async function updateSnippetInDb(snippetData) {
	return new Promise((resolve, reject) => {
		connect().then(async (db) => {
			const store = db.transaction(Store.Snippets, "readwrite").objectStore(Store.Snippets);
			const updateTask = store.put(snippetData);
			updateTask.onsuccess = (e) => resolve(e);
			updateTask.onerror = (e) => reject(e);
			db.close();
		});
	});
}

/**@param {Set<string>|string[]} snippetIds*/
export async function deleteSnippetsInDb(snippetIds) {
	return new Promise((resolve, reject) => {
		connect().then(async (db) => {
			const transaction = db.transaction(Store.Snippets, "readwrite");
			const snippetStore = transaction.objectStore(Store.Snippets);
			for (const snippetId of snippetIds) snippetStore.delete(snippetId);
			transaction.oncomplete = (e) => resolve(e);
			transaction.onerror = (e) => reject(e);
			db.close();
		});
	});
}
