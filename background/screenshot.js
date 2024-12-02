import { ImageCategorizer } from "./categorizer.js";

export class Screenshoter {
	constructor(cordinate, screenHeight, tabId) {
		this.coordinate = cordinate;
		this.screenHeight = screenHeight;
		this.tabId = tabId;
	}

	async captureVisibleScreen() {
		try {
			const img64Url = await chrome.tabs.captureVisibleTab({ format: "png" });
			return await (await fetch(img64Url)).blob();
		} catch (error) {
			await new Promise((r) => setTimeout(r, 1000));
			return await this.captureVisibleScreen();
		}
	}

	async captureScreenshot() {
		let dy = 0;
		const cord = this.coordinate;
		let heightLeft = cord.height;

		const canvas = new OffscreenCanvas(cord.width, cord.height);
		const ctx = canvas.getContext("2d");

		while (heightLeft > 0) {
			const shotBlob = await this.captureVisibleScreen();
			const shotHeight = Math.min(this.screenHeight, heightLeft);
			const imageBitmap = await createImageBitmap(shotBlob, cord.x, 0, cord.width, shotHeight);
			ctx.drawImage(imageBitmap, 0, dy);
			imageBitmap.close();

			heightLeft -= shotHeight;
			dy += shotHeight;
			if (heightLeft > 0) {
				await chrome.tabs.sendMessage(this.tabId, { msg: "scroll", top: shotHeight });
				await new Promise((r) => setTimeout(r, 100));
			}
		}

		return await canvas.convertToBlob({ type: "image/png" });
	}

	async captureViewportShot() {
		const cord = this.coordinate;
		const img64Url = await chrome.tabs.captureVisibleTab({ format: "png" });
		const shotBlob = await (await fetch(img64Url)).blob();
		const imageBitmap = await createImageBitmap(shotBlob, cord.x, cord.y, cord.width, cord.height);

		const canvas = new OffscreenCanvas(cord.width, cord.height);
		const ctx = canvas.getContext("bitmaprenderer");
		ctx.transferFromImageBitmap(imageBitmap);
		imageBitmap.close();
		return await canvas.convertToBlob({ type: "image/png" });
	}

	async captureAndSave({ withinViewPort }, pageUrl, pageTitle) {
		try {
			const shotBlob = withinViewPort ? await this.captureViewportShot() : await this.captureScreenshot();
			new ImageCategorizer().addScreenshot(shotBlob, pageUrl, pageTitle);
		} catch (error) {
			console.error(error);
		}
	}
}
