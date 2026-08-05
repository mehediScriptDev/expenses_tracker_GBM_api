import { Request, Response, Router } from "express";

import { userController } from "./user.controller";

const router = Router();

router.post("/api/users/register", userController.createUser );
export const userRoutes = router;