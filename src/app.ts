import cookieParser from "cookie-parser";
import cors from "cors";
import express, { Application, Request, Response } from "express";
import { userRoutes } from "./modules/user/user.route";

const app: Application = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.APP_URL,
    credentials: true,
  }),
);

app.get("/", (req: Request, res: Response) => {
  res.send("hello goribs");
});

app.use("/api",userRoutes)

export default app;
