import {Router} from "express";
import {base64ToStr, strToBase64} from "../lib/utils";
import {z} from "zod";
import {prisma} from "../lib/prisma";
import {users_role} from "../generated/prisma/enums";

export const userRouter = Router();

export const userIdSchema = z.string().refine(x => {
	return !isNaN(Number(x));

}).transform(x => Number(x));

const getUsersSchema = z.object({
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
userRouter.get("/", async (req, res) => {
	const verify = getUsersSchema.safeParse(req.query);
	if (!verify.success)
		return res.json({
			success: false,
			message: "Validation Failed",
			err: verify.error
		}).status(400);
	const data = verify.data;
	const allUsers = await prisma.users.findMany({
		take: data && data.limit && data.limit + 1,
		cursor: {
			user_id: data.cursor.id
		}
	});
	const prev_cursor = req.query.cursor;
	const next_cursor = data.limit && allUsers.length == data.limit + 1 ?
		strToBase64(JSON.stringify({id: allUsers[allUsers.length - 1].user_id}))
		: undefined;

	allUsers.pop();
	res.json({
		success: true,
		data: allUsers,
		meta: {
			next_cursor,
			prev_cursor,
		},
	}).status(200);
})

userRouter.put("/:user_id", async (req, res) => {
	const verify = z.object({role: z.string()}).safeParse(req.body);
	if (!verify.success) return res.json({
		success: false,
		message: "Validation Failed",
	}).status(400);
	const idVerify = userIdSchema.safeParse(req.params);
	if (!idVerify.success) return res.json({
		success: false,
		message: "Validation Failed",
	}).status(400);

	const changeRole = await prisma.users.update({
		where: {
			user_id: idVerify.data
		},
		data: {
			role: verify.data.role === "admin"
				? users_role.admin : verify.data.role === "publisher"
					? users_role.publisher : verify.data.role === "user" ?
						users_role.user : undefined
		}
	});
	res.json({
		success: true,
		data: changeRole
	})
})