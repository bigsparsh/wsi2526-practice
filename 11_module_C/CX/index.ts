import express from "express";
import { baseRouter } from "./controllers/auth";
import { albumRouter } from "./controllers/albums";

const app = express();
app.use(express.json());

app.use("/11_module_C/CX/api", baseRouter);

export const songRouter = express.Router();
app.use("/11_module_C/CX/api/songs", songRouter);

app.use("/11_module_C/CX/api/albums", albumRouter);

export const userRouter = express.Router();
app.use("/11_module_C/CX/api/users", userRouter);

app.listen("8000", () => {
  console.log("Listening at port 8000");
});
