import OauthContext from "../OauthContext";
import { Router } from "express";
import PurgeController from "../controllers/purge.controller";

export default (module: Router, oauthContext: OauthContext) => {
  /**
   * Purge code and token
   */
  module.route("/purge").delete([new PurgeController(oauthContext).purge]);

  /**
   * Purge token
   */
  module
    .route("/purge/token")
    .delete([new PurgeController(oauthContext).purgeTokens]);

  /**
   * Purge code
   */
  module
    .route("/purge/code")
    .delete([new PurgeController(oauthContext).purgeCodes]);
};
