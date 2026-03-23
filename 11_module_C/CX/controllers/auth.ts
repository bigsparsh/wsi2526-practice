import { Router } from "express";
import { prisma } from "../lib/prisma";
import multer from "multer";
import crypto from "crypto";
import { sessionTokens } from "../lib/config";

export const baseRouter = Router();
const upload = multer();

baseRouter.post("/login", upload.none(), async (req, res) => {
  const body = req.body;
  const checkUser = await prisma.users.findUnique({
    where: {
      username: body.username,
      // TODO: Hash Check instead of normal
      password_hash: body.password,
    },
  });
  console.log(checkUser);
  if (checkUser) {
    const accessToken = crypto
      .createHash("md5")
      .update(body.username)
      .digest("hex");

    sessionTokens.add(accessToken);
    res
      .json({
        success: true,
        data: {
          token: accessToken,
          user: checkUser,
        },
      })
      .status(200);
  }

  res
    .json({
      success: false,
      message: "User not found!",
    })
    .status(404);
});

baseRouter.post("/register", upload.none(), async (req, res) => {
  const { username, email, password } = req.body;
  const checkUser = await prisma.users.findFirst({
    where: {
      OR: [
        {
          username,
        },
        {
          email,
        },
      ],
    },
  });
  if (checkUser) {
    res
      .json({
        success: false,
        message: "Either username or email has been taken",
      })
      .status(409);
  }
  const newUser = await prisma.users.create({
    data: {
      username,
      email,
      // TODO: hash the password before storing
      password_hash: password,
    },
  });

  res
    .json({
      success: true,
      data: {
        user: newUser,
      },
    })
    .status(200);
});
