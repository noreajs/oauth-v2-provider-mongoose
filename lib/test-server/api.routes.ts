import { NoreaAppRoutes, express } from "@noreajs/core";
import authRoutes from "./routes/auth.routes";

export default new NoreaAppRoutes({
  routes: (app: express.Application) => {
    /**
     * Auth routes
     */
    authRoutes(app);
  },
  middlewares: (app: express.Application) => {},
});
