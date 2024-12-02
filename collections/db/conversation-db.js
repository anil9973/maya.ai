import { connect, Store } from "./db.js";

export const Sender = {
	USER: "user",
	AI_MODEL: "assistant",
};

export class ChatMessage {
	constructor(conversationId, sender, content) {
		this.id = Math.random().toString(36).slice(2);
		this.conversationId = conversationId;
		this.sender = sender;
		this.content = content;
		this.createdAt = Date.now();
	}
}

/**@returns {Promise<ChatMessage[]>} */
export async function pipeConversationMessage(conversationId) {
	return new Promise((resolve, reject) => {
		connect().then((db) => {
			const transaction = db.transaction(Store.Conversations, "readonly");
			const conversationStore = transaction.objectStore(Store.Conversations);
			const fetchQuery = conversationStore.index("conversationId").getAll(IDBKeyRange.only(conversationId));
			fetchQuery.onsuccess = ({ target }) => resolve(target["result"]);
			fetchQuery.onerror = (e) => reject(e);
			db.close();
		});
	});
}

/**@param {ChatMessage} message*/
export async function insertChatMessageInDb(message) {
	return new Promise((resolve, reject) => {
		connect().then(async (db) => {
			const store = db.transaction(Store.Conversations, "readwrite").objectStore(Store.Conversations);
			const putTask = store.put(message);
			putTask.onsuccess = (e) => resolve(e);
			putTask.onerror = (e) => reject(e);
			db.close();
		});
	});
}

export async function deleteConversationMessage(conversationId) {
	return new Promise((resolve, reject) => {
		connect().then((db) => {
			const transaction = db.transaction(Store.Conversations, "readonly");
			const conversationStore = transaction.objectStore(Store.Conversations);
			const fetchQuery = conversationStore.index("conversationId").getAll(IDBKeyRange.only(conversationId));
			fetchQuery.onsuccess = ({ target }) => {
				const chatMessages = target["result"];
				for (const chatMessage of chatMessages) conversationStore.delete(chatMessage);
			};
			transaction.oncomplete = (e) => resolve(e);
			transaction.onerror = (e) => reject(e);
			db.close();
		});
	});
}
