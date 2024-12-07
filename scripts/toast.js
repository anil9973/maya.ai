globalThis.toast = (msg, isErr) => {
	const toastElem = document.createElement("output");
	toastElem.id = "error-notifier";
	toastElem.hidden = true;
	document.body.appendChild(toastElem);

	const cssStyleSheet = new CSSStyleSheet();
	cssStyleSheet.insertRule(`#error-notifier {
		min-width: 20ch;
        font-size: 20px;
        background-color: #333;
        color: rgb(255, 208, 0);
        text-align: center;
        border-radius: 12px;
        padding: 4px 8px;
        position: fixed;
        z-index: 1000;
        margin-inline: auto;
		inset-inline: 0;
        bottom: 20px;
        width: max-content;
        translate: 0 200%;
        animation: in-out 5s ease-out;
		
		&.error {
			top: 2em;
			bottom: unset;
			background-color: red;
			color: white;
			translate: 0 -200%;
		}
	}`);

	cssStyleSheet.insertRule(`@keyframes in-out { 10%, 90% { translate: 0 0; } }`);
	document.adoptedStyleSheets.push(cssStyleSheet);

	globalThis.toast = (msg, isErr) => {
		toastElem.className = isErr ? "error" : "";
		toastElem.hidden = false;
		toastElem.innerText = msg;
		setTimeout(() => (toastElem.hidden = true), 5100);
	};
	toast(msg, isErr);
};
