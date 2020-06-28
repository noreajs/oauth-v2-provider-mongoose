import OauthContext from "../OauthContext";
import OauthScopeController from "../controllers/oauth-scope.controller";
import { Router } from "express";

export default (module: Router, oauthContext: OauthContext) => {
  /**
   * Oauth scopes routes
   * *********************************
   */
  const scopeModule = Router({
    mergeParams: true,
  });

  // apply security middlewares
  if(oauthContext.securityMiddlewares){
    scopeModule.use(oauthContext.securityMiddlewares)
  }

  /**
   * Get all scopes
   */
  scopeModule.route("/").get([new OauthScopeController(oauthContext).all]);

  /**
   * Create scope
   */
  scopeModule.route("/").post([new OauthScopeController(oauthContext).create]);

  /**
   * Show scope
   */
  scopeModule
    .route("/:scopeId")
    .get([new OauthScopeController(oauthContext).show]);

  /**
   * Edit scope
   */
  scopeModule
    .route("/:scopeId")
    .put([new OauthScopeController(oauthContext).edit]);

  /**
   * Delete scope
   */
  scopeModule
    .route("/:scopeId")
    .delete([new OauthScopeController(oauthContext).delete]);

  /**
   * Inject in main module
   */
  module.use("/scopes", scopeModule);
};
