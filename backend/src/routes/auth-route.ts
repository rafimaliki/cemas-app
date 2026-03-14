import { Hono } from "hono";
import {
  googleAuth,
  googleCallback,
  getUser,
  logoutUser,
} from "@/controllers/auth-controller.ts";

const authRoute = new Hono();

authRoute.get("/google", googleAuth);
authRoute.get("/callback/google", googleCallback);
authRoute.get("/me", getUser);
authRoute.post("/logout", logoutUser);

export default authRoute;
