export const Store = {
	Blocks: "Blocks",
	Files: "FileHandler",
	Snippets: "Snippets",
	Conversations: "Conversations",
	CompletionTextShots: "CompletionTextShots",
};

function onupgradeneeded({ target }) {
	const blockStore = target.result.createObjectStore(Store.Blocks, { keyPath: "id" });
	blockStore.createIndex("folder", "folder", { unique: false });
	blockStore.createIndex("date", "date", { unique: false });
	blockStore.createIndex("domain", "domain", { unique: false });

	const snippetStore = target.result.createObjectStore(Store.Snippets, { keyPath: "id" });
	snippetStore.createIndex("category", "category", { unique: false });
	snippetStore.createIndex("shortcutKey", "shortcutKey", { unique: true });

	const conversationStore = target.result.createObjectStore(Store.Conversations, { keyPath: "id" });
	conversationStore.createIndex("conversationId", "conversationId", { unique: false });

	target.result.createObjectStore(Store.CompletionTextShots, { keyPath: "text" });
	target.result.createObjectStore(Store.Files);
}

/**@returns {Promise<IDBDatabase>} */
export function connect() {
	return new Promise((resolve, reject) => {
		const request = indexedDB.open("MayaAI-db", 1);
		request.onupgradeneeded = onupgradeneeded;
		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error);
		request.onblocked = () => console.warn("pending till unblocked");
	});
}
