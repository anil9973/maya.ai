export class Element {
	/**@param {string} tagName, @param {Object} [attributes]*/
	constructor(tagName, attributes) {
		this.type = "Element";
		this.tagName = tagName;
		this.attributes = attributes;
		this.children = [];
		tagName === "LINE-BLOCK" && (this.embedContent = null);
	}
}

export class Text {
	/**@param {string} data*/
	constructor(data) {
		this.type = "Text";
		this.data = data;
	}
}
