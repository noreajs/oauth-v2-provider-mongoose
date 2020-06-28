import oauthClientController from "../controllers/oauth-client.controller";
import OauthContext from "../OauthContext";
import { Router } from "express";

export default (module: Router, oauthContext: OauthContext) => {
  /**
   * Oauth clients routes
   * *********************************
   */
  const clientModule = Router({
    mergeParams: true,
  });

  // apply security middlewares
  if(oauthContext.securityMiddlewares){
    clientModule.use(oauthContext.securityMiddlewares)
  }

  /**
   * Get all clients
   */
  clientModule.route("/").get([new oauthClientController(oauthContext).all]);

  /**
   * Create client
   */
  clientModule
    .route("/")
    .post([new oauthClientController(oauthContext).create]);

  /**
   * Show client
   */
  clientModule
    .route("/:clientId")
    .get([new oauthClientController(oauthContext).show]);

  /**
   * Edit client
   */
  clientModule
    .route("/:clientId")
    .put([new oauthClientController(oauthContext).edit]);

  /**
   * Delete client
   */
  clientModule
    .route("/:clientId")
    .delete([new oauthClientController(oauthContext).delete]);

  /**
   * Inject in the global module
   */
  module.use("/clients", clientModule);
};
