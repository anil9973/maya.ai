export const SPACE = " ";
export const TwinMarkers = new Set(["*", "_", "~", "=", "`", "$", "[", "]", "(", ")"]);
export const Markers = new Set([...TwinMarkers, "#", "-", ">"]);
export const MarkerTags = new Set(["TWIN-MARKER", "START-MARKER"]);

export const TwinMarkClass = {
	"*": "italic",
	"**": "bold",
	"***": "bold-italic",
	_: "italic",
	"==": "highlight",
	"~~": "strikethrough",
	"`": "code",
	"[": "link-title",
	"(": "link-url",
};

export const Brackets = {
	"(": ")",
	"[": "]",
};

export const BlockMarkers = {
	list: "-" + SPACE,
	quote: ">",
	"task-list": `-${SPACE}[${SPACE}]${SPACE}`,
	description: ":" + SPACE,
};

export const CtmTagName = {
	LineBlock: "LINE-BLOCK",
	StartMarker: "START-MARKER",
	TwinMarker: "TWIN-MARKER",
	EmbedContent: "EMBED-CONTENT",
	EmbedLink: "EMBED-LINK",
	BlockIndent: "BLOCK-INDENT",
	MathBlock: "MATH-BLOCK",
	FenceBlock: "FENCE-BLOCK",
	TableGrid: "TABLE-GRID",
};

export const UpDown = {
	ArrowUp: "ArrowUp",
	ArrowDown: "ArrowDown",
};

export const Keys = {
	ArrowUp: "ArrowUp",
	ArrowDown: "ArrowDown",
	Backspace: "Backspace",
	Delete: "Delete",
	KeyB: "KeyB",
	KeyS: "KeyS",
	KeyT: "KeyT",
	Slash: "Slash",
};
