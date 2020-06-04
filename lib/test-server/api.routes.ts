import { NoreaAppRoutes } from "@noreajs/core";
import authRoutes from "./routes/auth.routes";
import { Application } from "express";

export default new NoreaAppRoutes({
  routes: (app: Application) => {
    /**
     * Auth routes
     */
    authRoutes(app);
  },
  middlewares: (app: Application) => {},
});
