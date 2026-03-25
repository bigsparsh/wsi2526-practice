import {base64ToStr, generateAlbumCover, strToBase64} from "../lib/utils";
import {prisma} from "../lib/prisma";
import {z} from "zod";
import path from "node:path";
import * as fs from "node:fs";
import {Router} from "express";

export const songRouter = Router();
export const songIdSchema = z.string().refine(x => {
	try {
		Number(x);
		return true;
	} catch (e) {
		return false;
	}
}).transform(x => Number(x));

export const songGetSchema = z.object({
	keyword: z.string().optional(),
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
})


songRouter.get("/", async (req, res) => {
	const verify = songGetSchema.safeParse(req.query);
	if (!verify.success) return res.json({
		success: false,
		message: "Validation Failed"
	}).status(400);

	const songs = await prisma.songs.findMany({
		where: {
			title: {
				contains: verify.data.keyword,
			},
		},
		take: verify.data.limit,
		cursor: {
			song_id: verify.data.cursor.id
		}
	})

	if (songs.length == 0) {
		res.json({
			success: false,
			message: "Song not found"
		}).status(404);
	}

	const next_cursor =
		songs.length == verify.data && verify.data?.limit && verify.data?.limit + 1
			? strToBase64({id: songs[songs.length - 1].album_id})
			: undefined;
	const prev_cursor = req.query.cursor;

	songs.pop();

	res.json({
		success: false,
		data: songs,
		meta: {
			next_cursor,
			prev_cursor
		}
	}).status(200);
})


songRouter.get("/:song_id/cover", async (req, res) => {
	const verify = songIdSchema.safeParse(req.params.song_id);
	if (!verify.success) return res.json({
		success: false,
		message: "Song ID not provided"
	}).status(400);

	const song_covers = await prisma.songs.findUnique({
		where: {
			song_id: verify.data
		},
		select: {
			cover_image_path: true
		}
	})

	if (!song_covers) return res.json({
		success: false,
		message: "Song cover not found"
	}).status(404);

	const imageBuffers = await Promise.all([song_covers.cover_image_path ?
		fs.readFileSync(path.join(__dirname, "..", "..", "uploads", song_covers.cover_image_path)) :
		fs.readFileSync(path.join(__dirname, "..", "..", "uploads", "cv2.jpg"))])

	const image = await generateAlbumCover(imageBuffers);

	res.set("Content-Type", "image/jpeg");
	res.send(image);
})

// Get Song Details
songRouter.get("/:song_id", async (req, res) => {
	const verify = songIdSchema.safeParse(req.params.song_id);
	if (!verify.success) return res.json({
		success: false,
		message: "Song ID not provided"
	}).status(400);

	const song = await prisma.songs.findUnique({
		where: {
			song_id: verify.data
		},
		include: {
			song_labels: {
				select: {
					labels: true
				}
			}
		}
	});

	if (!song) return res.json({
		success: false,
		message: "Song not found"
	}).status(404);

	return res.json({
		success: true,
		data: song
	}).status(200);
})
