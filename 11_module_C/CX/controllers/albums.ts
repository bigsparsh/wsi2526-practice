import { Router } from "express";
import multer from "multer";
import { prisma } from "../lib/prisma";
const upload = multer();

export const albumRouter = Router();

const textEncoder = new TextEncoder();

albumRouter.get("/albums", upload.none(), async (req, res) => {
  const { capital, year, limit, cursor } = req.params;

  const findAlbum = await prisma.albums.findMany({
    where: {
      AND: [
        {
          title: {
            startsWith: capital as string,
          },
        },
        {
          release_year: {
            lte: Number((year as string).split("-")[0]),
            gte: Number((year as string).split("-")[1]),
          },
        },
      ],
    },
    take: Number(limit) + 1,
    orderBy: {
      album_id: "desc",
    },
  });
  if (findAlbum[0].album_id == 1) {
    const prevBuffer = Buffer.from(findAlbum[0].album_id - 1);
  }

  res.json({
    success: true,
    data: findAlbum,
    meta: {
      prev_cursor:
        findAlbum[0].album_id == 1 ? null : findAlbum[0].album_id - 1,
    },
  });
});
