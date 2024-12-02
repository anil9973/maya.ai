export class ResponseErrorDialog extends HTMLDialogElement {
	constructor(error) {
		super();
		this.error = error;
	}

	render() {
		return `<h1>${i18n("something_went_wrong")}</h1>
			<p style="text-align: start;white-space-collapse: preserve;">${this.error}</p>
			<button>Okay</button>`;
	}

	connectedCallback() {
		this.className = "alert-dialog";
		this.innerHTML = this.render();
		this.showModal();
		$on(this.lastElementChild, "click", () => this.remove());
	}
}

customElements.define("response-error-dialog", ResponseErrorDialog, { extends: "dialog" });
