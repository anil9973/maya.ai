function buildGoodSuffixTable(needle) {
	const result = [];

	let shift;
	let suffix;
	let subPrefix;
	let prefix;
	let lengthSuffix;
	const count = needle.length;

	// Start traversing from the shortest suffix
	let i = count;
	while (--i) {
		suffix = needle.slice(i);
		prefix = needle.slice(0, i);
		lengthSuffix = suffix.length;

		shift = -1;
		// Query from the right side of prefix to the left.
		for (let j = prefix.length; j >= lengthSuffix; j--) {
			subPrefix = prefix.slice(j - lengthSuffix, j);
			if (subPrefix === suffix) {
				shift = count - j;
				break;
			}
		}

		if (shift === -1) break;
		else result.push(shift);
	}

	return result;
}

/** @param {string} needle*/
function buildBadCharTable(needle) {
	const rightmostIndex = {};
	const count = needle.length;
	for (let i = 0; i < count; i++) rightmostIndex[needle[i]] = i;

	return rightmostIndex;
}

export class StringSearch {
	/** @param {string} needle*/
	constructor(needle) {
		this.needle = needle;
		this.badCharTable = buildBadCharTable(needle);
		this.goodSuffixTable = buildGoodSuffixTable(needle);
		this.count = needle.length;
	}

	//Calculate “ good character ” displacement.
	getGoodShift(needleIndex) {
		let result = this.goodSuffixTable[needleIndex];
		result ??= this.goodSuffixTable[this.goodSuffixTable.length - 1];
		result ??= this.count;
		return result;
	}

	/** @param {string} haystack*/
	searchAll(haystack) {
		const results = [];
		let offset = 0;
		const maxOffset = haystack.length - this.count;

		while (offset <= maxOffset) {
			let needleIndex = this.count - 1;
			while (this.needle[needleIndex] === haystack[offset + needleIndex]) {
				needleIndex-- === 0 && results.push(offset);
				if (needleIndex === -1) break; //temp
			}

			const badCharShift = needleIndex - (this.badCharTable[haystack[offset + needleIndex]] ?? -1);
			let shift = badCharShift;
			if (needleIndex !== this.count - 1) {
				const goodSuffixShift = this.getGoodShift(needleIndex);
				shift = Math.max(badCharShift, goodSuffixShift);
			}
			offset += shift;
		}
		return results;
	}
}
