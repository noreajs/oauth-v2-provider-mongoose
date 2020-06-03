import authorizationController from "../controllers/authorization.controller";
import authorizationMiddleware from "../middlewares/authorization.middleware";
import OauthContext from "../OauthContext";
import { Router } from "express";

export default (module: Router, oauthContext: OauthContext) => {
  /**
   * Get authorization dialog
   */
  module
    .route("/dialog")
    .get([new authorizationController(oauthContext).dialog]);

  /**
   * Authorize
   */
  module
    .route("/authorize")
    .get([
      authorizationMiddleware.validRequestRequired,
      new authorizationController(oauthContext).authorize,
    ]);

  /**
   * Authenticate the user
   */
  module
    .route("/authorize")
    .post([new authorizationController(oauthContext).authenticate]);
};