import {Router} from "express";
import multer from "multer";
import {prisma} from "../lib/prisma";
import {z} from "zod";
import {base64ToStr, generateAlbumCover, strToBase64} from "../lib/utils";
import {authMiddleware} from "./auth";
import * as fs from "node:fs";
import path from "node:path";

const upload = multer();

export const albumRouter = Router();

const albumDetailsGetSchema = z.string().refine(x => {
	try {
		Number(x);
		return true;
	} catch (e) {
		return false;
	}
}).transform(x => Number(x));

const albumGetSchema = z.object({
	limit: z.string().refine((x) => {
		if (isNaN(Number(x))) return false;
		return true;
	}).transform(x => Number(x)).optional(),
	cursor: z.string().refine((x) => {
		try {
			const cursor = JSON.parse(base64ToStr(x));
			if (!cursor.id && !z.number().safeParse(cursor.id).success)
				throw new Error("No id provided in cursor");
			return true;
		} catch (e) {
			return false;
		}
	}, {
		message: "Validation failed"
	}).transform(x => {
		return JSON.parse(base64ToStr(x));
	}).optional(),
	// TODO: Add the one year range as well
	year: z.string().refine(
		(x) => {
			const split = x.split("-");
			if (isNaN(Number(split[0])) || isNaN(Number(split[1]))) {
				return false;
			}
		}, {
			message: "Validation failed"
		}
	).transform(x => {
		const split = x.split("-");
		return {
			gte: Number(split[0]),
			lte: Number(split[1]),
		}
	}).optional(),
	capital: z.string().optional(),
});

albumRouter.use(authMiddleware);
albumRouter.get("/", upload.none(), async (req, res) => {
	try {
		const verify = albumGetSchema.safeParse(req.query);
		if (!verify) res.json({
			success: false,
			message: "Validation failed"
		}).status(400);
		const data = verify.data;

		try {
			const findAlbum = await prisma.albums.findMany({
				where: {
					AND: [
						{
							title: {
								startsWith: data?.capital,
							},
						},
						{
							release_year: data?.year,
						},
					],
				},
				take: data && data.limit && data.limit - 1,
				cursor: {
					album_id: data?.cursor.id,
				},
				orderBy: {
					album_id: "asc",
				},
			});

			const next_cursor =
				findAlbum.length == data && data?.limit && data?.limit + 1
					? strToBase64({id: findAlbum[findAlbum.length - 1].album_id})
					: undefined;
			const prev_cursor = req.query.cursor;

			findAlbum.pop();

			res.json({
				success: true,
				data: findAlbum,
				meta: {
					next_cursor,
					prev_cursor,
				},
			}).status(200);
		} catch (e) {
			res.json({
				success: false,
				message: "Error during album creation."
			}).status(400)
		}

	} catch (err) {
		res.json({
			success: false,
			message: "Invalid Cursor provied",
		}).status(400);
	}
});

albumRouter.get("/:album_id", async (req, res) => {
	const album_id = req.params.album_id;
	const verify = albumDetailsGetSchema.safeParse(album_id);
	if (!verify.success) return res.json({
		success: false,
		message: "Validation Failed"
	}).status(400);

	const albumDetails = await prisma.albums.findUnique({
		where: {
			album_id: verify.data,
		},
		include: {
			users: {
				select: {
					user_id: true,
					username: true,
					email: true,
				}
			}
		}
	})
	// @ts-ignore
	const {users: {user_id: id, ...userRest}, ...rest} = albumDetails;

	return res.json({
		success: true,
		data: {...rest, publishers: {id, ...userRest}}
	}).status(200);
});

albumRouter.get("/:album_id/cover", async (req, res) => {
	const album_id = req.params.album_id;
	const verify = albumDetailsGetSchema.safeParse(album_id);
	if (!verify.success) return res.json({
		success: false,
		message: "Validation Failed"
	}).status(400);

	const songs = await prisma.songs.findMany({
		where: {
			album_id: verify.data,
			is_cover: 1
		},
		select: {
			cover_image_path: true
		}
	})
	if (songs.length == 0) {
		res.json({
			success: false,
			message: "Cover not found"
		}).status(404);
	}
	if (songs.length > 3) {
		return res.json({
			success: false,
			message: "Too many covers provided"
		}).status(400);
	}

	const inputBuffers = await Promise.all(
		songs.map(ele =>
			ele.cover_image_path ?
				fs.readFileSync(path.join(__dirname, "..", "..", "uploads", ele.cover_image_path)) :
				fs.readFileSync(path.join(__dirname, "..", "..", "uploads", "cv2.jpg")))
	)
	const image = await generateAlbumCover(inputBuffers);

	res.set("content-type", "image/jpeg");
	return res.send(image);
});

albumRouter.get("/:album_id/songs", async (req, res) => {
	const album_id = req.params.album_id;
	const verify = albumDetailsGetSchema.safeParse(album_id);
	if (!verify.success) return res.json({
		success: false,
		message: "Validation Failed"
	}).status(400);

	const songs = await prisma.songs.findMany({
		where: {
			album_id: verify.data,
		},
		select: {
			song_id: true,
			album_id: true,
			title: true,
			duration_seconds: true,
			track_order: true,
			is_cover: true,
			cover_image_path: true,
			song_labels: {
				select: {
					labels: true
				}
			}
		}
	});
	if (songs.length == 0) {
		res.json({
			success: false,
			message: "Songs not found"
		}).status(404);
	}
	res.json({
		success: true,
		data: songs,
	})
});