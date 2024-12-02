const cssStyleSheet = new CSSStyleSheet();
cssStyleSheet.insertRule(
	`info-tooltip {
        --tooltip-bgc: light-dark(white, hsl(0, 0%, 20%));
        position: relative;

        &::after {
            content: attr(tooltip);
            position: absolute;
            width: 24ch;
            padding: 0.2em 0.2em 0.4em 0.2em;
            border-radius: 0.4em;
            background-color: var(--tooltip-bgc);
            clip-path: polygon(0% 0%, 100% 0%, 100% 80%, 53% 80%, 50% 100%, 47% 80%, 0 80%);
            opacity: 0;
            pointer-events: none;
            transition-delay: 250ms;
            transition: translate 500ms ease-out, opacity 200ms ease-out;
        }

        &[pos=top]::after {
            bottom: 1lh;
            left: -11ch;
        }

        &[pos=top]::before {
            right: -8%;
            top: 20%;
            clip-path: polygon(50% 0%, 0% 100%, 100% 100%);
        }

        &:hover::after {
            opacity: 1;
        }

        &[pos=top]:hover::after {
            translate: 0 -0.5lh;
        }
    }`,
);
document.adoptedStyleSheets.push(cssStyleSheet);

export class InfoTooltip extends HTMLElement {
	constructor() {
		super();
	}

	render() {
		return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path d="M13,9H11V7H13M13,17H11V11H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z" />
        </svg>`;
	}

	connectedCallback() {
		this.replaceChildren(this.render());
	}
}

customElements.define("info-tooltip", InfoTooltip);
