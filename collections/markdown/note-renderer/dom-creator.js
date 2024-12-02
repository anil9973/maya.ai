import { CtmElemCreator } from "./elem-creator.js";

export class NoteRenderer extends CtmElemCreator {
	constructor() {
		super();
	}

	createCtmElement(element) {
		const { ctmElem, childNodes } = this.ctmElements[element.tagName].call(this, element);

		if (element.attributes) {
			const attributes = element.attributes;
			for (const attr in attributes) ctmElem.setAttribute(attr, attributes[attr]);
		}

		if (element.children && element.children.length !== 0) childNodes && this.insertChildren(childNodes, ctmElem);
		return ctmElem;
	}

	addElement(element) {
		/**@type {HTMLElement} */
		const htmlElem = document.createElement(element.tagName);

		if (element.attributes) {
			const attributes = element.attributes;
			for (const attr in attributes) htmlElem.setAttribute(attr, attributes[attr]);
		}

		if (element.children && element.children.length !== 0) this.insertChildren(element.children, htmlElem);
		return htmlElem;
	}

	insertChildren(children, docFrag) {
		for (const node of children) {
			const htmlNode =
				node.type === "Element"
					? this.ctmElements[node.tagName]
						? this.createCtmElement(node)
						: this.addElement(node)
					: new Text(node.data);
			htmlNode && docFrag.appendChild(htmlNode);
		}
	}

	/**@param {Object} elements, @returns {DocumentFragment}*/
	createDom(elements) {
		const docFrag = new DocumentFragment();
		this.insertChildren(elements, docFrag);
		return docFrag;
	}
}
