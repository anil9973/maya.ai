export function getFilterKeyRange(viewMode, filter) {
	if (!filter) return null;
	let filterKeyRange;
	switch (viewMode) {
		case "date":
			// @ts-ignore
			filterKeyRange = IDBKeyRange.bound(...filter);
			break;

		case "domain":
			filterKeyRange = IDBKeyRange.only(filter);
			break;

		case "folder":
			//need to set more filter
			filterKeyRange = IDBKeyRange.only(filter);
			break;
	}
	return filterKeyRange;
}
