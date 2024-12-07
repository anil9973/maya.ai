export class TableToCSVConverter {
	constructor() {}

	/**@param {HTMLTableElement} table*/
	convert(table) {
		/**@type {string[]}*/
		const csvRows = Array(table.rows.length);
		for (let index = 0; index < table.rows.length; index++) csvRows[index] = this.insertRow(table.rows[index]);
		return csvRows.join("\n");
	}

	/**@param {HTMLTableRowElement} row*/
	insertRow(row) {
		const cellLength = row.cells.length;
		const rowCells = Array(cellLength);
		for (let index = 0; index < cellLength; index++) {
			let text = row.cells[index].innerText;
			const img = row.cells[index].querySelector("img");
			if (img) text += " " + img.currentSrc;
			rowCells[index] = text.includes("\n") ? `"${text}"` : text;
			//add support for ","
		}
		return rowCells.join(",");
	}
}
