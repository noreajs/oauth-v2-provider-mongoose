import accessTokenController from "../controllers/access-token.controller";
import OauthContext from "../OauthContext";
import { Router } from "express";

export default (module: Router, oauthContext: OauthContext) => {
  /**
   * Get token
   */
  module.route("/token").post([new accessTokenController(oauthContext).token]);

  /**
   * Purge revoked and expired token
   */
  module
    .route("/token/purge")
    .post([new accessTokenController(oauthContext).purge]);
};