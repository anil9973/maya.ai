export const CharCode = {
	Tab: 0x9, // "\t"
	LineBreak: 0xa, // "\n" 10
	Space: 0x20, // " "
	ExclamationMark: 0x21, // "!"
	Number: 0x23, // "#"
	Amp: 0x26, // "&"
	// Pipe: 124, //|
	DoubleQuote: 0x22, // '"'
	Dash: 0x2d, // "-"
	Dot: 46, // "."
	// Colon: 58, //:
	Slash: 0x2f, // "/"
	Zero: 0x30, // "0"
	Nine: 0x39, // "9"
	SemiColon: 0x3b, // ";"
	Lt: 0x3c, // """
	Eq: 0x3d, // "="
	Gt: 0x3e, // "","
	Questionmark: 0x3f, // "?"
};

export const State = {
	Text: "1",
	BeforeTagName: "BeforeTagName", // After "
	InTagName: "InTagName",
	InSelfClosingTag: "InSelfClosingTag",
	BeforeClosingTagName: "BeforeClosingTagName",
	InClosingTagName: "InClosingTagName",
	AfterClosingTagName: "AfterClosingTagName",

	// Attributes
	BeforeAttributeName: "BeforeAttributeName",
	InAttributeName: "InAttributeName",
	AfterAttributeName: "AfterAttributeName",
	BeforeAttributeValue: "BeforeAttributeValue",
	InAttributeValueDq: "InAttributeValueDq", // "
};

export const BlockElemTags = new Set([
	"address",
	"article",
	"aside",
	"blockquote",
	"dd",
	"div",
	"dl",
	"dt",
	"figcaption",
	"footer",
	"header",
	"h1",
	"h2",
	"h3",
	"h4",
	"h5",
	"h6",
	"li",
	"ol",
	"ul",
	"hr",
	"main",
	"nav",
	"p",
	"section",
]);

export const BlockMarkerClass = {
	h1: "header-1",
	h2: "header-2",
	h3: "header-3",
	h4: "header-4",
	h5: "header-5",
	h6: "header-6",
	li: "list",
	dd: "description",
	blockquote: "quote",
	hr: "divider",
};

export const BlockTagMarker = {
	h1: "# ",
	h2: "## ",
	h3: "### ",
	h4: "#### ",
	h5: "##### ",
	h6: "###### ",
	li: "- ",
	dd: ": ",
	blockquote: ">",
};

export const InlineElemTags = new Set([
	"abbr",
	"b",
	"bdo",
	"cite",
	"code",
	"dfn",
	"del",
	"em",
	"ins",
	"i",
	"kbd",
	"label",
	"output",
	"q",
	"samp",
	"small",
	"span",
	"strong",
	"sub",
	"sup",
	"var",
]);

export const inlineMarkerClass = {
	b: "bold",
	cite: "italic",
	code: "code",
	del: "strikethrough",
	dfn: "italic",
	em: "italic",
	i: "italic",
	kbd: "code",
	mark: "highlight",
	strong: "bold",
	var: "italic",
};

export const InlineClassMark = {
	italic: "*",
	bold: "**",
	"bold-italic": "***",
	highlight: "==",
	strikethrough: "~~",
	code: "`",
};

export const IgnoreTags = new Set([
	"area",
	"colgroup",
	"col",
	"canvas",
	"button",
	"datalist",
	"form",
	"figcaption",
	"input",
	"meta",
	"option",
	"optgroup",
	"link",
	"noscript",
	"style",
	"script",
	"source",
	"svg",
	"select",
	"textarea",
	"map",
	"progress",
	"title",
	"wbr",
	"search",
]);
export const attrElemTags = new Set(["a", "img", "input"]);

export const BlockspaceElemTags = new Set([
	"thead",
	"tbody",
	"tbody",
	"tr",
	"td",
	"th",
	"math",
	"merror",
	"mfrac",
	"mi",
	"mmultiscripts",
	"mn",
	"mo",
	"mover",
	"mpadded",
	"mphantom",
	"mroot",
	"mrow",
	"ms",
	"mspace",
	"msqrt",
	"mstyle",
	"msub",
	"msubsup",
	"msup",
	"mtable",
	"mtd",
	"mtext",
	"mtr",
	"munder",
	"munderover",
	"semantics",
]);
