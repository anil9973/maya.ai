import { LineBlock } from "./line-block.js";

export class TableGrid extends HTMLElement {
	constructor() {
		super();
		this.table = new WingTable(this);
	}

	addTableRow() {
		const newRow = this.table.insertRow();
		const cellCount = this.table.rows[0].cells.length;
		for (let index = 0; index < cellCount; index++) newRow.insertCell(index);
	}

	addTableColumn() {
		const rows = this.table.rows;
		for (let index = 0; index < rows.length; index++) rows[index].insertCell();
	}

	connectedCallback() {
		const rowBar = document.createElement("div");
		rowBar.className = "row-bar";
		const columnBar = document.createElement("div");
		columnBar.className = "column-bar";
		this.append(this.table, rowBar, columnBar);
		this.nextElementSibling ?? this.after(new LineBlock());

		$on(rowBar, "click", this.addTableRow.bind(this));
		$on(columnBar, "click", this.addTableColumn.bind(this));
	}
}

customElements.define("table-grid", TableGrid);

export class WingTable extends HTMLTableElement {
	constructor(tableGrid) {
		super();
		this.tableGrid = tableGrid;
	}

	connectedCallback() {
		if (this.hasChildNodes()) return;
		const row1 = this.insertRow();
		row1.insertCell();
		row1.insertCell();
		const row2 = this.insertRow();
		row2.insertCell();
		row2.insertCell();
	}

	disconnectedCallback() {
		this.tableGrid.remove();
	}
}

customElements.define("wing-table", WingTable, { extends: "table" });
