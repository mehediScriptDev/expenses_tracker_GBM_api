import cookieParser from "cookie-parser";
import cors from "cors";
import express, { Application, Request, Response } from "express";
import config from "./config";
import { authRoutes } from "./modules/auth/auth.routes";
import { userRoutes } from "./modules/user/user.route";
import { transactionRoutes } from "./modules/transaction/transaction.route";
import { categoryRoutes } from "./modules/category/category.route";
import { budgetRoutes } from "./modules/budget/budget.route";
import { loanRoutes } from "./modules/loan/loan.route";
import { goalRoutes } from "./modules/goal/goal.route";
import { quickAddRoutes } from "./modules/quick-add/quick-add.route";
import { insightsRoutes } from "./modules/insights/insights.route";
import { dashboardRoutes } from "./modules/dashboard/dashboard.route";
import { notificationRoutes } from "./modules/notification/notification.route";

const app: Application = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
  cors({
    origin: config.app_url,
    credentials: true,
  }),
);

app.get("/", (req: Request, res: Response) => {
  res.send("hello goribs");
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/budgets", budgetRoutes);
app.use("/api/loans", loanRoutes);
app.use("/api/goals", goalRoutes);
app.use("/api/quick-adds", quickAddRoutes);
app.use("/api/insights", insightsRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/notifications", notificationRoutes);

export default app;
