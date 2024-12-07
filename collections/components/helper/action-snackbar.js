const cssStyleSheet = new CSSStyleSheet();
cssStyleSheet.replace(`
#snackbar,
action-snackbar {
	position: fixed;
	z-index: 1000;
	left: 30%;
	bottom: 2em;
	min-width: 5em;
	width: max-content;
	padding: 0.5em 0.4em;
	text-align: center;
	border-radius: 1em;
	box-shadow: var(--card);
	background-color: light-dark(#6b6a69, #5e5f5f);
	color: light-dark(rgb(255, 145, 0), rgb(245, 140, 3));

	translate: 0 200%;
	animation: in-out 5s ease-out;

	&.error {
		top: 2em;
		bottom: unset;
		background-color: red;
		color: white;
		translate: 0 -200%;
	}
}

action-snackbar {
	min-width: 6em;
	display: flex;
	justify-content: space-between;
	align-items: center;
	column-gap: 0.4em;

	& .undo-btn {
		color: rgb(240, 146, 6);
		margin-left: auto;
		font-size: 0.8rem;

		& + sr-icon svg {
			height: 1em;
		}
	}
}

@keyframes in-out {
	10%,
	90% {
		translate: 0 0;
	}
}`);
document.adoptedStyleSheets.push(cssStyleSheet);

export class ActionSnackbar extends HTMLElement {
	constructor() {
		super();
	}

	/**@public @param {number} actionId*/
	show(actionId) {
		return new Promise((resolve, reject) => {
			$on(this.undoBtn, "click", () => {
				clearTimeout(actionId);
				reject();
				this.remove();
			});

			const timeoutID = setTimeout(resolve, 5000);
			$on(this.undoBtn.nextElementSibling, "click", () => {
				clearTimeout(timeoutID);
				resolve();
				this.remove();
			});
		});
	}

	render() {
		return `<div class="info-msg">${i18n("item_deleted")}</div>
		<button class="undo-btn">${i18n("undo")}</button>
		<atom-icon ico="close"></atom-icon>`;
	}

	connectedCallback() {
		this.innerHTML = this.render();
		this.hidden = true;
		this.undoBtn = this.children[1];
	}
}

customElements.define("action-snackbar", ActionSnackbar);
