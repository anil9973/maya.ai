import { Block } from "./Block.js";
import { connect, Store } from "./db.js";
import { getFilterKeyRange } from "./helper.js";

/**
 * @param {string} viewMode
 * @param {string} [filter]
 * @returns {Promise<Map<String, Block[]>>}
 */
export async function pipeBlockList(viewMode, filter) {
	return new Promise((resolve, reject) => {
		connect().then((db) => {
			const blockMap = new Map();
			const transaction = db.transaction(Store.Blocks, "readonly");
			const blockStore = transaction.objectStore(Store.Blocks);
			const storeIdx = blockStore.index(viewMode);
			const fetchCursor = storeIdx.openCursor(getFilterKeyRange(viewMode, filter), "prev");

			fetchCursor.onsuccess = (event) => {
				const cursor = event.target["result"];
				if (cursor) {
					const block = cursor.value;
					blockMap.has(cursor.key) ? blockMap.get(cursor.key).push(block) : blockMap.set(cursor.key, [block]);
					cursor.continue();
				} else resolve(blockMap);
			};
			fetchCursor.onerror = (e) => reject(e);
			db.close();
		});
	});
}

/**@param {Block} block*/
export async function insertBlockInDb(block) {
	return new Promise((resolve, reject) => {
		connect().then(async (db) => {
			const store = db.transaction(Store.Blocks, "readwrite").objectStore(Store.Blocks);
			const putTask = store.put(block);
			putTask.onsuccess = (e) => resolve(e);
			putTask.onerror = (e) => reject(e);
			db.close();
		});
	});
}

/**@param {Block} blockData*/
export async function updateBlockInDb(blockData) {
	return new Promise((resolve, reject) => {
		connect().then(async (db) => {
			const store = db.transaction(Store.Blocks, "readwrite").objectStore(Store.Blocks);
			const archiveTask = store.put(blockData);
			archiveTask.onsuccess = (e) => resolve(e);
			archiveTask.onerror = (e) => reject(e);
			db.close();
		});
	});
}

/**@param {Set<string>|string[]} blockIds*/
export async function deleteBlocksInDb(blockIds) {
	return new Promise((resolve, reject) => {
		connect().then(async (db) => {
			const transaction = db.transaction(Store.Blocks, "readwrite");
			const blockStore = transaction.objectStore(Store.Blocks);
			for (const blockId of blockIds) blockStore.delete(blockId);
			transaction.oncomplete = (e) => resolve(e);
			transaction.onerror = (e) => reject(e);
			db.close();
		});
	});
}
