import { connect, Store } from "./db.js";

/**@param {string} fileId, @return {Promise<FileSystemFileHandle>}*/
export async function getFileById(fileId) {
	return new Promise((resolve, reject) => {
		connect().then(async (db) => {
			const store = db.transaction(Store.Files, "readonly").objectStore(Store.Files);
			const fetchQuery = store.get(fileId);
			fetchQuery.onsuccess = ({ target }) => resolve(target["result"]);
			fetchQuery.onerror = (e) => reject(e);
			db.close();
		});
	});
}

/**@param {File|Blob} file, @param {string} fileId */
export async function saveFileInDb(file, fileId) {
	return new Promise((resolve, reject) => {
		connect().then(async (db) => {
			const store = db.transaction(Store.Files, "readwrite").objectStore(Store.Files);
			const insertTask = store.put(file, fileId);
			insertTask.onsuccess = (e) => resolve(e);
			insertTask.onerror = (e) => reject(e);
			db.close();
		});
	});
}

export { saveFileInDb as saveBlobInDb };
