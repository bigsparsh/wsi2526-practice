import sharp from "sharp";

export const strToBase64 = (x: any) => {
	return Buffer.from(x).toString("base64")
}

export const base64ToStr = (x: any) => {
	return Buffer.from(x, "base64").toString();
}

export async function generateAlbumCover(imageBuffers: Buffer[]) {
	const count = imageBuffers.length;

	if (count === 1) {
		return await sharp(imageBuffers[0]).resize(1000, 1000).toFormat('jpeg').toBuffer();
	}

	if (count === 2) {
		return await sharp({
			create: {width: 1000, height: 1000, channels: 4, background: {r: 255, g: 255, b: 255, alpha: 1}}
		})
			.composite([
				{input: await sharp(imageBuffers[0]).resize(500, 1000).toBuffer(), left: 0, top: 0},
				{input: await sharp(imageBuffers[1]).resize(500, 1000).toBuffer(), left: 500, top: 0}
			])
			.toFormat('jpeg')
			.toBuffer();
	}

	if (count === 3) {
		return await sharp({
			create: {width: 1000, height: 1000, channels: 4, background: {r: 255, g: 255, b: 255, alpha: 1}}
		})
			.composite([
				{input: await sharp(imageBuffers[0]).resize(500, 500).toBuffer(), left: 0, top: 0},
				{input: await sharp(imageBuffers[1]).resize(500, 500).toBuffer(), left: 500, top: 0},
				{input: await sharp(imageBuffers[2]).resize(1000, 500).toBuffer(), left: 0, top: 500}
			])
			.toFormat('jpeg')
			.toBuffer();
	}
}