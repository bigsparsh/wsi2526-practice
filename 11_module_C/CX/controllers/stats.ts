import {baseRouter} from "./auth";
import {z} from "zod";
import {prisma} from "../lib/prisma";

const statsSchema = z.object({
	metrics: z.enum(["label", "album", "song"]),
	labels: z.string().optional()
})

baseRouter.get("/statistics", async (req, res) => {
	const verify = statsSchema.safeParse(req.query);
	if (!verify.success) return res.json({
		success: false,
		message: "Validation Failed",
	}).status(400)

	if (verify.data.metrics == "album") {
		const albumStats = await prisma.albums.findMany({
			include: {}
		});

		res.json({
			success: true,
			data: albumStats,
		})
	}
})