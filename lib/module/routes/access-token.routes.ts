import accessTokenController from "../controllers/access-token.controller";
import OauthContext from "../OauthContext";
import { Router } from "express";

export default (module: Router, oauthContext: OauthContext) => {
  /**
   * Get token
   */
  module.route("/token").post([new accessTokenController(oauthContext).token]);
};
