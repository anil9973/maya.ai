export const crtTabIndex = async () => (await chrome.tabs.query({ currentWindow: true, active: true }))[0].index;
