import express from "express";
import {baseRouter} from "./controllers/auth";
import {albumRouter} from "./controllers/albums";
import {songRouter} from "./controllers/songs";
import {userRouter} from "./controllers/users";

const app = express();
app.use(express.json());

app.use("/11_module_C/CX/api", baseRouter);
app.use("/11_module_C/CX/api/songs", songRouter);
app.use("/11_module_C/CX/api/albums", albumRouter);
app.use("/11_module_C/CX/api/users", userRouter);

app.listen("8080", () => {
	console.log("Listening at port 8080");
});
